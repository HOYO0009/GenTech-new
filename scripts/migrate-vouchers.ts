import { Database } from 'bun:sqlite'

const db = new Database('gentech.sqlite')

try {
  db.run('PRAGMA foreign_keys = OFF')

  db.run('ALTER TABLE voucher_types RENAME TO voucher_discount_types')
  db.run('ALTER TABLE vouchers RENAME COLUMN voucher_type_id TO voucher_discount_type_id')

  db.run(`
    CREATE TABLE voucher_types (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
    )
  `)

  const voucherTypeNames = ['Welcome', 'Repeat', 'Points Redemption', 'Sorry']
  voucherTypeNames.forEach((name) => {
    db.run('INSERT INTO voucher_types (name) VALUES (?)', name)
  })

  db.run(
    'ALTER TABLE vouchers ADD COLUMN voucher_type_id INTEGER NOT NULL DEFAULT 1 REFERENCES voucher_types(id)'
  )

  db.run('PRAGMA foreign_keys = ON')
  console.log('Migration: voucher schema updated')
} catch (error) {
  console.error('Migration failed:', error)
} finally {
  db.close()
}
