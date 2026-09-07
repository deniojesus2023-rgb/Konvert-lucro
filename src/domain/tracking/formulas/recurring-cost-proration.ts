import { ZERO_CENTS, toDerivedCents, type Cents } from "../../money/cents";
import { addCents, mulDivRound } from "../../money/arithmetic";

export interface RecurringCostInput {
  readonly amountCents: Cents;
  readonly frequency: "monthly" | "weekly";
  readonly startDate: string;
  /** `null` means still active — the period's own end bounds the overlap. */
  readonly endDate: string | null;
}

export interface DateRange {
  readonly from: string;
  readonly to: string;
}

function toUtcDate(isoDate: string): Date {
  const [year, month, day] = isoDate.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

function toIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function daysInMonth(year: number, monthIndex: number): number {
  return new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate();
}

function daysBetweenInclusive(fromIso: string, toIso: string): number {
  const diffMs = toUtcDate(toIso).getTime() - toUtcDate(fromIso).getTime();
  return Math.round(diffMs / 86_400_000) + 1;
}

function max(a: string, b: string): string {
  return a > b ? a : b;
}

function min(a: string, b: string): string {
  return a < b ? a : b;
}

/**
 * Splits `[from, to]` into one segment per calendar month it touches, each
 * carrying how many days of that month fall in the range and how many days
 * that month actually has — the denominator a monthly cost is spread over.
 */
function monthSegments(from: string, to: string): Array<{ segmentDays: number; daysInMonth: number }> {
  const segments: Array<{ segmentDays: number; daysInMonth: number }> = [];
  let cursor = toUtcDate(from);
  const end = toUtcDate(to);

  while (cursor <= end) {
    const year = cursor.getUTCFullYear();
    const monthIndex = cursor.getUTCMonth();
    const monthEnd = new Date(Date.UTC(year, monthIndex + 1, 0));
    const segmentEnd = monthEnd < end ? monthEnd : end;

    segments.push({
      segmentDays: daysBetweenInclusive(toIsoDate(cursor), toIsoDate(segmentEnd)),
      daysInMonth: daysInMonth(year, monthIndex),
    });

    cursor = new Date(segmentEnd.getTime() + 86_400_000);
  }

  return segments;
}

/**
 * Allocates a recurring cost's share of `period` — the same "never store
 * what can be derived" principle as `diagnostic_results` (which only ever
 * stores the final computed figure, not intermediate steps). A monthly
 * cost is spread evenly across the actual days of whichever calendar
 * month(s) the overlap touches (28-31 days, never a flat 30), so a cost
 * that starts mid-month is prorated correctly instead of over- or
 * under-counted.
 */
export function prorateRecurringCost(cost: RecurringCostInput, period: DateRange): Cents {
  const effectiveEnd = cost.endDate ? min(cost.endDate, period.to) : period.to;
  const overlapStart = max(cost.startDate, period.from);
  const overlapEnd = min(effectiveEnd, period.to);

  if (overlapStart > overlapEnd) return ZERO_CENTS;

  if (cost.frequency === "weekly") {
    const days = daysBetweenInclusive(overlapStart, overlapEnd);
    return toDerivedCents(mulDivRound(cost.amountCents, days, 7));
  }

  let total: Cents = ZERO_CENTS;
  for (const segment of monthSegments(overlapStart, overlapEnd)) {
    const share = toDerivedCents(mulDivRound(cost.amountCents, segment.segmentDays, segment.daysInMonth));
    total = addCents(total, share);
  }
  return total;
}
