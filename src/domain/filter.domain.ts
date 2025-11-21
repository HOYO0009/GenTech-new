export const toIdSet = (values?: (number | null | undefined)[]) =>
  new Set((values ?? []).filter((value) => Number.isInteger(value)) as number[])

export const filterByIds = <T>(
  items: T[],
  ids: (number | null | undefined)[] | undefined,
  selector: (item: T) => number | null | undefined
) => {
  const set = toIdSet(ids)
  if (!set.size) return items
  return items.filter((item) => {
    const value = selector(item)
    return value !== null && value !== undefined && set.has(value)
  })
}
