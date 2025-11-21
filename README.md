# GenTech E-Commerce Management

Lightweight Bun + Hono backend for inventory, finance, and e-commerce management, powered by SQLite and Drizzle ORM.

- Runtime: Bun (TypeScript, strict)
- Framework: Hono
- DB: SQLite via Drizzle ORM
- Frontend: HTMX + Alpine.js + Tailwind CSS

## Quick Start

```bash
bun install
bun run dev   # start on http://localhost:3000
```

## Development

- Type check: `bun run typecheck`
- Tests: `bun test`
- Migrations: `bun run db:generate` then `bun run db:migrate`
- DB studio: `bun run db:studio`

For deeper project conventions, see `AGENTS.md`.
