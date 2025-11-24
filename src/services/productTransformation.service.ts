import { ProductSummary, ProductStatus, ProductPricingSummary, ShopSummary } from '../db/products.db'
import { formatMoney } from '../domain/formatters.domain'
import { createSanitizer } from '../domain/sanitizers.domain'

export interface ProductShopPrice {
  shopId: number
  shopCode: string
  shopName: string
  sellPriceCents: number | null
  actualSellPriceCents: number | null
  bestDiscountCents: number | null
  sellPriceDisplay: string
  actualSellPriceDisplay: string
  bestDiscountDisplay: string
  moq: number | null
  displayPriceCents: number | null
  displayPrice: string
  usesActualPrice: boolean
  competitorPriceCents: number | null
  competitorPriceDisplay: string
  competitorLink: string | null
  competitorLinkRaw: string | null
}

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
  prices: ProductShopPrice[]
  imageUrl: string | null
  shopIds: number[]
  listingCodes: string[]
}

export interface ProductStatusOption {
  id: ProductStatus['id']
  name: string
}

export interface SupplierOption {
  id: number
  name: string
}

export interface ShopOption {
  id: number
  code: string
  name: string
}

export class ProductTransformationService {
  private normalizeCents = (value: number | null) => {
    if (value === null || !Number.isFinite(value)) return null
    return Math.round(value)
  }

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
      imageUrl: product.imageUrl ? escape(product.imageUrl) : null,
      prices: [],
      listingCodes: [],
    }
  })

  private pricingToCard = createSanitizer<ProductPricingSummary, ProductShopPrice>((pricing, escape) => {
    const sellPriceCents = this.normalizeCents(pricing.sellPrice ?? null)
    const actualSellPriceCents = this.normalizeCents(pricing.actualSellPrice ?? null)
    const bestDiscountCents = this.normalizeCents(pricing.bestDiscount ?? null)
    const primaryCents = actualSellPriceCents ?? sellPriceCents
    const moq = Number.isInteger(pricing.moq) ? pricing.moq : null
    const competitorPriceCents = this.normalizeCents(pricing.competitorPrice ?? null)
    const competitorLinkRawUntrimmed = pricing.competitorLink ? pricing.competitorLink.trim() : null
    const competitorLinkRaw = competitorLinkRawUntrimmed ? competitorLinkRawUntrimmed : null
    const competitorLink = competitorLinkRaw ? escape(competitorLinkRaw) : null

    return {
      shopId: pricing.shopId,
      shopCode: escape(pricing.shopCode || ''),
      shopName: pricing.shopName ? escape(pricing.shopName) : 'Unknown shop',
      sellPriceCents,
      actualSellPriceCents,
      bestDiscountCents,
      sellPriceDisplay: formatMoney(sellPriceCents),
      actualSellPriceDisplay: formatMoney(actualSellPriceCents),
      bestDiscountDisplay: formatMoney(bestDiscountCents),
      moq,
      displayPriceCents: primaryCents,
      displayPrice: formatMoney(primaryCents),
      usesActualPrice: actualSellPriceCents !== null,
      competitorPriceCents,
      competitorPriceDisplay: formatMoney(competitorPriceCents),
      competitorLink,
      competitorLinkRaw,
    }
  })

  private groupPricingBySku(pricing: ProductPricingSummary[]) {
    return pricing.reduce((map, entry) => {
      const list = map.get(entry.productSku) ?? []
      list.push(entry)
      map.set(entry.productSku, list)
      return map
    }, new Map<string, ProductPricingSummary[]>())
  }

  private statusToOption = createSanitizer<ProductStatus, ProductStatusOption>((status, escape) => ({
    id: status.id,
    name: escape(status.name),
  }))

  private supplierToOption = createSanitizer<{ id: number; name: string }, SupplierOption>((supplier, escape) => ({
    id: supplier.id,
    name: escape(supplier.name),
  }))

  private shopToOption = createSanitizer<ShopSummary, ShopOption>((shop, escape) => ({
    id: shop.id,
    code: escape(shop.code),
    name: escape(shop.name),
  }))

  transformProduct(
    product: ProductSummary,
    pricing: ProductPricingSummary[] = [],
    listingCodes: string[] = []
  ): ProductCard {
    const groupedPricing = this.groupPricingBySku(pricing)
    const prices = groupedPricing.get(product.sku) ?? []
    return {
      ...this.productToCard(product),
      prices: prices.map(this.pricingToCard),
      shopIds: prices.map((price) => price.shopId),
      listingCodes,
    }
  }

  transformProducts(
    products: ProductSummary[],
    pricing: ProductPricingSummary[] = [],
    listingCodeMap?: Map<string, string[]>
  ): ProductCard[] {
    const groupedPricing = this.groupPricingBySku(pricing)
    return products.map((product) => {
      const prices = groupedPricing.get(product.sku) ?? []
      const listingCodes = listingCodeMap?.get(product.sku) ?? []
      return {
        ...this.productToCard(product),
        prices: prices.map(this.pricingToCard),
        shopIds: prices.map((price) => price.shopId),
        listingCodes,
      }
    })
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

  transformShop(shop: ShopSummary): ShopOption {
    return this.shopToOption(shop)
  }

  transformShops(shops: ShopSummary[]): ShopOption[] {
    return shops.map(this.shopToOption)
  }
}
