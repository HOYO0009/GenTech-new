import { layout } from '../layout.ui'
import { renderSearchSortControls } from '../templates/editor.template'
import { renderSidebar } from '../templates/sidebar.template'
import { VouchersPagePayload, VoucherListItem, VoucherSortOption } from '../../services/vouchers.service'
import { shortcutsClientScript } from '../../domain/shortcuts.domain'

const renderVoucherCard = (voucher: VoucherListItem) => {
  return `<article class="rounded-2xl border border-white/10 bg-black/70 p-5 space-y-3">
      <div class="flex items-center justify-between">
        <p class="text-base font-semibold text-white">${voucher.shopName}</p>
        <span class="text-[0.65rem] uppercase tracking-[0.3em] text-white/50">${voucher.createdAt}</span>
      </div>
      <p class="text-sm uppercase tracking-[0.35em] text-white/60">${voucher.voucherCategoryLabel}</p>
      <p class="text-sm uppercase tracking-[0.35em] text-white/40">${voucher.voucherDiscountTypeLabel}</p>
      <div class="grid gap-3 text-sm sm:grid-cols-3">
        <div>
          <p class="text-xs uppercase tracking-[0.35em] text-white/50">Min spend</p>
          <p class="text-base font-semibold text-white">${voucher.minSpendDisplay}</p>
        </div>
        <div>
          <p class="text-xs uppercase tracking-[0.35em] text-white/50">Discount</p>
          <p class="text-base font-semibold text-white">${voucher.discountDisplay}</p>
        </div>
        <div>
          <p class="text-xs uppercase tracking-[0.35em] text-white/50">Max discount</p>
          <p class="text-base font-semibold text-white">${voucher.maxDiscountDisplay}</p>
        </div>
      </div>
    </article>`
}

export const renderVoucherHistorySection = (
  vouchers: VoucherListItem[],
  message?: string,
  messageClass = 'px-3 py-2 text-[0.65rem] uppercase tracking-[0.35em] text-white/70'
) => {
  const voucherHistory = vouchers.length
    ? vouchers.map(renderVoucherCard).join('')
    : '<p class="text-sm text-white/70">No vouchers recorded yet.</p>'
  const messageMarkup = message
    ? `<div class="${messageClass} border-b border-white/5">${message}</div>`
    : ''
  return `<section id="voucher-history-section" hx-swap-oob="outerHTML" class="rounded-2xl border border-white/10 bg-black/70 p-6 space-y-4">
      ${messageMarkup}
      <div class="space-y-3">
        ${voucherHistory}
      </div>
    </section>`
}

export const vouchersPage = (
  {
    vouchers,
    shops,
  }: VouchersPagePayload,
  feedbackMessage = '',
  feedbackClass = 'text-sm uppercase tracking-[0.3em] text-white/70',
  searchValue = '',
  sortDirection: VoucherSortOption = 'date-desc',
  shopFilters: number[] = []
) => {
  const sanitizeInputValue = (value: string) => value.replace(/"/g, '&quot;')
  const historySection = renderVoucherHistorySection(vouchers)
  const heroContent = ''
  const sidebarId = 'voucher-sort-sidebar'
  const editorPanel = `<section class="rounded-2xl border border-white/10 bg-black/70 p-6 space-y-4">
      <div class="flex flex-col gap-3 md:flex-row md:items-end md:gap-4">
        <div class="flex-1 w-full">
          ${renderSearchSortControls({
            searchId: 'voucher-search',
            searchPlaceholder: 'Search vouchers',
            searchValue: sanitizeInputValue(searchValue),
            action: '/vouchers',
            variant: 'inline',
            openEditorHref: '/vouchers/manage',
            openEditorLabel: 'Open voucher editor',
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
    { value: 'date-desc', label: 'Date (Newest first)' },
    { value: 'date-asc', label: 'Date (Oldest first)' },
    { value: 'shop-asc', label: 'Shop (A -> Z)' },
    { value: 'shop-desc', label: 'Shop (Z -> A)' },
  ]

  const shopOptionsMarkup = shops
    .map(
      (shop) => `
        <label class="flex items-center gap-3 text-sm text-white/80">
          <input
            type="checkbox"
            name="shopId"
            value="${shop.id}"
            class="h-4 w-4 rounded border-white/30 bg-white/10 text-red-300 focus:ring-white/40"
            ${shopFilters.includes(shop.id) ? 'checked' : ''}
          />
          <span>${shop.name}</span>
        </label>`
    )
    .join('')

  const mainContent = `<div class="space-y-3">
      ${feedbackBanner}
      ${editorPanel}
      ${historySection}
    </div>
    ${renderSidebar({
      id: sidebarId,
      title: 'Sort & Filter',
      body: `<form action="/vouchers" method="get" class="space-y-4">
        <input type="hidden" name="search" value="${sanitizeInputValue(searchValue)}" />
        <div class="space-y-2">
          <p class="text-[0.7rem] uppercase tracking-[0.3em] text-white/60">Sort by</p>
          <div class="space-y-2">
            ${sortOptions
              .map(
                ({ value, label }) => `
                <label class="flex items-center gap-3 text-sm text-white/80">
                  <input
                    type="radio"
                    name="sort"
                    value="${value}"
                    class="h-4 w-4 rounded border-white/30 bg-white/10 text-red-300 focus:ring-white/40"
                    ${sortDirection === value ? 'checked' : ''}
                  />
                  <span>${label}</span>
                </label>`
              )
              .join('')}
          </div>
        </div>
        <div class="space-y-2">
          <p class="text-[0.7rem] uppercase tracking-[0.3em] text-white/60">Shops</p>
          <div class="space-y-2 max-h-48 overflow-y-auto pr-2">
            ${shopOptionsMarkup || '<p class="text-sm text-white/50">No shops</p>'}
          </div>
        </div>
        <div class="flex items-center gap-3">
          <button type="submit" class="primary-btn w-full text-center">Apply</button>
          <button type="button" data-sidebar-close class="w-full rounded-lg border border-white/20 bg-white/5 px-4 py-2 text-sm font-semibold uppercase tracking-[0.25em] text-white hover:border-white/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40">
            Cancel
          </button>
        </div>
      </form>`,
    })}`
  const extraHead = `
    <script src="https://unpkg.com/htmx.org@1.9.2"></script>
    <script>${shortcutsClientScript()}</script>
  `
  return layout('vouchers', 'Vouchers - GenTech', heroContent, mainContent, extraHead)
}
