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
  supplierId: Product['supplierId']
  purchaseRemarks: Product['purchaseRemarks']
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
      supplierId: suppliers.id,
      purchaseRemarks: products.purchaseRemarks,
      supplierName: suppliers.name,
    })
    .from(products)
    .innerJoin(productStatuses, eq(productStatuses.id, products.statusId))
    .leftJoin(suppliers, eq(suppliers.id, products.supplierId))
    .orderBy(products.sku)

  return rows.map(({ sku, name, statusId, statusName, cost, supplierName, supplierLink, purchaseRemarks, supplierId }) => ({
    sku,
    name,
    statusId,
    statusName: statusName ?? '',
    cost,
    supplierLink,
    supplierName,
    supplierId,
    purchaseRemarks,
  }))
}

export async function updateProduct({
  originalSku,
  newSku,
  name,
  statusId,
  cost,
  purchaseRemarks,
  supplierId,
  supplierLink,
}: {
  originalSku: string
  newSku: string
  name: string
  statusId: number
  cost: number | null
  purchaseRemarks: string | null
  supplierId: number | null
  supplierLink: string | null
}) {
  const rows = await db
    .update(products)
    .set({
      sku: newSku,
      name,
      statusId,
      cost,
      purchaseRemarks,
      supplierId,
      supplierLink,
    })
    .where(eq(products.sku, originalSku))
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

export async function listSuppliers() {
  const rows = await db
    .select({
      id: suppliers.id,
      name: suppliers.name,
    })
    .from(suppliers)
    .orderBy(suppliers.name)

  return rows
}

export { products }
