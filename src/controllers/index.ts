import { Hono } from 'hono'
import { registerHomeRoutes } from './home'
import { registerProductRoutes } from './products'
import { registerVoucherRoutes } from './vouchers'
import { registerChangeLogRoutes } from './changes'
import { registerStatusRoutes } from './status'

const app = new Hono()

registerHomeRoutes(app)
registerProductRoutes(app)
registerVoucherRoutes(app)
registerChangeLogRoutes(app)
registerStatusRoutes(app)

const handler = {
  port: 3000,
  fetch: app.fetch,
}

if (process.argv.includes('--dry-run')) {
  console.log('Dry run: Bun/Hono homepage handler ready.')
  process.exit(0)
}

export default handler
