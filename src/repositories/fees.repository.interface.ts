import { type DbClient } from '../db/connection.db'
import { type ShopFeeInsertArgs, type ShopFeeSummary } from '../db/fees.db'
import { type ShopSummary } from '../db/vouchers.db'

export interface IFeesRepository {
  listShops(executor?: DbClient): Promise<ShopSummary[]>
  listShopFees(executor?: DbClient): Promise<ShopFeeSummary[]>
  insertShopFee(args: ShopFeeInsertArgs, executor?: DbClient): Promise<void>
}
