import { useCallback, useEffect, useState } from "react";
import { Badge, Button, Callout, Card, Grid, Heading, Icon, Table, Text } from "@particle-academy/react-fancy";
import {
    buildStorefront,
    formatPrice,
    priceFor,
    SEED_FEATURES,
    type FeatureRow,
    type Interval,
    type Storefront,
} from "./storefront";

/**
 * "used / included" for a metered row. The included quantity is read from the
 * plan's own pivot row rather than explain().limit: in fancy-features 0.5.0
 * explain() reports the limit as the amount used once a subject is in overage.
 */
function usageLabel(used: number, grant: { included?: number | null; overage?: number | null } | undefined): string {
    const included = grant?.included;
    if (included === null || included === undefined) return `${used} / unlimited`;
    const over = Math.max(0, used - included);
    return over > 0 ? `${used} / ${included} (+${over} overage)` : `${used} / ${included}`;
}

type LogEntry = { id: number; tone: "ok" | "denied" | "info"; text: string };

/**
 * Plans and feature gating, live. The plans are authored into a real
 * fancy-catalog instance in the browser; every gate below is a real
 * fancy-features call resolved through the catalog feature source.
 */
export function StorefrontDemo() {
    const [store, setStore] = useState<Storefront | null>(null);
    const [billing, setBilling] = useState<Interval>("month");
    const [planId, setPlanId] = useState("prod_team");
    const [rows, setRows] = useState<FeatureRow[]>([]);
    const [log, setLog] = useState<LogEntry[]>([]);

    const fresh = useCallback(async (initialPlan: string) => {
        const next = await buildStorefront(initialPlan);
        setStore(next);
        setRows(await next.rows());
    }, []);

    useEffect(() => {
        void fresh("prod_team");
    }, [fresh]);

    const note = (tone: LogEntry["tone"], text: string) =>
        setLog((entries) => [{ id: Date.now() + Math.random(), tone, text }, ...entries].slice(0, 5));

    const refresh = async (current: Storefront) => setRows(await current.rows());

    if (!store) {
        return (
            <Text as="p" color="muted" data-ecom-loading="">
                Building the catalog…
            </Text>
        );
    }

    const plan = store.plans.find((p) => p.product.id === planId)!;

    const choose = async (productId: string) => {
        store.switchPlan(productId);
        setPlanId(productId);
        const name = store.plans.find((p) => p.product.id === productId)?.product.name;
        note("info", `Plan switched to ${name}. Usage so far carries over.`);
        await refresh(store);
    };

    const exportPdf = async () => {
        const allowed = await store.features.canAccess("pdf-export", store.subject);
        note(allowed ? "ok" : "denied", allowed ? "canAccess(\"pdf-export\") → true: the export runs." : "canAccess(\"pdf-export\") → false: this plan does not include PDF export.");
    };

    const spend = async (amount: number) => {
        const before = store.overage();
        const taken = await store.features.tryConsume("ai-credits", store.subject, amount);
        const overage = store.overage() - before;
        if (!taken) {
            note("denied", `tryConsume("ai-credits", ${amount}) → false: that would pass this plan's ceiling.`);
        } else if (overage > 0) {
            note("ok", `tryConsume("ai-credits", ${amount}) → true, ${overage} of it recorded as overage.`);
        } else {
            note("ok", `tryConsume("ai-credits", ${amount}) → true.`);
        }
        await refresh(store);
    };

    const reset = async () => {
        setLog([]);
        setPlanId(planId);
        await fresh(planId);
    };

    return (
        <div className="ecom-store" data-ecom-store="">
            <div className="ecom-store__bar">
                <Heading as="h2" size="md" weight="semibold" className="feature-display">
                    Plans
                </Heading>
                <div className="ecom-toggle" role="group" aria-label="Billing interval">
                    {(["month", "year"] as const).map((value) => (
                        <Button
                            key={value}
                            color={billing === value ? "emerald" : undefined}
                            className="ecom-tap"
                            active={billing === value}
                            aria-pressed={billing === value}
                            onClick={() => setBilling(value)}
                        >
                            {value === "month" ? "Monthly" : "Yearly"}
                        </Button>
                    ))}
                </div>
            </div>

            <Grid cols={3} gap="md">
                {store.plans.map((option) => {
                    const price = priceFor(option, billing);
                    const current = option.product.id === planId;
                    return (
                        <Card
                            key={option.product.id}
                            variant="outlined"
                            className="ecom-plan"
                            data-ecom-plan={option.product.lookupKey ?? option.product.id}
                            data-current={current ? "" : undefined}
                        >
                            <Card.Body>
                                <div className="ecom-plan__head">
                                    <Heading as="h3" size="sm" weight="semibold">
                                        {option.product.name}
                                    </Heading>
                                    {option.seed.recommended && (
                                        <Badge color="emerald" variant="soft">
                                            Recommended
                                        </Badge>
                                    )}
                                </div>
                                <p className="ecom-plan__price">
                                    <span className="ecom-plan__amount">{price ? formatPrice(price) : "n/a"}</span>
                                    <span className="ecom-plan__per">/ {billing}</span>
                                </p>
                                <Text as="p" size="sm" color="muted">
                                    {option.product.description}
                                </Text>
                                <ul className="ecom-plan__grants">
                                    {SEED_FEATURES.map((feature) => {
                                        const grant = option.seed.grants[feature.key];
                                        const on = grant?.enabled ?? false;
                                        let detail = feature.name;
                                        if (feature.type === "resource" && on) {
                                            detail = grant?.included === null || grant?.included === undefined
                                                ? `Unlimited ${feature.name}`
                                                : `${grant.included} ${feature.name}${grant.overage ? `, +${grant.overage} overage` : ""}`;
                                        }
                                        return (
                                            <li key={feature.key} data-on={on ? "" : undefined}>
                                                <Icon name={on ? "check" : "minus"} size="sm" />
                                                <span>{detail}</span>
                                            </li>
                                        );
                                    })}
                                </ul>
                                <Button
                                    className="ecom-tap ecom-plan__choose"
                                    color={current ? undefined : "emerald"}
                                    variant={current ? "ghost" : "default"}
                                    disabled={current}
                                    onClick={() => void choose(option.product.id)}
                                >
                                    {current ? "Your demo plan" : `Switch demo to ${option.product.name}`}
                                </Button>
                            </Card.Body>
                        </Card>
                    );
                })}
            </Grid>

            <Callout color="zinc" icon={<Icon name="shield-check" size="sm" />} className="ecom-note">
                No payment happens here. This catalog lives in your browser, in fancy-catalog's in-memory stores, and its
                Stripe client refuses every call. In your app, the same prices sync to Stripe and checkout returns a hosted
                Stripe Checkout URL.
            </Callout>

            <div className="ecom-account" data-ecom-account="">
                <div className="ecom-store__bar">
                    <Heading as="h2" size="md" weight="semibold" className="feature-display">
                        What the {plan.product.name} plan unlocks
                    </Heading>
                    <Badge color="emerald" variant="soft">
                        subject: {store.subject}
                    </Badge>
                </div>

                <div className="ecom-table">
                    <Table>
                        <Table.Head>
                            <Table.Column label="Feature" />
                            <Table.Column label="canAccess" />
                            <Table.Column label="Used / included" />
                            <Table.Column label="Decided by" />
                        </Table.Head>
                        <Table.Body>
                            {rows.map(({ feature, entitled, explain }) => (
                                <Table.Row key={feature.key} data-ecom-feature={feature.key}>
                                    <Table.Cell>
                                        <span className="ecom-feature-name">{feature.name}</span>
                                    </Table.Cell>
                                    <Table.Cell>
                                        <Badge color={entitled ? "emerald" : "zinc"} variant="soft">
                                            {entitled ? "allowed" : "denied"}
                                        </Badge>
                                    </Table.Cell>
                                    <Table.Cell className="ecom-num">
                                        {feature.type === "boolean"
                                            ? "on / off"
                                            : usageLabel(explain.used ?? 0, plan.seed.grants[feature.key])}
                                    </Table.Cell>
                                    <Table.Cell>
                                        <code className="ecom-source">{explain.source}</code>
                                    </Table.Cell>
                                </Table.Row>
                            ))}
                        </Table.Body>
                    </Table>
                </div>

                <div className="ecom-actions">
                    <Button className="ecom-tap" icon="file-down" onClick={() => void exportPdf()}>
                        Export a PDF
                    </Button>
                    <Button className="ecom-tap" icon="sparkles" color="emerald" onClick={() => void spend(1)}>
                        Spend 1 AI credit
                    </Button>
                    <Button className="ecom-tap" icon="sparkles" onClick={() => void spend(5)}>
                        Spend 5
                    </Button>
                    <Button className="ecom-tap" icon="rotate-ccw" variant="ghost" onClick={() => void reset()}>
                        Reset usage
                    </Button>
                </div>

                <ol className="ecom-log" role="log" aria-live="polite" aria-label="Gate decisions">
                    {log.length === 0 ? (
                        <li className="ecom-log__empty">Try a button: each one is a real fancy-features call.</li>
                    ) : (
                        log.map((entry) => (
                            <li key={entry.id} data-tone={entry.tone}>
                                <Icon name={entry.tone === "denied" ? "circle-x" : entry.tone === "ok" ? "circle-check" : "info"} size="sm" />
                                <span>{entry.text}</span>
                            </li>
                        ))
                    )}
                </ol>
                {store.overage() > 0 && (
                    <Text as="p" size="sm" color="muted" data-ecom-overage={store.overage()}>
                        Overage recorded this session: {store.overage()} credit{store.overage() === 1 ? "" : "s"}. Recording is
                        the package's job; billing it is your app's.
                    </Text>
                )}
            </div>
        </div>
    );
}
