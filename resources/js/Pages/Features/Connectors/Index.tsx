import { Link } from "@inertiajs/react";
import { Badge, Button, Card, CodeBlock, Grid, Heading, Icon, Input, Select, Text } from "@particle-academy/react-fancy";
import { useMemo, useState } from "react";
import { FeatureCta } from "../shared/FeatureCta";
import { FeatureHero } from "../shared/FeatureHero";
import { FeatureShell } from "../shared/FeatureShell";
import { FeatureTour } from "../shared/FeatureTour";
import { HowItFits } from "../shared/HowItFits";
import { InstallSteps } from "../shared/InstallSteps";
import { PackagesGrid } from "../shared/PackagesGrid";
import type { FeaturePageProps } from "../shared/types";
import type { ConnectorCard } from "./types";

/**
 * /features/connectors: what a connector is, and every one the catalogue
 * serves, each with a "Set up" button into its wizard.
 *
 * The grid and every count on this page come from the `connectors` prop, which
 * is `ConnectorCatalogue` reading the served index (`/r/connectors/index.json`),
 * so nothing here can list a connector or an operation the catalogue does not.
 *
 * The prose claims are sourced from what is published, not from the plan:
 *   - four packages from one definition, one version: every connector's
 *     CHANGELOG header and README (twilio 0.1.0, google-sheets 0.7.0);
 *   - the Laravel layer and `<Service>::fake()`: google-sheets 0.5.0's
 *     changelog, "the Laravel layer every connector has" in twilio 0.1.0's;
 *   - the shared Google grant: google-sheets 0.6.0's changelog, and
 *     `oauth.grant: "google"` in all ten Google connectors' published
 *     manifests (checked 2026-11-08);
 *   - delivery verification: each trigger's `verification` in the index, and
 *     fancy-connector-core 0.13.0's `verifyDelivery` schemes.
 * ConnectorsFeatureTest pins the ones a refactor could quietly break.
 */
export default function ConnectorsFeature({ feature, versions, connectors = [] }: FeaturePageProps & { connectors?: ConnectorCard[] }) {
    const operations = connectors.reduce((n, c) => n + c.operations.length, 0);
    const triggers = connectors.flatMap((c) => c.operations.filter((o) => o.role === "trigger"));
    const verified = triggers.filter((o) => o.verification !== null).length;

    return (
        <FeatureShell feature={feature}>
            <div className="con-site">
                <FeatureHero
                    feature={feature}
                    eyebrow="Feature · Third-party services"
                    lede={`${connectors.length} services, ${operations} operations. Each connector is one definition, shipped as a PHP package with Laravel integration, a Node package, a React package and a Python package, and every operation is also a fancy-flow node.`}
                    languages={["PHP", "Node / TypeScript", "React", "Python"]}
                    actions={
                        <>
                            <Button href="#catalogue" color="fuchsia" icon="plug" className="con-tap">
                                Browse the connectors
                            </Button>
                            <Button as={Link} href="/packages/fancy-connector-core" variant="ghost" iconTrailing="arrow-right" className="con-tap">
                                The connector runtime
                            </Button>
                        </>
                    }
                />
            </div>

            <section id="what" className="feature-section">
                <Heading as="h2" size="lg" weight="semibold" className="feature-display">
                    One connector, every runtime
                </Heading>
                <Text as="p" color="muted" className="feature-section__intro">
                    A connector is one third-party service, such as Stripe, Gmail or Twilio, defined once and generated into four
                    packages that share one version. They are installed, not vendored: a copied file cannot be upgraded, and
                    third-party APIs change. None of them uses the provider's SDK; they speak plain HTTP on top of
                    fancy-connector-core.
                </Text>
                <Grid cols={4} gap="md" className="con-faces" data-connector-faces="">
                    {FACES.map((face) => (
                        <Card key={face.key} variant="outlined" className="con-face" data-face={face.key}>
                            <Card.Body>
                                <span className="con-face__icon" aria-hidden>
                                    <Icon name={face.icon} size="sm" />
                                </span>
                                <Heading as="h3" size="sm" weight="semibold">
                                    {face.title}
                                </Heading>
                                <Text as="p" size="sm" color="muted">
                                    {face.body}
                                </Text>
                                <code className="feature-code con-face__pkg">{face.pkg}</code>
                            </Card.Body>
                        </Card>
                    ))}
                </Grid>
            </section>

            <FeatureTour
                title="What every connector gives you"
                intro="The same capabilities in every runtime, because each package is generated from the same definition."
                items={[
                    {
                        icon: "shield-check",
                        title: "Verified webhooks",
                        body: `A trigger declares how its deliveries are checked: an HMAC signature over the raw body, or a token shared with the provider. fancy-connector-core verifies it before your code runs. ${verified} of the ${triggers.length} triggers in the catalogue declare a check; the rest are polled, so there is no delivery to forge.`,
                    },
                    {
                        icon: "flask-conical",
                        title: "<Service>::fake() for tests",
                        body: "In Laravel, Stripe::fake() answers every call from the connector's own faker and records it, so a test sends nothing. Then assertSent, assertNotSent, assertNothingSent and assertSentCount. Every operation ships that faker in every runtime, as a node's fake mode.",
                    },
                    {
                        icon: "building-2",
                        title: "One Google connection for the organization",
                        body: "Every Google connector declares the same grant: one OAuth client, one consent and one refresh token per person, with each feature's scopes asked for when it is first used. Revoking removes the whole Google grant, and the account is identified by the id_token's sub, never by email.",
                    },
                    {
                        icon: "boxes",
                        title: "Laravel integration in the PHP package",
                        body: "An auto-discovered service provider, config under connectors.<slug> with credentials from the environment or per call, and a facade: GoogleSheets::call('append', [...]) runs any operation. Laravel is suggested, never required.",
                    },
                    {
                        icon: "workflow",
                        title: "Every operation is a fancy-flow node",
                        body: "Each action, search and trigger has a node kind, such as @particle-academy/stripe_payment_intent, and each runtime package carries what runs it. The React package is the node's editor surface on every host.",
                    },
                    {
                        icon: "list-checks",
                        title: "A setup wizard per connector",
                        body: "Set up opens one step at a time: who does it, what to open, what to copy for your app, and how you know it worked. A step for your agent is one prompt with a Copy button.",
                    },
                ]}
            />

            <section id="catalogue" className="feature-section con-anchor">
                <Heading as="h2" size="lg" weight="semibold" className="feature-display">
                    Every connector
                </Heading>
                <Text as="p" color="muted" className="feature-section__intro">
                    The catalogue this site serves at <code className="feature-code">/r/connectors/index.json</code>, which the
                    fancy-ui MCP's list_connector_services reads too. Every package version below was checked against its
                    registry when the index was built.
                </Text>
                <ConnectorGrid connectors={connectors} />
            </section>

            <section id="install" className="feature-section">
                <Heading as="h2" size="lg" weight="semibold" className="feature-display">
                    Install one
                </Heading>
                <Text as="p" color="muted" className="feature-section__intro">
                    A PHP or Python app installs the React package for the editor and its own runtime package; it never needs
                    the Node one.
                </Text>
                <CodeBlock language="bash" code={"composer require particle-academy/stripe-php\nnpm install @particle-academy/stripe-ui"} />
            </section>

            <HowItFits
                members={feature.members}
                bridges={feature.bridges}
                intro="fancy-connector-core is the runtime every connector is built on: typed delivery, failure classification, retries, delivery verification and the choice between fake, sandbox and live. fancy-flow runs the nodes."
            />
            <InstallSteps members={feature.members} versions={versions} />
            <PackagesGrid members={feature.members} versions={versions} />

            <FeatureCta
                title="Connect a service"
                body="Pick a connector, open its setup, and follow it one step at a time. Then put its operations in a workflow."
                primary={{ label: "Browse the connectors", href: "#catalogue" }}
                secondary={{ label: "Flow", href: "/features/flow" }}
            />
        </FeatureShell>
    );
}

const FACES = [
    {
        key: "php",
        icon: "server",
        title: "PHP, with Laravel",
        body: "The operations for PHP 8.4+, plus a service provider, a facade and <Service>::fake() when Laravel is present.",
        pkg: "particle-academy/<slug>-php",
    },
    {
        key: "js",
        icon: "braces",
        title: "Node",
        body: "The same operations for a Node or TypeScript backend.",
        pkg: "@particle-academy/<slug>-js",
    },
    {
        key: "ui",
        icon: "layout-panel-left",
        title: "React",
        body: "The editor surface for the connector's flow nodes, on every host.",
        pkg: "@particle-academy/<slug>-ui",
    },
    {
        key: "py",
        icon: "code",
        title: "Python",
        body: "The operations for Python 3.11+, with no runtime dependencies.",
        pkg: "fancy-<slug>",
    },
];

const ROLE_LABEL: Record<string, string> = { trigger: "trigger", action: "action", search: "search" };

/**
 * The browsable grid: a text filter and a domain filter over every connector,
 * each card ending in its "Set up" button.
 */
export function ConnectorGrid({ connectors }: { connectors: ConnectorCard[] }) {
    const [query, setQuery] = useState("");
    const [domain, setDomain] = useState("all");

    const domains = useMemo(() => [...new Set(connectors.map((c) => c.domain))].sort(), [connectors]);
    const q = query.trim().toLowerCase();
    const shown = connectors.filter(
        (c) =>
            (domain === "all" || c.domain === domain) &&
            (q === "" || c.title.toLowerCase().includes(q) || c.slug.includes(q) || c.operations.some((o) => o.title.toLowerCase().includes(q))),
    );

    return (
        <div className="con-catalogue">
            <div className="con-filters">
                <Input
                    type="search"
                    label="Find a connector"
                    placeholder="Stripe, calendar, send email"
                    value={query}
                    onValueChange={setQuery}
                    leading={<Icon name="search" size="sm" />}
                    data-co-handle="connectors-search"
                />
                <Select
                    label="Domain"
                    value={domain}
                    onValueChange={setDomain}
                    list={[{ value: "all", label: "All domains" }, ...domains.map((d) => ({ value: d, label: d }))]}
                    data-co-handle="connectors-domain"
                />
            </div>
            <Text as="p" size="sm" color="muted" aria-live="polite" data-connector-count="">
                {shown.length === connectors.length ? `${connectors.length} connectors` : `${shown.length} of ${connectors.length} connectors`}
            </Text>
            <Grid cols={3} gap="md" className="con-grid" data-connector-grid="">
                {shown.map((c) => {
                    const counts = c.operations.reduce<Record<string, number>>((acc, o) => ({ ...acc, [o.role]: (acc[o.role] ?? 0) + 1 }), {});
                    const version = Object.values(c.packages)[0]?.version;
                    return (
                        <Card key={c.slug} variant="outlined" className="con-card" data-connector={c.slug}>
                            <Card.Body>
                                <div className="con-card__head">
                                    <Heading as="h3" size="sm" weight="semibold">
                                        {c.title}
                                    </Heading>
                                    {c.status && (
                                        <Badge size="sm" variant="soft" color="amber">
                                            {c.status}
                                        </Badge>
                                    )}
                                </div>
                                <Text as="p" size="sm" color="muted" className="con-card__meta">
                                    {c.domain}
                                    {version ? ` · v${version}` : ""}
                                </Text>
                                <div className="con-card__badges">
                                    {Object.entries(counts).map(([role, n]) => (
                                        <Badge key={role} size="sm" variant="outline">
                                            {n} {ROLE_LABEL[role] ?? role}
                                            {n === 1 ? "" : role === "search" ? "es" : "s"}
                                        </Badge>
                                    ))}
                                    {c.auth.grant && (
                                        <Badge size="sm" variant="soft" color="sky">
                                            {c.auth.grant} grant
                                        </Badge>
                                    )}
                                    {c.needsWebhookEndpoint && (
                                        <Badge size="sm" variant="soft" color="fuchsia">
                                            webhook endpoint
                                        </Badge>
                                    )}
                                </div>
                                <Text as="p" size="sm" className="con-card__ops">
                                    {c.operations.map((o) => o.title).join(", ")}
                                </Text>
                                <div className="con-card__actions">
                                    <Button as={Link} href={c.setupHref} size="sm" color="fuchsia" icon="list-checks" data-co-handle={`connector-setup-${c.slug}`}>
                                        Set up
                                    </Button>
                                    {c.setup === null && (
                                        <Text as="span" size="xs" color="muted">
                                            Guide coming soon
                                        </Text>
                                    )}
                                </div>
                            </Card.Body>
                        </Card>
                    );
                })}
            </Grid>
        </div>
    );
}
