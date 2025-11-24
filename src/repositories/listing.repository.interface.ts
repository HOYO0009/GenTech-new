import { DbClient } from '../db/connection.db'
import type { ListingWithRelations, ProductListingCode } from '../db/listings.db'
import type { Listing } from '../db/schema.db'
import type { ShopSummary } from '../db/products.db'

export interface IListingRepository {
  listListingsWithRelations(executor?: DbClient): Promise<ListingWithRelations[]>
  getListingWithRelations(id: number, executor?: DbClient): Promise<ListingWithRelations | null>
  getListingById(id: number, executor?: DbClient): Promise<Listing | null>
  getListingByCode(code: string, executor?: DbClient): Promise<Listing | null>
  insertListing(listingCode: string, executor?: DbClient): Promise<number>
  updateListingCode(id: number, listingCode: string, executor?: DbClient): Promise<boolean>
  deleteListing(id: number, executor?: DbClient): Promise<boolean>
  upsertListingShop(
    args: { listingId: number; shopId: number; title: string | null; description: string | null },
    executor?: DbClient
  ): Promise<void>
  deleteListingShop(listingId: number, shopId: number, executor?: DbClient): Promise<boolean>
  addListingProduct(
    args: { listingId: number; productSku: string; position?: number; role?: string },
    executor?: DbClient
  ): Promise<boolean>
  removeListingProduct(listingId: number, productSku: string, executor?: DbClient): Promise<boolean>
  listListingCodesByProductSku(executor?: DbClient): Promise<ProductListingCode[]>
  listShops(executor?: DbClient): Promise<ShopSummary[]>
}
