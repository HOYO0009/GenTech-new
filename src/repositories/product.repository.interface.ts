import { ProductSummary, ProductStatus } from '../db/products.db'

export interface IProductRepository {
  listProducts(): Promise<ProductSummary[]>
  getProductBySku(sku: string): Promise<ProductSummary | null>
  getProductByName(name: string): Promise<ProductSummary | null>
  updateProduct(args: {
    originalSku: string
    newSku: string
    name: string
    statusId: number
    cost: number | null
    purchaseRemarks: string | null
    supplierId: number | null
    supplierLink: string | null
  }): Promise<boolean>
  insertProduct(args: {
    sku: string
    name: string
    statusId: number
    cost: number | null
    purchaseRemarks: string | null
    supplierId: number | null
    supplierLink: string | null
  }): Promise<boolean>
  deleteProductBySku(sku: string): Promise<boolean>
  listProductStatuses(): Promise<ProductStatus[]>
  listSuppliers(): Promise<Array<{ id: number; name: string }>>
}
