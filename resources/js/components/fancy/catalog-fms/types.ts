/**
 * Catalog + FMS UI — shared types.
 *
 * These are framework-agnostic, JSON-friendly shapes: a backend (Laravel
 * laravel-catalog + laravel-fms, or anything else) normalizes its data into
 * these and the components render. Nothing here imports React or Laravel.
 */

/** Stripe-style recurring interval (or `one_time` for non-recurring prices). */
export type BillingInterval = "day" | "week" | "month" | "year" | "one_time";

export interface PlanPrice {
  id: string;
  /** Amount in the currency's MINOR units (e.g. cents). */
  amount: number;
  /** ISO 4217 currency code, lower or upper case (e.g. `"usd"`). */
  currency: string;
  interval: BillingInterval;
  /** e.g. `3` for "every 3 months". Defaults to 1. */
  intervalCount?: number;
}

/** What a plan grants for one feature — used to build the comparison matrix. */
export type PlanFeatureValue =
  | { type: "boolean"; enabled: boolean }
  /** `limit: null` = unlimited; `enabled: false` = not included. */
  | { type: "resource"; enabled: boolean; limit: number | null };

export interface Plan {
  id: string;
  name: string;
  description?: string;
  /** Visually emphasize this plan (and show the `badge`). */
  recommended?: boolean;
  /** Ribbon text on the card, e.g. "Most popular". */
  badge?: string;
  /** One price per interval the plan offers (e.g. a month + a year price). */
  prices: PlanPrice[];
  /** Short bullets shown on the pricing card. */
  highlights?: string[];
  /** Feature key → value, for `<FeatureMatrix>`. */
  features?: Record<string, PlanFeatureValue>;
  /** The viewer is currently on this plan. */
  current?: boolean;
  /** Override the CTA label (default derives from `current`). */
  ctaLabel?: string;
  disabled?: boolean;
}

export interface FeatureDef {
  key: string;
  name: string;
  description?: string;
  type: "boolean" | "resource";
  /** Optional section grouping in the matrix. */
  group?: string;
  /** Unit for resource features, e.g. "seats", "GB". */
  unit?: string;
}

/** The viewer's access to a single feature — used by `<FeatureGate>`. */
export interface Entitlement {
  access: boolean;
  /** Resource cap (`null` = unlimited). Omit for boolean features. */
  limit?: number | null;
  /** Resource consumed so far (for quota gating). */
  used?: number;
}

export interface Entitlements {
  /** The viewer's current plan id (optional, for context). */
  planId?: string;
  /** Feature key → entitlement. */
  features: Record<string, Entitlement>;
}
