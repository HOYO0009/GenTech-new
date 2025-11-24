import { Hono } from 'hono'
import { z, ZodError } from 'zod'
import { addShopFee, getFeesPagePayload, type FeeType } from '../services/fees.service'
import { feesPage } from '../ui/pages/fees.page.ts'
import { feesAddPage } from '../ui/pages/feesAdd.page.ts'
import { uiClasses } from '../ui/styles/classes.ui'

const allShopsValue = 'global'

const requiredShopSelection = (label: string) =>
  z
    .string()
    .trim()
    .transform((value) => {
      if (!value) {
        throw new Error(`${label} is required.`)
      }
      if (value === allShopsValue) return null
      const parsed = Number(value)
      if (!Number.isFinite(parsed) || !Number.isInteger(parsed)) {
        throw new Error(`${label} must be an integer.`)
      }
      return parsed
    })

const requiredNumber = (label: string) =>
  z
    .string()
    .trim()
    .min(1, `${label} is required.`)
    .transform((value) => {
      const parsed = Number(value)
      if (!Number.isFinite(parsed)) {
        throw new Error(`${label} must be a number.`)
      }
      return parsed
    })

const feeFormSchema = z.object({
  shopId: requiredShopSelection('Shop'),
  feeType: z.enum(['fixed', 'percentage']),
  amount: requiredNumber('Amount'),
  label: z.string().trim().optional(),
})

const parseErrorMessage = (error: unknown, fallback = 'Invalid input.') =>
  error instanceof ZodError ? error.errors[0]?.message ?? fallback : (error as Error).message

export const registerFeeRoutes = (app: Hono) => {
  app.get('/fees', async (c) => {
    const feedbackMessage = c.req.query('message') ?? ''
    const feedbackStatus = Number(c.req.query('status')) || 0
    const feedbackClass =
      feedbackStatus === 200 ? uiClasses.text.feedbackSuccess : feedbackMessage ? uiClasses.text.feedbackError : uiClasses.text.feedback

    const payload = await getFeesPagePayload()
    return c.html(feesPage(payload, feedbackMessage, feedbackClass))
  })

  app.get('/fees/manage', async (c) => {
    const payload = await getFeesPagePayload()
    return c.html(feesAddPage(payload))
  })

  app.post('/fees/create', async (c) => {
    const form = await c.req.formData()
    let parsed
    try {
        parsed = feeFormSchema.parse({
          shopId: (form.get('shopId') ?? '').toString(),
        feeType: (form.get('feeType') ?? '').toString(),
        amount: (form.get('amount') ?? '').toString(),
        label: (form.get('label') ?? '').toString(),
      })
    } catch (error) {
      const payload = await getFeesPagePayload()
      return c.html(feesPage(payload, parseErrorMessage(error), uiClasses.text.feedbackError), 400)
    }

    const result = await addShopFee({
      shopId: parsed.shopId,
      feeType: parsed.feeType as FeeType,
      amount: parsed.amount,
      label: parsed.label,
    })

    const isHx = c.req.header('HX-Request') === 'true'
    if (isHx) {
      const feedbackClass =
        result.status === 200 ? uiClasses.text.feedbackSuccess : uiClasses.text.feedbackError
      return c.html(`<div class="${feedbackClass}">${result.message}</div>`, result.status)
    }

    const payload = await getFeesPagePayload()
    const feedbackClass =
      result.status === 200 ? uiClasses.text.feedbackSuccess : uiClasses.text.feedbackError
    return c.html(feesPage(payload, result.message, feedbackClass), result.status)
  })
}
