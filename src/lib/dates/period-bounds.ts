/**
 * Calendar-day math for the `/app` dashboard's today/week/month cards.
 * Every "day" boundary respects the establishment's own `timezone` — never
 * the server's local time or UTC — so a sale two minutes before midnight
 * lands on the right day for the owner reading the dashboard.
 */

/** `YYYY-MM-DD` for "now" as seen from `timezone`. */
export function todayInTimezone(timezone: string): string {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return formatter.format(new Date());
}

function addDays(isoDate: string, days: number): string {
  const [year, month, day] = isoDate.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

/** Monday of the ISO week containing `isoDate`. */
export function startOfWeek(isoDate: string): string {
  const [year, month, day] = isoDate.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  // getUTCDay(): 0=Sunday..6=Saturday. ISO weeks start on Monday.
  const isoDayIndex = (date.getUTCDay() + 6) % 7;
  return addDays(isoDate, -isoDayIndex);
}

export function startOfMonth(isoDate: string): string {
  return `${isoDate.slice(0, 7)}-01`;
}

/** The full prior calendar month, given any date inside the current one. */
export function previousMonthRange(monthStart: string): { fromDate: string; toDate: string } {
  const [year, month] = monthStart.split("-").map(Number);
  const previousMonthEnd = new Date(Date.UTC(year, month - 1, 0));
  const previousMonthStart = new Date(Date.UTC(previousMonthEnd.getUTCFullYear(), previousMonthEnd.getUTCMonth(), 1));
  return {
    fromDate: previousMonthStart.toISOString().slice(0, 10),
    toDate: previousMonthEnd.toISOString().slice(0, 10),
  };
}
