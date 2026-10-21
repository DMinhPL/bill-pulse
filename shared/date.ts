/**
 * Date helpers for the app's 'YYYY-MM-DD' bill dates.
 * Dates are parsed as UTC so they never shift by a day in the viewer's timezone.
 */

const longDateFormat = new Intl.DateTimeFormat('vi-VN', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  timeZone: 'UTC',
});

function parseIsoDate(isoDate: string): Date | null {
  const [y, m, d] = isoDate.split('-').map(Number);
  if (!y || !m || !d) return null;
  return new Date(Date.UTC(y, m - 1, d));
}

/** '2023-12-07' → '07/12/2023' */
export function formatDateShort(isoDate: string): string {
  const [year, month, day] = isoDate.split('-');
  return year && month && day ? `${day}/${month}/${year}` : isoDate;
}

/** '2023-12-07' → 'Thứ Năm, 7 tháng 12, 2023' */
export function formatDateLong(isoDate: string): string {
  const date = parseIsoDate(isoDate);
  return date ? longDateFormat.format(date) : isoDate;
}
