import { layout } from '../layout'
import { VouchersPagePayload, VoucherListItem } from '../../services/vouchers'

const renderVoucherCard = (voucher: VoucherListItem) => {
  return `<article class="rounded-2xl border border-white/10 bg-black/70 p-5 space-y-3">
      <div class="flex items-center justify-between">
        <p class="text-base font-semibold text-white">${voucher.shopName}</p>
        <span class="text-[0.65rem] uppercase tracking-[0.3em] text-white/50">${voucher.createdAt}</span>
      </div>
      <p class="text-sm uppercase tracking-[0.35em] text-white/60">${voucher.voucherCategoryLabel}</p>
      <p class="text-sm uppercase tracking-[0.35em] text-white/40">${voucher.voucherDiscountTypeLabel}</p>
      <div class="grid gap-3 text-sm sm:grid-cols-3">
        <div>
          <p class="text-xs uppercase tracking-[0.35em] text-white/50">Min spend</p>
          <p class="text-base font-semibold text-white">${voucher.minSpendDisplay}</p>
        </div>
        <div>
          <p class="text-xs uppercase tracking-[0.35em] text-white/50">Discount</p>
          <p class="text-base font-semibold text-white">${voucher.discountDisplay}</p>
        </div>
        <div>
          <p class="text-xs uppercase tracking-[0.35em] text-white/50">Max discount</p>
          <p class="text-base font-semibold text-white">${voucher.maxDiscountDisplay}</p>
        </div>
      </div>
    </article>`
}

export const renderVoucherHistorySection = (
  vouchers: VoucherListItem[],
  message?: string,
  messageClass = 'px-3 py-2 text-[0.65rem] uppercase tracking-[0.35em] text-white/70'
) => {
  const voucherHistory = vouchers.length
    ? vouchers.map(renderVoucherCard).join('')
    : '<p class="text-sm text-white/70">No vouchers recorded yet.</p>'
  const messageMarkup = message
    ? `<div class="${messageClass} border-b border-white/5">${message}</div>`
    : ''
  return `<section id="voucher-history-section" hx-swap-oob="outerHTML" class="rounded-2xl border border-white/10 bg-black/70 p-6 space-y-4">
      ${messageMarkup}
      <div class="space-y-3">
        ${voucherHistory}
      </div>
    </section>`
}

export const vouchersPage = (
  {
    vouchers,
  }: VouchersPagePayload,
  feedbackMessage = '',
  feedbackClass = 'text-sm uppercase tracking-[0.3em] text-white/70'
) => {
  const historySection = renderVoucherHistorySection(vouchers)
  const heroContent = ''
  const editorPanel = `<section class="rounded-2xl border border-white/10 bg-black/70 p-6 space-y-4">
      <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div class="space-y-1">
          <p class="text-sm uppercase tracking-[0.3em] text-white/70">Vouchers</p>
          <p class="text-[0.65rem] uppercase tracking-[0.3em] text-white/50">
            Use the unified editor below to add, update, or delete vouchers.
          </p>
        </div>
        <a href="/vouchers/manage" class="primary-btn">
          Open voucher editor
        </a>
      </div>
    </section>`
  const feedbackBanner = feedbackMessage
    ? `<div class="${feedbackClass}">${feedbackMessage}</div>`
    : ''
  const mainContent = `<div class="space-y-6">
      ${feedbackBanner}
      ${editorPanel}
      ${historySection}
    </div>`
  const extraHead = `
    <script src="https://unpkg.com/htmx.org@1.9.2"></script>
  `
  return layout('vouchers', 'Vouchers - GenTech', heroContent, mainContent, extraHead)
}
