# Scripts (`scripts/`)

> Maintenance and migration scripts for database updates and data transformations

---

## Files in This Directory

```
scripts/
├── migrate-currency-to-cents.py    # Convert money columns from dollars to cents
├── migrate-vouchers.ts              # Voucher data migration
├── migrate_product_statuses.py      # Product status data migration
└── rename-platform-pricing.ts       # Rename platform pricing columns
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
- Recurring tasks (use proper job scheduler)
- Schema changes (use Drizzle migrations: `bun run db:generate`)

---

## Script Types

### Data Migration Scripts
**Purpose:** Transform existing data to match new schema requirements

**Example:** `migrate-currency-to-cents.py`
- Converts money columns from floats (dollars) to integers (cents)
- Updates multiple tables: products, vouchers, pricing, etc.
- Multiplies all money values by 100 and rounds

**When to create:**
- Changing data format (dollars → cents, timestamps, etc.)
- Normalizing inconsistent data
- Bulk updates after schema changes

### Schema Migration Scripts
**Purpose:** Handle complex schema changes that Drizzle can't auto-generate

**Example:** `migrate_product_statuses.py`
- Migrates status data from one format to another
- Seed reference tables with initial data

**When to create:**
- Adding lookup tables with seed data
- Restructuring relationships
- Complex multi-step schema transformations

### Column Rename Scripts
**Purpose:** Rename columns while preserving data

**Example:** `rename-platform-pricing.ts`
- Renames columns in existing tables
- Updates references in related tables

**When to create:**
- Renaming columns after code review
- Fixing naming inconsistencies
- Aligning with new naming conventions

---

## Running Scripts

### Python Scripts
```bash
# Run with Python 3
python3 scripts/migrate-currency-to-cents.py

# Or with system Python
python scripts/migrate_product_statuses.py
```

### TypeScript Scripts
```bash
# Run with Bun
bun run scripts/migrate-vouchers.ts

# Or specify path
bun scripts/rename-platform-pricing.ts
```

---

## Writing Migration Scripts

### Python Migration Template
```python
import sqlite3

def migrate_data(cursor: sqlite3.Cursor) -> None:
    """Perform data transformation"""
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

### TypeScript Migration Template
```typescript
import { Database } from 'bun:sqlite'

const db = new Database('gentech.sqlite')

try {
  // Run migration
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
1. **Backup database first!**
   ```bash
   cp gentech.sqlite gentech.sqlite.backup
   ```

2. **Test on copy:**
   ```bash
   cp gentech.sqlite gentech.test.sqlite
   # Edit script to use gentech.test.sqlite
   bun run scripts/your-migration.ts
   ```

3. **Review script logic:**
   - Check SQL syntax
   - Verify column names
   - Test with small dataset first

### During Development
1. **Use transactions:**
   ```python
   cursor.execute("BEGIN TRANSACTION")
   try:
       # Multiple updates
       cursor.execute("UPDATE ...")
       cursor.execute("UPDATE ...")
       conn.commit()
   except:
       conn.rollback()
       raise
   ```

2. **Add logging:**
   ```typescript
   console.log('Starting migration...')
   const result = db.run('UPDATE ...')
   console.log(`Updated ${result.changes} rows`)
   ```

3. **Handle errors gracefully:**
   ```python
   try:
       migrate_data(cursor)
   except sqlite3.Error as e:
       print(f"Database error: {e}")
       conn.rollback()
   ```

### After Running
1. **Verify results:**
   ```bash
   bun run db:studio
   # Check data in browser at http://localhost:4983
   ```

2. **Run application tests:**
   ```bash
   bun test
   bun run dev
   # Verify app still works
   ```

3. **Document changes:**
   - Add comments in script
   - Note what changed in commit message
   - Update schema docs if needed

---

## Common Migration Patterns

### Money Format Conversion
```python
# Convert dollars to cents (float → integer)
cursor.execute("""
    UPDATE products
    SET cost = CAST(ROUND(cost * 100, 0) AS INTEGER)
    WHERE cost IS NOT NULL
""")
```

### Add Default Values
```python
# Set default for new column
cursor.execute("""
    UPDATE products
    SET status_id = 1
    WHERE status_id IS NULL
""")
```

### Data Normalization
```typescript
// Extract data into lookup table
db.run(`
  INSERT INTO product_statuses (name)
  SELECT DISTINCT status FROM products
  WHERE status IS NOT NULL
`)

// Update references
db.run(`
  UPDATE products
  SET status_id = (
    SELECT id FROM product_statuses
    WHERE name = products.status
  )
`)
```

### Bulk Insert
```python
# Insert reference data
statuses = [
    ('active',),
    ('discontinued',),
    ('out-of-stock',)
]

cursor.executemany(
    "INSERT INTO product_statuses (name) VALUES (?)",
    statuses
)
```

---

## Safety Checklist

Before running ANY migration script:

- [ ] **Backup database:** `cp gentech.sqlite gentech.sqlite.backup`
- [ ] **Test on copy first:** Use `gentech.test.sqlite`
- [ ] **Review SQL logic:** Check for typos and logic errors
- [ ] **Use transactions:** Ensure rollback on failure
- [ ] **Verify column names:** Match current schema
- [ ] **Check for NULL handling:** Don't break on NULL values
- [ ] **Add logging:** Know what changed
- [ ] **Test after migration:** Run `bun test` and `bun run dev`

---

## Existing Scripts

### `migrate-currency-to-cents.py`
**Purpose:** Convert all money columns from dollars (float) to cents (integer)

**Tables affected:**
- `products` (cost)
- `product_pricing` (sell_price, actual_sell_price, competitor_price)
- `purchases` (total amounts)
- `purchase_items` (costs, fees)
- `finance_entries` (amount)
- `vouchers` (min_spend, discount, max_discount)

**When to run:** After schema change to integer money columns

### `migrate_product_statuses.py`
**Purpose:** Migrate product status data to new format

**When to run:** After adding `product_statuses` lookup table

### `migrate-vouchers.ts`
**Purpose:** Transform voucher data structure

**When to run:** After voucher schema changes

### `rename-platform-pricing.ts`
**Purpose:** Rename pricing columns for consistency

**When to run:** After pricing table restructure

---

## Working in This Directory

### To create a new migration script:
1. Backup database: `cp gentech.sqlite gentech.sqlite.backup`
2. Create script file: `scripts/migrate-<feature>.py` or `.ts`
3. Use template from above
4. Add transformation logic
5. Test on copy: `cp gentech.sqlite gentech.test.sqlite`
6. Run script: `python3 scripts/migrate-<feature>.py`
7. Verify results: `bun run db:studio`
8. Run on production database
9. Commit script for documentation

### To debug a failed migration:
1. Restore backup: `cp gentech.sqlite.backup gentech.sqlite`
2. Review error message
3. Fix script logic
4. Test on copy again
5. Re-run migration

---

## Rules

### ✅ Do This
- Always backup database first
- Test on copy before production
- Use transactions for safety
- Add logging and error handling
- Document what changed
- Keep scripts for reference
- Verify results after running

### ❌ Avoid This
- Don't run without backup
- Don't skip testing on copy
- Don't ignore errors
- Don't delete scripts after running (keep for history)
- Don't modify production without testing
- Don't use scripts for regular app logic

---

## Navigation
- **Parent:** [Root AGENTS.md](../AGENTS.md)
