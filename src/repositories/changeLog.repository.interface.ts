import { ChangeLogEntry, LogPayload } from '../db/changeLogs.db'

export interface IChangeLogRepository {
  listRecentChanges(limit?: number): Promise<ChangeLogEntry[]>
  logDatabaseChange(entry: LogPayload): Promise<void>
}
