import { IVoucherRepository } from './voucher.repository.interface'
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
  async listShops(): Promise<ShopSummary[]> {
    return dbListShops()
  }

  async listVoucherDiscountTypes(): Promise<VoucherDiscountTypeSummary[]> {
    return dbListVoucherDiscountTypes()
  }

  async listVoucherTypes(): Promise<VoucherTypeSummary[]> {
    return dbListVoucherTypes()
  }

  async getVoucherById(id: number): Promise<VoucherSummary | null> {
    return dbGetVoucherById(id)
  }

  async listRecentVouchers(limit = 10): Promise<VoucherSummary[]> {
    return dbListRecentVouchers(limit)
  }

  async insertVoucher(args: VoucherInsertArgs): Promise<void> {
    return dbInsertVoucher(args)
  }

  async updateVoucher(args: VoucherInsertArgs & { id: number }): Promise<boolean> {
    return dbUpdateVoucher(args)
  }

  async deleteVoucherById(id: number): Promise<boolean> {
    return dbDeleteVoucherById(id)
  }
}
