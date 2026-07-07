import "./dark.css";

import { Link } from "@inertiajs/react";
import { useState } from "react";
import {
    Accordion,
    Avatar,
    Badge,
    Breadcrumbs,
    Button,
    Card,
    Composer,
    Heading,
    MoodMeter,
    Pagination,
    Pillbox,
    Progress,
    ReasonTag,
    Separator,
    Table,
    Tabs,
    Text,
    Timeline,
    Tooltip,
} from "@particle-academy/react-fancy";
import { ArrowLeft, ArrowUpRight } from "lucide-react";
import type { Style } from "../../types";

/**
 * Inspiration Gallery · Style — Dark Studio.
 *
 * FIELDWORK (a fictional design + dev studio) rendered as a refined, near-black
 * portfolio: deep #0a0b0e surfaces, one disciplined blue accent (blue-500/400),
 * generous negative space, crisp type, mono for labels / numbers / metadata.
 * Swiss-level restraint, in the dark. The whole tree is wrapped in `.insp-dark`,
 * which carries its OWN dark palette (re-pointing the shared semantic tokens) so
 * the surface reads near-black regardless of the host light/dark theme — and so
 * it never collides with Tailwind's `.dark`. The Fancy primitives are restyled
 * HARD via scoped CSS + `dk-*` classes so they wear this idiom natively.
 *
 * Mounted by Inspiration/Show.tsx for `style.id === "dark"`. SSR-safe: no
 * module-level browser APIs; every interactive bit is controlled React state.
 * Inner links use the stretched-link pattern (one <Link> per row) so no anchor
 * is ever nested inside another anchor (avoids React #418 under SSR).
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
    { num: "01", title: "Halcyon", discipline: "Design system, product UI", year: "2025", client: "Halcyon Systems", glyph: "H", award: "Awwwards SOTD" },
    { num: "02", title: "Northpoint", discipline: "Brand, motion identity", year: "2025", client: "Northpoint Capital", glyph: "N" },
    { num: "03", title: "Cinder", discipline: "Web app, data viz", year: "2025", client: "Cinder Analytics", glyph: "C", award: "CSS Design Awards" },
    { num: "04", title: "Atlas Grid", discipline: "Design engineering", year: "2024", client: "Atlas Robotics", glyph: "A" },
    { num: "05", title: "Vellum", discipline: "Editorial platform", year: "2024", client: "Vellum Press", glyph: "V", award: "FWA of the Day" },
    { num: "06", title: "Drift", discipline: "Product, prototyping", year: "2024", client: "Drift Audio", glyph: "D" },
];

const SERVICES = [
    { no: "01", title: "Design systems", body: "Tokens, primitives, and the documented rules that keep a product coherent across teams — built to be inhabited by humans and agents alike.", tags: ["Tokens", "Primitives", "Docs"] },
    { no: "02", title: "Product design", body: "Research, flows, and high-fidelity interface design for software teams — from a fixed-fee discovery to production-ready screens.", tags: ["UX", "UI", "Prototype"] },
    { no: "03", title: "Design engineering", body: "We ship the design. Front-end in React + Tailwind, component libraries, and the bridges that let agents drive the surface.", tags: ["React", "Tailwind", "Human+"] },
    { no: "04", title: "Brand & motion", body: "Identity systems, type, and motion language. The voice and the rhythm that make a product feel like one thing.", tags: ["Identity", "Type", "Motion"] },
];

const TEAM = [
    { name: "Iris Vance", role: "Founder · Design director", initials: "IV" },
    { name: "Kade Mori", role: "Design engineering lead", initials: "KM" },
    { name: "Soraya Bell", role: "Product & systems", initials: "SB" },
    { name: "Theo Lind", role: "Brand & motion", initials: "TL" },
];

const CLIENTS = ["Halcyon", "Northpoint", "Cinder", "Atlas", "Vellum", "Drift", "Lumen", "Forge", "Beacon"];

const FAQ = [
    { q: "How do you scope an engagement?", a: "Every project opens with a short, paid discovery — goals, constraints, and a fixed-fee proposal with dates we hold. No open-ended retainers unless you want one." },
    { q: "Do you build, or just design?", a: "Both. We're a design + engineering studio — most work ships as production React. You can take the design and run, or we ship it end to end." },
    { q: "What does a typical timeline look like?", a: "Design systems run six to ten weeks; product work varies with scope. We commit to dates in the proposal and keep you in the loop weekly." },
    { q: "Can agents drive what you build?", a: "Increasingly, yes. We build to the Human+ contract — controlled state, stable handles, MCP bridges — so an assistant can read and drive the same surface a person uses." },
];

const PER_PAGE = 4;

export default function Dark({ style }: { style: Style }) {
    const [page, setPage] = useState(1);
    const [tags, setTags] = useState<string[]>(["Design systems", "Product"]);
    const [budget, setBudget] = useState(55);
    const [budgetConfidence, setBudgetConfidence] = useState(0.62);
    const [brief, setBrief] = useState("");
    const [submitted, setSubmitted] = useState(false);

    const totalPages = Math.ceil(PROJECTS.length / PER_PAGE);
    const pageProjects = PROJECTS.slice((page - 1) * PER_PAGE, page * PER_PAGE);
    const featured = PROJECTS.slice(0, 3);

    return (
        <div className="insp-dark">
            <div className="dk-shell">
                {/* ── Running head ──────────────────────────────────────────── */}
                <div className="dk-head">
                    <Breadcrumbs>
                        <Breadcrumbs.Item href="/inspiration">Inspiration</Breadcrumbs.Item>
                        <Breadcrumbs.Item active>Dark Studio</Breadcrumbs.Item>
                    </Breadcrumbs>
                    <div className="dk-mark">
                        <span className="dk-mark__logo" aria-hidden>F</span>
                        <span className="dk-mark__name">FIELDWORK</span>
                        <Badge className="dk-tag" size="sm">est. 2017</Badge>
                    </div>
                    <nav className="dk-headnav" aria-label="Studio">
                        <a href="#work">Work</a>
                        <a href="#studio">Studio</a>
                        <a href="#contact">Contact</a>
                    </nav>
                </div>
                <hr className="dk-rule" />

                {/* ── Hero ──────────────────────────────────────────────────── */}
                <section className="dk-section dk-hero" aria-labelledby="dk-hero">
                    <div className="dk-grid" style={{ rowGap: 36 }}>
                        <div data-dk-col style={{ gridColumn: "1 / span 9" }}>
                            <div className="dk-eyebrow"><b>00</b>&nbsp;Index — design &amp; engineering studio</div>
                            <h1 id="dk-hero" className="dk-display" style={{ marginTop: 26 }}>
                                We design and build <span className="dk-accent">interfaces</span> humans and agents share.
                            </h1>
                            <p className="dk-lede" style={{ marginTop: 26 }}>
                                FIELDWORK is a small studio working where product design meets engineering. We build
                                systems that stay legible as they scale — and ship them to production.
                            </p>
                            <div style={{ display: "flex", gap: 12, marginTop: 32, flexWrap: "wrap" }}>
                                <Button className="dk-btn-primary" href="#contact" iconTrailing="arrow-right">
                                    Start a project
                                </Button>
                                <Button className="dk-btn-ghost" href="#work" iconTrailing="arrow-down">
                                    See selected work
                                </Button>
                            </div>
                        </div>
                        <div data-dk-col style={{ gridColumn: "11 / span 2" }}>
                            <div className="dk-hero__aside">
                                <span className="dk-availability">
                                    <span className="dot" /> Open · Q3 2026
                                </span>
                                <Separator className="!my-1" />
                                <div className="dk-meta">
                                    Berlin · Remote
                                    <br />
                                    52.52° N, 13.40° E
                                </div>
                                <Separator className="!my-1" />
                                <div className="dk-meta">
                                    Design systems
                                    <br />
                                    Product design
                                    <br />
                                    Design engineering
                                    <br />
                                    Brand &amp; motion
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* ── Client ticker ─────────────────────────────────────────── */}
                <div className="dk-ticker" aria-label="Selected clients">
                    <div className="dk-ticker__track">
                        {[...CLIENTS, ...CLIENTS].map((c, i) => (
                            <span key={`${c}-${i}`} className="dk-ticker__item">
                                {c}
                                <span className="dk-ticker__sep" aria-hidden> · </span>
                            </span>
                        ))}
                    </div>
                </div>

                {/* ── Figures band ──────────────────────────────────────────── */}
                <section className="dk-section" aria-label="Studio in numbers">
                    <div className="dk-grid" style={{ rowGap: 32 }}>
                        {[
                            { num: "2017", label: "Founded", em: false },
                            { num: "140", suffix: "+", label: "Projects shipped" },
                            { num: "06", label: "People" },
                            { num: "09", label: "Awards", em: true },
                        ].map((f) => (
                            <div key={f.label} data-dk-col className="dk-figure" style={{ gridColumn: "span 3" }}>
                                <div className="dk-figure__num">
                                    {f.em ? <em>{f.num}</em> : f.num}
                                    {f.suffix ? <em>{f.suffix}</em> : null}
                                </div>
                                <div className="dk-figure__label">{f.label}</div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* ── Capabilities ──────────────────────────────────────────── */}
                <section className="dk-section" id="studio" aria-labelledby="dk-cap">
                    <div className="dk-eyebrow"><b>01</b>&nbsp;Capabilities</div>
                    <Heading as="h2" size="2xl" weight="semibold" className="dk-h2" id="dk-cap" style={{ margin: "14px 0 30px" }}>
                        Four disciplines, one team.
                    </Heading>
                    <div className="dk-grid" style={{ rowGap: 34 }}>
                        {SERVICES.map((s) => (
                            <div key={s.no} data-dk-col className="dk-cap" style={{ gridColumn: "span 3" }}>
                                <span className="dk-cap__no">{s.no}</span>
                                <h3 className="dk-cap__title">{s.title}</h3>
                                <p className="dk-cap__body">{s.body}</p>
                                <div className="dk-cap__tags">
                                    {s.tags.map((t) => (
                                        <Badge key={t} className="dk-tag" size="sm">{t}</Badge>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* ── Featured work — preview cards ─────────────────────────── */}
                <section className="dk-section" id="work" aria-labelledby="dk-feat">
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap", gap: 16, marginBottom: 30 }}>
                        <div>
                            <div className="dk-eyebrow"><b>02</b>&nbsp;Featured</div>
                            <Heading as="h2" size="2xl" weight="semibold" className="dk-h2" id="dk-feat" style={{ marginTop: 14 }}>
                                Three recent builds.
                            </Heading>
                        </div>
                        <Badge className="dk-tag dk-tag--accent" size="md" dot>2024 — 2025</Badge>
                    </div>

                    <div className="dk-grid" style={{ rowGap: 28 }}>
                        {featured.map((p) => (
                            <div key={p.num} data-dk-col className="dk-preview" style={{ gridColumn: "span 4", position: "relative" }}>
                                <Link
                                    href="/inspiration/dark#work"
                                    className="dk-index__stretch"
                                    aria-label={`${p.title} — ${p.discipline}`}
                                />
                                <div className="dk-preview__canvas">
                                    <div className="dk-preview__glyph">
                                        {p.glyph}
                                        <span>.</span>
                                    </div>
                                </div>
                                <div className="dk-preview__meta">
                                    <div>
                                        <div className="dk-preview__title">{p.title}</div>
                                        <div className="dk-preview__disc">{p.discipline}</div>
                                    </div>
                                    {p.award ? (
                                        <Badge className="dk-tag dk-tag--accent" size="sm">{p.award}</Badge>
                                    ) : (
                                        <span className="dk-meta">{p.year} ↗</span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* ── Selected work — typographic index ─────────────────────── */}
                <section className="dk-section" aria-labelledby="dk-index">
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16, marginBottom: 24 }}>
                        <div>
                            <div className="dk-eyebrow"><b>03</b>&nbsp;Selected work</div>
                            <Heading as="h2" size="2xl" weight="semibold" className="dk-h2" id="dk-index" style={{ marginTop: 14 }}>
                                The full index.
                            </Heading>
                        </div>
                        <Pillbox
                            value={tags}
                            onChange={setTags}
                            placeholder="Filter by discipline…"
                            className="dk-input !w-72"
                            aria-label="Filter work by discipline"
                        />
                    </div>

                    <div className="dk-index">
                        {pageProjects.map((p) => (
                            <div key={p.num} className="dk-index__row">
                                <Link
                                    href="/inspiration/dark#work"
                                    className="dk-index__stretch"
                                    aria-label={`${p.title} — ${p.discipline}`}
                                />
                                <span className="dk-index__num">{p.num}</span>
                                <span className="dk-index__title">{p.title}</span>
                                <span className="dk-index__disc">{p.discipline}</span>
                                <span className="dk-index__year">{p.year} <ArrowUpRight size={13} aria-hidden /></span>
                            </div>
                        ))}
                    </div>

                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 24, flexWrap: "wrap", gap: 12 }}>
                        <span className="dk-meta">
                            Showing {(page - 1) * PER_PAGE + 1}–{Math.min(page * PER_PAGE, PROJECTS.length)} of {PROJECTS.length}
                        </span>
                        <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
                    </div>
                </section>

                {/* ── How we work (tabs) ────────────────────────────────────── */}
                <section className="dk-section" aria-labelledby="dk-how">
                    <div className="dk-eyebrow"><b>04</b>&nbsp;How we work</div>
                    <Heading as="h2" size="2xl" weight="semibold" className="dk-h2" id="dk-how" style={{ margin: "14px 0 26px" }}>
                        From brief to build.
                    </Heading>

                    <Tabs defaultTab="process" variant="underline" className="dk-tabs">
                        <Tabs.List>
                            <Tabs.Tab value="process">Process</Tabs.Tab>
                            <Tabs.Tab value="principles">Principles</Tabs.Tab>
                            <Tabs.Tab value="faq">Questions</Tabs.Tab>
                        </Tabs.List>
                        <Tabs.Panels>
                            <Tabs.Panel value="process">
                                <div style={{ maxWidth: 680, marginTop: 18 }}>
                                    <Timeline
                                        className="dk-timeline"
                                        events={[
                                            { date: "Week 0", title: "Discovery", description: "Goals, audience, constraints. A fixed-fee proposal with dates we hold.", color: "zinc" },
                                            { date: "Weeks 1–3", title: "Direction", description: "Two or three routes, explored until a decision is real rather than abstract.", color: "zinc" },
                                            { date: "Weeks 4–8", title: "System & build", description: "The chosen direction built into a documented system and shipped as production React.", color: "blue" },
                                            { date: "Handoff", title: "Handoff", description: "Source, tokens, and a working session so your team owns it — agent-driveable by default.", color: "zinc" },
                                        ]}
                                    />
                                </div>
                            </Tabs.Panel>

                            <Tabs.Panel value="principles">
                                <div className="dk-grid" style={{ rowGap: 30, marginTop: 14 }}>
                                    {[
                                        { no: "P1", title: "Restraint over decoration", body: "The grid you never notice. Type that reads before you register it. One accent, used with discipline." },
                                        { no: "P2", title: "Systems, not screens", body: "We deliver the rules that keep things coherent as they scale — not a folder of one-off comps." },
                                        { no: "P3", title: "Design that ships", body: "Design and engineering in one team, so what we draw is what goes to production. No fidelity lost in handoff." },
                                        { no: "P4", title: "Human+ by default", body: "Controlled state, stable handles, MCP bridges. The surfaces we build can be driven by people and agents alike." },
                                    ].map((p) => (
                                        <div key={p.no} data-dk-col className="dk-cap" style={{ gridColumn: "span 6" }}>
                                            <span className="dk-cap__no">{p.no}</span>
                                            <h3 className="dk-cap__title">{p.title}</h3>
                                            <p className="dk-cap__body">{p.body}</p>
                                        </div>
                                    ))}
                                </div>
                            </Tabs.Panel>

                            <Tabs.Panel value="faq">
                                <div style={{ maxWidth: 760, marginTop: 10 }}>
                                    <Accordion type="single" defaultOpen={["q0"]} className="dk-accordion">
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
                <section className="dk-section" aria-labelledby="dk-about">
                    <div className="dk-grid">
                        <div data-dk-col style={{ gridColumn: "1 / span 3" }}>
                            <div className="dk-eyebrow"><b>05</b>&nbsp;Studio</div>
                        </div>
                        <div data-dk-col style={{ gridColumn: "4 / span 8" }}>
                            <p className="dk-quote">
                                We think the best interface is mostly <b>invisible</b> — a system that quietly holds, in
                                light or dark, for the person and the agent both.
                            </p>
                            <Text as="p" size="md" color="muted" className="!mt-6 !leading-relaxed">
                                FIELDWORK started in 2017 as two people who wanted to both design and build. We've stayed
                                small on purpose — six people now, still small enough that the people you meet are the
                                people who do the work. We take a handful of projects at a time and give each our full
                                attention.
                            </Text>
                        </div>
                    </div>
                </section>

                {/* ── Team ──────────────────────────────────────────────────── */}
                <section className="dk-section" aria-labelledby="dk-team">
                    <div className="dk-eyebrow"><b>06</b>&nbsp;People</div>
                    <Heading as="h2" size="2xl" weight="semibold" className="dk-h2" id="dk-team" style={{ margin: "14px 0 30px" }}>
                        The studio.
                    </Heading>
                    <div className="dk-grid" style={{ rowGap: 28 }}>
                        {TEAM.map((m) => (
                            <div key={m.name} data-dk-col className="dk-person" style={{ gridColumn: "span 3" }}>
                                <Avatar fallback={m.initials} size="lg" />
                                <div className="dk-person__name">{m.name}</div>
                                <div className="dk-meta dk-person__role">{m.role}</div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* ── Recognition + clients ─────────────────────────────────── */}
                <section className="dk-section" aria-labelledby="dk-recog">
                    <div className="dk-grid" style={{ rowGap: 36 }}>
                        <div data-dk-col style={{ gridColumn: "1 / span 7" }}>
                            <div className="dk-eyebrow"><b>07</b>&nbsp;Recognition</div>
                            <Heading as="h2" size="lg" weight="semibold" id="dk-recog" className="!mt-4 !mb-5" style={{ color: "var(--d-ink)" }}>
                                Selected awards
                            </Heading>
                            <div className="dk-table">
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

                        <div data-dk-col style={{ gridColumn: "9 / span 4" }}>
                            <div className="dk-eyebrow">Selected clients</div>
                            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 16 }}>
                                {CLIENTS.map((c) => (
                                    <Badge key={c} className="dk-tag" size="md">{c}</Badge>
                                ))}
                            </div>
                            <Separator className="!my-7" />
                            <div className="dk-eyebrow">Press</div>
                            <ul style={{ listStyle: "none", margin: "16px 0 0", padding: 0 }}>
                                <li className="dk-meta dk-meta--ink">Smashing Magazine — Studio spotlight</li>
                                <li className="dk-meta" style={{ marginTop: 8 }}>The Index №31 — Dark interfaces</li>
                                <li className="dk-meta" style={{ marginTop: 8 }}>Type &amp; Grids — In the wild</li>
                            </ul>
                        </div>
                    </div>
                </section>

                {/* ── Brief / contact ───────────────────────────────────────── */}
                <section className="dk-section" id="contact" aria-labelledby="dk-contact">
                    <div className="dk-grid" style={{ rowGap: 36 }}>
                        <div data-dk-col className="dk-brief-aside" style={{ gridColumn: "1 / span 5" }}>
                            <div className="dk-eyebrow"><b>08</b>&nbsp;Contact</div>
                            <Heading as="h2" size="2xl" weight="semibold" className="dk-h2" id="dk-contact" style={{ margin: "14px 0 20px" }}>
                                Tell us about the work.
                            </Heading>
                            <p className="dk-lede" style={{ fontSize: "1rem" }}>
                                A few sentences is plenty to start. We reply to every brief within two working days.
                            </p>
                            <div className="dk-contact-line" style={{ marginTop: 26 }}>studio@fieldwork.example</div>
                            <div className="dk-contact-sub">+49 30 0000 0000</div>

                            <div style={{ marginTop: 30 }}>
                                <div className="dk-eyebrow">Indicative budget</div>
                                <Text as="p" size="sm" color="muted" className="!mt-3 !mb-4 !max-w-[36ch]">
                                    Set a rough budget and how firm it is — drag along for the figure, up for confidence.
                                    It only helps us scope; nothing's binding.
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
                                    color="var(--d-accent)"
                                />
                                <div className="dk-meta" style={{ marginTop: 12 }}>
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

                        <div data-dk-col style={{ gridColumn: "7 / span 6" }}>
                            <Card variant="outlined" padding="none" className="dk-card">
                                <Card.Header className="!px-5 !py-4">
                                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                        <span style={{ fontWeight: 600, fontSize: 14, color: "var(--d-ink)" }}>New brief</span>
                                        <Tooltip content="We read every brief — no bots.">
                                            <Badge className="dk-tag dk-tag--accent" size="sm" dot>Open for Q3</Badge>
                                        </Tooltip>
                                    </div>
                                </Card.Header>
                                <Card.Body className="!px-5 !py-4">
                                    {submitted ? (
                                        <div style={{ padding: "30px 4px" }}>
                                            <Badge className="dk-tag dk-tag--accent" size="md">Received</Badge>
                                            <p style={{ marginTop: 16, fontSize: 15, color: "var(--d-ink)", lineHeight: 1.5 }}>
                                                Thanks — your brief is in. We&apos;ll reply within two working days.
                                            </p>
                                            <Button
                                                className="dk-btn-ghost !mt-5"
                                                icon="arrow-left"
                                                onClick={() => { setSubmitted(false); setBrief(""); }}
                                            >
                                                Write another
                                            </Button>
                                        </div>
                                    ) : (
                                        <div className="dk-composer">
                                            <Composer
                                                value={brief}
                                                onChange={setBrief}
                                                onSubmit={() => setBrief((b) => b)}
                                                placeholder="What are you building, and what's the deadline?"
                                                className="!border-0 !rounded-none"
                                            />
                                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 10 }}>
                                                <Text as="span" size="xs" color="muted">
                                                    {brief.trim().length} characters
                                                </Text>
                                                <Progress
                                                    value={Math.min(brief.trim().length, 160)}
                                                    max={160}
                                                    variant="bar"
                                                    size="sm"
                                                    color="blue"
                                                    className="dk-progress !w-40"
                                                />
                                            </div>
                                        </div>
                                    )}
                                </Card.Body>
                                {!submitted && (
                                    <Card.Footer className="!px-5 !py-3">
                                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                            <Text as="span" size="xs" color="muted">No NDA needed to say hello.</Text>
                                            <Button
                                                className="dk-btn-primary"
                                                disabled={brief.trim().length < 12}
                                                iconTrailing="arrow-right"
                                                onClick={() => setSubmitted(true)}
                                            >
                                                Send brief
                                            </Button>
                                        </div>
                                    </Card.Footer>
                                )}
                            </Card>
                        </div>
                    </div>
                </section>

                {/* ── Footer ────────────────────────────────────────────────── */}
                <footer className="dk-footer">
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 24 }}>
                        <div>
                            <div className="dk-mark">
                                <span className="dk-mark__logo" aria-hidden style={{ width: 22, height: 22, fontSize: 12 }}>F</span>
                                <span className="dk-mark__name">FIELDWORK</span>
                            </div>
                            <p className="dk-meta" style={{ marginTop: 14, maxWidth: 340 }}>
                                A design &amp; engineering studio. Berlin, working remotely across European and North
                                American time zones. Designing and building in the dark since 2017.
                            </p>
                        </div>
                        <div className="dk-footer__links">
                            <a href="#work">Work ↗</a>
                            <a href="https://fieldwork.example" target="_blank" rel="noopener noreferrer">Instagram ↗</a>
                            <a href="#contact">Contact ↗</a>
                            <a href="https://fieldwork.example" target="_blank" rel="noopener noreferrer">LinkedIn ↗</a>
                        </div>
                    </div>

                    <hr className="dk-rule" style={{ margin: "32px 0 18px" }} />

                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
                        <span className="dk-meta">FIELDWORK — a fictional studio, for demonstration · Style {style.num} / Dark Studio</span>
                        <Link href="/inspiration" className="dk-back">
                            <ArrowLeft size={14} />
                            Back to the gallery
                        </Link>
                    </div>
                </footer>
            </div>
        </div>
    );
}
