import { Hono, type Context } from 'hono'
import {
  createProduct,
  deleteProduct,
  getProductPagePayload,
  updateProductDetails,
  type ProductCreateResult,
  type ProductUpdateResult,
  type ProductSortOption,
} from '../services/products.service'
import { productPage } from '../ui/pages/products.page'
import { productEditorPage } from '../ui/pages/productEditor.page'

const parseCostInput = (entry: unknown, label = 'Cost') => {
  const raw = (entry ?? '').toString().trim()
  if (!raw) {
    return null
  }
  const parsed = Number(raw)
  if (!Number.isFinite(parsed) || parsed < 0) {
    throw new Error(`${label} must be a non-negative number.`)
  }
  return Math.round(parsed * 100)
}

const parseSupplierIdInput = (entry: unknown) => {
  const raw = (entry ?? '').toString().trim()
  if (!raw) {
    return null
  }
  const parsed = Number(raw)
  if (!Number.isFinite(parsed)) {
    throw new Error('Invalid supplier selection.')
  }
  return Math.round(parsed)
}

type ProductOperationResult = ProductCreateResult | ProductUpdateResult

const respondWithProductFeedback = async (
  c: Context,
  result: ProductOperationResult,
  hxRedirect?: string
) => {
  const textColor = result.status === 200 ? 'text-emerald-300' : 'text-amber-400'
  const messageHtml = `<div class="px-3 py-2 ${textColor}">${result.message}</div>`
  const isHxRequest = c.req.header('HX-Request') === 'true'
  if (isHxRequest) {
    if (result.status === 200 && hxRedirect) {
      c.header('HX-Redirect', hxRedirect)
      return c.html('', result.status)
    }
    return c.html(messageHtml, result.status)
  }
  const payload = await getProductPagePayload()
  return c.html(
    productPage(
      payload.products,
      payload.statuses,
      payload.suppliers,
      result.message,
      `text-sm uppercase tracking-[0.3em] ${textColor}`
    )
  )
}

export const registerProductRoutes = (app: Hono) => {
  app.get('/products', async (c) => {
    const search = c.req.query('search') ?? ''
    const sortQuery = c.req.query('sort') ?? ''
    const sort: ProductSortOption = ['name-asc', 'name-desc', 'sku-asc', 'sku-desc'].includes(sortQuery)
      ? (sortQuery as ProductSortOption)
      : 'name-asc'
    const supplierFilters = (c.req.queries('supplierId') ?? []).map((value) => Number(value)).filter(Number.isFinite)
    const statusFilters = (c.req.queries('statusId') ?? []).map((value) => Number(value)).filter(Number.isFinite)
    const { products, statuses, suppliers } = await getProductPagePayload({
      search,
      sort,
      supplierIds: supplierFilters,
      statusIds: statusFilters,
    })
    return c.html(
      productPage(
        products,
        statuses,
        suppliers,
        '',
        'text-sm text-white/70 uppercase tracking-[0.3em]',
        search,
        sort,
        supplierFilters,
        statusFilters
      )
    )
  })

  app.get('/products/manage', async (c) => {
    const payload = await getProductPagePayload()
    return c.html(productEditorPage(payload))
  })

  app.post('/products/update', async (c) => {
    const form = await c.req.formData()
    const originalSku = (form.get('originalSku') ?? '').toString()
    const sku = (form.get('sku') ?? '').toString()
    const name = (form.get('name') ?? '').toString()
    const requestedStatusId = Number(form.get('status'))
    let costCents: number | null = null
    try {
      costCents = parseCostInput(form.get('cost'))
    } catch (error) {
      return c.html((error as Error).message, 400)
    }
    const purchaseRemarks = (form.get('purchaseRemarks') ?? '').toString()
    let supplierId: number | null = null
    try {
      supplierId = parseSupplierIdInput(form.get('supplierId'))
    } catch (error) {
      return c.html((error as Error).message, 400)
    }
    const supplierLink = (form.get('supplierLink') ?? '').toString().trim()
    const result = await updateProductDetails({
      originalSku,
      sku,
      name,
      requestedStatusId,
      costCents,
      purchaseRemarks,
      supplierId,
      supplierLink,
    })
    return respondWithProductFeedback(c, result)
  })

  app.post('/products/create', async (c) => {
    const form = await c.req.formData()
    const sku = (form.get('sku') ?? '').toString()
    const name = (form.get('name') ?? '').toString()
    const requestedStatusId = Number(form.get('status'))
    let costCents: number | null = null
    try {
      costCents = parseCostInput(form.get('cost'))
    } catch (error) {
      return c.html((error as Error).message, 400)
    }
    const purchaseRemarks = (form.get('purchaseRemarks') ?? '').toString()
    let supplierId: number | null = null
    try {
      supplierId = parseSupplierIdInput(form.get('supplierId'))
    } catch (error) {
      return c.html((error as Error).message, 400)
    }
    const supplierLink = (form.get('supplierLink') ?? '').toString().trim()
    const result = await createProduct({
      sku,
      name,
      requestedStatusId,
      costCents,
      purchaseRemarks,
      supplierId,
      supplierLink,
    })
    return respondWithProductFeedback(c, result, '/products')
  })

  app.post('/products/delete', async (c) => {
    const form = await c.req.formData()
    const sku = (form.get('sku') ?? '').toString()
    const confirmation = (form.get('confirmation') ?? '').toString()
    const result = await deleteProduct({ sku, confirmation })
    return respondWithProductFeedback(c, result)
  })
}
