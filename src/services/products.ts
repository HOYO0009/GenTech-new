import { escapeHtml, formatMoney } from '../domain/formatters'
import { recordChange } from './changeLogs'
import { listProductStatuses, listProducts, ProductStatus, ProductSummary, updateProduct } from '../db/products'

export interface ProductCard {
  sku: string
  name: string
  statusId: number
  statusName: string
  costDisplay: string
  supplierName: string | null
  supplierLink: string | null
  hasSupplierLink: boolean
}

export interface ProductStatusOption {
  id: ProductStatus['id']
  name: string
}

export interface ProductPagePayload {
  products: ProductCard[]
  statuses: ProductStatusOption[]
}

export interface ProductUpdateArgs {
  sku: string
  name: string
  requestedStatusId: number
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
  }
}

const statusToOption = (status: ProductStatus): ProductStatusOption => ({
  id: status.id,
  name: escapeHtml(status.name),
})

export async function getProductPagePayload(): Promise<ProductPagePayload> {
  const [products, statuses] = await Promise.all([listProducts(), listProductStatuses()])

  return {
    products: products.map(productToCard),
    statuses: statuses.map(statusToOption),
  }
}

export async function updateProductDetails({ sku, name, requestedStatusId }: ProductUpdateArgs): Promise<ProductUpdateResult> {
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

  const updated = await updateProduct(trimmedSku, trimmedName, validStatus.id)
  if (!updated) {
    return { message: 'Product not found.', status: 404 }
  }

  try {
    await recordChange({
      tableName: 'products',
      action: 'UPDATE',
      description: `SKU ${trimmedSku} updated to "${trimmedName}" (status ${validStatus.name})`,
      payload: {
        sku: trimmedSku,
        name: trimmedName,
        statusId: validStatus.id,
        statusName: validStatus.name,
      },
      source: 'products/update',
    })
  } catch (error) {
    console.error('Unable to record product change', error)
  }

  return { message: 'Product saved.', status: 200 }
}
