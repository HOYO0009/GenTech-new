import { formatTimestamp, escapeHtml, prettyPayload } from '../domain/formatters.domain'
import { ChangeLogEntry, listRecentChanges, logDatabaseChange, LogPayload } from '../db/changeLogs.db'

export interface ChangeLogEvent {
  id: ChangeLogEntry['id']
  occurredAt: string
  tableLabel: string
  action: string
  description: string
  payload: string | null
  source: string | null
}

export async function listChangeEvents(limit = 40): Promise<ChangeLogEvent[]> {
  const changes = await listRecentChanges(limit)

  return changes.map((change) => {
    const tableLabel = change.tableName ? escapeHtml(change.tableName) : 'database'
    const payload = prettyPayload(change.payload)

    return {
      id: change.id,
      occurredAt: formatTimestamp(change.occurredAt),
      tableLabel,
      action: escapeHtml(change.action),
      description: escapeHtml(change.description),
      payload: payload ? escapeHtml(payload) : null,
      source: change.source ? escapeHtml(change.source) : null,
    }
  })
}

export async function recordChange(entry: LogPayload) {
  await logDatabaseChange(entry)
}
