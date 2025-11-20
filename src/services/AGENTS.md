# Service Layer (`src/services/`)

> Business logic layer - orchestrates database operations, validates inputs, and prepares data for views

---

## Files in This Directory

```
services/
├── products.ts     # Product business logic (create, update, list)
├── vouchers.ts     # Voucher business logic (create, update, delete, list)
└── changeLogs.ts   # Changelog recording and retrieval
```

---

## Responsibilities

### ✅ This layer handles:
- Business logic and domain rules
- Input validation with Zod
- Coordinating database operations
- Transforming data for views (payloads)
- Calling database layer for data access
- Using domain utilities (formatters)
- Recording audit logs

### ❌ This layer does NOT handle:
- HTTP requests/responses (that's in `index.ts`)
- Direct database access (use `db/` layer functions)
- HTML rendering (that's in `index.ts`)
- Raw formatting (use `domain/` utilities)

---

## Service File Pattern

Each service file handles one feature area:

### Structure
```typescript
// services/feature.ts

// 1. Imports
import { db } from '../db/connection'
import { formatMoney } from '../domain/formatters'
import { getFeatures, insertFeature } from '../db/feature'

// 2. Type definitions (payload types for views)
export interface FeatureCard {
  id: number
  name: string
  formattedValue: string
}

export interface FeaturePagePayload {
  features: FeatureCard[]
  options: SelectOption[]
}

// 3. Business logic functions
export async function getFeaturePagePayload(): Promise<FeaturePagePayload> {
  const features = await getFeatures()
  const cards = features.map(f => ({
    id: f.id,
    name: f.name,
    formattedValue: formatMoney(f.valueCents)
  }))

  return { features: cards, options: [] }
}

export async function createFeature(data: NewFeatureInput) {
  // Validate, transform, insert
  const result = await insertFeature(data)
  return result
}
```

---

## Common Patterns

### Payload Pattern
**Purpose:** Prepare data for route handlers/views

```typescript
// Define payload interface
export interface ProductPagePayload {
  products: ProductCard[]
  statuses: ProductStatusOption[]
  suppliers: SupplierOption[]
}

// Fetch data and transform
export async function getProductPagePayload(): Promise<ProductPagePayload> {
  const rawProducts = await listProducts()
  const statuses = await listProductStatuses()
  const suppliers = await listSuppliers()

  // Transform for view
  const products = rawProducts.map(p => ({
    sku: p.sku,
    name: p.name,
    costDisplay: formatMoney(p.cost || 0),
    statusName: p.statusName,
    // ... more fields
  }))

  return { products, statuses, suppliers }
}
```

### Update Pattern
**Purpose:** Handle updates with validation and audit logging

```typescript
export async function updateProductDetails(args: ProductUpdateArgs) {
  // 1. Validate inputs (Zod if needed)

  // 2. Prepare data
  const updateData = {
    sku: args.sku,
    name: args.name,
    statusId: args.requestedStatusId,
    cost: args.costCents,
    // ... more fields
  }

  // 3. Update database
  await updateProduct(args.originalSku, updateData)

  // 4. Record audit log
  await recordChange({
    action: 'update',
    tableName: 'products',
    description: `Updated product ${args.sku}`,
    payload: JSON.stringify(updateData),
    source: 'product-service'
  })
}
```

### Create Pattern
**Purpose:** Create new records with validation

```typescript
export async function createVoucher(data: VoucherInput): Promise<VoucherCreateResult> {
  // 1. Validate (if needed)
  if (data.minSpend < 0) {
    throw new Error('Min spend cannot be negative')
  }

  // 2. Insert
  const voucher = await insertVoucher({
    shopId: data.shopId,
    minSpend: data.minSpend,
    discount: data.discount,
    voucherTypeId: data.voucherTypeId,
    voucherDiscountTypeId: data.voucherDiscountTypeId
  })

  // 3. Record log
  await recordChange({
    action: 'create',
    tableName: 'vouchers',
    description: `Created voucher for shop ${data.shopId}`,
    payload: JSON.stringify(voucher),
    source: 'voucher-service'
  })

  return { success: true, voucher }
}
```

### Delete Pattern
**Purpose:** Delete with audit trail

```typescript
export async function deleteVoucherRecord(voucherId: number) {
  // 1. Delete from database
  await deleteVoucher(voucherId)

  // 2. Record deletion
  await recordChange({
    action: 'delete',
    tableName: 'vouchers',
    description: `Deleted voucher ${voucherId}`,
    payload: JSON.stringify({ id: voucherId }),
    source: 'voucher-service'
  })
}
```

---

## Data Transformation

### Money Formatting
```typescript
import { formatMoney } from '../domain/formatters'

// Database stores cents (integer)
const product = await getProduct(id) // { cost: 1999 }

// Service transforms for display
const card = {
  costDisplay: formatMoney(product.cost) // "$19.99"
}
```

### Null Handling
```typescript
// Handle optional values gracefully
const card = {
  costDisplay: product.cost ? formatMoney(product.cost) : 'N/A',
  supplierName: product.supplierName || 'Unknown',
  hasSupplierLink: !!product.supplierLink
}
```

### Flattening Joins
```typescript
// Database returns nested structure
const rawProducts = await getProductsWithStatus()
// [{ id: 1, name: 'Product', status: { id: 1, name: 'active' } }]

// Service flattens for view
const products = rawProducts.map(p => ({
  id: p.id,
  name: p.name,
  statusId: p.status.id,
  statusName: p.status.name
}))
```

---

## Validation Patterns

### Using Zod
```typescript
import { z } from 'zod'

// Define schema
const CreateVoucherSchema = z.object({
  shopId: z.number().positive(),
  minSpend: z.number().nonnegative(),
  discount: z.number().positive(),
  voucherTypeId: z.number().positive()
})

// Validate in service
export async function createVoucher(data: unknown) {
  // Parse and validate
  const validated = CreateVoucherSchema.parse(data)

  // Now use validated data
  return await insertVoucher(validated)
}
```

### Manual Validation
```typescript
export async function updateProduct(data: ProductUpdateArgs) {
  // Business rules
  if (data.costCents && data.costCents < 0) {
    throw new Error('Cost cannot be negative')
  }

  if (data.sku.length === 0) {
    throw new Error('SKU is required')
  }

  // Proceed with update
  await updateProductInDb(data)
}
```

---

## Audit Logging

Use `recordChange()` from `changeLogs.ts`:

```typescript
import { recordChange } from './changeLogs'

// After create/update/delete
await recordChange({
  action: 'create' | 'update' | 'delete',
  tableName: 'table_name',
  description: 'Human-readable description',
  payload: JSON.stringify(data), // Optional
  source: 'service-name'
})
```

---

## Service Layer Files

### `products.ts`
**Handles:** Product catalog management

**Key functions:**
- `getProductPagePayload()` - Fetch and format products for display
- `updateProductDetails()` - Update product with validation and logging

**Exports:**
- `ProductCard` - Formatted product for display
- `ProductPagePayload` - Full payload for products page
- `ProductStatusOption` - Status dropdown options
- `SupplierOption` - Supplier dropdown options

### `vouchers.ts`
**Handles:** Voucher/discount management

**Key functions:**
- `getVouchersPagePayload()` - Fetch and format vouchers
- `createVoucher()` - Create new voucher with validation
- `updateVoucherDetails()` - Update voucher details
- `deleteVoucherRecord()` - Delete voucher with audit

**Exports:**
- `VoucherListItem` - Formatted voucher for display
- `VouchersPagePayload` - Full payload for vouchers page
- `VoucherCreateResult` - Result of voucher creation
- `discountLabelByType()` - Utility to format discount display

### `changeLogs.ts`
**Handles:** Audit trail recording and retrieval

**Key functions:**
- `recordChange()` - Insert audit log entry
- `listChangeEvents()` - Fetch recent changes for display

**Exports:**
- `ChangeLogEvent` - Formatted changelog event
- `recordChange()` - Log recording function
- `listChangeEvents()` - Retrieve logs

---

## Working in This Directory

### To add a new service function:
1. Import database layer functions
2. Import domain utilities (formatters)
3. Define payload interfaces if needed
4. Write business logic function
5. Call database layer for data access
6. Transform data using domain utilities
7. Record changes if modifying data
8. Export function and types

### To add input validation:
1. Install Zod if not available: `bun add zod`
2. Define Zod schema for inputs
3. Parse inputs with `Schema.parse(data)`
4. Use validated data in business logic

### To handle money values:
1. Receive cents (integer) from database
2. Use `formatMoney()` from `domain/formatters` for display
3. Use `toCents()` when converting user input (if needed)
4. Always return cents to database layer

### To debug:
1. Add `console.log()` in service functions
2. Check what database layer returns
3. Verify transformations are correct
4. Test with `bun test`

---

## Rules

### ✅ Do This
- Define payload interfaces for route handlers
- Validate inputs (Zod or manual)
- Call database layer for data access
- Transform data using domain utilities
- Record audit logs for create/update/delete
- Keep functions focused and testable
- Export types and functions
- Handle null/undefined gracefully

### ❌ Avoid This
- Don't access database directly (use `db/` functions)
- Don't put HTTP logic here (use `index.ts`)
- Don't format money manually (use `formatMoney()`)
- Don't skip validation on external inputs
- Don't mix multiple responsibilities in one function
- Don't use `any` type
- Don't forget to log data changes

---

## Navigation
- **Parent:** [src/AGENTS.md](../AGENTS.md)
- **Root:** [Project AGENTS.md](../../AGENTS.md)
