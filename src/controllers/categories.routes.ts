import { Hono } from 'hono'
import { z, ZodError } from 'zod'
import {
  createCategory,
  deleteCategory,
  getCategoryPagePayload,
  updateCategory,
} from '../services/categories.service'
import { categoriesPage } from '../ui/pages/categories.page'
import { getFeedbackClassByStatus } from '../ui/styles/classes.ui'

const parseParentId = (value: string) => {
  const trimmed = value.trim()
  if (!trimmed) return null
  const parsed = Number(trimmed)
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error('Invalid parent selection.')
  }
  return parsed
}

const categoryCreateSchema = z.object({
  name: z.string().trim().min(1, 'Name is required.'),
  parentId: z.string().transform(parseParentId),
})

const categoryUpdateSchema = categoryCreateSchema.extend({
  id: z
    .string()
    .trim()
    .min(1, 'Category selection is required.')
    .transform((value) => {
      const parsed = Number(value)
      if (!Number.isInteger(parsed) || parsed <= 0) {
        throw new Error('Invalid category selection.')
      }
      return parsed
    }),
})

const categoryDeleteSchema = z.object({
  id: z
    .string()
    .trim()
    .min(1, 'Category selection is required.')
    .transform((value) => {
      const parsed = Number(value)
      if (!Number.isInteger(parsed) || parsed <= 0) {
        throw new Error('Invalid category selection.')
      }
      return parsed
    }),
})

const parseErrorMessage = (error: unknown, fallback = 'Invalid input.') =>
  error instanceof ZodError ? error.errors[0]?.message ?? fallback : (error as Error).message

export const registerCategoryRoutes = (app: Hono) => {
  app.get('/categories', async (c) => {
    const payload = await getCategoryPagePayload()
    return c.html(categoriesPage(payload))
  })

  app.post('/categories/create', async (c) => {
    const form = await c.req.formData()
    let parsed
    try {
      parsed = categoryCreateSchema.parse({
        name: (form.get('name') ?? '').toString(),
        parentId: (form.get('parentId') ?? '').toString(),
      })
    } catch (error) {
      const payload = await getCategoryPagePayload()
      const message = parseErrorMessage(error)
      return c.html(
        categoriesPage(payload, message, getFeedbackClassByStatus(400)),
        400
      )
    }

    const result = await createCategory(parsed)
    const payload = await getCategoryPagePayload()
    return c.html(categoriesPage(payload, result.message, getFeedbackClassByStatus(result.status)), result.status)
  })

  app.post('/categories/update', async (c) => {
    const form = await c.req.formData()
    let parsed
    try {
      parsed = categoryUpdateSchema.parse({
        id: (form.get('id') ?? '').toString(),
        name: (form.get('name') ?? '').toString(),
        parentId: (form.get('parentId') ?? '').toString(),
      })
    } catch (error) {
      const payload = await getCategoryPagePayload()
      const message = parseErrorMessage(error)
      return c.html(
        categoriesPage(payload, message, getFeedbackClassByStatus(400)),
        400
      )
    }

    const result = await updateCategory(parsed)
    const payload = await getCategoryPagePayload()
    return c.html(categoriesPage(payload, result.message, getFeedbackClassByStatus(result.status)), result.status)
  })

  app.post('/categories/delete', async (c) => {
    const form = await c.req.formData()
    let parsed
    try {
      parsed = categoryDeleteSchema.parse({
        id: (form.get('id') ?? '').toString(),
      })
    } catch (error) {
      const payload = await getCategoryPagePayload()
      const message = parseErrorMessage(error)
      return c.html(
        categoriesPage(payload, message, getFeedbackClassByStatus(400)),
        400
      )
    }

    const result = await deleteCategory(parsed.id)
    const payload = await getCategoryPagePayload()
    return c.html(categoriesPage(payload, result.message, getFeedbackClassByStatus(result.status)), result.status)
  })
}
