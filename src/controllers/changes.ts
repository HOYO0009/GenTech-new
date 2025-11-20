import { Hono } from 'hono'
import { listChangeEvents } from '../services/changes'
import { changesPage } from '../ui/pages/changes'

export const registerChangeLogRoutes = (app: Hono) => {
  app.get('/changes', async (c) => {
    const changes = await listChangeEvents()
    return c.html(changesPage(changes))
  })
}
