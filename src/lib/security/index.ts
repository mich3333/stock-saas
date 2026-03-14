/**
 * Security utilities for input validation and sanitization.
 * Used by API routes to prevent injection and path-traversal via stock symbols.
 */

const SYMBOL_PATTERN = /^[A-Z0-9.\-]{1,10}$/

/**
 * Strip all characters that are not alphanumeric, dots, or hyphens from a
 * stock symbol string, then uppercase the result.
 * Use before any downstream API call or database query.
 */
export function sanitizeSymbol(s: string): string {
  return s.replace(/[^A-Za-z0-9.\-]/g, '').toUpperCase()
}

/**
 * Return true only if the symbol matches the allowed pattern:
 * 1–10 uppercase letters, digits, dots, or hyphens.
 * Always validate AFTER sanitizing.
 */
export function validateSymbol(s: string): boolean {
  return SYMBOL_PATTERN.test(s)
}
