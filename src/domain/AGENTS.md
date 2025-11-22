# Domain Layer (`src/domain/`)

> Pure utility functions - formatters, helpers, and shared domain logic

---

## Files in This Directory (suffix naming)

```
domain/
- formatters.domain.ts   # Money, timestamp, HTML, and JSON formatting utilities
- strategies/            # Filtering/sorting strategies (camelCase filenames)
```

**Naming convention:** `<feature>.domain.ts` for shared utilities. Strategies inside `strategies/` use camelCase filenames (e.g. `voucherSort.strategy.ts`, `filterStrategy.interface.ts`) with PascalCase classes.

---

## Responsibilities

### Do This Layer Handles:
- Pure utility functions (no side effects)
- Money formatting (cents to display)
- Date/time formatting
- HTML escaping for XSS prevention
- JSON pretty-printing
- Shared domain logic

### Avoid This Layer Does NOT Handle:
- Database access (that's in `db/`)
- Business logic (that's in `services/`)
- HTTP requests/responses (that's in `index.routes.ts`)
- External API calls
- State management

---

## Formatters

### Money Formatting

#### `formatMoney(amount: number | null): string`
**Purpose:** Convert integer cents to formatted dollar string

**Usage:**
```typescript
import { formatMoney } from './formatters.domain'

formatMoney(1999)    // "$19.99"
formatMoney(5000)    // "$50.00"
formatMoney(0)       // "$0.00"
formatMoney(null)    // "N/A"
formatMoney(NaN)     // "N/A"
```

**Key behaviors:**
- Converts cents to dollars (divides by 100)
- Always shows 2 decimal places
- Handles null gracefully (returns "N/A")
- Handles NaN gracefully (returns "N/A")

**When to use:**
- Displaying prices in UI
- Showing costs in tables
- Formatting invoice totals
- Any money value for human consumption

**When NOT to use:**
- Storing values in database (store raw cents)
- Calculations (use raw integers)
- API responses (send raw cents, let client format)

---

### Timestamp Formatting

#### `formatTimestamp(value: Date | number | null): string`
**Purpose:** Convert Date object or timestamp to readable string

**Usage:**
```typescript
import { formatTimestamp } from './formatters.domain'

const date = new Date('2025-01-15T14:30:00')
formatTimestamp(date)           // "Jan 15, 2025, 2:30 PM"
formatTimestamp(1705330200000)  // "Jan 15, 2025, 2:30 PM"
formatTimestamp(null)           // "Unknown time"
```

**Key behaviors:**
- Accepts Date object or Unix timestamp
- Formats as "Month Day, Year, Hour:Minute AM/PM"
- Uses en-US locale
- Returns "Unknown time" for null/undefined

---

### HTML Escaping

#### `escapeHtml(value: string): string`
**Purpose:** Escape HTML special characters to prevent XSS attacks

**Usage:**
```typescript
import { escapeHtml } from './formatters.domain'

escapeHtml('<script>alert("xss")</script>')
// "&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;"

escapeHtml('User & Co.')
// "User &amp; Co."

escapeHtml("It\'s a test")
// "It&#39;s a test"
```

**Escapes:**
- `&` -> `&amp;`
- `<` -> `&lt;`
- `>` -> `&gt;`
- `"` -> `&quot;`
- `'` -> `&#39;`

**Critical for security:** Always escape user input before rendering in HTML!

---

### JSON Pretty-Printing

#### `prettyPayload(payload: string | null): string | null`
**Purpose:** Format JSON string with indentation for readability

**Usage:**
```typescript
import { prettyPayload } from './formatters.domain'

const json = '{"name":"Product","price":1999}'
prettyPayload(json)
// {
//   "name": "Product",
//   "price": 1999
// }

prettyPayload('invalid json')  // "invalid json" (returns as-is)
prettyPayload(null)            // null
```

**Key behaviors:**
- Parses JSON string
- Formats with 2-space indentation
- Returns original string if parse fails
- Returns null for null input

---

## Adding New Utilities

### Guidelines for Domain Functions

**Do:**
- Keep functions pure (same input -> same output)
- No side effects (no database, no HTTP, no global state)
- Handle null/undefined gracefully
- Return consistent types
- Add TypeScript type annotations
- Export functions for reuse

**Example:**
```typescript
// formatters.domain.ts

export function toCents(dollars: number): number {
  return Math.round(dollars * 100)
}

export function capitalizeFirst(text: string): string {
  if (!text) return ''
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase()
}

export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength - 3) + '...'
}
```

---

## Common Use Cases

### In Service Layer
```typescript
// services/products.service.ts
import { formatMoney, escapeHtml, formatTimestamp } from '../domain/formatters.domain'

export async function getProductPagePayload() {
  const products = await listProducts()

  return products.map(p => ({
    sku: p.sku,
    name: escapeHtml(p.name),
    costDisplay: formatMoney(p.cost),
    updatedAt: formatTimestamp(p.updatedAt)
  }))
}
```

### In Route Handlers
```typescript
// index.routes.ts
import { formatMoney, escapeHtml } from './domain/formatters.domain'

app.get('/products/:id', async (c) => {
  const product = await getProduct(id)

  return c.html(`
    <h1>${escapeHtml(product.name)}</h1>
    <p>Price: ${formatMoney(product.price)}</p>
  `)
})
```

### In Templates
```typescript
const productCard = (p: ProductCard) => `
  <div class="product">
    <h3>${escapeHtml(p.name)}</h3>
    <p class="price">${formatMoney(p.priceCents)}</p>
    <p class="updated">${formatTimestamp(p.updatedAt)}</p>
  </div>
`
```

---

## Testing Utilities

### Example Tests
```typescript
import { describe, it, expect } from 'bun:test'
import { formatMoney, escapeHtml, formatTimestamp } from './formatters.domain'

describe('formatMoney', () => {
  it('formats cents to dollars', () => {
    expect(formatMoney(1999)).toBe('$19.99')
  })

  it('handles null', () => {
    expect(formatMoney(null)).toBe('N/A')
  })
})

describe('escapeHtml', () => {
  it('escapes special chars', () => {
    expect(escapeHtml('<script>')).toBe('&lt;script&gt;')
  })
})
```

---

## Money Helpers (Suggested)

If you need to convert user input to cents, add this:

```typescript
// formatters.domain.ts

/**
 * Convert dollars (float) to cents (integer)
 * @example toCents(19.99) // 1999
 */
export function toCents(dollars: number): number {
  if (dollars === null || Number.isNaN(dollars)) return 0
  return Math.round(dollars * 100)
}

/**
 * Convert cents (integer) to dollars (float)
 * @example toDollars(1999) // 19.99
 */
export function toDollars(cents: number): number {
  if (cents === null || Number.isNaN(cents)) return 0
  return cents / 100
}
```

**Usage:**
```typescript
const userInput = 19.99
const cents = toCents(userInput)  // 1999
await saveProduct({ price: cents })

const product = await getProduct(id)  // { price: 1999 }
const display = formatMoney(product.price)  // "$19.99"
```

---

## Working in This Directory

### To add a new utility:
1. Open `formatters.domain.ts`
2. Add pure function with TypeScript types
3. Handle null/undefined gracefully
4. Export function
5. Write tests in `formatters.domain.test.ts`
6. Use in service layer or routes

### To modify existing utility:
1. Update function in `formatters.domain.ts`
2. Check all usages (search codebase)
3. Update tests if behavior changes
4. Verify all callers still work

---

## Rules

### Do This
- Keep functions pure (no side effects)
- Handle null/undefined gracefully
- Add TypeScript type annotations
- Export all utilities
- Write tests for utilities
- Use descriptive function names
- Add JSDoc comments for complex functions

### Avoid This
- Don't access database from utilities
- Don't make HTTP requests from utilities
- Don't use global state
- Don't add business logic here
- Don't use `any` type
- Don't throw errors for expected cases (return defaults)

---

## Navigation
- **Parent:** [src/AGENTS.md](../AGENTS.md)
- **Root:** [Project AGENTS.md](../../AGENTS.md)
