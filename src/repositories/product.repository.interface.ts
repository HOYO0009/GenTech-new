import { DbClient } from '../db/connection.db'
import { ProductSummary, ProductStatus, ProductPricingSummary, ShopSummary } from '../db/products.db'

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
    imageUrl: string | null
  }, executor?: DbClient): Promise<boolean>
  insertProduct(args: {
    sku: string
    name: string
    statusId: number
    cost: number | null
    purchaseRemarks: string | null
    supplierId: number | null
    supplierLink: string | null
    imageUrl: string | null
  }, executor?: DbClient): Promise<boolean>
  deleteProductBySku(sku: string, executor?: DbClient): Promise<boolean>
  listProductStatuses(executor?: DbClient): Promise<ProductStatus[]>
  listSuppliers(executor?: DbClient): Promise<Array<{ id: number; name: string }>>
  listProductPricing(executor?: DbClient): Promise<ProductPricingSummary[]>
  listShops(executor?: DbClient): Promise<ShopSummary[]>
  listProductShopIds(productSku: string, executor?: DbClient): Promise<number[]>
  addProductShops(productSku: string, shopIds: number[], executor?: DbClient): Promise<void>
  removeProductShops(productSku: string, shopIds: number[], executor?: DbClient): Promise<void>
  reassignProductPricingSku(originalSku: string, newSku: string, executor?: DbClient): Promise<void>
  updateProductPricing(
    args: {
      productSku: string
      shopId: number
      sellPrice: number | null
      moq: number | null
      competitorPrice: number | null
      competitorLink: string | null
    },
    executor?: DbClient
  ): Promise<boolean>
}
