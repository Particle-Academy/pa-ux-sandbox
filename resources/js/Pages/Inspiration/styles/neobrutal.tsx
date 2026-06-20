import "./neobrutal.css";

import { Link } from "@inertiajs/react";
import { useState } from "react";
import {
    Accordion,
    Avatar,
    Badge,
    Breadcrumbs,
    Button,
    Callout,
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
    Table,
    Tabs,
    Text,
    Timeline,
    Tooltip,
} from "@particle-academy/react-fancy";
import { ArrowLeft, ArrowUpRight, Star, Zap } from "lucide-react";
import type { Style } from "../types";

/**
 * Inspiration Gallery · Style — Neo-Brutalist.
 *
 * FIELDWORK (a FICTIONAL design/dev studio) rendered as a neo-brutalist
 * one-page portfolio: chunky saturated color blocks (electric yellow, hot
 * magenta, cyan, lime), thick black borders, and hard offset drop-shadows
 * (`6px 6px 0 #000`). Everything is square — radius 0 — and pressable: buttons
 * and cards slam down into their shadow on :active. Big condensed display type,
 * mono metadata, playful and loud. The Fancy primitives WEAR the idiom: every
 * Button, Card, Badge, Tab, Table, Accordion, Progress, Composer, Pagination
 * and Pillbox is restyled HARD via scoped CSS so it reads native to the look —
 * proof the same primitives carry any visual language.
 *
 * Mounted by Inspiration/Show.tsx for `style.id === "neobrutal"`. SSR-safe: no
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
    tone: "yellow" | "magenta" | "cyan" | "lime" | "orange" | "violet";
    award?: string;
};

const PROJECTS: Project[] = [
    { num: "01", title: "BLASTER", discipline: "Brand identity · motion", year: "2025", client: "Blaster Energy", tone: "yellow", award: "FWA Site of the Day" },
    { num: "02", title: "PAPER CUTS", discipline: "Editorial · risograph", year: "2025", client: "Paper Cuts Zine", tone: "magenta" },
    { num: "03", title: "HOTLINE", discipline: "Product UI · design system", year: "2024", client: "Hotline Labs", tone: "cyan", award: "Awwwards Honorable" },
    { num: "04", title: "FUN HOUSE", discipline: "Identity · environmental", year: "2024", client: "Fun House Arcade", tone: "lime" },
    { num: "05", title: "LOUD MOUTH", discipline: "Web · campaign", year: "2024", client: "Loud Mouth Radio", tone: "orange" },
    { num: "06", title: "SUPER BLOOM", discipline: "Brand · packaging", year: "2023", client: "Super Bloom Soda", tone: "violet" },
];

const SERVICES = [
    { no: "01", title: "BRAND THAT YELLS", tone: "yellow", body: "Identity systems built to be seen from across the street. Loud marks, a fat type voice, and rules that hold up at billboard scale." },
    { no: "02", title: "EDITORIAL & RISO", tone: "magenta", body: "Zines, reports, and posters with ink you can smell. Big grids, bigger type, and a printer's eye for the overprint." },
    { no: "03", title: "PRODUCT & WEB", tone: "cyan", body: "Interfaces and design systems for software teams who refuse to look like everyone else. Components, prototypes, ship." },
    { no: "04", title: "MOTION & SPACE", tone: "lime", body: "Title cards, signage, and environments. Type and color in motion, or bolted to a wall at architectural scale." },
];

const TEAM = [
    { name: "Mac Vega", role: "FOUNDER · CREATIVE DIRECTOR", initials: "MV", tone: "yellow" },
    { name: "Pia Ottoline", role: "TYPE · EDITORIAL", initials: "PO", tone: "magenta" },
    { name: "Reggie Cho", role: "PRODUCT · SYSTEMS", initials: "RC", tone: "cyan" },
    { name: "Lux Moreau", role: "MOTION · 3D", initials: "LM", tone: "lime" },
];

const CLIENTS = ["BLASTER", "PAPER CUTS", "HOTLINE", "FUN HOUSE", "LOUD MOUTH", "SUPER BLOOM", "NORTHWIND", "STUDIO FØN", "BIG SODA", "CRT TV"];

const FAQ = [
    { q: "HOW DO YOU SCOPE A PROJECT?", a: "Every job opens with a short, blunt discovery: goals, audience, constraints, and a fixed-fee number on one page. No open-ended retainers unless you beg us for one." },
    { q: "WHAT'S A TYPICAL TIMELINE?", a: "Brand systems run six to ten weeks; editorial and product work flex with scope. We commit to dates in the proposal and we HIT them. Loudly." },
    { q: "DO YOU WORK WITH IN-HOUSE TEAMS?", a: "All the time. We can lead, embed, or hand off a documented system your team runs with. Whatever leaves you the most independent and the least bored." },
    { q: "WHERE ARE YOU BASED?", a: "Berlin and Mexico City, working across European and North American time zones. Most of the work is remote with a few loud on-site weeks." },
];

const STATS = [
    { num: "2017", label: "FOUNDED", tone: "yellow" },
    { num: "140+", label: "PROJECTS SHIPPED", tone: "magenta" },
    { num: "07", label: "LOUD HUMANS", tone: "cyan" },
    { num: "19", label: "AWARDS", tone: "lime" },
];

const PER_PAGE = 4;

export default function Neobrutal({ style }: { style: Style }) {
    const [page, setPage] = useState(1);
    const [tags, setTags] = useState<string[]>(["BRAND", "EDITORIAL"]);
    const [budget, setBudget] = useState(45);
    const [budgetConfidence, setBudgetConfidence] = useState(0.6);
    const [brief, setBrief] = useState("");
    const [submitted, setSubmitted] = useState(false);
    const [calloutOpen, setCalloutOpen] = useState(true);

    const totalPages = Math.ceil(PROJECTS.length / PER_PAGE);
    const pageProjects = PROJECTS.slice((page - 1) * PER_PAGE, page * PER_PAGE);

    return (
        <div className="insp-neobrutal">
            <div className="nb-shell">
                {/* ── Running head: breadcrumbs + studio mark ───────────────── */}
                <div className="nb-head">
                    <Breadcrumbs className="nb-crumbs">
                        <Breadcrumbs.Item href="/inspiration">INSPIRATION</Breadcrumbs.Item>
                        <Breadcrumbs.Item active>NEO-BRUTALIST</Breadcrumbs.Item>
                    </Breadcrumbs>
                    <div className="nb-mark">
                        <span className="nb-mark__glyph" aria-hidden>
                            F
                        </span>
                        <span className="nb-mark__name">FIELDWORK</span>
                        <Badge className="nb-badge nb-badge--cyan" variant="outline" size="sm">
                            EST. 2017
                        </Badge>
                    </div>
                </div>

                {/* ── Hero ──────────────────────────────────────────────────── */}
                <section className="nb-section nb-hero" aria-labelledby="nb-hero-title">
                    <div className="nb-hero__main">
                        <div className="nb-eyebrow">
                            <Zap size={13} aria-hidden /> DESIGN STUDIO · NO INSIDE VOICE
                        </div>
                        <h1 id="nb-hero-title" className="nb-display">
                            WE MAKE
                            <span className="nb-hi nb-hi--yellow"> LOUD </span>
                            BRANDS THAT REFUSE TO
                            <span className="nb-hi nb-hi--magenta"> BLEND IN.</span>
                        </h1>
                        <p className="nb-lede">
                            FIELDWORK is a small, loud studio working across brand, editorial, and product. We build
                            chunky systems that stay legible at any size — and we are not afraid of a little color.
                        </p>
                        <div className="nb-hero__cta">
                            <Button className="nb-btn nb-btn--yellow" href="#contact">
                                BRIEF THE STUDIO
                            </Button>
                            <Button className="nb-btn nb-btn--ghost" iconTrailing="arrow-down" href="#work">
                                SEE THE WORK
                            </Button>
                        </div>
                    </div>

                    <aside className="nb-hero__side" aria-label="Studio facts">
                        <div className="nb-fact nb-fact--cyan">
                            <span className="nb-fact__k">BASED IN</span>
                            <span className="nb-fact__v">BERLIN · CDMX</span>
                        </div>
                        <div className="nb-fact nb-fact--lime">
                            <span className="nb-fact__k">STATUS</span>
                            <span className="nb-fact__v">OPEN · Q3 2026</span>
                        </div>
                        <div className="nb-fact nb-fact--violet">
                            <span className="nb-fact__k">DOING</span>
                            <span className="nb-fact__v">
                                BRAND / EDITORIAL
                                <br />
                                PRODUCT / MOTION
                            </span>
                        </div>
                    </aside>
                </section>

                {/* ── Marquee strip ─────────────────────────────────────────── */}
                <div className="nb-strip" aria-hidden>
                    <div className="nb-strip__track">
                        {Array.from({ length: 2 }).map((_, dup) => (
                            <span key={dup} className="nb-strip__group">
                                LOUD · CHUNKY · LEGIBLE ★ NO INSIDE VOICE ★ BRAND THAT YELLS ★ FIELDWORK ★ EST. 2017 ★&nbsp;
                            </span>
                        ))}
                    </div>
                </div>

                {/* ── Figures band ──────────────────────────────────────────── */}
                <section className="nb-section" aria-label="Studio in numbers">
                    <div className="nb-stats">
                        {STATS.map((f) => (
                            <div key={f.label} className={`nb-stat nb-stat--${f.tone}`}>
                                <div className="nb-stat__num">{f.num}</div>
                                <div className="nb-stat__label">{f.label}</div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* ── Selected work — chunky index ──────────────────────────── */}
                <section className="nb-section" id="work" aria-labelledby="nb-work-title">
                    <div className="nb-section__head">
                        <div>
                            <div className="nb-eyebrow">
                                <span className="nb-num">01</span> SELECTED WORK
                            </div>
                            <Heading as="h2" className="nb-h2" id="nb-work-title">
                                SIX RECENT JOBS.
                            </Heading>
                        </div>
                        <Pillbox
                            value={tags}
                            onChange={setTags}
                            placeholder="FILTER BY DISCIPLINE…"
                            className="nb-pillbox"
                            aria-label="Filter work by discipline"
                        />
                    </div>

                    <div className="nb-index">
                        {pageProjects.map((p) => (
                            <article key={p.num} className={`nb-row nb-row--${p.tone}`}>
                                <Link
                                    href="/inspiration/neobrutal#work"
                                    className="nb-row__stretch"
                                    aria-label={`${p.title} — ${p.discipline}`}
                                />
                                <span className="nb-row__num">{p.num}</span>
                                <div className="nb-row__body">
                                    <span className="nb-row__title">{p.title}</span>
                                    <span className="nb-row__disc">{p.discipline}</span>
                                </div>
                                <div className="nb-row__meta">
                                    {p.award && <span className="nb-chip">{p.award}</span>}
                                    <span className="nb-row__year">
                                        {p.year} <ArrowUpRight size={16} aria-hidden />
                                    </span>
                                </div>
                            </article>
                        ))}
                    </div>

                    <div className="nb-index__foot">
                        <span className="nb-meta">
                            SHOWING {(page - 1) * PER_PAGE + 1}–{Math.min(page * PER_PAGE, PROJECTS.length)} OF {PROJECTS.length}
                        </span>
                        <Pagination className="nb-pagination" page={page} totalPages={totalPages} onPageChange={setPage} />
                    </div>
                </section>

                {/* ── Capabilities (tabbed) ─────────────────────────────────── */}
                <section className="nb-section" aria-labelledby="nb-cap-title">
                    <div className="nb-eyebrow">
                        <span className="nb-num">02</span> CAPABILITIES
                    </div>
                    <Heading as="h2" className="nb-h2" id="nb-cap-title">
                        WHAT WE DO. HOW WE WORK.
                    </Heading>

                    <Tabs defaultTab="services" variant="pills" className="nb-tabs">
                        <Tabs.List>
                            <Tabs.Tab value="services">SERVICES</Tabs.Tab>
                            <Tabs.Tab value="process">PROCESS</Tabs.Tab>
                            <Tabs.Tab value="faq">QUESTIONS</Tabs.Tab>
                        </Tabs.List>
                        <Tabs.Panels>
                            <Tabs.Panel value="services">
                                <div className="nb-cards">
                                    {SERVICES.map((s) => (
                                        <Card key={s.no} className={`nb-card nb-card--${s.tone}`}>
                                            <Card.Body>
                                                <span className="nb-card__no">{s.no}</span>
                                                <h3 className="nb-card__title">{s.title}</h3>
                                                <p className="nb-card__body">{s.body}</p>
                                            </Card.Body>
                                        </Card>
                                    ))}
                                </div>
                            </Tabs.Panel>

                            <Tabs.Panel value="process">
                                <div className="nb-process">
                                    <Timeline
                                        className="nb-timeline"
                                        events={[
                                            { date: "WEEK 0", title: "DISCOVERY", description: "Goals, audience, constraints. A fixed-fee number on one page, with dates we actually hold.", color: "yellow" },
                                            { date: "WEEKS 1–3", title: "DIRECTION", description: "Two or three loud routes, pushed to the point where a real decision is on the table.", color: "rose" },
                                            { date: "WEEKS 4–8", title: "SYSTEM", description: "The chosen direction built into a documented, reusable, chunky system.", color: "cyan" },
                                            { date: "HANDOFF", title: "HANDOFF", description: "Source files, guidelines, and a working session so your team owns it for good.", color: "lime" },
                                        ]}
                                    />
                                </div>
                            </Tabs.Panel>

                            <Tabs.Panel value="faq">
                                <div className="nb-faq">
                                    <Accordion type="single" defaultOpen={["q0"]} className="nb-accordion">
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
                <section className="nb-section nb-about" aria-labelledby="nb-about-title">
                    <div className="nb-about__tag">
                        <div className="nb-eyebrow">
                            <span className="nb-num">03</span> ABOUT
                        </div>
                        <span className="nb-bigstar" aria-hidden>
                            ★
                        </span>
                    </div>
                    <div className="nb-about__body" id="nb-about-title">
                        <p className="nb-statement">
                            We think good design should be impossible to ignore — a color you feel before you read it,
                            type that grabs you by the collar, a system loud enough to hold a whole brand together.
                        </p>
                        <Text as="p" className="nb-prose">
                            FIELDWORK started in 2017 as two people, a stack of riso ink, and a shared allergy to beige.
                            We've grown carefully since — seven loud humans now, still small enough that the people you
                            meet are the people who do the work. We take a handful of projects at a time and give each
                            one our whole, undivided, slightly-too-much attention.
                        </Text>
                    </div>
                </section>

                {/* ── Team ──────────────────────────────────────────────────── */}
                <section className="nb-section" aria-labelledby="nb-team-title">
                    <div className="nb-eyebrow">
                        <span className="nb-num">04</span> THE CREW
                    </div>
                    <Heading as="h2" className="nb-h2" id="nb-team-title">
                        SEVEN LOUD HUMANS.
                    </Heading>
                    <div className="nb-team">
                        {TEAM.map((m) => (
                            <div key={m.name} className={`nb-person nb-person--${m.tone}`}>
                                <Avatar fallback={m.initials} size="lg" className="nb-avatar" />
                                <div className="nb-person__name">{m.name}</div>
                                <div className="nb-person__role">{m.role}</div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* ── Recognition + clients ─────────────────────────────────── */}
                <section className="nb-section nb-recog" aria-labelledby="nb-recog-title">
                    <div className="nb-recog__main">
                        <div className="nb-eyebrow">
                            <span className="nb-num">05</span> RECOGNITION
                        </div>
                        <Heading as="h2" className="nb-h3" id="nb-recog-title">
                            SELECTED AWARDS
                        </Heading>
                        <div className="nb-tablewrap">
                            <Table className="nb-table">
                                <Table.Head>
                                    <Table.Column label="YEAR" />
                                    <Table.Column label="PROJECT" />
                                    <Table.Column label="AWARD" />
                                </Table.Head>
                                <Table.Body>
                                    {PROJECTS.filter((p) => p.award).map((p) => (
                                        <Table.Row key={p.num}>
                                            <Table.Cell>{p.year}</Table.Cell>
                                            <Table.Cell>{p.title}</Table.Cell>
                                            <Table.Cell>{p.award}</Table.Cell>
                                        </Table.Row>
                                    ))}
                                    <Table.Row>
                                        <Table.Cell>2023</Table.Cell>
                                        <Table.Cell>STUDIO</Table.Cell>
                                        <Table.Cell>Type Directors Club, Certificate of Excellence</Table.Cell>
                                    </Table.Row>
                                    <Table.Row>
                                        <Table.Cell>2022</Table.Cell>
                                        <Table.Cell>SUPER BLOOM</Table.Cell>
                                        <Table.Cell>Dieline Awards, Best Packaging</Table.Cell>
                                    </Table.Row>
                                </Table.Body>
                            </Table>
                        </div>

                        <div className="nb-volume">
                            <div className="nb-eyebrow">VOLUME CHECK · PROJECTS / YEAR</div>
                            <Chart.Bar
                                className="nb-chart"
                                height={132}
                                data={[
                                    { label: "'21", value: 18, color: "#facc15" },
                                    { label: "'22", value: 24, color: "#ec4899" },
                                    { label: "'23", value: 27, color: "#22d3ee" },
                                    { label: "'24", value: 33, color: "#a3e635" },
                                    { label: "'25", value: 38, color: "#fb923c" },
                                ]}
                            />
                        </div>
                    </div>

                    <aside className="nb-recog__side">
                        <div className="nb-eyebrow">SELECTED CLIENTS</div>
                        <div className="nb-clients">
                            {CLIENTS.map((c) => (
                                <Badge key={c} className="nb-badge nb-badge--mono" variant="outline" size="md">
                                    {c}
                                </Badge>
                            ))}
                        </div>
                        <Separator className="nb-sep" />
                        <div className="nb-eyebrow">PRESS</div>
                        <ul className="nb-press">
                            <li>
                                <Star size={13} aria-hidden /> It&apos;s Nice That — Studio of the week
                            </li>
                            <li>
                                <Star size={13} aria-hidden /> Eye Magazine №118
                            </li>
                            <li>
                                <Star size={13} aria-hidden /> Slanted — Type in the wild
                            </li>
                        </ul>
                        <Tooltip content="No bots. A loud human reads every single one.">
                            <div className="nb-rating">
                                <span className="nb-rating__big">4.9</span>
                                <span className="nb-rating__stars" aria-hidden>
                                    ★★★★★
                                </span>
                                <span className="nb-rating__sub">FROM 60+ CLIENT REVIEWS</span>
                            </div>
                        </Tooltip>
                    </aside>
                </section>

                {/* ── Brief / contact CTA ───────────────────────────────────── */}
                <section className="nb-section" id="contact" aria-labelledby="nb-contact-title">
                    {calloutOpen && (
                        <Callout
                            className="nb-callout"
                            color="amber"
                            icon={<Zap size={18} aria-hidden />}
                            dismissible
                            onDismiss={() => setCalloutOpen(false)}
                        >
                            <strong>TWO SLOTS LEFT FOR Q3.</strong> Send a brief — we reply to every one within two
                            working days. No NDA needed to say hello.
                        </Callout>
                    )}

                    <div className="nb-contact">
                        <div className="nb-contact__left">
                            <div className="nb-eyebrow">
                                <span className="nb-num">06</span> CONTACT
                            </div>
                            <Heading as="h2" className="nb-h2" id="nb-contact-title">
                                TELL US ABOUT THE WORK.
                            </Heading>
                            <p className="nb-lede nb-lede--sm">
                                A few blunt sentences is plenty to start. We&apos;ll reply within two working days.
                            </p>
                            <div className="nb-contact__line">STUDIO@FIELDWORK.EXAMPLE</div>
                            <div className="nb-contact__sub">+49 30 000 00 00 · BERLIN / CDMX</div>

                            <div className="nb-budget">
                                <div className="nb-eyebrow">INDICATIVE BUDGET</div>
                                <Text as="p" className="nb-prose nb-prose--sm">
                                    Drag for the figure, up for how firm it is. It only helps us scope — nothing&apos;s
                                    binding.
                                </Text>
                                <MoodMeter
                                    min={10}
                                    max={150}
                                    value={budget}
                                    confidence={budgetConfidence}
                                    onChange={(v, c) => {
                                        setBudget(Math.round(v));
                                        setBudgetConfidence(c);
                                    }}
                                    width={320}
                                    height={170}
                                    prefix="€"
                                    suffix="k"
                                    color="#ec4899"
                                    className="nb-mood"
                                />
                                <div className="nb-budget__readout">
                                    SCOPING AT{" "}
                                    <ReasonTag
                                        value={`€${budget}K`}
                                        reason="Indicative only — the proposal sets the fixed fee after discovery. Drawn from your budget pad and the project type."
                                        confidence={budgetConfidence}
                                        by="STUDIO"
                                        theme="underline"
                                        className="nb-reason"
                                    />{" "}
                                    · CONFIDENCE {Math.round(budgetConfidence * 100)}%
                                </div>
                            </div>
                        </div>

                        <div className="nb-contact__right">
                            <Card className="nb-brief" padding="none">
                                <Card.Header className="nb-brief__head">
                                    <span className="nb-brief__title">
                                        <Zap size={15} aria-hidden /> NEW BRIEF
                                    </span>
                                    <Badge className="nb-badge nb-badge--lime" variant="solid" size="sm" dot>
                                        OPEN
                                    </Badge>
                                </Card.Header>
                                <Card.Body className="nb-brief__body">
                                    {submitted ? (
                                        <div className="nb-brief__done">
                                            <Badge className="nb-badge nb-badge--lime" variant="solid" size="md">
                                                RECEIVED
                                            </Badge>
                                            <p>
                                                Thanks — your brief landed loud and clear. We&apos;ll reply within two
                                                working days.
                                            </p>
                                            <Button
                                                className="nb-btn nb-btn--ghost"
                                                icon="arrow-left"
                                                onClick={() => {
                                                    setSubmitted(false);
                                                    setBrief("");
                                                }}
                                            >
                                                WRITE ANOTHER
                                            </Button>
                                        </div>
                                    ) : (
                                        <>
                                            <Composer
                                                value={brief}
                                                onChange={setBrief}
                                                onSubmit={() => setBrief((b) => b)}
                                                placeholder="WHAT ARE YOU BUILDING, AND WHAT'S THE DEADLINE?"
                                                className="nb-composer"
                                            />
                                            <div className="nb-brief__progress">
                                                <Text as="span" className="nb-meta">
                                                    {brief.trim().length} CHARS
                                                </Text>
                                                <Progress
                                                    value={Math.min(brief.trim().length, 160)}
                                                    max={160}
                                                    variant="bar"
                                                    size="sm"
                                                    className="nb-progress"
                                                />
                                            </div>
                                        </>
                                    )}
                                </Card.Body>
                                {!submitted && (
                                    <Card.Footer className="nb-brief__foot">
                                        <Text as="span" className="nb-meta">
                                            NO NDA TO SAY HELLO.
                                        </Text>
                                        <Button
                                            className="nb-btn nb-btn--magenta"
                                            disabled={brief.trim().length < 12}
                                            iconTrailing="arrow-right"
                                            onClick={() => setSubmitted(true)}
                                        >
                                            SEND BRIEF
                                        </Button>
                                    </Card.Footer>
                                )}
                            </Card>
                        </div>
                    </div>
                </section>

                {/* ── Footer ────────────────────────────────────────────────── */}
                <footer className="nb-footer">
                    <div className="nb-footer__top">
                        <div className="nb-footer__brand">
                            <span className="nb-mark__glyph" aria-hidden>
                                F
                            </span>
                            <span className="nb-mark__name">FIELDWORK</span>
                        </div>
                        <nav className="nb-footer__links" aria-label="Footer">
                            <a href="#work">WORK</a>
                            <a href="https://fieldwork.example" target="_blank" rel="noopener noreferrer">
                                INSTAGRAM
                            </a>
                            <a href="#contact">CONTACT</a>
                            <a href="https://fieldwork.example" target="_blank" rel="noopener noreferrer">
                                LINKEDIN
                            </a>
                        </nav>
                    </div>
                    <p className="nb-footer__blurb">
                        A loud design studio. Berlin and Mexico City. Brand, editorial, product, and motion since 2017.
                    </p>
                    <Separator className="nb-sep" />
                    <div className="nb-footer__bottom">
                        <span className="nb-meta">
                            FIELDWORK — A FICTIONAL STUDIO, FOR DEMONSTRATION · STYLE {style.num} / NEO-BRUTALIST
                        </span>
                        <Link href="/inspiration" className="nb-back">
                            <ArrowLeft size={14} aria-hidden /> BACK TO THE GALLERY
                        </Link>
                    </div>
                </footer>
            </div>
        </div>
    );
}
