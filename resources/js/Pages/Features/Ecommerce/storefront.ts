/**
 * The Ecommerce micro-site's storefront, built on the REAL headless packages:
 * `@particle-academy/fancy-catalog` authors the plans (products, recurring
 * prices, product features and their pivot rows) into its in-memory stores, and
 * `@particle-academy/fancy-features` resolves what the current plan grants
 * through `createCatalogFeatureSource` — the same wiring both READMEs show.
 *
 * Nothing here talks to Stripe. The catalog's Stripe client is a stand-in that
 * throws on any use, so a sync or a checkout from this demo fails loudly rather
 * than reaching a network. Authoring, the stores and the feature source never
 * touch it — which is the point being shown: plans and gating are data first.
 */
import { createCatalog, type Catalog, type Price, type Product } from "@particle-academy/fancy-catalog";
import { createCatalogFeatureSource } from "@particle-academy/fancy-catalog/features";
import { createFeatures, type AccessResult, type FeatureManager } from "@particle-academy/fancy-features";

export type FeatureKey = "pdf-export" | "ai-credits" | "custom-domain";

export type SeedFeature = {
    key: FeatureKey;
    name: string;
    type: "boolean" | "resource";
    description: string;
};

/** Per plan: a boolean feature is on/off; a resource feature carries its quota (null = unlimited). */
export type SeedPlan = {
    id: string;
    name: string;
    description: string;
    monthly: number;
    yearly: number;
    recommended?: boolean;
    grants: Partial<Record<FeatureKey, { enabled: boolean; included?: number | null; overage?: number | null }>>;
};

export const SEED_FEATURES: SeedFeature[] = [
    { key: "pdf-export", name: "PDF export", type: "boolean", description: "Export a document as PDF." },
    { key: "ai-credits", name: "AI credits", type: "resource", description: "Metered: one credit per AI request." },
    { key: "custom-domain", name: "Custom domain", type: "boolean", description: "Serve the workspace on your own domain." },
];

/** Amounts are integer minor units (cents), as the package stores them. */
export const SEED_PLANS: SeedPlan[] = [
    {
        id: "prod_starter",
        name: "Starter",
        description: "For one person trying things out.",
        monthly: 900,
        yearly: 9000,
        grants: {
            "pdf-export": { enabled: false },
            "ai-credits": { enabled: true, included: 5 },
            "custom-domain": { enabled: false },
        },
    },
    {
        id: "prod_team",
        name: "Team",
        description: "For a small team shipping every week.",
        monthly: 2900,
        yearly: 29000,
        recommended: true,
        grants: {
            "pdf-export": { enabled: true },
            "ai-credits": { enabled: true, included: 20, overage: 5 },
            "custom-domain": { enabled: false },
        },
    },
    {
        id: "prod_studio",
        name: "Studio",
        description: "For an agency running many sites.",
        monthly: 7900,
        yearly: 79000,
        grants: {
            "pdf-export": { enabled: true },
            "ai-credits": { enabled: true, included: null },
            "custom-domain": { enabled: true },
        },
    },
];

export type Interval = "month" | "year";

export type StorefrontPlan = {
    product: Product;
    prices: Price[];
    seed: SeedPlan;
};

export type FeatureRow = {
    feature: SeedFeature;
    /** `canAccess`: entitlement, quota-blind. */
    entitled: boolean;
    /** `explain`: the source that decided, plus limit / used / remaining for a resource. */
    explain: AccessResult;
};

export type Storefront = {
    catalog: Catalog;
    features: FeatureManager;
    plans: StorefrontPlan[];
    subject: string;
    currentPlanId: () => string;
    switchPlan: (productId: string) => void;
    rows: () => Promise<FeatureRow[]>;
    /** Overage units recorded through `onOverage`, newest last. */
    overage: () => number;
};

/**
 * A Stripe client that refuses. `createCatalog` requires one; this demo must
 * never reach Stripe, so any property read on it throws.
 */
export function refusingStripe(): Parameters<typeof createCatalog>[0]["stripe"] {
    return new Proxy(
        {},
        {
            get(_target, property) {
                // Promise resolution probes `then`; answer it rather than throw.
                if (property === "then") return undefined;
                throw new Error(`This demo has no Stripe client (tried stripe.${String(property)}).`);
            },
        },
    ) as Parameters<typeof createCatalog>[0]["stripe"];
}

export function formatPrice(price: Price): string {
    const amount = (price.unitAmount ?? 0) / 100;
    return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: price.currency,
        maximumFractionDigits: amount % 1 === 0 ? 0 : 2,
    }).format(amount);
}

export function priceFor(plan: StorefrontPlan, interval: Interval): Price | undefined {
    return plan.prices.find((price) => price.recurringInterval === interval && price.active);
}

/**
 * Author the seed plans into a fresh catalog and wire a feature manager to it.
 * Every call is independent: a fresh catalog, fresh usage, fresh plan.
 */
export async function buildStorefront(initialPlanId = "prod_team"): Promise<Storefront> {
    const catalog = createCatalog({ stripe: refusingStripe() });

    const featureIds = new Map<FeatureKey, string>();
    for (const feature of SEED_FEATURES) {
        const created = await catalog.createProductFeature({
            key: feature.key,
            name: feature.name,
            description: feature.description,
            type: feature.type,
        });
        featureIds.set(feature.key, created.id);
    }

    const plans: StorefrontPlan[] = [];
    for (const [index, seed] of SEED_PLANS.entries()) {
        const product = await catalog.createProduct({
            id: seed.id,
            name: seed.name,
            description: seed.description,
            order: index,
            lookupKey: seed.id.replace(/^prod_/, ""),
        });
        for (const [interval, amount] of [["month", seed.monthly], ["year", seed.yearly]] as const) {
            await catalog.createPrice({
                productId: product.id,
                currency: "USD",
                unitAmount: amount,
                type: "recurring",
                pricingModel: "flat_recurring",
                recurringInterval: interval,
                nickname: `${seed.name} (${interval}ly)`,
            });
        }
        for (const [key, grant] of Object.entries(seed.grants) as [FeatureKey, NonNullable<SeedPlan["grants"][FeatureKey]>][]) {
            await catalog.attachFeature({
                productId: product.id,
                productFeatureId: featureIds.get(key)!,
                enabled: grant.enabled,
                includedQuantity: grant.included ?? null,
                overageLimit: grant.overage ?? null,
            });
        }
        plans.push({ product, prices: await catalog.prices.forProduct(product.id), seed });
    }

    let planId = initialPlanId;
    let overageUnits = 0;
    const subject = "demo-customer";

    const features = createFeatures({
        sources: [
            createCatalogFeatureSource(catalog, {
                resolveSubscription: () => ({ id: "sub_demo", productId: planId, status: "active" }),
            }),
        ],
    });
    features.onOverage(({ units }) => {
        overageUnits += units;
    });

    return {
        catalog,
        features,
        plans,
        subject,
        currentPlanId: () => planId,
        switchPlan: (productId) => {
            if (!plans.some((plan) => plan.product.id === productId)) {
                throw new Error(`No plan ${productId} in this catalog.`);
            }
            planId = productId;
        },
        rows: async () =>
            Promise.all(
                SEED_FEATURES.map(async (feature) => ({
                    feature,
                    entitled: await features.canAccess(feature.key, subject),
                    explain: await features.explain(feature.key, subject),
                })),
            ),
        overage: () => overageUnits,
    };
}
