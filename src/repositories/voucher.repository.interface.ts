import { DbClient } from '../db/connection.db'
import {
  ShopSummary,
  VoucherDiscountTypeSummary,
  VoucherTypeSummary,
  VoucherInsertArgs,
  VoucherSummary,
} from '../db/vouchers.db'

export interface IVoucherRepository {
  listShops(executor?: DbClient): Promise<ShopSummary[]>
  listVoucherDiscountTypes(executor?: DbClient): Promise<VoucherDiscountTypeSummary[]>
  listVoucherTypes(executor?: DbClient): Promise<VoucherTypeSummary[]>
  getVoucherById(id: number, executor?: DbClient): Promise<VoucherSummary | null>
  listRecentVouchers(limit?: number, executor?: DbClient): Promise<VoucherSummary[]>
  insertVoucher(args: VoucherInsertArgs, executor?: DbClient): Promise<void>
  updateVoucher(args: VoucherInsertArgs & { id: number }, executor?: DbClient): Promise<boolean>
  deleteVoucherById(id: number, executor?: DbClient): Promise<boolean>
}
