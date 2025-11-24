# Source Code (`src/`)

> Main application source code - routing, business logic, database, repositories, domain utilities, and UI.

---

## Directory Structure (suffix naming)

```
src/
- index.routes.ts     # App bootstrap (creates Hono app, registers controllers)
- controllers/       # Route modules per feature (thin handlers)
- db/                # Database layer (schema, connection, queries)
- repositories/      # Repository adapters over db layer
- services/          # Business logic layer
- domain/            # Pure utilities and helpers
- ui/                # Server-rendered UI fragments, pages, styles
- env.d.ts           # TypeScript environment declarations
```

**Naming convention:** `<feature>.<role>.ts` (e.g., `products.service.ts`, `products.routes.ts`, `schema.db.ts`, `formatters.domain.ts`).

---

## Layer Architecture

### Routes (`controllers/`, registered in `index.routes.ts`)
- Hono route handlers per feature (products, vouchers, change logs, statuses, settings, fees, home)
- Parse/validate inputs, shape responses
- Call services; keep logic minimal
- No direct database access

### Services (`services/`)
- Business rules, validation (Zod/manual), orchestration
- Uses repositories/db for data access
- Uses domain utilities for formatting, conversions
- Returns structured payloads for UI

### Repositories (`repositories/`)
- Thin adapters over db queries
- Interfaces + concrete implementations per feature
- No business logic

### Database (`db/`)
- Schema definitions (single source of truth)
- Connection setup
- Query functions per feature
- No business logic or formatting

### Domain (`domain/`)
- Pure utility functions (money, search, filters, sanitizers, formatters)
- No side effects, no I/O

### UI (`ui/`)
- Layouts, pages, templates, styles (HTMX/Alpine friendly)
- Receives formatted payloads from services
- No business logic or database calls

---

## File Organization Highlights

- `index.routes.ts`: Creates Hono app, registers controllers, exports `{ port, fetch }`. No feature logic here.
- `controllers/<feature>.routes.ts`: Thin route module per feature; delegate to services.
- `services/<feature>.service.ts`: Business logic per feature (products, vouchers, fees, search/transformation helpers, change logs).
- `repositories/<feature>.repository.ts`: Concrete implementations that wrap `db/<feature>.db.ts`.
- `db/<feature>.db.ts`: Query helpers; schema lives in `db/schema.db.ts`.
- `ui/pages/*.page.ts`: Page-level renderers; `ui/templates/` holds fragments; `ui/layout.ui.ts` centralizes shell.

---

## Common Patterns

### Adding a Route (controller-first)
1. Create/update `controllers/<feature>.routes.ts`.
2. Validate/parse request data (Zod or manual).
3. Call service function.
4. Return JSON/HTML response (no DB calls here).
5. Register the controller in `index.routes.ts`.

### Adding Business Logic
1. Update/create `services/<feature>.service.ts`.
2. Define input schema (Zod) or manual validation.
3. Use repositories/db functions.
4. Apply domain utilities (`toCents`, `formatMoney`, sanitizers).
5. Return payload shaped for UI.

### Adding Queries
1. Update schema in `db/schema.db.ts` if needed.
2. Generate/apply migration (`bun run db:generate`, `bun run db:migrate`).
3. Add query helpers in `db/<feature>.db.ts`.
4. Expose through repository.
5. Consume in services.

### Request/Type Flow
```
HTTP Request
  -> Controller (controllers/)
  -> Service (services/) [validation + business rules]
  -> Repository/DB (repositories/ -> db/)
  -> Response payload -> UI
```

Types flow from schema:
```
db/schema.db.ts (table.$inferSelect/Insert)
  -> db queries
    -> repositories
      -> services
        -> controllers/UI
```
**Never hand-write types when they can be inferred.**

---

## Key Files

| File | Purpose |
|------|---------|
| `index.routes.ts` | App bootstrap, registers controllers |
| `controllers/products.routes.ts` | Product routes (delegates to services/UI) |
| `controllers/vouchers.routes.ts` | Voucher routes |
| `controllers/fees.routes.ts` | Shop fee routes |
| `services/products.service.ts` | Product business logic/search/transforms |
| `services/vouchers.service.ts` | Voucher business logic |
| `services/fees.service.ts` | Fee business logic |
| `db/schema.db.ts` | All table definitions |
| `db/products.db.ts` | Product queries |
| `ui/layout.ui.ts` | Shared layout/shell |

---

## Working in This Directory

- Keep controllers thin; push logic to services.
- Use repositories/db for data access; no raw SQL in services/controllers.
- Validate external inputs before use.
- Store money as cents; never use floats for money.
- Use transactions for multi-step operations.
- Add UI pieces in `ui/` only; avoid business logic in templates.

---

## Navigation
- **Parent:** `../AGENTS.md`
- **Database Layer:** `db/AGENTS.md`
- **Service Layer:** `services/AGENTS.md`
- **Domain Layer:** `domain/AGENTS.md`
- **Repository Layer:** `repositories/AGENTS.md`
- **UI Layer:** `ui/AGENTS.md`
