import { useState } from "react";
import { DemoSection } from "../components/DemoSection";
import {
  PricingTable,
  FeatureMatrix,
  FeatureGate,
  PlanFeaturesEditor,
} from "../../blocks/catalog-fms";
import type {
  Plan,
  FeatureDef,
  Entitlements,
  PlanFeatureValue,
} from "../../blocks/catalog-fms";

// --- Mock catalog + FMS data (a backend would hydrate these via the glue) ---

const FEATURES: FeatureDef[] = [
  { key: "projects", name: "Projects", type: "resource", group: "Limits", unit: "projects" },
  { key: "seats", name: "Team seats", type: "resource", group: "Limits", unit: "seats" },
  { key: "storage", name: "Storage", type: "resource", group: "Limits", unit: "GB" },
  { key: "sso", name: "SSO / SAML", type: "boolean", group: "Security" },
  { key: "audit-log", name: "Audit log", type: "boolean", group: "Security" },
  { key: "priority-support", name: "Priority support", type: "boolean", group: "Support" },
];

const PLANS: Plan[] = [
  {
    id: "free",
    name: "Free",
    description: "For trying things out.",
    current: true,
    prices: [
      { id: "free-m", amount: 0, currency: "usd", interval: "month" },
      { id: "free-y", amount: 0, currency: "usd", interval: "year" },
    ],
    highlights: ["1 project", "1 seat", "1 GB storage"],
    features: {
      projects: { type: "resource", enabled: true, limit: 1 },
      seats: { type: "resource", enabled: true, limit: 1 },
      storage: { type: "resource", enabled: true, limit: 1 },
    },
  },
  {
    id: "pro",
    name: "Pro",
    description: "For growing teams.",
    recommended: true,
    badge: "Most popular",
    prices: [
      { id: "pro-m", amount: 2900, currency: "usd", interval: "month" },
      { id: "pro-y", amount: 29000, currency: "usd", interval: "year" },
    ],
    highlights: ["10 projects", "10 seats", "100 GB storage", "Audit log"],
    features: {
      projects: { type: "resource", enabled: true, limit: 10 },
      seats: { type: "resource", enabled: true, limit: 10 },
      storage: { type: "resource", enabled: true, limit: 100 },
      "audit-log": { type: "boolean", enabled: true },
      "priority-support": { type: "boolean", enabled: true },
    },
  },
  {
    id: "team",
    name: "Team",
    description: "For scaling orgs.",
    prices: [
      { id: "team-m", amount: 9900, currency: "usd", interval: "month" },
      { id: "team-y", amount: 99000, currency: "usd", interval: "year" },
    ],
    highlights: ["Unlimited projects", "Unlimited seats", "1 TB storage", "SSO"],
    features: {
      projects: { type: "resource", enabled: true, limit: null },
      seats: { type: "resource", enabled: true, limit: null },
      storage: { type: "resource", enabled: true, limit: 1000 },
      sso: { type: "boolean", enabled: true },
      "audit-log": { type: "boolean", enabled: true },
      "priority-support": { type: "boolean", enabled: true },
    },
  },
];

// Viewer is on Free: audit-log locked, projects quota exhausted (1/1).
const ENTITLEMENTS: Entitlements = {
  planId: "free",
  features: {
    projects: { access: true, limit: 1, used: 1 },
    seats: { access: true, limit: 1, used: 1 },
    storage: { access: true, limit: 1, used: 0 },
    "audit-log": { access: false },
    sso: { access: false },
    "priority-support": { access: false },
  },
};

export function CatalogFmsDemo() {
  const [interval, setInterval] = useState<"month" | "year">("month");
  const [editorValue, setEditorValue] = useState<Record<string, PlanFeatureValue>>(
    PLANS[1].features ?? {},
  );

  return (
    <div>
      <h1 className="mb-2 text-2xl font-bold">Catalog + FMS</h1>
      <p className="mb-6 max-w-2xl text-sm text-zinc-500">
        A grab-and-customize storefront + admin built on <code>laravel-catalog</code> (Stripe
        products/prices) and <code>laravel-fms</code> (feature gating). These components are
        framework-agnostic — feed them normalized JSON; the block ships example Inertia glue.
      </p>

      <DemoSection
        title="PricingTable"
        description="Plan cards with a controlled billing-interval toggle. onSelectPlan starts checkout."
      >
        <PricingTable
          plans={PLANS}
          interval={interval}
          onIntervalChange={(i) => setInterval(i as "month" | "year")}
          intervalLabel={(i) => (i === "year" ? "Yearly (save 17%)" : "Monthly")}
          onSelectPlan={(id) => alert(`checkout: ${id} (${interval})`)}
        />
      </DemoSection>

      <DemoSection
        title="FeatureMatrix"
        description="Plan × feature comparison, grouped. Boolean → check; resource → limit / Unlimited."
        flush
      >
        <FeatureMatrix plans={PLANS} features={FEATURES} groupOrder={["Limits", "Security", "Support"]} />
      </DemoSection>

      <DemoSection
        title="FeatureGate"
        description="Gates content behind an FMS entitlement. Viewer is on Free: audit-log is locked; projects quota is exhausted (1/1)."
      >
        <div className="grid gap-4 sm:grid-cols-3">
          <FeatureGate feature="audit-log" featureName="Audit log" entitlements={ENTITLEMENTS} onUpgrade={() => alert("upgrade")}>
            <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-sm dark:border-green-900 dark:bg-green-950/40">
              Audit log content (unlocked)
            </div>
          </FeatureGate>

          <FeatureGate feature="projects" featureName="Projects" entitlements={ENTITLEMENTS} onUpgrade={() => alert("upgrade")}>
            <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-sm">New project form</div>
          </FeatureGate>

          <FeatureGate feature="storage" featureName="Storage" entitlements={ENTITLEMENTS} mode="blur">
            <div className="rounded-lg border border-zinc-200 p-4 text-sm dark:border-zinc-700">
              Storage browser (you have quota → this shows)
            </div>
          </FeatureGate>
        </div>
      </DemoSection>

      <DemoSection
        title="PlanFeaturesEditor (admin)"
        description="Attach features to a plan + set per-plan limits (blank = unlimited). Controlled; persist to the product_feature_configs pivot."
      >
        <PlanFeaturesEditor features={FEATURES} value={editorValue} onChange={setEditorValue} />
        <pre className="mt-3 overflow-x-auto rounded-lg bg-zinc-900 p-3 text-xs text-zinc-300">
          {JSON.stringify(editorValue, null, 2)}
        </pre>
      </DemoSection>
    </div>
  );
}
