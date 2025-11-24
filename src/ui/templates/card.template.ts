import { uiClasses, cx } from '../styles/classes.ui'

/**
 * Generic card templates
 * Provides reusable card components with consistent styling
 */

/**
 * Represents a single field in a card
 */
export interface CardField {
  label: string
  value: string
  dataAttributes?: Record<string, string | number>
  isLink?: boolean
  href?: string
  rel?: string
  target?: string
  className?: string
  valueClassName?: string
}

/**
 * Card header configuration
 */
export interface CardHeader {
  title: string
  titleClassName?: string
  metadata?: string
  metadataClassName?: string
}

/**
 * Options for rendering a generic card
 */
export interface CardOptions {
  header: CardHeader
  subtitle?: string
  subtitleClassName?: string
  secondarySubtitle?: string
  secondarySubtitleClassName?: string
  fields: CardField[]
  gridColumns?: 2 | 3
  additionalContent?: string
  cardClassName?: string
  withShadow?: boolean
}

/**
 * Renders a field value (either as text or link)
 */
const renderFieldValue = (field: CardField): string => {
  const dataAttrs = field.dataAttributes
    ? Object.entries(field.dataAttributes)
        .map(([key, value]) => `data-${key}="${value}"`)
        .join(' ')
    : ''
  const valueClass = field.valueClassName || uiClasses.text.body
  const className = cx(valueClass, field.className)

  if (field.isLink && field.href) {
    const rel = field.rel || 'noreferrer'
    const target = field.target || '_blank'
    return `<a class="${className || uiClasses.link.primary}" href="${field.href}" target="${target}" rel="${rel}" ${dataAttrs}>${field.value}</a>`
  }

  return `<p class="${className}" ${dataAttrs}>${field.value}</p>`
}

/**
 * Renders a single field with label and value
 */
const renderField = (field: CardField): string => {
  return `<div>
    <p class="${uiClasses.text.label}">${field.label}</p>
    ${renderFieldValue(field)}
  </div>`
}

/**
 * Renders a generic card component
 *
 * @param options - Card configuration
 * @returns HTML string for the card
 *
 * @example
 * ```typescript
 * renderCard({
 *   header: { title: 'Product Name', metadata: 'SKU-123' },
 *   subtitle: 'Category',
 *   fields: [
 *     { label: 'Price', value: '$10.00' },
 *     { label: 'Stock', value: '50' },
 *   ],
 *   gridColumns: 2,
 * })
 * ```
 */
export const renderCard = (options: CardOptions): string => {
  const cardClass = options.cardClassName || (options.withShadow ? uiClasses.card.withShadow : uiClasses.card.base)
  const gridClass = options.gridColumns === 3 ? uiClasses.layout.grid.cols3 : uiClasses.layout.grid.cols2
  const titleClass = options.header.titleClassName || uiClasses.text.body
  const metadataClass = options.header.metadataClassName || uiClasses.text.metadataSmall

  const headerMarkup = options.header.metadata
    ? `<div class="${uiClasses.layout.flex.between}">
        <p class="${titleClass}">${options.header.title}</p>
        <span class="${metadataClass}">${options.header.metadata}</span>
      </div>`
    : `<p class="${titleClass}">${options.header.title}</p>`

  const subtitleMarkup = options.subtitle
    ? `<p class="${options.subtitleClassName || uiClasses.text.subtitle}">${options.subtitle}</p>`
    : ''

  const secondarySubtitleMarkup = options.secondarySubtitle
    ? `<p class="${options.secondarySubtitleClassName || uiClasses.text.subtitleSecondary}">${options.secondarySubtitle}</p>`
    : ''

  const fieldsMarkup = options.fields.length
    ? `<div class="${gridClass}">
        ${options.fields.map(renderField).join('')}
      </div>`
    : ''

  const additionalMarkup = options.additionalContent || ''

  return `<article class="${cardClass}">
      ${headerMarkup}
      ${subtitleMarkup}
      ${secondarySubtitleMarkup}
      ${fieldsMarkup}
      ${additionalMarkup}
    </article>`
}

/**
 * Renders multiple cards in a grid
 */
export const renderCardGrid = (cards: string[], emptyMessage?: string): string => {
  if (!cards.length && emptyMessage) {
    return `<p class="${uiClasses.text.bodySmall}">${emptyMessage}</p>`
  }
  return `<div class="${uiClasses.layout.space.y3}">
    ${cards.join('')}
  </div>`
}

/**
 * Client-side script for inline cards (edit/delete panels).
 * - Toggles inline panels
 * - Closes panel after successful HTMX save
 * - Clears confirmation text after a short delay
 */
export const inlineCardScript = `
    <script>
      (() => {
        const feedbackTimers = new WeakMap()

        const disableInputs = (nodes, disabled) => {
          nodes.forEach((node) => {
            if (node instanceof HTMLInputElement || node instanceof HTMLSelectElement || node instanceof HTMLTextAreaElement) {
              node.disabled = disabled
            }
          })
        }

        const syncShopCards = (card) => {
          if (!card) return
          const editing = card.dataset.inlineEditing === 'true'
          const selected = new Set(
            Array.from(card.querySelectorAll('[data-shop-checkbox]'))
              .filter((cb) => cb instanceof HTMLInputElement && cb.checked)
              .map((cb) => (cb instanceof HTMLInputElement ? cb.value : ''))
              .filter(Boolean)
          )
          card.querySelectorAll('[data-shop-card]').forEach((shopCard) => {
            const shopId = shopCard.getAttribute('data-shop-id')
            const show = shopId && selected.has(shopId)
            shopCard.classList.toggle('hidden', !show)
            disableInputs(shopCard.querySelectorAll('input, select, textarea'), !editing || !show)
          })
        }

        const setDeleteState = (card, deleting) => {
          if (!card) return
          card.dataset.inlineDeleting = deleting ? 'true' : 'false'
          const mainSections = card.querySelectorAll('[data-main-section]')
          const deleteSection = card.querySelector('[data-delete-section]')
          mainSections.forEach((section) => section.classList.toggle('hidden', deleting))
          if (deleteSection) {
            deleteSection.classList.toggle('hidden', !deleting)
            if (deleting) {
              const input = deleteSection.querySelector('input, textarea')
              if (input instanceof HTMLElement) input.focus()
            }
          }
          const deleteButton = card.querySelector('[data-inline-delete]')
          if (deleteButton instanceof HTMLButtonElement) {
            const deleteClass = deleteButton.dataset.deleteClass || deleteButton.className
            const cancelClass = deleteButton.dataset.cancelClass || deleteButton.className
            deleteButton.textContent = deleting ? 'Cancel' : 'Delete'
            deleteButton.className = deleting ? cancelClass : deleteClass
          }
          const editButton = card.querySelector('[data-inline-edit]')
          if (editButton instanceof HTMLButtonElement) {
            editButton.disabled = deleting
          }
        }

        const setEditingState = (card, editing) => {
          if (!card) return
          setDeleteState(card, false)
          card.dataset.inlineEditing = editing ? 'true' : 'false'
          const editFields = card.querySelectorAll('[data-edit-field]')
          const viewFields = card.querySelectorAll('[data-view-field]')
          editFields.forEach((field) => field.classList.toggle('hidden', !editing))
          viewFields.forEach((field) => field.classList.toggle('hidden', editing))
          disableInputs(editFields, !editing)
          editFields.forEach((field) => {
            const nestedInputs = field.querySelectorAll('input, select, textarea')
            disableInputs(nestedInputs, !editing)
          })
          const editButton = card.querySelector('[data-inline-edit]')
          if (editButton instanceof HTMLButtonElement) {
            editButton.textContent = editing ? 'Save' : 'Edit'
            editButton.type = editing ? 'submit' : 'button'
          }
          const deleteButton = card.querySelector('[data-inline-delete]')
          if (deleteButton instanceof HTMLElement) {
            const deleteClass = deleteButton.dataset.deleteClass || deleteButton.className
            const cancelClass = deleteButton.dataset.cancelClass || deleteButton.className
            deleteButton.textContent = editing ? 'Discard' : 'Delete'
            deleteButton.className = editing ? cancelClass : deleteClass
            deleteButton.dataset.inlineDiscard = editing ? 'true' : 'false'
          }
          if (editing) {
            const firstInput = card.querySelector('[data-edit-field]:not([disabled]) input, [data-edit-field]:not([disabled]) select, [data-edit-field]:not([disabled]) textarea')
            if (firstInput instanceof HTMLElement) firstInput.focus()
          }
          card.dispatchEvent(new CustomEvent('inline:refresh-prices', { detail: { card }, bubbles: true }))
          syncShopCards(card)
        }

        const scheduleFeedbackClear = (feedback) => {
          const existing = feedbackTimers.get(feedback)
          if (existing) clearTimeout(existing)
          const timer = window.setTimeout(() => {
            feedback.innerHTML = ''
            feedbackTimers.delete(feedback)
          }, 2500)
          feedbackTimers.set(feedback, timer)
        }

        const handleFeedbackSwap = (feedback) => {
          const existingTimer = feedbackTimers.get(feedback)
          if (existingTimer) {
            clearTimeout(existingTimer)
            feedbackTimers.delete(feedback)
          }
          const statusAttr =
            feedback.getAttribute('data-inline-feedback-status') ||
            feedback.querySelector('[data-inline-feedback-status]')?.getAttribute('data-inline-feedback-status') ||
            ''
          if (statusAttr !== 'success' && !feedback.matches('.text-emerald-300') && !feedback.querySelector('.text-emerald-300')) {
            return
          }
          const card = feedback.closest('[data-inline-card]')
          if (card) {
            setEditingState(card, false)
            setDeleteState(card, false)
          }
          scheduleFeedbackClear(feedback)
        }

        const initInlineCard = (card) => {
          if (!card || card.dataset.inlineReady === 'true') return
          card.dataset.inlineReady = 'true'
          setEditingState(card, false)
          syncShopCards(card)
        }

        const scanForCards = (root) => {
          const cards = root && root.matches && root.matches('[data-inline-card]')
            ? [root]
            : root && root.querySelectorAll
            ? root.querySelectorAll('[data-inline-card]')
            : []
          cards.forEach((card) => initInlineCard(card))
        }

        document.addEventListener('click', (event) => {
          const deleteToggle = event.target instanceof HTMLElement ? event.target.closest('[data-inline-delete]') : null
          const editToggle = event.target instanceof HTMLElement ? event.target.closest('[data-inline-edit]') : null
          const discard = event.target instanceof HTMLElement ? event.target.closest('[data-inline-discard]') : null
          if (deleteToggle) {
            const card = deleteToggle.closest('[data-inline-card]')
            if (!card) return
            const isDiscard = deleteToggle.dataset.inlineDiscard === 'true'
            event.preventDefault()
            if (isDiscard) {
              const form = card.querySelector('form')
              if (form instanceof HTMLFormElement) form.reset()
              setEditingState(card, false)
              return
            }
            const deleting = card.dataset.inlineDeleting === 'true'
            setDeleteState(card, !deleting)
            return
          }
          if (editToggle) {
            const card = editToggle.closest('[data-inline-card]')
            if (!card) return
            const isEditing = card.dataset.inlineEditing === 'true'
            if (!isEditing) {
              event.preventDefault()
              setEditingState(card, true)
            }
            return
          }
          if (discard) {
            const card = discard.closest('[data-inline-card]')
            if (!card) return
            event.preventDefault()
            setEditingState(card, false)
            return
          }
        })

        document.addEventListener('change', (event) => {
          const checkbox = event.target instanceof HTMLElement ? event.target.closest('[data-shop-checkbox]') : null
          if (!checkbox) return
          const card = checkbox.closest('[data-inline-card]')
          if (!card) return
          syncShopCards(card)
        })

        document.addEventListener('htmx:afterSwap', (event) => {
          const target = event.detail && event.detail.target instanceof HTMLElement ? event.detail.target : null
          if (target) {
            scanForCards(target)
            const feedbackTargets = target.querySelectorAll ? target.querySelectorAll('[data-inline-feedback]') : []
            feedbackTargets.forEach((feedback) => handleFeedbackSwap(feedback))
          }
          const card = (event.detail && event.detail.target && (event.detail.target.closest ? event.detail.target.closest('[data-inline-card]') : null)) || null
          if (card) {
            setEditingState(card, false)
            setDeleteState(card, false)
          }
        })

        document.addEventListener('htmx:afterRequest', (event) => {
          const status = event.detail && event.detail.xhr ? event.detail.xhr.status : null
          if (!status || status >= 300) return
          const elt = event.detail && event.detail.elt instanceof HTMLElement ? event.detail.elt : null
          const inlineCardId = elt && elt.matches('form[data-inline-card-id]') ? elt.getAttribute('data-inline-card-id') : null
          const card = inlineCardId ? document.querySelector('[data-inline-card=\"' + inlineCardId + '\"]') : elt?.closest?.('[data-inline-card]')
          if (card) {
            setEditingState(card, false)
            setDeleteState(card, false)
          }
        })

        document.addEventListener('inline-card-saved', (event) => {
          const detailCardId = event.detail && typeof event.detail === 'object' && 'cardId' in event.detail ? event.detail.cardId : null
          const card = detailCardId ? document.querySelector('[data-inline-card=\"' + detailCardId + '\"]') : null
          if (card) {
            setEditingState(card, false)
            setDeleteState(card, false)
          }
        })

        document.addEventListener('DOMContentLoaded', () => {
          scanForCards(document)
          const feedbackTargets = document.querySelectorAll('[data-inline-feedback]')
          feedbackTargets.forEach((feedback) => handleFeedbackSwap(feedback))
        })
      })()
    </script>
  `
