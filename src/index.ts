import { Hono } from 'hono'
import { listProducts, ProductSummary, updateProduct } from './db'

const app = new Hono()

const navBar = (active: 'home' | 'products') => `
    <nav class="flex items-center gap-6 uppercase text-xs tracking-[0.4em]">
      <a class="hover:text-sky-300 transition ${active === 'home' ? 'text-white' : 'text-slate-500'}" href="/">Home</a>
      <a class="hover:text-sky-300 transition ${active === 'products' ? 'text-white' : 'text-slate-500'}" href="/products">Products</a>
    </nav>
`

const escapeHtml = (value: string) =>
  value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;')

const formatMoney = (amount: number | null) => {
  if (amount === null || Number.isNaN(amount)) return '—'
  return `$${amount.toFixed(2)}`
}

const homepage = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>GenTech</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://unpkg.com/htmx.org@1.9.2"></script>
    <script src="https://unpkg.com/alpinejs@3.12.0" defer></script>
  </head>
  <body class="min-h-screen bg-slate-950 text-white flex flex-col">
    <header class="px-6 py-10 max-w-4xl mx-auto space-y-6">
      <div class="flex items-center justify-between">
        <p class="text-xs font-semibold uppercase tracking-[0.45em] text-slate-400">GenTech</p>
        ${navBar('home')}
      </div>
      <h1 class="text-4xl md:text-5xl font-semibold">Inventory, finance, and e-commerce, simplified.</h1>
      <p class="text-lg text-slate-300">A minimal HTMX + Alpine.js + Tailwind CSS front to showcase the Bun/Hono backend.</p>
      <div class="flex flex-wrap gap-3">
        <button
          class="px-6 py-3 rounded bg-sky-500/80 text-white hover:bg-sky-400 transition"
          hx-get="/status"
          hx-target="#status"
          hx-swap="innerHTML"
        >
          Ping the backend
        </button>
        <button
          x-data="{ open: false }"
          @click="open = !open"
          class="px-6 py-3 rounded border border-white/20 text-sm uppercase tracking-wide hover:bg-white/10 transition"
        >
          <span x-text="open ? 'Hide notes' : 'Show notes'"></span>
        </button>
      </div>
      <p id="status" class="text-sm text-slate-400">Backend is waiting for HTMX to wake it up.</p>
      <p
        x-show="open"
        x-cloak
        class="text-sm text-slate-500 max-w-2xl"
      >
        This spot is intentionally minimal, just enough interaction to prove HTMX and Alpine.js are wired up.
      </p>
      <p class="text-sm">
        Jump to the <a href="/products" class="text-sky-400 underline">product list</a> once it is ready.
      </p>
    </header>
    <main class="flex-1 flex items-center justify-center px-6">
      <div class="text-center space-y-4 max-w-2xl">
        <p class="text-slate-300">
          Start building by placing HTMX fragments or Alpine components right on this route. The backend is
          focused on Bun + Hono routes, so keep interactions small and reliable.
        </p>
        <p class="text-xs uppercase tracking-[0.5em] text-slate-500">Built with Bun - Hono - Tailwind - HTMX - Alpine</p>
      </div>
    </main>
  </body>
</html>`

const productPage = (products: ProductSummary[]) => {
  const productCards = products.length
    ? products
        .map(({ sku, name, status, cost, supplier, supplierLink }) => {
          const safeSku = escapeHtml(sku)
          const safeName = escapeHtml(name)
          const safeStatus = escapeHtml(status)
          const safeSupplier = supplier ? escapeHtml(supplier) : null
          const safeLink = supplierLink ? escapeHtml(supplierLink) : null
          const displayCost = formatMoney(cost)

          return `<div class="px-4 py-3 rounded bg-slate-900 text-slate-50 border border-white/5">
            <form
              hx-post="/products/update"
              hx-target="#product-feedback"
              hx-swap="innerHTML"
              class="space-y-3"
            >
              <input type="hidden" name="sku" value="${safeSku}" />
              <div class="flex items-center justify-between">
                <span class="font-semibold text-slate-100">${safeSku}</span>
                <span class="text-xs uppercase tracking-[0.3em] text-slate-400">${safeStatus}</span>
              </div>
              <label class="text-xs uppercase tracking-[0.3em] text-slate-400 block">
                Name
                <input
                  class="mt-1 w-full rounded border border-white/10 bg-slate-900 px-3 py-2 text-sm text-white focus:border-sky-400 focus:outline-none"
                  name="name"
                  value="${safeName}"
                />
              </label>
              <label class="text-xs uppercase tracking-[0.3em] text-slate-400 block">
                Status
                <input
                  class="mt-1 w-full rounded border border-white/10 bg-slate-900 px-3 py-2 text-sm text-white focus:border-sky-400 focus:outline-none"
                  name="status"
                  value="${safeStatus}"
                />
              </label>
              <p class="text-slate-400 text-xs uppercase tracking-[0.3em]">Cost: ${displayCost}</p>
              ${
                safeSupplier
                  ? `<p class="text-slate-200 text-xs">Supplier: <a class="text-sky-300 underline" href="${safeLink ?? '#'}" target="_blank" rel="noreferrer">${safeSupplier}</a></p>`
                  : '<p class="text-slate-500 text-xs">Supplier: unknown</p>'
              }
              <button
                type="submit"
                class="w-full rounded bg-sky-500/80 px-3 py-2 text-xs uppercase tracking-[0.4em] text-white transition hover:bg-sky-400"
              >
                Save product
              </button>
            </form>
          </div>`
        })
        .join('')
    : '<p class="text-slate-500">No products yet.</p>'

  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Products - GenTech</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://unpkg.com/htmx.org@1.9.2"></script>
  </head>
  <body class="min-h-screen bg-slate-950 text-white flex flex-col">
    <header class="px-6 py-10 max-w-4xl mx-auto space-y-4">
      <div class="flex items-center justify-between">
        <p class="text-xs font-semibold uppercase tracking-[0.45em] text-slate-400">GenTech</p>
        ${navBar('products')}
      </div>
      <h1 class="text-3xl font-semibold">Product SKUs</h1>
      <p class="text-sm text-slate-400">Fetched directly from gentech.sqlite, showing SKU, name, and status.</p>
      <a class="text-sky-400 underline text-xs" href="/">Back to home</a>
    </header>
    <main class="flex-1 px-6 pb-10">
      <div class="max-w-4xl mx-auto bg-slate-900/80 rounded-2xl border border-white/10 shadow-inner p-6 space-y-3">
        <div id="product-feedback" class="text-sm text-slate-200">
          Tap "Save product" to persist changes and watch this space for the result.
        </div>
        <div class="space-y-4 text-sm">
          ${productCards}
        </div>
      </div>
    </main>
  </body>
</html>`
}

app.get('/', (c) => c.html(homepage))

app.get('/products', async (c) => {
  const products = await listProducts()
  return c.html(productPage(products))
})

app.post('/products/update', async (c) => {
  const form = await c.req.formData()
  const sku = (form.get('sku') ?? '').toString().trim()
  const name = (form.get('name') ?? '').toString().trim()
  const status = (form.get('status') ?? 'active').toString().trim()

  if (!sku || !name) {
    return c.html('<div class="px-3 py-2 text-amber-400">SKU and name are required.</div>', 400)
  }

  const updated = await updateProduct(sku, name, status || 'active')
  if (updated) {
    return c.html('<div class="px-3 py-2 text-emerald-300">Product saved.</div>', 200)
  }

  return c.html('<div class="px-3 py-2 text-amber-400">Product not found.</div>', 404)
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
