import { ISortStrategy } from './sortStrategy.interface'
import { sortByString } from '../sort.domain'

export type ProductSortableItem = {
  sku: string
  name: string
}

export type ProductSortOption = 'name-asc' | 'name-desc' | 'sku-asc' | 'sku-desc'

export class ProductSortStrategy<T extends ProductSortableItem> implements ISortStrategy<T> {
  constructor(private sortOption: ProductSortOption) {}

  sort(items: T[]): T[] {
    if (this.sortOption.startsWith('sku-')) {
      return sortByString(items, (item) => item.sku, this.sortOption.endsWith('desc') ? 'desc' : 'asc')
    }
    return sortByString(items, (item) => item.name, this.sortOption.endsWith('desc') ? 'desc' : 'asc')
  }
}
