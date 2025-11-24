import { layout } from '../layout.ui'
import { uiClasses, cx } from '../styles/classes.ui'
import type { ListingsPagePayload, ListingItem, ShopOption, ProductOption } from '../../services/listings.service'
import { escapeHtml } from '../../domain/formatters.domain'
import { inlineCardScript } from '../templates/card.template'
import { toastClientScript } from '../templates/toast.template'

const escapeAttr = (value: string) => value.replace(/"/g, '&quot;')
const normalizeShopIdentifier = (value?: string) => value?.toLowerCase().replace(/[^a-z0-9]/g, '') ?? ''
const getShopHighlightKey = (shopName?: string, shopCode?: string) => {
  const identifiers = [shopName, shopCode].map(normalizeShopIdentifier)
  for (const id of identifiers) {
    if (!id) continue
    if (id.includes('shopee')) return 'shopee'
    if (id.includes('lazada')) return 'lazada'
    if (id.includes('tiktok')) return 'tiktok'
    if (id.includes('carousell')) return 'carousell'
  }
  return null
}
const isDuplicateLabel = (name: string, code: string) =>
  normalizeShopIdentifier(name) === normalizeShopIdentifier(code) && Boolean(normalizeShopIdentifier(name))
const LISTINGS_PER_PAGE = 10

type Pagination = {
  currentPage: number
  totalPages: number
  totalItems: number
  start: number
  end: number
}

const paginateListings = (listings: ListingItem[], requestedPage?: number) => {
  const totalItems = listings.length
  const totalPages = Math.max(1, Math.ceil(totalItems / LISTINGS_PER_PAGE))
  const currentPage = Math.min(Math.max(requestedPage ?? 1, 1), totalPages)
  const startIndex = (currentPage - 1) * LISTINGS_PER_PAGE
  const endIndex = startIndex + LISTINGS_PER_PAGE

  return {
    visible: listings.slice(startIndex, endIndex),
    pagination: {
      currentPage,
      totalPages,
      totalItems,
      start: totalItems === 0 ? 0 : startIndex + 1,
      end: Math.min(endIndex, totalItems),
    } satisfies Pagination,
  }
}

const buildListingPageHref = (page: number) => {
  const params = new URLSearchParams()
  if (page > 1) params.set('page', page.toString())
  const query = params.toString()
  return query ? `/listings?${query}` : '/listings'
}

const renderPaginationControls = (pagination: Pagination) => {
  if (!pagination.totalItems) return ''
  const prevDisabled = pagination.currentPage <= 1
  const nextDisabled = pagination.currentPage >= pagination.totalPages
  const prevHref = prevDisabled ? '' : buildListingPageHref(pagination.currentPage - 1)
  const nextHref = nextDisabled ? '' : buildListingPageHref(pagination.currentPage + 1)
  const firstHref = pagination.currentPage > 1 ? buildListingPageHref(1) : ''
  const lastHref = pagination.currentPage < pagination.totalPages ? buildListingPageHref(pagination.totalPages) : ''

  const windowSize = 4
  const start = Math.max(1, Math.min(pagination.currentPage - 1, Math.max(1, pagination.totalPages - windowSize + 1)))
  const pages: number[] = []
  for (let i = 0; i < windowSize && start + i <= pagination.totalPages; i += 1) {
    pages.push(start + i)
  }
  const pageButtons = pages
    .map((page) => {
      const isCurrent = page === pagination.currentPage
      const base = `${uiClasses.button.secondaryCompact} min-w-[3rem] text-center`
      return isCurrent
        ? `<span class="${base}" aria-current="true">${page}</span>`
        : `<a class="${base}" href="${buildListingPageHref(page)}">${page}</a>`
    })
    .join('')
  const trailingEllipsis = pages[pages.length - 1] < pagination.totalPages ? `<span class="${uiClasses.text.metadata}">...</span>` : ''
  const lastPageButton =
    pagination.totalPages > 0 && pages[pages.length - 1] !== pagination.totalPages
      ? `<a class="${uiClasses.button.secondaryCompact} min-w-[3rem] text-center" href="${buildListingPageHref(
          pagination.totalPages
        )}">${pagination.totalPages}</a>`
      : ''

  return `<div class="${uiClasses.layout.space.y3} ${uiClasses.divider.base} pb-3">
    <div class="${uiClasses.layout.flex.between}">
      <p class="${uiClasses.text.metadata}">Showing ${pagination.start}-${pagination.end} of ${pagination.totalItems} (${LISTINGS_PER_PAGE} per page)</p>
      <div class="${uiClasses.layout.flex.gap2}">
        <a class="${uiClasses.button.secondaryCompact} ${prevDisabled ? 'pointer-events-none opacity-40' : ''}" ${
          prevDisabled ? 'tabindex="-1" aria-disabled="true"' : `href="${firstHref}"`
        }>First</a>
        <a class="${uiClasses.button.secondaryCompact} ${prevDisabled ? 'pointer-events-none opacity-40' : ''}" ${
          prevDisabled ? 'tabindex="-1" aria-disabled="true"' : `href="${prevHref}"`
        }>Previous</a>
        <div class="${uiClasses.layout.flex.gap2}">
          ${pageButtons}
          ${trailingEllipsis}
          ${lastPageButton}
        </div>
        <a class="${uiClasses.button.secondaryCompact} ${nextDisabled ? 'pointer-events-none opacity-40' : ''}" ${
          nextDisabled ? 'tabindex="-1" aria-disabled="true"' : `href="${nextHref}"`
        }>Next</a>
        <a class="${uiClasses.button.secondaryCompact} ${nextDisabled ? 'pointer-events-none opacity-40' : ''}" ${
          nextDisabled ? 'tabindex="-1" aria-disabled="true"' : `href="${lastHref}"`
        }>Last</a>
      </div>
    </div>
  </div>`
}

const renderSkuView = (listing: ListingItem) => {
  if (!listing.products.length) {
    return `<p class="${uiClasses.text.bodySmall} text-white/70" data-view-field>No SKUs linked yet.</p>`
  }
  return `<div class="flex flex-wrap gap-2" data-view-field>
    ${listing.products
      .map(
        (product) => `
        <span class="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[0.75rem] font-semibold uppercase tracking-[0.28em] text-white">
          ${escapeHtml(product.sku)}
        </span>
      `
      )
      .join('')}
  </div>`
}

const renderSkuEditor = (listing: ListingItem, products: ProductOption[]) => {
  const datalistId = `sku-options-${listing.id}`
  const cardTarget = `listing-${listing.id}`
  const datalistOptions = products
    .map((product) => {
      const label = product.name ? `${product.sku} - ${product.name}` : product.sku
      return `<option value="${product.sku}">${label}</option>`
    })
    .join('')
  const datalist = `<datalist id="${datalistId}">${datalistOptions}</datalist>`
  const existing = listing.products.length
    ? listing.products
        .map(
          (product) => `
        <form
          class="hidden flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1"
          action="/listings/sku/remove"
          method="post"
          data-edit-field
          hx-post="/listings/sku/remove"
          hx-target="#${cardTarget}"
          hx-swap="outerHTML"
        >
          <input type="hidden" name="listingId" value="${listing.id}" />
          <input type="hidden" name="productSku" value="${escapeAttr(product.skuRaw)}" />
          <span class="text-sm font-semibold uppercase tracking-[0.25em] text-white">${escapeHtml(product.sku)}</span>
          ${product.name ? `<span class="${uiClasses.text.metadataSmall} text-white/60">(${escapeHtml(product.name)})</span>` : ''}
          <button type="submit" class="text-sm font-semibold uppercase tracking-[0.25em] text-red-300 hover:text-red-100">Remove</button>
        </form>
      `
        )
        .join('')
    : ''

  const addForm = `<form
    class="${uiClasses.layout.flex.gap2} hidden"
    action="/listings/sku/add"
    method="post"
    data-edit-field
    hx-post="/listings/sku/add"
    hx-target="#${cardTarget}"
    hx-swap="outerHTML"
  >
    <input type="hidden" name="listingId" value="${listing.id}" />
    <label class="${uiClasses.text.labelBright} block space-y-1">
      Add SKU
      <input class="${uiClasses.input.base}" type="text" name="productSku" required placeholder="SKU123" list="${datalistId}" />
    </label>
    <button type="submit" class="${uiClasses.button.secondaryCompact}">Add</button>
  </form>`

  return `<div class="space-y-2 hidden" data-edit-field>
    ${existing || `<p class="${uiClasses.text.bodySmall} text-white/70">No SKUs yet.</p>`}
    ${addForm}
    ${datalist}
  </div>`
}

const renderShopView = (listing: ListingItem) => {
  if (!listing.shops.length) {
    return `<p class="${uiClasses.text.bodySmall} text-white/70" data-view-field>No shop details configured.</p>`
  }
  return `<div class="grid gap-3 md:grid-cols-2" data-view-field>
    ${listing.shops
      .map(
        (entry) => `
        ${(() => {
          const highlightKey = getShopHighlightKey(entry.shopName, entry.shopCode)
          const highlight = highlightKey ? uiClasses.shopHighlight[highlightKey] : undefined
          const duplicateLabel = isDuplicateLabel(entry.shopName, entry.shopCode)
          const cardClass = cx(uiClasses.card.compact, highlight?.outline)
          const codeLine = duplicateLabel
            ? ''
            : `<p class="${uiClasses.text.metadataSmall} text-white/60">${escapeHtml(entry.shopCode)}</p>`
          return `<div class="${cardClass}">
            <p class="${cx(uiClasses.text.metadata, highlight?.text)}">${escapeHtml(entry.shopName)}</p>
            ${codeLine}
            <p class="${uiClasses.text.body}">${entry.title ? escapeHtml(entry.title) : 'No title set'}</p>
            <p class="${uiClasses.text.bodySmall} text-white/70 whitespace-pre-line">${entry.description ? escapeHtml(entry.description) : 'No description set'}</p>
          </div>`
        })()}
      `
      )
      .join('')}
  </div>`
}

const renderShopEntries = (listing: ListingItem, shops: ShopOption[]) => {
  const existingShopIds = new Set(listing.shops.map((entry) => entry.shopId))
  const availableShops = shops.filter((shop) => !existingShopIds.has(shop.id))
  const currentEntries = listing.shops.length
    ? listing.shops
        .map(
          (entry) => `
          <div class="${cx(uiClasses.card.base, 'space-y-2 hidden', (() => {
            const key = getShopHighlightKey(entry.shopName, entry.shopCode)
            const highlight = key ? uiClasses.shopHighlight[key] : undefined
            return highlight?.outline
          })())}" data-edit-field>
            <div class="${uiClasses.layout.space.y1}">
              <p class="${uiClasses.text.metadata}">${escapeHtml(entry.shopName)}</p>
              ${
                isDuplicateLabel(entry.shopName, entry.shopCode)
                  ? ''
                  : `<p class="${uiClasses.text.metadataSmall} text-white/60">${escapeHtml(entry.shopCode)}</p>`
              }
            </div>
            <label class="${uiClasses.text.labelBright} block space-y-1">
              Title
              <textarea class="${uiClasses.input.textarea} min-h-[120px]" name="shoptitle-${entry.shopId}" rows="4">${escapeHtml(
                entry.titleRaw ?? ''
              )}</textarea>
            </label>
            <label class="${uiClasses.text.labelBright} block space-y-1">
              Description
              <textarea class="${uiClasses.input.textarea} min-h-[360px]" name="shopdescription-${entry.shopId}" rows="14">${escapeHtml(
                entry.descriptionRaw ?? ''
              )}</textarea>
            </label>
          </div>
        `
        )
        .join('')
    : `<p class="${uiClasses.text.bodySmall} text-white/70">No per-shop details yet.</p>`

  const addShopForm = availableShops.length
    ? `<form
        class="${cx(uiClasses.card.base, 'space-y-2 hidden')}"
        action="/listings/shop/save"
        method="post"
        data-edit-field
      >
        <input type="hidden" name="listingId" value="${listing.id}" />
        <p class="${uiClasses.text.headingBold} tracking-[0.35em]">Add shop details</p>
        <label class="${uiClasses.text.labelBright} block space-y-1">
          Shop
          <select class="${uiClasses.input.select}" name="shopId" required>
            <option value="">Select a shop</option>
            ${availableShops
              .map((shop) => `<option value="${shop.id}">${escapeHtml(shop.name)}</option>`)
              .join('')}
          </select>
        </label>
        <label class="${uiClasses.text.labelBright} block space-y-1">
          Title
          <textarea class="${uiClasses.input.textarea} min-h-[120px]" name="title" rows="4" placeholder="Listing title"></textarea>
        </label>
        <label class="${uiClasses.text.labelBright} block space-y-1">
          Description
          <textarea class="${uiClasses.input.textarea} min-h-[360px]" name="description" rows="14" placeholder="Short description"></textarea>
        </label>
        <button type="submit" class="${uiClasses.button.secondaryCompact}">Add shop</button>
      </form>`
    : ''

  return `<div class="grid gap-3 lg:grid-cols-2">
    ${currentEntries}
    ${addShopForm}
  </div>`
}

export const renderListingCard = (listing: ListingItem, shops: ShopOption[], products: ProductOption[]) => {
  const cardId = `listing-${listing.id}`
  return `<article class="${uiClasses.card.base}" data-inline-card="${cardId}" id="${cardId}">
    <div class="${uiClasses.layout.space.y3}" data-main-section>
      <form
        class="${uiClasses.layout.space.y2}"
        action="/listings/update"
        method="post"
        data-inline-card-id="${cardId}"
        hx-post="/listings/update"
        hx-target="#${cardId}"
        hx-swap="outerHTML"
      >
        <div class="${uiClasses.layout.flex.betweenStart}">
          <div class="${uiClasses.layout.space.y1}">
            <p class="${uiClasses.text.headingBold} tracking-[0.35em]">Listing <span data-view-field>${escapeHtml(
              listing.listingCode
            )}</span></p>
            <p class="${uiClasses.text.metadataSmall} text-white/60">ID ${listing.id}</p>
          </div>
          <div class="${uiClasses.layout.flex.gap2}">
            <button type="button" class="${uiClasses.button.successCompact}" data-inline-edit>Edit</button>
            <button
              type="button"
              class="${uiClasses.button.dangerCompact}"
              data-inline-delete
              data-delete-class="${uiClasses.button.dangerCompact}"
              data-cancel-class="${uiClasses.button.neutralCompact}"
            >
              Delete
            </button>
          </div>
        </div>
        <input type="hidden" name="id" value="${listing.id}" />
        <input type="hidden" name="inlineCardId" value="${cardId}" />
        <div class="${uiClasses.layout.space.y1}">
          <p class="${uiClasses.text.label}">Listing code</p>
          <p class="${uiClasses.text.body}" data-view-field>${escapeHtml(listing.listingCode)}</p>
          <input
            class="${uiClasses.input.base} hidden"
            type="text"
            name="listingCode"
            required
            value="${escapeAttr(listing.listingCodeRaw)}"
            data-edit-field
          />
        </div>

        <div class="${uiClasses.layout.space.y2}">
          <div class="${uiClasses.layout.flex.between}">
            <p class="${uiClasses.text.subtitle}">Linked SKUs</p>
          </div>
          ${renderSkuView(listing)}
          ${renderSkuEditor(listing, products)}
        </div>

        <div class="${uiClasses.layout.space.y2}">
          <div class="${uiClasses.layout.flex.between}">
            <p class="${uiClasses.text.subtitle}">Per-shop details</p>
            <div class="${uiClasses.layout.flex.gap2} items-center">
              <span class="${uiClasses.text.metadataSmall}">${listing.shops.length} configured</span>
              <span class="${uiClasses.text.metadataSmall} text-white/60" data-edit-field>Edit mode</span>
            </div>
          </div>
          ${renderShopView(listing)}
          ${renderShopEntries(listing, shops)}
        </div>
      </form>
    </div>

    <div class="hidden space-y-3 border-t border-white/10 pt-3" data-delete-section>
      <p class="${uiClasses.text.headingBold} text-red-300 mb-0">Delete listing <span class="!normal-case">${escapeHtml(
        listing.listingCode
      )}</span>?</p>
      <p class="${uiClasses.text.bodySmall}">This will remove the listing and its associations.</p>
      <p class="${uiClasses.text.metadata}">${escapeHtml(listing.listingCode)}</p>
      <form action="/listings/delete" method="post" class="${uiClasses.layout.space.y2}">
        <input type="hidden" name="id" value="${listing.id}" />
        <label class="${uiClasses.text.labelBright} block space-y-1">
          Confirm listing code
          <input class="${uiClasses.input.base}" type="text" name="confirmation" required placeholder="${escapeAttr(
            listing.listingCodeRaw
          )}" />
        </label>
        <div class="${uiClasses.layout.flex.gap3}">
          <button type="submit" class="${uiClasses.button.dangerCompact}">Confirm delete</button>
          <button type="button" class="${uiClasses.button.neutralCompact}" data-inline-delete>Cancel</button>
        </div>
      </form>
    </div>
  </article>`
}

export const listingsPage = (
  payload: ListingsPagePayload,
  feedbackMessage = '',
  feedbackClass = uiClasses.text.feedback,
  currentPage = 1
) => {
  const { visible, pagination } = paginateListings(payload.listings, currentPage)
  const feedback = feedbackMessage ? `<div class="${feedbackClass}">${feedbackMessage}</div>` : ''

  const createForm = `<section class="${uiClasses.panel.compact}">
    <p class="${uiClasses.text.headingBold} tracking-[0.35em]">Add listing</p>
    <form class="${uiClasses.layout.flex.gap3} items-end flex-wrap" action="/listings/create" method="post">
      <label class="${uiClasses.text.labelBright} block space-y-1">
        Listing code
        <input class="${uiClasses.input.base}" type="text" name="listingCode" required placeholder="LIST-001" />
      </label>
      <button type="submit" class="${uiClasses.button.primaryCompact}">Create</button>
    </form>
  </section>`

  const listingCards = visible.length
    ? visible.map((listing) => renderListingCard(listing, payload.shops, payload.products)).join('')
    : `<p class="${uiClasses.text.bodySmall}">No listings yet.</p>`

  const paginationControls = renderPaginationControls(pagination)

  const listingSection = `<section class="${uiClasses.panel.base}">
    <div class="${uiClasses.layout.flex.between}">
      <p class="${uiClasses.text.headingBold} tracking-[0.35em]">Listings</p>
      <span class="${uiClasses.text.metadataSmall}">${payload.listings.length} total</span>
    </div>
    ${paginationControls}
    <div class="${uiClasses.layout.space.y3}">
      ${listingCards}
    </div>
    ${paginationControls}
  </section>`

  const mainContent = `
    ${feedback}
    ${createForm}
    ${listingSection}
  `

  const extraHead = `
    <script src="https://unpkg.com/htmx.org@1.9.2"></script>
    ${inlineCardScript}
    ${toastClientScript}
  `

  return layout('listings', 'Listings - GenTech', '', mainContent, extraHead)
}
