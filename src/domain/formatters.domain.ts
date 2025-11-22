import { SupportedCurrency } from './currency.domain'

export const escapeHtml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')

export const toCents = (amount: number) => {
  if (!Number.isFinite(amount)) {
    throw new Error('Amount must be a valid number.')
  }
  return Math.round(amount * 100)
}

const currencySymbols: Record<SupportedCurrency, string> = {
  SGD: '$',
  USD: '$',
  CNY: '¥',
}

export const formatMoney = (amount: number | null, currency: SupportedCurrency = 'SGD') => {
  if (amount === null || Number.isNaN(amount)) return 'N/A'
  const dollars = amount / 100
  const symbol = currencySymbols[currency] ?? '$'
  const suffix = currency === 'SGD' ? '' : ` ${currency}`
  return `${symbol}${dollars.toFixed(2)}${suffix}`
}

export const formatTimestamp = (value: Date | number | null) => {
  if (!value) return 'Unknown time'
  const parsed = value instanceof Date ? value : new Date(value)
  return parsed.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

export const prettyPayload = (payload: string | null) => {
  if (!payload) return null

  try {
    const parsed = JSON.parse(payload)
    return JSON.stringify(parsed, null, 2)
  } catch {
    return payload
  }
}

export const moneyClientScript = () => `
  (() => {
    const symbols = { SGD: '$', USD: '$', CNY: '¥' };

    const format = (amount, currency) => {
      const symbol = symbols[currency] || '$';
      const suffix = currency === 'SGD' ? '' : ' ' + currency;
      return symbol + amount.toFixed(2) + suffix;
    };

    const updateAll = () => {
      const currencyApi = window.gentechCurrency;
      if (!currencyApi) return;
      const currency = currencyApi.code;
      const rates = currencyApi.rates || {};
      document.querySelectorAll('[data-money-cents]').forEach((el) => {
        const raw = el.getAttribute('data-money-cents');
        const base = (el.getAttribute('data-money-base') || 'SGD').toUpperCase();
        const cents = Number(raw);
        if (!Number.isFinite(cents)) return;
        const baseRate = rates[base];
        const targetRate = rates[currency];
        if (!baseRate || !targetRate) return;
        const amountInBase = cents / 100;
        const amountInSGD = base === 'SGD' ? amountInBase : amountInBase / baseRate;
        const converted = amountInSGD * targetRate;
        el.textContent = format(converted, currency);
      });
    };

    document.addEventListener('gentech:currency-change', updateAll);
    if (document.readyState === 'complete' || document.readyState === 'interactive') {
      updateAll();
    } else {
      document.addEventListener('DOMContentLoaded', updateAll);
    }
  })();
`
