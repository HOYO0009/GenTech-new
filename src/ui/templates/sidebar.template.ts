export type SidebarTemplateOptions = {
  id: string
  title: string
  body: string
  closeLabel?: string
}

export const renderSidebar = ({ id, title, body, closeLabel = 'Close' }: SidebarTemplateOptions) => `
  <div id="${id}" data-sidebar class="fixed inset-0 z-50 hidden">
    <div class="absolute inset-0 bg-black/60" data-sidebar-close></div>
    <aside
      class="absolute right-0 top-0 h-full w-full max-w-sm border-l border-white/10 bg-black/90 p-6 shadow-[0_0_40px_rgba(0,0,0,0.45)]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="${id}-title"
    >
      <div class="flex items-center justify-between mb-4">
        <p id="${id}-title" class="text-sm uppercase tracking-[0.3em] text-white/70">${title}</p>
        <button
          type="button"
          data-sidebar-close
          class="rounded-lg border border-white/20 bg-white/5 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-white hover:border-white/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
        >
          ${closeLabel}
        </button>
      </div>
      <div class="space-y-4 overflow-y-auto max-h-[80vh] pr-2">
        ${body}
      </div>
    </aside>
  </div>
  <script>
    (() => {
      const sidebar = document.getElementById('${id}')
      if (!sidebar) return
      const openers = document.querySelectorAll('[data-sidebar-trigger="${id}"]')
      const closers = sidebar.querySelectorAll('[data-sidebar-close]')

      const open = () => {
        sidebar.classList.remove('hidden')
        document.body.classList.add('overflow-hidden')
      }
      const close = () => {
        sidebar.classList.add('hidden')
        document.body.classList.remove('overflow-hidden')
      }

      openers.forEach((opener) => opener.addEventListener('click', open))
      closers.forEach((closer) => closer.addEventListener('click', close))
      sidebar.addEventListener('click', (event) => {
        if (event.target === sidebar) {
          close()
        }
      })
      document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && !sidebar.classList.contains('hidden')) {
          close()
        }
      })
    })()
  </script>
`
