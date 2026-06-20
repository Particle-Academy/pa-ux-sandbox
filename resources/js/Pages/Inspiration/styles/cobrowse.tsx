import "./cobrowse.css";

import { Link } from "@inertiajs/react";
import { useEffect, useRef, useState } from "react";
import {
    Accordion,
    Avatar,
    Badge,
    Breadcrumbs,
    Button,
    Card,
    Composer,
    FauxClient,
    Heading,
    MoodMeter,
    Pagination,
    Pillbox,
    Progress,
    ReasonTag,
    Separator,
    Switch,
    Table,
    Tabs,
    Text,
    Timeline,
    Tooltip,
} from "@particle-academy/react-fancy";
import {
    AgentActivityHighlight,
    AgentCursor,
    AgentPanel,
    type AgentActivity,
} from "@particle-academy/agent-integrations";
import { ArrowLeft, ArrowUpRight, Pause, Play, SkipForward } from "lucide-react";
import type { Style } from "../types";

/**
 * Inspiration Gallery · Style — Agent Co-Browse.
 *
 * FIELDWORK (a fictional design + engineering studio) rendered as a Human+
 * portfolio where an AI agent — "Atlas" — co-browses the page beside you. The
 * signature chrome is the live tour layer: a fixed AgentPanel rail streaming a
 * tool-call/narration feed, an AgentCursor that glides to whatever section the
 * tour is on, and an AgentActivityHighlight that pulses a ring around the part
 * the agent is "reading". A play / pause / step control drives the scripted
 * sequence. The whole tree is wrapped in `.insp-cobrowse`, which re-points the
 * shared semantic tokens to a deep slate + cyan-presence palette so every Fancy
 * primitive inherits the co-browse surface without per-component hacks.
 *
 * The Fancy primitives are restyled HARD via scoped CSS + `cb-*` classes so they
 * wear the co-browse idiom — buttons become presence pills, badges become
 * "session" tags, cards become inhabited panels with a live status header.
 *
 * Mounted by Inspiration/Show.tsx for `style.id === "cobrowse"`. SSR-safe: no
 * module-level browser APIs; the cursor/highlight start at 0 and only animate
 * inside useEffect after mount, so the server render matches the first client
 * render. Inner links use the stretched-link pattern (one <Link> per row) so no
 * anchor is ever nested inside another anchor (avoids React #418 under SSR).
 */

type Project = {
    num: string;
    title: string;
    discipline: string;
    year: string;
    client: string;
    glyph: string;
    award?: string;
};

const PROJECTS: Project[] = [
    { num: "01", title: "Wayfarer", discipline: "Agent-driveable product UI", year: "2025", client: "Wayfarer Logistics", glyph: "W", award: "Awwwards SOTD" },
    { num: "02", title: "Lumen Desk", discipline: "Human+ support console", year: "2025", client: "Lumen Health", glyph: "L" },
    { num: "03", title: "Cartograph", discipline: "Design system + MCP bridges", year: "2025", client: "Cartograph Maps", glyph: "C", award: "CSS Design Awards" },
    { num: "04", title: "Relay", discipline: "Co-browse onboarding flow", year: "2024", client: "Relay Bank", glyph: "R" },
    { num: "05", title: "Field Atlas", discipline: "Data viz + agent narration", year: "2024", client: "Atlas Robotics", glyph: "A", award: "FWA of the Day" },
    { num: "06", title: "Quorum", discipline: "Shared-surface collaboration", year: "2024", client: "Quorum Gov", glyph: "Q" },
];

const SERVICES = [
    { no: "01", title: "Human+ product design", body: "Interfaces where a person and an agent share one surface and trade control. Controlled state, stable handles, and the bridges that let an assistant drive what a human can.", tags: ["UX", "MCP bridges", "Presence"] },
    { no: "02", title: "Design systems", body: "Tokens, primitives, and documented rules built to be inhabited — every component is both an authoring surface and an agent-driveable one.", tags: ["Tokens", "Primitives", "Docs"] },
    { no: "03", title: "Co-browse & onboarding", body: "Guided tours where the agent walks beside the user — narrating, highlighting, and acting in-line. Onboarding that explains itself.", tags: ["Tour", "Narration", "Activity"] },
    { no: "04", title: "Design engineering", body: "We ship it. React + Tailwind front-ends with the MCP relay wired, so the surface we hand off can be co-driven on day one.", tags: ["React", "Tailwind", "Relay"] },
];

const TEAM = [
    { name: "Nova Reyes", role: "Founder · Human+ direction", initials: "NR" },
    { name: "Dao Tran", role: "Design engineering lead", initials: "DT" },
    { name: "Mira Solberg", role: "Systems & bridges", initials: "MS" },
    { name: "Atlas", role: "Resident agent · co-pilot", initials: "AT", agent: true },
];

const CLIENTS = ["Wayfarer", "Lumen", "Cartograph", "Relay", "Atlas", "Quorum", "Beacon", "Northwind", "Forge"];

const FAQ = [
    { q: "What does “co-browse” actually mean here?", a: "An agent shares the same UI as the user, sees what they see, and can act on the surface through MCP tool calls — not by scraping the DOM. The agent rides shotgun; the human keeps the wheel." },
    { q: "Do you design, build, or both?", a: "Both. We're a design + engineering studio, so what we draw is what ships — production React with the agent relay wired in. You can take the system and run, or we ship end to end." },
    { q: "Can the agent take destructive actions?", a: "Only behind a confirm. We build to the Human+ contract: agents propose, humans confirm. Every mutation broadcasts an activity event, and there's a per-agent undo stack." },
    { q: "How is presence kept honest?", a: "Stable handles on every interactive element and an activity feed the user can read in real time. The agent's cursor, highlights, and tool log are all visible — no silent automation." },
];

const TOUR: { id: string; tool: string; text: string; detail?: unknown }[] = [
    { id: "cb-hero", tool: "page_open", text: "Opened fieldwork.studio — starting the tour.", detail: { route: "/", agent: "Atlas" } },
    { id: "cb-figures", tool: "read_section", text: "Studio at a glance — 7 years, 150+ shipped, 6 humans + 1 agent.", detail: { section: "figures" } },
    { id: "cb-work", tool: "scan_work", text: "Scanning selected work — 6 Human+ builds, 3 award-winning.", detail: { projects: 6, awards: 3 } },
    { id: "cb-cap", tool: "read_section", text: "Capabilities — four disciplines, one shared surface.", detail: { section: "capabilities" } },
    { id: "cb-team", tool: "read_section", text: "Meet the studio — note the resident agent, Atlas (that's me).", detail: { team: 4 } },
    { id: "cb-contact", tool: "draft_brief", text: "Drafting a brief on your behalf — you confirm before it sends.", detail: { pending: true, budget: "€60k" } },
];

const PER_PAGE = 4;

export default function CoBrowse({ style }: { style: Style }) {
    const [page, setPage] = useState(1);
    const [tags, setTags] = useState<string[]>(["Human+", "Design systems"]);
    const [budget, setBudget] = useState(60);
    const [budgetConfidence, setBudgetConfidence] = useState(0.64);
    const [brief, setBrief] = useState("");
    const [submitted, setSubmitted] = useState(false);
    const [autopilot, setAutopilot] = useState(true);

    // ── Scripted co-browse tour state (SSR-safe: starts inert at 0) ──────────
    const [playing, setPlaying] = useState(false);
    const [step, setStep] = useState(0);
    const [cursor, setCursor] = useState({ x: 0, y: 0, visible: false });
    const [pulse, setPulse] = useState<{ x: number; y: number; w: number; h: number; key: number } | null>(null);
    const [activity, setActivity] = useState<AgentActivity[]>([
        { id: "boot", at: 0, kind: "info", source: "Atlas", text: "Co-pilot ready. Press play to take the tour." },
    ]);
    const stageRef = useRef<HTMLDivElement | null>(null);

    const totalPages = Math.ceil(PROJECTS.length / PER_PAGE);
    const pageProjects = PROJECTS.slice((page - 1) * PER_PAGE, page * PER_PAGE);
    const featured = PROJECTS.slice(0, 3);

    // Move the agent's cursor + highlight to the current tour target and append
    // the tool call to the feed. Runs only on the client (inside effects).
    const focusStep = (i: number) => {
        const t = TOUR[i];
        if (!t || typeof document === "undefined") return;
        const stage = stageRef.current;
        const el = stage?.querySelector<HTMLElement>(`[data-tour="${t.id}"]`);
        if (!stage || !el) return;
        const sb = stage.getBoundingClientRect();
        const rb = el.getBoundingClientRect();
        const x = rb.left - sb.left;
        const y = rb.top - sb.top;
        setPulse({ x, y, w: rb.width, h: rb.height, key: Date.now() });
        setCursor({ x: x + Math.min(rb.width - 28, 120), y: y + 26, visible: true });
        setActivity((prev) =>
            [
                ...prev,
                { id: `${t.id}-${Date.now()}`, at: Date.now(), kind: "tool" as const, source: t.tool, text: t.text, detail: t.detail },
            ].slice(-7),
        );
    };

    // Advance the tour while playing.
    useEffect(() => {
        if (!playing) return;
        focusStep(step);
        const next = window.setTimeout(() => {
            setStep((s) => {
                if (s + 1 >= TOUR.length) {
                    setPlaying(false);
                    return s;
                }
                return s + 1;
            });
        }, 2600);
        return () => window.clearTimeout(next);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [playing, step]);

    const startTour = () => {
        if (playing) {
            setPlaying(false);
            return;
        }
        if (step >= TOUR.length - 1) setStep(0);
        setPlaying(true);
    };

    const stepOnce = () => {
        setPlaying(false);
        const i = step >= TOUR.length - 1 ? 0 : step + 1;
        setStep(i);
        focusStep(i);
    };

    return (
        <div className="insp-cobrowse">
            <div className="cb-stage" ref={stageRef}>
                {/* ── Co-browse overlay: agent cursor + activity highlight ─────── */}
                <div className="cb-overlay" aria-hidden>
                    {pulse && (
                        <AgentActivityHighlight
                            x={pulse.x}
                            y={pulse.y}
                            width={pulse.w}
                            height={pulse.h}
                            pulseKey={pulse.key}
                            color="var(--cb-presence)"
                            duration={1600}
                        />
                    )}
                    {cursor.visible && (
                        <AgentCursor
                            x={cursor.x}
                            y={cursor.y}
                            name="Atlas"
                            color="var(--cb-presence)"
                            status={TOUR[step]?.tool}
                        />
                    )}
                </div>

                <div className="cb-shell">
                    {/* ── Running head ──────────────────────────────────────────── */}
                    <div className="cb-head">
                        <Breadcrumbs>
                            <Breadcrumbs.Item href="/inspiration">Inspiration</Breadcrumbs.Item>
                            <Breadcrumbs.Item active>Agent Co-Browse</Breadcrumbs.Item>
                        </Breadcrumbs>
                        <div className="cb-mark">
                            <span className="cb-mark__logo" aria-hidden>F</span>
                            <span className="cb-mark__name">FIELDWORK</span>
                            <Badge className="cb-tag cb-tag--live" size="sm" dot>session live</Badge>
                        </div>
                        <nav className="cb-headnav" aria-label="Studio">
                            <a href="#work">Work</a>
                            <a href="#studio">Studio</a>
                            <a href="#contact">Contact</a>
                        </nav>
                    </div>
                    <hr className="cb-rule" />

                    {/* ── Hero ──────────────────────────────────────────────────── */}
                    <section className="cb-section cb-hero" data-tour="cb-hero" aria-labelledby="cb-hero-h">
                        <div className="cb-grid" style={{ rowGap: 36 }}>
                            <div data-cb-col style={{ gridColumn: "1 / span 8" }}>
                                <div className="cb-eyebrow"><b>00</b>&nbsp;Index — a Human+ design &amp; engineering studio</div>
                                <h1 id="cb-hero-h" className="cb-display" style={{ marginTop: 26 }}>
                                    An agent tours <span className="cb-accent">the work</span> beside you.
                                </h1>
                                <p className="cb-lede" style={{ marginTop: 26 }}>
                                    FIELDWORK designs and builds interfaces humans and agents share. This very page is
                                    co-browsed — press play and let <b>Atlas</b>, our resident agent, walk you through it.
                                </p>
                                <div className="cb-cta-row">
                                    <Button className="cb-btn-primary" onClick={startTour} iconTrailing={playing ? "pause" : "arrow-right"}>
                                        {playing ? "Pause tour" : step > 0 ? "Resume tour" : "Take the tour"}
                                    </Button>
                                    <Button className="cb-btn-ghost" href="#work" iconTrailing="arrow-down">
                                        Skip to work
                                    </Button>
                                    <span className="cb-autopilot">
                                        <Switch checked={autopilot} onCheckedChange={setAutopilot} color="cyan" />
                                        <span>Let Atlas drive</span>
                                    </span>
                                </div>
                            </div>
                            <div data-cb-col style={{ gridColumn: "10 / span 3" }}>
                                <div className="cb-hero__aside">
                                    <span className="cb-availability">
                                        <span className="dot" /> Co-pilot online
                                    </span>
                                    <Separator className="!my-1" />
                                    <div className="cb-meta">
                                        Lisbon · Remote
                                        <br />
                                        38.72° N, 9.14° W
                                    </div>
                                    <Separator className="!my-1" />
                                    <div className="cb-meta">
                                        Human+ product
                                        <br />
                                        Design systems
                                        <br />
                                        Co-browse &amp; onboarding
                                        <br />
                                        Design engineering
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* ── Client ticker ─────────────────────────────────────────── */}
                    <div className="cb-ticker" aria-label="Selected clients">
                        <div className="cb-ticker__track">
                            {[...CLIENTS, ...CLIENTS].map((c, i) => (
                                <span key={`${c}-${i}`} className="cb-ticker__item">
                                    {c}
                                    <span className="cb-ticker__sep" aria-hidden> · </span>
                                </span>
                            ))}
                        </div>
                    </div>

                    {/* ── Figures band ──────────────────────────────────────────── */}
                    <section className="cb-section" data-tour="cb-figures" aria-label="Studio in numbers">
                        <div className="cb-grid" style={{ rowGap: 32 }}>
                            {[
                                { num: "2018", label: "Founded", em: false },
                                { num: "150", suffix: "+", label: "Surfaces shipped" },
                                { num: "06", label: "Humans" },
                                { num: "01", label: "Resident agent", em: true },
                            ].map((f) => (
                                <div key={f.label} data-cb-col className="cb-figure" style={{ gridColumn: "span 3" }}>
                                    <div className="cb-figure__num">
                                        {f.em ? <em>{f.num}</em> : f.num}
                                        {f.suffix ? <em>{f.suffix}</em> : null}
                                    </div>
                                    <div className="cb-figure__label">{f.label}</div>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* ── Featured work — co-browsed preview frames ─────────────── */}
                    <section className="cb-section" id="work" data-tour="cb-work" aria-labelledby="cb-feat">
                        <div className="cb-section-head">
                            <div>
                                <div className="cb-eyebrow"><b>01</b>&nbsp;Featured</div>
                                <Heading as="h2" size="2xl" weight="semibold" className="cb-h2" id="cb-feat" style={{ marginTop: 14 }}>
                                    Three shared surfaces.
                                </Heading>
                            </div>
                            <Badge className="cb-tag cb-tag--accent" size="md" dot>2024 — 2025</Badge>
                        </div>

                        <div className="cb-grid" style={{ rowGap: 28 }}>
                            {featured.map((p) => (
                                <div key={p.num} data-cb-col className="cb-preview" style={{ gridColumn: "span 4", position: "relative" }}>
                                    <Link
                                        href="/inspiration/cobrowse#work"
                                        className="cb-stretch"
                                        aria-label={`${p.title} — ${p.discipline}`}
                                    />
                                    <FauxClient
                                        variant="browser"
                                        url={`${p.title.toLowerCase()}.app`}
                                        meta="2 here"
                                        dots
                                        className="cb-faux"
                                        bodyClassName="cb-faux__body"
                                    >
                                        <div className="cb-faux__canvas">
                                            <div className="cb-faux__glyph">
                                                {p.glyph}
                                                <span>.</span>
                                            </div>
                                            <span className="cb-faux__ghost" aria-hidden />
                                        </div>
                                    </FauxClient>
                                    <div className="cb-preview__meta">
                                        <div>
                                            <div className="cb-preview__title">{p.title}</div>
                                            <div className="cb-preview__disc">{p.discipline}</div>
                                        </div>
                                        {p.award ? (
                                            <Badge className="cb-tag cb-tag--accent" size="sm">{p.award}</Badge>
                                        ) : (
                                            <span className="cb-meta">{p.year} ↗</span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* ── Selected work — typographic index ─────────────────────── */}
                    <section className="cb-section" aria-labelledby="cb-index">
                        <div className="cb-section-head">
                            <div>
                                <div className="cb-eyebrow"><b>02</b>&nbsp;Selected work</div>
                                <Heading as="h2" size="2xl" weight="semibold" className="cb-h2" id="cb-index" style={{ marginTop: 14 }}>
                                    The full index.
                                </Heading>
                            </div>
                            <Pillbox
                                value={tags}
                                onChange={setTags}
                                placeholder="Filter by discipline…"
                                className="cb-input !w-72"
                                aria-label="Filter work by discipline"
                            />
                        </div>

                        <div className="cb-index">
                            {pageProjects.map((p) => (
                                <div key={p.num} className="cb-index__row">
                                    <Link
                                        href="/inspiration/cobrowse#work"
                                        className="cb-stretch"
                                        aria-label={`${p.title} — ${p.discipline}`}
                                    />
                                    <span className="cb-index__num">{p.num}</span>
                                    <span className="cb-index__title">{p.title}</span>
                                    <span className="cb-index__disc">{p.discipline}</span>
                                    <span className="cb-index__year">{p.year} <ArrowUpRight size={13} aria-hidden /></span>
                                </div>
                            ))}
                        </div>

                        <div className="cb-index-foot">
                            <span className="cb-meta">
                                Showing {(page - 1) * PER_PAGE + 1}–{Math.min(page * PER_PAGE, PROJECTS.length)} of {PROJECTS.length}
                            </span>
                            <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
                        </div>
                    </section>

                    {/* ── Capabilities (tabs) ───────────────────────────────────── */}
                    <section className="cb-section" id="studio" data-tour="cb-cap" aria-labelledby="cb-cap-h">
                        <div className="cb-eyebrow"><b>03</b>&nbsp;Capabilities</div>
                        <Heading as="h2" size="2xl" weight="semibold" className="cb-h2" id="cb-cap-h" style={{ margin: "14px 0 26px" }}>
                            Four disciplines, one shared surface.
                        </Heading>

                        <Tabs defaultTab="services" variant="underline" className="cb-tabs">
                            <Tabs.List>
                                <Tabs.Tab value="services">Services</Tabs.Tab>
                                <Tabs.Tab value="process">Process</Tabs.Tab>
                                <Tabs.Tab value="faq">Questions</Tabs.Tab>
                            </Tabs.List>
                            <Tabs.Panels>
                                <Tabs.Panel value="services">
                                    <div className="cb-grid" style={{ rowGap: 34, marginTop: 10 }}>
                                        {SERVICES.map((s) => (
                                            <div key={s.no} data-cb-col className="cb-cap" style={{ gridColumn: "span 3" }}>
                                                <span className="cb-cap__no">{s.no}</span>
                                                <h3 className="cb-cap__title">{s.title}</h3>
                                                <p className="cb-cap__body">{s.body}</p>
                                                <div className="cb-cap__tags">
                                                    {s.tags.map((t) => (
                                                        <Badge key={t} className="cb-tag" size="sm">{t}</Badge>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </Tabs.Panel>

                                <Tabs.Panel value="process">
                                    <div style={{ maxWidth: 680, marginTop: 18 }}>
                                        <Timeline
                                            className="cb-timeline"
                                            events={[
                                                { date: "Week 0", title: "Discovery", description: "Goals, audience, constraints. A fixed-fee proposal with dates we hold.", color: "zinc" },
                                                { date: "Weeks 1–3", title: "Direction", description: "Two or three routes, explored until a decision is real rather than abstract.", color: "zinc" },
                                                { date: "Weeks 4–8", title: "System & bridges", description: "The chosen direction built into a documented system, shipped as production React with the MCP relay wired.", color: "cyan" },
                                                { date: "Handoff", title: "Handoff", description: "Source, tokens, and a live co-browse session so your team — and their agents — own it.", color: "zinc" },
                                            ]}
                                        />
                                    </div>
                                </Tabs.Panel>

                                <Tabs.Panel value="faq">
                                    <div style={{ maxWidth: 760, marginTop: 10 }}>
                                        <Accordion type="single" defaultOpen={["q0"]} className="cb-accordion">
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
                    </section>

                    {/* ── About ─────────────────────────────────────────────────── */}
                    <section className="cb-section" aria-labelledby="cb-about">
                        <div className="cb-grid">
                            <div data-cb-col style={{ gridColumn: "1 / span 3" }}>
                                <div className="cb-eyebrow"><b>04</b>&nbsp;Studio</div>
                            </div>
                            <div data-cb-col style={{ gridColumn: "4 / span 8" }}>
                                <p className="cb-quote" id="cb-about">
                                    The best interface is <b>inhabited</b> — a person and an agent on the same surface,
                                    trading control without either one ever scraping the screen.
                                </p>
                                <Text as="p" size="md" color="muted" className="!mt-6 !leading-relaxed">
                                    FIELDWORK started in 2018 as designers who wanted to build, and engineers who wanted
                                    to design. We've stayed small on purpose — six people and one resident agent. We take
                                    a handful of projects at a time and co-pilot every one.
                                </Text>
                            </div>
                        </div>
                    </section>

                    {/* ── Team ──────────────────────────────────────────────────── */}
                    <section className="cb-section" data-tour="cb-team" aria-labelledby="cb-team-h">
                        <div className="cb-eyebrow"><b>05</b>&nbsp;People</div>
                        <Heading as="h2" size="2xl" weight="semibold" className="cb-h2" id="cb-team-h" style={{ margin: "14px 0 30px" }}>
                            Six humans, one agent.
                        </Heading>
                        <div className="cb-grid" style={{ rowGap: 28 }}>
                            {TEAM.map((m) => (
                                <div key={m.name} data-cb-col className={`cb-person${m.agent ? " cb-person--agent" : ""}`} style={{ gridColumn: "span 3" }}>
                                    <div className="cb-person__av">
                                        <Avatar fallback={m.initials} size="lg" />
                                        {m.agent && <span className="cb-person__pulse" aria-hidden />}
                                    </div>
                                    <div className="cb-person__name">
                                        {m.name}
                                        {m.agent && <Badge className="cb-tag cb-tag--accent" size="sm">agent</Badge>}
                                    </div>
                                    <div className="cb-meta cb-person__role">{m.role}</div>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* ── Recognition + clients ─────────────────────────────────── */}
                    <section className="cb-section" aria-labelledby="cb-recog">
                        <div className="cb-grid" style={{ rowGap: 36 }}>
                            <div data-cb-col style={{ gridColumn: "1 / span 7" }}>
                                <div className="cb-eyebrow"><b>06</b>&nbsp;Recognition</div>
                                <Heading as="h2" size="lg" weight="semibold" id="cb-recog" className="!mt-4 !mb-5" style={{ color: "var(--cb-ink)" }}>
                                    Selected awards
                                </Heading>
                                <div className="cb-table">
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
                                                <Table.Cell>Fast Company — Innovation by Design, finalist</Table.Cell>
                                            </Table.Row>
                                        </Table.Body>
                                    </Table>
                                </div>
                            </div>

                            <div data-cb-col style={{ gridColumn: "9 / span 4" }}>
                                <div className="cb-eyebrow">Selected clients</div>
                                <div className="cb-clientwrap">
                                    {CLIENTS.map((c) => (
                                        <Badge key={c} className="cb-tag" size="md">{c}</Badge>
                                    ))}
                                </div>
                                <Separator className="!my-7" />
                                <div className="cb-eyebrow">Press</div>
                                <ul className="cb-press">
                                    <li className="cb-meta cb-meta--ink">Smashing Magazine — Agents in the UI</li>
                                    <li className="cb-meta">The Index №34 — Shared surfaces</li>
                                    <li className="cb-meta">Human+ Weekly — Co-browse, done right</li>
                                </ul>
                            </div>
                        </div>
                    </section>

                    {/* ── Brief / contact ───────────────────────────────────────── */}
                    <section className="cb-section" id="contact" data-tour="cb-contact" aria-labelledby="cb-contact-h">
                        <div className="cb-grid" style={{ rowGap: 36 }}>
                            <div data-cb-col className="cb-brief-aside" style={{ gridColumn: "1 / span 5" }}>
                                <div className="cb-eyebrow"><b>07</b>&nbsp;Contact</div>
                                <Heading as="h2" size="2xl" weight="semibold" className="cb-h2" id="cb-contact-h" style={{ margin: "14px 0 20px" }}>
                                    Atlas can draft the brief.
                                </Heading>
                                <p className="cb-lede" style={{ fontSize: "1rem" }}>
                                    A few sentences is plenty. The agent will draft it with you — you confirm before it
                                    sends. We reply to every brief within two working days.
                                </p>
                                <div className="cb-contact-line" style={{ marginTop: 26 }}>studio@fieldwork.example</div>
                                <div className="cb-contact-sub">+351 21 000 0000</div>

                                <div style={{ marginTop: 30 }}>
                                    <div className="cb-eyebrow">Indicative budget</div>
                                    <Text as="p" size="sm" color="muted" className="!mt-3 !mb-4 !max-w-[36ch]">
                                        Set a rough budget and how firm it is — drag along for the figure, up for
                                        confidence. Atlas reads this to scope; nothing's binding.
                                    </Text>
                                    <MoodMeter
                                        min={15}
                                        max={200}
                                        value={budget}
                                        confidence={budgetConfidence}
                                        onChange={(v, c) => {
                                            setBudget(Math.round(v));
                                            setBudgetConfidence(c);
                                        }}
                                        width={320}
                                        height={180}
                                        prefix="€"
                                        suffix="k"
                                        color="var(--cb-presence)"
                                    />
                                    <div className="cb-meta" style={{ marginTop: 12 }}>
                                        Atlas scoping at{" "}
                                        <ReasonTag
                                            value={`€${budget}k`}
                                            reason="Indicative only — the proposal sets the fixed fee after discovery. Drawn from your budget pad and the project type."
                                            confidence={budgetConfidence}
                                            by="Atlas"
                                            theme="underline"
                                        />{" "}
                                        · confidence {Math.round(budgetConfidence * 100)}%
                                    </div>
                                </div>
                            </div>

                            <div data-cb-col style={{ gridColumn: "7 / span 6" }}>
                                <Card variant="outlined" padding="none" className="cb-card">
                                    <Card.Header className="!px-5 !py-4">
                                        <div className="cb-card__head">
                                            <span className="cb-card__title">
                                                <span className="cb-card__dot" aria-hidden /> New brief — co-drafting
                                            </span>
                                            <Tooltip content="Atlas drafts; you confirm before anything sends.">
                                                <Badge className="cb-tag cb-tag--accent" size="sm" dot>agent assisting</Badge>
                                            </Tooltip>
                                        </div>
                                    </Card.Header>
                                    <Card.Body className="!px-5 !py-4">
                                        {submitted ? (
                                            <div style={{ padding: "30px 4px" }}>
                                                <Badge className="cb-tag cb-tag--accent" size="md">Confirmed &amp; sent</Badge>
                                                <p style={{ marginTop: 16, fontSize: 15, color: "var(--cb-ink)", lineHeight: 1.5 }}>
                                                    Thanks — your brief is in. Atlas will reply within two working days.
                                                </p>
                                                <Button
                                                    className="cb-btn-ghost !mt-5"
                                                    icon="arrow-left"
                                                    onClick={() => { setSubmitted(false); setBrief(""); }}
                                                >
                                                    Write another
                                                </Button>
                                            </div>
                                        ) : (
                                            <div className="cb-composer">
                                                <Composer
                                                    value={brief}
                                                    onChange={setBrief}
                                                    onSubmit={() => setBrief((b) => b)}
                                                    placeholder="What are you building, and what's the deadline?"
                                                    className="!border-0 !rounded-none"
                                                />
                                                <div className="cb-composer__foot">
                                                    <Text as="span" size="xs" color="muted">
                                                        {brief.trim().length} characters
                                                    </Text>
                                                    <Progress
                                                        value={Math.min(brief.trim().length, 160)}
                                                        max={160}
                                                        variant="bar"
                                                        size="sm"
                                                        color="cyan"
                                                        className="cb-progress !w-40"
                                                    />
                                                </div>
                                            </div>
                                        )}
                                    </Card.Body>
                                    {!submitted && (
                                        <Card.Footer className="!px-5 !py-3">
                                            <div className="cb-card__foot">
                                                <Text as="span" size="xs" color="muted">Agent proposes · you confirm.</Text>
                                                <Button
                                                    className="cb-btn-primary"
                                                    disabled={brief.trim().length < 12}
                                                    iconTrailing="arrow-right"
                                                    onClick={() => setSubmitted(true)}
                                                >
                                                    Confirm &amp; send
                                                </Button>
                                            </div>
                                        </Card.Footer>
                                    )}
                                </Card>
                            </div>
                        </div>
                    </section>

                    {/* ── Footer ────────────────────────────────────────────────── */}
                    <footer className="cb-footer">
                        <div className="cb-footer__top">
                            <div>
                                <div className="cb-mark">
                                    <span className="cb-mark__logo" aria-hidden style={{ width: 22, height: 22, fontSize: 12 }}>F</span>
                                    <span className="cb-mark__name">FIELDWORK</span>
                                </div>
                                <p className="cb-meta" style={{ marginTop: 14, maxWidth: 340 }}>
                                    A Human+ design &amp; engineering studio. Lisbon, working remotely. Designing surfaces
                                    that humans and agents inhabit together since 2018.
                                </p>
                            </div>
                            <div className="cb-footer__links">
                                <a href="#work">Work ↗</a>
                                <a href="https://fieldwork.example" target="_blank" rel="noopener noreferrer">Instagram ↗</a>
                                <a href="#contact">Contact ↗</a>
                                <a href="https://fieldwork.example" target="_blank" rel="noopener noreferrer">LinkedIn ↗</a>
                            </div>
                        </div>

                        <hr className="cb-rule" style={{ margin: "32px 0 18px" }} />

                        <div className="cb-footer__base">
                            <span className="cb-meta">FIELDWORK — a fictional studio, for demonstration · Style {style.num} / Agent Co-Browse</span>
                            <Link href="/inspiration" className="cb-back">
                                <ArrowLeft size={14} />
                                Back to the gallery
                            </Link>
                        </div>
                    </footer>
                </div>
            </div>

            {/* ── Co-browse rail: agent identity + tool-call feed + tour controls ── */}
            <aside className="cb-rail" aria-label="Agent co-browse session">
                <div className="cb-rail__bar">
                    <span className="cb-rail__id">
                        <span className="cb-rail__avatar" aria-hidden>AT</span>
                        <span>
                            <b>Atlas</b>
                            <em>co-browsing · {playing ? "touring" : step > 0 ? "paused" : "idle"}</em>
                        </span>
                    </span>
                    <span className="cb-rail__step">{String(Math.min(step + 1, TOUR.length)).padStart(2, "0")}/{String(TOUR.length).padStart(2, "0")}</span>
                </div>

                <div className="cb-rail__panel">
                    <AgentPanel
                        agent={{ name: "Atlas", color: "var(--cb-presence)" }}
                        activity={activity}
                        className="cb-agentpanel"
                    />
                </div>

                <div className="cb-rail__controls">
                    <button type="button" className="cb-ctrl cb-ctrl--primary" onClick={startTour} aria-label={playing ? "Pause tour" : "Play tour"}>
                        {playing ? <Pause size={15} /> : <Play size={15} />}
                        {playing ? "Pause" : "Play tour"}
                    </button>
                    <button type="button" className="cb-ctrl" onClick={stepOnce} aria-label="Step forward">
                        <SkipForward size={15} />
                        Step
                    </button>
                </div>
            </aside>
        </div>
    );
}
