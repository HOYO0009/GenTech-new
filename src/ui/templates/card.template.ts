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
        const closePanels = (card) => {
          card.querySelectorAll('[data-inline-panel]').forEach((panel) => panel.classList.add('hidden'))
        }
        const triggerClose = (card) => {
          const closeBtn = card.querySelector('[data-inline-close]')
          if (closeBtn instanceof HTMLElement) {
            closeBtn.dispatchEvent(new Event('click', { bubbles: true }))
            return
          }
          closePanels(card)
        }
        const togglePanels = (card, target) => {
          const panel = card.querySelector('[data-inline-panel="' + target + '"]')
          if (!panel) return
          const isHidden = panel.classList.contains('hidden')
          closePanels(card)
          if (isHidden) {
            panel.classList.remove('hidden')
          }
        }
        const scheduleFeedbackClear = (feedback) => {
          const existing = feedbackTimers.get(feedback)
          if (existing) {
            clearTimeout(existing)
          }
          const timer = window.setTimeout(() => {
            feedback.innerHTML = ''
            feedbackTimers.delete(feedback)
          }, 2500)
          feedbackTimers.set(feedback, timer)
        }
        const isSuccessFeedback = (feedback) => {
          const statusAttr =
            feedback.getAttribute('data-inline-feedback-status') ||
            feedback.querySelector('[data-inline-feedback-status]')?.getAttribute('data-inline-feedback-status') ||
            ''
          if (statusAttr === 'success') return true
          return feedback.matches('.text-emerald-300') || Boolean(feedback.querySelector('.text-emerald-300'))
        }
        const handleFeedbackSwap = (feedback) => {
          const existingTimer = feedbackTimers.get(feedback)
          if (existingTimer) {
            clearTimeout(existingTimer)
            feedbackTimers.delete(feedback)
          }
          const hasSuccess = isSuccessFeedback(feedback)
          if (!hasSuccess) return
          const card = feedback.closest('[data-inline-card]')
          if (card) {
            triggerClose(card)
          }
          scheduleFeedbackClear(feedback)
        }
        const initInlineCard = (card) => {
          if (card.dataset.inlineReady === 'true') return
          card.dataset.inlineReady = 'true'
        }
        const scanForCards = (root) => {
          const cards = root.matches && root.matches('[data-inline-card]')
            ? [root]
            : root.querySelectorAll
            ? root.querySelectorAll('[data-inline-card]')
            : []
          cards.forEach((card) => initInlineCard(card))
        }
        const handleInlineToggleClick = (event) => {
          const toggleButton = event.target instanceof HTMLElement ? event.target.closest('[data-inline-toggle]') : null
          if (!toggleButton) return
          const card = toggleButton.closest('[data-inline-card]')
          if (!card) return
          event.preventDefault()
          togglePanels(card, toggleButton.dataset.inlineToggle || '')
        }
        const handleInlineCloseClick = (event) => {
          const closeButton = event.target instanceof HTMLElement ? event.target.closest('[data-inline-close]') : null
          if (!closeButton) return
          const card = closeButton.closest('[data-inline-card]')
          if (!card) return
          event.preventDefault()
          closePanels(card)
        }
        const evaluateFeedback = (root = document) => {
          const feedbackTargets = root.querySelectorAll
            ? root.querySelectorAll('[data-inline-feedback]')
            : []
          feedbackTargets.forEach((feedback) => handleFeedbackSwap(feedback))
        }
        const isSuccessfulRequest = (detail) => {
          if (!detail) return false
          if (detail.successful === true) return true
          if (detail.failed === true) return false
          if (detail.xhr && typeof detail.xhr.status === 'number') {
            return detail.xhr.status >= 200 && detail.xhr.status < 300
          }
          return false
        }
        const findCard = (detail, event) => {
          const fromTarget =
            detail && detail.target instanceof HTMLElement ? detail.target.closest('[data-inline-card]') : null
          const fromElt =
            detail && detail.elt instanceof HTMLElement ? detail.elt.closest('[data-inline-card]') : null
          const fromRequestElt =
            detail && detail.requestConfig && detail.requestConfig.elt instanceof HTMLElement
              ? detail.requestConfig.elt.closest('[data-inline-card]')
              : null
          const fromEventTarget = event && event.target instanceof HTMLElement
            ? event.target.closest('[data-inline-card]')
            : null
          return fromTarget || fromElt || fromRequestElt || fromEventTarget || null
        }
        const findCardForNode = (node) => {
          if (!(node instanceof HTMLElement)) return null
          return node.closest('[data-inline-card]')
        }
        const handleSwapEvent = (event) => {
          const target = event.detail && event.detail.target instanceof HTMLElement ? event.detail.target : null
          if (target) {
            scanForCards(target)
            evaluateFeedback(target)
          }
          const card = findCard(event.detail, event)
          if (card && isSuccessfulRequest(event.detail)) {
            triggerClose(card)
          }
          evaluateFeedback(document)
        }
        const handleInlineSaved = (event) => {
          const target = event.target instanceof HTMLElement ? event.target : null
          const detailCardId =
            event.detail && typeof event.detail === 'object' && 'cardId' in event.detail
              ? event.detail.cardId
              : null
          const cardFromTarget = target ? findCardForNode(target) : null
          const card =
            cardFromTarget ||
            (detailCardId ? document.querySelector('[data-inline-card="' + detailCardId + '"]') : null)
          if (card) {
            triggerClose(card)
          }
        }
        const handleAfterRequest = (event) => {
          if (!isSuccessfulRequest(event.detail)) return
          const elt = event.detail && event.detail.elt instanceof HTMLElement ? event.detail.elt : null
          const inlineCardId =
            elt && elt.matches('form[data-inline-card-id]') ? elt.getAttribute('data-inline-card-id') : null
          const directCard =
            inlineCardId ? document.querySelector('[data-inline-card="' + inlineCardId + '"]') : null
          const card = directCard || (elt ? findCardForNode(elt) : findCard(event.detail, event))
          if (card) {
            triggerClose(card)
          }
        }
        const handleAfterOnLoad = (event) => {
          if (!isSuccessfulRequest(event.detail)) return
          const card = findCard(event.detail, event)
          if (card) {
            triggerClose(card)
          }
        }
        document.addEventListener('DOMContentLoaded', () => {
          scanForCards(document)
          evaluateFeedback(document)
        })
        document.addEventListener('click', handleInlineToggleClick)
        document.addEventListener('click', handleInlineCloseClick)
        document.addEventListener('htmx:afterSwap', handleSwapEvent)
        document.addEventListener('htmx:oobAfterSwap', handleSwapEvent)
        document.addEventListener('htmx:afterRequest', handleAfterRequest)
        document.addEventListener('htmx:afterOnLoad', handleAfterOnLoad)
        document.addEventListener('inline-card-saved', handleInlineSaved)
        document.addEventListener('inline-panel-close', handleInlineSaved)
      })()
    </script>
  `
