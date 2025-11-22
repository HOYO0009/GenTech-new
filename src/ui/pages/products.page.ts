import { layout } from '../layout.ui'
import { renderSearchSortControls } from '../templates/editor.template'
import { renderCard } from '../templates/card.template'
import { renderFilterSidebar, createSortSection, createFilterSection } from '../templates/filterSidebar.template'
import { uiClasses } from '../styles/classes.ui'
import { ProductCard, ProductSortOption, ProductStatusOption, SupplierOption } from '../../services/products.service'

const renderProductCard = (product: ProductCard) => {
  const supplierLabel = product.supplierName || 'Unassigned'
  const costDataAttrs = product.costDisplay !== 'N/A' && typeof product.costCents === 'number'
    ? { 'money-cents': product.costCents, 'money-base': 'SGD' }
    : undefined

  const remarksContent = product.purchaseRemarks
    ? `<div class="${uiClasses.layout.space.y2}">
        <p class="${uiClasses.text.label}">Purchase remarks</p>
        <p class="${uiClasses.text.body} whitespace-pre-line">${product.purchaseRemarks}</p>
      </div>`
    : ''

  return renderCard({
    header: {
      title: product.name,
      titleClassName: uiClasses.text.bodyLarge,
      metadata: `${product.sku} • ${product.statusName}`,
    },
    fields: [
      {
        label: 'Cost',
        value: product.costDisplay,
        dataAttributes: costDataAttrs,
      },
      {
        label: 'Supplier',
        value: supplierLabel,
        isLink: Boolean(product.supplierLink),
        href: product.supplierLink || undefined,
      },
    ],
    gridColumns: 2,
    additionalContent: remarksContent,
    withShadow: true,
  })
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
  statusFilters: number[] = []
) => {
  const sanitizeInputValue = (value: string) => value.replace(/"/g, '&quot;')

  const productCards = products.length
    ? products.map(renderProductCard).join('')
    : `<p class="${uiClasses.text.bodySmall}">No products yet.</p>`

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

  const listingSection = `<section id="product-listings" class="${uiClasses.panel.inner}">
      <div class="${uiClasses.text.heading}">
        Product records
      </div>
      <div class="${uiClasses.layout.space.y4}">
        ${productCards}
      </div>
    </section>`

  const sortOptions: { value: ProductSortOption; label: string }[] = [
    { value: 'sku-asc', label: 'SKU (A -> Z)' },
    { value: 'sku-desc', label: 'SKU (Z -> A)' },
    { value: 'name-asc', label: 'Product Name (A -> Z)' },
    { value: 'name-desc', label: 'Product Name (Z -> A)' },
  ]

  const sortSection = createSortSection(sortOptions, sortDirection)
  const supplierOptions = suppliers.map(s => ({ label: s.name, value: s.id }))
  const statusOptions = statuses.map(s => ({ label: s.name, value: s.id }))
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
  const mainContent = `<div class="${uiClasses.layout.space.y3}">
      ${feedbackContent}
      ${editorPanel}
      ${listingSection}
    </div>
    ${filterSidebar}`

  const extraHead = `
    <script src="https://unpkg.com/htmx.org@1.9.2"></script>
  `
  return layout('products', 'Products - GenTech', '', mainContent, extraHead)
}
