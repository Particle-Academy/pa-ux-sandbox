/**
 * Catalog + FMS UI block — framework-agnostic React components for a
 * Stripe-style catalog (laravel-catalog) with feature management (laravel-fms).
 *
 * Pair these with the example Inertia pages + controllers shipped in this block,
 * or wire them to any backend that normalizes data into the shapes in ./types.
 */
export { PricingTable } from "./PricingTable";
export type { PricingTableProps } from "./PricingTable";

export { FeatureMatrix } from "./FeatureMatrix";
export type { FeatureMatrixProps } from "./FeatureMatrix";

export { FeatureGate, gateStatus } from "./FeatureGate";
export type { FeatureGateProps, FeatureGateMode, LockedReason } from "./FeatureGate";

export { PlanFeaturesEditor } from "./PlanFeaturesEditor";
export type { PlanFeaturesEditorProps } from "./PlanFeaturesEditor";

export {
  formatMoney,
  intervalSuffix,
  priceForInterval,
  intervalsFromPlans,
} from "./format";

export type {
  BillingInterval,
  PlanPrice,
  PlanFeatureValue,
  Plan,
  FeatureDef,
  Entitlement,
  Entitlements,
} from "./types";
