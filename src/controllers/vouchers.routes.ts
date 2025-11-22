import { Hono, type Context } from 'hono'
import {
  getVouchersPagePayload,
  createVoucher,
  updateVoucherDetails,
  deleteVoucherRecordWithConfirmation,
  VoucherCreateResult,
  type VoucherSortOption,
} from '../services/vouchers.service'
import { vouchersPage, renderVoucherHistorySection } from '../ui/pages/vouchers.page'
import { voucherEditorPage } from '../ui/pages/voucherEditor.page'

type ParsedVoucherFormData = {
  shopId: number
  voucherTypeId: number
  voucherDiscountTypeId: number
  minSpend: number
  discount: number
  maxDiscount: number
}
type ParsedVoucherForm = ParsedVoucherFormData & {
  voucherId?: number
}

const parseRequired = (entry: unknown, label: string) => {
  const value = (entry ?? '').toString().trim()
  if (!value) {
    throw new Error(`${label} is required.`)
  }
  return value
}
const parseInteger = (entry: unknown, label: string) => {
  const raw = parseRequired(entry, label)
  const parsed = Number(raw)
  if (!Number.isFinite(parsed) || !Number.isInteger(parsed)) {
    throw new Error(`${label} must be an integer.`)
  }
  return parsed
}
const parseDecimal = (entry: unknown, label: string) => {
  const raw = parseRequired(entry, label)
  const parsed = Number(raw)
  if (!Number.isFinite(parsed)) {
    throw new Error(`${label} must be a number.`)
  }
  return parsed
}
const parseCreateVoucherForm = (form: FormData): ParsedVoucherFormData => ({
  shopId: parseInteger(form.get('shopId'), 'Shop'),
  voucherTypeId: parseInteger(form.get('voucherTypeId'), 'Voucher type'),
  voucherDiscountTypeId: parseInteger(form.get('voucherDiscountTypeId'), 'Discount type'),
  minSpend: parseDecimal(form.get('minSpend'), 'Minimum spend'),
  discount: parseDecimal(form.get('discount'), 'Discount'),
  maxDiscount: parseDecimal(form.get('maxDiscount'), 'Max discount'),
})
const parseVoucherForm = (form: FormData): ParsedVoucherForm => {
  const base = parseCreateVoucherForm(form)
  const rawId = (form.get('voucherId') ?? '').toString().trim()
  if (!rawId) {
    return base
  }
  return {
    ...base,
    voucherId: parseInteger(rawId, 'Voucher'),
  }
}

const respondWithVoucherHistorySection = async (c: Context, result: VoucherCreateResult) => {
  const payload = await getVouchersPagePayload()
  const textColor = result.status === 200 ? 'text-emerald-300' : 'text-amber-400'
  const messageClass = `px-3 py-2 text-[0.65rem] uppercase tracking-[0.35em] ${textColor}`
  const messageHtml = `<div class="${messageClass}">${result.message}</div>`
  const historySection = renderVoucherHistorySection(payload.vouchers, result.message, messageClass)
  const isHxRequest = c.req.header('HX-Request') === 'true'
  const httpStatus = isHxRequest ? 200 : result.status
  if (isHxRequest) {
    // Provide inline feedback for the editor while still updating voucher history out-of-band.
    return c.html(`${messageHtml}${historySection}`, httpStatus)
  }
  return c.html(
    vouchersPage(payload, result.message, messageClass),
    httpStatus
  )
}

const respondWithVoucherFeedback = async (
  c: Context,
  result: VoucherCreateResult,
  hxRedirect?: string
) => {
  const textColor = result.status === 200 ? 'text-emerald-300' : 'text-amber-400'
  const messageHtml = `<div class="px-3 py-2 ${textColor}">${result.message}</div>`
  const isHxRequest = c.req.header('HX-Request') === 'true'
  const httpStatus = isHxRequest ? 200 : result.status
  if (isHxRequest) {
    if (result.status === 200 && hxRedirect) {
      c.header('HX-Redirect', hxRedirect)
      return c.html('', httpStatus)
    }
    return c.html(messageHtml, httpStatus)
  }
  const payload = await getVouchersPagePayload()
  return c.html(
    vouchersPage(payload, result.message, `text-sm uppercase tracking-[0.3em] ${textColor}`),
    httpStatus
  )
}

export const registerVoucherRoutes = (app: Hono) => {
  app.get('/vouchers', async (c) => {
    const search = c.req.query('search') ?? ''
    const sortQuery = c.req.query('sort') ?? ''
    const sort: VoucherSortOption = ['date-desc', 'date-asc', 'shop-asc', 'shop-desc'].includes(sortQuery)
      ? (sortQuery as VoucherSortOption)
      : 'date-desc'
    const shopFilters = (c.req.queries('shopId') ?? []).map((value) => Number(value)).filter(Number.isFinite)
    const payload = await getVouchersPagePayload({ search, sort, shopIds: shopFilters })
    return c.html(vouchersPage(payload, '', undefined, search, sort, shopFilters))
  })

  app.get('/vouchers/manage', async (c) => {
    const payload = await getVouchersPagePayload()
    return c.html(voucherEditorPage(payload))
  })

  app.post('/vouchers/save', async (c) => {
    const form = await c.req.formData()
    let parsed
    try {
      parsed = parseVoucherForm(form)
    } catch (error) {
      return respondWithVoucherFeedback(c, { status: 400, message: (error as Error).message })
    }
    const { voucherId, ...rest } = parsed
    const result = voucherId
      ? await updateVoucherDetails({ id: voucherId, ...rest })
      : await createVoucher(rest)
    const redirect = voucherId ? undefined : '/vouchers'
    return respondWithVoucherFeedback(c, result, redirect)
  })

  app.post('/vouchers/delete', async (c) => {
    const form = await c.req.formData()
    const idParam = (form.get('voucherId') ?? '').toString().trim()
    const confirmation = (form.get('confirmation') ?? '').toString().trim()
    const parsedId = Number(idParam)
    if (!Number.isFinite(parsedId) || !Number.isInteger(parsedId) || parsedId <= 0) {
      return respondWithVoucherHistorySection(c, { status: 400, message: 'Invalid voucher selection.' })
    }
    const result = await deleteVoucherRecordWithConfirmation(parsedId, confirmation)
    return respondWithVoucherHistorySection(c, result)
  })

}
