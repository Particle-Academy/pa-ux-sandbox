import { useState } from "react";
import { Badge, Button, Callout, Heading, Icon, MultiSwitch, Switch, Table, Text } from "@particle-academy/react-fancy";
import {
    ConsentBanner,
    ConsentGate,
    ConsentPreferences,
    ConsentPreferencesTrigger,
    ConsentProvider,
    type ConsentBannerVariant,
} from "@particle-academy/fancy-compliance-ui";
import { decide, initialConsentState, publishNewPolicy, withdraw, type ConsentDemoState } from "./ledger";

type Theme = "kit" | "stone" | "teal";

const VARIANTS: { value: ConsentBannerVariant; label: string }[] = [
    { value: "bar", label: "Bar" },
    { value: "card", label: "Card" },
    { value: "corner", label: "Corner" },
];

const THEMES: { value: Theme; label: string }[] = [
    { value: "kit", label: "Kit default" },
    { value: "stone", label: "Stone" },
    { value: "teal", label: "Teal" },
];

/**
 * The real ConsentBanner, ConsentPreferences, ConsentPreferencesTrigger and
 * ConsentGate, run by a ConsentProvider over this demo's own state. The banner
 * is pinned in place with a className; in an app it is fixed to the viewport,
 * as this site's own banner is. Decisions stay in the demo: nothing is posted.
 *
 * The variant, theme and direction controls are this page's, not the
 * package's: they only change the props and tokens the components are given.
 */
export function ConsentDemo() {
    const [state, setState] = useState<ConsentDemoState>(initialConsentState);
    const [variant, setVariant] = useState<ConsentBannerVariant>("card");
    const [theme, setTheme] = useState<Theme>("kit");
    const [rtl, setRtl] = useState(false);
    const now = () => new Date().toISOString();
    const pinned = "static! z-auto! shadow-none! max-w-none! sm:max-w-[28rem]!";

    return (
        <div className="cmp-consent" data-cmp-demo="consent">
            <div className="cmp-controls" role="group" aria-label="Demo controls">
                <MultiSwitch label="Banner variant" list={VARIANTS} value={variant} onValueChange={(v) => setVariant(v as ConsentBannerVariant)} />
                <MultiSwitch label="Theme tokens" list={THEMES} value={theme} onValueChange={(v) => setTheme(v as Theme)} />
                <Switch label="Right to left" checked={rtl} onCheckedChange={setRtl} />
            </div>

            <ConsentProvider
                value={state.snapshot}
                dir={rtl ? "rtl" : "ltr"}
                onDecide={(d) => setState((s) => decide(s, d.granted, d.source, now()))}
                onWithdraw={(w) => setState((s) => withdraw(s, w.categories, w.source, now()))}
            >
                <div className={`cmp-stage cmp-theme cmp-theme--${theme}`} data-cmp-theme={theme}>
                    {variant === "bar" ? (
                        <ConsentBanner variant="bar" className={pinned} />
                    ) : (
                        <ConsentBanner variant={variant} className={pinned} />
                    )}
                    {!state.snapshot.needsConsent && (
                        <Text as="p" size="sm" color="muted" className="cmp-stage__empty">
                            The banner has gone: a decision under the current policy is on record.
                        </Text>
                    )}
                </div>

                <div className="cmp-after">
                    <div className="cmp-after__actions">
                        <ConsentPreferencesTrigger>Change your choices</ConsentPreferencesTrigger>
                        <Button variant="ghost" icon="file-pen-line" onClick={() => setState(publishNewPolicy)}>
                            Publish a new policy version
                        </Button>
                        <Button variant="ghost" icon="rotate-ccw" onClick={() => setState(initialConsentState())}>
                            Reset the demo
                        </Button>
                    </div>

                    <ConsentGate
                        category="analytics"
                        fallback={
                            <Callout color="zinc" icon={<Icon name="lock" size="sm" />}>
                                Analytics is not allowed, so the gated widget is not mounted.
                            </Callout>
                        }
                    >
                        <Callout color="teal" icon={<Icon name="chart-line" size="sm" />}>
                            Analytics allowed: the gated widget is mounted. Withdraw it and it unmounts.
                        </Callout>
                    </ConsentGate>
                </div>

                <ConsentPreferences />
            </ConsentProvider>

            <div className="cmp-ledger">
                <div className="cmp-ledger__head">
                    <Heading as="h3" size="sm" weight="semibold">
                        The consent record
                    </Heading>
                    <Badge variant="outline">policy {state.snapshot.policyVersion}</Badge>
                </div>
                <Text as="p" size="sm" color="muted">
                    The rows fancy-compliance appends for the decisions above, one per decision or withdrawal, never edited. No IP
                    address and no user agent. Shown from this demo's own state; nothing is posted.
                </Text>
                {state.ledger.length === 0 ? (
                    <Text as="p" size="sm" className="cmp-ledger__none" data-cmp-ledger-rows="0">
                        No rows yet: nothing is recorded until the person decides.
                    </Text>
                ) : (
                    <div className="cmp-ledger__table" data-cmp-ledger-rows={state.ledger.length}>
                        <Table>
                            <Table.Head>
                                <Table.Row>
                                    <Table.Column label="#" />
                                    <Table.Column label="action" />
                                    <Table.Column label="granted" />
                                    <Table.Column label="refused" />
                                    <Table.Column label="policy_version" />
                                    <Table.Column label="source" />
                                </Table.Row>
                            </Table.Head>
                            <Table.Body>
                                {state.ledger.map((row) => (
                                    <Table.Row key={row.n}>
                                        <Table.Cell>{row.n}</Table.Cell>
                                        <Table.Cell>{row.action}</Table.Cell>
                                        <Table.Cell>{row.granted.join(", ")}</Table.Cell>
                                        <Table.Cell>{row.refused.join(", ") || "nothing"}</Table.Cell>
                                        <Table.Cell>{row.policyVersion}</Table.Cell>
                                        <Table.Cell>{row.source}</Table.Cell>
                                    </Table.Row>
                                ))}
                            </Table.Body>
                        </Table>
                    </div>
                )}
            </div>
        </div>
    );
}
