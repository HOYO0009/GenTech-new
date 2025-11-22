import { uiClasses } from '../styles/classes.ui'

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

export type SearchSortTemplateOptions = {
  searchId: string
  searchName?: string
  searchPlaceholder?: string
  searchValue?: string
  action?: string
  variant?: 'section' | 'inline'
  openEditorHref?: string
  openEditorLabel?: string
  sidebarId?: string
  sidebarTriggerLabel?: string
  hiddenParams?: Record<string, string[]>
}

const defaultModeOptions = (addLabel: string, editLabel: string) => `
      <option value="add" selected>${addLabel}</option>
      <option value="edit">${editLabel}</option>
`

export const renderEditorShell = (options: EditorShellOptions) => {
  const modes = options.modeOptions ?? defaultModeOptions(options.addLabel, options.editLabel)
  const deleteActionAttr = options.deleteAction ? ` data-editor-delete-action="${options.deleteAction}"` : ''
  const deleteLabel = options.deleteLabel ?? 'Delete'
  return `<section class="${uiClasses.panel.base}">
      <div class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p class="${uiClasses.text.heading}">${options.heading}</p>
          <p class="${uiClasses.text.metadata}">${options.description}</p>
        </div>
        <label class="${uiClasses.text.labelBright} flex flex-col">
          Action
          <select
            id="${options.modeSelectId}"
            data-editor-mode-select="${options.formId}"
            class="${uiClasses.input.select}"
          >
            ${modes}
          </select>
        </label>
      </div>
      <div id="${options.feedbackId}" data-editor-feedback class="${uiClasses.text.feedback}"></div>
      <form
        data-editor-form="${options.formId}"
        data-editor-mode-select-id="${options.modeSelectId}"
        data-editor-add-action="${options.addAction}"
        data-editor-edit-action="${options.editAction}"
        ${deleteActionAttr}
        hx-post="${options.addAction}"
        hx-target="#${options.feedbackId}"
        hx-swap="innerHTML"
        class="${uiClasses.layout.space.y4}"
      >
        ${options.formBody}
        <button
          type="submit"
          class="${uiClasses.button.primary}"
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

export const renderSearchSortControls = (options: SearchSortTemplateOptions) => {
  const searchName = options.searchName ?? 'search'
  const searchPlaceholder = options.searchPlaceholder ?? 'Search products'
  const actionAttr = options.action ? ` action="${options.action}" method="get"` : ''
  const variant = options.variant ?? 'section'
  const wrapperStart =
    variant === 'section' ? `<section class="${uiClasses.panel.base}">` : ''
  const wrapperEnd = variant === 'section' ? '</section>' : ''
  const formLayout =
    variant === 'section'
      ? uiClasses.layout.grid.searchControlsSection
      : uiClasses.layout.grid.searchControls
  const openEditorLabel = options.openEditorLabel ?? 'Open editor'
  const sidebarTriggerLabel = options.sidebarTriggerLabel ?? 'Sort & Filter'
  const hiddenInputs = Object.entries(options.hiddenParams ?? {})
    .flatMap(([key, values]) =>
      values.map(
        (value) =>
          `<input type="hidden" name="${key}" value="${value.replace(/"/g, '&quot;')}" />`
      )
    )
    .join('')
  return `${wrapperStart}
      <form id="${options.searchId}-form" class="${formLayout}" ${actionAttr}>
        <label class="flex flex-col gap-2 ${uiClasses.text.labelBright}">
          Search
          <input
            id="${options.searchId}"
            name="${searchName}"
            type="search"
            placeholder="${searchPlaceholder}"
            class="${uiClasses.input.search}"
            value="${options.searchValue ? options.searchValue : ''}"
            data-shortcut-target="search"
          />
        </label>
        ${hiddenInputs}
        ${
          options.sidebarId
            ? `<button type="button" data-sidebar-trigger="${options.sidebarId}" data-shortcut-target="sidebar" class="${uiClasses.button.secondaryCompact} w-full md:w-auto">
                ${sidebarTriggerLabel}
              </button>`
            : ''
        }
        ${
          options.openEditorHref
            ? `<a href="${options.openEditorHref}" data-shortcut-target="editor" class="${uiClasses.button.primary} md:w-auto text-center">${openEditorLabel}</a>`
            : ''
        }
      </form>
    ${wrapperEnd}`
}

export const editorBaseScript = `
    <script>
      document.addEventListener('DOMContentLoaded', () => {
        const editorForms = document.querySelectorAll('[data-editor-form]')
        editorForms.forEach((form) => {
          const formId = form.dataset.editorForm
          const modeSelect =
            (formId
              ? document.querySelector(\`[data-editor-mode-select="\${formId}"]\`)
              : null) ||
            (form.dataset.editorModeSelectId
              ? document.getElementById(form.dataset.editorModeSelectId)
              : null) ||
            form.querySelector('[data-editor-mode-select]')
          if (!modeSelect) return
          const sections = form.querySelectorAll('[data-editor-mode-section]')
          const submitButton = form.querySelector('[data-editor-submit]')
          const addAction = form.dataset.editorAddAction
          const editAction = form.dataset.editorEditAction
          const deleteAction = form.dataset.editorDeleteAction
          const applyMode = (mode) => {
            form.dataset.editorMode = mode
            sections.forEach((section) => {
              const target = section.dataset.editorModeSection
              const modes = target ? target.split(/\\s+/).filter(Boolean) : ['both']
              const shouldHide = !modes.includes('both') && !modes.includes(mode)
              section.classList.toggle('hidden', shouldHide)
              const controls = section.querySelectorAll('input, select, textarea, button')
              controls.forEach((control) => {
                if (shouldHide) {
                  if (control.required) {
                    control.dataset.editorWasRequired = 'true'
                    control.required = false
                  }
                  return
                }
                if (control.dataset.editorWasRequired === 'true') {
                  control.required = true
                }
                delete control.dataset.editorWasRequired
              })
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
      })
    </script>`
