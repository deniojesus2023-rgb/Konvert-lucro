import { ZERO_CENTS, toDerivedCents, type Cents } from "../money/cents";
import { addCents, mulDivRound, subtractCents } from "../money/arithmetic";
import {
  isResolved,
  resolvedValue,
  type ResponseState,
} from "./response-state";
import { REQUIRED_COST_GROUPS, FORMULA_VERSION } from "./constants";
import { computeBreakEven } from "./formulas/break-even";
import { topCostBuckets } from "./formulas/cost-buckets";
import type {
  BlindSpot,
  BlindSpotField,
  BlindSpotKind,
  CostBucket,
  DiagnosticInput,
  Metric,
  ProfitResult,
  UnavailableMetric,
  UnavailableReason,
} from "./types";

function blindSpotKind<T>(state: ResponseState<T>): BlindSpotKind | null {
  if (state.kind === "unknown") return "unknown";
  if (state.kind === "unanswered") return "unanswered";
  if (state.kind === "range" && state.max === null) return "open_range";
  return null;
}

function unavailable(reason: UnavailableReason): UnavailableMetric {
  return { status: "unavailable", reason };
}

export function calculateProfit(input: DiagnosticInput): ProfitResult {
  const blindSpots: BlindSpot[] = [];
  const estimatedGroups: BlindSpotField[] = [];

  const noteField = (field: BlindSpotField, state: ResponseState<unknown>) => {
    const kind = blindSpotKind(state);
    if (kind) blindSpots.push({ field, kind });
    if (state.kind === "estimated") estimatedGroups.push(field);
  };

  noteField("revenue", input.revenue);
  for (const group of REQUIRED_COST_GROUPS) noteField(group, input.costs[group]);
  noteField("taxes", input.taxes.state);
  noteField("orders", input.orders);
  noteField("goal", input.goal);

  // --- Revenue -------------------------------------------------------
  const revenueResolved = isResolved(input.revenue);
  const revenueValue = resolvedValue(input.revenue, ZERO_CENTS);
  const revenue: Metric<Cents> = revenueResolved
    ? { status: "confirmed", value: revenueValue as Cents }
    : unavailable("missing_revenue");

  // --- Known costs (whatever is resolved, partial or complete) -------
  const costEntries = REQUIRED_COST_GROUPS.map((group) => ({
    group,
    state: input.costs[group],
  }));

  const resolvedCostBuckets: CostBucket[] = [];
  let knownCostsTotal: Cents = ZERO_CENTS;

  for (const { group, state } of costEntries) {
    if (isResolved(state)) {
      const value = resolvedValue(state, ZERO_CENTS) as Cents;
      knownCostsTotal = addCents(knownCostsTotal, value);
      resolvedCostBuckets.push({
        group,
        totalCents: value,
        isEstimated: state.kind === "estimated",
      });
    }
  }

  const taxesResolved = isResolved(input.taxes.state);
  const taxesValue = taxesResolved
    ? (resolvedValue(input.taxes.state, ZERO_CENTS) as Cents)
    : null;
  if (taxesResolved && taxesValue !== null) {
    knownCostsTotal = addCents(knownCostsTotal, taxesValue);
    resolvedCostBuckets.push({
      group: "taxes",
      totalCents: taxesValue,
      isEstimated: input.taxes.state.kind === "estimated",
    });
  }

  // --- Balance before unknown costs (never called "profit") ----------
  const balanceBeforeUnknownCosts: Metric<Cents> = revenueResolved
    ? {
        status: "confirmed",
        value: subtractCents(revenueValue as Cents, knownCostsTotal),
      }
    : unavailable("missing_revenue");

  // --- Profit before taxes --------------------------------------------
  const requiredCostsResolved = costEntries.every(({ state }) => isResolved(state));
  const variableCostsPreTax = addCents(
    resolvedValue(input.costs.production, ZERO_CENTS) ?? ZERO_CENTS,
    resolvedValue(input.costs.fees, ZERO_CENTS) ?? ZERO_CENTS,
    resolvedValue(input.costs.delivery, ZERO_CENTS) ?? ZERO_CENTS,
  );
  const fixedCostsPreTax = resolvedValue(input.costs.fixedStructure, ZERO_CENTS) ?? ZERO_CENTS;
  const totalCostsPreTax = addCents(variableCostsPreTax, fixedCostsPreTax);

  let profitBeforeTaxes: Metric<Cents>;
  if (!revenueResolved) {
    profitBeforeTaxes = unavailable("missing_revenue");
  } else if (!requiredCostsResolved) {
    profitBeforeTaxes = unavailable("missing_required_costs");
  } else {
    profitBeforeTaxes = {
      status: "confirmed",
      value: subtractCents(revenueValue as Cents, totalCostsPreTax),
    };
  }

  // --- Profit after taxes (the headline figure) -----------------------
  let profit: Metric<Cents>;
  if (profitBeforeTaxes.status === "unavailable") {
    profit = profitBeforeTaxes;
  } else if (!taxesResolved || taxesValue === null) {
    profit = unavailable("missing_taxes");
  } else {
    profit = {
      status: "confirmed",
      value: subtractCents(profitBeforeTaxes.value, taxesValue),
    };
  }

  // --- Margin & take-home per R$100 ------------------------------------
  let marginBps: Metric<number>;
  let takeHomePer100Cents: Metric<number>;
  if (profit.status === "unavailable") {
    marginBps = profit;
    takeHomePer100Cents = profit;
  } else if ((revenueValue as Cents) === ZERO_CENTS) {
    marginBps = unavailable("zero_revenue");
    takeHomePer100Cents = unavailable("zero_revenue");
  } else {
    const ratioTimes10000 = mulDivRound(profit.value, 10_000, revenueValue as Cents);
    marginBps = { status: "confirmed", value: ratioTimes10000 };
    takeHomePer100Cents = { status: "confirmed", value: ratioTimes10000 };
  }

  // --- Profit per order --------------------------------------------------
  const ordersResolved = isResolved(input.orders);
  const ordersValue = resolvedValue(input.orders, 0);
  let profitPerOrder: Metric<Cents>;
  if (profit.status === "unavailable") {
    profitPerOrder = profit;
  } else if (!ordersResolved) {
    profitPerOrder = unavailable("missing_orders");
  } else if (ordersValue === 0) {
    profitPerOrder = unavailable("zero_orders");
  } else {
    profitPerOrder = {
      status: "confirmed",
      value: toDerivedCents(mulDivRound(profit.value, 1, ordersValue as number)),
    };
  }

  // --- Break-even ----------------------------------------------------
  let breakEvenRevenue: Metric<Cents>;
  let breakEvenOrders: Metric<number>;
  const taxesAmountAffectsSplit = taxesResolved && taxesValue !== null && taxesValue !== ZERO_CENTS;

  if (!revenueResolved) {
    breakEvenRevenue = unavailable("missing_revenue");
    breakEvenOrders = unavailable("missing_revenue");
  } else if (!requiredCostsResolved) {
    breakEvenRevenue = unavailable("missing_required_costs");
    breakEvenOrders = unavailable("missing_required_costs");
  } else if (!taxesResolved) {
    breakEvenRevenue = unavailable("missing_taxes");
    breakEvenOrders = unavailable("missing_taxes");
  } else if (taxesAmountAffectsSplit && input.taxes.classification === "unclassified") {
    breakEvenRevenue = unavailable("unclassified_taxes");
    breakEvenOrders = unavailable("unclassified_taxes");
  } else {
    const taxAsVariable =
      input.taxes.classification === "variable" && taxesValue !== null ? taxesValue : ZERO_CENTS;
    const taxAsFixed =
      input.taxes.classification === "fixed" && taxesValue !== null ? taxesValue : ZERO_CENTS;

    const variableCosts = addCents(variableCostsPreTax, taxAsVariable);
    const fixedCosts = addCents(fixedCostsPreTax, taxAsFixed);

    const result = computeBreakEven({
      revenueCents: revenueValue as Cents,
      variableCostsCents: variableCosts,
      fixedCostsCents: fixedCosts,
      ordersValue: ordersResolved ? (ordersValue as number) : null,
    });
    breakEvenRevenue = result.revenue;
    breakEvenOrders = result.orders;
  }

  // --- Gap to goal -----------------------------------------------------
  const goalResolved = isResolved(input.goal);
  const goalValue = resolvedValue(input.goal, ZERO_CENTS);
  let gapToGoal: Metric<Cents>;
  if (profit.status === "unavailable") {
    gapToGoal = profit;
  } else if (!goalResolved) {
    gapToGoal = unavailable("missing_goal");
  } else {
    gapToGoal = {
      status: "confirmed",
      value: subtractCents(goalValue as Cents, profit.value),
    };
  }

  return {
    formulaVersion: FORMULA_VERSION,
    selfReportedDisclaimer: true,
    revenue,
    knownCostsTotalCents: knownCostsTotal,
    balanceBeforeUnknownCosts,
    profitBeforeTaxes,
    profit,
    marginBps,
    profitPerOrder,
    takeHomePer100Cents,
    breakEvenRevenue,
    breakEvenOrders,
    gapToGoal,
    topCostGroups: topCostBuckets(resolvedCostBuckets),
    blindSpots,
    hasEstimatedInputs: estimatedGroups.length > 0,
    estimatedGroups,
  };
}
