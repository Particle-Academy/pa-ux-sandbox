import "./mono.css";
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
 * Inspiration Gallery · Style — Monochrome.
 *
 * FIELDWORK (a fictional design / dev studio) set in strict monochrome: one ink
 * (near-black) on white, a single saturated accent (cobalt) used sparingly, a
 * disciplined index grid, and hairline rules everywhere. Even more reductive
 * than Swiss — no fills, no shadows, no second hue; the accent appears only on a
 * marker square, a hover state, a key numeral, or a live control. The Fancy kit
 * is forced to WEAR the monochrome idiom: Badges become bracketed labels, the
 * Table becomes a ruled ledger, Tabs become a hairline rail, the Avatar becomes
 * a square ink chip, the Card becomes a bordered brief slip, the Composer a
 * ruled note. Proof the same primitives carry any visual language.
 *
 * Mounted by Inspiration/Show.tsx for `style.id === "mono"`. SSR-safe: no
 * module-level browser APIs; every interactive bit is controlled React state.
 * Inner links use the stretched-link pattern (one <Link> per row) so no anchor
 * is ever nested inside another anchor (avoids React #418 under SSR).
 */

type Project = {
    num: string;
    title: string;
    discipline: string;
    year: string;
};

const PROJECTS: Project[] = [
    { num: "01", title: "Meridian", discipline: "Brand system · Type design", year: "2025" },
    { num: "02", title: "Low Tide", discipline: "Editorial · Art direction", year: "2025" },
    { num: "03", title: "Quanta", discipline: "Product UI · Motion", year: "2024" },
    { num: "04", title: "Field Notes", discipline: "Identity · Signage", year: "2024" },
    { num: "05", title: "Ostro", discipline: "Web · Design system", year: "2024" },
    { num: "06", title: "Paper Radio", discipline: "Brand · Packaging", year: "2023" },
];

const SERVICES = [
    { no: "01", title: "Brand systems", body: "Identity, naming, voice, and the rules that hold a brand together as it scales — shipped as a system, never a single mark." },
    { no: "02", title: "Editorial & type", body: "Magazines, reports, and bespoke typefaces. The long-form work where the grid quietly does the heavy lifting." },
    { no: "03", title: "Product & web", body: "Interface design and design systems for software teams — research, prototypes, production-ready components." },
    { no: "04", title: "Motion & signage", body: "Title sequences, environmental graphics, and wayfinding. Type and space, in motion or at architectural scale." },
];

const TEAM = [
    { name: "Anja Vester", role: "Founder · Design director", initials: "AV" },
    { name: "Tomas Pell", role: "Type & editorial", initials: "TP" },
    { name: "Rhea Okonkwo", role: "Product & systems", initials: "RO" },
    { name: "Liang Mori", role: "Motion & 3D", initials: "LM" },
];

const CLIENTS = ["Meridian", "Saltworks", "Quanta Labs", "Atlas Botanic", "Ostro", "Paper Radio", "Northwind", "Studio Føn"];

const AWARDS = [
    { year: "2025", project: "Meridian", award: "D&AD Wood Pencil — Typography" },
    { year: "2024", project: "Quanta", award: "Awwwards — Site of the Day" },
    { year: "2024", project: "Ostro", award: "CSS Design Awards — UI" },
    { year: "2023", project: "Studio", award: "Type Directors Club — Certificate" },
];

const FAQ = [
    { q: "How do you scope a project?", a: "Every engagement opens with a short discovery — goals, audience, constraints — and a fixed-fee proposal. No open-ended retainers unless you ask for one." },
    { q: "What's a typical timeline?", a: "Brand systems run six to ten weeks; editorial and product work vary with scope. We commit to dates in the proposal and we hold them." },
    { q: "Do you work with in-house teams?", a: "Often. We can lead, embed, or hand off a documented system your team runs with — whichever leaves you the most independent." },
    { q: "Where are you based?", a: "Zürich and Lisbon, working across European and North American time zones. Most work happens remotely with focused on-site weeks." },
];

const FIGURES = [
    { num: "2016", label: "Founded" },
    { num: "120", label: "Projects" },
    { num: "08", label: "People" },
    { num: "14", label: "Awards" },
];

const PER_PAGE = 4;

export default function Mono({ style }: { style: Style }) {
    const [page, setPage] = useState(1);
    const [tags, setTags] = useState<string[]>(["Brand", "Editorial"]);
    const [brief, setBrief] = useState("");
    const [submitted, setSubmitted] = useState(false);

    const totalPages = Math.ceil(PROJECTS.length / PER_PAGE);
    const pageProjects = PROJECTS.slice((page - 1) * PER_PAGE, page * PER_PAGE);

    return (
        <div className="insp-mono">
            <div className="mono-shell">
                {/* ── Running head: breadcrumbs + studio mark ──────────────────── */}
                <div className="mono-runhead">
                    <Breadcrumbs className="mono-crumbs">
                        <Breadcrumbs.Item href="/inspiration">Inspiration</Breadcrumbs.Item>
                        <Breadcrumbs.Item active>Monochrome</Breadcrumbs.Item>
                    </Breadcrumbs>
                    <div className="mono-mark">
                        <span className="mono-mark__sq" aria-hidden />
                        <span className="mono-mark__name">FIELDWORK</span>
                        <Badge className="mono-chip" color="zinc" variant="outline" size="sm">est. 2016</Badge>
                    </div>
                </div>
                <hr className="mono-rule mono-rule--ink" />

                {/* ── Hero ─────────────────────────────────────────────────────── */}
                <section className="mono-section mono-hero" aria-labelledby="mo-hero">
                    <div className="mono-hero__main">
                        <div className="mono-eyebrow">
                            <span className="mono-eyebrow__no">00</span>
                            <span>Index</span>
                            <span className="mono-eyebrow__dot" aria-hidden />
                            <span>Graphic design studio</span>
                        </div>
                        <h1 id="mo-hero" className="mono-display">
                            One ink.<br />
                            One <span className="mono-display__accent">idea</span>.<br />
                            Held to the line.
                        </h1>
                        <p className="mono-lede">
                            FIELDWORK is a small studio working at the seam of brand, editorial, and
                            product. We strip a problem to its single legible idea — then build the
                            system that keeps it honest as it scales.
                        </p>
                        <div className="mono-hero__cta">
                            <Button href="#contact" iconTrailing="arrow-right" className="mono-btn mono-btn--ink">
                                Brief the studio
                            </Button>
                            <Button variant="ghost" href="#work" iconTrailing="arrow-down" className="mono-btn mono-btn--ghost">
                                Selected work
                            </Button>
                        </div>
                    </div>
                    <aside className="mono-hero__meta">
                        <div className="mono-meta mono-meta--ink">Zürich · Lisbon</div>
                        <div className="mono-meta">
                            47.3769° N, 8.5417° E<br />
                            Available Q3 2026
                        </div>
                        <Separator className="mono-sep" />
                        <ul className="mono-disclist">
                            <li>Brand systems</li>
                            <li>Editorial &amp; type</li>
                            <li>Product &amp; web</li>
                            <li>Motion &amp; signage</li>
                        </ul>
                    </aside>
                </section>

                {/* ── Figures band ─────────────────────────────────────────────── */}
                <section className="mono-section" aria-label="Studio in numbers">
                    <div className="mono-figures">
                        {FIGURES.map((f) => (
                            <div key={f.label} className="mono-figure">
                                <div className="mono-figure__num">{f.num}</div>
                                <div className="mono-figure__label">{f.label}</div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* ── Selected work — typographic index ────────────────────────── */}
                <section className="mono-section" id="work" aria-labelledby="mo-work">
                    <div className="mono-section__head">
                        <div>
                            <div className="mono-eyebrow">
                                <span className="mono-eyebrow__no">01</span>
                                <span>Selected work</span>
                            </div>
                            <Heading as="h2" size="2xl" className="mono-h2" id="mo-work">
                                Six recent projects.
                            </Heading>
                        </div>
                        <Pillbox
                            value={tags}
                            onChange={setTags}
                            placeholder="Filter discipline…"
                            className="mono-pillbox"
                            aria-label="Filter work by discipline"
                        />
                    </div>

                    <div className="mono-index">
                        {pageProjects.map((p) => (
                            <div key={p.num} className="mono-index__row">
                                <Link
                                    href="/inspiration/mono#work"
                                    className="mono-index__stretch"
                                    aria-label={`${p.title} — ${p.discipline}`}
                                />
                                <span className="mono-index__num">{p.num}</span>
                                <span className="mono-index__title">{p.title}</span>
                                <span className="mono-index__disc">{p.discipline}</span>
                                <span className="mono-index__year">
                                    {p.year}
                                    <ArrowUpRight size={13} className="mono-index__arrow" />
                                </span>
                            </div>
                        ))}
                    </div>

                    <div className="mono-index__foot">
                        <span className="mono-meta">
                            {(page - 1) * PER_PAGE + 1}–{Math.min(page * PER_PAGE, PROJECTS.length)} / {String(PROJECTS.length).padStart(2, "0")}
                        </span>
                        <Pagination page={page} totalPages={totalPages} onPageChange={setPage} className="mono-pagination" />
                    </div>
                </section>

                {/* ── Capabilities (tabbed) ────────────────────────────────────── */}
                <section className="mono-section" aria-labelledby="mo-cap">
                    <div className="mono-eyebrow">
                        <span className="mono-eyebrow__no">02</span>
                        <span>Capabilities</span>
                    </div>
                    <Heading as="h2" size="2xl" className="mono-h2 mono-h2--gap" id="mo-cap">
                        What we do, and how we work.
                    </Heading>

                    <Tabs defaultTab="services" variant="underline" className="mono-tabs">
                        <Tabs.List className="mono-tabs__list">
                            <Tabs.Tab value="services">Services</Tabs.Tab>
                            <Tabs.Tab value="process">Process</Tabs.Tab>
                            <Tabs.Tab value="faq">Questions</Tabs.Tab>
                        </Tabs.List>
                        <Tabs.Panels>
                            <Tabs.Panel value="services">
                                <div className="mono-caps">
                                    {SERVICES.map((s) => (
                                        <div key={s.no} className="mono-cap">
                                            <span className="mono-cap__no">{s.no}</span>
                                            <h3 className="mono-cap__title">{s.title}</h3>
                                            <p className="mono-cap__body">{s.body}</p>
                                        </div>
                                    ))}
                                </div>
                            </Tabs.Panel>

                            <Tabs.Panel value="process">
                                <div className="mono-process">
                                    <Timeline
                                        className="mono-timeline"
                                        events={[
                                            { date: "Week 0", title: "Discovery", description: "Goals, audience, constraints. A fixed-fee proposal with dates we hold.", color: "zinc" },
                                            { date: "Weeks 1–3", title: "Direction", description: "Two or three routes, drawn far enough that the decision is real, not abstract.", color: "zinc" },
                                            { date: "Weeks 4–8", title: "System", description: "The chosen route built into a documented, reusable system.", color: "blue" },
                                            { date: "Handoff", title: "Handoff", description: "Source files, guidelines, and a working session so your team owns it.", color: "zinc" },
                                        ]}
                                    />
                                </div>
                            </Tabs.Panel>

                            <Tabs.Panel value="faq">
                                <div className="mono-faq">
                                    <Accordion type="single" defaultOpen={["q0"]} className="mono-accordion">
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

                {/* ── About ────────────────────────────────────────────────────── */}
                <section className="mono-section mono-about" aria-labelledby="mo-about">
                    <div className="mono-about__label">
                        <div className="mono-eyebrow">
                            <span className="mono-eyebrow__no">03</span>
                            <span id="mo-about">About</span>
                        </div>
                    </div>
                    <div className="mono-about__body">
                        <p className="mono-about__lead">
                            We believe the best design is mostly invisible — a grid you never notice,
                            type that reads before you register it, a system that quietly holds.
                        </p>
                        <Text as="p" size="md" className="mono-about__text">
                            FIELDWORK began in 2016 as two people and a shared dislike of decoration
                            for its own sake. We've grown carefully since — eight people now, still
                            small enough that the people you meet are the people who do the work. We
                            take a handful of projects at a time and give each our full attention.
                        </Text>
                    </div>
                </section>

                {/* ── Team ─────────────────────────────────────────────────────── */}
                <section className="mono-section" aria-labelledby="mo-team">
                    <div className="mono-eyebrow">
                        <span className="mono-eyebrow__no">04</span>
                        <span>People</span>
                    </div>
                    <Heading as="h2" size="2xl" className="mono-h2 mono-h2--gap" id="mo-team">
                        The studio.
                    </Heading>
                    <div className="mono-people">
                        {TEAM.map((m) => (
                            <article key={m.name} className="mono-person">
                                <Avatar fallback={m.initials} size="lg" className="mono-avatar" />
                                <div className="mono-person__name">{m.name}</div>
                                <div className="mono-person__role">{m.role}</div>
                            </article>
                        ))}
                    </div>
                </section>

                {/* ── Recognition: awards ledger + clients ─────────────────────── */}
                <section className="mono-section" aria-labelledby="mo-recognition">
                    <div className="mono-recognition">
                        <div className="mono-recognition__main">
                            <div className="mono-eyebrow">
                                <span className="mono-eyebrow__no">05</span>
                                <span id="mo-recognition">Recognition</span>
                            </div>
                            <Heading as="h3" size="lg" className="mono-recognition__title">
                                Selected awards
                            </Heading>
                            <Table className="mono-table">
                                <Table.Head>
                                    <Table.Column label="Year" />
                                    <Table.Column label="Project" />
                                    <Table.Column label="Award" />
                                </Table.Head>
                                <Table.Body>
                                    {AWARDS.map((a) => (
                                        <Table.Row key={a.year + a.project}>
                                            <Table.Cell>{a.year}</Table.Cell>
                                            <Table.Cell>{a.project}</Table.Cell>
                                            <Table.Cell>{a.award}</Table.Cell>
                                        </Table.Row>
                                    ))}
                                </Table.Body>
                            </Table>
                        </div>

                        <aside className="mono-recognition__side">
                            <div className="mono-eyebrow"><span>Selected clients</span></div>
                            <div className="mono-clients">
                                {CLIENTS.map((c) => (
                                    <Badge key={c} className="mono-tag" color="zinc" variant="outline" size="md">{c}</Badge>
                                ))}
                            </div>
                            <Separator className="mono-sep" />
                            <div className="mono-eyebrow"><span>Press</span></div>
                            <ul className="mono-press">
                                <li className="mono-press__lead">It's Nice That — Studio of the week</li>
                                <li>Eye Magazine Nº 112</li>
                                <li>Slanted — Type in the wild</li>
                            </ul>
                        </aside>
                    </div>
                </section>

                {/* ── Brief / contact ──────────────────────────────────────────── */}
                <section className="mono-section" id="contact" aria-labelledby="mo-contact">
                    <div className="mono-contact">
                        <div className="mono-contact__intro">
                            <div className="mono-eyebrow">
                                <span className="mono-eyebrow__no">06</span>
                                <span id="mo-contact">Contact</span>
                            </div>
                            <Heading as="h2" size="2xl" className="mono-h2 mono-h2--gap">
                                Tell us about the work.
                            </Heading>
                            <p className="mono-lede mono-lede--sm">
                                A few sentences is plenty to start. We reply to every brief within two
                                working days.
                            </p>
                            <div className="mono-contact__addr">
                                <span className="mono-addr mono-addr--ink">studio@fieldwork.example</span>
                                <span className="mono-addr">+41 44 000 00 00</span>
                            </div>
                            <div className="mono-contact__why">
                                <span className="mono-meta">
                                    Scoped fixed-fee, no retainers —{" "}
                                    <ReasonTag
                                        value="how we price"
                                        reason="Every brief is scoped to a fixed fee after a short discovery call. No open-ended retainers unless you ask for one — the proposal sets the number and the dates."
                                        confidence={0.9}
                                        by="Studio"
                                        theme="underline"
                                    />
                                </span>
                            </div>
                        </div>

                        <Card variant="outlined" padding="none" className="mono-brief">
                            <Card.Header className="mono-brief__head">
                                <span className="mono-brief__title">New brief</span>
                                <Tooltip content="A person reads every brief — no bots.">
                                    <Badge color="zinc" variant="outline" size="sm" dot className="mono-brief__status">Open for Q3</Badge>
                                </Tooltip>
                            </Card.Header>
                            <Card.Body className="mono-brief__body">
                                {submitted ? (
                                    <div className="mono-brief__sent">
                                        <Badge color="zinc" variant="outline" size="md" className="mono-tag">Received</Badge>
                                        <p>Thanks — your brief is in. We'll reply within two working days.</p>
                                        <Button
                                            variant="ghost"
                                            icon="arrow-left"
                                            className="mono-btn mono-btn--ghost"
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
                                            className="mono-composer"
                                        />
                                        <div className="mono-brief__foot">
                                            <Text as="span" size="xs" className="mono-brief__count">
                                                {brief.trim().length} characters
                                            </Text>
                                            <Progress
                                                value={Math.min(brief.trim().length, 160)}
                                                max={160}
                                                variant="bar"
                                                size="sm"
                                                color="blue"
                                                className="mono-progress"
                                            />
                                        </div>
                                    </>
                                )}
                            </Card.Body>
                            {!submitted && (
                                <Card.Footer className="mono-brief__footer">
                                    <Text as="span" size="xs" className="mono-brief__note">No NDA needed to say hello.</Text>
                                    <Button
                                        disabled={brief.trim().length < 12}
                                        iconTrailing="arrow-right"
                                        className="mono-btn mono-btn--ink"
                                        onClick={() => setSubmitted(true)}
                                    >
                                        Send brief
                                    </Button>
                                </Card.Footer>
                            )}
                        </Card>
                    </div>
                </section>

                {/* ── Footer ───────────────────────────────────────────────────── */}
                <footer className="mono-footer">
                    <hr className="mono-rule mono-rule--ink" />
                    <div className="mono-footer__top">
                        <div className="mono-footer__brand">
                            <div className="mono-mark">
                                <span className="mono-mark__sq" aria-hidden />
                                <span className="mono-mark__name">FIELDWORK</span>
                            </div>
                            <p className="mono-footer__blurb">
                                A graphic design studio. Zürich and Lisbon. Brand, editorial, product,
                                and motion since 2016.
                            </p>
                        </div>
                        <div className="mono-footer__links">
                            <a href="#work">Work ↗</a>
                            <a href="https://fieldwork.example" target="_blank" rel="noopener noreferrer">Instagram ↗</a>
                            <a href="#contact">Contact ↗</a>
                            <a href="https://fieldwork.example" target="_blank" rel="noopener noreferrer">LinkedIn ↗</a>
                        </div>
                    </div>
                    <hr className="mono-rule" />
                    <div className="mono-footer__foot">
                        <span className="mono-meta">
                            FIELDWORK — a fictional studio, for demonstration · Style {style.num} / Monochrome
                        </span>
                        <Link href="/inspiration" className="mono-back">
                            <ArrowLeft size={14} />
                            Back to the gallery
                        </Link>
                    </div>
                </footer>
            </div>
        </div>
    );
}
