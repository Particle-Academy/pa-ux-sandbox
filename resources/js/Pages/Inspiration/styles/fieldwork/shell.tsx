import "./shell.css";

import { Link } from "@inertiajs/react";
import { useEffect, useState } from "react";
import {
    Accordion,
    Avatar,
    Badge,
    Button,
    Card,
    Chart,
    Command,
    Composer,
    Heading,
    MoodMeter,
    Navbar,
    Pagination,
    Pillbox,
    Profile,
    Progress,
    ReasonTag,
    Separator,
    Sidebar,
    Table,
    Tabs,
    Text,
    Timeline,
    Tooltip,
    TreeNav,
    type TreeNodeData,
} from "@particle-academy/react-fancy";
import {
    ArrowLeft,
    ArrowUpRight,
    Award,
    Boxes,
    Briefcase,
    Circle,
    CircleDot,
    Command as CommandIcon,
    FileText,
    Folder,
    GitBranch,
    LayoutDashboard,
    Mail,
    PanelLeft,
    Search,
    Send,
    Settings,
    Sparkles,
    Users,
    Wifi,
    X,
} from "lucide-react";
import type { Style } from "../../types";

/**
 * Inspiration Gallery · Style — App Shell.
 *
 * FIELDWORK (a fictional design + engineering studio) rendered as a DESKTOP APP
 * SHELL: the portfolio is presented as if it lives inside the studio's own "OS"
 * — a collapsible react-fancy <Sidebar> rail, a <Navbar> top bar with a global
 * search / Cmd+K trigger, a <TreeNav> project explorer, document <Tabs>, content
 * panels, a <Command> palette (Cmd+K), and a faux status bar. Every Fancy
 * primitive is restyled HARD via scoped CSS to read like native app chrome —
 * cool slate surfaces, an indigo accent, mono labels, hairline panel borders,
 * the dense rhythm of an IDE / dashboard rather than a marketing page.
 *
 * The whole tree is wrapped in `.insp-shell`, which carries its OWN dark app
 * palette (re-pointing the shared semantic tokens) so the surface reads native
 * regardless of the host light/dark theme — and never collides with Tailwind's
 * `.dark`. Mounted by Inspiration/Show.tsx for `style.id === "shell"`.
 *
 * SSR-safe: no module-level browser APIs; the Cmd+K key listener lives in a
 * useEffect. Inner links use the stretched-link pattern (one <Link> per row) so
 * no anchor is ever nested inside another anchor (avoids React #418 under SSR).
 */

type Project = {
    num: string;
    title: string;
    discipline: string;
    year: string;
    client: string;
    glyph: string;
    status: "Shipped" | "In build" | "Discovery";
    award?: string;
};

const PROJECTS: Project[] = [
    { num: "01", title: "Helm OS", discipline: "Design system · product UI", year: "2025", client: "Helm Robotics", glyph: "H", status: "Shipped", award: "Awwwards SOTD" },
    { num: "02", title: "Tidewater", discipline: "Brand · motion identity", year: "2025", client: "Tidewater Bank", glyph: "T", status: "Shipped" },
    { num: "03", title: "Quartz Console", discipline: "Web app · data viz", year: "2025", client: "Quartz Cloud", glyph: "Q", status: "In build", award: "CSS Design Awards" },
    { num: "04", title: "Switchyard", discipline: "Design engineering", year: "2024", client: "Switchyard AI", glyph: "S", status: "Shipped" },
    { num: "05", title: "Field Atlas", discipline: "Editorial platform", year: "2024", client: "Atlas Press", glyph: "F", status: "Discovery", award: "FWA of the Day" },
    { num: "06", title: "Beacon Grid", discipline: "Product · prototyping", year: "2024", client: "Beacon Energy", glyph: "B", status: "Shipped" },
];

const SERVICES = [
    { no: "01", icon: <Boxes size={16} />, title: "Design systems", body: "Tokens, primitives, and the documented rules that keep a product coherent across teams — built to be inhabited by humans and agents alike.", tags: ["Tokens", "Primitives", "Docs"] },
    { no: "02", icon: <LayoutDashboard size={16} />, title: "Product design", body: "Research, flows, and high-fidelity interface design for software teams — from a fixed-fee discovery to production-ready screens.", tags: ["UX", "UI", "Prototype"] },
    { no: "03", icon: <GitBranch size={16} />, title: "Design engineering", body: "We ship the design. Front-end in React + Tailwind, component libraries, and the bridges that let agents drive the surface.", tags: ["React", "Tailwind", "Human+"] },
    { no: "04", icon: <Sparkles size={16} />, title: "Brand & motion", body: "Identity systems, type, and motion language — the voice and rhythm that make a product feel like one thing.", tags: ["Identity", "Type", "Motion"] },
];

const TEAM = [
    { name: "Iris Vance", role: "Founder · Design director", initials: "IV", status: "online" as const },
    { name: "Kade Mori", role: "Design engineering lead", initials: "KM", status: "online" as const },
    { name: "Soraya Bell", role: "Product & systems", initials: "SB", status: "busy" as const },
    { name: "Theo Lind", role: "Brand & motion", initials: "TL", status: "away" as const },
];

const CLIENTS = ["Helm", "Tidewater", "Quartz", "Switchyard", "Atlas", "Beacon", "Lumen", "Forge", "Northwind"];

const FAQ = [
    { q: "How do you scope an engagement?", a: "Every project opens with a short, paid discovery — goals, constraints, and a fixed-fee proposal with dates we hold. No open-ended retainers unless you want one." },
    { q: "Do you build, or just design?", a: "Both. We're a design + engineering studio — most work ships as production React. You can take the design and run, or we ship it end to end." },
    { q: "What does a typical timeline look like?", a: "Design systems run six to ten weeks; product work varies with scope. We commit to dates in the proposal and keep you in the loop weekly." },
    { q: "Can agents drive what you build?", a: "Increasingly, yes. We build to the Human+ contract — controlled state, stable handles, MCP bridges — so an assistant can read and drive the same surface a person uses." },
];

const EXPLORER: TreeNodeData[] = [
    {
        id: "work",
        label: "selected-work",
        type: "folder",
        children: PROJECTS.map((p) => ({ id: `work-${p.num}`, label: `${p.title.toLowerCase().replace(/\s+/g, "-")}.case`, type: "file", ext: "case" })),
    },
    {
        id: "studio",
        label: "studio",
        type: "folder",
        children: [
            { id: "studio-about", label: "about.md", type: "file", ext: "md" },
            { id: "studio-team", label: "team.json", type: "file", ext: "json" },
            { id: "studio-services", label: "capabilities.ts", type: "file", ext: "ts" },
        ],
    },
    {
        id: "recognition",
        label: "recognition",
        type: "folder",
        children: [
            { id: "rec-awards", label: "awards.csv", type: "file", ext: "csv" },
            { id: "rec-clients", label: "clients.json", type: "file", ext: "json" },
            { id: "rec-press", label: "press.md", type: "file", ext: "md" },
        ],
    },
    { id: "contact", label: "brief.new", type: "file", ext: "new" },
];

const PER_PAGE = 4;

export default function Shell({ style }: { style: Style }) {
    const [page, setPage] = useState(1);
    const [tags, setTags] = useState<string[]>(["Design systems", "Product"]);
    const [budget, setBudget] = useState(60);
    const [budgetConfidence, setBudgetConfidence] = useState(0.62);
    const [brief, setBrief] = useState("");
    const [submitted, setSubmitted] = useState(false);
    const [selectedNode, setSelectedNode] = useState("work");
    const [paletteOpen, setPaletteOpen] = useState(false);

    const totalPages = Math.ceil(PROJECTS.length / PER_PAGE);
    const pageProjects = PROJECTS.slice((page - 1) * PER_PAGE, page * PER_PAGE);
    const featured = PROJECTS.slice(0, 3);

    // Cmd/Ctrl+K opens the command palette — browser-only, so it lives here.
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
                e.preventDefault();
                setPaletteOpen((o) => !o);
            }
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, []);

    const jump = (hash: string, node: string) => {
        setPaletteOpen(false);
        setSelectedNode(node);
        if (typeof document !== "undefined") {
            document.getElementById(hash)?.scrollIntoView({ behavior: "smooth", block: "start" });
        }
    };

    return (
        <div className="insp-shell">
            {/* ── App window chrome ──────────────────────────────────────────── */}
            <div className="sh-window">
                {/* Title bar (traffic lights + window title) */}
                <div className="sh-titlebar">
                    <div className="sh-lights" aria-hidden>
                        <span className="sh-light sh-light--r" />
                        <span className="sh-light sh-light--y" />
                        <span className="sh-light sh-light--g" />
                    </div>
                    <div className="sh-titlebar__name">
                        <span className="sh-mark" aria-hidden>F</span>
                        FIELDWORK Studio — <span className="sh-titlebar__file">portfolio.workspace</span>
                    </div>
                    <button type="button" className="sh-cmdk" onClick={() => setPaletteOpen(true)} aria-label="Open command palette">
                        <Search size={13} />
                        <span>Search the studio…</span>
                        <kbd className="sh-kbd">⌘K</kbd>
                    </button>
                </div>

                {/* ── Body: rail + explorer + main ──────────────────────────── */}
                <div className="sh-body">
                    {/* Left icon rail — restyled Sidebar */}
                    <div className="sh-rail">
                        <Sidebar collapseMode="icons" defaultCollapsed className="sh-sidebar">
                            <Sidebar.Group label="Workspace">
                                <Sidebar.Item icon={<LayoutDashboard size={18} />} active onClick={() => jump("sh-overview", "work")}>
                                    Overview
                                </Sidebar.Item>
                                <Sidebar.Item icon={<Briefcase size={18} />} onClick={() => jump("sh-work", "work")} badge={<span className="sh-railbadge">6</span>}>
                                    Work
                                </Sidebar.Item>
                                <Sidebar.Item icon={<Boxes size={18} />} onClick={() => jump("sh-capabilities", "studio-services")}>
                                    Capabilities
                                </Sidebar.Item>
                                <Sidebar.Item icon={<Users size={18} />} onClick={() => jump("sh-team", "studio-team")}>
                                    Team
                                </Sidebar.Item>
                                <Sidebar.Item icon={<Award size={18} />} onClick={() => jump("sh-recognition", "rec-awards")}>
                                    Recognition
                                </Sidebar.Item>
                            </Sidebar.Group>
                            <Sidebar.Group label="Studio">
                                <Sidebar.Item icon={<Mail size={18} />} onClick={() => jump("sh-contact", "contact")}>
                                    New brief
                                </Sidebar.Item>
                                <Sidebar.Item icon={<Settings size={18} />} onClick={() => setPaletteOpen(true)}>
                                    Command
                                </Sidebar.Item>
                            </Sidebar.Group>
                        </Sidebar>
                    </div>

                    {/* Project explorer — restyled TreeNav */}
                    <aside className="sh-explorer" aria-label="Project explorer">
                        <div className="sh-explorer__head">
                            <span className="sh-explorer__title">
                                <Folder size={13} /> FIELDWORK
                            </span>
                            <span className="sh-explorer__hint">main</span>
                        </div>
                        <div className="sh-tree">
                            <TreeNav
                                nodes={EXPLORER}
                                selectedId={selectedNode}
                                onSelect={(id) => setSelectedNode(id)}
                            />
                        </div>
                        <Separator className="!my-3" />
                        <div className="sh-explorer__foot">
                            <Profile
                                name="Iris Vance"
                                subtitle="Design director"
                                fallback="IV"
                                size="sm"
                                status="online"
                                className="sh-profile"
                            />
                        </div>
                    </aside>

                    {/* ── Main column ───────────────────────────────────────── */}
                    <main className="sh-main">
                        {/* Top bar — restyled Navbar: breadcrumb + actions */}
                        <Navbar className="sh-topbar">
                            <Navbar.Brand className="sh-crumbs">
                                <button type="button" className="sh-icobtn" aria-label="Toggle panel"><PanelLeft size={15} /></button>
                                <span className="sh-crumb">FIELDWORK</span>
                                <span className="sh-crumb__sep">/</span>
                                <span className="sh-crumb">portfolio</span>
                                <span className="sh-crumb__sep">/</span>
                                <span className="sh-crumb sh-crumb--active">overview</span>
                            </Navbar.Brand>
                            <Navbar.Items className="sh-topbar__actions">
                                <Badge className="sh-pill sh-pill--ok" size="sm" dot>Available · Q3 2026</Badge>
                                <Button className="sh-btn-ghost" icon="search" onClick={() => setPaletteOpen(true)}>⌘K</Button>
                                <Button className="sh-btn-primary" iconTrailing="arrow-right" onClick={() => jump("sh-contact", "contact")}>
                                    New brief
                                </Button>
                            </Navbar.Items>
                        </Navbar>

                        {/* Document tab bar — restyled Tabs (decorative chrome) */}
                        <div className="sh-tabbar" role="presentation">
                            <span className="sh-tab sh-tab--active"><FileText size={13} /> overview.case <X size={12} className="sh-tab__x" /></span>
                            <span className="sh-tab"><FileText size={13} /> work.index</span>
                            <span className="sh-tab"><FileText size={13} /> brief.new</span>
                        </div>

                        {/* Scroll region — the "open document" */}
                        <div className="sh-content">
                            {/* ── Hero / overview panel ──────────────────────── */}
                            <section className="sh-section sh-hero" id="sh-overview" aria-labelledby="sh-hero-h">
                                <div className="sh-eyebrow"><CircleDot size={12} /> readme — design &amp; engineering studio</div>
                                <h1 id="sh-hero-h" className="sh-display">
                                    We design and build <span className="sh-accent">interfaces</span> humans and agents share.
                                </h1>
                                <p className="sh-lede">
                                    FIELDWORK is a small studio working where product design meets engineering. We build
                                    systems that stay legible as they scale — and ship them to production.
                                </p>
                                <div className="sh-hero__cta">
                                    <Button className="sh-btn-primary" iconTrailing="arrow-right" onClick={() => jump("sh-contact", "contact")}>
                                        Start a project
                                    </Button>
                                    <Button className="sh-btn-ghost" iconTrailing="arrow-down" onClick={() => jump("sh-work", "work")}>
                                        Browse selected work
                                    </Button>
                                </div>

                                {/* Stat tiles — dashboard cards */}
                                <div className="sh-stats">
                                    {[
                                        { num: "2017", label: "Founded", spark: [3, 5, 4, 6, 5, 7, 6, 8] },
                                        { num: "140+", label: "Projects shipped", spark: [2, 4, 6, 5, 8, 9, 11, 14] },
                                        { num: "06", label: "People", spark: [1, 2, 2, 3, 4, 4, 5, 6] },
                                        { num: "09", label: "Awards", spark: [0, 1, 2, 3, 4, 5, 7, 9] },
                                    ].map((s) => (
                                        <div key={s.label} className="sh-stat">
                                            <div className="sh-stat__num">{s.num}</div>
                                            <div className="sh-stat__label">{s.label}</div>
                                            <div className="sh-stat__spark">
                                                <Chart.Sparkline data={s.spark} width={120} height={28} color="var(--s-accent-2)" />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </section>

                            {/* ── Capabilities panel ─────────────────────────── */}
                            <section className="sh-section" id="sh-capabilities" aria-labelledby="sh-cap-h">
                                <div className="sh-panelhead">
                                    <div className="sh-eyebrow"><Boxes size={12} /> capabilities.ts</div>
                                    <Heading as="h2" size="2xl" weight="semibold" className="sh-h2" id="sh-cap-h">
                                        Four disciplines, one team.
                                    </Heading>
                                </div>
                                <div className="sh-cards">
                                    {SERVICES.map((s) => (
                                        <Card key={s.no} variant="outlined" padding="none" className="sh-card sh-card--cap">
                                            <Card.Body className="!p-5">
                                                <div className="sh-card__top">
                                                    <span className="sh-card__icon">{s.icon}</span>
                                                    <span className="sh-card__no">{s.no}</span>
                                                </div>
                                                <h3 className="sh-card__title">{s.title}</h3>
                                                <p className="sh-card__body">{s.body}</p>
                                                <div className="sh-card__tags">
                                                    {s.tags.map((t) => (
                                                        <Badge key={t} className="sh-pill" size="sm">{t}</Badge>
                                                    ))}
                                                </div>
                                            </Card.Body>
                                        </Card>
                                    ))}
                                </div>
                            </section>

                            {/* ── Featured work — preview cards ──────────────── */}
                            <section className="sh-section" id="sh-work" aria-labelledby="sh-feat-h">
                                <div className="sh-panelhead sh-panelhead--row">
                                    <div>
                                        <div className="sh-eyebrow"><Briefcase size={12} /> selected-work</div>
                                        <Heading as="h2" size="2xl" weight="semibold" className="sh-h2" id="sh-feat-h">
                                            Three recent builds.
                                        </Heading>
                                    </div>
                                    <Badge className="sh-pill sh-pill--accent" size="md" dot>2024 — 2025</Badge>
                                </div>
                                <div className="sh-cards sh-cards--3">
                                    {featured.map((p) => (
                                        <Card key={p.num} variant="outlined" padding="none" className="sh-card sh-preview">
                                            <Link href="/inspiration/shell#sh-work" className="sh-stretch" aria-label={`${p.title} — ${p.discipline}`} />
                                            <div className="sh-preview__canvas">
                                                <span className="sh-preview__glyph">{p.glyph}<span>.</span></span>
                                                <Badge className={`sh-pill sh-status sh-status--${p.status.replace(/\s+/g, "").toLowerCase()}`} size="sm" dot>{p.status}</Badge>
                                            </div>
                                            <Card.Body className="!px-4 !py-4">
                                                <div className="sh-preview__meta">
                                                    <div>
                                                        <div className="sh-preview__title">{p.title}</div>
                                                        <div className="sh-preview__disc">{p.discipline}</div>
                                                    </div>
                                                    {p.award
                                                        ? <Badge className="sh-pill sh-pill--accent" size="sm">{p.award}</Badge>
                                                        : <span className="sh-meta">{p.year} ↗</span>}
                                                </div>
                                            </Card.Body>
                                        </Card>
                                    ))}
                                </div>
                            </section>

                            {/* ── Full index — typographic table ─────────────── */}
                            <section className="sh-section" id="sh-index" aria-labelledby="sh-index-h">
                                <div className="sh-panelhead sh-panelhead--row">
                                    <div>
                                        <div className="sh-eyebrow"><Folder size={12} /> work.index</div>
                                        <Heading as="h2" size="2xl" weight="semibold" className="sh-h2" id="sh-index-h">
                                            The full index.
                                        </Heading>
                                    </div>
                                    <Pillbox
                                        value={tags}
                                        onChange={setTags}
                                        placeholder="Filter by discipline…"
                                        className="sh-input !w-72"
                                        aria-label="Filter work by discipline"
                                    />
                                </div>

                                <div className="sh-index">
                                    <div className="sh-index__head">
                                        <span>#</span><span>project</span><span>discipline</span><span>status</span><span>year</span>
                                    </div>
                                    {pageProjects.map((p) => (
                                        <div key={p.num} className="sh-index__row">
                                            <Link href="/inspiration/shell#sh-index" className="sh-stretch" aria-label={`${p.title} — ${p.discipline}`} />
                                            <span className="sh-index__num">{p.num}</span>
                                            <span className="sh-index__title">{p.title}</span>
                                            <span className="sh-index__disc">{p.discipline}</span>
                                            <span className="sh-index__status">
                                                <Badge className={`sh-pill sh-status sh-status--${p.status.replace(/\s+/g, "").toLowerCase()}`} size="sm" dot>{p.status}</Badge>
                                            </span>
                                            <span className="sh-index__year">{p.year} <ArrowUpRight size={12} aria-hidden /></span>
                                        </div>
                                    ))}
                                </div>

                                <div className="sh-index__foot">
                                    <span className="sh-meta">
                                        Showing {(page - 1) * PER_PAGE + 1}–{Math.min(page * PER_PAGE, PROJECTS.length)} of {PROJECTS.length}
                                    </span>
                                    <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
                                </div>
                            </section>

                            {/* ── How we work — tabs panel ───────────────────── */}
                            <section className="sh-section" id="sh-process" aria-labelledby="sh-how-h">
                                <div className="sh-panelhead">
                                    <div className="sh-eyebrow"><GitBranch size={12} /> how-we-work</div>
                                    <Heading as="h2" size="2xl" weight="semibold" className="sh-h2" id="sh-how-h">
                                        From brief to build.
                                    </Heading>
                                </div>

                                <Card variant="outlined" padding="none" className="sh-card sh-panel">
                                    <Tabs defaultTab="process" variant="underline" className="sh-tabs">
                                        <Tabs.List>
                                            <Tabs.Tab value="process">Process</Tabs.Tab>
                                            <Tabs.Tab value="principles">Principles</Tabs.Tab>
                                            <Tabs.Tab value="faq">Questions</Tabs.Tab>
                                        </Tabs.List>
                                        <Tabs.Panels>
                                            <Tabs.Panel value="process">
                                                <div className="sh-panelbody" style={{ maxWidth: 680 }}>
                                                    <Timeline
                                                        className="sh-timeline"
                                                        events={[
                                                            { date: "Week 0", title: "Discovery", description: "Goals, audience, constraints. A fixed-fee proposal with dates we hold.", color: "slate" },
                                                            { date: "Weeks 1–3", title: "Direction", description: "Two or three routes, explored until a decision is real rather than abstract.", color: "slate" },
                                                            { date: "Weeks 4–8", title: "System & build", description: "The chosen direction built into a documented system and shipped as production React.", color: "indigo" },
                                                            { date: "Handoff", title: "Handoff", description: "Source, tokens, and a working session so your team owns it — agent-driveable by default.", color: "slate" },
                                                        ]}
                                                    />
                                                </div>
                                            </Tabs.Panel>

                                            <Tabs.Panel value="principles">
                                                <div className="sh-panelbody sh-cards sh-cards--2">
                                                    {[
                                                        { no: "P1", title: "Restraint over decoration", body: "The grid you never notice. Type that reads before you register it. One accent, used with discipline." },
                                                        { no: "P2", title: "Systems, not screens", body: "We deliver the rules that keep things coherent as they scale — not a folder of one-off comps." },
                                                        { no: "P3", title: "Design that ships", body: "Design and engineering in one team, so what we draw is what goes to production. No fidelity lost in handoff." },
                                                        { no: "P4", title: "Human+ by default", body: "Controlled state, stable handles, MCP bridges. The surfaces we build can be driven by people and agents alike." },
                                                    ].map((pr) => (
                                                        <div key={pr.no} className="sh-principle">
                                                            <span className="sh-card__no">{pr.no}</span>
                                                            <h3 className="sh-card__title">{pr.title}</h3>
                                                            <p className="sh-card__body">{pr.body}</p>
                                                        </div>
                                                    ))}
                                                </div>
                                            </Tabs.Panel>

                                            <Tabs.Panel value="faq">
                                                <div className="sh-panelbody" style={{ maxWidth: 760 }}>
                                                    <Accordion type="single" defaultOpen={["q0"]} className="sh-accordion">
                                                        {FAQ.map((item, i) => (
                                                            <Accordion.Item key={i} value={`q${i}`}>
                                                                <Accordion.Trigger>{item.q}</Accordion.Trigger>
                                                                <Accordion.Content>{item.a}</Accordion.Content>
                                                            </Accordion.Item>
                                                        ))}
                                                    </Accordion>
                                                </div>
                                            </Tabs.Panel>
                                        </Tabs.Panels>
                                    </Tabs>
                                </Card>
                            </section>

                            {/* ── About + team panel ─────────────────────────── */}
                            <section className="sh-section" id="sh-team" aria-labelledby="sh-about-h">
                                <div className="sh-about">
                                    <div className="sh-about__lead">
                                        <div className="sh-eyebrow"><FileText size={12} /> about.md</div>
                                        <p className="sh-quote">
                                            We think the best interface is mostly <b>invisible</b> — a system that quietly
                                            holds, in light or dark, for the person and the agent both.
                                        </p>
                                        <Text as="p" size="md" color="muted" className="!mt-5 !leading-relaxed sh-prose">
                                            FIELDWORK started in 2017 as two people who wanted to both design and build.
                                            We've stayed small on purpose — six people now, still small enough that the people
                                            you meet are the people who do the work.
                                        </Text>
                                    </div>
                                    <div className="sh-about__team">
                                        <div className="sh-eyebrow"><Users size={12} /> team.json</div>
                                        <div className="sh-team">
                                            {TEAM.map((m) => (
                                                <div key={m.name} className="sh-person">
                                                    <Avatar fallback={m.initials} size="md" status={m.status} />
                                                    <div className="sh-person__meta">
                                                        <div className="sh-person__name">{m.name}</div>
                                                        <div className="sh-meta">{m.role}</div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </section>

                            {/* ── Recognition panel ──────────────────────────── */}
                            <section className="sh-section" id="sh-recognition" aria-labelledby="sh-recog-h">
                                <div className="sh-recog">
                                    <div className="sh-recog__main">
                                        <div className="sh-eyebrow"><Award size={12} /> awards.csv</div>
                                        <Heading as="h2" size="lg" weight="semibold" id="sh-recog-h" className="sh-h3">
                                            Selected awards
                                        </Heading>
                                        <div className="sh-table">
                                            <Table>
                                                <Table.Head>
                                                    <Table.Column label="Year" />
                                                    <Table.Column label="Project" />
                                                    <Table.Column label="Award" />
                                                </Table.Head>
                                                <Table.Body>
                                                    {PROJECTS.filter((p) => p.award).map((p) => (
                                                        <Table.Row key={p.num}>
                                                            <Table.Cell className="!font-[var(--font-mono)]">{p.year}</Table.Cell>
                                                            <Table.Cell className="!font-medium">{p.title}</Table.Cell>
                                                            <Table.Cell>{p.award}</Table.Cell>
                                                        </Table.Row>
                                                    ))}
                                                    <Table.Row>
                                                        <Table.Cell className="!font-[var(--font-mono)]">2023</Table.Cell>
                                                        <Table.Cell className="!font-medium">Studio</Table.Cell>
                                                        <Table.Cell>Communication Arts — Interactive, shortlist</Table.Cell>
                                                    </Table.Row>
                                                </Table.Body>
                                            </Table>
                                        </div>
                                    </div>
                                    <div className="sh-recog__aside">
                                        <div className="sh-eyebrow"><Boxes size={12} /> clients.json</div>
                                        <div className="sh-clients">
                                            {CLIENTS.map((c) => (
                                                <Badge key={c} className="sh-pill" size="md">{c}</Badge>
                                            ))}
                                        </div>
                                        <Separator className="!my-6" />
                                        <div className="sh-eyebrow"><FileText size={12} /> press.md</div>
                                        <ul className="sh-press">
                                            <li className="sh-meta sh-meta--ink">Smashing Magazine — Studio spotlight</li>
                                            <li className="sh-meta">The Index №31 — Dark interfaces</li>
                                            <li className="sh-meta">Type &amp; Grids — In the wild</li>
                                        </ul>
                                    </div>
                                </div>
                            </section>

                            {/* ── Contact / brief panel ──────────────────────── */}
                            <section className="sh-section" id="sh-contact" aria-labelledby="sh-contact-h">
                                <div className="sh-contact">
                                    <div className="sh-contact__lead">
                                        <div className="sh-eyebrow"><Mail size={12} /> brief.new</div>
                                        <Heading as="h2" size="2xl" weight="semibold" className="sh-h2" id="sh-contact-h">
                                            Tell us about the work.
                                        </Heading>
                                        <p className="sh-lede sh-lede--sm">
                                            A few sentences is plenty to start. We reply to every brief within two working days.
                                        </p>
                                        <div className="sh-contact-line">studio@fieldwork.example</div>
                                        <div className="sh-contact-sub">+49 30 0000 0000 · Berlin · Remote</div>

                                        <div className="sh-budget">
                                            <div className="sh-eyebrow"><CircleDot size={12} /> indicative-budget</div>
                                            <Text as="p" size="sm" color="muted" className="!mt-3 !mb-3 !max-w-[36ch] sh-prose">
                                                Set a rough budget and how firm it is — drag along for the figure, up for
                                                confidence. It only helps us scope; nothing's binding.
                                            </Text>
                                            <MoodMeter
                                                min={15}
                                                max={200}
                                                value={budget}
                                                confidence={budgetConfidence}
                                                onChange={(v, c) => { setBudget(Math.round(v)); setBudgetConfidence(c); }}
                                                width={320}
                                                height={170}
                                                prefix="€"
                                                suffix="k"
                                                color="var(--s-accent)"
                                            />
                                            <div className="sh-meta sh-budget__readout">
                                                Scoping at{" "}
                                                <ReasonTag
                                                    value={`€${budget}k`}
                                                    reason="Indicative only — the proposal sets the fixed fee after discovery. Drawn from your budget pad and the project type."
                                                    confidence={budgetConfidence}
                                                    by="Studio"
                                                    theme="underline"
                                                />{" "}
                                                · confidence {Math.round(budgetConfidence * 100)}%
                                            </div>
                                        </div>
                                    </div>

                                    <Card variant="outlined" padding="none" className="sh-card sh-brief">
                                        <Card.Header className="!px-5 !py-4">
                                            <div className="sh-brief__head">
                                                <span className="sh-brief__title"><Send size={14} /> New brief</span>
                                                <Tooltip content="We read every brief — no bots.">
                                                    <Badge className="sh-pill sh-pill--accent" size="sm" dot>Open for Q3</Badge>
                                                </Tooltip>
                                            </div>
                                        </Card.Header>
                                        <Card.Body className="!px-5 !py-4">
                                            {submitted ? (
                                                <div className="sh-brief__done">
                                                    <Badge className="sh-pill sh-pill--accent" size="md">Received</Badge>
                                                    <p>Thanks — your brief is in. We&apos;ll reply within two working days.</p>
                                                    <Button className="sh-btn-ghost" icon="arrow-left" onClick={() => { setSubmitted(false); setBrief(""); }}>
                                                        Write another
                                                    </Button>
                                                </div>
                                            ) : (
                                                <div className="sh-composer">
                                                    <Composer
                                                        value={brief}
                                                        onChange={setBrief}
                                                        onSubmit={() => setBrief((b) => b)}
                                                        placeholder="What are you building, and what's the deadline?"
                                                        className="!border-0 !rounded-none"
                                                    />
                                                    <div className="sh-composer__foot">
                                                        <Text as="span" size="xs" color="muted">{brief.trim().length} characters</Text>
                                                        <Progress value={Math.min(brief.trim().length, 160)} max={160} variant="bar" size="sm" color="indigo" className="sh-progress !w-40" />
                                                    </div>
                                                </div>
                                            )}
                                        </Card.Body>
                                        {!submitted && (
                                            <Card.Footer className="!px-5 !py-3">
                                                <div className="sh-brief__foot">
                                                    <Text as="span" size="xs" color="muted">No NDA needed to say hello.</Text>
                                                    <Button className="sh-btn-primary" disabled={brief.trim().length < 12} iconTrailing="arrow-right" onClick={() => setSubmitted(true)}>
                                                        Send brief
                                                    </Button>
                                                </div>
                                            </Card.Footer>
                                        )}
                                    </Card>
                                </div>

                                <footer className="sh-pagefoot">
                                    <span className="sh-meta">FIELDWORK — a fictional studio, for demonstration · Style {style.num} / App Shell</span>
                                    <Link href="/inspiration" className="sh-back">
                                        <ArrowLeft size={14} /> Back to the gallery
                                    </Link>
                                </footer>
                            </section>
                        </div>
                        </main>

                    {/* ── Status bar ─────────────────────────────────────────── */}
                    <div className="sh-statusbar">
                        <div className="sh-status-left">
                            <span className="sh-status-item sh-status-item--accent"><GitBranch size={12} /> main</span>
                            <span className="sh-status-item"><Circle size={9} className="sh-dot-ok" /> Available · Q3 2026</span>
                            <span className="sh-status-item"><Users size={12} /> {TEAM.length} online</span>
                        </div>
                        <div className="sh-status-right">
                            <span className="sh-status-item">{PROJECTS.length} projects</span>
                            <span className="sh-status-item"><Wifi size={12} /> Berlin · Remote</span>
                            <button type="button" className="sh-status-item sh-status-item--btn" onClick={() => setPaletteOpen(true)}>
                                <CommandIcon size={12} /> ⌘K
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Command palette (Cmd/Ctrl+K) — rendered inside .insp-shell ──── */}
            <Command open={paletteOpen} onClose={() => setPaletteOpen(false)} className="sh-palette">
                <Command.Input placeholder="Jump to a section, project, or action…" />
                <Command.List>
                    <Command.Empty>No matches in the workspace.</Command.Empty>
                    <Command.Group heading="Go to">
                        <Command.Item value="overview" onSelect={() => jump("sh-overview", "work")}>Overview</Command.Item>
                        <Command.Item value="work selected" onSelect={() => jump("sh-work", "work")}>Selected work</Command.Item>
                        <Command.Item value="capabilities services" onSelect={() => jump("sh-capabilities", "studio-services")}>Capabilities</Command.Item>
                        <Command.Item value="team about" onSelect={() => jump("sh-team", "studio-team")}>Studio &amp; team</Command.Item>
                        <Command.Item value="recognition awards" onSelect={() => jump("sh-recognition", "rec-awards")}>Recognition</Command.Item>
                    </Command.Group>
                    <Command.Group heading="Projects">
                        {PROJECTS.map((p) => (
                            <Command.Item key={p.num} value={`${p.title} ${p.discipline}`} onSelect={() => jump("sh-index", `work-${p.num}`)}>
                                {p.title} <span className="sh-palette__hint">{p.discipline}</span>
                            </Command.Item>
                        ))}
                    </Command.Group>
                    <Command.Group heading="Actions">
                        <Command.Item value="new brief contact" onSelect={() => jump("sh-contact", "contact")}>Start a new brief</Command.Item>
                        <Command.Item value="email studio" onSelect={() => jump("sh-contact", "contact")}>Email the studio</Command.Item>
                    </Command.Group>
                </Command.List>
            </Command>
        </div>
    );
}
