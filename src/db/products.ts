import { eq } from 'drizzle-orm'
import { db } from './connection'
import { productStatuses, products, suppliers } from './schema'
import type { Product } from './schema'

export type ProductSummary = {
  sku: Product['sku']
  name: Product['name']
  statusId: number
  statusName: string
  cost: Product['cost']
  supplierLink: Product['supplierLink']
  supplierName: string | null
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
      supplierLink: products.supplierLink,
      supplierName: suppliers.name,
    })
    .from(products)
    .innerJoin(productStatuses, eq(productStatuses.id, products.statusId))
    .leftJoin(suppliers, eq(suppliers.id, products.supplierId))
    .orderBy(products.sku)

  return rows.map(({ sku, name, statusId, statusName, cost, supplierName, supplierLink }) => ({
    sku,
    name,
    statusId,
    statusName: statusName ?? '',
    cost,
    supplierLink,
    supplierName,
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
