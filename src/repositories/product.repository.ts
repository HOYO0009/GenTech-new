import { IProductRepository } from './product.repository.interface'
import {
  listProducts as dbListProducts,
  getProductBySku as dbGetProductBySku,
  getProductByName as dbGetProductByName,
  updateProduct as dbUpdateProduct,
  insertProduct as dbInsertProduct,
  deleteProductBySku as dbDeleteProductBySku,
  listProductStatuses as dbListProductStatuses,
  listSuppliers as dbListSuppliers,
  ProductSummary,
  ProductStatus,
} from '../db/products.db'

export class ProductRepository implements IProductRepository {
  async listProducts(): Promise<ProductSummary[]> {
    return dbListProducts()
  }

  async getProductBySku(sku: string): Promise<ProductSummary | null> {
    return dbGetProductBySku(sku)
  }

  async getProductByName(name: string): Promise<ProductSummary | null> {
    return dbGetProductByName(name)
  }

  async updateProduct(args: {
    originalSku: string
    newSku: string
    name: string
    statusId: number
    cost: number | null
    purchaseRemarks: string | null
    supplierId: number | null
    supplierLink: string | null
  }): Promise<boolean> {
    return dbUpdateProduct(args)
  }

  async insertProduct(args: {
    sku: string
    name: string
    statusId: number
    cost: number | null
    purchaseRemarks: string | null
    supplierId: number | null
    supplierLink: string | null
  }): Promise<boolean> {
    return dbInsertProduct(args)
  }

  async deleteProductBySku(sku: string): Promise<boolean> {
    return dbDeleteProductBySku(sku)
  }

  async listProductStatuses(): Promise<ProductStatus[]> {
    return dbListProductStatuses()
  }

  async listSuppliers(): Promise<Array<{ id: number; name: string }>> {
    return dbListSuppliers()
  }
}
