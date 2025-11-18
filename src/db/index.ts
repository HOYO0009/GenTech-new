import { join } from 'path'
import { Database } from 'bun:sqlite'
import { drizzle } from 'drizzle-orm/bun-sqlite'
import { eq } from 'drizzle-orm'
import { products, productStatuses } from './schema'

const sqlite = new Database(join(process.cwd(), 'gentech.sqlite'))
export const db = drizzle(sqlite)

export type Product = typeof products.$inferSelect
export type ProductSummary = {
  sku: Product['sku']
  name: Product['name']
  statusId: number
  statusName: string
  cost: Product['cost']
  supplier: Product['supplier']
  supplierLink: Product['supplierLink']
}

export type ProductStatus = {
  id: number
  name: string
}

export async function listProducts(): Promise<ProductSummary[]> {
  const rows = await db
    .select({
      sku: products.sku,
      name: products.name,
      statusId: products.statusId,
      statusName: productStatuses.name,
      cost: products.cost,
      supplier: products.supplier,
      supplierLink: products.supplierLink,
    })
    .from(products)
    .innerJoin(productStatuses, eq(productStatuses.id, products.statusId))
    .orderBy(products.sku)

  return rows.map(({ sku, name, statusId, statusName, cost, supplier, supplierLink }) => ({
    sku,
    name,
    statusId,
    statusName: statusName ?? '',
    cost,
    supplier,
    supplierLink,
  }))
}

export async function updateProduct(sku: string, name: string, statusId: number) {
  const rows = await db
    .update(products)
    .set({ name, statusId })
    .where(eq(products.sku, sku))
    .returning({ sku: products.sku })
    .all()

  return rows.length > 0
}

export async function listProductStatuses(): Promise<ProductStatus[]> {
  const rows = await db
    .select({
      id: productStatuses.id,
      name: productStatuses.name,
    })
    .from(productStatuses)
    .orderBy(productStatuses.id)

  return rows
}

export { products }
export type { NewProduct } from './schema'
