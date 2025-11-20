export const normalizeMatchInput = (value?: string | null) => {
  return (value ?? '').toLowerCase().trim()
}

export const matchesNormalized = (
  candidate: string,
  expectation: string | string[]
) => {
  const normalized = normalizeMatchInput(candidate)
  const expectations = Array.isArray(expectation) ? expectation : [expectation]
  return expectations.some((expected) => normalized === normalizeMatchInput(expected))
}

export const caseInsensitiveComparator = (existingValue: unknown, incomingValue: unknown) => {
  const normalizedExisting = normalizeMatchInput(
    typeof existingValue === 'string' ? existingValue : String(existingValue ?? '')
  )
  const normalizedIncoming = normalizeMatchInput(
    typeof incomingValue === 'string' ? incomingValue : String(incomingValue ?? '')
  )
  return normalizedExisting === normalizedIncoming
}
