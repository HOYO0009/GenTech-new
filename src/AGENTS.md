# Source Code (`src/`)

> Main application source code - routes, business logic, database, and domain utilities

---

## Directory Structure (suffix naming)

```
src/
- db/                 # Database layer (schema, connection, queries)
- services/           # Business logic layer (products, vouchers, changelogs)
- domain/             # Domain utilities (formatters, helpers)
- index.routes.ts     # Application entry point (Hono routes & handlers)
- env.d.ts            # TypeScript environment declarations
```

**Naming convention:** `<feature>.<role>.ts` (e.g., `products.service.ts`, `products.page.ts`, `schema.db.ts`, `formatters.domain.ts`).

---

## Layer Architecture

### 1. Routes (`index.routes.ts`)
**Purpose:** HTTP request/response handling only
- Define Hono routes and middleware
- Parse request bodies and query params
- Call service layer functions
- Return HTTP responses
- **NO business logic here**

**Example:**
```typescript
app.post('/products', async (c) => {
  const data = await c.req.json()
  const result = await createProduct(data) // Service layer
  return c.json(result, 201)
})
```

### 2. Service Layer (`services/`)
**Purpose:** Business logic and orchestration
- Validate inputs with Zod
- Coordinate database operations
- Apply business rules
- Transform data for views
- Return structured payloads

**Example:**
```typescript
export async function createProduct(data: unknown) {
  const validated = CreateProductSchema.parse(data)
  const priceInCents = toCents(validated.price)
  return await insertProduct({ ...validated, price: priceInCents })
}
```

### 3. Database Layer (`db/`)
**Purpose:** Data access and schema
- Define Drizzle ORM schema
- Database connection setup
- Low-level query functions
- Type inference from schema
- **NO business logic here**

**Example:**
```typescript
export async function insertProduct(data: NewProduct) {
  return await db.insert(products).values(data).returning()
}
```

### 4. Domain Layer (`domain/`)
**Purpose:** Pure utility functions
- Money formatting (`toCents`, `formatMoney`)
- Date/time helpers
- String formatters
- **No side effects, no database access**

---

## File Organization

### `index.routes.ts` - Main Application
- Hono app initialization
- Route definitions (`GET /products`, `POST /vouchers`, etc.)
- HTML templates and views (inline for simplicity)
- Visual/CSS foundations
- Server export for Bun runtime

**Key Sections:**
1. **Imports** - Services, types, Hono
2. **App Setup** - `new Hono()`
3. **Template Helpers** - `navBar()`, `visualFoundation()`
4. **Routes** - GET/POST/PUT/DELETE handlers
5. **Export** - `{ port, fetch }` for Bun

### Service Files Pattern
Each feature gets one service file (suffix):
- `services/products.service.ts` - Product business logic
- `services/vouchers.service.ts` - Voucher business logic
- `services/changeLogs.service.ts` - Changelog business logic

**Service responsibilities:**
- Export type definitions (from schema)
- Export Zod validation schemas
- Export business logic functions
- Import from `db/` layer for data access
- Import from `domain/` for utilities

### Database Files Pattern
One file per table/feature (suffix):
- `db/schema.db.ts` - All table definitions
- `db/connection.db.ts` - Database client setup
- `db/products.db.ts` - Product queries
- `db/vouchers.db.ts` - Voucher queries
- `db/changeLogs.db.ts` - Changelog queries

---

## Common Patterns

### Adding a New Route
1. Add route handler in `index.routes.ts`
2. Call service layer function
3. Return HTTP response

```typescript
app.get('/new-feature', async (c) => {
  const data = await getNewFeature()
  return c.json(data)
})
```

### Adding New Business Logic
1. Create/update service file in `services/`
2. Define Zod schema for validation
3. Implement business logic function
4. Call database layer for data access
5. Export function for routes to use

```typescript
// services/feature.service.ts
import { z } from 'zod'
import { getFeatures, insertFeature } from '../db/feature.db'

const FeatureSchema = z.object({ name: z.string() })

export async function createFeature(data: unknown) {
  const validated = FeatureSchema.parse(data)
  return await insertFeature(validated)
}
```

### Adding Database Queries
1. Define schema in `db/schema.db.ts`
2. Create query file `db/feature.db.ts`
3. Export query functions
4. Use Drizzle query builder (type-safe)

```typescript
// db/feature.db.ts
import { db } from './connection.db'
import { features } from './schema.db'
import { eq } from 'drizzle-orm'

export async function getFeatureById(id: number) {
  return await db.select().from(features).where(eq(features.id, id))
}
```

---

## Type Flow

```
Schema (db/schema.db.ts)
  -> Types (typeof table.$inferSelect)
    -> Service exports
      -> Route Handlers (index.routes.ts)
        -> Client (frontend)
```

**Never define types manually** - always infer from schema:
```typescript
// Good
export type Product = typeof products.$inferSelect

// Bad
export interface Product { id: number, name: string }
```

---

## Request Flow

```
HTTP Request
  -> Route Handler (index.routes.ts)
  -> Service Layer (services/)
       -> Zod Validation
       -> Business Logic
       -> DB Layer (db/)
            -> Database Query
  -> Response to Client
```

---

## Key Files

| File | Purpose |
|------|---------|
| `index.routes.ts` | Routes, HTTP handlers, HTML templates |
| `services/products.service.ts` | Product business logic |
| `services/vouchers.service.ts` | Voucher business logic |
| `services/changeLogs.service.ts` | Changelog business logic |
| `db/schema.db.ts` | Database table definitions |
| `db/connection.db.ts` | SQLite connection setup |
| `domain/formatters.domain.ts` | Money/date formatting utilities |

---

## Working in This Directory

### To add a new feature:
1. Define table in `db/schema.db.ts`
2. Generate migration: `bun run db:generate`
3. Create `db/<feature>.db.ts` for queries
4. Create `services/<feature>.service.ts` for business logic
5. Add routes in `index.routes.ts`

### To modify existing feature:
1. Find service file in `services/`
2. Update business logic
3. Update database queries in `db/` if needed
4. Update routes in `index.routes.ts` if needed

### To debug:
1. Check types first - TypeScript will catch most errors
2. Use `console.log()` in service layer
3. Enable Drizzle query logging in `db/connection.db.ts`
4. Inspect database with `bun run db:studio`

---

## Rules

### Do This
- Keep routes thin - delegate to services
- Put business logic in service layer
- Use Zod validation for all external inputs
- Let Drizzle infer types from schema
- Use transactions for multi-step operations
- Import utilities from `domain/` layer

### Avoid This
- Don't put business logic in route handlers
- Don't put business logic in database layer
- Don't skip validation on external inputs
- Don't define types manually (use schema inference)
- Don't use `any` type
- Don't access database directly from routes

---

## Navigation
- **Parent:** [Root AGENTS.md](../AGENTS.md)
- **Database Layer:** [db/AGENTS.md](db/AGENTS.md)
- **Service Layer:** [services/AGENTS.md](services/AGENTS.md)
- **Domain Layer:** [domain/AGENTS.md](domain/AGENTS.md)
