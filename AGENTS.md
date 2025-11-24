# GenTech E-Commerce Management

> Lightweight SQLite-based backend for inventory, finance, and e-commerce management
> Built with **Bun + Hono + Drizzle ORM**

---

## Tech Stack
- **Runtime:** Bun (fast, TypeScript-native)
- **Framework:** Hono (lightweight web framework)
- **Database:** SQLite via Drizzle ORM
- **Language:** TypeScript (strict mode)
- **Frontend:** HTMX + Alpine.js + Tailwind CSS

---

## Project Structure (suffix naming)

```
GenTech-new/
- src/
  - index.routes.ts    # App bootstrap: create Hono app, register controllers
  - controllers/       # Route modules per feature (thin handlers)
  - db/                # Database layer (schema, queries, connection)
  - services/          # Business logic (product, voucher, changelog services)
  - domain/            # Domain utilities (formatters, helpers)
  - repositories/      # Repository adapters around db layer
  - ui/                # Server-rendered UI templates and styles
  - env.d.ts           # TypeScript environment declarations
- scripts/              # Migration and maintenance scripts
- gentech.sqlite        # SQLite database file
```

**Naming convention:** `<feature>.<role>.ts` (e.g., `products.service.ts`, `products.page.ts`, `schema.db.ts`, `formatters.domain.ts`).

---

## Core Principles

### Type Safety
- TypeScript strict mode is mandatory
- Never use `any` or `@ts-ignore` - fix type errors properly
- Let Drizzle ORM infer types from schema automatically
- Types flow from database schema (single source of truth)

### Money Handling
- **ALWAYS** store currency as integers (cents, not dollars)
- Never use floats for money calculations
- Use `toCents()` and `formatMoney()` helpers from `domain/formatters.domain.ts`

### Data Validation
- Validate at API boundaries using Zod schemas
- Parse external inputs - don't trust raw data
- Fail fast with clear error messages

### Transactions
- Use database transactions for multi-step operations
- Atomic operations ensure data consistency
- If one step fails, entire transaction rolls back

### Schema-Driven Data
- Reference data (statuses, tiers, types) lives in schema
- Seed through migrations, query from database
- No hardcoded lists that drift from database reality

### KISS (Keep It Simple, Stupid)
- Keep it simple.
- Reduce complexity.
- Choose clarity over cleverness.

### YAGNI (You Aren’t Gonna Need It)
- Don’t build features until they’re actually needed.
- Avoid designing for hypothetical future scenarios.
- Implement only what delivers value right now.

### DRY (Don’t Repeat Yourself)
- Duplicate logic → bugs when you change one copy but not the other.
- But don’t abstract too early.
- Abstract only when duplication becomes an actual maintenance burden.

### The Principle of Least Privilege
- Security + stability
- Give components the minimum access they need
- Avoid global state
- Avoid "god objects"
- Keep boundaries tight

### Readability > Cleverness
- Clear variable names
- Clear flow
- Predictable behavior
- Comments only where needed

### Prefer Composition Over Inheritance
- A real-world lifesaver.
- Composition keeps systems flexible
- Inheritance trees become rigidity traps
- Easier testing, easier extension, fewer surprises

---

## Architecture Layers

### Routes (`src/controllers/`, registered via `src/index.routes.ts`)
- Hono route handlers per feature (products, vouchers, fees, settings, statuses, home, change logs)
- Parse request/response payloads
- Validate inputs (or call service validators)
- Delegate to service layer
- **Keep thin**: no business logic, no formatting

### Service Layer (`src/services/`)
- Business logic and domain rules
- Input validation (Zod/manual)
- Coordinates database operations
- Returns structured payloads for views
- Uses domain utilities for money/formatting

### Repository Layer (`src/repositories/`)
- Thin adapters around db layer
- Interface + implementation per feature
- No business rules

### Database Layer (`src/db/`)
- Schema definitions (Drizzle ORM tables)
- Database connection setup
- Low-level query functions
- Type inference from schema

### Domain Layer (`src/domain/`)
- Pure utilities (money, timestamps, search, filters, sanitizers)
- No side effects

### UI Layer (`src/ui/`)
- Server-rendered layouts, pages, templates, styles
- HTMX + Alpine-friendly markup
- Receives formatted data from services

---

## Common Tasks

### Adding a New Feature
1. Define schema in `src/db/schema.db.ts`
2. Generate migration: `bun run db:generate`
3. Apply migration: `bun run db:migrate`
4. Create queries in `src/db/<feature>.db.ts`
5. Add repository interface/impl in `src/repositories/`
6. Create service in `src/services/<feature>.service.ts`
7. Add routes in `src/controllers/<feature>.routes.ts` and register in `index.routes.ts`
8. Create UI fragments/pages if needed
9. Test with `bun test`

### Working with Money
```typescript
import { toCents, formatMoney } from './domain/formatters.domain.ts'

// Store as cents
const priceInCents = toCents(19.99) // 1999

// Display as formatted string
const display = formatMoney(priceInCents) // "$19.99"
```

### Transactions
```typescript
import { db } from './db/connection.db.ts'

await db.transaction(async (tx) => {
  // Multiple operations - all succeed or all fail
  await tx.insert(table1).values(data1)
  await tx.update(table2).set(data2).where(condition)
})
```

---

## Style & UI Guidelines

### Color Palette
- **Primary accent:** `#b41f26` (default) to `#ff2b2b` (hover)
- **Background:** `#010101` (page), `rgba(15,15,15,0.85)` (panels)
- **Text:** `#f7f4f0` (cream white)
- **Borders:** `rgba(255,255,255,0.1)` (light) / `rgba(255,255,255,0.3)` (strong)

### Typography
- **Headings:** Space Grotesk, weight 600
- **Body:** Inter, weight 400
- **UI text:** Uppercase, `letter-spacing: 0.3em`
- **Minimum contrast ratio:** 3:1 for accessibility

### Spacing
- **Panel padding:** 1.5rem
- **Section gap:** 2rem
- **Form controls:** 0.5rem between inputs

---

## Testing

```bash
# Run all tests
bun test

# Run specific test file
bun test src/services/products.service.test.ts

# Type check only
bun run typecheck
```

---

## Debugging

### Check Database
```bash
# Open Drizzle Studio
bun run db:studio
# Browse tables visually at http://localhost:4983
```

### Inspect Queries
```typescript
// Enable query logging
import { drizzle } from 'drizzle-orm/bun-sqlite'
const db = drizzle(sqlite, { logger: true })
```

---

## Resources
- [Bun Docs](https://bun.sh/docs)
- [Hono Docs](https://hono.dev)
- [Drizzle ORM](https://orm.drizzle.team)
- [Zod](https://zod.dev)

---
