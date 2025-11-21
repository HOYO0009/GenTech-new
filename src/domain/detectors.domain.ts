import { caseInsensitiveComparator } from './matches.domain'

export type FieldComparator = (existingValue: unknown, incomingValue: unknown) => boolean

export interface FieldCheck<TExisting, TIncoming> {
  existingKey: keyof TExisting
  incomingKey: keyof TIncoming
  comparator?: FieldComparator
}

export interface ChangeDetector {
  hasChanges(): boolean
}

export class FieldChangeDetector<TExisting, TIncoming> implements ChangeDetector {
  constructor(
    private existing: TExisting,
    private incoming: TIncoming,
    private checks: FieldCheck<TExisting, TIncoming>[]
  ) {}

  hasChanges() {
    return this.checks.some(({ existingKey, incomingKey, comparator }) => {
      const existingValue = (this.existing as Record<string, unknown>)[existingKey as string]
      const incomingValue = (this.incoming as Record<string, unknown>)[incomingKey as string]
      const equals = comparator
        ? comparator(existingValue, incomingValue)
        : Object.is(existingValue, incomingValue)
      return !equals
    })
  }
}

export { caseInsensitiveComparator }
