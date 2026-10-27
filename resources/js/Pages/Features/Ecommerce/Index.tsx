import { Link } from "@inertiajs/react";
import { Button, StatList } from "@particle-academy/react-fancy";
import { DemoFrame } from "../shared/DemoFrame";
import { FeatureCta } from "../shared/FeatureCta";
import { FeatureHero } from "../shared/FeatureHero";
import { FeatureShell } from "../shared/FeatureShell";
import { FeatureTour } from "../shared/FeatureTour";
import { HowItFits } from "../shared/HowItFits";
import { InstallSteps } from "../shared/InstallSteps";
import { PackagesGrid } from "../shared/PackagesGrid";
import type { FeaturePageProps } from "../shared/types";
import { ReferralDemo } from "./ReferralDemo";
import { StorefrontDemo } from "./StorefrontDemo";

/**
 * /features/ecommerce: plans, gating and referrals as one storefront story.
 *
 * Both demos run the shipped packages on seeded data: fancy-catalog +
 * fancy-features in the browser for plans and gating (no Stripe client, so no
 * payment can happen), and fancy-mlm-ui over rewards that fancy-mlm's engine
 * computed (EcommerceFeatureTest re-runs it). Tour claims are sourced from
 * the package READMEs; see the test for the list.
 */
export default function EcommerceFeature({ feature, versions }: FeaturePageProps) {
    const languages = feature.languages.length;

    return (
        <FeatureShell feature={feature}>
            <div className="ecom-site">
                <FeatureHero
                    feature={feature}
                    eyebrow="Feature · Commerce"
                    languages={feature.languages}
                    actions={
                        <>
                            <Button href="#storefront" color="emerald" icon="store" className="ecom-tap">
                                Try the storefront
                            </Button>
                            <Button as={Link} href="/packages/laravel-catalog" variant="ghost" iconTrailing="arrow-right" className="ecom-tap">
                                The catalog package
                            </Button>
                        </>
                    }
                >
                    <div className="ecom-receipt" aria-label="This Feature at a glance">
                        <StatList
                            className="ecom-stats"
                            align="left"
                            items={[
                                { key: "packages", value: feature.members.length, label: "packages" },
                                { key: "languages", value: languages, label: languages === 1 ? "language" : "languages" },
                                { key: "bridges", value: feature.bridges.length, label: "MCP bridges" },
                            ]}
                        />
                    </div>
                </FeatureHero>
            </div>

            <div id="storefront" className="ecom-anchor">
                <DemoFrame
                    id="ecommerce"
                    label="Plans and feature gating"
                    status="Live · seeded, no Stripe"
                    caption="Switch plans, then spend AI credits or try a PDF export: every verdict comes from fancy-features, resolved through the plan's product features in fancy-catalog."
                >
                    <StorefrontDemo />
                </DemoFrame>
            </div>

            <DemoFrame
                id="ecommerce-referrals"
                label="Referrals: downline, statement, rank"
                status="Live · seeded"
                caption="Flip the tree between sponsor and placement, and select a member to see their rewards and rank progress."
            >
                <ReferralDemo />
            </DemoFrame>

            <FeatureTour
                title="What it does"
                intro="Three package pairs, one contract each side: the same models and semantics in PHP and in Node."
                items={[
                    {
                        icon: "package",
                        title: "Plans are products with recurring prices",
                        body: "laravel-catalog and fancy-catalog model products, prices and product features the same way, with flat, per-seat, tiered, usage and one-time pricing models. There is no separate Plan model.",
                    },
                    {
                        icon: "refresh-cw",
                        title: "Stripe sync and hosted checkout",
                        body: "Products and prices sync to Stripe, re-creating a price when it changes because Stripe prices are immutable. Checkout creates Stripe Checkout sessions for subscriptions and one-time payments.",
                    },
                    {
                        icon: "toggle-right",
                        title: "Entitlement is not quota",
                        body: "canAccess answers whether a feature is granted; canConsume answers whether the next unit fits. A spent quota stays entitled. The write that cannot be raced is tryIncrement in laravel-fms and tryConsume in fancy-features.",
                    },
                    {
                        icon: "gauge",
                        title: "Metered overage, recorded",
                        body: "A plan can allow billable overage past its included quantity, as a ceiling, and null means none. In fancy-features it is permitted only when a usage store or an onOverage listener can record it, so it fails closed. Invoicing stays with your app.",
                    },
                    {
                        icon: "link",
                        title: "Plans feed gating",
                        body: "createCatalogFeatureSource turns a subscription's product features into grants for fancy-features. The two packages share a contract and have no runtime dependency on each other.",
                    },
                    {
                        icon: "network",
                        title: "Referrals in three tree shapes",
                        body: "fancy-mlm runs unilevel, binary and matrix trees with per-level decay, tier multipliers and compression. PHP and Node load the same plan JSON and compute identical rewards; fancy-mlm-ui draws the tree, the statement and rank progress.",
                    },
                ]}
            />

            <HowItFits members={feature.members} bridges={feature.bridges} />
            <InstallSteps members={feature.members} versions={versions} />
            <PackagesGrid members={feature.members} versions={versions} />

            <FeatureCta
                title="Build the store on data you own"
                body="Start from the catalog, gate with features, and add referrals when you need them. Each package installs on its own."
                primary={{ label: "Read the catalog package", href: "/packages/laravel-catalog" }}
                secondary={{ label: "DownlineTree docs", href: "/packages/fancy-mlm-ui/downline-tree" }}
            />
        </FeatureShell>
    );
}
