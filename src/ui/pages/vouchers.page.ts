import { layout } from '../layout.ui'
import { renderSearchSortControls } from '../templates/editor.template'
import { inlineCardScript } from '../templates/card.template'
import { renderFilterSidebar, createSortSection, createFilterSection } from '../templates/filterSidebar.template'
import { toastClientScript } from '../templates/toast.template'
import { uiClasses } from '../styles/classes.ui'
import { VouchersPagePayload, VoucherListItem, VoucherSortOption } from '../../services/vouchers.service'

const escapeAttr = (value: string | number) => value.toString().replace(/"/g, '&quot;')

const toId = (value: string | number) => value.toString().replace(/[^a-zA-Z0-9_-]/g, '-')

const centsToInput = (value: number | null) => (typeof value === 'number' ? (value / 100).toFixed(2) : '')

const renderVoucherCard = (
  voucher: VoucherListItem,
  payload: Pick<VouchersPagePayload, 'shops' | 'voucherDiscountTypes' | 'voucherTypes'>
) => {
  const cardId = `voucher-${toId(voucher.id)}`
  const feedbackId = `${cardId}-feedback`
  const discountValue =
    voucher.voucherDiscountTypeKey === 'percentage'
      ? (voucher.discount / 100).toFixed(2)
      : centsToInput(voucher.discount)
  const minSpendValue = centsToInput(voucher.minSpend)
  const maxDiscountValue = centsToInput(voucher.maxDiscount)
  const confirmationLabel = `#${voucher.id} - ${voucher.shopName} - ${voucher.voucherCategoryLabel} / ${voucher.voucherDiscountTypeLabel}`
  const shopOptions = payload.shops
    .map(
      (shop) => `<option value="${shop.id}" ${shop.id === voucher.shopId ? 'selected' : ''}>${shop.name}</option>`
    )
    .join('')
  const voucherTypeOptions = payload.voucherTypes
    .map(
      (type) =>
        `<option value="${type.id}" ${type.id === voucher.voucherTypeId ? 'selected' : ''}>${type.name}</option>`
    )
    .join('')
  const discountTypeOptions = payload.voucherDiscountTypes
    .map(
      (type) =>
        `<option value="${type.id}" ${type.id === voucher.voucherDiscountTypeId ? 'selected' : ''}>${type.label}</option>`
    )
    .join('')

  const discountDataAttrs =
    voucher.voucherDiscountTypeKey === 'percentage'
      ? ''
      : `data-money-cents="${voucher.discount}" data-money-base="SGD"`
  const maxDiscountDataAttrs =
    voucher.maxDiscount !== null
      ? `data-money-cents="${voucher.maxDiscount}" data-money-base="SGD"`
      : ''
  const editFeedbackId = `${cardId}-edit-feedback`
  const deleteFeedbackId = `${cardId}-delete-feedback`
  return `<article class="${uiClasses.card.withShadow}" data-inline-card="${cardId}">
      <div class="${uiClasses.layout.flex.between}">
        <p class="${uiClasses.text.bodyLarge}">${voucher.shopName}</p>
        <span class="${uiClasses.text.metadata}">#${voucher.id} / ${voucher.createdAt}</span>
      </div>
      <p class="${uiClasses.text.subtitle}">${voucher.voucherCategoryLabel}</p>
      <p class="${uiClasses.text.subtitleSecondary}">${voucher.voucherDiscountTypeLabel}</p>
      <div class="${uiClasses.layout.grid.cols3}">
        <div>
          <p class="${uiClasses.text.label}">Min spend</p>
          <p class="${uiClasses.text.body}" data-money-cents="${voucher.minSpend}" data-money-base="SGD">${voucher.minSpendDisplay}</p>
        </div>
        <div>
          <p class="${uiClasses.text.label}">Discount</p>
          <p class="${uiClasses.text.body}" ${discountDataAttrs}>${voucher.discountDisplay}</p>
        </div>
        <div>
          <p class="${uiClasses.text.label}">Max discount</p>
          <p class="${uiClasses.text.body}" ${maxDiscountDataAttrs}>${voucher.maxDiscountDisplay}</p>
        </div>
      </div>
      <div class="${uiClasses.layout.flex.gap3}">
        <button type="button" class="${uiClasses.button.dangerCompact}" data-inline-toggle="${cardId}-edit">
          Edit
        </button>
        <button type="button" class="${uiClasses.button.dangerCompact}" data-inline-toggle="${cardId}-delete">
          Delete
        </button>
      </div>
      <div class="hidden space-y-3 border-t border-white/10 pt-3" data-inline-panel="${cardId}-edit">
        <div class="${uiClasses.layout.flex.betweenStart}">
          <p class="${uiClasses.text.headingBold}">Edit voucher</p>
          <button type="button" class="${uiClasses.button.ghost}" data-inline-close>Close</button>
        </div>
        <div
          id="${editFeedbackId}"
          class="${uiClasses.text.feedback}"
          data-inline-feedback
        ></div>
        <form
          class="${uiClasses.layout.space.y3}"
          hx-post="/vouchers/update"
          hx-target="#voucher-history-section"
          hx-swap="outerHTML"
          data-inline-card-id="${cardId}"
          hx-on::afterRequest="if(event.detail && (event.detail.successful || (event.detail.xhr && event.detail.xhr.status < 300))){const btn=this.closest('[data-inline-card]')?.querySelector('[data-inline-close]'); if(btn instanceof HTMLElement){btn.click();}}"
        >
          <input type="hidden" name="voucherId" value="${escapeAttr(voucher.id)}" />
          <input type="hidden" name="inlineCardId" value="${escapeAttr(cardId)}" />
          <label class="${uiClasses.text.labelBright} block">
            Shop
            <select class="${uiClasses.input.select}" name="shopId" required>
              ${shopOptions}
            </select>
          </label>
          <label class="${uiClasses.text.labelBright} block">
            Voucher type
            <select class="${uiClasses.input.select}" name="voucherTypeId" required>
              <option value="" disabled>Select a type</option>
              ${voucherTypeOptions}
            </select>
          </label>
          <label class="${uiClasses.text.labelBright} block">
            Discount type
            <select class="${uiClasses.input.select}" name="voucherDiscountTypeId" required>
              <option value="" disabled>Select a discount</option>
              ${discountTypeOptions}
            </select>
          </label>
          <div class="${uiClasses.layout.grid.cols3}">
            <label class="${uiClasses.text.labelBright} block">
              Minimum spend (SGD)
              <input
                class="${uiClasses.input.base}"
                type="number"
                min="0"
                step="0.01"
                name="minSpend"
                required
                value="${minSpendValue}"
              />
            </label>
            <label class="${uiClasses.text.labelBright} block">
              Discount amount
              <input
                class="${uiClasses.input.base}"
                type="number"
                min="0"
                step="0.01"
                name="discount"
                required
                value="${discountValue}"
              />
            </label>
            <label class="${uiClasses.text.labelBright} block">
              Max discount (SGD)
              <input
                class="${uiClasses.input.base}"
                type="number"
                min="0"
                step="0.01"
                name="maxDiscount"
                value="${maxDiscountValue}"
              />
            </label>
          </div>
          <button type="submit" class="${uiClasses.button.primaryCompact}">
            Save changes
          </button>
        </form>
      </div>
      <div class="hidden space-y-3 border-t border-white/10 pt-3" data-inline-panel="${cardId}-delete">
        <div class="${uiClasses.layout.flex.betweenStart}">
          <p class="${uiClasses.text.headingBold} text-red-300">Delete voucher</p>
          <button type="button" class="${uiClasses.button.ghost}" data-inline-close>Close</button>
        </div>
        <p class="${uiClasses.text.bodySmall}">Type the label below to confirm deletion.</p>
        <p class="${uiClasses.text.metadata}">${confirmationLabel}</p>
        <div
          id="${deleteFeedbackId}"
          class="${uiClasses.text.feedback}"
          data-inline-feedback
        ></div>
        <form
          class="${uiClasses.layout.space.y3}"
          hx-post="/vouchers/delete"
          hx-target="#voucher-history-section"
          hx-swap="outerHTML"
          data-inline-card-id="${cardId}"
          hx-on::afterRequest="if(event.detail && (event.detail.successful || (event.detail.xhr && event.detail.xhr.status < 300))){const btn=this.closest('[data-inline-card]')?.querySelector('[data-inline-close]'); if(btn instanceof HTMLElement){btn.click();}}"
        >
          <input type="hidden" name="voucherId" value="${escapeAttr(voucher.id)}" />
          <input type="hidden" name="inlineCardId" value="${escapeAttr(cardId)}" />
          <label class="${uiClasses.text.labelBright} block space-y-1">
            Confirm deletion
            <input
              class="${uiClasses.input.base}"
              type="text"
              name="confirmation"
              required
              placeholder="Type label to confirm"
            />
          </label>
          <button type="submit" class="${uiClasses.button.primaryCompact}">
            Delete voucher
          </button>
        </form>
      </div>
    </article>`
}

export const renderVoucherHistorySection = (
  vouchers: VoucherListItem[],
  context: Pick<VouchersPagePayload, 'shops' | 'voucherDiscountTypes' | 'voucherTypes'>,
  _message?: string,
  _messageClass = 'px-3 py-2 text-[0.65rem] uppercase tracking-[0.35em] text-white/70'
) => {
  const voucherHistory = vouchers.length
    ? vouchers.map((voucher) => renderVoucherCard(voucher, context)).join('')
    : `<p class="${uiClasses.text.bodySmall}">No vouchers recorded yet.</p>`
  return `<section id="voucher-history-section" class="${uiClasses.panel.base}">
      <div class="${uiClasses.layout.space.y3}">
        ${voucherHistory}
      </div>
    </section>`
}

export const vouchersPage = (
  {
    vouchers,
    shops,
    voucherDiscountTypes,
    voucherTypes,
  }: VouchersPagePayload,
  feedbackMessage = '',
  feedbackClass = 'text-sm uppercase tracking-[0.3em] text-white/70',
  searchValue = '',
  sortDirection: VoucherSortOption = 'date-desc',
  shopFilters: number[] = []
) => {
  const sanitizeInputValue = (value: string) => value.replace(/"/g, '&quot;')
  const historySection = renderVoucherHistorySection(
    vouchers,
    { shops, voucherDiscountTypes, voucherTypes }
  )
  const heroContent = ''
  const sidebarId = 'voucher-sort-sidebar'
  const editorPanel = `<section class="${uiClasses.panel.base}">
      <div class="flex flex-col gap-3 md:flex-row md:items-end md:gap-4">
        <div class="flex-1 w-full">
          ${renderSearchSortControls({
            searchId: 'voucher-search',
            searchPlaceholder: 'Search vouchers',
            searchValue: sanitizeInputValue(searchValue),
            action: '/vouchers',
            variant: 'inline',
            openEditorHref: '/vouchers/manage',
            openEditorLabel: 'Add voucher',
            sidebarId,
            sidebarTriggerLabel: 'Sort & Filter',
            hiddenParams: {
              sort: [sortDirection],
              shopId: shopFilters.map(String),
            },
          })}
        </div>
      </div>
    </section>`
  const feedbackBanner = feedbackMessage
    ? `<div class="${feedbackClass}">${feedbackMessage}</div>`
    : ''

  const sortOptions: { value: VoucherSortOption; label: string }[] = [
    { value: 'date-desc', label: 'Date (Newest first)' },
    { value: 'date-asc', label: 'Date (Oldest first)' },
    { value: 'shop-asc', label: 'Shop (A -> Z)' },
    { value: 'shop-desc', label: 'Shop (Z -> A)' },
  ]

  const sortSection = createSortSection(sortOptions, sortDirection)
  const shopOptions = shops.map((shop) => ({ label: shop.name, value: shop.id }))
  const shopsSection = createFilterSection('Shops', 'shopId', shopOptions, shopFilters)

  const filterSidebar = renderFilterSidebar({
    id: sidebarId,
    title: 'Sort & Filter',
    action: '/vouchers',
    hiddenInputs: {
      search: sanitizeInputValue(searchValue),
    },
    sections: [sortSection, shopsSection],
  })

  const mainContent = `<div class="${uiClasses.layout.space.y1}">
      ${feedbackBanner}
      ${editorPanel}
      ${historySection}
    </div>
    ${filterSidebar}`
  const extraHead = `
    <script src="https://unpkg.com/htmx.org@1.9.2"></script>
    ${inlineCardScript}
    ${toastClientScript}
    <script>
      document.addEventListener('htmx:afterSwap', (event) => {
        const target = event.detail && event.detail.target
        const targetId = target && target.id ? target.id : target?.getAttribute?.('data-inline-card')
        const status = event.detail && event.detail.xhr ? event.detail.xhr.status : null
        const responsePreview = event.detail && event.detail.xhr && typeof event.detail.xhr.responseText === 'string'
          ? event.detail.xhr.responseText.slice(0, 200)
          : ''
        console.debug('[htmx swap]', { target: targetId || target?.tagName, status, preview: responsePreview })
      })
      document.addEventListener('htmx:afterRequest', (event) => {
        const status = event.detail && event.detail.xhr ? event.detail.xhr.status : null
        console.debug('[htmx request]', { status, url: event.detail?.xhr?.responseURL })
      })
    </script>
  `
  return layout('vouchers', 'Vouchers - GenTech', heroContent, mainContent, extraHead)
}
