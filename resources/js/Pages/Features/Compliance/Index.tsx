import { Link } from "@inertiajs/react";
import { Button, Card, Heading, Text } from "@particle-academy/react-fancy";
import { DemoFrame } from "../shared/DemoFrame";
import { FeatureCta } from "../shared/FeatureCta";
import { FeatureHero } from "../shared/FeatureHero";
import { FeatureShell } from "../shared/FeatureShell";
import { FeatureTour } from "../shared/FeatureTour";
import { HowItFits } from "../shared/HowItFits";
import { InstallSteps } from "../shared/InstallSteps";
import { PackagesGrid } from "../shared/PackagesGrid";
import type { FeaturePageProps } from "../shared/types";
import { AgentFenceDemo } from "./AgentFenceDemo";
import { CaptchaDemo } from "./CaptchaDemo";
import { ConsentDemo } from "./ConsentDemo";
import { ReserveSpaceDemo } from "./ReserveSpaceDemo";

/**
 * /features/compliance: consent (fancy-compliance + fancy-compliance-ui) and
 * bot protection (fancy-captcha + fancy-captcha-ui), as they ship today.
 *
 * Every demo runs the real components. The consent demos keep their own state
 * and never post, because a choice made in a demo is not the visitor's
 * consent to this site; the site's real banner lives in the root layout. The
 * captcha demo posts to a real route behind fancy-captcha's middleware.
 * Claims are sourced from the package READMEs; ComplianceFeatureSiteTest
 * pins the ones a refactor could quietly break.
 */
export default function ComplianceFeature({ feature, versions }: FeaturePageProps) {
    return (
        <FeatureShell feature={feature}>
            <div className="cmp-site">
                <FeatureHero
                    feature={feature}
                    eyebrow="Feature · Consent and trust"
                    lede="A consent banner and preferences dialog where refusing is exactly as easy as accepting, an append-only record of every decision, a server gate other code checks before it collects, and a captcha that needs no third party."
                    languages={feature.languages}
                    actions={
                        <>
                            <Button href="#consent" color="teal" icon="shield-check" className="cmp-tap">
                                Try the banner
                            </Button>
                            <Button as={Link} href="/packages/fancy-compliance" variant="ghost" iconTrailing="arrow-right" className="cmp-tap">
                                The fancy-compliance package
                            </Button>
                        </>
                    }
                />
            </div>

            <div id="consent" className="cmp-anchor">
                <DemoFrame
                    id="compliance-consent"
                    label="Consent banner, preferences and the record"
                    status="Live · local state"
                    caption="Accept, reject or customise, then change your mind from the trigger. Every choice appends a row; a new policy version brings the banner back. Theme tokens restyle the banner; the dialog is portalled to the page, so it keeps the site's tokens."
                >
                    <ConsentDemo />
                </DemoFrame>
            </div>

            <FeatureTour
                title="What ships today"
                intro="fancy-compliance is the Laravel side; fancy-compliance-ui is the React side, built from react-fancy, which works with any backend that serves the same JSON."
                items={[
                    {
                        icon: "scale",
                        title: "Refusing is as easy as accepting",
                        body: "Accept all, Reject all and Customise are the same component, size and classes, side by side, and a test fails if one becomes more prominent. Nothing optional is pre-ticked. The banner is a labelled, non-modal region that never takes focus.",
                    },
                    {
                        icon: "list-checks",
                        title: "Per-category consent",
                        body: "Categories are yours, in config: a key, a label, a description and purposes, every one a translation key. The necessary category always exists and can never be refused. The dialog shows one switch per category.",
                    },
                    {
                        icon: "scroll-text",
                        title: "An append-only consent record",
                        body: "One row per decision, withdrawal or login link: what was granted and refused, under which policy version, from which source. A withdrawal is a new row; the model refuses to edit or delete one. No IP address and no user agent, raw or hashed.",
                    },
                    {
                        icon: "undo-2",
                        title: "Withdrawal, and re-consent",
                        body: "ConsentPreferencesTrigger opens the dialog at any time, and turning a category off is recorded as a withdrawal. Change the policy version and every earlier decision stops being current: the banner shows again.",
                    },
                    {
                        icon: "server",
                        title: "A server gate",
                        body: "Consent::allows('analytics') fails closed on an unknown category; the consent:analytics middleware answers 403 until consent; @consent in Blade. ConsentGate and useConsentScript do the same in React, and say honestly when a script that already ran needs a reload.",
                    },
                    {
                        icon: "palette",
                        title: "Styled to your app",
                        body: "Three variants (bar, card, corner) and logical positions that follow RTL. The banner reads react-fancy's theme tokens, and classNames styles each part, with one action key for all three buttons so none can be made easier than another.",
                    },
                ]}
            />

            <section id="agents" className="feature-section cmp-anchor">
                <Heading as="h2" size="lg" weight="semibold" className="feature-display">
                    An agent can never give consent
                </Heading>
                <Text as="p" color="muted" className="feature-section__intro">
                    Consent is the person's own act; one an agent gave for them is not consent. So the banner, the dialog and the
                    trigger each carry <code className="feature-code">data-agent-off-limits="consent"</code>, and
                    agent-integrations 0.58.0 or later refuses every agent action that would reach inside one: a click, a field
                    set, a submit, a focus or a scroll. It refuses before a pendingMode confirm can stage it, and tells the agent
                    only that a consent region exists.
                </Text>
            </section>

            <DemoFrame
                id="compliance-fence"
                label="An agent tries the consent controls"
                status="Live · agent-integrations"
                caption="The agent here is agent-integrations' own in-page walker, the one its navigation bridge drives, acting on this page. It may click Subscribe; it is refused at Accept all."
            >
                <AgentFenceDemo />
            </DemoFrame>

            <DemoFrame
                id="compliance-reserve"
                label="Keeping the page clear of the banner"
                status="Live"
                caption="A fixed banner sits over the page's last content, including the footer's preferences trigger (WCAG 2.4.11, Focus Not Obscured). reserveSpace pads the body by the banner's measured height; layouts that scroll their own wrapper read the variable instead."
            >
                <ReserveSpaceDemo />
            </DemoFrame>

            <section id="captcha" className="feature-section cmp-anchor">
                <Heading as="h2" size="lg" weight="semibold" className="feature-display">
                    Bot protection for forms
                </Heading>
                <Text as="p" color="muted" className="feature-section__intro">
                    fancy-captcha checks a form behind one Verifier contract. Its built-in mode needs no keys and no network: a
                    honeypot, a signed render time and, when enabled, a single-use proof-of-work. Turnstile, reCAPTCHA and hCaptcha
                    drivers talk plain HTTP with no SDK, and a configured provider fails closed. fancy-captcha-ui is one React
                    component for all of them.
                </Text>
            </section>

            <DemoFrame
                id="compliance-captcha"
                label="The built-in captcha, checked by the server"
                status="Live · posts to the server"
                caption="Send within three seconds of loading the page and the signed timing refuses it; wait, and it passes. The honeypot is hidden from keyboards and screen readers (aria-hidden, inert, tabindex -1). An agent may read the status attributes, and nothing lets it solve the check."
            >
                <CaptchaDemo />
            </DemoFrame>

            <section className="feature-section">
                <Card variant="outlined" className="cmp-note">
                    <Card.Body>
                        <Heading as="h3" size="sm" weight="semibold">
                            What these packages do not do
                        </Heading>
                        <Text as="p" size="sm" color="muted">
                            fancy-compliance covers consent only: GDPR data export and erasure are not in it. It does not block a
                            script you inject outside it, and rate limits and geo rules stay yours. Turnstile, reCAPTCHA and hCaptcha
                            render their own widgets, with their own accessibility; the built-in mode is the one held to AAA.
                        </Text>
                    </Card.Body>
                </Card>
            </section>

            <HowItFits
                members={feature.members}
                bridges={feature.bridges}
                intro="Each capability is a PHP package for Laravel and a React package built from react-fancy. The React halves do not depend on each other: fancy-captcha-ui takes anything with allows(category), which useConsent() returns, to keep a third-party captcha behind consent."
            />
            <InstallSteps members={feature.members} versions={versions} />
            <PackagesGrid members={feature.members} versions={versions} />

            <FeatureCta
                title="Put consent in your app"
                body="Install both halves, define your categories, and render the banner once in your layout. Then read how Fancy UI handles accessibility, which the banner is held to."
                primary={{ label: "The fancy-compliance-ui package", href: "/packages/fancy-compliance-ui" }}
                secondary={{ label: "Accessibility in Fancy UI", href: "/features/accessibility" }}
            />
        </FeatureShell>
    );
}
