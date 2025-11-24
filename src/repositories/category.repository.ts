import { ICategoryRepository } from './category.repository.interface'
import { DbClient } from '../db/connection.db'
import {
  deleteCategory as dbDeleteCategory,
  getCategoryById as dbGetCategoryById,
  getCategoryByName as dbGetCategoryByName,
  insertCategory as dbInsertCategory,
  listCategoriesWithUsage as dbListCategoriesWithUsage,
  updateCategory as dbUpdateCategory,
} from '../db/categories.db'
import type { CategoryWithUsage } from '../db/categories.db'

export class CategoryRepository implements ICategoryRepository {
  async listCategoriesWithUsage(executor?: DbClient): Promise<CategoryWithUsage[]> {
    return dbListCategoriesWithUsage(executor)
  }

  async getCategoryById(id: number, executor?: DbClient): Promise<CategoryWithUsage | null> {
    return dbGetCategoryById(id, executor)
  }

  async getCategoryByName(name: string, executor?: DbClient): Promise<CategoryWithUsage | null> {
    return dbGetCategoryByName(name, executor)
  }

  async insertCategory(
    args: { name: string; parentId: number | null },
    executor?: DbClient
  ): Promise<number> {
    return dbInsertCategory(args, executor)
  }

  async updateCategory(
    args: { id: number; name: string; parentId: number | null },
    executor?: DbClient
  ): Promise<boolean> {
    return dbUpdateCategory(args, executor)
  }

  async deleteCategory(id: number, executor?: DbClient): Promise<boolean> {
    return dbDeleteCategory(id, executor)
  }
}
