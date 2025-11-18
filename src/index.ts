import { Hono, type Context } from 'hono'
import {
  getProductPagePayload,
  ProductCard,
  ProductStatusOption,
  SupplierOption,
  updateProductDetails,
} from './services/products'
import { ChangeLogEvent, listChangeEvents } from './services/changeLogs'
import {
  discountLabelByType,
  getVouchersPagePayload,
  createVoucher,
  updateVoucherDetails,
  deleteVoucherRecord,
  VouchersPagePayload,
  VoucherListItem,
  VoucherCreateResult,
} from './services/vouchers'
const app = new Hono()
type SiteSection = 'home' | 'products' | 'vouchers' | 'changes'
const navBar = (active: SiteSection) => `
    <nav class="flex items-center gap-6 uppercase text-xs tracking-[0.4em]">
      <a class="hover:text-white transition ${active === 'home' ? 'text-white' : 'text-red-400'}" href="/">Home</a>
      <a class="hover:text-white transition ${active === 'products' ? 'text-white' : 'text-red-400'}" href="/products">Products</a>
      <a class="hover:text-white transition ${active === 'vouchers' ? 'text-white' : 'text-red-400'}" href="/vouchers">Vouchers</a>
      <a class="hover:text-white transition ${active === 'changes' ? 'text-white' : 'text-red-400'}" href="/changes">Changes</a>
    </nav>
`
const visualFoundation = `
  <style>
    :root {
      font-family: 'Space Grotesk', 'Inter', system-ui, sans-serif;
      color: #f7f4f0;
      background-color: #010101;
      --border-light: rgba(255, 255, 255, 0.1);
      --border-strong: rgba(255, 255, 255, 0.3);
      --bg-panel: rgba(15, 15, 15, 0.85);
    }
    body {
      margin: 0;
      min-height: 100vh;
      background-color: #010101;
      color: #f8f8f2;
      font-size: 0.95rem;
      letter-spacing: 0.05em;
    }
    a {
      color: inherit;
    }
    header nav a {
      font-size: 0.8rem;
      letter-spacing: 0.5em;
    }
    h1, h2, h3, h4 {
      font-family: 'Space Grotesk', 'Inter', system-ui, sans-serif;
      text-transform: uppercase;
      letter-spacing: 0.3em;
    }
    h1 {
      font-size: 1.75rem;
      font-weight: 600;
    }
    h2 {
      font-size: 1.35rem;
      font-weight: 600;
    }
    h3 {
      font-size: 1.15rem;
      font-weight: 500;
    }
    h4 {
      font-size: 1.05rem;
      font-weight: 500;
    }
    input,
    select,
    textarea {
      font-family: inherit;
      font-size: 0.95rem;
      color: #fff;
      border: 1px solid var(--border-light);
      background-color: #030303;
    }
    button {
      font-family: inherit;
      text-transform: uppercase;
      letter-spacing: 0.3em;
      font-size: 0.7rem;
      border: none;
      outline: none;
      cursor: pointer;
    }
    button.primary-btn {
      background-color: #b41f26;
      color: #fff;
      border-radius: 999px;
      padding: 0.75rem 1.5rem;
      border: 1px solid transparent;
      transition: background-color 0.2s ease, border-color 0.2s ease;
    }
    button.primary-btn:hover {
      background-color: #ff2b2b;
    }
    button.secondary-btn {
      background: none;
      border: 1px solid var(--border-strong);
      color: #eae9e4;
      border-radius: 999px;
      padding: 0.6rem 1.2rem;
      transition: background-color 0.2s ease, border-color 0.2s ease, color 0.2s ease;
    }
    button.secondary-btn:hover {
      border-color: #ffffff;
      background-color: rgba(255, 255, 255, 0.06);
    }
    .panel {
      background: var(--bg-panel);
      border: 1px solid var(--border-light);
      border-radius: 1.25rem;
      padding: 1.5rem;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.4);
    }
  </style>`
const layout = (
  active: SiteSection,
  title: string,
  heroContent: string,
  mainContent: string,
  extraHead = ''
) => `<!DOCTYPE html>
<html lang="en">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>${title}</title>
      <script src="https://cdn.tailwindcss.com"></script>
      ${visualFoundation}
      ${extraHead}
    </head>
  <body class="min-h-screen bg-black text-white flex flex-col">
    <header class="sticky top-0 z-10 border-b border-white/10 bg-black/95 backdrop-blur-sm">
      <div class="max-w-4xl mx-auto px-6 py-5 flex items-center justify-between">
        <p class="text-xs font-semibold uppercase tracking-[0.45em] text-white/80">GenTech</p>
        ${navBar(active)}
      </div>
    </header>
    ${heroContent ? `<section class="px-6 py-10 max-w-4xl mx-auto space-y-6">${heroContent}</section>` : ''}
    <main class="flex-1 px-6 pb-10">
      <div class="max-w-4xl mx-auto space-y-8">
        ${mainContent}
      </div>
    </main>
  </body>
</html>`
const homepage = layout(
  'home',
  'GenTech',
  `<div x-data="{ open: false }" class="space-y-6 panel">
      <h1>Inventory, finance, and e-commerce, simplified.</h1>
      <p class="text-white/80">A minimal HTMX + Alpine.js + Tailwind CSS front to showcase the Bun/Hono backend.</p>
      <div class="flex flex-wrap gap-3">
        <button
          class="primary-btn"
          hx-get="/status"
          hx-target="#status"
          hx-swap="innerHTML"
        >
          Ping the backend
        </button>
        <button
          @click="open = !open"
          class="secondary-btn"
        >
          <span x-text="open ? 'Hide notes' : 'Show notes'"></span>
        </button>
      </div>
      <p id="status" class="text-sm text-white/80 uppercase tracking-[0.3em]">Backend is waiting for HTMX to wake it up.</p>
      <p
        x-show="open"
        x-cloak
        class="text-sm text-white/80 max-w-2xl uppercase tracking-[0.3em]"
      >
        This spot is intentionally minimal, just enough interaction to prove HTMX and Alpine.js are wired up.
      </p>
      <p class="text-sm text-white/80 uppercase tracking-[0.3em]">
        Jump to the <a href="/products" class="text-red-400 underline">product list</a> once it is ready.
      </p>
    </div>`,
  `<div class="text-center space-y-4 max-w-2xl mx-auto panel">
      <p class="text-white/70">
        Start building by placing HTMX fragments or Alpine components right on this route. The backend is
        focused on Bun + Hono routes, so keep interactions small and reliable.
      </p>
      <p class="text-xs uppercase tracking-[0.5em] text-white/80">Built with Bun - Hono - Tailwind - HTMX - Alpine</p>
    </div>`,
  `
    <script src="https://unpkg.com/htmx.org@1.9.2"></script>
    <script src="https://unpkg.com/alpinejs@3.12.0" defer></script>
  `
)
const productPage = (
  products: ProductCard[],
  statuses: ProductStatusOption[],
  suppliers: SupplierOption[]
) => {
  const productCards = products.length
    ? products
        .map(({ sku, name, statusId, costDisplay, costCents, supplierId, supplierLink, purchaseRemarks }) => {
          const costInputValue = typeof costCents === 'number' ? (costCents / 100).toFixed(2) : ''
          const supplierOptions = suppliers
            .map(
              (supplier) =>
                `<option value="${supplier.id}" ${supplierId === supplier.id ? 'selected' : ''}>${supplier.name}</option>`
            )
            .join('')
          const supplierLinkValue = supplierLink ?? ''
        return `<div class="px-4 py-3 rounded bg-black/80 border border-white/10 text-white shadow-[0_0_40px_rgba(0,0,0,0.45)]">
            <form
              hx-post="/products/update"
              hx-target="#product-feedback"
              hx-swap="innerHTML"
              class="space-y-3"
            >
            <input type="hidden" name="originalSku" value="${sku}" />
            <div class="space-y-2">
              <label class="text-xs uppercase tracking-[0.3em] text-white/70 block">
                SKU
                <input
                  class="mt-1 w-full rounded border border-white/10 bg-white/5 px-2 py-1 text-sm text-white"
                  type="text"
                  name="sku"
                  value="${sku}"
                />
              </label>
              <label class="text-xs uppercase tracking-[0.3em] text-white/70 block">
                Name
                <input
                  class="mt-1 w-full rounded border border-white/10 bg-white/5 px-2 py-1 text-sm text-white"
                  type="text"
                  name="name"
                  value="${name}"
                />
              </label>
            </div>
            <details class="product-details">
              <summary class="flex items-center justify-between text-xs uppercase tracking-[0.4em] text-white/70">
                Product details
                <span class="product-details-trigger">
                  <span class="show">Expand</span>
                  <span class="hide">Collapse</span>
                </span>
              </summary>
              <div class="mt-3 space-y-2">
                <label class="text-xs uppercase tracking-[0.3em] text-white/70 block">
                  Status
                  <select
                    class="mt-1 w-full rounded border border-white/10 bg-white/5 px-2 py-1 text-sm text-white product-status-select"
                    name="status"
                  >
                    ${statuses
                      .map(
                        (option) => `<option value="${option.id}" ${option.id === statusId ? 'selected' : ''}>${option.name}</option>`
                      )
                      .join('')}
                  </select>
                </label>
                <p class="text-white/80 text-xs uppercase tracking-[0.4em]">Cost (SGD)</p>
                <label class="text-xs uppercase tracking-[0.3em] text-white/70 block">
                  <input
                    class="mt-1 w-full rounded border border-white/10 bg-white/5 px-2 py-1 text-sm text-white"
                    type="number"
                    min="0"
                    step="0.01"
                    name="cost"
                    placeholder="${costDisplay}"
                    value="${costInputValue}"
                  />
                </label>
                <label class="text-xs uppercase tracking-[0.3em] text-white/70 block">
                  Purchase remarks
                  <textarea
                    class="mt-1 w-full rounded border border-white/10 bg-white/5 px-2 py-1 text-sm text-white"
                    name="purchaseRemarks"
                    rows="2"
                    placeholder="-">${purchaseRemarks}</textarea>
                </label>
                <label class="text-xs uppercase tracking-[0.3em] text-white/70 block">
                  Supplier
                  <select
                    class="mt-1 w-full rounded border border-white/10 bg-white/5 px-2 py-1 text-sm text-white product-supplier-select"
                    name="supplierId"
                  >
                    <option value="" ${supplierId === null ? 'selected' : ''}>Unassigned</option>
                    ${supplierOptions}
                  </select>
                </label>
                <label class="text-xs uppercase tracking-[0.3em] text-white/70 block">
                  Supplier link
                  <input
                    class="mt-1 w-full rounded border border-white/10 bg-white/5 px-2 py-1 text-sm text-white"
                    type="url"
                    name="supplierLink"
                    value="${supplierLinkValue}"
                    placeholder="https://supplier.example.com"
                  />
                </label>
                <button type="submit" class="primary-btn w-full">
                  Save product
                </button>
              </div>
            </details>
          </form>
        </div>`
        })
        .join('')
    : '<p class="text-white/80">No products yet.</p>'
  const heroContent = ''
  const mainContent = `<div class="bg-black/70 rounded-2xl border border-white/10 shadow-inner p-6 space-y-3">
      <div id="product-feedback" class="text-sm text-white/70 uppercase tracking-[0.3em]">
        Tap "Save product" to persist changes and watch this space for the result.
      </div>
      <div class="space-y-4 text-sm">
        ${productCards}
      </div>
    </div>`
  return layout(
    'products',
    'Products - GenTech',
    heroContent,
    mainContent,
    `
    <style>
      .product-status-select option,
      .product-supplier-select option {
        background-color: #0f172a;
        color: #fff;
      }
      .product-status-select option:checked,
      .product-supplier-select option:checked {
        background-color: #1e293b;
      }
      .product-details {
        border: 1px solid rgba(255, 255, 255, 0.15);
        border-radius: 1rem;
        padding: 0.75rem;
        background-color: rgba(255, 255, 255, 0.03);
      }
      .product-details summary {
        list-style: none;
        margin: 0;
      }
      .product-details-trigger {
        font-size: 0.55rem;
        letter-spacing: 0.6em;
        color: #fcd4d4;
      }
      .product-details-trigger .hide {
        display: none;
      }
      .product-details[open] .product-details-trigger .show {
        display: none;
      }
      .product-details[open] .product-details-trigger .hide {
        display: inline;
      }
    </style>
    <script src="https://unpkg.com/htmx.org@1.9.2"></script>
  `
  )
}
const changesPage = (changes: ChangeLogEvent[]) => {
  const changeItems = changes.length
    ? changes
        .map((change) => {
          const payloadBlock = change.payload
            ? `<pre class="bg-black/70 rounded border border-white/10 p-3 text-[0.65rem] text-white/70 overflow-auto">${change.payload}</pre>`
            : ''
          const sourceBlock = change.source ? `<p class="text-[0.65rem] text-white/80">source: ${change.source}</p>` : ''
          return `<article class="rounded-2xl border border-white/10 bg-black/70 p-5 space-y-3">
            <div class="flex items-center justify-between text-xs uppercase tracking-[0.3em] text-white/80">
              <span>${change.occurredAt}</span>
              <span>${change.action}</span>
            </div>
            <div class="text-sm">
              <p class="text-white font-semibold">${change.description}</p>
              <p class="text-white/80 text-[0.65rem] uppercase tracking-[0.4em]">Table: ${change.tableLabel}</p>
            </div>
            ${payloadBlock}
            ${sourceBlock}
          </article>`
        })
        .join('')
    : '<p class="text-white/80 text-sm">No activity recorded yet.</p>'
  const heroContent = `<div class="space-y-3">
      <h1 class="text-3xl font-semibold">Database activity</h1>
      <p class="text-sm text-white/70">
        Every write operation funnels through this log so you can trace additions, updates, and deletes from the UI.
      </p>
      <p class="text-xs text-white/80 uppercase tracking-[0.5em]">recent ${changes.length} event(s)</p>
    </div>`
  return layout('changes', 'Change log - GenTech', heroContent, changeItems)
}
const renderVoucherCard = (voucher: VoucherListItem) => `<article
      data-voucher-card
      data-voucher-id="${voucher.id}"
      data-shop-id="${voucher.shopId}"
      data-voucher-type-id="${voucher.voucherTypeId ?? ''}"
      data-voucher-discount-type-id="${voucher.voucherDiscountTypeId}"
      data-min-spend="${voucher.minSpend}"
      data-discount="${voucher.discount}"
      data-max-discount="${voucher.maxDiscount ?? ''}"
      class="rounded-2xl border border-white/10 bg-black/70 p-5 space-y-3"
    >
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
      <div class="flex flex-wrap items-center gap-3 text-xs uppercase tracking-[0.4em] text-white/60">
        <button
          type="button"
          data-edit-voucher
          class="px-4 py-2 rounded-full border border-white/20 text-xs tracking-[0.4em] hover:border-white transition"
        >
          Edit
        </button>
        <button
          type="button"
          class="px-4 py-2 rounded-full border border-red-600/40 text-xs tracking-[0.4em] text-red-300 hover:text-red-100 hover:border-red-300 transition"
          hx-delete="/vouchers/${voucher.id}"
          hx-target="#voucher-feedback"
          hx-swap="innerHTML"
        >
          Delete
        </button>
      </div>
    </article>`
const renderVoucherHistorySection = (vouchers: VoucherListItem[]) => {
  const voucherHistory = vouchers.length
    ? vouchers.map(renderVoucherCard).join('')
    : '<p class="text-sm text-white/70">No vouchers recorded yet.</p>'
  return `<section id="voucher-history-section" hx-swap-oob="outerHTML" class="rounded-2xl border border-white/10 bg-black/70 p-6 space-y-4">
      <div class="space-y-3">
        ${voucherHistory}
      </div>
    </section>`
}
const vouchersPage = ({
  shops,
  voucherDiscountTypes,
  voucherTypes,
  vouchers,
}: VouchersPagePayload) => {
  const shopOptions = shops
    .map((shop) => `<option value="${shop.id}">${shop.name}</option>`)
    .join('')
  const voucherCategoryOptions = voucherTypes
    .map((type) => `<option value="${type.id}">${type.name}</option>`)
    .join('')
  const voucherDiscountOptions = voucherDiscountTypes
    .map(
      (type) =>
        `<option value="${type.id}" data-type-key="${type.key}">${type.label}</option>`
    )
    .join('')
  const labelMapJson = JSON.stringify(discountLabelByType)
  const historySection = renderVoucherHistorySection(vouchers)
  const heroContent = ''
  const mainContent = `<div class="space-y-6">
      <section class="rounded-2xl border border-white/10 bg-black/70 p-6 space-y-4">
        <div id="voucher-feedback" class="text-sm text-white/70 uppercase tracking-[0.3em]">
          Submit a voucher to persist it and watch it appear in the list below.
        </div>
        <div class="flex items-center justify-between text-[0.65rem] uppercase tracking-[0.4em] text-white/60">
          <span data-voucher-form-mode></span>
          <button
            type="button"
            data-voucher-cancel
            class="hidden text-red-400 hover:text-white"
          >
            Cancel edit
          </button>
        </div>
        <form
          id="voucher-form"
          hx-post="/vouchers/save"
          hx-target="#voucher-feedback"
          hx-swap="innerHTML"
          class="space-y-2"
        >
          <input type="hidden" name="voucherId" value="" />
          <label class="text-xs uppercase tracking-[0.3em] text-white/70 block">
            Shop
            <select
              class="mt-1 w-full rounded border border-white/10 bg-white/5 px-2 py-1 text-sm text-white voucher-select"
              aria-label="Select shop"
              name="shopId"
              required
            >
              <option value="" disabled selected>Select a shop</option>
              ${shopOptions}
            </select>
          </label>
          <label class="text-xs uppercase tracking-[0.3em] text-white/70 block">
            Voucher type
            <select
              class="mt-1 w-full rounded border border-white/10 bg-white/5 px-2 py-1 text-sm text-white voucher-select"
              aria-label="Select voucher type"
              name="voucherTypeId"
              required
            >
              <option value="" disabled selected>Select a type</option>
              ${voucherCategoryOptions}
            </select>
          </label>
          <label class="text-xs uppercase tracking-[0.3em] text-white/70 block">
            Discount type
            <select
              class="mt-1 w-full rounded border border-white/10 bg-white/5 px-2 py-1 text-sm text-white voucher-select"
              aria-label="Select discount type"
              name="voucherDiscountTypeId"
              required
            >
              <option value="" disabled selected>Select a type</option>
              ${voucherDiscountOptions}
            </select>
          </label>
          <label class="text-xs uppercase tracking-[0.3em] text-white/70 block">
            Minimum spend (SGD)
            <input
              class="mt-1 w-full rounded border border-white/10 bg-white/5 px-2 py-1 text-sm text-white"
              type="number"
              min="0"
              step="0.01"
              name="minSpend"
              placeholder="0.00"
              required
            />
          </label>
          <label class="text-xs uppercase tracking-[0.3em] text-white/70 block">
            <span data-discount-label>Discount (SGD)</span>
            <p class="text-[0.65rem] uppercase tracking-[0.3em] text-white/50" data-discount-helper></p>
            <input
              class="mt-1 w-full rounded border border-white/10 bg-white/5 px-2 py-1 text-sm text-white"
              type="number"
              min="0"
              step="0.01"
              name="discount"
              placeholder="0.00"
              required
            />
          </label>
          <label class="text-xs uppercase tracking-[0.3em] text-white/70 block">
            Max discount (SGD)
            <input
              class="mt-1 w-full rounded border border-white/10 bg-white/5 px-2 py-1 text-sm text-white"
              type="number"
              min="0"
              step="0.01"
              name="maxDiscount"
              placeholder="0.00"
              required
            />
          </label>
          <button type="submit" class="primary-btn w-full">
            Save voucher
          </button>
        </form>
      </section>
      ${historySection}
      <script>
        ;(() => {
          const labelMap = ${labelMapJson}
          const discountSelect = document.querySelector('[name="voucherDiscountTypeId"]')
          const labelElement = document.querySelector('[data-discount-label]')
          const helperElement = document.querySelector('[data-discount-helper]')
          const voucherForm = document.querySelector('#voucher-form')
          if (!discountSelect || !voucherForm) return
          const shopSelect = voucherForm.querySelector('[name="shopId"]')
          const voucherTypeSelect = voucherForm.querySelector('[name="voucherTypeId"]')
          const minSpendInput = voucherForm.querySelector('[name="minSpend"]')
          const discountInput = voucherForm.querySelector('[name="discount"]')
          const maxDiscountInput = voucherForm.querySelector('[name="maxDiscount"]')
          const voucherIdInput = voucherForm.querySelector('[name="voucherId"]')
          const modeIndicator = document.querySelector('[data-voucher-form-mode]')
          const cancelButton = document.querySelector('[data-voucher-cancel]')
          const submitButton = voucherForm.querySelector('button[type="submit"]')
          const updateDiscountLabel = () => {
            const key = discountSelect.selectedOptions[0]?.dataset?.typeKey ?? 'fixed'
            const fallbackLabel = labelMap.fixed ?? 'Discount (SGD)'
            const selectedLabel = labelMap[key] ?? fallbackLabel
            if (labelElement) labelElement.textContent = selectedLabel
            if (helperElement) {
              helperElement.textContent =
                key === 'percentage'
                  ? 'Enter the percentage amount (e.g. 20 for 20%)'
                  : ''
            }
          }
          const resetForm = () => {
            voucherForm.reset()
            voucherIdInput?.setAttribute('value', '')
            submitButton && (submitButton.textContent = 'Save voucher')
            if (modeIndicator) modeIndicator.textContent = ''
            cancelButton && cancelButton.classList.add('hidden')
            updateDiscountLabel()
          }
          const enterEditMode = (values) => {
            voucherIdInput?.setAttribute('value', values.voucherId)
            if (shopSelect) shopSelect.value = values.shopId ?? ''
            if (voucherTypeSelect) voucherTypeSelect.value = values.voucherTypeId ?? ''
            discountSelect.value = values.voucherDiscountTypeId ?? ''
            if (minSpendInput) minSpendInput.value = values.minSpend ?? ''
            if (discountInput) discountInput.value = values.discount ?? ''
            if (maxDiscountInput) maxDiscountInput.value = values.maxDiscount ?? ''
            submitButton && (submitButton.textContent = 'Update voucher')
            if (modeIndicator) modeIndicator.textContent = 'Editing voucher #' + values.voucherId
            cancelButton && cancelButton.classList.remove('hidden')
            updateDiscountLabel()
          }
          const handleEditClick = (event) => {
            const button = event.target.closest('[data-edit-voucher]')
            if (!button) return
            event.preventDefault()
            const card = button.closest('[data-voucher-card]')
            if (!card) return
            const values = card.dataset
            enterEditMode({
              voucherId: values.voucherId ?? '',
              shopId: values.shopId ?? '',
              voucherTypeId: values.voucherTypeId ?? '',
              voucherDiscountTypeId: values.voucherDiscountTypeId ?? '',
              minSpend: values.minSpend ?? '',
              discount: values.discount ?? '',
              maxDiscount:
                values.maxDiscount !== undefined && values.maxDiscount !== ''
                  ? values.maxDiscount
                  : '',
            })
          }
          cancelButton?.addEventListener('click', (event) => {
            event.preventDefault()
            resetForm()
          })
          document.body.addEventListener('click', handleEditClick)
          document.body.addEventListener('htmx:afterRequest', (event) => {
            if (event.detail?.target?.id === 'voucher-feedback' && event.detail.xhr?.status === 200) {
              resetForm()
            }
          })
          updateDiscountLabel()
        })()
      </script>
    </div>`
  return layout(
    'vouchers',
    'Vouchers - GenTech',
    heroContent,
    mainContent,
    `
    <style>
      .voucher-select option {
        background-color: #0f172a;
        color: #fff;
      }
      .voucher-select option:checked {
        background-color: #1e293b;
      }
    </style>
    <script src="https://unpkg.com/htmx.org@1.9.2"></script>
  `
  )
}
type ParsedVoucherFormData = {
  shopId: number
  voucherTypeId: number
  voucherDiscountTypeId: number
  minSpend: number
  discount: number
  maxDiscount: number
}
type ParsedVoucherForm = ParsedVoucherFormData & {
  voucherId?: number
}
const parseRequired = (entry: unknown, label: string) => {
  const value = (entry ?? '').toString().trim()
  if (!value) {
    throw new Error(`${label} is required.`)
  }
  return value
}
const parseInteger = (entry: unknown, label: string) => {
  const raw = parseRequired(entry, label)
  const parsed = Number(raw)
  if (!Number.isFinite(parsed) || !Number.isInteger(parsed)) {
    throw new Error(`${label} must be an integer.`)
  }
  return parsed
}
const parseDecimal = (entry: unknown, label: string) => {
  const raw = parseRequired(entry, label)
  const parsed = Number(raw)
  if (!Number.isFinite(parsed)) {
    throw new Error(`${label} must be a number.`)
  }
  return parsed
}
const parseCreateVoucherForm = (form: FormData): ParsedVoucherFormData => ({
  shopId: parseInteger(form.get('shopId'), 'Shop'),
  voucherTypeId: parseInteger(form.get('voucherTypeId'), 'Voucher type'),
  voucherDiscountTypeId: parseInteger(form.get('voucherDiscountTypeId'), 'Discount type'),
  minSpend: parseDecimal(form.get('minSpend'), 'Minimum spend'),
  discount: parseDecimal(form.get('discount'), 'Discount'),
  maxDiscount: parseDecimal(form.get('maxDiscount'), 'Max discount'),
})
const parseVoucherForm = (form: FormData): ParsedVoucherForm => {
  const base = parseCreateVoucherForm(form)
  const rawId = (form.get('voucherId') ?? '').toString().trim()
  if (!rawId) {
    return base
  }
  return {
    ...base,
    voucherId: parseInteger(rawId, 'Voucher'),
  }
}
const respondWithVoucherFeedback = async (c: Context, result: VoucherCreateResult) => {
  const payload = await getVouchersPagePayload()
  const historySection = renderVoucherHistorySection(payload.vouchers)
  const textColor = result.status === 200 ? 'text-emerald-300' : 'text-amber-400'
  return c.html(
    `${historySection}<div class="px-3 py-2 ${textColor}">${result.message}</div>`,
    result.status
  )
}
app.get('/', (c) => c.html(homepage))
app.get('/products', async (c) => {
  const { products, statuses, suppliers } = await getProductPagePayload()
  return c.html(productPage(products, statuses, suppliers))
})
app.get('/changes', async (c) => {
  const changes = await listChangeEvents()
  return c.html(changesPage(changes))
})
app.get('/vouchers', async (c) => {
  const payload = await getVouchersPagePayload()
  return c.html(vouchersPage(payload))
})
app.post('/products/update', async (c) => {
  const form = await c.req.formData()
  const originalSku = (form.get('originalSku') ?? '').toString()
  const sku = (form.get('sku') ?? '').toString()
  const name = (form.get('name') ?? '').toString()
  const requestedStatusId = Number(form.get('status'))
  const costInput = (form.get('cost') ?? '').toString().trim()
  let costCents: number | null = null
  if (costInput) {
    const parsedCost = Number(costInput)
    if (!Number.isFinite(parsedCost) || parsedCost < 0) {
      return c.html('Cost must be a non-negative number.', 400)
    }
    costCents = Math.round(parsedCost * 100)
  }
  const purchaseRemarks = (form.get('purchaseRemarks') ?? '').toString()
  const supplierIdInput = (form.get('supplierId') ?? '').toString().trim()
  let supplierId: number | null = null
  if (supplierIdInput) {
    const parsedSupplierId = Number(supplierIdInput)
    if (!Number.isFinite(parsedSupplierId)) {
      return c.html('Invalid supplier selection.', 400)
    }
    supplierId = Math.round(parsedSupplierId)
  }
  const supplierLink = (form.get('supplierLink') ?? '').toString().trim()
  const result = await updateProductDetails({
    originalSku,
    sku,
    name,
    requestedStatusId,
    costCents,
    purchaseRemarks,
    supplierId,
    supplierLink,
  })
  const textColor = result.status === 200 ? 'text-emerald-300' : 'text-amber-400'
  return c.html(`<div class="px-3 py-2 ${textColor}">${result.message}</div>`, result.status)
})
app.post('/vouchers/save', async (c) => {
  const form = await c.req.formData()
  let parsed
  try {
    parsed = parseVoucherForm(form)
  } catch (error) {
    return c.html(
      `<div class="px-3 py-2 text-amber-400">\${(error as Error).message}</div>`,
      400
    )
  }
  const { voucherId, ...rest } = parsed
  const result = voucherId
    ? await updateVoucherDetails({ id: voucherId, ...rest })
    : await createVoucher(rest)
  return respondWithVoucherFeedback(c, result)
})
app.delete('/vouchers/:id', async (c) => {
  const idParam = c.req.param('id')
  const parsedId = Number(idParam)
  if (!Number.isFinite(parsedId) || !Number.isInteger(parsedId) || parsedId <= 0) {
    return c.html('<div class="px-3 py-2 text-amber-400">Invalid voucher selection.</div>', 400)
  }
  const result = await deleteVoucherRecord(parsedId)
  return respondWithVoucherFeedback(c, result)
})
app.get('/status', (c) => {
  const time = new Date().toISOString()
  return c.text(`Backend is alive at ${time}`)
})
const handler = {
  port: 3000,
  fetch: app.fetch,
}
if (process.argv.includes('--dry-run')) {
  console.log('Dry run: Bun/Hono homepage handler ready.')
  process.exit(0)
}
export default handler
