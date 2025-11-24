import { eq } from 'drizzle-orm'
import { db, type DbClient } from './connection.db'
import { categories, products } from './schema.db'

export type CategoryWithUsage = {
  id: number
  name: string
  parentId: number | null
  parentName: string | null
  productUsage: number
  childCount: number
}

export async function listCategoriesWithUsage(executor: DbClient = db): Promise<CategoryWithUsage[]> {
  const rows = await executor
    .select({
      id: categories.id,
      name: categories.name,
      parentId: categories.parentId,
    })
    .from(categories)
    .orderBy(categories.name)

  const nameById = new Map(rows.map(({ id, name }) => [id, name]))
  const childCount = new Map<number, number>()
  for (const row of rows) {
    if (row.parentId) {
      childCount.set(row.parentId, (childCount.get(row.parentId) ?? 0) + 1)
    }
  }

  const productLinks = await executor
    .select({
      categoryId: products.categoryId,
      subcategoryId: products.subcategoryId,
    })
    .from(products)

  const usageCount = new Map<number, number>()
  for (const link of productLinks) {
    if (link.categoryId) {
      usageCount.set(link.categoryId, (usageCount.get(link.categoryId) ?? 0) + 1)
    }
    if (link.subcategoryId) {
      usageCount.set(link.subcategoryId, (usageCount.get(link.subcategoryId) ?? 0) + 1)
    }
  }

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    parentId: row.parentId,
    parentName: row.parentId ? nameById.get(row.parentId) ?? null : null,
    productUsage: usageCount.get(row.id) ?? 0,
    childCount: childCount.get(row.id) ?? 0,
  }))
}

export async function getCategoryById(id: number, executor: DbClient = db) {
  const rows = await listCategoriesWithUsage(executor)
  return rows.find((entry) => entry.id === id) ?? null
}

export async function getCategoryByName(name: string, executor: DbClient = db) {
  const normalized = name.trim().toLowerCase()
  if (!normalized) {
    return null
  }
  const rows = await listCategoriesWithUsage(executor)
  return rows.find((entry) => entry.name.toLowerCase() === normalized) ?? null
}

export async function insertCategory(
  { name, parentId }: { name: string; parentId: number | null },
  executor: DbClient = db
): Promise<number> {
  const rows = await executor
    .insert(categories)
    .values({ name, parentId })
    .returning({ id: categories.id })
    .all()

  return rows[0]?.id ?? 0
}

export async function updateCategory(
  { id, name, parentId }: { id: number; name: string; parentId: number | null },
  executor: DbClient = db
): Promise<boolean> {
  const result = await executor
    .update(categories)
    .set({ name, parentId })
    .where(eq(categories.id, id))
    .run()
  const changes = (result as { changes?: number } | undefined)?.changes ?? 0
  return changes > 0
}

export async function deleteCategory(id: number, executor: DbClient = db): Promise<boolean> {
  const result = await executor.delete(categories).where(eq(categories.id, id)).run()
  const changes = (result as { changes?: number } | undefined)?.changes ?? 0
  return changes > 0
}
