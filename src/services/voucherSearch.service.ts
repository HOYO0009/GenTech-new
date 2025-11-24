import { IFilterStrategy } from '../domain/strategies/filterStrategy.interface'
import { ISortStrategy } from '../domain/strategies/sortStrategy.interface'
import { SearchFilterStrategy } from '../domain/strategies/searchFilter.strategy'
import { IdFilterStrategy } from '../domain/strategies/idFilter.strategy'
import { VoucherSortStrategy, VoucherSortOption } from '../domain/strategies/voucherSort.strategy'
import { VoucherListItem } from './voucherTransformation.service'

export interface VoucherSearchSortOptions {
  search?: string
  sort?: VoucherSortOption
  shopIds?: number[]
  page?: number
}

export class VoucherSearchService {
  applySearchSortFilter(
    vouchers: VoucherListItem[],
    options?: VoucherSearchSortOptions
  ): VoucherListItem[] {
    const filters: IFilterStrategy<VoucherListItem>[] = []

    filters.push(
      new SearchFilterStrategy<VoucherListItem>(options?.search, [
        (v) => v.shopName,
        (v) => v.voucherCategoryLabel,
        (v) => v.voucherDiscountTypeLabel,
      ])
    )

    filters.push(
      new IdFilterStrategy<VoucherListItem>(
        options?.shopIds,
        (v) => v.shopId
      )
    )

    let filtered = vouchers
    for (const filter of filters) {
      filtered = filter.filter(filtered)
    }

    const allowedSorts: VoucherSortOption[] = [
      'min-spend-asc',
      'min-spend-desc',
      'max-discount-asc',
      'max-discount-desc',
    ]
    const sortOption: VoucherSortOption =
      options?.sort && allowedSorts.includes(options.sort)
        ? options.sort
        : 'min-spend-asc'

    const sortStrategy: ISortStrategy<VoucherListItem> = new VoucherSortStrategy(sortOption)
    return sortStrategy.sort(filtered)
  }
}
