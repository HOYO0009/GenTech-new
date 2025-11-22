import { layout } from '../layout.ui'
import { editorBaseScript, renderEditorShell } from '../templates/editor.template'
import { ProductPagePayload } from '../../services/products.service'

const safeJson = (data: unknown) =>
  JSON.stringify(data).replace(/<\/script>/g, '<\\/script>')

export const productEditorPage = ({ products, statuses, suppliers }: ProductPagePayload) => {
  const statusOptions = statuses
    .map((option) => `<option value="${option.id}">${option.name}</option>`)
    .join('')
  const supplierOptions = [
    '<option value="">Unassigned</option>',
    ...suppliers.map((supplier) => `<option value="${supplier.id}">${supplier.name}</option>`),
  ].join('')
  const productSelectOptions = products
    .map((product) => `<option value="${product.sku}">${product.sku} — ${product.name}</option>`)
    .join('')
  const productJson = safeJson(products)
  const formBody = `
    <input type="hidden" name="originalSku" value="" />
    <div
      data-editor-mode-section="edit"
      class="hidden space-y-2 rounded border border-white/5 p-3 bg-black/60"
    >
      <label class="text-xs uppercase tracking-[0.3em] text-white/70 block">
        Product to edit
        <select
          class="mt-1 w-full rounded border border-white/10 bg-white/5 px-2 py-1 text-sm text-white"
          name="existingSku"
        >
          <option value="">Select a product</option>
          ${productSelectOptions}
        </select>
      </label>
      <p class="text-[0.65rem] uppercase tracking-[0.3em] text-white/50">
        Selecting an SKU will populate the fields below. Make edits and submit to save changes.
      </p>
    </div>
    <div
      data-editor-mode-section="delete"
      class="hidden space-y-3 rounded border border-red-500/40 bg-black/80 p-4"
    >
      <p class="text-[0.65rem] uppercase tracking-[0.3em] text-red-400">
        Deleting a product cannot be undone.
      </p>
      <label class="text-xs uppercase tracking-[0.3em] text-white/70 block">
        Product to delete
        <select
          class="mt-1 w-full rounded border border-white/10 bg-white/5 px-2 py-1 text-sm text-white"
          name="deleteProductSelection"
          data-editor-delete-selection
        >
          <option value="">Select a product</option>
          ${productSelectOptions}
        </select>
      </label>
      <label class="text-xs uppercase tracking-[0.3em] text-white/70 block">
        Confirm deletion
        <input
          class="mt-1 w-full rounded border border-white/10 bg-white/5 px-2 py-1 text-sm text-white"
          name="confirmation"
          data-editor-delete-confirmation
          placeholder="Type SKU to confirm"
          autocomplete="off"
        />
      </label>
    </div>
    <div data-editor-mode-section="add edit" class="space-y-4">
      <label
        data-editor-mode-section="add"
        class="hidden text-[0.7rem] uppercase tracking-[0.3em] text-amber-400"
        data-editor-unique-sku-warning
      >
        SKU already exists. Choose a different identifier.
      </label>
      <label
        data-editor-mode-section="add"
        class="hidden text-[0.7rem] uppercase tracking-[0.3em] text-amber-400"
        data-editor-unique-name-warning
      >
        Product name already exists. Use a unique name.
      </label>
      <label class="text-xs uppercase tracking-[0.3em] text-white/70 block space-y-1">
        SKU
        <input
          class="mt-1 w-full rounded border border-white/10 bg-white/5 px-2 py-1 text-sm text-white"
          type="text"
          name="sku"
          required
          placeholder="SKU-12345"
        />
      </label>
      <label class="text-xs uppercase tracking-[0.3em] text-white/70 block space-y-1">
        Name
        <input
          class="mt-1 w-full rounded border border-white/10 bg-white/5 px-2 py-1 text-sm text-white"
          type="text"
          name="name"
          required
          placeholder="Brand / Product"
        />
      </label>
      <div class="grid gap-3 sm:grid-cols-2">
        <label class="text-xs uppercase tracking-[0.3em] text-white/70 block">
          Status
          <select
            class="mt-1 w-full rounded border border-white/10 bg-white/5 px-2 py-1 text-sm text-white"
            name="status"
            required
          >
            ${statusOptions}
          </select>
        </label>
        <label class="text-xs uppercase tracking-[0.3em] text-white/70 block">
          Cost (SGD)
          <input
            class="mt-1 w-full rounded border border-white/10 bg-white/5 px-2 py-1 text-sm text-white"
            type="number"
            min="0"
            step="0.01"
            name="cost"
            placeholder="0.00"
          />
        </label>
      </div>
      <label class="text-xs uppercase tracking-[0.3em] text-white/70 block">
        Supplier
        <select
          class="mt-1 w-full rounded border border-white/10 bg-white/5 px-2 py-1 text-sm text-white"
          name="supplierId"
        >
          ${supplierOptions}
        </select>
      </label>
      <label class="text-xs uppercase tracking-[0.3em] text-white/70 block">
        Supplier link
        <input
          class="mt-1 w-full rounded border border-white/10 bg-white/5 px-2 py-1 text-sm text-white"
          type="url"
          name="supplierLink"
          placeholder="https://supplier.example.com"
        />
      </label>
      <label class="text-xs uppercase tracking-[0.3em] text-white/70 block">
        Purchase remarks
        <textarea
          class="mt-1 w-full rounded border border-white/10 bg-white/5 px-2 py-1 text-sm text-white"
          name="purchaseRemarks"
          rows="2"
          placeholder="Delivery details, packaging notes, etc."
        ></textarea>
      </label>
    </div>
  `
  const editor = renderEditorShell({
    heading: 'Product editor',
    description: 'Use the dropdown above to choose add, edit, or delete mode.',
    formId: 'product-editor-form',
    modeSelectId: 'product-editor-mode',
    feedbackId: 'product-editor-feedback',
    formBody,
    addAction: '/products/create',
    editAction: '/products/update',
    deleteAction: '/products/delete',
    modeOptions: `
      <option value="add" selected>Add product</option>
      <option value="edit">Update product</option>
      <option value="delete">Delete product</option>
    `,
    addLabel: 'Add product',
    editLabel: 'Update product',
    deleteLabel: 'Delete product',
  })
  const script = `
    ${editorBaseScript}
    <script>
      document.addEventListener('DOMContentLoaded', () => {
        const products = ${productJson}
        const form = document.querySelector('[data-editor-form="product-editor-form"]')
        if (!form) return
        const modeSelect = document.querySelector('[data-editor-mode-select]')
        const existingInput = form.querySelector('[name="existingSku"]')
        const originalSkuInput = form.querySelector('[name="originalSku"]')
        const skuInput = form.querySelector('[name="sku"]')
        const nameInput = form.querySelector('[name="name"]')
        const statusSelect = form.querySelector('[name="status"]')
        const costInput = form.querySelector('[name="cost"]')
        const supplierSelect = form.querySelector('[name="supplierId"]')
        const supplierLinkInput = form.querySelector('[name="supplierLink"]')
        const remarksInput = form.querySelector('[name="purchaseRemarks"]')
        const skuWarning = document.querySelector('[data-editor-unique-sku-warning]')
        const nameWarning = document.querySelector('[data-editor-unique-name-warning]')
        const normalizedProducts = new Map(products.map((product) => [product.sku, product]))
        const skuSet = new Set(products.map((product) => product.sku.toLowerCase()))
        const nameSet = new Set(products.map((product) => product.name.toLowerCase()))
        const deleteSelectionInput = form.querySelector('[data-editor-delete-selection]')
        const deleteConfirmationInput = form.querySelector('[data-editor-delete-confirmation]')

        const getCurrentMode = () => (modeSelect?.value ?? 'add')

        const isAddMode = () => getCurrentMode() === 'add'
        const isDeleteMode = () => getCurrentMode() === 'delete'
        const updateDeleteRequirement = () => {
          const deleteMode = isDeleteMode()
          if (deleteSelectionInput) {
            deleteSelectionInput.required = deleteMode
          }
          if (deleteConfirmationInput) {
            deleteConfirmationInput.required = deleteMode
          }
        }
        const updateDeletePlaceholder = (value) => {
          if (!deleteConfirmationInput) return
          deleteConfirmationInput.placeholder = value
            ? 'Type ' + value + ' to confirm'
            : 'Type SKU to confirm'
        }
        const clearDeleteSelection = () => {
          if (deleteSelectionInput) {
            deleteSelectionInput.value = ''
            deleteSelectionInput.setCustomValidity('')
          }
          if (deleteConfirmationInput) {
            deleteConfirmationInput.value = ''
            updateDeletePlaceholder('')
          }
          if (skuInput) {
            skuInput.value = ''
          }
        }
        const updateSelectionRequirement = () => {
          if (existingInput) {
            existingInput.required = !isAddMode()
          }
        }

        const submitButton = form.querySelector('[data-editor-submit]')
        const showWarning = (element, condition) => {
          if (!element) return
          element.classList.toggle('hidden', !condition)
        }
        const updateSubmitState = () => {
          if (!submitButton) return
          submitButton.removeAttribute('disabled')
          const currentMode = getCurrentMode()
          if (currentMode === 'add') {
            existingInput && existingInput.setCustomValidity('')
            return
          }
          if (currentMode === 'delete') {
            const typed = (deleteSelectionInput?.value ?? '').toString().trim()
            const selectionValid = Boolean(typed && normalizedProducts.has(typed))
            if (!selectionValid) {
              deleteSelectionInput &&
                deleteSelectionInput.setCustomValidity('Select a matching SKU before submitting.')
              submitButton.setAttribute('disabled', 'true')
              return
            }
            deleteSelectionInput && deleteSelectionInput.setCustomValidity('')
            const confirmationValue = (deleteConfirmationInput?.value ?? '').toString().trim()
            if (!confirmationValue) {
              submitButton.setAttribute('disabled', 'true')
              return
            }
            return
          }
          const selectionValid = Boolean(originalSkuInput.value)
          if (selectionValid) {
            existingInput && existingInput.setCustomValidity('')
          } else {
            existingInput &&
              existingInput.setCustomValidity('Please choose a matching SKU before submitting.')
          }
        }

        const clearWarnings = () => {
          showWarning(skuWarning, false)
          showWarning(nameWarning, false)
        }

        const validateUniqueness = () => {
          if (!isAddMode()) {
            clearWarnings()
            return
          }
          const skuValue = skuInput?.value.trim().toLowerCase() ?? ''
          const nameValue = nameInput?.value.trim().toLowerCase() ?? ''
          showWarning(skuWarning, Boolean(skuValue && skuSet.has(skuValue)))
          showWarning(nameWarning, Boolean(nameValue && nameSet.has(nameValue)))
        }

        const fillFields = (value) => {
          const product = normalizedProducts.get(value)
          if (!product) {
            originalSkuInput.value = ''
            updateSubmitState()
            return
          }
          skuInput.value = product.sku
          nameInput.value = product.name
          statusSelect && (statusSelect.value = String(product.statusId))
          costInput && (costInput.value = product.costCents !== null ? (product.costCents / 100).toFixed(2) : '')
          supplierSelect && (supplierSelect.value = product.supplierId ?? '')
          supplierLinkInput && (supplierLinkInput.value = product.supplierLink ?? '')
          remarksInput && (remarksInput.value = product.purchaseRemarks ?? '')
          originalSkuInput.value = product.sku
          updateSubmitState()
        }

        existingInput?.addEventListener('change', (event) => {
          if (!isAddMode()) {
            const next = (event.target.value ?? '').toString().trim()
            if (next) {
              fillFields(next)
            } else {
              fillFields('')
            }
          }
          updateSubmitState()
        })

        skuInput?.addEventListener('input', validateUniqueness)
        nameInput?.addEventListener('input', validateUniqueness)

        deleteSelectionInput?.addEventListener('change', (event) => {
          const next = (event.target.value ?? '').toString().trim()
          skuInput && (skuInput.value = next)
          updateDeletePlaceholder(next)
          if (deleteConfirmationInput) {
            deleteConfirmationInput.value = ''
          }
          updateSubmitState()
        })
        deleteConfirmationInput?.addEventListener('input', updateSubmitState)

        modeSelect?.addEventListener('change', () => {
          clearDeleteSelection()
          const nextMode = getCurrentMode()
          if (nextMode === 'add') {
            form.reset()
            originalSkuInput.value = ''
            clearWarnings()
          } else {
            existingInput && (existingInput.value = '')
            originalSkuInput.value = ''
          }
          updateSelectionRequirement()
          updateDeleteRequirement()
          updateSubmitState()
        })
        updateSelectionRequirement()
        updateDeleteRequirement()
        clearDeleteSelection()
        updateSubmitState()
      })
    </script>
  `
  const editorHeadExtras = `
    <style>
      select {
        background-color: #0f172a;
        color: #fff;
      }
      select option {
        background-color: #0f172a;
        color: #fff;
      }
      select option:checked {
        background-color: #1e293b;
        color: #fff;
      }
    </style>
    <script src="https://unpkg.com/htmx.org@1.9.2"></script>
  `
  const mainContent = `${editor}${script}`
  return layout('products', 'Manage products - GenTech', '', mainContent, editorHeadExtras)
}
