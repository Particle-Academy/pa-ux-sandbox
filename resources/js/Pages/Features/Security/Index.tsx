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
import { CaptchaDemo } from "./CaptchaDemo";
import { PasskeyDemo } from "./PasskeyDemo";

/**
 * /features/security: every security-shaped capability in the kit, across
 * packages (owner, 2026-11-13: "Features are about features, not just specific
 * packages").
 *
 * Members come from FeatureSites and list only PUBLISHED packages: passkeys
 * (fancy-passkeys 0.3.0 PHP and Node, fancy-passkeys-ui), bot protection
 * (fancy-captcha, moved here from Compliance) and security.txt (fancy-x-files).
 * Packages still planned sit in FeatureSites' `whenPublished` and join the
 * member list on their own when they ship; this page names none of them
 * until then.
 *
 * Claims are sourced from the registry taglines, the READMEs and the 0.3.0
 * passkeys CHANGELOG; SecurityFeatureTest pins the ones a refactor could break.
 */
export default function SecurityFeature({ feature, versions }: FeaturePageProps) {
    return (
        <FeatureShell feature={feature}>
            <FeatureHero
                feature={feature}
                eyebrow="Feature · Sign-in, bots and disclosure"
                lede="Passkey sign-in in PHP or Node with no cryptography of our own, bot protection that needs no third party, and a security.txt served from the same registry as your robots.txt. Every piece works behind the same React UI whichever backend runs it."
                languages={feature.languages}
                actions={
                    <>
                        <Button href="#passkeys" icon="key-round" className="sec-tap">
                            Manage passkeys
                        </Button>
                        <Button href="#captcha" variant="ghost" iconTrailing="arrow-down" className="sec-tap">
                            Try the captcha
                        </Button>
                    </>
                }
            />

            <section id="passkeys" className="feature-section sec-anchor">
                <Heading as="h2" size="lg" weight="semibold" className="feature-display">
                    Passkeys
                </Heading>
                <Text as="p" color="muted" className="feature-section__intro">
                    fancy-passkeys is passkey (WebAuthn) sign-in for PHP and for Node, as thin wrappers over web-auth/webauthn-lib
                    and @simplewebauthn/server. The two share one four-endpoint wire contract, pinned by shared fixtures, so
                    fancy-passkeys-ui works against either.
                </Text>
            </section>

            <DemoFrame
                id="security-passkeys"
                label="fancy-passkeys-ui PasskeyManager and PasskeyStatus"
                status="Live · local state"
                caption="Rename a passkey, then revoke one: the revoke is staged until you confirm it, and revoking the last one says it locks you out. An agent driving this list through registerPasskeyBridge can list, rename, open an enrollment prompt and propose a revoke, and nothing else: no tool completes a sign-in ceremony."
            >
                <PasskeyDemo />
            </DemoFrame>

            <FeatureTour
                title="What ships today"
                intro={<Text as="span">Each claim is checkable in the packages' READMEs and changelogs.</Text>}
                items={[
                    {
                        icon: "fingerprint",
                        title: "Passkeys, end to end",
                        body: "Registration and sign-in ceremonies, discoverable (usernameless) credentials, single-use server-side challenges, and clone detection through the signature counter. The Laravel bridge augments Fortify rather than replacing it, so password login, reset and 2FA stay as they are.",
                    },
                    {
                        icon: "shield-check",
                        title: "No cryptography of our own",
                        body: "Verification is web-auth/webauthn-lib in PHP and @simplewebauthn/server in Node. What the libraries leave to you is what fancy-passkeys owns: challenge issuance, single-use expiry, credential persistence and counter replay detection.",
                    },
                    {
                        icon: "shield-alert",
                        title: "Answers that leak nothing",
                        body: "Since 0.3.0 a response from the wrong origin is refused as origin_not_allowed in PHP and Node alike, decided before the credential is looked up, so the answer is the same whether or not the credential exists.",
                    },
                    {
                        icon: "scroll-text",
                        title: "Optional login certificates",
                        body: "Off by default. Turned on, each sign-in and enrollment yields a canonical record with your own claims and a token both backends compute identically. Known-sensitive claim keys are stripped, and the package stores nothing.",
                    },
                    {
                        icon: "bot",
                        title: "Bot protection without a third party",
                        body: "fancy-captcha checks a form behind one Verifier contract. Its built-in mode needs no keys and no network: a honeypot, a signed render time and, when enabled, a single-use proof-of-work. Turnstile, reCAPTCHA and hCaptcha drivers talk plain HTTP with no SDK, and a configured provider fails closed.",
                    },
                    {
                        icon: "file-code",
                        title: "security.txt from one registry",
                        body: "fancy-x-files serves security.txt (RFC 9116) in Laravel from the same declarative registry as robots.txt, humans.txt, llms.txt and the sitemap, and its protect() guard keeps private paths disallowed for every bot group. The Node port has the same model, builders and validators, and fancy-x-files-ui is an editor for each file with a live preview.",
                    },
                ]}
            />

            <section id="captcha" className="feature-section sec-anchor">
                <Heading as="h2" size="lg" weight="semibold" className="feature-display">
                    Bot protection for forms
                </Heading>
                <Text as="p" color="muted" className="feature-section__intro">
                    fancy-captcha-ui is one React component for every fancy-captcha driver. It takes anything with
                    allows(category), which fancy-compliance-ui's useConsent() returns, so a third-party captcha can wait for consent.
                </Text>
            </section>

            <DemoFrame
                id="security-captcha"
                label="The built-in captcha, checked by the server"
                status="Live · posts to the server"
                caption="Send within three seconds of loading the page and the signed timing refuses it; wait, and it passes. The honeypot is hidden from keyboards and screen readers (aria-hidden, inert, tabindex -1). An agent may read the status attributes, and nothing lets it solve the check."
            >
                <CaptchaDemo />
            </DemoFrame>

            <section className="feature-section">
                <Card variant="outlined" className="sec-note">
                    <Card.Body>
                        <Heading as="h3" size="sm" weight="semibold">
                            What these packages do not do
                        </Heading>
                        <Text as="p" size="sm" color="muted">
                            fancy-passkeys completes a ceremony only with the person present: no agent tool can sign in or enroll for
                            them. Turnstile, reCAPTCHA and hCaptcha render their own widgets, with their own accessibility; the built-in
                            captcha mode is the one held to AAA. Rate limits stay yours. Consent lives on the{" "}
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
                intro="Passkeys and security.txt each ship as a PHP and Node pair with one React UI; the captcha is a Laravel package and a React component."
            />
            <InstallSteps members={feature.members} versions={versions} />
            <PackagesGrid members={feature.members} versions={versions} />

            <FeatureCta
                title="Add passkey sign-in to your app"
                body="Install the backend you run and the UI, then mount the four endpoints. The passkeys UI's pages show every state the sign-in and the manager can be in."
                primary={{ label: "fancy-passkeys-ui", href: "/packages/fancy-passkeys-ui" }}
                secondary={{ label: "Humans and agents on one UI", href: "/features/human-plus" }}
            />
        </FeatureShell>
    );
}
