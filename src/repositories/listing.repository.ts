import { IListingRepository } from './listing.repository.interface'
import { DbClient } from '../db/connection.db'
import {
  addListingProduct as dbAddListingProduct,
  deleteListing as dbDeleteListing,
  deleteListingShop as dbDeleteListingShop,
  getListingByCode as dbGetListingByCode,
  getListingById as dbGetListingById,
  getListingWithRelations as dbGetListingWithRelations,
  insertListing as dbInsertListing,
  listListingCodesByProductSku as dbListListingCodesByProductSku,
  listListingsWithRelations as dbListListingsWithRelations,
  listShops as dbListShops,
  removeListingProduct as dbRemoveListingProduct,
  updateListingCode as dbUpdateListingCode,
  upsertListingShop as dbUpsertListingShop,
} from '../db/listings.db'
import type { ListingWithRelations, ProductListingCode } from '../db/listings.db'
import type { Listing } from '../db/schema.db'
import type { ShopSummary } from '../db/products.db'

export class ListingRepository implements IListingRepository {
  async listListingsWithRelations(executor?: DbClient): Promise<ListingWithRelations[]> {
    return dbListListingsWithRelations(executor)
  }

  async getListingWithRelations(id: number, executor?: DbClient): Promise<ListingWithRelations | null> {
    return dbGetListingWithRelations(id, executor)
  }

  async getListingById(id: number, executor?: DbClient): Promise<Listing | null> {
    return dbGetListingById(id, executor)
  }

  async getListingByCode(code: string, executor?: DbClient): Promise<Listing | null> {
    return dbGetListingByCode(code, executor)
  }

  async insertListing(listingCode: string, executor?: DbClient): Promise<number> {
    return dbInsertListing(listingCode, executor)
  }

  async updateListingCode(id: number, listingCode: string, executor?: DbClient): Promise<boolean> {
    return dbUpdateListingCode(id, listingCode, executor)
  }

  async deleteListing(id: number, executor?: DbClient): Promise<boolean> {
    return dbDeleteListing(id, executor)
  }

  async upsertListingShop(
    args: { listingId: number; shopId: number; title: string | null; description: string | null },
    executor?: DbClient
  ): Promise<void> {
    return dbUpsertListingShop(args, executor)
  }

  async deleteListingShop(listingId: number, shopId: number, executor?: DbClient): Promise<boolean> {
    return dbDeleteListingShop(listingId, shopId, executor)
  }

  async addListingProduct(
    args: { listingId: number; productSku: string; position?: number; role?: string },
    executor?: DbClient
  ): Promise<boolean> {
    return dbAddListingProduct(args, executor)
  }

  async removeListingProduct(
    listingId: number,
    productSku: string,
    executor?: DbClient
  ): Promise<boolean> {
    return dbRemoveListingProduct(listingId, productSku, executor)
  }

  async listListingCodesByProductSku(executor?: DbClient): Promise<ProductListingCode[]> {
    return dbListListingCodesByProductSku(executor)
  }

  async listShops(executor?: DbClient): Promise<ShopSummary[]> {
    return dbListShops(executor)
  }
}
