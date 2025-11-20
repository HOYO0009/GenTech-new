export type EditorShellOptions = {
  heading: string
  description: string
  formId: string
  modeSelectId: string
  feedbackId: string
  formBody: string
  addAction: string
  editAction: string
  deleteAction?: string
  addLabel: string
  editLabel: string
  deleteLabel?: string
  modeOptions?: string
}

const defaultModeOptions = (addLabel: string, editLabel: string) => `
      <option value="add" selected>${addLabel}</option>
      <option value="edit">${editLabel}</option>
`

export const renderEditorShell = (options: EditorShellOptions) => {
  const modes = options.modeOptions ?? defaultModeOptions(options.addLabel, options.editLabel)
  const deleteActionAttr = options.deleteAction ? ` data-editor-delete-action="${options.deleteAction}"` : ''
  const deleteLabel = options.deleteLabel ?? 'Delete'
  return `<section class="rounded-2xl border border-white/10 bg-black/70 p-6 space-y-4">
      <div class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p class="text-sm uppercase tracking-[0.3em] text-white/70">${options.heading}</p>
          <p class="text-[0.65rem] uppercase tracking-[0.4em] text-white/50">${options.description}</p>
        </div>
        <label class="text-[0.65rem] uppercase tracking-[0.3em] text-white/70 flex flex-col">
          Action
          <select
            id="${options.modeSelectId}"
            data-editor-mode-select
            class="mt-1 w-full rounded border border-white/10 bg-white/5 px-2 py-1 text-sm text-white"
          >
            ${modes}
          </select>
        </label>
      </div>
      <div id="${options.feedbackId}" data-editor-feedback class="text-sm text-white/70 uppercase tracking-[0.3em]"></div>
      <form
        data-editor-form="${options.formId}"
        data-editor-add-action="${options.addAction}"
        data-editor-edit-action="${options.editAction}"
        ${deleteActionAttr}
        hx-post="${options.addAction}"
        hx-target="#${options.feedbackId}"
        hx-swap="innerHTML"
        class="space-y-4"
      >
        ${options.formBody}
        <button
          type="submit"
          class="primary-btn w-full"
          data-editor-submit
          data-editor-add-label="${options.addLabel}"
          data-editor-edit-label="${options.editLabel}"
          data-editor-delete-label="${deleteLabel}"
        >
          ${options.addLabel}
        </button>
      </form>
    </section>`
}

export const editorBaseScript = `
    <script>
      document.addEventListener('DOMContentLoaded', () => {
        const form = document.querySelector('[data-editor-form]')
        const modeSelect = document.querySelector('[data-editor-mode-select]')
        if (!form || !modeSelect) return
        const sections = form.querySelectorAll('[data-editor-mode-section]')
        const submitButton = form.querySelector('[data-editor-submit]')
        const addAction = form.dataset.editorAddAction
        const editAction = form.dataset.editorEditAction
        const deleteAction = form.dataset.editorDeleteAction
        const applyMode = (mode) => {
          form.dataset.editorMode = mode
          sections.forEach((section) => {
            const target = section.dataset.editorModeSection
            const modes = target ? target.split(/\s+/).filter(Boolean) : ['both']
            const shouldHide = !modes.includes('both') && !modes.includes(mode)
            section.classList.toggle('hidden', shouldHide)
          })
          if (submitButton) {
            let label = submitButton.dataset.editorAddLabel
            if (mode === 'edit') {
              label = submitButton.dataset.editorEditLabel
            } else if (mode === 'delete') {
              label = submitButton.dataset.editorDeleteLabel
            }
            if (label) {
              submitButton.textContent = label
            }
          }
          if (mode === 'edit' && editAction) {
            form.setAttribute('hx-post', editAction)
          } else if (mode === 'delete' && deleteAction) {
            form.setAttribute('hx-post', deleteAction)
          } else if (addAction) {
            form.setAttribute('hx-post', addAction)
          }
        }
        applyMode(modeSelect.value || 'add')
        modeSelect.addEventListener('change', (event) => {
          applyMode(event.target.value)
        })
      })
    </script>`
