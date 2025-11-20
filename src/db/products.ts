import { eq, sql } from 'drizzle-orm'
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

export async function getProductBySku(sku: string): Promise<ProductSummary | null> {
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
    .where(eq(products.sku, sku))
    .limit(1)
    .all()

  if (!rows.length) {
    return null
  }

  const row = rows[0]

  return {
    sku: row.sku,
    name: row.name,
    statusId: row.statusId,
    statusName: row.statusName ?? '',
    cost: row.cost,
    supplierName: row.supplierName,
    supplierLink: row.supplierLink,
    supplierId: row.supplierId,
    purchaseRemarks: row.purchaseRemarks,
  }
}

export async function getProductByName(name: string): Promise<ProductSummary | null> {
  const normalized = name.toLowerCase().trim()
  if (!normalized) {
    return null
  }
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
    .where(sql`lower(${products.name}) = ${normalized}`)
    .limit(1)
    .all()

  if (!rows.length) {
    return null
  }

  const row = rows[0]

  return {
    sku: row.sku,
    name: row.name,
    statusId: row.statusId,
    statusName: row.statusName ?? '',
    cost: row.cost,
    supplierName: row.supplierName,
    supplierLink: row.supplierLink,
    supplierId: row.supplierId,
    purchaseRemarks: row.purchaseRemarks,
  }
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

export async function insertProduct({
  sku,
  name,
  statusId,
  cost,
  purchaseRemarks,
  supplierId,
  supplierLink,
}: {
  sku: string
  name: string
  statusId: number
  cost: number | null
  purchaseRemarks: string | null
  supplierId: number | null
  supplierLink: string | null
}) {
  await db
    .insert(products)
    .values({
      sku,
      name,
      statusId,
      cost,
      purchaseRemarks,
      supplierId,
      supplierLink,
    })
    .run()
  return true
}

export async function deleteProductBySku(sku: string) {
  const result = await db.delete(products).where(eq(products.sku, sku)).run()
  return result.changes > 0
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
