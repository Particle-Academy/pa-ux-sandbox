import "./agentic.css";
import { Link } from "@inertiajs/react";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import {
    Accordion,
    Avatar,
    Badge,
    Breadcrumbs,
    Button,
    Callout,
    Card,
    Heading,
    MagicWand,
    MoodMeter,
    Progress,
    PromptInput,
    ReasonTag,
    Separator,
    Tabs,
    Text,
    Timeline,
    Tooltip,
} from "@particle-academy/react-fancy";
import {
    ArrowLeft,
    ArrowUpRight,
    CheckCircle2,
    CircuitBoard,
    Cpu,
    Sparkles,
    Terminal,
    Wand2,
    Zap,
} from "lucide-react";
import type { Style } from "../../types";

/**
 * Inspiration Gallery · Style — Agentic Studio (dark).
 *
 * FIELDWORK rendered as an AI-native studio you brief THROUGH an agent. The
 * page is a near-black, terminal-grade console: a PromptInput-led "scoping"
 * flow where you describe a project and a simulated agent scopes it, streams a
 * tool-call feed, proposes a plan, and "books" the engagement. Electric
 * sky→violet accents, mono labels, glowing hairline borders, MagicWand on the
 * brief. The react-fancy primitives are restyled HARD so they read native to
 * an agent console — proof the same kit can wear an entirely different idiom.
 *
 * Mounted by Inspiration/Show.tsx for `style.id === "agentic"`. SSR-safe: no
 * module-level browser APIs; the streaming feed runs inside useEffect, gated by
 * a user action. Inner links use the stretched-link pattern (one <Link> per
 * row) so no anchor nests inside another (avoids React #418 under SSR).
 */

type ToolCall = {
    id: string;
    tool: string;
    args: string;
    result: string;
    ms: number;
};

const SCOPE_FEED: ToolCall[] = [
    { id: "t1", tool: "studio.read_brief", args: "{ source: \"composer\" }", result: "parsed · 1 goal, 2 constraints", ms: 120 },
    { id: "t2", tool: "studio.match_capabilities", args: "{ tags: [\"brand\",\"product\"] }", result: "3 leads · Vester, Okonkwo, Pell", ms: 240 },
    { id: "t3", tool: "studio.estimate_scope", args: "{ surface: \"web + identity\" }", result: "8–10 wks · €72k ± 18%", ms: 310 },
    { id: "t4", tool: "studio.draft_plan", args: "{ phases: 4 }", result: "discovery → direction → build → handoff", ms: 180 },
    { id: "t5", tool: "studio.reserve_slot", args: "{ quarter: \"Q3-2026\" }", result: "held 72h · ref FW-2741", ms: 90 },
];

type Capability = {
    no: string;
    title: string;
    body: string;
    tools: string[];
};

const CAPABILITIES: Capability[] = [
    {
        no: "01",
        title: "Agent-native brand systems",
        body: "Identity, naming, and a tokenized system an agent can extend — every rule machine-legible so the brand stays coherent as humans and agents both ship into it.",
        tools: ["brand.tokenize", "name.generate", "voice.lint"],
    },
    {
        no: "02",
        title: "Human+ product surfaces",
        body: "Interfaces humans and agents share — controlled state, stable handles, MCP bridges. We design the affordance the agent inhabits, not a screen it scrapes.",
        tools: ["surface.wire", "bridge.register", "presence.layer"],
    },
    {
        no: "03",
        title: "Scoped, tool-call delivery",
        body: "Research, prototypes, and production components shipped as a stream of reviewable tool calls — every change proposed, staged, and confirmed before it lands.",
        tools: ["plan.stage", "diff.review", "ship.confirm"],
    },
    {
        no: "04",
        title: "Motion & generative systems",
        body: "Title work, environmental graphics, and generative pieces driven by prompts and seeds — type and space, composed by hand and extended by agents.",
        tools: ["motion.seed", "render.queue", "frame.grade"],
    },
];

const TEAM = [
    { name: "Anja Vester", role: "Founder · design director", initials: "AV", focus: "brand systems" },
    { name: "Rhea Okonkwo", role: "Human+ product lead", initials: "RO", focus: "agent surfaces" },
    { name: "Tomas Pell", role: "Type & editorial", initials: "TP", focus: "generative type" },
    { name: "Liang Mori", role: "Motion & 3D", initials: "LM", focus: "render systems" },
];

const CLIENTS = ["Meridian", "Quanta Labs", "Northwind AI", "Atlas Botanic", "Ostro", "Helix Robotics", "Paper Radio", "Studio Føn"];

const FAQ = [
    {
        q: "How does the agent actually scope my project?",
        a: "You describe the work in the composer. The studio agent parses it into goals + constraints, matches our capabilities, estimates scope, and drafts a phased plan — every step is a tool call you can read. A human partner reviews before anything is booked.",
    },
    {
        q: "Is the estimate binding?",
        a: "No. The composer estimate is indicative — drawn from your brief and the project type. The fixed fee lands in the proposal after a short discovery call, and we hold the dates we commit to.",
    },
    {
        q: "Do you build Human+ surfaces specifically?",
        a: "It's most of what we do now. Controlled components, stable handles, MCP bridges, agent presence — UIs where a human and an agent trade control fluidly rather than the agent driving a headless browser.",
    },
    {
        q: "Can your agent hand off to our team?",
        a: "Yes. Everything ships as documented systems and reviewable diffs. Your team — and your agents — own it the moment we hand off, with the bridges and tokens to extend it independently.",
    },
];

const PLAN_PHASES = [
    { date: "Phase 0", title: "Discovery", description: "A short call to confirm goals, audience, and constraints. The agent's scope becomes a fixed-fee proposal with dates.", color: "sky" as const },
    { date: "Phase 1", title: "Direction", description: "Two or three routes, explored to the point where a decision is real. Agent-rendered variations, human-graded.", color: "violet" as const },
    { date: "Phase 2", title: "Build", description: "The chosen route built into a tokenized, bridgeable system — shipped as a stream of reviewable tool calls.", color: "indigo" as const },
    { date: "Phase 3", title: "Handoff", description: "Source, tokens, MCP bridges, and a working session so your humans and agents run with it.", color: "emerald" as const },
];

const WAND_ACTIONS = [
    { id: "tighten", label: "Tighten", hint: "say it in fewer words", tag: "edit", run: (s: string) => s.replace(/\s+/g, " ").trim() },
    { id: "constraints", label: "Add constraints", hint: "append a deadline + budget hint", tag: "scope", run: (s: string) => `${s.trim()} — needs to ship by Q3, budget is flexible but lean.` },
    { id: "agentize", label: "Make it Human+", hint: "frame for an agent-driveable surface", tag: "ai", run: (s: string) => `${s.trim()} The product should let an agent drive the same UI a human uses.` },
];

export default function Agentic({ style }: { style: Style }) {
    // ── The brief composer + scoping flow ───────────────────────────────────
    const [brief, setBrief] = useState(
        "We're a robotics startup launching a fleet dashboard. We need a brand and a product UI where an operator and an autonomous agent can both drive the controls.",
    );
    const [phase, setPhase] = useState<"idle" | "scoping" | "scoped">("idle");
    const [visibleCalls, setVisibleCalls] = useState(0);
    const [budget, setBudget] = useState(72);
    const [budgetConfidence, setBudgetConfidence] = useState(0.64);
    const timers = useRef<number[]>([]);

    const clearTimers = useCallback(() => {
        timers.current.forEach((t) => window.clearTimeout(t));
        timers.current = [];
    }, []);

    const runScope = useCallback(() => {
        clearTimers();
        setPhase("scoping");
        setVisibleCalls(0);
    }, [clearTimers]);

    // Stream the tool-call feed once scoping starts (browser-only).
    useEffect(() => {
        if (phase !== "scoping") return;
        let acc = 320;
        SCOPE_FEED.forEach((_, i) => {
            const t = window.setTimeout(() => {
                setVisibleCalls(i + 1);
                if (i === SCOPE_FEED.length - 1) {
                    const done = window.setTimeout(() => setPhase("scoped"), 460);
                    timers.current.push(done);
                }
            }, acc);
            acc += SCOPE_FEED[i].ms + 360;
            timers.current.push(t);
        });
        return clearTimers;
    }, [phase, clearTimers]);

    useEffect(() => clearTimers, [clearTimers]);

    return (
        <div className="insp-agentic">
            <div className="ag-shell">
                {/* ── Console rail: breadcrumbs + studio mark + status ─────────── */}
                <div className="ag-topbar">
                    <Breadcrumbs>
                        <Breadcrumbs.Item href="/inspiration">Inspiration</Breadcrumbs.Item>
                        <Breadcrumbs.Item active>Agentic Studio</Breadcrumbs.Item>
                    </Breadcrumbs>
                    <div className="ag-mark">
                        <span className="ag-mark__glyph brand-gradient" aria-hidden>
                            <CircuitBoard size={14} strokeWidth={2.4} />
                        </span>
                        <span className="ag-mark__name">FIELDWORK</span>
                        <Badge color="sky" variant="outline" size="sm" className="ag-badge ag-badge--mono">
                            agent online
                        </Badge>
                    </div>
                </div>

                {/* ── Hero: the studio is an agent you brief ───────────────────── */}
                <section className="ag-hero" aria-labelledby="ag-hero-h">
                    <div className="ag-hero__copy">
                        <div className="ag-eyebrow">
                            <Terminal size={12} strokeWidth={2.5} />
                            <span>studio://fieldwork — booking console</span>
                            <span className="ag-cursor" aria-hidden />
                        </div>
                        <h1 id="ag-hero-h" className="ag-display">
                            Brief the studio.
                            <br />
                            <span className="ag-display__grad">An agent scopes &amp; books it.</span>
                        </h1>
                        <p className="ag-lede">
                            FIELDWORK is a design &amp; product studio for the agent era. Describe the work below — our
                            studio agent parses it, matches capabilities, estimates scope, and reserves a slot, every
                            step a tool call you can read. A human partner confirms before anything is real.
                        </p>
                        <div className="ag-hero__chips">
                            <Badge color="violet" variant="soft" size="md" dot>Human+ product</Badge>
                            <Badge color="sky" variant="soft" size="md" dot>Brand systems</Badge>
                            <Badge color="indigo" variant="soft" size="md" dot>Generative motion</Badge>
                        </div>
                    </div>

                    {/* The brief composer — the core agentic flow. */}
                    <Card variant="outlined" padding="none" className="ag-console">
                        <Card.Header className="ag-console__head">
                            <div className="ag-console__title">
                                <Sparkles size={14} className="ag-spark" />
                                <span>new brief</span>
                            </div>
                            <div className="ag-console__dots" aria-hidden>
                                <i /><i /><i />
                            </div>
                        </Card.Header>
                        <Card.Body className="ag-console__body">
                            <PromptInput
                                budgetTokens={8000}
                                placeholder="Describe the project — goals, surface, deadline…"
                                showHint
                                commands={[
                                    { name: "/scope", hint: "estimate timeline + budget" },
                                    { name: "/team", hint: "match the right people" },
                                    { name: "/humanplus", hint: "frame as an agent-driveable surface" },
                                ]}
                                mentions={[
                                    { id: "anja", name: "Anja", kind: "person" },
                                    { id: "rhea", name: "Rhea", kind: "person" },
                                    { id: "agent", name: "studio-agent", kind: "agent" },
                                ]}
                                onSubmit={(text) => {
                                    if (text.trim()) setBrief(text.trim());
                                    runScope();
                                }}
                            />
                            <div className="ag-console__row">
                                <Text as="span" size="xs" className="ag-mono ag-dim">
                                    {brief.trim().length} chars · ~{Math.max(1, Math.round(brief.trim().length / 4))} tokens
                                </Text>
                                <Button
                                    color="violet"
                                    size="sm"
                                    iconTrailing="arrow-right"
                                    className="ag-btn ag-btn--accent"
                                    onClick={runScope}
                                    loading={phase === "scoping"}
                                >
                                    {phase === "scoped" ? "Re-scope" : "Scope it"}
                                </Button>
                            </div>
                        </Card.Body>
                    </Card>
                </section>

                {/* ── Tool-call feed + proposed plan ───────────────────────────── */}
                <section className="ag-section" aria-labelledby="ag-feed-h">
                    <SectionHead n="01" label="scoping run" icon={<Cpu size={13} />} title="The agent works in the open." />
                    <div className="ag-feed-grid">
                        {/* Live tool-call stream */}
                        <div className="ag-feed">
                            <div className="ag-feed__bar">
                                <span className="ag-mono ag-dim">studio-agent · scope run</span>
                                <Badge
                                    size="sm"
                                    color={phase === "scoped" ? "emerald" : phase === "scoping" ? "amber" : "zinc"}
                                    variant="soft"
                                    dot
                                    className="ag-badge ag-badge--mono"
                                >
                                    {phase === "scoped" ? "complete" : phase === "scoping" ? "running" : "idle"}
                                </Badge>
                            </div>

                            {phase === "idle" ? (
                                <div className="ag-feed__empty">
                                    <Wand2 size={18} className="ag-dim" />
                                    <p>Submit a brief above — the agent&apos;s tool calls stream here.</p>
                                </div>
                            ) : (
                                <ol className="ag-calls">
                                    {SCOPE_FEED.slice(0, visibleCalls).map((c) => (
                                        <li key={c.id} className="ag-call">
                                            <span className="ag-call__icon" aria-hidden>
                                                <Zap size={12} strokeWidth={2.6} />
                                            </span>
                                            <div className="ag-call__main">
                                                <code className="ag-call__tool">
                                                    {c.tool}
                                                    <span className="ag-call__args">{c.args}</span>
                                                </code>
                                                <span className="ag-call__result">
                                                    <CheckCircle2 size={12} /> {c.result}
                                                </span>
                                            </div>
                                            <span className="ag-call__ms ag-mono">{c.ms}ms</span>
                                        </li>
                                    ))}
                                    {phase === "scoping" && visibleCalls < SCOPE_FEED.length && (
                                        <li className="ag-call ag-call--pending">
                                            <span className="ag-call__icon ag-call__icon--spin" aria-hidden>
                                                <Cpu size={12} strokeWidth={2.6} />
                                            </span>
                                            <span className="ag-mono ag-dim">thinking…</span>
                                        </li>
                                    )}
                                </ol>
                            )}
                        </div>

                        {/* Proposed plan / scope card — appears when scoped */}
                        <div className="ag-scope">
                            {phase === "scoped" ? (
                                <Card variant="outlined" padding="none" className="ag-scope__card">
                                    <Card.Header className="ag-scope__head">
                                        <span className="ag-mono ag-dim">proposed scope</span>
                                        <Badge color="emerald" variant="soft" size="sm" dot className="ag-badge ag-badge--mono">
                                            slot held
                                        </Badge>
                                    </Card.Header>
                                    <Card.Body className="ag-scope__body">
                                        <div className="ag-scope__line">
                                            <span className="ag-scope__k">timeline</span>
                                            <span className="ag-scope__v">8–10 weeks</span>
                                        </div>
                                        <div className="ag-scope__line">
                                            <span className="ag-scope__k">estimate</span>
                                            <span className="ag-scope__v">
                                                <ReasonTag
                                                    value={`€${budget}k`}
                                                    reason="Indicative only — drawn from your brief and project type. The fixed fee is set in the proposal after discovery."
                                                    confidence={budgetConfidence}
                                                    by="studio-agent"
                                                    theme="underline"
                                                    className="ag-reason"
                                                />{" "}
                                                <span className="ag-dim">± {Math.round((1 - budgetConfidence) * 30)}%</span>
                                            </span>
                                        </div>
                                        <div className="ag-scope__line">
                                            <span className="ag-scope__k">leads</span>
                                            <span className="ag-scope__v">Vester · Okonkwo</span>
                                        </div>
                                        <div className="ag-scope__line">
                                            <span className="ag-scope__k">ref</span>
                                            <span className="ag-scope__v ag-mono">FW-2741</span>
                                        </div>
                                        <Separator className="ag-sep" />
                                        <Text as="p" size="xs" className="ag-dim ag-tune-copy">
                                            Tune the budget pad — drag for the figure, up for confidence. It only sharpens the
                                            estimate; nothing is binding.
                                        </Text>
                                        <div className="ag-mood">
                                            <MoodMeter
                                                min={20}
                                                max={160}
                                                value={budget}
                                                confidence={budgetConfidence}
                                                onChange={(v, c) => {
                                                    setBudget(Math.round(v));
                                                    setBudgetConfidence(c);
                                                }}
                                                posted={{ value: 72, confidence: 0.64 }}
                                                width={300}
                                                height={150}
                                                prefix="€"
                                                suffix="k"
                                                color="var(--ag-accent)"
                                                postedColor="var(--ag-accent-2)"
                                            />
                                        </div>
                                    </Card.Body>
                                    <Card.Footer className="ag-scope__foot">
                                        <Text as="span" size="xs" className="ag-dim">A human confirms within 1 working day.</Text>
                                        <Button color="violet" size="sm" iconTrailing="arrow-up-right" className="ag-btn ag-btn--accent" href="#brief">
                                            Book discovery
                                        </Button>
                                    </Card.Footer>
                                </Card>
                            ) : (
                                <div className="ag-scope__placeholder">
                                    <CircuitBoard size={22} className="ag-dim" />
                                    <p className="ag-mono ag-dim">awaiting scope run…</p>
                                    <span className="ag-scope__hint">The proposed plan, estimate &amp; held slot land here.</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Phased plan timeline */}
                    <div className="ag-plan">
                        <Timeline
                            events={PLAN_PHASES.map((p) => ({ date: p.date, title: p.title, description: p.description, color: p.color }))}
                        />
                    </div>
                </section>

                {/* ── Capabilities — tool-surfaced ─────────────────────────────── */}
                <section className="ag-section" aria-labelledby="ag-cap-h">
                    <SectionHead n="02" label="capabilities" icon={<Sparkles size={13} />} title="What the studio can do, as tools." />
                    <div className="ag-cap-grid">
                        {CAPABILITIES.map((c) => (
                            <article key={c.no} className="ag-cap">
                                <span className="ag-cap__no ag-mono">{c.no}</span>
                                <h3 className="ag-cap__title">{c.title}</h3>
                                <p className="ag-cap__body">{c.body}</p>
                                <div className="ag-cap__tools">
                                    {c.tools.map((t) => (
                                        <span key={t} className="ag-tool-chip">{t}</span>
                                    ))}
                                </div>
                            </article>
                        ))}
                    </div>
                </section>

                {/* ── Telemetry band ──────────────────────────────────────────── */}
                <section className="ag-section ag-section--tight" aria-label="Studio telemetry">
                    <div className="ag-metrics">
                        {[
                            { num: "2016", label: "founded", sub: "agent-first since '23" },
                            { num: "140+", label: "runs shipped", sub: "projects delivered" },
                            { num: "11", label: "operators", sub: "humans + agents" },
                            { num: "18", label: "recognitions", sub: "awards & press" },
                        ].map((m) => (
                            <div key={m.label} className="ag-metric">
                                <div className="ag-metric__num">{m.num}</div>
                                <div className="ag-metric__label ag-mono">{m.label}</div>
                                <div className="ag-metric__sub">{m.sub}</div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* ── About + how-we-work tabs ─────────────────────────────────── */}
                <section className="ag-section" aria-labelledby="ag-about-h">
                    <SectionHead n="03" label="operating model" icon={<Cpu size={13} />} title="A small studio that ships like a system." />
                    <Tabs defaultTab="ethos" variant="underline" className="ag-tabs">
                        <Tabs.List>
                            <Tabs.Tab value="ethos">Ethos</Tabs.Tab>
                            <Tabs.Tab value="stack">Stack</Tabs.Tab>
                            <Tabs.Tab value="faq">Questions</Tabs.Tab>
                        </Tabs.List>
                        <Tabs.Panels>
                            <Tabs.Panel value="ethos">
                                <div className="ag-ethos">
                                    <p className="ag-ethos__lead">
                                        The best work is mostly invisible — a system that quietly holds while humans and
                                        agents both build into it.
                                    </p>
                                    <Text as="p" size="md" className="ag-ethos__body">
                                        FIELDWORK began in 2016 and went agent-first in 2023. We&apos;re eleven now — small
                                        enough that the people (and agents) you brief are the ones who do the work. We take
                                        a handful of engagements at a time and give each our full attention, scoping every
                                        one in the open so you always know what we&apos;re doing and why.
                                    </Text>
                                    <Callout color="violet" icon={<Sparkles size={16} />} className="ag-callout">
                                        Every deliverable ships as a reviewable diff. The agent proposes, a human confirms,
                                        you approve — trust, but verify.
                                    </Callout>
                                </div>
                            </Tabs.Panel>

                            <Tabs.Panel value="stack">
                                <div className="ag-stack">
                                    {[
                                        { k: "design", v: "tokenized systems · Tailwind v4 · Fancy UI primitives" },
                                        { k: "product", v: "React 19 · Inertia · controlled components + MCP bridges" },
                                        { k: "agents", v: "agent-integrations · presence · staged writes · undo" },
                                        { k: "delivery", v: "reviewable diffs · documented handoff · live working sessions" },
                                    ].map((row) => (
                                        <div key={row.k} className="ag-stack__row">
                                            <span className="ag-stack__k ag-mono">{row.k}</span>
                                            <span className="ag-stack__v">{row.v}</span>
                                        </div>
                                    ))}
                                </div>
                            </Tabs.Panel>

                            <Tabs.Panel value="faq">
                                <div className="ag-faq">
                                    <Accordion type="single" defaultOpen={["q0"]}>
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

                {/* ── Operators (team) ─────────────────────────────────────────── */}
                <section className="ag-section" aria-labelledby="ag-team-h">
                    <SectionHead n="04" label="operators" icon={<Cpu size={13} />} title="The humans behind the agent." />
                    <div className="ag-team">
                        {TEAM.map((m) => (
                            <div key={m.name} className="ag-op">
                                <Avatar fallback={m.initials} size="lg" status="online" glow className="ag-op__avatar" />
                                <div className="ag-op__meta">
                                    <div className="ag-op__name">{m.name}</div>
                                    <div className="ag-op__role ag-mono">{m.role}</div>
                                    <span className="ag-op__focus">{m.focus}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* ── Recognition + clients ────────────────────────────────────── */}
                <section className="ag-section" aria-labelledby="ag-rec-h">
                    <SectionHead n="05" label="signal" icon={<Sparkles size={13} />} title="Trusted by teams shipping into the agent era." />
                    <div className="ag-rec-grid">
                        <div className="ag-clients">
                            <div className="ag-rec-label ag-mono">selected clients</div>
                            <div className="ag-clients__list">
                                {CLIENTS.map((c) => (
                                    <span key={c} className="ag-client">{c}</span>
                                ))}
                            </div>
                        </div>
                        <div className="ag-press">
                            <div className="ag-rec-label ag-mono">press &amp; awards</div>
                            <ul className="ag-press__list">
                                <li><span className="ag-press__src">It&apos;s Nice That</span> Studio of the week</li>
                                <li><span className="ag-press__src">Awwwards</span> Site of the Day · Quanta console</li>
                                <li><span className="ag-press__src">Fast Company</span> Innovation by Design, finalist</li>
                                <li><span className="ag-press__src">Eye Magazine</span> №118 · agentic interfaces</li>
                            </ul>
                        </div>
                    </div>
                </section>

                {/* ── Brief CTA — MagicWand-assisted ───────────────────────────── */}
                <section className="ag-section" id="brief" aria-labelledby="ag-brief-h">
                    <SectionHead n="06" label="start a run" icon={<Wand2 size={13} />} title="Draft your brief. The agent takes it from here." />
                    <div className="ag-brief-grid">
                        <div className="ag-brief__intro">
                            <p className="ag-lede ag-lede--sm">
                                Write a few sentences — highlight any of it to get agent edits inline. When you&apos;re happy,
                                scope it and we&apos;ll confirm within a working day.
                            </p>
                            <div className="ag-brief__contact">
                                <a href="mailto:agent@fieldwork.example" className="ag-link ag-link--accent">agent@fieldwork.example</a>
                                <span className="ag-mono ag-dim">+41 44 000 00 00</span>
                                <Tooltip content="The studio agent is live now — humans confirm within a working day.">
                                    <Badge color="emerald" variant="soft" size="md" dot className="ag-badge">Open · Q3 2026</Badge>
                                </Tooltip>
                            </div>
                            <div className="ag-brief__hint">
                                <Wand2 size={13} className="ag-spark" />
                                <span className="ag-mono ag-dim">tip — select text in the brief for MagicWand actions</span>
                            </div>
                        </div>

                        <Card variant="outlined" padding="none" className="ag-console ag-console--brief">
                            <Card.Header className="ag-console__head">
                                <div className="ag-console__title">
                                    <Wand2 size={14} className="ag-spark" />
                                    <span>draft brief · wand enabled</span>
                                </div>
                                <Badge color="sky" variant="outline" size="sm" className="ag-badge ag-badge--mono">draft</Badge>
                            </Card.Header>
                            <Card.Body className="ag-console__body ag-wand-body">
                                <MagicWand
                                    value={brief}
                                    onValueChange={setBrief}
                                    actions={WAND_ACTIONS}
                                    appearance="floating"
                                    rows={6}
                                    placeholder="What are you building, and what should the agent be able to do?"
                                />
                                <div className="ag-console__row">
                                    <Progress
                                        value={Math.min(brief.trim().length, 280)}
                                        max={280}
                                        variant="bar"
                                        size="sm"
                                        color="violet"
                                        className="ag-progress"
                                    />
                                    <Button
                                        color="violet"
                                        size="sm"
                                        iconTrailing="arrow-up-right"
                                        className="ag-btn ag-btn--accent"
                                        disabled={brief.trim().length < 16}
                                        onClick={runScope}
                                    >
                                        Scope &amp; book
                                    </Button>
                                </div>
                            </Card.Body>
                        </Card>
                    </div>
                </section>

                {/* ── Footer ───────────────────────────────────────────────────── */}
                <footer className="ag-footer">
                    <div className="ag-footer__top">
                        <div className="ag-footer__brand">
                            <span className="ag-mark__glyph brand-gradient" aria-hidden>
                                <CircuitBoard size={13} strokeWidth={2.4} />
                            </span>
                            <span className="ag-mark__name">FIELDWORK</span>
                        </div>
                        <p className="ag-footer__blurb">
                            A design &amp; product studio for the agent era. Brand, Human+ product, and generative motion —
                            briefed through an agent, confirmed by humans, since 2016.
                        </p>
                        <nav className="ag-footer__links ag-mono">
                            <a href="#brief">brief ↗</a>
                            <a href="https://fieldwork.example" target="_blank" rel="noopener noreferrer">github ↗</a>
                            <a href="https://fieldwork.example" target="_blank" rel="noopener noreferrer">mastodon ↗</a>
                            <a href="#brief">contact ↗</a>
                        </nav>
                    </div>
                    <Separator className="ag-sep ag-sep--footer" />
                    <div className="ag-footer__bottom">
                        <span className="ag-mono ag-dim">FIELDWORK — a fictional studio, for demonstration · Style {style.num} / Agentic</span>
                        <Link href="/inspiration" className="ag-link ag-link--accent ag-footer__back">
                            <ArrowLeft size={14} />
                            Back to the gallery
                            <ArrowUpRight size={13} style={{ opacity: 0 }} aria-hidden />
                        </Link>
                    </div>
                </footer>
            </div>
        </div>
    );
}

/* ── Shared section running-head ────────────────────────────────────────────── */
function SectionHead({ n, label, title, icon }: { n: string; label: string; title: string; icon: ReactNode }) {
    return (
        <div className="ag-sechead">
            <div className="ag-eyebrow ag-eyebrow--sec">
                <span className="ag-sechead__n ag-mono">{n}</span>
                <span className="ag-sechead__icon" aria-hidden>{icon}</span>
                <span className="ag-mono">{label}</span>
            </div>
            <Heading as="h2" className="ag-h2">{title}</Heading>
        </div>
    );
}
