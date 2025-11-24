import { formatMoney, formatPercentageFromBasisPoints, formatTimestamp, toBasisPoints, toCents } from '../domain/formatters.domain'
import { errorResult, successResult, type ServiceResult } from '../domain/results.domain'
import { FeesRepository } from '../repositories/fees.repository'
import type { ShopOption } from './voucherTransformation.service'
import type { ShopFeeSummary } from '../db/fees.db'

export type FeeType = 'fixed' | 'percentage'

export type ShopFeeListItem = {
  id: number
  shopId: number | null
  shopName: string
  feeType: FeeType
  amountDisplay: string
  amountRaw: number
  label: string
  createdAtDisplay: string
  isGlobal: boolean
}

export type FeesPagePayload = {
  shops: ShopOption[]
  fees: ShopFeeListItem[]
}

const repository = new FeesRepository()

const transformFee = (entry: ShopFeeSummary): ShopFeeListItem => {
  const isGlobal = entry.shopId === null
  const amountDisplay =
    entry.feeType === 'percentage' ? formatPercentageFromBasisPoints(entry.amount) : formatMoney(entry.amount)

  return {
    id: entry.id,
    shopId: entry.shopId,
    shopName: isGlobal ? 'All shops' : entry.shopName ?? 'Unknown shop',
    feeType: entry.feeType,
    amountDisplay,
    amountRaw: entry.amount,
    label: entry.label ?? '',
    createdAtDisplay: formatTimestamp(entry.createdAt),
    isGlobal,
  }
}

export const getFeesPagePayload = async (): Promise<FeesPagePayload> => {
  const [shops, fees] = await Promise.all([repository.listShops(), repository.listShopFees()])
  const transformedFees = fees.map(transformFee)
  const sortedFees = transformedFees.sort((a, b) => {
    if (a.isGlobal === b.isGlobal) return 0
    return a.isGlobal ? -1 : 1
  })
  return {
    shops,
    fees: sortedFees,
  }
}

export const addShopFee = async (args: {
  shopId: number | null
  feeType: FeeType
  amount: number
  label?: string
}): Promise<ServiceResult> => {
  if (args.shopId !== null) {
    const shops = await repository.listShops()
    const selectedShop = shops.find((shop) => shop.id === args.shopId)
    if (!selectedShop) {
      return errorResult('Invalid shop selection.', 400)
    }
  }

  const normalizedAmount = args.feeType === 'percentage' ? toBasisPoints(args.amount) : toCents(args.amount)
  if (normalizedAmount < 0) {
    return errorResult('Fee amount cannot be negative.', 400)
  }

  try {
    await repository.insertShopFee({
      shopId: args.shopId,
      feeType: args.feeType,
      amount: normalizedAmount,
      label: args.label?.trim() || null,
    })
    return successResult('Fee saved.')
  } catch (error) {
    console.error('Failed to insert shop fee', error)
    return errorResult('Unable to save fee.', 500)
  }
}
