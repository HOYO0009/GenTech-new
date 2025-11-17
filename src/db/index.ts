import { join } from 'path'
import { Database } from 'bun:sqlite'
import { drizzle } from 'drizzle-orm/bun-sqlite'
import { eq } from 'drizzle-orm'
import { products } from './schema'

const sqlite = new Database(join(process.cwd(), 'gentech.sqlite'))
export const db = drizzle(sqlite)

export type Product = typeof products.$inferSelect
export type ProductSummary = Pick<
  Product,
  'sku' | 'name' | 'status' | 'cost' | 'supplier' | 'supplierLink'
>

export async function listProducts(): Promise<ProductSummary[]> {
  const rows = await db.select().from(products).orderBy(products.sku)

  return rows.map(({ sku, name, status, cost, supplier, supplierLink }) => ({
    sku,
    name,
    status,
    cost,
    supplier,
    supplierLink,
  }))
}

export async function updateProduct(sku: string, name: string, status: string) {
  const result = await db
    .update(products)
    .set({ name, status })
    .where(eq(products.sku, sku))
    .run()

  return result.changes > 0
}

export { products }
export type { NewProduct } from './schema'
