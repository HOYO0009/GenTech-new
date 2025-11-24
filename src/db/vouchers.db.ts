import { eq, desc } from 'drizzle-orm'
import { db, DbClient } from './connection.db'
import { shops, voucherTypes, voucherDiscountTypes, vouchers } from './schema.db'

export type Voucher = typeof vouchers.$inferSelect
export type NewVoucher = typeof vouchers.$inferInsert
type ShopRow = typeof shops.$inferSelect
type VoucherDiscountTypeRow = typeof voucherDiscountTypes.$inferSelect
type VoucherTypeRow = typeof voucherTypes.$inferSelect

export type ShopSummary = Pick<ShopRow, 'id' | 'code' | 'name'>

export type VoucherDiscountTypeSummary = Pick<VoucherDiscountTypeRow, 'id' | 'key' | 'label'>

export type VoucherTypeSummary = Pick<VoucherTypeRow, 'id' | 'name'>

type VoucherInsert = typeof vouchers.$inferInsert
export type VoucherInsertArgs = Pick<
  VoucherInsert,
  'shopId' | 'voucherDiscountTypeId' | 'voucherTypeId' | 'minSpend' | 'discount' | 'maxDiscount'
>

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

export async function listShops(executor: DbClient = db): Promise<ShopSummary[]> {
  const rows = await executor
    .select({
      id: shops.id,
      code: shops.code,
      name: shops.name,
    })
    .from(shops)
    .orderBy(shops.name)

  return rows
}

export async function listVoucherDiscountTypes(executor: DbClient = db): Promise<VoucherDiscountTypeSummary[]> {
  const rows = await executor
    .select({
      id: voucherDiscountTypes.id,
      key: voucherDiscountTypes.key,
      label: voucherDiscountTypes.label,
    })
    .from(voucherDiscountTypes)
    .orderBy(voucherDiscountTypes.id)

  return rows
}

export async function listVoucherTypes(executor: DbClient = db): Promise<VoucherTypeSummary[]> {
  const rows = await executor
    .select({
      id: voucherTypes.id,
      name: voucherTypes.name,
    })
    .from(voucherTypes)
    .orderBy(voucherTypes.name)

  return rows
}

export async function getVoucherById(id: number, executor: DbClient = db): Promise<VoucherSummary | null> {
  const rows = await executor
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
    .where(eq(vouchers.id, id))
    .limit(1)
    .all()

  return rows.length ? rows[0] : null
}

export async function listRecentVouchers(limit = 1000, executor: DbClient = db): Promise<VoucherSummary[]> {
  const rows = await executor
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

export async function insertVoucher(args: VoucherInsertArgs, executor: DbClient = db) {
  await executor.insert(vouchers).values({
    shopId: args.shopId,
    voucherDiscountTypeId: args.voucherDiscountTypeId,
    voucherTypeId: args.voucherTypeId,
    minSpend: args.minSpend,
    discount: args.discount,
    maxDiscount: args.maxDiscount,
  }).run()
}

export async function updateVoucher(args: VoucherInsertArgs & { id: number }, executor: DbClient = db) {
  const rows = await executor
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

export async function deleteVoucherById(id: number, executor: DbClient = db) {
  const result = await executor.delete(vouchers).where(eq(vouchers.id, id)).run()
  return result.changes > 0
}
