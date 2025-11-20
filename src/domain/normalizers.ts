export const normalizeNullableText = (value?: string | null): string | null => {
  const trimmed = value?.trim()
  return trimmed ? trimmed : null
}

export const normalizeNumericInput = (value: number | null | undefined): number | null => {
  return typeof value === 'number' ? value : null
}

export const normalizeOptionalString = (value?: string | null): string => {
  return value ? value.trim() : ''
}
