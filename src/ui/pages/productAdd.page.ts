import { layout } from '../layout.ui'
import { uiClasses } from '../styles/classes.ui'
import { ProductPagePayload } from '../../services/products.service'

const safeJson = (data: unknown) => JSON.stringify(data).replace(/<\/script>/g, '<\\/script>')

export const productAddPage = ({ products, statuses, suppliers, shops }: ProductPagePayload) => {
  const statusOptions = statuses
    .map((option) => `<option value="${option.id}">${option.name}</option>`)
    .join('')
  const supplierOptions = [
    '<option value="">Unassigned</option>',
    ...suppliers.map((supplier) => `<option value="${supplier.id}">${supplier.name}</option>`),
  ].join('')
  const shopOptions = shops
    .map(
      (shop) => `
        <label class="group flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-2 text-white shadow-[0_0_0_1px_rgba(255,255,255,0.05)] transition hover:border-white/30 hover:shadow-[0_0_0_1px_rgba(255,255,255,0.12)]">
          <input class="${uiClasses.input.checkbox} accent-[#ff2b2b]" type="checkbox" name="shopIds" value="${shop.id}" />
          <span class="${uiClasses.text.body}">${shop.name}</span>
        </label>
      `
    )
    .join('')
  const productJson = safeJson(products)

  const form = `
    <section class="${uiClasses.panel.base}">
      <div class="${uiClasses.layout.space.y3}">
        <div>
          <p class="${uiClasses.text.heading}">Add product</p>
          <p class="${uiClasses.text.metadata}">Create a new product record. Existing records are edited inline on the products page.</p>
        </div>
        <div id="product-add-feedback" class="${uiClasses.text.feedback}"></div>
        <form
          class="${uiClasses.layout.space.y4}"
          hx-post="/products/create"
          hx-target="#product-add-feedback"
          hx-swap="innerHTML"
        >
          <label class="${uiClasses.text.labelBright} block space-y-1">
            SKU
            <input
              class="${uiClasses.input.base}"
              type="text"
              name="sku"
              required
              placeholder="SKU-12345"
            />
          </label>
          <label class="${uiClasses.text.labelBright} block space-y-1">
            Name
            <input
              class="${uiClasses.input.base}"
              type="text"
              name="name"
              required
              placeholder="Brand / Product"
            />
          </label>
          <div class="grid gap-3 sm:grid-cols-2">
            <label class="${uiClasses.text.labelBright} block">
              Status
              <select
                class="${uiClasses.input.select}"
                name="status"
                required
              >
                ${statusOptions}
              </select>
            </label>
            <label class="${uiClasses.text.labelBright} block">
              Cost (SGD)
              <input
                class="${uiClasses.input.base}"
                type="number"
                min="0"
                step="0.01"
                name="cost"
                placeholder="0.00"
              />
            </label>
          </div>
          <label class="${uiClasses.text.labelBright} block">
            Supplier
            <select
              class="${uiClasses.input.select}"
              name="supplierId"
            >
              ${supplierOptions}
            </select>
          </label>
          <label class="${uiClasses.text.labelBright} block space-y-1">
            Supplier link
            <input
              class="${uiClasses.input.base}"
              type="url"
              name="supplierLink"
              placeholder="https://supplier.example.com"
            />
          </label>
          <label class="${uiClasses.text.labelBright} block space-y-1">
            Purchase remarks
            <textarea
              class="${uiClasses.input.textarea}"
              name="purchaseRemarks"
              rows="2"
              placeholder="Delivery details, packaging notes, etc."
            ></textarea>
          </label>
          <div class="${uiClasses.layout.space.y2}">
            <p class="${uiClasses.text.labelBright}">Stores</p>
            <div class="flex flex-wrap gap-2">
              ${shopOptions || `<p class="${uiClasses.text.bodySmall} text-white/60">No stores configured.</p>`}
            </div>
          </div>
          <div class="${uiClasses.layout.space.y2}">
            <p class="${uiClasses.text.labelBright} hidden text-amber-400" data-add-unique-sku-warning>
              SKU already exists. Choose a different identifier.
            </p>
            <p class="${uiClasses.text.labelBright} hidden text-amber-400" data-add-unique-name-warning>
              Product name already exists. Use a unique name.
            </p>
          </div>
          <button
            type="submit"
            class="${uiClasses.button.primaryCompact}"
          >
            Add product
          </button>
        </form>
      </div>
    </section>
  `

  const script = `
    <script src="https://unpkg.com/htmx.org@1.9.2"></script>
    <script>
      document.addEventListener('DOMContentLoaded', () => {
        const products = ${productJson}
        const form = document.querySelector('[hx-post="/products/create"]')
        if (!form) return
        const skuInput = form.querySelector('[name="sku"]')
        const nameInput = form.querySelector('[name="name"]')
        const skuWarning = document.querySelector('[data-add-unique-sku-warning]')
        const nameWarning = document.querySelector('[data-add-unique-name-warning]')
        const skuSet = new Set(products.map((product) => product.skuRaw.toLowerCase()))
        const nameSet = new Set(products.map((product) => product.nameRaw.toLowerCase()))
        const toggleWarning = (element, condition) => {
          if (!element) return
          element.classList.toggle('hidden', !condition)
        }
        const validateUniqueness = () => {
          const skuValue = (skuInput?.value || '').trim().toLowerCase()
          const nameValue = (nameInput?.value || '').trim().toLowerCase()
          toggleWarning(skuWarning, Boolean(skuValue && skuSet.has(skuValue)))
          toggleWarning(nameWarning, Boolean(nameValue && nameSet.has(nameValue)))
        }
        skuInput?.addEventListener('input', validateUniqueness)
        nameInput?.addEventListener('input', validateUniqueness)
      })
    </script>
  `

  const mainContent = `${form}${script}`
  return layout('products', 'Add product - GenTech', '', mainContent)
}
