import { useState, type ReactNode } from "react";
import { Badge, Button, cn } from "@particle-academy/react-fancy";
import type { BillingInterval, Plan, PlanPrice } from "./types";
import {
  formatMoney,
  intervalsFromPlans,
  intervalSuffix,
  priceForInterval,
} from "./format";

export interface PricingTableProps {
  plans: Plan[];
  /** Controlled selected billing interval. Pair with `onIntervalChange`. */
  interval?: BillingInterval;
  /** Initial interval when uncontrolled. */
  defaultInterval?: BillingInterval;
  onIntervalChange?: (interval: BillingInterval) => void;
  /** Limit / order the toggle options. Defaults to the intervals the plans offer. */
  intervals?: BillingInterval[];
  /** Hide the interval toggle (e.g. single-interval catalogs). */
  hideIntervalToggle?: boolean;
  /** Fired when a plan's CTA is clicked. */
  onSelectPlan?: (planId: string, price: PlanPrice | undefined) => void;
  /** Map an interval to a toggle label (e.g. add a "save 20%" hint on year). */
  intervalLabel?: (interval: BillingInterval) => ReactNode;
  className?: string;
}

const DEFAULT_INTERVAL_LABEL: Record<BillingInterval, string> = {
  day: "Daily",
  week: "Weekly",
  month: "Monthly",
  year: "Yearly",
  one_time: "One-time",
};

/**
 * A storefront pricing table: a card per plan with a controlled billing-interval
 * toggle. Framework-agnostic — feed it normalized `Plan[]` (see ./types) and
 * handle `onSelectPlan` (start checkout, redirect, etc.).
 */
export function PricingTable({
  plans,
  interval,
  defaultInterval,
  onIntervalChange,
  intervals,
  hideIntervalToggle,
  onSelectPlan,
  intervalLabel,
  className,
}: PricingTableProps) {
  const options = intervals ?? intervalsFromPlans(plans);
  const fallback = defaultInterval ?? options[0] ?? "month";
  const [internal, setInternal] = useState<BillingInterval>(fallback);
  const active = interval ?? internal;

  const setInterval = (next: BillingInterval) => {
    if (interval === undefined) setInternal(next);
    onIntervalChange?.(next);
  };

  const showToggle = !hideIntervalToggle && options.length > 1;

  return (
    <div data-fancy-pricing-table="" className={cn("flex flex-col gap-6", className)}>
      {showToggle && (
        <div className="flex justify-center">
          <div
            role="tablist"
            aria-label="Billing interval"
            className="inline-flex rounded-lg border border-zinc-200 bg-zinc-100 p-1 dark:border-zinc-700 dark:bg-zinc-800"
          >
            {options.map((opt) => (
              <button
                key={opt}
                role="tab"
                aria-selected={opt === active}
                onClick={() => setInterval(opt)}
                className={cn(
                  "rounded-md px-4 py-1.5 text-sm font-medium transition-colors",
                  opt === active
                    ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-950 dark:text-zinc-100"
                    : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200",
                )}
              >
                {intervalLabel?.(opt) ?? DEFAULT_INTERVAL_LABEL[opt]}
              </button>
            ))}
          </div>
        </div>
      )}

      <div
        className="grid gap-6"
        style={{ gridTemplateColumns: `repeat(${Math.min(plans.length, 4)}, minmax(0, 1fr))` }}
      >
        {plans.map((plan) => {
          const price = priceForInterval(plan.prices, active);
          const cta =
            plan.ctaLabel ?? (plan.current ? "Current plan" : `Choose ${plan.name}`);
          return (
            <div
              key={plan.id}
              data-fancy-plan-card=""
              data-recommended={plan.recommended ? "" : undefined}
              className={cn(
                "relative flex flex-col rounded-2xl border bg-white p-6 dark:bg-zinc-900",
                plan.recommended
                  ? "border-blue-500 ring-1 ring-blue-500 shadow-lg dark:border-blue-400 dark:ring-blue-400"
                  : "border-zinc-200 dark:border-zinc-700",
              )}
            >
              {plan.recommended && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge color="blue" variant="solid">
                    {plan.badge ?? "Most popular"}
                  </Badge>
                </div>
              )}

              <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                {plan.name}
              </h3>
              {plan.description && (
                <p className="mt-1 text-sm text-zinc-500">{plan.description}</p>
              )}

              <div className="mt-4 flex items-baseline gap-1">
                {price ? (
                  <>
                    <span className="text-3xl font-bold tabular-nums text-zinc-900 dark:text-zinc-100">
                      {formatMoney(price.amount, price.currency)}
                    </span>
                    <span className="text-sm text-zinc-500">
                      {intervalSuffix(price.interval, price.intervalCount)}
                    </span>
                  </>
                ) : (
                  <span className="text-sm text-zinc-400">Not available {DEFAULT_INTERVAL_LABEL[active].toLowerCase()}</span>
                )}
              </div>

              {plan.highlights && plan.highlights.length > 0 && (
                <ul className="mt-5 flex flex-1 flex-col gap-2 text-sm text-zinc-600 dark:text-zinc-300">
                  {plan.highlights.map((h, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <CheckIcon className="mt-0.5 h-4 w-4 shrink-0 text-green-500" />
                      <span>{h}</span>
                    </li>
                  ))}
                </ul>
              )}

              <div className={cn("pt-6", !plan.highlights?.length && "mt-auto")}>
                <Button
                  color={plan.recommended ? "blue" : "zinc"}
                  variant={plan.current ? "ghost" : "default"}
                  disabled={plan.disabled || plan.current || !price}
                  onClick={() => onSelectPlan?.(plan.id, price)}
                  className="w-full justify-center"
                >
                  {cta}
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className={className} aria-hidden>
      <path
        fillRule="evenodd"
        d="M16.7 5.3a1 1 0 0 1 0 1.4l-7.5 7.5a1 1 0 0 1-1.4 0L3.3 10.7a1 1 0 1 1 1.4-1.4l3.3 3.29 6.8-6.8a1 1 0 0 1 1.4 0Z"
        clipRule="evenodd"
      />
    </svg>
  );
}

PricingTable.displayName = "PricingTable";
