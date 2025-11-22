import { layout } from '../layout.ui'
import { renderSearchSortControls } from '../templates/editor.template'
import { renderSidebar } from '../templates/sidebar.template'
import { ProductCard, ProductSortOption, ProductStatusOption, SupplierOption } from '../../services/products.service'
import { shortcutsClientScript } from '../../domain/shortcuts.domain'

export const productPage = (
  products: ProductCard[],
  statuses: ProductStatusOption[],
  suppliers: SupplierOption[],
  feedbackMessage = '',
  feedbackClass = 'text-sm text-white/70 uppercase tracking-[0.3em]',
  searchValue = '',
  sortDirection: ProductSortOption = 'name-asc',
  supplierFilters: number[] = [],
  statusFilters: number[] = []
) => {
  const sanitizeInputValue = (value: string) => value.replace(/"/g, '&quot;')

  const productCards = products.length
    ? products
        .map(
          ({
            sku,
            name,
            statusName,
            costDisplay,
            costCents,
            supplierName,
            supplierLink,
            purchaseRemarks,
          }) => {
          const supplierLabel = supplierName ? supplierName : 'Unassigned'
          const supplierMarkup = supplierLink
            ? `<a class="text-base font-semibold text-red-300 hover:text-white" href="${supplierLink}" target="_blank" rel="noreferrer">${supplierLabel}</a>`
            : `<span class="text-base font-semibold text-white">${supplierLabel}</span>`
          const remarks = purchaseRemarks
            ? `<div class="space-y-1">
                <p class="text-[0.65rem] uppercase tracking-[0.3em] text-white/50">Purchase remarks</p>
                <p class="text-base font-semibold text-white whitespace-pre-line">${purchaseRemarks}</p>
              </div>`
            : ''
          return `<article class="rounded-2xl border border-white/10 bg-black/70 p-5 space-y-3 shadow-[0_0_30px_rgba(0,0,0,0.35)]">
          <div class="flex items-center justify-between text-[0.65rem] uppercase tracking-[0.4em] text-white/60">
            <span>${sku}</span>
            <span>${statusName}</span>
          </div>
          <p class="text-lg font-semibold text-white">${name}</p>
          <div class="grid gap-3 text-sm sm:grid-cols-2">
            <div>
              <p class="text-[0.65rem] uppercase tracking-[0.3em] text-white/50">Cost</p>
              <p
                class="text-base font-semibold text-white"
                ${costDisplay !== 'N/A' && typeof costCents === 'number' ? `data-money-cents="${costCents}" data-money-base="SGD"` : ''}
              >${costDisplay}</p>
            </div>
            <div>
              <p class="text-[0.65rem] uppercase tracking-[0.3em] text-white/50">Supplier</p>
              ${supplierMarkup}
            </div>
          </div>
          ${remarks}
        </article>`
        })
        .join('')
    : '<p class="text-white/80">No products yet.</p>'

  const sidebarId = 'product-sort-sidebar'
  const editorPanel = `<section class="rounded-2xl border border-white/10 bg-black/70 p-6 space-y-4">
      <div class="flex flex-col gap-3 md:flex-row md:items-end md:gap-4">
        <div class="flex-1 w-full">
          ${renderSearchSortControls({
            searchId: 'product-search',
            searchPlaceholder: 'Search by SKU, name, or supplier',
            searchValue: sanitizeInputValue(searchValue),
            action: '/products',
            variant: 'inline',
            openEditorHref: '/products/manage',
            openEditorLabel: 'Open product editor',
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

  const listingSection = `<section id="product-listings" class="bg-black/70 rounded-2xl border border-white/10 shadow-inner p-6 space-y-5">
      <div class="text-sm uppercase tracking-[0.3em] text-white/70">
        Product records
      </div>
      <div class="space-y-4">
        ${productCards}
      </div>
    </section>`

  const sortOptions: { value: ProductSortOption; label: string }[] = [
    { value: 'sku-asc', label: 'SKU (A -> Z)' },
    { value: 'sku-desc', label: 'SKU (Z -> A)' },
    { value: 'name-asc', label: 'Product Name (A -> Z)' },
    { value: 'name-desc', label: 'Product Name (Z -> A)' },
  ]

  const supplierOptionsMarkup = suppliers
    .map(
      (supplier) => `
        <label class="flex items-center gap-3 text-sm text-white/80">
          <input
            type="checkbox"
            name="supplierId"
            value="${supplier.id}"
            class="h-4 w-4 rounded border-white/30 bg-white/10 text-red-300 focus:ring-white/40"
            ${supplierFilters.includes(supplier.id) ? 'checked' : ''}
          />
          <span>${supplier.name}</span>
        </label>`
    )
    .join('')

  const statusOptionsMarkup = statuses
    .map(
      (status) => `
        <label class="flex items-center gap-3 text-sm text-white/80">
          <input
            type="checkbox"
            name="statusId"
            value="${status.id}"
            class="h-4 w-4 rounded border-white/30 bg-white/10 text-red-300 focus:ring-white/40"
            ${statusFilters.includes(status.id) ? 'checked' : ''}
          />
          <span>${status.name}</span>
        </label>`
    )
    .join('')

  const sortSidebar = renderSidebar({
    id: sidebarId,
    title: 'Sort & Filter',
    body: `<form action="/products" method="get" class="space-y-4">
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
        <p class="text-[0.7rem] uppercase tracking-[0.3em] text-white/60">Suppliers</p>
        <div class="space-y-2 max-h-48 overflow-y-auto pr-2">
          ${supplierOptionsMarkup || '<p class="text-sm text-white/50">No suppliers</p>'}
        </div>
      </div>
      <div class="space-y-2">
        <p class="text-[0.7rem] uppercase tracking-[0.3em] text-white/60">Statuses</p>
        <div class="space-y-2 max-h-48 overflow-y-auto pr-2">
          ${statusOptionsMarkup || '<p class="text-sm text-white/50">No statuses</p>'}
        </div>
      </div>
      <div class="flex items-center gap-3">
        <button type="submit" class="primary-btn w-full text-center">Apply</button>
        <button type="button" data-sidebar-close class="w-full rounded-lg border border-white/20 bg-white/5 px-4 py-2 text-sm font-semibold uppercase tracking-[0.25em] text-white hover:border-white/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40">
          Cancel
        </button>
      </div>
    </form>`,
  })

  const feedbackContent = feedbackMessage
    ? `<div id="product-feedback" class="${feedbackClass}">${feedbackMessage}</div>`
    : ''
  const mainContent = `<div class="space-y-3">
      ${feedbackContent}
      ${editorPanel}
      ${listingSection}
    </div>
    ${sortSidebar}`

  const extraHead = `
    <script src="https://unpkg.com/htmx.org@1.9.2"></script>
    <script>${shortcutsClientScript()}</script>
  `
  return layout('products', 'Products - GenTech', '', mainContent, extraHead)
}
