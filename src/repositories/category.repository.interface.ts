import { DbClient } from '../db/connection.db'
import { CategoryWithUsage } from '../db/categories.db'

export interface ICategoryRepository {
  listCategoriesWithUsage(executor?: DbClient): Promise<CategoryWithUsage[]>
  getCategoryById(id: number, executor?: DbClient): Promise<CategoryWithUsage | null>
  getCategoryByName(name: string, executor?: DbClient): Promise<CategoryWithUsage | null>
  insertCategory(args: { name: string; parentId: number | null }, executor?: DbClient): Promise<number>
  updateCategory(
    args: { id: number; name: string; parentId: number | null },
    executor?: DbClient
  ): Promise<boolean>
  deleteCategory(id: number, executor?: DbClient): Promise<boolean>
}
