import { join } from 'path'
import { Database } from 'bun:sqlite'
import { drizzle } from 'drizzle-orm/bun-sqlite'

const sqlite = new Database(join(process.cwd(), 'gentech.sqlite'))
export const db = drizzle(sqlite)
