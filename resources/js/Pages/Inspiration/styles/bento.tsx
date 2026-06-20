import "./bento.css";

import { Link } from "@inertiajs/react";
import { useState } from "react";
import {
    Accordion,
    Avatar,
    Badge,
    Breadcrumbs,
    Button,
    Card,
    Chart,
    Composer,
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
    TimeGrid,
    Timeline,
    Tooltip,
} from "@particle-academy/react-fancy";
import { ArrowLeft, ArrowUpRight } from "lucide-react";
import type { Style } from "../types";

/**
 * Inspiration Gallery · Style — Bento.
 *
 * FIELDWORK (a fictional design + dev studio) rendered as a modular bento grid:
 * varied-size tiles — work thumbnails, big-number stats, a chart tile, a quote
 * tile, a live status tile, a map tile, a capacity heatmap — packed asymmetric
 * but tidy on a near-black canvas. Each tile is a different Fancy primitive made
 * to WEAR the bento idiom: every tile is a rounded, hairline-bordered card on a
 * dark slate field, with one warm amber accent, mono labels, and big tabular
 * numerals. The whole tree is wrapped in `.insp-bento`, which carries its OWN
 * dark palette (re-pointing the shared semantic tokens) so it reads native to
 * this style and never collides with Tailwind's `.dark`.
 *
 * Mounted by Inspiration/Show.tsx for `style.id === "bento"`. SSR-safe: no
 * module-level browser APIs; every interactive bit is controlled React state.
 * Inner links use the stretched-link pattern (one <Link> per tile) so no anchor
 * is ever nested inside another anchor (avoids React #418 under SSR).
 */

type Project = {
    num: string;
    title: string;
    discipline: string;
    year: string;
    glyph: string;
    tone: string;
    award?: string;
};

const PROJECTS: Project[] = [
    { num: "01", title: "Halcyon", discipline: "Design system · product UI", year: "2025", glyph: "H", tone: "amber", award: "Awwwards SOTD" },
    { num: "02", title: "Northpoint", discipline: "Brand · motion identity", year: "2025", glyph: "N", tone: "rose" },
    { num: "03", title: "Cinder", discipline: "Web app · data viz", year: "2025", glyph: "C", tone: "emerald", award: "CSS Design Awards" },
    { num: "04", title: "Atlas Grid", discipline: "Design engineering", year: "2024", glyph: "A", tone: "sky" },
    { num: "05", title: "Vellum", discipline: "Editorial platform", year: "2024", glyph: "V", tone: "violet", award: "FWA of the Day" },
    { num: "06", title: "Drift", discipline: "Product · prototyping", year: "2024", glyph: "D", tone: "amber" },
];

const SERVICES = [
    { no: "01", title: "Design systems", body: "Tokens, primitives, and the documented rules that keep a product coherent — built to be inhabited by humans and agents alike.", tags: ["Tokens", "Docs", "Primitives"] },
    { no: "02", title: "Product design", body: "Research, flows, and high-fidelity interface design — from a fixed-fee discovery to production-ready screens.", tags: ["UX", "UI", "Prototype"] },
    { no: "03", title: "Design engineering", body: "We ship the design. React + Tailwind front-end, component libraries, and the bridges that let agents drive the surface.", tags: ["React", "Tailwind", "Human+"] },
    { no: "04", title: "Brand & motion", body: "Identity systems, type, and motion language — the voice and rhythm that make a product feel like one thing.", tags: ["Identity", "Type", "Motion"] },
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
    { q: "Do you build, or just design?", a: "Both. We're a design + engineering studio — most work ships as production React. Take the design and run, or we ship it end to end." },
    { q: "Can agents drive what you build?", a: "Increasingly, yes. We build to the Human+ contract — controlled state, stable handles, MCP bridges — so an assistant can read and drive the same surface a person uses." },
];

// Twelve-month shipped-work trend for the chart tile.
const SHIPPED = [4, 6, 5, 8, 7, 9, 11, 10, 12, 14, 13, 16];
const MONTHS = ["J", "F", "M", "A", "M", "J", "J", "A", "S", "O", "N", "D"];

// Capacity heatmap — 4 weeks × 7 days of studio load (true = booked).
const CAP_ROWS = ["Wk 1", "Wk 2", "Wk 3", "Wk 4"];
const CAP_COLS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const CAPACITY: boolean[][] = [
    [true, true, true, false, true, false, false],
    [true, true, false, true, true, false, false],
    [false, true, true, true, false, false, false],
    [true, false, true, true, true, true, false],
];

const PER_PAGE = 4;

export default function Bento({ style }: { style: Style }) {
    const [page, setPage] = useState(1);
    const [tags, setTags] = useState<string[]>(["Design systems", "Product"]);
    const [budget, setBudget] = useState(60);
    const [budgetConfidence, setBudgetConfidence] = useState(0.64);
    const [brief, setBrief] = useState("");
    const [submitted, setSubmitted] = useState(false);
    const [capacity, setCapacity] = useState<boolean[][]>(CAPACITY);
    const [live, setLive] = useState(true);

    const totalPages = Math.ceil(PROJECTS.length / PER_PAGE);
    const pageProjects = PROJECTS.slice((page - 1) * PER_PAGE, page * PER_PAGE);
    const booked = capacity.flat().filter(Boolean).length;
    const capPct = Math.round((booked / capacity.flat().length) * 100);

    return (
        <div className="insp-bento">
            <div className="bn-shell">
                {/* ── Running head ──────────────────────────────────────────── */}
                <div className="bn-head">
                    <Breadcrumbs>
                        <Breadcrumbs.Item href="/inspiration">Inspiration</Breadcrumbs.Item>
                        <Breadcrumbs.Item active>Bento</Breadcrumbs.Item>
                    </Breadcrumbs>
                    <div className="bn-mark">
                        <span className="bn-mark__logo" aria-hidden>F</span>
                        <span className="bn-mark__name">FIELDWORK</span>
                        <Badge className="bn-tag" size="sm">est. 2017</Badge>
                    </div>
                    <nav className="bn-headnav" aria-label="Studio">
                        <a href="#work">Work</a>
                        <a href="#studio">Studio</a>
                        <a href="#contact">Contact</a>
                    </nav>
                </div>

                {/* ── Hero bento ────────────────────────────────────────────── */}
                <section className="bn-grid bn-grid--hero" aria-label="Studio overview">
                    {/* Intro tile — the big one */}
                    <div className="bn-tile bn-tile--intro bn-span6 bn-row2">
                        <div className="bn-eyebrow"><b>00</b>&nbsp;Design &amp; engineering studio</div>
                        <h1 className="bn-display">
                            Interfaces humans and <span className="bn-accent">agents</span> share.
                        </h1>
                        <p className="bn-lede">
                            FIELDWORK is a small studio working where product design meets engineering. We build
                            systems that stay legible as they scale — and ship them to production.
                        </p>
                        <div className="bn-cta">
                            <Button className="bn-btn-primary" href="#contact" iconTrailing="arrow-right">
                                Start a project
                            </Button>
                            <Button className="bn-btn-ghost" href="#work" iconTrailing="arrow-down">
                                Selected work
                            </Button>
                        </div>
                    </div>

                    {/* Stat — projects shipped (circular) */}
                    <div className="bn-tile bn-tile--stat bn-span3">
                        <div className="bn-stat__ring">
                            <Progress variant="circular" value={87} size="lg" color="amber" className="bn-progress" />
                            <span className="bn-stat__ringnum">140+</span>
                        </div>
                        <div className="bn-stat__label">Projects shipped</div>
                    </div>

                    {/* Stat — founded */}
                    <div className="bn-tile bn-tile--num bn-span3">
                        <div className="bn-num">2017</div>
                        <div className="bn-stat__label">Founded · Berlin</div>
                        <div className="bn-meta bn-mt-auto">52.52° N · 13.40° E</div>
                    </div>

                    {/* Live status tile */}
                    <div className="bn-tile bn-tile--status bn-span3">
                        <div className="bn-status__top">
                            <span className={`bn-status__dot${live ? " is-live" : ""}`} aria-hidden />
                            <Switch checked={live} onCheckedChange={setLive} color="amber" aria-label="Studio availability" />
                        </div>
                        <div className="bn-status__state">{live ? "Open for Q3 2026" : "Booked through Q3"}</div>
                        <div className="bn-meta">{live ? "Taking one or two new briefs" : "Waitlist open — we'll be in touch"}</div>
                    </div>

                    {/* Stat — awards */}
                    <div className="bn-tile bn-tile--num bn-span3">
                        <div className="bn-num bn-num--accent">09</div>
                        <div className="bn-stat__label">Awards won</div>
                        <div className="bn-meta bn-mt-auto">Awwwards · CSS DA · FWA</div>
                    </div>
                </section>

                {/* ── Work + chart + map row ────────────────────────────────── */}
                <section className="bn-grid" id="work" aria-labelledby="bn-work">
                    <div className="bn-tile bn-tile--head bn-span12">
                        <div className="bn-eyebrow"><b>01</b>&nbsp;Selected work</div>
                        <Heading as="h2" size="2xl" weight="semibold" className="bn-h2" id="bn-work">
                            Recent builds, tiled.
                        </Heading>
                    </div>

                    {/* Four work thumbnails — each a stretched-link tile */}
                    {PROJECTS.slice(0, 4).map((p, i) => (
                        <div
                            key={p.num}
                            className={`bn-tile bn-tile--work bn-span3${i === 0 ? " bn-tile--work-lg bn-span6 bn-row2" : ""}`}
                            data-tone={p.tone}
                        >
                            <Link
                                href="/inspiration/bento#work"
                                className="bn-stretch"
                                aria-label={`${p.title} — ${p.discipline}`}
                            />
                            <div className="bn-work__canvas" aria-hidden>
                                <span className="bn-work__glyph">{p.glyph}<i>.</i></span>
                            </div>
                            <div className="bn-work__meta">
                                <div>
                                    <div className="bn-work__title">{p.title}</div>
                                    <div className="bn-work__disc">{p.discipline}</div>
                                </div>
                                {p.award ? (
                                    <Badge className="bn-tag bn-tag--accent" size="sm">{p.award}</Badge>
                                ) : (
                                    <span className="bn-work__year">{p.year} <ArrowUpRight size={13} aria-hidden /></span>
                                )}
                            </div>
                        </div>
                    ))}

                    {/* Chart tile — shipped work, 12 months */}
                    <div className="bn-tile bn-tile--chart bn-span6">
                        <div className="bn-tile__cap">
                            <span className="bn-eyebrow"><b>↗</b>&nbsp;Shipped / month</span>
                            <Badge className="bn-tag bn-tag--accent" size="sm" dot>2025</Badge>
                        </div>
                        <Chart.Area
                            className="bn-chart"
                            labels={MONTHS}
                            series={[{ label: "Shipped", data: SHIPPED, color: "var(--b-accent)" }]}
                            height={140}
                            curve="monotone"
                            showDots={false}
                            fillOpacity={0.18}
                            xAxis={false}
                            yAxis={false}
                            grid={false}
                            tooltip
                        />
                        <div className="bn-chart__foot">
                            <span className="bn-num bn-num--sm">+148%</span>
                            <span className="bn-meta">year over year</span>
                        </div>
                    </div>

                    {/* Map tile — studio location */}
                    <div className="bn-tile bn-tile--map bn-span3">
                        <div className="bn-map" aria-hidden>
                            <div className="bn-map__grid" />
                            <span className="bn-map__pin" />
                            <span className="bn-map__ring" />
                        </div>
                        <div className="bn-map__meta">
                            <div className="bn-work__title">Berlin</div>
                            <div className="bn-meta">Remote · EU + NA hours</div>
                        </div>
                    </div>

                    {/* Discipline split — donut */}
                    <div className="bn-tile bn-tile--donut bn-span3">
                        <div className="bn-eyebrow"><b>%</b>&nbsp;Work mix</div>
                        <Chart.Donut
                            className="bn-donut"
                            size={108}
                            strokeWidth={14}
                            showLegend={false}
                            data={[
                                { label: "Systems", value: 40, color: "var(--b-accent)" },
                                { label: "Product", value: 32, color: "#34d399" },
                                { label: "Brand", value: 18, color: "#fb7185" },
                                { label: "Eng", value: 10, color: "#60a5fa" },
                            ]}
                        />
                        <div className="bn-donut__legend">
                            <span><i style={{ background: "var(--b-accent)" }} />Systems 40</span>
                            <span><i style={{ background: "#34d399" }} />Product 32</span>
                            <span><i style={{ background: "#fb7185" }} />Brand 18</span>
                            <span><i style={{ background: "#60a5fa" }} />Eng 10</span>
                        </div>
                    </div>
                </section>

                {/* ── Capabilities + quote + index ──────────────────────────── */}
                <section className="bn-grid" id="studio" aria-labelledby="bn-cap">
                    <div className="bn-tile bn-tile--head bn-span12">
                        <div className="bn-eyebrow"><b>02</b>&nbsp;Capabilities</div>
                        <Heading as="h2" size="2xl" weight="semibold" className="bn-h2" id="bn-cap">
                            Four disciplines, one team.
                        </Heading>
                    </div>

                    {/* Quote tile — wide */}
                    <div className="bn-tile bn-tile--quote bn-span6 bn-row2">
                        <div className="bn-quote__mark" aria-hidden>“</div>
                        <p className="bn-quote">
                            The best interface is mostly <b>invisible</b> — a system that quietly holds, in light or
                            dark, for the person and the agent both.
                        </p>
                        <div className="bn-quote__by">
                            <Avatar fallback="IV" size="sm" />
                            <div>
                                <div className="bn-work__title">Iris Vance</div>
                                <div className="bn-meta">Founder · Design director</div>
                            </div>
                        </div>
                    </div>

                    {/* Two capability tiles stacked beside the quote */}
                    {SERVICES.slice(0, 2).map((s) => (
                        <div key={s.no} className="bn-tile bn-tile--cap bn-span3">
                            <span className="bn-cap__no">{s.no}</span>
                            <h3 className="bn-cap__title">{s.title}</h3>
                            <p className="bn-cap__body">{s.body}</p>
                            <div className="bn-cap__tags">
                                {s.tags.map((t) => (
                                    <Badge key={t} className="bn-tag" size="sm">{t}</Badge>
                                ))}
                            </div>
                        </div>
                    ))}

                    {/* Other two capability tiles full-width-ish below */}
                    {SERVICES.slice(2).map((s) => (
                        <div key={s.no} className="bn-tile bn-tile--cap bn-span6">
                            <span className="bn-cap__no">{s.no}</span>
                            <h3 className="bn-cap__title">{s.title}</h3>
                            <p className="bn-cap__body">{s.body}</p>
                            <div className="bn-cap__tags">
                                {s.tags.map((t) => (
                                    <Badge key={t} className="bn-tag" size="sm">{t}</Badge>
                                ))}
                            </div>
                        </div>
                    ))}
                </section>

                {/* ── Full index + process tabs ─────────────────────────────── */}
                <section className="bn-grid" aria-labelledby="bn-index">
                    {/* Project index tile */}
                    <div className="bn-tile bn-tile--index bn-span7">
                        <div className="bn-tile__cap">
                            <div>
                                <div className="bn-eyebrow"><b>03</b>&nbsp;The full index</div>
                                <Heading as="h2" size="lg" weight="semibold" className="bn-h2 bn-h2--sm" id="bn-index">
                                    Every project.
                                </Heading>
                            </div>
                            <Pillbox
                                value={tags}
                                onChange={setTags}
                                placeholder="Filter…"
                                className="bn-input bn-pillbox"
                                aria-label="Filter work by discipline"
                            />
                        </div>
                        <div className="bn-index">
                            {pageProjects.map((p) => (
                                <div key={p.num} className="bn-index__row">
                                    <Link
                                        href="/inspiration/bento#work"
                                        className="bn-stretch"
                                        aria-label={`${p.title} — ${p.discipline}`}
                                    />
                                    <span className="bn-index__num">{p.num}</span>
                                    <span className="bn-index__title">{p.title}</span>
                                    <span className="bn-index__disc">{p.discipline}</span>
                                    <span className="bn-index__year">{p.year} <ArrowUpRight size={12} aria-hidden /></span>
                                </div>
                            ))}
                        </div>
                        <div className="bn-index__foot">
                            <span className="bn-meta">
                                {(page - 1) * PER_PAGE + 1}–{Math.min(page * PER_PAGE, PROJECTS.length)} of {PROJECTS.length}
                            </span>
                            <Pagination page={page} totalPages={totalPages} onPageChange={setPage} className="bn-pagination" />
                        </div>
                    </div>

                    {/* Process / questions tabs tile */}
                    <div className="bn-tile bn-tile--tabs bn-span5">
                        <div className="bn-eyebrow"><b>04</b>&nbsp;How we work</div>
                        <Tabs defaultTab="process" variant="underline" className="bn-tabs">
                            <Tabs.List>
                                <Tabs.Tab value="process">Process</Tabs.Tab>
                                <Tabs.Tab value="faq">Questions</Tabs.Tab>
                            </Tabs.List>
                            <Tabs.Panels>
                                <Tabs.Panel value="process">
                                    <Timeline
                                        className="bn-timeline"
                                        events={[
                                            { date: "Week 0", title: "Discovery", description: "Goals, constraints, a fixed-fee proposal with dates we hold.", color: "zinc" },
                                            { date: "Wks 1–3", title: "Direction", description: "Two or three routes explored until a decision is real.", color: "zinc" },
                                            { date: "Wks 4–8", title: "System & build", description: "The chosen route built and shipped as production React.", color: "amber" },
                                            { date: "Handoff", title: "Handoff", description: "Source, tokens, a working session — agent-driveable by default.", color: "zinc" },
                                        ]}
                                    />
                                </Tabs.Panel>
                                <Tabs.Panel value="faq">
                                    <Accordion type="single" defaultOpen={["q0"]} className="bn-accordion">
                                        {FAQ.map((item, i) => (
                                            <Accordion.Item key={i} value={`q${i}`}>
                                                <Accordion.Trigger>{item.q}</Accordion.Trigger>
                                                <Accordion.Content>{item.a}</Accordion.Content>
                                            </Accordion.Item>
                                        ))}
                                    </Accordion>
                                </Tabs.Panel>
                            </Tabs.Panels>
                        </Tabs>
                    </div>
                </section>

                {/* ── Team + recognition + capacity ─────────────────────────── */}
                <section className="bn-grid" aria-labelledby="bn-team">
                    {/* Team tile */}
                    <div className="bn-tile bn-tile--team bn-span4">
                        <div className="bn-eyebrow"><b>05</b>&nbsp;People</div>
                        <Heading as="h2" size="lg" weight="semibold" className="bn-h2 bn-h2--sm" id="bn-team">
                            The studio.
                        </Heading>
                        <ul className="bn-team">
                            {TEAM.map((m) => (
                                <li key={m.name} className="bn-team__row">
                                    <Avatar fallback={m.initials} size="md" />
                                    <div>
                                        <div className="bn-work__title">{m.name}</div>
                                        <div className="bn-meta">{m.role}</div>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Recognition table tile */}
                    <div className="bn-tile bn-tile--awards bn-span4">
                        <div className="bn-eyebrow"><b>06</b>&nbsp;Recognition</div>
                        <Heading as="h2" size="lg" weight="semibold" className="bn-h2 bn-h2--sm">
                            Selected awards.
                        </Heading>
                        <div className="bn-table">
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
                                </Table.Body>
                            </Table>
                        </div>
                        <Separator className="bn-sep" />
                        <div className="bn-eyebrow">Selected clients</div>
                        <div className="bn-clients">
                            {CLIENTS.map((c) => (
                                <Badge key={c} className="bn-tag" size="sm">{c}</Badge>
                            ))}
                        </div>
                    </div>

                    {/* Capacity heatmap tile */}
                    <div className="bn-tile bn-tile--capacity bn-span4">
                        <div className="bn-tile__cap">
                            <div className="bn-eyebrow"><b>07</b>&nbsp;Studio capacity</div>
                            <ReasonTag
                                value={`${capPct}% booked`}
                                reason="Live load across the next four weeks. Toggle a cell to model a new engagement — booked days are amber. Indicative only."
                                confidence={0.78}
                                by="Studio ops"
                                theme="underline"
                            />
                        </div>
                        <Text as="p" size="sm" color="muted" className="bn-cap-note">
                            Next four weeks — tap a day to model a slot.
                        </Text>
                        <TimeGrid
                            className="bn-timegrid"
                            rows={CAP_ROWS}
                            cols={CAP_COLS}
                            value={capacity}
                            onChange={setCapacity}
                            toneOn="amber"
                            cellWidth={26}
                            cellHeight={22}
                            sparseColLabels={false}
                            ariaCell={(r, c, on) => `${CAP_ROWS[r]} ${CAP_COLS[c]} ${on ? "booked" : "open"}`}
                        />
                        <div className="bn-meta bn-mt-auto">{booked} booked · {capacity.flat().length - booked} open days</div>
                    </div>
                </section>

                {/* ── Contact / brief ───────────────────────────────────────── */}
                <section className="bn-grid" id="contact" aria-labelledby="bn-contact">
                    {/* Budget pad tile */}
                    <div className="bn-tile bn-tile--budget bn-span5">
                        <div className="bn-eyebrow"><b>08</b>&nbsp;Indicative budget</div>
                        <Heading as="h2" size="2xl" weight="semibold" className="bn-h2" id="bn-contact">
                            Tell us about the work.
                        </Heading>
                        <Text as="p" size="sm" color="muted" className="bn-cap-note">
                            Drag along for the figure, up for how firm it is. It only helps us scope — nothing's binding.
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
                            width={300}
                            height={170}
                            prefix="€"
                            suffix="k"
                            color="var(--b-accent)"
                            className="bn-moodmeter"
                        />
                        <div className="bn-meta bn-budget__readout">
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

                    {/* Brief card tile */}
                    <div className="bn-tile bn-tile--brief bn-span7">
                        <Card variant="outlined" padding="none" className="bn-card">
                            <Card.Header className="!px-5 !py-4">
                                <div className="bn-tile__cap">
                                    <span className="bn-brief__title">New brief</span>
                                    <Tooltip content="We read every brief — no bots.">
                                        <Badge className="bn-tag bn-tag--accent" size="sm" dot>Open for Q3</Badge>
                                    </Tooltip>
                                </div>
                            </Card.Header>
                            <Card.Body className="!px-5 !py-4">
                                {submitted ? (
                                    <div className="bn-brief__done">
                                        <Badge className="bn-tag bn-tag--accent" size="md">Received</Badge>
                                        <p className="bn-brief__thanks">
                                            Thanks — your brief is in. We&apos;ll reply within two working days.
                                        </p>
                                        <Button
                                            className="bn-btn-ghost !mt-4"
                                            icon="arrow-left"
                                            onClick={() => { setSubmitted(false); setBrief(""); }}
                                        >
                                            Write another
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="bn-composer">
                                        <Composer
                                            value={brief}
                                            onChange={setBrief}
                                            onSubmit={() => setBrief((b) => b)}
                                            placeholder="What are you building, and what's the deadline?"
                                            className="!border-0 !rounded-none"
                                        />
                                        <div className="bn-composer__foot">
                                            <Text as="span" size="xs" color="muted">{brief.trim().length} characters</Text>
                                            <Progress
                                                value={Math.min(brief.trim().length, 160)}
                                                max={160}
                                                variant="bar"
                                                size="sm"
                                                color="amber"
                                                className="bn-progress !w-40"
                                            />
                                        </div>
                                    </div>
                                )}
                            </Card.Body>
                            {!submitted && (
                                <Card.Footer className="!px-5 !py-3">
                                    <div className="bn-tile__cap">
                                        <Text as="span" size="xs" color="muted">studio@fieldwork.example</Text>
                                        <Button
                                            className="bn-btn-primary"
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
                </section>

                {/* ── Footer ────────────────────────────────────────────────── */}
                <footer className="bn-footer">
                    <div className="bn-footer__top">
                        <div>
                            <div className="bn-mark">
                                <span className="bn-mark__logo" aria-hidden style={{ width: 22, height: 22, fontSize: 12 }}>F</span>
                                <span className="bn-mark__name">FIELDWORK</span>
                            </div>
                            <p className="bn-meta bn-footer__blurb">
                                A design &amp; engineering studio. Berlin, working remotely across European and North
                                American time zones. Tiling design and code since 2017.
                            </p>
                        </div>
                        <div className="bn-footer__links">
                            <a href="#work">Work ↗</a>
                            <a href="https://fieldwork.example" target="_blank" rel="noopener noreferrer">Instagram ↗</a>
                            <a href="#contact">Contact ↗</a>
                            <a href="https://fieldwork.example" target="_blank" rel="noopener noreferrer">LinkedIn ↗</a>
                        </div>
                    </div>

                    <hr className="bn-rule" />

                    <div className="bn-footer__bottom">
                        <span className="bn-meta">FIELDWORK — a fictional studio, for demonstration · Style {style.num} / Bento</span>
                        <Link href="/inspiration" className="bn-back">
                            <ArrowLeft size={14} />
                            Back to the gallery
                        </Link>
                    </div>
                </footer>
            </div>
        </div>
    );
}
