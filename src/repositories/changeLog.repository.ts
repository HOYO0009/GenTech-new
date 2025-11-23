import { IChangeLogRepository } from './changeLog.repository.interface'
import {
  listRecentChanges as dbListRecentChanges,
  logDatabaseChange as dbLogDatabaseChange,
  ChangeLogEntry,
  LogPayload,
} from '../db/changeLogs.db'
import { DbClient } from '../db/connection.db'

export class ChangeLogRepository implements IChangeLogRepository {
  async listRecentChanges(limit = 40): Promise<ChangeLogEntry[]> {
    return dbListRecentChanges(limit)
  }

  async logDatabaseChange(entry: LogPayload, executor?: DbClient): Promise<void> {
    return dbLogDatabaseChange(entry, executor)
  }
}
