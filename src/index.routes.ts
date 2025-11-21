import { Hono } from 'hono'
import { registerHomeRoutes } from './controllers/home.routes'
import { registerProductRoutes } from './controllers/products.routes'
import { registerVoucherRoutes } from './controllers/vouchers.routes'
import { registerChangeLogRoutes } from './controllers/changeLogs.routes'
import { registerStatusRoutes } from './controllers/status.routes'
import { registerSettingsRoutes } from './controllers/settings.routes'

const app = new Hono()

registerHomeRoutes(app)
registerProductRoutes(app)
registerVoucherRoutes(app)
registerChangeLogRoutes(app)
registerStatusRoutes(app)
registerSettingsRoutes(app)

const handler = {
  port: 3000,
  fetch: app.fetch,
}

if (process.argv.includes('--dry-run')) {
  console.log('Dry run: Bun/Hono homepage handler ready.')
  process.exit(0)
}

export default handler
