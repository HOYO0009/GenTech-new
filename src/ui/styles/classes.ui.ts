/**
 * Centralized UI classes
 * Provides consistent Tailwind CSS classes across the application
 */

export const uiClasses = {
  /**
   * Card styles - Used for content containers
   */
  card: {
    base: 'rounded-2xl border border-white/10 bg-black/70 p-4 sm:p-5 space-y-3',
    withShadow:
      'rounded-2xl border border-white/10 bg-black/70 p-4 sm:p-5 space-y-3 shadow-[0_0_30px_rgba(0,0,0,0.35)]',
    compact: 'rounded-xl border border-white/10 bg-black/70 p-3 sm:p-4 space-y-2',
  },

  /**
   * Panel styles - Used for sections and containers
   */
  panel: {
    base: 'rounded-2xl border border-white/10 bg-black/70 p-5 sm:p-6 space-y-4',
    compact: 'rounded-2xl border border-white/10 bg-black/70 p-4 sm:p-5 space-y-3',
    inner: 'bg-black/70 rounded-2xl border border-white/10 shadow-inner p-5 sm:p-6 space-y-5',
  },

  /**
   * Text styles - Typography utilities
   */
  text: {
    label: 'text-[0.65rem] uppercase tracking-[0.3em] text-white/70 font-semibold',
    labelBright: 'text-[0.65rem] uppercase tracking-[0.3em] text-white/90 font-semibold',
    heading: 'text-sm uppercase tracking-[0.3em] text-white/85 font-semibold',
    headingBold: 'text-sm uppercase tracking-[0.3em] text-white font-bold',
    metadata: 'text-[0.65rem] uppercase tracking-[0.4em] text-white/75 font-semibold',
    metadataSmall: 'text-[0.65rem] uppercase tracking-[0.35em] text-white/70 font-semibold',
    subtitle: 'text-sm uppercase tracking-[0.35em] text-white/80 font-semibold',
    subtitleSecondary: 'text-sm uppercase tracking-[0.35em] text-white/65 font-semibold',
    body: 'text-base font-bold text-white',
    bodyLarge: 'text-lg font-bold text-white',
    bodySmall: 'text-sm text-white/90 font-semibold',
    feedback: 'text-sm text-white/80 uppercase tracking-[0.3em] font-semibold',
    feedbackSuccess: 'text-sm uppercase tracking-[0.3em] text-emerald-300 font-semibold',
    feedbackWarning: 'text-sm uppercase tracking-[0.3em] text-amber-400 font-semibold',
    feedbackError: 'text-sm uppercase tracking-[0.3em] text-red-400 font-semibold',
  },

  /**
   * Button styles
   */
  button: {
    primary: 'primary-btn w-full text-center',
    primaryCompact: 'primary-btn',
    successCompact:
      'rounded-lg border border-emerald-500/60 bg-emerald-600 px-4 py-2 text-sm font-semibold uppercase tracking-[0.25em] text-white shadow-[0_0_0_1px_rgba(16,185,129,0.35)] hover:bg-emerald-500 hover:border-white/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300/60',
    secondary:
      'w-full rounded-lg border border-white/20 bg-white/5 px-4 py-2 text-sm font-semibold uppercase tracking-[0.25em] text-white hover:border-white/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40',
    secondaryCompact:
      'rounded-lg border border-white/20 bg-white/5 px-4 py-2 text-sm font-semibold uppercase tracking-[0.25em] text-white hover:border-white/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40 aria-[current=true]:border-red-400 aria-[current=true]:text-red-200 aria-[current=true]:bg-white/10',
    neutralCompact:
      'rounded-lg border border-white/20 bg-white px-4 py-2 text-sm font-semibold uppercase tracking-[0.25em] text-black hover:border-black/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-black/20',
    dangerCompact:
      'rounded-lg border border-[#ff2b2b]/50 bg-[#b41f26] px-4 py-2 text-sm font-semibold uppercase tracking-[0.25em] text-white shadow-[0_0_0_1px_rgba(255,43,43,0.25)] hover:bg-[#ff2b2b] hover:border-white/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#ff2b2b]/50',
    ghost:
      'text-sm font-semibold uppercase tracking-[0.25em] text-white/70 hover:text-white focus:outline-none',
  },

  /**
   * Form input styles
   */
  input: {
    base: 'w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:border-white/30 focus:outline-none',
    search:
      'w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:border-white/30 focus:outline-none',
    select:
      'mt-1 w-full rounded-lg border border-white/20 bg-black/80 px-3 py-2 text-sm text-white shadow-[0_0_0_1px_rgba(255,255,255,0.08)] focus:border-white/50 focus:outline-none focus:ring-2 focus:ring-white/20',
    checkbox: 'h-4 w-4 rounded border-white/30 bg-white/10 text-red-300 focus:ring-white/40',
    radio: 'h-4 w-4 rounded border-white/30 bg-white/10 text-red-300 focus:ring-white/40',
    textarea:
      'w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:border-white/30 focus:outline-none',
  },

  /**
   * Layout utilities
   */
  layout: {
    grid: {
      cols2: 'grid gap-3 sm:gap-4 text-sm sm:grid-cols-2',
      cols3: 'grid gap-3 sm:gap-4 text-sm sm:grid-cols-2 lg:grid-cols-3',
      searchControls: 'grid gap-3 md:grid-cols-[2fr_auto_auto] items-end w-full',
      searchControlsSection: 'grid gap-4 md:grid-cols-[2fr_auto_auto] items-center',
    },
    flex: {
      between: 'flex flex-wrap items-center justify-between gap-3',
      betweenStart: 'flex flex-wrap items-start justify-between gap-3',
      center: 'flex items-center justify-center',
      gap2: 'flex flex-wrap items-center gap-2',
      gap3: 'flex flex-wrap items-center gap-3',
      gap4: 'flex flex-wrap items-center gap-4',
    },
    space: {
      y1: 'space-y-1',
      y2: 'space-y-2',
      y3: 'space-y-3',
      y4: 'space-y-4',
      y5: 'space-y-5',
    },
  },

  /**
   * Link styles
   */
  link: {
    primary: 'text-base font-semibold text-red-300 hover:text-white',
    secondary: 'text-white/80 hover:text-white underline',
    subtle: 'text-white/60 hover:text-white/80',
  },

  /**
   * Divider styles
   */
  divider: {
    base: 'border-b border-white/5',
    thick: 'border-b-2 border-white/10',
    withPadding: 'border-b border-white/5 pb-4',
  },

  /**
   * Scrollable container styles
   */
  scroll: {
    base: 'overflow-y-auto',
    withPadding: 'overflow-y-auto pr-2',
    maxH48: 'max-h-48 overflow-y-auto pr-2',
    maxH64: 'max-h-64 overflow-y-auto pr-2',
  },

  /**
   * Shop-specific highlight accents
   */
  shopHighlight: {
    shopee: {
      outline:
        'border-orange-500/70 shadow-[0_10px_28px_rgba(0,0,0,0.35),0_0_32px_rgba(249,115,22,0.25)] bg-gradient-to-r from-black/85 via-black/70 to-orange-500/45',
      text: 'text-orange-100',
    },
    lazada: {
      outline:
        'border-blue-500/70 shadow-[0_10px_28px_rgba(0,0,0,0.35),0_0_32px_rgba(59,130,246,0.25)] bg-gradient-to-r from-black/85 via-black/70 to-blue-500/45',
      text: 'text-blue-100',
    },
    tiktok: {
      outline:
        'border-purple-500/70 shadow-[0_10px_28px_rgba(0,0,0,0.35),0_0_32px_rgba(168,85,247,0.25)] bg-gradient-to-r from-black/85 via-black/70 to-purple-500/45',
      text: 'text-purple-100',
    },
    carousell: {
      outline:
        'border-red-500/70 shadow-[0_10px_28px_rgba(0,0,0,0.35),0_0_32px_rgba(239,68,68,0.25)] bg-gradient-to-r from-black/85 via-black/70 to-red-500/45',
      text: 'text-red-100',
    },
  },
} as const

/**
 * Helper to combine multiple class strings
 */
export const cx = (...classes: (string | undefined | false)[]): string => {
  return classes.filter(Boolean).join(' ')
}

/**
 * Predefined feedback banner classes by type
 */
export const feedbackClasses = {
  default: 'px-3 py-2 text-[0.65rem] uppercase tracking-[0.35em] text-white/70',
  success: 'px-3 py-2 text-[0.65rem] uppercase tracking-[0.35em] text-emerald-300',
  warning: 'px-3 py-2 text-[0.65rem] uppercase tracking-[0.35em] text-amber-400',
  error: 'px-3 py-2 text-[0.65rem] uppercase tracking-[0.35em] text-red-400',
  info: 'px-3 py-2 text-[0.65rem] uppercase tracking-[0.35em] text-blue-300',
} as const

/**
 * Gets feedback class by status code
 */
export const getFeedbackClassByStatus = (status: number): string => {
  if (status === 200) return feedbackClasses.success
  if (status === 400 || status === 404) return feedbackClasses.warning
  if (status === 500) return feedbackClasses.error
  return feedbackClasses.default
}
