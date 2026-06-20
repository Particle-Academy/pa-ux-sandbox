import "./cursor.css";

import { Link } from "@inertiajs/react";
import { useEffect, useRef, useState, type CSSProperties } from "react";
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
 * Inspiration Gallery · Style — Cursor.
 *
 * FIELDWORK (a fictional design + dev studio) rendered as a "custom cursor and
 * hover-reveal world": a graphite near-black canvas with a single electric-lime
 * accent, where the pointer is replaced by a soft following ring + dot, content
 * and project thumbnails are REVEALED on hover, and the primary buttons feel
 * magnetic (they lean toward the cursor). The whole tree is wrapped in
 * `.insp-cursor`, which carries its OWN dark palette (re-pointing the shared
 * semantic tokens) so the surface reads near-black regardless of the host theme
 * — and so it never collides with Tailwind's `.dark`. The Fancy primitives are
 * restyled HARD via scoped CSS + `cs-*` classes so they wear this idiom natively.
 *
 * Mounted by Inspiration/Show.tsx for `style.id === "cursor"`. SSR-safe: the
 * cursor + magnetism effects mount in useEffect and guard `window`; every
 * interactive bit is controlled React state. Inner links use the stretched-link
 * pattern (one <Link> per row) so no anchor is ever nested inside another anchor
 * (avoids React #418 under SSR).
 */

type Project = {
    num: string;
    title: string;
    discipline: string;
    year: string;
    client: string;
    glyph: string;
    hue: string;
    award?: string;
};

const PROJECTS: Project[] = [
    { num: "01", title: "Lumen", discipline: "Brand system, product UI", year: "2025", client: "Lumen Compute", glyph: "L", hue: "180", award: "Awwwards SOTD" },
    { num: "02", title: "Drift", discipline: "Motion identity, web", year: "2025", client: "Drift Audio", glyph: "D", hue: "92" },
    { num: "03", title: "Quill", discipline: "Editorial platform, type", year: "2025", client: "Quill Press", glyph: "Q", hue: "32", award: "FWA of the Day" },
    { num: "04", title: "Pulse", discipline: "Design engineering", year: "2024", client: "Pulse Robotics", glyph: "P", hue: "312" },
    { num: "05", title: "Halo", discipline: "Web app, data viz", year: "2024", client: "Halo Analytics", glyph: "H", hue: "210", award: "CSS Design Awards" },
    { num: "06", title: "Stride", discipline: "Product, prototyping", year: "2024", client: "Stride Mobility", glyph: "S", hue: "140" },
];

const SERVICES = [
    { no: "01", title: "Brand systems", body: "Identity, naming, voice, and the rules that keep a brand coherent as it scales — built as a system, never a one-off logo.", tags: ["Identity", "Voice", "Tokens"] },
    { no: "02", title: "Product design", body: "Research, flows, and high-fidelity interface design — from a fixed-fee discovery to production-ready, agent-driveable screens.", tags: ["UX", "UI", "Prototype"] },
    { no: "03", title: "Design engineering", body: "We ship the design. Front-end in React + Tailwind, component libraries, and the bridges that let agents inhabit the surface.", tags: ["React", "Tailwind", "Human+"] },
    { no: "04", title: "Motion & interaction", body: "Cursor behaviour, hover-reveal, micro-interaction. The rhythm and feel that make a product memorable in the hand.", tags: ["Motion", "Feel", "Interaction"] },
];

const TEAM = [
    { name: "Noor Adeyemi", role: "Founder · Interaction director", initials: "NA" },
    { name: "Eli Park", role: "Design engineering lead", initials: "EP" },
    { name: "Mara Voss", role: "Product & systems", initials: "MV" },
    { name: "Juno Kato", role: "Motion & feel", initials: "JK" },
];

const CLIENTS = ["Lumen", "Drift", "Quill", "Pulse", "Halo", "Stride", "Beacon", "Forge", "Vela"];

const FAQ = [
    { q: "How do you scope an engagement?", a: "Every project opens with a short, paid discovery — goals, constraints, and a fixed-fee proposal with dates we hold. No open-ended retainers unless you want one." },
    { q: "Do you build, or just design?", a: "Both. We're a design + engineering studio — most work ships as production React. Take the design and run, or we ship it end to end." },
    { q: "What makes the work feel different?", a: "Feel. We treat the pointer, the hover, and the in-between moments as first-class — the parts most teams leave on the table — without sacrificing legibility or speed." },
    { q: "Can agents drive what you build?", a: "Yes. We build to the Human+ contract — controlled state, stable handles, MCP bridges — so an assistant can read and drive the same surface a person uses." },
];

const PER_PAGE = 4;

export default function Cursor({ style }: { style: Style }) {
    const [page, setPage] = useState(1);
    const [tags, setTags] = useState<string[]>(["Brand systems", "Motion"]);
    const [budget, setBudget] = useState(60);
    const [budgetConfidence, setBudgetConfidence] = useState(0.64);
    const [brief, setBrief] = useState("");
    const [submitted, setSubmitted] = useState(false);

    const rootRef = useRef<HTMLDivElement | null>(null);

    const totalPages = Math.ceil(PROJECTS.length / PER_PAGE);
    const pageProjects = PROJECTS.slice((page - 1) * PER_PAGE, page * PER_PAGE);
    const featured = PROJECTS.slice(0, 3);

    /* ── Custom cursor + magnetic buttons (SSR-safe: useEffect, guard window) ──
       A soft following ring + a tight dot lerp toward the real pointer. Elements
       tagged [data-cursor="hover"] swell the ring; [data-magnetic] elements lean
       toward the cursor. Everything is pointer-fine + reduced-motion gated and
       fully torn down on unmount. */
    useEffect(() => {
        if (typeof window === "undefined") {
            return;
        }
        const root = rootRef.current;
        if (!root) {
            return;
        }
        const fine = window.matchMedia("(pointer: fine)");
        const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
        if (!fine.matches) {
            return;
        }

        const ring = document.createElement("div");
        ring.className = "cs-cursor cs-cursor--ring";
        const dot = document.createElement("div");
        dot.className = "cs-cursor cs-cursor--dot";
        root.appendChild(ring);
        root.appendChild(dot);
        root.classList.add("cs-cursor-on");

        const rootRect = () => root.getBoundingClientRect();
        let rx = window.innerWidth / 2;
        let ry = window.innerHeight / 2;
        let tx = rx;
        let ty = ry;
        let raf = 0;

        const onMove = (e: MouseEvent) => {
            tx = e.clientX;
            ty = e.clientY;
            const r = rootRect();
            const inside = e.clientY >= r.top && e.clientY <= r.bottom && e.clientX >= r.left && e.clientX <= r.right;
            root.classList.toggle("cs-cursor-active", inside);

            // Magnetism: nudge magnetic targets toward the pointer.
            const targets = root.querySelectorAll<HTMLElement>("[data-magnetic]");
            targets.forEach((el) => {
                const b = el.getBoundingClientRect();
                const cx = b.left + b.width / 2;
                const cy = b.top + b.height / 2;
                const dx = e.clientX - cx;
                const dy = e.clientY - cy;
                const dist = Math.hypot(dx, dy);
                const radius = 90;
                if (dist < radius && !reduce.matches) {
                    const pull = (1 - dist / radius) * 0.4;
                    el.style.transform = `translate(${dx * pull}px, ${dy * pull}px)`;
                } else {
                    el.style.transform = "";
                }
            });
        };

        const onOver = (e: MouseEvent) => {
            const t = (e.target as HTMLElement | null)?.closest('[data-cursor="hover"]');
            ring.classList.toggle("is-hover", Boolean(t));
        };

        const tick = () => {
            const ease = reduce.matches ? 1 : 0.18;
            rx += (tx - rx) * ease;
            ry += (ty - ry) * ease;
            ring.style.transform = `translate(${rx}px, ${ry}px) translate(-50%, -50%)`;
            dot.style.transform = `translate(${tx}px, ${ty}px) translate(-50%, -50%)`;
            raf = window.requestAnimationFrame(tick);
        };

        window.addEventListener("mousemove", onMove, { passive: true });
        window.addEventListener("mouseover", onOver, { passive: true });
        raf = window.requestAnimationFrame(tick);

        return () => {
            window.cancelAnimationFrame(raf);
            window.removeEventListener("mousemove", onMove);
            window.removeEventListener("mouseover", onOver);
            root.classList.remove("cs-cursor-on", "cs-cursor-active");
            ring.remove();
            dot.remove();
            root.querySelectorAll<HTMLElement>("[data-magnetic]").forEach((el) => {
                el.style.transform = "";
            });
        };
    }, []);

    return (
        <div className="insp-cursor" ref={rootRef}>
            <div className="cs-shell">
                {/* ── Running head ──────────────────────────────────────────── */}
                <div className="cs-head">
                    <Breadcrumbs>
                        <Breadcrumbs.Item href="/inspiration">Inspiration</Breadcrumbs.Item>
                        <Breadcrumbs.Item active>Cursor</Breadcrumbs.Item>
                    </Breadcrumbs>
                    <div className="cs-mark" data-cursor="hover">
                        <span className="cs-mark__logo" aria-hidden>F</span>
                        <span className="cs-mark__name">FIELDWORK</span>
                        <Badge className="cs-tag" size="sm">est. 2018</Badge>
                    </div>
                    <nav className="cs-headnav" aria-label="Studio">
                        <a href="#work" data-cursor="hover">Work</a>
                        <a href="#studio" data-cursor="hover">Studio</a>
                        <a href="#contact" data-cursor="hover">Contact</a>
                    </nav>
                </div>
                <hr className="cs-rule" />

                {/* ── Hero ──────────────────────────────────────────────────── */}
                <section className="cs-section cs-hero" aria-labelledby="cs-hero">
                    <div className="cs-grid" style={{ rowGap: 36 }}>
                        <div data-cs-col style={{ gridColumn: "1 / span 9" }}>
                            <div className="cs-eyebrow"><b>00</b>&nbsp;Index — interaction &amp; design studio</div>
                            <h1 id="cs-hero" className="cs-display" style={{ marginTop: 26 }}>
                                We design the <span className="cs-accent" data-cursor="hover">moment</span> between intent and action.
                            </h1>
                            <p className="cs-lede" style={{ marginTop: 26 }}>
                                FIELDWORK is a small studio obsessed with feel — the pointer, the hover, the half-second
                                before something happens. We build interfaces humans and agents share, and make them a
                                pleasure to inhabit.
                            </p>
                            <div className="cs-cta-row">
                                <span className="cs-magnet" data-magnetic>
                                    <Button className="cs-btn-primary" href="#contact" iconTrailing="arrow-right" data-cursor="hover">
                                        Start a project
                                    </Button>
                                </span>
                                <span className="cs-magnet" data-magnetic>
                                    <Button className="cs-btn-ghost" href="#work" iconTrailing="arrow-down" data-cursor="hover">
                                        See selected work
                                    </Button>
                                </span>
                            </div>
                            <div className="cs-hint">
                                <span className="cs-hint__dot" aria-hidden /> Move your cursor — the studio responds.
                            </div>
                        </div>
                        <div data-cs-col style={{ gridColumn: "11 / span 2" }}>
                            <div className="cs-hero__aside">
                                <span className="cs-availability">
                                    <span className="dot" /> Open · Q3 2026
                                </span>
                                <Separator className="!my-1" />
                                <div className="cs-meta">
                                    Lisbon · Remote
                                    <br />
                                    38.72° N, 9.14° W
                                </div>
                                <Separator className="!my-1" />
                                <div className="cs-meta">
                                    Brand systems
                                    <br />
                                    Product design
                                    <br />
                                    Design engineering
                                    <br />
                                    Motion &amp; feel
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* ── Client ticker ─────────────────────────────────────────── */}
                <div className="cs-ticker" aria-label="Selected clients">
                    <div className="cs-ticker__track">
                        {[...CLIENTS, ...CLIENTS].map((c, i) => (
                            <span key={`${c}-${i}`} className="cs-ticker__item">
                                {c}
                                <span className="cs-ticker__sep" aria-hidden> ✦ </span>
                            </span>
                        ))}
                    </div>
                </div>

                {/* ── Figures band ──────────────────────────────────────────── */}
                <section className="cs-section" aria-label="Studio in numbers">
                    <div className="cs-grid" style={{ rowGap: 32 }}>
                        {[
                            { num: "2018", label: "Founded", em: false },
                            { num: "160", suffix: "+", label: "Projects shipped" },
                            { num: "07", label: "People" },
                            { num: "11", label: "Awards", em: true },
                        ].map((f) => (
                            <div key={f.label} data-cs-col className="cs-figure" style={{ gridColumn: "span 3" }} data-cursor="hover">
                                <div className="cs-figure__num">
                                    {f.em ? <em>{f.num}</em> : f.num}
                                    {f.suffix ? <em>{f.suffix}</em> : null}
                                </div>
                                <div className="cs-figure__label">{f.label}</div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* ── Capabilities ──────────────────────────────────────────── */}
                <section className="cs-section" id="studio" aria-labelledby="cs-cap">
                    <div className="cs-eyebrow"><b>01</b>&nbsp;Capabilities</div>
                    <Heading as="h2" size="2xl" weight="semibold" className="cs-h2" id="cs-cap" style={{ margin: "14px 0 30px" }}>
                        Four disciplines, one cursor.
                    </Heading>
                    <div className="cs-grid" style={{ rowGap: 0 }}>
                        {SERVICES.map((s) => (
                            <div key={s.no} data-cs-col className="cs-cap" style={{ gridColumn: "span 3" }} data-cursor="hover">
                                <span className="cs-cap__no">{s.no}</span>
                                <h3 className="cs-cap__title">{s.title}</h3>
                                <p className="cs-cap__body">{s.body}</p>
                                <div className="cs-cap__tags">
                                    {s.tags.map((t) => (
                                        <Badge key={t} className="cs-tag" size="sm">{t}</Badge>
                                    ))}
                                </div>
                                <span className="cs-cap__reveal" aria-hidden>↗</span>
                            </div>
                        ))}
                    </div>
                </section>

                {/* ── Featured work — hover-reveal cards ────────────────────── */}
                <section className="cs-section" id="work" aria-labelledby="cs-feat">
                    <div className="cs-sec-head">
                        <div>
                            <div className="cs-eyebrow"><b>02</b>&nbsp;Featured</div>
                            <Heading as="h2" size="2xl" weight="semibold" className="cs-h2" id="cs-feat" style={{ marginTop: 14 }}>
                                Three recent builds.
                            </Heading>
                        </div>
                        <Badge className="cs-tag cs-tag--accent" size="md" dot>Hover to reveal</Badge>
                    </div>

                    <div className="cs-grid" style={{ rowGap: 28 }}>
                        {featured.map((p) => (
                            <div
                                key={p.num}
                                data-cs-col
                                className="cs-preview"
                                style={{ gridColumn: "span 4", "--hue": p.hue } as CSSProperties}
                                data-cursor="hover"
                            >
                                <Link
                                    href="/inspiration/cursor#work"
                                    className="cs-stretch"
                                    aria-label={`${p.title} — ${p.discipline}`}
                                />
                                <div className="cs-preview__canvas">
                                    <div className="cs-preview__grid" aria-hidden />
                                    <div className="cs-preview__glyph">
                                        {p.glyph}
                                        <span>.</span>
                                    </div>
                                    <div className="cs-preview__reveal" aria-hidden>
                                        <span>View case</span>
                                        <ArrowUpRight size={16} />
                                    </div>
                                </div>
                                <div className="cs-preview__meta">
                                    <div>
                                        <div className="cs-preview__title">{p.title}</div>
                                        <div className="cs-preview__disc">{p.discipline}</div>
                                    </div>
                                    {p.award ? (
                                        <Badge className="cs-tag cs-tag--accent" size="sm">{p.award}</Badge>
                                    ) : (
                                        <span className="cs-meta">{p.year} ↗</span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* ── Selected work — hover-reveal index ────────────────────── */}
                <section className="cs-section" aria-labelledby="cs-index">
                    <div className="cs-sec-head">
                        <div>
                            <div className="cs-eyebrow"><b>03</b>&nbsp;Selected work</div>
                            <Heading as="h2" size="2xl" weight="semibold" className="cs-h2" id="cs-index" style={{ marginTop: 14 }}>
                                The full index.
                            </Heading>
                        </div>
                        <Pillbox
                            value={tags}
                            onChange={setTags}
                            placeholder="Filter by discipline…"
                            className="cs-input !w-72"
                            aria-label="Filter work by discipline"
                        />
                    </div>

                    <div className="cs-index">
                        {pageProjects.map((p) => (
                            <div key={p.num} className="cs-index__row" style={{ "--hue": p.hue } as CSSProperties}>
                                <Link
                                    href="/inspiration/cursor#work"
                                    className="cs-stretch"
                                    aria-label={`${p.title} — ${p.discipline}`}
                                />
                                <span className="cs-index__num">{p.num}</span>
                                <span className="cs-index__title">{p.title}</span>
                                <span className="cs-index__disc">{p.discipline}</span>
                                <span className="cs-index__year">{p.year} <ArrowUpRight size={13} aria-hidden /></span>
                                <span className="cs-index__peek" aria-hidden>{p.glyph}</span>
                            </div>
                        ))}
                    </div>

                    <div className="cs-index-foot">
                        <span className="cs-meta">
                            Showing {(page - 1) * PER_PAGE + 1}–{Math.min(page * PER_PAGE, PROJECTS.length)} of {PROJECTS.length}
                        </span>
                        <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
                    </div>
                </section>

                {/* ── How we work (tabs) ────────────────────────────────────── */}
                <section className="cs-section" aria-labelledby="cs-how">
                    <div className="cs-eyebrow"><b>04</b>&nbsp;How we work</div>
                    <Heading as="h2" size="2xl" weight="semibold" className="cs-h2" id="cs-how" style={{ margin: "14px 0 26px" }}>
                        From brief to feel.
                    </Heading>

                    <Tabs defaultTab="process" variant="underline" className="cs-tabs">
                        <Tabs.List>
                            <Tabs.Tab value="process">Process</Tabs.Tab>
                            <Tabs.Tab value="principles">Principles</Tabs.Tab>
                            <Tabs.Tab value="faq">Questions</Tabs.Tab>
                        </Tabs.List>
                        <Tabs.Panels>
                            <Tabs.Panel value="process">
                                <div style={{ maxWidth: 680, marginTop: 18 }}>
                                    <Timeline
                                        className="cs-timeline"
                                        events={[
                                            { date: "Week 0", title: "Discovery", description: "Goals, audience, constraints. A fixed-fee proposal with dates we hold.", color: "zinc" },
                                            { date: "Weeks 1–3", title: "Direction", description: "Two or three routes, explored until a decision is real rather than abstract.", color: "zinc" },
                                            { date: "Weeks 4–8", title: "System & feel", description: "The chosen direction built into a documented system — then tuned for feel and shipped as production React.", color: "lime" },
                                            { date: "Handoff", title: "Handoff", description: "Source, tokens, and a working session so your team owns it — agent-driveable by default.", color: "zinc" },
                                        ]}
                                    />
                                </div>
                            </Tabs.Panel>

                            <Tabs.Panel value="principles">
                                <div className="cs-grid" style={{ rowGap: 0, marginTop: 14 }}>
                                    {[
                                        { no: "P1", title: "Feel is a feature", body: "The half-second between intent and action is where products earn affection. We design it on purpose." },
                                        { no: "P2", title: "Systems, not screens", body: "We deliver the rules that keep things coherent as they scale — not a folder of one-off comps." },
                                        { no: "P3", title: "Design that ships", body: "Design and engineering in one team, so what we draw is what goes to production. No fidelity lost in handoff." },
                                        { no: "P4", title: "Human+ by default", body: "Controlled state, stable handles, MCP bridges. The surfaces we build can be driven by people and agents alike." },
                                    ].map((p) => (
                                        <div key={p.no} data-cs-col className="cs-cap" style={{ gridColumn: "span 6" }} data-cursor="hover">
                                            <span className="cs-cap__no">{p.no}</span>
                                            <h3 className="cs-cap__title">{p.title}</h3>
                                            <p className="cs-cap__body">{p.body}</p>
                                        </div>
                                    ))}
                                </div>
                            </Tabs.Panel>

                            <Tabs.Panel value="faq">
                                <div style={{ maxWidth: 760, marginTop: 10 }}>
                                    <Accordion type="single" defaultOpen={["q0"]} className="cs-accordion">
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
                <section className="cs-section" aria-labelledby="cs-about">
                    <div className="cs-grid">
                        <div data-cs-col style={{ gridColumn: "1 / span 3" }}>
                            <div className="cs-eyebrow"><b>05</b>&nbsp;Studio</div>
                        </div>
                        <div data-cs-col style={{ gridColumn: "4 / span 8" }}>
                            <p className="cs-quote">
                                We think the best interface is something you <b>feel</b> before you read — a cursor that
                                follows, a surface that leans in, a system that quietly holds for the person and the agent
                                both.
                            </p>
                            <Text as="p" size="md" color="muted" className="!mt-6 !leading-relaxed">
                                FIELDWORK started in 2018 as two people who wanted to both design and build — and who
                                couldn't stop fiddling with the in-between moments. We've stayed small on purpose: seven
                                people now, still small enough that the people you meet are the people who do the work.
                            </Text>
                        </div>
                    </div>
                </section>

                {/* ── Team ──────────────────────────────────────────────────── */}
                <section className="cs-section" aria-labelledby="cs-team">
                    <div className="cs-eyebrow"><b>06</b>&nbsp;People</div>
                    <Heading as="h2" size="2xl" weight="semibold" className="cs-h2" id="cs-team" style={{ margin: "14px 0 30px" }}>
                        The studio.
                    </Heading>
                    <div className="cs-grid" style={{ rowGap: 28 }}>
                        {TEAM.map((m) => (
                            <div key={m.name} data-cs-col className="cs-person" style={{ gridColumn: "span 3" }} data-cursor="hover">
                                <Avatar fallback={m.initials} size="lg" />
                                <div className="cs-person__name">{m.name}</div>
                                <div className="cs-meta cs-person__role">{m.role}</div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* ── Recognition + clients ─────────────────────────────────── */}
                <section className="cs-section" aria-labelledby="cs-recog">
                    <div className="cs-grid" style={{ rowGap: 36 }}>
                        <div data-cs-col style={{ gridColumn: "1 / span 7" }}>
                            <div className="cs-eyebrow"><b>07</b>&nbsp;Recognition</div>
                            <Heading as="h2" size="lg" weight="semibold" id="cs-recog" className="!mt-4 !mb-5" style={{ color: "var(--c-ink)" }}>
                                Selected awards
                            </Heading>
                            <div className="cs-table">
                                <Table>
                                    <Table.Head>
                                        <Table.Column label="Year" />
                                        <Table.Column label="Project" />
                                        <Table.Column label="Award" />
                                    </Table.Head>
                                    <Table.Body>
                                        {PROJECTS.filter((p) => p.award).map((p) => (
                                            <Table.Row key={p.num}>
                                                <Table.Cell className="!font-[var(--font-mono)]">{p.year}</Table.Cell>
                                                <Table.Cell className="!font-medium">{p.title}</Table.Cell>
                                                <Table.Cell>{p.award}</Table.Cell>
                                            </Table.Row>
                                        ))}
                                        <Table.Row>
                                            <Table.Cell className="!font-[var(--font-mono)]">2023</Table.Cell>
                                            <Table.Cell className="!font-medium">Studio</Table.Cell>
                                            <Table.Cell>Communication Arts — Interactive, shortlist</Table.Cell>
                                        </Table.Row>
                                    </Table.Body>
                                </Table>
                            </div>
                        </div>

                        <div data-cs-col style={{ gridColumn: "9 / span 4" }}>
                            <div className="cs-eyebrow">Selected clients</div>
                            <div className="cs-client-wrap">
                                {CLIENTS.map((c) => (
                                    <Badge key={c} className="cs-tag" size="md">{c}</Badge>
                                ))}
                            </div>
                            <Separator className="!my-7" />
                            <div className="cs-eyebrow">Press</div>
                            <ul className="cs-press">
                                <li className="cs-meta cs-meta--ink">Smashing Magazine — On feel &amp; the cursor</li>
                                <li className="cs-meta">The Index №34 — Interaction studios</li>
                                <li className="cs-meta">Motion &amp; Grids — In the wild</li>
                            </ul>
                        </div>
                    </div>
                </section>

                {/* ── Brief / contact ───────────────────────────────────────── */}
                <section className="cs-section" id="contact" aria-labelledby="cs-contact">
                    <div className="cs-grid" style={{ rowGap: 36 }}>
                        <div data-cs-col className="cs-brief-aside" style={{ gridColumn: "1 / span 5" }}>
                            <div className="cs-eyebrow"><b>08</b>&nbsp;Contact</div>
                            <Heading as="h2" size="2xl" weight="semibold" className="cs-h2" id="cs-contact" style={{ margin: "14px 0 20px" }}>
                                Tell us about the work.
                            </Heading>
                            <p className="cs-lede" style={{ fontSize: "1rem" }}>
                                A few sentences is plenty to start. We reply to every brief within two working days.
                            </p>
                            <div className="cs-contact-line" data-cursor="hover">studio@fieldwork.example</div>
                            <div className="cs-contact-sub">+351 21 000 0000</div>

                            <div style={{ marginTop: 30 }}>
                                <div className="cs-eyebrow">Indicative budget</div>
                                <Text as="p" size="sm" color="muted" className="!mt-3 !mb-4 !max-w-[36ch]">
                                    Set a rough budget and how firm it is — drag along for the figure, up for confidence.
                                    It only helps us scope; nothing's binding.
                                </Text>
                                <MoodMeter
                                    min={15}
                                    max={220}
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
                                    color="var(--c-accent)"
                                />
                                <div className="cs-meta" style={{ marginTop: 12 }}>
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

                        <div data-cs-col style={{ gridColumn: "7 / span 6" }}>
                            <Card variant="outlined" padding="none" className="cs-card">
                                <Card.Header className="!px-5 !py-4">
                                    <div className="cs-card-head">
                                        <span className="cs-card-title">New brief</span>
                                        <Tooltip content="We read every brief — no bots.">
                                            <Badge className="cs-tag cs-tag--accent" size="sm" dot>Open for Q3</Badge>
                                        </Tooltip>
                                    </div>
                                </Card.Header>
                                <Card.Body className="!px-5 !py-4">
                                    {submitted ? (
                                        <div style={{ padding: "30px 4px" }}>
                                            <Badge className="cs-tag cs-tag--accent" size="md">Received</Badge>
                                            <p className="cs-card-msg">
                                                Thanks — your brief is in. We&apos;ll reply within two working days.
                                            </p>
                                            <Button
                                                className="cs-btn-ghost !mt-5"
                                                icon="arrow-left"
                                                data-cursor="hover"
                                                onClick={() => { setSubmitted(false); setBrief(""); }}
                                            >
                                                Write another
                                            </Button>
                                        </div>
                                    ) : (
                                        <div className="cs-composer">
                                            <Composer
                                                value={brief}
                                                onChange={setBrief}
                                                onSubmit={() => setBrief((b) => b)}
                                                placeholder="What are you building, and what's the deadline?"
                                                className="!border-0 !rounded-none"
                                            />
                                            <div className="cs-composer-foot">
                                                <Text as="span" size="xs" color="muted">
                                                    {brief.trim().length} characters
                                                </Text>
                                                <Progress
                                                    value={Math.min(brief.trim().length, 160)}
                                                    max={160}
                                                    variant="bar"
                                                    size="sm"
                                                    color="lime"
                                                    className="cs-progress !w-40"
                                                />
                                            </div>
                                        </div>
                                    )}
                                </Card.Body>
                                {!submitted && (
                                    <Card.Footer className="!px-5 !py-3">
                                        <div className="cs-card-foot">
                                            <Text as="span" size="xs" color="muted">No NDA needed to say hello.</Text>
                                            <span className="cs-magnet" data-magnetic>
                                                <Button
                                                    className="cs-btn-primary"
                                                    disabled={brief.trim().length < 12}
                                                    iconTrailing="arrow-right"
                                                    data-cursor="hover"
                                                    onClick={() => setSubmitted(true)}
                                                >
                                                    Send brief
                                                </Button>
                                            </span>
                                        </div>
                                    </Card.Footer>
                                )}
                            </Card>
                        </div>
                    </div>
                </section>

                {/* ── Footer ────────────────────────────────────────────────── */}
                <footer className="cs-footer">
                    <div className="cs-footer-top">
                        <div>
                            <div className="cs-mark">
                                <span className="cs-mark__logo" aria-hidden style={{ width: 22, height: 22, fontSize: 12 }}>F</span>
                                <span className="cs-mark__name">FIELDWORK</span>
                            </div>
                            <p className="cs-meta" style={{ marginTop: 14, maxWidth: 340 }}>
                                An interaction &amp; design studio. Lisbon, working remotely across European and North
                                American time zones. Chasing feel since 2018.
                            </p>
                        </div>
                        <div className="cs-footer__links">
                            <a href="#work" data-cursor="hover">Work ↗</a>
                            <a href="https://fieldwork.example" target="_blank" rel="noopener noreferrer" data-cursor="hover">Instagram ↗</a>
                            <a href="#contact" data-cursor="hover">Contact ↗</a>
                            <a href="https://fieldwork.example" target="_blank" rel="noopener noreferrer" data-cursor="hover">LinkedIn ↗</a>
                        </div>
                    </div>

                    <hr className="cs-rule" style={{ margin: "32px 0 18px" }} />

                    <div className="cs-footer-bottom">
                        <span className="cs-meta">FIELDWORK — a fictional studio, for demonstration · Style {style.num} / Cursor</span>
                        <Link href="/inspiration" className="cs-back" data-cursor="hover">
                            <ArrowLeft size={14} />
                            Back to the gallery
                        </Link>
                    </div>
                </footer>
            </div>
        </div>
    );
}
