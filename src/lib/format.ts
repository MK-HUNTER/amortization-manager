export const currency = (n: number, opts: Intl.NumberFormatOptions = {}) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
    ...opts,
  }).format(Number.isFinite(n) ? n : 0);

export const currencyDetail = (n: number) => currency(n, { maximumFractionDigits: 2 });

export const percent = (n: number) => `${n.toFixed(2)}%`;

export const compactCurrency = (n: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(n);
