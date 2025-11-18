import { Database } from 'bun:sqlite'

const db = new Database('gentech.sqlite')

try {
  db.run('PRAGMA foreign_keys = OFF')

  db.run('ALTER TABLE platform_pricing RENAME TO product_pricing')

  db.run('PRAGMA foreign_keys = ON')
  console.log('Migration: renamed platform_pricing to product_pricing')
} catch (error) {
  console.error('Migration failed:', error)
} finally {
  db.close()
}
