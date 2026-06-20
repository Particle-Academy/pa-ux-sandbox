import "./retro.css";

import { Link } from "@inertiajs/react";
import { useEffect, useState } from "react";
import {
    Accordion,
    Avatar,
    Badge,
    Button,
    Card,
    Composer,
    FauxClient,
    Heading,
    Pillbox,
    Progress,
    Separator,
    StickyNote,
    Table,
    Tabs,
    Text,
    Tooltip,
} from "@particle-academy/react-fancy";
import type { Style } from "../types";

/**
 * Inspiration Gallery · Style — Retro Web (id "retro", light mode).
 *
 * FIELDWORK (a fictional design/dev studio) rendered as web-1.0 / desktop-OS
 * nostalgia: a tiled "wallpaper" desktop strewn with draggable-looking OS
 * windows (title bars, beveled borders, traffic dots), a marquee status line,
 * a hit counter, an animated "Under Construction" banner, a guestbook, a
 * "webring", and pixel/MS-Sans typography. Every Fancy primitive is restyled
 * HARD to WEAR the idiom — Card → beveled OS window pane, Button → 3D outset
 * chrome button, Badge → notched "88x31" web button, Tabs → folder tabs,
 * Table → beveled spec sheet, Accordion → collapsible "My Documents" tree,
 * Avatar → square pixel portrait, Progress → segmented loading bar, Composer
 * → guestbook sign-in box. FauxClient supplies the literal OS-window chrome.
 *
 * Mounted by Inspiration/Show.tsx for `style.id === "retro"`. Content only —
 * the shared Layout, gallery demo-frame, disclaimer, "N / 20" and prev/next
 * come from Show.tsx. SSR-safe: no module-level browser APIs; the hit-counter
 * tick and clock live in useEffect. Inner links use the stretched-link pattern
 * (one <Link> per row) so no anchor is ever nested inside another anchor.
 */

type Project = {
    num: string;
    title: string;
    discipline: string;
    year: string;
    client: string;
    icon: string;
    award?: string;
};

const PROJECTS: Project[] = [
    { num: "01", title: "Meridian.exe", discipline: "Brand system · type design", year: "2025", client: "Meridian Cartography", icon: "🗺️", award: "Best of the Web ’25" },
    { num: "02", title: "Low Tide", discipline: "Editorial · art direction", year: "2025", client: "Saltworks Press", icon: "📰" },
    { num: "03", title: "Quanta", discipline: "Product UI · motion", year: "2024", client: "Quanta Labs", icon: "🧪", award: "Cool Site of the Day" },
    { num: "04", title: "Field Notes", discipline: "Identity · signage", year: "2024", client: "Atlas Botanic", icon: "🌿" },
    { num: "05", title: "Ostro", discipline: "Web · design system", year: "2024", client: "Ostro Maritime", icon: "⚓" },
    { num: "06", title: "Paper Radio", discipline: "Brand · packaging", year: "2023", client: "Paper Radio Co.", icon: "📻" },
];

const SERVICES = [
    { no: "01", icon: "🎨", title: "Brand systems", body: "Identity, naming, voice — delivered as a system, not a logo. Guaranteed to look good in 256 colors." },
    { no: "02", icon: "📐", title: "Editorial & type", body: "Magazines, reports, and bespoke typefaces. Long-form work where the grid does the heavy lifting." },
    { no: "03", icon: "🖥️", title: "Product & web", body: "Interface design and design systems for software teams — research, prototypes, production code." },
    { no: "04", icon: "✨", title: "Motion & signage", body: "Title sequences, environmental graphics, and wayfinding. Type and space, in motion or at scale." },
];

const TEAM = [
    { name: "Anja Vester", role: "Founder · design director", initials: "AV", color: "#7c5cff" },
    { name: "Tomas Pell", role: "Type & editorial", initials: "TP", color: "#00a884" },
    { name: "Rhea Okonkwo", role: "Product & systems", initials: "RO", color: "#e0457b" },
    { name: "Liang Mori", role: "Motion & 3D", initials: "LM", color: "#0b75c9" },
];

const CLIENTS = ["Meridian", "Saltworks", "Quanta Labs", "Atlas Botanic", "Ostro", "Paper Radio", "Northwind", "Studio Føn"];

const SPECS: { year: string; project: string; award: string }[] = [
    { year: "2025", project: "Meridian.exe", award: "Best of the Web — Webby honoree" },
    { year: "2024", project: "Quanta", award: "Cool Site of the Day (×3)" },
    { year: "2023", project: "Studio", award: "Type Directors Club — Certificate" },
    { year: "2022", project: "Paper Radio", award: "FWA Site of the Day" },
];

const FAQ = [
    { q: "📁  How do you scope a project?", a: "Every engagement opens with a short discovery: goals, audience, constraints, and a fixed-fee proposal. No open-ended retainers unless you ask for one." },
    { q: "📁  What's a typical timeline?", a: "Brand systems run six to ten weeks; editorial and product work vary with scope. We commit to dates in the proposal and hold them." },
    { q: "📁  Do you work with in-house teams?", a: "Often. We can lead, embed, or hand off a documented system your team runs with — whatever leaves you the most independent." },
    { q: "📁  Where are you based?", a: "Zürich and Lisbon, working across European and North American time zones. Most work happens remotely with focused on-site weeks." },
];

const GUESTS = [
    { name: "webmaster_jo", at: "06/14/2026", note: "ur site rules!! signed the book :)", flag: "🇳🇱" },
    { name: "pixelpusher88", at: "06/11/2026", note: "saw u on the webring. clean work, no JS bloat. respect.", flag: "🇨🇦" },
    { name: "atlas_botanic", at: "06/02/2026", note: "the signage system is still holding up 2 years later. thank u.", flag: "🇬🇧" },
];

export default function Retro({ style }: { style: Style }) {
    const [tags, setTags] = useState<string[]>(["brand systems", "editorial"]);
    const [activeProject, setActiveProject] = useState<string>(PROJECTS[0].num);
    const [guestName, setGuestName] = useState("");
    const [guestNote, setGuestNote] = useState("");
    const [signed, setSigned] = useState(false);
    const [hits, setHits] = useState(13379);
    const [clock, setClock] = useState("--:--:-- ");

    // Browser-only: tick a faux hit counter + a desk-clock so the page reads
    // "live" without any module-level window access (SSR-safe).
    useEffect(() => {
        setHits((h) => h + Math.floor(Math.random() * 4) + 1);
        const fmt = () => {
            const d = new Date();
            const p = (n: number) => String(n).padStart(2, "0");
            return `${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())} `;
        };
        setClock(fmt());
        const id = window.setInterval(() => setClock(fmt()), 1000);
        return () => window.clearInterval(id);
    }, []);

    const hitDigits = String(hits).padStart(7, "0").split("");
    const current = PROJECTS.find((p) => p.num === activeProject) ?? PROJECTS[0];

    return (
        <div className="insp-retro">
            <div className="rt-desktop">
                {/* ── Marquee status strip — the OS "ticker" ─────────────────── */}
                <div className="rt-marquee" role="presentation">
                    <div className="rt-marquee__track">
                        <span>★ WELCOME TO FIELDWORK.STUDIO ★ BEST VIEWED AT 1024×768 ★ EST. 2016 ★ NOW SERVING BRAND, EDITORIAL, PRODUCT &amp; MOTION ★ SIGN OUR GUESTBOOK ↓ ★ NO COOKIES, NO TRACKERS, JUST PIXELS ★ </span>
                        <span aria-hidden>★ WELCOME TO FIELDWORK.STUDIO ★ BEST VIEWED AT 1024×768 ★ EST. 2016 ★ NOW SERVING BRAND, EDITORIAL, PRODUCT &amp; MOTION ★ SIGN OUR GUESTBOOK ↓ ★ NO COOKIES, NO TRACKERS, JUST PIXELS ★ </span>
                    </div>
                </div>

                <div className="rt-shell">
                    {/* ── HERO — the main OS window ──────────────────────────── */}
                    <section className="rt-section" aria-labelledby="rt-hero">
                        <FauxClient
                            variant="browser"
                            url="http://www.fieldwork.studio/index.html"
                            meta="100% ▮ 56k"
                            dots
                            className="rt-window rt-window--hero"
                            barClassName="rt-window__bar"
                            bodyClassName="rt-window__body"
                        >
                            <div className="rt-hero">
                                <div className="rt-hero__main">
                                    <div className="rt-eyebrow">★ a design &amp; dev studio · since 2016 ★</div>
                                    <h1 id="rt-hero" className="rt-display">
                                        FIELD<span className="rt-display__blink">_</span>WORK
                                    </h1>
                                    <p className="rt-tagline">
                                        Systems, type, and the spaces between — built to load fast and last long.
                                        Welcome to our corner of the web.
                                    </p>
                                    <p className="rt-lede">
                                        A small studio at the intersection of brand, editorial, and product.
                                        We build design systems that stay legible as they scale — and we
                                        still hand-code the footer.
                                    </p>
                                    <div className="rt-btnrow">
                                        <Button className="rt-btn rt-btn--go" href="#contact">
                                            ► Brief the studio
                                        </Button>
                                        <Button variant="ghost" className="rt-btn" href="#work">
                                            Selected work
                                        </Button>
                                    </div>

                                    {/* Animated "Under Construction" gag — pure CSS */}
                                    <div className="rt-construction" role="presentation">
                                        <span className="rt-construction__sign">🚧</span>
                                        <span className="rt-construction__bar" />
                                        <span className="rt-construction__txt">SITE PERPETUALLY UNDER CONSTRUCTION</span>
                                        <span className="rt-construction__bar" />
                                        <span className="rt-construction__sign">🚧</span>
                                    </div>
                                </div>

                                <aside className="rt-hero__side" aria-label="Studio details">
                                    <div className="rt-panel">
                                        <div className="rt-panel__title">📌 fieldwork.txt</div>
                                        <div className="rt-panel__body">
                                            <dl className="rt-deflist">
                                                <dt>LOCATION</dt>
                                                <dd>Zürich · Lisbon</dd>
                                                <dt>STATUS</dt>
                                                <dd><span className="rt-online" /> Open for Q3 ’26</dd>
                                                <dt>UPTIME</dt>
                                                <dd>since 2016</dd>
                                                <dt>STACK</dt>
                                                <dd>html · css · grit</dd>
                                            </dl>
                                        </div>
                                    </div>

                                    {/* Hit counter — the canonical web-1.0 widget */}
                                    <div className="rt-counter">
                                        <div className="rt-counter__label">You are visitor</div>
                                        <div className="rt-counter__digits" aria-label={`${hits} visitors`}>
                                            {hitDigits.map((d, i) => (
                                                <span key={i} className="rt-counter__digit">{d}</span>
                                            ))}
                                        </div>
                                        <div className="rt-counter__since">since 04/16/2016</div>
                                    </div>

                                    <div className="rt-clock" aria-label="Local time">
                                        <span className="rt-clock__face">{clock}</span>
                                    </div>
                                </aside>
                            </div>
                        </FauxClient>
                    </section>

                    {/* ── STAT TILES — desktop icons ─────────────────────────── */}
                    <section className="rt-section" aria-label="Studio in numbers">
                        <div className="rt-stats">
                            {[
                                { num: "2016", label: "Founded", icon: "🏠" },
                                { num: "120+", label: "Projects shipped", icon: "💾" },
                                { num: "08", label: "People online", icon: "👥" },
                                { num: "14", label: "Awards won", icon: "🏆" },
                            ].map((s) => (
                                <div key={s.label} className="rt-stat">
                                    <span className="rt-stat__icon" aria-hidden>{s.icon}</span>
                                    <span className="rt-stat__num">{s.num}</span>
                                    <span className="rt-stat__label">{s.label}</span>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* ── SELECTED WORK — "My Projects" file window ──────────── */}
                    <section className="rt-section" id="work" aria-labelledby="rt-work">
                        <FauxClient
                            variant="browser"
                            url="C:\\FIELDWORK\\My Projects\\"
                            meta="6 items"
                            dots
                            className="rt-window"
                            barClassName="rt-window__bar"
                            bodyClassName="rt-window__body"
                        >
                            <div className="rt-sectionhead">
                                <Heading as="h2" className="rt-h2" id="rt-work">
                                    📂 Selected Work
                                </Heading>
                                <Pillbox
                                    value={tags}
                                    onChange={setTags}
                                    placeholder="filter…"
                                    className="rt-pillbox"
                                    aria-label="Filter work by discipline"
                                />
                            </div>

                            <div className="rt-explorer">
                                {/* Left: file list */}
                                <ul className="rt-filelist" role="list">
                                    {PROJECTS.map((p) => (
                                        <li
                                            key={p.num}
                                            className={`rt-file ${p.num === activeProject ? "is-active" : ""}`}
                                        >
                                            <button
                                                type="button"
                                                className="rt-file__btn"
                                                onClick={() => setActiveProject(p.num)}
                                                aria-pressed={p.num === activeProject}
                                            >
                                                <span className="rt-file__icon" aria-hidden>{p.icon}</span>
                                                <span className="rt-file__name">{p.title}</span>
                                                <span className="rt-file__year">{p.year}</span>
                                            </button>
                                        </li>
                                    ))}
                                </ul>

                                {/* Right: details "properties" pane for the selected file */}
                                <div className="rt-props">
                                    <div className="rt-props__icon" aria-hidden>{current.icon}</div>
                                    <div className="rt-props__title">{current.title}</div>
                                    <Separator className="rt-sep" />
                                    <dl className="rt-deflist">
                                        <dt>TYPE</dt>
                                        <dd>{current.discipline}</dd>
                                        <dt>CLIENT</dt>
                                        <dd>{current.client}</dd>
                                        <dt>YEAR</dt>
                                        <dd>{current.year}</dd>
                                        <dt>STATUS</dt>
                                        <dd>{current.award ? `★ ${current.award}` : "Shipped"}</dd>
                                    </dl>
                                    <Link href="/inspiration/retro#work" className="rt-props__open">
                                        ► Open project ↗
                                    </Link>
                                </div>
                            </div>
                        </FauxClient>
                    </section>

                    {/* ── CAPABILITIES — folder tabs ─────────────────────────── */}
                    <section className="rt-section" aria-labelledby="rt-cap">
                        <FauxClient
                            variant="browser"
                            url="http://www.fieldwork.studio/services.html"
                            dots
                            className="rt-window"
                            barClassName="rt-window__bar"
                            bodyClassName="rt-window__body"
                        >
                            <Heading as="h2" className="rt-h2" id="rt-cap">
                                🛠️ What We Do
                            </Heading>
                            <Tabs defaultTab="services" className="rt-tabs">
                                <Tabs.List>
                                    <Tabs.Tab value="services">Services</Tabs.Tab>
                                    <Tabs.Tab value="process">Process</Tabs.Tab>
                                    <Tabs.Tab value="faq">F.A.Q.</Tabs.Tab>
                                </Tabs.List>
                                <Tabs.Panels>
                                    <Tabs.Panel value="services">
                                        <div className="rt-services">
                                            {SERVICES.map((s) => (
                                                <div key={s.no} className="rt-service">
                                                    <div className="rt-service__head">
                                                        <span className="rt-service__icon" aria-hidden>{s.icon}</span>
                                                        <span className="rt-service__no">{s.no}</span>
                                                    </div>
                                                    <h3 className="rt-service__title">{s.title}</h3>
                                                    <p className="rt-service__body">{s.body}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </Tabs.Panel>

                                    <Tabs.Panel value="process">
                                        <ol className="rt-process">
                                            {[
                                                { k: "WEEK 0", t: "Discovery", d: "Goals, audience, constraints. A fixed-fee proposal with dates we hold." },
                                                { k: "WK 1–3", t: "Direction", d: "Two or three routes, explored until a decision is real, not abstract." },
                                                { k: "WK 4–8", t: "System", d: "The chosen direction built into a documented, reusable system." },
                                                { k: "HANDOFF", t: "Handoff", d: "Source files, guidelines, and a working session so your team owns it." },
                                            ].map((step, i) => (
                                                <li key={step.t} className="rt-step">
                                                    <span className="rt-step__num">{i + 1}.</span>
                                                    <div>
                                                        <div className="rt-step__head">
                                                            <span className="rt-step__key">{step.k}</span>
                                                            <span className="rt-step__title">{step.t}</span>
                                                        </div>
                                                        <p className="rt-step__body">{step.d}</p>
                                                    </div>
                                                </li>
                                            ))}
                                        </ol>
                                    </Tabs.Panel>

                                    <Tabs.Panel value="faq">
                                        <Accordion type="single" defaultOpen={["q0"]} className="rt-accordion">
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
                        </FauxClient>
                    </section>

                    {/* ── ABOUT + TEAM — "About this site" + cast window ─────── */}
                    <section className="rt-section" aria-labelledby="rt-about">
                        <div className="rt-twocol">
                            <FauxClient
                                variant="browser"
                                url="about.html"
                                dots
                                className="rt-window rt-window--about"
                                barClassName="rt-window__bar"
                                bodyClassName="rt-window__body"
                            >
                                <Heading as="h2" className="rt-h2" id="rt-about">
                                    💬 About This Studio
                                </Heading>
                                <p className="rt-about__lead">
                                    “The best design is mostly invisible — a grid you never notice, type
                                    that reads before you register it, a system that quietly holds.”
                                </p>
                                <Text as="p" className="rt-about__body">
                                    FIELDWORK began in 2016 as two people and a shared dislike of decoration
                                    for its own sake. We’ve grown carefully since — eight people now, still
                                    small enough that the people you meet are the people who do the work.
                                    We take a handful of projects at a time and give each our full attention.
                                </Text>
                                <div className="rt-webring" aria-label="Webring">
                                    <span className="rt-webring__label">◄ DESIGN WEBRING ►</span>
                                    <a href="https://fieldwork.example" target="_blank" rel="noopener noreferrer" className="rt-webring__link">‹ prev</a>
                                    <a href="https://fieldwork.example" target="_blank" rel="noopener noreferrer" className="rt-webring__link">random</a>
                                    <a href="https://fieldwork.example" target="_blank" rel="noopener noreferrer" className="rt-webring__link">next ›</a>
                                </div>
                            </FauxClient>

                            <FauxClient
                                variant="browser"
                                url="staff/"
                                meta="4 users"
                                dots
                                className="rt-window rt-window--team"
                                barClassName="rt-window__bar"
                                bodyClassName="rt-window__body"
                            >
                                <Heading as="h2" className="rt-h2">
                                    👥 The Crew
                                </Heading>
                                <div className="rt-team">
                                    {TEAM.map((m) => (
                                        <div key={m.name} className="rt-member">
                                            <span className="rt-member__avatar" style={{ background: m.color }}>
                                                <Avatar fallback={m.initials} size="md" className="rt-avatar" />
                                            </span>
                                            <div className="rt-member__meta">
                                                <span className="rt-member__name">{m.name}</span>
                                                <span className="rt-member__role">{m.role}</span>
                                            </div>
                                            <span className="rt-member__status" title="online">●</span>
                                        </div>
                                    ))}
                                </div>
                            </FauxClient>
                        </div>
                    </section>

                    {/* ── RECOGNITION + CLIENTS — spec sheet + 88×31 buttons ─── */}
                    <section className="rt-section" aria-labelledby="rt-recognition">
                        <FauxClient
                            variant="browser"
                            url="awards.html"
                            dots
                            className="rt-window"
                            barClassName="rt-window__bar"
                            bodyClassName="rt-window__body"
                        >
                            <div className="rt-twocol rt-twocol--wide">
                                <div>
                                    <Heading as="h2" className="rt-h2" id="rt-recognition">
                                        🏆 Recognition
                                    </Heading>
                                    <Table className="rt-table">
                                        <Table.Head>
                                            <Table.Column label="Year" />
                                            <Table.Column label="Project" />
                                            <Table.Column label="Award" />
                                        </Table.Head>
                                        <Table.Body>
                                            {SPECS.map((s) => (
                                                <Table.Row key={s.year + s.project}>
                                                    <Table.Cell className="rt-td-year">{s.year}</Table.Cell>
                                                    <Table.Cell className="rt-td-proj">{s.project}</Table.Cell>
                                                    <Table.Cell className="rt-td-award">{s.award}</Table.Cell>
                                                </Table.Row>
                                            ))}
                                        </Table.Body>
                                    </Table>
                                </div>

                                <div>
                                    <Heading as="h2" className="rt-h2">
                                        🔗 Friends &amp; Clients
                                    </Heading>
                                    <div className="rt-buttons88">
                                        {CLIENTS.map((c, i) => (
                                            <Tooltip key={c} content={`Visit ${c} ↗`}>
                                                <Badge className={`rt-88 rt-88--${i % 4}`}>{c}</Badge>
                                            </Tooltip>
                                        ))}
                                    </div>
                                    <Separator className="rt-sep" />
                                    <div className="rt-press">
                                        <div className="rt-press__title">📣 As seen on</div>
                                        <ul className="rt-press__list" role="list">
                                            <li>It’s Nice That — Studio of the week</li>
                                            <li>Eye Magazine №112</li>
                                            <li>Slanted — Type in the wild</li>
                                        </ul>
                                    </div>
                                    <Badge className="rt-88 rt-88--valid">✓ Valid HTML 4.01</Badge>
                                </div>
                            </div>
                        </FauxClient>
                    </section>

                    {/* ── CONTACT — brief box + guestbook ────────────────────── */}
                    <section className="rt-section" id="contact" aria-labelledby="rt-contact">
                        <div className="rt-twocol">
                            {/* Brief box */}
                            <FauxClient
                                variant="browser"
                                url="mailto://studio@fieldwork.studio"
                                dots
                                className="rt-window rt-window--brief"
                                barClassName="rt-window__bar"
                                bodyClassName="rt-window__body"
                            >
                                <Heading as="h2" className="rt-h2" id="rt-contact">
                                    ✉️ Drop Us A Line
                                </Heading>
                                <Card className="rt-briefcard" padding="none">
                                    <Card.Header className="rt-briefcard__head">
                                        <span>NEW MESSAGE — fieldwork@studio</span>
                                        <Tooltip content="We read every message — no bots, no auto-replies.">
                                            <Badge className="rt-88 rt-88--valid">● OPEN Q3</Badge>
                                        </Tooltip>
                                    </Card.Header>
                                    <Card.Body className="rt-briefcard__body">
                                        <p className="rt-field-label">SUBJECT: what are you building?</p>
                                        <Composer
                                            value={guestNote}
                                            onChange={setGuestNote}
                                            onSubmit={() => setGuestNote((b) => b)}
                                            placeholder="Tell us about the project and your deadline…"
                                            className="rt-composer"
                                        />
                                        <div className="rt-briefcard__meter">
                                            <Text as="span" className="rt-meter-label">
                                                {guestNote.trim().length} bytes typed
                                            </Text>
                                            <Progress
                                                value={Math.min(guestNote.trim().length, 160)}
                                                max={160}
                                                variant="bar"
                                                className="rt-progress"
                                            />
                                        </div>
                                    </Card.Body>
                                    <Card.Footer className="rt-briefcard__foot">
                                        <Text as="span" className="rt-fineprint">No NDA needed to say hello.</Text>
                                        <Button
                                            className="rt-btn rt-btn--go"
                                            disabled={guestNote.trim().length < 12}
                                            onClick={() => setGuestNote((b) => b)}
                                        >
                                            ► Send mail
                                        </Button>
                                    </Card.Footer>
                                </Card>
                                <div className="rt-contactinfo">
                                    <span>📧 studio@fieldwork.studio</span>
                                    <span>☎ +41 44 000 00 00</span>
                                </div>
                            </FauxClient>

                            {/* Guestbook */}
                            <FauxClient
                                variant="browser"
                                url="guestbook.cgi"
                                meta={`${GUESTS.length + (signed ? 1 : 0)} entries`}
                                dots
                                className="rt-window rt-window--guestbook"
                                barClassName="rt-window__bar"
                                bodyClassName="rt-window__body"
                            >
                                <Heading as="h2" className="rt-h2">
                                    📖 Sign The Guestbook
                                </Heading>

                                <div className="rt-guestbook">
                                    {signed && (
                                        <div className="rt-guest rt-guest--new">
                                            <div className="rt-guest__top">
                                                <span className="rt-guest__name">🆕 {guestName.trim() || "anonymous"}</span>
                                                <span className="rt-guest__at">just now</span>
                                            </div>
                                            <p className="rt-guest__note">{guestNote.trim() || "★ signed the book! ★"}</p>
                                        </div>
                                    )}
                                    {GUESTS.map((g) => (
                                        <div key={g.name} className="rt-guest">
                                            <div className="rt-guest__top">
                                                <span className="rt-guest__name">{g.flag} {g.name}</span>
                                                <span className="rt-guest__at">{g.at}</span>
                                            </div>
                                            <p className="rt-guest__note">{g.note}</p>
                                        </div>
                                    ))}
                                </div>

                                {signed ? (
                                    <div className="rt-signed">
                                        <span>✓ Thanks for signing — you’re entry #{GUESTS.length + 1}.</span>
                                        <Button
                                            variant="ghost"
                                            className="rt-btn"
                                            onClick={() => { setSigned(false); setGuestName(""); }}
                                        >
                                            ◄ Sign again
                                        </Button>
                                    </div>
                                ) : (
                                    <form
                                        className="rt-signform"
                                        onSubmit={(e) => { e.preventDefault(); if (guestName.trim()) setSigned(true); }}
                                    >
                                        <label className="rt-signform__row">
                                            <span className="rt-field-label">YOUR HANDLE:</span>
                                            <input
                                                className="rt-input"
                                                value={guestName}
                                                onChange={(e) => setGuestName(e.target.value)}
                                                placeholder="webmaster_you"
                                                maxLength={24}
                                            />
                                        </label>
                                        <Button
                                            type="submit"
                                            className="rt-btn rt-btn--go"
                                            disabled={!guestName.trim()}
                                        >
                                            ✍ Sign guestbook
                                        </Button>
                                    </form>
                                )}
                            </FauxClient>
                        </div>
                    </section>

                    {/* ── Sticky-note PS — a real StickyNote, restyled to Post-it ─ */}
                    <section className="rt-section rt-section--note" aria-label="Studio note">
                        <StickyNote
                            value="P.S. — we still answer email. usually within 2 working days. — A.V."
                            editable={false}
                            rotate={-2}
                            width={300}
                            className="rt-stickynote"
                        />
                    </section>

                    {/* ── FOOTER — webmaster bar ─────────────────────────────── */}
                    <footer className="rt-footer">
                        <div className="rt-footer__badges">
                            <Badge className="rt-88 rt-88--0">Made with ♥ &amp; HTML</Badge>
                            <Badge className="rt-88 rt-88--1">Netscape Now!</Badge>
                            <Badge className="rt-88 rt-88--2">1024×768</Badge>
                            <Badge className="rt-88 rt-88--valid">No AI slop</Badge>
                        </div>
                        <p className="rt-footer__copy">
                            © 2016–2026 FIELDWORK — a fictional studio, for demonstration · Style {style.num} / Retro Web
                        </p>
                        <div className="rt-footer__links">
                            <Link href="/inspiration" className="rt-footer__home">
                                ◄ Back to the gallery
                            </Link>
                            <a href="#rt-hero" className="rt-footer__top">▲ top</a>
                        </div>
                    </footer>
                </div>
            </div>
        </div>
    );
}
