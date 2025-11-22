import { layout } from '../layout.ui'
import { shortcutsClientScript } from '../../domain/shortcuts.domain'

export const settingsPage = () => {
  const form = `<section class="rounded-2xl border border-white/10 bg-black/70 p-6 space-y-6">
      <div>
        <p class="text-sm uppercase tracking-[0.3em] text-white/70">Keyboard Shortcuts</p>
        <p class="text-[0.75rem] text-white/60">Customize the keys for search focus, opening sort/filter, opening the editor, and tab navigation.</p>
      </div>
      <form id="shortcut-form" class="space-y-4 max-w-md">
        ${[
          { key: 'search', label: 'Search focus', description: 'Focus the page search bar' },
          { key: 'sidebar', label: 'Sort & Filter', description: 'Open the sort/filter sidebar' },
          { key: 'editor', label: 'Open editor', description: 'Click the page editor button' },
          { key: 'nextTab', label: 'Next tab', description: 'Move to the next navigation tab' },
          { key: 'prevTab', label: 'Previous tab', description: 'Move to the previous navigation tab' },
        ]
          .map(
            ({ key, label, description }) => `
            <label class="block space-y-2">
              <div class="flex items-center justify-between">
                <span class="text-[0.8rem] uppercase tracking-[0.25em] text-white/80">${label}</span>
                <span class="text-[0.65rem] uppercase tracking-[0.25em] text-white/50">${description}</span>
              </div>
              <input
                type="text"
                name="${key}"
                data-shortcut-input="${key}"
                class="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:border-white/30 focus:outline-none"
                maxlength="20"
              />
            </label>`
          )
          .join('')}
        <div class="flex flex-wrap gap-3">
          <button type="submit" class="primary-btn">Save shortcuts</button>
          <button type="button" id="reset-shortcuts" class="rounded-lg border border-white/20 bg-white/5 px-4 py-2 text-sm font-semibold uppercase tracking-[0.25em] text-white hover:border-white/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40">
            Reset to defaults
          </button>
          <span id="shortcut-status" class="text-sm text-white/60"></span>
        </div>
      </form>
    </section>`

  const mainContent = `<div class="space-y-6">
    ${form}
  </div>`

  const extraHead = `
    <script>${shortcutsClientScript()}</script>
    <script>
      document.addEventListener('DOMContentLoaded', () => {
        const api = window.gentechShortcuts
        if (!api) return
        const form = document.getElementById('shortcut-form')
        const status = document.getElementById('shortcut-status')
        const resetBtn = document.getElementById('reset-shortcuts')

        const applyValues = (config) => {
          Object.entries(config).forEach(([key, value]) => {
            const input = form.querySelector('[data-shortcut-input=\"' + key + '\"]')
            if (input) input.value = value
          })
        }

        applyValues(api.getConfig())

        form.addEventListener('submit', (event) => {
          event.preventDefault()
          const formData = new FormData(form)
          const config = {
            search: (formData.get('search') ?? '').toString(),
            sidebar: (formData.get('sidebar') ?? '').toString(),
            editor: (formData.get('editor') ?? '').toString(),
            nextTab: (formData.get('nextTab') ?? '').toString(),
            prevTab: (formData.get('prevTab') ?? '').toString(),
          }
          const saved = api.saveConfig(config)
          applyValues(saved)
          if (status) {
            status.textContent = 'Saved'
            setTimeout(() => (status.textContent = ''), 1500)
          }
        })

        resetBtn?.addEventListener('click', () => {
          const reset = api.reset()
          applyValues(reset)
          if (status) {
            status.textContent = 'Reset to defaults'
            setTimeout(() => (status.textContent = ''), 1500)
          }
        })
      })
    </script>
  `

  return layout('settings', 'Settings - GenTech', '', mainContent, extraHead)
}
