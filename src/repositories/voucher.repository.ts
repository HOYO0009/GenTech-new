import { IVoucherRepository } from './voucher.repository.interface'
import { DbClient } from '../db/connection.db'
import {
  listShops as dbListShops,
  listVoucherDiscountTypes as dbListVoucherDiscountTypes,
  listVoucherTypes as dbListVoucherTypes,
  getVoucherById as dbGetVoucherById,
  listRecentVouchers as dbListRecentVouchers,
  insertVoucher as dbInsertVoucher,
  updateVoucher as dbUpdateVoucher,
  deleteVoucherById as dbDeleteVoucherById,
  ShopSummary,
  VoucherDiscountTypeSummary,
  VoucherTypeSummary,
  VoucherInsertArgs,
  VoucherSummary,
} from '../db/vouchers.db'

export class VoucherRepository implements IVoucherRepository {
  async listShops(executor?: DbClient): Promise<ShopSummary[]> {
    return dbListShops(executor)
  }

  async listVoucherDiscountTypes(executor?: DbClient): Promise<VoucherDiscountTypeSummary[]> {
    return dbListVoucherDiscountTypes(executor)
  }

  async listVoucherTypes(executor?: DbClient): Promise<VoucherTypeSummary[]> {
    return dbListVoucherTypes(executor)
  }

  async getVoucherById(id: number, executor?: DbClient): Promise<VoucherSummary | null> {
    return dbGetVoucherById(id, executor)
  }

  async listRecentVouchers(limit = 1000, executor?: DbClient): Promise<VoucherSummary[]> {
    return dbListRecentVouchers(limit, executor)
  }

  async insertVoucher(args: VoucherInsertArgs, executor?: DbClient): Promise<void> {
    return dbInsertVoucher(args, executor)
  }

  async updateVoucher(args: VoucherInsertArgs & { id: number }, executor?: DbClient): Promise<boolean> {
    return dbUpdateVoucher(args, executor)
  }

  async deleteVoucherById(id: number, executor?: DbClient): Promise<boolean> {
    return dbDeleteVoucherById(id, executor)
  }
}
