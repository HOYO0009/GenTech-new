# Database Layer (`src/db/`)

> Data access layer - schema definitions, database connection, and query functions

---

## Files in This Directory (suffix naming)

```
db/
- schema.db.ts       # All table definitions (single source of truth)
- connection.db.ts   # SQLite database client setup
- products.db.ts     # Product-related queries
- vouchers.db.ts     # Voucher-related queries
- changeLogs.db.ts   # Changelog queries
```

**Naming convention:** `<feature>.db.ts` for query modules, `schema.db.ts` for definitions, `connection.db.ts` for DB client.

---

## Responsibilities

### Do This Layer Handles:
- Table schema definitions (Drizzle ORM)
- Database connection setup
- Low-level query functions
- Type inference from schema
- Data persistence

### Avoid This Layer Does NOT Handle:
- Business logic (that's in `services/`)
- Input validation (that's in `services/`)
- HTTP requests/responses (that's in `index.routes.ts`)
- Formatting/utilities (that's in `domain/`)

---

## Schema Patterns

### Table Definition
```typescript
// schema.db.ts
import { sqliteTable, integer, text } from 'drizzle-orm/sqlite-core'

export const tableName = sqliteTable('table_name', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .$defaultFn(() => new Date()),
})
```

### Type Inference
```typescript
// schema.db.ts - ALWAYS export types from schema
export type TableName = typeof tableName.$inferSelect
export type NewTableName = typeof tableName.$inferInsert
```

**Never define types manually** - always infer:
```typescript
// Good
export type Product = typeof products.$inferSelect

// Bad - will drift from schema
interface Product { id: number, name: string }
```

### Money Columns
**ALWAYS use integers for money** (store cents, not dollars):
```typescript
// Good - integer for cents
cost: integer('cost')

// Bad - floats cause rounding errors
price: real('price')
```

### Foreign Keys
```typescript
// Reference another table
supplierId: integer('supplier_id')
  .references(() => suppliers.id)

// Self-referencing (like categories with parent)
parentId: integer('parent_id')
  .references(() => table.id)
```

### Timestamps
```typescript
// Auto-generate timestamps
createdAt: integer('created_at', { mode: 'timestamp' })
  .$defaultFn(() => new Date())

updatedAt: integer('updated_at', { mode: 'timestamp' })
  .$defaultFn(() => new Date())
```

---

## Query File Patterns

Each feature gets a query file:
- `products.db.ts` - Product queries
- `vouchers.db.ts` - Voucher queries
- `changeLogs.db.ts` - Changelog queries

### Query Function Structure
```typescript
// db/products.db.ts
import { db } from './connection.db'
import { products } from './schema.db'
import { eq } from 'drizzle-orm'

// Simple select
export async function getProductById(id: number) {
  return await db
    .select()
    .from(products)
    .where(eq(products.id, id))
}

// Insert
export async function insertProduct(data: NewProduct) {
  return await db
    .insert(products)
    .values(data)
    .returning()
}

// Update
export async function updateProduct(id: number, data: Partial<Product>) {
  return await db
    .update(products)
    .set(data)
    .where(eq(products.id, id))
    .returning()
}

// Delete
export async function deleteProduct(id: number) {
  return await db
    .delete(products)
    .where(eq(products.id, id))
}
```

---

## Database Connection

### Setup (`connection.db.ts`)
```typescript
import { drizzle } from 'drizzle-orm/bun-sqlite'
import { Database } from 'bun:sqlite'

const sqlite = new Database('gentech.sqlite')
export const db = drizzle(sqlite)
```

### Enable Query Logging (debugging)
```typescript
import { drizzle } from 'drizzle-orm/bun-sqlite'
import { Database } from 'bun:sqlite'

const sqlite = new Database('gentech.sqlite')
export const db = drizzle(sqlite, { logger: true })
// Now all SQL queries log to console
```

---

## Common Query Patterns

### Select with Conditions
```typescript
import { eq, gt, and, or } from 'drizzle-orm'

// Single condition
const active = await db
  .select()
  .from(products)
  .where(eq(products.statusId, 1))

// Multiple conditions (AND)
const expensive = await db
  .select()
  .from(products)
  .where(
    and(
      gt(products.cost, 10000), // > $100
      eq(products.statusId, 1)
    )
  )

// OR conditions
const filtered = await db
  .select()
  .from(products)
  .where(
    or(
      eq(products.statusId, 1),
      eq(products.statusId, 2)
    )
  )
```

### Ordering and Limiting
```typescript
import { desc, asc } from 'drizzle-orm'

const recent = await db
  .select()
  .from(products)
  .orderBy(desc(products.createdAt))
  .limit(10)
```

### Joins
```typescript
import { eq } from 'drizzle-orm'

const productsWithSupplier = await db
  .select()
  .from(products)
  .leftJoin(suppliers, eq(products.supplierId, suppliers.id))
```

### Transactions
```typescript
// Multiple operations - all succeed or all fail
await db.transaction(async (tx) => {
  await tx.insert(products).values(newProduct)
  await tx.update(inventory).set({ stock: 100 })
  await tx.insert(changeLogs).values(logEntry)
})
```

### Raw SQL (when needed)
```typescript
import { sql } from 'drizzle-orm'

// Use sparingly - loses type safety
const result = await db.execute(
  sql`SELECT COUNT(*) FROM products WHERE status_id = ${statusId}`
)
```

---

## Schema Management

### Adding a New Table
1. Define table in `schema.db.ts`
2. Export types from schema
3. Generate migration: `bun run db:generate`
4. Review migration in `drizzle/` folder
5. Apply migration: `bun run db:migrate`
6. Create query file `db/<table>.db.ts`

### Modifying Existing Table
1. Update table definition in `schema.db.ts`
2. Generate migration: `bun run db:generate`
3. Review migration carefully
4. Apply migration: `bun run db:migrate`
5. Update query functions if needed

### Seeding Reference Data
Use migrations to seed lookup tables:
```sql
-- migrations/0001_seed_statuses.sql
INSERT INTO product_statuses (name) VALUES
  ('active'),
  ('discontinued'),
  ('out-of-stock');
```

---

## Tables in Schema

| Table | Purpose |
|-------|---------|
| `products` | Product catalog (SKU, name, cost, supplier) |
| `product_statuses` | Product status lookup (active, discontinued, etc.) |
| `suppliers` | Supplier directory |
| `categories` | Product category hierarchy |
| `listings` | Marketplace listings |
| `shops` | Shop/platform definitions (Shopee, Lazada, etc.) |
| `listing_shops` | Listing metadata per shop |
| `product_pricing` | Pricing strategy per product per shop |
| `vouchers` | Discount vouchers |
| `voucher_discount_types` | Voucher type lookup (percentage, fixed) |
| `voucher_types` | Voucher category lookup |
| `change_logs` | Audit trail for data changes |

---

## Key Relationships

```
products
  -> product_statuses (status)
  -> suppliers (supplier)
  -> categories (category, subcategory)

product_pricing
  -> products (product_sku)
  -> shops (shop)

vouchers
  -> shops (shop)
  -> voucher_discount_types (type)
  -> voucher_types (category)

listing_shops
  -> listings (listing)
  -> shops (shop)
```

---

## Working in This Directory

### To add a new query:
1. Find the appropriate file (e.g., `products.db.ts`)
2. Write function using Drizzle query builder
3. Export function
4. Import in service layer

### To add a new table:
1. Define in `schema.db.ts`
2. Export types
3. Generate migration
4. Apply migration
5. Create query file

### To debug queries:
1. Enable logger in `connection.db.ts`
2. Check SQL output in console
3. Use Drizzle Studio: `bun run db:studio`
4. Verify data at http://localhost:4983

---

## Rules

### Do This
- Define all tables in `schema.db.ts`
- Export types using `$inferSelect` and `$inferInsert`
- Use Drizzle query builder (type-safe)
- Store money as integers (cents)
- Use timestamps for `createdAt`/`updatedAt`
- Use transactions for multi-step operations
- Keep queries simple and focused

### Avoid This
- Don't put business logic here (use `services/`)
- Don't validate inputs here (use Zod in `services/`)
- Don't use `real` type for money (use `integer`)
- Don't define types manually (infer from schema)
- Don't skip migrations (always generate and apply)
- Don't use `any` type

---

## Migration Workflow

```bash
# 1. Update schema in schema.db.ts
# 2. Generate migration
bun run db:generate

# 3. Review migration file in drizzle/ folder
cat drizzle/0001_migration_name.sql

# 4. Apply migration
bun run db:migrate

# 5. Verify with Drizzle Studio
bun run db:studio
```

---

## Navigation
- **Parent:** [src/AGENTS.md](../AGENTS.md)
- **Root:** [Project AGENTS.md](../../AGENTS.md)
