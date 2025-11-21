import { layout } from '../layout.ui'

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

export default homepage
