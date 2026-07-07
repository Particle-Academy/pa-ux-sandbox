import "./editorial.css";
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
    Composer,
    Heading,
    Pagination,
    Progress,
    ReasonTag,
    Separator,
    Table,
    Tabs,
    Text,
    Timeline,
    Tooltip,
} from "@particle-academy/react-fancy";
import { ArrowLeft, ArrowUpRight, Quote } from "lucide-react";
import type { Style } from "../../types";

/**
 * Inspiration Gallery · Style — Editorial.
 *
 * FIELDWORK (a fictional design / dev studio) set as a printed design magazine:
 * a masthead + issue folio, a contents/index column, big serif display type
 * with drop caps, justified multi-column body copy, pull-quotes, bylines, and
 * numbered footnotes. The Fancy kit is forced to WEAR the magazine idiom — the
 * Callout becomes a pull-quote, the Table becomes an awards ledger, the Tabs
 * become a section rail, Badges become standfirst kickers, the Composer becomes
 * a "Letters to the editor" box. Proof the same primitives carry any language.
 *
 * Mounted by Inspiration/Show.tsx for `style.id === "editorial"`. SSR-safe: no
 * module-level browser APIs; every interactive bit is controlled React state.
 * Inner links use the stretched-link pattern (one <Link> per row) so no anchor
 * is ever nested inside another anchor (avoids React #418 under SSR).
 */

type Feature = {
    folio: string;
    kicker: string;
    title: string;
    dek: string;
    discipline: string;
    year: string;
    pages: string;
};

const FEATURES: Feature[] = [
    { folio: "p.04", kicker: "Cover story", title: "The Cartographer's Hand", dek: "A complete brand system and a bespoke grotesque for a mapmaker who measures the coastline twice.", discipline: "Identity · Type design", year: "2025", pages: "12pp" },
    { folio: "p.18", kicker: "Field report", title: "Low Tide Quarterly", dek: "An art-directed journal of the littoral — twelve issues, one editorial grid, no two spreads alike.", discipline: "Editorial · Art direction", year: "2025", pages: "8pp" },
    { folio: "p.30", kicker: "Interface", title: "Quanta, in Motion", dek: "A product UI and motion language for an instrument that has to feel calm while it computes.", discipline: "Product · Motion", year: "2024", pages: "10pp" },
    { folio: "p.44", kicker: "Wayfinding", title: "Signs of the Garden", dek: "Identity and environmental signage for a botanic archive — type at architectural scale.", discipline: "Identity · Signage", year: "2024", pages: "6pp" },
    { folio: "p.52", kicker: "Systems", title: "Ostro, End to End", dek: "A maritime design system: research, tokens, components, and the prose that keeps them honest.", discipline: "Web · Design system", year: "2024", pages: "9pp" },
    { folio: "p.66", kicker: "Object", title: "Paper Radio", dek: "Brand and packaging for a small-batch press — ink, stock, and the smell of a good idea.", discipline: "Brand · Packaging", year: "2023", pages: "7pp" },
];

const DEPARTMENTS = [
    { no: "I", title: "Brand systems", body: "Identity, naming, voice, and the rules that hold a brand together as it scales — shipped as a system, never a single mark." },
    { no: "II", title: "Editorial & type", body: "Magazines, reports, and bespoke typefaces. The long-form work where the grid quietly does the heavy lifting." },
    { no: "III", title: "Product & web", body: "Interface design and design systems for software teams — research, prototypes, and production-ready components." },
    { no: "IV", title: "Motion & signage", body: "Title sequences, environmental graphics, and wayfinding. Type and space, set in motion or at architectural scale." },
];

const MASTHEAD = [
    { name: "Anja Vester", role: "Editor-in-chief · Design director", initials: "AV" },
    { name: "Tomas Pell", role: "Type & editorial", initials: "TP" },
    { name: "Rhea Okonkwo", role: "Product & systems", initials: "RO" },
    { name: "Liang Mori", role: "Motion & art direction", initials: "LM" },
];

const CONTRIBUTORS = ["Meridian", "Saltworks Press", "Quanta Labs", "Atlas Botanic", "Ostro Maritime", "Paper Radio Co.", "Northwind", "Studio Føn"];

const LETTERS = [
    { q: "How do you scope a commission?", a: "Every engagement opens with a short discovery — goals, audience, constraints — and a fixed-fee proposal. No open-ended retainers unless you ask for one." },
    { q: "What's a typical timeline?", a: "Brand systems run six to ten weeks; editorial and product work vary with scope. We commit to dates in the proposal and we hold them." },
    { q: "Do you work with in-house teams?", a: "Often. We can lead, embed, or hand off a documented system your team runs with — whichever leaves you the most independent." },
    { q: "Where are you based?", a: "Zürich and Lisbon, working across European and North American time zones. Most work happens remotely with focused on-site weeks." },
];

const FOOTNOTES = [
    "Print run: an edition of one, set for the Fancy UI Inspiration Gallery.",
    "Body set in the host serif; folios and standfirsts in Geist Mono.",
    "FIELDWORK is fictional — any resemblance to a studio you'd hire is intentional flattery.",
];

const PER_PAGE = 4;

export default function Editorial({ style }: { style: Style }) {
    const [page, setPage] = useState(1);
    const [budget, setBudget] = useState(0);
    const [letter, setLetter] = useState("");
    const [sent, setSent] = useState(false);

    const totalPages = Math.ceil(FEATURES.length / PER_PAGE);
    const pageFeatures = FEATURES.slice((page - 1) * PER_PAGE, page * PER_PAGE);

    return (
        <div className="insp-editorial">
            <div className="ed-shell">
                {/* ── Running head: breadcrumbs + folio ──────────────────────── */}
                <div className="ed-runhead">
                    <Breadcrumbs className="ed-breadcrumbs">
                        <Breadcrumbs.Item href="/inspiration">Inspiration</Breadcrumbs.Item>
                        <Breadcrumbs.Item active>Editorial</Breadcrumbs.Item>
                    </Breadcrumbs>
                    <span className="ed-folio">Issue Nº 07 — Quarterly — €0.00</span>
                </div>

                {/* ── Masthead ───────────────────────────────────────────────── */}
                <header className="ed-masthead">
                    <div className="ed-masthead__rule" aria-hidden />
                    <h1 className="ed-wordmark">FIELDWORK</h1>
                    <div className="ed-masthead__sub">
                        <span>The Design Quarterly</span>
                        <span>Zürich · Lisbon</span>
                        <span>Established 2016</span>
                    </div>
                    <div className="ed-masthead__rule ed-masthead__rule--double" aria-hidden />
                </header>

                {/* ── Cover hero ─────────────────────────────────────────────── */}
                <section className="ed-section ed-cover" aria-labelledby="ed-cover-title">
                    <div className="ed-cover__main">
                        <Badge className="ed-kicker" color="rose" variant="soft" size="sm">
                            Cover · Manifesto
                        </Badge>
                        <h2 id="ed-cover-title" className="ed-display">
                            On the quiet
                            <span className="ed-display__accent"> discipline </span>
                            of design.
                        </h2>
                        <p className="ed-dek">
                            A small studio working at the seam of brand, editorial, and product —
                            building systems that stay legible as they scale, and measuring twice
                            before a single line is set.
                        </p>
                        <div className="ed-byline">
                            <span className="ed-byline__by">Words by</span>
                            <span className="ed-byline__name">Anja Vester</span>
                            <span className="ed-byline__sep">·</span>
                            <span className="ed-byline__date">Spring 2026</span>
                        </div>

                        <div className="ed-columns">
                            <p className="ed-drop">
                                There is a particular vanity in design that mistakes noise for
                                substance — the extra gradient, the restless animation, the type
                                that shouts because it has nothing to say. We have spent ten years
                                arguing, mostly with ourselves, for the opposite.
                            </p>
                            <p>
                                A grid you never notice. Type that reads before you register it as
                                type. A system that holds, quietly, while the brand it carries grows
                                from a single founder to a floor of them. The best of our work is the
                                work you don't see — and that is exactly the point.<sup className="ed-fn">1</sup>
                            </p>
                            <p>
                                FIELDWORK began in 2016 as two people and a shared dislike of
                                decoration for its own sake. We've grown carefully since: eight
                                people now, still small enough that the names on the masthead are the
                                hands on the work. We take a handful of commissions at a time and give
                                each our full attention.
                            </p>
                            <p>
                                What follows is an issue, not a deck — a contents page, a few
                                features, a ledger of awards, and a letters box at the back. Read it
                                the way you'd read any good magazine: out of order, twice, and slowly.
                            </p>
                        </div>

                        <div className="ed-cover__cta">
                            <Button color="rose" href="#letters" iconTrailing="arrow-right" className="ed-btn ed-btn--ink">
                                Write to the editor
                            </Button>
                            <Button variant="ghost" href="#features" iconTrailing="arrow-down" className="ed-btn ed-btn--ghost">
                                Read the features
                            </Button>
                        </div>
                    </div>

                    {/* Contents / issue index */}
                    <aside className="ed-contents" aria-label="In this issue">
                        <div className="ed-contents__head">
                            <span className="ed-contents__label">In this issue</span>
                            <span className="ed-contents__folio">Nº 07</span>
                        </div>
                        <ol className="ed-contents__list">
                            {FEATURES.map((f) => (
                                <li key={f.folio} className="ed-contents__row">
                                    <span className="ed-contents__kicker">{f.kicker}</span>
                                    <span className="ed-contents__title">{f.title}</span>
                                    <span className="ed-contents__page">{f.folio}</span>
                                </li>
                            ))}
                        </ol>
                        <Separator className="ed-contents__sep" />
                        <div className="ed-contents__meta">
                            <div>
                                <span className="ed-stat__num">120+</span>
                                <span className="ed-stat__label">Issues shipped</span>
                            </div>
                            <div>
                                <span className="ed-stat__num">14</span>
                                <span className="ed-stat__label">Awards</span>
                            </div>
                            <div>
                                <span className="ed-stat__num">08</span>
                                <span className="ed-stat__label">On the masthead</span>
                            </div>
                        </div>
                    </aside>
                </section>

                {/* ── Pull-quote band ────────────────────────────────────────── */}
                <section className="ed-section ed-pull-section" aria-label="Pull quote">
                    <Callout className="ed-pull" icon={<Quote size={26} strokeWidth={1.5} />} color="rose">
                        <span className="ed-pull__text">
                            We don't ship logos. We ship the rules that keep a logo honest for the
                            next ten years.
                        </span>
                        <span className="ed-pull__attr">— FIELDWORK house style, §1</span>
                    </Callout>
                </section>

                {/* ── Features index ─────────────────────────────────────────── */}
                <section className="ed-section" id="features" aria-labelledby="ed-features">
                    <div className="ed-section__head">
                        <span className="ed-dept-mark">Features</span>
                        <Heading as="h2" size="2xl" className="ed-section__title">
                            Selected work, set as features.
                        </Heading>
                        <p className="ed-section__lede">
                            Six commissions from the last three years — each one a short feature in
                            the studio's running magazine.
                        </p>
                    </div>

                    <ol className="ed-feed">
                        {pageFeatures.map((f) => (
                            <li key={f.folio} className="ed-feed__row">
                                <Link
                                    href="/inspiration/editorial#features"
                                    className="ed-feed__stretch"
                                    aria-label={`${f.title} — ${f.discipline}`}
                                />
                                <span className="ed-feed__folio">{f.folio}</span>
                                <div className="ed-feed__body">
                                    <span className="ed-feed__kicker">{f.kicker}</span>
                                    <h3 className="ed-feed__title">{f.title}</h3>
                                    <p className="ed-feed__dek">{f.dek}</p>
                                </div>
                                <div className="ed-feed__meta">
                                    <span>{f.discipline}</span>
                                    <span>{f.year} · {f.pages}</span>
                                    <span className="ed-feed__more">Read <ArrowUpRight size={13} /></span>
                                </div>
                            </li>
                        ))}
                    </ol>

                    <div className="ed-feed__foot">
                        <span className="ed-folio">
                            Features {(page - 1) * PER_PAGE + 1}–{Math.min(page * PER_PAGE, FEATURES.length)} of {FEATURES.length}
                        </span>
                        <Pagination page={page} totalPages={totalPages} onPageChange={setPage} className="ed-pagination" />
                    </div>
                </section>

                {/* ── Departments (capabilities) ─────────────────────────────── */}
                <section className="ed-section" aria-labelledby="ed-depts">
                    <div className="ed-section__head">
                        <span className="ed-dept-mark">Departments</span>
                        <Heading as="h2" size="2xl" className="ed-section__title">
                            The standing columns.
                        </Heading>
                    </div>

                    <Tabs defaultTab="services" variant="underline" className="ed-tabs">
                        <Tabs.List className="ed-tabs__list">
                            <Tabs.Tab value="services">Services</Tabs.Tab>
                            <Tabs.Tab value="process">Editorial process</Tabs.Tab>
                            <Tabs.Tab value="letters">Letters</Tabs.Tab>
                        </Tabs.List>
                        <Tabs.Panels>
                            <Tabs.Panel value="services">
                                <div className="ed-depts">
                                    {DEPARTMENTS.map((d) => (
                                        <article key={d.no} className="ed-dept">
                                            <span className="ed-dept__no">{d.no}</span>
                                            <h3 className="ed-dept__title">{d.title}</h3>
                                            <p className="ed-dept__body">{d.body}</p>
                                        </article>
                                    ))}
                                </div>
                            </Tabs.Panel>

                            <Tabs.Panel value="process">
                                <div className="ed-process">
                                    <Timeline
                                        className="ed-timeline"
                                        events={[
                                            { date: "Week 0", title: "Commission", description: "Goals, audience, constraints. A fixed-fee proposal with dates we hold.", color: "rose" },
                                            { date: "Weeks 1–3", title: "Direction", description: "Two or three routes, drawn far enough that the decision is real, not abstract.", color: "zinc" },
                                            { date: "Weeks 4–8", title: "The set", description: "The chosen route built into a documented, reusable system — type, tokens, prose.", color: "rose" },
                                            { date: "To press", title: "Handoff", description: "Source files, a style guide, and a working session so the system is yours.", color: "zinc" },
                                        ]}
                                    />
                                </div>
                            </Tabs.Panel>

                            <Tabs.Panel value="letters">
                                <div className="ed-faq">
                                    <Accordion type="single" defaultOpen={["l0"]} className="ed-accordion">
                                        {LETTERS.map((item, i) => (
                                            <Accordion.Item key={i} value={`l${i}`}>
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

                {/* ── Masthead (team) ────────────────────────────────────────── */}
                <section className="ed-section" aria-labelledby="ed-people">
                    <div className="ed-section__head">
                        <span className="ed-dept-mark">The masthead</span>
                        <Heading as="h2" size="2xl" className="ed-section__title">
                            Who sets the type.
                        </Heading>
                    </div>
                    <div className="ed-people">
                        {MASTHEAD.map((m) => (
                            <article key={m.name} className="ed-person">
                                <Avatar fallback={m.initials} size="lg" className="ed-avatar" />
                                <div className="ed-person__name">{m.name}</div>
                                <div className="ed-person__role">{m.role}</div>
                            </article>
                        ))}
                    </div>
                </section>

                {/* ── Awards ledger + contributors ───────────────────────────── */}
                <section className="ed-section" aria-labelledby="ed-recognition">
                    <div className="ed-recognition">
                        <div className="ed-recognition__main">
                            <span className="ed-dept-mark">Recognition</span>
                            <Heading as="h2" size="lg" className="ed-recognition__title">
                                The awards ledger
                            </Heading>
                            <Table className="ed-table">
                                <Table.Head>
                                    <Table.Column label="Year" />
                                    <Table.Column label="Feature" />
                                    <Table.Column label="Citation" />
                                </Table.Head>
                                <Table.Body>
                                    <Table.Row>
                                        <Table.Cell>2025</Table.Cell>
                                        <Table.Cell>The Cartographer's Hand</Table.Cell>
                                        <Table.Cell>D&AD Wood Pencil — Typography</Table.Cell>
                                    </Table.Row>
                                    <Table.Row>
                                        <Table.Cell>2024</Table.Cell>
                                        <Table.Cell>Quanta, in Motion</Table.Cell>
                                        <Table.Cell>Awwwards — Site of the Day</Table.Cell>
                                    </Table.Row>
                                    <Table.Row>
                                        <Table.Cell>2024</Table.Cell>
                                        <Table.Cell>Ostro, End to End</Table.Cell>
                                        <Table.Cell>CSS Design Awards — UI</Table.Cell>
                                    </Table.Row>
                                    <Table.Row>
                                        <Table.Cell>2023</Table.Cell>
                                        <Table.Cell>The studio</Table.Cell>
                                        <Table.Cell>Type Directors Club — Certificate of Excellence</Table.Cell>
                                    </Table.Row>
                                </Table.Body>
                            </Table>
                        </div>

                        <aside className="ed-recognition__side">
                            <span className="ed-dept-mark">Contributors</span>
                            <div className="ed-contributors">
                                {CONTRIBUTORS.map((c) => (
                                    <Badge key={c} className="ed-tag" color="zinc" variant="outline" size="md">{c}</Badge>
                                ))}
                            </div>
                            <Separator className="ed-side-sep" />
                            <span className="ed-dept-mark">In the press</span>
                            <ul className="ed-press">
                                <li className="ed-press__lead">It's Nice That — Studio of the week</li>
                                <li>Eye Magazine Nº 112</li>
                                <li>Slanted — Type in the wild</li>
                            </ul>
                        </aside>
                    </div>
                </section>

                {/* ── Letters to the editor (contact / brief) ────────────────── */}
                <section className="ed-section" id="letters" aria-labelledby="ed-letters">
                    <div className="ed-letters">
                        <div className="ed-letters__intro">
                            <span className="ed-dept-mark">Correspondence</span>
                            <Heading as="h2" size="2xl" className="ed-section__title">
                                Letters to the editor.
                            </Heading>
                            <p className="ed-section__lede">
                                A few sentences is plenty to start a commission. We reply to every
                                letter within two working days.
                            </p>
                            <div className="ed-letters__contact">
                                <span className="ed-letters__addr">studio@fieldwork.example</span>
                                <span className="ed-letters__addr ed-letters__addr--muted">+41 44 000 00 00</span>
                            </div>

                            <div className="ed-budget">
                                <span className="ed-dept-mark">Indicative budget</span>
                                <Text as="p" size="sm" className="ed-budget__help">
                                    Slide to the rough commission size — it only helps us scope the
                                    feature, nothing is binding.
                                </Text>
                                <input
                                    type="range"
                                    min={10}
                                    max={150}
                                    step={5}
                                    value={budget || 40}
                                    onChange={(e) => setBudget(Number(e.target.value))}
                                    className="ed-range"
                                    aria-label="Indicative budget in thousands of euros"
                                />
                                <div className="ed-budget__read">
                                    Scoping at{" "}
                                    <ReasonTag
                                        value={`€${budget || 40}k`}
                                        reason="Indicative only — the proposal sets the fixed fee after the discovery conversation. Drawn from your slider and the feature length."
                                        confidence={0.6}
                                        by="The editor"
                                        theme="underline"
                                    />
                                </div>
                            </div>
                        </div>

                        <Card variant="outlined" padding="none" className="ed-letterbox">
                            <Card.Header className="ed-letterbox__head">
                                <span className="ed-letterbox__title">New letter</span>
                                <Tooltip content="A person reads every letter — no auto-replies.">
                                    <Badge color="emerald" variant="soft" size="sm" dot>Open for Q3</Badge>
                                </Tooltip>
                            </Card.Header>
                            <Card.Body className="ed-letterbox__body">
                                {sent ? (
                                    <div className="ed-letterbox__sent">
                                        <Badge color="emerald" variant="soft" size="md">Received</Badge>
                                        <p>Thank you — your letter is in. We'll write back within two working days.</p>
                                        <Button
                                            variant="ghost"
                                            icon="arrow-left"
                                            className="ed-btn ed-btn--ghost"
                                            onClick={() => { setSent(false); setLetter(""); }}
                                        >
                                            Write another
                                        </Button>
                                    </div>
                                ) : (
                                    <>
                                        <Composer
                                            value={letter}
                                            onChange={setLetter}
                                            onSubmit={() => setLetter((b) => b)}
                                            placeholder="Dear FIELDWORK — what are you making, and by when?"
                                            className="ed-composer"
                                        />
                                        <div className="ed-letterbox__foot">
                                            <Text as="span" size="xs" className="ed-letterbox__count">
                                                {letter.trim().length} characters set
                                            </Text>
                                            <Progress
                                                value={Math.min(letter.trim().length, 160)}
                                                max={160}
                                                variant="bar"
                                                size="sm"
                                                color="rose"
                                                className="ed-progress"
                                            />
                                        </div>
                                    </>
                                )}
                            </Card.Body>
                            {!sent && (
                                <Card.Footer className="ed-letterbox__footer">
                                    <Text as="span" size="xs" className="ed-letterbox__note">No NDA needed to say hello.</Text>
                                    <Button
                                        color="rose"
                                        disabled={letter.trim().length < 12}
                                        iconTrailing="arrow-right"
                                        className="ed-btn ed-btn--ink"
                                        onClick={() => setSent(true)}
                                    >
                                        Send to press
                                    </Button>
                                </Card.Footer>
                            )}
                        </Card>
                    </div>
                </section>

                {/* ── Colophon / footnotes ───────────────────────────────────── */}
                <footer className="ed-colophon">
                    <div className="ed-colophon__rule" aria-hidden />
                    <div className="ed-colophon__top">
                        <div className="ed-colophon__brand">
                            <span className="ed-colophon__word">FIELDWORK</span>
                            <p>The Design Quarterly — Zürich &amp; Lisbon. Brand, editorial, product, and motion since 2016.</p>
                        </div>
                        <div className="ed-colophon__links">
                            <a href="#features">Features ↗</a>
                            <a href="https://fieldwork.example" target="_blank" rel="noopener noreferrer">Instagram ↗</a>
                            <a href="#letters">Letters ↗</a>
                            <a href="https://fieldwork.example" target="_blank" rel="noopener noreferrer">LinkedIn ↗</a>
                        </div>
                    </div>

                    <ol className="ed-footnotes">
                        {FOOTNOTES.map((note, i) => (
                            <li key={i}>
                                <span className="ed-footnotes__no">{i + 1}</span>
                                {note}
                            </li>
                        ))}
                    </ol>

                    <div className="ed-colophon__foot">
                        <span className="ed-folio">
                            FIELDWORK — a fictional studio, for demonstration · Style {style.num} / Editorial
                        </span>
                        <Link href="/inspiration" className="ed-back">
                            <ArrowLeft size={14} />
                            Back to the gallery
                        </Link>
                    </div>
                </footer>
            </div>
        </div>
    );
}
