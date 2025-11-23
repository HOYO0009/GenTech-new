import { layout } from '../layout.ui'
import { uiClasses } from '../styles/classes.ui'
import { ChangeLogEvent } from '../../services/changeLogs.service'

const CHANGES_PER_PAGE = 10

type ChangePagination = {
  currentPage: number
  totalPages: number
  totalChanges: number
  start: number
  end: number
}

const paginateChanges = (changes: ChangeLogEvent[], requestedPage?: number) => {
  const totalChanges = changes.length
  const totalPages = Math.max(1, Math.ceil(totalChanges / CHANGES_PER_PAGE))
  const safePage = Math.min(Math.max(requestedPage ?? 1, 1), totalPages)
  const startIndex = (safePage - 1) * CHANGES_PER_PAGE
  const endIndex = startIndex + CHANGES_PER_PAGE

  return {
    visibleChanges: changes.slice(startIndex, endIndex),
    pagination: {
      currentPage: safePage,
      totalPages,
      totalChanges,
      start: totalChanges === 0 ? 0 : startIndex + 1,
      end: Math.min(endIndex, totalChanges),
    } satisfies ChangePagination,
  }
}

const getPageWindow = (pagination: ChangePagination, windowSize = 4): number[] => {
  const start = Math.max(1, Math.min(pagination.currentPage, Math.max(1, pagination.totalPages - windowSize + 1)))
  const pages: number[] = []
  for (let i = 0; i < windowSize && start + i <= pagination.totalPages; i += 1) {
    pages.push(start + i)
  }
  return pages
}

const buildChangesPageHref = (page: number) => {
  const params = new URLSearchParams()
  if (page > 1) {
    params.set('page', page.toString())
  }
  const query = params.toString()
  return query ? `/changes?${query}` : '/changes'
}

const renderPaginationControls = (pagination: ChangePagination) => {
  if (!pagination.totalChanges) {
    return ''
  }
  const prevDisabled = pagination.currentPage <= 1
  const nextDisabled = pagination.currentPage >= pagination.totalPages
  const prevHref = prevDisabled ? '' : buildChangesPageHref(pagination.currentPage - 1)
  const nextHref = nextDisabled ? '' : buildChangesPageHref(pagination.currentPage + 1)
  const pageWindow = getPageWindow(pagination)
  const showTrailingEllipsis = pageWindow[pageWindow.length - 1] < pagination.totalPages
  const pageButtons = pageWindow
    .map((page) => {
      const isCurrent = page === pagination.currentPage
      const commonClasses = `${uiClasses.button.secondaryCompact} min-w-[3rem] text-center`
      if (isCurrent) {
        return `<span class="${commonClasses} bg-white/10 border-white/30 cursor-default" aria-current="page">${page}</span>`
      }
      return `<a class="${commonClasses}" href="${buildChangesPageHref(page)}">${page}</a>`
    })
    .join('')
  const lastPageButton =
    pagination.totalPages > 0 && pageWindow[pageWindow.length - 1] !== pagination.totalPages
      ? `<a class="${uiClasses.button.secondaryCompact} min-w-[3rem] text-center" href="${buildChangesPageHref(
          pagination.totalPages
        )}">${pagination.totalPages}</a>`
      : ''
  const trailingEllipsis = showTrailingEllipsis ? `<span class="${uiClasses.text.metadata}">...</span>` : ''

  return `<div class="${uiClasses.layout.space.y3} ${uiClasses.divider.base} pb-3">
      <div class="${uiClasses.layout.flex.between}">
        <p class="${uiClasses.text.metadata}">Showing ${pagination.start}-${pagination.end} of ${pagination.totalChanges} (${CHANGES_PER_PAGE} per page)</p>
        <div class="${uiClasses.layout.flex.gap2}">
          <a class="${uiClasses.button.secondaryCompact} ${
            prevDisabled ? 'pointer-events-none opacity-40' : ''
          }" ${prevDisabled ? 'tabindex="-1" aria-disabled="true"' : `href="${prevHref}"`}>
            Previous
          </a>
          <div class="${uiClasses.layout.flex.gap2}">
            ${pageButtons}
            ${trailingEllipsis}
            ${lastPageButton}
          </div>
          <a class="${uiClasses.button.secondaryCompact} ${
            nextDisabled ? 'pointer-events-none opacity-40' : ''
          }" ${nextDisabled ? 'tabindex="-1" aria-disabled="true"' : `href="${nextHref}"`}>
            Next
          </a>
        </div>
      </div>
    </div>`
}

const renderChangeCard = (change: ChangeLogEvent) => {
  const payloadBlock = change.payload
    ? `<pre class="bg-black/70 rounded border border-white/10 p-3 text-[0.65rem] text-white/70 overflow-auto">${change.payload}</pre>`
    : ''
  const sourceBlock = change.source ? `<p class="${uiClasses.text.metadataSmall}">Source: ${change.source}</p>` : ''
  return `<article class="${uiClasses.card.base}">
      <div class="${uiClasses.layout.flex.between}">
        <div class="${uiClasses.layout.space.y1}">
          <p class="${uiClasses.text.body}">${change.description}</p>
          <p class="${uiClasses.text.metadata}">Table: ${change.tableLabel}</p>
        </div>
        <div class="text-right space-y-1">
          <p class="${uiClasses.text.metadata}">${change.action}</p>
          <p class="${uiClasses.text.metadataSmall}">${change.occurredAt}</p>
        </div>
      </div>
      ${payloadBlock}
      ${sourceBlock}
    </article>`
}

const renderDatabaseAccessPanel = () => {
  const dbPath = 'gentech.sqlite'
  return `<section class="${uiClasses.panel.base}">
      <div class="${uiClasses.layout.flex.between}">
        <div class="${uiClasses.layout.space.y1}">
          <p class="${uiClasses.text.headingBold}">SQLite database</p>
          <p class="${uiClasses.text.metadata}">Read-only snapshot</p>
        </div>
        <span class="${uiClasses.text.metadataSmall}">${dbPath}</span>
      </div>
      <p class="${uiClasses.text.bodySmall}">Download a clean copy of the live database to inspect in your SQLite viewer. Keep the file read-only to avoid unintended writes.</p>
      <div class="${uiClasses.layout.flex.gap3} flex-wrap">
        <a class="${uiClasses.button.secondaryCompact}" href="/changes/database" download>Download database</a>
        <button type="button" class="${uiClasses.button.secondaryCompact}" data-copy-db-path="${dbPath}">Copy file path</button>
      </div>
      <div class="${uiClasses.card.compact}">
        <p class="${uiClasses.text.label}">File</p>
        <code class="text-[0.75rem] break-all text-white/80">${dbPath}</code>
      </div>
    </section>`
}

const copyDbPathScript = `
  <script>
    document.addEventListener('click', (event) => {
      const target = event.target instanceof HTMLElement ? event.target.closest('[data-copy-db-path]') : null
      if (!target) return
      const dbPath = target.getAttribute('data-copy-db-path') || 'gentech.sqlite'
      const originalText = target.textContent
      if (!navigator.clipboard || typeof navigator.clipboard.writeText !== 'function') {
        return
      }
      navigator.clipboard.writeText(dbPath).then(() => {
        if (typeof originalText === 'string') {
          target.textContent = 'Copied'
          window.setTimeout(() => {
            target.textContent = originalText
          }, 1200)
        }
      }).catch(() => {})
    })
  </script>
`

export const changesPage = (changes: ChangeLogEvent[], currentPage = 1) => {
  const { visibleChanges, pagination } = paginateChanges(changes, currentPage)
  const changeItems = visibleChanges.length
    ? visibleChanges.map(renderChangeCard).join('')
    : `<p class="${uiClasses.text.bodySmall}">No activity recorded yet.</p>`
  const paginationControls = pagination.totalChanges ? renderPaginationControls(pagination) : ''
  const changeLogSection = `<section class="${uiClasses.panel.inner} space-y-5">
      <div class="${uiClasses.layout.flex.between}">
        <p class="${uiClasses.text.headingBold}">Recent changes</p>
        <p class="${uiClasses.text.metadata}">${pagination.totalChanges} event(s)</p>
      </div>
      ${paginationControls}
      <div class="${uiClasses.layout.space.y3}">
        ${changeItems}
      </div>
      ${paginationControls}
    </section>`

  const mainContent = `<div class="${uiClasses.layout.space.y4}">
      ${renderDatabaseAccessPanel()}
      ${changeLogSection}
    </div>`

  return layout('changes', 'Change log - GenTech', '', mainContent, copyDbPathScript)
}
