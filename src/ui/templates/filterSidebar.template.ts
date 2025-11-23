import { renderSidebar } from './sidebar.template'
import { uiClasses } from '../styles/classes.ui'

/**
 * Reusable filter sidebar templates
 * Provides standardized sort and filter UI components
 */

/**
 * Represents a single filter or sort option
 */
export interface FilterOption {
  label: string
  value: string | number
  checked: boolean
}

/**
 * Configuration for a filter section
 */
export interface FilterSection {
  title: string
  type: 'radio' | 'checkbox'
  name: string
  options: FilterOption[]
  maxHeight?: string
  emptyMessage?: string
}

/**
 * Options for rendering a filter sidebar
 */
export interface FilterSidebarOptions {
  id: string
  title: string
  action: string
  method?: 'get' | 'post'
  hiddenInputs?: Record<string, string>
  sections: FilterSection[]
  submitLabel?: string
  cancelLabel?: string
}

/**
 * Sanitizes input values for HTML attributes
 */
const sanitizeInputValue = (value: string): string => {
  return value.replace(/"/g, '&quot;')
}

/**
 * Renders a single filter option (radio or checkbox)
 */
const renderFilterOption = (option: FilterOption, type: 'radio' | 'checkbox', name: string): string => {
  const inputClass = type === 'radio' ? uiClasses.input.radio : uiClasses.input.checkbox
  return `<label class="flex items-center gap-3 text-sm text-white/80">
    <input
      type="${type}"
      name="${name}"
      value="${option.value}"
      class="${inputClass}"
      ${option.checked ? 'checked' : ''}
    />
    <span>${option.label}</span>
  </label>`
}

/**
 * Renders a filter section with title and options
 */
const renderFilterSection = (section: FilterSection): string => {
  const maxHeightClass = section.maxHeight || 'max-h-48'
  const optionsMarkup = section.options.length
    ? section.options.map((opt) => renderFilterOption(opt, section.type, section.name)).join('')
    : `<p class="text-sm text-white/50">${section.emptyMessage || `No ${section.title.toLowerCase()}`}</p>`

  return `<div class="${uiClasses.layout.space.y2}">
    <p class="${uiClasses.text.labelBright}">${section.title}</p>
    <div class="${uiClasses.layout.space.y2} ${maxHeightClass} overflow-y-auto pr-2">
      ${optionsMarkup}
    </div>
  </div>`
}

/**
 * Renders a filter sidebar with sort and filter sections
 *
 * @param options - Filter sidebar configuration
 * @returns HTML string for the filter sidebar
 *
 * @example
 * ```typescript
 * renderFilterSidebar({
 *   id: 'product-filters',
 *   title: 'Sort & Filter',
 *   action: '/products',
 *   sections: [
 *     {
 *       title: 'Sort by',
 *       type: 'radio',
 *       name: 'sort',
 *       options: [
 *         { label: 'Name (A-Z)', value: 'name-asc', checked: true },
 *         { label: 'Name (Z-A)', value: 'name-desc', checked: false },
 *       ],
 *     },
 *     {
 *       title: 'Status',
 *       type: 'checkbox',
 *       name: 'statusId',
 *       options: [
 *         { label: 'Active', value: 1, checked: false },
 *         { label: 'Inactive', value: 2, checked: false },
 *       ],
 *     },
 *   ],
 * })
 * ```
 */
export const renderFilterSidebar = (options: FilterSidebarOptions): string => {
  const method = options.method || 'get'
  const submitLabel = options.submitLabel || 'Apply'
  const cancelLabel = options.cancelLabel || 'Cancel'

  const hiddenInputsMarkup = options.hiddenInputs
    ? Object.entries(options.hiddenInputs)
        .map(([name, value]) => `<input type="hidden" name="${name}" value="${sanitizeInputValue(value)}" />`)
        .join('')
    : ''

  const sectionsMarkup = options.sections.map(renderFilterSection).join('')

  const formBody = `<form action="${options.action}" method="${method}" class="${uiClasses.layout.space.y4}">
    ${hiddenInputsMarkup}
    ${sectionsMarkup}
    <div class="flex items-center gap-3">
      <button type="submit" class="${uiClasses.button.primary}">${submitLabel}</button>
      <button type="button" data-sidebar-close class="${uiClasses.button.secondary}">
        ${cancelLabel}
      </button>
    </div>
  </form>`

  return renderSidebar({
    id: options.id,
    title: options.title,
    body: formBody,
  })
}

/**
 * Helper to create sort section configuration
 */
export const createSortSection = (
  options: Array<{ label: string; value: string | number }>,
  currentSort: string,
  name: string = 'sort'
): FilterSection => ({
  title: 'Sort by',
  type: 'radio',
  name,
  options: options.map((opt) => ({
    ...opt,
    checked: opt.value === currentSort,
  })),
})

/**
 * Helper to create filter section configuration
 */
export const createFilterSection = (
  title: string,
  name: string,
  options: Array<{ label: string; value: string | number }>,
  selectedValues: (string | number)[]
): FilterSection => ({
  title,
  type: 'checkbox',
  name,
  options: options.map((opt) => ({
    ...opt,
    checked: selectedValues.includes(opt.value),
  })),
})
