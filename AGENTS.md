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

## Development Commands

```bash
# Install dependencies
bun install

# Run development server (default port: 3000)
bun run dev

# Type checking (TypeScript compiler)
bun run typecheck

# Generate database migrations
bun run db:generate

# Apply database migrations
bun run db:migrate

# Open Drizzle Studio (visual DB inspector)
bun run db:studio

# Run tests
bun test
```

---

## Project Structure

```
GenTech-new/
├── src/
│   ├── db/           # Database layer (schema, queries, connection)
│   ├── services/     # Business logic (product, voucher, changelog services)
│   ├── domain/       # Domain utilities (formatters, helpers)
│   └── index.ts      # Main application entry (routes, handlers)
├── scripts/          # Migration and maintenance scripts
└── gentech.sqlite    # SQLite database file
```

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
- Use `toCents()` and `formatMoney()` helpers from `domain/formatters.ts`

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

---

## Architecture Layers

### Database Layer (`src/db/`)
- Schema definitions (Drizzle ORM tables)
- Database connection setup
- Low-level query functions
- No business logic here

### Service Layer (`src/services/`)
- Business logic and domain rules
- Coordinates database operations
- Returns structured payloads for views
- Handles validation and transformations

### Domain Layer (`src/domain/`)
- Shared utilities and formatters
- Pure functions with no side effects
- Money formatting, date handling, etc.

### Routes (`src/index.ts`)
- HTTP handlers and routing (Hono)
- Request/response transformations
- Delegates to service layer
- Minimal logic in routes

---

## Common Tasks

### Adding a New Feature
1. Define schema in `src/db/schema.ts`
2. Generate migration: `bun run db:generate`
3. Apply migration: `bun run db:migrate`
4. Create service in `src/services/<feature>.ts`
5. Add routes in `src/index.ts`
6. Test with `bun test`

### Working with Money
```typescript
import { toCents, formatMoney } from './domain/formatters'

// Store as cents
const priceInCents = toCents(19.99) // 1999

// Display as formatted string
const display = formatMoney(priceInCents) // "$19.99"
```

### Database Queries
```typescript
// Use Drizzle query builder (type-safe)
import { db } from './db/connection'
import { products } from './db/schema'
import { eq, gt } from 'drizzle-orm'

const activeProducts = await db
  .select()
  .from(products)
  .where(gt(products.stock, 0))
```

### Transactions
```typescript
import { db } from './db/connection'

await db.transaction(async (tx) => {
  // Multiple operations - all succeed or all fail
  await tx.insert(table1).values(data1)
  await tx.update(table2).set(data2).where(condition)
})
```

---

## Style & UI Guidelines

### Color Palette
- **Primary accent:** `#b41f26` (default) → `#ff2b2b` (hover)
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

## Code Quality

### Do This ✅
- Validate inputs with Zod at API boundaries
- Use TypeScript strict mode without exceptions
- Store money as integer cents
- Wrap multi-step operations in transactions
- Keep business logic in service layer
- Use Drizzle query builder for type safety
- Let schema define types (no manual interfaces)

### Avoid This ❌
- Never use `any` or `@ts-ignore`
- Never use floats for money calculations
- Never trust external input without validation
- Never mix business logic into route handlers
- Never write raw SQL when query builder works
- Never swallow errors silently
- Never create manual type definitions that drift from schema

---

## Testing

```bash
# Run all tests
bun test

# Run specific test file
bun test src/services/products.test.ts

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

**Remember:** Type safety + validation = confidence. Fast code is useless if it's wrong.
