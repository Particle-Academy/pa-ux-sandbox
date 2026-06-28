import type { BillingInterval, PlanPrice } from "./types";

/** Currencies with no minor unit (amounts are whole, not /100). */
const ZERO_DECIMAL = new Set([
  "bif", "clp", "djf", "gnf", "jpy", "kmf", "krw", "mga", "pyg",
  "rwf", "ugx", "vnd", "vuv", "xaf", "xof", "xpf",
]);

/** Format a minor-unit amount as a currency string, e.g. 2999 USD → "$29.99". */
export function formatMoney(amount: number, currency: string): string {
  const cur = currency.toLowerCase();
  const value = ZERO_DECIMAL.has(cur) ? amount : amount / 100;
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: currency.toUpperCase(),
      minimumFractionDigits: ZERO_DECIMAL.has(cur) ? 0 : undefined,
    }).format(value);
  } catch {
    // Unknown currency code — fall back to a plain number + code.
    return `${value} ${currency.toUpperCase()}`;
  }
}

const SHORT: Record<BillingInterval, string> = {
  day: "day",
  week: "wk",
  month: "mo",
  year: "yr",
  one_time: "",
};

/** Suffix for a price, e.g. "/mo", "/3 mo", or "" for one-time. */
export function intervalSuffix(interval: BillingInterval, count = 1): string {
  if (interval === "one_time") return "";
  const unit = SHORT[interval];
  return count > 1 ? `/${count} ${unit}` : `/${unit}`;
}

/** Pick a plan's price for a given interval (or its first/only price). */
export function priceForInterval(
  prices: PlanPrice[],
  interval: BillingInterval,
): PlanPrice | undefined {
  return prices.find((p) => p.interval === interval) ?? prices[0];
}

/** The distinct, sorted set of billing intervals across a list of plans. */
export function intervalsFromPlans(
  plans: { prices: PlanPrice[] }[],
): BillingInterval[] {
  const order: BillingInterval[] = ["day", "week", "month", "year", "one_time"];
  const seen = new Set<BillingInterval>();
  for (const plan of plans) for (const p of plan.prices) seen.add(p.interval);
  return order.filter((i) => seen.has(i));
}
