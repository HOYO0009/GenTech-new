# Scripts (`scripts/`)

> Maintenance and migration scripts for database updates and data transformations.

---

## Files in This Directory

```
scripts/
- migrate-currency-to-cents.py      # Convert money columns from dollars to cents (Python)
- migrate-money-to-cents.ts         # Convert money columns to cents (TypeScript)
- migrate-vouchers-to-cents-bps.ts  # Voucher data migration to cents/bps
- migrate-vouchers.ts               # Voucher data migration
- migrate_product_statuses.py       # Product status data migration
- rename-platform-pricing.ts        # Rename platform pricing columns
- repair-money-downscale.ts         # Downscale money values if scaled up incorrectly
```

---

## Purpose

**One-time scripts** for:
- Database migrations (data transformations)
- Schema updates that Drizzle can't auto-generate
- Bulk data imports/exports
- Data cleanup and normalization
- Historical data corrections

**NOT for:**
- Regular application code (use `src/`)
- Recurring tasks (use a job scheduler)
- Schema changes (use Drizzle migrations: `bun run db:generate`)

---

## Running Scripts

### Python Scripts
```bash
python3 scripts/migrate-currency-to-cents.py
python scripts/migrate_product_statuses.py
```

### TypeScript Scripts
```bash
bun run scripts/migrate-money-to-cents.ts
bun run scripts/migrate-vouchers-to-cents-bps.ts
bun run scripts/rename-platform-pricing.ts
```

---

## Writing Migration Scripts

### Python Template
```python
import sqlite3

def migrate_data(cursor: sqlite3.Cursor) -> None:
    cursor.execute("""
        UPDATE table_name
        SET column = new_value
        WHERE condition
    """)

def main() -> None:
    conn = sqlite3.connect('gentech.sqlite')
    cursor = conn.cursor()
    try:
        migrate_data(cursor)
        conn.commit()
        print("Migration successful!")
    except Exception as e:
        conn.rollback()
        print(f"Migration failed: {e}")
    finally:
        conn.close()

if __name__ == '__main__':
    main()
```

### TypeScript Template
```typescript
import { Database } from 'bun:sqlite'

const db = new Database('gentech.sqlite')

try {
  db.run(`
    UPDATE table_name
    SET column = new_value
    WHERE condition
  `)
  console.log('Migration successful!')
} catch (error) {
  console.error('Migration failed:', error)
  process.exit(1)
} finally {
  db.close()
}
```

---

## Best Practices

### Before Running
1. **Backup database:** `cp gentech.sqlite gentech.sqlite.backup`
2. **Test on a copy:** `cp gentech.sqlite gentech.test.sqlite` and point the script to it.
3. **Review logic:** Verify SQL, column names, and null handling.

### During Development
1. Use transactions to ensure rollback on failure.
2. Add logging (row counts, start/end markers).
3. Handle errors gracefully; surface clear messages.

### After Running
1. Verify results in Drizzle Studio: `bun run db:studio`.
2. Run tests: `bun test`.
3. Keep the script for history; document what changed.

---

## Safety Checklist

- [ ] Backup database
- [ ] Test on copy
- [ ] Review SQL/column names
- [ ] Use transactions
- [ ] Add logging
- [ ] Handle NULLs correctly
- [ ] Run tests after migration

---

## Navigation
- **Parent:** `../AGENTS.md`
