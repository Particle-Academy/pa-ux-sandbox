import { Link } from "@inertiajs/react";
import { Badge, Button, Card, Grid, Heading, Icon, Skeleton, Text } from "@particle-academy/react-fancy";
import { clientOnly } from "@/lib/clientOnly";
import { DemoFrame } from "../shared/DemoFrame";
import { FeatureCta } from "../shared/FeatureCta";
import { FeatureHero } from "../shared/FeatureHero";
import { FeatureShell } from "../shared/FeatureShell";
import { FeatureTour } from "../shared/FeatureTour";
import { HowItFits } from "../shared/HowItFits";
import { InstallSteps } from "../shared/InstallSteps";
import { PackagesGrid } from "../shared/PackagesGrid";
import type { FeaturePageProps } from "../shared/types";

/**
 * /features/human-plus: the suite's headline capability. Humans and agents
 * share one UI and trade control through MCP bridges, never DOM scraping
 * (docs/human-plus-ux.md).
 *
 * Every claim is checkable in the packages, at the versions the showcase
 * installs: agent-integrations 0.59.0 (src/bridges, src/undo, src/presence,
 * src/mcp/transports/relay.ts), charlotte 0.3.0 (README, src/Drafts,
 * src/Storage) and fancy-cms 0.9.1 (README, src/PageSession.php). The bridge
 * list is server data from FeatureSites, which HumanPlusFeatureTest checks
 * against the installed package's exports.
 *
 * The demo is client-only: its MCP server lives in an effect.
 */
const SharedControlDemo = clientOnly(() => import("./SharedControlDemo"), SharedControlFallback);

function SharedControlFallback() {
    return (
        <div className="hp-shared hp-shared--loading" aria-busy="true">
            <Skeleton className="hp-shared__skeleton" />
            <Skeleton className="hp-shared__skeleton" />
        </div>
    );
}

/** On-The-Fly UI: what is true of each piece, with where it lives. */
const ON_THE_FLY = [
    {
        // fancy-cms-ui README "What's here"; fancy-cms README; Features/Cms tour
        icon: "file-json",
        title: "A page is configuration",
        body: "A fancy-cms page is one JSON document (a PageDoc): a flat map of nodes with per-breakpoint style props. Every edit is one PageOp through a pure reduce(). CmsPage renders whatever document it is handed, and fancy-cms renders the same document to the same HTML in PHP. Building a page is writing data, not shipping code.",
    },
    {
        // charlotte 0.3.0 README "What you get"
        icon: "bot",
        title: "Charlotte edits the configuration",
        body: "Charlotte, the website-builder agent kit, edits a page's draft through nine closed tools, with every write pinned to a revision, so a person editing at the same time is never overwritten. Autonomy is your setting: full applies each edit at once, approve_on_save collects them in a change set a person approves. Nothing it does publishes; publishing is one explicit host call.",
    },
    {
        // fancy-cms README (persistence is the host's); charlotte src/Drafts/PageRepository.php,
        // src/Storage/DatabasePageRepository.php, database/migrations; Features/Cms demo
        icon: "database",
        title: "Where the configuration lives",
        body: "fancy-cms stores nothing itself: the host owns persistence. Charlotte keeps each draft and its published copy in your database by default, and takes your own PageRepository to keep pages in your schema. A document can also be rendered without being stored at all: the CMS feature's editor renders its live document with CmsPage and never saves it.",
    },
];

export default function HumanPlusFeature({ feature, versions }: FeaturePageProps) {
    return (
        <FeatureShell feature={feature}>
            <FeatureHero
                feature={feature}
                eyebrow="Feature · Humans and agents, one surface"
                title="Human+: one UI, two kinds of operator"
                lede="A person and an agent work in the same interface and trade control. The agent reads and writes the components' own state through MCP bridges, never by scraping the page, and every change it makes is visible, undoable, and, where it matters, a proposal the person confirms."
                languages={feature.languages}
                actions={
                    <>
                        <Button href="#shared-control" icon="handshake" className="hp-tap">
                            Share a control with an agent
                        </Button>
                        <Button as={Link} href="/docs/human-plus-ux" variant="ghost" iconTrailing="arrow-right" className="hp-tap">
                            The Human+ whitepaper
                        </Button>
                    </>
                }
            />

            <div id="shared-control" className="hp-anchor">
                <DemoFrame
                    id="human-plus-shared"
                    label="react-fancy ContentReaction + registerContentReactionBridge"
                    status="Live · in-page MCP"
                    caption="Click a reaction yourself, then send the agent a tool call: both change the same controlled value. Turn on Ask me first and the agent's write waits for your Approve. agent_undo takes back the agent's last change and only the agent's. Nothing here leaves the page."
                >
                    <SharedControlDemo />
                </DemoFrame>
            </div>

            <FeatureTour
                title="What it is made of"
                intro={<Text as="span">Each claim is checkable in agent-integrations and the packages named below.</Text>}
                items={[
                    {
                        // agent-integrations package.json exports ./bridges/*; src/bridges/*.ts
                        icon: "plug",
                        title: `${feature.bridges.length} bridges, not scraping`,
                        body: "Each surface has a register<Surface>Bridge(server, { adapter }) that turns the host's own getters and setters into MCP tools: forms, sheets, flow, whiteboard, slides, terminal, git, maps, the CMS and the rest. The agent changes the same controlled state the person's clicks change.",
                    },
                    {
                        // src/presence/wrap-tool-with-activity.ts; fancy-auto-common and fancy-screens taglines
                        icon: "eye",
                        title: "Presence and activity",
                        body: "Bridge mutations go through wrapToolWithActivity, which broadcasts an AgentActivity event naming what was touched, so presence, highlighting and coaching layers compose for free. fancy-auto-common holds those shared primitives; fancy-screens carries an agent's presence across screens.",
                    },
                    {
                        // src/undo/undo-tools.ts: agent_undo, agent_redo, agent_history
                        icon: "undo-2",
                        title: "Undo, per agent",
                        body: "Every bridge installs agent_undo, agent_redo and agent_history. Each agent has its own stack, so undoing an agent's change never takes back the person's.",
                    },
                    {
                        // pendingMode / stagePolicy / onPending across src/bridges; git, terminal, passkeys bridges
                        icon: "hand",
                        title: "Propose, then confirm",
                        body: "Destructive or human-visible writes can be staged instead of applied: pendingMode on the reaction, form and terminal bridges (terminal_confirm, terminal_reject), proposal-first writes on the git bridge, staging on the CMS bridge. The passkeys bridge can only propose a revoke, and no tool completes a sign-in ceremony.",
                    },
                    {
                        // src/bridges/navigation.ts (page_*, nav_*); data-agent-off-limits
                        icon: "mouse-pointer-2",
                        title: "Co-browse the app itself",
                        body: "The navigation bridge lets an agent read, focus, click and navigate the running app through page_* and nav_* tools. It refuses every action inside a region marked data-agent-off-limits, such as a consent banner.",
                    },
                    {
                        // src/mcp/transports/relay.ts; fancy-cf-relay and mcp-relay-client taglines
                        icon: "radio-tower",
                        title: "Reach from outside the page",
                        body: "A relay transport carries MCP frames between the browser and an agent anywhere. fancy-cf-relay keeps that channel alive behind a CDN by switching between SSE and long-poll, and mcp-relay-client is a single-file client in bash, Python, TypeScript and Go.",
                    },
                    {
                        // fancy-diff tagline + README
                        icon: "git-compare",
                        title: "Review what an agent changed",
                        body: "fancy-diff shows a document diff side by side with per-hunk accept and reject, so a person takes an agent's edit one hunk at a time.",
                    },
                ]}
            />

            <section id="on-the-fly" className="feature-section hp-anchor">
                <Heading as="h2" size="lg" weight="semibold" className="feature-display">
                    On-The-Fly UI
                </Heading>
                <Text as="p" color="muted" className="feature-section__intro">
                    The CMS builds pages by configuration rather than code, which is what lets an agent build UI while the app runs:
                    it edits data, and the renderer shows the result.
                </Text>
                <Grid cols={3} gap="md" className="feature-section__grid">
                    {ON_THE_FLY.map((item) => (
                        <Card key={item.title} variant="outlined" className="hp-fly" data-hp-fly={item.icon}>
                            <Card.Header>
                                <span className="hp-fly__head">
                                    <Icon name={item.icon} size="sm" />
                                    <Heading as="h3" size="sm" weight="semibold">
                                        {item.title}
                                    </Heading>
                                </span>
                            </Card.Header>
                            <Card.Body>
                                <Text as="p" size="sm" color="muted">
                                    {item.body}
                                </Text>
                            </Card.Body>
                        </Card>
                    ))}
                </Grid>
                <div className="hp-fly__links">
                    <Badge variant="soft">fancy-cms</Badge>
                    <Badge variant="soft">fancy-cms-ui</Badge>
                    <Badge variant="soft">charlotte</Badge>
                    <Button as={Link} href="/features/cms" variant="ghost" iconTrailing="arrow-right" className="hp-tap">
                        Edit a page live on the CMS feature
                    </Button>
                </div>
            </section>

            <HowItFits
                members={feature.members}
                bridges={feature.bridges}
                title="Every bridge, and the packages around them"
                intro="agent-integrations is the MCP server, the bridges, presence and the relay; the other packages are the shared primitives, transports, review and page-building surfaces that sit on it."
            />
            <InstallSteps members={feature.members} versions={versions} intro="Start with agent-integrations and the bridge for your surface; add the rest as you need them." />
            <PackagesGrid members={feature.members} versions={versions} />

            <FeatureCta
                title="Make your surface one an agent can share"
                body="Read why Human+ works this way, then the engineering half: controlled state, stable handles, a bridge and activity events."
                primary={{ label: "The Human+ whitepaper", href: "/docs/human-plus-ux" }}
                secondary={{ label: "Developing for Human+", href: "/docs/developing-human-plus" }}
            />
        </FeatureShell>
    );
}
