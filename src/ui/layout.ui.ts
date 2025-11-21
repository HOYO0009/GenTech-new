export type SiteSection = 'home' | 'products' | 'vouchers' | 'changes' | 'settings'

const navBar = (active: SiteSection) => `
    <nav class="flex items-center gap-6 uppercase text-xs tracking-[0.4em]">
      <a class="hover:text-white transition ${active === 'home' ? 'text-white' : 'text-red-400'}" href="/">Home</a>
      <a class="hover:text-white transition ${active === 'products' ? 'text-white' : 'text-red-400'}" href="/products">Products</a>
      <a class="hover:text-white transition ${active === 'vouchers' ? 'text-white' : 'text-red-400'}" href="/vouchers">Vouchers</a>
      <a class="hover:text-white transition ${active === 'changes' ? 'text-white' : 'text-red-400'}" href="/changes">Changes</a>
      <a class="hover:text-white transition ${active === 'settings' ? 'text-white' : 'text-red-400'}" href="/settings">Settings</a>
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
      padding: 1.5rem;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.4);
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
      <div class="max-w-4xl mx-auto space-y-4">
        ${mainContent}
      </div>
    </main>
  </body>
</html>`
