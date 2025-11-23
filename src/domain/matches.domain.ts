const decodeHtmlEntities = (text: string) =>
  text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")

export const normalizeMatchInput = (value?: string | null) => {
  return (value ?? '').toLowerCase().trim()
}

const normalizeAndDecodeMatchInput = (value?: string | null) =>
  decodeHtmlEntities((value ?? '').toLowerCase().trim())

export const matchesNormalized = (
  candidate: string,
  expectation: string | string[],
  decodeCandidate = false,
) => {
  const normalized = decodeCandidate
    ? normalizeAndDecodeMatchInput(candidate)
    : normalizeMatchInput(candidate)
  const expectations = Array.isArray(expectation) ? expectation : [expectation]
  return expectations.some((expected) => normalizeMatchInput(expected) === normalized)
}

export const caseInsensitiveComparator = (existingValue: unknown, incomingValue: unknown) => {
  const normalizedExisting = normalizeMatchInput(
    typeof existingValue === 'string' ? existingValue : String(existingValue ?? ''),
  )
  const normalizedIncoming = normalizeMatchInput(
    typeof incomingValue === 'string' ? incomingValue : String(incomingValue ?? ''),
  )
  return normalizedExisting === normalizedIncoming
}
