import { Badge, Input, Switch, cn } from "@particle-academy/react-fancy";
import type { FeatureDef, PlanFeatureValue } from "./types";

export interface PlanFeaturesEditorProps {
  /** All features that can be attached (e.g. from your FMS registry). */
  features: FeatureDef[];
  /** Controlled map of feature key → value. Pair with `onChange`. */
  value: Record<string, PlanFeatureValue>;
  onChange: (next: Record<string, PlanFeatureValue>) => void;
  className?: string;
}

/**
 * Admin editor for a plan's feature entitlements: toggle each feature on/off and,
 * for resource features, set a per-plan limit (blank = unlimited). Controlled —
 * `value` is a `{ key: PlanFeatureValue }` map you persist (e.g. to the
 * laravel-catalog `product_feature_configs` pivot: `enabled` + `included_quantity`).
 */
export function PlanFeaturesEditor({
  features,
  value,
  onChange,
  className,
}: PlanFeaturesEditorProps) {
  const setFeature = (key: string, next: PlanFeatureValue | undefined) => {
    const copy = { ...value };
    if (next === undefined) delete copy[key];
    else copy[key] = next;
    onChange(copy);
  };

  return (
    <div
      data-fancy-plan-features-editor=""
      className={cn("divide-y divide-zinc-100 rounded-xl border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-700", className)}
    >
      {features.map((feature) => {
        const current = value[feature.key];
        const enabled = current?.enabled ?? false;
        const isResource = feature.type === "resource";
        const limit = current && current.type === "resource" ? current.limit : null;

        const toggle = (on: boolean) => {
          if (!on) {
            setFeature(feature.key, undefined);
            return;
          }
          setFeature(
            feature.key,
            isResource
              ? { type: "resource", enabled: true, limit }
              : { type: "boolean", enabled: true },
          );
        };

        const setLimit = (raw: string) => {
          const trimmed = raw.trim();
          const next = trimmed === "" ? null : Math.max(0, Math.floor(Number(trimmed) || 0));
          setFeature(feature.key, { type: "resource", enabled: true, limit: next });
        };

        return (
          <div key={feature.key} className="flex items-center gap-4 p-3">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="font-medium text-zinc-800 dark:text-zinc-100">
                  {feature.name}
                </span>
                <Badge size="sm" variant="soft" color={isResource ? "violet" : "zinc"}>
                  {feature.type}
                </Badge>
              </div>
              {feature.description && (
                <p className="truncate text-xs text-zinc-400">{feature.description}</p>
              )}
            </div>

            {isResource && enabled && (
              <div className="w-40 shrink-0">
                <Input
                  type="number"
                  size="sm"
                  value={limit === null ? "" : String(limit)}
                  placeholder="Unlimited"
                  onValueChange={setLimit}
                  trailing={feature.unit ?? undefined}
                  aria-label={`${feature.name} limit`}
                />
              </div>
            )}

            <Switch
              checked={enabled}
              onCheckedChange={toggle}
              aria-label={`Toggle ${feature.name}`}
            />
          </div>
        );
      })}

      {features.length === 0 && (
        <div className="p-4 text-center text-sm text-zinc-400">
          No features registered.
        </div>
      )}
    </div>
  );
}

PlanFeaturesEditor.displayName = "PlanFeaturesEditor";
