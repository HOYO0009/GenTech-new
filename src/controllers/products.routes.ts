import { Hono, type Context } from 'hono'
import {
  createProduct,
  deleteProduct,
  getProductPagePayload,
  updateProductDetails,
  type ProductCreateResult,
  type ProductUpdateResult,
  type ProductSortOption,
} from '../services/products.service.ts'
import { productPage, renderProductCard, renderProductListingSection } from '../ui/pages/products.page.ts'
import { productAddPage } from '../ui/pages/productAdd.page.ts'
import { z, ZodError } from 'zod'

type ProductOperationResult = ProductCreateResult | ProductUpdateResult
type ProductQueryParams = {
  search: string
  sort: ProductSortOption
  supplierFilters: number[]
  statusFilters: number[]
  page: number
}

const buildToastTrigger = (
  result: ProductOperationResult,
  extra?: { subject?: string; details?: string[] }
) => ({
  toast: {
    status: result.status,
    message: result.message,
    subject: extra?.subject ?? (result as ProductOperationResult & { subject?: string }).subject,
    details: extra?.details ?? (result as ProductOperationResult & { details?: string[] }).details,
  },
})

const requiredInteger = (label: string) =>
  z
    .string()
    .trim()
    .min(1, `${label} is required.`)
    .transform((value) => {
      const parsed = Number(value)
      if (!Number.isFinite(parsed) || !Number.isInteger(parsed)) {
        throw new Error(`${label} must be an integer.`)
      }
      return parsed
    })

const optionalInteger = (label: string) =>
  z
    .string()
    .trim()
    .transform((value) => {
      if (!value) return null
      const parsed = Number(value)
      if (!Number.isFinite(parsed) || !Number.isInteger(parsed)) {
        throw new Error(`Invalid ${label.toLowerCase()} selection.`)
      }
      return parsed
    })

const costToCents = (label = 'Cost') =>
  z
    .string()
    .trim()
    .transform((value) => {
      if (!value) return null
      const parsed = Number(value)
      if (!Number.isFinite(parsed) || parsed < 0) {
        throw new Error(`${label} must be a non-negative number.`)
      }
      return Math.round(parsed * 100)
    })

const productBaseSchema = z.object({
  sku: z.string().trim().min(1, 'SKU is required.'),
  name: z.string().trim().min(1, 'Name is required.'),
  status: requiredInteger('Status'),
  cost: costToCents(),
  purchaseRemarks: z.string(),
  supplierId: optionalInteger('Supplier'),
  supplierLink: z.string(),
})

const productCreateSchema = productBaseSchema

const productUpdateSchema = productBaseSchema.extend({
  originalSku: z.string().trim().min(1, 'Original SKU is required.'),
})

const parseCreateProductForm = (form: FormData) => {
  const parsed = productCreateSchema.parse({
    sku: (form.get('sku') ?? '').toString(),
    name: (form.get('name') ?? '').toString(),
    status: (form.get('status') ?? '').toString(),
    cost: (form.get('cost') ?? '').toString(),
    purchaseRemarks: (form.get('purchaseRemarks') ?? '').toString(),
    supplierId: (form.get('supplierId') ?? '').toString(),
    supplierLink: (form.get('supplierLink') ?? '').toString(),
  })

  return {
    sku: parsed.sku,
    name: parsed.name,
    requestedStatusId: parsed.status,
    costCents: parsed.cost,
    purchaseRemarks: parsed.purchaseRemarks,
    supplierId: parsed.supplierId,
    supplierLink: parsed.supplierLink,
  }
}

const parseUpdateProductForm = (form: FormData) => {
  const parsed = productUpdateSchema.parse({
    originalSku: (form.get('originalSku') ?? '').toString(),
    sku: (form.get('sku') ?? '').toString(),
    name: (form.get('name') ?? '').toString(),
    status: (form.get('status') ?? '').toString(),
    cost: (form.get('cost') ?? '').toString(),
    purchaseRemarks: (form.get('purchaseRemarks') ?? '').toString(),
    supplierId: (form.get('supplierId') ?? '').toString(),
    supplierLink: (form.get('supplierLink') ?? '').toString(),
  })

  return {
    originalSku: parsed.originalSku,
    sku: parsed.sku,
    name: parsed.name,
    requestedStatusId: parsed.status,
    costCents: parsed.cost,
    purchaseRemarks: parsed.purchaseRemarks,
    supplierId: parsed.supplierId,
    supplierLink: parsed.supplierLink,
  }
}

const parseErrorMessage = (error: unknown, fallback = 'Invalid input.') =>
  error instanceof ZodError ? error.errors[0]?.message ?? fallback : (error as Error).message

const parseProductQueryParams = (req: Context['req']): ProductQueryParams => {
  const sourceUrl = req.header('HX-Current-URL') || req.url
  try {
    const parsedUrl = new URL(sourceUrl, 'http://localhost')
    const search = parsedUrl.searchParams.get('search') ?? ''
    const sortQuery = parsedUrl.searchParams.get('sort') ?? ''
    const sort: ProductSortOption = ['name-asc', 'name-desc', 'sku-asc', 'sku-desc'].includes(sortQuery)
      ? (sortQuery as ProductSortOption)
      : 'name-asc'
    const supplierFilters = parsedUrl.searchParams
      .getAll('supplierId')
      .map((value) => Number(value))
      .filter(Number.isFinite)
    const statusFilters = parsedUrl.searchParams
      .getAll('statusId')
      .map((value) => Number(value))
      .filter(Number.isFinite)
    const pageParam = parsedUrl.searchParams.get('page')
    const parsedPage = pageParam ? Number(pageParam) : NaN
    const page = Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1

    return {
      search,
      sort,
      supplierFilters,
      statusFilters,
      page,
    }
  } catch {
    return {
      search: '',
      sort: 'name-asc',
      supplierFilters: [],
      statusFilters: [],
      page: 1,
    }
  }
}

const buildInlineFeedbackHtml = (result: ProductOperationResult) => {
  const textColor = result.status === 200 ? 'text-emerald-300' : 'text-amber-400'
  const feedbackStatus = result.status === 200 ? 'success' : 'error'
  return `<div class="px-3 py-2 ${textColor}" data-inline-feedback-status="${feedbackStatus}">${result.message}</div>`
}

const respondWithProductFeedback = async (
  c: Context,
  result: ProductOperationResult,
  hxRedirect?: string,
  inlineCardId?: string
) => {
  const textColor = result.status === 200 ? 'text-emerald-300' : 'text-amber-400'
  const messageHtml = buildInlineFeedbackHtml(result)
  const isHxRequest = c.req.header('HX-Request') === 'true'
  const httpStatus = result.status
  if (isHxRequest) {
    const triggers =
      result.status === 200
        ? {
            ...buildToastTrigger(result),
            ...(inlineCardId ? { 'inline-panel-close': { cardId: inlineCardId } } : { 'inline-panel-close': true }),
          }
        : buildToastTrigger(result)
    c.header('HX-Trigger', JSON.stringify(triggers))
    if (result.status === 200 && hxRedirect) {
      c.header('HX-Redirect', hxRedirect)
      return c.html('', httpStatus)
    }
    return c.html('', httpStatus)
  }
  const payload = await getProductPagePayload()
  return c.html(
    productPage(
      payload.products,
      payload.statuses,
      payload.suppliers,
      result.message,
      `text-sm uppercase tracking-[0.3em] ${textColor}`
    ),
    httpStatus
  )
}

export const registerProductRoutes = (app: Hono) => {
  app.get('/products', async (c) => {
    const queryParams = parseProductQueryParams(c.req)
    const { products, statuses, suppliers } = await getProductPagePayload({
      search: queryParams.search,
      sort: queryParams.sort,
      supplierIds: queryParams.supplierFilters,
      statusIds: queryParams.statusFilters,
    })
    return c.html(
      productPage(
        products,
        statuses,
        suppliers,
        '',
        'text-sm text-white/70 uppercase tracking-[0.3em]',
        queryParams.search,
        queryParams.sort,
        queryParams.supplierFilters,
        queryParams.statusFilters,
        queryParams.page
      )
    )
  })

  app.get('/products/manage', async (c) => {
    const payload = await getProductPagePayload()
    return c.html(productAddPage(payload))
  })

  app.post('/products/update', async (c) => {
    const form = await c.req.formData()
    const inlineCardId = (form.get('inlineCardId') ?? '').toString().trim() || undefined
    let parsed
    try {
      parsed = parseUpdateProductForm(form)
    } catch (error) {
      return respondWithProductFeedback(
        c,
        { status: 400, message: parseErrorMessage(error) },
        undefined,
        inlineCardId
      )
    }
    const result = await updateProductDetails({
      ...parsed,
    })
    const isHxRequest = c.req.header('HX-Request') === 'true'
    const queryParams = parseProductQueryParams(c.req)
    if (isHxRequest && inlineCardId) {
      if (result.status === 200) {
        const payload = await getProductPagePayload({
          search: queryParams.search,
          sort: queryParams.sort,
          supplierIds: queryParams.supplierFilters,
          statusIds: queryParams.statusFilters,
        })
        const trimmedSku = parsed.sku.trim()
        const updatedProduct = payload.products.find((product) => product.skuRaw === trimmedSku)
        const triggerDetail = inlineCardId ? { cardId: inlineCardId } : true
        c.header(
          'HX-Trigger',
          JSON.stringify({
            ...buildToastTrigger(result),
            'inline-panel-close': triggerDetail,
          })
        )
        if (updatedProduct) {
          const cardHtml = renderProductCard(updatedProduct, payload.statuses, payload.suppliers)
          return c.html(cardHtml, 200)
        }
        c.header('HX-Retarget', '#product-listings')
        const listingHtml = renderProductListingSection(
          payload.products,
          payload.statuses,
          payload.suppliers,
          queryParams
        )
        return c.html(listingHtml, 200)
      }
      const feedbackId = `${inlineCardId}-edit-feedback`
      c.header('HX-Retarget', `#${feedbackId}`)
      c.header('HX-Trigger', JSON.stringify(buildToastTrigger(result)))
      return c.html('', result.status)
    }
    return respondWithProductFeedback(c, result, undefined, inlineCardId)
  })

  app.post('/products/create', async (c) => {
    const form = await c.req.formData()
    let parsed
    try {
      parsed = parseCreateProductForm(form)
    } catch (error) {
      return respondWithProductFeedback(c, { status: 400, message: parseErrorMessage(error) })
    }
    const result = await createProduct(parsed)
    return respondWithProductFeedback(c, result, '/products')
  })

  app.post('/products/delete', async (c) => {
    const form = await c.req.formData()
    const sku = (form.get('sku') ?? '').toString()
    const inlineCardId = (form.get('inlineCardId') ?? '').toString().trim() || undefined
    const confirmation = (form.get('confirmation') ?? '').toString()
    const result = await deleteProduct({ sku, confirmation })
    const isHxRequest = c.req.header('HX-Request') === 'true'
    const queryParams = parseProductQueryParams(c.req)
    if (isHxRequest && inlineCardId) {
      if (result.status === 200) {
        const payload = await getProductPagePayload({
          search: queryParams.search,
          sort: queryParams.sort,
          supplierIds: queryParams.supplierFilters,
          statusIds: queryParams.statusFilters,
        })
        c.header(
          'HX-Trigger',
          JSON.stringify({
            ...buildToastTrigger(result),
            'inline-panel-close': { cardId: inlineCardId },
          })
        )
        c.header('HX-Retarget', '#product-listings')
        const listingHtml = renderProductListingSection(
          payload.products,
          payload.statuses,
          payload.suppliers,
          queryParams
        )
        return c.html(listingHtml, 200)
      }
      const feedbackId = `${inlineCardId}-delete-feedback`
      c.header('HX-Retarget', `#${feedbackId}`)
      c.header('HX-Trigger', JSON.stringify(buildToastTrigger(result)))
      return c.html('', result.status)
    }
    return respondWithProductFeedback(c, result, undefined, inlineCardId)
  })
}
