import { IProductRepository } from './product.repository.interface'
import { DbClient } from '../db/connection.db'
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
  async listProducts(executor?: DbClient): Promise<ProductSummary[]> {
    return dbListProducts(executor)
  }

  async getProductBySku(sku: string, executor?: DbClient): Promise<ProductSummary | null> {
    return dbGetProductBySku(sku, executor)
  }

  async getProductByName(name: string, executor?: DbClient): Promise<ProductSummary | null> {
    return dbGetProductByName(name, executor)
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
  }, executor?: DbClient): Promise<boolean> {
    return dbUpdateProduct(args, executor)
  }

  async insertProduct(args: {
    sku: string
    name: string
    statusId: number
    cost: number | null
    purchaseRemarks: string | null
    supplierId: number | null
    supplierLink: string | null
  }, executor?: DbClient): Promise<boolean> {
    return dbInsertProduct(args, executor)
  }

  async deleteProductBySku(sku: string, executor?: DbClient): Promise<boolean> {
    return dbDeleteProductBySku(sku, executor)
  }

  async listProductStatuses(executor?: DbClient): Promise<ProductStatus[]> {
    return dbListProductStatuses(executor)
  }

  async listSuppliers(executor?: DbClient): Promise<Array<{ id: number; name: string }>> {
    return dbListSuppliers(executor)
  }
}
