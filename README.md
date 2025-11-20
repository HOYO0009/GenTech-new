# GenTech E-Commerce Management

> **Super lightweight SQLite-based backend** for inventory, finance, and e-commerce management
> Built with **Bun + Hono + Drizzle ORM** for vibe coding with accuracy

---

## 🎯 Tech Stack

### 🖥️ Backend
- **Runtime:** Bun (fast, TypeScript-native)
- **Framework:** Hono (lightweight, edge-ready)
- **Database:** SQLite via Drizzle ORM
- **Validation:** Zod (runtime type safety)
- **Language:** TypeScript (strict mode)

---

### 🎨 Frontend (Ultra-Minimal)

- **HTMX + Alpine.js + Tailwind CSS**
- Visual identity
  - Typography
    - Use the `Space Grotesk` / `Inter` type stack for all text.
    - Microcopy (labels, buttons, small UI text) should be uppercase or small-caps for consistency.
  - Color palette
    - **Primary accent (red)**: `#b41f26` (default) → `#ff2b2b` (hover).
    - **Surfaces**: charcoal-like dark tones; primary panel background `rgba(15,15,15,0.85)`.
    - **Text**: white or cream; maintain strong contrast—minimum **3:1** for UI elements.
    - **Borders & highlights**: light, high-visibility strokes to support clarity on dark panels.
  - Spacing system
    - **Panels**: 1.5rem internal padding.
    - **Section layouts**: 2rem between major blocks.
    - **Form controls**: 0.5rem between inputs, labels, and helper text.
    - Maintain these ratios across new UI to prevent spacing drift.
  - Components
    - **Panels**: dark, semi-opaque backgrounds with subtle borders and consistent corner radii.
    - **Buttons**: compact uppercase labels, `letter-spacing: 0.3em`, pill-shaped radius for primary/secondary actions, using the shared red accent (`#b41f26` → `#ff2b2b` hover) with at least **3:1** contrast.
    - **Inputs & forms**: controls must stand out from their container with sufficient contrast; labels, hints, and inline validation stay in small-caps.
  - Consistency rules
    - When adding new components, adhere to the established palette—charcoal backgrounds, white/cream text, red accent, and clear contrast borders.
    - Avoid off-palette colors or spacing unless a component explicitly requires variation.
    - Typography, spacing, and color decisions should reinforce the same visual rhythm already established in the core UI.
    - Font size must always follow text hierarchy for consistency between different pages.
  -- Text hierarchy
    - **Headings**
      - **Display / Hero**: `Space Grotesk`, **2rem**, weight 600 — rare use; landing sections or top-level titles.
      - **H1 (page title)**: `Space Grotesk`, **1.6rem**, weight 600 — main page titles; crisp, not oversized.
      - **H2 (section header)**: `Space Grotesk`, **1.3rem**, weight 600 — section headers.
      - **H3 (sub-section)**: `Space Grotesk` / `Inter`, **1.15rem**, weight 500–600 — subsection headers and card titles.
      - **H4 (minor heading)**: `Space Grotesk` / `Inter`, **1.05rem**, weight 500 — minor headings; optional uppercase if needed.
    - **Body & content**
      - **Body (default)**: `Inter`, **0.95rem**, weight 400 — primary reading size; balanced on dark backgrounds.
      - **Body small**: `Inter`, **0.9rem**, weight 400 — secondary text, muted descriptions.
      - **Lead / intro**: `Inter`, **1.05rem**, weight 400 — slightly elevated for short intros or key statements.
    - **UI text**
      - **Button text**: `Space Grotesk`, **0.85rem**, weight 600 — always uppercase, `letter-spacing: 0.3em`.
      - **Label / microcopy**: `Inter`, **0.8rem**, weight 500 — uppercase or small-caps; consistent across forms.
      - **Tooltip / caption**: `Inter`, **0.75rem**, weight 400–500 — minimal but still readable on dark UI.
      - **Badge / tag**: `Space Grotesk`, **0.7rem**, weight 600 — high-contrast background recommended.
---

## General Coding Principles

### 1. SOLID: A set of five principles for object-oriented design:
- **Single Responsibility Principle**: A module, class, or function should have one reason to change. Keep responsibilities focused and avoid mixing unrelated tasks.
- **Open/Closed Principle**: Code should be open for extension but closed for modification. You should be able to add new features without altering existing, stable code.
- **Liskov Substitution Principle**: Subtypes should be usable anywhere their base type is expected, without altering the correctness of the program.
- **Interface Segregation Principle**: Prefer small, specific interfaces over large, general ones. Don’t force code to depend on methods it doesn’t need.
- **Dependency Inversion Principle**: High-level modules should depend on abstractions rather than concrete implementations. This makes systems more flexible and testable.

### 2. DRY (Don't Repeat Yourself):  
Avoid duplicating the same logic in multiple places. Centralize shared behavior so changes only need to be made once.

### 3. KISS (Keep It Simple, Stupid):  
Favor simple, clear solutions over complex or overly clever implementations. Simple code is easier to maintain, debug, and understand.

### 4. YAGNI (You Ain't Gonna Need It):  
Don’t implement features or abstractions until they are actually needed. Avoid over-engineering based on guesses about future requirements.

### 5. Schema-Driven Data
- Keep canonical lists (e.g., product statuses, tiers, or payment types) in the schema, seed them through migrations, and read them through queries so the drift between Drizzle, migrations, and the UI never happens. Let the database own the shape of shared reference data instead of duplicating it in code.

---

## ✨ Vibe Coding Principles

### 1. **Type Safety is Non-Negotiable**
- Let the compiler catch errors, not your users
- If TypeScript complains, fix it - don't use `any` or `@ts-ignore`
- Trust the types, they're your safety net

### 2. **Schema is Single Source of Truth**
- Database schema defines your types
- No manual type definitions that drift from reality
- Drizzle infers types automatically

### 3. **Fail Fast, Fail Loud**
- Validate at boundaries (API inputs, external data)
- Use Zod to parse, not just validate
- Let errors bubble - don't swallow them silently

### 4. **Money is Sacred**
- **ALWAYS** store currency as integers (cents)
- Never use floats for money calculations
- Use transactions for financial operations
> All money columns (products, pricing, purchases, finance entries, vouchers, etc.) persist cents so the schema and ORM types stay consistent.

### 5. **Transactions for Consistency**
- Multiple related changes = one transaction
- Inventory + payment = atomic operation
- If one fails, all fail

---

## Architecture Layers

- **Controllers (`src/controllers/*`)** register the Hono routes, parse/validate requests, and delegate to services before handing payloads to the renderers.
- **UI layer (`src/ui/*`)** builds the shared layout/nav and each page fragment (home, products, vouchers, changes) so controllers can render structured HTML.
- **Service layer (`src/services/*`)** contains business logic, DTO shaping, validation flows, and change-log coordination; controllers call into it keeping routes thin.
- **Domain helpers (`src/domain/*`)** package reusable formatting, sanitization, and transformation utilities (e.g., `formatters.ts`) that both services and controllers can rely on.
- **Persistence (`src/db/*`)** owns the Drizzle schema, connection, and repository functions that the services consume for every read/write.

## 🏗️ Code Patterns (Do This)

### ✅ Schema Definition
```typescript
// src/db/schema.ts
import { sqliteTable, integer, text } from 'drizzle-orm/sqlite-core'

export const products = sqliteTable('products', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  sku: text('sku').notNull().unique(),
  price: integer('price').notNull(), // Store in cents!
  stock: integer('stock').notNull().default(0),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
})

// Types are automatically inferred
export type Product = typeof products.$inferSelect
export type NewProduct = typeof products.$inferInsert
```

### ✅ Validation with Zod
```typescript
// src/validators/product.ts
import { z } from 'zod'

export const CreateProductSchema = z.object({
  name: z.string().min(1, 'Name required').max(255),
  sku: z.string().regex(/^[A-Z0-9-]+$/, 'Invalid SKU format'),
  price: z.number().int().positive('Price must be positive'),
  stock: z.number().int().nonnegative('Stock cannot be negative'),
})

// In your route
const validated = CreateProductSchema.parse(await c.req.json())
// Now you KNOW it's valid
```

### ✅ Atomic Transactions
```typescript
// src/services/order.ts
import { db } from './db'

export async function processOrder(orderId: number, items: OrderItem[]) {
  return db.transaction((tx) => {
    // Deduct inventory
    for (const item of items) {
      tx.update(products)
        .set({ stock: sql`stock - ${item.quantity}` })
        .where(eq(products.id, item.productId))
        .run()
    }

    // Record payment
    tx.insert(payments).values({
      orderId,
      amount: calculateTotal(items),
      status: 'completed',
    }).run()

    // Update order status
    tx.update(orders)
      .set({ status: 'fulfilled' })
      .where(eq(orders.id, orderId))
      .run()
  })
  // All succeed or all fail - no partial updates!
}
```

### ✅ Error Handling
```typescript
// Let Hono handle it gracefully
app.post('/products', async (c) => {
  try {
    const body = await c.req.json()
    const validated = CreateProductSchema.parse(body)
    const product = await db.insert(products).values(validated).returning()
    return c.json(product, 201)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json({ error: 'Validation failed', details: error.errors }, 400)
    }
    throw error // Let global error handler deal with it
  }
})
```

### ✅ Money Formatting
```typescript
// src/utils/money.ts
export function toCents(dollars: number): number {
  return Math.round(dollars * 100)
}

export function toDollars(cents: number): string {
  return (cents / 100).toFixed(2)
}

export function formatMoney(cents: number): string {
  return `$${toDollars(cents)}`
}

// Usage
const price = toCents(19.99) // Store as 1999
console.log(formatMoney(price)) // Display as "$19.99"
```

### ✅ Query Builders Over Raw SQL
```typescript
// Good: Type-safe, composable
const activeProducts = await db
  .select()
  .from(products)
  .where(gt(products.stock, 0))
  .orderBy(desc(products.createdAt))
  .limit(10)

// Avoid: Raw SQL loses type safety
const rawQuery = db.all('SELECT * FROM products WHERE stock > 0')
```

---

## 🚫 Anti-Patterns (Avoid These)

### ❌ Using `any` Type
```typescript
// BAD - defeats the purpose of TypeScript
function updateProduct(data: any) {
  return db.update(products).set(data)
}

// GOOD - explicit types
function updateProduct(data: Partial<Product>) {
  return db.update(products).set(data)
}
```

### ❌ Floats for Money
```typescript
// BAD - floating point errors
const price = 19.99
const total = price * 3 // 59.97000000000001

// GOOD - integer arithmetic
const price = 1999 // cents
const total = price * 3 // 5997 cents
```

### ❌ No Validation at Boundaries
```typescript
// BAD - trusting external input
app.post('/products', async (c) => {
  const data = await c.req.json()
  await db.insert(products).values(data) // YOLO
})

// GOOD - validate everything
app.post('/products', async (c) => {
  const data = await c.req.json()
  const validated = CreateProductSchema.parse(data)
  await db.insert(products).values(validated)
})
```

### ❌ Non-Atomic Multi-Step Operations
```typescript
// BAD - race conditions and partial failures
async function transferInventory(fromId: number, toId: number, qty: number) {
  await db.update(warehouses)
    .set({ stock: sql`stock - ${qty}` })
    .where(eq(warehouses.id, fromId))

  // What if this fails? First update already happened!
  await db.update(warehouses)
    .set({ stock: sql`stock + ${qty}` })
    .where(eq(warehouses.id, toId))
}

// GOOD - atomic transaction
async function transferInventory(fromId: number, toId: number, qty: number) {
  return db.transaction((tx) => {
    tx.update(warehouses)
      .set({ stock: sql`stock - ${qty}` })
      .where(eq(warehouses.id, fromId))
      .run()

    tx.update(warehouses)
      .set({ stock: sql`stock + ${qty}` })
      .where(eq(warehouses.id, toId))
      .run()
  })
}
```

### ❌ Ignoring TypeScript Errors
```typescript
// BAD - hiding problems
// @ts-ignore
const product = await getProduct(undefined)

// GOOD - fix the root cause
const productId = await getValidatedProductId()
const product = await getProduct(productId)
```

### ❌ Manual Type Definitions
```typescript
// BAD - types drift from schema
interface Product {
  id: number
  name: string
  price: number
  // Forgot to update when schema changed!
}

// GOOD - inferred from schema
import { products } from './schema'
type Product = typeof products.$inferSelect
// Always in sync!
```

### ❌ Silent Failures
```typescript
// BAD - swallowing errors
try {
  await processPayment()
} catch {
  // Hope it works next time lol
}

// GOOD - handle or propagate
try {
  await processPayment()
} catch (error) {
  logger.error('Payment failed', { error })
  throw new PaymentError('Payment processing failed')
}
```

### ❌ Mixing Business Logic in Routes
```typescript
// BAD - fat routes
app.post('/orders', async (c) => {
  const data = await c.req.json()
  // 100 lines of business logic here...
  return c.json(result)
})

// GOOD - thin routes, fat services
app.post('/orders', async (c) => {
  const data = CreateOrderSchema.parse(await c.req.json())
  const order = await orderService.create(data)
  return c.json(order, 201)
})
```

---

## 🔧 Development Commands

```bash
# Install dependencies
bun install

# Run development server
bun run dev

# Generate migrations
bun run db:generate

# Run migrations
bun run db:migrate

# Open Drizzle Studio (visual DB inspector)
bun run db:studio

# Run tests
bun test

# Type check
bun run typecheck
```

---

## 🚀 Quick Start

```typescript
// src/controllers/index.ts
import { Hono } from 'hono'
import { db } from './db'
import { products } from './db/schema'

const app = new Hono()

app.get('/products', async (c) => {
  const allProducts = await db.select().from(products)
  return c.json(allProducts)
})

export default {
  port: 3000,
  fetch: app.fetch,
}
```

Run with: `bun run src/controllers/index.ts`

---

## 📚 Resources

- [Bun Docs](https://bun.sh/docs)
- [Hono Docs](https://hono.dev)
- [Drizzle ORM](https://orm.drizzle.team)
- [Zod](https://zod.dev)

---

**Remember: Fast code is useless if it's wrong. Type safety + validation = vibe coding with confidence.** 🎯
