import { escapeHtml } from './formatters.domain'

/**
 * Generic sanitization utilities
 * Standardizes data transformation and HTML escaping across services
 */

/**
 * Type for a mapper function that transforms input to output using an escape function
 */
export type SanitizerMapper<TInput, TOutput> = (
  input: TInput,
  escape: (s: string) => string
) => TOutput

/**
 * Creates a sanitizer function that applies HTML escaping during transformation
 *
 * @param mapper - Function that maps input to output, receives escapeHtml as second param
 * @returns A sanitizer function
 *
 * @example
 * ```typescript
 * const sanitizeShop = createSanitizer<ShopSummary, ShopOption>(
 *   (shop, escape) => ({
 *     id: shop.id,
 *     code: shop.code,
 *     name: escape(shop.name),
 *   })
 * )
 * ```
 */
export function createSanitizer<TInput, TOutput>(
  mapper: SanitizerMapper<TInput, TOutput>
) {
  return (input: TInput): TOutput => mapper(input, escapeHtml)
}

/**
 * Creates a batch sanitizer that applies sanitization to an array
 *
 * @param mapper - Function that maps input to output
 * @returns A batch sanitizer function
 *
 * @example
 * ```typescript
 * const sanitizeShops = createBatchSanitizer(sanitizeShop)
 * const shops = await listShops().then(sanitizeShops)
 * ```
 */
export function createBatchSanitizer<TInput, TOutput>(
  sanitizer: (input: TInput) => TOutput
) {
  return (inputs: TInput[]): TOutput[] => inputs.map(sanitizer)
}

/**
 * Sanitizes a simple object by escaping specified string fields
 *
 * @param obj - The object to sanitize
 * @param fields - Array of field names to escape
 * @returns A new object with escaped fields
 *
 * @example
 * ```typescript
 * const sanitized = sanitizeFields(user, ['name', 'email'])
 * ```
 */
export function sanitizeFields<T extends Record<string, unknown>>(
  obj: T,
  fields: (keyof T)[]
): T {
  const result = { ...obj }
  for (const field of fields) {
    const value = result[field]
    if (typeof value === 'string') {
      result[field] = escapeHtml(value) as T[keyof T]
    }
  }
  return result
}
