import { IFilterStrategy } from '../domain/strategies/filterStrategy.interface'
import { ISortStrategy } from '../domain/strategies/sortStrategy.interface'
import { SearchFilterStrategy } from '../domain/strategies/searchFilter.strategy'
import { IdFilterStrategy } from '../domain/strategies/idFilter.strategy'
import { ProductSortStrategy, ProductSortOption } from '../domain/strategies/productSort.strategy'
import { ProductCard } from './productTransformation.service'

export interface ProductSearchSortOptions {
  search?: string
  sort?: ProductSortOption
  supplierIds?: number[]
  statusIds?: number[]
}

export class ProductSearchService {
  applySearchSortFilter(
    products: ProductCard[],
    options?: ProductSearchSortOptions
  ): ProductCard[] {
    const filters: IFilterStrategy<ProductCard>[] = []

    filters.push(
      new SearchFilterStrategy<ProductCard>(options?.search, [
        (p) => p.name,
        (p) => p.sku,
        (p) => p.supplierName ?? '',
      ])
    )

    filters.push(
      new IdFilterStrategy<ProductCard>(
        options?.supplierIds,
        (p) => p.supplierId
      )
    )

    filters.push(
      new IdFilterStrategy<ProductCard>(
        options?.statusIds,
        (p) => p.statusId
      )
    )

    let filtered = products
    for (const filter of filters) {
      filtered = filter.filter(filtered)
    }

    const sortOption: ProductSortOption =
      options?.sort && ['name-asc', 'name-desc', 'sku-asc', 'sku-desc'].includes(options.sort)
        ? options.sort
        : 'name-asc'

    const sortStrategy: ISortStrategy<ProductCard> = new ProductSortStrategy(sortOption)
    return sortStrategy.sort(filtered)
  }
}
