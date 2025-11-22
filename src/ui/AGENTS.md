# UI Layer (`src/ui/`)

> Server-rendered layouts, templates, and styles that pair with Hono routes.

---

## Structure & Naming

```
ui/
- layout.ui.ts          # Shared shell, nav, and client-side helpers
- pages/                # Page-level renderers (e.g. `productEditor.page.ts`)
- templates/            # Reusable HTML fragments
- styles/               # Tailwind/inline style helpers
```

**Naming convention:** `<feature>.page.ts` for full pages, `<feature>.template.ts` for fragments, `<feature>.style.ts` for style helpers.

---

## Responsibilities

- Render HTML strings for routes using HTMX/Alpine-friendly markup.
- Keep UI purely presentational: accept formatted data from services, no DB calls.
- Apply project palette/typography (primary `#b41f26` → `#ff2b2b`, background `#010101`, text `#f7f4f0`).
- Keep components mobile-friendly and minimal JS (prefer HTMX/Alpine attributes).

**Avoid:** Business logic, data fetching, currency math, or schema validation here.

---

## Patterns

- Centralize layout chrome in `layout.ui.ts` (`navBar`, `visualFoundation`), reuse across pages.
- Receive ready-to-render payloads from services; escape/format data before passing in.
- Use semantic sections and consistent spacing (`panel padding 1.5rem`, section gap `2rem`).
- Prefer uppercase UI text with `letter-spacing: 0.3em` to match design language.

---

## Navigation
- **Parent:** [src/AGENTS.md](../AGENTS.md)
- **Root:** [Project AGENTS.md](../../AGENTS.md)
