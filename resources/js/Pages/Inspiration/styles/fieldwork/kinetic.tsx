import "./kinetic.css";

import { Link } from "@inertiajs/react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import {
    Accordion,
    Avatar,
    Badge,
    Breadcrumbs,
    Button,
    Callout,
    Card,
    Carousel,
    Composer,
    Heading,
    Marquee,
    Pagination,
    Pillbox,
    Progress,
    Separator,
    Table,
    Tabs,
    Text,
    Timeline,
    Tooltip,
} from "@particle-academy/react-fancy";
import { ArrowDownRight, ArrowLeft, ArrowUpRight, Play } from "lucide-react";
import type { Style } from "../../types";

/**
 * Inspiration Gallery · Style — Kinetic.
 *
 * FIELDWORK (a FICTIONAL design + motion studio) rendered as a scroll-driven,
 * kinetic portfolio: layered parallax in the hero, marquees + a live ticker
 * that scrolls horizontally as the page scrolls vertically, reveal-on-scroll
 * staggers section by section, and a magenta→cyan velocity gradient threaded
 * through every accent. The whole tree is wrapped in `.insp-kinetic`, which
 * carries its OWN near-black palette (re-pointing the shared semantic tokens)
 * so the surface reads dark regardless of the host light/dark theme — and so it
 * never collides with Tailwind's `.dark`.
 *
 * Motion is CSS-keyframe driven (gradient sweep, blink) plus a tiny SSR-safe
 * IntersectionObserver that toggles `.is-in` for reveal-on-scroll and a rAF
 * scroll listener for parallax + the scroll-velocity ticker. The hero + clients
 * marquees are the first-party react-fancy <Marquee> primitive (restyled via
 * kx-* classes); only the telemetry ticker stays hand-rolled, because its
 * scroll-velocity offset is bespoke. EVERYTHING respects
 * `prefers-reduced-motion`: the observer reveals immediately and the
 * scroll/parallax effects are disabled.
 *
 * Mounted by Inspiration/Show.tsx for `style.id === "kinetic"`. SSR-safe: no
 * module-level browser APIs; every browser effect lives in useEffect, and every
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
    runtime: string;
    award?: string;
};

const PROJECTS: Project[] = [
    { num: "01", title: "Velocity", discipline: "Motion identity, title system", year: "2025", client: "Velocity Films", glyph: "V", runtime: "02:14", award: "Awwwards SOTD" },
    { num: "02", title: "Slipstream", discipline: "Product UI, scroll choreography", year: "2025", client: "Slipstream Labs", glyph: "S", runtime: "01:48", award: "FWA of the Day" },
    { num: "03", title: "Afterburn", discipline: "Brand film, sound design", year: "2025", client: "Afterburn Audio", glyph: "A", runtime: "03:02" },
    { num: "04", title: "Parallax", discipline: "Web, layered motion", year: "2024", client: "Parallax Studio", glyph: "P", runtime: "02:33", award: "CSS Design Awards" },
    { num: "05", title: "Tilt-Shift", discipline: "Campaign, kinetic type", year: "2024", client: "Tilt Collective", glyph: "T", runtime: "01:12" },
    { num: "06", title: "Overdrive", discipline: "Identity, motion system", year: "2024", client: "Overdrive Co.", glyph: "O", runtime: "02:57" },
];

const SERVICES = [
    { no: "01", title: "Motion identity", body: "Logos that move, title systems, and the timing rules that keep a brand alive in 24 frames a second — delivered as a kit, not a one-off.", tags: ["After Effects", "Lottie", "WebGL"] },
    { no: "02", title: "Scroll choreography", body: "The page is the timeline and scroll is the playhead. We storyboard reveals, parallax, and pinned scenes that feel inevitable.", tags: ["GSAP", "ScrollTimeline", "SVG"] },
    { no: "03", title: "Brand film & sound", body: "End-to-end films — direction, edit, score, and sound design — built so the cut and the soundtrack land on the same frame.", tags: ["Direction", "Edit", "Score"] },
    { no: "04", title: "Kinetic product UI", body: "Interface motion for software teams: spring physics, gesture feedback, and a motion spec your engineers can actually ship.", tags: ["Springs", "Tokens", "Specs"] },
];

const TEAM = [
    { name: "Mara Quist", role: "Founder, motion director", initials: "MQ" },
    { name: "Devon Reyes", role: "Scroll & interaction", initials: "DR" },
    { name: "Inès Carraro", role: "Film & sound", initials: "IC" },
    { name: "Kojo Mensah", role: "WebGL & systems", initials: "KM" },
];

const CLIENTS = ["Velocity", "Slipstream", "Afterburn", "Parallax", "Tilt", "Overdrive", "Northwind", "Studio Føn", "Halcyon", "Cinder"];

const PRESS = ["FWA — Site of the Day", "Awwwards — SOTD ×3", "Motionographer feature", "It's Nice That — Studio spotlight"];

const FAQ = [
    { q: "How do you scope a motion engagement?", a: "Every project opens with a one-page motion brief: the feeling, the beats, the runtime, and a fixed-fee proposal with dates we hold. No open-ended retainers unless you want one." },
    { q: "Do you hand off editable source?", a: "Always. You leave with the After Effects / Lottie / GSAP source, a documented motion spec, and a working session so your team can run with it." },
    { q: "Can the motion survive prefers-reduced-motion?", a: "It has to. Every scene ships a reduced-motion fallback — the story still reads, it just stops moving. Accessibility is part of the spec, not an afterthought." },
    { q: "Where are you based?", a: "Berlin and Montréal, working across European and North-American time zones. Most of the work happens remotely with focused on-site shoot weeks." },
];

const PER_PAGE = 4;

/* ── Scroll-velocity ticker source: pace + telemetry words ────────────────── */
const TICKER = ["MOTION IDENTITY", "SCROLL CHOREOGRAPHY", "BRAND FILM", "KINETIC TYPE", "SOUND DESIGN", "WEBGL", "PARALLAX", "TITLE SYSTEMS"];

/**
 * Wraps children in a reveal-on-scroll container. The `Reveal` element starts
 * translated + faded and gets `.is-in` once it enters the viewport (or
 * immediately, under reduced motion / when IntersectionObserver is absent).
 */
function Reveal({ children, className = "", delay = 0 }: { children: ReactNode; className?: string; delay?: number }) {
    const ref = useRef<HTMLDivElement | null>(null);
    const [shown, setShown] = useState(false);

    useEffect(() => {
        const el = ref.current;
        if (!el) {
            return;
        }
        const reduce = typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
        if (reduce || typeof IntersectionObserver === "undefined") {
            setShown(true);
            return;
        }
        const obs = new IntersectionObserver(
            (entries) => {
                for (const e of entries) {
                    if (e.isIntersecting) {
                        setShown(true);
                        obs.disconnect();
                    }
                }
            },
            { threshold: 0.12, rootMargin: "0px 0px -8% 0px" },
        );
        obs.observe(el);
        return () => obs.disconnect();
    }, []);

    return (
        <div
            ref={ref}
            className={`kx-reveal ${shown ? "is-in" : ""} ${className}`}
            style={{ transitionDelay: `${delay}ms` }}
        >
            {children}
        </div>
    );
}

export default function Kinetic({ style }: { style: Style }) {
    const [page, setPage] = useState(1);
    const [tags, setTags] = useState<string[]>(["Motion identity", "Scroll"]);
    const [reel, setReel] = useState(0);
    const [brief, setBrief] = useState("");
    const [submitted, setSubmitted] = useState(false);

    const heroRef = useRef<HTMLElement | null>(null);
    const tickerRef = useRef<HTMLDivElement | null>(null);

    const totalPages = Math.ceil(PROJECTS.length / PER_PAGE);
    const pageProjects = PROJECTS.slice((page - 1) * PER_PAGE, page * PER_PAGE);

    /* Parallax in the hero + scroll-velocity offset on the telemetry ticker.
       rAF-throttled, reduced-motion aware, fully torn down on unmount. */
    useEffect(() => {
        if (typeof window === "undefined") {
            return;
        }
        const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
        if (reduce) {
            return;
        }
        let raf = 0;
        let lastY = window.scrollY;
        let ticker = 0;
        const layers = heroRef.current
            ? Array.from(heroRef.current.querySelectorAll<HTMLElement>("[data-depth]"))
            : [];
        const onScroll = () => {
            if (raf) {
                return;
            }
            raf = window.requestAnimationFrame(() => {
                raf = 0;
                const y = window.scrollY;
                const dv = y - lastY;
                lastY = y;
                // Hero layers drift at different rates → depth.
                for (const layer of layers) {
                    const depth = Number(layer.dataset.depth || "0");
                    layer.style.transform = `translate3d(0, ${(-y * depth).toFixed(1)}px, 0)`;
                }
                // Telemetry ticker nudges with scroll velocity (capped).
                ticker += Math.max(-60, Math.min(60, dv)) * 1.6;
                const t = tickerRef.current;
                if (t) {
                    t.style.setProperty("--kx-vel", `${ticker.toFixed(1)}px`);
                }
            });
        };
        window.addEventListener("scroll", onScroll, { passive: true });
        return () => {
            window.removeEventListener("scroll", onScroll);
            if (raf) {
                window.cancelAnimationFrame(raf);
            }
        };
    }, []);

    return (
        <div className="insp-kinetic">
            <div className="kx-shell">
                {/* ── Running head ─────────────────────────────────────────── */}
                <div className="kx-head">
                    <Breadcrumbs>
                        <Breadcrumbs.Item href="/inspiration">Inspiration</Breadcrumbs.Item>
                        <Breadcrumbs.Item active>Kinetic</Breadcrumbs.Item>
                    </Breadcrumbs>
                    <div className="kx-mark">
                        <span className="kx-mark__logo" aria-hidden>
                            F
                            <span className="kx-mark__pulse" aria-hidden />
                        </span>
                        <span className="kx-mark__name">FIELDWORK</span>
                        <Badge className="kx-tag kx-tag--accent" size="sm">
                            in motion
                        </Badge>
                    </div>
                    <div className="kx-headnav" aria-hidden>
                        <a href="#work">Work</a>
                        <a href="#capabilities">Studio</a>
                        <a href="#contact">Brief</a>
                    </div>
                </div>
            </div>

            {/* ── Hero — layered parallax ──────────────────────────────────── */}
            <section className="kx-hero" id="top" ref={heroRef} aria-labelledby="kx-hero-h">
                <div className="kx-hero__bg" aria-hidden>
                    <span className="kx-hero__glow kx-hero__glow--a" data-depth="0.18" />
                    <span className="kx-hero__glow kx-hero__glow--b" data-depth="0.32" />
                    <span className="kx-hero__grid" data-depth="0.06" />
                </div>

                {/* Oversized marquee headline — the kinetic signature. */}
                <div className="kx-hero__marquee">
                    <Marquee
                        duration={36}
                        fade="12%"
                        gap="0.35em"
                        items={["MOTION", "FILM", "SCROLL"]}
                        separator="·"
                        className="kx-marquee--lg"
                    />
                </div>

                <div className="kx-shell kx-hero__inner">
                    <div className="kx-hero__copy" data-depth="0.0">
                        <div className="kx-eyebrow">
                            <span><b>00</b> — Motion studio</span>
                            <span className="kx-eyebrow__live">
                                <span className="kx-live-dot" /> Available Q3 2026
                            </span>
                        </div>
                        <h1 id="kx-hero-h" className="kx-display">
                            We make brands
                            <span className="kx-display__kin"> move</span>,
                            <br />
                            and make motion
                            <span className="kx-display__kin"> mean</span> something.
                        </h1>
                        <p className="kx-lede">
                            FIELDWORK is a small motion studio working where film, brand, and the browser
                            overlap. The page is the timeline — scroll is the playhead. We storyboard every
                            beat, then build it so it survives a reduced-motion switch.
                        </p>
                        <div className="kx-hero__cta">
                            <Button className="kx-btn-primary" href="#contact" iconTrailing="arrow-right">
                                Start a brief
                            </Button>
                            <Button className="kx-btn-ghost" href="#work" iconTrailing="arrow-down">
                                Watch the reel
                            </Button>
                        </div>
                    </div>
                </div>

                <div className="kx-hero__scrollcue" aria-hidden>
                    <ArrowDownRight size={15} /> scroll to play
                </div>
            </section>

            {/* ── Telemetry ticker — scrolls with page velocity ───────────── */}
            <div
                className="kx-ticker"
                ref={tickerRef}
                role="marquee"
                aria-label="FIELDWORK capabilities"
            >
                <div className="kx-ticker__track">
                    {[...TICKER, ...TICKER, ...TICKER].map((t, i) => (
                        <span className="kx-ticker__item" key={i}>
                            <span className="kx-ticker__star" aria-hidden>✸</span>
                            {t}
                        </span>
                    ))}
                </div>
            </div>

            <div className="kx-shell">
                {/* ── Figures band ─────────────────────────────────────────── */}
                <section className="kx-section" aria-label="Studio in numbers">
                    <Reveal>
                        <div className="kx-figures">
                            {[
                                { num: "2017", label: "Founded", suffix: "" },
                                { num: "240", label: "Films cut", suffix: "+" },
                                { num: "06", label: "People", suffix: "" },
                                { num: "19", label: "Awards", suffix: "" },
                            ].map((f) => (
                                <div className="kx-figure" key={f.label}>
                                    <div className="kx-figure__num">
                                        {f.num}
                                        <em>{f.suffix}</em>
                                    </div>
                                    <div className="kx-figure__label">{f.label}</div>
                                </div>
                            ))}
                        </div>
                    </Reveal>
                </section>

                {/* ── Selected work — kinetic index ────────────────────────── */}
                <section className="kx-section" id="work" aria-labelledby="kx-work-h">
                    <Reveal>
                        <div className="kx-section__head">
                            <div>
                                <div className="kx-eyebrow"><span><b>01</b> — Selected work</span></div>
                                <Heading as="h2" className="kx-h2">
                                    Six reels in rotation.
                                </Heading>
                            </div>
                            <Pillbox
                                value={tags}
                                onChange={setTags}
                                placeholder="Filter by discipline…"
                                className="kx-pillbox"
                                aria-label="Filter work by discipline"
                            />
                        </div>
                    </Reveal>

                    {/* Featured reel — Carousel restyled as a film deck. */}
                    <Reveal delay={60}>
                        <div className="kx-reel">
                            <Carousel
                                activeIndex={reel}
                                onIndexChange={setReel}
                                loop
                                className="kx-reel__carousel"
                            >
                                <Carousel.Panels transition="fade" className="kx-reel__panels">
                                    {PROJECTS.slice(0, 3).map((p) => (
                                        <Carousel.Slide key={p.num} name={p.title} className="kx-reel__slide">
                                            <div className="kx-reel__stage">
                                                <span className="kx-reel__glyph">{p.glyph}</span>
                                                <span className="kx-reel__play" aria-hidden>
                                                    <Play size={18} />
                                                </span>
                                                <span className="kx-reel__runtime">{p.runtime}</span>
                                                <span className="kx-reel__scan" aria-hidden />
                                            </div>
                                            <div className="kx-reel__meta">
                                                <div>
                                                    <div className="kx-reel__title">{p.title}</div>
                                                    <div className="kx-reel__disc">{p.discipline}</div>
                                                </div>
                                                <Badge className="kx-tag" size="sm">{p.client}</Badge>
                                            </div>
                                        </Carousel.Slide>
                                    ))}
                                </Carousel.Panels>
                                <div className="kx-reel__controls">
                                    <Carousel.Steps className="kx-reel__steps" />
                                    <Carousel.Controls
                                        className="kx-reel__nav"
                                        prevLabel="Prev"
                                        nextLabel="Next"
                                    />
                                </div>
                            </Carousel>
                        </div>
                    </Reveal>

                    {/* Typographic index — every row a stretched link. */}
                    <div className="kx-index">
                        {pageProjects.map((p, i) => (
                            <Reveal key={p.num} delay={i * 70}>
                                <div className="kx-index__row">
                                    <Link
                                        href="/inspiration/kinetic#work"
                                        className="kx-index__stretch"
                                        aria-label={`${p.title} — ${p.discipline}`}
                                    />
                                    <span className="kx-index__num">{p.num}</span>
                                    <span className="kx-index__title">
                                        <span className="kx-index__titletext">{p.title}</span>
                                    </span>
                                    <span className="kx-index__disc">{p.discipline}</span>
                                    <span className="kx-index__year">
                                        {p.runtime}
                                        <ArrowUpRight size={15} className="kx-index__arrow" />
                                    </span>
                                </div>
                            </Reveal>
                        ))}
                    </div>

                    <div className="kx-index__foot">
                        <span className="kx-meta">
                            Showing {(page - 1) * PER_PAGE + 1}–{Math.min(page * PER_PAGE, PROJECTS.length)} of {PROJECTS.length}
                        </span>
                        <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
                    </div>
                </section>

                {/* ── Capabilities (tabbed) ────────────────────────────────── */}
                <section className="kx-section" id="capabilities" aria-labelledby="kx-cap-h">
                    <Reveal>
                        <div className="kx-eyebrow"><span><b>02</b> — Capabilities</span></div>
                        <Heading as="h2" className="kx-h2" id="kx-cap-h">
                            What we do, frame by frame.
                        </Heading>
                    </Reveal>

                    <Reveal delay={60}>
                        <Tabs defaultTab="services" variant="underline" className="kx-tabs">
                            <Tabs.List>
                                <Tabs.Tab value="services">Services</Tabs.Tab>
                                <Tabs.Tab value="process">Process</Tabs.Tab>
                                <Tabs.Tab value="faq">Questions</Tabs.Tab>
                            </Tabs.List>
                            <Tabs.Panels>
                                <Tabs.Panel value="services">
                                    <div className="kx-cap-grid">
                                        {SERVICES.map((s) => (
                                            <div className="kx-cap" key={s.no}>
                                                <span className="kx-cap__no">{s.no}</span>
                                                <h3 className="kx-cap__title">{s.title}</h3>
                                                <p className="kx-cap__body">{s.body}</p>
                                                <div className="kx-cap__tags">
                                                    {s.tags.map((t) => (
                                                        <Badge key={t} className="kx-tag" size="sm">{t}</Badge>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </Tabs.Panel>

                                <Tabs.Panel value="process">
                                    <div className="kx-process">
                                        <Timeline
                                            className="kx-timeline"
                                            events={[
                                                { date: "Beat 0", title: "Motion brief", description: "The feeling, the beats, the runtime. A fixed-fee proposal with dates we hold.", color: "pink" },
                                                { date: "Beats 1–2", title: "Storyboard", description: "Frames and timing — we decide the rhythm before a single keyframe is set.", color: "fuchsia" },
                                                { date: "Beats 3–5", title: "Build", description: "The chosen cut built as a documented, reusable motion system.", color: "cyan" },
                                                { date: "Render", title: "Handoff", description: "Editable source, a motion spec, and a working session so your team owns it.", color: "sky" },
                                            ]}
                                        />
                                    </div>
                                </Tabs.Panel>

                                <Tabs.Panel value="faq">
                                    <div className="kx-faq">
                                        <Accordion type="single" defaultOpen={["q0"]} className="kx-accordion">
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
                    </Reveal>
                </section>

                {/* ── About — kinetic pull-quote ───────────────────────────── */}
                <section className="kx-section kx-about" aria-labelledby="kx-about-h">
                    <Reveal>
                        <div className="kx-eyebrow"><span><b>03</b> — About</span></div>
                        <blockquote className="kx-quote">
                            Good motion is <b>invisible engineering</b> — you feel the timing, never the math.
                            We chase the frame where a brand stops being a logo and <b>starts being alive</b>.
                        </blockquote>
                        <Text as="p" className="kx-about__body">
                            FIELDWORK began in 2017 as two editors and one stubborn idea: that the web could move
                            like film without breaking for the people who need it to hold still. Six people now,
                            still small enough that the people you meet are the people who cut the work.
                        </Text>
                    </Reveal>
                </section>

                {/* ── Team ─────────────────────────────────────────────────── */}
                <section className="kx-section" aria-labelledby="kx-team-h">
                    <Reveal>
                        <div className="kx-eyebrow"><span><b>04</b> — People</span></div>
                        <Heading as="h2" className="kx-h2" id="kx-team-h">
                            The crew.
                        </Heading>
                    </Reveal>
                    <div className="kx-team">
                        {TEAM.map((m, i) => (
                            <Reveal key={m.name} delay={i * 70}>
                                <div className="kx-person">
                                    <Avatar fallback={m.initials} size="lg" className="kx-avatar" />
                                    <div className="kx-person__name">{m.name}</div>
                                    <div className="kx-person__role">{m.role}</div>
                                </div>
                            </Reveal>
                        ))}
                    </div>
                </section>

                {/* ── Recognition + clients ────────────────────────────────── */}
                <section className="kx-section" aria-labelledby="kx-rec-h">
                    <Reveal>
                        <div className="kx-rec">
                            <div className="kx-rec__main">
                                <div className="kx-eyebrow"><span><b>05</b> — Recognition</span></div>
                                <Heading as="h2" className="kx-h2" id="kx-rec-h" style={{ marginTop: 12 }}>
                                    Selected awards.
                                </Heading>
                                <div className="kx-table">
                                    <Table>
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
                                                <Table.Cell>Motionographer — Studio to watch</Table.Cell>
                                            </Table.Row>
                                        </Table.Body>
                                    </Table>
                                </div>
                            </div>

                            <div className="kx-rec__aside">
                                <div className="kx-eyebrow"><span>Press</span></div>
                                <ul className="kx-press">
                                    {PRESS.map((p) => (
                                        <li key={p}>{p}</li>
                                    ))}
                                </ul>
                                <Separator className="kx-sep" />
                                <div className="kx-eyebrow"><span>Selected clients</span></div>
                                <div className="kx-clients">
                                    {CLIENTS.map((c) => (
                                        <Badge key={c} className="kx-tag" size="md">{c}</Badge>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </Reveal>
                </section>

                {/* ── Clients marquee — reverse direction ──────────────────── */}
                <section className="kx-section kx-section--flush">
                    <Marquee
                        duration={34}
                        direction="right"
                        fade="8%"
                        gap={0}
                        items={CLIENTS.map((c) => (
                            <span className="kx-marquee__item" key={c}>{c}</span>
                        ))}
                        separator={<span className="kx-marquee__sep">✸</span>}
                        className="kx-marquee"
                    />
                </section>

                {/* ── Brief / contact ──────────────────────────────────────── */}
                <section className="kx-section" id="contact" aria-labelledby="kx-contact-h">
                    <Reveal>
                        <div className="kx-contact">
                            <div className="kx-contact__copy">
                                <div className="kx-eyebrow"><span><b>06</b> — Contact</span></div>
                                <Heading as="h2" className="kx-h2 kx-contact__h" id="kx-contact-h">
                                    Roll camera.
                                </Heading>
                                <p className="kx-lede kx-contact__lede">
                                    A few sentences and a runtime is plenty to start. We reply to every brief
                                    within two working days — same time zone or not.
                                </p>
                                <div className="kx-contact__lines">
                                    <span className="kx-contact__line">studio@fieldwork.example</span>
                                    <span className="kx-contact__sub">Berlin · Montréal · +49 30 000 000</span>
                                </div>

                                <Callout className="kx-callout" color="pink" icon={<Play size={15} />}>
                                    Every brief gets a one-page motion treatment back — beats, runtime, and a
                                    fixed fee — before you commit to anything.
                                </Callout>
                            </div>

                            <div className="kx-contact__form">
                                <Card variant="outlined" padding="none" className="kx-card">
                                    <Card.Header className="kx-card__head">
                                        <span className="kx-card__title">New brief</span>
                                        <Tooltip content="A human reads every brief — no autoresponders.">
                                            <Badge className="kx-tag kx-tag--accent" size="sm" dot>Open for Q3</Badge>
                                        </Tooltip>
                                    </Card.Header>
                                    <Card.Body className="kx-card__body">
                                        {submitted ? (
                                            <div className="kx-sent">
                                                <Badge className="kx-tag kx-tag--accent" size="md">Received</Badge>
                                                <p className="kx-sent__msg">
                                                    Thanks — your brief is in. We&apos;ll reply within two working days
                                                    with a motion treatment.
                                                </p>
                                                <Button
                                                    className="kx-btn-ghost"
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
                                                    value={brief}
                                                    onChange={setBrief}
                                                    onSubmit={() => setBrief((b) => b)}
                                                    placeholder="What are you building, what's the runtime, and when does it ship?"
                                                    className="kx-composer"
                                                />
                                                <div className="kx-card__progress">
                                                    <Text as="span" size="xs" className="kx-meta">
                                                        {brief.trim().length} characters
                                                    </Text>
                                                    <Progress
                                                        value={Math.min(brief.trim().length, 160)}
                                                        max={160}
                                                        variant="bar"
                                                        size="sm"
                                                        className="kx-progress"
                                                    />
                                                </div>
                                            </>
                                        )}
                                    </Card.Body>
                                    {!submitted && (
                                        <Card.Footer className="kx-card__foot">
                                            <Text as="span" size="xs" className="kx-meta">
                                                No NDA needed to say hello.
                                            </Text>
                                            <Button
                                                className="kx-btn-primary"
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
                    </Reveal>
                </section>

                {/* ── Footer ───────────────────────────────────────────────── */}
                <footer className="kx-footer">
                    <div className="kx-footer__top">
                        <div>
                            <div className="kx-mark">
                                <span className="kx-mark__logo kx-mark__logo--sm" aria-hidden>F</span>
                                <span className="kx-mark__name">FIELDWORK</span>
                            </div>
                            <p className="kx-footer__blurb">
                                A motion studio. Berlin and Montréal. Making brands move — and making the
                                movement mean something — since 2017.
                            </p>
                        </div>
                        <div className="kx-footer__links">
                            <a href="#work">Work ↗</a>
                            <a href="https://fieldwork.example" target="_blank" rel="noopener noreferrer">Vimeo ↗</a>
                            <a href="#contact">Contact ↗</a>
                            <a href="https://fieldwork.example" target="_blank" rel="noopener noreferrer">Instagram ↗</a>
                        </div>
                    </div>

                    <Separator className="kx-sep kx-sep--footer" />

                    <div className="kx-footer__bottom">
                        <span className="kx-meta">
                            FIELDWORK — a fictional studio, for demonstration · Style {style.num} / Kinetic
                        </span>
                        <Link href="/inspiration" className="kx-back">
                            <ArrowLeft size={14} />
                            Back to the gallery
                        </Link>
                    </div>
                </footer>
            </div>
        </div>
    );
}
