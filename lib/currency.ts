export const DISPLAY_USD_INR_RATE = 85;

export const INR_RATE_LABEL = `Delta Exchange India fixed rate: ₹${DISPLAY_USD_INR_RATE} per USD`;

/** Display conversion only. Billing and the trading engine continue using USD. */
export function formatAccountCurrency(value: number, currency: 'USD' | 'INR', decimals = true) {
  if (!Number.isFinite(value)) return 'Unavailable';
  const amount = currency === 'INR' ? value * DISPLAY_USD_INR_RATE : value;
  return new Intl.NumberFormat(currency === 'INR' ? 'en-IN' : 'en-US', {
    style: 'currency', currency,
    minimumFractionDigits: decimals ? 2 : 0,
    maximumFractionDigits: decimals ? 2 : 0,
  }).format(Object.is(amount, -0) ? 0 : amount);
}
