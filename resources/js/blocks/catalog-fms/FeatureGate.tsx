import type { ReactNode } from "react";
import { Button, Callout, cn } from "@particle-academy/react-fancy";
import type { Entitlements } from "./types";

export type FeatureGateMode = "replace" | "blur" | "hide";

export interface FeatureGateProps {
  /** Feature key to check in `entitlements`. */
  feature: string;
  /** The viewer's entitlements (from your FMS check). */
  entitlements: Entitlements;
  /** Human label for the locked prompt (defaults to the feature key). */
  featureName?: string;
  children: ReactNode;
  /**
   * How to render when locked: `replace` (default) swaps in an upgrade prompt,
   * `blur` overlays the (blurred) children, `hide` renders `fallback` or nothing.
   */
  mode?: FeatureGateMode;
  /** Custom locked UI — overrides the built-in prompt. Receives the reason. */
  renderLocked?: (reason: LockedReason) => ReactNode;
  /** Rendered when `mode="hide"` and locked. */
  fallback?: ReactNode;
  /** CTA on the built-in prompt. */
  onUpgrade?: () => void;
  upgradeHref?: string;
  upgradeLabel?: string;
  className?: string;
}

export type LockedReason =
  | { kind: "no-access" }
  | { kind: "quota"; used: number; limit: number };

/** Resolve whether a feature is currently usable (access + quota). */
export function gateStatus(
  entitlements: Entitlements,
  feature: string,
): { unlocked: boolean; reason: LockedReason | null } {
  const ent = entitlements.features[feature];
  if (!ent || !ent.access) return { unlocked: false, reason: { kind: "no-access" } };
  // Resource quota: if a finite limit + usage are known, enforce it.
  if (ent.limit != null && ent.used != null && ent.used >= ent.limit) {
    return { unlocked: false, reason: { kind: "quota", used: ent.used, limit: ent.limit } };
  }
  return { unlocked: true, reason: null };
}

/**
 * Gate UI behind an FMS feature entitlement. When the viewer has access (and
 * any resource quota remains) it renders `children`; otherwise it shows an
 * upgrade prompt (or blurs / hides, per `mode`). Pure + controlled: you supply
 * `entitlements` from your own FMS check.
 */
export function FeatureGate({
  feature,
  entitlements,
  featureName,
  children,
  mode = "replace",
  renderLocked,
  fallback,
  onUpgrade,
  upgradeHref,
  upgradeLabel = "Upgrade",
  className,
}: FeatureGateProps) {
  const { unlocked, reason } = gateStatus(entitlements, feature);
  if (unlocked) return <>{children}</>;

  if (mode === "hide") return <>{fallback ?? null}</>;

  const name = featureName ?? feature;
  const locked = renderLocked?.(reason!) ?? (
    <Callout
      color={reason?.kind === "quota" ? "amber" : "blue"}
      className={cn("flex flex-col items-start gap-2", className)}
    >
      <div className="font-medium">
        {reason?.kind === "quota"
          ? `You've reached your ${name} limit (${reason.used}/${reason.limit}).`
          : `${name} is not included in your plan.`}
      </div>
      <p className="text-sm opacity-80">
        {reason?.kind === "quota"
          ? "Upgrade for a higher limit."
          : `Upgrade to unlock ${name}.`}
      </p>
      {(onUpgrade || upgradeHref) &&
        (upgradeHref ? (
          <a href={upgradeHref}>
            <Button color="blue" size="sm">
              {upgradeLabel}
            </Button>
          </a>
        ) : (
          <Button color="blue" size="sm" onClick={onUpgrade}>
            {upgradeLabel}
          </Button>
        ))}
    </Callout>
  );

  if (mode === "blur") {
    return (
      <div data-fancy-feature-gate="" data-locked="" className={cn("relative", className)}>
        <div aria-hidden className="pointer-events-none select-none blur-sm">
          {children}
        </div>
        <div className="absolute inset-0 flex items-center justify-center bg-white/40 p-4 backdrop-blur-[1px] dark:bg-zinc-950/40">
          {locked}
        </div>
      </div>
    );
  }

  return (
    <div data-fancy-feature-gate="" data-locked="">
      {locked}
    </div>
  );
}

FeatureGate.displayName = "FeatureGate";
