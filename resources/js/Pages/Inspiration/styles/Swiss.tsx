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
import { ArrowLeft, ArrowUpRight } from "lucide-react";
import type { Style } from "../types";

/**
 * Inspiration Gallery · Style 01 — Swiss / Minimal.
 *
 * FIELDWORK (a fictional creative + design studio) rendered as an
 * International-Typographic-Style portfolio: a strict 12-column modular grid,
 * generous whitespace, flush-left typographic hierarchy, hairline rules, zinc
 * neutrals on white, mono for labels / numbers / metadata, one restrained
 * violet accent. The kit's components wear the Swiss idiom — proof the same
 * primitives can carry any visual language.
 *
 * Mounted by Inspiration/Show.tsx for `style.id === "swiss"`. SSR-safe: no
 * module-level browser APIs; every interactive bit is controlled React state.
 * Inner links use the stretched-link pattern (one <Link> per row) so no
 * anchor is ever nested inside another anchor (avoids React #418 under SSR).
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
    { num: "01", title: "Meridian", discipline: "Brand system, type design", year: "2025", client: "Meridian Cartography", award: "D&AD Wood Pencil" },
    { num: "02", title: "Low Tide", discipline: "Editorial, art direction", year: "2025", client: "Saltworks Press" },
    { num: "03", title: "Quanta", discipline: "Product UI, motion", year: "2024", client: "Quanta Labs", award: "Awwwards SOTD" },
    { num: "04", title: "Field Notes", discipline: "Identity, signage", year: "2024", client: "Atlas Botanic" },
    { num: "05", title: "Ostro", discipline: "Web, design system", year: "2024", client: "Ostro Maritime" },
    { num: "06", title: "Paper Radio", discipline: "Brand, packaging", year: "2023", client: "Paper Radio Co." },
];

const SERVICES = [
    { no: "01", title: "Brand systems", body: "Identity, naming, voice, and the rules that keep a brand coherent as it scales — delivered as a system, not a logo." },
    { no: "02", title: "Editorial & type", body: "Magazines, reports, and bespoke typefaces. Long-form work where the grid does the heavy lifting." },
    { no: "03", title: "Product & web", body: "Interface design and design systems for software teams — research, prototypes, and production-ready components." },
    { no: "04", title: "Motion & signage", body: "Title sequences, environmental graphics, and wayfinding. Type and space, in motion or at architectural scale." },
];

const TEAM = [
    { name: "Anja Vester", role: "Founder, design director", initials: "AV" },
    { name: "Tomas Pell", role: "Type & editorial", initials: "TP" },
    { name: "Rhea Okonkwo", role: "Product & systems", initials: "RO" },
    { name: "Liang Mori", role: "Motion & 3D", initials: "LM" },
];

const CLIENTS = ["Meridian", "Saltworks", "Quanta Labs", "Atlas Botanic", "Ostro", "Paper Radio", "Northwind", "Studio Føn"];

const FAQ = [
    { q: "How do you scope a project?", a: "Every engagement opens with a short discovery: goals, audience, constraints, and a fixed-fee proposal. No open-ended retainers unless you want one." },
    { q: "What's a typical timeline?", a: "Brand systems run six to ten weeks; editorial and product work vary with scope. We'll commit to dates in the proposal and hold them." },
    { q: "Do you work with in-house teams?", a: "Often. We can lead, embed, or hand off a documented system your team runs with. Whatever leaves you the most independent." },
    { q: "Where are you based?", a: "Zürich and Lisbon, working across European and North American time zones. Most of the work happens remotely with focused on-site weeks." },
];

const PER_PAGE = 4;

export default function Swiss({ style }: { style: Style }) {
    const [page, setPage] = useState(1);
    const [tags, setTags] = useState<string[]>(["Brand system", "Editorial"]);
    const [budget, setBudget] = useState(40);
    const [budgetConfidence, setBudgetConfidence] = useState(0.6);
    const [brief, setBrief] = useState("");
    const [submitted, setSubmitted] = useState(false);

    const totalPages = Math.ceil(PROJECTS.length / PER_PAGE);
    const pageProjects = PROJECTS.slice((page - 1) * PER_PAGE, page * PER_PAGE);

    return (
        <div className="swiss" style={{ "--accent": "var(--accent)" } as CSSProperties}>
            <div className="swiss-shell">
                {/* ── Running head: breadcrumbs + studio mark ───────────────── */}
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        flexWrap: "wrap",
                        gap: 16,
                        paddingBottom: 18,
                    }}
                >
                    <Breadcrumbs>
                        <Breadcrumbs.Item href="/inspiration">Inspiration</Breadcrumbs.Item>
                        <Breadcrumbs.Item active>Swiss / Minimal</Breadcrumbs.Item>
                    </Breadcrumbs>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <span
                            className="brand-gradient"
                            style={{
                                width: 24,
                                height: 24,
                                borderRadius: 6,
                                display: "grid",
                                placeItems: "center",
                                color: "#fff",
                                fontWeight: 700,
                                fontSize: 13,
                            }}
                            aria-hidden
                        >
                            F
                        </span>
                        <span style={{ fontWeight: 600, fontSize: 14, letterSpacing: "-0.01em" }}>FIELDWORK</span>
                        <Badge color="zinc" variant="outline" size="sm" style={{ fontFamily: "var(--font-mono)" }}>
                            est. 2016
                        </Badge>
                    </div>
                </div>
                <hr className="swiss-rule" />

                {/* ── Hero ──────────────────────────────────────────────────── */}
                <section className="swiss-section" aria-labelledby="sw-hero">
                    <div className="swiss-grid">
                        <div style={{ gridColumn: "1 / span 8" }}>
                            <div className="swiss-eyebrow">
                                <span><b>00</b> — Index</span>
                                <span>Graphic design studio</span>
                            </div>
                            <h1 id="sw-hero" className="swiss-display" style={{ marginTop: 22 }}>
                                A design studio for systems, type, and the spaces between.
                            </h1>
                            <p className="swiss-lede" style={{ marginTop: 22 }}>
                                FIELDWORK is a small studio working at the intersection of brand, editorial, and
                                product. We build systems that stay legible as they scale — and we measure twice.
                            </p>
                            <div style={{ display: "flex", gap: 10, marginTop: 26, flexWrap: "wrap" }}>
                                <Button color="zinc" href="#contact">
                                    Brief the studio
                                </Button>
                                <Button variant="ghost" iconTrailing="arrow-down" href="#work">
                                    Selected work
                                </Button>
                            </div>
                        </div>
                        <div style={{ gridColumn: "10 / span 3" }}>
                            <div className="swiss-meta swiss-meta--fg1">Zürich · Lisbon</div>
                            <div className="swiss-meta" style={{ marginTop: 10 }}>
                                47.3769° N, 8.5417° E
                                <br />
                                Available Q3 2026
                            </div>
                            <Separator className="!my-5" />
                            <div className="swiss-meta">
                                Brand systems
                                <br />
                                Editorial &amp; type
                                <br />
                                Product &amp; web
                                <br />
                                Motion &amp; signage
                            </div>
                        </div>
                    </div>
                </section>

                {/* ── Figures band ──────────────────────────────────────────── */}
                <section className="swiss-section" aria-label="Studio in numbers">
                    <div className="swiss-grid" style={{ rowGap: 28 }}>
                        {[
                            { num: "2016", label: "Founded" },
                            { num: "120+", label: "Projects shipped" },
                            { num: "08", label: "People" },
                            { num: "14", label: "Awards" },
                        ].map((f) => (
                            <div key={f.label} className="swiss-figure" style={{ gridColumn: "span 3" }}>
                                <div className="swiss-figure__num">{f.num}</div>
                                <div className="swiss-figure__label">{f.label}</div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* ── Selected work — typographic index ─────────────────────── */}
                <section className="swiss-section" id="work" aria-labelledby="sw-work">
                    <div
                        style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "baseline",
                            flexWrap: "wrap",
                            gap: 16,
                            marginBottom: 28,
                        }}
                    >
                        <div>
                            <div className="swiss-eyebrow"><span><b>01</b> — Selected work</span></div>
                            <Heading as="h2" size="2xl" weight="semibold" className="swiss-h2" style={{ marginTop: 10 }}>
                                Six recent projects.
                            </Heading>
                        </div>
                        <Pillbox
                            value={tags}
                            onChange={setTags}
                            placeholder="Filter by discipline…"
                            className="!w-72"
                            aria-label="Filter work by discipline"
                        />
                    </div>

                    <div className="swiss-index">
                        {pageProjects.map((p) => (
                            <div key={p.num} className="swiss-index__row">
                                <Link
                                    href="/inspiration/swiss#work"
                                    className="swiss-index__stretch"
                                    aria-label={`${p.title} — ${p.discipline}`}
                                />
                                <span className="swiss-index__num">{p.num}</span>
                                <span className="swiss-index__title">{p.title}</span>
                                <span className="swiss-index__disc">{p.discipline}</span>
                                <span className="swiss-index__year">{p.year} ↗</span>
                            </div>
                        ))}
                    </div>

                    <div
                        style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            marginTop: 22,
                            flexWrap: "wrap",
                            gap: 12,
                        }}
                    >
                        <span className="swiss-meta">
                            Showing {(page - 1) * PER_PAGE + 1}–{Math.min(page * PER_PAGE, PROJECTS.length)} of {PROJECTS.length}
                        </span>
                        <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
                    </div>
                </section>

                {/* ── Capabilities (tabbed) ─────────────────────────────────── */}
                <section className="swiss-section" aria-labelledby="sw-cap">
                    <div className="swiss-eyebrow"><span><b>02</b> — Capabilities</span></div>
                    <Heading as="h2" size="2xl" weight="semibold" className="swiss-h2" style={{ margin: "10px 0 24px" }}>
                        What we do, and how we work.
                    </Heading>

                    <Tabs defaultTab="services" variant="underline">
                        <Tabs.List>
                            <Tabs.Tab value="services">Services</Tabs.Tab>
                            <Tabs.Tab value="process">Process</Tabs.Tab>
                            <Tabs.Tab value="faq">Questions</Tabs.Tab>
                        </Tabs.List>
                        <Tabs.Panels>
                            <Tabs.Panel value="services">
                                <div className="swiss-grid" style={{ rowGap: 28, marginTop: 8 }}>
                                    {SERVICES.map((s) => (
                                        <div key={s.no} className="swiss-cap" style={{ gridColumn: "span 3" }}>
                                            <span className="swiss-cap__no">{s.no}</span>
                                            <h3 className="swiss-cap__title">{s.title}</h3>
                                            <p className="swiss-cap__body">{s.body}</p>
                                        </div>
                                    ))}
                                </div>
                            </Tabs.Panel>

                            <Tabs.Panel value="process">
                                <div style={{ maxWidth: 640, marginTop: 12 }}>
                                    <Timeline
                                        events={[
                                            { date: "Week 0", title: "Discovery", description: "Goals, audience, constraints. A fixed-fee proposal with dates we hold.", color: "zinc" },
                                            { date: "Weeks 1–3", title: "Direction", description: "Two or three routes, explored to the point where a decision is real, not abstract.", color: "zinc" },
                                            { date: "Weeks 4–8", title: "System", description: "The chosen direction built into a documented, reusable system.", color: "violet" },
                                            { date: "Handoff", title: "Handoff", description: "Source files, guidelines, and a working session so your team owns it.", color: "zinc" },
                                        ]}
                                    />
                                </div>
                            </Tabs.Panel>

                            <Tabs.Panel value="faq">
                                <div style={{ maxWidth: 720, marginTop: 4 }}>
                                    <Accordion type="single" defaultOpen={["q0"]}>
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
                <section className="swiss-section" aria-labelledby="sw-about">
                    <div className="swiss-grid">
                        <div style={{ gridColumn: "1 / span 3" }}>
                            <div className="swiss-eyebrow"><span><b>03</b> — About</span></div>
                        </div>
                        <div style={{ gridColumn: "4 / span 7" }}>
                            <p style={{ fontSize: "clamp(1.15rem, 2vw, 1.55rem)", lineHeight: 1.45, fontWeight: 500, letterSpacing: "-0.01em", color: "var(--fg-1)", margin: 0 }}>
                                We believe the best design is mostly invisible — a grid you never notice, type that
                                reads before you register it, a system that quietly holds.
                            </p>
                            <Text as="p" size="md" color="muted" className="!mt-5 !leading-relaxed">
                                FIELDWORK began in 2016 as two people and a shared dislike of decoration for its own
                                sake. We've grown carefully since — eight people now, still small enough that the
                                people you meet are the people who do the work. We take a handful of projects at a
                                time and give each our full attention.
                            </Text>
                        </div>
                    </div>
                </section>

                {/* ── Team ──────────────────────────────────────────────────── */}
                <section className="swiss-section" aria-labelledby="sw-team">
                    <div className="swiss-eyebrow"><span><b>04</b> — People</span></div>
                    <Heading as="h2" size="2xl" weight="semibold" className="swiss-h2" style={{ margin: "10px 0 26px" }}>
                        The studio.
                    </Heading>
                    <div className="swiss-grid" style={{ rowGap: 24 }}>
                        {TEAM.map((m) => (
                            <div key={m.name} style={{ gridColumn: "span 3", borderTop: "1px solid var(--border-1)", paddingTop: 18 }}>
                                <Avatar fallback={m.initials} size="lg" />
                                <div style={{ marginTop: 14, fontWeight: 600, fontSize: 15, letterSpacing: "-0.01em", color: "var(--fg-1)" }}>
                                    {m.name}
                                </div>
                                <div className="swiss-meta" style={{ marginTop: 2 }}>{m.role}</div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* ── Awards + clients ──────────────────────────────────────── */}
                <section className="swiss-section" aria-labelledby="sw-recognition">
                    <div className="swiss-grid" style={{ rowGap: 32 }}>
                        <div style={{ gridColumn: "1 / span 7" }}>
                            <div className="swiss-eyebrow"><span><b>05</b> — Recognition</span></div>
                            <Heading as="h2" size="lg" weight="semibold" className="!mt-3 !mb-4">
                                Selected awards
                            </Heading>
                            <Table>
                                <Table.Head>
                                    <Table.Column label="Year" />
                                    <Table.Column label="Project" />
                                    <Table.Column label="Award" />
                                </Table.Head>
                                <Table.Body>
                                    {PROJECTS.filter((p) => p.award).map((p) => (
                                        <Table.Row key={p.num}>
                                            <Table.Cell className="!font-[var(--font-mono)] !text-[var(--fg-3)]">{p.year}</Table.Cell>
                                            <Table.Cell className="!font-medium !text-[var(--fg-1)]">{p.title}</Table.Cell>
                                            <Table.Cell className="!text-[var(--fg-2)]">{p.award}</Table.Cell>
                                        </Table.Row>
                                    ))}
                                    <Table.Row>
                                        <Table.Cell className="!font-[var(--font-mono)] !text-[var(--fg-3)]">2023</Table.Cell>
                                        <Table.Cell className="!font-medium !text-[var(--fg-1)]">Studio</Table.Cell>
                                        <Table.Cell className="!text-[var(--fg-2)]">Type Directors Club, Certificate of Excellence</Table.Cell>
                                    </Table.Row>
                                </Table.Body>
                            </Table>
                        </div>

                        <div style={{ gridColumn: "9 / span 4" }}>
                            <div className="swiss-eyebrow"><span>Selected clients</span></div>
                            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 14 }}>
                                {CLIENTS.map((c) => (
                                    <Badge key={c} color="zinc" variant="soft" size="md">{c}</Badge>
                                ))}
                            </div>
                            <Separator className="!my-6" />
                            <div className="swiss-eyebrow"><span>Press</span></div>
                            <ul style={{ listStyle: "none", margin: "14px 0 0", padding: 0 }}>
                                <li className="swiss-meta swiss-meta--fg1">It&apos;s Nice That — Studio of the week</li>
                                <li className="swiss-meta" style={{ marginTop: 6 }}>Eye Magazine №112</li>
                                <li className="swiss-meta" style={{ marginTop: 6 }}>Slanted — Type in the wild</li>
                            </ul>
                        </div>
                    </div>
                </section>

                {/* ── Brief / contact CTA ───────────────────────────────────── */}
                <section className="swiss-section" id="contact" aria-labelledby="sw-contact">
                    <div className="swiss-grid" style={{ rowGap: 32 }}>
                        <div style={{ gridColumn: "1 / span 5" }}>
                            <div className="swiss-eyebrow"><span><b>06</b> — Contact</span></div>
                            <Heading as="h2" size="2xl" weight="semibold" className="swiss-h2" style={{ margin: "10px 0 18px" }}>
                                Tell us about the work.
                            </Heading>
                            <p className="swiss-lede" style={{ fontSize: "1rem" }}>
                                A few sentences is plenty to start. We reply to every brief within two working days.
                            </p>
                            <div className="swiss-meta swiss-meta--fg1" style={{ marginTop: 24 }}>studio@fieldwork.example</div>
                            <div className="swiss-meta" style={{ marginTop: 4 }}>+41 44 000 00 00</div>

                            <div style={{ marginTop: 26 }}>
                                <div className="swiss-eyebrow"><span>Indicative budget</span></div>
                                <Text as="p" size="sm" color="muted" className="!mt-2 !mb-3 !max-w-[34ch]">
                                    Set a rough budget and how firm it is — drag along for the figure, up for confidence. It only
                                    helps us scope; nothing's binding.
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
                                    color="var(--accent)"
                                />
                                <div className="swiss-meta" style={{ marginTop: 10 }}>
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

                        <div style={{ gridColumn: "7 / span 6" }}>
                            <Card variant="outlined" padding="none" className="!rounded-xl">
                                <Card.Header className="!px-5 !py-4">
                                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                        <span style={{ fontWeight: 600, fontSize: 14 }}>New brief</span>
                                        <Tooltip content="We read every brief — no bots.">
                                            <Badge color="emerald" variant="soft" size="sm" dot>Open for Q3</Badge>
                                        </Tooltip>
                                    </div>
                                </Card.Header>
                                <Card.Body className="!px-5 !py-4">
                                    {submitted ? (
                                        <div style={{ padding: "28px 4px", textAlign: "left" }}>
                                            <Badge color="emerald" variant="soft" size="md">Received</Badge>
                                            <p style={{ marginTop: 14, fontSize: 15, color: "var(--fg-1)", lineHeight: 1.5 }}>
                                                Thanks — your brief is in. We&apos;ll reply within two working days.
                                            </p>
                                            <Button variant="ghost" color="zinc" className="!mt-4" icon="arrow-left" onClick={() => { setSubmitted(false); setBrief(""); }}>
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
                                                className="!border-0 !rounded-none"
                                            />
                                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 8 }}>
                                                <Text as="span" size="xs" color="muted">
                                                    {brief.trim().length} characters
                                                </Text>
                                                <Progress
                                                    value={Math.min(brief.trim().length, 160)}
                                                    max={160}
                                                    variant="bar"
                                                    size="sm"
                                                    color="violet"
                                                    className="!w-40"
                                                />
                                            </div>
                                        </>
                                    )}
                                </Card.Body>
                                {!submitted && (
                                    <Card.Footer className="!px-5 !py-3">
                                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                            <Text as="span" size="xs" color="muted">No NDA needed to say hello.</Text>
                                            <Button
                                                color="zinc"
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
                    </div>
                </section>

                {/* ── Footer ────────────────────────────────────────────────── */}
                <footer className="swiss-footer">
                    <div
                        style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "flex-start",
                            flexWrap: "wrap",
                            gap: 24,
                        }}
                    >
                        <div>
                            <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                                <span
                                    className="brand-gradient"
                                    style={{ width: 22, height: 22, borderRadius: 6, display: "grid", placeItems: "center", color: "#fff", fontWeight: 700, fontSize: 12 }}
                                    aria-hidden
                                >
                                    F
                                </span>
                                <span style={{ fontWeight: 600, fontSize: 14 }}>FIELDWORK</span>
                            </div>
                            <p className="swiss-meta" style={{ marginTop: 12, maxWidth: 320 }}>
                                A graphic design studio. Zürich and Lisbon. Working in brand, editorial, product, and
                                motion since 2016.
                            </p>
                        </div>
                        <div className="swiss-meta" style={{ display: "grid", gridTemplateColumns: "repeat(2, auto)", gap: "4px 40px" }}>
                            <a href="#work" style={{ color: "inherit", textDecoration: "none" }}>Work ↗</a>
                            <a href="https://fieldwork.example" target="_blank" rel="noopener noreferrer" style={{ color: "inherit", textDecoration: "none" }}>Instagram ↗</a>
                            <a href="#contact" style={{ color: "inherit", textDecoration: "none" }}>Contact ↗</a>
                            <a href="https://fieldwork.example" target="_blank" rel="noopener noreferrer" style={{ color: "inherit", textDecoration: "none" }}>LinkedIn ↗</a>
                        </div>
                    </div>

                    <hr className="swiss-rule" style={{ margin: "28px 0 16px" }} />

                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
                        <span className="swiss-meta">FIELDWORK — a fictional studio, for demonstration · Style {style.num} / Swiss</span>
                        <Link
                            href="/inspiration"
                            style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 500, color: "var(--accent)", textDecoration: "none" }}
                        >
                            <ArrowLeft size={14} />
                            Back to the gallery
                            <ArrowUpRight size={13} style={{ opacity: 0 }} aria-hidden />
                        </Link>
                    </div>
                </footer>
            </div>
        </div>
    );
}
