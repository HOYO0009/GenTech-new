import { existsSync } from 'fs'
import { join } from 'path'
import { Hono } from 'hono'
import { listChangeEvents } from '../services/changeLogs.service'
import { changesPage } from '../ui/pages/changes.page'

const RECENT_CHANGE_LIMIT = 120

export const registerChangeLogRoutes = (app: Hono) => {
  app.get('/changes', async (c) => {
    const pageParam = c.req.query('page')
    const parsedPage = pageParam ? Number.parseInt(pageParam, 10) : 1
    const currentPage = Number.isNaN(parsedPage) ? 1 : Math.max(parsedPage, 1)
    const changes = await listChangeEvents(RECENT_CHANGE_LIMIT)
    return c.html(changesPage(changes, currentPage))
  })

  app.get('/changes/database', async (c) => {
    const dbPath = join(process.cwd(), 'gentech.sqlite')
    if (!existsSync(dbPath)) {
      return c.text('Database file not found', 404)
    }
    const headers = {
      'Content-Type': 'application/vnd.sqlite3',
      'Content-Disposition': 'attachment; filename="gentech.sqlite"',
      'Cache-Control': 'no-store',
    }
    return new Response(Bun.file(dbPath), { headers })
  })
}
