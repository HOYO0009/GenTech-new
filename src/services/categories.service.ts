import { recordChange } from './changeLogs.service'
import { ServiceResult, errorResult, successResult, ErrorMessages, SuccessMessages } from '../domain/results.domain'
import { CategoryRepository } from '../repositories/category.repository'
import { ICategoryRepository } from '../repositories/category.repository.interface'
import { db } from '../db/connection.db'
import type { CategoryWithUsage } from '../db/categories.db'

export type CategoryItem = CategoryWithUsage

export type CategoryOption = {
  id: number
  name: string
}

export interface CategoryPagePayload {
  categories: CategoryItem[]
  parentOptions: CategoryOption[]
}

const buildParentMap = (categories: CategoryWithUsage[]) =>
  categories.reduce((map, entry) => {
    map.set(entry.id, entry.parentId ?? null)
    return map
  }, new Map<number, number | null>())

const wouldCreateCycle = (
  categoryId: number,
  requestedParentId: number | null,
  parentMap: Map<number, number | null>
) => {
  if (requestedParentId === null) return false
  if (requestedParentId === categoryId) return true
  let current: number | null = requestedParentId
  const safetyLimit = parentMap.size + 1
  let hops = 0
  while (current !== null && hops < safetyLimit) {
    if (current === categoryId) return true
    current = parentMap.get(current) ?? null
    hops += 1
  }
  return false
}

export class CategoryService {
  constructor(private repository: ICategoryRepository) {}

  async getCategoryPagePayload(): Promise<CategoryPagePayload> {
    const categories = await this.repository.listCategoriesWithUsage()
    const sortedOptions: CategoryOption[] = [...categories]
      .map((entry) => ({ id: entry.id, name: entry.name }))
      .sort((a, b) => a.name.localeCompare(b.name))

    return {
      categories,
      parentOptions: sortedOptions,
    }
  }

  async createCategory({
    name,
    parentId,
  }: {
    name: string
    parentId: number | null
  }): Promise<ServiceResult> {
    const trimmedName = name.trim()
    if (!trimmedName) {
      return errorResult(ErrorMessages.REQUIRED_FIELD('Name'))
    }

    if (parentId !== null) {
      const parent = await this.repository.getCategoryById(parentId)
      if (!parent) {
        return errorResult(ErrorMessages.INVALID_SELECTION('parent category'))
      }
    }

    const existingByName = await this.repository.getCategoryByName(trimmedName)
    if (existingByName) {
      return errorResult(ErrorMessages.ALREADY_EXISTS('Category'), 400)
    }

    try {
      const id = await db.transaction(async (tx) => {
        const insertedId = await this.repository.insertCategory(
          {
            name: trimmedName,
            parentId,
          },
          tx
        )
        await recordChange(
          {
            tableName: 'categories',
            action: 'INSERT',
            description: `Category "${trimmedName}" created`,
            payload: { id: insertedId, name: trimmedName, parentId },
            source: 'categories/create',
          },
          tx
        )
        return insertedId
      })

      if (!id) {
        return errorResult(ErrorMessages.UNABLE_TO_CREATE('category'), 500)
      }
    } catch (error) {
      console.error('Unable to create category', error)
      return errorResult(ErrorMessages.UNABLE_TO_CREATE('category'), 500)
    }

    return successResult(SuccessMessages.CREATED('Category'))
  }

  async updateCategory({
    id,
    name,
    parentId,
  }: {
    id: number
    name: string
    parentId: number | null
  }): Promise<ServiceResult> {
    if (!Number.isInteger(id) || id <= 0) {
      return errorResult(ErrorMessages.INVALID_SELECTION('category'))
    }
    const trimmedName = name.trim()
    if (!trimmedName) {
      return errorResult(ErrorMessages.REQUIRED_FIELD('Name'))
    }

    const existing = await this.repository.getCategoryById(id)
    if (!existing) {
      return errorResult(ErrorMessages.NOT_FOUND('Category'), 404)
    }

    let normalizedParentId: number | null = parentId
    if (normalizedParentId !== null) {
      const parent = await this.repository.getCategoryById(normalizedParentId)
      if (!parent) {
        return errorResult(ErrorMessages.INVALID_SELECTION('parent category'))
      }
    }

    const categories = await this.repository.listCategoriesWithUsage()
    const parentMap = buildParentMap(categories)
    if (wouldCreateCycle(id, normalizedParentId, parentMap)) {
      return errorResult('Parent category would create a cycle.')
    }

    const existingByName = await this.repository.getCategoryByName(trimmedName)
    if (existingByName && existingByName.id !== id) {
      return errorResult(ErrorMessages.ALREADY_EXISTS('Category'), 400)
    }

    const hasChanges = existing.name !== trimmedName || (existing.parentId ?? null) !== (normalizedParentId ?? null)
    if (!hasChanges) {
      return successResult(ErrorMessages.NO_CHANGES)
    }

    let updated = false
    try {
      updated = await db.transaction(async (tx) => {
        const success = await this.repository.updateCategory(
          {
            id,
            name: trimmedName,
            parentId: normalizedParentId,
          },
          tx
        )
        if (!success) return false
        await recordChange(
          {
            tableName: 'categories',
            action: 'UPDATE',
            description: `Category "${existing.name}" updated`,
            payload: { id, name: trimmedName, parentId: normalizedParentId },
            source: 'categories/update',
          },
          tx
        )
        return true
      })
    } catch (error) {
      console.error('Unable to update category', error)
      return errorResult(ErrorMessages.UNABLE_TO_SAVE('category'), 500)
    }

    if (!updated) {
      return errorResult(ErrorMessages.UNABLE_TO_SAVE('category'), 500)
    }

    return {
      ...successResult(SuccessMessages.UPDATED('Category')),
      subject: trimmedName,
    }
  }

  async deleteCategory(id: number): Promise<ServiceResult> {
    if (!Number.isInteger(id) || id <= 0) {
      return errorResult(ErrorMessages.INVALID_SELECTION('category'))
    }

    const categories = await this.repository.listCategoriesWithUsage()
    const existing = categories.find((entry) => entry.id === id)
    if (!existing) {
      return errorResult(ErrorMessages.NOT_FOUND('Category'), 404)
    }
    if (existing.childCount > 0) {
      return errorResult('Cannot delete a category that has child categories.')
    }
    if (existing.productUsage > 0) {
      return errorResult('Cannot delete a category that is used by products.')
    }

    let deleted = false
    try {
      deleted = await db.transaction(async (tx) => {
        const success = await this.repository.deleteCategory(id, tx)
        if (!success) return false
        await recordChange(
          {
            tableName: 'categories',
            action: 'DELETE',
            description: `Category "${existing.name}" deleted`,
            payload: { id },
            source: 'categories/delete',
          },
          tx
        )
        return true
      })
    } catch (error) {
      console.error('Unable to delete category', error)
      return errorResult(ErrorMessages.UNABLE_TO_DELETE('category'), 500)
    }

    if (!deleted) {
      return errorResult(ErrorMessages.UNABLE_TO_DELETE('category'), 500)
    }

    return {
      ...successResult(SuccessMessages.DELETED('Category')),
      subject: existing.name,
      details: ['Deleted'],
    }
  }
}

const defaultCategoryService = new CategoryService(new CategoryRepository())

export async function getCategoryPagePayload(): Promise<CategoryPagePayload> {
  return defaultCategoryService.getCategoryPagePayload()
}

export async function createCategory(args: { name: string; parentId: number | null }): Promise<ServiceResult> {
  return defaultCategoryService.createCategory(args)
}

export async function updateCategory(args: {
  id: number
  name: string
  parentId: number | null
}): Promise<ServiceResult> {
  return defaultCategoryService.updateCategory(args)
}

export async function deleteCategory(id: number): Promise<ServiceResult> {
  return defaultCategoryService.deleteCategory(id)
}
