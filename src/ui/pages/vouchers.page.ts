import { layout } from '../layout.ui'
import { renderSearchSortControls } from '../templates/editor.template'
import { renderCard } from '../templates/card.template'
import { renderFilterSidebar, createSortSection, createFilterSection } from '../templates/filterSidebar.template'
import { uiClasses } from '../styles/classes.ui'
import { VouchersPagePayload, VoucherListItem, VoucherSortOption } from '../../services/vouchers.service'

const renderVoucherCard = (voucher: VoucherListItem) => {
  const discountDataAttrs = voucher.voucherDiscountTypeKey === 'percentage'
    ? undefined
    : { 'money-cents': voucher.discount, 'money-base': 'SGD' }

  const maxDiscountDataAttrs = voucher.maxDiscount !== null
    ? { 'money-cents': voucher.maxDiscount, 'money-base': 'SGD' }
    : undefined

  return renderCard({
    header: {
      title: voucher.shopName,
      metadata: voucher.createdAt,
    },
    subtitle: voucher.voucherCategoryLabel,
    secondarySubtitle: voucher.voucherDiscountTypeLabel,
    fields: [
      {
        label: 'Min spend',
        value: voucher.minSpendDisplay,
        dataAttributes: { 'money-cents': voucher.minSpend, 'money-base': 'SGD' },
      },
      {
        label: 'Discount',
        value: voucher.discountDisplay,
        dataAttributes: discountDataAttrs,
      },
      {
        label: 'Max discount',
        value: voucher.maxDiscountDisplay,
        dataAttributes: maxDiscountDataAttrs,
      },
    ],
    gridColumns: 3,
  })
}

export const renderVoucherHistorySection = (
  vouchers: VoucherListItem[],
  message?: string,
  messageClass = 'px-3 py-2 text-[0.65rem] uppercase tracking-[0.35em] text-white/70'
) => {
  const voucherHistory = vouchers.length
    ? vouchers.map(renderVoucherCard).join('')
    : `<p class="${uiClasses.text.bodySmall}">No vouchers recorded yet.</p>`
  const messageMarkup = message
    ? `<div class="${messageClass} ${uiClasses.divider.base}">${message}</div>`
    : ''
  return `<section id="voucher-history-section" hx-swap-oob="outerHTML" class="${uiClasses.panel.base}">
      ${messageMarkup}
      <div class="${uiClasses.layout.space.y3}">
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

  const sortSection = createSortSection(sortOptions, sortDirection)
  const shopOptions = shops.map(shop => ({ label: shop.name, value: shop.id }))
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

  const mainContent = `<div class="${uiClasses.layout.space.y3}">
      ${feedbackBanner}
      ${editorPanel}
      ${historySection}
    </div>
    ${filterSidebar}`
  const extraHead = `
    <script src="https://unpkg.com/htmx.org@1.9.2"></script>
  `
  return layout('vouchers', 'Vouchers - GenTech', heroContent, mainContent, extraHead)
}
