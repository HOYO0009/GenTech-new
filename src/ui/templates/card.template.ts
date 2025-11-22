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
