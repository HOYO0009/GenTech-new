import {
  ShopSummary,
  VoucherDiscountTypeSummary,
  VoucherTypeSummary,
  VoucherInsertArgs,
  VoucherSummary,
} from '../db/vouchers.db'

export interface IVoucherRepository {
  listShops(): Promise<ShopSummary[]>
  listVoucherDiscountTypes(): Promise<VoucherDiscountTypeSummary[]>
  listVoucherTypes(): Promise<VoucherTypeSummary[]>
  getVoucherById(id: number): Promise<VoucherSummary | null>
  listRecentVouchers(limit?: number): Promise<VoucherSummary[]>
  insertVoucher(args: VoucherInsertArgs): Promise<void>
  updateVoucher(args: VoucherInsertArgs & { id: number }): Promise<boolean>
  deleteVoucherById(id: number): Promise<boolean>
}
