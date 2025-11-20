import { Hono } from 'hono'
import homepage from '../ui/pages/home'

export const registerHomeRoutes = (app: Hono) => {
  app.get('/', (c) => c.html(homepage))
}
