import { layout } from '../layout.ui'
import { uiClasses, cx } from '../styles/classes.ui'
import type { CategoryPagePayload } from '../../services/categories.service'
import { escapeHtml } from '../../domain/formatters.domain'

const escapeAttr = (value: string) => value.replace(/"/g, '&quot;')

const renderParentOptions = (
  currentId: number,
  currentParentId: number | null,
  options: CategoryPagePayload['parentOptions']
) => {
  const entries = options
    .filter((option) => option.id !== currentId)
    .map(
      (option) =>
        `<option value="${option.id}" ${option.id === currentParentId ? 'selected' : ''}>${escapeHtml(
          option.name
        )}</option>`
    )
  return [
    '<option value="">No parent</option>',
    ...entries,
  ].join('')
}

const renderCategoryRow = (
  category: CategoryPagePayload['categories'][number],
  options: CategoryPagePayload['parentOptions']
) => {
  const parentLabel = category.parentName ? escapeHtml(category.parentName) : 'None'
  const deleteDisabled = category.childCount > 0 || category.productUsage > 0
  const deleteReason = deleteDisabled
    ? 'Remove child categories and product links before deleting.'
    : ''

  return `<article class="${uiClasses.card.compact}">
    <div class="${uiClasses.layout.flex.betweenStart}">
      <div class="${uiClasses.layout.space.y2} flex-1 min-w-[16rem]">
        <p class="${uiClasses.text.headingBold} tracking-[0.35em]">${escapeHtml(category.name)}</p>
        <p class="${uiClasses.text.metadata}">Parent: <span class="text-white">${parentLabel}</span></p>
        <p class="${uiClasses.text.metadataSmall} text-white/70">Children: ${category.childCount} • Used by products: ${category.productUsage}</p>
      </div>
      <div class="flex flex-col gap-2">
        <form class="space-y-2" action="/categories/delete" method="post">
          <input type="hidden" name="id" value="${category.id}" />
          <button type="submit" class="${uiClasses.button.dangerCompact} ${deleteDisabled ? 'opacity-50 pointer-events-none' : ''}" ${deleteDisabled ? 'disabled' : ''}>
            Delete
          </button>
        </form>
        ${deleteReason ? `<p class="${cx(uiClasses.text.metadataSmall, 'text-amber-300 max-w-xs')}">${deleteReason}</p>` : ''}
      </div>
    </div>
    <form class="${uiClasses.layout.space.y2}" action="/categories/update" method="post">
      <input type="hidden" name="id" value="${category.id}" />
      <label class="${uiClasses.text.labelBright} block space-y-1">
        Name
        <input class="${uiClasses.input.base}" type="text" name="name" required value="${escapeAttr(category.name)}" />
      </label>
      <label class="${uiClasses.text.labelBright} block space-y-1">
        Parent category
        <select class="${uiClasses.input.select}" name="parentId">
          ${renderParentOptions(category.id, category.parentId, options)}
        </select>
      </label>
      <div class="${uiClasses.layout.flex.gap3}">
        <button type="submit" class="${uiClasses.button.successCompact}">Save</button>
        <a class="${uiClasses.button.ghost}" href="/categories">Reset</a>
      </div>
    </form>
  </article>`
}

export const categoriesPage = (
  payload: CategoryPagePayload,
  feedbackMessage = '',
  feedbackClass = uiClasses.text.feedback
) => {
  const feedback = feedbackMessage ? `<div class="${feedbackClass}">${feedbackMessage}</div>` : ''

  const createForm = `<section class="${uiClasses.panel.compact}">
    <p class="${uiClasses.text.headingBold} tracking-[0.35em]">Add Category</p>
    <form class="grid gap-3 sm:grid-cols-2" action="/categories/create" method="post">
      <label class="${uiClasses.text.labelBright} block space-y-1">
        Name
        <input class="${uiClasses.input.base}" type="text" name="name" required placeholder="Accessories" />
      </label>
      <label class="${uiClasses.text.labelBright} block space-y-1">
        Parent category (optional)
        <select class="${uiClasses.input.select}" name="parentId">
          <option value="">No parent</option>
          ${payload.parentOptions
            .map((option) => `<option value="${option.id}">${escapeHtml(option.name)}</option>`)
            .join('')}
        </select>
      </label>
      <div class="sm:col-span-2 flex flex-wrap gap-3">
        <button type="submit" class="${uiClasses.button.primaryCompact}">Create</button>
      </div>
    </form>
  </section>`

  const categoryList = payload.categories.length
    ? payload.categories.map((category) => renderCategoryRow(category, payload.parentOptions)).join('')
    : `<p class="${uiClasses.text.bodySmall}">No categories recorded.</p>`

  const listingSection = `<section class="${uiClasses.panel.base}">
    <div class="${uiClasses.layout.flex.between}">
      <p class="${uiClasses.text.headingBold} tracking-[0.35em]">Categories</p>
      <span class="${uiClasses.text.metadataSmall}">${payload.categories.length} total</span>
    </div>
    <div class="${uiClasses.layout.space.y3}">
      ${categoryList}
    </div>
  </section>`

  const mainContent = `
    ${feedback}
    ${createForm}
    ${listingSection}
  `

  return layout('categories', 'Categories - GenTech', '', mainContent)
}
