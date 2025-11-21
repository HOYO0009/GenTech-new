export type ShortcutConfig = {
  search: string
  sidebar: string
  editor: string
}

export const defaultShortcuts: ShortcutConfig = {
  search: '/',
  sidebar: 's',
  editor: 'e',
}

const storageKey = 'gentech.shortcuts'

const clientScript = `
(() => {
  const storageKey = '${storageKey}';
  const defaults = ${JSON.stringify(defaultShortcuts)};

  const normalize = (key) => key?.toLowerCase().trim() || '';

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
    const normalized = {
      search: normalize(config.search) || defaults.search,
      sidebar: normalize(config.sidebar) || defaults.sidebar,
      editor: normalize(config.editor) || defaults.editor,
    };
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

  document.addEventListener('keydown', (event) => {
    if (event.defaultPrevented) return;
    if (isTypingContext(document.activeElement)) return;

    const key = normalize(event.key);
    const pairs = [
      ['search', activeConfig.search],
      ['sidebar', activeConfig.sidebar],
      ['editor', activeConfig.editor],
    ];
    for (const [action, expected] of pairs) {
      if (key && expected && key === normalize(expected)) {
        event.preventDefault();
        performAction(action);
        break;
      }
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
