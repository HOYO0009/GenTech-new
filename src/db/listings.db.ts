import { and, eq } from 'drizzle-orm'
import { db, type DbClient } from './connection.db'
import { listings, listingShops, listingProducts, shops, products } from './schema.db'
import { listShops as dbListShops } from './products.db'

export type ListingShopSummary = {
  listingId: number
  shopId: number
  shopName: string
  shopCode: string
  title: string | null
  description: string | null
}

export type ListingProductSummary = {
  listingId: number
  productSku: string
  productName: string | null
}

export type ListingWithRelations = {
  id: number
  listingCode: string
  createdAt: Date | null
  updatedAt: Date | null
  shops: ListingShopSummary[]
  products: ListingProductSummary[]
}

export type ProductListingCode = {
  productSku: string
  listingId: number
  listingCode: string
}

export async function listListingsWithRelations(
  executor: DbClient = db
): Promise<ListingWithRelations[]> {
  const listingRows = await executor
    .select({
      id: listings.id,
      listingCode: listings.listingCode,
      createdAt: listings.createdAt,
      updatedAt: listings.updatedAt,
    })
    .from(listings)
    .orderBy(listings.listingCode)

  const shopRows = await executor
    .select({
      listingId: listingShops.listingId,
      shopId: listingShops.shopId,
      title: listingShops.title,
      description: listingShops.description,
      shopName: shops.name,
      shopCode: shops.code,
    })
    .from(listingShops)
    .leftJoin(shops, eq(listingShops.shopId, shops.id))

  const productRows = await executor
    .select({
      listingId: listingProducts.listingId,
      productSku: listingProducts.productSku,
      productName: products.name,
    })
    .from(listingProducts)
    .leftJoin(products, eq(listingProducts.productSku, products.sku))

  const shopsByListing = shopRows.reduce((map, row) => {
    const list = map.get(row.listingId) ?? []
    list.push({
      listingId: row.listingId,
      shopId: row.shopId,
      shopName: row.shopName ?? 'Unknown shop',
      shopCode: row.shopCode ?? '',
      title: row.title ?? null,
      description: row.description ?? null,
    })
    map.set(row.listingId, list)
    return map
  }, new Map<number, ListingShopSummary[]>())

  const productsByListing = productRows.reduce((map, row) => {
    const list = map.get(row.listingId) ?? []
    list.push({
      listingId: row.listingId,
      productSku: row.productSku,
      productName: row.productName ?? null,
    })
    map.set(row.listingId, list)
    return map
  }, new Map<number, ListingProductSummary[]>())

  return listingRows.map((row) => ({
    id: row.id,
    listingCode: row.listingCode,
    createdAt: row.createdAt ?? null,
    updatedAt: row.updatedAt ?? null,
    shops: shopsByListing.get(row.id) ?? [],
    products: productsByListing.get(row.id) ?? [],
  }))
}

export async function getListingWithRelations(
  id: number,
  executor: DbClient = db
): Promise<ListingWithRelations | null> {
  const listingRow = await executor
    .select({
      id: listings.id,
      listingCode: listings.listingCode,
      createdAt: listings.createdAt,
      updatedAt: listings.updatedAt,
    })
    .from(listings)
    .where(eq(listings.id, id))
    .limit(1)
    .all()

  if (!listingRow.length) return null

  const [row] = listingRow

  const shopRows = await executor
    .select({
      listingId: listingShops.listingId,
      shopId: listingShops.shopId,
      title: listingShops.title,
      description: listingShops.description,
      shopName: shops.name,
      shopCode: shops.code,
    })
    .from(listingShops)
    .leftJoin(shops, eq(listingShops.shopId, shops.id))
    .where(eq(listingShops.listingId, id))

  const productRows = await executor
    .select({
      listingId: listingProducts.listingId,
      productSku: listingProducts.productSku,
      productName: products.name,
    })
    .from(listingProducts)
    .leftJoin(products, eq(listingProducts.productSku, products.sku))
    .where(eq(listingProducts.listingId, id))

  return {
    id: row.id,
    listingCode: row.listingCode,
    createdAt: row.createdAt ?? null,
    updatedAt: row.updatedAt ?? null,
    shops: shopRows.map((entry) => ({
      listingId: entry.listingId,
      shopId: entry.shopId,
      shopName: entry.shopName ?? 'Unknown shop',
      shopCode: entry.shopCode ?? '',
      title: entry.title ?? null,
      description: entry.description ?? null,
    })),
    products: productRows.map((entry) => ({
      listingId: entry.listingId,
      productSku: entry.productSku,
      productName: entry.productName ?? null,
    })),
  }
}

export async function getListingById(id: number, executor: DbClient = db) {
  const rows = await executor
    .select({
      id: listings.id,
      listingCode: listings.listingCode,
      createdAt: listings.createdAt,
      updatedAt: listings.updatedAt,
    })
    .from(listings)
    .where(eq(listings.id, id))
    .limit(1)

  return rows[0] ?? null
}

export async function getListingByCode(code: string, executor: DbClient = db) {
  const rows = await executor
    .select({
      id: listings.id,
      listingCode: listings.listingCode,
      createdAt: listings.createdAt,
      updatedAt: listings.updatedAt,
    })
    .from(listings)
    .where(eq(listings.listingCode, code))
    .limit(1)

  return rows[0] ?? null
}

export async function insertListing(listingCode: string, executor: DbClient = db): Promise<number> {
  const rows = await executor
    .insert(listings)
    .values({ listingCode })
    .returning({ id: listings.id })
    .all()

  return rows[0]?.id ?? 0
}

export async function updateListingCode(
  id: number,
  listingCode: string,
  executor: DbClient = db
): Promise<boolean> {
  const result = await executor
    .update(listings)
    .set({ listingCode })
    .where(eq(listings.id, id))
    .run()
  const changes = (result as { changes?: number } | undefined)?.changes ?? 0
  return changes > 0
}

export async function deleteListing(id: number, executor: DbClient = db): Promise<boolean> {
  const result = await executor.delete(listings).where(eq(listings.id, id)).run()
  const changes = (result as { changes?: number } | undefined)?.changes ?? 0
  return changes > 0
}

export async function upsertListingShop(
  {
    listingId,
    shopId,
    title,
    description,
  }: { listingId: number; shopId: number; title: string | null; description: string | null },
  executor: DbClient = db
) {
  const existing = await executor
    .select({ id: listingShops.id })
    .from(listingShops)
    .where(and(eq(listingShops.listingId, listingId), eq(listingShops.shopId, shopId)))
    .limit(1)

  if (existing.length) {
    await executor
      .update(listingShops)
      .set({ title, description })
      .where(and(eq(listingShops.listingId, listingId), eq(listingShops.shopId, shopId)))
      .run()
    return
  }

  await executor.insert(listingShops).values({ listingId, shopId, title, description }).run()
}

export async function deleteListingShop(
  listingId: number,
  shopId: number,
  executor: DbClient = db
): Promise<boolean> {
  const result = await executor
    .delete(listingShops)
    .where(and(eq(listingShops.listingId, listingId), eq(listingShops.shopId, shopId)))
    .run()
  const changes = (result as { changes?: number } | undefined)?.changes ?? 0
  return changes > 0
}

export async function addListingProduct(
  {
    listingId,
    productSku,
    position,
    role,
  }: { listingId: number; productSku: string; position?: number; role?: string },
  executor: DbClient = db
): Promise<boolean> {
  try {
    await executor
      .insert(listingProducts)
      .values({
        listingId,
        productSku,
        position: typeof position === 'number' ? position : undefined,
        role: role ?? undefined,
      })
      .run()
    return true
  } catch {
    return false
  }
}

export async function removeListingProduct(
  listingId: number,
  productSku: string,
  executor: DbClient = db
): Promise<boolean> {
  const result = await executor
    .delete(listingProducts)
    .where(and(eq(listingProducts.listingId, listingId), eq(listingProducts.productSku, productSku)))
    .run()
  const changes = (result as { changes?: number } | undefined)?.changes ?? 0
  return changes > 0
}

export async function listListingCodesByProductSku(
  executor: DbClient = db
): Promise<ProductListingCode[]> {
  const rows = await executor
    .select({
      productSku: listingProducts.productSku,
      listingId: listingProducts.listingId,
      listingCode: listings.listingCode,
    })
    .from(listingProducts)
    .innerJoin(listings, eq(listingProducts.listingId, listings.id))
    .orderBy(listingProducts.productSku, listings.listingCode)

  return rows
}

export async function listShops(executor: DbClient = db) {
  return dbListShops(executor)
}
