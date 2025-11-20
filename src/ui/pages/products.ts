import { layout } from '../layout'
import { ProductCard, ProductStatusOption, SupplierOption } from '../../services/products'

export const productPage = (
  products: ProductCard[],
  _statuses: ProductStatusOption[],
  _suppliers: SupplierOption[],
  feedbackMessage = '',
  feedbackClass = 'text-sm text-white/70 uppercase tracking-[0.3em]'
) => {
  const productCards = products.length
    ? products
        .map(({ sku, name, statusName, costDisplay, supplierName, supplierLink, purchaseRemarks }) => {
          const supplierLabel = supplierName ? supplierName : 'Unassigned'
          const remarks = purchaseRemarks ? `<p class="text-[0.65rem] uppercase tracking-[0.3em] text-white/50">${purchaseRemarks}</p>` : ''
          const linkMarkup = supplierLink
            ? `<a class="text-[0.65rem] uppercase tracking-[0.3em] text-red-300 hover:text-white" href="${supplierLink}" target="_blank" rel="noreferrer">Supplier link</a>`
            : ''
        return `<article class="rounded-2xl border border-white/10 bg-black/70 p-5 space-y-3 shadow-[0_0_30px_rgba(0,0,0,0.35)]">
          <div class="flex items-center justify-between text-[0.65rem] uppercase tracking-[0.4em] text-white/60">
            <span>${sku}</span>
            <span>${statusName}</span>
          </div>
          <p class="text-lg font-semibold text-white">${name}</p>
          <div class="grid gap-3 text-sm sm:grid-cols-3">
            <div>
              <p class="text-[0.65rem] uppercase tracking-[0.3em] text-white/50">Cost</p>
              <p class="text-base font-semibold text-white">${costDisplay}</p>
            </div>
            <div>
              <p class="text-[0.65rem] uppercase tracking-[0.3em] text-white/50">Supplier</p>
              <p class="text-base font-semibold text-white">${supplierLabel}</p>
            </div>
            <div class="flex flex-col gap-1">
              <p class="text-[0.65rem] uppercase tracking-[0.3em] text-white/50">Actions</p>
              ${linkMarkup}
            </div>
          </div>
          ${remarks}
        </article>`
        })
        .join('')
    : '<p class="text-white/80">No products yet.</p>'

  const editorPanel = `<section class="rounded-2xl border border-white/10 bg-black/70 p-6 space-y-4">
      <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div class="space-y-1">
          <p class="text-sm uppercase tracking-[0.3em] text-white/70">Product catalog</p>
          <p class="text-[0.65rem] uppercase tracking-[0.3em] text-white/50">
            Open the unified editor to add, update, or delete listings.
          </p>
        </div>
        <a href="/products/manage" class="primary-btn">
          Open product editor
        </a>
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

  const defaultFeedback = `Tap "Edit product" to unlock a card, then "Save product" once you are ready to persist changes.`
  const feedbackContent = feedbackMessage
    ? `<div id="product-feedback" class="${feedbackClass}">${feedbackMessage}</div>`
    : `<div id="product-feedback" class="text-sm text-white/70 uppercase tracking-[0.3em]">${defaultFeedback}</div>`
  const mainContent = `<div class="space-y-6">
      ${feedbackContent}
      ${editorPanel}
      ${listingSection}
    </div>`

  const extraHead = `
    <script src="https://unpkg.com/htmx.org@1.9.2"></script>
  `
  return layout('products', 'Products - GenTech', '', mainContent, extraHead)
}
