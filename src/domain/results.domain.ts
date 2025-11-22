/**
 * Shared result types for service operations
 * These standardize the response format across all services
 */

export interface ServiceResult {
  status: 200 | 400 | 404 | 500
  message: string
}

export type CreateResult = ServiceResult
export type UpdateResult = ServiceResult
export type DeleteResult = ServiceResult

/**
 * Helper to create success results
 */
export const successResult = (message: string, status: 200 = 200): ServiceResult => ({
  status,
  message,
})

/**
 * Helper to create error results
 */
export const errorResult = (
  message: string,
  status: 400 | 404 | 500 = 400
): ServiceResult => ({
  status,
  message,
})

/**
 * Common error messages
 */
export const ErrorMessages = {
  REQUIRED_FIELD: (field: string) => `${field} is required.`,
  NOT_FOUND: (entity: string) => `${entity} not found.`,
  ALREADY_EXISTS: (entity: string) => `${entity} already exists.`,
  INVALID_SELECTION: (entity: string) => `Invalid ${entity} selection.`,
  NO_CHANGES: 'No changes detected.',
  UNABLE_TO_SAVE: (entity: string) => `Unable to save ${entity}.`,
  UNABLE_TO_DELETE: (entity: string) => `Unable to delete ${entity}.`,
  UNABLE_TO_CREATE: (entity: string) => `Unable to create ${entity}.`,
} as const

/**
 * Common success messages
 */
export const SuccessMessages = {
  CREATED: (entity: string) => `${entity} created.`,
  UPDATED: (entity: string) => `${entity} updated.`,
  DELETED: (entity: string) => `${entity} deleted.`,
  SAVED: (entity: string) => `${entity} saved.`,
} as const
