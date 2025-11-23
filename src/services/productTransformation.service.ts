import { ProductSummary, ProductStatus } from '../db/products.db'
import { formatMoney } from '../domain/formatters.domain'
import { createSanitizer } from '../domain/sanitizers.domain'

export interface ProductCard {
  sku: string
  skuRaw: string
  name: string
  nameRaw: string
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

export class ProductTransformationService {
  private productToCard = createSanitizer<ProductSummary, ProductCard>((product, escape) => {
    const sanitizedSupplierLink = product.supplierLink ? escape(product.supplierLink) : null
    return {
      sku: escape(product.sku),
      skuRaw: product.sku,
      name: escape(product.name),
      nameRaw: product.name,
      statusId: product.statusId,
      statusName: escape(product.statusName),
      costDisplay: formatMoney(product.cost),
      supplierName: product.supplierName ? escape(product.supplierName) : null,
      supplierLink: sanitizedSupplierLink,
      hasSupplierLink: Boolean(product.supplierLink && product.supplierLink.trim()),
      purchaseRemarks: product.purchaseRemarks ? escape(product.purchaseRemarks) : '',
      costCents: product.cost ?? null,
      supplierId: product.supplierId ?? null,
    }
  })

  private statusToOption = createSanitizer<ProductStatus, ProductStatusOption>((status, escape) => ({
    id: status.id,
    name: escape(status.name),
  }))

  private supplierToOption = createSanitizer<{ id: number; name: string }, SupplierOption>((supplier, escape) => ({
    id: supplier.id,
    name: escape(supplier.name),
  }))

  transformProduct(product: ProductSummary): ProductCard {
    return this.productToCard(product)
  }

  transformProducts(products: ProductSummary[]): ProductCard[] {
    return products.map(this.productToCard)
  }

  transformStatus(status: ProductStatus): ProductStatusOption {
    return this.statusToOption(status)
  }

  transformStatuses(statuses: ProductStatus[]): ProductStatusOption[] {
    return statuses.map(this.statusToOption)
  }

  transformSupplier(supplier: { id: number; name: string }): SupplierOption {
    return this.supplierToOption(supplier)
  }

  transformSuppliers(suppliers: Array<{ id: number; name: string }>): SupplierOption[] {
    return suppliers.map(this.supplierToOption)
  }
}
