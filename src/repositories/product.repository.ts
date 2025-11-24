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
  listProductPricing as dbListProductPricing,
  updateProductPricing as dbUpdateProductPricing,
  listShops as dbListShops,
  listProductShopIds as dbListProductShopIds,
  addProductShops as dbAddProductShops,
  removeProductShops as dbRemoveProductShops,
  reassignProductPricingSku as dbReassignProductPricingSku,
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
    imageUrl: string | null
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
    imageUrl: string | null
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

  async listProductPricing(executor?: DbClient) {
    return dbListProductPricing(executor)
  }

  async listShops(executor?: DbClient) {
    return dbListShops(executor)
  }

  async listProductShopIds(productSku: string, executor?: DbClient): Promise<number[]> {
    return dbListProductShopIds(productSku, executor)
  }

  async addProductShops(productSku: string, shopIds: number[], executor?: DbClient): Promise<void> {
    return dbAddProductShops(productSku, shopIds, executor)
  }

  async removeProductShops(productSku: string, shopIds: number[], executor?: DbClient): Promise<void> {
    return dbRemoveProductShops(productSku, shopIds, executor)
  }

  async reassignProductPricingSku(originalSku: string, newSku: string, executor?: DbClient): Promise<void> {
    return dbReassignProductPricingSku(originalSku, newSku, executor)
  }

  async updateProductPricing(
    args: {
      productSku: string
      shopId: number
      sellPrice: number | null
      moq: number | null
      competitorPrice: number | null
      competitorLink: string | null
    },
    executor?: DbClient
  ): Promise<boolean> {
    return dbUpdateProductPricing(args, executor)
  }
}
