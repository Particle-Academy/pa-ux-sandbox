import "./broken.css";

import { Link } from "@inertiajs/react";
import { useState, type CSSProperties } from "react";
import {
    Accordion,
    Avatar,
    Badge,
    Breadcrumbs,
    Button,
    Card,
    Composer,
    Heading,
    Marquee,
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
import { ArrowLeft, ArrowUpRight, Asterisk } from "lucide-react";
import type { Style } from "../../types";

/**
 * Inspiration Gallery · Style 11 — Broken Grid.
 *
 * FIELDWORK (a fictional design + dev studio) rendered as deliberate editorial
 * chaos: an asymmetric, off-axis layout where blocks overlap, tilt a degree or
 * two off-true, and bleed past the margins — yet still reads. Warm newsprint
 * paper, ink black, ONE marker-red accent with a cobalt second, a tight grotesk
 * + mono pairing. The Fancy kit is forced to WEAR Broken Grid: primitives are
 * tilted, oversized, hard-shadowed, and torn off-edge so they read native to
 * the idiom rather than as fixed-look widgets.
 *
 * Mounted by Inspiration/Show.tsx for `style.id === "broken"`. SSR-safe: no
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
    tilt: string;
    award?: string;
};

const PROJECTS: Project[] = [
    { num: "01", title: "Meridian", discipline: "Brand system · type design", year: "2025", client: "Meridian Cartography", tilt: "-1.4deg", award: "D&AD Wood Pencil" },
    { num: "02", title: "Low Tide", discipline: "Editorial · art direction", year: "2025", client: "Saltworks Press", tilt: "0.9deg" },
    { num: "03", title: "Quanta", discipline: "Product UI · motion", year: "2024", client: "Quanta Labs", tilt: "-0.7deg", award: "Awwwards SOTD" },
    { num: "04", title: "Field Notes", discipline: "Identity · signage", year: "2024", client: "Atlas Botanic", tilt: "1.3deg" },
    { num: "05", title: "Ostro", discipline: "Web · design system", year: "2024", client: "Ostro Maritime", tilt: "-1.1deg" },
    { num: "06", title: "Paper Radio", discipline: "Brand · packaging", year: "2023", client: "Paper Radio Co.", tilt: "0.6deg" },
];

const SERVICES = [
    { no: "01", title: "Brand systems", body: "Identity, naming, voice, and the rules that keep a brand coherent as it scales — a system, not a logo.", tilt: "-1.5deg" },
    { no: "02", title: "Editorial & type", body: "Magazines, reports, bespoke typefaces. Long-form work where the grid does the heavy lifting — then breaks on purpose.", tilt: "1deg" },
    { no: "03", title: "Product & web", body: "Interface design and design systems for software teams — research, prototypes, production-ready components.", tilt: "0.7deg" },
    { no: "04", title: "Motion & signage", body: "Title sequences, environmental graphics, wayfinding. Type and space, in motion or at architectural scale.", tilt: "-1deg" },
];

const TEAM = [
    { name: "Anja Vester", role: "Founder · design director", initials: "AV", tilt: "-2deg" },
    { name: "Tomas Pell", role: "Type & editorial", initials: "TP", tilt: "1.6deg" },
    { name: "Rhea Okonkwo", role: "Product & systems", initials: "RO", tilt: "-1.2deg" },
    { name: "Liang Mori", role: "Motion & 3D", initials: "LM", tilt: "2.1deg" },
];

const CLIENTS = ["Meridian", "Saltworks", "Quanta Labs", "Atlas Botanic", "Ostro", "Paper Radio", "Northwind", "Studio Føn"];

const MARQUEE = ["Brand systems", "Editorial", "Type design", "Product UI", "Motion", "Signage", "Off-axis", "Overlap", "Bleed"];

const FAQ = [
    { q: "How do you scope a project?", a: "Every engagement opens with a short discovery: goals, audience, constraints, and a fixed-fee proposal. No open-ended retainers unless you want one." },
    { q: "What's a typical timeline?", a: "Brand systems run six to ten weeks; editorial and product work vary with scope. We commit to dates in the proposal and hold them." },
    { q: "Do you work with in-house teams?", a: "Often. We can lead, embed, or hand off a documented system your team runs with — whatever leaves you the most independent." },
    { q: "Where are you based?", a: "Zürich and Lisbon, across European and North American time zones. Most work happens remotely with focused on-site weeks." },
];

const PER_PAGE = 4;

export default function Broken({ style }: { style: Style }) {
    const [page, setPage] = useState(1);
    const [tags, setTags] = useState<string[]>(["Brand system", "Editorial"]);
    const [budget, setBudget] = useState(40);
    const [budgetConfidence, setBudgetConfidence] = useState(0.6);
    const [brief, setBrief] = useState("");
    const [submitted, setSubmitted] = useState(false);

    const totalPages = Math.ceil(PROJECTS.length / PER_PAGE);
    const pageProjects = PROJECTS.slice((page - 1) * PER_PAGE, page * PER_PAGE);

    return (
        <div className="insp-broken">
            {/* paper grain + skewed grid lines bleed behind everything */}
            <div className="brk-noise" aria-hidden />
            <div className="brk-gridlines" aria-hidden />

            <div className="brk-shell">
                {/* ── Running head ─────────────────────────────────────────── */}
                <header className="brk-runhead">
                    <Breadcrumbs className="brk-crumbs">
                        <Breadcrumbs.Item href="/inspiration">Inspiration</Breadcrumbs.Item>
                        <Breadcrumbs.Item active>Broken Grid</Breadcrumbs.Item>
                    </Breadcrumbs>
                    <div className="brk-mark">
                        <span className="brk-mark__chip" aria-hidden>F</span>
                        <span className="brk-mark__word">FIELDWORK</span>
                        <Badge className="brk-tag" size="sm">est. 2016</Badge>
                    </div>
                </header>

                {/* ── Hero — overlapping, off-axis blocks ──────────────────── */}
                <section className="brk-hero" aria-labelledby="brk-hero-h">
                    <div className="brk-hero__kicker">
                        <span><b>00</b> — Index / Cover</span>
                        <span>Design &amp; dev studio</span>
                    </div>

                    <h1 id="brk-hero-h" className="brk-display">
                        <span className="brk-display__l1">A studio for</span>
                        <span className="brk-display__l2">
                            <span className="brk-mark-red">systems</span>, type
                        </span>
                        <span className="brk-display__l3">&amp; the spaces between.</span>
                    </h1>

                    {/* floating off-grid scrap, bleeds right */}
                    <aside className="brk-scrap brk-scrap--hero">
                        <span className="brk-scrap__tape" aria-hidden />
                        <div className="brk-scrap__no">№ 11 / 20</div>
                        <p className="brk-scrap__body">
                            A deliberately broken grid. Asymmetry, overlap, a degree off-true — editorial chaos that still reads.
                        </p>
                        <div className="brk-scrap__coord">47.3769°N · 8.5417°E</div>
                    </aside>

                    <div className="brk-hero__foot">
                        <p className="brk-lede">
                            FIELDWORK is a small studio working at the intersection of brand, editorial, and
                            product. We build systems that stay legible as they scale — then we tilt them a
                            degree, on purpose.
                        </p>
                        <div className="brk-hero__cta">
                            <Button className="brk-btn brk-btn--ink" href="#contact">Brief the studio</Button>
                            <Button className="brk-btn brk-btn--ghost" iconTrailing="arrow-down" href="#work">
                                Selected work
                            </Button>
                        </div>
                    </div>
                </section>

                {/* ── Kinetic torn marquee ─────────────────────────────────── */}
                <Marquee
                    className="brk-band"
                    duration={30}
                    gap={0}
                    fade={false}
                    items={MARQUEE.map((w, i) => (
                        <span className="brk-band__word" key={i}>
                            {w}
                            <Asterisk className="brk-band__star" size={20} />
                        </span>
                    ))}
                />

                {/* ── Figures — staggered, each tilted ─────────────────────── */}
                <section className="brk-figures" aria-label="Studio in numbers">
                    {[
                        { num: "2016", label: "Founded", t: "-1.5deg" },
                        { num: "120+", label: "Projects shipped", t: "1.2deg" },
                        { num: "08", label: "People", t: "-0.8deg" },
                        { num: "14", label: "Awards", t: "1.6deg" },
                    ].map((f) => (
                        <div key={f.label} className="brk-figure" style={{ "--t": f.t } as CSSProperties}>
                            <div className="brk-figure__num">{f.num}</div>
                            <div className="brk-figure__label">{f.label}</div>
                        </div>
                    ))}
                </section>

                {/* ── Selected work — torn index, rows tilt alternately ────── */}
                <section className="brk-section" id="work" aria-labelledby="brk-work-h">
                    <div className="brk-sec-head">
                        <div>
                            <div className="brk-mark-line"><span><b>01</b> — Selected work</span></div>
                            <Heading as="h2" className="brk-h2">Six recent projects, off the grid.</Heading>
                        </div>
                        <Pillbox
                            value={tags}
                            onChange={setTags}
                            placeholder="Filter by discipline…"
                            className="brk-pillbox"
                            aria-label="Filter work by discipline"
                        />
                    </div>

                    <ul className="brk-index">
                        {pageProjects.map((p) => (
                            <li
                                key={p.num}
                                className="brk-index__row"
                                style={{ "--t": p.tilt } as CSSProperties}
                            >
                                <Link
                                    href="/inspiration/broken#work"
                                    className="brk-index__stretch"
                                    aria-label={`${p.title} — ${p.discipline}`}
                                />
                                <span className="brk-index__num">{p.num}</span>
                                <span className="brk-index__title">{p.title}</span>
                                <span className="brk-index__meta">
                                    <span className="brk-index__disc">{p.discipline}</span>
                                    {p.award && <span className="brk-index__award">{p.award}</span>}
                                </span>
                                <span className="brk-index__year">
                                    {p.year}
                                    <ArrowUpRight className="brk-index__arrow" size={18} />
                                </span>
                            </li>
                        ))}
                    </ul>

                    <div className="brk-sec-foot">
                        <span className="brk-meta">
                            Showing {(page - 1) * PER_PAGE + 1}–{Math.min(page * PER_PAGE, PROJECTS.length)} of {PROJECTS.length}
                        </span>
                        <Pagination page={page} totalPages={totalPages} onPageChange={setPage} className="brk-pagination" />
                    </div>
                </section>

                {/* ── Capabilities — tabbed, panels overlap their frame ────── */}
                <section className="brk-section" aria-labelledby="brk-cap-h">
                    <div className="brk-mark-line"><span><b>02</b> — Capabilities</span></div>
                    <Heading as="h2" className="brk-h2" id="brk-cap-h" style={{ marginBottom: 22 }}>
                        What we do, how we work.
                    </Heading>

                    <Tabs defaultTab="services" variant="underline" className="brk-tabs">
                        <Tabs.List className="brk-tabs__list">
                            <Tabs.Tab value="services">Services</Tabs.Tab>
                            <Tabs.Tab value="process">Process</Tabs.Tab>
                            <Tabs.Tab value="faq">Questions</Tabs.Tab>
                        </Tabs.List>
                        <Tabs.Panels>
                            <Tabs.Panel value="services">
                                <div className="brk-caps">
                                    {SERVICES.map((s) => (
                                        <div
                                            key={s.no}
                                            className="brk-cap"
                                            style={{ "--t": s.tilt } as CSSProperties}
                                        >
                                            <span className="brk-cap__no">{s.no}</span>
                                            <h3 className="brk-cap__title">{s.title}</h3>
                                            <p className="brk-cap__body">{s.body}</p>
                                        </div>
                                    ))}
                                </div>
                            </Tabs.Panel>

                            <Tabs.Panel value="process">
                                <div className="brk-process">
                                    <Timeline
                                        className="brk-timeline"
                                        events={[
                                            { date: "Week 0", title: "Discovery", description: "Goals, audience, constraints. A fixed-fee proposal with dates we hold.", color: "zinc" },
                                            { date: "Weeks 1–3", title: "Direction", description: "Two or three routes, explored until a decision is real, not abstract.", color: "zinc" },
                                            { date: "Weeks 4–8", title: "System", description: "The chosen direction built into a documented, reusable system.", color: "red" },
                                            { date: "Handoff", title: "Handoff", description: "Source files, guidelines, and a working session so your team owns it.", color: "zinc" },
                                        ]}
                                    />
                                </div>
                            </Tabs.Panel>

                            <Tabs.Panel value="faq">
                                <div className="brk-faq">
                                    <Accordion type="single" defaultOpen={["q0"]} className="brk-accordion">
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

                {/* ── About — statement overlaps a pasted note ─────────────── */}
                <section className="brk-about" aria-labelledby="brk-about-h">
                    <div className="brk-mark-line"><span><b>03</b> — About</span></div>
                    <p className="brk-statement" id="brk-about-h">
                        The best design is mostly invisible —{" "}
                        <span className="brk-statement__hl">a grid you never notice</span>, type that reads
                        before you register it. So when we break it, we break it on purpose.
                    </p>
                    <div className="brk-about__cols">
                        <Text as="p" className="brk-about__body">
                            FIELDWORK began in 2016 as two people and a shared dislike of decoration for its own
                            sake. We've grown carefully since — eight people now, still small enough that the
                            people you meet are the people who do the work.
                        </Text>
                        <Text as="p" className="brk-about__body">
                            We take a handful of projects at a time and give each our full attention. The grid
                            holds the work together; the tilt is where it comes alive.
                        </Text>
                    </div>
                </section>

                {/* ── Team — scattered tilted cards ────────────────────────── */}
                <section className="brk-section" aria-labelledby="brk-team-h">
                    <div className="brk-mark-line"><span><b>04</b> — People</span></div>
                    <Heading as="h2" className="brk-h2" id="brk-team-h" style={{ marginBottom: 24 }}>
                        The studio.
                    </Heading>
                    <div className="brk-team">
                        {TEAM.map((m) => (
                            <div
                                key={m.name}
                                className="brk-person"
                                style={{ "--t": m.tilt } as CSSProperties}
                            >
                                <span className="brk-person__tape" aria-hidden />
                                <Avatar fallback={m.initials} size="lg" className="brk-avatar" />
                                <div className="brk-person__name">{m.name}</div>
                                <div className="brk-person__role">{m.role}</div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* ── Recognition — ledger + clients, overlapping ──────────── */}
                <section className="brk-section" aria-labelledby="brk-rec-h">
                    <div className="brk-mark-line"><span><b>05</b> — Recognition</span></div>
                    <div className="brk-rec">
                        <div className="brk-rec__main">
                            <Heading as="h3" className="brk-h3" id="brk-rec-h" style={{ marginBottom: 12 }}>
                                Selected awards
                            </Heading>
                            <Table className="brk-table">
                                <Table.Head>
                                    <Table.Column label="Year" />
                                    <Table.Column label="Project" />
                                    <Table.Column label="Award" />
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
                                        <Table.Cell>Studio</Table.Cell>
                                        <Table.Cell>Type Directors Club, Certificate of Excellence</Table.Cell>
                                    </Table.Row>
                                </Table.Body>
                            </Table>
                        </div>

                        <aside className="brk-rec__side">
                            <div className="brk-mark-line"><span>Selected clients</span></div>
                            <div className="brk-clients">
                                {CLIENTS.map((c, i) => (
                                    <Badge
                                        key={c}
                                        className="brk-client"
                                        style={{ "--t": `${(i % 2 ? 1 : -1) * (1 + (i % 3))}deg` } as CSSProperties}
                                    >
                                        {c}
                                    </Badge>
                                ))}
                            </div>
                            <Separator className="brk-sep" />
                            <div className="brk-mark-line"><span>Press</span></div>
                            <ul className="brk-press">
                                <li className="brk-press__lead">It&apos;s Nice That — Studio of the week</li>
                                <li>Eye Magazine №112</li>
                                <li>Slanted — Type in the wild</li>
                            </ul>
                        </aside>
                    </div>
                </section>

                {/* ── Contact / brief ──────────────────────────────────────── */}
                <section className="brk-section brk-section--contact" id="contact" aria-labelledby="brk-contact-h">
                    <div className="brk-mark-line"><span><b>06</b> — Contact</span></div>
                    <div className="brk-contact">
                        <div className="brk-contact__left">
                            <Heading as="h2" className="brk-h2" id="brk-contact-h" style={{ margin: "8px 0 14px" }}>
                                Tell us about the work.
                            </Heading>
                            <p className="brk-lede brk-lede--sm">
                                A few sentences is plenty to start. We reply to every brief within two working days.
                            </p>
                            <div className="brk-contact__addr">studio@fieldwork.example</div>
                            <div className="brk-contact__addr brk-contact__addr--muted">+41 44 000 00 00</div>

                            <div className="brk-budget">
                                <div className="brk-mark-line"><span>Indicative budget</span></div>
                                <Text as="p" className="brk-budget__help">
                                    Drag along for the figure, up for confidence. It only helps us scope — nothing&apos;s binding.
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
                                    height={180}
                                    prefix="€"
                                    suffix="k"
                                    color="var(--brk-accent)"
                                />
                                <div className="brk-budget__read">
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

                        <div className="brk-contact__right">
                            <Card variant="outlined" padding="none" className="brk-briefcard">
                                <Card.Header className="brk-briefcard__head">
                                    <span className="brk-briefcard__title">New brief</span>
                                    <Tooltip content="We read every brief — no bots.">
                                        <Badge className="brk-briefcard__status" dot>Open for Q3</Badge>
                                    </Tooltip>
                                </Card.Header>
                                <Card.Body className="brk-briefcard__body">
                                    {submitted ? (
                                        <div className="brk-briefcard__sent">
                                            <Badge className="brk-briefcard__status">Received</Badge>
                                            <p>Thanks — your brief is in. We&apos;ll reply within two working days.</p>
                                            <Button
                                                className="brk-btn brk-btn--ghost"
                                                icon="arrow-left"
                                                onClick={() => { setSubmitted(false); setBrief(""); }}
                                            >
                                                Write another
                                            </Button>
                                        </div>
                                    ) : (
                                        <>
                                            <Composer
                                                value={brief}
                                                onChange={setBrief}
                                                onSubmit={() => setBrief((b) => b)}
                                                placeholder="What are you building, and what's the deadline?"
                                                className="brk-composer"
                                            />
                                            <div className="brk-briefcard__row">
                                                <span className="brk-briefcard__count">{brief.trim().length} characters</span>
                                                <Progress
                                                    value={Math.min(brief.trim().length, 160)}
                                                    max={160}
                                                    variant="bar"
                                                    size="sm"
                                                    color="red"
                                                    className="brk-progress"
                                                />
                                            </div>
                                        </>
                                    )}
                                </Card.Body>
                                {!submitted && (
                                    <Card.Footer className="brk-briefcard__foot">
                                        <span className="brk-briefcard__note">No NDA needed to say hello.</span>
                                        <Button
                                            className="brk-btn brk-btn--ink"
                                            disabled={brief.trim().length < 12}
                                            iconTrailing="arrow-right"
                                            onClick={() => setSubmitted(true)}
                                        >
                                            Send brief
                                        </Button>
                                    </Card.Footer>
                                )}
                            </Card>
                        </div>
                    </div>
                </section>

                {/* ── Footer — torn sign-off ───────────────────────────────── */}
                <footer className="brk-footer">
                    <div className="brk-footer__word" aria-hidden>FIELDWORK</div>
                    <div className="brk-footer__row">
                        <p className="brk-footer__about">
                            A design &amp; dev studio. Zürich and Lisbon. Working in brand, editorial, product,
                            and motion since 2016 — on and off the grid.
                        </p>
                        <div className="brk-footer__links">
                            <a href="#work">Work ↗</a>
                            <a href="https://fieldwork.example" target="_blank" rel="noopener noreferrer">Instagram ↗</a>
                            <a href="#contact">Contact ↗</a>
                            <a href="https://fieldwork.example" target="_blank" rel="noopener noreferrer">LinkedIn ↗</a>
                        </div>
                    </div>

                    <Separator className="brk-sep brk-sep--foot" />

                    <div className="brk-footer__base">
                        <span className="brk-meta">
                            FIELDWORK — a fictional studio, for demonstration · Style {style.num} / Broken Grid
                        </span>
                        <Link href="/inspiration" className="brk-back">
                            <ArrowLeft size={14} />
                            Back to the gallery
                        </Link>
                    </div>
                </footer>
            </div>
        </div>
    );
}
