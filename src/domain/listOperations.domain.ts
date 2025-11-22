import { containsTerm, normalizeTerm } from './search.domain'
import { sortByString } from './sort.domain'
import { filterByIds } from './filter.domain'

/**
 * Generic list operations abstraction
 * Provides standardized search, filter, and sort capabilities
 */

/**
 * Configuration for ID-based filtering
 */
export interface IdFilter<T> {
  selector: (item: T) => number | null
  ids?: number[]
}

/**
 * Configuration for string-based sorting
 */
export interface SortConfig<T> {
  selector: (item: T) => string
  direction: 'asc' | 'desc'
}

/**
 * Configuration for date-based sorting
 */
export interface DateSortConfig<T> {
  selector: (item: T) => Date
  direction: 'asc' | 'desc'
}

/**
 * Combined sort configuration
 */
export type SortOption<T> =
  | { type: 'string'; config: SortConfig<T> }
  | { type: 'date'; config: DateSortConfig<T> }

/**
 * Complete list operations configuration
 */
export interface ListOperations<T> {
  searchFields: (item: T) => string[]
  idFilters?: IdFilter<T>[]
  sortOptions: Record<string, SortOption<T>>
  defaultSort: string
}

/**
 * Options for applying list operations
 */
export interface ApplyListOptions {
  search?: string
  sort?: string
}

/**
 * Creates a list operations handler
 *
 * @param operations - Configuration for search, filter, and sort
 * @returns A function that applies operations to a list
 *
 * @example
 * ```typescript
 * const applyVoucherOperations = createListOperations<VoucherListItem>({
 *   searchFields: (v) => [v.shopName, v.voucherCategoryLabel],
 *   idFilters: [{ selector: (v) => v.shopId }],
 *   sortOptions: {
 *     'date-desc': { type: 'date', config: { selector: (v) => v.createdAtRaw, direction: 'desc' } },
 *     'shop-asc': { type: 'string', config: { selector: (v) => v.shopName, direction: 'asc' } },
 *   },
 *   defaultSort: 'date-desc',
 * })
 * ```
 */
export function createListOperations<T>(operations: ListOperations<T>) {
  return (items: T[], options?: ApplyListOptions & { [key: string]: number[] | undefined }): T[] => {
    // Apply search filter
    const term = normalizeTerm(options?.search)
    let filtered = term
      ? items.filter((item) => {
          const fields = operations.searchFields(item)
          return fields.some((field) => containsTerm(field, term))
        })
      : items

    // Apply ID filters
    if (operations.idFilters) {
      for (const idFilter of operations.idFilters) {
        const filterKey = Object.keys(options || {}).find((key) => {
          const val = options?.[key]
          return Array.isArray(val) && val.every((v) => typeof v === 'number')
        })
        if (filterKey) {
          const ids = options?.[filterKey] as number[] | undefined
          if (ids && ids.length > 0) {
            filtered = filterByIds(filtered, ids, idFilter.selector)
          }
        }
      }
    }

    // Apply sorting
    const sortKey = options?.sort || operations.defaultSort
    const sortOption = operations.sortOptions[sortKey]

    if (sortOption) {
      if (sortOption.type === 'string') {
        const { selector, direction } = sortOption.config
        return sortByString(filtered, selector, direction)
      } else if (sortOption.type === 'date') {
        const { selector, direction } = sortOption.config
        const dir = direction === 'asc' ? 1 : -1
        return [...filtered].sort((a, b) => {
          return (selector(a).getTime() - selector(b).getTime()) * dir
        })
      }
    }

    return filtered
  }
}

/**
 * Simplified version for applying common operations
 */
export function applySearchSortFilter<T>(
  items: T[],
  options: {
    search?: string
    searchFields: (item: T) => string[]
    sort?: string
    sortOptions: Record<string, SortOption<T>>
    defaultSort: string
    idFilters?: Array<{
      selector: (item: T) => number | null
      ids?: number[]
    }>
  }
): T[] {
  const operations: ListOperations<T> = {
    searchFields: options.searchFields,
    idFilters: options.idFilters,
    sortOptions: options.sortOptions,
    defaultSort: options.defaultSort,
  }

  const apply = createListOperations(operations)
  return apply(items, options)
}
