/**
 * Generic change service factory
 * Eliminates duplication of the ChangeAwareUpdater pattern across services
 */

export interface ChangeAwareUpdater<TSnapshot, TArgs, TResult> {
  update(args: TArgs): Promise<TResult>
  hasChanges(existing: TSnapshot, incoming: TArgs): boolean
}

/**
 * Creates a change-aware service that can detect changes and perform updates
 *
 * @param snapshotFromArgs - Function to convert incoming args to a snapshot format
 * @param hasChanges - Function to detect if changes exist between snapshots
 * @param updateFn - Function to perform the actual update operation
 * @returns A ChangeAwareUpdater instance
 *
 * @example
 * ```typescript
 * export const voucherChangeService = createChangeService(
 *   voucherSnapshotFromArgs,
 *   voucherHasChanges,
 *   updateVoucherDetails
 * )
 * ```
 */
export function createChangeService<TSnapshot, TArgs, TResult>(
  snapshotFromArgs: (args: TArgs) => TSnapshot,
  hasChanges: (existing: TSnapshot, incoming: TSnapshot) => boolean,
  updateFn: (args: TArgs) => Promise<TResult>
): ChangeAwareUpdater<TSnapshot, TArgs, TResult> {
  return {
    update: updateFn,
    hasChanges(existing, incoming) {
      return hasChanges(existing, snapshotFromArgs(incoming))
    },
  }
}
