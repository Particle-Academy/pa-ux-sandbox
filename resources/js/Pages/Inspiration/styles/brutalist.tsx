import "./brutalist.css";
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
    FauxClient,
    Heading,
    Pagination,
    Pillbox,
    Progress,
    Separator,
    Table,
    Tabs,
    Text,
    Timeline,
} from "@particle-academy/react-fancy";
import type { Style } from "../types";

/**
 * Inspiration Gallery · Style — Brutalist (raw web brutalism, light mode).
 *
 * FIELDWORK rendered as a raw HTML brutalist document: the system font stack
 * everywhere (no display face), heavy 3px ink borders, zero radius, zero
 * shadow, exposed structure. The page reads like a hand-authored skeleton —
 * boxes inside boxes, hairline-thick rules, ALL-CAPS monospace labels, raw
 * underlined links, and a hard "offset block" hover (a solid ink rectangle
 * snaps behind the element instead of a soft shadow). The Fancy kit is forced
 * to WEAR the idiom: Button → blunt ink slab with a hard offset, Badge →
 * bracketed mono tag, Card → bordered specimen box with a labelled header bar,
 * Table → ruled ledger with a double top rule, Tabs → boxed tab row, Accordion
 * → numbered disclosure, Avatar → square ink chip, Composer/Pillbox → raw
 * bordered fields, Callout → a notice slab.
 *
 * Mounted by Inspiration/Show.tsx for `style.id === "brutalist"`. Content only —
 * the Layout + demo frame + disclaimer + prev/next are added by Show.tsx.
 * SSR-safe: no module-level browser APIs; every interactive bit is controlled
 * React state. Inner links use the stretched-link pattern (one <Link> per row)
 * so no anchor is ever nested inside another anchor (avoids React #418 in SSR).
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
    { num: "01", title: "CONCRETE INDEX", discipline: "Brand system · type", year: "2025", client: "Bauhaus Salvage Co.", award: "D&AD Wood Pencil" },
    { num: "02", title: "PRINTOUT", discipline: "Editorial · risograph", year: "2025", client: "Margins Press" },
    { num: "03", title: "RAW FEED", discipline: "Product UI · no-chrome", year: "2024", client: "Plaintext Labs", award: "Awwwards Honorable" },
    { num: "04", title: "LOAD-BEARING", discipline: "Identity · signage", year: "2024", client: "Rebar Architects" },
    { num: "05", title: "VIEW SOURCE", discipline: "Web · system design", year: "2024", client: "Static Mfg." },
    { num: "06", title: "OFF-GRID", discipline: "Brand · packaging", year: "2023", client: "Greyfield Goods" },
];

const SERVICES = [
    { no: "01", title: "BRAND SYSTEMS", body: "Identity, naming, voice — built as rules, not decoration. The logo is the smallest part. The system is the work." },
    { no: "02", title: "EDITORIAL / TYPE", body: "Magazines, reports, bespoke faces. Long-form work where the grid is the structure, exposed and load-bearing." },
    { no: "03", title: "PRODUCT / WEB", body: "Interface design and design systems. Components stripped to bones, then shipped. No skeuomorphic padding." },
    { no: "04", title: "SIGNAGE / MOTION", body: "Wayfinding, environmental graphics, title work. Type and space at architectural scale, in motion or at rest." },
];

const TEAM = [
    { name: "ANJA VESTER", role: "FOUNDER / DIRECTOR", initials: "AV" },
    { name: "TOMAS PELL", role: "TYPE / EDITORIAL", initials: "TP" },
    { name: "RHEA OKONKWO", role: "PRODUCT / SYSTEMS", initials: "RO" },
    { name: "LIANG MORI", role: "SIGNAGE / MOTION", initials: "LM" },
];

const CLIENTS = ["BAUHAUS SALVAGE", "MARGINS PRESS", "PLAINTEXT LABS", "REBAR ARCHITECTS", "STATIC MFG.", "GREYFIELD GOODS", "NORTHWIND", "STUDIO FØN"];

const FAQ = [
    { q: "HOW DO YOU SCOPE A PROJECT?", a: "Every engagement opens with a short discovery: goals, audience, constraints, and a fixed-fee proposal. No open-ended retainers unless you want one." },
    { q: "WHAT'S A TYPICAL TIMELINE?", a: "Brand systems run six to ten weeks; editorial and product work vary with scope. We commit to dates in the proposal and hold them." },
    { q: "DO YOU WORK WITH IN-HOUSE TEAMS?", a: "Often. We lead, embed, or hand off a documented system your team runs with — whatever leaves you the most independent." },
    { q: "WHERE ARE YOU BASED?", a: "Detroit and Leipzig, working across North American and European time zones. Mostly remote, with focused on-site build weeks." },
];

const FIGURES = [
    { num: "2016", label: "FOUNDED" },
    { num: "120+", label: "SHIPPED" },
    { num: "08", label: "PEOPLE" },
    { num: "14", label: "AWARDS" },
];

const PER_PAGE = 4;

export default function Brutalist({ style }: { style: Style }) {
    const [page, setPage] = useState(1);
    const [tags, setTags] = useState<string[]>(["BRAND SYSTEM", "EDITORIAL"]);
    const [brief, setBrief] = useState("");
    const [submitted, setSubmitted] = useState(false);

    const totalPages = Math.ceil(PROJECTS.length / PER_PAGE);
    const pageProjects = PROJECTS.slice((page - 1) * PER_PAGE, page * PER_PAGE);

    return (
        <div className="insp-brutalist">
            <div className="bru-shell">
                {/* ── Running head: breadcrumbs + studio mark ───────────────── */}
                <div className="bru-runhead">
                    <Breadcrumbs className="bru-crumbs">
                        <Breadcrumbs.Item href="/inspiration">INSPIRATION</Breadcrumbs.Item>
                        <Breadcrumbs.Item active>BRUTALIST</Breadcrumbs.Item>
                    </Breadcrumbs>
                    <div className="bru-mark">
                        <span className="bru-mark__sq" aria-hidden>
                            F
                        </span>
                        <span className="bru-mark__name">FIELDWORK</span>
                        <Badge color="zinc" variant="outline" size="sm" className="bru-chip">
                            EST. 2016
                        </Badge>
                    </div>
                </div>
                <div className="bru-rule bru-rule--ink" />

                {/* ── Hero ──────────────────────────────────────────────────── */}
                <section className="bru-section bru-section--first" aria-labelledby="bru-hero">
                    <div className="bru-eyebrow">
                        <span className="bru-eyebrow__no">00</span>
                        <span>INDEX</span>
                        <span className="bru-eyebrow__sep">/</span>
                        <span>DESIGN &amp; DEV STUDIO</span>
                    </div>
                    <div className="bru-hero">
                        <div className="bru-hero__main">
                            <h1 id="bru-hero" className="bru-display">
                                A STUDIO FOR SYSTEMS, TYPE, AND THE STRUCTURE UNDERNEATH.
                            </h1>
                            <p className="bru-lede">
                                FIELDWORK is a small studio working at the intersection of brand, editorial, and
                                product. We build systems that stay legible as they scale — and we leave the
                                structure exposed.
                            </p>
                            <div className="bru-hero__cta">
                                <Button color="zinc" href="#contact" className="bru-btn bru-btn--ink">
                                    BRIEF THE STUDIO →
                                </Button>
                                <Button variant="ghost" href="#work" className="bru-btn bru-btn--ghost">
                                    SELECTED WORK ↓
                                </Button>
                            </div>
                        </div>
                        <aside className="bru-hero__meta" aria-label="Studio facts">
                            <div className="bru-spec">
                                <span className="bru-spec__k">LOCATION</span>
                                <span className="bru-spec__v">DETROIT — LEIPZIG</span>
                            </div>
                            <div className="bru-spec">
                                <span className="bru-spec__k">COORDS</span>
                                <span className="bru-spec__v">42.33° N · 51.34° N</span>
                            </div>
                            <div className="bru-spec">
                                <span className="bru-spec__k">STATUS</span>
                                <span className="bru-spec__v">OPEN — Q3 2026</span>
                            </div>
                            <div className="bru-spec">
                                <span className="bru-spec__k">SCOPE</span>
                                <span className="bru-spec__v">
                                    BRAND / EDITORIAL
                                    <br />
                                    PRODUCT / SIGNAGE
                                </span>
                            </div>
                        </aside>
                    </div>
                </section>

                {/* ── Figures band ──────────────────────────────────────────── */}
                <section className="bru-section" aria-label="Studio in numbers">
                    <div className="bru-figures">
                        {FIGURES.map((f) => (
                            <div key={f.label} className="bru-figure">
                                <div className="bru-figure__num">{f.num}</div>
                                <div className="bru-figure__label">{f.label}</div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* ── Selected work — typographic ledger ────────────────────── */}
                <section className="bru-section" id="work" aria-labelledby="bru-work">
                    <div className="bru-section__head">
                        <div>
                            <div className="bru-eyebrow">
                                <span className="bru-eyebrow__no">01</span>
                                <span>SELECTED WORK</span>
                            </div>
                            <Heading as="h2" size="2xl" weight="bold" className="bru-h2">
                                SIX RECENT PROJECTS.
                            </Heading>
                        </div>
                        <div className="bru-filter">
                            <span className="bru-filter__k">FILTER</span>
                            <Pillbox
                                value={tags}
                                onChange={setTags}
                                placeholder="ADD DISCIPLINE…"
                                className="bru-tags"
                                aria-label="Filter work by discipline"
                            />
                        </div>
                    </div>

                    <div className="bru-index">
                        <div className="bru-index__head" aria-hidden>
                            <span>NO.</span>
                            <span>PROJECT</span>
                            <span>DISCIPLINE</span>
                            <span>YEAR</span>
                        </div>
                        {pageProjects.map((p) => (
                            <div key={p.num} className="bru-index__row">
                                <Link
                                    href="/inspiration/brutalist#work"
                                    className="bru-index__stretch"
                                    aria-label={`${p.title} — ${p.discipline}`}
                                />
                                <span className="bru-index__num">{p.num}</span>
                                <span className="bru-index__title">{p.title}</span>
                                <span className="bru-index__disc">{p.discipline}</span>
                                <span className="bru-index__year">
                                    {p.year} <span className="bru-index__arrow">↗</span>
                                </span>
                            </div>
                        ))}
                    </div>

                    <div className="bru-index__foot">
                        <span className="bru-meta">
                            SHOWING {(page - 1) * PER_PAGE + 1}–{Math.min(page * PER_PAGE, PROJECTS.length)} / {PROJECTS.length}
                        </span>
                        <Pagination page={page} totalPages={totalPages} onPageChange={setPage} className="bru-pagination" />
                    </div>

                    {/* Specimen — a featured build inside raw browser chrome */}
                    <div className="bru-specimen">
                        <FauxClient
                            variant="browser"
                            url="raw-feed.plaintext.example"
                            meta="03 — RAW FEED"
                            dots={false}
                            className="bru-faux"
                            barClassName="bru-faux__bar"
                            bodyClassName="bru-faux__body"
                        >
                            <div className="bru-screen">
                                <div className="bru-screen__head">
                                    <span className="bru-screen__title">PLAINTEXT LABS — FEED</span>
                                    <span className="bru-screen__tag">[ LIVE ]</span>
                                </div>
                                <div className="bru-screen__rows">
                                    {["DEPLOY 1284 — main@9f2a", "INGEST 12,043 records", "PARSE 0 errors / 3 warnings", "RENDER 18ms p95"].map((r, i) => (
                                        <div key={i} className="bru-screen__row">
                                            <span className="bru-screen__dot" aria-hidden />
                                            {r}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </FauxClient>
                        <p className="bru-specimen__cap">FIG. 03 — A NO-CHROME PRODUCT SURFACE FOR PLAINTEXT LABS. SYSTEM FONT, EXPOSED DATA, ZERO ORNAMENT.</p>
                    </div>
                </section>

                {/* ── Capabilities (tabbed) ─────────────────────────────────── */}
                <section className="bru-section" aria-labelledby="bru-cap">
                    <div className="bru-eyebrow">
                        <span className="bru-eyebrow__no">02</span>
                        <span>CAPABILITIES</span>
                    </div>
                    <Heading as="h2" size="2xl" weight="bold" className="bru-h2 bru-h2--gap">
                        WHAT WE DO, AND HOW WE WORK.
                    </Heading>

                    <Tabs defaultTab="services" variant="underline" className="bru-tabs">
                        <Tabs.List className="bru-tabs__list">
                            <Tabs.Tab value="services">SERVICES</Tabs.Tab>
                            <Tabs.Tab value="process">PROCESS</Tabs.Tab>
                            <Tabs.Tab value="faq">QUESTIONS</Tabs.Tab>
                        </Tabs.List>
                        <Tabs.Panels>
                            <Tabs.Panel value="services">
                                <div className="bru-caps">
                                    {SERVICES.map((s) => (
                                        <div key={s.no} className="bru-cap">
                                            <span className="bru-cap__no">{s.no}</span>
                                            <h3 className="bru-cap__title">{s.title}</h3>
                                            <p className="bru-cap__body">{s.body}</p>
                                        </div>
                                    ))}
                                </div>
                            </Tabs.Panel>

                            <Tabs.Panel value="process">
                                <div className="bru-process">
                                    <Timeline
                                        className="bru-timeline"
                                        events={[
                                            { date: "WEEK 0", title: "DISCOVERY", description: "Goals, audience, constraints. A fixed-fee proposal with dates we hold.", color: "zinc" },
                                            { date: "WEEKS 1–3", title: "DIRECTION", description: "Two or three routes, explored to the point where a decision is real, not abstract.", color: "zinc" },
                                            { date: "WEEKS 4–8", title: "SYSTEM", description: "The chosen direction built into a documented, reusable system — structure left exposed.", color: "zinc" },
                                            { date: "HANDOFF", title: "HANDOFF", description: "Source files, guidelines, and a working session so your team owns it outright.", color: "zinc" },
                                        ]}
                                    />
                                </div>
                            </Tabs.Panel>

                            <Tabs.Panel value="faq">
                                <div className="bru-faq">
                                    <Accordion type="single" defaultOpen={["q0"]} className="bru-accordion">
                                        {FAQ.map((item, i) => (
                                            <Accordion.Item key={i} value={`q${i}`}>
                                                <Accordion.Trigger>
                                                    <span className="bru-faq__no">{String(i + 1).padStart(2, "0")}</span>
                                                    {item.q}
                                                </Accordion.Trigger>
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
                <section className="bru-section" aria-labelledby="bru-about">
                    <div className="bru-about">
                        <div className="bru-about__label">
                            <div className="bru-eyebrow">
                                <span className="bru-eyebrow__no">03</span>
                                <span>ABOUT</span>
                            </div>
                        </div>
                        <div className="bru-about__body">
                            <p className="bru-about__lead">
                                THE BEST DESIGN IS MOSTLY STRUCTURE — A GRID THAT HOLDS, TYPE THAT READS BEFORE YOU
                                REGISTER IT, AND NOTHING GLUED ON TO HIDE THE JOINS.
                            </p>
                            <Text as="p" size="md" className="bru-about__text">
                                FIELDWORK began in 2016 as two people and a shared dislike of decoration for its own
                                sake. We have grown carefully since — eight people now, still small enough that the
                                people you meet are the people who do the work. We take a handful of projects at a
                                time and give each our full attention.
                            </Text>
                            <Callout color="zinc" className="bru-callout">
                                NO PAGEANTRY. NO DARK PATTERNS. NO ROUNDED CORNERS WE DID NOT EARN. EVERY SURFACE WE
                                SHIP COULD BE READ FROM ITS VIEW-SOURCE.
                            </Callout>
                        </div>
                    </div>
                </section>

                {/* ── Team ──────────────────────────────────────────────────── */}
                <section className="bru-section" aria-labelledby="bru-team">
                    <div className="bru-eyebrow">
                        <span className="bru-eyebrow__no">04</span>
                        <span>PEOPLE</span>
                    </div>
                    <Heading as="h2" size="2xl" weight="bold" className="bru-h2 bru-h2--gap">
                        THE STUDIO.
                    </Heading>
                    <div className="bru-people">
                        {TEAM.map((m) => (
                            <div key={m.name} className="bru-person">
                                <Avatar fallback={m.initials} size="lg" className="bru-avatar" />
                                <div className="bru-person__name">{m.name}</div>
                                <div className="bru-person__role">{m.role}</div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* ── Recognition + clients ─────────────────────────────────── */}
                <section className="bru-section" aria-labelledby="bru-recognition">
                    <div className="bru-recognition">
                        <div className="bru-recognition__main">
                            <div className="bru-eyebrow">
                                <span className="bru-eyebrow__no">05</span>
                                <span>RECOGNITION</span>
                            </div>
                            <Heading as="h3" size="lg" weight="bold" className="bru-recognition__title">
                                SELECTED AWARDS
                            </Heading>
                            <Table className="bru-table">
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
                                        <Table.Cell>Type Directors Club — Certificate of Excellence</Table.Cell>
                                    </Table.Row>
                                </Table.Body>
                            </Table>
                        </div>

                        <aside className="bru-recognition__side">
                            <div className="bru-eyebrow">
                                <span>SELECTED CLIENTS</span>
                            </div>
                            <div className="bru-clients">
                                {CLIENTS.map((c) => (
                                    <Badge key={c} color="zinc" variant="outline" size="md" className="bru-tag">
                                        {c}
                                    </Badge>
                                ))}
                            </div>
                            <Separator className="bru-sep" />
                            <div className="bru-eyebrow">
                                <span>PRESS</span>
                            </div>
                            <ul className="bru-press">
                                <li className="bru-press__lead">IT&apos;S NICE THAT — STUDIO OF THE WEEK</li>
                                <li>EYE MAGAZINE №112</li>
                                <li>SLANTED — TYPE IN THE WILD</li>
                            </ul>
                        </aside>
                    </div>
                </section>

                {/* ── Brief / contact CTA ───────────────────────────────────── */}
                <section className="bru-section" id="contact" aria-labelledby="bru-contact">
                    <div className="bru-contact">
                        <div className="bru-contact__intro">
                            <div className="bru-eyebrow">
                                <span className="bru-eyebrow__no">06</span>
                                <span>CONTACT</span>
                            </div>
                            <Heading as="h2" size="2xl" weight="bold" className="bru-h2">
                                TELL US ABOUT THE WORK.
                            </Heading>
                            <p className="bru-lede bru-lede--sm">
                                A few sentences is plenty to start. We reply to every brief within two working days.
                            </p>
                            <div className="bru-contact__addr">
                                <span className="bru-addr bru-addr--ink">STUDIO@FIELDWORK.EXAMPLE</span>
                                <span className="bru-addr">+1 313 000 0000</span>
                            </div>
                            <div className="bru-contact__terms">
                                {[
                                    ["FIXED-FEE", "NO OPEN RETAINERS"],
                                    ["6–10 WKS", "TYPICAL BRAND BUILD"],
                                    ["2 DAYS", "REPLY TO EVERY BRIEF"],
                                ].map(([k, v]) => (
                                    <div key={k} className="bru-term">
                                        <span className="bru-term__k">{k}</span>
                                        <span className="bru-term__v">{v}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="bru-contact__form">
                            <Card variant="outlined" padding="none" className="bru-brief">
                                <Card.Header className="bru-brief__head">
                                    <span className="bru-brief__title">NEW BRIEF</span>
                                    <Badge color="zinc" variant="outline" size="sm" dot className="bru-brief__status">
                                        OPEN FOR Q3
                                    </Badge>
                                </Card.Header>
                                <Card.Body className="bru-brief__body">
                                    {submitted ? (
                                        <div className="bru-brief__sent">
                                            <Badge color="zinc" variant="solid" size="md" className="bru-tag bru-tag--solid">
                                                RECEIVED
                                            </Badge>
                                            <p>Thanks — your brief is in. We&apos;ll reply within two working days.</p>
                                            <Button
                                                variant="ghost"
                                                color="zinc"
                                                className="bru-btn bru-btn--ghost"
                                                onClick={() => {
                                                    setSubmitted(false);
                                                    setBrief("");
                                                }}
                                            >
                                                ← WRITE ANOTHER
                                            </Button>
                                        </div>
                                    ) : (
                                        <>
                                            <Composer
                                                value={brief}
                                                onChange={setBrief}
                                                onSubmit={() => setBrief((b) => b)}
                                                placeholder="WHAT ARE YOU BUILDING, AND WHAT'S THE DEADLINE?"
                                                className="bru-composer"
                                            />
                                            <div className="bru-brief__foot">
                                                <span className="bru-brief__count">{brief.trim().length} CHARS</span>
                                                <Progress
                                                    value={Math.min(brief.trim().length, 160)}
                                                    max={160}
                                                    variant="bar"
                                                    size="sm"
                                                    color="zinc"
                                                    className="bru-progress"
                                                />
                                            </div>
                                        </>
                                    )}
                                </Card.Body>
                                {!submitted && (
                                    <Card.Footer className="bru-brief__footer">
                                        <span className="bru-brief__note">NO NDA NEEDED TO SAY HELLO.</span>
                                        <Button
                                            color="zinc"
                                            disabled={brief.trim().length < 12}
                                            className="bru-btn bru-btn--ink"
                                            onClick={() => setSubmitted(true)}
                                        >
                                            SEND BRIEF →
                                        </Button>
                                    </Card.Footer>
                                )}
                            </Card>
                        </div>
                    </div>
                </section>

                {/* ── Footer ────────────────────────────────────────────────── */}
                <footer className="bru-footer">
                    <div className="bru-rule bru-rule--ink" />
                    <div className="bru-footer__top">
                        <div>
                            <div className="bru-mark">
                                <span className="bru-mark__sq" aria-hidden>
                                    F
                                </span>
                                <span className="bru-mark__name">FIELDWORK</span>
                            </div>
                            <p className="bru-footer__blurb">
                                A DESIGN &amp; DEV STUDIO. DETROIT AND LEIPZIG. WORKING IN BRAND, EDITORIAL, PRODUCT,
                                AND SIGNAGE SINCE 2016.
                            </p>
                        </div>
                        <nav className="bru-footer__links" aria-label="Footer">
                            <a href="#work">WORK ↗</a>
                            <a href="https://fieldwork.example" target="_blank" rel="noopener noreferrer">
                                INSTAGRAM ↗
                            </a>
                            <a href="#contact">CONTACT ↗</a>
                            <a href="https://fieldwork.example" target="_blank" rel="noopener noreferrer">
                                LINKEDIN ↗
                            </a>
                        </nav>
                    </div>

                    <div className="bru-footer__foot">
                        <span className="bru-meta">FIELDWORK — A FICTIONAL STUDIO, FOR DEMONSTRATION · STYLE {style.num} / BRUTALIST</span>
                        <Link href="/inspiration" className="bru-back">
                            ← BACK TO THE GALLERY
                        </Link>
                    </div>
                </footer>
            </div>
        </div>
    );
}
