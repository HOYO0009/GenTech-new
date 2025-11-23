import { Database } from 'bun:sqlite'

type VoucherRow = {
  id: number
  min_spend: number | null
  discount: number | null
  max_discount: number | null
  discount_key: string | null
}

const toCents = (value: number | null): number | null => {
  if (value === null || Number.isNaN(value)) return null
  const hasFraction = value % 1 !== 0
  return hasFraction ? Math.round(value * 100) : value
}

const normalizeMoney = (value: number | null): number | null => {
  if (value === null || Number.isNaN(value)) return null
  // Only convert floats (assumed dollars) to cents; leave integer cents untouched
  const hasFraction = value % 1 !== 0
  return hasFraction ? Math.round(value * 100) : value
}

const toBasisPoints = (value: number | null): number | null => {
  if (value === null || Number.isNaN(value)) return null
  const hasFraction = value % 1 !== 0
  return hasFraction ? Math.round(value * 100) : value
}

const normalizeDiscount = (value: number | null, key: string | null): number | null => {
  if (value === null || Number.isNaN(value)) return null
  if (key === 'percentage') {
    const hasFraction = value % 1 !== 0
    // Values up to 100 (or fractional) are assumed percentages; convert to basis points
    if (hasFraction || value <= 100) return toBasisPoints(value)
    return value
  }
  return normalizeMoney(value)
}

async function main() {
  const db = new Database('gentech.sqlite')

  const rows = db
    .query<VoucherRow>(
      `
        SELECT
          v.id,
          v.min_spend,
          v.discount,
          v.max_discount,
          dt.key AS discount_key
        FROM vouchers v
        LEFT JOIN voucher_discount_types dt ON dt.id = v.voucher_discount_type_id
      `
    )
    .all()

  const updateStmt = db.query(
    `
      UPDATE vouchers
      SET min_spend = ?1, discount = ?2, max_discount = ?3
      WHERE id = ?4
    `
  )

  db.transaction(() => {
    for (const row of rows) {
      const minSpend = normalizeMoney(row.min_spend)
      const discount = normalizeDiscount(row.discount, row.discount_key)
      const maxDiscount = normalizeMoney(row.max_discount)
      updateStmt.run(minSpend, discount, maxDiscount, row.id)
    }
  })()

  console.log(`Updated ${rows.length} voucher rows to cents/basis points.`)
}

main().catch((error) => {
  console.error('Migration failed', error)
  process.exit(1)
})
