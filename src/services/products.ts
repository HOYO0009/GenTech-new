import { escapeHtml, formatMoney } from '../domain/formatters'
import { recordChange } from './changeLogs'
import {
  listProductStatuses,
  listProducts,
  listSuppliers,
  ProductStatus,
  ProductSummary,
  updateProduct,
} from '../db/products'

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

  const statuses = await listProductStatuses()
  if (!statuses.length) {
    return { message: 'Status configuration missing.', status: 500 }
  }

  const validStatus = statuses.find(({ id }) => id === requestedStatusId) ?? statuses[0]

  const normalizedRemarks = purchaseRemarks.trim()
  const normalizedSupplierLink = supplierLink.trim()
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
