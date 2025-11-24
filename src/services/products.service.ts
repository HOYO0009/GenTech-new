import { recordChange } from './changeLogs.service'
import { FieldChangeDetector, FieldCheck } from '../domain/detectors.domain'
import { normalizeNullableText } from '../domain/normalizers.domain'
import { deleteWithConfirmation, DeleteWithConfirmationOptions } from '../domain/delete.domain'
import { createChangeService } from '../domain/changeService.domain'
import { ServiceResult, errorResult, successResult, ErrorMessages, SuccessMessages } from '../domain/results.domain'
import { db } from '../db/connection.db'
import { ProductSummary } from '../db/products.db'
import { IProductRepository } from '../repositories/product.repository.interface'
import { ProductRepository } from '../repositories/product.repository'
import { ListingRepository } from '../repositories/listing.repository'
import { IListingRepository } from '../repositories/listing.repository.interface'
import { ProductTransformationService } from './productTransformation.service'
import type {
  ProductCard,
  ProductStatusOption,
  SupplierOption,
  ProductShopPrice,
  ShopOption,
} from './productTransformation.service'
import { ProductSearchService } from './productSearch.service'
import type { ProductSearchSortOptions } from './productSearch.service'
import type { ProductSortOption } from '../domain/strategies/productSort.strategy'

export type {
  ProductCard,
  ProductStatusOption,
  SupplierOption,
  ProductShopPrice,
  ShopOption,
  ProductSearchSortOptions,
  ProductSortOption,
}

export interface ProductPagePayload {
  products: ProductCard[]
  statuses: ProductStatusOption[]
  suppliers: SupplierOption[]
  shops: ShopOption[]
}

export interface ProductUpdateArgs {
  originalSku: string
  sku: string
  name: string
  requestedStatusId: number
  costCents: number | null
  purchaseRemarks: string
  supplierId: number | null
  supplierLink: string
  imageUrl: string | null
  shopIds: number[]
  shopPricing?: ProductShopPricingUpdate[]
}

export type ProductUpdateResult = ServiceResult

export interface ProductCreateArgs {
  sku: string
  name: string
  requestedStatusId: number
  costCents: number | null
  purchaseRemarks: string
  supplierId: number | null
  supplierLink: string
  imageUrl: string | null
  shopIds: number[]
}

export type ProductCreateResult = ServiceResult

export interface ProductDeleteArgs {
  sku: string
  confirmation: string
}

export type ProductDeleteResult = ServiceResult

export interface ProductPricingUpdateArgs {
  productSku: string
  shopId: number
  sellPriceCents: number | null
  moq: number | null
  competitorPriceCents: number | null
  competitorLink: string | null
}

export interface ProductShopPricingUpdate {
  shopId: number
  sellPriceCents: number | null
  competitorPriceCents: number | null
  competitorLink: string | null
  moq: number | null
}

type ProductChangeSnapshot = {
  sku: string
  name: string
  statusId: number
  cost: number | null
  purchaseRemarks: string | null
  supplierId: number | null
  supplierLink: string | null
  imageUrl: string | null
  shopIds: number[]
  pricing?: Array<{
    shopId: number
    sellPriceCents: number | null
    competitorPriceCents: number | null
    competitorLink: string | null
    moq: number | null
  }>
}

const productChangeLabels: Record<keyof ProductChangeSnapshot, string> = {
  sku: 'SKU',
  name: 'Name',
  statusId: 'Status',
  cost: 'Cost',
  purchaseRemarks: 'Purchase remarks',
  supplierId: 'Supplier',
  supplierLink: 'Supplier link',
  imageUrl: 'Image',
  shopIds: 'Stores',
  pricing: 'Pricing',
}

const compareNumberSets = (a: number[], b: number[]) => {
  if (a.length !== b.length) return false
  const aSorted = [...a].sort((x, y) => x - y)
  const bSorted = [...b].sort((x, y) => x - y)
  return aSorted.every((value, index) => value === bSorted[index])
}

const comparePricingArrays = (
  a: ProductChangeSnapshot['pricing'],
  b: ProductChangeSnapshot['pricing']
): boolean => {
  const aList = (a ?? []).slice().sort((x, y) => x.shopId - y.shopId)
  const bList = (b ?? []).slice().sort((x, y) => x.shopId - y.shopId)
  if (aList.length !== bList.length) return false
  for (let i = 0; i < aList.length; i += 1) {
    const aItem = aList[i]
    const bItem = bList[i]
    if (
      aItem.shopId !== bItem.shopId ||
      aItem.sellPriceCents !== bItem.sellPriceCents ||
      aItem.competitorPriceCents !== bItem.competitorPriceCents ||
      (aItem.competitorLink || null) !== (bItem.competitorLink || null) ||
      (aItem.moq ?? null) !== (bItem.moq ?? null)
    ) {
      return false
    }
  }
  return true
}

const productChangeFields: FieldCheck<ProductChangeSnapshot, ProductChangeSnapshot>[] = [
  { existingKey: 'sku', incomingKey: 'sku' },
  { existingKey: 'name', incomingKey: 'name' },
  { existingKey: 'statusId', incomingKey: 'statusId' },
  { existingKey: 'cost', incomingKey: 'cost' },
  { existingKey: 'purchaseRemarks', incomingKey: 'purchaseRemarks' },
  { existingKey: 'supplierId', incomingKey: 'supplierId' },
  { existingKey: 'supplierLink', incomingKey: 'supplierLink' },
  { existingKey: 'imageUrl', incomingKey: 'imageUrl' },
  { existingKey: 'shopIds', incomingKey: 'shopIds', comparator: compareNumberSets },
  { existingKey: 'pricing', incomingKey: 'pricing', comparator: comparePricingArrays },
]

export const productSnapshotFromArgs = (args: ProductUpdateArgs): ProductChangeSnapshot => ({
  sku: args.sku.trim(),
  name: args.name.trim(),
  statusId: args.requestedStatusId,
  cost: args.costCents ?? null,
  purchaseRemarks: normalizeNullableText(args.purchaseRemarks),
  supplierId: args.supplierId ?? null,
  supplierLink: normalizeNullableText(args.supplierLink),
  imageUrl: normalizeNullableText(args.imageUrl),
  shopIds: [...new Set(args.shopIds)].sort((a, b) => a - b),
  pricing: (args.shopPricing ?? []).map((entry) => ({
    shopId: entry.shopId,
    sellPriceCents: entry.sellPriceCents ?? null,
    competitorPriceCents: entry.competitorPriceCents ?? null,
    competitorLink: normalizeNullableText(entry.competitorLink),
    moq: Number.isInteger(entry.moq) && entry.moq !== null ? entry.moq : null,
  })),
})

export const productHasChanges = (
  existing: ProductChangeSnapshot,
  incoming: ProductChangeSnapshot
) => new FieldChangeDetector(existing, incoming, productChangeFields).hasChanges()

export class ProductService {
  constructor(
    private repository: IProductRepository,
    private transformationService: ProductTransformationService,
    private searchService: ProductSearchService,
    private listingRepository: IListingRepository
  ) {}

  async getProductPagePayload(options?: ProductSearchSortOptions): Promise<ProductPagePayload> {
    const [products, statuses, suppliers, pricing, shops, listingLinks] = await Promise.all([
      this.repository.listProducts(),
      this.repository.listProductStatuses(),
      this.repository.listSuppliers(),
      this.repository.listProductPricing(),
      this.repository.listShops(),
      this.listingRepository.listListingCodesByProductSku(),
    ])

    const listingMap = listingLinks.reduce((map, entry) => {
      const list = map.get(entry.productSku) ?? []
      list.push(entry.listingCode)
      map.set(entry.productSku, list)
      return map
    }, new Map<string, string[]>())
    for (const list of listingMap.values()) {
      list.sort((a, b) => a.localeCompare(b))
    }

    const transformedProducts = this.transformationService.transformProducts(products, pricing, listingMap)
    const sortedProducts = this.searchService.applySearchSortFilter(transformedProducts, options)

    return {
      products: sortedProducts,
      statuses: this.transformationService.transformStatuses(statuses),
      suppliers: this.transformationService.transformSuppliers(suppliers),
      shops: this.transformationService.transformShops(shops),
    }
  }

  async updateProductDetails({
    originalSku,
    sku,
    name,
    requestedStatusId,
    costCents,
  purchaseRemarks,
  supplierId,
  supplierLink,
  imageUrl,
  shopIds,
  shopPricing,
}: ProductUpdateArgs): Promise<ProductUpdateResult> {
    const trimmedOriginalSku = originalSku.trim()
    const trimmedSku = sku.trim()
    const trimmedName = name.trim()

    if (!trimmedOriginalSku || !trimmedSku || !trimmedName) {
      return errorResult('SKU and name are required.', 400)
    }

    const existingProduct = await this.repository.getProductBySku(trimmedOriginalSku)
    if (!existingProduct) {
      return errorResult(ErrorMessages.NOT_FOUND('Product'), 404)
    }

    const statuses = await this.repository.listProductStatuses()
    if (!statuses.length) {
      return errorResult('Status configuration missing.', 500)
    }

    const shops = await this.repository.listShops()
    const validShopIds = new Set(shops.map((shop) => shop.id))
    const normalizedIncomingShopIds = [...new Set((shopIds ?? []).filter((id) => validShopIds.has(id)))].sort(
      (a, b) => a - b
    )
    const normalizedPricingUpdates: ProductShopPricingUpdate[] = (shopPricing ?? [])
      .filter((entry) => validShopIds.has(entry.shopId))
      .map((entry) => ({
        shopId: entry.shopId,
        sellPriceCents: entry.sellPriceCents ?? null,
        competitorPriceCents: entry.competitorPriceCents ?? null,
        competitorLink: normalizeNullableText(entry.competitorLink),
        moq: Number.isInteger(entry.moq) && entry.moq !== null ? entry.moq : null,
      }))

    const validStatus = statuses.find(({ id }) => id === requestedStatusId) ?? statuses[0]

    const normalizedRemarks = purchaseRemarks.trim()
    const normalizedSupplierLink = supplierLink.trim()
    const normalizedRemarksValue = normalizedRemarks || null
    const normalizedSupplierLinkValue = normalizedSupplierLink || null
    const normalizedImageUrl = normalizeNullableText(imageUrl)
    const existingShopIds = await this.repository.listProductShopIds(trimmedOriginalSku)
    const existingPricing = await this.repository.listProductPricing()
    const existingPricingForProduct = existingPricing
      .filter((entry) => entry.productSku === trimmedOriginalSku && validShopIds.has(entry.shopId))
      .map((entry) => ({
        shopId: entry.shopId,
        sellPriceCents: entry.sellPrice ?? null,
        competitorPriceCents: entry.competitorPrice ?? null,
        competitorLink: normalizeNullableText(entry.competitorLink),
        moq: Number.isInteger(entry.moq) ? entry.moq : null,
      }))
      .sort((a, b) => a.shopId - b.shopId)
    const normalizedExistingShopIds = [...new Set(existingShopIds)].sort((a, b) => a - b)
    const normalizedIncomingPricing = [...normalizedPricingUpdates].sort((a, b) => a.shopId - b.shopId)
    const normalizedExistingProduct: ProductChangeSnapshot = {
      sku: existingProduct.sku.trim(),
      name: existingProduct.name.trim(),
      statusId: existingProduct.statusId,
      cost: existingProduct.cost ?? null,
      purchaseRemarks: normalizeNullableText(existingProduct.purchaseRemarks),
      supplierId: existingProduct.supplierId ?? null,
      supplierLink: normalizeNullableText(existingProduct.supplierLink),
      imageUrl: normalizeNullableText(existingProduct.imageUrl),
      shopIds: normalizedExistingShopIds,
      pricing: existingPricingForProduct,
    }
    const normalizedIncomingProduct: ProductChangeSnapshot = {
      sku: trimmedSku,
      name: trimmedName,
      statusId: validStatus.id,
      cost: costCents ?? null,
      purchaseRemarks: normalizedRemarksValue,
      supplierId,
      supplierLink: normalizedSupplierLinkValue,
      imageUrl: normalizedImageUrl,
      shopIds: normalizedIncomingShopIds,
      pricing: normalizedIncomingPricing,
    }
    const changeDetector = new FieldChangeDetector(normalizedExistingProduct, normalizedIncomingProduct, productChangeFields)
    const changedFields = changeDetector.getChangedFields()
    console.log('=== Product Update Debug ===')
    console.log('Existing:', JSON.stringify(normalizedExistingProduct, null, 2))
    console.log('Incoming:', JSON.stringify(normalizedIncomingProduct, null, 2))
    console.log('Changed fields:', changedFields)
    if (!changedFields.length) {
      return successResult(ErrorMessages.NO_CHANGES)
    }
    let updated: boolean
    try {
      updated = await db.transaction(async (tx) => {
        const success = await this.repository.updateProduct(
          {
            originalSku: trimmedOriginalSku,
            newSku: trimmedSku,
            name: trimmedName,
            statusId: validStatus.id,
            cost: costCents,
            purchaseRemarks: normalizedRemarks || null,
            supplierId,
            supplierLink: normalizedSupplierLink || null,
            imageUrl: normalizedImageUrl ?? null,
          },
          tx
        )

        if (!success) {
          return false
        }

        await this.repository.reassignProductPricingSku(trimmedOriginalSku, trimmedSku, tx)

        const toAdd = normalizedIncomingShopIds.filter((id) => !normalizedExistingShopIds.includes(id))
        const toRemove = normalizedExistingShopIds.filter((id) => !normalizedIncomingShopIds.includes(id))

        if (toAdd.length) {
          await this.repository.addProductShops(trimmedSku, toAdd, tx)
        }
        if (toRemove.length) {
          await this.repository.removeProductShops(trimmedSku, toRemove, tx)
        }

        // Apply pricing updates for shops that remain/are added
        const applicablePricing = normalizedPricingUpdates.filter(
          (entry) => normalizedIncomingShopIds.includes(entry.shopId)
        )
        for (const entry of applicablePricing) {
          await this.repository.updateProductPricing(
            {
              productSku: trimmedSku,
              shopId: entry.shopId,
              sellPrice: entry.sellPriceCents,
              moq: entry.moq,
              competitorPrice: entry.competitorPriceCents,
              competitorLink: entry.competitorLink ?? null,
            },
            tx
          )
        }

        await recordChange(
          {
            tableName: 'products',
            action: 'UPDATE',
            description: `SKU ${trimmedOriginalSku} updated to "${trimmedSku}" (status ${validStatus.name})`,
            payload: {
              originalSku: trimmedOriginalSku,
              sku: trimmedSku,
              name: trimmedName,
              statusId: validStatus.id,
              statusName: validStatus.name,
              cost: costCents,
              purchaseRemarks: normalizedRemarks,
              supplierId,
              supplierLink: normalizedSupplierLink,
              imageUrl: normalizedImageUrl,
              shopsAdded: toAdd,
              shopsRemoved: toRemove,
            },
            source: 'products/update',
          },
          tx
        )

        return true
      })
    } catch (error) {
      console.error('Unable to save product update', error)
      return errorResult(ErrorMessages.UNABLE_TO_SAVE('product'), 500)
    }

    if (!updated) {
      return errorResult(ErrorMessages.NOT_FOUND('Product'), 404)
    }

    const changedFieldLabels = changedFields
      .map((field) => productChangeLabels[field])
      .filter(Boolean)

    return {
      ...successResult(SuccessMessages.SAVED('Product')),
      subject: `SKU ${trimmedSku}`,
      details: changedFieldLabels,
    }
  }

  async createProduct({
    sku,
    name,
    requestedStatusId,
    costCents,
  purchaseRemarks,
  supplierLink,
  supplierId,
  imageUrl,
  shopIds,
}: ProductCreateArgs): Promise<ProductCreateResult> {
    const trimmedSku = sku.trim()
    const trimmedName = name.trim()

    if (!trimmedSku || !trimmedName) {
      return errorResult('SKU and name are required.', 400)
    }

    const statuses = await this.repository.listProductStatuses()
    if (!statuses.length) {
      return errorResult('Status configuration missing.', 500)
    }

    const shops = await this.repository.listShops()
    const validShopIds = new Set(shops.map((shop) => shop.id))
    const normalizedShopIds = [...new Set((shopIds ?? []).filter((id) => validShopIds.has(id)))].sort((a, b) => a - b)

    const validStatus = statuses.find(({ id }) => id === requestedStatusId) ?? statuses[0]

    const existingProduct = await this.repository.getProductBySku(trimmedSku)
    if (existingProduct) {
      return errorResult(ErrorMessages.ALREADY_EXISTS('SKU'), 400)
    }

    const existingName = await this.repository.getProductByName(trimmedName)
    if (existingName) {
      return errorResult('Product name already exists.', 400)
    }

    const normalizedRemarks = normalizeNullableText(purchaseRemarks)
    const normalizedLink = normalizeNullableText(supplierLink)
    const normalizedImageUrl = normalizeNullableText(imageUrl)

    try {
      await db.transaction(async (tx) => {
        await this.repository.insertProduct(
          {
            sku: trimmedSku,
            name: trimmedName,
            statusId: validStatus.id,
            cost: costCents,
            purchaseRemarks: normalizedRemarks ?? null,
            supplierId,
            supplierLink: normalizedLink ?? null,
            imageUrl: normalizedImageUrl ?? null,
          },
          tx
        )

        await recordChange(
          {
            tableName: 'products',
            action: 'INSERT',
            description: `New product ${trimmedSku} (${trimmedName}) added`,
            payload: {
              sku: trimmedSku,
              name: trimmedName,
              statusId: validStatus.id,
              statusName: validStatus.name,
              cost: costCents,
              purchaseRemarks: normalizedRemarks,
              supplierId,
              supplierLink: normalizedLink,
              imageUrl: normalizedImageUrl,
              shops: normalizedShopIds,
            },
            source: 'products/create',
          },
          tx
        )

        if (normalizedShopIds.length) {
          await this.repository.addProductShops(trimmedSku, normalizedShopIds, tx)
        }
      })
    } catch (error) {
      const message = (error as Error)?.message ?? ErrorMessages.UNABLE_TO_CREATE('product')
      if (message.includes('UNIQUE constraint failed: products.sku')) {
        return errorResult(ErrorMessages.ALREADY_EXISTS('SKU'), 400)
      }
      console.error('Unable to create product', error)
      return errorResult(ErrorMessages.UNABLE_TO_CREATE('product'), 500)
    }

    return successResult('Product added.')
  }

  async deleteProduct({ sku, confirmation }: ProductDeleteArgs): Promise<ProductDeleteResult> {
    const trimmedSku = sku.trim()
    if (!trimmedSku) {
      return errorResult('SKU is required to delete.', 400)
    }
    let result: ProductDeleteResult
    try {
      result = await db.transaction(async (tx) => {
        const options: DeleteWithConfirmationOptions<ProductSummary, string> = {
          identifierLabel: 'SKU',
          notFoundMessage: 'Product not found.',
          expectedConfirmation: (product) => product.sku,
          confirmationErrorMessage: 'Confirmation does not match the SKU.',
          deleteEntity: async () => this.repository.deleteProductBySku(trimmedSku, tx),
          loadExisting: () => this.repository.getProductBySku(trimmedSku, tx),
          successMessage: (product) => `Product ${product.sku} deleted.`,
          recordChange: (product) =>
            recordChange(
              {
                tableName: 'products',
                action: 'DELETE',
                description: `Product ${product.sku} (${product.name}) was removed`,
                payload: { sku: product.sku, name: product.name },
                source: 'products/delete',
              },
              tx
            ),
        }

        return deleteWithConfirmation({
          identifier: trimmedSku,
          confirmation,
          options,
        })
      })
    } catch (error) {
      console.error('Unable to delete product', error)
      return errorResult(ErrorMessages.UNABLE_TO_DELETE('product'), 500)
    }

    return {
      ...result,
      subject: `SKU ${trimmedSku}`,
      details: result.status === 200 ? ['Deleted'] : undefined,
    }
  }

  async updateProductPricing({
    productSku,
    shopId,
    sellPriceCents,
    moq,
    competitorPriceCents,
    competitorLink,
  }: ProductPricingUpdateArgs): Promise<ServiceResult> {
    const trimmedSku = productSku.trim()
    if (!trimmedSku) {
      return errorResult('Product SKU is required.', 400)
    }
    if (!Number.isInteger(shopId) || shopId <= 0) {
      return errorResult('Shop selection is required.', 400)
    }
    if (sellPriceCents !== null && (!Number.isFinite(sellPriceCents) || sellPriceCents < 0)) {
      return errorResult('List price must be a non-negative number.', 400)
    }
    if (competitorPriceCents !== null && (!Number.isFinite(competitorPriceCents) || competitorPriceCents < 0)) {
      return errorResult('Competitor price must be a non-negative number.', 400)
    }
    if (moq !== null && (!Number.isInteger(moq) || moq < 0)) {
      return errorResult('MOQ must be a non-negative integer.', 400)
    }

    const product = await this.repository.getProductBySku(trimmedSku)
    if (!product) {
      return errorResult(ErrorMessages.NOT_FOUND('Product'), 404)
    }

    let updated: boolean
    try {
      updated = await db.transaction(async (tx) => {
        const success = await this.repository.updateProductPricing(
          {
            productSku: trimmedSku,
            shopId,
            sellPrice: sellPriceCents,
            moq,
            competitorPrice: competitorPriceCents,
            competitorLink: competitorLink?.trim() || null,
          },
          tx
        )
        if (!success) {
          return false
        }
        await recordChange(
          {
            tableName: 'product_pricing',
            action: 'UPDATE',
            description: `Pricing updated for ${trimmedSku} (shop ${shopId})`,
            payload: { productSku: trimmedSku, shopId, sellPriceCents, moq, competitorPriceCents, competitorLink },
            source: 'products/pricing/update',
          },
          tx
        )
        return true
      })
    } catch (error) {
      console.error('Unable to update product pricing', error)
      return errorResult(ErrorMessages.UNABLE_TO_SAVE('price'), 500)
    }

    if (!updated) {
      return errorResult(ErrorMessages.NOT_FOUND('Price'), 404)
    }

    return successResult(SuccessMessages.SAVED('Price'))
  }
}

const defaultProductService = new ProductService(
  new ProductRepository(),
  new ProductTransformationService(),
  new ProductSearchService(),
  new ListingRepository()
)

export async function getProductPagePayload(
  options?: ProductSearchSortOptions
): Promise<ProductPagePayload> {
  return defaultProductService.getProductPagePayload(options)
}

export async function updateProductDetails(args: ProductUpdateArgs): Promise<ProductUpdateResult> {
  return defaultProductService.updateProductDetails(args)
}

export async function createProduct(args: ProductCreateArgs): Promise<ProductCreateResult> {
  return defaultProductService.createProduct(args)
}

export async function deleteProduct(args: ProductDeleteArgs): Promise<ProductDeleteResult> {
  return defaultProductService.deleteProduct(args)
}

export async function updateProductPricingDetails(
  args: ProductPricingUpdateArgs
): Promise<ServiceResult> {
  return defaultProductService.updateProductPricing(args)
}

export const productChangeService = createChangeService<
  ProductChangeSnapshot,
  ProductUpdateArgs,
  ProductUpdateResult
>(productSnapshotFromArgs, productHasChanges, updateProductDetails)

export const applyProductSearchSort = (
  products: ProductCard[],
  options?: ProductSearchSortOptions
): ProductCard[] => {
  return new ProductSearchService().applySearchSortFilter(products, options)
}
