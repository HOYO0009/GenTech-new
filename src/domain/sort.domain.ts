export type SortDirection = 'asc' | 'desc'

export const sortByString = <T>(
  items: T[],
  selector: (item: T) => string,
  direction: SortDirection = 'asc'
) => {
  const dir = direction === 'desc' ? -1 : 1
  return [...items].sort((a, b) => selector(a).localeCompare(selector(b)) * dir)
}
