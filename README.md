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

---

## General Coding Principles

### 1. SOLID: A set of five principles for object-oriented design:
- Single Responsibility Principle
- Open/Closed Principle
- Liskov Substitution Principle
- Interface Segregation Principle
- Dependency Inversion Principle
### 2. DRY (Don't Repeat Yourself): Avoid duplicating the same code in multiple places.
### 3. KISS (Keep It Simple, Stupid): Write the simplest code possible, avoiding unnecessary complexity.
### 4. YAGNI (You Ain't Gonna Need It): Don't add functionality until it is actually required. 

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

### 5. **Transactions for Consistency**
- Multiple related changes = one transaction
- Inventory + payment = atomic operation
- If one fails, all fail

---

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

## 📁 Project Structure

```
src/
├── db/
│   ├── schema.ts          # All table definitions
│   ├── index.ts           # Database client
│   └── migrations/        # Schema versioning
├── services/
│   ├── products.ts        # Business logic
│   ├── orders.ts
│   └── inventory.ts
├── validators/
│   ├── product.ts         # Zod schemas
│   └── order.ts
├── routes/
│   ├── products.ts        # Thin route handlers
│   └── orders.ts
├── utils/
│   ├── money.ts           # Currency helpers
│   └── errors.ts          # Custom error classes
└── index.ts               # App entry point
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

## 🎨 Vibe Coding Mantras

1. **"If it compiles, it probably works"** - Trust your types
2. **"Validate early, execute confidently"** - Zod at boundaries
3. **"Cents, not dollars"** - Integer arithmetic for money
4. **"Transaction or bust"** - Atomic operations for consistency
5. **"Schema = Truth"** - Database defines reality
6. **"Fail fast, fix faster"** - Don't hide errors
7. **"Type inference > Manual types"** - Let the compiler work
8. **"Context is cheap, bugs are expensive"** - Explicit over clever

---

## 🚀 Quick Start

```typescript
// src/index.ts
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

Run with: `bun run src/index.ts`

---

## 📚 Resources

- [Bun Docs](https://bun.sh/docs)
- [Hono Docs](https://hono.dev)
- [Drizzle ORM](https://orm.drizzle.team)
- [Zod](https://zod.dev)

---

**Remember: Fast code is useless if it's wrong. Type safety + validation = vibe coding with confidence.** 🎯
