import {
  ShopSummary,
  VoucherDiscountTypeSummary,
  VoucherTypeSummary,
  VoucherSummary,
} from '../db/vouchers.db'
import { formatMoney, formatTimestamp, escapeHtml } from '../domain/formatters.domain'
import { createSanitizer } from '../domain/sanitizers.domain'

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
  createdAtRaw: Date
}

export class VoucherTransformationService {
  private sanitizeShop = createSanitizer<ShopSummary, ShopOption>((shop, escape) => ({
    id: shop.id,
    code: shop.code,
    name: escape(shop.name),
  }))

  private sanitizeVoucherDiscountType = createSanitizer<VoucherDiscountTypeSummary, VoucherDiscountTypeOption>(
    (type, escape) => ({
      id: type.id,
      key: escape(type.key),
      label: escape(type.label),
    })
  )

  private sanitizeVoucherCategory = createSanitizer<VoucherTypeSummary, VoucherCategoryOption>((type, escape) => ({
    id: type.id,
    name: escape(type.name),
  }))

  private sanitizeVoucherSummary = (entry: VoucherSummary): VoucherListItem => {
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
      createdAt: formatTimestamp(entry.createdAt ?? null),
      createdAtRaw: new Date(entry.createdAt ?? 0),
    }
  }

  transformShop(shop: ShopSummary): ShopOption {
    return this.sanitizeShop(shop)
  }

  transformShops(shops: ShopSummary[]): ShopOption[] {
    return shops.map(this.sanitizeShop)
  }

  transformDiscountType(type: VoucherDiscountTypeSummary): VoucherDiscountTypeOption {
    return this.sanitizeVoucherDiscountType(type)
  }

  transformDiscountTypes(types: VoucherDiscountTypeSummary[]): VoucherDiscountTypeOption[] {
    return types.map(this.sanitizeVoucherDiscountType)
  }

  transformVoucherCategory(type: VoucherTypeSummary): VoucherCategoryOption {
    return this.sanitizeVoucherCategory(type)
  }

  transformVoucherCategories(types: VoucherTypeSummary[]): VoucherCategoryOption[] {
    return types.map(this.sanitizeVoucherCategory)
  }

  transformVoucher(voucher: VoucherSummary): VoucherListItem {
    return this.sanitizeVoucherSummary(voucher)
  }

  transformVouchers(vouchers: VoucherSummary[]): VoucherListItem[] {
    return vouchers.map(this.sanitizeVoucherSummary)
  }
}
