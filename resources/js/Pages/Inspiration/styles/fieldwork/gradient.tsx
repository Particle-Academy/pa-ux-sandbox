import "./gradient.css";

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
    Carousel,
    Chart,
    Composer,
    Heading,
    MoodMeter,
    Pagination,
    Pillbox,
    Progress,
    ReasonTag,
    Separator,
    Slider,
    Switch,
    Table,
    Tabs,
    Text,
    Timeline,
    Tooltip,
} from "@particle-academy/react-fancy";
import { ArrowLeft, ArrowUpRight, Sparkles, Star } from "lucide-react";
import type { Style } from "../../types";

/**
 * Inspiration Gallery · Style — Brand Gradient ("gradient", light mode).
 *
 * FIELDWORK (a FICTIONAL design + dev studio) rendered as a glassy, gradient-led
 * one-page portfolio. The brand gradient (sky-300 → indigo-400 → violet-300) is
 * the whole language: a washed gradient field behind everything, a gradient hero
 * with a soft aurora, frosted glass cards that read like panes floating over the
 * wash, gradient-stroked pills, and violet→indigo accents on every interactive
 * primitive. The Fancy kit WEARS the gradient — Buttons, Tabs, Badges, Tables,
 * Charts, the MoodMeter and Composer are all restyled via scoped CSS so they
 * read native to this idiom, not like default widgets.
 *
 * Mounted by Inspiration/Show.tsx for `style.id === "gradient"`. SSR-safe: no
 * module-level browser APIs; every interactive bit is controlled React state.
 * Inner links use the stretched-link pattern (one <Link> per row) so no anchor
 * is ever nested in another anchor (avoids React #418 under SSR).
 */

type Project = {
    num: string;
    title: string;
    discipline: string;
    year: string;
    client: string;
    blurb: string;
    tags: string[];
};

const PROJECTS: Project[] = [
    { num: "01", title: "Aurora", discipline: "Brand + product design", year: "2025", client: "Aurora Health", blurb: "A calm, gradient-soft identity and patient app for a telehealth network.", tags: ["Brand", "Product"] },
    { num: "02", title: "Tidewater", discipline: "Web, design system", year: "2025", client: "Tidewater Climate", blurb: "A living design system and marketing site for an ocean-data nonprofit.", tags: ["Design system", "Web"] },
    { num: "03", title: "Prism", discipline: "Product UI, motion", year: "2024", client: "Prism Analytics", blurb: "A dashboard language built on layered glass and animated gradients.", tags: ["Product", "Motion"] },
    { num: "04", title: "Lumen", discipline: "Identity, packaging", year: "2024", client: "Lumen Coffee", blurb: "A dawn-to-dusk gradient identity that shifts with the roast.", tags: ["Brand", "Packaging"] },
    { num: "05", title: "Skyline", discipline: "Web, 3D", year: "2024", client: "Skyline Spaces", blurb: "An immersive, scroll-driven property tour rendered in soft WebGL.", tags: ["Web", "3D"] },
    { num: "06", title: "Halo", discipline: "Brand, design system", year: "2023", client: "Halo Audio", blurb: "A spectral, ever-shifting brand for a generative-audio startup.", tags: ["Brand", "Design system"] },
];

const SERVICES = [
    { no: "01", title: "Brand systems", body: "Identity, naming, and a living system of color, type, and gradient that stays coherent as it scales.", emoji: "✶" },
    { no: "02", title: "Product & web", body: "Interface design and design systems for software teams — research, prototypes, production-ready React.", emoji: "◆" },
    { no: "03", title: "Motion & 3D", body: "Animated gradients, title sequences, and soft WebGL scenes that give a brand depth and movement.", emoji: "✺" },
    { no: "04", title: "Design ops", body: "Tokens, documentation, and the rituals that keep a fast team designing in lockstep.", emoji: "❖" },
];

const TEAM = [
    { name: "Iris Mahoney", role: "Founder, creative director", initials: "IM" },
    { name: "Dev Patel", role: "Product & systems", initials: "DP" },
    { name: "Noor Haddad", role: "Brand & type", initials: "NH" },
    { name: "Kai Brenner", role: "Motion & 3D", initials: "KB" },
];

const CLIENTS = ["Aurora Health", "Tidewater", "Prism", "Lumen", "Skyline", "Halo Audio", "Northwind", "Studio Fön"];

const FAQ = [
    { q: "How do you start a project?", a: "Every engagement opens with a short discovery sprint — goals, audience, and a fixed-fee proposal. We map the gradient of the work before we touch a pixel." },
    { q: "What's a typical timeline?", a: "Brand systems run six to ten weeks; product and web vary with scope. We commit to dates in the proposal and we hold them." },
    { q: "Do you work with in-house teams?", a: "Constantly. We can lead, embed, or hand off a fully documented system — tokens, components, and a working session so your team owns it." },
    { q: "Where are you based?", a: "San Diego and Berlin, working across North American and European time zones — mostly remote, with focused on-site weeks." },
];

const TESTIMONIALS = [
    { quote: "FIELDWORK gave our brand a sense of light. The gradient system feels alive without ever feeling loud.", name: "Priya Anand", role: "VP Brand, Aurora Health" },
    { quote: "They shipped a design system our engineers actually love. Two years on, it still holds.", name: "Marco Reyes", role: "Head of Product, Prism" },
    { quote: "The most thoughtful studio we've worked with. Calm process, luminous results.", name: "Elin Sandberg", role: "Founder, Halo Audio" },
];

const PER_PAGE = 4;

export default function Gradient({ style }: { style: Style }) {
    const [page, setPage] = useState(1);
    const [tags, setTags] = useState<string[]>(["Brand", "Product"]);
    const [budget, setBudget] = useState(48);
    const [budgetConfidence, setBudgetConfidence] = useState(0.62);
    const [brief, setBrief] = useState("");
    const [submitted, setSubmitted] = useState(false);
    const [tab, setTab] = useState("services");
    const [newsletter, setNewsletter] = useState(true);
    const [timeline, setTimeline] = useState(7);

    const totalPages = Math.ceil(PROJECTS.length / PER_PAGE);
    const pageProjects = PROJECTS.slice((page - 1) * PER_PAGE, page * PER_PAGE);

    return (
        <div className="insp-gradient">
            <div className="ig-aurora" aria-hidden />
            <div className="ig-shell">
                {/* ── Running head ──────────────────────────────────────────── */}
                <header className="ig-head">
                    <Breadcrumbs className="ig-crumbs">
                        <Breadcrumbs.Item href="/inspiration">Inspiration</Breadcrumbs.Item>
                        <Breadcrumbs.Item active>Brand Gradient</Breadcrumbs.Item>
                    </Breadcrumbs>
                    <div className="ig-brandmark">
                        <span className="ig-mark brand-gradient" aria-hidden>F</span>
                        <span className="ig-brand-name">FIELDWORK</span>
                        <Badge className="ig-est" color="violet" variant="soft" size="sm">est. 2017</Badge>
                    </div>
                </header>

                {/* ── Hero ──────────────────────────────────────────────────── */}
                <section className="ig-hero" aria-labelledby="ig-hero-title">
                    <div className="ig-hero-pill">
                        <Sparkles size={13} aria-hidden />
                        <span>Design studio · light, in motion</span>
                    </div>
                    <h1 id="ig-hero-title" className="ig-display">
                        We design brands that <span className="brand-gradient-text ig-grad-word">catch the light</span> and software that holds it.
                    </h1>
                    <p className="ig-lede">
                        FIELDWORK is a small studio working at the seam of brand, product, and motion. We build
                        luminous, gradient-soft systems that stay legible as they scale — and we ship them.
                    </p>
                    <div className="ig-hero-cta">
                        <Button className="ig-btn ig-btn--grad" iconTrailing="arrow-right" href="#contact">
                            Brief the studio
                        </Button>
                        <Button className="ig-btn ig-btn--glass" variant="ghost" iconTrailing="arrow-down" href="#work">
                            Selected work
                        </Button>
                    </div>

                    <div className="ig-hero-figures">
                        {[
                            { num: "2017", label: "Founded" },
                            { num: "90+", label: "Projects shipped" },
                            { num: "06", label: "People" },
                            { num: "11", label: "Awards" },
                        ].map((f) => (
                            <div key={f.label} className="ig-figure">
                                <div className="ig-figure-num brand-gradient-text">{f.num}</div>
                                <div className="ig-figure-label">{f.label}</div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* ── Marquee of disciplines ────────────────────────────────── */}
                <div className="ig-marquee" aria-hidden>
                    <div className="ig-marquee-track">
                        {[...Array(2)].map((_, r) => (
                            <span className="ig-marquee-group" key={r}>
                                {["Brand systems", "Product design", "Design systems", "Motion", "3D / WebGL", "Identity", "Type", "Design ops"].map((w) => (
                                    <span className="ig-marquee-item" key={w}>
                                        <span className="ig-marquee-dot" />
                                        {w}
                                    </span>
                                ))}
                            </span>
                        ))}
                    </div>
                </div>

                {/* ── Selected work ─────────────────────────────────────────── */}
                <section className="ig-section" id="work" aria-labelledby="ig-work-title">
                    <div className="ig-section-head">
                        <div>
                            <span className="ig-eyebrow">01 — Selected work</span>
                            <Heading as="h2" size="2xl" weight="semibold" className="ig-h2">
                                Recent projects, lit from within.
                            </Heading>
                        </div>
                        <Pillbox
                            value={tags}
                            onChange={setTags}
                            placeholder="Filter by discipline…"
                            className="ig-pillbox"
                            aria-label="Filter work by discipline"
                        />
                    </div>

                    <div className="ig-work-grid">
                        {pageProjects.map((p) => (
                            <Card key={p.num} className="ig-work-card" variant="outlined" padding="none">
                                <Link href="/inspiration/gradient#work" className="ig-work-stretch" aria-label={`${p.title} — ${p.discipline}`} />
                                <div className="ig-work-thumb" data-proj={p.num} aria-hidden>
                                    <span className="ig-work-num">{p.num}</span>
                                    <ArrowUpRight size={18} className="ig-work-arrow" />
                                </div>
                                <Card.Body className="ig-work-body">
                                    <div className="ig-work-meta">
                                        <span className="ig-work-title">{p.title}</span>
                                        <span className="ig-work-year">{p.year}</span>
                                    </div>
                                    <span className="ig-work-disc">{p.discipline}</span>
                                    <p className="ig-work-blurb">{p.blurb}</p>
                                    <div className="ig-work-tags">
                                        {p.tags.map((t) => (
                                            <Badge key={t} className="ig-tag" color="indigo" variant="soft" size="sm">{t}</Badge>
                                        ))}
                                    </div>
                                </Card.Body>
                            </Card>
                        ))}
                    </div>

                    <div className="ig-work-foot">
                        <span className="ig-meta">
                            Showing {(page - 1) * PER_PAGE + 1}–{Math.min(page * PER_PAGE, PROJECTS.length)} of {PROJECTS.length}
                        </span>
                        <Pagination page={page} totalPages={totalPages} onPageChange={setPage} className="ig-pagination" />
                    </div>
                </section>

                {/* ── Capabilities (tabbed) ─────────────────────────────────── */}
                <section className="ig-section" aria-labelledby="ig-cap-title">
                    <span className="ig-eyebrow">02 — Capabilities</span>
                    <Heading as="h2" size="2xl" weight="semibold" className="ig-h2" id="ig-cap-title">
                        What we do, and how we work.
                    </Heading>

                    <Tabs activeTab={tab} onTabChange={setTab} variant="pills" className="ig-tabs">
                        <Tabs.List className="ig-tablist">
                            <Tabs.Tab value="services">Services</Tabs.Tab>
                            <Tabs.Tab value="process">Process</Tabs.Tab>
                            <Tabs.Tab value="faq">Questions</Tabs.Tab>
                        </Tabs.List>
                        <Tabs.Panels>
                            <Tabs.Panel value="services">
                                <div className="ig-services">
                                    {SERVICES.map((s) => (
                                        <Card key={s.no} className="ig-service" variant="outlined" padding="none">
                                            <Card.Body className="ig-service-body">
                                                <span className="ig-service-glyph brand-gradient" aria-hidden>{s.emoji}</span>
                                                <span className="ig-service-no">{s.no}</span>
                                                <h3 className="ig-service-title">{s.title}</h3>
                                                <p className="ig-service-text">{s.body}</p>
                                            </Card.Body>
                                        </Card>
                                    ))}
                                </div>
                            </Tabs.Panel>

                            <Tabs.Panel value="process">
                                <div className="ig-process">
                                    <Timeline
                                        className="ig-timeline"
                                        events={[
                                            { date: "Week 0", title: "Discovery", description: "Goals, audience, constraints. A fixed-fee proposal with dates we hold.", color: "sky" },
                                            { date: "Weeks 1–3", title: "Direction", description: "Two or three gradient-soft routes, explored until the decision is real.", color: "indigo" },
                                            { date: "Weeks 4–8", title: "System", description: "The chosen direction built into a documented, reusable token system.", color: "violet" },
                                            { date: "Handoff", title: "Handoff", description: "Source files, guidelines, and a working session so your team owns it.", color: "fuchsia" },
                                        ]}
                                    />
                                </div>
                            </Tabs.Panel>

                            <Tabs.Panel value="faq">
                                <div className="ig-faq">
                                    <Accordion type="single" defaultOpen={["q0"]} className="ig-accordion">
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

                {/* ── About + impact charts ─────────────────────────────────── */}
                <section className="ig-section ig-about" aria-labelledby="ig-about-title">
                    <div className="ig-about-grid">
                        <div className="ig-about-copy">
                            <span className="ig-eyebrow">03 — About</span>
                            <h2 id="ig-about-title" className="ig-about-lead">
                                The best design feels like light — present everywhere, noticed nowhere.
                            </h2>
                            <Text as="p" size="md" className="ig-about-body">
                                FIELDWORK began in 2017 as two people and a belief that warmth and rigor aren't
                                opposites. We've grown carefully since — six people now, small enough that the people
                                you meet are the people who do the work. We take a handful of projects at a time and
                                give each our full attention.
                            </Text>
                            <Callout className="ig-callout" color="violet" icon={<Sparkles size={16} aria-hidden />}>
                                Carbon-aware by default — every site we ship runs on renewable hosting and a measured
                                performance budget.
                            </Callout>
                        </div>

                        <Card className="ig-impact" variant="outlined" padding="none">
                            <Card.Header className="ig-impact-head">
                                <span className="ig-impact-title">Studio momentum</span>
                                <Badge className="ig-tag" color="emerald" variant="soft" size="sm" dot>Trending up</Badge>
                            </Card.Header>
                            <Card.Body className="ig-impact-body">
                                <Chart.Line
                                    className="ig-chart"
                                    height={150}
                                    labels={["2021", "2022", "2023", "2024", "2025"]}
                                    series={[{ label: "Projects", data: [12, 18, 24, 31, 44], color: "#818cf8" }]}
                                    curve="monotone"
                                    fill
                                    fillOpacity={0.16}
                                    grid={{ horizontal: true, vertical: false }}
                                    xAxis
                                    yAxis={false}
                                />
                                <Separator className="ig-sep" />
                                <div className="ig-impact-bars">
                                    <span className="ig-impact-label">Where the work lands</span>
                                    <Chart.HorizontalBar
                                        height={132}
                                        showValues
                                        data={[
                                            { label: "Brand", value: 38, color: "#7dd3fc" },
                                            { label: "Product", value: 31, color: "#818cf8" },
                                            { label: "Motion / 3D", value: 19, color: "#a78bfa" },
                                            { label: "Design ops", value: 12, color: "#c4b5fd" },
                                        ]}
                                    />
                                </div>
                            </Card.Body>
                        </Card>
                    </div>
                </section>

                {/* ── Team ──────────────────────────────────────────────────── */}
                <section className="ig-section" aria-labelledby="ig-team-title">
                    <span className="ig-eyebrow">04 — People</span>
                    <Heading as="h2" size="2xl" weight="semibold" className="ig-h2" id="ig-team-title">
                        The studio.
                    </Heading>
                    <div className="ig-team">
                        {TEAM.map((m) => (
                            <Card key={m.name} className="ig-member" variant="outlined" padding="none">
                                <Card.Body className="ig-member-body">
                                    <div className="ig-member-ava">
                                        <Avatar fallback={m.initials} size="lg" glow />
                                    </div>
                                    <div className="ig-member-name">{m.name}</div>
                                    <div className="ig-member-role">{m.role}</div>
                                </Card.Body>
                            </Card>
                        ))}
                    </div>
                </section>

                {/* ── Testimonials carousel ─────────────────────────────────── */}
                <section className="ig-section" aria-label="What clients say">
                    <span className="ig-eyebrow">05 — In their words</span>
                    <Heading as="h2" size="2xl" weight="semibold" className="ig-h2">
                        Calm process, luminous results.
                    </Heading>
                    <Carousel className="ig-carousel" loop>
                        <Carousel.Panels>
                            {TESTIMONIALS.map((t) => (
                                <Carousel.Slide key={t.name} name={t.name}>
                                    <div className="ig-quote">
                                        <div className="ig-quote-stars" aria-label="Five out of five">
                                            {[...Array(5)].map((_, i) => (
                                                <Star key={i} size={15} className="ig-star" aria-hidden />
                                            ))}
                                        </div>
                                        <p className="ig-quote-text">“{t.quote}”</p>
                                        <div className="ig-quote-by">
                                            <Avatar fallback={t.name.split(" ").map((w) => w[0]).join("")} size="sm" />
                                            <div>
                                                <div className="ig-quote-name">{t.name}</div>
                                                <div className="ig-quote-role">{t.role}</div>
                                            </div>
                                        </div>
                                    </div>
                                </Carousel.Slide>
                            ))}
                        </Carousel.Panels>
                        <Carousel.Controls className="ig-carousel-controls" />
                    </Carousel>
                </section>

                {/* ── Recognition + clients ─────────────────────────────────── */}
                <section className="ig-section" aria-labelledby="ig-rec-title">
                    <div className="ig-rec-grid">
                        <div className="ig-rec-main">
                            <span className="ig-eyebrow">06 — Recognition</span>
                            <Heading as="h2" size="lg" weight="semibold" className="ig-h3" id="ig-rec-title">
                                Selected awards
                            </Heading>
                            <Table className="ig-table">
                                <Table.Head>
                                    <Table.Column label="Year" />
                                    <Table.Column label="Project" />
                                    <Table.Column label="Recognition" />
                                </Table.Head>
                                <Table.Body>
                                    <Table.Row>
                                        <Table.Cell className="ig-cell-year">2025</Table.Cell>
                                        <Table.Cell className="ig-cell-proj">Aurora</Table.Cell>
                                        <Table.Cell>Awwwards · Site of the Day</Table.Cell>
                                    </Table.Row>
                                    <Table.Row>
                                        <Table.Cell className="ig-cell-year">2025</Table.Cell>
                                        <Table.Cell className="ig-cell-proj">Tidewater</Table.Cell>
                                        <Table.Cell>CSS Design Awards · Best UI</Table.Cell>
                                    </Table.Row>
                                    <Table.Row>
                                        <Table.Cell className="ig-cell-year">2024</Table.Cell>
                                        <Table.Cell className="ig-cell-proj">Prism</Table.Cell>
                                        <Table.Cell>The Webby Awards · Honoree</Table.Cell>
                                    </Table.Row>
                                    <Table.Row>
                                        <Table.Cell className="ig-cell-year">2023</Table.Cell>
                                        <Table.Cell className="ig-cell-proj">Halo Audio</Table.Cell>
                                        <Table.Cell>D&AD · Wood Pencil</Table.Cell>
                                    </Table.Row>
                                </Table.Body>
                            </Table>
                        </div>

                        <div className="ig-rec-side">
                            <span className="ig-eyebrow">Selected clients</span>
                            <div className="ig-clients">
                                {CLIENTS.map((c) => (
                                    <Badge key={c} className="ig-client" color="sky" variant="outline" size="md">{c}</Badge>
                                ))}
                            </div>
                            <Separator className="ig-sep" />
                            <span className="ig-eyebrow">Press</span>
                            <ul className="ig-press">
                                <li className="ig-press-row"><span className="ig-press-dot" />It's Nice That — Studio of the week</li>
                                <li className="ig-press-row"><span className="ig-press-dot" />Communication Arts — Webpick</li>
                                <li className="ig-press-row"><span className="ig-press-dot" />Typewolf — Site of the month</li>
                            </ul>
                        </div>
                    </div>
                </section>

                {/* ── Brief / contact ───────────────────────────────────────── */}
                <section className="ig-section" id="contact" aria-labelledby="ig-contact-title">
                    <div className="ig-contact">
                        <div className="ig-contact-grid">
                            <div className="ig-contact-copy">
                                <span className="ig-eyebrow">07 — Contact</span>
                                <Heading as="h2" size="2xl" weight="semibold" className="ig-h2" id="ig-contact-title">
                                    Tell us about the work.
                                </Heading>
                                <p className="ig-lede ig-lede--sm">
                                    A few sentences is plenty to start. We reply to every brief within two working days.
                                </p>
                                <div className="ig-contact-lines">
                                    <span className="ig-contact-line">studio@fieldwork.example</span>
                                    <span className="ig-contact-line ig-contact-line--muted">San Diego · Berlin</span>
                                </div>

                                <div className="ig-budget">
                                    <span className="ig-eyebrow">Indicative budget</span>
                                    <Text as="p" size="sm" className="ig-budget-help">
                                        Drag for the figure, up for how firm it is. It only helps us scope — nothing's binding.
                                    </Text>
                                    <MoodMeter
                                        className="ig-moodmeter"
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
                                        prefix="$"
                                        suffix="k"
                                        color="#6366f1"
                                        postedColor="#a78bfa"
                                    />
                                    <div className="ig-budget-read">
                                        Scoping at{" "}
                                        <ReasonTag
                                            value={`$${budget}k`}
                                            reason="Indicative only — the proposal sets the fixed fee after discovery. Drawn from your budget pad and the project type."
                                            confidence={budgetConfidence}
                                            by="Studio"
                                            theme="underline"
                                        />{" "}
                                        · confidence {Math.round(budgetConfidence * 100)}%
                                    </div>
                                </div>
                            </div>

                            <Card className="ig-form" variant="elevated" padding="none">
                                <Card.Header className="ig-form-head">
                                    <span className="ig-form-title">New brief</span>
                                    <Tooltip content="We read every brief — no bots.">
                                        <Badge className="ig-tag" color="emerald" variant="soft" size="sm" dot>Open for Q3</Badge>
                                    </Tooltip>
                                </Card.Header>
                                <Card.Body className="ig-form-body">
                                    {submitted ? (
                                        <div className="ig-form-done">
                                            <span className="ig-done-glyph brand-gradient" aria-hidden>✓</span>
                                            <p className="ig-done-text">
                                                Thanks — your brief is in. We'll reply within two working days.
                                            </p>
                                            <Button
                                                className="ig-btn ig-btn--glass"
                                                variant="ghost"
                                                icon="arrow-left"
                                                onClick={() => { setSubmitted(false); setBrief(""); }}
                                            >
                                                Write another
                                            </Button>
                                        </div>
                                    ) : (
                                        <>
                                            <Composer
                                                className="ig-composer"
                                                value={brief}
                                                onChange={setBrief}
                                                onSubmit={() => setBrief((b) => b)}
                                                placeholder="What are you building, and what's the deadline?"
                                            />
                                            <div className="ig-form-row">
                                                <span className="ig-form-count">{brief.trim().length} characters</span>
                                                <Progress
                                                    className="ig-progress"
                                                    value={Math.min(brief.trim().length, 160)}
                                                    max={160}
                                                    variant="bar"
                                                    size="sm"
                                                    color="violet"
                                                />
                                            </div>

                                            <div className="ig-form-field">
                                                <div className="ig-field-top">
                                                    <span className="ig-field-label">Ideal timeline</span>
                                                    <span className="ig-field-val">{timeline} weeks</span>
                                                </div>
                                                <Slider
                                                    className="ig-slider"
                                                    min={2}
                                                    max={16}
                                                    value={timeline}
                                                    onValueChange={(v) => setTimeline(v as number)}
                                                    aria-label="Ideal timeline in weeks"
                                                />
                                            </div>

                                            <label className="ig-switch-row">
                                                <Switch
                                                    className="ig-switch"
                                                    checked={newsletter}
                                                    onCheckedChange={setNewsletter}
                                                    color="violet"
                                                />
                                                <span className="ig-switch-text">Send me the studio's quarterly field notes</span>
                                            </label>
                                        </>
                                    )}
                                </Card.Body>
                                {!submitted && (
                                    <Card.Footer className="ig-form-foot">
                                        <span className="ig-form-note">No NDA needed to say hello.</span>
                                        <Button
                                            className="ig-btn ig-btn--grad"
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

                {/* ── Footer ────────────────────────────────────────────────── */}
                <footer className="ig-footer">
                    <div className="ig-footer-top">
                        <div className="ig-footer-brand">
                            <div className="ig-brandmark">
                                <span className="ig-mark brand-gradient" aria-hidden>F</span>
                                <span className="ig-brand-name">FIELDWORK</span>
                            </div>
                            <p className="ig-footer-blurb">
                                A design studio working in light. Brand, product, and motion. San Diego and Berlin,
                                since 2017.
                            </p>
                        </div>
                        <div className="ig-footer-links">
                            <a href="#work">Work ↗</a>
                            <a href="https://fieldwork.example" target="_blank" rel="noopener noreferrer">Instagram ↗</a>
                            <a href="#contact">Contact ↗</a>
                            <a href="https://fieldwork.example" target="_blank" rel="noopener noreferrer">LinkedIn ↗</a>
                        </div>
                    </div>
                    <Separator className="ig-sep" />
                    <div className="ig-footer-bottom">
                        <span className="ig-meta">FIELDWORK — a fictional studio, for demonstration · Style {style.num} / Brand Gradient</span>
                        <Link href="/inspiration" className="ig-back">
                            <ArrowLeft size={14} />
                            Back to the gallery
                        </Link>
                    </div>
                </footer>
            </div>
        </div>
    );
}
