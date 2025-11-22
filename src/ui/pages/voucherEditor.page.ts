import { layout } from '../layout.ui'
import { editorBaseScript, renderEditorShell } from '../templates/editor.template'
import { VouchersPagePayload } from '../../services/vouchers.service'

const safeJson = (data: unknown) =>
  JSON.stringify(data).replace(/<\/script>/g, '<\\/script>')

export const voucherEditorPage = (payload: VouchersPagePayload) => {
  const { shops, voucherDiscountTypes, voucherTypes, vouchers } = payload
  const shopOptions = shops
    .map((shop) => `<option value="${shop.id}">${shop.name}</option>`)
    .join('')
  const discountOptions = voucherDiscountTypes
    .map((type) => `<option value="${type.id}">${type.label}</option>`)
    .join('')
  const voucherTypeOptions = voucherTypes
    .map((type) => `<option value="${type.id}">${type.name}</option>`)
    .join('')
  const voucherEntries = vouchers.map((voucher) => {
    const label = `#${voucher.id} - ${voucher.shopName} - ${voucher.voucherCategoryLabel} / ${voucher.voucherDiscountTypeLabel}`
    return { label, voucher }
  })
  const voucherSelectOptions = voucherEntries
    .map(({ label, voucher }) => `<option value="${voucher.id}">${label}</option>`)
    .join('')
  const voucherEntriesJson = safeJson(voucherEntries)
  const formBody = `
    <input type="hidden" name="voucherId" value="" />
    <div
      data-editor-mode-section="edit"
      class="hidden space-y-2 rounded border border-white/5 p-3 bg-black/60"
    >
      <label class="text-xs uppercase tracking-[0.3em] text-white/70 block">
        Voucher to edit
        <select
          class="mt-1 w-full rounded border border-white/10 bg-white/5 px-2 py-1 text-sm text-white"
          name="existingVoucher"
        >
          <option value="">Select a voucher</option>
          ${voucherSelectOptions}
        </select>
      </label>
      <p class="text-[0.65rem] uppercase tracking-[0.3em] text-white/50">
        Select a voucher above to edit its rules, then submit once updates are ready.
      </p>
    </div>
    <div
      data-editor-mode-section="delete"
      class="hidden space-y-3 rounded border border-red-500/40 bg-black/80 p-4"
    >
      <p class="text-[0.65rem] uppercase tracking-[0.3em] text-red-400">
        Deleting a voucher cannot be undone.
      </p>
      <label class="text-xs uppercase tracking-[0.3em] text-white/70 block">
        Voucher to delete
        <select
          class="mt-1 w-full rounded border border-white/10 bg-white/5 px-2 py-1 text-sm text-white"
          name="deleteVoucherSelection"
          data-editor-delete-selection
        >
          <option value="">Select a voucher</option>
          ${voucherSelectOptions}
        </select>
      </label>
      <label class="text-xs uppercase tracking-[0.3em] text-white/70 block">
        Confirm deletion
        <input
          class="mt-1 w-full rounded border border-white/10 bg-white/5 px-2 py-1 text-sm text-white"
          name="confirmation"
          data-editor-delete-confirmation
          placeholder="Type voucher label to confirm"
          autocomplete="off"
        />
      </label>
    </div>
    <div data-editor-mode-section="add edit" class="space-y-4">
      <label class="text-xs uppercase tracking-[0.3em] text-white/70 block">
        Shop
        <select
          class="mt-1 w-full rounded border border-white/10 bg-white/5 px-2 py-1 text-sm text-white"
          name="shopId"
          required
        >
          <option value="" disabled selected>Select a shop</option>
          ${shopOptions}
        </select>
      </label>
      <label class="text-xs uppercase tracking-[0.3em] text-white/70 block">
        Voucher type
        <select
          class="mt-1 w-full rounded border border-white/10 bg-white/5 px-2 py-1 text-sm text-white"
          name="voucherTypeId"
          required
        >
          <option value="" disabled selected>Select a type</option>
          ${voucherTypeOptions}
        </select>
      </label>
      <label class="text-xs uppercase tracking-[0.3em] text-white/70 block">
        Discount type
        <select
          class="mt-1 w-full rounded border border-white/10 bg-white/5 px-2 py-1 text-sm text-white"
          name="voucherDiscountTypeId"
          required
        >
          <option value="" disabled selected>Select a discount</option>
          ${discountOptions}
        </select>
      </label>
      <div class="grid gap-3 sm:grid-cols-3">
        <label class="text-xs uppercase tracking-[0.3em] text-white/70 block">
          Minimum spend (SGD)
          <input
            class="mt-1 w-full rounded border border-white/10 bg-white/5 px-2 py-1 text-sm text-white"
            type="number"
            min="0"
            step="0.01"
            name="minSpend"
            placeholder="0.00"
            required
          />
        </label>
        <label class="text-xs uppercase tracking-[0.3em] text-white/70 block">
          Discount amount
          <input
            class="mt-1 w-full rounded border border-white/10 bg-white/5 px-2 py-1 text-sm text-white"
            type="number"
            min="0"
            step="0.01"
            name="discount"
            placeholder="0.00"
            required
          />
        </label>
        <label class="text-xs uppercase tracking-[0.3em] text-white/70 block">
          Max discount (SGD)
          <input
            class="mt-1 w-full rounded border border-white/10 bg-white/5 px-2 py-1 text-sm text-white"
            type="number"
            min="0"
            step="0.01"
            name="maxDiscount"
            placeholder="0.00"
          />
        </label>
      </div>
    </div>
  `
  const editor = renderEditorShell({
    heading: 'Voucher editor',
    description: 'Choose add, edit, or delete and configure the voucher details.',
    formId: 'voucher-editor-form',
    modeSelectId: 'voucher-editor-mode',
    feedbackId: 'voucher-editor-feedback',
    formBody,
    addAction: '/vouchers/save',
    editAction: '/vouchers/save',
    deleteAction: '/vouchers/delete',
    modeOptions: `
      <option value="add" selected>Add voucher</option>
      <option value="edit">Update voucher</option>
      <option value="delete">Delete voucher</option>
    `,
    addLabel: 'Add voucher',
    editLabel: 'Update voucher',
    deleteLabel: 'Delete voucher',
  })
  const script = `
    ${editorBaseScript}
    <script>
      document.addEventListener('DOMContentLoaded', () => {
        const voucherEntries = ${voucherEntriesJson}
        const form = document.querySelector('[data-editor-form="voucher-editor-form"]')
        if (!form) return
        const modeSelect = document.querySelector('[data-editor-mode-select]')
        const selectionInput = form.querySelector('[name="existingVoucher"]')
        const voucherIdInput = form.querySelector('[name="voucherId"]')
        const shopSelect = form.querySelector('[name="shopId"]')
        const typeSelect = form.querySelector('[name="voucherTypeId"]')
        const discountSelect = form.querySelector('[name="voucherDiscountTypeId"]')
        const minSpendInput = form.querySelector('[name="minSpend"]')
        const discountInput = form.querySelector('[name="discount"]')
        const maxDiscountInput = form.querySelector('[name="maxDiscount"]')
        const voucherMap = new Map(
          voucherEntries.map(({ label, voucher }) => [String(voucher.id), voucher])
        )
        const voucherLabelMap = new Map(voucherEntries.map(({ label, voucher }) => [String(voucher.id), label]))
        const deleteSelectionInput = form.querySelector('[data-editor-delete-selection]')
        const deleteConfirmationInput = form.querySelector('[data-editor-delete-confirmation]')
        const centsToDisplay = (value) => (value / 100).toFixed(2)
        const resolveDiscountValue = (voucher) =>
          voucher.voucherDiscountTypeKey === 'percentage'
            ? voucher.discount.toFixed(2)
            : centsToDisplay(voucher.discount)

        const getCurrentMode = () => (modeSelect?.value ?? 'add')
        const isEditMode = () => getCurrentMode() === 'edit'
        const isDeleteMode = () => getCurrentMode() === 'delete'
        const updateSelectionRequirement = () => {
          if (selectionInput) {
            selectionInput.required = isEditMode()
          }
        }
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
            : 'Type voucher label to confirm'
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
          if (voucherIdInput) {
            voucherIdInput.value = ''
          }
        }

        const submitButton = form.querySelector('[data-editor-submit]')
        const markSelectionValidity = (valid) => {
          if (selectionInput) {
            selectionInput.setCustomValidity(valid ? '' : 'Select a matching voucher before submitting.')
          }
        }
        const updateSubmitState = () => {
          if (!submitButton) return
          submitButton.removeAttribute('disabled')
          if (isEditMode()) {
            const hasSelection = Boolean(voucherIdInput?.value)
            markSelectionValidity(hasSelection)
            return
          }
          if (isDeleteMode()) {
            const candidateId = (deleteSelectionInput?.value ?? '').toString().trim()
            const match = voucherMap.get(candidateId)
            const hasSelection = Boolean(match)
            voucherIdInput && (voucherIdInput.value = hasSelection ? String(match.id) : '')
            if (!hasSelection) {
              deleteSelectionInput &&
                deleteSelectionInput.setCustomValidity('Select a matching voucher before submitting.')
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
          markSelectionValidity(true)
        }

        const fillFields = (voucher) => {
          if (!voucher) {
            voucherIdInput && (voucherIdInput.value = '')
            markSelectionValidity(false)
            updateSubmitState()
            return
          }
          voucherIdInput && (voucherIdInput.value = String(voucher.id))
          shopSelect && (shopSelect.value = String(voucher.shopId))
          typeSelect && (typeSelect.value = voucher.voucherTypeId ? String(voucher.voucherTypeId) : '')
          discountSelect && (discountSelect.value = String(voucher.voucherDiscountTypeId))
          minSpendInput && (minSpendInput.value = centsToDisplay(voucher.minSpend))
          discountInput && (discountInput.value = resolveDiscountValue(voucher))
          maxDiscountInput &&
            (maxDiscountInput.value =
              typeof voucher.maxDiscount === 'number' ? centsToDisplay(voucher.maxDiscount) : '')
          markSelectionValidity(true)
          updateSubmitState()
        }

        selectionInput?.addEventListener('change', (event) => {
          if (!isEditMode()) return
          const candidateId = (event.target.value ?? '').toString().trim()
          const match = voucherMap.get(candidateId)
          fillFields(match)
          updateSubmitState()
        })
        deleteSelectionInput?.addEventListener('change', (event) => {
          const candidateId = (event.target.value ?? '').toString().trim()
          const matchLabel = voucherLabelMap.get(candidateId) ?? candidateId
          updateDeletePlaceholder(matchLabel)
          if (deleteConfirmationInput) {
            deleteConfirmationInput.value = ''
          }
          voucherIdInput && (voucherIdInput.value = candidateId ? candidateId : '')
          updateSubmitState()
        })
        deleteConfirmationInput?.addEventListener('input', updateSubmitState)

        modeSelect?.addEventListener('change', () => {
          clearDeleteSelection()
          const nextMode = getCurrentMode()
          if (nextMode === 'add') {
            voucherIdInput && (voucherIdInput.value = '')
            form.reset()
          } else {
            selectionInput && (selectionInput.value = '')
            voucherIdInput && (voucherIdInput.value = '')
          }
          markSelectionValidity(false)
          updateSelectionRequirement()
          updateDeleteRequirement()
          updateSubmitState()
        })
        updateSelectionRequirement()
        updateDeleteRequirement()
        clearDeleteSelection()
        markSelectionValidity(false)
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
  return layout('vouchers', 'Manage vouchers - GenTech', '', mainContent, editorHeadExtras)
}
