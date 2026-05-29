import { Head, Link } from "@inertiajs/react";
import { useState } from "react";
import {
    Action,
    Badge,
    Card,
    Field,
    Input,
    Tabs,
    Toast,
    useToast,
} from "@particle-academy/react-fancy";
import {
    Terminal,
    ArrowRight,
    Package,
    Zap,
    Layers,
    BookOpen,
    Github,
    MousePointerClick,
    TextCursorInput,
    Tag,
    RectangleHorizontal,
    Bell,
    LayoutPanelTop,
    Check,
    Sparkles,
    Link as LinkIcon,
    Info,
    Search,
    Boxes,
    Cpu,
    Radio,
} from "@particle-academy/react-fancy/icons";
import { Layout } from "./Layout";

// ─── Props ───────────────────────────────────────────────────────────────────

type PackageRow = {
    slug: string;
    name: string;
    tagline: string;
    language: string;
    components_count: number;
    glyph: string;
    install: string;
    kind: "npm" | "composer";
};

type CompanionRow = {
    slug: string;
    name: string;
    tagline: string;
    composer: string;
    language: string;
};

type HomeProps = {
    packages: PackageRow[];
    companions: CompanionRow[];
    total_components: number;
};

// Spell small counts for the editorial section title; fall back to the digits.
const NUMBER_WORDS: Record<number, string> = {
    10: "Ten",
    11: "Eleven",
    12: "Twelve",
    13: "Thirteen",
    14: "Fourteen",
    15: "Fifteen",
    16: "Sixteen",
    17: "Seventeen",
    18: "Eighteen",
};

// react-fancy Badge supports a narrower palette than ActionColor; map tags.
type BadgeColor = "zinc" | "red" | "blue" | "green" | "amber" | "violet" | "rose";

function langTag(language: string): { label: string; color: BadgeColor } {
    if (language === "PHP" || language === "PHP/Blade") {
        return { label: "php", color: "violet" };
    }
    return { label: "typescript", color: "blue" };
}

export default function Home({ packages, companions, total_components }: HomeProps) {
    return (
        <Toast.Provider position="bottom-right">
            <Layout>
                <Head title="Fancy UI · Components for Human+ UX" />
                <Hero packages={packages} />
                <Packages packages={packages} companions={companions} />
                <HumanPlus />
                <ComponentsShowcase total={total_components} />
                <Philosophy />
                <Install />
                <Explore />
            </Layout>
        </Toast.Provider>
    );
}

// ─── Hero ──────────────────────────────────────────────────────────────────

function Hero({ packages }: { packages: PackageRow[] }) {
    return (
        <section className="hero">
            <div className="container hero-grid">
                <div>
                    <div className="eyebrow-row">
                        <span className="dot" />
                        <span>v0.x · Particle Academy</span>
                    </div>
                    <h1 className="display">
                        Components for the surfaces where{" "}
                        <span className="gradient-text">humans and agents work together</span>.
                    </h1>
                    <p className="lede">
                        Fancy UI is a constellation of small React and PHP packages built on one
                        premise: agents are first-class participants in the products they help
                        build. Every interactive surface ships an MCP bridge, so an embedded agent
                        drives it through stable handles — never DOM scraping, never Playwright.
                    </p>
                    <div className="hero-cta">
                        <Link className="btn btn-primary" href="/docs">
                            <Terminal size={15} />
                            Install the kit
                        </Link>
                        <Link className="btn btn-ghost" href="/agent-playground">
                            See Human+ in action
                            <ArrowRight size={15} />
                        </Link>
                    </div>
                    <div className="hero-meta">
                        <span className="meta-item">
                            <Package size={13} /> {packages.length} packages
                        </span>
                        <span className="meta-item">
                            <Github size={13} /> MIT licensed
                        </span>
                        <span className="meta-item">
                            <Zap size={13} /> <code>tailwindcss &gt;= 4</code>
                        </span>
                        <span className="meta-item">
                            <Layers size={13} /> React 19 · PHP 8.4
                        </span>
                    </div>
                </div>

                <HeroCard />
            </div>
        </section>
    );
}

function HeroCard() {
    return (
        <div className="hero-card">
            <div className="hero-card-bar">
                <div className="dotrow">
                    <i />
                    <i />
                    <i />
                </div>
                <span style={{ flex: 1 }}>resources/js/Pages/DesignReview.tsx</span>
                <span>UTF-8 · TSX</span>
            </div>
            <div
                className="codeblock"
                dangerouslySetInnerHTML={{
                    __html: `<span class="tok-c">// One surface. Two participants.</span>
<span class="tok-k">import</span> { ArtBoard, ArtPiece } <span class="tok-k">from</span> <span class="tok-s">"@particle-academy/fancy-artboard"</span>;
<span class="tok-k">import</span> { registerArtboardBridge } <span class="tok-k">from</span> <span class="tok-s">"@particle-academy/agent-integrations"</span>;

<span class="tok-k">export default function</span> <span class="tok-t">DesignReview</span>() {
  <span class="tok-k">const</span> [board, setBoard] = <span class="tok-n">useState</span>(initialBoard);
  <span class="tok-k">return</span> (
    &lt;<span class="tok-t">ArtBoard</span> <span class="tok-a">value</span>={board} <span class="tok-a">onChange</span>={setBoard}&gt;
      &lt;<span class="tok-t">ArtPiece</span> <span class="tok-a">id</span>=<span class="tok-s">"hero-v3"</span> <span class="tok-a">kind</span>=<span class="tok-s">"jsx"</span> /&gt;
    &lt;/<span class="tok-t">ArtBoard</span>&gt;
  );
}`,
                }}
            />
            <div
                style={{
                    padding: "12px 14px",
                    borderTop: "1px solid var(--border-1)",
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    fontSize: 12,
                    background: "var(--bg-1)",
                }}
            >
                <span
                    style={{
                        width: 6,
                        height: 6,
                        borderRadius: 999,
                        background: "var(--emerald-500)",
                        boxShadow: "0 0 0 3px color-mix(in oklch, var(--emerald-500) 22%, transparent)",
                    }}
                />
                <span style={{ fontFamily: "var(--font-mono)", color: "var(--fg-3)" }}>agent · fancy-ui.mcp</span>
                <span style={{ color: "var(--fg-2)", flex: 1, textAlign: "right", fontFamily: "var(--font-mono)" }}>
                    artboard_add_piece ✓
                </span>
            </div>
        </div>
    );
}

// ─── Packages ────────────────────────────────────────────────────────────────

function Packages({ packages, companions }: { packages: PackageRow[]; companions: CompanionRow[] }) {
    const count = NUMBER_WORDS[packages.length] ?? String(packages.length);
    return (
        <section className="section">
            <div className="container">
                <div className="eyebrow-row">
                    <span>The family</span>
                </div>
                <h2 className="section-title">{count} small packages. Lift any one out.</h2>
                <p className="section-sub">
                    Fancy UI is not a monolith. Each layer ships independently to npm or Packagist
                    and composes with the rest. Pick the ones you need — most apps reach for two or
                    three.
                </p>
                <div className="pkg-grid">
                    {packages.map((p) => {
                        const tag = langTag(p.language);
                        return (
                            <Link key={p.slug} href={`/packages/${p.slug}`} className="pkg-card">
                                <div className="pkg-head">
                                    <span className="pkg-glyph">{p.glyph}</span>
                                    <span className="pkg-name">{p.name}</span>
                                    <span className="pkg-ver">
                                        {p.components_count} comp{p.components_count === 1 ? "" : "s"}
                                    </span>
                                </div>
                                <div className="pkg-desc">{p.tagline}</div>
                                <div className="pkg-tags">
                                    <span className="pkg-tag">{tag.label}</span>
                                    <span className="pkg-tag">{p.kind}</span>
                                </div>
                            </Link>
                        );
                    })}
                </div>

                <div
                    style={{
                        marginTop: 22,
                        paddingTop: 18,
                        borderTop: "1px dashed var(--border-1)",
                        display: "flex",
                        flexWrap: "wrap",
                        alignItems: "baseline",
                        gap: 12,
                        fontSize: 12.5,
                        color: "var(--fg-3)",
                    }}
                >
                    <span style={{ fontFamily: "var(--font-mono)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                        + Composer companions
                    </span>
                    {companions.map((c, i) => (
                        <span key={c.slug} style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                            <a
                                href={`https://packagist.org/packages/${c.composer}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{ fontFamily: "var(--font-mono)", color: "var(--fg-2)", textDecoration: "none" }}
                                title={c.tagline}
                            >
                                {c.composer}
                            </a>
                            {i < companions.length - 1 && <span style={{ color: "var(--fg-4)" }}>·</span>}
                        </span>
                    ))}
                </div>
            </div>
        </section>
    );
}

// ─── Human+ teaser ─────────────────────────────────────────────────────────

function HumanPlus() {
    return (
        <section className="section" id="human-plus">
            <div className="container">
                <div className="eyebrow-row">
                    <span className="dot" />
                    <span>Human+ · live</span>
                </div>
                <h2 className="section-title">Watch an agent work in the surface, not behind it.</h2>
                <p className="section-sub">
                    The Human+ thesis is sharpest across agent-integrations, fancy-whiteboard, and
                    fancy-artboard. When an agent moves a sticky, you see the cursor, the label, and
                    the activity row — three signals that something real happened.
                </p>

                <div className="demo-shell">
                    <div className="demo-board">
                        <div className="demo-toolbar">
                            <button className="tool-btn active" aria-label="Select">
                                <MousePointerClick size={15} />
                            </button>
                            <span className="tool-sep" />
                            <button className="tool-btn" aria-label="Sticky">
                                <RectangleHorizontal size={15} />
                            </button>
                            <button className="tool-btn" aria-label="Connect">
                                <LinkIcon size={15} />
                            </button>
                            <div className="tool-presence">
                                <span className="presence-chip">
                                    <span className="av" style={{ background: "linear-gradient(135deg,#a78bfa,#38bdf8)" }}>
                                        GB
                                    </span>
                                    you
                                </span>
                                <span className="presence-chip">
                                    <span
                                        className="av"
                                        style={{ background: "linear-gradient(135deg,#7c3aed,#c026d3)", fontFamily: "var(--font-mono)" }}
                                    >
                                        AI
                                    </span>
                                    claude
                                </span>
                            </div>
                        </div>

                        <div className="sticky color-amber" style={{ top: 86, left: 36 }}>
                            Cut the second CTA — it competes with the primary.
                            <div className="who">
                                <span className="pin" /> you · 12:04
                            </div>
                        </div>
                        <div className="sticky color-violet highlight" style={{ top: 150, left: 230 }}>
                            Proposing a tighter hero grid. Confirm to apply?
                            <div className="who">
                                <span className="pin" /> claude · now
                            </div>
                        </div>
                        <div className="sticky color-sky" style={{ top: 286, left: 96 }}>
                            Brand gradient reads well in dark mode.
                            <div className="who">
                                <span className="pin" /> you · 12:01
                            </div>
                        </div>

                        <div className="agent-cursor" style={{ top: 138, left: 214 }}>
                            <svg viewBox="0 0 24 24">
                                <path
                                    d="M4 2l7 18 2.5-7.5L21 10z"
                                    fill="var(--violet-500)"
                                    stroke="#fff"
                                    strokeWidth="1.2"
                                />
                            </svg>
                            <span className="label">
                                <span className="dot" /> claude
                            </span>
                        </div>
                    </div>

                    <div className="activity">
                        <div className="activity-head">
                            <div className="title">
                                <span className="av">AI</span> Agent activity
                            </div>
                            <div className="sub">fancy-artboard · 7 tool calls this session</div>
                        </div>
                        <div className="activity-list">
                            <div className="activity-row fresh">
                                <span className="ico tool">
                                    <Sparkles size={11} />
                                </span>
                                <span>
                                    Proposed <strong>hero grid</strong> rework — awaiting confirm
                                </span>
                                <span className="when">now</span>
                            </div>
                            <div className="activity-row">
                                <span className="ico write">
                                    <Check size={11} />
                                </span>
                                <span>
                                    Added note <strong>tighter hero grid</strong>
                                </span>
                                <span className="when">0:03</span>
                            </div>
                            <div className="activity-row">
                                <span className="ico move">
                                    <ArrowRight size={11} />
                                </span>
                                <span>Moved 2 pieces into the Hero section</span>
                                <span className="when">0:11</span>
                            </div>
                            <div className="activity-row">
                                <span className="ico read">
                                    <Search size={11} />
                                </span>
                                <span>
                                    Read board <strong>state</strong> (3 sections)
                                </span>
                                <span className="when">0:18</span>
                            </div>
                        </div>
                        <div className="activity-foot">
                            <span className="mcp">artboard_*</span>
                            via micro-MCP server
                        </div>
                    </div>
                </div>

                <div style={{ marginTop: 28, display: "flex", gap: 10, flexWrap: "wrap" }}>
                    <Link className="btn btn-primary" href="/agent-playground">
                        <Radio size={15} />
                        Open the Agent Playground
                    </Link>
                    <a className="btn btn-ghost" href="/docs/human-plus-ux">
                        Read the whitepaper
                        <ArrowRight size={15} />
                    </a>
                </div>
            </div>
        </section>
    );
}

// ─── Components showcase ──────────────────────────────────────────────────────

const SHOWCASE = [
    { id: "action", label: "Action", icon: MousePointerClick, num: 1, blurb: "The workhorse button. Ten Tailwind colors, ghost / circle variants, loading + disabled states, optional icon and badge." },
    { id: "field", label: "Field", icon: TextCursorInput, num: 2, blurb: "Form field stack — label, description, error, and a focus-ringed Input. Controlled with value + onChange." },
    { id: "badge", label: "Badge", icon: Tag, num: 3, blurb: "Soft / solid / outline pill with an optional status dot. Signal, not decoration." },
    { id: "card", label: "Card", icon: RectangleHorizontal, num: 4, blurb: "Border + surface with compound Header / Body / Footer slots separated by inner borders." },
    { id: "tabs", label: "Tabs", icon: LayoutPanelTop, num: 5, blurb: "Underlined tabs with controlled active state. The active tint matches the accent." },
    { id: "toast", label: "Toast", icon: Bell, num: 6, blurb: "Portal-mounted toasts fired imperatively via useToast(). Four intents." },
] as const;

type ShowcaseId = (typeof SHOWCASE)[number]["id"];

function ComponentsShowcase({ total }: { total: number }) {
    const [tab, setTab] = useState<ShowcaseId>("action");
    const current = SHOWCASE.find((s) => s.id === tab)!;

    return (
        <section className="section" id="components">
            <div className="container">
                <div className="eyebrow-row">
                    <span>Components</span>
                </div>
                <h2 className="section-title">Real renders. Hover, click, type.</h2>
                <p className="section-sub">
                    A live subset of{" "}
                    <code style={{ fontFamily: "var(--font-mono)" }}>@particle-academy/react-fancy</code>, running
                    here in your browser — {total}+ components across the suite. Click a name on the
                    left to switch.
                </p>

                <div className="showcase">
                    <div className="showcase-nav">
                        <div className="head">Primitives</div>
                        {SHOWCASE.map((s) => {
                            const Ico = s.icon;
                            return (
                                <div
                                    key={s.id}
                                    className={`item ${tab === s.id ? "active" : ""}`}
                                    onClick={() => setTab(s.id)}
                                >
                                    <Ico size={15} />
                                    <span>{s.label}</span>
                                    <span className="num">{String(s.num).padStart(2, "0")}</span>
                                </div>
                            );
                        })}
                    </div>
                    <div className="showcase-stage">
                        <div className="top">
                            <div>
                                <h3>{current.label}</h3>
                                <p className="blurb">{current.blurb}</p>
                            </div>
                            <div className="meta">{`<${current.label} />`}</div>
                        </div>
                        <div className="stage-body">
                            <ShowcaseStage tab={tab} />
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}

function ShowcaseStage({ tab }: { tab: ShowcaseId }) {
    const [name, setName] = useState("");
    const [hook, setHook] = useState("");
    const { toast } = useToast();

    if (tab === "action") {
        return (
            <>
                <div className="stage-row">
                    <span className="row-label">Color</span>
                    <Action color="blue" icon="plus">Create</Action>
                    <Action color="emerald" icon="check">Approve</Action>
                    <Action color="amber" icon="triangle-alert">Warning</Action>
                    <Action color="red" icon="trash-2">Delete</Action>
                    <Action color="violet" icon="sparkles">Generate</Action>
                    <Action color="indigo" icon="link">Connect</Action>
                </div>
                <div className="stage-row">
                    <span className="row-label">Ghost · circle · sizes</span>
                    <Action variant="ghost" icon="search">Search</Action>
                    <Action variant="ghost" color="blue" icon="filter">Filter</Action>
                    <Action variant="circle" icon="bell" aria-label="Notifications" />
                    <Action variant="circle" color="violet" icon="sparkles" aria-label="Generate" />
                    <Action size="sm" color="blue">Small</Action>
                    <Action size="lg" color="blue" icon="play">Large</Action>
                </div>
                <div className="stage-row">
                    <span className="row-label">State · loading · disabled · badge</span>
                    <Action color="blue" loading>Saving…</Action>
                    <Action color="blue" disabled>Disabled</Action>
                    <Action color="blue" icon="inbox" badge="12">Inbox</Action>
                    <Action active icon="check-check">Active</Action>
                    <Action checked icon="check">Checked</Action>
                </div>
            </>
        );
    }

    if (tab === "field") {
        return (
            <div className="stage-row col" style={{ maxWidth: 480 }}>
                <Field label="Project name" description="Lowercase, no spaces.">
                    <Input
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="onboarding-refresh"
                        leading={<Search size={15} />}
                    />
                </Field>
                <Field label="Webhook URL" error={hook === "fail" ? "Not reachable from our agents." : undefined}>
                    <Input
                        value={hook}
                        onChange={(e) => setHook(e.target.value)}
                        placeholder="https://"
                        leading={<LinkIcon size={15} />}
                    />
                </Field>
            </div>
        );
    }

    if (tab === "badge") {
        return (
            <>
                <div className="stage-row">
                    <span className="row-label">Soft · dot</span>
                    <Badge color="green" dot>Running</Badge>
                    <Badge color="amber" dot>Queued</Badge>
                    <Badge color="blue" dot>Done</Badge>
                    <Badge color="rose" dot>Error</Badge>
                    <Badge color="violet">Beta</Badge>
                    <Badge color="zinc">Draft</Badge>
                </div>
                <div className="stage-row">
                    <span className="row-label">Solid · outline</span>
                    <Badge color="blue" variant="solid">solid</Badge>
                    <Badge color="green" variant="solid">live</Badge>
                    <Badge variant="outline">outline</Badge>
                    <Badge color="violet" variant="outline">outline</Badge>
                </div>
            </>
        );
    }

    if (tab === "card") {
        return (
            <div className="stage-row col" style={{ background: "transparent", border: "none", padding: 0 }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                    <Card>
                        <Card.Header>Active sessions</Card.Header>
                        <Card.Body>
                            <div style={{ fontSize: 28, fontWeight: 600, letterSpacing: "-0.02em", lineHeight: 1 }}>128</div>
                            <div style={{ fontSize: 12, color: "var(--emerald-600)", marginTop: 4, fontWeight: 500 }}>
                                ▲ 12% this week
                            </div>
                        </Card.Body>
                        <Card.Footer>Updated 2 minutes ago</Card.Footer>
                    </Card>
                    <Card>
                        <Card.Header>
                            <Badge color="green" dot>Live</Badge>
                        </Card.Header>
                        <Card.Body>
                            <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 4 }}>Q4 design review</div>
                            <div style={{ fontSize: 12.5, color: "var(--fg-3)" }}>
                                Claude is editing this board. 7 tool calls so far.
                            </div>
                        </Card.Body>
                        <Card.Footer>
                            <span style={{ fontFamily: "var(--font-mono)" }}>fancy-artboard:7</span>
                        </Card.Footer>
                    </Card>
                </div>
            </div>
        );
    }

    if (tab === "tabs") {
        return (
            <div className="stage-row col">
                <Tabs defaultTab="overview">
                    <Tabs.List>
                        <Tabs.Tab value="overview">Overview</Tabs.Tab>
                        <Tabs.Tab value="sessions">Sessions</Tabs.Tab>
                        <Tabs.Tab value="agents">Agents</Tabs.Tab>
                        <Tabs.Tab value="usage">Usage</Tabs.Tab>
                    </Tabs.List>
                    <Tabs.Panels>
                        <Tabs.Panel value="overview">
                            <div style={{ paddingTop: 10, fontSize: 13, color: "var(--fg-3)" }}>
                                Controlled tabs — the active tint matches the primary accent, and the underline
                                animates on the bottom border.
                            </div>
                        </Tabs.Panel>
                        <Tabs.Panel value="sessions">
                            <div style={{ paddingTop: 10, fontSize: 13, color: "var(--fg-3)" }}>
                                Three sessions running. Two have an agent attached.
                            </div>
                        </Tabs.Panel>
                        <Tabs.Panel value="agents">
                            <div style={{ paddingTop: 10, fontSize: 13, color: "var(--fg-3)" }}>
                                Each agent gets a panel, an on-canvas cursor, and an activity feed.
                            </div>
                        </Tabs.Panel>
                        <Tabs.Panel value="usage">
                            <div style={{ paddingTop: 10, fontSize: 13, color: "var(--fg-3)" }}>
                                14.2k tool calls this month across all bridges.
                            </div>
                        </Tabs.Panel>
                    </Tabs.Panels>
                </Tabs>
            </div>
        );
    }

    // toast
    return (
        <div className="stage-row">
            <span className="row-label">Fire one</span>
            <Action
                color="blue"
                icon="info"
                onClick={() => toast({ variant: "info", title: "Heads up", description: "Your build finished." })}
            >
                Info
            </Action>
            <Action
                color="emerald"
                icon="check"
                onClick={() => toast({ variant: "success", title: "Project created", description: "Q4 review is ready." })}
            >
                Success
            </Action>
            <Action
                color="amber"
                icon="triangle-alert"
                onClick={() => toast({ variant: "warning", title: "Quota at 80%", description: "Consider upgrading." })}
            >
                Warning
            </Action>
            <Action
                color="red"
                icon="x-circle"
                onClick={() => toast({ variant: "error", title: "Tool failed", description: "artboard_add_piece returned 500." })}
            >
                Danger
            </Action>
        </div>
    );
}

// ─── Philosophy ───────────────────────────────────────────────────────────────

const PHILOSOPHY = [
    {
        num: "01",
        title: "Controlled, not captive",
        body: "Anything an agent might read or write lives in value + onChange — no internal-only state. State is the contract; the UI just renders it.",
        pills: ["value", "onChange", "json-friendly"],
    },
    {
        num: "02",
        title: "Agents are participants",
        body: "Every interactive surface exposes a register<Surface>Bridge that maps stable handles to MCP tools. Agents drive the component itself, not a DOM scrape of it.",
        pills: ["mcp", "stable handles", "presence"],
    },
    {
        num: "03",
        title: "Transport-agnostic",
        body: "The kit ships zero networking. Your app wires the realtime + relay layer; mutations broadcast AgentActivity so presence, undo, and coaching compose for free.",
        pills: ["relay", "AgentActivity", "undo"],
    },
] as const;

function Philosophy() {
    return (
        <section className="section" id="why">
            <div className="container">
                <div className="eyebrow-row">
                    <span>The Human+ contract</span>
                </div>
                <h2 className="section-title">Three rules every component lives by.</h2>
                <p className="section-sub">
                    Purely visual primitives owe only a great authoring surface. Anything stateful or
                    interactive owes both — authorable and inhabitable.
                </p>
                <div className="philos-grid">
                    {PHILOSOPHY.map((it) => (
                        <div className="philos" key={it.num}>
                            <span className="num">{it.num}</span>
                            <h4>{it.title}</h4>
                            <p>{it.body}</p>
                            <div className="pill-row">
                                {it.pills.map((p) => (
                                    <span className="pill" key={p}>
                                        {p}
                                    </span>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}

// ─── Install ──────────────────────────────────────────────────────────────────

const INSTALL_BLOCKS: Record<"npm" | "pnpm" | "composer", string> = {
    npm: `<span class="tok-c"># Install the core component library</span>
<span class="tok-p">$</span> npm install <span class="tok-s">@particle-academy/react-fancy</span>

<span class="tok-c"># Add only what you need</span>
<span class="tok-p">$</span> npm install <span class="tok-s">@particle-academy/fancy-artboard</span> <span class="tok-s">@particle-academy/agent-integrations</span>`,
    pnpm: `<span class="tok-p">$</span> pnpm add <span class="tok-s">@particle-academy/react-fancy</span>
<span class="tok-p">$</span> pnpm add <span class="tok-s">@particle-academy/fancy-artboard</span> <span class="tok-s">@particle-academy/agent-integrations</span>`,
    composer: `<span class="tok-c"># PHP / Laravel — the document writers + Inertia bridge</span>
<span class="tok-p">$</span> composer require <span class="tok-s">particle-academy/holy-sheet</span>
<span class="tok-p">$</span> composer require <span class="tok-s">particle-academy/dark-slide</span>`,
};

function Install() {
    const [tab, setTab] = useState<keyof typeof INSTALL_BLOCKS>("npm");
    return (
        <section className="section" id="install">
            <div className="container install">
                <div>
                    <div className="eyebrow-row">
                        <span>Quick start</span>
                    </div>
                    <h2 className="section-title">Bring it in piecemeal.</h2>
                    <p className="section-sub">
                        Every JS package ships TypeScript types, a single peer dep on Tailwind v4, and
                        a Vite-friendly ESM build. PHP packages are framework-agnostic with an optional
                        Laravel adapter.
                    </p>
                    <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
                        <Link className="btn btn-primary" href="/docs">
                            <BookOpen size={15} />
                            Read the docs
                        </Link>
                        <a
                            className="btn btn-ghost"
                            href="https://github.com/Particle-Academy"
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            <Github size={15} />
                            View on GitHub
                        </a>
                    </div>
                </div>
                <div className="install-card">
                    <div className="install-tabs">
                        {(["npm", "pnpm", "composer"] as const).map((k) => (
                            <button
                                key={k}
                                className={`install-tab ${tab === k ? "active" : ""}`}
                                onClick={() => setTab(k)}
                            >
                                {k}
                            </button>
                        ))}
                    </div>
                    <div className="codeblock" dangerouslySetInnerHTML={{ __html: INSTALL_BLOCKS[tab] }} />
                    <div
                        style={{
                            padding: "10px 14px",
                            borderTop: "1px solid var(--border-1)",
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                            fontSize: 11.5,
                            color: "var(--fg-3)",
                            background: "var(--bg-1)",
                            fontFamily: "var(--font-mono)",
                        }}
                    >
                        <Info size={12} />
                        Requires Node 18+, React 19, Tailwind 4.
                    </div>
                </div>
            </div>
        </section>
    );
}

// ─── Explore strip ─────────────────────────────────────────────────────────

const EXPLORE = [
    {
        href: "/starter-kits",
        icon: Boxes,
        title: "Starter Kits",
        body: "Vertical demos — clone, study, adapt.",
        tag: "templates",
    },
    {
        href: "/dreaming",
        icon: Sparkles,
        title: "Dreaming",
        body: "Speculative components you can vote on.",
        tag: "speculative",
    },
    {
        href: "/showcase",
        icon: Cpu,
        title: "Designer Showcase",
        body: "Sites and repos built with Fancy UI.",
        tag: "community",
    },
    {
        href: "/leaderboard",
        icon: ArrowRight,
        title: "Leaderboard",
        body: "Top contributors by merged PRs and votes.",
        tag: "live",
    },
] as const;

function Explore() {
    return (
        <section className="section">
            <div className="container">
                <div className="eyebrow-row">
                    <span>Explore the site</span>
                </div>
                <h2 className="section-title">More to poke at.</h2>
                <div className="pkg-grid" style={{ marginTop: 28 }}>
                    {EXPLORE.map((e) => {
                        const Ico = e.icon;
                        return (
                            <Link key={e.href} href={e.href} className="pkg-card">
                                <div className="pkg-head">
                                    <span className="pkg-glyph">
                                        <Ico size={16} />
                                    </span>
                                    <span className="pkg-name">{e.title}</span>
                                    <span className="pkg-ver">{e.tag}</span>
                                </div>
                                <div className="pkg-desc">{e.body}</div>
                            </Link>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}
