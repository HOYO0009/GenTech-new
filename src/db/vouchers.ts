import { eq, desc } from 'drizzle-orm'
import { db } from './connection'
import { shops, voucherTypes, voucherDiscountTypes, vouchers } from './schema'

export type ShopSummary = {
  id: number
  code: string
  name: string
}

export type VoucherDiscountTypeSummary = {
  id: number
  key: string
  label: string
}

export type VoucherTypeSummary = {
  id: number
  name: string
}

export type VoucherInsertArgs = {
  shopId: number
  voucherDiscountTypeId: number
  voucherTypeId: number
  minSpend: number
  discount: number
  maxDiscount: number | null
}

export type VoucherSummary = {
  id: number
  shopId: number
  shopName: string | null
  voucherDiscountTypeId: number
  voucherDiscountTypeKey: string | null
  voucherDiscountTypeLabel: string | null
  voucherTypeId: number | null
  voucherTypeName: string | null
  minSpend: number
  discount: number
  maxDiscount: number | null
  createdAt: Date | number | null
}

export async function listShops(): Promise<ShopSummary[]> {
  const rows = await db
    .select({
      id: shops.id,
      code: shops.code,
      name: shops.name,
    })
    .from(shops)
    .orderBy(shops.name)

  return rows
}

export async function listVoucherDiscountTypes(): Promise<VoucherDiscountTypeSummary[]> {
  const rows = await db
    .select({
      id: voucherDiscountTypes.id,
      key: voucherDiscountTypes.key,
      label: voucherDiscountTypes.label,
    })
    .from(voucherDiscountTypes)
    .orderBy(voucherDiscountTypes.id)

  return rows
}

export async function listVoucherTypes(): Promise<VoucherTypeSummary[]> {
  const rows = await db
    .select({
      id: voucherTypes.id,
      name: voucherTypes.name,
    })
    .from(voucherTypes)
    .orderBy(voucherTypes.name)

  return rows
}

export async function listRecentVouchers(limit = 10): Promise<VoucherSummary[]> {
  const rows = await db
    .select({
      id: vouchers.id,
      shopId: vouchers.shopId,
      shopName: shops.name,
      voucherDiscountTypeId: vouchers.voucherDiscountTypeId,
      voucherDiscountTypeKey: voucherDiscountTypes.key,
      voucherDiscountTypeLabel: voucherDiscountTypes.label,
      voucherTypeId: vouchers.voucherTypeId,
      voucherTypeName: voucherTypes.name,
      minSpend: vouchers.minSpend,
      discount: vouchers.discount,
      maxDiscount: vouchers.maxDiscount,
      createdAt: vouchers.createdAt,
    })
    .from(vouchers)
    .leftJoin(shops, eq(shops.id, vouchers.shopId))
    .leftJoin(voucherDiscountTypes, eq(voucherDiscountTypes.id, vouchers.voucherDiscountTypeId))
    .leftJoin(voucherTypes, eq(voucherTypes.id, vouchers.voucherTypeId))
    .orderBy(desc(vouchers.createdAt))
    .limit(limit)
    .all()

  return rows
}

export async function insertVoucher(args: VoucherInsertArgs) {
  await db.insert(vouchers).values({
    shopId: args.shopId,
    voucherDiscountTypeId: args.voucherDiscountTypeId,
    voucherTypeId: args.voucherTypeId,
    minSpend: args.minSpend,
    discount: args.discount,
    maxDiscount: args.maxDiscount,
  }).run()
}

export async function updateVoucher(args: VoucherInsertArgs & { id: number }) {
  const rows = await db
    .update(vouchers)
    .set({
      shopId: args.shopId,
      voucherDiscountTypeId: args.voucherDiscountTypeId,
      voucherTypeId: args.voucherTypeId,
      minSpend: args.minSpend,
      discount: args.discount,
      maxDiscount: args.maxDiscount,
    })
    .where(eq(vouchers.id, args.id))
    .returning({ id: vouchers.id })
    .all()

  return rows.length > 0
}

export async function deleteVoucherById(id: number) {
  const result = await db.delete(vouchers).where(eq(vouchers.id, id)).run()
  return result.changes > 0
}
