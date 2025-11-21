export const escapeHtml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')

export const formatMoney = (amount: number | null) => {
  if (amount === null || Number.isNaN(amount)) return '—'
  const dollars = amount / 100
  return `$${dollars.toFixed(2)}`
}

export const formatTimestamp = (value: Date | number | null) => {
  if (!value) return 'Unknown time'
  const parsed = value instanceof Date ? value : new Date(value)
  return parsed.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

export const prettyPayload = (payload: string | null) => {
  if (!payload) return null

  try {
    const parsed = JSON.parse(payload)
    return JSON.stringify(parsed, null, 2)
  } catch {
    return payload
  }
}
