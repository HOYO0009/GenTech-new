import { Hono } from 'hono'
import homepage from '../ui/pages/home.page'

export const registerHomeRoutes = (app: Hono) => {
  app.get('/', (c) => c.html(homepage))
}
