import { Hono } from 'hono'
import { settingsPage } from '../ui/pages/settings.page'

export const registerSettingsRoutes = (app: Hono) => {
  app.get('/settings', (c) => c.html(settingsPage()))
}
