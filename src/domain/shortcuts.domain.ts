export type ShortcutConfig = {
  search: string
  sidebar: string
  editor: string
  nextTab: string
  prevTab: string
}

export const defaultShortcuts: ShortcutConfig = {
  search: 'space',
  sidebar: 'space+s',
  editor: 'space+e',
  nextTab: 'space+tab',
  prevTab: 'space+shift+tab',
}

const storageKey = 'gentech.shortcuts'

const clientScript = `
(() => {
  const storageKey = '${storageKey}';
  const defaults = ${JSON.stringify(defaultShortcuts)};

  const normalizeKey = (key) => key?.toLowerCase()?.trim() || '';

  const parseShortcut = (shortcut) => {
    const raw = shortcut || '';
    const parts = raw.toLowerCase().split('+').map((p) => p.trim()).filter(Boolean);
    if (!parts.length) return null;
    const hasSpacePrefix = parts[0] === 'space';
    const last = parts[parts.length - 1];
    const expectsShift = parts.includes('shift');
    return {
      hasSpacePrefix,
      key: last,
      needsShift: expectsShift,
      raw,
    };
  };

  const loadConfig = () => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (!raw) return { ...defaults };
      const parsed = JSON.parse(raw);
      return { ...defaults, ...parsed };
    } catch {
      return { ...defaults };
    }
  };

  const saveConfig = (config) => {
    const normalized = Object.fromEntries(
      Object.entries({ ...defaults, ...(config || {}) }).map(([key, value]) => [
        key,
        (value || '').toLowerCase().trim(),
      ])
    );
    localStorage.setItem(storageKey, JSON.stringify(normalized));
    return normalized;
  };

  const isTypingContext = (el) => {
    if (!el) return false;
    const tag = el.tagName?.toLowerCase();
    return (
      tag === 'input' ||
      tag === 'textarea' ||
      tag === 'select' ||
      el.isContentEditable
    );
  };

  const performAction = (action) => {
    if (action === 'search') {
      const target = document.querySelector('[data-shortcut-target="search"]');
      if (target && typeof target.focus === 'function') {
        target.focus();
        if (typeof target.select === 'function') target.select();
      }
      return;
    }
    if (action === 'sidebar') {
      const trigger = document.querySelector('[data-shortcut-target="sidebar"]');
      trigger?.click();
      return;
    }
    if (action === 'editor') {
      const trigger = document.querySelector('[data-shortcut-target="editor"]');
      trigger?.click();
      return;
    }
  };

  let activeConfig = loadConfig();
  let spaceHeld = false;
  let comboUsedWhileSpaceHeld = false;

  const matchShortcut = (event, shortcutValue, triggeredFromSpace) => {
    const def = parseShortcut(shortcutValue);
    if (!def) return false;
    if (def.hasSpacePrefix !== triggeredFromSpace) return false;
    const keyMatch = normalizeKey(event.key) === normalizeKey(def.key);
    const shiftMatch = (!!event.shiftKey) === (!!def.needsShift);
    return keyMatch && shiftMatch;
  };

  const focusNavigationTab = (direction) => {
    const links = Array.from(
      document.querySelectorAll('header nav a')
    );
    if (!links.length) return;
    const currentIndex = (() => {
      const activeIndex = links.findIndex((link) => link.classList.contains('text-white'));
      if (activeIndex !== -1) return activeIndex;
      const focusedIndex = links.indexOf(document.activeElement);
      if (focusedIndex !== -1) return focusedIndex;
      return 0;
    })();
    const offset = direction === 'next' ? 1 : -1;
    const targetIndex = (currentIndex + offset + links.length) % links.length;
    const target = links[targetIndex];
    if (target) {
      target.focus();
      target.click();
    }
  };

  document.addEventListener('keydown', (event) => {
    if (event.defaultPrevented) return;

    // Allow ESC to exit typing context so space shortcuts can be used right after.
    if (event.key === 'Escape' && isTypingContext(document.activeElement)) {
      const activeEl = document.activeElement;
      if (activeEl && typeof activeEl.blur === 'function') {
        activeEl.blur();
      }
      event.preventDefault();
      return;
    }

    if (isTypingContext(document.activeElement)) return;

    const rawKey = event.key;
    const code = event.code;
    const key = normalizeKey(rawKey);
    const triggeredFromSpace = spaceHeld;

    const isSpacePress = rawKey === ' ' || rawKey === 'Spacebar' || rawKey === 'Space' || code === 'Space';

    if (isSpacePress) {
      event.preventDefault();
      spaceHeld = true;
      comboUsedWhileSpaceHeld = false;
      return;
    }

    if (triggeredFromSpace) {
      let handled = false;
      if (matchShortcut(event, activeConfig.sidebar, true)) {
        performAction('sidebar');
        handled = true;
      } else if (matchShortcut(event, activeConfig.editor, true)) {
        performAction('editor');
        handled = true;
      } else if (matchShortcut(event, activeConfig.nextTab, true)) {
        focusNavigationTab('next');
        handled = true;
      } else if (matchShortcut(event, activeConfig.prevTab, true)) {
        focusNavigationTab('prev');
        handled = true;
      }

      if (handled) {
        event.preventDefault();
        comboUsedWhileSpaceHeld = true;
      }
      return;
    }

    // Non-space shortcuts (fallback)
    if (matchShortcut(event, activeConfig.search, false)) {
      event.preventDefault();
      performAction('search');
    } else if (matchShortcut(event, activeConfig.sidebar, false)) {
      event.preventDefault();
      performAction('sidebar');
    } else if (matchShortcut(event, activeConfig.editor, false)) {
      event.preventDefault();
      performAction('editor');
    }
  });

  document.addEventListener('keyup', (event) => {
    if (!spaceHeld) return;
    const isSpacePress =
      event.key === ' ' || event.key === 'Spacebar' || event.key === 'Space' || event.code === 'Space';
    if (!isSpacePress) return;
    spaceHeld = false;
    if (!comboUsedWhileSpaceHeld) {
      performAction('search');
    }
  });

  window.gentechShortcuts = {
    getConfig: () => ({ ...activeConfig }),
    saveConfig: (config) => {
      activeConfig = saveConfig(config);
      return activeConfig;
    },
    reset: () => {
      activeConfig = { ...defaults };
      localStorage.setItem(storageKey, JSON.stringify(activeConfig));
      return activeConfig;
    },
    defaults,
  };
})();
`

export const shortcutsClientScript = () => clientScript
