export interface ISortStrategy<T> {
  sort(items: T[]): T[]
}
