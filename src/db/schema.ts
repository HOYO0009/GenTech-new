import { integer, real, sqliteTable, text } from 'drizzle-orm/sqlite-core'

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
    parentId: integer('parent_id').references(() => table.id),
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
})

export const shops = sqliteTable('shops', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  code: text('code').notNull().unique(),
  name: text('name').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
})

export const listingShops = sqliteTable('listing_shops', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  listingId: integer('listing_id').references(() => listings.id),
  shopId: integer('shop_id').notNull().references(() => shops.id),
  title: text('title'),
  description: text('description'),
})

export const platformPricing = sqliteTable('platform_pricing', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  productSku: text('product_sku').notNull().references(() => products.sku),
  shopId: integer('shop_id').notNull().references(() => shops.id),
  moq: integer('moq'),
  sellPrice: real('sell_price'),
  actualSellPrice: real('actual_sell_price'),
  minAdRoas: real('min_ad_roas'),
  maxAff: real('max_aff'),
  competitorPrice: real('competitor_price'),
  competitorLink: text('competitor_link'),
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
