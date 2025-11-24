import { join } from 'path'
import { Database } from 'bun:sqlite'
import { drizzle } from 'drizzle-orm/bun-sqlite'

export const sqlite = new Database(join(process.cwd(), 'gentech.sqlite'))
export const db = drizzle(sqlite)

type TransactionClient = Parameters<Parameters<typeof db.transaction>[0]>[0]

// DbClient is used to allow either the root client or a transactional client.
export type DbClient = typeof db | TransactionClient
