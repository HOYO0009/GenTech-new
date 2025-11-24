import { Hono } from 'hono'
import { z, ZodError } from 'zod'
import {
  addListingSku,
  createListing,
  deleteListing,
  deleteListingShop,
  getListingsPagePayload,
  getListingCardPayload,
  removeListingSku,
  saveListingShop,
  updateListing,
} from '../services/listings.service'
import { listingsPage } from '../ui/pages/listings.page'
import { renderListingCard } from '../ui/pages/listings.page'
import { getFeedbackClassByStatus, uiClasses } from '../ui/styles/classes.ui'

const requiredInteger = (label: string) =>
  z
    .string()
    .trim()
    .min(1, `${label} is required.`)
    .transform((value) => {
      const parsed = Number(value)
      if (!Number.isInteger(parsed) || parsed <= 0) {
        throw new Error(`Invalid ${label.toLowerCase()}.`)
      }
      return parsed
    })

const listingCodeSchema = z.string().trim().min(1, 'Listing code is required.')

const listingCreateSchema = z.object({
  listingCode: listingCodeSchema,
})

const listingUpdateSchema = z.object({
  id: requiredInteger('Listing'),
  listingCode: listingCodeSchema,
})

const listingDeleteSchema = z.object({
  id: requiredInteger('Listing'),
  confirmation: z.string().trim().min(1, 'Confirmation is required.'),
})

const listingShopSaveSchema = z.object({
  listingId: requiredInteger('Listing'),
  shopId: requiredInteger('Shop'),
  title: z.string(),
  description: z.string(),
})

const listingShopDeleteSchema = z.object({
  listingId: requiredInteger('Listing'),
  shopId: requiredInteger('Shop'),
})

const listingSkuSchema = z.object({
  listingId: requiredInteger('Listing'),
  productSku: z.string().trim().min(1, 'SKU is required.'),
})

const parseErrorMessage = (error: unknown, fallback = 'Invalid input.') =>
  error instanceof ZodError ? error.errors[0]?.message ?? fallback : (error as Error).message

const hxRequest = (req: { header: (name: string) => string | undefined }) => req.header('HX-Request') === 'true'

const hxError = (c: any, message: string, status = 400) => {
  const payload = buildToastTrigger({ status, message })
  c.header('HX-Trigger', JSON.stringify(payload))
  c.header('HX-Trigger-After-Swap', JSON.stringify(payload))
  c.header('HX-Reswap', 'none')
  return c.text(message, status)
}

const buildToastTrigger = (result: { status: number; message: string; subject?: string; details?: string[] }) => ({
  toast: {
    status: result.status,
    message: result.message,
    subject: result.subject,
    details: result.details,
  },
})

const renderCardResponse = async (listingId: number, status = 200) => {
  const payload = await getListingCardPayload(listingId)
  if (!payload) return { status: 404 as const, body: null }
  const html = renderListingCard(payload.listing, payload.shops, payload.products)
  return { status, body: html }
}

const parseListingQuery = (req: { header: (name: string) => string | undefined; url: string }) => {
  const sourceUrl = req.header('HX-Current-URL') || req.url
  try {
    const parsed = new URL(sourceUrl, 'http://localhost')
    const pageParam = parsed.searchParams.get('page')
    const pageValue = pageParam ? Number(pageParam) : NaN
    const page = Number.isInteger(pageValue) && pageValue > 0 ? pageValue : 1
    return { page }
  } catch {
    return { page: 1 }
  }
}

const sendHxResult = async (
  c: any,
  listingId: number,
  result: { status: number; message: string; subject?: string; details?: string[] }
) => {
  const card = await renderCardResponse(listingId, result.status)
  const cardId = `listing-${listingId}`
  const triggerPayload = { ...buildToastTrigger(result), 'inline-panel-close': { cardId } }
  if (result.status === 200 && card.body) {
    c.header('HX-Trigger', JSON.stringify(triggerPayload))
    c.header('HX-Trigger-After-Swap', JSON.stringify(triggerPayload))
    return c.html(card.body, result.status)
  }
  c.header('HX-Trigger', JSON.stringify(buildToastTrigger(result)))
  c.header('HX-Trigger-After-Swap', JSON.stringify(buildToastTrigger(result)))
  c.header('HX-Reswap', 'none')
  return c.text(result.message, result.status)
}

export const registerListingRoutes = (app: Hono) => {
  app.get('/listings', async (c) => {
    const payload = await getListingsPagePayload()
    const { page } = parseListingQuery(c.req)
    return c.html(listingsPage(payload, '', uiClasses.text.feedback, page))
  })

  app.post('/listings/create', async (c) => {
    const form = await c.req.formData()
    let parsed
    try {
      parsed = listingCreateSchema.parse({
        listingCode: (form.get('listingCode') ?? '').toString(),
      })
    } catch (error) {
      const payload = await getListingsPagePayload()
      const message = parseErrorMessage(error)
      const { page } = parseListingQuery(c.req)
      return c.html(listingsPage(payload, message, getFeedbackClassByStatus(400), page), 400)
    }

    const result = await createListing(parsed)
    if (hxRequest(c.req)) {
      c.header('HX-Trigger', JSON.stringify({ ...buildToastTrigger(result), 'inline-panel-close': true }))
      return c.redirect('/listings', result.status)
    }
    if (result.status === 200) {
      return c.redirect('/listings', 303)
    }
    const payload = await getListingsPagePayload()
    const { page } = parseListingQuery(c.req)
    return c.html(listingsPage(payload, result.message, getFeedbackClassByStatus(result.status), page), result.status)
  })

  app.post('/listings/update', async (c) => {
    const form = await c.req.formData()
    let parsed
    try {
      parsed = listingUpdateSchema.parse({
        id: (form.get('id') ?? '').toString(),
        listingCode: (form.get('listingCode') ?? '').toString(),
      })
    } catch (error) {
      const message = parseErrorMessage(error)
      if (hxRequest(c.req)) {
        return hxError(c, message, 400)
      }
      const payload = await getListingsPagePayload()
      const { page } = parseListingQuery(c.req)
      return c.html(listingsPage(payload, message, getFeedbackClassByStatus(400), page), 400)
    }

    console.debug('[listings:update] incoming', {
      id: parsed.id,
      listingCode: parsed.listingCode,
      shopFields: Array.from(form.entries())
        .filter(([key]) => typeof key === 'string' && /^shop(title|description)-\d+$/i.test(key as string))
        .map(([key]) => key),
    })
    const shopDetails: Array<{ shopId: number; title: string; description: string }> = []
    for (const [key, value] of form.entries()) {
      if (typeof key !== 'string') continue
      const match = key.match(/^shop(title|description)-(\d+)$/i)
      if (!match) continue
      const field = match[1]
      const shopId = Number(match[2])
      if (!Number.isInteger(shopId) || shopId <= 0) continue
      const entry =
        shopDetails.find((item) => item.shopId === shopId) ??
        (() => {
          const obj = { shopId, title: '', description: '' }
          shopDetails.push(obj)
          return obj
        })()
      const text = (value ?? '').toString()
      if (field === 'title') entry.title = text
      if (field === 'description') entry.description = text
    }

    const result = await updateListing({ ...parsed, shopDetails })
    console.debug('[listings:update] result', { status: result.status, message: result.message, subject: result.subject })
    if (hxRequest(c.req)) {
      return sendHxResult(c, parsed.id, result)
    }
    if (result.status === 200) {
      return c.redirect('/listings', 303)
    }
    const payload = await getListingsPagePayload()
    const { page } = parseListingQuery(c.req)
    return c.html(listingsPage(payload, result.message, getFeedbackClassByStatus(result.status), page), result.status)
  })

  app.post('/listings/delete', async (c) => {
    const form = await c.req.formData()
    let parsed
    try {
      parsed = listingDeleteSchema.parse({
        id: (form.get('id') ?? '').toString(),
        confirmation: (form.get('confirmation') ?? '').toString(),
      })
    } catch (error) {
      const payload = await getListingsPagePayload()
      const message = parseErrorMessage(error)
      const { page } = parseListingQuery(c.req)
      return c.html(listingsPage(payload, message, getFeedbackClassByStatus(400), page), 400)
    }

    const result = await deleteListing(parsed)
    if (hxRequest(c.req)) {
      c.header('HX-Trigger', JSON.stringify(buildToastTrigger(result)))
      c.header('HX-Trigger-After-Swap', JSON.stringify(buildToastTrigger(result)))
      if (result.status === 200) {
        c.header('HX-Redirect', '/listings')
        return c.html('', 200)
      }
      return c.html('', result.status)
    }
    if (result.status === 200) {
      return c.redirect('/listings', 303)
    }
    const payload = await getListingsPagePayload()
    const { page } = parseListingQuery(c.req)
    return c.html(listingsPage(payload, result.message, getFeedbackClassByStatus(result.status), page), result.status)
  })

  app.post('/listings/shop/save', async (c) => {
    const form = await c.req.formData()
    let parsed
    try {
      parsed = listingShopSaveSchema.parse({
        listingId: (form.get('listingId') ?? '').toString(),
        shopId: (form.get('shopId') ?? '').toString(),
        title: (form.get('title') ?? '').toString(),
        description: (form.get('description') ?? '').toString(),
      })
    } catch (error) {
      const message = parseErrorMessage(error)
      if (hxRequest(c.req)) {
        return hxError(c, message, 400)
      }
      const payload = await getListingsPagePayload()
      const { page } = parseListingQuery(c.req)
      return c.html(listingsPage(payload, message, getFeedbackClassByStatus(400), page), 400)
    }

    const result = await saveListingShop(parsed)
    if (hxRequest(c.req)) {
      return sendHxResult(c, parsed.listingId, result)
    }
    if (result.status === 200) {
      return c.redirect('/listings', 303)
    }
    const payload = await getListingsPagePayload()
    const { page } = parseListingQuery(c.req)
    return c.html(listingsPage(payload, result.message, getFeedbackClassByStatus(result.status), page), result.status)
  })

  app.post('/listings/shop/delete', async (c) => {
    const form = await c.req.formData()
    let parsed
    try {
      parsed = listingShopDeleteSchema.parse({
        listingId: (form.get('listingId') ?? '').toString(),
        shopId: (form.get('shopId') ?? '').toString(),
      })
    } catch (error) {
      const message = parseErrorMessage(error)
      if (hxRequest(c.req)) {
        return hxError(c, message, 400)
      }
      const payload = await getListingsPagePayload()
      const { page } = parseListingQuery(c.req)
      return c.html(listingsPage(payload, message, getFeedbackClassByStatus(400), page), 400)
    }

    const result = await deleteListingShop(parsed.listingId, parsed.shopId)
    if (hxRequest(c.req)) {
      return sendHxResult(c, parsed.listingId, result)
    }
    if (result.status === 200) {
      return c.redirect('/listings', 303)
    }
    const payload = await getListingsPagePayload()
    const { page } = parseListingQuery(c.req)
    return c.html(listingsPage(payload, result.message, getFeedbackClassByStatus(result.status), page), result.status)
  })

  app.post('/listings/sku/add', async (c) => {
    const form = await c.req.formData()
    let parsed
    try {
      parsed = listingSkuSchema.parse({
        listingId: (form.get('listingId') ?? '').toString(),
        productSku: (form.get('productSku') ?? '').toString(),
      })
    } catch (error) {
      const message = parseErrorMessage(error)
      if (hxRequest(c.req)) {
        return hxError(c, message, 400)
      }
      const payload = await getListingsPagePayload()
      const { page } = parseListingQuery(c.req)
      return c.html(listingsPage(payload, message, getFeedbackClassByStatus(400), page), 400)
    }

    const result = await addListingSku(parsed)
    if (hxRequest(c.req)) {
      return sendHxResult(c, parsed.listingId, result)
    }
    if (result.status === 200) {
      return c.redirect('/listings', 303)
    }
    const payload = await getListingsPagePayload()
    return c.html(listingsPage(payload, result.message, getFeedbackClassByStatus(result.status)), result.status)
  })

  app.post('/listings/sku/remove', async (c) => {
    const form = await c.req.formData()
    let parsed
    try {
      parsed = listingSkuSchema.parse({
        listingId: (form.get('listingId') ?? '').toString(),
        productSku: (form.get('productSku') ?? '').toString(),
      })
    } catch (error) {
      const message = parseErrorMessage(error)
      if (hxRequest(c.req)) {
        return hxError(c, message, 400)
      }
      const payload = await getListingsPagePayload()
      return c.html(listingsPage(payload, message, getFeedbackClassByStatus(400)), 400)
    }

    const result = await removeListingSku(parsed)
    if (hxRequest(c.req)) {
      return sendHxResult(c, parsed.listingId, result)
    }
    if (result.status === 200) {
      return c.redirect('/listings', 303)
    }
    const payload = await getListingsPagePayload()
    const { page } = parseListingQuery(c.req)
    return c.html(listingsPage(payload, result.message, getFeedbackClassByStatus(result.status), page), result.status)
  })
}
