import { Database } from 'bun:sqlite'

type MoneyColumn = {
  table: string
  column: string
}

const MONEY_COLUMNS: MoneyColumn[] = [
  { table: 'products', column: 'cost' },
  { table: 'product_pricing', column: 'sell_price' },
  { table: 'product_pricing', column: 'competitor_price' },
]

const downscale = (value: number | null): number | null => {
  if (value === null || Number.isNaN(value)) return null
  return Math.round(value / 100)
}

async function main() {
  const db = new Database('gentech.sqlite')

  db.transaction(() => {
    for (const { table, column } of MONEY_COLUMNS) {
      const rows = db
        .query<{ id: number; value: number | null }>(`SELECT rowid as id, ${column} as value FROM ${table}`)
        .all()

      const updateStmt = db.query(
        `UPDATE ${table} SET ${column} = ?1 WHERE rowid = ?2`
      )

      for (const row of rows) {
        const normalized = downscale(row.value)
        if (normalized === row.value) continue
        updateStmt.run(normalized, row.id)
      }
    }
  })()

  console.log('Money columns downscaled by factor of 100 for products/product_pricing.')
}

main().catch((error) => {
  console.error('Repair failed', error)
  process.exit(1)
})
