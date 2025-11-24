import { eq, desc } from 'drizzle-orm'
import { db, type DbClient } from './connection.db'
import { shopFees, shops } from './schema.db'

export type ShopRow = typeof shops.$inferSelect
export type ShopFeeRow = typeof shopFees.$inferSelect

export type ShopFeeInsertArgs = Pick<ShopFeeRow, 'feeType' | 'amount' | 'label'> & {
  shopId: number | null
}

export type ShopFeeSummary = {
  id: number
  shopId: number | null
  shopName: string | null
  feeType: 'fixed' | 'percentage'
  amount: number
  label: string | null
  createdAt: Date | number | null
}

export async function listFeeShops(executor: DbClient = db): Promise<Pick<ShopRow, 'id' | 'name' | 'code'>[]> {
  const rows = await executor
    .select({
      id: shops.id,
      name: shops.name,
      code: shops.code,
    })
    .from(shops)
    .orderBy(shops.name)

  return rows
}

export async function listShopFees(executor: DbClient = db): Promise<ShopFeeSummary[]> {
  const rows = await executor
    .select({
      id: shopFees.id,
      shopId: shopFees.shopId,
      shopName: shops.name,
      feeType: shopFees.feeType as 'fixed' | 'percentage',
      amount: shopFees.amount,
      label: shopFees.label,
      createdAt: shopFees.createdAt,
    })
    .from(shopFees)
    .leftJoin(shops, eq(shopFees.shopId, shops.id))
    .orderBy(desc(shopFees.createdAt))
    .all()

  return rows
}

export async function insertShopFee(args: ShopFeeInsertArgs, executor: DbClient = db) {
  await executor.insert(shopFees).values({
    shopId: args.shopId,
    feeType: args.feeType,
    amount: args.amount,
    label: args.label ?? null,
  }).run()
}
