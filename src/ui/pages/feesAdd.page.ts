import { layout } from '../layout.ui'
import { uiClasses } from '../styles/classes.ui'
import type { FeesPagePayload } from '../../services/fees.service'

export const feesAddPage = (payload: FeesPagePayload) => {
  const shopOptions = payload.shops
    .map((shop) => `<option value="${shop.id}">${shop.name}</option>`)
    .join('')

  const form = `
    <section class="${uiClasses.panel.base}">
      <div class="${uiClasses.layout.space.y3}">
        <div>
          <p class="${uiClasses.text.heading}">Add fee</p>
          <p class="${uiClasses.text.metadata}">Create a new platform/payment fee for a shop.</p>
        </div>
        <div id="fees-add-feedback" class="${uiClasses.text.feedback}"></div>
        <form
          class="${uiClasses.layout.space.y4}"
          hx-post="/fees/create"
          hx-target="#fees-add-feedback"
          hx-swap="innerHTML"
        >
          <label class="${uiClasses.text.labelBright} block space-y-1">
            Shop
            <select
              class="${uiClasses.input.select}"
              name="shopId"
              required
            >
              <option value="" disabled selected>Select a shop</option>
              <option value="global">All shops (global fee)</option>
              ${shopOptions}
            </select>
          </label>
          <label class="${uiClasses.text.labelBright} block space-y-1">
            Fee type
            <select
              class="${uiClasses.input.select}"
              name="feeType"
              required
            >
              <option value="fixed">Fixed (SGD)</option>
              <option value="percentage">Percentage (%)</option>
            </select>
          </label>
          <div class="${uiClasses.layout.grid.cols2}">
            <label class="${uiClasses.text.labelBright} block">
              Amount
              <input
                class="${uiClasses.input.base}"
                type="number"
                name="amount"
                min="0"
                step="0.01"
                placeholder="0.00"
                required
              />
              <p class="${uiClasses.text.metadataSmall} text-white/60">Percentages are stored as basis points.</p>
            </label>
            <label class="${uiClasses.text.labelBright} block">
              Label (optional)
              <input
                class="${uiClasses.input.base}"
                type="text"
                name="label"
                placeholder="e.g. Platform fee, Payment fee"
              />
            </label>
          </div>
          <button
            type="submit"
            class="${uiClasses.button.primaryCompact}"
          >
            Add fee
          </button>
        </form>
      </div>
    </section>
  `

  const script = `
    <script src="https://unpkg.com/htmx.org@1.9.2"></script>
  `

  const mainContent = `${form}${script}`
  return layout('fees', 'Add fee - GenTech', '', mainContent)
}
