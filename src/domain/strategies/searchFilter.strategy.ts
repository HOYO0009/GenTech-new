import { IFilterStrategy } from './filterStrategy.interface'
import { containsTerm, normalizeTerm } from '../search.domain'

export class SearchFilterStrategy<T> implements IFilterStrategy<T> {
  private normalizedTerm: string

  constructor(
    searchTerm: string | undefined,
    private searchableFields: Array<(item: T) => string>
  ) {
    this.normalizedTerm = normalizeTerm(searchTerm)
  }

  filter(items: T[]): T[] {
    if (!this.normalizedTerm) {
      return items
    }

    return items.filter((item) =>
      this.searchableFields.some((getField) =>
        containsTerm(getField(item), this.normalizedTerm)
      )
    )
  }
}
