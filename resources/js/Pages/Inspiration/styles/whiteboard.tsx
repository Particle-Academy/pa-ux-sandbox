import "./whiteboard.css";
import { Link } from "@inertiajs/react";
import { useState, type CSSProperties } from "react";
import {
    Accordion,
    Avatar,
    Badge,
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
    StickyNote,
    Switch,
    Table,
    Tabs,
    Text,
    Timeline,
    Tooltip,
} from "@particle-academy/react-fancy";
import type { Style } from "../types";

/**
 * Inspiration Gallery · Style — Whiteboard.
 *
 * FIELDWORK (a FICTIONAL design + dev studio) rendered as a brainstorming
 * WHITEBOARD / infinite canvas: a dotted-grid board, sticky notes pinned and
 * tilted at angles, washi-tape labels, marker handwriting, dashed hand-drawn
 * connectors (inline SVG), and a "you-are-here" mini-map. The whole portfolio
 * reads as a wall of ideas a studio is mid-thinking-through — so the Fancy
 * primitives are restyled HARD to wear the marker-and-paper idiom: every card
 * becomes a taped-down paper scrap, Buttons become marker chips, Badges become
 * washi-tape labels, Avatars become Polaroid headshots, the Table becomes a
 * ruled notebook page, Tabs become highlighter index tabs, Progress becomes a
 * highlighter swipe, the Composer becomes a sticky-note brief pad.
 *
 * The centerpiece kit component is react-fancy's <StickyNote> — used both as a
 * literal note primitive AND as the metaphor every other component is dressed
 * to match. Mounted by Inspiration/Show.tsx for `style.id === "whiteboard"`.
 * SSR-safe: no module-level browser APIs; every interactive bit is controlled
 * React state. Inner card links use the stretched-link pattern (one <Link> per
 * row) so no anchor is ever nested in another anchor (avoids React #418 SSR).
 */

type Project = {
    num: string;
    title: string;
    discipline: string;
    year: string;
    client: string;
    color: string;
    rotate: number;
    award?: string;
};

const PROJECTS: Project[] = [
    { num: "01", title: "Meridian", discipline: "Brand system · type", year: "2025", client: "Meridian Cartography", color: "yellow", rotate: -2.5, award: "D&AD Wood Pencil" },
    { num: "02", title: "Low Tide", discipline: "Editorial · art direction", year: "2025", client: "Saltworks Press", color: "blue", rotate: 1.8 },
    { num: "03", title: "Quanta", discipline: "Product UI · motion", year: "2024", client: "Quanta Labs", color: "pink", rotate: -1.2, award: "Awwwards SOTD" },
    { num: "04", title: "Field Notes", discipline: "Identity · signage", year: "2024", client: "Atlas Botanic", color: "green", rotate: 2.4 },
    { num: "05", title: "Ostro", discipline: "Web · design system", year: "2024", client: "Ostro Maritime", color: "violet", rotate: -2.0 },
    { num: "06", title: "Paper Radio", discipline: "Brand · packaging", year: "2023", client: "Paper Radio Co.", color: "yellow", rotate: 1.4, award: "TDC Certificate" },
];

const SERVICES = [
    { no: "01", title: "Brand systems", body: "Identity, naming, voice — and the rules that keep a brand coherent as it scales. Delivered as a system, not a logo.", color: "yellow", rotate: -2 },
    { no: "02", title: "Editorial & type", body: "Magazines, reports, and bespoke typefaces. Long-form work where the grid does the heavy lifting.", color: "blue", rotate: 1.5 },
    { no: "03", title: "Product & web", body: "Interface design and design systems for software teams — research, prototypes, production-ready components.", color: "pink", rotate: -1.4 },
    { no: "04", title: "Motion & signage", body: "Title sequences, environmental graphics, wayfinding. Type and space, in motion or at architectural scale.", color: "green", rotate: 2.2 },
];

const TEAM = [
    { name: "Anja Vester", role: "Founder · design director", initials: "AV", rotate: -3 },
    { name: "Tomas Pell", role: "Type & editorial", initials: "TP", rotate: 2.5 },
    { name: "Rhea Okonkwo", role: "Product & systems", initials: "RO", rotate: -1.8 },
    { name: "Liang Mori", role: "Motion & 3D", initials: "LM", rotate: 3 },
];

const CLIENTS = ["Meridian", "Saltworks", "Quanta Labs", "Atlas Botanic", "Ostro", "Paper Radio", "Northwind", "Studio Føn"];

const FAQ = [
    { q: "How do you scope a project?", a: "Every engagement opens with a short discovery: goals, audience, constraints, and a fixed-fee proposal. No open-ended retainers unless you want one." },
    { q: "What's a typical timeline?", a: "Brand systems run six to ten weeks; editorial and product work vary with scope. We commit to dates in the proposal and hold them." },
    { q: "Do you work with in-house teams?", a: "Often. We can lead, embed, or hand off a documented system your team runs with — whatever leaves you the most independent." },
    { q: "Where are you based?", a: "Zürich and Lisbon, working across European and North-American time zones. Most work is remote with focused on-site weeks." },
];

const PER_PAGE = 4;

export default function Whiteboard({ style }: { style: Style }) {
    const [page, setPage] = useState(1);
    const [tags, setTags] = useState<string[]>(["Brand system", "Editorial"]);
    const [budget, setBudget] = useState(45);
    const [budgetConfidence, setBudgetConfidence] = useState(0.6);
    const [brief, setBrief] = useState("");
    const [submitted, setSubmitted] = useState(false);
    const [pinned, setPinned] = useState(true);
    const [heroNote, setHeroNote] = useState("Make the grid invisible. Make the idea obvious.");

    const totalPages = Math.ceil(PROJECTS.length / PER_PAGE);
    const pageProjects = PROJECTS.slice((page - 1) * PER_PAGE, page * PER_PAGE);

    return (
        <div className="insp-whiteboard">
            {/* dotted-grid canvas backdrop + soft paper grain */}
            <div className="wb-canvas" aria-hidden />
            <div className="wb-shell">
                {/* ── Board header: a taped index card mark + a "you-are-here" chip ── */}
                <header className="wb-runhead">
                    <div className="wb-mark">
                        <span className="wb-mark__pin" aria-hidden />
                        <span className="wb-mark__name">FIELDWORK</span>
                        <span className="wb-mark__sub">design + dev studio · the wall</span>
                    </div>
                    <div className="wb-runhead__meta">
                        <span className="wb-tape wb-tape--sm">board: portfolio.v26</span>
                        <span className="wb-runhead__dot" aria-hidden /> live session · 8 people
                    </div>
                </header>

                {/* ── Hero: a marker headline + sticky notes scattered round it ───── */}
                <section className="wb-hero" aria-labelledby="wb-hero-h">
                    <div className="wb-hero__copy">
                        <span className="wb-kicker">
                            <span className="wb-kicker__arrow" aria-hidden>↳</span> pinned to the top of the board
                        </span>
                        <h1 id="wb-hero-h" className="wb-display">
                            We think on <span className="wb-hi">walls</span>, then build what survives the morning.
                        </h1>
                        <p className="wb-lede">
                            FIELDWORK is a small studio working across brand, editorial, and product. We start every
                            project messy — notes, scraps, arrows — and ship systems clean enough to forget.
                        </p>
                        <div className="wb-hero__cta">
                            <Button className="wb-btn wb-btn--ink" iconTrailing="arrow-right" href="#contact">
                                Pin us a brief
                            </Button>
                            <Button variant="ghost" className="wb-btn wb-btn--ghost" iconTrailing="arrow-down" href="#work">
                                See the wall
                            </Button>
                        </div>
                        <div className="wb-hero__legend">
                            <span><i className="wb-swatch wb-swatch--y" /> ideas</span>
                            <span><i className="wb-swatch wb-swatch--b" /> in progress</span>
                            <span><i className="wb-swatch wb-swatch--p" /> shipped</span>
                        </div>
                    </div>

                    <div className="wb-hero__board" aria-hidden={false}>
                        {/* hand-drawn connectors behind the notes */}
                        <svg className="wb-wires" viewBox="0 0 360 320" fill="none" aria-hidden>
                            <path d="M70 70 C 150 40, 230 90, 280 60" className="wb-wire" />
                            <path d="M90 110 C 120 180, 210 170, 250 130" className="wb-wire wb-wire--dash" />
                            <path d="M120 230 C 180 210, 220 250, 285 220" className="wb-wire" />
                        </svg>
                        <div className="wb-pin wb-pin--a">
                            <StickyNote
                                className="wb-note"
                                color="yellow"
                                rotate={-5}
                                width={158}
                                value={heroNote}
                                onChange={setHeroNote}
                            />
                            <span className="wb-pintack" aria-hidden />
                        </div>
                        <div className="wb-pin wb-pin--b">
                            <StickyNote className="wb-note" color="blue" rotate={4} width={146} editable={false}>
                                research → routes → system → handoff
                            </StickyNote>
                            <span className="wb-pintack wb-pintack--red" aria-hidden />
                        </div>
                        <div className="wb-pin wb-pin--c">
                            <StickyNote className="wb-note" color="pink" rotate={-3} width={134} editable={false}>
                                measure twice. ship once. ✂
                            </StickyNote>
                            <span className="wb-pintack wb-pintack--blue" aria-hidden />
                        </div>
                    </div>
                </section>

                {/* ── Figures: numbers scrawled on scraps ────────────────────────── */}
                <section className="wb-section" aria-label="Studio in numbers">
                    <div className="wb-figures">
                        {[
                            { num: "2016", label: "first scrap pinned", rot: -2 },
                            { num: "120+", label: "projects shipped", rot: 1.5 },
                            { num: "08", label: "people on the wall", rot: -1.4 },
                            { num: "14", label: "awards taped up", rot: 2.2 },
                        ].map((f) => (
                            <div key={f.label} className="wb-figure" style={{ "--rot": `${f.rot}deg` } as CSSProperties}>
                                <span className="wb-figure__tack" aria-hidden />
                                <div className="wb-figure__num">{f.num}</div>
                                <div className="wb-figure__label">{f.label}</div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* ── Selected work: the project wall ────────────────────────────── */}
                <section className="wb-section" id="work" aria-labelledby="wb-work-h">
                    <div className="wb-sechead">
                        <div>
                            <span className="wb-tab" aria-hidden>01</span>
                            <Heading as="h2" size="2xl" weight="bold" className="wb-h2">
                                The work wall
                            </Heading>
                            <p className="wb-sechead__note">Six scraps we kept. Drag the filter, flip the page.</p>
                        </div>
                        <Pillbox
                            value={tags}
                            onChange={setTags}
                            placeholder="filter by discipline…"
                            className="wb-pillbox"
                            aria-label="Filter work by discipline"
                        />
                    </div>

                    <div className="wb-wall">
                        {pageProjects.map((p) => (
                            <article
                                key={p.num}
                                className="wb-scrap"
                                style={{ "--rot": `${p.rotate}deg`, "--paper": `var(--wb-paper-${p.color})` } as CSSProperties}
                            >
                                <Link href="/inspiration/whiteboard#work" className="wb-scrap__stretch" aria-label={`${p.title} — ${p.discipline}`} />
                                <span className="wb-scrap__tack" aria-hidden />
                                <div className="wb-scrap__top">
                                    <span className="wb-scrap__num">{p.num}</span>
                                    {p.award && <span className="wb-star" aria-hidden>★</span>}
                                </div>
                                <h3 className="wb-scrap__title">{p.title}</h3>
                                <p className="wb-scrap__disc">{p.discipline}</p>
                                <div className="wb-scrap__foot">
                                    <span className="wb-scrap__client">{p.client}</span>
                                    <span className="wb-scrap__year">{p.year} ↗</span>
                                </div>
                            </article>
                        ))}
                    </div>

                    <div className="wb-wall__foot">
                        <span className="wb-meta">
                            scraps {(page - 1) * PER_PAGE + 1}–{Math.min(page * PER_PAGE, PROJECTS.length)} of {PROJECTS.length}
                        </span>
                        <Pagination page={page} totalPages={totalPages} onPageChange={setPage} className="wb-pagination" />
                    </div>
                </section>

                {/* ── Capabilities: highlighter tabs ─────────────────────────────── */}
                <section className="wb-section" aria-labelledby="wb-cap-h">
                    <span className="wb-tab" aria-hidden>02</span>
                    <Heading as="h2" size="2xl" weight="bold" className="wb-h2 wb-h2--gap">
                        What we scribble about
                    </Heading>

                    <Tabs defaultTab="services" variant="underline">
                        <Tabs.List className="wb-tabs__list">
                            <Tabs.Tab value="services">services</Tabs.Tab>
                            <Tabs.Tab value="process">process</Tabs.Tab>
                            <Tabs.Tab value="faq">questions</Tabs.Tab>
                        </Tabs.List>
                        <Tabs.Panels>
                            <Tabs.Panel value="services">
                                <div className="wb-caps">
                                    {SERVICES.map((s) => (
                                        <StickyNote
                                            key={s.no}
                                            className="wb-cap"
                                            color={s.color}
                                            rotate={s.rotate}
                                            width="100%"
                                            editable={false}
                                        >
                                            <div className="wb-cap__inner">
                                                <span className="wb-cap__no">{s.no}</span>
                                                <h3 className="wb-cap__title">{s.title}</h3>
                                                <p className="wb-cap__body">{s.body}</p>
                                            </div>
                                        </StickyNote>
                                    ))}
                                </div>
                            </Tabs.Panel>

                            <Tabs.Panel value="process">
                                <div className="wb-process">
                                    <Timeline
                                        className="wb-timeline"
                                        events={[
                                            { date: "Week 0", title: "Discovery", description: "Goals, audience, constraints. A fixed-fee proposal with dates we hold.", color: "amber" },
                                            { date: "Weeks 1–3", title: "Direction", description: "Two or three routes, explored until a decision is real, not abstract.", color: "blue" },
                                            { date: "Weeks 4–8", title: "System", description: "The chosen direction built into a documented, reusable system.", color: "pink" },
                                            { date: "Handoff", title: "Handoff", description: "Source files, guidelines, and a working session so your team owns it.", color: "green" },
                                        ]}
                                    />
                                </div>
                            </Tabs.Panel>

                            <Tabs.Panel value="faq">
                                <div className="wb-faq">
                                    <Accordion type="single" defaultOpen={["q0"]} className="wb-accordion">
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

                {/* ── About: a big torn-paper note ───────────────────────────────── */}
                <section className="wb-section" aria-labelledby="wb-about-h">
                    <div className="wb-about">
                        <div className="wb-about__side">
                            <span className="wb-tab" aria-hidden>03</span>
                            <span className="wb-tape wb-tape--rot">about the studio</span>
                        </div>
                        <div className="wb-about__paper">
                            <span className="wb-pintack wb-pintack--red wb-about__tack" aria-hidden />
                            <p className="wb-about__lead">
                                The best design is mostly invisible — a grid you never notice, type that reads before
                                you register it, a system that quietly holds.
                            </p>
                            <Text as="p" size="md" className="wb-about__text">
                                FIELDWORK began in 2016 as two people and a shared dislike of decoration for its own
                                sake. We have grown carefully since — eight people now, still small enough that the
                                people you meet are the people who do the work. We take a handful of projects at a time
                                and give each our full attention.
                            </Text>
                            <span className="wb-about__sign">— and we still pin everything to the wall first.</span>
                        </div>
                    </div>
                </section>

                {/* ── Team: Polaroid wall ────────────────────────────────────────── */}
                <section className="wb-section" aria-labelledby="wb-team-h">
                    <span className="wb-tab" aria-hidden>04</span>
                    <Heading as="h2" size="2xl" weight="bold" className="wb-h2 wb-h2--gap">
                        The people pinned up
                    </Heading>
                    <div className="wb-team">
                        {TEAM.map((m) => (
                            <figure key={m.name} className="wb-polaroid" style={{ "--rot": `${m.rotate}deg` } as CSSProperties}>
                                <span className="wb-polaroid__tack" aria-hidden />
                                <div className="wb-polaroid__photo">
                                    <Avatar fallback={m.initials} size="xl" className="wb-avatar" />
                                </div>
                                <figcaption className="wb-polaroid__cap">
                                    <span className="wb-polaroid__name">{m.name}</span>
                                    <span className="wb-polaroid__role">{m.role}</span>
                                </figcaption>
                            </figure>
                        ))}
                    </div>
                </section>

                {/* ── Recognition: notebook ledger + taped client chips ──────────── */}
                <section className="wb-section" aria-labelledby="wb-rec-h">
                    <div className="wb-rec">
                        <div className="wb-rec__main">
                            <span className="wb-tab" aria-hidden>05</span>
                            <Heading as="h2" size="lg" weight="bold" className="wb-h2 wb-rec__title">
                                Taped-up wins
                            </Heading>
                            <div className="wb-ledger">
                                <Table className="wb-table">
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
                                            <Table.Cell>Type Directors Club · Excellence</Table.Cell>
                                        </Table.Row>
                                    </Table.Body>
                                </Table>
                            </div>
                        </div>

                        <div className="wb-rec__side">
                            <span className="wb-tape wb-tape--rot">clients on the wall</span>
                            <div className="wb-clients">
                                {CLIENTS.map((c, i) => (
                                    <Badge key={c} className={`wb-chip wb-chip--${["y", "b", "p", "g", "v"][i % 5]}`}>
                                        {c}
                                    </Badge>
                                ))}
                            </div>
                            <Separator className="wb-sep" />
                            <span className="wb-tape wb-tape--rot wb-tape--alt">said about us</span>
                            <ul className="wb-press">
                                <li className="wb-press__lead">It&apos;s Nice That — Studio of the week</li>
                                <li>Eye Magazine №112</li>
                                <li>Slanted — Type in the wild</li>
                            </ul>
                        </div>
                    </div>
                </section>

                {/* ── Contact / brief: a sticky-note brief pad ───────────────────── */}
                <section className="wb-section" id="contact" aria-labelledby="wb-contact-h">
                    <div className="wb-contact">
                        <div className="wb-contact__intro">
                            <span className="wb-tab" aria-hidden>06</span>
                            <Heading as="h2" size="2xl" weight="bold" className="wb-h2">
                                Stick a brief on the board
                            </Heading>
                            <p className="wb-lede wb-lede--sm">
                                A few sentences is plenty to start. We reply to every note within two working days.
                            </p>
                            <div className="wb-contact__addr">
                                <span className="wb-addr wb-addr--accent">studio@fieldwork.example</span>
                                <span className="wb-addr">+41 44 000 00 00 · Zürich · Lisbon</span>
                            </div>

                            <div className="wb-budget">
                                <span className="wb-tape wb-tape--sm">rough budget pad</span>
                                <Text as="p" size="sm" className="wb-budget__hint">
                                    Drag along for the figure, up for how firm it is. It only helps us scope — nothing is
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
                                    color="var(--wb-accent)"
                                    className="wb-mood"
                                />
                                <div className="wb-meta wb-budget__read">
                                    scoping around{" "}
                                    <ReasonTag
                                        value={`€${budget}k`}
                                        reason="Indicative only — the proposal sets the fixed fee after discovery. Drawn from your budget pad and the project type."
                                        confidence={budgetConfidence}
                                        by="Studio"
                                        theme="underline"
                                        className="wb-reason"
                                    />{" "}
                                    · confidence {Math.round(budgetConfidence * 100)}%
                                </div>
                            </div>
                        </div>

                        <div className="wb-contact__pad">
                            <Card variant="outlined" padding="none" className="wb-brief">
                                <span className="wb-brief__tack" aria-hidden />
                                <Card.Header className="wb-brief__head">
                                    <span className="wb-brief__title">✎ new note</span>
                                    <Tooltip content="A person reads every note — no bots.">
                                        <Badge dot className="wb-chip wb-chip--g wb-brief__status">
                                            open for Q3
                                        </Badge>
                                    </Tooltip>
                                </Card.Header>
                                <Card.Body className="wb-brief__body">
                                    {submitted ? (
                                        <div className="wb-brief__sent">
                                            <span className="wb-brief__ok">✓ pinned to the board</span>
                                            <p>
                                                Thanks — your note is up. We&apos;ll write back within two working days at{" "}
                                                <span className="wb-brief__mail">studio@fieldwork.example</span>.
                                            </p>
                                            <Button
                                                variant="ghost"
                                                className="wb-btn wb-btn--ghost"
                                                icon="arrow-left"
                                                onClick={() => {
                                                    setSubmitted(false);
                                                    setBrief("");
                                                }}
                                            >
                                                Write another
                                            </Button>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="wb-brief__prompt">scribble what you&apos;re building, and when it&apos;s due ↓</div>
                                            <Composer
                                                value={brief}
                                                onChange={setBrief}
                                                onSubmit={() => setBrief((b) => b)}
                                                placeholder="A six-week brand system for a maritime startup…"
                                                className="wb-composer"
                                            />
                                            <div className="wb-brief__foot">
                                                <label className="wb-pinopt">
                                                    <Switch checked={pinned} onCheckedChange={setPinned} color="amber" className="wb-switch" />
                                                    <span>pin it to the top</span>
                                                </label>
                                                <Progress
                                                    value={Math.min(brief.trim().length, 160)}
                                                    max={160}
                                                    variant="bar"
                                                    size="sm"
                                                    className="wb-progress"
                                                />
                                            </div>
                                        </>
                                    )}
                                </Card.Body>
                                {!submitted && (
                                    <Card.Footer className="wb-brief__footer">
                                        <Text as="span" size="xs" className="wb-brief__note">
                                            No NDA needed to say hello.
                                        </Text>
                                        <Button
                                            className="wb-btn wb-btn--ink"
                                            disabled={brief.trim().length < 12}
                                            iconTrailing="arrow-right"
                                            onClick={() => setSubmitted(true)}
                                        >
                                            Pin it up
                                        </Button>
                                    </Card.Footer>
                                )}
                            </Card>
                        </div>
                    </div>
                </section>

                {/* ── Footer: torn edge + back link ──────────────────────────────── */}
                <footer className="wb-footer">
                    <div className="wb-footer__top">
                        <div>
                            <div className="wb-mark wb-mark--sm">
                                <span className="wb-mark__pin" aria-hidden />
                                <span className="wb-mark__name">FIELDWORK</span>
                            </div>
                            <p className="wb-footer__blurb">
                                A design + dev studio. Zürich and Lisbon. We pin everything to the wall first — brand,
                                editorial, product, motion — since 2016.
                            </p>
                        </div>
                        <div className="wb-footer__links">
                            <a href="#work">Work ↗</a>
                            <a href="https://fieldwork.example" target="_blank" rel="noopener noreferrer">Instagram ↗</a>
                            <a href="#contact">Contact ↗</a>
                            <a href="https://fieldwork.example" target="_blank" rel="noopener noreferrer">LinkedIn ↗</a>
                        </div>
                    </div>

                    <div className="wb-footer__torn" aria-hidden />

                    <div className="wb-footer__foot">
                        <span className="wb-meta">FIELDWORK — a fictional studio, for demonstration · Style {style.num} / Whiteboard</span>
                        <Link href="/inspiration" className="wb-back">
                            ← back to the gallery
                        </Link>
                    </div>
                </footer>
            </div>
        </div>
    );
}
