# Repository Layer (`src/repositories/`)

> Thin adapters over the `db/` layer, providing interfaces and concrete classes for services.

---

## Files in This Directory

```
repositories/
- changeLog.repository.interface.ts
- changeLog.repository.ts
- product.repository.interface.ts
- product.repository.ts
- voucher.repository.interface.ts
- voucher.repository.ts
```

**Naming convention:** `<feature>.repository.interface.ts` for contracts, `<feature>.repository.ts` for implementations.

---

## Responsibilities

- Expose async methods for the service layer (list, get, insert, update, delete).
- Delegate all data access to `db/` functions; keep logic minimal and type-safe.
- Return Drizzle-inferred types from `db/` layer without re-shaping unless necessary.
- Keep repositories stateless; no caching or mutation of inputs.

**Avoid:** Business rules, validation, formatting, or direct SQL in this layer.

---

## Usage Pattern

```typescript
// services/products.service.ts
import { ProductRepository } from '../repositories/product.repository'

const repo = new ProductRepository()
const products = await repo.listProducts() // Calls db/products.db
```

- Services depend on interfaces to simplify testing/mocking.
- Keep method names aligned with DB calls (`list`, `get`, `insert`, `update`, `delete`).

---

## Navigation
- **Parent:** [src/AGENTS.md](../AGENTS.md)
- **Root:** [Project AGENTS.md](../../AGENTS.md)
