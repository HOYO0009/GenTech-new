import { layout } from '../layout.ui'
import { uiClasses } from '../styles/classes.ui'
import { VouchersPagePayload } from '../../services/vouchers.service'

const safeJson = (data: unknown) => JSON.stringify(data).replace(/<\/script>/g, '<\\/script>')

export const voucherAddPage = ({ shops, voucherDiscountTypes, voucherTypes }: VouchersPagePayload) => {
  const shopOptions = shops
    .map((shop) => `<option value="${shop.id}">${shop.name}</option>`)
    .join('')
  const discountOptions = voucherDiscountTypes
    .map((type) => `<option value="${type.id}" data-discount-key="${type.key}">${type.label}</option>`)
    .join('')
  const voucherTypeOptions = voucherTypes
    .map((type) => `<option value="${type.id}">${type.name}</option>`)
    .join('')
  const discountTypesJson = safeJson(voucherDiscountTypes)

  const form = `
    <section class="${uiClasses.panel.base}">
      <div class="${uiClasses.layout.space.y3}">
        <div>
          <p class="${uiClasses.text.heading}">Add voucher</p>
          <p class="${uiClasses.text.metadata}">Create a new voucher. Existing vouchers are edited inline on the vouchers page.</p>
        </div>
        <div id="voucher-add-feedback" class="${uiClasses.text.feedback}"></div>
        <form
          class="${uiClasses.layout.space.y4}"
          hx-post="/vouchers/create"
          hx-target="#voucher-add-feedback"
          hx-swap="innerHTML"
        >
          <label class="${uiClasses.text.labelBright} block">
            Shop
            <select
              class="${uiClasses.input.select}"
              name="shopId"
              required
            >
              <option value="" disabled selected>Select a shop</option>
              ${shopOptions}
            </select>
          </label>
          <label class="${uiClasses.text.labelBright} block">
            Voucher type
            <select
              class="${uiClasses.input.select}"
              name="voucherTypeId"
              required
            >
              <option value="" disabled selected>Select a type</option>
              ${voucherTypeOptions}
            </select>
          </label>
          <label class="${uiClasses.text.labelBright} block">
            Discount type
            <select
              class="${uiClasses.input.select}"
              name="voucherDiscountTypeId"
              required
              data-discount-type-select
            >
              <option value="" disabled selected>Select a discount</option>
              ${discountOptions}
            </select>
          </label>
          <div class="${uiClasses.layout.grid.cols3}">
            <label class="${uiClasses.text.labelBright} block">
              <span>Minimum spend (SGD)</span>
              <input
                class="${uiClasses.input.base}"
                type="number"
                min="0"
                step="0.01"
                name="minSpend"
                placeholder="0.00"
                required
              />
            </label>
            <label class="${uiClasses.text.labelBright} block" data-discount-label>
              <span data-discount-label-text>Discount amount</span>
              <input
                class="${uiClasses.input.base}"
                type="number"
                min="0"
                step="0.01"
                name="discount"
                placeholder="0.00"
                required
              />
            </label>
            <label class="${uiClasses.text.labelBright} block">
              <span>Max discount (SGD)</span>
              <input
                class="${uiClasses.input.base}"
                type="number"
                min="0"
                step="0.01"
                name="maxDiscount"
                placeholder="0.00"
              />
            </label>
          </div>
          <button
            type="submit"
            class="${uiClasses.button.primaryCompact}"
          >
            Add voucher
          </button>
        </form>
      </div>
    </section>
  `

  const script = `
    <script src="https://unpkg.com/htmx.org@1.9.2"></script>
    <script>
      document.addEventListener('DOMContentLoaded', () => {
        const discountTypes = ${discountTypesJson}
        const select = document.querySelector('[data-discount-type-select]')
        const discountLabel = document.querySelector('[data-discount-label-text]')
        const updateLabel = () => {
          const selectedId = Number((select && select.value) || 0)
          const match = discountTypes.find((entry) => entry.id === selectedId)
          if (!discountLabel || !match) return
          discountLabel.textContent = match.key === 'percentage' ? 'Discount (%)' : 'Discount (SGD)'
        }
        select?.addEventListener('change', updateLabel)
      })
    </script>
  `

  const mainContent = `${form}${script}`
  return layout('vouchers', 'Add voucher - GenTech', '', mainContent)
}
