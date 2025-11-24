import { and, eq, inArray, sql } from 'drizzle-orm'
import { db, DbClient, sqlite } from './connection.db'
import { productStatuses, products, suppliers, productPricing, shops } from './schema.db'
import type { Product } from './schema.db'

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
  imageUrl: string | null
}

export type ProductPricingSummary = {
  productSku: string
  shopId: number
  shopCode: string
  shopName: string
  moq: number | null
  sellPrice: number | null
  actualSellPrice: number | null
  bestDiscount: number | null
  competitorPrice: number | null
  competitorLink: string | null
}

export type ProductStatus = typeof productStatuses.$inferSelect

export type ShopSummary = Pick<typeof shops.$inferSelect, 'id' | 'code' | 'name'>

export async function listProducts(executor: DbClient = db): Promise<ProductSummary[]> {
  const rows = await executor
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
      imageUrl: products.imageUrl,
    })
    .from(products)
    .innerJoin(productStatuses, eq(productStatuses.id, products.statusId))
    .leftJoin(suppliers, eq(suppliers.id, products.supplierId))
    .orderBy(products.sku)

  return rows.map(
    ({ sku, name, statusId, statusName, cost, supplierName, supplierLink, purchaseRemarks, supplierId, imageUrl }) => ({
      sku,
      name,
      statusId,
      statusName: statusName ?? '',
      cost,
      supplierLink,
      supplierName,
      supplierId,
      purchaseRemarks,
      imageUrl,
    })
  )
}

export async function getProductBySku(sku: string, executor: DbClient = db): Promise<ProductSummary | null> {
  const rows = await executor
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
      imageUrl: products.imageUrl,
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
    imageUrl: row.imageUrl,
  }
}

export async function getProductByName(name: string, executor: DbClient = db): Promise<ProductSummary | null> {
  const normalized = name.toLowerCase().trim()
  if (!normalized) {
    return null
  }
  const rows = await executor
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
      imageUrl: products.imageUrl,
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
    imageUrl: row.imageUrl,
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
  imageUrl,
}: {
  originalSku: string
  newSku: string
  name: string
  statusId: number
  cost: number | null
  purchaseRemarks: string | null
  supplierId: number | null
  supplierLink: string | null
  imageUrl: string | null
}, executor: DbClient = db) {
  const rows = await executor
    .update(products)
    .set({
      sku: newSku,
      name,
      statusId,
      cost,
      purchaseRemarks,
      supplierId,
      supplierLink,
      imageUrl,
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
  imageUrl,
}: {
  sku: string
  name: string
  statusId: number
  cost: number | null
  purchaseRemarks: string | null
  supplierId: number | null
  supplierLink: string | null
  imageUrl: string | null
}, executor: DbClient = db) {
  await executor
    .insert(products)
    .values({
      sku,
      name,
      statusId,
      cost,
      purchaseRemarks,
      supplierId,
      supplierLink,
      imageUrl,
    })
    .run()
  return true
}

export async function deleteProductBySku(sku: string, executor: DbClient = db) {
  const result = await executor.delete(products).where(eq(products.sku, sku)).run()
  const changes = (result as { changes?: number } | undefined)?.changes ?? 0
  return changes > 0
}

export async function updateProductPricing(
  {
    productSku,
    shopId,
    sellPrice,
    moq,
    competitorPrice,
    competitorLink,
  }: {
    productSku: string
    shopId: number
    sellPrice: number | null
    moq: number | null
    competitorPrice: number | null
    competitorLink: string | null
  },
  executor: DbClient = db
) {
  const result = await executor
    .update(productPricing)
    .set({
      sellPrice,
      moq,
      competitorPrice,
      competitorLink,
    })
    .where(and(eq(productPricing.productSku, productSku), eq(productPricing.shopId, shopId)))
    .run()

  const changes = (result as { changes?: number } | undefined)?.changes ?? 0
  return changes > 0
}

export async function listProductStatuses(executor: DbClient = db): Promise<ProductStatus[]> {
  const rows = await executor
    .select({
      id: productStatuses.id,
      name: productStatuses.name,
    })
    .from(productStatuses)
    .orderBy(productStatuses.id)

  return rows
}

export async function listSuppliers(executor: DbClient = db): Promise<Array<Pick<typeof suppliers.$inferSelect, 'id' | 'name'>>> {
  const rows = await executor
    .select({
      id: suppliers.id,
      name: suppliers.name,
    })
    .from(suppliers)
    .orderBy(suppliers.name)

  return rows
}

export async function listProductPricing(executor: DbClient = db): Promise<ProductPricingSummary[]> {
  ensureProductPricingView()

  const rows = sqlite
    .prepare(
      `
      SELECT
        product_sku AS productSku,
        shop_id AS shopId,
        COALESCE(shop_code, '') AS shopCode,
        COALESCE(shop_name, 'Unknown shop') AS shopName,
        moq AS moq,
        sell_price AS sellPrice,
        actual_sell_price AS actualSellPrice,
        best_discount_cents AS bestDiscount,
        competitor_price AS competitorPrice,
        competitor_link AS competitorLink
      FROM product_pricing_with_best_voucher
      ORDER BY product_sku, shop_name
    `
    )
    .all() as Array<{
    productSku: string
    shopId: number
    shopCode: string | null
    shopName: string | null
    moq: number | null
    sellPrice: number | null
    actualSellPrice: number | null
    bestDiscount: number | null
    competitorPrice: number | null
    competitorLink: string | null
  }>

  return rows.map((row) => ({
    productSku: row.productSku,
    shopId: row.shopId,
    shopCode: row.shopCode ?? '',
    shopName: row.shopName ?? 'Unknown shop',
    moq: row.moq ?? null,
    sellPrice: row.sellPrice ?? null,
    actualSellPrice: row.actualSellPrice ?? null,
    bestDiscount: row.bestDiscount ?? null,
    competitorPrice: row.competitorPrice ?? null,
    competitorLink: row.competitorLink ?? null,
  }))
}

export { products }

export async function listShops(executor: DbClient = db): Promise<ShopSummary[]> {
  const rows = await executor
    .select({
      id: shops.id,
      code: shops.code,
      name: shops.name,
    })
    .from(shops)
    .orderBy(shops.name)

  return rows
}

export async function listProductShopIds(productSku: string, executor: DbClient = db): Promise<number[]> {
  const rows = await executor
    .select({ shopId: productPricing.shopId })
    .from(productPricing)
    .where(eq(productPricing.productSku, productSku))

  return rows.map((row) => row.shopId)
}

export async function addProductShops(
  productSku: string,
  shopIds: number[],
  executor: DbClient = db
): Promise<void> {
  if (!shopIds.length) return
  const values = shopIds.map((shopId) => ({
    productSku,
    shopId,
  }))
  await executor.insert(productPricing).values(values).run()
}

export async function removeProductShops(
  productSku: string,
  shopIds: number[],
  executor: DbClient = db
): Promise<void> {
  if (!shopIds.length) {
    return
  }
  await executor
    .delete(productPricing)
    .where(and(eq(productPricing.productSku, productSku), inArray(productPricing.shopId, shopIds)))
    .run()
}

export async function reassignProductPricingSku(
  originalSku: string,
  newSku: string,
  executor: DbClient = db
): Promise<void> {
  if (originalSku === newSku) return
  await executor
    .update(productPricing)
    .set({ productSku: newSku })
    .where(eq(productPricing.productSku, originalSku))
    .run()
}

const ensureProductPricingView = (() => {
  let isCreated = false

  return () => {
    if (isCreated) return
    sqlite.exec(`
      DROP VIEW IF EXISTS product_pricing_with_best_voucher;
      CREATE VIEW product_pricing_with_best_voucher AS
      WITH eligible_discounts AS (
        SELECT
          p.id AS pricing_id,
          p.sell_price AS sell_price,
          v.max_discount AS max_discount,
          CASE
            WHEN p.sell_price IS NULL THEN NULL
            WHEN v.min_spend > p.sell_price THEN NULL
            WHEN vdt.key = 'percentage' THEN CAST(ROUND(p.sell_price * v.discount / 10000.0) AS INTEGER)
            ELSE v.discount
          END AS raw_discount_cents
        FROM product_pricing p
        JOIN vouchers v ON v.shop_id = p.shop_id
        LEFT JOIN voucher_discount_types vdt ON vdt.id = v.voucher_discount_type_id
      ),
      eligible_discounts_clamped AS (
        SELECT
          pricing_id,
          sell_price,
          CASE
            WHEN raw_discount_cents IS NULL THEN NULL
            WHEN max_discount IS NOT NULL AND raw_discount_cents > max_discount THEN max_discount
            ELSE raw_discount_cents
          END AS discount_cents
        FROM eligible_discounts
        WHERE raw_discount_cents IS NOT NULL AND sell_price IS NOT NULL
      ),
      best_discounts AS (
        SELECT
          pricing_id,
          MAX(CASE WHEN discount_cents > sell_price THEN sell_price ELSE discount_cents END) AS best_discount_cents
        FROM eligible_discounts_clamped
        GROUP BY pricing_id
      )
      SELECT
        p.product_sku AS product_sku,
        p.shop_id AS shop_id,
        s.code AS shop_code,
        s.name AS shop_name,
        p.moq AS moq,
        p.sell_price AS sell_price,
        CASE
          WHEN p.sell_price IS NULL THEN NULL
          WHEN best_discounts.best_discount_cents IS NULL THEN p.sell_price
          ELSE p.sell_price - best_discounts.best_discount_cents
        END AS actual_sell_price,
        best_discounts.best_discount_cents AS best_discount_cents,
        p.competitor_price AS competitor_price,
        p.competitor_link AS competitor_link
      FROM product_pricing p
      LEFT JOIN best_discounts ON best_discounts.pricing_id = p.id
      LEFT JOIN shops s ON s.id = p.shop_id;
    `)
    isCreated = true
  }
})()
