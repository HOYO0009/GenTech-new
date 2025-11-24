import { integer, sqliteTable, text, primaryKey, uniqueIndex } from 'drizzle-orm/sqlite-core'

export const productStatuses = sqliteTable('product_statuses', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull().unique(),
})

export const suppliers = sqliteTable('suppliers', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull().unique(),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
})

export const categories = (() => {
  const table = sqliteTable('categories', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    name: text('name').notNull().unique(),
    parentId: integer('parent_id').references(() => table.id, { onDelete: 'set null' }),
  })

  return table
})()

export const products = sqliteTable('products', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  sku: text('sku').notNull().unique(),
  name: text('name').notNull(),
  statusId: integer('status_id')
    .notNull()
    .default(1)
    .references(() => productStatuses.id),
  cost: integer('cost'),
  supplierLink: text('supplier_link'),
  purchaseRemarks: text('purchase_remarks'),
  supplierId: integer('supplier_id').references(() => suppliers.id),
  imageUrl: text('image_url'),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  categoryId: integer('category_id').references(() => categories.id),
  subcategoryId: integer('subcategory_id').references(() => categories.id),
})

export const listings = sqliteTable('listings', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  listingCode: text('listing_code').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
}, (table) => ({
  listingCodeUnique: uniqueIndex('listings_listing_code_unique').on(table.listingCode),
}))

export const shops = sqliteTable('shops', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  code: text('code').notNull().unique(),
  name: text('name').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
})

export const shopFees = sqliteTable('shop_fees', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  shopId: integer('shop_id')
    .references(() => shops.id),
  feeType: text('fee_type').notNull(), // 'fixed' | 'percentage'
  amount: integer('amount').notNull(), // cents for fixed, basis points for percentage
  label: text('label'),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
})

export const listingShops = sqliteTable('listing_shops', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  listingId: integer('listing_id').notNull().references(() => listings.id, { onDelete: 'cascade' }),
  shopId: integer('shop_id').notNull().references(() => shops.id),
  title: text('title'),
  description: text('description'),
}, (table) => ({
  listingShopUnique: uniqueIndex('listing_shops_listing_shop_unique').on(table.listingId, table.shopId),
}))

export const listingProducts = sqliteTable('listing_products', {
  listingId: integer('listing_id').notNull().references(() => listings.id, { onDelete: 'cascade' }),
  productSku: text('product_sku').notNull().references(() => products.sku, { onDelete: 'cascade' }),
  position: integer('position').default(0),
  role: text('role').notNull().default('other'),
}, (table) => ({
  pk: primaryKey({ columns: [table.listingId, table.productSku], name: 'listing_products_pk' }),
}))

export const productPricing = sqliteTable('product_pricing', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  productSku: text('product_sku').notNull().references(() => products.sku),
  shopId: integer('shop_id').notNull().references(() => shops.id),
  moq: integer('moq'),
  sellPrice: integer('sell_price'), // cents
  competitorPrice: integer('competitor_price'), // cents
  competitorLink: text('competitor_link'),
})

export const voucherDiscountTypes = sqliteTable('voucher_discount_types', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  key: text('key').notNull().unique(),
  label: text('label').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
})

export const voucherTypes = sqliteTable('voucher_types', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull().unique(),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
})

export const vouchers = sqliteTable('vouchers', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  shopId: integer('shop_id').notNull().references(() => shops.id),
  minSpend: integer('min_spend').notNull(), // cents
  discount: integer('discount').notNull(), // cents or basis points (see discount type)
  maxDiscount: integer('max_discount'), // cents
  voucherDiscountTypeId: integer('voucher_discount_type_id')
    .notNull()
    .default(1)
    .references(() => voucherDiscountTypes.id),
  voucherTypeId: integer('voucher_type_id')
    .notNull()
    .references(() => voucherTypes.id),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
})

export const changeLogs = sqliteTable('change_logs', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  occurredAt: integer('occurred_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  tableName: text('table_name'),
  action: text('action').notNull(),
  description: text('description').notNull(),
  payload: text('payload'),
  source: text('source'),
})

export type Product = typeof products.$inferSelect
export type NewProduct = typeof products.$inferInsert

export type ProductPricing = typeof productPricing.$inferSelect
export type NewProductPricing = typeof productPricing.$inferInsert

export type Category = typeof categories.$inferSelect
export type NewCategory = typeof categories.$inferInsert

export type Listing = typeof listings.$inferSelect
export type NewListing = typeof listings.$inferInsert
export type ListingShop = typeof listingShops.$inferSelect
export type NewListingShop = typeof listingShops.$inferInsert
export type ListingProduct = typeof listingProducts.$inferSelect
export type NewListingProduct = typeof listingProducts.$inferInsert

export type ShopFee = typeof shopFees.$inferSelect
export type NewShopFee = typeof shopFees.$inferInsert

export type VoucherDiscountType = typeof voucherDiscountTypes.$inferSelect
export type NewVoucherDiscountType = typeof voucherDiscountTypes.$inferInsert
export type VoucherType = typeof voucherTypes.$inferSelect
export type NewVoucherType = typeof voucherTypes.$inferInsert
export type Voucher = typeof vouchers.$inferSelect
export type NewVoucher = typeof vouchers.$inferInsert
