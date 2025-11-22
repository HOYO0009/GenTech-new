export type SupportedCurrency = 'SGD' | 'USD' | 'CNY'

export type CurrencyOption = {
  code: SupportedCurrency
  label: string
  symbol: string
}

export const supportedCurrencies: CurrencyOption[] = [
  { code: 'SGD', label: 'Singapore Dollar', symbol: '$' },
  { code: 'USD', label: 'US Dollar', symbol: '$' },
  { code: 'CNY', label: 'Chinese Yuan', symbol: '¥' },
]

export const currencyClientScript = () => `
  (() => {
    const storageKey = 'gentech:currency';
    const supported = ${JSON.stringify(supportedCurrencies)};
    const defaultCode = 'SGD';
    const state = {
      code: defaultCode,
      rates: { SGD: 1, USD: 1, CNY: 1 },
      lastFetched: 0,
    };

    const findCurrency = (code) => supported.find((entry) => entry.code === code);

    const loadStored = () => {
      const stored = window.localStorage.getItem(storageKey);
      if (stored && findCurrency(stored)) {
        state.code = stored;
      }
    };

    const persist = () => {
      try {
        window.localStorage.setItem(storageKey, state.code);
      } catch (error) {
        console.warn('Unable to store currency preference', error);
      }
    };

    const dispatchChange = () => {
      document.dispatchEvent(new CustomEvent('gentech:currency-change', {
        detail: { code: state.code, rates: { ...state.rates } },
      }));
    };

    const updateLabel = () => {
      const label = document.querySelector('[data-currency-label]');
      if (label) {
        label.textContent = state.code;
      }
    };

    const closeMenu = () => {
      const menu = document.querySelector('[data-currency-menu]');
      menu?.classList.add('hidden');
    };

    const setCurrency = (code) => {
      if (!findCurrency(code)) return;
      state.code = code;
      persist();
      updateLabel();
      dispatchChange();
      closeMenu();
    };

    const refreshRates = async () => {
      try {
        const response = await fetch('https://open.er-api.com/v6/latest/SGD', { cache: 'no-store' });
        const data = await response.json();
        const usd = Number(data?.rates?.USD);
        const cny = Number(data?.rates?.CNY);
        if (Number.isFinite(usd) && Number.isFinite(cny)) {
          state.rates = { SGD: 1, USD: usd, CNY: cny };
          state.lastFetched = Date.now();
          dispatchChange();
        }
      } catch (error) {
        console.warn('Unable to fetch live currency rates', error);
      }
    };

    const bootstrapMenu = () => {
      const trigger = document.querySelector('[data-currency-trigger]');
      const menu = document.querySelector('[data-currency-menu]');
      const options = document.querySelectorAll('[data-currency-option]');
      if (!trigger || !menu) return;

      trigger.addEventListener('click', () => {
        menu.classList.toggle('hidden');
      });
      document.addEventListener('click', (event) => {
        const target = event.target;
        if (!menu.contains(target) && !trigger.contains(target)) {
          closeMenu();
        }
      });
      options.forEach((option) => {
        option.addEventListener('click', () => {
          const code = option.getAttribute('data-currency-option');
          setCurrency(code);
        });
      });
    };

    const init = () => {
      loadStored();
      updateLabel();
      bootstrapMenu();
      dispatchChange();
      refreshRates();
      setInterval(() => {
        const elapsed = Date.now() - state.lastFetched;
        if (elapsed > 30 * 60 * 1000) {
          refreshRates();
        }
      }, 5 * 60 * 1000);
    };

    window.gentechCurrency = {
      get code() {
        return state.code;
      },
      get rates() {
        return { ...state.rates };
      },
      supported,
      setCurrency,
      refreshRates,
    };

    if (document.readyState === 'complete' || document.readyState === 'interactive') {
      init();
    } else {
      document.addEventListener('DOMContentLoaded', init);
    }
  })();
`
