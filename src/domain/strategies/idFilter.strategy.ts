import { IFilterStrategy } from './filterStrategy.interface'
import { filterByIds } from '../filter.domain'

export class IdFilterStrategy<T> implements IFilterStrategy<T> {
  constructor(
    private ids: number[] | undefined,
    private getIdFromItem: (item: T) => number | null
  ) {}

  filter(items: T[]): T[] {
    return filterByIds(items, this.ids, this.getIdFromItem)
  }
}
