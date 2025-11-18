import { Hono } from 'hono'
import {
  getProductPagePayload,
  ProductCard,
  ProductStatusOption,
  updateProductDetails,
} from './services/products'
import { ChangeLogEvent, listChangeEvents } from './services/changeLogs'

const app = new Hono()

const navBar = (active: 'home' | 'products' | 'changes') => `
    <nav class="flex items-center gap-6 uppercase text-xs tracking-[0.4em]">
      <a class="hover:text-white transition ${active === 'home' ? 'text-white' : 'text-red-400'}" href="/">Home</a>
      <a class="hover:text-white transition ${active === 'products' ? 'text-white' : 'text-red-400'}" href="/products">Products</a>
      <a class="hover:text-white transition ${active === 'changes' ? 'text-white' : 'text-red-400'}" href="/changes">Changes</a>
    </nav>
`

const layout = (
  active: 'home' | 'products' | 'changes',
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
      <div class="max-w-4xl mx-auto space-y-4">
        ${mainContent}
      </div>
    </main>
  </body>
</html>`

const homepage = layout(
  'home',
  'GenTech',
  `<div x-data="{ open: false }" class="space-y-6">
      <h1 class="text-4xl md:text-5xl font-semibold">Inventory, finance, and e-commerce, simplified.</h1>
      <p class="text-lg text-white/70">A minimal HTMX + Alpine.js + Tailwind CSS front to showcase the Bun/Hono backend.</p>
      <div class="flex flex-wrap gap-3">
        <button
          class="px-6 py-3 rounded bg-red-600/80 text-white hover:bg-red-500 transition"
          hx-get="/status"
          hx-target="#status"
          hx-swap="innerHTML"
        >
          Ping the backend
        </button>
        <button
          @click="open = !open"
          class="px-6 py-3 rounded border border-white/20 text-sm uppercase tracking-wide hover:bg-white/10 transition"
        >
          <span x-text="open ? 'Hide notes' : 'Show notes'"></span>
        </button>
      </div>
      <p id="status" class="text-sm text-white/80">Backend is waiting for HTMX to wake it up.</p>
      <p
        x-show="open"
        x-cloak
        class="text-sm text-white/80 max-w-2xl"
      >
        This spot is intentionally minimal, just enough interaction to prove HTMX and Alpine.js are wired up.
      </p>
      <p class="text-sm">
        Jump to the <a href="/products" class="text-red-400 underline">product list</a> once it is ready.
      </p>
    </div>`,
  `<div class="text-center space-y-4 max-w-2xl mx-auto">
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

const productPage = (products: ProductCard[], statuses: ProductStatusOption[]) => {
  const productCards = products.length
    ? products
        .map(({ sku, name, statusId, statusName, costDisplay, supplierName, supplierLink, hasSupplierLink }) => {
          const supplierSection = supplierName
            ? `<p class="text-white/70 text-xs">Supplier: ${hasSupplierLink && supplierLink
                ? `<a class="text-red-400 underline" href="${supplierLink}" target="_blank" rel="noreferrer">${supplierName}</a>`
                : `<span class="text-red-400">${supplierName}</span>`
              }</p>`
            : '<p class="text-white/80 text-xs">Supplier: unknown</p>'

          return `<div class="px-4 py-3 rounded bg-black/80 border border-white/10 text-white shadow-[0_0_40px_rgba(0,0,0,0.45)]">
            <form
              hx-post="/products/update"
              hx-target="#product-feedback"
              hx-swap="innerHTML"
              class="space-y-3"
            >
              <input type="hidden" name="sku" value="${sku}" />
              <div class="flex items-center justify-between">
                <span class="font-semibold text-white">${sku}</span>
                <span class="text-xs uppercase tracking-[0.3em] text-red-400">${statusName}</span>
              </div>
              <label class="text-xs uppercase tracking-[0.3em] text-white/70 block">
                Name
                <input
                  class="mt-1 w-full rounded border border-white/10 bg-white/5 px-2 py-1 text-sm text-white"
                  type="text"
                  name="name"
                  value="${name}"
                />
              </label>
              <label class="text-xs uppercase tracking-[0.3em] text-white/70 block">
                Status
                <select
                  class="mt-1 w-full rounded border border-white/10 bg-white/5 px-2 py-1 text-sm text-white"
                  name="status"
                >
                  ${statuses
                    .map(
                      (option) => `<option value="${option.id}" ${option.id === statusId ? 'selected' : ''}>${option.name}</option>`
                    )
                    .join('')}
                </select>
              </label>
              <p class="text-white/80 text-xs uppercase tracking-[0.4em]">Cost</p>
              <p class="text-white/80 text-xs uppercase tracking-[0.4em]">${costDisplay}</p>
              ${supplierSection}
              <button
                type="submit"
                class="w-full rounded bg-red-600/80 px-3 py-2 text-xs uppercase tracking-[0.4em] text-white transition hover:bg-red-500"
              >
                Save product
              </button>
            </form>
          </div>`
        })
        .join('')
    : '<p class="text-white/80">No products yet.</p>'

  const heroContent = `<div class="space-y-3">
      <h1 class="text-3xl font-semibold">Product SKUs</h1>
      <p class="text-sm text-white/70">Fetched directly from gentech.sqlite, showing SKU, name, and status.</p>
      <a class="text-red-400 underline text-xs" href="/">Back to home</a>
    </div>`

  const mainContent = `<div class="bg-black/70 rounded-2xl border border-white/10 shadow-inner p-6 space-y-3">
      <div id="product-feedback" class="text-sm text-white/70">
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

app.get('/', (c) => c.html(homepage))

app.get('/products', async (c) => {
  const { products, statuses } = await getProductPagePayload()
  return c.html(productPage(products, statuses))
})

app.get('/changes', async (c) => {
  const changes = await listChangeEvents()
  return c.html(changesPage(changes))
})

app.post('/products/update', async (c) => {
  const form = await c.req.formData()
  const sku = (form.get('sku') ?? '').toString()
  const name = (form.get('name') ?? '').toString()
  const requestedStatusId = Number(form.get('status'))

  const result = await updateProductDetails({ sku, name, requestedStatusId })
  const textColor = result.status === 200 ? 'text-emerald-300' : 'text-amber-400'
  return c.html(`<div class="px-3 py-2 ${textColor}">${result.message}</div>`, result.status)
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
