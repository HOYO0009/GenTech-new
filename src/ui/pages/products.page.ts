import { layout } from '../layout.ui'
import { renderSearchSortControls } from '../templates/editor.template'
import { inlineCardScript } from '../templates/card.template'
import { renderFilterSidebar, createSortSection, createFilterSection } from '../templates/filterSidebar.template'
import { toastClientScript } from '../templates/toast.template'
import { uiClasses, cx } from '../styles/classes.ui'
import { ProductCard, ProductSortOption, ProductStatusOption, SupplierOption, ShopOption } from '../../services/products.service'

type ProductListingOptions = {
  page?: number
  search?: string
  sort?: ProductSortOption
  supplierFilters?: number[]
  statusFilters?: number[]
}

type ProductPagination = {
  currentPage: number
  totalPages: number
  totalProducts: number
  start: number
  end: number
}

const PRODUCTS_PER_PAGE = 20

const getPageWindow = (pagination: ProductPagination, windowSize = 4): number[] => {
  const start = Math.max(1, Math.min(pagination.currentPage - 1, Math.max(1, pagination.totalPages - windowSize + 1)))
  const pages: number[] = []
  for (let i = 0; i < windowSize && start + i <= pagination.totalPages; i += 1) {
    pages.push(start + i)
  }
  return pages
}

const paginateProducts = (products: ProductCard[], requestedPage?: number) => {
  const totalProducts = products.length
  const totalPages = Math.max(1, Math.ceil(totalProducts / PRODUCTS_PER_PAGE))
  const safePage = Math.min(Math.max(requestedPage ?? 1, 1), totalPages)
  const startIndex = (safePage - 1) * PRODUCTS_PER_PAGE
  const endIndex = startIndex + PRODUCTS_PER_PAGE

  return {
    visibleProducts: products.slice(startIndex, endIndex),
    pagination: {
      currentPage: safePage,
      totalPages,
      totalProducts,
      start: totalProducts === 0 ? 0 : startIndex + 1,
      end: Math.min(endIndex, totalProducts),
    } satisfies ProductPagination,
  }
}

const buildProductPageHref = (page: number, options: ProductListingOptions) => {
  const params = new URLSearchParams()
  const sort = options.sort ?? 'name-asc'
  if (options.search) {
    params.set('search', options.search)
  }
  params.set('sort', sort)
  ;(options.supplierFilters ?? []).forEach((supplierId) => {
    params.append('supplierId', supplierId.toString())
  })
  ;(options.statusFilters ?? []).forEach((statusId) => {
    params.append('statusId', statusId.toString())
  })
  if (page > 1) {
    params.set('page', page.toString())
  }

  const query = params.toString()
  return query ? `/products?${query}` : '/products'
}

const renderPaginationControls = (pagination: ProductPagination, options: ProductListingOptions) => {
  if (!pagination.totalProducts) {
    return ''
  }
  const prevDisabled = pagination.currentPage <= 1
  const nextDisabled = pagination.currentPage >= pagination.totalPages
  const prevHref = prevDisabled ? '' : buildProductPageHref(pagination.currentPage - 1, options)
  const nextHref = nextDisabled ? '' : buildProductPageHref(pagination.currentPage + 1, options)
  const pageWindow = getPageWindow(pagination)
  const showTrailingEllipsis = pageWindow[pageWindow.length - 1] < pagination.totalPages
  const pageButtons = pageWindow
    .map((page) => {
      const isCurrent = page === pagination.currentPage
      const commonClasses = `${uiClasses.button.secondaryCompact} min-w-[3rem] text-center`
      if (isCurrent) {
        return `<span class="${commonClasses}" aria-current="true">${page}</span>`
      }
      return `<a class="${commonClasses}" href="${buildProductPageHref(page, options)}">${page}</a>`
    })
    .join('')
  const lastPageButton =
    pagination.totalPages > 0 && pageWindow[pageWindow.length - 1] !== pagination.totalPages
      ? `<a class="${uiClasses.button.secondaryCompact} min-w-[3rem] text-center" href="${buildProductPageHref(
          pagination.totalPages,
          options
        )}">${pagination.totalPages}</a>`
      : ''
  const trailingEllipsis = showTrailingEllipsis ? `<span class="${uiClasses.text.metadata}">...</span>` : ''
  const firstHref = pagination.currentPage > 1 ? buildProductPageHref(1, options) : ''
  const lastHref = pagination.currentPage < pagination.totalPages ? buildProductPageHref(pagination.totalPages, options) : ''

  return `<div class="${uiClasses.layout.space.y3} ${uiClasses.divider.base} pb-3">
      <div class="${uiClasses.layout.flex.between}">
        <p class="${uiClasses.text.metadata}">Showing ${pagination.start}-${pagination.end} of ${pagination.totalProducts} (${PRODUCTS_PER_PAGE} per page)</p>
        <div class="${uiClasses.layout.flex.gap2}">
          <a class="${uiClasses.button.secondaryCompact} ${prevDisabled ? 'pointer-events-none opacity-40' : ''}" ${prevDisabled ? 'tabindex="-1" aria-disabled="true"' : `href="${firstHref}"`}>
            First
          </a>
          <a class="${uiClasses.button.secondaryCompact} ${
            prevDisabled ? 'pointer-events-none opacity-40' : ''
          }" ${prevDisabled ? 'tabindex="-1" aria-disabled="true"' : `href="${prevHref}"`}>
            Previous
          </a>
          <div class="${uiClasses.layout.flex.gap2}">
            ${pageButtons}
            ${trailingEllipsis}
            ${lastPageButton}
          </div>
          <a class="${uiClasses.button.secondaryCompact} ${
            nextDisabled ? 'pointer-events-none opacity-40' : ''
          }" ${nextDisabled ? 'tabindex="-1" aria-disabled="true"' : `href="${nextHref}"`}>
            Next
          </a>
          <a class="${uiClasses.button.secondaryCompact} ${nextDisabled ? 'pointer-events-none opacity-40' : ''}" ${nextDisabled ? 'tabindex="-1" aria-disabled="true"' : `href="${lastHref}"`}>
            Last
          </a>
        </div>
      </div>
    </div>`
}

const escapeAttr = (value: string) => value.replace(/"/g, '&quot;')

const toId = (value: string) => value.replace(/[^a-zA-Z0-9_-]/g, '-')

type ShopHighlightKey = keyof typeof uiClasses.shopHighlight

const normalizeShopIdentifier = (value?: string) => value?.toLowerCase().replace(/[^a-z0-9]/g, '') ?? ''

const getShopHighlightKey = (shopName?: string, shopCode?: string): ShopHighlightKey | null => {
  const identifiers = [shopName, shopCode].map(normalizeShopIdentifier)
  for (const identifier of identifiers) {
    if (!identifier) continue
    if (identifier.includes('shopee')) return 'shopee'
    if (identifier.includes('lazada')) return 'lazada'
    if (identifier.includes('tiktok')) return 'tiktok'
    if (identifier.includes('carousell')) return 'carousell'
  }
  return null
}

export const renderProductCard = (
  product: ProductCard,
  statuses: ProductStatusOption[],
  suppliers: SupplierOption[],
  shops: ShopOption[]
) => {
  const priceFallbackDisplay = 'N/A'
  const supplierLabel = product.supplierName || 'Unassigned'
  const cardId = `product-${toId(product.skuRaw)}`
  const costDataAttrs =
    product.costDisplay !== 'N/A' && typeof product.costCents === 'number'
      ? `data-money-cents="${product.costCents}" data-money-base="SGD"`
      : ''
  const statusOptions = statuses
    .map(
      (status) =>
        `<option value="${status.id}" ${status.id === product.statusId ? 'selected' : ''}>${status.name}</option>`
    )
    .join('')
  const supplierOptions = [
    `<option value="">Unassigned</option>`,
    ...suppliers.map(
      (supplier) =>
        `<option value="${supplier.id}" ${supplier.id === product.supplierId ? 'selected' : ''}>${supplier.name}</option>`
    ),
  ].join('')
  const costValue = typeof product.costCents === 'number' ? (product.costCents / 100).toFixed(2) : ''
  const deleteFeedbackId = `${cardId}-delete-feedback`
  const inlineFieldClass = 'flex flex-wrap items-baseline gap-2 text-sm'
  const inlineLabelClass = cx(uiClasses.text.label, 'mb-0')
  const accentTextClass = 'text-amber-300'
  const accentLinkClass = 'underline decoration-amber-400/60 underline-offset-4 hover:text-amber-200'
  const skuValueClass = cx(uiClasses.text.headingBold, '!normal-case')
  const shopPriceEntries = shops.map((shop) => {
    const match = product.prices.find((price) => price.shopId === shop.id)
    const price =
      match ??
      ({
        shopId: shop.id,
        shopCode: shop.code,
        shopName: shop.name,
        sellPriceCents: null,
        actualSellPriceCents: null,
        bestDiscountCents: null,
        sellPriceDisplay: priceFallbackDisplay,
        actualSellPriceDisplay: priceFallbackDisplay,
        bestDiscountDisplay: priceFallbackDisplay,
        moq: null,
        displayPriceCents: null,
        displayPrice: priceFallbackDisplay,
        usesActualPrice: false,
        competitorPriceCents: null,
        competitorPriceDisplay: priceFallbackDisplay,
        competitorLink: null,
        competitorLinkRaw: null,
      } as ProductShopPrice)
    const selected = product.shopIds.includes(shop.id)
    return { price, selected }
  })

  const sellingPricesContent = shopPriceEntries.length
    ? `<div class="grid gap-3 sm:grid-cols-2" data-shop-card-container>
        ${shopPriceEntries
          .map(({ price, selected }) => {
            const highlightKey = getShopHighlightKey(price.shopName, price.shopCode)
            const highlight = highlightKey ? uiClasses.shopHighlight[highlightKey] : null
            const priceBoxClass = cx(
              'relative overflow-hidden rounded-xl border border-white/10 bg-black/70 p-3 space-y-2 transition-all duration-150',
              highlight?.outline,
              selected ? '' : 'hidden'
            )
            const shopLabelClass = cx(uiClasses.text.metadataSmall, highlight?.text)
            const moqLabelClass = cx(uiClasses.text.metadataSmall, 'text-white/60')
            const priceLabelClass = cx(uiClasses.text.metadataSmall, 'text-white/50')
            const actualPriceBaseClass = 'text-base font-bold'
            const priceValueClass = cx(actualPriceBaseClass, 'text-white')
            const competitorLabelClass = cx(uiClasses.text.metadataSmall, 'text-white/60')
            const competitorValueClass = cx(actualPriceBaseClass, accentTextClass)
            const priceRowClass = 'flex items-baseline justify-between gap-2'
            const listPriceLabelClass = cx(uiClasses.text.metadataSmall, 'text-white/60')
            const listPriceValueClass = uiClasses.text.body
            const listPriceValue = typeof price.sellPriceCents === 'number' ? (price.sellPriceCents / 100).toFixed(2) : ''
            const competitorPriceValueInput =
              typeof price.competitorPriceCents === 'number' ? (price.competitorPriceCents / 100).toFixed(2) : ''
            const moqDisplay = price.moq !== null ? price.moq.toString() : '-'
            const actualId = `actual-${cardId}-${price.shopId}`
            const competitorPriceValue = price.competitorLink
              ? `<a class="${cx(competitorValueClass, accentLinkClass)}" href="${price.competitorLink}" target="_blank" rel="noreferrer">${price.competitorPriceDisplay}</a>`
              : `<span class="${competitorValueClass}">${price.competitorPriceDisplay}</span>`
            return `<div class="${priceBoxClass}" data-shop-card data-shop-id="${price.shopId}">
                <div class="${uiClasses.layout.flex.between}">
                  <span class="${shopLabelClass}">${price.shopName}</span>
                  <span class="${moqLabelClass}">MOQ <span class="text-white">${moqDisplay}</span></span>
                </div>
                <div class="${priceRowClass}">
                  <p class="${priceLabelClass}">Actual price:</p>
                  <p class="${priceValueClass}" data-price-actual data-price-actual-for="${price.shopId}" id="${actualId}">${price.actualSellPriceDisplay}</p>
                </div>
                <div class="${priceRowClass}">
                  <p class="${listPriceLabelClass}" data-view-field>List price:</p>
                  <p class="${listPriceValueClass} text-white" data-view-field>${price.sellPriceDisplay}</p>
                </div>
                <div class="${priceRowClass}">
                  <p class="${competitorLabelClass}">Competitor price:</p>
                  <p class="${competitorValueClass}">${competitorPriceValue}</p>
                </div>
                <div class="${uiClasses.layout.space.y1} space-y-2 hidden" data-edit-field>
                  <label class="${uiClasses.text.labelBright} block space-y-1">
                    List price (SGD)
                    <input
                      class="${uiClasses.input.base}"
                      type="number"
                      min="0"
                      step="0.01"
                      name="sellPrice-${price.shopId}"
                      value="${listPriceValue}"
                      data-price-input
                      inputmode="decimal"
                      data-price-editor
                      data-product-sku="${escapeAttr(product.skuRaw)}"
                      data-shop-id="${price.shopId}"
                      data-best-discount-cents="${typeof price.bestDiscountCents === 'number' ? price.bestDiscountCents : ''}"
                      aria-describedby="${actualId}"
                    />
                  </label>
                  <label class="${uiClasses.text.labelBright} block space-y-1">
                    Competitor price (SGD)
                    <input
                      class="${uiClasses.input.base}"
                      type="number"
                      min="0"
                      step="0.01"
                      name="competitorPrice-${price.shopId}"
                      value="${competitorPriceValueInput}"
                      inputmode="decimal"
                    />
                  </label>
                  <label class="${uiClasses.text.labelBright} block space-y-1">
                    Competitor link
                    <input
                      class="${uiClasses.input.base}"
                      type="url"
                      name="competitorLink-${price.shopId}"
                      value="${price.competitorLinkRaw ?? ''}"
                      placeholder="https://example.com"
                    />
                  </label>
                  <label class="${uiClasses.text.labelBright} block space-y-1">
                    MOQ
                    <input
                      class="${uiClasses.input.base}"
                      type="number"
                      min="0"
                      step="1"
                      name="moq-${price.shopId}"
                      value="${price.moq ?? ''}"
                      inputmode="numeric"
                    />
                  </label>
                </div>
              </div>`
          })
          .join('')}
      </div>`
    : `<p class="${uiClasses.text.bodySmall} text-white/60">No selling prices set.</p>`
  const sellingPricesSection = `<div class="${uiClasses.layout.space.y2}">
      ${sellingPricesContent}
    </div>`
  const cardClass = cx(uiClasses.card.compact, 'shadow-[0_0_24px_rgba(0,0,0,0.25)]')
  const imageAlt = escapeAttr(product.name)
  const imageFrame = product.imageUrl
    ? `<img src="${product.imageUrl}" alt="${imageAlt}" class="block h-[100px] w-[100px] max-h-full max-w-full object-cover" />`
    : `<div class="flex h-[100px] w-[100px] max-h-full max-w-full items-center justify-center bg-white/5 text-center text-xs text-white/60">No image</div>`
  const imageControls = `<div class="hidden space-y-2" data-edit-field>
        <label class="${uiClasses.text.labelBright} block space-y-1">
          Upload image
          <input class="${uiClasses.input.base} cursor-pointer" type="file" name="image" accept="image/*" />
        </label>
        <label class="${uiClasses.text.labelBright} inline-flex items-center gap-2">
          <input class="${uiClasses.input.checkbox}" type="checkbox" name="removeImage" value="true" />
          Remove image
        </label>
      </div>`
  const shopBadges = product.shopIds.length
    ? product.shopIds
        .map((shopId) => shops.find((shop) => shop.id === shopId))
        .filter(Boolean)
        .map(
          (shop) =>
            `<span class="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.3em] text-white/80">${shop?.name ?? 'Store'}</span>`
        )
        .join(' ')
    : `<span class="${uiClasses.text.metadataSmall} text-white/60">Not listed in any store</span>`
  const listingBadges = product.listingCodes.length
    ? product.listingCodes
        .map(
          (code) =>
            `<span class="rounded-full border border-white/15 bg-white/5 px-2 py-1 text-[0.7rem] font-semibold uppercase tracking-[0.25em] text-white/80">${escapeAttr(
              code
            )}</span>`
        )
        .join(' ')
    : `<span class="${uiClasses.text.metadataSmall} text-white/60">No linked listings</span>`
  const shopCheckboxes = shops
    .map(
      (shop) => `
        <label class="group flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-2 text-white shadow-[0_0_0_1px_rgba(255,255,255,0.05)] transition hover:border-white/30 hover:shadow-[0_0_0_1px_rgba(255,255,255,0.12)]">
          <input
            class="${uiClasses.input.checkbox} accent-[#ff2b2b]"
            type="checkbox"
            name="shopIds"
            value="${shop.id}"
            ${product.shopIds.includes(shop.id) ? 'checked' : ''}
            data-shop-checkbox
            data-shop-id="${shop.id}"
            data-edit-field
            disabled
          />
          <span class="${uiClasses.text.body}">${shop.name}</span>
        </label>
      `
    )
    .join('')
  return `<article id="${cardId}" class="${cardClass}" data-inline-card="${cardId}">
      <form
        class="${uiClasses.layout.space.y2}"
        hx-post="/products/update"
        hx-target="#${cardId}"
        hx-swap="outerHTML"
        data-inline-card-id="${cardId}"
        data-main-section
        hx-encoding="multipart/form-data"
        enctype="multipart/form-data"
      >
        <input type="hidden" name="originalSku" value="${escapeAttr(product.skuRaw)}" />
        <input type="hidden" name="inlineCardId" value="${escapeAttr(cardId)}" />
        <div class="grid gap-2 md:grid-cols-[140px,1fr] items-start">
          <div class="space-y-2">
            <div class="aspect-square w-full max-w-[120px] overflow-hidden rounded-xl border-2 border-white/20 bg-black/70 shadow-[0_0_18px_rgba(0,0,0,0.35)] flex items-center justify-center">
              ${imageFrame}
            </div>
            ${imageControls}
          </div>
          <div class="${uiClasses.layout.space.y2}">
            <div class="flex flex-wrap items-start gap-3">
              <div class="flex-1 min-w-[14rem] space-y-1">
                <div class="${inlineFieldClass}">
                  <p class="${inlineLabelClass}">Product name:</p>
                  <p class="${uiClasses.text.bodyLarge}" data-view-field>${product.name}</p>
                </div>
                <input class="${uiClasses.input.base} hidden" data-edit-field type="text" name="name" required value="${escapeAttr(
                  product.nameRaw
                )}" />
              </div>
              <div class="space-y-1">
                <div class="${inlineFieldClass}">
                  <p class="${inlineLabelClass}">SKU:</p>
                  <p class="${skuValueClass}" data-view-field>${product.sku}</p>
                </div>
                <input class="${uiClasses.input.base} hidden" data-edit-field type="text" name="sku" required value="${escapeAttr(
                  product.skuRaw
                )}" />
              </div>
            </div>

            <div class="grid gap-2 sm:grid-cols-2">
              <div class="space-y-1">
                <div class="${inlineFieldClass}">
                  <p class="${inlineLabelClass}">Status:</p>
                  <p class="${uiClasses.text.body}" data-view-field>${product.statusName}</p>
                </div>
                <select class="${uiClasses.input.select} hidden" data-edit-field name="status" required>
                  ${statusOptions}
                </select>
              </div>
              <div class="space-y-1">
                <div class="${inlineFieldClass}">
                  <p class="${inlineLabelClass}">Cost:</p>
                  <p class="${uiClasses.text.body}" ${costDataAttrs} data-view-field>${product.costDisplay}</p>
                </div>
                <input
                  class="${uiClasses.input.base} hidden"
                  data-edit-field
                  type="number"
                  min="0"
                  step="0.01"
                  name="cost"
                  placeholder="0.00"
                  value="${costValue}"
                />
              </div>
            </div>

            <div class="${inlineFieldClass}">
              <p class="${inlineLabelClass}">Listings:</p>
              <div class="flex flex-wrap gap-2" data-view-field>${listingBadges}</div>
            </div>

            <div class="grid gap-2 sm:grid-cols-2">
              <div class="space-y-2">
                <div class="${inlineFieldClass}">
                  <p class="${inlineLabelClass}">Supplier:</p>
                  ${
                    product.hasSupplierLink
                      ? `<a class="${cx(uiClasses.text.body, accentTextClass, accentLinkClass)}" href="${product.supplierLink}" target="_blank" rel="noreferrer" data-view-field>${supplierLabel}</a>`
                      : `<p class="${uiClasses.text.body} whitespace-nowrap" data-view-field>${supplierLabel}</p>`
                  }
                </div>
                <select class="${uiClasses.input.select} hidden" data-edit-field name="supplierId">
                  ${supplierOptions}
                </select>
                <label class="${uiClasses.text.labelBright} hidden space-y-1" data-edit-field>
                  Supplier link
                  <input
                    class="${uiClasses.input.base}"
                    type="url"
                    name="supplierLink"
                    placeholder="https://supplier.example.com"
                    value="${product.supplierLink ? escapeAttr(product.supplierLink) : ''}"
                  />
                </label>
              </div>
              <div class="space-y-1">
                <div class="${inlineFieldClass} items-start">
                  <p class="${inlineLabelClass}">Purchase remarks:</p>
                  <p class="${uiClasses.text.body} whitespace-pre-line" data-view-field>${product.purchaseRemarks || '—'}</p>
                </div>
                <textarea
                  class="${uiClasses.input.textarea} hidden"
                  data-edit-field
                  name="purchaseRemarks"
                  rows="2"
                  placeholder="Delivery details, packaging notes, etc."
                >${product.purchaseRemarks || ''}</textarea>
              </div>
            </div>

            <div class="space-y-2">
              <p class="${inlineLabelClass}">Stores:</p>
              <div class="${uiClasses.layout.flex.gap2} flex-wrap" data-view-field>
                ${shopBadges}
              </div>
              <div class="flex flex-wrap gap-2 hidden" data-edit-field>
                ${shopCheckboxes}
              </div>
            </div>
          </div>
        </div>

        ${sellingPricesSection}

        <div class="${uiClasses.layout.flex.gap3}">
          <button type="button" class="${uiClasses.button.successCompact}" data-inline-edit>
            Edit
          </button>
          <button
            type="button"
            class="${uiClasses.button.dangerCompact} transition-transform duration-150 will-change-transform hover:-translate-y-[1px]"
            data-inline-delete
            data-delete-class="${uiClasses.button.dangerCompact} transition-transform duration-150 will-change-transform hover:-translate-y-[1px]"
            data-cancel-class="${uiClasses.button.neutralCompact}"
          >
            Delete
          </button>
        </div>
      </form>

      <div class="hidden space-y-3 border-t border-white/10 pt-3" data-delete-section>
        <div class="${uiClasses.layout.flex.gap3} items-center">
          <p class="${uiClasses.text.headingBold} text-red-300 mb-0">Delete SKU <span class="!normal-case">${escapeAttr(
            product.skuRaw
          )}</span>?</p>
        </div>
        <p class="${uiClasses.text.bodySmall}">Type the SKU to confirm deletion. This cannot be undone.</p>
        <div
          id="${deleteFeedbackId}"
          class="${uiClasses.text.feedback}"
          data-inline-feedback
        ></div>
        <form
          class="${uiClasses.layout.space.y3}"
          hx-post="/products/delete"
          hx-target="#${cardId}"
          hx-swap="outerHTML"
          data-inline-card-id="${cardId}"
          hx-on::afterRequest="if(event.detail && (event.detail.successful || (event.detail.xhr && event.detail.xhr.status < 300))){const btn=this.closest('[data-inline-card]')?.querySelector('[data-inline-close]'); if(btn instanceof HTMLElement){btn.click();}}"
        >
          <input type="hidden" name="sku" value="${escapeAttr(product.skuRaw)}" />
          <input type="hidden" name="inlineCardId" value="${escapeAttr(cardId)}" />
          <label class="${uiClasses.text.labelBright} block space-y-1">
            Confirm SKU
            <input
              class="${uiClasses.input.base}"
              type="text"
              name="confirmation"
              required
              placeholder="Type ${escapeAttr(product.skuRaw)} to confirm"
            />
          </label>
          <div class="${uiClasses.layout.flex.gap3}">
            <button type="submit" class="${uiClasses.button.dangerCompact}">
              Delete product
            </button>
            <button type="button" class="${uiClasses.button.neutralCompact}" data-inline-delete>Cancel</button>
          </div>
        </form>
      </div>
    </article>`
}

export const renderProductListingSection = (
  products: ProductCard[],
  statuses: ProductStatusOption[],
  suppliers: SupplierOption[],
  shops: ShopOption[],
  options: ProductListingOptions = {}
) => {
  const { visibleProducts, pagination } = paginateProducts(products, options.page)
  const productCards = visibleProducts.length
    ? visibleProducts.map((product) => renderProductCard(product, statuses, suppliers, shops)).join('')
    : `<p class="${uiClasses.text.bodySmall}">No products yet.</p>`
  const paginationControls = pagination.totalProducts
    ? renderPaginationControls(pagination, {
        ...options,
        sort: options.sort ?? 'name-asc',
        supplierFilters: options.supplierFilters ?? [],
        statusFilters: options.statusFilters ?? [],
      })
    : ''

  return `<section id="product-listings" class="${uiClasses.panel.inner}">
      ${paginationControls}
      <div class="${uiClasses.layout.space.y4}">
        ${productCards}
      </div>
    </section>`
}

export const productPage = (
  products: ProductCard[],
  statuses: ProductStatusOption[],
  suppliers: SupplierOption[],
  shops: ShopOption[],
  feedbackMessage = '',
  feedbackClass = 'text-sm text-white/70 uppercase tracking-[0.3em]',
  searchValue = '',
  sortDirection: ProductSortOption = 'name-asc',
  supplierFilters: number[] = [],
  statusFilters: number[] = [],
  currentPage = 1
) => {
  const sanitizeInputValue = (value: string) => value.replace(/"/g, '&quot;')

  const listingSection = renderProductListingSection(products, statuses, suppliers, shops, {
    page: currentPage,
    search: searchValue,
    sort: sortDirection,
    supplierFilters,
    statusFilters,
  })

  const sidebarId = 'product-sort-sidebar'
  const editorPanel = `<section class="${uiClasses.panel.base}">
      <div class="flex flex-col gap-3 md:flex-row md:items-end md:gap-4">
        <div class="flex-1 w-full">
          ${renderSearchSortControls({
            searchId: 'product-search',
            searchPlaceholder: 'Search by SKU, name, or supplier',
            searchValue: sanitizeInputValue(searchValue),
            action: '/products',
            variant: 'inline',
            openEditorHref: '/products/manage',
            openEditorLabel: 'Add product',
            sidebarId,
            sidebarTriggerLabel: 'Sort & Filter',
            hiddenParams: {
              supplierId: supplierFilters.map(String),
              statusId: statusFilters.map(String),
              sort: [sortDirection],
            },
          })}
        </div>
      </div>
    </section>`

  const sortOptions: { value: ProductSortOption; label: string }[] = [
    { value: 'sku-asc', label: 'SKU (A -> Z)' },
    { value: 'sku-desc', label: 'SKU (Z -> A)' },
    { value: 'name-asc', label: 'Product Name (A -> Z)' },
    { value: 'name-desc', label: 'Product Name (Z -> A)' },
  ]

  const sortSection = createSortSection(sortOptions, sortDirection)
  const supplierOptions = suppliers.map((s) => ({ label: s.name, value: s.id }))
  const statusOptions = statuses.map((s) => ({ label: s.name, value: s.id }))
  const suppliersSection = createFilterSection('Suppliers', 'supplierId', supplierOptions, supplierFilters)
  const statusesSection = createFilterSection('Statuses', 'statusId', statusOptions, statusFilters)

  const filterSidebar = renderFilterSidebar({
    id: sidebarId,
    title: 'Sort & Filter',
    action: '/products',
    hiddenInputs: {
      search: sanitizeInputValue(searchValue),
    },
    sections: [sortSection, suppliersSection, statusesSection],
  })

  const feedbackContent = feedbackMessage
    ? `<div id="product-feedback" class="${feedbackClass}">${feedbackMessage}</div>`
    : ''
  const mainContent = `<div class="${uiClasses.layout.space.y2}">
      ${feedbackContent}
      ${editorPanel}
      ${listingSection}
    </div>
    ${filterSidebar}`

  const extraHead = `
    <script src="https://unpkg.com/htmx.org@1.9.2"></script>
    ${inlineCardScript}
    ${toastClientScript}
    <script>
      document.addEventListener('htmx:afterSwap', (event) => {
        const target = event.detail && event.detail.target
        const targetId = target && target.id ? target.id : target?.getAttribute?.('data-inline-card')
        const status = event.detail && event.detail.xhr ? event.detail.xhr.status : null
        const responsePreview = event.detail && event.detail.xhr && typeof event.detail.xhr.responseText === 'string'
          ? event.detail.xhr.responseText.slice(0, 200)
          : ''
        console.debug('[htmx swap]', { target: targetId || target?.tagName, status, preview: responsePreview })
      })
      document.addEventListener('htmx:afterRequest', (event) => {
        const status = event.detail && event.detail.xhr ? event.detail.xhr.status : null
        console.debug('[htmx request]', { status, url: event.detail?.xhr?.responseURL })
      })
    </script>
  `
  return layout('products', 'Products - GenTech', '', mainContent, extraHead)
}
