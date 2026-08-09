/**
 * QRDineX — Currency Utility & Formatter
 * ============================================================
 * Provides consistent currency symbol formatting across the entire app
 * (Menu, Cart, Orders, Billing, Invoices, Dashboard).
 *
 * Does NOT perform currency conversion — only updates the display symbol.
 */

export interface CurrencyConfig {
  code: string
  symbol: string
  name: string
}

export const SUPPORTED_CURRENCIES: Record<string, CurrencyConfig> = {
  INR: { code: 'INR', symbol: '₹', name: 'Indian Rupee (₹)' },
  USD: { code: 'USD', symbol: '$', name: 'US Dollar ($)' },
  EUR: { code: 'EUR', symbol: '€', name: 'Euro (€)' },
  GBP: { code: 'GBP', symbol: '£', name: 'British Pound (£)' },
  AED: { code: 'AED', symbol: 'AED ', name: 'UAE Dirham (AED)' },
  CAD: { code: 'CAD', symbol: 'CA$', name: 'Canadian Dollar (CA$)' },
  AUD: { code: 'AUD', symbol: 'A$', name: 'Australian Dollar (A$)' },
}

export function getCurrencySymbol(currencyCode: string = 'INR'): string {
  const code = currencyCode.toUpperCase()
  return SUPPORTED_CURRENCIES[code]?.symbol ?? '₹'
}

export function formatCurrency(
  amount: number | string | undefined | null,
  currencyCode: string = 'INR'
): string {
  const numericAmount = Number(amount) || 0
  const symbol = getCurrencySymbol(currencyCode)
  return `${symbol}${numericAmount.toFixed(2)}`
}
