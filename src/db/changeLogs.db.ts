import { desc } from 'drizzle-orm'
import { db, DbClient } from './connection.db'
import { changeLogs } from './schema.db'

export type ChangeLogEntry = typeof changeLogs.$inferSelect

export interface LogPayload {
  tableName?: string
  action: string
  description: string
  payload?: unknown
  source?: string
}

export async function listRecentChanges(limit = 40) {
  return db
    .select({
      id: changeLogs.id,
      occurredAt: changeLogs.occurredAt,
      tableName: changeLogs.tableName,
      action: changeLogs.action,
      description: changeLogs.description,
      payload: changeLogs.payload,
      source: changeLogs.source,
    })
    .from(changeLogs)
    .orderBy(desc(changeLogs.occurredAt))
    .limit(limit)
    .all()
}

export async function logDatabaseChange(entry: LogPayload, executor: DbClient = db) {
  await executor.insert(changeLogs).values({
    tableName: entry.tableName ?? null,
    action: entry.action,
    description: entry.description,
    payload: entry.payload ? JSON.stringify(entry.payload) : null,
    source: entry.source ?? null,
  }).run()
}
