import { Hono } from 'hono'

export const registerStatusRoutes = (app: Hono) => {
  app.get('/status', (c) => {
    const time = new Date().toISOString()
    return c.text(`Backend is alive at ${time}`)
  })
}
