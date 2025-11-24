import { ISortStrategy } from './sortStrategy.interface'

export type VoucherSortableItem = {
  shopName: string
  minSpend: number
  maxDiscount: number | null
}

export type VoucherSortOption = 'min-spend-asc' | 'min-spend-desc' | 'max-discount-asc' | 'max-discount-desc'

export class VoucherSortStrategy<T extends VoucherSortableItem> implements ISortStrategy<T> {
  constructor(private sortOption: VoucherSortOption) {}

  sort(items: T[]): T[] {
    if (this.sortOption === 'min-spend-asc' || this.sortOption === 'min-spend-desc') {
      const dir = this.sortOption.endsWith('desc') ? -1 : 1
      return [...items].sort((a, b) => (a.minSpend - b.minSpend) * dir)
    }

    // max discount: null means unlimited, treat as Infinity for ascending so it sorts last
    const normalizeMax = (value: number | null) => (value === null ? Number.POSITIVE_INFINITY : value)
    const dir = this.sortOption.endsWith('desc') ? -1 : 1
    return [...items].sort((a, b) => (normalizeMax(a.maxDiscount) - normalizeMax(b.maxDiscount)) * dir)
  }
}
