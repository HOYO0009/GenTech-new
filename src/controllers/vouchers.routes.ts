import { Hono, type Context } from 'hono'
import {
  getVouchersPagePayload,
  createVoucher,
  updateVoucherDetails,
  deleteVoucherRecordWithConfirmation,
  VoucherCreateResult,
  type VoucherSortOption,
} from '../services/vouchers.service'
import { vouchersPage, renderVoucherHistorySection } from '../ui/pages/vouchers.page.ts'
import { voucherAddPage } from '../ui/pages/voucherAdd.page.ts'
import { z, ZodError } from 'zod'

type ParsedVoucherFormData = {
  shopId: number
  voucherTypeId: number
  voucherDiscountTypeId: number
  minSpend: number
  discount: number
  maxDiscount: number | null
}
type ParsedVoucherForm = ParsedVoucherFormData & {
  voucherId: number
}

const buildToastTrigger = (
  result: VoucherCreateResult,
  extra?: { subject?: string; details?: string[] }
) => ({
  toast: {
    status: result.status,
    message: result.message,
    subject: extra?.subject ?? (result as VoucherCreateResult & { subject?: string }).subject,
    details: extra?.details ?? (result as VoucherCreateResult & { details?: string[] }).details,
  },
})

const requiredInteger = (label: string) =>
  z
    .string()
    .trim()
    .min(1, `${label} is required.`)
    .transform((value) => {
      const parsed = Number(value)
      if (!Number.isFinite(parsed) || !Number.isInteger(parsed)) {
        throw new Error(`${label} must be an integer.`)
      }
      return parsed
    })

const requiredNumber = (label: string) =>
  z
    .string()
    .trim()
    .min(1, `${label} is required.`)
    .transform((value) => {
      const parsed = Number(value)
      if (!Number.isFinite(parsed)) {
        throw new Error(`${label} must be a number.`)
      }
      return parsed
    })

const optionalNumber = (label: string) =>
  z
    .string()
    .trim()
    .transform((value) => {
      if (!value) return null
      const parsed = Number(value)
      if (!Number.isFinite(parsed)) {
        throw new Error(`${label} must be a number.`)
      }
      return parsed
    })

const voucherFormSchema = z.object({
  shopId: requiredInteger('Shop'),
  voucherTypeId: requiredInteger('Voucher type'),
  voucherDiscountTypeId: requiredInteger('Discount type'),
  minSpend: requiredNumber('Minimum spend'),
  discount: requiredNumber('Discount'),
  maxDiscount: optionalNumber('Max discount'),
})

const voucherUpdateSchema = voucherFormSchema.extend({
  voucherId: requiredInteger('Voucher'),
})

const parseCreateVoucherForm = (form: FormData): ParsedVoucherFormData =>
  voucherFormSchema.parse({
    shopId: (form.get('shopId') ?? '').toString(),
    voucherTypeId: (form.get('voucherTypeId') ?? '').toString(),
    voucherDiscountTypeId: (form.get('voucherDiscountTypeId') ?? '').toString(),
    minSpend: (form.get('minSpend') ?? '').toString(),
    discount: (form.get('discount') ?? '').toString(),
    maxDiscount: (form.get('maxDiscount') ?? '').toString(),
  })

const parseVoucherForm = (form: FormData): ParsedVoucherForm =>
  voucherUpdateSchema.parse({
    voucherId: (form.get('voucherId') ?? '').toString(),
    shopId: (form.get('shopId') ?? '').toString(),
    voucherTypeId: (form.get('voucherTypeId') ?? '').toString(),
    voucherDiscountTypeId: (form.get('voucherDiscountTypeId') ?? '').toString(),
    minSpend: (form.get('minSpend') ?? '').toString(),
    discount: (form.get('discount') ?? '').toString(),
    maxDiscount: (form.get('maxDiscount') ?? '').toString(),
  })

const parseErrorMessage = (error: unknown, fallback = 'Invalid input.') =>
  error instanceof ZodError ? error.errors[0]?.message ?? fallback : (error as Error).message

const buildVoucherFeedbackHtml = (result: VoucherCreateResult) => {
  const textColor = result.status === 200 ? 'text-emerald-300' : 'text-amber-400'
  const feedbackStatus = result.status === 200 ? 'success' : 'error'
  return `<div class="px-3 py-2 ${textColor}" data-inline-feedback-status="${feedbackStatus}">${result.message}</div>`
}

const voucherMessageClass = (result: VoucherCreateResult) => {
  const textColor = result.status === 200 ? 'text-emerald-300' : 'text-amber-400'
  return `px-3 py-2 text-[0.65rem] uppercase tracking-[0.35em] ${textColor}`
}

const respondWithVoucherHistorySection = async (
  c: Context,
  result: VoucherCreateResult,
  inlineCardId?: string
) => {
  const payload = await getVouchersPagePayload()
  const messageClass = voucherMessageClass(result)
  if (c.req.header('HX-Request') === 'true' && result.status === 200) {
    const triggerDetail = inlineCardId ? { cardId: inlineCardId } : true
    c.header(
      'HX-Trigger',
      JSON.stringify({
        ...buildToastTrigger(result),
        'inline-panel-close': triggerDetail,
      })
    )
  }
  const historySection = renderVoucherHistorySection(
    payload.vouchers,
    {
      shops: payload.shops,
      voucherDiscountTypes: payload.voucherDiscountTypes,
      voucherTypes: payload.voucherTypes,
    },
    result.message,
    messageClass
  )
  const isHxRequest = c.req.header('HX-Request') === 'true'
  const httpStatus = result.status
  if (isHxRequest) {
    const triggers =
      result.status === 200
        ? {
            ...buildToastTrigger(result),
            ...(inlineCardId ? { 'inline-panel-close': { cardId: inlineCardId } } : { 'inline-panel-close': true }),
          }
        : buildToastTrigger(result)
    c.header('HX-Trigger', JSON.stringify(triggers))
    c.header('HX-Retarget', '#voucher-history-section')
    return c.html(historySection, httpStatus)
  }
  return c.html(vouchersPage(payload, result.message, messageClass), httpStatus)
}

const respondWithVoucherFeedback = async (
  c: Context,
  result: VoucherCreateResult,
  hxRedirect?: string,
  inlineCardId?: string
) => {
  const messageHtml = buildVoucherFeedbackHtml(result)
  const isHxRequest = c.req.header('HX-Request') === 'true'
  const httpStatus = result.status
  if (isHxRequest) {
    const triggers =
      result.status === 200
        ? {
            ...buildToastTrigger(result),
            ...(inlineCardId ? { 'inline-panel-close': { cardId: inlineCardId } } : { 'inline-panel-close': true }),
          }
        : buildToastTrigger(result)
    c.header('HX-Trigger', JSON.stringify(triggers))
    if (result.status === 200 && hxRedirect) {
      c.header('HX-Redirect', hxRedirect)
      return c.html('', httpStatus)
    }
    return c.html('', httpStatus)
  }
  const payload = await getVouchersPagePayload()
  return c.html(
    vouchersPage(payload, result.message, voucherMessageClass(result)),
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
    return c.html(voucherAddPage(payload))
  })

  app.post('/vouchers/create', async (c) => {
    const form = await c.req.formData()
    const inlineCardId = (form.get('inlineCardId') ?? '').toString().trim() || undefined
    let parsed: ParsedVoucherFormData
    try {
      parsed = parseCreateVoucherForm(form)
    } catch (error) {
      return respondWithVoucherFeedback(
        c,
        { status: 400, message: parseErrorMessage(error) },
        undefined,
        inlineCardId
      )
    }
    const result = await createVoucher(parsed)
    return respondWithVoucherFeedback(c, result, '/vouchers', inlineCardId)
  })

  app.post('/vouchers/update', async (c) => {
    const form = await c.req.formData()
    const inlineCardId = (form.get('inlineCardId') ?? '').toString().trim() || undefined
    let parsed
    try {
      parsed = parseVoucherForm(form)
    } catch (error) {
      return respondWithVoucherFeedback(
        c,
        { status: 400, message: parseErrorMessage(error) },
        undefined,
        inlineCardId
      )
    }
    const { voucherId, ...rest } = parsed
    const result = await updateVoucherDetails({ id: voucherId, ...rest })
    const isHxRequest = c.req.header('HX-Request') === 'true'
    if (isHxRequest && inlineCardId) {
      if (result.status === 200) {
        const payload = await getVouchersPagePayload()
        const triggerDetail = inlineCardId ? { cardId: inlineCardId } : true
        c.header(
          'HX-Trigger',
          JSON.stringify({
            ...buildToastTrigger(result),
            'inline-panel-close': triggerDetail,
          })
        )
        c.header('HX-Retarget', '#voucher-history-section')
        const historySection = renderVoucherHistorySection(
          payload.vouchers,
          {
            shops: payload.shops,
            voucherDiscountTypes: payload.voucherDiscountTypes,
            voucherTypes: payload.voucherTypes,
          },
          result.message,
          voucherMessageClass(result)
        )
        return c.html(historySection, result.status)
      }
      const feedbackId = `${inlineCardId}-edit-feedback`
      c.header('HX-Retarget', `#${feedbackId}`)
      c.header('HX-Trigger', JSON.stringify(buildToastTrigger(result)))
      return c.html('', result.status)
    }
    return respondWithVoucherFeedback(c, result, undefined, inlineCardId)
  })

  app.post('/vouchers/delete', async (c) => {
    const form = await c.req.formData()
    const idParam = (form.get('voucherId') ?? '').toString().trim()
    const inlineCardId = (form.get('inlineCardId') ?? '').toString().trim() || undefined
    const confirmation = (form.get('confirmation') ?? '').toString().trim()
    const parsedId = Number(idParam)
    if (!Number.isFinite(parsedId) || !Number.isInteger(parsedId) || parsedId <= 0) {
      const errorResult = { status: 400, message: 'Invalid voucher selection.' } as VoucherCreateResult
      if (c.req.header('HX-Request') === 'true' && inlineCardId) {
        const feedbackId = `${inlineCardId}-delete-feedback`
        c.header('HX-Retarget', `#${feedbackId}`)
        c.header('HX-Trigger', JSON.stringify(buildToastTrigger(errorResult)))
        return c.html('', errorResult.status)
      }
      return respondWithVoucherHistorySection(c, errorResult, inlineCardId)
    }
    const result = await deleteVoucherRecordWithConfirmation(parsedId, confirmation)
    const isHxRequest = c.req.header('HX-Request') === 'true'
    if (isHxRequest && inlineCardId) {
      if (result.status === 200) {
        const payload = await getVouchersPagePayload()
        const triggerDetail = inlineCardId ? { cardId: inlineCardId } : true
        c.header(
          'HX-Trigger',
          JSON.stringify({
            ...buildToastTrigger(result),
            'inline-panel-close': triggerDetail,
          })
        )
        c.header('HX-Retarget', '#voucher-history-section')
        const historySection = renderVoucherHistorySection(
          payload.vouchers,
          {
            shops: payload.shops,
            voucherDiscountTypes: payload.voucherDiscountTypes,
            voucherTypes: payload.voucherTypes,
          },
          result.message,
          voucherMessageClass(result)
        )
        return c.html(historySection, result.status)
      }
      const feedbackId = `${inlineCardId}-delete-feedback`
      c.header('HX-Retarget', `#${feedbackId}`)
      c.header('HX-Trigger', JSON.stringify(buildToastTrigger(result)))
      return c.html('', result.status)
    }
    return respondWithVoucherHistorySection(c, result, inlineCardId)
  })

}
