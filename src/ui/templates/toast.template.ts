export const toastClientScript = `
    <script>
      (() => {
        const ensureToastContainer = () => {
          let container = document.getElementById('toast-container')
          if (container) return container
          container = document.createElement('div')
          container.id = 'toast-container'
          container.style.position = 'fixed'
          container.style.top = '1rem'
          container.style.right = '1rem'
          container.style.display = 'flex'
          container.style.flexDirection = 'column'
          container.style.gap = '0.6rem'
          container.style.zIndex = '9999'
          container.style.pointerEvents = 'none'
          document.body.appendChild(container)
          return container
        }

        const createToastElement = ({ message, status, subject, details }) => {
          const toast = document.createElement('div')
          toast.style.pointerEvents = 'auto'
          toast.style.minWidth = '260px'
          toast.style.maxWidth = '360px'
          toast.style.borderRadius = '12px'
          toast.style.border = '1px solid rgba(0, 0, 0, 0.1)'
          toast.style.background = '#ffffff'
          toast.style.padding = '12px 14px'
          toast.style.fontSize = '0.8rem'
          toast.style.fontWeight = '700'
          toast.style.textTransform = 'uppercase'
          toast.style.letterSpacing = '0.25em'
          toast.style.color = '#0f172a'
          toast.style.boxShadow = '0 10px 28px rgba(0, 0, 0, 0.25)'
          toast.style.opacity = '0'
          toast.style.transform = 'translateY(8px)'
          toast.style.transition = 'opacity 160ms ease, transform 160ms ease'
          const accent =
            Number(status) === 200 ? '#16a34a' : Number(status) === 500 ? '#dc2626' : '#ea580c'
          toast.style.boxShadow = '0 8px 24px rgba(0,0,0,0.18), 0 0 0 2px ' + accent + '30'
          toast.style.borderColor = accent + '50'
          const title = document.createElement('div')
          title.textContent = message
          title.style.color = accent
          const subjectEl = document.createElement('div')
          if (subject) {
            subjectEl.textContent = subject
            subjectEl.style.marginTop = '4px'
            subjectEl.style.fontSize = '0.72rem'
            subjectEl.style.letterSpacing = '0.2em'
            subjectEl.style.color = '#0f172a'
            subjectEl.style.fontWeight = '700'
          }
          if (details && Array.isArray(details) && details.length) {
            const list = document.createElement('ul')
            list.style.margin = '6px 0 0'
            list.style.paddingLeft = '18px'
            list.style.fontSize = '0.75rem'
            list.style.fontWeight = '600'
            list.style.color = '#111827'
            details.forEach((entry) => {
              const li = document.createElement('li')
              li.textContent = entry
              list.appendChild(li)
            })
            toast.appendChild(list)
          }
          toast.prepend(title)
          if (subject) {
            toast.insertBefore(subjectEl, toast.childNodes[1] || null)
          }
          return toast
        }

        const showToast = (payload) => {
          const message =
            payload && typeof payload === 'object' && 'message' in payload
              ? payload.message
              : String(payload || '')
          if (!message) return
          const status = payload && typeof payload === 'object' && 'status' in payload ? payload.status : undefined
          const subject = payload && typeof payload === 'object' && 'subject' in payload ? payload.subject : undefined
          const details =
            payload && typeof payload === 'object' && 'details' in payload && Array.isArray(payload.details)
              ? payload.details
              : undefined
          const container = ensureToastContainer()
          const toast = createToastElement({ message, status, subject, details })
          container.appendChild(toast)
          requestAnimationFrame(() => {
            toast.style.opacity = '1'
            toast.style.transform = 'translateY(0)'
          })
          const remove = () => {
            toast.style.opacity = '0'
            toast.style.transform = 'translateY(8px)'
            window.setTimeout(() => toast.remove(), 220)
          }
          window.setTimeout(remove, 2600)
        }

        document.addEventListener('DOMContentLoaded', ensureToastContainer)
        document.addEventListener('toast', (event) => {
          showToast(event.detail)
        })
        window.dispatchToast = showToast
      })()
    </script>
  `
