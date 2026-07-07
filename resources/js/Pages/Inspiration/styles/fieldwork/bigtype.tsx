import "./bigtype.css";
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
    MultiSwitch,
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
 * Inspiration Gallery · Style — Big Type.
 *
 * FIELDWORK (a fictional design / dev studio) rendered as TYPOGRAPHY AT MAXIMUM
 * VOLUME: the design IS the type. Viewport-filling display lines, oversized
 * single words that bleed past the margins, a kinetic scrolling word-band, a
 * type-as-navigation work index, and almost no imagery. Near-black ink on warm
 * paper, one electric-lime accent, a grotesk display family + mono captions.
 *
 * The Fancy kit is forced to WEAR Big Type — primitives become TYPOGRAPHIC
 * OBJECTS, not widgets: Button → underlined type-link, Badge → mono superscript
 * tag, Tabs → giant switchable section words, the work Table → a huge ruled
 * ledger, Avatar → an initial set in display type, the Accordion → colossal
 * collapsing questions, Composer → an oversized note pad. Proof the same
 * primitives carry any visual language.
 *
 * Mounted by Inspiration/Show.tsx for `style.id === "bigtype"`. SSR-safe: no
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
    award?: string;
};

const PROJECTS: Project[] = [
    { num: "01", title: "MERIDIAN", discipline: "Identity · custom display type", year: "25", client: "Meridian Cartography", award: "D&AD Wood Pencil" },
    { num: "02", title: "LOUDER", discipline: "Brand · campaign system", year: "25", client: "Louder Records", award: "Type Directors Club" },
    { num: "03", title: "QUANTA", discipline: "Product UI · kinetic type", year: "24", client: "Quanta Labs", award: "Awwwards SOTD" },
    { num: "04", title: "ATLAS", discipline: "Editorial · wayfinding", year: "24", client: "Atlas Botanic" },
    { num: "05", title: "OSTRO", discipline: "Web · variable typeface", year: "24", client: "Ostro Maritime" },
    { num: "06", title: "PAPER RADIO", discipline: "Packaging · lettering", year: "23", client: "Paper Radio Co." },
];

const SERVICES = [
    { no: "01", title: "Type design", body: "Bespoke and variable typefaces drawn from the brief up — a voice nobody else can license." },
    { no: "02", title: "Brand systems", body: "Identity, naming, and the rules that keep a wordmark loud at any size, on any surface." },
    { no: "03", title: "Editorial", body: "Magazines, reports, and books where the grid is invisible and the headline does the work." },
    { no: "04", title: "Kinetic & web", body: "Type in motion — title sequences, interfaces, and sites built to be set huge and read fast." },
];

const TEAM = [
    { name: "Anja Vester", role: "Founder · type director", initials: "A" },
    { name: "Tomas Pell", role: "Editorial · lettering", initials: "T" },
    { name: "Rhea Okonkwo", role: "Product · kinetic", initials: "R" },
    { name: "Liang Mori", role: "Motion · 3D type", initials: "L" },
];

const CLIENTS = ["MERIDIAN", "LOUDER", "QUANTA", "ATLAS", "OSTRO", "PAPER RADIO", "NORTHWIND", "STUDIO FØN"];

const FAQ = [
    { q: "Do you really set everything THAT big?", a: "Not everything — but the loudest thing on the page earns its size. We design the hierarchy first, then push the top of it as far as the message can carry." },
    { q: "Can you draw a custom typeface?", a: "Yes. Roughly half our work ships with bespoke or variable type. You own it outright — no per-seat licensing, no surprise renewals." },
    { q: "What's a typical timeline?", a: "Brand systems run six to ten weeks; a full typeface, longer. We commit to dates in the proposal and hold them." },
    { q: "Where are you based?", a: "Zürich and Lisbon, working across European and North American time zones. Mostly remote, with focused on-site weeks." },
];

const MARQUEE = ["BIGGER", "LOUDER", "BOLDER", "FIELDWORK", "SET·IT·HUGE", "TYPE·FIRST"];

const PER_PAGE = 4;

const SIZE_OPTIONS = [
    { value: "huge", label: "Huge" },
    { value: "loud", label: "Loud" },
    { value: "max", label: "Max" },
];

export default function BigType({ style }: { style: Style }) {
    const [page, setPage] = useState(1);
    const [tags, setTags] = useState<string[]>(["Type design", "Editorial"]);
    const [scale, setScale] = useState<string>("loud");
    const [budget, setBudget] = useState(60);
    const [budgetConfidence, setBudgetConfidence] = useState(0.6);
    const [brief, setBrief] = useState("");
    const [submitted, setSubmitted] = useState(false);

    const totalPages = Math.ceil(PROJECTS.length / PER_PAGE);
    const pageProjects = PROJECTS.slice((page - 1) * PER_PAGE, page * PER_PAGE);

    return (
        <div className="insp-bigtype">
            <div className="bt-shell">
                {/* ── Running head ───────────────────────────────────────────── */}
                <div className="bt-runhead">
                    <Breadcrumbs className="bt-crumbs">
                        <Breadcrumbs.Item href="/inspiration">Inspiration</Breadcrumbs.Item>
                        <Breadcrumbs.Item active>Big Type</Breadcrumbs.Item>
                    </Breadcrumbs>
                    <div className="bt-mark">
                        <span className="bt-mark__word">FIELDWORK®</span>
                        <Badge className="bt-tag" color="zinc" variant="outline" size="sm">
                            EST·2016
                        </Badge>
                    </div>
                </div>

                {/* ── Hero — type fills the viewport ─────────────────────────── */}
                <section className="bt-hero" aria-labelledby="bt-hero-h">
                    <div className="bt-hero__kicker">
                        <span>00 — Index</span>
                        <span>A type-first design studio</span>
                    </div>
                    <h1 id="bt-hero-h" className="bt-display">
                        <span className="bt-line">WE&nbsp;SET</span>
                        <span className="bt-line bt-line--accent">IT</span>
                        <span className="bt-line bt-line--outline">HUGE.</span>
                    </h1>
                    <div className="bt-hero__foot">
                        <p className="bt-lede">
                            FIELDWORK is a studio where typography <em>is</em> the design. Brand systems, custom
                            typefaces, editorial, and kinetic work — set as loud as the message can carry.
                        </p>
                        <div className="bt-hero__cta">
                            <Button className="bt-btn bt-btn--ink" href="#contact" iconTrailing="arrow-right">
                                Brief the studio
                            </Button>
                            <Button className="bt-btn bt-btn--link" variant="ghost" href="#work" iconTrailing="arrow-down">
                                See the work
                            </Button>
                        </div>
                    </div>
                </section>

                {/* ── Kinetic word-band (hand-rolled marquee) ────────────────── */}
                <section className="bt-band" aria-label="Studio in three words">
                    <div className="bt-band__track" aria-hidden>
                        {[0, 1].map((dup) => (
                            <div className="bt-band__group" key={dup}>
                                {MARQUEE.map((w, i) => (
                                    <span className="bt-band__word" key={`${dup}-${i}`}>
                                        {w}
                                        <span className="bt-band__dot">●</span>
                                    </span>
                                ))}
                            </div>
                        ))}
                    </div>
                </section>

                {/* ── Figures ────────────────────────────────────────────────── */}
                <section className="bt-figures" aria-label="Studio in numbers">
                    {[
                        { num: "2016", label: "Founded" },
                        { num: "120", label: "Projects" },
                        { num: "31", label: "Typefaces drawn" },
                        { num: "14", label: "Awards" },
                    ].map((f) => (
                        <div key={f.label} className="bt-figure">
                            <div className="bt-figure__num">{f.num}</div>
                            <div className="bt-figure__label">{f.label}</div>
                        </div>
                    ))}
                </section>

                {/* ── Selected work — type-as-index ledger ───────────────────── */}
                <section className="bt-section" id="work" aria-labelledby="bt-work-h">
                    <div className="bt-section__head">
                        <div className="bt-mono-mark">01 — Selected work</div>
                        <Heading as="h2" className="bt-section__title">
                            SIX&nbsp;THINGS<br />WE&nbsp;MADE&nbsp;LOUD.
                        </Heading>
                        <Pillbox
                            value={tags}
                            onChange={setTags}
                            placeholder="Filter by discipline…"
                            className="bt-pillbox"
                            aria-label="Filter work by discipline"
                        />
                    </div>

                    <ol className="bt-index">
                        {pageProjects.map((p) => (
                            <li key={p.num} className="bt-index__row">
                                <Link
                                    href="/inspiration/bigtype#work"
                                    className="bt-index__stretch"
                                    aria-label={`${p.title} — ${p.discipline}`}
                                />
                                <span className="bt-index__num">{p.num}</span>
                                <span className="bt-index__title">{p.title}</span>
                                <span className="bt-index__meta">
                                    <span className="bt-index__disc">{p.discipline}</span>
                                    <span className="bt-index__year">’{p.year}</span>
                                </span>
                                <ArrowUpRight className="bt-index__arrow" size={34} aria-hidden />
                            </li>
                        ))}
                    </ol>

                    <div className="bt-section__foot">
                        <span className="bt-mono">
                            {(page - 1) * PER_PAGE + 1}–{Math.min(page * PER_PAGE, PROJECTS.length)} / {PROJECTS.length}
                        </span>
                        <Pagination className="bt-pagination" page={page} totalPages={totalPages} onPageChange={setPage} />
                    </div>
                </section>

                {/* ── Capabilities — Tabs as giant switchable words ──────────── */}
                <section className="bt-section" aria-labelledby="bt-cap-h">
                    <div className="bt-mono-mark">02 — What we do</div>
                    <Heading as="h2" className="bt-section__title bt-section__title--lg" id="bt-cap-h">
                        FOUR&nbsp;WAYS<br />TO&nbsp;BE&nbsp;HEARD.
                    </Heading>

                    <Tabs defaultTab="services" variant="underline">
                        <Tabs.List className="bt-tabs__list">
                            <Tabs.Tab value="services">SERVICES</Tabs.Tab>
                            <Tabs.Tab value="process">PROCESS</Tabs.Tab>
                            <Tabs.Tab value="faq">QUESTIONS</Tabs.Tab>
                        </Tabs.List>
                        <Tabs.Panels>
                            <Tabs.Panel value="services">
                                <div className="bt-caps">
                                    {SERVICES.map((s) => (
                                        <div key={s.no} className="bt-cap">
                                            <span className="bt-cap__no">{s.no}</span>
                                            <h3 className="bt-cap__title">{s.title}</h3>
                                            <p className="bt-cap__body">{s.body}</p>
                                        </div>
                                    ))}
                                </div>
                            </Tabs.Panel>

                            <Tabs.Panel value="process">
                                <div className="bt-process">
                                    <Timeline
                                        className="bt-timeline"
                                        events={[
                                            { date: "Week 0", title: "Brief", description: "Goals, audience, voice. A fixed-fee proposal with dates we hold.", color: "zinc" },
                                            { date: "Wk 1–3", title: "Sketch the headline", description: "We set the loudest line first — the rest of the hierarchy hangs off it.", color: "zinc" },
                                            { date: "Wk 4–8", title: "Build the system", description: "Type, scale, and rules documented into a kit your team runs with.", color: "lime" },
                                            { date: "Handoff", title: "Hand it over", description: "Source files, a working session, and a typeface you own outright.", color: "zinc" },
                                        ]}
                                    />
                                </div>
                            </Tabs.Panel>

                            <Tabs.Panel value="faq">
                                <div className="bt-faq">
                                    <Accordion className="bt-accordion" type="single" defaultOpen={["q0"]}>
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

                {/* ── About — one enormous statement ─────────────────────────── */}
                <section className="bt-section bt-about" aria-labelledby="bt-about-h">
                    <div className="bt-mono-mark">03 — About</div>
                    <p className="bt-statement" id="bt-about-h">
                        The biggest word on the page is a decision, not an accident. We make that
                        decision <span className="bt-statement__hl">on purpose</span>, every time.
                    </p>
                    <div className="bt-about__cols">
                        <Text as="p" className="bt-about__body">
                            FIELDWORK began in 2016 as two people who thought most design was too quiet. We&apos;ve
                            grown carefully since — eight people now, still small enough that the people you meet are
                            the people who draw the letters.
                        </Text>
                        <Text as="p" className="bt-about__body">
                            We take a handful of projects at a time and give each our full volume. No house style
                            imposed on your brand — the loudest thing on your page should sound like you, set as large
                            as it deserves to be.
                        </Text>
                    </div>
                </section>

                {/* ── Team — initials set as display type ────────────────────── */}
                <section className="bt-section" aria-labelledby="bt-team-h">
                    <div className="bt-mono-mark">04 — People</div>
                    <Heading as="h2" className="bt-section__title" id="bt-team-h">
                        THE&nbsp;STUDIO.
                    </Heading>
                    <div className="bt-team">
                        {TEAM.map((m) => (
                            <div key={m.name} className="bt-person">
                                <Avatar className="bt-avatar" fallback={m.initials} size="lg" />
                                <div className="bt-person__name">{m.name}</div>
                                <div className="bt-person__role">{m.role}</div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* ── Recognition — Table as a huge ledger + clients ─────────── */}
                <section className="bt-section" aria-labelledby="bt-rec-h">
                    <div className="bt-mono-mark">05 — Recognition</div>
                    <Heading as="h2" className="bt-section__title" id="bt-rec-h">
                        ON&nbsp;THE&nbsp;WALL.
                    </Heading>
                    <div className="bt-rec">
                        <div className="bt-rec__ledger">
                            <Table className="bt-table">
                                <Table.Head>
                                    <Table.Column label="’Yr" />
                                    <Table.Column label="Project" />
                                    <Table.Column label="Award" />
                                </Table.Head>
                                <Table.Body>
                                    {PROJECTS.filter((p) => p.award).map((p) => (
                                        <Table.Row key={p.num}>
                                            <Table.Cell>’{p.year}</Table.Cell>
                                            <Table.Cell>{p.title}</Table.Cell>
                                            <Table.Cell>{p.award}</Table.Cell>
                                        </Table.Row>
                                    ))}
                                    <Table.Row>
                                        <Table.Cell>’23</Table.Cell>
                                        <Table.Cell>STUDIO</Table.Cell>
                                        <Table.Cell>It&apos;s Nice That — Studio of the Week</Table.Cell>
                                    </Table.Row>
                                </Table.Body>
                            </Table>
                        </div>
                        <div className="bt-rec__side">
                            <div className="bt-mono-mark">Selected clients</div>
                            <div className="bt-clients">
                                {CLIENTS.map((c) => (
                                    <Badge key={c} className="bt-client" color="zinc" variant="soft" size="md">
                                        {c}
                                    </Badge>
                                ))}
                            </div>
                            <Separator className="bt-sep" />
                            <div className="bt-mono-mark">Press</div>
                            <ul className="bt-press">
                                <li className="bt-press__lead">Eye Magazine №112 — “Loud, on purpose.”</li>
                                <li>Slanted — Type in the wild</li>
                                <li>It&apos;s Nice That — Studio of the week</li>
                            </ul>
                        </div>
                    </div>
                </section>

                {/* ── Contact / brief ────────────────────────────────────────── */}
                <section className="bt-section bt-contact" id="contact" aria-labelledby="bt-contact-h">
                    <div className="bt-mono-mark">06 — Say it loud</div>
                    <Heading as="h2" className="bt-section__title bt-section__title--lg" id="bt-contact-h">
                        TELL&nbsp;US<br />THE&nbsp;HEADLINE.
                    </Heading>

                    <div className="bt-contact__grid">
                        <div className="bt-contact__left">
                            <p className="bt-lede bt-lede--sm">
                                One sentence is plenty to start — what you&apos;re making and when it ships. We reply to
                                every brief within two working days.
                            </p>
                            <div className="bt-contact__addr">studio@fieldwork.example</div>
                            <div className="bt-contact__addr bt-contact__addr--muted">+41 44 000 00 00</div>

                            <div className="bt-scale">
                                <div className="bt-mono-mark">How loud?</div>
                                <MultiSwitch
                                    className="bt-multiswitch"
                                    list={SIZE_OPTIONS}
                                    value={scale}
                                    onValueChange={setScale}
                                    aria-label="Set the volume of the work"
                                />
                            </div>

                            <div className="bt-budget">
                                <div className="bt-mono-mark">Indicative budget</div>
                                <Text as="p" className="bt-budget__help">
                                    Drag across for the figure, up for how firm it is. It only helps us scope — nothing&apos;s
                                    binding.
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
                                    height={170}
                                    prefix="€"
                                    suffix="k"
                                    color="var(--bt-accent)"
                                />
                                <div className="bt-budget__read">
                                    Scoping at{" "}
                                    <ReasonTag
                                        value={`€${budget}k`}
                                        reason="Indicative only — the proposal sets the fixed fee after the brief. Drawn from your budget pad and the project type."
                                        confidence={budgetConfidence}
                                        by="Studio"
                                        theme="underline"
                                    />{" "}
                                    · {Math.round(budgetConfidence * 100)}% confident
                                </div>
                            </div>
                        </div>

                        <div className="bt-contact__right">
                            <Card className="bt-briefcard" variant="outlined" padding="none">
                                <Card.Header className="bt-briefcard__head">
                                    <span className="bt-briefcard__title">New brief</span>
                                    <Tooltip content="We read every brief — no bots.">
                                        <Badge className="bt-briefcard__status" color="lime" variant="soft" size="sm" dot>
                                            Open for Q3
                                        </Badge>
                                    </Tooltip>
                                </Card.Header>
                                <Card.Body className="bt-briefcard__body">
                                    {submitted ? (
                                        <div className="bt-briefcard__sent">
                                            <Badge color="lime" variant="soft" size="md">
                                                RECEIVED
                                            </Badge>
                                            <p>Thanks — your brief is in. We&apos;ll reply within two working days.</p>
                                            <Button
                                                className="bt-btn bt-btn--link"
                                                variant="ghost"
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
                                            <Composer
                                                className="bt-composer"
                                                value={brief}
                                                onChange={setBrief}
                                                onSubmit={() => setBrief((b) => b)}
                                                placeholder="What's the headline — and when does it ship?"
                                            />
                                            <div className="bt-briefcard__row">
                                                <Text as="span" className="bt-briefcard__count">
                                                    {brief.trim().length} chars
                                                </Text>
                                                <Progress
                                                    className="bt-progress"
                                                    value={Math.min(brief.trim().length, 160)}
                                                    max={160}
                                                    variant="bar"
                                                    size="sm"
                                                    color="lime"
                                                />
                                            </div>
                                        </>
                                    )}
                                </Card.Body>
                                {!submitted && (
                                    <Card.Footer className="bt-briefcard__foot">
                                        <Text as="span" className="bt-briefcard__note">
                                            No NDA needed to say hello.
                                        </Text>
                                        <Button
                                            className="bt-btn bt-btn--ink"
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

                {/* ── Footer — giant wordmark sign-off ───────────────────────── */}
                <footer className="bt-footer">
                    <div className="bt-footer__word" aria-hidden>
                        FIELDWORK
                    </div>
                    <div className="bt-footer__row">
                        <p className="bt-footer__about">
                            A type-first design studio. Zürich &amp; Lisbon. Brand, type, editorial, and kinetic work
                            since 2016.
                        </p>
                        <div className="bt-footer__links">
                            <a href="#work">WORK</a>
                            <a href="https://fieldwork.example" target="_blank" rel="noopener noreferrer">
                                INSTAGRAM
                            </a>
                            <a href="#contact">CONTACT</a>
                            <a href="https://fieldwork.example" target="_blank" rel="noopener noreferrer">
                                LINKEDIN
                            </a>
                        </div>
                    </div>
                    <Separator className="bt-sep bt-sep--foot" />
                    <div className="bt-footer__base">
                        <span className="bt-mono">
                            FIELDWORK — a fictional studio, for demonstration · Style {style.num} / Big Type
                        </span>
                        <Link href="/inspiration" className="bt-back">
                            <ArrowLeft size={14} />
                            Back to the gallery
                        </Link>
                    </div>
                </footer>
            </div>
        </div>
    );
}
