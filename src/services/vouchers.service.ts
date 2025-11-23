import { toCents, toBasisPoints, escapeHtml } from '../domain/formatters.domain'
import { recordChange } from './changeLogs.service'
import { FieldChangeDetector, FieldCheck } from '../domain/detectors.domain'
import { ensureAmount } from '../domain/validators.domain'
import { deleteWithConfirmation, DeleteWithConfirmationOptions, DeleteResult } from '../domain/delete.domain'
import { ServiceResult, errorResult, successResult, ErrorMessages, SuccessMessages } from '../domain/results.domain'
import { VoucherInsertArgs, VoucherSummary } from '../db/vouchers.db'
import { db } from '../db/connection.db'
import { IVoucherRepository } from '../repositories/voucher.repository.interface'
import { VoucherRepository } from '../repositories/voucher.repository'
import { VoucherTransformationService } from './voucherTransformation.service'
import type {
  ShopOption,
  VoucherDiscountTypeOption,
  VoucherCategoryOption,
  VoucherListItem,
} from './voucherTransformation.service'
import { VoucherSearchService } from './voucherSearch.service'
import type { VoucherSearchSortOptions } from './voucherSearch.service'
import type { VoucherSortOption } from '../domain/strategies/voucherSort.strategy'

export type { ShopOption, VoucherDiscountTypeOption, VoucherCategoryOption, VoucherListItem, VoucherSearchSortOptions, VoucherSortOption }

export interface VouchersPagePayload {
  shops: ShopOption[]
  voucherDiscountTypes: VoucherDiscountTypeOption[]
  voucherTypes: VoucherCategoryOption[]
  vouchers: VoucherListItem[]
}

/**
 * Raw voucher inputs from the API boundary (dollars and percentages).
 * They are normalized to cents/basis points before persistence.
 */
export interface VoucherDraftArgs {
  shopId: number
  voucherDiscountTypeId: number
  voucherTypeId: number
  minSpend: number
  discount: number
  maxDiscount: number | null
}

type VoucherChangeSnapshot = {
  shopId: number
  voucherTypeId: number | null
  voucherDiscountTypeId: number
  minSpend: number
  discount: number
  maxDiscount: number | null
}

const voucherChangeLabels: Record<keyof VoucherChangeSnapshot, string> = {
  shopId: 'Shop',
  voucherTypeId: 'Voucher type',
  voucherDiscountTypeId: 'Discount type',
  minSpend: 'Minimum spend',
  discount: 'Discount',
  maxDiscount: 'Max discount',
}

const normalizeMoneyFields = (args: VoucherDraftArgs, discountTypeKey: string): VoucherInsertArgs => {
  const discountValue =
    discountTypeKey === 'percentage' ? toBasisPoints(args.discount) : toCents(args.discount)
  return {
    ...args,
    minSpend: toCents(args.minSpend),
    discount: discountValue,
    maxDiscount:
      args.maxDiscount === null || typeof args.maxDiscount === 'undefined'
        ? null
        : toCents(args.maxDiscount),
  }
}

const voucherChangeFields: FieldCheck<VoucherChangeSnapshot, VoucherChangeSnapshot>[] = [
  { existingKey: 'shopId', incomingKey: 'shopId' },
  { existingKey: 'voucherTypeId', incomingKey: 'voucherTypeId' },
  { existingKey: 'voucherDiscountTypeId', incomingKey: 'voucherDiscountTypeId' },
  { existingKey: 'minSpend', incomingKey: 'minSpend' },
  { existingKey: 'discount', incomingKey: 'discount' },
  { existingKey: 'maxDiscount', incomingKey: 'maxDiscount' },
]

export const voucherSnapshotFromArgs = (args: VoucherInsertArgs): VoucherChangeSnapshot => ({
  shopId: args.shopId,
  voucherTypeId: args.voucherTypeId ?? null,
  voucherDiscountTypeId: args.voucherDiscountTypeId,
  minSpend: args.minSpend,
  discount: args.discount,
  maxDiscount: args.maxDiscount ?? null,
})

export const voucherHasChanges = (
  existing: VoucherChangeSnapshot,
  incoming: VoucherChangeSnapshot
) => new FieldChangeDetector(existing, incoming, voucherChangeFields).hasChanges()

export type VoucherCreateResult = ServiceResult

export const discountLabelByType: Record<string, string> = {
  fixed: 'Discount (SGD)',
  percentage: 'Discount (%)',
}

const voucherConfirmationLabel = (entry: VoucherSummary, sanitize = false) => {
  const format = sanitize ? escapeHtml : (value: string) => value
  const shop = format(entry.shopName ?? 'Unknown shop')
  const category = format(entry.voucherTypeName ?? 'Voucher')
  const discount = format(entry.voucherDiscountTypeLabel ?? entry.voucherDiscountTypeKey ?? 'Discount')
  return `#${entry.id} - ${shop} - ${category} / ${discount}`
}

const voucherConfirmationShortLabel = (entry: VoucherSummary, sanitize = false) => {
  const format = sanitize ? escapeHtml : (value: string) => value
  const shop = format(entry.shopName ?? 'Unknown shop')
  const category = format(entry.voucherTypeName ?? 'Voucher')
  return `${shop} - ${category}`
}

const voucherConfirmationExpectations = (entry: VoucherSummary): string[] => [
  voucherConfirmationLabel(entry, false),
  voucherConfirmationShortLabel(entry, false),
  voucherConfirmationLabel(entry, true),
  voucherConfirmationShortLabel(entry, true),
]

export class VoucherService {
  constructor(
    private repository: IVoucherRepository,
    private transformationService: VoucherTransformationService,
    private searchService: VoucherSearchService
  ) {}

  private async resolveVoucherSelections({
    shopId,
    voucherDiscountTypeId,
    voucherTypeId,
  }: {
    shopId: number
    voucherDiscountTypeId: number
    voucherTypeId: number
  }) {
    const [shops, discountTypes, voucherTypes] = await Promise.all([
      this.repository.listShops(),
      this.repository.listVoucherDiscountTypes(),
      this.repository.listVoucherTypes(),
    ])

    const transformedShops = this.transformationService.transformShops(shops)
    const transformedDiscountTypes = this.transformationService.transformDiscountTypes(discountTypes)
    const transformedVoucherTypes = this.transformationService.transformVoucherCategories(voucherTypes)

    const shop = transformedShops.find((entry) => entry.id === shopId)
    if (!shop) {
      throw new Error('Invalid shop selection.')
    }

    const voucherDiscountType = transformedDiscountTypes.find((entry) => entry.id === voucherDiscountTypeId)
    if (!voucherDiscountType) {
      throw new Error('Invalid discount type selection.')
    }

    const voucherType = transformedVoucherTypes.find((entry) => entry.id === voucherTypeId)
    if (!voucherType) {
      throw new Error('Invalid voucher type selection.')
    }

    return { shop, voucherDiscountType, voucherType }
  }

  async getVouchersPagePayload(options?: VoucherSearchSortOptions): Promise<VouchersPagePayload> {
    const [shops, discountTypes, voucherTypes, vouchers] = await Promise.all([
      this.repository.listShops(),
      this.repository.listVoucherDiscountTypes(),
      this.repository.listVoucherTypes(),
      this.repository.listRecentVouchers(),
    ])

    const transformedVouchers = this.transformationService.transformVouchers(vouchers)
    const sortedVouchers = this.searchService.applySearchSortFilter(transformedVouchers, options)

    return {
      shops: this.transformationService.transformShops(shops),
      voucherDiscountTypes: this.transformationService.transformDiscountTypes(discountTypes),
      voucherTypes: this.transformationService.transformVoucherCategories(voucherTypes),
      vouchers: sortedVouchers,
    }
  }

  async createVoucher(args: VoucherDraftArgs): Promise<VoucherCreateResult> {
    let resolved
    try {
      resolved = await this.resolveVoucherSelections({
        shopId: args.shopId,
        voucherDiscountTypeId: args.voucherDiscountTypeId,
        voucherTypeId: args.voucherTypeId,
      })
    } catch (error) {
      return errorResult((error as Error).message, 400)
    }

    try {
      ensureAmount(args.minSpend, 'Minimum spend')
      ensureAmount(args.discount, 'Discount')
      ensureAmount(args.maxDiscount ?? 0, 'Max discount')
    } catch (error) {
      return errorResult((error as Error).message, 400)
    }

    const normalizedArgs = normalizeMoneyFields(args, resolved.voucherDiscountType.key)

    try {
      await db.transaction(async (tx) => {
        await this.repository.insertVoucher(normalizedArgs, tx)
        await recordChange(
          {
            tableName: 'vouchers',
            action: 'INSERT',
            description: `Voucher for ${resolved.shop.name} (${resolved.voucherDiscountType.label} / ${resolved.voucherType.name}) created`,
            payload: {
              shopId: normalizedArgs.shopId,
              voucherDiscountTypeId: normalizedArgs.voucherDiscountTypeId,
              voucherTypeId: normalizedArgs.voucherTypeId,
              minSpend: normalizedArgs.minSpend,
              discount: normalizedArgs.discount,
              maxDiscount: normalizedArgs.maxDiscount,
            },
            source: 'vouchers/create',
          },
          tx
        )
      })
    } catch (error) {
      console.error('Unable to insert voucher', error)
      return errorResult(ErrorMessages.UNABLE_TO_SAVE('voucher'), 500)
    }

    return successResult(SuccessMessages.SAVED('Voucher'))
  }

  async updateVoucherDetails({
    id,
    ...args
  }: VoucherDraftArgs & { id: number }): Promise<VoucherCreateResult> {
    if (!Number.isInteger(id) || id <= 0) {
      return errorResult(ErrorMessages.INVALID_SELECTION('voucher'), 400)
    }

    let resolved
    try {
      resolved = await this.resolveVoucherSelections({
        shopId: args.shopId,
        voucherDiscountTypeId: args.voucherDiscountTypeId,
        voucherTypeId: args.voucherTypeId,
      })
    } catch (error) {
      return errorResult((error as Error).message, 400)
    }

    try {
      ensureAmount(args.minSpend, 'Minimum spend')
      ensureAmount(args.discount, 'Discount')
      ensureAmount(args.maxDiscount ?? 0, 'Max discount')
    } catch (error) {
      return errorResult((error as Error).message, 400)
    }

    const normalizedArgs = normalizeMoneyFields(args, resolved.voucherDiscountType.key)

    const existing = await this.repository.getVoucherById(id)
    if (!existing) {
      return errorResult(ErrorMessages.NOT_FOUND('Voucher'), 404)
    }

    const normalizedExistingVoucher: VoucherChangeSnapshot = {
      shopId: existing.shopId,
      voucherTypeId: existing.voucherTypeId ?? null,
      voucherDiscountTypeId: existing.voucherDiscountTypeId,
      minSpend: existing.minSpend,
      discount: existing.discount,
      maxDiscount: existing.maxDiscount ?? null,
    }
    const normalizedIncomingVoucher: VoucherChangeSnapshot = {
      shopId: normalizedArgs.shopId,
      voucherTypeId: normalizedArgs.voucherTypeId ?? null,
      voucherDiscountTypeId: normalizedArgs.voucherDiscountTypeId,
      minSpend: normalizedArgs.minSpend,
      discount: normalizedArgs.discount,
      maxDiscount: normalizedArgs.maxDiscount ?? null,
    }
    const changeDetector = new FieldChangeDetector(
      normalizedExistingVoucher,
      normalizedIncomingVoucher,
      voucherChangeFields
    )
    const changedFields = changeDetector.getChangedFields()
    if (!changedFields.length) {
      return successResult(ErrorMessages.NO_CHANGES)
    }

    let updated: boolean
    try {
      updated = await db.transaction(async (tx) => {
        const success = await this.repository.updateVoucher({ id, ...normalizedArgs }, tx)
        if (!success) {
          return false
        }
        await recordChange(
          {
            tableName: 'vouchers',
            action: 'UPDATE',
            description: `Voucher #${id} updated for ${resolved.shop.name} (${resolved.voucherDiscountType.label} / ${resolved.voucherType.name})`,
            payload: {
              id,
              ...normalizedArgs,
            },
            source: 'vouchers/update',
          },
          tx
        )
        return true
      })
    } catch (error) {
      console.error('Unable to record voucher change', error)
      return errorResult(ErrorMessages.UNABLE_TO_SAVE('voucher'), 500)
    }

    if (!updated) {
      return errorResult(ErrorMessages.NOT_FOUND('Voucher'), 404)
    }

    const changedFieldLabels = changedFields
      .map((field) => voucherChangeLabels[field])
      .filter(Boolean)

    return {
      ...successResult(SuccessMessages.UPDATED('Voucher')),
      subject: `Voucher #${id}`,
      details: changedFieldLabels,
    }
  }

  async deleteVoucherRecord(id: number): Promise<VoucherCreateResult> {
    if (!Number.isInteger(id) || id <= 0) {
      return errorResult(ErrorMessages.INVALID_SELECTION('voucher'), 400)
    }

    let deleted: boolean
    try {
      deleted = await db.transaction(async (tx) => {
        const success = await this.repository.deleteVoucherById(id, tx)
        if (!success) {
          return false
        }
        await recordChange(
          {
            tableName: 'vouchers',
            action: 'DELETE',
            description: `Voucher #${id} deleted`,
            payload: { id },
            source: 'vouchers/delete',
          },
          tx
        )
        return true
      })
    } catch (error) {
      console.error('Unable to delete voucher', error)
      return errorResult(ErrorMessages.UNABLE_TO_SAVE('voucher'), 500)
    }

    if (!deleted) {
      return errorResult(ErrorMessages.NOT_FOUND('Voucher'), 404)
    }

    return {
      ...successResult(SuccessMessages.DELETED('Voucher')),
      subject: `Voucher #${id}`,
      details: ['Deleted'],
    }
  }

  async deleteVoucherRecordWithConfirmation(
    id: number,
    confirmation: string
  ): Promise<VoucherCreateResult> {
    if (!Number.isInteger(id) || id <= 0) {
      return errorResult(ErrorMessages.INVALID_SELECTION('voucher'), 400)
    }
    let result: DeleteResult
    try {
      result = await db.transaction(async (tx) => {
        const options: DeleteWithConfirmationOptions<VoucherSummary, number> = {
          identifierLabel: 'Voucher',
          notFoundMessage: 'Voucher not found.',
          expectedConfirmation: (existing) => voucherConfirmationExpectations(existing),
          confirmationErrorMessage: 'Confirmation does not match voucher selection.',
          deleteEntity: async (existing) => this.repository.deleteVoucherById(existing.id, tx),
          successMessage: () => 'Voucher deleted.',
          loadExisting: (identifier) => this.repository.getVoucherById(identifier, tx),
          recordChange: (existing) =>
            recordChange(
              {
                tableName: 'vouchers',
                action: 'DELETE',
                description: `Voucher #${existing.id} for ${existing.shopName} removed`,
                payload: { id: existing.id, shopId: existing.shopId },
                source: 'vouchers/delete',
              },
              tx
            ),
        }
        return deleteWithConfirmation({
          identifier: id,
          confirmation,
          options,
        })
      })
    } catch (error) {
      console.error('Unable to delete voucher', error)
      return errorResult(ErrorMessages.UNABLE_TO_SAVE('voucher'), 500)
    }

    // Convert DeleteResult to ServiceResult
    return {
      status: result.status,
      message: result.message,
      subject: `Voucher #${id}`,
      details: result.status === 200 ? ['Deleted'] : undefined,
    }
  }
}

const defaultVoucherService = new VoucherService(
  new VoucherRepository(),
  new VoucherTransformationService(),
  new VoucherSearchService()
)

export async function getVouchersPagePayload(
  options?: VoucherSearchSortOptions
): Promise<VouchersPagePayload> {
  return defaultVoucherService.getVouchersPagePayload(options)
}

export async function createVoucher(args: VoucherDraftArgs): Promise<VoucherCreateResult> {
  return defaultVoucherService.createVoucher(args)
}

export async function updateVoucherDetails(
  args: VoucherDraftArgs & { id: number }
): Promise<VoucherCreateResult> {
  return defaultVoucherService.updateVoucherDetails(args)
}

export async function deleteVoucherRecord(id: number): Promise<VoucherCreateResult> {
  return defaultVoucherService.deleteVoucherRecord(id)
}

export async function deleteVoucherRecordWithConfirmation(
  id: number,
  confirmation: string
): Promise<VoucherCreateResult> {
  return defaultVoucherService.deleteVoucherRecordWithConfirmation(id, confirmation)
}
