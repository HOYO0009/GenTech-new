import { escapeHtml, formatMoney } from '../domain/formatters'
import { recordChange } from './changes'
import { FieldChangeDetector, FieldCheck } from '../domain/detectors'
import { normalizeNullableText } from '../domain/normalizers'
import {
  getProductByName,
  getProductBySku,
  insertProduct,
  listProductStatuses,
  listProducts,
  listSuppliers,
  deleteProductBySku,
  ProductStatus,
  ProductSummary,
  updateProduct,
} from '../db/products'
type ChangeAwareUpdater<TExisting, TIncoming, TResult> = {
  update(args: TIncoming): Promise<TResult>
  hasChanges(existing: TExisting, incoming: TIncoming): boolean
}
import { deleteWithConfirmation, DeleteWithConfirmationOptions } from '../domain/delete'

export interface ProductCard {
  sku: string
  name: string
  statusId: number
  statusName: string
  costDisplay: string
  supplierName: string | null
  supplierLink: string | null
  hasSupplierLink: boolean
  purchaseRemarks: string
  costCents: number | null
  supplierId: number | null
}

export interface ProductStatusOption {
  id: ProductStatus['id']
  name: string
}

export interface SupplierOption {
  id: number
  name: string
}

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

export interface ProductUpdateResult {
  status: 200 | 400 | 404 | 500
  message: string
}

export interface ProductCreateArgs {
  sku: string
  name: string
  requestedStatusId: number
  costCents: number | null
  purchaseRemarks: string
  supplierId: number | null
  supplierLink: string
}

export type ProductCreateResult = ProductUpdateResult

export interface ProductDeleteArgs {
  sku: string
  confirmation: string
}

export type ProductDeleteResult = ProductUpdateResult

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

const productToCard = (product: ProductSummary): ProductCard => {
  const sanitizedSupplierLink = product.supplierLink ? escapeHtml(product.supplierLink) : null
  return {
    sku: escapeHtml(product.sku),
    name: escapeHtml(product.name),
    statusId: product.statusId,
    statusName: escapeHtml(product.statusName),
    costDisplay: formatMoney(product.cost),
    supplierName: product.supplierName ? escapeHtml(product.supplierName) : null,
    supplierLink: sanitizedSupplierLink,
    hasSupplierLink: Boolean(product.supplierLink && product.supplierLink.trim()),
    purchaseRemarks: product.purchaseRemarks ? escapeHtml(product.purchaseRemarks) : '',
    costCents: product.cost ?? null,
    supplierId: product.supplierId ?? null,
  }
}

const statusToOption = (status: ProductStatus): ProductStatusOption => ({
  id: status.id,
  name: escapeHtml(status.name),
})

const supplierToOption = (supplier: { id: number; name: string }): SupplierOption => ({
  id: supplier.id,
  name: escapeHtml(supplier.name),
})

export async function getProductPagePayload(): Promise<ProductPagePayload> {
  const [products, statuses, suppliers] = await Promise.all([
    listProducts(),
    listProductStatuses(),
    listSuppliers(),
  ])

  return {
    products: products.map(productToCard),
    statuses: statuses.map(statusToOption),
    suppliers: suppliers.map(supplierToOption),
  }
}

export async function updateProductDetails({
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
    return { message: 'SKU and name are required.', status: 400 }
  }

  const existingProduct = await getProductBySku(trimmedOriginalSku)
  if (!existingProduct) {
    return { message: 'Product not found.', status: 404 }
  }

  const statuses = await listProductStatuses()
  if (!statuses.length) {
    return { message: 'Status configuration missing.', status: 500 }
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
    return { message: 'No changes detected.', status: 200 }
  }
  const updated = await updateProduct({
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
    return { message: 'Product not found.', status: 404 }
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

  return { message: 'Product saved.', status: 200 }
}

export async function createProduct({
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
    return { message: 'SKU and name are required.', status: 400 }
  }

  const statuses = await listProductStatuses()
  if (!statuses.length) {
    return { message: 'Status configuration missing.', status: 500 }
  }

  const validStatus = statuses.find(({ id }) => id === requestedStatusId) ?? statuses[0]

  const existingProduct = await getProductBySku(trimmedSku)
  if (existingProduct) {
    return { message: 'SKU already exists.', status: 400 }
  }

  const existingName = await getProductByName(trimmedName)
  if (existingName) {
    return { message: 'Product name already exists.', status: 400 }
  }

  const normalizedRemarks = normalizeNullableText(purchaseRemarks)
  const normalizedLink = normalizeNullableText(supplierLink)

  try {
    await insertProduct({
      sku: trimmedSku,
      name: trimmedName,
      statusId: validStatus.id,
      cost: costCents,
      purchaseRemarks: normalizedRemarks ?? null,
      supplierId,
      supplierLink: normalizedLink ?? null,
    })
  } catch (error) {
    const message = (error as Error)?.message ?? 'Unable to create product.'
    if (message.includes('UNIQUE constraint failed: products.sku')) {
      return { message: 'SKU already exists.', status: 400 }
    }
    console.error('Unable to create product', error)
    return { message: 'Unable to create product.', status: 500 }
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

  return { message: 'Product added.', status: 200 }
}

export async function deleteProduct({
  sku,
  confirmation,
}: ProductDeleteArgs): Promise<ProductDeleteResult> {
  const trimmedSku = sku.trim()
  if (!trimmedSku) {
    return { message: 'SKU is required to delete.', status: 400 }
  }
  const options: DeleteWithConfirmationOptions<ProductSummary, string> = {
    identifierLabel: 'SKU',
    notFoundMessage: 'Product not found.',
    expectedConfirmation: (product) => product.sku,
    confirmationErrorMessage: 'Confirmation does not match the SKU.',
    deleteEntity: async () => deleteProductBySku(trimmedSku),
    loadExisting: () => getProductBySku(trimmedSku),
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

export const productChangeService: ChangeAwareUpdater<
  ProductChangeSnapshot,
  ProductUpdateArgs,
  ProductUpdateResult
> = {
  update: updateProductDetails,
  hasChanges(existing, incoming) {
    return productHasChanges(existing, productSnapshotFromArgs(incoming))
  },
}
