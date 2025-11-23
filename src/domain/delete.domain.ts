import { normalizeOptionalString } from './normalizers.domain'
import { matchesNormalized } from './matches.domain'
import { escapeHtml } from './formatters.domain'

export type DeleteStatus = 200 | 400 | 404 | 500
export type DeleteResult = {
  status: DeleteStatus
  message: string
  code?: 'CONFIRMATION_REQUIRED' | 'CONFIRMATION_MISMATCH'
  expectedConfirmation?: string
}

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
  console.log('[deleteWithConfirmation] identifier:', identifier, 'confirmation:', confirmation)
  const trimmedConfirmation = normalizeOptionalString(confirmation)
  if (!trimmedConfirmation) {
    console.log('[deleteWithConfirmation] No confirmation')
    return {
      status: 400,
      code: 'CONFIRMATION_REQUIRED',
      message:
        options.requiredConfirmationMessage ??
        `${options.identifierLabel} confirmation is required to delete.`,
    }
  }

  let existing: TExisting | null
  try {
    existing = await options.loadExisting(identifier)
    console.log('[deleteWithConfirmation] Loaded entity:', existing)
  } catch (error) {
    console.error('Unable to load entity for delete', error)
    return { status: 500, message: `${options.identifierLabel} could not be deleted.` }
  }
  if (!existing) {
    console.log('[deleteWithConfirmation] Entity not found')
    return { status: 404, message: options.notFoundMessage }
  }

  let expectation: string | string[]
  try {
    expectation = options.expectedConfirmation(existing)
    console.log('[deleteWithConfirmation] Expected confirmations:', expectation)
  } catch (error) {
    console.error('Unable to resolve delete confirmation expectation', error)
    return { status: 500, message: `${options.identifierLabel} could not be deleted.` }
  }

  const expectedString = Array.isArray(expectation)
    ? expectation.find((entry) => Boolean(normalizeOptionalString(entry))) ?? ''
    : expectation

  console.log('[deleteWithConfirmation] Normalized confirmation:', trimmedConfirmation)
  if (!matchesNormalized(trimmedConfirmation, expectation, true)) {
    console.log('[deleteWithConfirmation] Confirmation mismatch!')
    const hint = normalizeOptionalString(expectedString)
      ? ` Please type "${escapeHtml(expectedString)}" to confirm.`
      : ''
    return {
      status: 400,
      code: 'CONFIRMATION_MISMATCH',
      expectedConfirmation: normalizeOptionalString(expectedString),
      message: `${options.confirmationErrorMessage ?? 'Confirmation does not match.'}${hint}`,
    }
  }

  console.log('[deleteWithConfirmation] Confirmation matched! Deleting...')
  try {
    const deleted = await options.deleteEntity(existing)
    console.log('[deleteWithConfirmation] deleteEntity returned:', deleted)
    if (!deleted) {
      console.log('[deleteWithConfirmation] deleteEntity returned false!')
      return { status: 500, message: `${options.identifierLabel} could not be deleted.` }
    }
  } catch (error) {
    console.error('Unable to delete entity', error)
    return { status: 500, message: `${options.identifierLabel} could not be deleted.` }
  }

  if (options.recordChange) {
    try {
      await options.recordChange(existing)
      console.log('[deleteWithConfirmation] Change recorded')
    } catch (error) {
      console.error('Unable to record delete change', error)
    }
  }

  console.log('[deleteWithConfirmation] Deletion successful!')
  return { status: 200, message: options.successMessage(existing) }
}
