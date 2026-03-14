/**
 * Input sanitization and validation utilities for stock symbols and other
 * user-supplied parameters used in API routes.
 */

// Valid stock symbol characters: letters, digits, . - ^ = /
// Examples: AAPL, BRK.A, BTC-USD, ^GSPC, GC=F, BF/B
const SYMBOL_REGEX = /^[A-Z0-9.\-^=/]{1,20}$/

/**
 * Sanitize a raw symbol string: trim whitespace, uppercase, strip characters
 * outside the allowed set. Returns an empty string if the input is falsy.
 */
export function sanitizeSymbol(raw: string): string {
  if (!raw) return ''
  return raw
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9.\-^=/]/g, '')
    .slice(0, 20)
}

/**
 * Validate a (pre-sanitized) symbol. Returns true if the symbol matches the
 * expected format for a stock/index/commodity/crypto ticker.
 */
export function validateSymbol(symbol: string): boolean {
  if (!symbol) return false
  return SYMBOL_REGEX.test(symbol)
}
