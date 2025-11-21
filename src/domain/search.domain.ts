export const normalizeTerm = (term: string | undefined | null) => term?.toString().trim().toLowerCase() ?? ''

export const containsTerm = (value: string | null | undefined, term: string) => {
  if (!term) return true
  return (value ?? '').toString().toLowerCase().includes(term)
}
