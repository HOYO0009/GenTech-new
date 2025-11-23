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

  private isEqual(existingValue: unknown, incomingValue: unknown, comparator?: FieldComparator) {
    return comparator ? comparator(existingValue, incomingValue) : Object.is(existingValue, incomingValue)
  }

  getChangedFields(): Array<keyof TExisting> {
    return this.checks
      .map(({ existingKey, incomingKey, comparator }) => {
        const existingValue = (this.existing as Record<string, unknown>)[existingKey as string]
        const incomingValue = (this.incoming as Record<string, unknown>)[incomingKey as string]
        const equals = this.isEqual(existingValue, incomingValue, comparator)
        if (!equals) {
          console.log(`  Field '${String(existingKey)}' changed:`, { existing: existingValue, incoming: incomingValue })
          return existingKey
        }
        return null
      })
      .filter((key): key is keyof TExisting => Boolean(key))
  }

  hasChanges() {
    return this.getChangedFields().length > 0
  }
}

export { caseInsensitiveComparator }
