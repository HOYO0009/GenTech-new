export interface IFilterStrategy<T> {
  filter(items: T[]): T[]
}
