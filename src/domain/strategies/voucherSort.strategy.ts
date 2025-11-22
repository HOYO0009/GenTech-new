import { ISortStrategy } from './sortStrategy.interface'
import { sortByString } from '../sort.domain'

export type VoucherSortableItem = {
  shopName: string
  createdAtRaw: Date
}

export type VoucherSortOption = 'date-desc' | 'date-asc' | 'shop-asc' | 'shop-desc'

export class VoucherSortStrategy<T extends VoucherSortableItem> implements ISortStrategy<T> {
  constructor(private sortOption: VoucherSortOption) {}

  sort(items: T[]): T[] {
    if (this.sortOption === 'shop-asc' || this.sortOption === 'shop-desc') {
      return sortByString(items, (item) => item.shopName, this.sortOption.endsWith('desc') ? 'desc' : 'asc')
    }

    const dir = this.sortOption === 'date-asc' ? 1 : -1
    return [...items].sort((a, b) => {
      return (a.createdAtRaw.getTime() - b.createdAtRaw.getTime()) * dir
    })
  }
}
