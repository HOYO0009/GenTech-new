import { currencyClientScript, supportedCurrencies } from '../domain/currency.domain'
import { moneyClientScript } from '../domain/formatters.domain'
import { shortcutsClientScript } from '../domain/shortcuts.domain'

export type SiteSection =
  | 'home'
  | 'products'
  | 'listings'
  | 'categories'
  | 'vouchers'
  | 'fees'
  | 'changes'
  | 'settings'

const navBar = (active: SiteSection) => `
    <nav
      class="flex flex-wrap md:flex-nowrap items-center gap-4 sm:gap-6 uppercase text-[0.65rem] sm:text-xs tracking-[0.28em] sm:tracking-[0.4em] overflow-x-auto md:overflow-visible [-webkit-overflow-scrolling:_touch]"
      data-site-nav
    >
      <a class="hover:text-white transition ${active === 'home' ? 'text-white' : 'text-red-400'}" href="/">Home</a>
      <a class="hover:text-white transition ${active === 'products' ? 'text-white' : 'text-red-400'}" href="/products">Products</a>
      <a class="hover:text-white transition ${active === 'listings' ? 'text-white' : 'text-red-400'}" href="/listings">Listings</a>
      <a class="hover:text-white transition ${active === 'categories' ? 'text-white' : 'text-red-400'}" href="/categories">Categories</a>
      <a class="hover:text-white transition ${active === 'vouchers' ? 'text-white' : 'text-red-400'}" href="/vouchers">Vouchers</a>
      <a class="hover:text-white transition ${active === 'fees' ? 'text-white' : 'text-red-400'}" href="/fees">Fees</a>
      <a class="hover:text-white transition ${active === 'changes' ? 'text-white' : 'text-red-400'}" href="/changes">Changes</a>
      <a class="hover:text-white transition ${active === 'settings' ? 'text-white' : 'text-red-400'}" href="/settings">Settings</a>
      <div class="relative shrink-0">
        <button
          type="button"
          class="flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-[0.65rem] font-semibold uppercase tracking-[0.3em] text-white/80 hover:border-white/30 hover:text-white"
          data-currency-trigger
        >
          <span class="text-white/60 hidden sm:inline">Currency</span>
          <span data-currency-label>SGD</span>
        </button>
        <div
          class="absolute right-0 mt-2 w-44 overflow-hidden rounded-xl border border-white/10 bg-black/90 shadow-xl backdrop-blur-sm hidden"
          data-currency-menu
        >
          ${supportedCurrencies
            .map(
              (entry) => `
                <button
                  type="button"
                  data-currency-option="${entry.code}"
                  class="flex w-full items-center justify-between px-4 py-2 text-[0.75rem] tracking-[0.2em] text-white/80 hover:bg-white/10"
                >
                  <span>${entry.code}</span>
                  <span class="text-white/50">${entry.label}</span>
                </button>
              `
            )
            .join('')}
        </div>
      </div>
    </nav>
`

const visualFoundation = `
  <style>
    *,
    *::before,
    *::after {
      box-sizing: border-box;
    }
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
      font-size: clamp(0.95rem, 0.3vw + 0.9rem, 1rem);
      letter-spacing: clamp(0.02em, 0.2vw + 0.02em, 0.05em);
      line-height: 1.6;
    }
    a {
      color: inherit;
    }
    header nav a {
      font-size: clamp(0.7rem, 0.3vw + 0.6rem, 0.8rem);
      letter-spacing: clamp(0.28em, 0.3vw + 0.2em, 0.5em);
    }
    h1, h2, h3, h4 {
      font-family: 'Space Grotesk', 'Inter', system-ui, sans-serif;
      text-transform: uppercase;
      letter-spacing: 0.3em;
    }
    h1 {
      font-size: clamp(1.4rem, 1.2vw + 1rem, 1.75rem);
      font-weight: 600;
    }
    h2 {
      font-size: clamp(1.2rem, 0.8vw + 0.95rem, 1.35rem);
      font-weight: 600;
    }
    h3 {
      font-size: clamp(1.05rem, 0.5vw + 0.95rem, 1.15rem);
      font-weight: 500;
    }
    h4 {
      font-size: clamp(1rem, 0.4vw + 0.9rem, 1.05rem);
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
    .primary-btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-family: inherit;
      text-transform: uppercase;
      letter-spacing: 0.3em;
      font-size: 0.7rem;
      background-color: #b41f26;
      color: #fff;
      border-radius: 999px;
      padding: 0.75rem 1.5rem;
      border: 1px solid transparent;
      transition: background-color 0.2s ease, border-color 0.2s ease;
      text-decoration: none;
      cursor: pointer;
    }
    button.primary-btn {
      border: none;
    }
    .primary-btn:hover {
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
      padding: clamp(1.1rem, 1vw + 1rem, 1.5rem);
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.4);
    }
    nav[data-site-nav] {
      scrollbar-width: none;
    }
    nav[data-site-nav]::-webkit-scrollbar {
      display: none;
    }
  </style>`

export const layout = (
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
      <script>${currencyClientScript()}</script>
      <script>${moneyClientScript()}</script>
      <script>${shortcutsClientScript()}</script>
      ${visualFoundation}
      ${extraHead}
    </head>
  <body class="min-h-screen bg-black text-white flex flex-col">
    <header class="sticky top-0 z-10 border-b border-white/10 bg-black/95 backdrop-blur-sm">
      <div class="max-w-6xl mx-auto px-4 sm:px-6 py-4 sm:py-5 flex flex-wrap items-center gap-4 justify-between">
        <p class="text-xs font-semibold uppercase tracking-[0.45em] text-white/80">GenTech</p>
        <div class="flex-1 w-full md:w-auto flex justify-end">
          ${navBar(active)}
        </div>
      </div>
    </header>
    ${heroContent ? `<section class="px-4 sm:px-6 py-8 sm:py-10 max-w-6xl mx-auto space-y-6">${heroContent}</section>` : ''}
    <main class="flex-1 px-4 sm:px-6 pb-10">
      <div class="max-w-6xl mx-auto space-y-4 sm:space-y-6">
        ${mainContent}
      </div>
    </main>
  </body>
</html>`
