/**
 * currency.ts
 *
 * Centralized Pakistani Rupee (PKR) formatting and conversion utilities.
 */

/**
 * Format any numeric value as Pakistani Rupee (PKR)
 * e.g. 98500 -> "Rs. 98,500"
 */
export function formatPKR(amount: number): string {
  if (amount === undefined || amount === null || isNaN(amount)) {
    return 'Rs. 0';
  }
  const rounded = Math.round(amount);
  return `Rs. ${rounded.toLocaleString('en-PK')}`;
}

/**
 * Universal price formatter
 */
export function formatPrice(amount: number): string {
  return formatPKR(amount);
}

/**
 * Format compact price for badges / quick stats
 * e.g. 150000 -> "Rs. 150K"
 */
export function formatCompactPKR(amount: number): string {
  if (amount >= 1_000_000) {
    return `Rs. ${(amount / 1_000_000).toFixed(1)}M`;
  }
  if (amount >= 1_000) {
    return `Rs. ${(amount / 1_000).toFixed(0)}K`;
  }
  return formatPKR(amount);
}
