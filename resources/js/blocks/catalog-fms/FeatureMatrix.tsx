import { Fragment } from "react";
import { cn } from "@particle-academy/react-fancy";
import type { FeatureDef, Plan, PlanFeatureValue } from "./types";

export interface FeatureMatrixProps {
  plans: Plan[];
  features: FeatureDef[];
  /** Order of feature `group`s; ungrouped features render first, un-headed. */
  groupOrder?: string[];
  /** Sticky the first column + header (default true). */
  sticky?: boolean;
  className?: string;
}

/**
 * A plan × feature comparison table. Rows are features (optionally grouped),
 * columns are plans; each cell renders the plan's `features[key]` value —
 * a check/dash for boolean features, a limit (or "Unlimited") for resource
 * features. Framework-agnostic: feed it normalized `Plan[]` + `FeatureDef[]`.
 */
export function FeatureMatrix({
  plans,
  features,
  groupOrder,
  sticky = true,
  className,
}: FeatureMatrixProps) {
  // Bucket features by group, preserving order.
  const groups: { group: string | null; items: FeatureDef[] }[] = [];
  const index = new Map<string | null, FeatureDef[]>();
  for (const f of features) {
    const g = f.group ?? null;
    if (!index.has(g)) {
      index.set(g, []);
      groups.push({ group: g, items: index.get(g)! });
    }
    index.get(g)!.push(f);
  }
  if (groupOrder) {
    groups.sort(
      (a, b) =>
        (a.group ? groupOrder.indexOf(a.group) : -1) -
        (b.group ? groupOrder.indexOf(b.group) : -1),
    );
  }

  return (
    <div
      data-fancy-feature-matrix=""
      className={cn("overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-700", className)}
    >
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-zinc-200 dark:border-zinc-700">
            <th
              className={cn(
                "p-3 text-left font-medium text-zinc-500",
                sticky && "sticky left-0 bg-white dark:bg-zinc-900",
              )}
            >
              Features
            </th>
            {plans.map((plan) => (
              <th
                key={plan.id}
                className={cn(
                  "p-3 text-center font-semibold text-zinc-900 dark:text-zinc-100",
                  plan.recommended && "text-blue-600 dark:text-blue-400",
                )}
              >
                {plan.name}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {groups.map(({ group, items }) => (
            <Fragment key={group ?? "_"}>
              {group && (
                <tr className="bg-zinc-50 dark:bg-zinc-800/50">
                  <td
                    colSpan={plans.length + 1}
                    className="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-zinc-400"
                  >
                    {group}
                  </td>
                </tr>
              )}
              {items.map((feature) => (
                <tr
                  key={feature.key}
                  className="border-b border-zinc-100 last:border-0 dark:border-zinc-800"
                >
                  <td
                    className={cn(
                      "p-3 text-left text-zinc-700 dark:text-zinc-300",
                      sticky && "sticky left-0 bg-white dark:bg-zinc-900",
                    )}
                  >
                    <span className="font-medium">{feature.name}</span>
                    {feature.description && (
                      <span className="block text-xs text-zinc-400">{feature.description}</span>
                    )}
                  </td>
                  {plans.map((plan) => (
                    <td key={plan.id} className="p-3 text-center align-middle">
                      <Cell value={plan.features?.[feature.key]} unit={feature.unit} />
                    </td>
                  ))}
                </tr>
              ))}
            </Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Cell({ value, unit }: { value?: PlanFeatureValue; unit?: string }) {
  if (!value || value.enabled === false) {
    return <DashIcon className="mx-auto h-4 w-4 text-zinc-300 dark:text-zinc-600" />;
  }
  if (value.type === "boolean") {
    return <CheckIcon className="mx-auto h-5 w-5 text-green-500" />;
  }
  // resource
  if (value.limit === null) {
    return <span className="font-medium text-zinc-700 dark:text-zinc-200">Unlimited</span>;
  }
  return (
    <span className="font-medium tabular-nums text-zinc-700 dark:text-zinc-200">
      {value.limit.toLocaleString()}
      {unit ? ` ${unit}` : ""}
    </span>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className={className} aria-label="Included">
      <path
        fillRule="evenodd"
        d="M16.7 5.3a1 1 0 0 1 0 1.4l-7.5 7.5a1 1 0 0 1-1.4 0L3.3 10.7a1 1 0 1 1 1.4-1.4l3.3 3.29 6.8-6.8a1 1 0 0 1 1.4 0Z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function DashIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className={className} aria-label="Not included">
      <path d="M5 9.25h10a.75.75 0 0 1 0 1.5H5a.75.75 0 0 1 0-1.5Z" />
    </svg>
  );
}

FeatureMatrix.displayName = "FeatureMatrix";
