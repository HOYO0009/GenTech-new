import { voucherEditorPage } from './src/ui/pages/voucherEditor'

const payload = {
  shops: [{ id: 1, name: 'Test Shop', code: 'TS' }],
  voucherDiscountTypes: [{ id: 1, key: 'fixed', label: 'Fixed (SGD)' }],
  voucherTypes: [{ id: 1, name: 'Standard' }],
  vouchers: [
    {
      id: 1,
      shopId: 1,
      voucherDiscountTypeId: 1,
      voucherTypeId: 1,
      shopName: 'Test Shop',
      voucherDiscountTypeLabel: 'Fixed (SGD)',
      voucherDiscountTypeKey: 'fixed',
      voucherCategoryLabel: 'Standard',
      minSpend: 0,
      minSpendDisplay: '$0.00',
      discount: 5,
      discountDisplay: '$5.00',
      maxDiscount: 50,
      maxDiscountDisplay: '$50.00',
      createdAt: '2024-12-01',
    },
  ],
}

console.log(voucherEditorPage(payload))
