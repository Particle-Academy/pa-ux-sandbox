import { Link } from "@inertiajs/react";
import { Button, Card, CodeBlock, Heading, Text } from "@particle-academy/react-fancy";
import { DemoFrame } from "../shared/DemoFrame";
import { FeatureCta } from "../shared/FeatureCta";
import { FeatureHero } from "../shared/FeatureHero";
import { FeatureShell } from "../shared/FeatureShell";
import { FeatureTour } from "../shared/FeatureTour";
import { HowItFits } from "../shared/HowItFits";
import { InstallSteps } from "../shared/InstallSteps";
import { PackagesGrid } from "../shared/PackagesGrid";
import type { FeaturePageProps } from "../shared/types";
import { PixelDemo } from "./PixelDemo";

/**
 * /features/heuristics: interaction analytics as a Feature (owner, 2026-11-16).
 *
 * Members come from FeatureSites: the fancy-heuristics family (the Laravel
 * backend and the browser collector) and fancy-pixel, the one-script embed.
 * Every claim here is sourced from those packages' READMEs; this showcase's own
 * /analytics dashboard runs on them. HeuristicsFeatureTest pins the members,
 * the menu entry and the no-network demo.
 */
const EMBED = `import { mountPixel } from "@particle-academy/fancy-pixel";

mountPixel({
  style: "badge",
  mode: "floating",
  siteKey: "YOUR_SITE_KEY",
  endpoint: "https://your-host/heuristics",
  consent: () => hasAnalyticsConsent(), // denied by default
});`;

const REPORTS = `use FancyHeuristics\\Facades\\Heuristics;

Heuristics::acquisition($site, 30);           // referrer hosts, utm, direct vs referral
Heuristics::sessionsSummary($site, 30);       // totals, avg duration, bounce rate
Heuristics::topElements($site, 30, 'agent');  // the controls agents activated most
Heuristics::timeseries($site, 30, 'day', true); // sessions per day, split human / agent`;

export default function HeuristicsFeature({ feature, versions }: FeaturePageProps) {
    return (
        <FeatureShell feature={feature}>
            <FeatureHero
                feature={feature}
                eyebrow="Feature · End-user optimization, not SEO"
                lede="See what people and agents actually do on your pages: clicks, scroll depth, dwell and focus heatmaps, with every session marked human or agent, which page analytics built for people cannot tell apart. One embed collects it and a Laravel package stores and reports it, with no third-party runtime dependencies."
                languages={feature.languages}
                actions={
                    <>
                        <Button href="/analytics" icon="activity" className="heur-tap">
                            View analytics
                        </Button>
                        <Button href="#pixel" variant="ghost" iconTrailing="arrow-down" className="heur-tap">
                            See the embed
                        </Button>
                    </>
                }
            />

            <FeatureTour
                title="What ships today"
                intro={<Text as="span">Each claim is checkable in the packages' READMEs.</Text>}
                items={[
                    {
                        icon: "mouse-pointer-click",
                        title: "One embed, three jobs",
                        body: "fancy-pixel renders the badge, sends a liveness beacon that proves the badge is really on screen, and starts the bundled fancy-heuristics-js collector, which streams clicks, scroll depth, pointer heatmaps and dwell to your endpoint.",
                    },
                    {
                        icon: "bot",
                        title: "Humans and agents, told apart",
                        body: "Every event carries an actor. Agent activity from an embedded agent becomes agent.act events, and every report takes an optional human or agent filter, so you can see how each one uses the same page.",
                    },
                    {
                        icon: "chart-line",
                        title: "Reports as plain arrays",
                        body: "fancy-heuristics answers acquisition, audience, sessions, top, entry and exit pages, the most-activated controls, event names and the last five minutes, each for a site and a date range, as JSON-friendly arrays your own UI renders.",
                    },
                    {
                        icon: "shield-check",
                        title: "Consent first",
                        body: "Consent is denied by default: without a grant, the pixel renders the badge and sends the liveness beacon but collects no analytics. Leave out the endpoint and it makes no network request at all.",
                    },
                    {
                        icon: "gauge",
                        title: "A public endpoint, bounded",
                        body: "The collect endpoint is public, so every batch is bounded: events per batch, path and label lengths, meta size, coordinates and timestamp skew. Paths are stored without their query string, and a response never echoes a submitted value.",
                    },
                    {
                        icon: "trash-2",
                        title: "Retention you schedule",
                        body: "heuristics:prune deletes by data class, with a dry run that only counts: raw events after 90 days, pointer samples after 14, sessions after 395. Pixel pings store an HMAC of the IP, never the IP.",
                    },
                ]}
            />

            <section id="pixel" className="feature-section heur-anchor">
                <Heading as="h2" size="lg" weight="semibold" className="feature-display">
                    The embed
                </Heading>
                <Text as="p" color="muted" className="feature-section__intro">
                    fancy-pixel renders into an open Shadow DOM, so the host page's CSS cannot hide it, and marks itself with a
                    stable data-fancy-badge handle that a scanner or an agent reads.
                </Text>
            </section>

            <DemoFrame
                id="heuristics-pixel"
                label="fancy-pixel mountPixel(), in all three styles"
                status="Live · sends nothing"
                caption="Each card mounts the real pixel inline, with no endpoint, so nothing leaves this page. On a site you would mount one, floating, with your endpoint, and it would start collecting once the visitor grants consent."
            >
                <PixelDemo />
            </DemoFrame>

            <section className="feature-section">
                <div className="heur-code">
                    <CodeBlock language="typescript" title="On your site" code={EMBED} />
                    <CodeBlock language="php" title="In your Laravel app" code={REPORTS} />
                </div>
            </section>

            <section className="feature-section">
                <Card variant="outlined" className="heur-note">
                    <Card.Body>
                        <Heading as="h3" size="sm" weight="semibold">
                            See it on this site
                        </Heading>
                        <Text as="p" size="sm" color="muted">
                            This showcase runs on these packages. Sign in with GitHub and{" "}
                            <a href="/analytics" className="feature-link">
                                open the analytics dashboard
                            </a>{" "}
                            for a site you have submitted to the showcase. Consent banners and the consent record are on the{" "}
                            <Link href="/features/compliance" className="feature-link">
                                Compliance feature
                            </Link>
                            .
                        </Text>
                    </Card.Body>
                </Card>
            </section>

            <HowItFits
                members={feature.members}
                bridges={feature.bridges}
                intro="fancy-heuristics is the Laravel backend; fancy-heuristics-js is the browser collector, also usable on its own; fancy-pixel bundles that collector behind one script tag."
            />
            <InstallSteps members={feature.members} versions={versions} />
            <PackagesGrid members={feature.members} versions={versions} />

            <FeatureCta
                title="Add analytics to your app"
                body="Install fancy-heuristics, mount fancy-pixel with your endpoint and site key, and read the reports from the Heuristics facade."
                primary={{ label: "fancy-heuristics", href: "/packages/fancy-heuristics" }}
                secondary={{ label: "fancy-pixel", href: "/packages/fancy-pixel" }}
            />
        </FeatureShell>
    );
}
