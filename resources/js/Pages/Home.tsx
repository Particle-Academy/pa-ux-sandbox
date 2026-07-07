import { Link } from "@inertiajs/react";
import { Seo } from "@particle-academy/fancy-inertia/seo";
import { Component, useEffect, useState, type ComponentType, type ErrorInfo, type ReactNode } from "react";
import {
    Button,
    FauxClient,
    Autocomplete,
    Avatar,
    Badge,
    Breadcrumbs,
    Callout,
    Card,
    Checkbox,
    CheckboxGroup,
    Field,
    Input,
    Marquee,
    MultiSwitch,
    OtpInput,
    Pagination,
    Pillbox,
    Profile,
    Progress,
    RadioGroup,
    Select,
    Separator,
    Skeleton,
    Slider,
    StickyNote,
    Switch,
    Table,
    Tabs,
    Textarea,
    Toast,
    Tooltip,
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
    Check,
    Sparkles,
    Link as LinkIcon,
    Search,
    Boxes,
    Cpu,
    Radio,
    RectangleHorizontal,
} from "lucide-react";
import { Layout } from "./Layout";

// ─── Props ───────────────────────────────────────────────────────────────────

export type PackageRow = {
    slug: string;
    name: string;
    tagline: string;
    language: string;
    components_count: number;
    glyph: string;
    install: string;
    kind: "npm" | "composer";
};

export type CompanionRow = {
    slug: string;
    name: string;
    tagline: string;
    composer: string | null;
    npm?: string | null;
    language: string;
};

type HomeProps = {
    packages: PackageRow[];
    companions: CompanionRow[];
    total_components: number;
};

// Spell small counts for the editorial section title; fall back to the digits.
const NUMBER_WORDS: Record<number, string> = {
    9: "Nine",
    10: "Ten",
    11: "Eleven",
    12: "Twelve",
    13: "Thirteen",
    14: "Fourteen",
    15: "Fifteen",
    16: "Sixteen",
};

// react-fancy Badge supports a narrower palette than ButtonColor; map tags.
type BadgeColor = "zinc" | "red" | "blue" | "green" | "amber" | "violet" | "rose";

export function langTag(language: string): { label: string; color: BadgeColor } {
    if (language === "PHP" || language === "PHP/Blade") {
        return { label: "php", color: "violet" };
    }
    return { label: "typescript", color: "blue" };
}

export default function Home({ packages, companions, total_components }: HomeProps) {
    return (
        <Toast.Provider position="bottom-right">
            <Layout bleed>
                {/* <Seo> (client-only via provider) — single source for the head.
                    A raw <Head title> here would duplicate the fancy-seo Blade
                    baseline's <title> under SSR. <Seo/> with no title uses the
                    provider defaultTitle, which matches the home baseline. */}
                <Seo />
                <Hero packages={packages} />
                <PackageTicker packages={packages} />
                <Packages packages={packages} companions={companions} />
                <HumanPlus />
                <ComponentsShowcase total={total_components} />
                <Philosophy />
                <QuickStart />
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
                        <span>v0.4 · #BYOA</span>
                    </div>
                    <h1 className="display">
                        Bring your own agent. <span className="gradient-text">Bring your own stack.</span>
                    </h1>
                    <p className="lede">
                        Full-stack and polyglot: a React UI up front, server-side packages for both PHP and
                        Node behind it. Every surface ships an MCP bridge, so any agent — yours, not ours —
                        drives the live UI through stable handles. No DOM scraping, no lock-in.
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
                            <Package size={13} />{` ${packages.length} UI packages`}
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

// ─── Package ticker ──────────────────────────────────────────────────────────

/**
 * Edge-to-edge marquee bridging the hero into "The family" — the suite's real
 * package names (the same server-driven `packages` prop the grid below renders)
 * streaming past like a logo wall. Decorative by default (react-fancy Marquee
 * is aria-hidden and static under prefers-reduced-motion); every name is fully
 * readable + linked in the grid one scroll below.
 */
function PackageTicker({ packages }: { packages: PackageRow[] }) {
    return (
        <section className="ticker">
            <Marquee
                speed={28}
                gap={44}
                fade={72}
                pauseOnHover
                items={packages.map((p) => p.name)}
                separator={<span className="ticker-sep">✦</span>}
                className="ticker-strip"
            />
        </section>
    );
}

// ─── Packages ────────────────────────────────────────────────────────────────

export function Packages({ packages, companions }: { packages: PackageRow[]; companions: CompanionRow[] }) {
    const count = NUMBER_WORDS[packages.length] ?? String(packages.length);
    return (
        <section className="section">
            <div className="container">
                <div className="eyebrow-row">
                    <span>The family</span>
                </div>
                <h2 className="section-title">{count} small packages. Lift any one out.</h2>
                <p className="section-sub">
                    Not a monolith. Each ships on its own — npm or Packagist — and composes with the
                    rest. Most apps reach for two or three.
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

                <div className="companions">
                    <span className="companions-label">+ Companions</span>
                    <span className="companions-note">
                        Headless packages — the agentic document writers, the sandbox's Laravel infra, and JS utilities (Packagist + npm):
                    </span>
                    {companions.map((c, i) => {
                        const href = c.composer
                            ? `https://packagist.org/packages/${c.composer}`
                            : c.npm
                              ? `https://www.npmjs.com/package/${c.npm}`
                              : `https://github.com/Particle-Academy/${c.slug}`;
                        const label = c.composer ?? c.npm ?? c.name;
                        return (
                            <span key={c.slug} className="companion-item">
                                <a href={href} target="_blank" rel="noopener noreferrer" title={c.tagline}>
                                    {label}
                                </a>
                                {i < companions.length - 1 && <span className="companion-sep">·</span>}
                            </span>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}

// ─── Human+ teaser (animated) ────────────────────────────────────────────────

type FeedRow = { tone: "tool" | "write" | "move" | "read"; icon: ReactNode; text: ReactNode; when: string };

// The script the fake agent "runs" on a loop — drives the cursor, the highlighted
// note, and the streaming activity feed so the teaser reads as genuinely live.
const HP_NOTES = [
    { cls: "color-amber", top: 84, left: 34, who: "you · 12:04", text: "Cut the second CTA — it competes with the primary." },
    { cls: "color-violet", top: 150, left: 232, who: "claude · now", text: "Proposing a tighter hero grid. Confirm to apply?" },
    { cls: "color-sky", top: 286, left: 92, who: "you · 12:01", text: "Brand gradient reads well in dark mode." },
];
// Cursor offset from the note it's "touching" — so the cursor tip always lands
// on the highlighted note (derived from HP_NOTES below, never a separate coord
// list that drifts out of sync).
const HP_CURSOR_OFFSET = { top: 22, left: 52 };
const HP_FEED: FeedRow[] = [
    { tone: "tool", icon: <Sparkles size={11} />, text: <>Proposed <strong>hero grid</strong> rework — awaiting confirm</>, when: "now" },
    { tone: "write", icon: <Check size={11} />, text: <>Added note <strong>tighter hero grid</strong></>, when: "0:03" },
    { tone: "move", icon: <ArrowRight size={11} />, text: <>Moved 2 stickies into the Hero cluster</>, when: "0:11" },
    { tone: "read", icon: <Search size={11} />, text: <>Read board <strong>state</strong> (3 clusters)</>, when: "0:18" },
];

export function HumanPlus() {
    const [step, setStep] = useState(0);

    useEffect(() => {
        const reduce =
            typeof window !== "undefined" &&
            window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
        if (reduce) return;
        const t = setInterval(() => setStep((s) => s + 1), 2400);
        return () => clearInterval(t);
    }, []);

    const liveNote = step % HP_NOTES.length; // which note the agent is "touching"
    // Cursor follows the highlighted note → they always move together (no drift).
    const cursor = {
        top: HP_NOTES[liveNote].top + HP_CURSOR_OFFSET.top,
        left: HP_NOTES[liveNote].left + HP_CURSOR_OFFSET.left,
    };
    // Rotate the feed so a new row streams in at the top each tick.
    const feed = HP_FEED.map((_, i) => HP_FEED[(i + step) % HP_FEED.length]);

    return (
        <section className="section" id="human-plus">
            <div className="container">
                <div className="eyebrow-row">
                    <span className="dot" />
                    <span>Human+ · live</span>
                </div>
                <h2 className="section-title">Watch an agent work in the surface, not behind it.</h2>
                <p className="section-sub">
                    When an agent moves a sticky, you see the cursor, the label, and the activity
                    row — it's driving the real surface, not scraping a copy of it.
                </p>

                {/* A FauxClient frame renders the demo at a fixed logical width and
                    SCALES it to fit any container (ResizeObserver), so the whole
                    board + activity stay visible + proportional on mobile — never
                    clipped/hidden. All UI previews go in a FauxClient. */}
                <FauxClient variant="browser" url="fancy.app · Human+ board" meta="live" width={1120} scale="fit">
                <div className="demo-shell">
                    <div className="demo-board">
                        <div className="demo-toolbar">
                            <button className="tool-btn active" aria-label="Select" type="button">
                                <MousePointerClick size={15} />
                            </button>
                            <span className="tool-sep" />
                            <button className="tool-btn" aria-label="Sticky" type="button">
                                <RectangleHorizontal size={15} />
                            </button>
                            <button className="tool-btn" aria-label="Connect" type="button">
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

                        {HP_NOTES.map((n, i) => (
                            <div
                                key={i}
                                className={`sticky-note ${n.cls}${i === liveNote ? " highlight" : ""}`}
                                style={{ top: n.top, left: n.left }}
                            >
                                {n.text}
                                <div className="who">
                                    <span className="pin" /> {n.who}
                                </div>
                            </div>
                        ))}

                        <div className="agent-cursor" style={{ top: cursor.top, left: cursor.left }}>
                            <svg viewBox="0 0 24 24">
                                <path d="M4 2l7 18 2.5-7.5L21 10z" fill="var(--violet-500)" stroke="#fff" strokeWidth="1.2" />
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
                            <div className="sub">fancy-whiteboard · live tool calls this session</div>
                        </div>
                        <div className="activity-list">
                            {feed.map((row, i) => (
                                <div className={`activity-row${i === 0 ? " fresh" : ""}`} key={`${step}-${i}`}>
                                    <span className={`ico ${row.tone}`}>{row.icon}</span>
                                    <span style={{ flex: 1, minWidth: 0 }}>{row.text}</span>
                                    <span className="when">{i === 0 ? "now" : row.when}</span>
                                </div>
                            ))}
                        </div>
                        <div className="activity-foot">
                            <span className="mcp">whiteboard_*</span>
                            via micro-MCP server
                        </div>
                    </div>
                </div>
                </FauxClient>

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

/** A demo is a small component so it can own its own controlled state. */
type Demo = ComponentType;
type CatalogItem = { name: string; sig: string; blurb: string; demo: Demo };
type CatalogGroup = { group: string; items: CatalogItem[] };

const CATALOG: CatalogGroup[] = [
    {
        group: "Actions & control",
        items: [
            { name: "Button", sig: "<Button />", blurb: "The workhorse button — 18 colors, ghost / circle variants, loading, badge.", demo: ActionDemo },
            { name: "Switch", sig: "<Switch />", blurb: "Controlled on/off toggle with a color accent.", demo: SwitchDemo },
            { name: "MultiSwitch", sig: "<MultiSwitch />", blurb: "Segmented single-choice control.", demo: MultiSwitchDemo },
            { name: "Slider", sig: "<Slider />", blurb: "Single value or a two-handle range, with marks.", demo: SliderDemo },
            { name: "OtpInput", sig: "<OtpInput />", blurb: "One-box-per-digit code entry.", demo: OtpDemo },
        ],
    },
    {
        group: "Text & forms",
        items: [
            { name: "Field + Input", sig: "<Field><Input/></Field>", blurb: "Label, description, error, focus-ringed input.", demo: FieldDemo },
            { name: "Textarea", sig: "<Textarea />", blurb: "Auto-resizing multiline input.", demo: TextareaDemo },
            { name: "Select", sig: "<Select />", blurb: "Native or listbox select from a JSON list.", demo: SelectDemo },
            { name: "Autocomplete", sig: "<Autocomplete />", blurb: "Type-ahead with a filtered option list.", demo: AutocompleteDemo },
            { name: "Pillbox", sig: "<Pillbox />", blurb: "Token / tag entry as a string array.", demo: PillboxDemo },
        ],
    },
    {
        group: "Selection",
        items: [
            { name: "Checkbox", sig: "<Checkbox />", blurb: "Controlled check with indeterminate support.", demo: CheckboxDemo },
            { name: "CheckboxGroup", sig: "<CheckboxGroup />", blurb: "Multi-select bound to an array.", demo: CheckboxGroupDemo },
            { name: "RadioGroup", sig: "<RadioGroup />", blurb: "Single-select bound to one value.", demo: RadioGroupDemo },
        ],
    },
    {
        group: "Feedback & status",
        items: [
            { name: "Badge", sig: "<Badge />", blurb: "Soft / solid / outline pill with a status dot.", demo: BadgeDemo },
            { name: "Callout", sig: "<Callout />", blurb: "Inline banner in five intents, dismissible.", demo: CalloutDemo },
            { name: "Progress", sig: "<Progress />", blurb: "Linear or circular, determinate or not.", demo: ProgressDemo },
            { name: "Skeleton", sig: "<Skeleton />", blurb: "Shimmer placeholders while data loads.", demo: SkeletonDemo },
            { name: "Toast", sig: "useToast()", blurb: "Portal toasts fired imperatively. Four intents.", demo: ToastDemo },
            { name: "Tooltip", sig: "<Tooltip />", blurb: "Hover label on any element, placement-aware.", demo: TooltipDemo },
        ],
    },
    {
        group: "Navigation",
        items: [
            { name: "Tabs", sig: "<Tabs />", blurb: "Underlined tabs with controlled active state.", demo: TabsDemo },
            { name: "Breadcrumbs", sig: "<Breadcrumbs />", blurb: "Trail of links with a custom separator.", demo: BreadcrumbsDemo },
            { name: "Pagination", sig: "<Pagination />", blurb: "Controlled page list with sibling truncation.", demo: PaginationDemo },
        ],
    },
    {
        group: "Data & people",
        items: [
            { name: "Card", sig: "<Card />", blurb: "Header / Body / Footer slots on a surface.", demo: CardDemo },
            { name: "Table", sig: "<Table />", blurb: "Composable rows with expandable trays.", demo: TableDemo },
            { name: "Avatar", sig: "<Avatar />", blurb: "Image or initials with a status ring.", demo: AvatarDemo },
            { name: "Profile", sig: "<Profile />", blurb: "Avatar + name + subtitle row.", demo: ProfileDemo },
            { name: "Separator", sig: "<Separator />", blurb: "Divider with an optional centered label.", demo: SeparatorDemo },
            { name: "StickyNote", sig: "<StickyNote />", blurb: "The shared note primitive — artboard + whiteboard.", demo: StickyNoteDemo },
        ],
    },
];

const FLAT = CATALOG.flatMap((g) => g.items);

// Every other react-fancy primitive — listed so the catalog is complete; each
// links to its full interactive demo on the package page.
const MORE = [
    "Accordion", "AccordionPanel", "Autocomplete", "Brand", "Calendar", "Carousel", "Chart",
    "ChatDrawer", "ColorPicker", "Command", "Composer", "ContentRenderer", "ContextMenu",
    "DatePicker", "Dropdown", "Editor", "Emoji", "EmojiSelect", "FileUpload", "Heading", "Icon",
    "InputTag", "Kanban", "MagicWand", "Menu", "MobileMenu", "Modal", "MoodMeter", "Navbar",
    "Popover", "Portal", "PromptInput", "ReasonTag", "Sidebar", "Text", "TimeGrid", "TimePicker",
    "Timeline", "TreeNav",
];

export function ComponentsShowcase({ total }: { total: number }) {
    const [active, setActive] = useState(FLAT[0].name);
    const current = FLAT.find((c) => c.name === active) ?? FLAT[0];
    const ActiveDemo = current.demo;

    return (
        <section className="section" id="components">
            <div className="container">
                <div className="eyebrow-row">
                    <span>Components</span>
                </div>
                <h2 className="section-title">Real renders. Hover, click, type.</h2>
                <p className="section-sub">
                    The actual{" "}
                    <code style={{ fontFamily: "var(--font-mono)" }}>@particle-academy/react-fancy</code> —{" "}
                    {total}+ primitives, from a button to a full spreadsheet.{" "}
                    {FLAT.length} render live right here; pick any name on the left.
                </p>

                <div className="showcase">
                    <div className="showcase-nav">
                        {CATALOG.map((g) => (
                            <div key={g.group} className="showcase-group">
                                <div className="head">{g.group}</div>
                                {g.items.map((it, idx) => (
                                    <div
                                        key={it.name}
                                        className={`item ${active === it.name ? "active" : ""}`}
                                        onClick={() => setActive(it.name)}
                                    >
                                        <span>{it.name}</span>
                                        <span className="num">{String(FLAT.indexOf(it) + 1).padStart(2, "0")}</span>
                                    </div>
                                ))}
                            </div>
                        ))}
                    </div>
                    <div className="showcase-stage">
                        <div className="top">
                            <div>
                                <h3>{current.name}</h3>
                                <p className="blurb">{current.blurb}</p>
                            </div>
                            <div className="meta">{current.sig}</div>
                        </div>
                        <div className="stage-body">
                            <ShowcaseBoundary resetKey={active}>
                                <ActiveDemo />
                            </ShowcaseBoundary>
                        </div>
                    </div>
                </div>

                <div className="more-lib">
                    <span className="more-label">The complete library</span>
                    <div className="more-chips">
                        {MORE.map((n) => (
                            <Link key={n} href="/packages/react-fancy" className="more-chip">
                                {n}
                            </Link>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}

/** A demo with a bad prop shouldn't blank the homepage — isolate + show a note. */
class ShowcaseBoundary extends Component<
    { resetKey: unknown; children: ReactNode },
    { failed: boolean }
> {
    state = { failed: false };
    static getDerivedStateFromError() {
        return { failed: true };
    }
    componentDidCatch(_err: unknown, _info: ErrorInfo) {
        /* swallow — the fallback is enough; this is a marketing surface */
    }
    componentDidUpdate(prev: { resetKey: unknown }) {
        if (prev.resetKey !== this.props.resetKey && this.state.failed) {
            this.setState({ failed: false });
        }
    }
    render() {
        if (this.state.failed) {
            return (
                <div className="stage-row" style={{ color: "var(--fg-3)" }}>
                    This demo hit a snag rendering. See the live version on the package page.
                </div>
            );
        }
        return this.props.children;
    }
}

// ─── Component demos (real react-fancy, controlled) ──────────────────────────

function ActionDemo() {
    return (
        <>
            <div className="stage-row">
                <span className="row-label">Color</span>
                <Button color="blue" icon="plus">Create</Button>
                <Button color="emerald" icon="check">Approve</Button>
                <Button color="amber" icon="triangle-alert">Warning</Button>
                <Button color="red" icon="trash-2">Delete</Button>
                <Button color="violet" icon="sparkles">Generate</Button>
                <Button color="indigo" icon="link">Connect</Button>
            </div>
            <div className="stage-row">
                <span className="row-label">Ghost · circle · sizes</span>
                <Button variant="ghost" icon="search">Search</Button>
                <Button variant="ghost" color="blue" icon="filter">Filter</Button>
                <Button variant="circle" icon="bell" aria-label="Notifications" />
                <Button variant="circle" color="violet" icon="sparkles" aria-label="Generate" />
                <Button size="sm" color="blue">Small</Button>
                <Button size="lg" color="blue" icon="play">Large</Button>
            </div>
            <div className="stage-row">
                <span className="row-label">State · loading · disabled · badge</span>
                <Button color="blue" loading>Saving…</Button>
                <Button color="blue" disabled>Disabled</Button>
                <Button color="blue" icon="inbox" badge="12">Inbox</Button>
                <Button active icon="check-check">Active</Button>
                <Button checked icon="check">Checked</Button>
            </div>
        </>
    );
}

function SwitchDemo() {
    const [a, setA] = useState(true);
    const [b, setB] = useState(false);
    const [c, setC] = useState(true);
    return (
        <div className="stage-row">
            <Switch checked={a} onCheckedChange={setA} color="violet" label="Agent presence" />
            <Switch checked={b} onCheckedChange={setB} color="blue" label="Email me" />
            <Switch checked={c} onCheckedChange={setC} color="emerald" label="Auto-undo" />
            <Switch checked disabled label="Locked" />
        </div>
    );
}

function MultiSwitchDemo() {
    const [v, setV] = useState("week");
    return (
        <div className="stage-row col" style={{ maxWidth: 360 }}>
            <MultiSwitch
                value={v}
                onValueChange={setV}
                list={[
                    { value: "day", label: "Day" },
                    { value: "week", label: "Week" },
                    { value: "month", label: "Month" },
                ]}
            />
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 11.5, color: "var(--fg-3)" }}>value: {v}</span>
        </div>
    );
}

function SliderDemo() {
    const [v, setV] = useState(42);
    const [r, setR] = useState<[number, number]>([20, 70]);
    return (
        <div className="stage-row col" style={{ maxWidth: 460 }}>
            <Slider value={v} onValueChange={setV} showValue label="Temperature" suffix="%" />
            <Slider range value={r} onValueChange={setR} label="Price range" min={0} max={100} />
        </div>
    );
}

function OtpDemo() {
    const [v, setV] = useState("");
    return (
        <div className="stage-row col" style={{ maxWidth: 360 }}>
            <OtpInput value={v} onChange={setV} length={6} />
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 11.5, color: "var(--fg-3)" }}>
                {v ? `entered: ${v}` : "type a 6-digit code"}
            </span>
        </div>
    );
}

function FieldDemo() {
    const [name, setName] = useState("");
    const [hook, setHook] = useState("");
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

function TextareaDemo() {
    const [v, setV] = useState("Agents are first-class participants in the products they help build.");
    return (
        <div className="stage-row col" style={{ maxWidth: 520 }}>
            <Textarea label="Release note" value={v} onValueChange={setV} autoResize minRows={3} />
        </div>
    );
}

function SelectDemo() {
    const [v, setV] = useState("prod");
    return (
        <div className="stage-row col" style={{ maxWidth: 360 }}>
            <Select
                label="Environment"
                value={v}
                onValueChange={setV}
                list={[
                    { value: "dev", label: "Development" },
                    { value: "staging", label: "Staging" },
                    { value: "prod", label: "Production" },
                ]}
            />
        </div>
    );
}

function AutocompleteDemo() {
    const [v, setV] = useState("");
    return (
        <div className="stage-row col" style={{ maxWidth: 360 }}>
            <Autocomplete
                value={v}
                onChange={setV}
                placeholder="Pick a package…"
                options={[
                    { value: "react-fancy", label: "react-fancy" },
                    { value: "fancy-artboard", label: "fancy-artboard" },
                    { value: "fancy-whiteboard", label: "fancy-whiteboard" },
                    { value: "fancy-flow", label: "fancy-flow" },
                    { value: "agent-integrations", label: "agent-integrations" },
                ]}
            />
        </div>
    );
}

function PillboxDemo() {
    const [tags, setTags] = useState<string[]>(["agent", "mcp", "human+"]);
    return (
        <div className="stage-row col" style={{ maxWidth: 420 }}>
            <Pillbox value={tags} onChange={setTags} placeholder="Add a tag and press enter" />
        </div>
    );
}

function CheckboxDemo() {
    const [a, setA] = useState(true);
    const [b, setB] = useState(false);
    return (
        <div className="stage-row col" style={{ maxWidth: 360 }}>
            <Checkbox checked={a} onCheckedChange={setA} label="Broadcast AgentActivity events" />
            <Checkbox checked={b} onCheckedChange={setB} label="Require human confirm on destructive tools" />
            <Checkbox indeterminate label="Partial selection" />
        </div>
    );
}

function CheckboxGroupDemo() {
    const [v, setV] = useState<string[]>(["read", "write"]);
    return (
        <div className="stage-row col" style={{ maxWidth: 360 }}>
            <CheckboxGroup
                label="Bridge permissions"
                value={v}
                onValueChange={setV}
                list={[
                    { value: "read", label: "Read state" },
                    { value: "write", label: "Mutate state" },
                    { value: "move", label: "Move / reorder" },
                ]}
            />
        </div>
    );
}

function RadioGroupDemo() {
    const [v, setV] = useState("staged");
    return (
        <div className="stage-row col" style={{ maxWidth: 360 }}>
            <RadioGroup
                label="Write mode"
                value={v}
                onValueChange={setV}
                list={[
                    { value: "live", label: "Live — apply immediately" },
                    { value: "staged", label: "Staged — agent proposes, human confirms" },
                ]}
            />
        </div>
    );
}

function BadgeDemo() {
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

function CalloutDemo() {
    return (
        <div className="stage-row col">
            <Callout color="blue" dismissible>An agent connected over MCP and is now inhabiting this surface.</Callout>
            <Callout color="green">Tool call <code style={{ fontFamily: "var(--font-mono)" }}>artboard_add_piece</code> succeeded.</Callout>
            <Callout color="amber">Quota at 80% — consider upgrading before the next run.</Callout>
        </div>
    );
}

function ProgressDemo() {
    const [v, setV] = useState(64);
    return (
        <div className="stage-row col" style={{ maxWidth: 460 }}>
            <Progress value={v} showValue color="violet" />
            <div style={{ display: "flex", gap: 18, alignItems: "center" }}>
                <Progress value={v} variant="circular" showValue color="blue" />
                <Progress indeterminate color="green" />
                <Button size="sm" variant="ghost" onClick={() => setV((x) => (x >= 100 ? 10 : x + 12))}>
                    Advance
                </Button>
            </div>
        </div>
    );
}

function SkeletonDemo() {
    return (
        <div className="stage-row" style={{ alignItems: "center" }}>
            <Skeleton shape="circle" width={44} height={44} />
            <div style={{ display: "flex", flexDirection: "column", gap: 8, flex: 1, minWidth: 160 }}>
                <Skeleton shape="text" width="60%" />
                <Skeleton shape="text" width="90%" />
                <Skeleton shape="rect" height={48} />
            </div>
        </div>
    );
}

function ToastDemo() {
    const { toast } = useToast();
    return (
        <div className="stage-row">
            <span className="row-label">Fire one</span>
            <Button color="blue" icon="info" onClick={() => toast({ variant: "info", title: "Heads up", description: "Your build finished." })}>
                Info
            </Button>
            <Button color="emerald" icon="check" onClick={() => toast({ variant: "success", title: "Project created", description: "Q4 review is ready." })}>
                Success
            </Button>
            <Button color="amber" icon="triangle-alert" onClick={() => toast({ variant: "warning", title: "Quota at 80%", description: "Consider upgrading." })}>
                Warning
            </Button>
            <Button color="red" icon="x-circle" onClick={() => toast({ variant: "error", title: "Tool failed", description: "artboard_add_piece returned 500." })}>
                Danger
            </Button>
        </div>
    );
}

function TooltipDemo() {
    return (
        <div className="stage-row">
            <Tooltip content="Stable handle: data-piece-id='hero-v3'">
                <Button variant="ghost" icon="info">Hover for the handle</Button>
            </Tooltip>
            <Tooltip content="Top placement" placement="top">
                <Button variant="ghost">Top</Button>
            </Tooltip>
            <Tooltip content="Right placement" placement="right">
                <Button variant="ghost">Right</Button>
            </Tooltip>
        </div>
    );
}

function TabsDemo() {
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
                            Controlled tabs — the active tint matches the primary accent.
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

function BreadcrumbsDemo() {
    return (
        <div className="stage-row">
            <Breadcrumbs>
                <Breadcrumbs.Item href="#">Packages</Breadcrumbs.Item>
                <Breadcrumbs.Item href="#">fancy-artboard</Breadcrumbs.Item>
                <Breadcrumbs.Item active>ArtPiece</Breadcrumbs.Item>
            </Breadcrumbs>
        </div>
    );
}

function PaginationDemo() {
    const [page, setPage] = useState(3);
    return (
        <div className="stage-row">
            <Pagination page={page} onPageChange={setPage} totalPages={12} />
        </div>
    );
}

function CardDemo() {
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

function TableDemo() {
    return (
        <div className="stage-row col" style={{ background: "transparent", border: "none", padding: 0 }}>
            <Table>
                <Table.Head>
                    <Table.Row>
                        <Table.Cell>Tool</Table.Cell>
                        <Table.Cell>Surface</Table.Cell>
                        <Table.Cell>Calls</Table.Cell>
                    </Table.Row>
                </Table.Head>
                <Table.Body>
                    <Table.Row>
                        <Table.Cell>artboard_add_piece</Table.Cell>
                        <Table.Cell>fancy-artboard</Table.Cell>
                        <Table.Cell>312</Table.Cell>
                    </Table.Row>
                    <Table.Row>
                        <Table.Cell>whiteboard_move</Table.Cell>
                        <Table.Cell>fancy-whiteboard</Table.Cell>
                        <Table.Cell>1,204</Table.Cell>
                    </Table.Row>
                    <Table.Row>
                        <Table.Cell>sheet_set_cell</Table.Cell>
                        <Table.Cell>fancy-sheets</Table.Cell>
                        <Table.Cell>5,790</Table.Cell>
                    </Table.Row>
                </Table.Body>
            </Table>
        </div>
    );
}

function AvatarDemo() {
    return (
        <div className="stage-row" style={{ alignItems: "center" }}>
            <Avatar fallback="GB" status="online" />
            <Avatar fallback="AI" size="lg" status="busy" />
            <Avatar fallback="QA" size="sm" status="away" />
            <Avatar fallback="42" size="xl" />
        </div>
    );
}

function ProfileDemo() {
    return (
        <div className="stage-row col">
            <Profile name="Glenn Born" subtitle="Maintainer · Particle Academy" fallback="GB" status="online" />
            <Profile name="Claude" subtitle="Agent · fancy-ui.mcp" fallback="C" status="busy" />
        </div>
    );
}

function SeparatorDemo() {
    return (
        <div className="stage-row col">
            <div>Human edits</div>
            <Separator label="agent takes over" />
            <div>Agent edits</div>
        </div>
    );
}

function StickyNoteDemo() {
    return (
        <div className="stage-row" style={{ gap: 18, alignItems: "flex-start" }}>
            <StickyNote defaultValue="Cut the second CTA — it competes." color="yellow" rotate={-2} />
            <StickyNote defaultValue="Tighter hero grid?" color="violet" rotate={1.5} />
            <StickyNote defaultValue="Gradient reads well in dark." color="blue" rotate={-1} />
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

export function Philosophy() {
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

// ─── Quick start — the two ways to add a component + the registry MCP ─────────

export const PACKAGE_CODE = `<span class="tok-c">// 1 · Install the package — import the component.</span>
<span class="tok-p">$</span> npm install <span class="tok-s">@particle-academy/react-fancy</span>

<span class="tok-k">import</span> { Badge } <span class="tok-k">from</span> <span class="tok-s">"@particle-academy/react-fancy"</span>;
&lt;<span class="tok-t">Badge</span> <span class="tok-a">color</span>=<span class="tok-s">"green"</span> <span class="tok-a">dot</span>&gt;Live&lt;/<span class="tok-t">Badge</span>&gt;`;

export const VENDOR_CODE = `<span class="tok-c"># 2 · Vendor the source — copy it into your repo, own it.</span>
<span class="tok-p">$</span> npx <span class="tok-s">fancy-ui@latest</span> add badge
<span class="tok-c"># → src/components/fancy/badge/</span>

<span class="tok-k">import</span> { Badge } <span class="tok-k">from</span> <span class="tok-s">"@/components/fancy/badge"</span>;`;

export const MCP_CODE = `<span class="tok-c"># Claude Code — install the Fancy UI plugin (recommended)</span>
/plugin marketplace add <span class="tok-s">Particle-Academy/fancy-ui-plugin</span>
/plugin install <span class="tok-s">fancy-ui@fancy-ui</span>
<span class="tok-c"># registers the registry MCP + skills, with the right transport</span>

<span class="tok-c">// …or wire the raw server into any IDE — .mcp.json</span>
{ <span class="tok-a">"mcpServers"</span>: { <span class="tok-a">"fancy-ui"</span>: { <span class="tok-a">"type"</span>: <span class="tok-s">"http"</span>, <span class="tok-a">"url"</span>: <span class="tok-s">"https://ui.particle.academy/mcp"</span> } } }`;

export function QuickStart() {
    const mono = { fontFamily: "var(--font-mono)" } as const;
    return (
        <section className="section" id="install">
            <div className="container">
                <div className="eyebrow-row">
                    <span>Quick start</span>
                </div>
                <h2 className="section-title">Two ways to add a component.</h2>
                <p className="section-sub">
                    npm-install and import, or vendor the source with{" "}
                    <code style={mono}>npx fancy-cli add</code>. PHP packages:{" "}
                    <code style={mono}>composer require</code>. Either way, point your agent at the
                    registry MCP — <code style={mono}>ui.particle.academy/mcp</code> — and it returns
                    the exact install commands.
                </p>

                <div className="qs-grid">
                    <div className="qs-card">
                        <div className="qs-head">
                            <span className="qs-num">1</span>
                            <div>
                                <div className="qs-title">Install the package</div>
                                <div className="qs-sub">npm / pnpm / yarn — version-pinned.</div>
                            </div>
                        </div>
                        <div className="codeblock" dangerouslySetInnerHTML={{ __html: PACKAGE_CODE }} />
                    </div>
                    <div className="qs-card">
                        <div className="qs-head">
                            <span className="qs-num qs-num-alt">2</span>
                            <div>
                                <div className="qs-title">Vendor the source</div>
                                <div className="qs-sub">Copy it in — yours to read and edit.</div>
                            </div>
                        </div>
                        <div className="codeblock" dangerouslySetInnerHTML={{ __html: VENDOR_CODE }} />
                    </div>
                </div>

                <div className="qs-mcp">
                    <div className="qs-mcp-copy">
                        <div className="qs-mcp-title">
                            <span className="qs-mcp-dot" /> Or let your agent do it
                        </div>
                        <p>
                            On <strong>Claude Code</strong>, install the{" "}
                            <a href="https://github.com/Particle-Academy/fancy-ui-plugin" target="_blank" rel="noopener noreferrer">
                                Fancy UI plugin
                            </a>{" "}
                            — one command wires up the hosted registry MCP <em>and</em> bundles skills
                            for finding components and building Human+ UX apps. Other IDEs (Cursor, VS
                            Code) drop the raw server into their config. Your agent then calls{" "}
                            <code style={mono}>list-components</code>,{" "}
                            <code style={mono}>search-components</code>, and{" "}
                            <code style={mono}>install-instructions</code> against the live registry —
                            no guessing from memory. <Link href="/docs/mcp">MCP setup docs →</Link>
                        </p>
                    </div>
                    <div className="codeblock" dangerouslySetInnerHTML={{ __html: MCP_CODE }} />
                </div>

                <div style={{ display: "flex", gap: 10, marginTop: 24, flexWrap: "wrap" }}>
                    <Link className="btn btn-primary" href="/docs">
                        <BookOpen size={15} />
                        Read the docs
                    </Link>
                    <Link className="btn btn-ghost" href="/agent-playground">
                        <Radio size={15} />
                        Try it in the Playground
                    </Link>
                    <a className="btn btn-ghost" href="https://github.com/Particle-Academy" target="_blank" rel="noopener noreferrer">
                        <Github size={15} />
                        View on GitHub
                    </a>
                </div>
            </div>
        </section>
    );
}

// ─── Explore strip ─────────────────────────────────────────────────────────

const EXPLORE = [
    { href: "/starter-kits", icon: Boxes, title: "Starter Kits", body: "Vertical demos — clone, study, adapt.", tag: "templates" },
    { href: "/dreaming", icon: Sparkles, title: "Dreaming", body: "Speculative components you can vote on.", tag: "speculative" },
    { href: "/showcase", icon: Cpu, title: "Designer Showcase", body: "Sites and repos built with Fancy UI.", tag: "community" },
    { href: "/leaderboard", icon: ArrowRight, title: "Leaderboard", body: "Top contributors by merged PRs and votes.", tag: "live" },
] as const;

export function Explore() {
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
