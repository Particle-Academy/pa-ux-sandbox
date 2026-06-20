import "./terminal.css";
import "@xterm/xterm/css/xterm.css";

import { Link } from "@inertiajs/react";
import { useEffect, useMemo, useRef, useState } from "react";
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
    type TimelineEvent,
    Tooltip,
} from "@particle-academy/react-fancy";
import { Terminal, type TerminalHandle } from "@particle-academy/fancy-term";
import { ArrowLeft } from "lucide-react";
import type { Style } from "../types";

/**
 * Inspiration Gallery · Style — Terminal.
 *
 * FIELDWORK (a fictional design / dev studio) rendered as a monospace,
 * command-line portfolio: a near-black phosphor surface, green prompt accent,
 * everything mono, ASCII rules, and section headers written as shell commands
 * (`$ fieldwork --selected-work`). A real, live <Terminal> from
 * @particle-academy/fancy-term sits in the hero, type-running a boot sequence so
 * the "live pane" reads native — not a screenshot. The whole tree is wrapped in
 * `.insp-terminal`, which carries its OWN dark CRT palette (re-pointing the
 * shared semantic tokens) so the surface reads near-black regardless of the host
 * light/dark theme, and never collides with Tailwind's `.dark`.
 *
 * The Fancy primitives are forced to WEAR the terminal idiom via scoped CSS +
 * `tm-*` classes: Badges become bracketed `[tags]`, the Table becomes a piped
 * ASCII ledger, Tabs become a row of `--flags`, the Avatar becomes a boxed
 * glyph, the Card becomes a framed TUI panel, the Composer a `>` input line,
 * Progress an ASCII meter, the Accordion a `▸/▾` expandable tree.
 *
 * Mounted by Inspiration/Show.tsx for `style.id === "terminal"`. SSR-safe: no
 * module-level browser APIs; the terminal type-out runs only in useEffect. Inner
 * links use the stretched-link pattern (one <Link> per row) so no anchor is ever
 * nested inside another anchor (avoids React #418 under SSR).
 */

type Project = {
    num: string;
    title: string;
    discipline: string;
    year: string;
    client: string;
    stack: string;
    status: string;
    award?: string;
};

const PROJECTS: Project[] = [
    { num: "01", title: "halcyon", discipline: "design system · product UI", year: "2025", client: "Halcyon Systems", stack: "react · tailwind · mcp", status: "shipped", award: "Awwwards SOTD" },
    { num: "02", title: "northpoint", discipline: "brand · motion identity", year: "2025", client: "Northpoint Capital", stack: "after-effects · svg", status: "shipped" },
    { num: "03", title: "cinder", discipline: "web app · data viz", year: "2025", client: "Cinder Analytics", stack: "echarts · inertia", status: "shipped", award: "CSS Design Awards" },
    { num: "04", title: "atlas-grid", discipline: "design engineering", year: "2024", client: "Atlas Robotics", stack: "react · ws · three", status: "shipped" },
    { num: "05", title: "vellum", discipline: "editorial platform", year: "2024", client: "Vellum Press", stack: "next · cms · type", status: "shipped", award: "FWA of the Day" },
    { num: "06", title: "drift", discipline: "product · prototyping", year: "2024", client: "Drift Audio", stack: "figma · react · audio", status: "shipped" },
];

const SERVICES = [
    { no: "01", flag: "--design-systems", title: "Design systems", body: "Tokens, primitives, and the documented rules that keep a product coherent across teams — built to be inhabited by humans and agents alike.", tags: ["tokens", "primitives", "docs"] },
    { no: "02", flag: "--product", title: "Product design", body: "Research, flows, and high-fidelity interface design for software teams — from a fixed-fee discovery to production-ready screens.", tags: ["ux", "ui", "prototype"] },
    { no: "03", flag: "--engineering", title: "Design engineering", body: "We ship the design. Front-end in React + Tailwind, component libraries, and the bridges that let agents drive the surface.", tags: ["react", "tailwind", "human+"] },
    { no: "04", flag: "--brand", title: "Brand & motion", body: "Identity systems, type, and motion language. The voice and the rhythm that make a product feel like one coherent thing.", tags: ["identity", "type", "motion"] },
];

const STACK: TimelineEvent[] = [
    { date: "stage 0", title: "discovery", description: "Goals, constraints, and a fixed-fee proposal with dates we hold. Output: a scoped brief you own.", color: "emerald" },
    { date: "stage 1", title: "direction", description: "Two or three routes drawn far enough that the decision is real, not abstract.", color: "zinc" },
    { date: "stage 2", title: "system", description: "The chosen route built into a documented, reusable system — tokens, primitives, docs.", color: "emerald" },
    { date: "stage 3", title: "ship", description: "Production React + Tailwind, an agent-driveable surface, and a working handoff session.", color: "zinc" },
];

const FAQ = [
    { q: "How do you scope an engagement?", a: "Every project opens with a short, paid discovery — goals, constraints, and a fixed-fee proposal with dates we hold. No open-ended retainers unless you want one." },
    { q: "Do you build, or just design?", a: "Both. We're a design + engineering studio — most work ships as production React. Take the design and run, or we ship it end to end." },
    { q: "What does a typical timeline look like?", a: "Design systems run six to ten weeks; product work varies with scope. We commit to dates in the proposal and keep you in the loop weekly." },
    { q: "Can agents drive what you build?", a: "Increasingly, yes. We build to the Human+ contract — controlled state, stable handles, MCP bridges — so an assistant reads and drives the same surface a person uses." },
];

const TEAM = [
    { name: "Iris Vance", role: "founder · design director", initials: "IV", handle: "@iris" },
    { name: "Kade Mori", role: "design engineering lead", initials: "KM", handle: "@kade" },
    { name: "Soraya Bell", role: "product & systems", initials: "SB", handle: "@sora" },
    { name: "Theo Lind", role: "brand & motion", initials: "TL", handle: "@theo" },
];

const CLIENTS = ["halcyon", "northpoint", "cinder", "atlas", "vellum", "drift", "lumen", "forge", "beacon"];

const FIGURES = [
    { num: "2017", label: "init" },
    { num: "140+", label: "commits shipped" },
    { num: "09", label: "processes" },
    { num: "16", label: "awards" },
];

const PER_PAGE = 4;

/** The hero terminal's boot transcript — written out char-by-char in useEffect. */
const BOOT_LINES = [
    "\x1b[38;5;245m$\x1b[0m \x1b[38;5;255mfieldwork\x1b[0m \x1b[38;5;245m--whoami\x1b[0m",
    "\x1b[38;5;42m▌\x1b[0m FIELDWORK — design + engineering studio",
    "\x1b[38;5;245m  location  \x1b[0m berlin · remote · utc+1",
    "\x1b[38;5;245m  est       \x1b[0m 2017   \x1b[38;5;245mteam\x1b[0m 9   \x1b[38;5;245mawards\x1b[0m 16",
    "\x1b[38;5;245m  stack     \x1b[0m react · tailwind · inertia · mcp",
    "\x1b[38;5;245m  status    \x1b[0m \x1b[38;5;42m●\x1b[0m available — Q3 2026 (2 slots)",
    "",
    "\x1b[38;5;245m$\x1b[0m \x1b[38;5;255mfieldwork\x1b[0m \x1b[38;5;245m--mission\x1b[0m",
    "  we build interfaces humans and agents share —",
    "  \x1b[38;5;42mcontrolled state, stable handles, MCP bridges.\x1b[0m",
    "",
    "\x1b[38;5;245m$\x1b[0m \x1b[38;5;42m_\x1b[0m",
];

export default function TerminalStyle({ style }: { style: Style }) {
    const [page, setPage] = useState(1);
    const [tags, setTags] = useState<string[]>(["react", "design-systems"]);
    const [brief, setBrief] = useState("");
    const [submitted, setSubmitted] = useState(false);

    const termRef = useRef<TerminalHandle | null>(null);
    const [booting, setBooting] = useState(true);

    const totalPages = Math.ceil(PROJECTS.length / PER_PAGE);
    const pageProjects = PROJECTS.slice((page - 1) * PER_PAGE, page * PER_PAGE);
    const awarded = useMemo(() => PROJECTS.filter((p) => p.award), []);

    // Type the boot transcript into the live terminal — browser-only.
    useEffect(() => {
        const term = termRef.current;
        if (!term) {
            return;
        }
        let cancelled = false;
        const timers: ReturnType<typeof setTimeout>[] = [];

        term.reset();
        const lines = BOOT_LINES;
        let li = 0;

        const writeLine = () => {
            if (cancelled || li >= lines.length) {
                if (!cancelled) {
                    setBooting(false);
                }
                return;
            }
            const line = lines[li];
            li += 1;
            let ci = 0;
            const typeChar = () => {
                if (cancelled) {
                    return;
                }
                if (ci < line.length) {
                    // Skip ANSI escape sequences as single atomic writes.
                    if (line[ci] === "\x1b") {
                        const end = line.indexOf("m", ci);
                        term.write(line.slice(ci, end + 1));
                        ci = end + 1;
                        typeChar();
                        return;
                    }
                    term.write(line[ci]);
                    ci += 1;
                    timers.push(setTimeout(typeChar, 11));
                } else {
                    term.writeln("");
                    timers.push(setTimeout(writeLine, 130));
                }
            };
            typeChar();
        };

        const start = setTimeout(writeLine, 420);
        timers.push(start);
        return () => {
            cancelled = true;
            timers.forEach(clearTimeout);
        };
    }, []);

    return (
        <div className="insp-terminal">
            <div className="tm-scan" aria-hidden />
            <div className="tm-shell">
                {/* ── Running head: window chrome + breadcrumbs ──────────────── */}
                <div className="tm-titlebar">
                    <div className="tm-dots" aria-hidden>
                        <span className="tm-dot tm-dot--r" />
                        <span className="tm-dot tm-dot--y" />
                        <span className="tm-dot tm-dot--g" />
                    </div>
                    <Breadcrumbs className="tm-crumbs">
                        <Breadcrumbs.Item href="/inspiration">~/inspiration</Breadcrumbs.Item>
                        <Breadcrumbs.Item active>terminal</Breadcrumbs.Item>
                    </Breadcrumbs>
                    <div className="tm-titlebar__spacer" />
                    <span className="tm-titlebar__path">fieldwork@studio:~$</span>
                </div>

                <div className="tm-body">
                    {/* ── Running head: mark ─────────────────────────────────── */}
                    <div className="tm-runhead">
                        <div className="tm-mark">
                            <span className="tm-mark__glyph" aria-hidden>▍</span>
                            <span className="tm-mark__name">FIELDWORK</span>
                            <Badge className="tm-badge" color="emerald" variant="outline" size="sm">
                                v2026.6
                            </Badge>
                        </div>
                        <span className="tm-runhead__status">
                            <span className="tm-runhead__led" aria-hidden /> available · Q3 2026
                        </span>
                    </div>
                    <pre className="tm-asciirule" aria-hidden>{"────────────────────────────────────────────────────────────────────────"}</pre>

                    {/* ── Hero ───────────────────────────────────────────────── */}
                    <section className="tm-section tm-hero" aria-labelledby="tm-hero">
                        <div className="tm-hero__main">
                            <div className="tm-cmd">
                                <span className="tm-cmd__prompt">$</span> fieldwork <span className="tm-cmd__flag">--whoami</span>
                            </div>
                            <h1 id="tm-hero" className="tm-display">
                                We build interfaces<br />
                                humans <span className="tm-display__pipe">|</span> agents<br />
                                <span className="tm-display__accent">share</span>
                                <span className="tm-caret" aria-hidden />
                            </h1>
                            <p className="tm-lede">
                                FIELDWORK is a design + engineering studio. We ship production React where
                                the same surface a person uses is one an agent can drive — controlled state,
                                stable handles, MCP bridges. No DOM-scraping.
                            </p>
                            <div className="tm-hero__cta">
                                <Button href="#contact" className="tm-btn tm-btn--solid" iconTrailing="arrow-right">
                                    ./brief-the-studio
                                </Button>
                                <Button href="#work" variant="ghost" className="tm-btn tm-btn--ghost">
                                    cat ./selected-work
                                </Button>
                            </div>
                            <div className="tm-hero__meta">
                                <span><span className="tm-key">loc</span> berlin · remote</span>
                                <span><span className="tm-key">utc</span> +1</span>
                                <span><span className="tm-key">uptime</span> 9y</span>
                            </div>
                        </div>

                        {/* Live terminal pane */}
                        <div className="tm-hero__pane">
                            <div className="tm-pane">
                                <div className="tm-pane__bar">
                                    <span className="tm-pane__dots" aria-hidden>
                                        <i /><i /><i />
                                    </span>
                                    <span className="tm-pane__title">— bash — fieldwork --whoami</span>
                                    <span className={`tm-pane__live ${booting ? "is-booting" : ""}`}>
                                        {booting ? "running" : "ready"}
                                    </span>
                                </div>
                                <div className="tm-pane__screen">
                                    <Terminal
                                        ref={termRef}
                                        readOnly
                                        cursorBlink
                                        cursorStyle="bar"
                                        fontSize={12.5}
                                        scrollback={200}
                                        aria-label="FIELDWORK boot transcript"
                                    />
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* ── Figures band ───────────────────────────────────────── */}
                    <section className="tm-section" aria-label="Studio in numbers">
                        <div className="tm-figures">
                            {FIGURES.map((f) => (
                                <div key={f.label} className="tm-figure">
                                    <div className="tm-figure__num">{f.num}</div>
                                    <div className="tm-figure__label">{f.label}</div>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* ── Selected work — piped index ────────────────────────── */}
                    <section className="tm-section" id="work" aria-labelledby="tm-work">
                        <div className="tm-section__head">
                            <div>
                                <div className="tm-cmd">
                                    <span className="tm-cmd__prompt">$</span> fieldwork <span className="tm-cmd__flag">--selected-work</span>
                                </div>
                                <Heading as="h2" size="2xl" className="tm-h2" id="tm-work">
                                    ls ./work — 6 recent builds
                                </Heading>
                            </div>
                            <Pillbox
                                value={tags}
                                onChange={setTags}
                                placeholder="grep --tag…"
                                className="tm-pillbox"
                                aria-label="Filter work by tag"
                            />
                        </div>

                        <div className="tm-index" role="table" aria-label="Selected work">
                            <div className="tm-index__header" role="row" aria-hidden>
                                <span>idx</span>
                                <span>name</span>
                                <span>discipline</span>
                                <span>stack</span>
                                <span>year</span>
                            </div>
                            {pageProjects.map((p) => (
                                <div key={p.num} className="tm-index__row" role="row">
                                    <Link
                                        href="/inspiration/terminal#work"
                                        className="tm-index__stretch"
                                        aria-label={`${p.title} — ${p.discipline}`}
                                    />
                                    <span className="tm-index__num">{p.num}</span>
                                    <span className="tm-index__title">
                                        <span className="tm-index__slash">./</span>{p.title}
                                        {p.award && <span className="tm-index__star" title={p.award}> ★</span>}
                                    </span>
                                    <span className="tm-index__disc">{p.discipline}</span>
                                    <span className="tm-index__stack">{p.stack}</span>
                                    <span className="tm-index__year">{p.year} <span className="tm-index__arrow" aria-hidden>→</span></span>
                                </div>
                            ))}
                        </div>

                        <div className="tm-index__foot">
                            <span className="tm-meta">
                                <span className="tm-meta__prompt">»</span> {(page - 1) * PER_PAGE + 1}–{Math.min(page * PER_PAGE, PROJECTS.length)} of {String(PROJECTS.length).padStart(2, "0")} · page {page}/{totalPages}
                            </span>
                            <Pagination page={page} totalPages={totalPages} onPageChange={setPage} className="tm-pagination" />
                        </div>
                    </section>

                    {/* ── Capabilities (tabbed --flags) ──────────────────────── */}
                    <section className="tm-section" aria-labelledby="tm-cap">
                        <div className="tm-cmd">
                            <span className="tm-cmd__prompt">$</span> fieldwork <span className="tm-cmd__flag">--capabilities</span> <span className="tm-cmd__opt">[--help]</span>
                        </div>
                        <Heading as="h2" size="2xl" className="tm-h2 tm-h2--gap" id="tm-cap">
                            man fieldwork — what we do
                        </Heading>

                        <Tabs defaultTab="services" variant="underline" className="tm-tabs">
                            <Tabs.List className="tm-tabs__list">
                                <Tabs.Tab value="services">--services</Tabs.Tab>
                                <Tabs.Tab value="process">--process</Tabs.Tab>
                                <Tabs.Tab value="faq">--faq</Tabs.Tab>
                            </Tabs.List>
                            <Tabs.Panels>
                                <Tabs.Panel value="services">
                                    <div className="tm-caps">
                                        {SERVICES.map((s) => (
                                            <article key={s.no} className="tm-cap">
                                                <div className="tm-cap__top">
                                                    <span className="tm-cap__no">{s.no}</span>
                                                    <span className="tm-cap__flag">{s.flag}</span>
                                                </div>
                                                <h3 className="tm-cap__title">{s.title}</h3>
                                                <p className="tm-cap__body">{s.body}</p>
                                                <div className="tm-cap__tags">
                                                    {s.tags.map((t) => (
                                                        <Badge key={t} className="tm-badge" color="emerald" variant="outline" size="sm">
                                                            {t}
                                                        </Badge>
                                                    ))}
                                                </div>
                                            </article>
                                        ))}
                                    </div>
                                </Tabs.Panel>

                                <Tabs.Panel value="process">
                                    <div className="tm-process">
                                        <Timeline className="tm-timeline" events={STACK} />
                                    </div>
                                </Tabs.Panel>

                                <Tabs.Panel value="faq">
                                    <div className="tm-faq">
                                        <Accordion type="single" defaultOpen={["q0"]} className="tm-accordion">
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

                    {/* ── About ──────────────────────────────────────────────── */}
                    <section className="tm-section tm-about" aria-labelledby="tm-about">
                        <div className="tm-about__label">
                            <div className="tm-cmd">
                                <span className="tm-cmd__prompt">$</span> <span className="tm-cmd__flag">cat</span> README.md
                            </div>
                        </div>
                        <div className="tm-about__body">
                            <pre className="tm-about__hash" aria-hidden>{"# fieldwork/README.md"}</pre>
                            <p className="tm-about__lead">
                                The best interface is mostly invisible — a grid you never notice, type that
                                reads before you register it, a system that quietly holds under both a human
                                cursor and an agent's tool call.
                            </p>
                            <Text as="p" size="md" className="tm-about__text">
                                FIELDWORK booted in 2017 as two engineers who liked design and two designers
                                who could ship. Nine people now, still small enough that the people you meet
                                are the people who write the code. We take a handful of projects at a time and
                                give each our full attention.
                            </Text>
                            <div className="tm-about__signoff">
                                <span className="tm-meta__prompt">$</span> echo &quot;measure twice, ship once&quot;
                            </div>
                        </div>
                    </section>

                    {/* ── Team — process list ────────────────────────────────── */}
                    <section className="tm-section" aria-labelledby="tm-team">
                        <div className="tm-cmd">
                            <span className="tm-cmd__prompt">$</span> <span className="tm-cmd__flag">ps</span> -aux <span className="tm-cmd__opt">| grep studio</span>
                        </div>
                        <Heading as="h2" size="2xl" className="tm-h2 tm-h2--gap" id="tm-team">
                            running processes — the studio
                        </Heading>
                        <div className="tm-people">
                            {TEAM.map((m, i) => (
                                <article key={m.name} className="tm-person">
                                    <Avatar fallback={m.initials} size="lg" className="tm-avatar" />
                                    <div className="tm-person__meta">
                                        <div className="tm-person__name">{m.name}</div>
                                        <div className="tm-person__role">{m.role}</div>
                                    </div>
                                    <div className="tm-person__proc">
                                        <span className="tm-person__pid">pid {String(1024 + i * 17).padStart(4, "0")}</span>
                                        <span className="tm-person__handle">{m.handle}</span>
                                    </div>
                                </article>
                            ))}
                        </div>
                    </section>

                    {/* ── Recognition: awards ledger + clients ───────────────── */}
                    <section className="tm-section" aria-labelledby="tm-recognition">
                        <div className="tm-recognition">
                            <div className="tm-recognition__main">
                                <div className="tm-cmd">
                                    <span className="tm-cmd__prompt">$</span> fieldwork <span className="tm-cmd__flag">--awards</span> <span className="tm-cmd__opt">| less</span>
                                </div>
                                <Heading as="h3" size="lg" className="tm-recognition__title">
                                    awards.log
                                </Heading>
                                <Table className="tm-table">
                                    <Table.Head>
                                        <Table.Column label="year" />
                                        <Table.Column label="project" />
                                        <Table.Column label="award" />
                                    </Table.Head>
                                    <Table.Body>
                                        {awarded.map((p) => (
                                            <Table.Row key={p.num}>
                                                <Table.Cell>{p.year}</Table.Cell>
                                                <Table.Cell>./{p.title}</Table.Cell>
                                                <Table.Cell>{p.award}</Table.Cell>
                                            </Table.Row>
                                        ))}
                                        <Table.Row>
                                            <Table.Cell>2023</Table.Cell>
                                            <Table.Cell>./studio</Table.Cell>
                                            <Table.Cell>Type Directors Club — Certificate</Table.Cell>
                                        </Table.Row>
                                    </Table.Body>
                                </Table>
                            </div>

                            <aside className="tm-recognition__side">
                                <div className="tm-cmd tm-cmd--sm">
                                    <span className="tm-cmd__prompt">$</span> <span className="tm-cmd__flag">cat</span> clients.txt
                                </div>
                                <div className="tm-clients">
                                    {CLIENTS.map((c) => (
                                        <Badge key={c} className="tm-badge tm-badge--client" color="zinc" variant="outline" size="md">
                                            {c}
                                        </Badge>
                                    ))}
                                </div>
                                <Separator className="tm-sep" />
                                <div className="tm-cmd tm-cmd--sm">
                                    <span className="tm-cmd__prompt">$</span> <span className="tm-cmd__flag">cat</span> press.txt
                                </div>
                                <ul className="tm-press">
                                    <li className="tm-press__lead">It&apos;s Nice That — Studio of the week</li>
                                    <li>Smashing Magazine — Human+ UX</li>
                                    <li>Awwwards — Developer Award</li>
                                </ul>
                            </aside>
                        </div>
                    </section>

                    {/* ── Brief / contact ────────────────────────────────────── */}
                    <section className="tm-section" id="contact" aria-labelledby="tm-contact">
                        <div className="tm-contact">
                            <div className="tm-contact__intro">
                                <div className="tm-cmd">
                                    <span className="tm-cmd__prompt">$</span> fieldwork <span className="tm-cmd__flag">--new-brief</span>
                                </div>
                                <Heading as="h2" size="2xl" className="tm-h2 tm-h2--gap">
                                    init ./your-project
                                </Heading>
                                <p className="tm-lede tm-lede--sm">
                                    A few sentences is plenty to start. We reply to every brief within two
                                    working days — a person, not a bot.
                                </p>
                                <div className="tm-contact__addr">
                                    <span className="tm-addr tm-addr--accent">
                                        <span className="tm-key">mail</span> studio@fieldwork.example
                                    </span>
                                    <span className="tm-addr">
                                        <span className="tm-key">tel </span> +49 30 0000 0000
                                    </span>
                                </div>
                                <div className="tm-contact__why">
                                    <span className="tm-meta">
                                        <span className="tm-meta__prompt">#</span> fixed-fee, no retainers —{" "}
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

                            <Card variant="outlined" padding="none" className="tm-brief">
                                <Card.Header className="tm-brief__head">
                                    <span className="tm-brief__title">
                                        <span className="tm-brief__glyph" aria-hidden>▍</span> brief.new
                                    </span>
                                    <Tooltip content="A person reads every brief — no bots.">
                                        <Badge color="emerald" variant="outline" size="sm" dot className="tm-brief__status">
                                            stdin open
                                        </Badge>
                                    </Tooltip>
                                </Card.Header>
                                <Card.Body className="tm-brief__body">
                                    {submitted ? (
                                        <div className="tm-brief__sent">
                                            <pre className="tm-brief__ok" aria-hidden>{"[ok] 200 — brief received"}</pre>
                                            <p>
                                                Thanks — your brief is queued. We&apos;ll reply within two working
                                                days from <span className="tm-brief__mail">studio@fieldwork.example</span>.
                                            </p>
                                            <Button
                                                variant="ghost"
                                                icon="arrow-left"
                                                className="tm-btn tm-btn--ghost"
                                                onClick={() => { setSubmitted(false); setBrief(""); }}
                                            >
                                                write another
                                            </Button>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="tm-brief__prompt">
                                                <span aria-hidden>&gt;</span> describe the build
                                            </div>
                                            <Composer
                                                value={brief}
                                                onChange={setBrief}
                                                onSubmit={() => setBrief((b) => b)}
                                                placeholder="What are you building, and what's the deadline?"
                                                className="tm-composer"
                                            />
                                            <div className="tm-brief__foot">
                                                <Text as="span" size="xs" className="tm-brief__count">
                                                    {String(brief.trim().length).padStart(3, "0")} chars
                                                </Text>
                                                <Progress
                                                    value={Math.min(brief.trim().length, 160)}
                                                    max={160}
                                                    variant="bar"
                                                    size="sm"
                                                    color="emerald"
                                                    className="tm-progress"
                                                />
                                            </div>
                                        </>
                                    )}
                                </Card.Body>
                                {!submitted && (
                                    <Card.Footer className="tm-brief__footer">
                                        <Text as="span" size="xs" className="tm-brief__note">
                                            no NDA needed to say hello
                                        </Text>
                                        <Button
                                            disabled={brief.trim().length < 12}
                                            iconTrailing="arrow-right"
                                            className="tm-btn tm-btn--solid"
                                            onClick={() => setSubmitted(true)}
                                        >
                                            send ⏎
                                        </Button>
                                    </Card.Footer>
                                )}
                            </Card>
                        </div>
                    </section>

                    {/* ── Footer ─────────────────────────────────────────────── */}
                    <footer className="tm-footer">
                        <pre className="tm-asciirule" aria-hidden>{"────────────────────────────────────────────────────────────────────────"}</pre>
                        <div className="tm-footer__top">
                            <div className="tm-footer__brand">
                                <div className="tm-mark">
                                    <span className="tm-mark__glyph" aria-hidden>▍</span>
                                    <span className="tm-mark__name">FIELDWORK</span>
                                </div>
                                <p className="tm-footer__blurb">
                                    A design + engineering studio. Berlin &amp; remote. Building interfaces
                                    humans and agents share since 2017.
                                </p>
                            </div>
                            <div className="tm-footer__links">
                                <a href="#work">./work</a>
                                <a href="https://fieldwork.example" target="_blank" rel="noopener noreferrer">./github</a>
                                <a href="#contact">./contact</a>
                                <a href="https://fieldwork.example" target="_blank" rel="noopener noreferrer">./mastodon</a>
                            </div>
                        </div>
                        <pre className="tm-asciirule tm-asciirule--faint" aria-hidden>{"────────────────────────────────────────────────────────────────────────"}</pre>
                        <div className="tm-footer__foot">
                            <span className="tm-meta">
                                <span className="tm-meta__prompt">#</span> FIELDWORK — a fictional studio, for demonstration · style {style.num} / terminal
                            </span>
                            <Link href="/inspiration" className="tm-back">
                                <ArrowLeft size={14} />
                                cd ../gallery
                            </Link>
                        </div>
                    </footer>
                </div>
            </div>
        </div>
    );
}
