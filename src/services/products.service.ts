import { recordChange } from './changeLogs.service'
import { FieldChangeDetector, FieldCheck } from '../domain/detectors.domain'
import { normalizeNullableText } from '../domain/normalizers.domain'
import { deleteWithConfirmation, DeleteWithConfirmationOptions } from '../domain/delete.domain'
import { createChangeService } from '../domain/changeService.domain'
import { ServiceResult, errorResult, successResult, ErrorMessages, SuccessMessages } from '../domain/results.domain'
import { ProductSummary } from '../db/products.db'
import { IProductRepository } from '../repositories/product.repository.interface'
import { ProductRepository } from '../repositories/product.repository'
import { ProductTransformationService } from './productTransformation.service'
import type { ProductCard, ProductStatusOption, SupplierOption } from './productTransformation.service'
import { ProductSearchService } from './productSearch.service'
import type { ProductSearchSortOptions } from './productSearch.service'
import type { ProductSortOption } from '../domain/strategies/productSort.strategy'

export type { ProductCard, ProductStatusOption, SupplierOption, ProductSearchSortOptions, ProductSortOption }

export interface ProductPagePayload {
  products: ProductCard[]
  statuses: ProductStatusOption[]
  suppliers: SupplierOption[]
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
}

export type ProductCreateResult = ServiceResult

export interface ProductDeleteArgs {
  sku: string
  confirmation: string
}

export type ProductDeleteResult = ServiceResult

type ProductChangeSnapshot = {
  sku: string
  name: string
  statusId: number
  cost: number | null
  purchaseRemarks: string | null
  supplierId: number | null
  supplierLink: string | null
}

const productChangeFields: FieldCheck<ProductChangeSnapshot, ProductChangeSnapshot>[] = [
  { existingKey: 'sku', incomingKey: 'sku' },
  { existingKey: 'name', incomingKey: 'name' },
  { existingKey: 'statusId', incomingKey: 'statusId' },
  { existingKey: 'cost', incomingKey: 'cost' },
  { existingKey: 'purchaseRemarks', incomingKey: 'purchaseRemarks' },
  { existingKey: 'supplierId', incomingKey: 'supplierId' },
  { existingKey: 'supplierLink', incomingKey: 'supplierLink' },
]

export const productSnapshotFromArgs = (args: ProductUpdateArgs): ProductChangeSnapshot => ({
  sku: args.sku.trim(),
  name: args.name.trim(),
  statusId: args.requestedStatusId,
  cost: args.costCents ?? null,
  purchaseRemarks: normalizeNullableText(args.purchaseRemarks),
  supplierId: args.supplierId ?? null,
  supplierLink: normalizeNullableText(args.supplierLink),
})

export const productHasChanges = (
  existing: ProductChangeSnapshot,
  incoming: ProductChangeSnapshot
) => new FieldChangeDetector(existing, incoming, productChangeFields).hasChanges()

export class ProductService {
  constructor(
    private repository: IProductRepository,
    private transformationService: ProductTransformationService,
    private searchService: ProductSearchService
  ) {}

  async getProductPagePayload(options?: ProductSearchSortOptions): Promise<ProductPagePayload> {
    const [products, statuses, suppliers] = await Promise.all([
      this.repository.listProducts(),
      this.repository.listProductStatuses(),
      this.repository.listSuppliers(),
    ])

    const transformedProducts = this.transformationService.transformProducts(products)
    const sortedProducts = this.searchService.applySearchSortFilter(transformedProducts, options)

    return {
      products: sortedProducts,
      statuses: this.transformationService.transformStatuses(statuses),
      suppliers: this.transformationService.transformSuppliers(suppliers),
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

    const validStatus = statuses.find(({ id }) => id === requestedStatusId) ?? statuses[0]

    const normalizedRemarks = purchaseRemarks.trim()
    const normalizedSupplierLink = supplierLink.trim()
    const normalizedRemarksValue = normalizedRemarks || null
    const normalizedSupplierLinkValue = normalizedSupplierLink || null
    const normalizedExistingProduct: ProductChangeSnapshot = {
      sku: existingProduct.sku.trim(),
      name: existingProduct.name.trim(),
      statusId: existingProduct.statusId,
      cost: existingProduct.cost ?? null,
      purchaseRemarks: normalizeNullableText(existingProduct.purchaseRemarks),
      supplierId: existingProduct.supplierId ?? null,
      supplierLink: normalizeNullableText(existingProduct.supplierLink),
    }
    const normalizedIncomingProduct: ProductChangeSnapshot = {
      sku: trimmedSku,
      name: trimmedName,
      statusId: validStatus.id,
      cost: costCents ?? null,
      purchaseRemarks: normalizedRemarksValue,
      supplierId,
      supplierLink: normalizedSupplierLinkValue,
    }
    const hasChanges = productHasChanges(normalizedExistingProduct, normalizedIncomingProduct)
    if (!hasChanges) {
      return successResult(ErrorMessages.NO_CHANGES)
    }
    const updated = await this.repository.updateProduct({
      originalSku: trimmedOriginalSku,
      newSku: trimmedSku,
      name: trimmedName,
      statusId: validStatus.id,
      cost: costCents,
      purchaseRemarks: normalizedRemarks || null,
      supplierId,
      supplierLink: normalizedSupplierLink || null,
    })

    if (!updated) {
      return errorResult(ErrorMessages.NOT_FOUND('Product'), 404)
    }

    try {
      await recordChange({
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
        },
        source: 'products/update',
      })
    } catch (error) {
      console.error('Unable to record product change', error)
    }

    return successResult(SuccessMessages.SAVED('Product'))
  }

  async createProduct({
    sku,
    name,
    requestedStatusId,
    costCents,
    purchaseRemarks,
    supplierLink,
    supplierId,
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

    try {
      await this.repository.insertProduct({
        sku: trimmedSku,
        name: trimmedName,
        statusId: validStatus.id,
        cost: costCents,
        purchaseRemarks: normalizedRemarks ?? null,
        supplierId,
        supplierLink: normalizedLink ?? null,
      })
    } catch (error) {
      const message = (error as Error)?.message ?? ErrorMessages.UNABLE_TO_CREATE('product')
      if (message.includes('UNIQUE constraint failed: products.sku')) {
        return errorResult(ErrorMessages.ALREADY_EXISTS('SKU'), 400)
      }
      console.error('Unable to create product', error)
      return errorResult(ErrorMessages.UNABLE_TO_CREATE('product'), 500)
    }

    try {
      await recordChange({
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
        },
        source: 'products/create',
      })
    } catch (error) {
      console.error('Unable to record product change', error)
    }

    return successResult('Product added.')
  }

  async deleteProduct({ sku, confirmation }: ProductDeleteArgs): Promise<ProductDeleteResult> {
    const trimmedSku = sku.trim()
    if (!trimmedSku) {
      return errorResult('SKU is required to delete.', 400)
    }
    const options: DeleteWithConfirmationOptions<ProductSummary, string> = {
      identifierLabel: 'SKU',
      notFoundMessage: 'Product not found.',
      expectedConfirmation: (product) => product.sku,
      confirmationErrorMessage: 'Confirmation does not match the SKU.',
      deleteEntity: async () => this.repository.deleteProductBySku(trimmedSku),
      loadExisting: () => this.repository.getProductBySku(trimmedSku),
      successMessage: (product) => `Product ${product.sku} deleted.`,
      recordChange: (product) =>
        recordChange({
          tableName: 'products',
          action: 'DELETE',
          description: `Product ${product.sku} (${product.name}) was removed`,
          payload: { sku: product.sku, name: product.name },
          source: 'products/delete',
        }),
    }

    return deleteWithConfirmation({
      identifier: trimmedSku,
      confirmation,
      options,
    })
  }
}

const defaultProductService = new ProductService(
  new ProductRepository(),
  new ProductTransformationService(),
  new ProductSearchService()
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
