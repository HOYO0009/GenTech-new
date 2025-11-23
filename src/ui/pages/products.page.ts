import { layout } from '../layout.ui'
import { renderSearchSortControls } from '../templates/editor.template'
import { inlineCardScript } from '../templates/card.template'
import { renderFilterSidebar, createSortSection, createFilterSection } from '../templates/filterSidebar.template'
import { toastClientScript } from '../templates/toast.template'
import { uiClasses } from '../styles/classes.ui'
import { ProductCard, ProductSortOption, ProductStatusOption, SupplierOption } from '../../services/products.service'

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
  const start = Math.max(1, Math.min(pagination.currentPage, Math.max(1, pagination.totalPages - windowSize + 1)))
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
        return `<span class="${commonClasses} bg-white/10 border-white/30 cursor-default" aria-current="page">${page}</span>`
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

  return `<div class="${uiClasses.layout.space.y3} ${uiClasses.divider.base} pb-3">
      <div class="${uiClasses.layout.flex.between}">
        <p class="${uiClasses.text.metadata}">Showing ${pagination.start}-${pagination.end} of ${pagination.totalProducts} (${PRODUCTS_PER_PAGE} per page)</p>
        <div class="${uiClasses.layout.flex.gap2}">
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
        </div>
      </div>
    </div>`
}

const escapeAttr = (value: string) => value.replace(/"/g, '&quot;')

const toId = (value: string) => value.replace(/[^a-zA-Z0-9_-]/g, '-')

export const renderProductCard = (
  product: ProductCard,
  statuses: ProductStatusOption[],
  suppliers: SupplierOption[]
) => {
  const supplierLabel = product.supplierName || 'Unassigned'
  const cardId = `product-${toId(product.skuRaw)}`
  const feedbackId = `${cardId}-feedback`
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
  const editFeedbackId = `${cardId}-edit-feedback`
  const deleteFeedbackId = `${cardId}-delete-feedback`
  const remarksContent = product.purchaseRemarks
    ? `<div class="${uiClasses.layout.space.y2}">
        <p class="${uiClasses.text.label}">Purchase remarks</p>
        <p class="${uiClasses.text.body} whitespace-pre-line">${product.purchaseRemarks}</p>
      </div>`
    : ''
  return `<article id="${cardId}" class="${uiClasses.card.withShadow}" data-inline-card="${cardId}">
      <div class="${uiClasses.layout.flex.between}">
        <div class="${uiClasses.layout.space.y2}">
          <p class="${uiClasses.text.bodyLarge}">${product.name}</p>
          <p class="${uiClasses.text.headingBold}">SKU ${product.sku}</p>
        </div>
        <span class="${uiClasses.text.metadata}">${product.statusName}</span>
      </div>
      <div class="${uiClasses.layout.grid.cols2}">
        <div>
          <p class="${uiClasses.text.label}">Cost</p>
          <p class="${uiClasses.text.body}" ${costDataAttrs}>${product.costDisplay}</p>
        </div>
        <div>
          <p class="${uiClasses.text.label}">Supplier</p>
          ${
            product.hasSupplierLink
              ? `<a class="${uiClasses.link.primary}" href="${product.supplierLink}" target="_blank" rel="noreferrer">${supplierLabel}</a>`
              : `<p class="${uiClasses.text.body}">${supplierLabel}</p>`
          }
        </div>
      </div>
      ${remarksContent}
      <div class="${uiClasses.layout.flex.gap3}">
        <button type="button" class="${uiClasses.button.dangerCompact} transition-transform duration-150 will-change-transform hover:-translate-y-[1px]" data-inline-toggle="${cardId}-edit">
          Edit
        </button>
        <button type="button" class="${uiClasses.button.dangerCompact} transition-transform duration-150 will-change-transform hover:-translate-y-[1px]" data-inline-toggle="${cardId}-delete">
          Delete
        </button>
      </div>
      <div class="hidden space-y-3 border-t border-white/10 pt-3" data-inline-panel="${cardId}-edit">
        <div class="${uiClasses.layout.flex.betweenStart}">
          <p class="${uiClasses.text.headingBold}">Edit product</p>
          <button type="button" class="${uiClasses.button.ghost}" data-inline-close>Close</button>
        </div>
        <div
          id="${editFeedbackId}"
          class="${uiClasses.text.feedback}"
          data-inline-feedback
        ></div>
        <form
          class="${uiClasses.layout.space.y3}"
          hx-post="/products/update"
          hx-target="#${cardId}"
          hx-swap="outerHTML"
          data-inline-card-id="${cardId}"
          hx-on::afterRequest="if(event.detail && (event.detail.successful || (event.detail.xhr && event.detail.xhr.status < 300))){const btn=this.closest('[data-inline-card]')?.querySelector('[data-inline-close]'); if(btn instanceof HTMLElement){btn.click();}}"
        >
          <input type="hidden" name="originalSku" value="${escapeAttr(product.skuRaw)}" />
          <input type="hidden" name="inlineCardId" value="${escapeAttr(cardId)}" />
          <label class="${uiClasses.text.labelBright} block space-y-1">
            SKU
            <input class="${uiClasses.input.base}" type="text" name="sku" required value="${escapeAttr(product.skuRaw)}" />
          </label>
          <label class="${uiClasses.text.labelBright} block space-y-1">
            Name
            <input class="${uiClasses.input.base}" type="text" name="name" required value="${escapeAttr(product.nameRaw)}" />
          </label>
          <div class="grid gap-3 sm:grid-cols-2">
            <label class="${uiClasses.text.labelBright} block">
              Status
              <select class="${uiClasses.input.select}" name="status" required>
                ${statusOptions}
              </select>
            </label>
            <label class="${uiClasses.text.labelBright} block">
              Cost (SGD)
              <input
                class="${uiClasses.input.base}"
                type="number"
                min="0"
                step="0.01"
                name="cost"
                placeholder="0.00"
                value="${costValue}"
              />
            </label>
          </div>
          <label class="${uiClasses.text.labelBright} block">
            Supplier
            <select class="${uiClasses.input.select}" name="supplierId">
              ${supplierOptions}
            </select>
          </label>
          <label class="${uiClasses.text.labelBright} block space-y-1">
            Supplier link
            <input
              class="${uiClasses.input.base}"
              type="url"
              name="supplierLink"
              placeholder="https://supplier.example.com"
              value="${product.supplierLink ? escapeAttr(product.supplierLink) : ''}"
            />
          </label>
          <label class="${uiClasses.text.labelBright} block space-y-1">
            Purchase remarks
            <textarea
              class="${uiClasses.input.textarea}"
              name="purchaseRemarks"
              rows="2"
              placeholder="Delivery details, packaging notes, etc."
            >${product.purchaseRemarks || ''}</textarea>
          </label>
          <button type="submit" class="${uiClasses.button.primaryCompact}">
            Save changes
          </button>
        </form>
      </div>
      <div class="hidden space-y-3 border-t border-white/10 pt-3" data-inline-panel="${cardId}-delete">
        <div class="${uiClasses.layout.flex.betweenStart}">
          <p class="${uiClasses.text.headingBold} text-red-300">Delete product</p>
          <button type="button" class="${uiClasses.button.ghost}" data-inline-close>Close</button>
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
          <button type="submit" class="${uiClasses.button.primaryCompact}">
            Delete product
          </button>
        </form>
      </div>
    </article>`
}

export const renderProductListingSection = (
  products: ProductCard[],
  statuses: ProductStatusOption[],
  suppliers: SupplierOption[],
  options: ProductListingOptions = {}
) => {
  const { visibleProducts, pagination } = paginateProducts(products, options.page)
  const productCards = visibleProducts.length
    ? visibleProducts.map((product) => renderProductCard(product, statuses, suppliers)).join('')
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
  feedbackMessage = '',
  feedbackClass = 'text-sm text-white/70 uppercase tracking-[0.3em]',
  searchValue = '',
  sortDirection: ProductSortOption = 'name-asc',
  supplierFilters: number[] = [],
  statusFilters: number[] = [],
  currentPage = 1
) => {
  const sanitizeInputValue = (value: string) => value.replace(/"/g, '&quot;')

  const listingSection = renderProductListingSection(products, statuses, suppliers, {
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
