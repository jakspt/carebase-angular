/**
 * Normalizes a string date (YYYY-MM-DD or ISO string) or Date instance
 * into a Date instance with time set to local midnight (00:00:00.000).
 */
export function parseIsoDate(target: string | Date): Date {
  if (target instanceof Date) {
    const d = new Date(target.getTime());
    d.setHours(0, 0, 0, 0);
    return d;
  }

  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(target);
  if (match) {
    const year = parseInt(match[1], 10);
    const month = parseInt(match[2], 10) - 1;
    const day = parseInt(match[3], 10);
    return new Date(year, month, day, 0, 0, 0, 0);
  }

  const d = new Date(target);
  d.setHours(0, 0, 0, 0);
  return d;
}
