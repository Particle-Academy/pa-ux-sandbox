import { useState } from "react";
import { ServerSeo } from "@/lib/ServerSeo";
import { Badge, Button, Card, Kbd, Text } from "@particle-academy/react-fancy";
import { ComponentGallery } from "../../FancyTui/ComponentGallery";
import { DocsTuiLive, TuiWorkbench } from "../../FancyTui/Index";
import { DemoFrame } from "../shared/DemoFrame";
import { FeatureCta } from "../shared/FeatureCta";
import { FeatureHero } from "../shared/FeatureHero";
import { FeatureShell } from "../shared/FeatureShell";
import { FeatureTour, type FeatureTourItem } from "../shared/FeatureTour";
import { HowItFits } from "../shared/HowItFits";
import { InstallSteps } from "../shared/InstallSteps";
import { PackagesGrid } from "../shared/PackagesGrid";
import type { FeaturePageProps } from "../shared/types";
import "./tui.css";

/**
 * What fancy-tui does. Each claim is checked against the installed package
 * (fancy-tui: showcase/previews.json, registry.tsx, keyboard/, markdown/,
 * mouse.tsx, README) and agent-integrations' `bridges/tui`.
 */
const TOUR: FeatureTourItem[] = [
    {
        icon: "scan-eye",
        title: "Real Ink, never a picture",
        body: (
            <>
                Every preview below is the component's actual Ink output, captured to ANSI by fancy-tui's own showcase
                build and shipped inside the package as <code className="feature-code">showcase/previews.json</code>.
            </>
        ),
    },
    {
        icon: "fingerprint",
        title: "Stable surface handles",
        body: (
            <>
                <code className="feature-code">createTuiSurfaceRegistry()</code> gives each surface a unique id, a{" "}
                <code className="feature-code">read()</code> and named commands. A duplicate id throws, so an agent
                never guesses which panel it is addressing.
            </>
        ),
    },
    {
        icon: "shield-check",
        title: "Agents propose, people confirm",
        body: (
            <>
                <code className="feature-code">tui_action_invoke</code> runs a command, or, when its policy is{" "}
                <code className="feature-code">propose</code> or <code className="feature-code">confirm</code>, parks it
                for <code className="feature-code">tui_action_confirm</code> / <code className="feature-code">tui_action_reject</code>.
                A <code className="feature-code">human-only</code> command refuses an agent outright.
            </>
        ),
    },
    {
        icon: "inbox",
        title: "Pushed live, or pulled later",
        body: (
            <>
                Events land in a durable inbox. Subscribe to have them pushed on the MCP transport, or pull with{" "}
                <code className="feature-code">human_plus_events_list</code> and acknowledge with{" "}
                <code className="feature-code">human_plus_events_ack</code>, per consumer.
            </>
        ),
    },
    {
        icon: "file-text",
        title: "Safe Markdown for agent output",
        body: (
            <>
                The <code className="feature-code">./markdown</code> renderer turns Markdown into ANSI and strips control
                characters, ESC included, from untrusted text first, so a reply cannot smuggle in terminal escape
                sequences.
            </>
        ),
    },
    {
        icon: "keyboard",
        title: "Keys and clicks, by capability",
        body: (
            <>
                Alt+Enter inserts a newline everywhere; Shift+Enter only where enhanced keyboard reporting is detected.
                <code className="feature-code">FancyTuiProvider</code> mounts mouse support, so a clickable box gets
                clicks once the terminal reports them.
            </>
        ),
    },
];

/**
 * /features/tui: the TUI micro-site. Terminal-native but legible: phosphor
 * green on a real dark console, a prompt line and monospace display type, at
 * full contrast in both themes.
 *
 * "View as console" is not a preview pane. It hands the WHOLE viewport to the
 * live Ink app, outside the site shell, so it reads as a terminal application
 * rather than an embedded widget; `q` (or Escape at the root) comes back.
 */
export default function TuiFeature({ feature, versions }: FeaturePageProps) {
    const [consoleOpen, setConsoleOpen] = useState(false);
    const openConsole = () => setConsoleOpen(true);

    if (consoleOpen) {
        return (
            <>
                <ServerSeo />
                <DocsTuiLive onExit={() => setConsoleOpen(false)} />
            </>
        );
    }

    const tui = feature.members.find((member) => member.slug === "fancy-tui");

    return (
        <FeatureShell feature={feature}>
            <div className="tui-site">
                <FeatureHero
                    feature={feature}
                    eyebrow="Feature · Terminal UI"
                    lede="Ink components for terminal apps a person and an agent run together: the same controlled state, stable handles and MCP bridge as the browser kit, built for a grid of cells."
                    languages={feature.languages}
                    actions={
                        <>
                            <Button color="green" icon="square-terminal" onClick={openConsole} data-action="open-console">
                                Launch the live console
                            </Button>
                            <Button href="#tui-components" variant="ghost" icon="layout-grid">
                                Browse components
                            </Button>
                        </>
                    }
                >
                    {tui?.install && (
                        <div className="tui-prompt" aria-label="Install">
                            <div className="tui-prompt__line">
                                <span className="tui-prompt__sigil" aria-hidden>
                                    $
                                </span>
                                <code>{tui.install}</code>
                            </div>
                            <Text as="p" size="sm" className="tui-prompt__note">
                                Needs Node 22, React 19.2 and Ink 7.
                                <span className="tui-prompt__cursor" aria-hidden />
                            </Text>
                        </div>
                    )}
                </FeatureHero>

                <div id="tui-workbench" className="tui-anchor">
                    <DemoFrame
                        id="tui-workbench"
                        label="The workbench"
                        caption="Pick an example to read it as semantic HTML beside its React / Ink source. View as console runs the real components in a full-screen terminal."
                    >
                        <TuiWorkbench onOpenConsole={openConsole} />
                    </DemoFrame>
                </div>

                <Card variant="outlined" className="tui-launch" data-console-launcher="">
                    <Card.Body>
                        <div className="tui-launch__body">
                            <div className="tui-launch__text">
                                <Text as="p" weight="semibold" className="tui-launch__title">
                                    The live console takes the whole screen
                                </Text>
                                <Text as="p" size="sm" color="muted">
                                    Your browser becomes a terminal in front of a Node service running the real fancy-tui
                                    Ink app. Every keystroke goes to it, and self-animating components animate.
                                </Text>
                                <div className="tui-launch__keys">
                                    <Text as="span" size="sm" color="muted">
                                        <Kbd size="md">↑</Kbd> <Kbd size="md">↓</Kbd> browse
                                    </Text>
                                    <Text as="span" size="sm" color="muted">
                                        <Kbd size="md">Enter</Kbd> drive an interactive one
                                    </Text>
                                    <Text as="span" size="sm" color="muted">
                                        <Kbd size="md">/</Kbd> search
                                    </Text>
                                    <Text as="span" size="sm" color="muted">
                                        <Kbd size="md">q</Kbd> back to this page
                                    </Text>
                                </div>
                            </div>
                            <Button color="green" icon="square-terminal" onClick={openConsole}>
                                Launch the live console
                            </Button>
                        </div>
                    </Card.Body>
                </Card>

                <div id="tui-components" className="tui-anchor">
                    <DemoFrame
                        id="tui-components"
                        label="Every component, as your terminal draws it"
                        status="Real Ink output"
                        caption="Filter, then flip any card to its source. Each frame is rendered by a real terminal emulator from the ANSI the component produced."
                    >
                        <ComponentGallery />
                    </DemoFrame>
                </div>

                <FeatureTour
                    title="Built for terminals people and agents share"
                    intro="A terminal has no DOM for an agent to scrape, so everything an agent does goes through handles and an MCP bridge."
                    items={TOUR}
                />

                <HowItFits
                    members={feature.members}
                    bridges={feature.bridges}
                    intro="fancy-tui is the Ink half; the agent reaches it through the TUI bridge in agent-integrations."
                />
                <InstallSteps members={feature.members} versions={versions} />
                <PackagesGrid members={feature.members} versions={versions} />

                <FeatureCta
                    title="Build a terminal app with an agent inside"
                    body="Read the fancy-tui docs for every component and the surface registry, then wire the TUI bridge so an agent can act on it."
                    primary={{ label: "fancy-tui docs", href: tui?.href ?? "/packages/fancy-tui" }}
                    secondary={
                        tui?.repoUrl
                            ? { label: "fancy-tui on GitHub", href: tui.repoUrl, external: true }
                            : undefined
                    }
                />
            </div>
        </FeatureShell>
    );
}
