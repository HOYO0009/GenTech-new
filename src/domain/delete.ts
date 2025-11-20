import { normalizeOptionalString } from './normalizers'
import { matchesNormalized } from './matches'

export type DeleteStatus = 200 | 400 | 404 | 500
export type DeleteResult = { status: DeleteStatus; message: string }

export interface DeleteWithConfirmationOptions<TExisting, TIdentifier> {
  identifierLabel: string
  loadExisting: (identifier: TIdentifier) => Promise<TExisting | null>
  expectedConfirmation: (existing: TExisting) => string | string[]
  deleteEntity: (existing: TExisting) => Promise<boolean>
  successMessage: (existing: TExisting) => string
  notFoundMessage: string
  confirmationErrorMessage?: string
  requiredConfirmationMessage?: string
  recordChange?: (existing: TExisting) => Promise<void>
}

export async function deleteWithConfirmation<TExisting, TIdentifier>({
  identifier,
  confirmation,
  options,
}: {
  identifier: TIdentifier
  confirmation: string
  options: DeleteWithConfirmationOptions<TExisting, TIdentifier>
}): Promise<DeleteResult> {
  const trimmedConfirmation = normalizeOptionalString(confirmation)
  if (!trimmedConfirmation) {
    return {
      status: 400,
      message:
        options.requiredConfirmationMessage ??
        `${options.identifierLabel} confirmation is required to delete.`,
    }
  }

  const existing = await options.loadExisting(identifier)
  if (!existing) {
    return { status: 404, message: options.notFoundMessage }
  }

  const expectation = options.expectedConfirmation(existing)
  if (!matchesNormalized(trimmedConfirmation, expectation)) {
    return {
      status: 400,
      message: options.confirmationErrorMessage ?? 'Confirmation does not match.',
    }
  }

  const deleted = await options.deleteEntity(existing)
  if (!deleted) {
    return { status: 500, message: `${options.identifierLabel} could not be deleted.` }
  }

  if (options.recordChange) {
    try {
      await options.recordChange(existing)
    } catch (error) {
      console.error('Unable to record delete change', error)
    }
  }

  return { status: 200, message: options.successMessage(existing) }
}
