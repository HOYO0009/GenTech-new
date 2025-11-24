import { escapeHtml } from '../domain/formatters.domain'
import { ServiceResult, errorResult, successResult, ErrorMessages, SuccessMessages } from '../domain/results.domain'
import { ListingRepository } from '../repositories/listing.repository'
import { IListingRepository } from '../repositories/listing.repository.interface'
import { ProductRepository } from '../repositories/product.repository'
import { IProductRepository } from '../repositories/product.repository.interface'
import type { ListingWithRelations } from '../db/listings.db'
import type { ShopSummary } from '../db/products.db'
import { db } from '../db/connection.db'
import { recordChange } from './changeLogs.service'

export type ListingShopView = {
  shopId: number
  shopName: string
  shopCode: string
  title: string
  titleRaw: string | null
  description: string
  descriptionRaw: string | null
}

export type ListingProductView = {
  sku: string
  skuRaw: string
  name: string | null
  nameRaw: string | null
}

export type ListingItem = {
  id: number
  listingCode: string
  listingCodeRaw: string
  shops: ListingShopView[]
  products: ListingProductView[]
}

export type ShopOption = {
  id: number
  name: string
  code: string
}

export type ProductOption = {
  sku: string
  name: string
}

export interface ListingsPagePayload {
  listings: ListingItem[]
  shops: ShopOption[]
  products: ProductOption[]
}

export interface ListingCardPayload {
  listing: ListingItem
  shops: ShopOption[]
  products: ProductOption[]
}

const sanitizeShopOption = (shop: ShopSummary): ShopOption => ({
  id: shop.id,
  name: escapeHtml(shop.name),
  code: escapeHtml(shop.code),
})

const sanitizeListing = (listing: ListingWithRelations): ListingItem => ({
  id: listing.id,
  listingCode: escapeHtml(listing.listingCode),
  listingCodeRaw: listing.listingCode,
  shops: listing.shops.map((entry) => ({
    shopId: entry.shopId,
    shopName: escapeHtml(entry.shopName),
    shopCode: escapeHtml(entry.shopCode),
    title: entry.title ? escapeHtml(entry.title) : '',
    titleRaw: entry.title ?? null,
    description: entry.description ? escapeHtml(entry.description) : '',
    descriptionRaw: entry.description ?? null,
  })),
  products: listing.products.map((entry) => ({
    sku: escapeHtml(entry.productSku),
    skuRaw: entry.productSku,
    name: entry.productName ? escapeHtml(entry.productName) : null,
    nameRaw: entry.productName ?? null,
  })),
})

export class ListingService {
  constructor(
    private listingRepository: IListingRepository,
    private productRepository: IProductRepository
  ) {}

  async getListingsPagePayload(): Promise<ListingsPagePayload> {
    const [listings, shops, products] = await Promise.all([
      this.listingRepository.listListingsWithRelations(),
      this.listingRepository.listShops(),
      this.productRepository.listProducts(),
    ])

    return {
      listings: listings.map(sanitizeListing),
      shops: shops.map(sanitizeShopOption),
      products: products.map((product) => ({
        sku: escapeHtml(product.sku),
        name: escapeHtml(product.name),
      })),
    }
  }

  async getListingCardPayload(id: number): Promise<ListingCardPayload | null> {
    if (!Number.isInteger(id) || id <= 0) return null
    const [listing, shops, products] = await Promise.all([
      this.listingRepository.getListingWithRelations(id),
      this.listingRepository.listShops(),
      this.productRepository.listProducts(),
    ])
    if (!listing) return null
    return {
      listing: sanitizeListing(listing),
      shops: shops.map(sanitizeShopOption),
      products: products.map((product) => ({
        sku: escapeHtml(product.sku),
        name: escapeHtml(product.name),
      })),
    }
  }

  async createListing({ listingCode }: { listingCode: string }): Promise<ServiceResult> {
    const trimmedCode = listingCode.trim()
    if (!trimmedCode) {
      return errorResult(ErrorMessages.REQUIRED_FIELD('Listing code'))
    }

    const existing = await this.listingRepository.getListingByCode(trimmedCode)
    if (existing) {
      return errorResult(ErrorMessages.ALREADY_EXISTS('Listing code'))
    }

    try {
      const insertedId = await db.transaction(async (tx) => {
        const id = await this.listingRepository.insertListing(trimmedCode, tx)
        await recordChange(
          {
            tableName: 'listings',
            action: 'INSERT',
            description: `Listing ${trimmedCode} created`,
            payload: { id, listingCode: trimmedCode },
            source: 'listings/create',
          },
          tx
        )
        return id
      })

      if (!insertedId) {
        return errorResult(ErrorMessages.UNABLE_TO_CREATE('listing'), 500)
      }
    } catch (error) {
      console.error('Unable to create listing', error)
      return errorResult(ErrorMessages.UNABLE_TO_CREATE('listing'), 500)
    }

    return successResult(SuccessMessages.CREATED('Listing'))
  }

  async updateListing({
    id,
    listingCode,
    shopDetails = [],
  }: {
    id: number
    listingCode: string
    shopDetails?: Array<{ shopId: number; title: string; description: string }>
  }): Promise<ServiceResult> {
    if (!Number.isInteger(id) || id <= 0) {
      return errorResult(ErrorMessages.INVALID_SELECTION('listing'))
    }
    const trimmedCode = listingCode.trim()
    if (!trimmedCode) {
      return errorResult(ErrorMessages.REQUIRED_FIELD('Listing code'))
    }

    const existing = await this.listingRepository.getListingWithRelations(id)
    if (!existing) {
      return errorResult(ErrorMessages.NOT_FOUND('Listing'), 404)
    }

    const duplicate = await this.listingRepository.getListingByCode(trimmedCode)
    if (duplicate && duplicate.id !== id) {
      return errorResult(ErrorMessages.ALREADY_EXISTS('Listing code'))
    }

    const shopsMap = new Map(existing.shops.map((s) => [s.shopId, s]))
    const normalizedShopDetails = shopDetails
      .map((detail) => ({
        shopId: detail.shopId,
        title: (detail.title ?? '').trim(),
        description: (detail.description ?? '').trim(),
      }))
      .filter((entry) => Number.isInteger(entry.shopId) && entry.shopId > 0)

    const hasShopChanges = normalizedShopDetails.some((detail) => {
      const current = shopsMap.get(detail.shopId)
      const currentTitle = current?.title ?? ''
      const currentDesc = current?.description ?? ''
      return currentTitle !== detail.title || currentDesc !== detail.description
    })

    const codeChanged = existing.listingCode !== trimmedCode

    if (!codeChanged && !hasShopChanges) {
      return successResult(ErrorMessages.NO_CHANGES)
    }

    let updated = false
    try {
      updated = await db.transaction(async (tx) => {
        if (codeChanged) {
          const success = await this.listingRepository.updateListingCode(id, trimmedCode, tx)
          if (!success) return false
        }

        for (const detail of normalizedShopDetails) {
          await this.listingRepository.upsertListingShop(
            {
              listingId: id,
              shopId: detail.shopId,
              title: detail.title || null,
              description: detail.description || null,
            },
            tx
          )
        }
        const changedFields: string[] = []
        if (codeChanged) changedFields.push('Listing code')
        if (hasShopChanges) changedFields.push('Shop details')
        console.debug('=== Listing Update Debug ===')
        console.debug('Existing:', JSON.stringify({
          listingCode: existing.listingCode,
          shops: existing.shops.map((s) => ({ id: s.shopId, title: s.titleRaw ?? '', description: s.descriptionRaw ?? '' })),
        }, null, 2))
        console.debug('Incoming:', JSON.stringify({
          listingCode: trimmedCode,
          shops: normalizedShopDetails,
        }, null, 2))
        console.debug('Changed fields:', changedFields)

        await recordChange(
          {
            tableName: 'listings',
            action: 'UPDATE',
            description: codeChanged
              ? `Listing ${existing.listingCode} updated to ${trimmedCode}`
              : `Listing ${existing.listingCode} details updated`,
            payload: { id, listingCode: trimmedCode, shops: normalizedShopDetails.map((s) => s.shopId) },
            source: 'listings/update',
          },
          tx
        )
        return true
      })
    } catch (error) {
      console.error('Unable to update listing', error)
      return errorResult(ErrorMessages.UNABLE_TO_SAVE('listing'), 500)
    }

    if (!updated) {
      return errorResult(ErrorMessages.UNABLE_TO_SAVE('listing'), 500)
    }

    const changedFields: string[] = []
    if (codeChanged) changedFields.push('Listing code')
    if (hasShopChanges) changedFields.push('Shop details')

    return {
      ...successResult(SuccessMessages.UPDATED('Listing')),
      subject: trimmedCode,
      details: changedFields,
    }
  }

  async deleteListing({ id, confirmation }: { id: number; confirmation: string }): Promise<ServiceResult> {
    if (!Number.isInteger(id) || id <= 0) {
      return errorResult(ErrorMessages.INVALID_SELECTION('listing'))
    }

    const existing = await this.listingRepository.getListingById(id)
    if (!existing) {
      return errorResult(ErrorMessages.NOT_FOUND('Listing'), 404)
    }

    const trimmed = confirmation.trim()
    if (!trimmed || trimmed !== existing.listingCode) {
      return errorResult('Confirmation does not match listing code.')
    }

    let deleted = false
    try {
      deleted = await db.transaction(async (tx) => {
        const success = await this.listingRepository.deleteListing(id, tx)
        if (!success) return false
        await recordChange(
          {
            tableName: 'listings',
            action: 'DELETE',
            description: `Listing ${existing.listingCode} deleted`,
            payload: { id, listingCode: existing.listingCode },
            source: 'listings/delete',
          },
          tx
        )
        return true
      })
    } catch (error) {
      console.error('Unable to delete listing', error)
      return errorResult(ErrorMessages.UNABLE_TO_DELETE('listing'), 500)
    }

    if (!deleted) {
      return errorResult(ErrorMessages.UNABLE_TO_DELETE('listing'), 500)
    }

    return {
      ...successResult(SuccessMessages.DELETED('Listing')),
      subject: existing.listingCode,
      details: ['Deleted'],
    }
  }

  async saveListingShop({
    listingId,
    shopId,
    title,
    description,
  }: {
    listingId: number
    shopId: number
    title: string
    description: string
  }): Promise<ServiceResult> {
    if (!Number.isInteger(listingId) || listingId <= 0) {
      return errorResult(ErrorMessages.INVALID_SELECTION('listing'))
    }
    if (!Number.isInteger(shopId) || shopId <= 0) {
      return errorResult(ErrorMessages.INVALID_SELECTION('shop'))
    }

    const [listing, shops] = await Promise.all([
      this.listingRepository.getListingById(listingId),
      this.listingRepository.listShops(),
    ])
    if (!listing) {
      return errorResult(ErrorMessages.NOT_FOUND('Listing'), 404)
    }
    const shop = shops.find((entry) => entry.id === shopId)
    if (!shop) {
      return errorResult(ErrorMessages.INVALID_SELECTION('shop'))
    }

    const normalizedTitle = title.trim() || null
    const normalizedDescription = description.trim() || null

    try {
      await db.transaction(async (tx) => {
        await this.listingRepository.upsertListingShop(
          {
            listingId,
            shopId,
            title: normalizedTitle,
            description: normalizedDescription,
          },
          tx
        )
        await recordChange(
          {
            tableName: 'listing_shops',
            action: 'UPSERT',
            description: `Listing ${listing.listingCode} details saved for ${shop.name}`,
            payload: {
              listingId,
              shopId,
              title: normalizedTitle,
              description: normalizedDescription,
            },
            source: 'listings/shops/upsert',
          },
          tx
        )
      })
    } catch (error) {
      console.error('Unable to save listing shop details', error)
      return errorResult(ErrorMessages.UNABLE_TO_SAVE('listing details'), 500)
    }

    return successResult(SuccessMessages.SAVED('Listing details'))
  }

  async deleteListingShop(listingId: number, shopId: number): Promise<ServiceResult> {
    if (!Number.isInteger(listingId) || listingId <= 0) {
      return errorResult(ErrorMessages.INVALID_SELECTION('listing'))
    }
    if (!Number.isInteger(shopId) || shopId <= 0) {
      return errorResult(ErrorMessages.INVALID_SELECTION('shop'))
    }

    const [listing, shops] = await Promise.all([
      this.listingRepository.getListingById(listingId),
      this.listingRepository.listShops(),
    ])
    if (!listing) {
      return errorResult(ErrorMessages.NOT_FOUND('Listing'), 404)
    }
    const shop = shops.find((entry) => entry.id === shopId)
    if (!shop) {
      return errorResult(ErrorMessages.INVALID_SELECTION('shop'))
    }

    let deleted = false
    try {
      deleted = await db.transaction(async (tx) => {
        const success = await this.listingRepository.deleteListingShop(listingId, shopId, tx)
        if (!success) return false
        await recordChange(
          {
            tableName: 'listing_shops',
            action: 'DELETE',
            description: `Listing ${listing.listingCode} shop ${shop.name} removed`,
            payload: { listingId, shopId },
            source: 'listings/shops/delete',
          },
          tx
        )
        return true
      })
    } catch (error) {
      console.error('Unable to delete listing shop record', error)
      return errorResult(ErrorMessages.UNABLE_TO_DELETE('listing details'), 500)
    }

    if (!deleted) {
      return errorResult(ErrorMessages.UNABLE_TO_DELETE('listing details'), 500)
    }

    return {
      ...successResult(SuccessMessages.DELETED('Listing details')),
      subject: listing.listingCode,
      details: ['Deleted'],
    }
  }

  async addListingSku({
    listingId,
    productSku,
  }: {
    listingId: number
    productSku: string
  }): Promise<ServiceResult> {
    if (!Number.isInteger(listingId) || listingId <= 0) {
      return errorResult(ErrorMessages.INVALID_SELECTION('listing'))
    }
    const trimmedSku = productSku.trim()
    if (!trimmedSku) {
      return errorResult(ErrorMessages.REQUIRED_FIELD('SKU'))
    }

    const [listing, product] = await Promise.all([
      this.listingRepository.getListingById(listingId),
      this.productRepository.getProductBySku(trimmedSku),
    ])
    if (!listing) {
      return errorResult(ErrorMessages.NOT_FOUND('Listing'), 404)
    }
    if (!product) {
      return errorResult(ErrorMessages.NOT_FOUND('Product'), 404)
    }

    let added = false
    try {
      added = await db.transaction(async (tx) => {
        const success = await this.listingRepository.addListingProduct(
          { listingId, productSku: trimmedSku },
          tx
        )
        if (!success) return false
        await recordChange(
          {
            tableName: 'listing_products',
            action: 'INSERT',
            description: `SKU ${trimmedSku} linked to listing ${listing.listingCode}`,
            payload: { listingId, productSku: trimmedSku },
            source: 'listings/sku/add',
          },
          tx
        )
        return true
      })
    } catch (error) {
      console.error('Unable to link SKU to listing', error)
      return errorResult(ErrorMessages.UNABLE_TO_SAVE('listing'), 500)
    }

    if (!added) {
      return errorResult('SKU already linked to this listing? Please verify and try again.', 400)
    }

    return {
      ...successResult(SuccessMessages.SAVED('Listing')),
      subject: `${listing.listingCode} / ${trimmedSku}`,
    }
  }

  async removeListingSku({
    listingId,
    productSku,
  }: {
    listingId: number
    productSku: string
  }): Promise<ServiceResult> {
    if (!Number.isInteger(listingId) || listingId <= 0) {
      return errorResult(ErrorMessages.INVALID_SELECTION('listing'))
    }
    const trimmedSku = productSku.trim()
    if (!trimmedSku) {
      return errorResult(ErrorMessages.REQUIRED_FIELD('SKU'))
    }

    const listing = await this.listingRepository.getListingById(listingId)
    if (!listing) {
      return errorResult(ErrorMessages.NOT_FOUND('Listing'), 404)
    }

    let removed = false
    try {
      removed = await db.transaction(async (tx) => {
        const success = await this.listingRepository.removeListingProduct(listingId, trimmedSku, tx)
        if (!success) return false
        await recordChange(
          {
            tableName: 'listing_products',
            action: 'DELETE',
            description: `SKU ${trimmedSku} unlinked from listing ${listing.listingCode}`,
            payload: { listingId, productSku: trimmedSku },
            source: 'listings/sku/delete',
          },
          tx
        )
        return true
      })
    } catch (error) {
      console.error('Unable to unlink SKU from listing', error)
      return errorResult(ErrorMessages.UNABLE_TO_DELETE('listing link'), 500)
    }

    if (!removed) {
      return errorResult(ErrorMessages.UNABLE_TO_DELETE('listing link'), 500)
    }

    return {
      ...successResult(SuccessMessages.DELETED('Listing link')),
      subject: `${listing.listingCode} / ${trimmedSku}`,
      details: ['Deleted'],
    }
  }
}

const defaultListingService = new ListingService(new ListingRepository(), new ProductRepository())

export async function getListingsPagePayload(): Promise<ListingsPagePayload> {
  return defaultListingService.getListingsPagePayload()
}

export async function getListingCardPayload(id: number): Promise<ListingCardPayload | null> {
  return defaultListingService.getListingCardPayload(id)
}

export async function createListing(args: { listingCode: string }): Promise<ServiceResult> {
  return defaultListingService.createListing(args)
}

export async function updateListing(args: {
  id: number
  listingCode: string
  shopDetails?: Array<{ shopId: number; title: string; description: string }>
}): Promise<ServiceResult> {
  return defaultListingService.updateListing(args)
}

export async function deleteListing(id: number): Promise<ServiceResult> {
  return defaultListingService.deleteListing(id)
}

export async function saveListingShop(args: {
  listingId: number
  shopId: number
  title: string
  description: string
}): Promise<ServiceResult> {
  return defaultListingService.saveListingShop(args)
}

export async function deleteListingShop(listingId: number, shopId: number): Promise<ServiceResult> {
  return defaultListingService.deleteListingShop(listingId, shopId)
}

export async function addListingSku(args: { listingId: number; productSku: string }): Promise<ServiceResult> {
  return defaultListingService.addListingSku(args)
}

export async function removeListingSku(
  args: { listingId: number; productSku: string }
): Promise<ServiceResult> {
  return defaultListingService.removeListingSku(args)
}
