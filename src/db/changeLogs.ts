import { sql } from 'drizzle-orm'
import { db } from './connection'
import { changeLogs } from './schema'

const changeLogSetup = (async () => {
  await db.run(
    sql`
      CREATE TABLE IF NOT EXISTS change_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        occurred_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
        table_name TEXT,
        action TEXT NOT NULL,
        description TEXT NOT NULL,
        payload TEXT,
        source TEXT
      )
    `,
  )
})()

export type ChangeLogEntry = typeof changeLogs.$inferSelect

export interface LogPayload {
  tableName?: string
  action: string
  description: string
  payload?: unknown
  source?: string
}

export async function listRecentChanges(limit = 40) {
  await changeLogSetup

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
    .orderBy(changeLogs.occurredAt, 'desc')
    .limit(limit)
    .all()
}

export async function logDatabaseChange(entry: LogPayload) {
  await changeLogSetup

  await db.insert(changeLogs).values({
    tableName: entry.tableName ?? null,
    action: entry.action,
    description: entry.description,
    payload: entry.payload ? JSON.stringify(entry.payload) : null,
    source: entry.source ?? null,
  }).run()
}
