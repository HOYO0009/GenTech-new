import { type DbClient } from '../db/connection.db'
import {
  listFeeShops,
  listShopFees as dbListShopFees,
  insertShopFee as dbInsertShopFee,
  type ShopFeeInsertArgs,
  type ShopFeeSummary,
} from '../db/fees.db'
import { type ShopSummary } from '../db/vouchers.db'
import { type IFeesRepository } from './fees.repository.interface'

export class FeesRepository implements IFeesRepository {
  async listShops(executor?: DbClient): Promise<ShopSummary[]> {
    return listFeeShops(executor)
  }

  async listShopFees(executor?: DbClient): Promise<ShopFeeSummary[]> {
    return dbListShopFees(executor)
  }

  async insertShopFee(args: ShopFeeInsertArgs, executor?: DbClient): Promise<void> {
    return dbInsertShopFee(args, executor)
  }
}
