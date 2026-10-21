/**
 * Vietnamese Dong (VND) Currency & Number Utilities
 * Standard symbol: ₫
 * Formatting: 1.250.000 ₫ (dots for thousands separators)
 */

export function formatVND(
  amount: number | null | undefined,
  options?: {
    showSign?: boolean;
    compact?: boolean;
    includeSymbol?: boolean;
  }
): string {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return '0 ₫';
  }

  const { showSign = false, compact = false, includeSymbol = true } = options || {};
  const symbol = includeSymbol ? ' ₫' : '';
  const sign = showSign && amount > 0 ? '+' : '';

  if (compact) {
    const abs = Math.abs(amount);
    const signPrefix = amount < 0 ? '-' : sign;

    if (abs >= 1_000_000_000) {
      const val = (abs / 1_000_000_000).toFixed(1).replace('.0', '');
      return `${signPrefix}${val.replace('.', ',')} tỷ${symbol}`;
    }
    if (abs >= 1_000_000) {
      const val = (abs / 1_000_000).toFixed(1).replace('.0', '');
      return `${signPrefix}${val.replace('.', ',')} tr${symbol}`;
    }
    if (abs >= 1_000) {
      const val = Math.round(abs / 1_000);
      return `${signPrefix}${val}k${symbol}`;
    }
  }

  // Format with standard dot thousands separator for Vietnamese currency
  const rounded = Math.round(amount);
  const formatted = Math.abs(rounded)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, '.');

  const prefix = rounded < 0 ? '-' : sign;
  return `${prefix}${formatted}${symbol}`;
}

export function formatPercent(value: number, showSign = true): string {
  if (isNaN(value)) return '0%';
  const sign = showSign && value > 0 ? '+' : '';
  return `${sign}${value.toFixed(1)}%`;
}

export function parseVND(input: string | number): number {
  if (typeof input === 'number') return isNaN(input) ? 0 : input;
  if (!input) return 0;

  let str = input.trim().toLowerCase();
  // Check k / tr / trieu
  let multiplier = 1;
  if (str.endsWith('k') || str.endsWith('nghìn') || str.endsWith('nghin')) {
    multiplier = 1_000;
    str = str.replace(/(k|nghìn|nghin)$/i, '').trim();
  } else if (str.endsWith('tr') || str.endsWith('triệu') || str.endsWith('trieu') || str.endsWith('m')) {
    multiplier = 1_000_000;
    str = str.replace(/(tr|triệu|trieu|m)$/i, '').trim();
  }

  // Remove commas, dots, spaces, ₫, đ, vnd
  str = str.replace(/[₫đvnd\s]/g, '');
  str = str.replace(/\./g, '');
  str = str.replace(/,/g, '.');

  const num = parseFloat(str);
  return isNaN(num) ? 0 : Math.round(num * multiplier);
}
