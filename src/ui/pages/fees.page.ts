import { layout } from '../layout.ui'
import { uiClasses, cx } from '../styles/classes.ui'
import type { FeesPagePayload, FeeType } from '../../services/fees.service'

const feeTypeLabel = (feeType: FeeType) => (feeType === 'percentage' ? 'Percentage' : 'Fixed')

export const feesPage = (
  payload: FeesPagePayload,
  feedbackMessage = '',
  feedbackClass = uiClasses.text.feedback
) => {
  const inlineFieldClass = 'flex flex-wrap items-baseline gap-2 text-sm'
  const inlineLabelClass = cx(uiClasses.text.label, 'mb-0')
  const headingClass = cx(uiClasses.text.headingBold, 'tracking-[0.35em]')

  const renderFeeCard = (fee: (typeof payload.fees)[number]) => {
    const badge = fee.isGlobal
      ? `<span class="${cx(
          uiClasses.badge.subtle,
          'bg-white/10 text-[10px] tracking-[0.35em] uppercase'
        )}">Global</span>`
      : ''
    return `<article class="${cx(
      uiClasses.card.compact,
      'shadow-[0_0_18px_rgba(0,0,0,0.25)]'
    )}">
      <div class="${uiClasses.layout.space.y2}">
        <div class="${inlineFieldClass}">
          <p class="${inlineLabelClass}">Scope:</p>
          <p class="${uiClasses.text.body}">${fee.shopName} ${badge}</p>
        </div>
        <div class="${inlineFieldClass}">
          <p class="${inlineLabelClass}">Fee type:</p>
          <p class="${uiClasses.text.body}">${feeTypeLabel(fee.feeType)}</p>
        </div>
        <div class="${inlineFieldClass}">
          <p class="${inlineLabelClass}">Amount:</p>
          <p class="${uiClasses.text.body}">${fee.amountDisplay}</p>
        </div>
        <div class="${inlineFieldClass}">
          <p class="${inlineLabelClass}">Label:</p>
          <p class="${uiClasses.text.body}">${fee.label || '—'}</p>
        </div>
        <div class="${inlineFieldClass}">
          <p class="${inlineLabelClass}">Created:</p>
          <p class="${uiClasses.text.body}">${fee.createdAtDisplay}</p>
        </div>
      </div>
    </article>`
  }

  const globalFees = payload.fees.filter((fee) => fee.isGlobal)
  const shopFees = payload.fees.filter((fee) => !fee.isGlobal)

  const feeCards =
    payload.fees.length > 0
      ? `
        ${
          globalFees.length
            ? `<p class="${uiClasses.text.metadataSmall} mt-2">Global fees (apply to all shops)</p>`
            : ''
        }
        <div class="grid gap-3 sm:grid-cols-2">${globalFees.map(renderFeeCard).join('')}</div>
        ${
          shopFees.length
            ? `<p class="${cx(uiClasses.text.metadataSmall, 'mt-6')}">Shop-specific fees</p>`
            : ''
        }
        <div class="grid gap-3 sm:grid-cols-2">${shopFees.map(renderFeeCard).join('')}</div>
      `
      : `<p class="${uiClasses.text.bodySmall}">No fees recorded yet.</p>`

  const feedback = feedbackMessage ? `<div class="${feedbackClass}">${feedbackMessage}</div>` : ''

  const mainContent = `
    ${feedback}
    <section class="${uiClasses.panel.base}">
      <div class="${uiClasses.layout.flex.between}">
        <p class="${headingClass}">Fees</p>
        <a class="${uiClasses.button.primaryCompact}" href="/fees/manage">Add fee</a>
      </div>
      <div class="grid gap-3 sm:grid-cols-2 mt-3">
        ${feeCards}
      </div>
    </section>
  `

  return layout('fees', 'Fees - GenTech', '', mainContent)
}
