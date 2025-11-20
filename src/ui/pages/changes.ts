import { layout } from '../layout'
import { ChangeLogEvent } from '../../services/changes'

export const changesPage = (changes: ChangeLogEvent[]) => {
  const changeItems = changes.length
    ? changes
        .map((change) => {
          const payloadBlock = change.payload
            ? `<pre class="bg-black/70 rounded border border-white/10 p-3 text-[0.65rem] text-white/70 overflow-auto">${change.payload}</pre>`
            : ''
          const sourceBlock = change.source ? `<p class="text-[0.65rem] text-white/80">source: ${change.source}</p>` : ''
          return `<article class="rounded-2xl border border-white/10 bg-black/70 p-5 space-y-3">
            <div class="flex items-center justify-between text-xs uppercase tracking-[0.3em] text-white/80">
              <span>${change.occurredAt}</span>
              <span>${change.action}</span>
            </div>
            <div class="text-sm">
              <p class="text-white font-semibold">${change.description}</p>
              <p class="text-white/80 text-[0.65rem] uppercase tracking-[0.4em]">Table: ${change.tableLabel}</p>
            </div>
            ${payloadBlock}
            ${sourceBlock}
          </article>`
        })
        .join('')
    : '<p class="text-white/80 text-sm">No activity recorded yet.</p>'
  const heroContent = `<div class="space-y-3">
      <h1 class="text-3xl font-semibold">Database activity</h1>
      <p class="text-sm text-white/70">
        Every write operation funnels through this log so you can trace additions, updates, and deletes from the UI.
      </p>
      <p class="text-xs text-white/80 uppercase tracking-[0.5em]">recent ${changes.length} event(s)</p>
    </div>`
  return layout('changes', 'Change log - GenTech', heroContent, changeItems)
}
