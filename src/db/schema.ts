import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'

export const productStatuses = sqliteTable('product_statuses', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull().unique(),
})

export const products = sqliteTable('products', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  sku: text('sku').notNull().unique(),
  name: text('name').notNull(),
  statusId: integer('status_id')
    .notNull()
    .default(1)
    .references(() => productStatuses.id),
  cost: integer('cost'),
  supplier: text('supplier'),
  supplierLink: text('supplier_link'),
})

export type Product = typeof products.$inferSelect
export type NewProduct = typeof products.$inferInsert
