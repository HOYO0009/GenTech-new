import { escapeHtml, formatMoney, formatTimestamp } from '../domain/formatters'
import { recordChange } from './changeLogs'
import {
  deleteVoucherById as deleteVoucherRow,
  insertVoucher,
  listRecentVouchers,
  listShops,
  listVoucherDiscountTypes,
  listVoucherTypes,
  updateVoucher as updateVoucherRow,
  ShopSummary,
  VoucherInsertArgs,
  VoucherSummary,
  VoucherDiscountTypeSummary,
  VoucherTypeSummary,
} from '../db/vouchers'

export interface ShopOption {
  id: number
  name: string
  code: string
}

export interface VoucherDiscountTypeOption {
  id: number
  key: string
  label: string
}

export interface VoucherCategoryOption {
  id: number
  name: string
}

export interface VoucherListItem {
  id: number
  shopId: number
  voucherDiscountTypeId: number
  voucherTypeId: number | null
  shopName: string
  voucherDiscountTypeLabel: string
  voucherDiscountTypeKey: string
  voucherCategoryLabel: string
  minSpend: number
  minSpendDisplay: string
  discount: number
  discountDisplay: string
  maxDiscount: number | null
  maxDiscountDisplay: string
  createdAt: string
}

export interface VouchersPagePayload {
  shops: ShopOption[]
  voucherDiscountTypes: VoucherDiscountTypeOption[]
  voucherTypes: VoucherCategoryOption[]
  vouchers: VoucherListItem[]
}

export interface VoucherCreateResult {
  status: 200 | 400 | 404 | 500
  message: string
}

export const discountLabelByType: Record<string, string> = {
  fixed: 'Discount (SGD)',
  percentage: 'Discount (%)',
}

const sanitizeShop = (shop: ShopSummary): ShopOption => ({
  id: shop.id,
  code: shop.code,
  name: escapeHtml(shop.name),
})

const sanitizeVoucherDiscountType = (type: VoucherDiscountTypeSummary): VoucherDiscountTypeOption => ({
  id: type.id,
  key: escapeHtml(type.key),
  label: escapeHtml(type.label),
})

const sanitizeVoucherCategory = (type: VoucherTypeSummary): VoucherCategoryOption => ({
  id: type.id,
  name: escapeHtml(type.name),
})

const sanitizeVoucherSummary = (entry: VoucherSummary): VoucherListItem => {
  const shopName = entry.shopName ? escapeHtml(entry.shopName) : 'Unknown shop'
  const voucherDiscountTypeLabel = entry.voucherDiscountTypeLabel
    ? escapeHtml(entry.voucherDiscountTypeLabel)
    : 'Voucher'
  const voucherDiscountTypeKey = entry.voucherDiscountTypeKey ? escapeHtml(entry.voucherDiscountTypeKey) : 'voucher'
  const voucherCategoryLabel = entry.voucherTypeName ? escapeHtml(entry.voucherTypeName) : 'Uncategorized'
  const discountDisplay =
    voucherDiscountTypeKey === 'percentage'
      ? `${entry.discount.toFixed(2)}%`
      : formatMoney(entry.discount)
  const maxDiscountDisplay = entry.maxDiscount !== null ? formatMoney(entry.maxDiscount) : 'None'

  return {
    id: entry.id,
    shopId: entry.shopId,
    voucherDiscountTypeId: entry.voucherDiscountTypeId,
    voucherTypeId: entry.voucherTypeId,
    shopName,
    voucherDiscountTypeLabel,
    voucherDiscountTypeKey,
    voucherCategoryLabel,
    minSpend: entry.minSpend,
    minSpendDisplay: formatMoney(entry.minSpend),
    discount: entry.discount,
    discountDisplay,
    maxDiscount: entry.maxDiscount,
    maxDiscountDisplay,
    createdAt: formatTimestamp(entry.createdAt),
  }
}

const resolveVoucherSelections = async ({
  shopId,
  voucherDiscountTypeId,
  voucherTypeId,
}: {
  shopId: number
  voucherDiscountTypeId: number
  voucherTypeId: number
}) => {
  const [shops, discountTypes, voucherTypes] = await Promise.all([
    listShops().then((rows) => rows.map(sanitizeShop)),
    listVoucherDiscountTypes().then((rows) => rows.map(sanitizeVoucherDiscountType)),
    listVoucherTypes().then((rows) => rows.map(sanitizeVoucherCategory)),
  ])

  const shop = shops.find((entry) => entry.id === shopId)
  if (!shop) {
    throw new Error('Invalid shop selection.')
  }

  const voucherDiscountType = discountTypes.find((entry) => entry.id === voucherDiscountTypeId)
  if (!voucherDiscountType) {
    throw new Error('Invalid discount type selection.')
  }

  const voucherType = voucherTypes.find((entry) => entry.id === voucherTypeId)
  if (!voucherType) {
    throw new Error('Invalid voucher type selection.')
  }

  return { shop, voucherDiscountType, voucherType }
}

const ensureAmount = (value: number, label: string) => {
  if (!Number.isFinite(value) || value < 0) {
    throw new Error(`${label} must be a non-negative number.`)
  }
  return value
}

export async function getVouchersPagePayload(): Promise<VouchersPagePayload> {
  const [shops, discountTypes, voucherTypes, vouchers] = await Promise.all([
    listShops(),
    listVoucherDiscountTypes(),
    listVoucherTypes(),
    listRecentVouchers(),
  ])

  return {
    shops: shops.map(sanitizeShop),
    voucherDiscountTypes: discountTypes.map(sanitizeVoucherDiscountType),
    voucherTypes: voucherTypes.map(sanitizeVoucherCategory),
    vouchers: vouchers.map(sanitizeVoucherSummary),
  }
}

export async function createVoucher(args: VoucherInsertArgs): Promise<VoucherCreateResult> {
  let resolved
  try {
    resolved = await resolveVoucherSelections({
      shopId: args.shopId,
      voucherDiscountTypeId: args.voucherDiscountTypeId,
      voucherTypeId: args.voucherTypeId,
    })
  } catch (error) {
    return { status: 400, message: (error as Error).message }
  }

  try {
    ensureAmount(args.minSpend, 'Minimum spend')
    ensureAmount(args.discount, 'Discount')
    ensureAmount(args.maxDiscount ?? 0, 'Max discount')
  } catch (error) {
    return { status: 400, message: (error as Error).message }
  }

  try {
    await insertVoucher(args)
  } catch (error) {
    console.error('Unable to insert voucher', error)
    return { status: 500, message: 'Unable to save voucher.' }
  }

  try {
    await recordChange({
      tableName: 'vouchers',
      action: 'INSERT',
      description: `Voucher for ${resolved.shop.name} (${resolved.voucherDiscountType.label} / ${resolved.voucherType.name}) created`,
      payload: {
        shopId: args.shopId,
        voucherDiscountTypeId: args.voucherDiscountTypeId,
        voucherTypeId: args.voucherTypeId,
        minSpend: args.minSpend,
        discount: args.discount,
        maxDiscount: args.maxDiscount,
      },
      source: 'vouchers/create',
    })
  } catch (error) {
    console.error('Unable to record voucher change', error)
  }

  return { status: 200, message: 'Voucher saved.' }
}

export async function updateVoucherDetails({
  id,
  ...args
}: VoucherInsertArgs & { id: number }): Promise<VoucherCreateResult> {
  if (!Number.isInteger(id) || id <= 0) {
    return { status: 400, message: 'Invalid voucher selection.' }
  }

  let resolved
  try {
    resolved = await resolveVoucherSelections({
      shopId: args.shopId,
      voucherDiscountTypeId: args.voucherDiscountTypeId,
      voucherTypeId: args.voucherTypeId,
    })
  } catch (error) {
    return { status: 400, message: (error as Error).message }
  }

  try {
    ensureAmount(args.minSpend, 'Minimum spend')
    ensureAmount(args.discount, 'Discount')
    ensureAmount(args.maxDiscount ?? 0, 'Max discount')
  } catch (error) {
    return { status: 400, message: (error as Error).message }
  }

  const updated = await updateVoucherRow({ id, ...args })
  if (!updated) {
    return { status: 404, message: 'Voucher not found.' }
  }

  try {
    await recordChange({
      tableName: 'vouchers',
      action: 'UPDATE',
      description: `Voucher #${id} updated for ${resolved.shop.name} (${resolved.voucherDiscountType.label} / ${resolved.voucherType.name})`,
      payload: {
        id,
        ...args,
      },
      source: 'vouchers/update',
    })
  } catch (error) {
    console.error('Unable to record voucher change', error)
  }

  return { status: 200, message: 'Voucher updated.' }
}

export async function deleteVoucherRecord(id: number): Promise<VoucherCreateResult> {
  if (!Number.isInteger(id) || id <= 0) {
    return { status: 400, message: 'Invalid voucher selection.' }
  }

  const deleted = await deleteVoucherRow(id)
  if (!deleted) {
    return { status: 404, message: 'Voucher not found.' }
  }

  try {
    await recordChange({
      tableName: 'vouchers',
      action: 'DELETE',
      description: `Voucher #${id} deleted`,
      payload: { id },
      source: 'vouchers/delete',
    })
  } catch (error) {
    console.error('Unable to record voucher change', error)
  }

  return { status: 200, message: 'Voucher deleted.' }
}
