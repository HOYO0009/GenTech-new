import { integer, real, sqliteTable, text } from 'drizzle-orm/sqlite-core'

export const products = sqliteTable('products', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  sku: text('sku').notNull().unique(),
  name: text('name').notNull(),
  status: text('status').notNull().default('active'),
  cost: real('cost'),
  supplier: text('supplier'),
  supplierLink: text('supplier_link'),
})

export type Product = typeof products.$inferSelect
export type NewProduct = typeof products.$inferInsert
