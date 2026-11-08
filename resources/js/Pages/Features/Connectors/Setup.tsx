import { Link } from "@inertiajs/react";
import { Badge, Button, Callout, Card, Grid, Heading, Icon, Input, SetupWizard, Table, Text } from "@particle-academy/react-fancy";
import type { SetupWizardValue } from "@particle-academy/react-fancy";
import { useEffect, useMemo, useState } from "react";
import { FeatureShell } from "../shared/FeatureShell";
import type { ResolvedFeature } from "../shared/types";
import type { ConnectorCard } from "./types";
import {
    browserStorage,
    DEFAULT_APP_NAME,
    DEFAULT_APP_URL,
    exampleUrls,
    fillStepText,
    loadApp,
    loadProgress,
    loadUrls,
    saveApp,
    saveProgress,
    saveUrls,
    toWizardSteps,
    wizardTokens,
    type WizardUrls,
} from "./wizard";

/**
 * /features/connectors/{service}/setup: one connector's setup steps, one at a
 * time, in react-fancy's SetupWizard.
 *
 * The steps are the connector's own `setup`, exactly as the served index
 * carries it (`ConnectorSource::setupFor()`); this page never writes one. A
 * connector without steps gets a plain "coming soon" state with its credential
 * fields and links from the same catalogue, and no wizard.
 *
 * The wizard fills the closed set of five tokens, `{{appUrl}}`, `{{appName}}`,
 * `{{connector}}`, `{{webhookUrl}}` and `{{oauthRedirectUrl}}`, from the four
 * fields above it. The two URL fields start as examples built from the app
 * URL and are the person's to change: the routes are the host's own. Progress
 * and the URLs are kept per connector in localStorage, read after mount so
 * the server render and the first client render agree.
 */
export default function ConnectorSetup({ feature, connector }: { feature: ResolvedFeature; connector: ConnectorCard }) {
    const steps = useMemo(() => toWizardSteps(connector.setup ?? []), [connector.setup]);

    const [app, setApp] = useState({ appUrl: DEFAULT_APP_URL, appName: DEFAULT_APP_NAME });
    const [progress, setProgress] = useState<SetupWizardValue>({ current: 0, done: [] });
    const [urls, setUrls] = useState<WizardUrls>({ webhookUrl: null, oauthRedirectUrl: null });
    const [loaded, setLoaded] = useState(false);

    useEffect(() => {
        const storage = browserStorage();
        setApp(loadApp(storage));
        setUrls(loadUrls(storage, connector.slug));
        setProgress(loadProgress(storage, connector.slug, steps.length));
        setLoaded(true);
    }, [connector.slug, steps.length]);

    useEffect(() => {
        if (loaded) saveApp(browserStorage(), app);
    }, [app, loaded]);

    const onProgress = (next: SetupWizardValue) => {
        setProgress(next);
        saveProgress(browserStorage(), connector.slug, next);
    };

    const onUrls = (next: WizardUrls) => {
        setUrls(next);
        saveUrls(browserStorage(), connector.slug, next);
    };

    // Until the person types one, each URL follows the app URL as an example.
    const examples = exampleUrls(app.appUrl, connector.slug);
    const tokens = wizardTokens(app.appUrl, app.appName, connector.slug, urls);
    const packages = Object.entries(connector.packages);

    return (
        <FeatureShell feature={feature} current={`Set up ${connector.title}`}>
            <section className="feature-section con-setup" data-connector-setup={connector.slug}>
                <div className="con-setup__head">
                    <Heading as="h1" size="xl" weight="semibold" className="feature-display">
                        Set up {connector.title}
                    </Heading>
                    {connector.status && (
                        <Badge size="sm" variant="soft" color="amber">
                            {connector.status}
                        </Badge>
                    )}
                </div>
                {connector.summary && (
                    <Text as="p" color="muted" className="feature-section__intro">
                        {connector.summary}
                    </Text>
                )}

                {steps.length > 0 ? (
                    <>
                        <Grid cols={2} gap="md" className="con-setup__app" data-setup-app="">
                            <Input
                                type="url"
                                label="Your app URL"
                                value={app.appUrl}
                                onValueChange={(appUrl) => setApp((a) => ({ ...a, appUrl }))}
                                placeholder={DEFAULT_APP_URL}
                                data-co-handle="setup-app-url"
                            />
                            <Input
                                label="Your app name"
                                value={app.appName}
                                onValueChange={(appName) => setApp((a) => ({ ...a, appName }))}
                                placeholder={DEFAULT_APP_NAME}
                                data-co-handle="setup-app-name"
                            />
                            <Input
                                type="url"
                                label="Webhook URL"
                                description="Where the service posts events to your app. An example from your app URL; change it to your real route."
                                value={urls.webhookUrl ?? examples.webhookUrl}
                                onValueChange={(webhookUrl) => onUrls({ ...urls, webhookUrl })}
                                placeholder={examples.webhookUrl}
                                data-co-handle="setup-webhook-url"
                            />
                            <Input
                                type="url"
                                label="OAuth redirect URL"
                                description="Where the service sends the person back after they approve. An example from your app URL; change it to your real route."
                                value={urls.oauthRedirectUrl ?? examples.oauthRedirectUrl}
                                onValueChange={(oauthRedirectUrl) => onUrls({ ...urls, oauthRedirectUrl })}
                                placeholder={examples.oauthRedirectUrl}
                                data-co-handle="setup-oauth-redirect-url"
                            />
                        </Grid>
                        <Text as="p" size="sm" color="muted">
                            Every value you copy below is filled in for this app. Your progress is saved in this browser.
                        </Text>
                        <Card variant="outlined" className="con-setup__wizard">
                            <Card.Body>
                                <SetupWizard
                                    id={`setup-${connector.slug}`}
                                    steps={fillStepText(steps, tokens)}
                                    value={progress}
                                    onChange={onProgress}
                                    tokens={tokens}
                                    data-co-handle="connector-setup-wizard"
                                />
                            </Card.Body>
                        </Card>
                    </>
                ) : (
                    <Callout color="fuchsia" icon={<Icon name="hourglass" size="sm" />} data-setup-coming-soon="">
                        <strong>Setup guide coming soon.</strong> {connector.title} has no step-by-step guide in the catalogue yet.
                        Until it does, here is what a connection needs, and where to read more.
                    </Callout>
                )}
            </section>

            {connector.credentials.length > 0 && (
                <section className="feature-section" data-setup-credentials="">
                    <Heading as="h2" size="lg" weight="semibold" className="feature-display">
                        What a connection holds
                    </Heading>
                    <Table>
                        <Table.Head>
                            <Table.Row>
                                <Table.Column label="Field" />
                                <Table.Column label="Secret" />
                                <Table.Column label="Where it comes from" />
                            </Table.Row>
                        </Table.Head>
                        <Table.Body>
                            {connector.credentials.map((field) => (
                                <Table.Row key={field.key} data-credential={field.key}>
                                    <Table.Cell>
                                        <strong>{field.label}</strong>
                                        {field.optional && " (optional)"}
                                        <div>
                                            <code className="feature-code">{field.key}</code>
                                        </div>
                                    </Table.Cell>
                                    <Table.Cell>{field.secret ? "Secret" : "Not secret"}</Table.Cell>
                                    <Table.Cell>{field.help ?? ""}</Table.Cell>
                                </Table.Row>
                            ))}
                        </Table.Body>
                    </Table>
                </section>
            )}

            <section className="feature-section" data-setup-links="">
                <Heading as="h2" size="lg" weight="semibold" className="feature-display">
                    Links
                </Heading>
                <div className="con-setup__links">
                    {connector.docs && (
                        <Button href={connector.docs} target="_blank" rel="noopener noreferrer" size="sm" iconTrailing="external-link">
                            {connector.title} API docs
                        </Button>
                    )}
                    {connector.auth.authorizeUrl && (
                        <Text as="p" size="sm" color="muted">
                            Consent is requested at <code className="feature-code">{connector.auth.authorizeUrl}</code>
                        </Text>
                    )}
                </div>
                <Grid cols={2} gap="sm" className="con-setup__packages">
                    {packages.map(([role, pkg]) => (
                        <Card key={role} variant="outlined" data-package-role={role}>
                            <Card.Body>
                                <Text as="p" size="sm" color="muted">
                                    {PACKAGE_ROLE[role] ?? role}
                                </Text>
                                {pkg.url ? (
                                    <Button href={pkg.url} target="_blank" rel="noopener noreferrer" variant="ghost" size="sm" iconTrailing="external-link" className="con-setup__pkg">
                                        {pkg.name} v{pkg.version}
                                    </Button>
                                ) : (
                                    <Text as="span" size="sm" className="con-setup__pkg">
                                        {pkg.name} v{pkg.version}
                                    </Text>
                                )}
                            </Card.Body>
                        </Card>
                    ))}
                </Grid>
                <Button as={Link} href="/features/connectors#catalogue" variant="ghost" icon="arrow-left" size="sm">
                    All connectors
                </Button>
            </section>
        </FeatureShell>
    );
}

const PACKAGE_ROLE: Record<string, string> = {
    ui: "React (editor surface, every host)",
    js: "Node",
    php: "PHP",
    py: "Python",
};
