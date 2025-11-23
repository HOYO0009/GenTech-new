import { DbClient } from '../db/connection.db'
import { ProductSummary, ProductStatus } from '../db/products.db'

export interface IProductRepository {
  listProducts(executor?: DbClient): Promise<ProductSummary[]>
  getProductBySku(sku: string, executor?: DbClient): Promise<ProductSummary | null>
  getProductByName(name: string, executor?: DbClient): Promise<ProductSummary | null>
  updateProduct(args: {
    originalSku: string
    newSku: string
    name: string
    statusId: number
    cost: number | null
    purchaseRemarks: string | null
    supplierId: number | null
    supplierLink: string | null
  }, executor?: DbClient): Promise<boolean>
  insertProduct(args: {
    sku: string
    name: string
    statusId: number
    cost: number | null
    purchaseRemarks: string | null
    supplierId: number | null
    supplierLink: string | null
  }, executor?: DbClient): Promise<boolean>
  deleteProductBySku(sku: string, executor?: DbClient): Promise<boolean>
  listProductStatuses(executor?: DbClient): Promise<ProductStatus[]>
  listSuppliers(executor?: DbClient): Promise<Array<{ id: number; name: string }>>
}
