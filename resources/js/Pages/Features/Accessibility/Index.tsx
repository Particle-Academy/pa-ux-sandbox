import { Link } from "@inertiajs/react";
import { Button, Callout, Icon, Text } from "@particle-academy/react-fancy";
import { DemoFrame } from "../shared/DemoFrame";
import { FeatureCta } from "../shared/FeatureCta";
import { FeatureHero } from "../shared/FeatureHero";
import { FeatureShell } from "../shared/FeatureShell";
import { FeatureTour } from "../shared/FeatureTour";
import { HowItFits } from "../shared/HowItFits";
import { InstallSteps } from "../shared/InstallSteps";
import { PackagesGrid } from "../shared/PackagesGrid";
import type { FeaturePageProps } from "../shared/types";
import { ContrastDemo } from "./ContrastDemo";
import { FocusDemo } from "./FocusDemo";
import { LanguageDemo } from "./LanguageDemo";
import { Lesson } from "./Lesson";
import { LiveRegionDemo } from "./LiveRegionDemo";
import { OtpDemo } from "./OtpDemo";
import { TargetSizeDemo } from "./TargetSizeDemo";

/**
 * /features/accessibility: a page that TEACHES. Each lesson states the
 * principle in plain words with its WCAG 2.2 criteria, then how Fancy UI meets
 * it, then a live demo of the real components. Every "how" point names the
 * react-fancy release it shipped in, from react-fancy's CHANGELOG; every number
 * in a demo table is measured in the visitor's browser, never typed.
 *
 * Languages get their own lesson when fancy-i18n 0.1 ships. Until then the
 * page says only that it is coming, and claims nothing about it.
 */
export default function AccessibilityFeature({ feature, versions }: FeaturePageProps) {
    return (
        <FeatureShell feature={feature}>
            <div className="a11y-site">
                <FeatureHero
                    feature={feature}
                    eyebrow="Feature · Accessibility"
                    lede="What accessibility asks of an interface, in plain words, and how Fancy UI answers it in the components themselves, so an app built from them starts from accessible parts instead of retrofitting them."
                    languages={feature.languages}
                    actions={
                        <>
                            <Button href="#contrast" color="indigo" icon="graduation-cap" className="a11y-tap">
                                Start with contrast
                            </Button>
                            <Button as={Link} href="/packages/react-fancy" variant="ghost" iconTrailing="arrow-right" className="a11y-tap">
                                The react-fancy package
                            </Button>
                        </>
                    }
                />
            </div>

            <FeatureTour
                title="What this page covers"
                intro="The Web Content Accessibility Guidelines (WCAG) 2.2 are the standard most accessibility law points at. Level A is the floor, AA is what most policies require, and AAA goes further. Each lesson below names the criteria it is about."
                items={[
                    { icon: "contrast", title: "Contrast and theme tokens", body: "Text and control outlines you can see, measured live." },
                    { icon: "keyboard", title: "Focus and the keyboard", body: "Everything reachable without a mouse, with focus you can follow." },
                    { icon: "languages", title: "Language and direction", body: "Labels that tell a screen reader which language they are in." },
                    { icon: "pointer", title: "Target sizes", body: "Controls big enough to hit, measured live." },
                    { icon: "message-square-text", title: "Codes, autofill and status", body: "One-time codes from a text message, and changes announced aloud." },
                    { icon: "bot", title: "Agents and consent", body: "Where an AI agent may never act for a person." },
                ]}
            />

            <Lesson
                id="contrast"
                title="Contrast and theme tokens"
                criteria={[
                    { code: "1.4.3", name: "Contrast (Minimum)", level: "AA" },
                    { code: "1.4.11", name: "Non-text Contrast", level: "AA" },
                ]}
                principle={
                    <>
                        <p>
                            Text must stand out from what is behind it: at least 4.5:1 for normal text. The outline that shows where a
                            field is, and an icon that is a control, need 3:1. Contrast is a ratio from 1:1 (no difference) to 21:1
                            (black on white).
                        </p>
                        <p>Low contrast fails people with low vision first, and everyone reading a screen in bright light.</p>
                    </>
                }
                fancy={[
                    "Every form-control outline reads one token, --fancy-border-strong, now zinc-500 by default: 4.83:1 on white and 3.44:1 on the dark field (react-fancy 6.15.0). Before, outlines were 1.27:1 to 1.59:1.",
                    "Native checkboxes and radios are drawn by the browser; react-fancy sets their checked colour with accent-color and gives them a dark color-scheme in dark mode (6.15.1).",
                    "Readable secondary text uses --fancy-text-muted, 4.83:1 light and 6.75:1 dark on the default surfaces. The fainter token is kept for decoration only, and a scan test fails any new readable use of it (6.12.0, 6.13.0).",
                    "Secondary greys are theme tokens with -dark twins, so an app that remaps them restyles the kit (6.12.0). If you set them, the contrast is yours to check. Muted text is AA, not AAA; map --fancy-text-muted for 7:1.",
                ]}
            >
                <DemoFrame
                    id="a11y-contrast"
                    label="Contrast, measured in your browser"
                    status="Live · measured"
                    caption="The ratios are computed from the colours your browser rendered, with the WCAG formula. Switch the site between light and dark: the table re-measures."
                >
                    <ContrastDemo />
                </DemoFrame>
            </Lesson>

            <Lesson
                id="focus"
                title="Focus and the keyboard"
                criteria={[
                    { code: "2.1.1", name: "Keyboard", level: "A" },
                    { code: "2.4.3", name: "Focus Order", level: "A" },
                    { code: "2.4.7", name: "Focus Visible", level: "AA" },
                    { code: "2.4.11", name: "Focus Not Obscured (Minimum)", level: "AA" },
                ]}
                principle={
                    <>
                        <p>
                            Everything you can do with a mouse must work from a keyboard alone, in a sensible order, and you must always
                            be able to see where focus is. People who use a keyboard, a switch or a screen reader depend on it.
                        </p>
                        <p>A modal dialog is where focus should be held: inside it until it closes, then back where it started.</p>
                    </>
                }
                fancy={[
                    "Button shows its focus ring on keyboard focus (:focus-visible) in the focus token, not after every mouse click (react-fancy 6.1.0).",
                    "Modal, Drawer and Command move focus in, keep Tab and Shift+Tab inside, close on Escape and return focus to the trigger (6.11.0).",
                    "ReorderableGrid is one tab stop: Space or Enter picks a cell up, the arrow keys move it, Escape cancels (5.64.0).",
                    <>
                        A fixed consent banner publishes the space it covers, so a page can keep focused controls clear of it. See{" "}
                        <Link href="/features/compliance#consent" className="feature-link">
                            Compliance
                        </Link>
                        .
                    </>,
                ]}
            >
                <DemoFrame
                    id="a11y-focus"
                    label="Tab through, then open the dialog"
                    status="Live"
                    caption="Use Tab and Shift+Tab. The readout is the element that has focus right now, read from the page."
                >
                    <FocusDemo />
                </DemoFrame>
            </Lesson>

            <Lesson
                id="language"
                title="Language and direction"
                criteria={[
                    { code: "3.1.1", name: "Language of Page", level: "A" },
                    { code: "3.1.2", name: "Language of Parts", level: "AA" },
                ]}
                principle={
                    <>
                        <p>
                            A screen reader picks its voice and pronunciation from the language the page declares. Text in another
                            language, such as a language switcher that names each language in itself, must say so, or it is read with
                            the wrong rules and is hard to understand.
                        </p>
                        <p>Right-to-left scripts such as Arabic also need their direction marked, so they display in the right order.</p>
                    </>
                }
                fancy={[
                    "Options take their own lang and dir: Select (native and listbox), Autocomplete, RadioGroup, CheckboxGroup and MultiSwitch put them on the element holding the label (react-fancy 6.13.0).",
                    "An option that sets neither renders exactly as before, and dir=\"auto\" is never added for you.",
                    "OtpInput's cells and PhoneInput's number stay left to right on a right-to-left page, where digits belong (PhoneInput since 6.10.0).",
                    "Visible strings such as Modal.Header's close label and OtpInput's cell names can be replaced, so they can be translated (6.11.0, 6.14.0).",
                ]}
            >
                <DemoFrame
                    id="a11y-language"
                    label="A language switcher that names each language in itself"
                    status="Live"
                    caption="Pick a language. The readout is the chosen option's own attributes, read from the rendered page."
                >
                    <LanguageDemo />
                </DemoFrame>
            </Lesson>

            <Lesson
                id="targets"
                title="Target sizes"
                criteria={[
                    { code: "2.5.8", name: "Target Size (Minimum)", level: "AA" },
                    { code: "2.5.5", name: "Target Size (Enhanced)", level: "AAA" },
                ]}
                principle={
                    <p>
                        Something you tap or click must be big enough to hit: at least 24 by 24 CSS pixels for AA, 44 by 44 for AAA.
                        Small targets fail people with tremors, people on a moving bus, and everyone on a phone.
                    </p>
                }
                fancy={[
                    "Modal.Header and Drawer.Header close buttons have a 44px hit area, without changing how they look (react-fancy 6.11.0).",
                    "QrCodePanel's actions default to size lg, 44px tall (6.8.0), and PhoneInput's targets are 44px (6.10.0).",
                    "The consent banner and dialog keep every target at 44px or more (fancy-compliance-ui).",
                    "Button sizes run xs to xl; the table measures what each renders, so you can pick the one your target needs.",
                ]}
            >
                <DemoFrame
                    id="a11y-targets"
                    label="Button sizes, measured"
                    status="Live · measured"
                    caption="Each box is read from the rendered button in your browser."
                >
                    <TargetSizeDemo />
                </DemoFrame>
            </Lesson>

            <Lesson
                id="codes"
                title="One-time codes and autofill"
                criteria={[
                    { code: "1.3.5", name: "Identify Input Purpose", level: "AA" },
                    { code: "3.3.8", name: "Accessible Authentication (Minimum)", level: "AA" },
                ]}
                principle={
                    <p>
                        A field should say what it is for, so the browser and assistive tools can fill it in. Signing in must not
                        depend on remembering or retyping something: pasting and autofill have to work, which matters most to people
                        with memory or motor disabilities.
                    </p>
                }
                fancy={[
                    "OtpInput's first cell has autocomplete=\"one-time-code\", so iOS and Android offer the code from a text message (react-fancy 6.14.0).",
                    "A whole code arriving in one cell, from autofill, an IME or a paste, is spread across the cells instead of being cut to one digit (6.14.0).",
                    "The cells sit in one named group, and each is named \"Digit 1 of 6\" and so on, replaceable through labels (6.14.0).",
                    "Pasting fills the cells and strips anything that is not a digit.",
                ]}
            >
                <DemoFrame id="a11y-otp" label="A one-time code field" status="Live" caption="Paste a code such as 123456 into any cell.">
                    <OtpDemo />
                </DemoFrame>
            </Lesson>

            <Lesson
                id="status"
                title="Status messages a screen reader hears"
                criteria={[{ code: "4.1.3", name: "Status Messages", level: "AA" }]}
                principle={
                    <p>
                        When something changes without moving focus, such as an item moved, a copy done or a check finished, a
                        screen-reader user has to be told. A live region is the part of a page the screen reader reads out when it
                        changes; polite ones wait for a pause, assertive ones speak at once.
                    </p>
                }
                fancy={[
                    "ReorderableGrid announces every step of a keyboard move in an assertive live region, with every message replaceable (react-fancy 5.64.0).",
                    "SetupWizard announces copy results in a polite live region, and QrCodePanel says what each action did in a polite status (6.14.0, 6.8.0).",
                    "fancy-captcha-ui announces proof-of-work progress at quarter steps rather than every percent, and fancy-fun-lab-ui's XP feed folds a burst into one summary.",
                ]}
            >
                <DemoFrame
                    id="a11y-live"
                    label="Reorder with the keyboard, and hear it"
                    status="Live"
                    caption="The list mirrors the component's own live region, so you can read what is spoken."
                >
                    <LiveRegionDemo />
                </DemoFrame>
            </Lesson>

            <Lesson
                id="agents"
                title="Agents and consent"
                criteria={[]}
                principle={
                    <p>
                        Fancy UI lets AI agents act in an interface beside the person. Some actions must stay the person's own: a
                        consent choice made by an agent is not consent, and an approval card does not change that, because the
                        click would still be the agent's.
                    </p>
                }
                fancy={[
                    "Any element marked data-agent-off-limits fences everything inside it from agents: agent-integrations 0.58.0 refuses a click, field set, submit, focus or scroll that would reach inside.",
                    "The refusal comes before a pendingMode confirm, so no person is ever shown an approval card for it.",
                    "The agent learns only that the area exists and its role, such as \"consent region\": no labels, no values, no handles.",
                    "fancy-compliance-ui marks its banner, dialog and trigger, so consent is fenced in every app that uses it.",
                ]}
            >
                <Text as="p" size="sm">
                    <Link href="/features/compliance#agents" className="feature-link">
                        Watch an agent try the consent banner on the Compliance page
                    </Link>
                </Text>
            </Lesson>

            <section id="languages" className="feature-section">
                <Callout color="indigo" icon={<Icon name="languages" size="sm" />} data-a11y-coming="fancy-i18n">
                    Translating every Fancy UI label is coming with fancy-i18n. This page gets a Languages lesson when it can be
                    installed.
                </Callout>
            </section>

            <HowItFits
                members={feature.members}
                bridges={feature.bridges}
                intro="Accessibility is not a separate package: it is built into react-fancy, so every Fancy UI surface built on it inherits it, from the consent banner to the captcha."
            />
            <InstallSteps members={feature.members} versions={versions} />
            <PackagesGrid members={feature.members} versions={versions} />

            <FeatureCta
                title="Build on components that already do this"
                body="Start with react-fancy, then see the consent banner and captcha, which are built on it and held to AAA where they can be."
                primary={{ label: "The react-fancy package", href: "/packages/react-fancy" }}
                secondary={{ label: "The Compliance Feature", href: "/features/compliance" }}
            />
        </FeatureShell>
    );
}
