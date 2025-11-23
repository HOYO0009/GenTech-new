import { formatTimestamp, escapeHtml, prettyPayload } from '../domain/formatters.domain'
import { ChangeLogEntry, LogPayload } from '../db/changeLogs.db'
import { IChangeLogRepository } from '../repositories/changeLog.repository.interface'
import { ChangeLogRepository } from '../repositories/changeLog.repository'
import { DbClient } from '../db/connection.db'

export interface ChangeLogEvent {
  id: ChangeLogEntry['id']
  occurredAt: string
  tableLabel: string
  action: string
  description: string
  payload: string | null
  source: string | null
}

export class ChangeLogsService {
  constructor(private repository: IChangeLogRepository) {}

  async listChangeEvents(limit = 40): Promise<ChangeLogEvent[]> {
    const changes = await this.repository.listRecentChanges(limit)

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

  async recordChange(entry: LogPayload, executor?: DbClient): Promise<void> {
    await this.repository.logDatabaseChange(entry, executor)
  }
}

const defaultChangeLogsService = new ChangeLogsService(new ChangeLogRepository())

export async function listChangeEvents(limit = 40): Promise<ChangeLogEvent[]> {
  return defaultChangeLogsService.listChangeEvents(limit)
}

export async function recordChange(entry: LogPayload, executor?: DbClient): Promise<void> {
  return defaultChangeLogsService.recordChange(entry, executor)
}
