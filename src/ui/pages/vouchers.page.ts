import { layout } from '../layout.ui'
import { renderSearchSortControls } from '../templates/editor.template'
import { inlineCardScript } from '../templates/card.template'
import { renderFilterSidebar, createSortSection, createFilterSection } from '../templates/filterSidebar.template'
import { toastClientScript } from '../templates/toast.template'
import { uiClasses, cx } from '../styles/classes.ui'
import { VouchersPagePayload, VoucherListItem, VoucherSortOption } from '../../services/vouchers.service'

type VoucherListingOptions = {
  page?: number
  search?: string
  sort?: VoucherSortOption
  shopFilters?: number[]
}

const escapeAttr = (value: string | number) => value.toString().replace(/"/g, '&quot;')

const toId = (value: string | number) => value.toString().replace(/[^a-zA-Z0-9_-]/g, '-')

const centsToInput = (value: number | null) => (typeof value === 'number' ? (value / 100).toFixed(2) : '')

type VoucherPagination = {
  currentPage: number
  totalPages: number
  totalVouchers: number
  start: number
  end: number
}

const VOUCHERS_PER_PAGE = 20

const getPageWindow = (pagination: VoucherPagination, windowSize = 4): number[] => {
  const start = Math.max(1, Math.min(pagination.currentPage - 1, Math.max(1, pagination.totalPages - windowSize + 1)))
  const pages: number[] = []
  for (let i = 0; i < windowSize && start + i <= pagination.totalPages; i += 1) {
    pages.push(start + i)
  }
  return pages
}

const paginateVouchers = (vouchers: VoucherListItem[], requestedPage?: number) => {
  const totalVouchers = vouchers.length
  const totalPages = Math.max(1, Math.ceil(totalVouchers / VOUCHERS_PER_PAGE))
  const safePage = Math.min(Math.max(requestedPage ?? 1, 1), totalPages)
  const startIndex = (safePage - 1) * VOUCHERS_PER_PAGE
  const endIndex = startIndex + VOUCHERS_PER_PAGE

  return {
    visibleVouchers: vouchers.slice(startIndex, endIndex),
    pagination: {
      currentPage: safePage,
      totalPages,
      totalVouchers,
      start: totalVouchers === 0 ? 0 : startIndex + 1,
      end: Math.min(endIndex, totalVouchers),
    } satisfies VoucherPagination,
  }
}

const buildVoucherPageHref = (page: number, options: VoucherListingOptions) => {
  const params = new URLSearchParams()
  const sort = options.sort ?? 'min-spend-asc'
  if (options.search) {
    params.set('search', options.search)
  }
  params.set('sort', sort)
  ;(options.shopFilters ?? []).forEach((shopId) => {
    params.append('shopId', shopId.toString())
  })
  if (page > 1) {
    params.set('page', page.toString())
  }
  const query = params.toString()
  return query ? `/vouchers?${query}` : '/vouchers'
}

const renderPaginationControls = (pagination: VoucherPagination, options: VoucherListingOptions) => {
  if (!pagination.totalVouchers) {
    return ''
  }
  const prevDisabled = pagination.currentPage <= 1
  const nextDisabled = pagination.currentPage >= pagination.totalPages
  const prevHref = prevDisabled ? '' : buildVoucherPageHref(pagination.currentPage - 1, options)
  const nextHref = nextDisabled ? '' : buildVoucherPageHref(pagination.currentPage + 1, options)
  const pageWindow = getPageWindow(pagination)
  const showTrailingEllipsis = pageWindow[pageWindow.length - 1] < pagination.totalPages
  const pageButtons = pageWindow
    .map((page) => {
      const isCurrent = page === pagination.currentPage
      const commonClasses = `${uiClasses.button.secondaryCompact} min-w-[3rem] text-center`
      if (isCurrent) {
        return `<span class="${commonClasses}" aria-current="true">${page}</span>`
      }
      return `<a class="${commonClasses}" href="${buildVoucherPageHref(page, options)}">${page}</a>`
    })
    .join('')
  const lastPageButton =
    pagination.totalPages > 0 && pageWindow[pageWindow.length - 1] !== pagination.totalPages
      ? `<a class="${uiClasses.button.secondaryCompact} min-w-[3rem] text-center" href="${buildVoucherPageHref(
          pagination.totalPages,
          options
        )}">${pagination.totalPages}</a>`
      : ''
  const trailingEllipsis = showTrailingEllipsis ? `<span class="${uiClasses.text.metadata}">...</span>` : ''
  const firstHref = pagination.currentPage > 1 ? buildVoucherPageHref(1, options) : ''
  const lastHref = pagination.currentPage < pagination.totalPages ? buildVoucherPageHref(pagination.totalPages, options) : ''

  return `<div class="${uiClasses.layout.space.y3} ${uiClasses.divider.base} pb-3">
      <div class="${uiClasses.layout.flex.between}">
        <p class="${uiClasses.text.metadata}">Showing ${pagination.start}-${pagination.end} of ${pagination.totalVouchers} (${VOUCHERS_PER_PAGE} per page)</p>
        <div class="${uiClasses.layout.flex.gap2}">
          <a class="${uiClasses.button.secondaryCompact} ${
            prevDisabled ? 'pointer-events-none opacity-40' : ''
          }" ${prevDisabled ? 'tabindex="-1" aria-disabled="true"' : `href="${firstHref}"`}>
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
          <a class="${uiClasses.button.secondaryCompact} ${
            nextDisabled ? 'pointer-events-none opacity-40' : ''
          }" ${nextDisabled ? 'tabindex="-1" aria-disabled="true"' : `href="${lastHref}"`}>
            Last
          </a>
        </div>
      </div>
    </div>`
}

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

const renderVoucherCard = (
  voucher: VoucherListItem,
  payload: Pick<VouchersPagePayload, 'shops' | 'voucherDiscountTypes' | 'voucherTypes'>
) => {
  const cardId = `voucher-${toId(voucher.id)}`
  const feedbackId = `${cardId}-feedback`
  const discountValue =
    voucher.voucherDiscountTypeKey === 'percentage'
      ? (voucher.discount / 100).toFixed(2)
      : centsToInput(voucher.discount)
  const minSpendValue = centsToInput(voucher.minSpend)
  const maxDiscountValue = centsToInput(voucher.maxDiscount)
  const confirmationLabel = `#${voucher.id} - ${voucher.shopName} - ${voucher.voucherCategoryLabel} / ${voucher.voucherDiscountTypeLabel}`
  const shopOptions = payload.shops
    .map(
      (shop) => `<option value="${shop.id}" ${shop.id === voucher.shopId ? 'selected' : ''}>${shop.name}</option>`
    )
    .join('')
  const voucherTypeOptions = payload.voucherTypes
    .map(
      (type) =>
        `<option value="${type.id}" ${type.id === voucher.voucherTypeId ? 'selected' : ''}>${type.name}</option>`
    )
    .join('')
  const discountTypeOptions = payload.voucherDiscountTypes
    .map(
      (type) =>
        `<option value="${type.id}" ${type.id === voucher.voucherDiscountTypeId ? 'selected' : ''}>${type.label}</option>`
    )
    .join('')

  const discountDataAttrs =
    voucher.voucherDiscountTypeKey === 'percentage'
      ? ''
      : `data-money-cents="${voucher.discount}" data-money-base="SGD"`
  const maxDiscountDataAttrs =
    voucher.maxDiscount !== null
      ? `data-money-cents="${voucher.maxDiscount}" data-money-base="SGD"`
      : ''
  const editFeedbackId = `${cardId}-edit-feedback`
  const deleteFeedbackId = `${cardId}-delete-feedback`
  const matchedShop = payload.shops.find((shop) => shop.id === voucher.shopId)
  const highlightKey = getShopHighlightKey(matchedShop?.name ?? voucher.shopName, matchedShop?.code)
  const highlight = highlightKey ? uiClasses.shopHighlight[highlightKey] : null
  const cardClass = cx(uiClasses.card.withShadow, 'relative overflow-hidden', highlight?.outline)
  const shopNameClass = cx(uiClasses.text.bodyLarge, highlight?.text)
  const inlineFieldClass = 'flex flex-wrap items-baseline gap-2 text-sm'
  const inlineLabelClass = cx(uiClasses.text.label, 'mb-0')
  return `<article class="${cardClass}" data-inline-card="${cardId}">
      <form
        class="${uiClasses.layout.space.y2}"
        hx-post="/vouchers/update"
        hx-target="#voucher-history-section"
        hx-swap="outerHTML"
        data-inline-card-id="${cardId}"
        data-main-section
      >
        <input type="hidden" name="voucherId" value="${escapeAttr(voucher.id)}" />
        <input type="hidden" name="inlineCardId" value="${escapeAttr(cardId)}" />
        <div class="${uiClasses.layout.space.y2}">
          <p class="${shopNameClass}" data-view-field>${voucher.shopName}</p>
          <div class="grid gap-2 sm:grid-cols-2">
            <div class="space-y-1">
              <div class="${inlineFieldClass}">
                <p class="${inlineLabelClass}">Shop:</p>
                <p class="${uiClasses.text.body}" data-view-field>${voucher.shopName}</p>
              </div>
              <select class="${uiClasses.input.select} hidden" data-edit-field name="shopId" required>
                ${shopOptions}
              </select>
            </div>
            <div class="space-y-1">
              <div class="${inlineFieldClass}">
                <p class="${inlineLabelClass}">Voucher type:</p>
                <p class="${uiClasses.text.body}" data-view-field>${voucher.voucherCategoryLabel}</p>
              </div>
              <select class="${uiClasses.input.select} hidden" data-edit-field name="voucherTypeId" required>
                <option value="" disabled>Select a type</option>
                ${voucherTypeOptions}
              </select>
            </div>
          </div>
          <div class="space-y-1">
            <div class="${inlineFieldClass}">
              <p class="${inlineLabelClass}">Discount type:</p>
              <p class="${uiClasses.text.body}" data-view-field>${voucher.voucherDiscountTypeLabel}</p>
            </div>
            <select class="${uiClasses.input.select} hidden" data-edit-field name="voucherDiscountTypeId" required>
              <option value="" disabled>Select a discount</option>
              ${discountTypeOptions}
            </select>
          </div>
          <div class="grid gap-2 sm:grid-cols-3">
            <div class="space-y-1">
              <div class="${inlineFieldClass}">
                <p class="${inlineLabelClass}">Min spend:</p>
                <p class="${uiClasses.text.body}" data-view-field data-money-cents="${voucher.minSpend}" data-money-base="SGD">${voucher.minSpendDisplay}</p>
              </div>
              <input
                class="${uiClasses.input.base} hidden"
                data-edit-field
                type="number"
                min="0"
                step="0.01"
                name="minSpend"
                required
                value="${minSpendValue}"
              />
            </div>
            <div class="space-y-1">
              <div class="${inlineFieldClass}">
                <p class="${inlineLabelClass}">Discount:</p>
                <p class="${uiClasses.text.body}" data-view-field ${discountDataAttrs}>${voucher.discountDisplay}</p>
              </div>
              <input
                class="${uiClasses.input.base} hidden"
                data-edit-field
                type="number"
                min="0"
                step="0.01"
                name="discount"
                required
                value="${discountValue}"
              />
            </div>
            <div class="space-y-1">
              <div class="${inlineFieldClass}">
                <p class="${inlineLabelClass}">Max discount:</p>
                <p class="${uiClasses.text.body}" data-view-field ${maxDiscountDataAttrs}>${voucher.maxDiscountDisplay}</p>
              </div>
              <input
                class="${uiClasses.input.base} hidden"
                data-edit-field
                type="number"
                min="0"
                step="0.01"
                name="maxDiscount"
                value="${maxDiscountValue}"
              />
            </div>
          </div>
        </div>
        <div class="${uiClasses.layout.flex.gap3}">
          <button type="button" class="${uiClasses.button.successCompact}" data-inline-edit>
            Edit
          </button>
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
      </form>
      <div class="hidden space-y-3 border-t border-white/10 pt-3" data-delete-section>
        <div class="${uiClasses.layout.flex.gap3} items-center">
          <p class="${uiClasses.text.headingBold} text-red-300 mb-0">Delete voucher #${voucher.id}?</p>
        </div>
        <p class="${uiClasses.text.bodySmall}">Type the label below to confirm deletion.</p>
        <p class="${uiClasses.text.metadata}">${confirmationLabel}</p>
        <div
          id="${deleteFeedbackId}"
          class="${uiClasses.text.feedback}"
          data-inline-feedback
        ></div>
        <form
          class="${uiClasses.layout.space.y3}"
          hx-post="/vouchers/delete"
          hx-target="#voucher-history-section"
          hx-swap="outerHTML"
          data-inline-card-id="${cardId}"
          hx-on::afterRequest="if(event.detail && (event.detail.successful || (event.detail.xhr && event.detail.xhr.status < 300))){const btn=this.closest('[data-inline-card]')?.querySelector('[data-inline-close]'); if(btn instanceof HTMLElement){btn.click();}}"
        >
          <input type="hidden" name="voucherId" value="${escapeAttr(voucher.id)}" />
          <input type="hidden" name="inlineCardId" value="${escapeAttr(cardId)}" />
          <label class="${uiClasses.text.labelBright} block space-y-1">
            Confirm deletion
            <input
              class="${uiClasses.input.base}"
              type="text"
              name="confirmation"
              required
              placeholder="Type label to confirm"
            />
          </label>
          <div class="${uiClasses.layout.flex.gap3}">
            <button type="submit" class="${uiClasses.button.dangerCompact}">
              Delete voucher
            </button>
            <button type="button" class="${uiClasses.button.neutralCompact}" data-inline-delete>Cancel</button>
          </div>
        </form>
      </div>
    </article>`
}

export const renderVoucherHistorySection = (
  vouchers: VoucherListItem[],
  context: Pick<VouchersPagePayload, 'shops' | 'voucherDiscountTypes' | 'voucherTypes'>,
  _message?: string,
  _messageClass = 'px-3 py-2 text-[0.65rem] uppercase tracking-[0.35em] text-white/70',
  options: VoucherListingOptions = {}
) => {
  const { visibleVouchers, pagination } = paginateVouchers(vouchers, options.page)
  const paginationControls = renderPaginationControls(pagination, {
    page: options.page ?? 1,
    search: options.search ?? '',
    sort: options.sort ?? 'min-spend-asc',
    shopFilters: options.shopFilters ?? [],
  })
  const voucherHistory = visibleVouchers.length
    ? visibleVouchers.map((voucher) => renderVoucherCard(voucher, context)).join('')
    : `<p class="${uiClasses.text.bodySmall}">No vouchers recorded yet.</p>`
  return `<section id="voucher-history-section" class="${uiClasses.panel.base}">
      ${paginationControls}
      <div class="${uiClasses.layout.space.y3}">
        ${voucherHistory}
      </div>
    </section>`
}

export const vouchersPage = (
  {
    vouchers,
    shops,
    voucherDiscountTypes,
    voucherTypes,
  }: VouchersPagePayload,
  feedbackMessage = '',
  feedbackClass = 'text-sm uppercase tracking-[0.3em] text-white/70',
  searchValue = '',
  sortDirection: VoucherSortOption = 'min-spend-asc',
  shopFilters: number[] = [],
  currentPage = 1
) => {
  const sanitizeInputValue = (value: string) => value.replace(/"/g, '&quot;')
  const listingOptions: VoucherListingOptions = {
    page: currentPage,
    search: searchValue,
    sort: sortDirection,
    shopFilters,
  }
  const historySection = renderVoucherHistorySection(vouchers, { shops, voucherDiscountTypes, voucherTypes }, undefined, undefined, listingOptions)
  const heroContent = ''
  const sidebarId = 'voucher-sort-sidebar'
  const editorPanel = `<section class="${uiClasses.panel.base}">
      <div class="flex flex-col gap-3 md:flex-row md:items-end md:gap-4">
        <div class="flex-1 w-full">
          ${renderSearchSortControls({
            searchId: 'voucher-search',
            searchPlaceholder: 'Search vouchers',
            searchValue: sanitizeInputValue(searchValue),
            action: '/vouchers',
            variant: 'inline',
            openEditorHref: '/vouchers/manage',
            openEditorLabel: 'Add voucher',
            sidebarId,
            sidebarTriggerLabel: 'Sort & Filter',
            hiddenParams: {
              sort: [sortDirection],
              shopId: shopFilters.map(String),
            },
          })}
        </div>
      </div>
    </section>`
  const feedbackBanner = feedbackMessage
    ? `<div class="${feedbackClass}">${feedbackMessage}</div>`
    : ''

  const sortOptions: { value: VoucherSortOption; label: string }[] = [
    { value: 'min-spend-asc', label: 'Min spend (Low → High)' },
    { value: 'min-spend-desc', label: 'Min spend (High → Low)' },
    { value: 'max-discount-asc', label: 'Max discount (Low → High)' },
    { value: 'max-discount-desc', label: 'Max discount (High → Low)' },
  ]

  const sortSection = createSortSection(sortOptions, sortDirection)
  const shopOptions = shops.map((shop) => ({ label: shop.name, value: shop.id }))
  const shopsSection = createFilterSection('Shops', 'shopId', shopOptions, shopFilters)

  const filterSidebar = renderFilterSidebar({
    id: sidebarId,
    title: 'Sort & Filter',
    action: '/vouchers',
    hiddenInputs: {
      search: sanitizeInputValue(searchValue),
    },
    sections: [sortSection, shopsSection],
  })

  const mainContent = `<div class="${uiClasses.layout.space.y1}">
      ${feedbackBanner}
      ${editorPanel}
      ${historySection}
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
  return layout('vouchers', 'Vouchers - GenTech', heroContent, mainContent, extraHead)
}
