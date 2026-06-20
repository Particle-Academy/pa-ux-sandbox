import "./sheet.css";
import "@particle-academy/fancy-sheets/styles.css";
import { Link } from "@inertiajs/react";
import { useMemo, useState } from "react";
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
    Select,
    Separator,
    Switch,
    Table,
    Tabs,
    Text,
    Timeline,
    Tooltip,
} from "@particle-academy/react-fancy";
import {
    SheetWorkbook,
    type WorkbookData,
} from "@particle-academy/fancy-sheets";
import type { Style } from "../types";

/**
 * Inspiration Gallery · Style — Spreadsheet ("sheet").
 *
 * FIELDWORK (a fictional design / dev studio) rendered as a LIVING DATA GRID:
 * the studio's whole portfolio runs on a spreadsheet. A real fancy-sheets
 * workbook (project / discipline / year / status, with a SUM/COUNTIF formula
 * row) is the centerpiece; everything around it wears the same idiom —
 * column-letter / row-number gutters, a green "function-bar" header, A1-style
 * cell references as eyebrows, ledger tables, status-cell Badges, and a
 * formula-bar contact box. The Fancy kit is forced to WEAR the spreadsheet
 * look (Badge → conditional-format status pill, Table → frozen-header ledger,
 * Tabs → sheet-tab rail, Avatar → name-cell chip, Card → bordered cell range,
 * Composer → cell editor, Progress → in-cell data bar, Pagination → row
 * pager). Light mode only. SSR-safe: no module-level browser APIs; every
 * interactive bit is controlled React state. Inner links use the stretched-
 * link pattern (one <Link> per row) so no anchor nests inside another anchor.
 *
 * Mounted by Inspiration/Show.tsx for `style.id === "sheet"`. Wrapped in
 * `.insp-sheet`; every selector in sheet.css is scoped under it.
 */

type Project = {
    id: string;
    title: string;
    discipline: string;
    year: string;
    status: "Shipped" | "In build" | "Scoping";
    fee: number;
};

const PROJECTS: Project[] = [
    { id: "FW-014", title: "Meridian", discipline: "Brand system", year: "2025", status: "Shipped", fee: 64 },
    { id: "FW-013", title: "Low Tide", discipline: "Editorial", year: "2025", status: "Shipped", fee: 38 },
    { id: "FW-012", title: "Quanta", discipline: "Product UI", year: "2025", status: "In build", fee: 92 },
    { id: "FW-011", title: "Field Notes", discipline: "Identity", year: "2024", status: "Shipped", fee: 41 },
    { id: "FW-010", title: "Ostro", discipline: "Design system", year: "2024", status: "Shipped", fee: 76 },
    { id: "FW-009", title: "Paper Radio", discipline: "Packaging", year: "2024", status: "In build", fee: 29 },
    { id: "FW-008", title: "Northwind", discipline: "Web", year: "2023", status: "Shipped", fee: 58 },
    { id: "FW-007", title: "Studio Føn", discipline: "Motion", year: "2023", status: "Scoping", fee: 22 },
];

const SERVICES = [
    { ref: "A1", title: "Brand systems", body: "Identity, naming, voice, and the rules that keep a brand coherent as it scales — shipped as a system, not a logo.", load: 0.82 },
    { ref: "A2", title: "Editorial & type", body: "Magazines, reports, and bespoke typefaces. Long-form work where the grid does the heavy lifting.", load: 0.64 },
    { ref: "A3", title: "Product & web", body: "Interface design and design systems for software teams — research, prototypes, production-ready components.", load: 0.91 },
    { ref: "A4", title: "Data & ops", body: "Dashboards, internal tools, and the unglamorous spreadsheets that quietly run a business.", load: 0.47 },
];

const TEAM = [
    { name: "Anja Vester", role: "Founder, design director", initials: "AV", util: 0.7 },
    { name: "Tomas Pell", role: "Type & editorial", initials: "TP", util: 0.9 },
    { name: "Rhea Okonkwo", role: "Product & systems", initials: "RO", util: 0.85 },
    { name: "Liang Mori", role: "Motion & data viz", initials: "LM", util: 0.6 },
];

const CLIENTS = ["Meridian", "Saltworks", "Quanta Labs", "Atlas Botanic", "Ostro", "Paper Radio", "Northwind", "Studio Føn"];

const AWARDS = [
    { year: "2025", project: "Meridian", award: "D&AD Wood Pencil" },
    { year: "2025", project: "Quanta", award: "Awwwards SOTD" },
    { year: "2024", project: "Ostro", award: "Type Directors Club, Cert. of Excellence" },
    { year: "2023", project: "Studio", award: "It's Nice That — Studio of the week" },
];

const FAQ = [
    { q: "How do you scope a project?", a: "Every engagement opens with a short discovery: goals, audience, constraints, and a fixed-fee proposal. No open-ended retainers unless you want one." },
    { q: "What's a typical timeline?", a: "Brand systems run six to ten weeks; editorial and product work vary with scope. We'll commit to dates in the proposal and hold them." },
    { q: "Do you work with in-house teams?", a: "Often. We can lead, embed, or hand off a documented system your team runs with — whatever leaves you most independent." },
    { q: "Where are you based?", a: "Zürich and Lisbon, working across European and North American time zones. Most work happens remotely with focused on-site weeks." },
];

const PER_PAGE = 4;
const COLS = ["A · ID", "B · Project", "C · Discipline", "D · Year", "E · Status", "F · Fee €k"];

/** Build the centerpiece workbook from the project rows — a real fancy-sheets
 *  document with a header row, a row per project, and a formula summary row. */
function buildWorkbook(): WorkbookData {
    const cells: WorkbookData["sheets"][number]["cells"] = {};
    const head = ["ID", "Project", "Discipline", "Year", "Status", "Fee €k"];
    head.forEach((h, c) => {
        const addr = `${String.fromCharCode(65 + c)}1`;
        cells[addr] = {
            value: h,
            format: { bold: true, backgroundColor: "#e8efe9", color: "#1f3d2b", borderBottom: "#bcd2c0" },
        };
    });
    PROJECTS.forEach((p, i) => {
        const r = i + 2;
        const statusColor = p.status === "Shipped" ? "#15803d" : p.status === "In build" ? "#b45309" : "#52525b";
        cells[`A${r}`] = { value: p.id, format: { color: "#71717a", className: "fw-id" } };
        cells[`B${r}`] = { value: p.title, format: { bold: true, color: "#18181b" } };
        cells[`C${r}`] = { value: p.discipline };
        cells[`D${r}`] = { value: p.year, format: { textAlign: "center", color: "#52525b" } };
        cells[`E${r}`] = { value: p.status, format: { color: statusColor, bold: true } };
        cells[`F${r}`] = { value: p.fee, format: { textAlign: "right", displayFormat: "number" } };
    });
    const total = PROJECTS.length + 2;
    cells[`A${total}`] = { value: "TOTAL", format: { bold: true, color: "#1f3d2b", borderTop: "#bcd2c0", backgroundColor: "#f1f6f2" } };
    cells[`B${total}`] = { value: "", format: { borderTop: "#bcd2c0", backgroundColor: "#f1f6f2" } };
    cells[`C${total}`] = { value: "", format: { borderTop: "#bcd2c0", backgroundColor: "#f1f6f2" } };
    cells[`D${total}`] = { value: "", format: { borderTop: "#bcd2c0", backgroundColor: "#f1f6f2" } };
    cells[`E${total}`] = {
        value: "",
        formula: `COUNTIF(E2:E${total - 1},"Shipped")&" shipped"`,
        format: { color: "#15803d", bold: true, borderTop: "#bcd2c0", backgroundColor: "#f1f6f2" },
    };
    cells[`F${total}`] = {
        value: "",
        formula: `SUM(F2:F${total - 1})`,
        format: { textAlign: "right", bold: true, color: "#1f3d2b", displayFormat: "number", borderTop: "#bcd2c0", backgroundColor: "#f1f6f2" },
    };

    return {
        activeSheetId: "work",
        sheets: [
            {
                id: "work",
                name: "Selected work",
                cells,
                columnWidths: { 0: 78, 1: 150, 2: 150, 3: 64, 4: 110, 5: 84 },
                mergedRegions: [],
                columnFilters: {},
                frozenRows: 1,
                frozenCols: 0,
            },
        ],
    };
}

export default function Sheet({ style }: { style: Style }) {
    const [workbook, setWorkbook] = useState<WorkbookData>(() => buildWorkbook());
    const [page, setPage] = useState(1);
    const [disciplines, setDisciplines] = useState<string[]>(["Brand system", "Product UI"]);
    const [statusFilter, setStatusFilter] = useState("All");
    const [liveCalc, setLiveCalc] = useState(true);
    const [budget, setBudget] = useState("");
    const [brief, setBrief] = useState("");
    const [submitted, setSubmitted] = useState(false);

    const filtered = useMemo(
        () => (statusFilter === "All" ? PROJECTS : PROJECTS.filter((p) => p.status === statusFilter)),
        [statusFilter],
    );
    const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
    const safePage = Math.min(page, totalPages);
    const pageProjects = filtered.slice((safePage - 1) * PER_PAGE, safePage * PER_PAGE);
    const totalFee = PROJECTS.reduce((s, p) => s + p.fee, 0);
    const shipped = PROJECTS.filter((p) => p.status === "Shipped").length;

    const statusTone = (s: Project["status"]) =>
        s === "Shipped" ? "emerald" : s === "In build" ? "amber" : "zinc";

    return (
        <div className="insp-sheet">
            <div className="sh-shell">
                {/* ── Function bar: breadcrumbs + cell ref + studio name-box ─── */}
                <div className="sh-funcbar">
                    <span className="sh-fx" aria-hidden>
                        <i>ƒx</i>
                    </span>
                    <Breadcrumbs className="sh-crumbs">
                        <Breadcrumbs.Item href="/inspiration">Inspiration</Breadcrumbs.Item>
                        <Breadcrumbs.Item active>Spreadsheet</Breadcrumbs.Item>
                    </Breadcrumbs>
                    <span className="sh-funcbar__formula">=STUDIO(&quot;FIELDWORK&quot;, est:2016)</span>
                    <span className="sh-namebox">
                        <span className="sh-namebox__mark brand-gradient" aria-hidden>F</span>
                        FIELDWORK
                        <Badge color="zinc" variant="outline" size="sm" className="sh-chip">A1:F∞</Badge>
                    </span>
                </div>

                {/* ── Hero ──────────────────────────────────────────────────── */}
                <section className="sh-section sh-hero" aria-labelledby="sh-hero-h">
                    <div className="sh-hero__lead">
                        <span className="sh-ref">Sheet 00 · Cell A1</span>
                        <h1 id="sh-hero-h" className="sh-display">
                            A design studio that runs on a grid.
                        </h1>
                        <p className="sh-lede">
                            FIELDWORK is a small studio working across brand, editorial, and product. We treat every
                            engagement as a row in the same ledger — scoped, dated, and accountable — so nothing
                            slips between the cells.
                        </p>
                        <div className="sh-hero__actions">
                            <Button className="sh-btn sh-btn--primary" href="#contact">
                                Open a brief
                            </Button>
                            <Button variant="ghost" className="sh-btn sh-btn--ghost" iconTrailing="arrow-down" href="#work">
                                Jump to the data
                            </Button>
                        </div>
                    </div>
                    <div className="sh-hero__rail">
                        <div className="sh-stat">
                            <span className="sh-stat__addr">B2</span>
                            <span className="sh-stat__num">{PROJECTS.length}+</span>
                            <span className="sh-stat__label">Active rows</span>
                        </div>
                        <div className="sh-stat">
                            <span className="sh-stat__addr">B3</span>
                            <span className="sh-stat__num">€{totalFee}k</span>
                            <span className="sh-stat__label">=SUM(fees)</span>
                        </div>
                        <div className="sh-stat">
                            <span className="sh-stat__addr">B4</span>
                            <span className="sh-stat__num">{shipped}</span>
                            <span className="sh-stat__label">Shipped</span>
                        </div>
                        <div className="sh-stat">
                            <span className="sh-stat__addr">B5</span>
                            <span className="sh-stat__num">2</span>
                            <span className="sh-stat__label">Studios (ZRH·LIS)</span>
                        </div>
                    </div>
                </section>

                {/* ── The workbook: live data grid ──────────────────────────── */}
                <section className="sh-section" id="work" aria-labelledby="sh-work-h">
                    <div className="sh-band-head">
                        <div>
                            <span className="sh-ref">Range A1:F{PROJECTS.length + 2}</span>
                            <Heading as="h2" size="2xl" weight="semibold" className="sh-h2">
                                Selected work, as a workbook.
                            </Heading>
                            <Text as="p" size="sm" color="muted" className="sh-band-sub">
                                A live fancy-sheets document — header frozen, the bottom row is a real{" "}
                                <code className="sh-code">=SUM</code> / <code className="sh-code">=COUNTIF</code>. Click a
                                cell, edit it, watch the totals recompute.
                            </Text>
                        </div>
                        <label className="sh-recalc">
                            <Switch
                                checked={liveCalc}
                                onCheckedChange={setLiveCalc}
                                color="emerald"
                                size="sm"
                            />
                            <span>Auto-calc</span>
                        </label>
                    </div>

                    <div className="sh-workbook" aria-label="FIELDWORK selected-work workbook">
                        <SheetWorkbook
                            data={workbook}
                            onChange={setWorkbook}
                            rowCount={14}
                            columnCount={8}
                            rowHeight={30}
                            toolbarButtons={["formulaBar", "bold", "align"]}
                        />
                    </div>
                    <div className="sh-workbook__cap">
                        <span>F{PROJECTS.length + 2} = SUM(F2:F{PROJECTS.length + 1}) → €{totalFee}k booked</span>
                        <span className="sh-workbook__live">
                            <i className="sh-dot" aria-hidden /> {liveCalc ? "Recalculating live" : "Manual recalc"}
                        </span>
                    </div>
                </section>

                {/* ── Filtered index — the same data as a paged query ───────── */}
                <section className="sh-section" aria-labelledby="sh-index-h">
                    <div className="sh-band-head">
                        <div>
                            <span className="sh-ref">Query · WHERE status</span>
                            <Heading as="h2" size="lg" weight="semibold" className="sh-h2">
                                Filter the rows.
                            </Heading>
                        </div>
                        <div className="sh-filters">
                            <Select
                                aria-label="Filter by status"
                                className="sh-select"
                                value={statusFilter}
                                onValueChange={(v) => {
                                    setStatusFilter(v);
                                    setPage(1);
                                }}
                                list={["All", "Shipped", "In build", "Scoping"]}
                            />
                            <Pillbox
                                value={disciplines}
                                onChange={setDisciplines}
                                placeholder="tag filter…"
                                className="sh-pillbox"
                                aria-label="Filter by discipline"
                            />
                        </div>
                    </div>

                    <div className="sh-grid" role="table">
                        <div className="sh-grid__corner" aria-hidden />
                        {COLS.map((c) => (
                            <div key={c} className="sh-grid__colhead" role="columnheader">
                                {c}
                            </div>
                        ))}
                        {pageProjects.map((p, i) => (
                            <div key={p.id} className="sh-grid__row" role="row">
                                <Link href="/inspiration/sheet#work" className="sh-grid__stretch" aria-label={`${p.title} — ${p.discipline}`} />
                                <span className="sh-grid__rownum" role="rowheader" aria-hidden>
                                    {(safePage - 1) * PER_PAGE + i + 2}
                                </span>
                                <span className="sh-cell sh-cell--mono">{p.id}</span>
                                <span className="sh-cell sh-cell--title">{p.title}</span>
                                <span className="sh-cell">{p.discipline}</span>
                                <span className="sh-cell sh-cell--center">{p.year}</span>
                                <span className="sh-cell sh-cell--status">
                                    <Badge color={statusTone(p.status)} variant="soft" size="sm" dot className="sh-status">
                                        {p.status}
                                    </Badge>
                                </span>
                                <span className="sh-cell sh-cell--num">{p.fee}</span>
                            </div>
                        ))}
                    </div>

                    <div className="sh-grid__foot">
                        <span className="sh-ref">
                            Rows {(safePage - 1) * PER_PAGE + 2}–{(safePage - 1) * PER_PAGE + pageProjects.length + 1} of {filtered.length + 1}
                        </span>
                        <Pagination page={safePage} totalPages={totalPages} onPageChange={setPage} className="sh-pager" />
                    </div>
                </section>

                {/* ── Capabilities (sheet tabs) ─────────────────────────────── */}
                <section className="sh-section" aria-labelledby="sh-cap-h">
                    <span className="sh-ref">Workbook · 3 sheets</span>
                    <Heading as="h2" size="2xl" weight="semibold" className="sh-h2 sh-h2--mb">
                        What we do, sheet by sheet.
                    </Heading>

                    <Tabs defaultTab="services" variant="underline" className="sh-tabs">
                        <Tabs.List>
                            <Tabs.Tab value="services">Services</Tabs.Tab>
                            <Tabs.Tab value="process">Process</Tabs.Tab>
                            <Tabs.Tab value="faq">Notes</Tabs.Tab>
                        </Tabs.List>
                        <Tabs.Panels>
                            <Tabs.Panel value="services">
                                <div className="sh-cap-grid">
                                    {SERVICES.map((s) => (
                                        <div key={s.ref} className="sh-cap">
                                            <span className="sh-cap__ref">{s.ref}</span>
                                            <h3 className="sh-cap__title">{s.title}</h3>
                                            <p className="sh-cap__body">{s.body}</p>
                                            <div className="sh-cap__bar">
                                                <span className="sh-cap__bar-label">capacity</span>
                                                <Progress value={Math.round(s.load * 100)} max={100} variant="bar" size="sm" color="emerald" className="sh-bar" />
                                                <span className="sh-cap__bar-val">{Math.round(s.load * 100)}%</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </Tabs.Panel>

                            <Tabs.Panel value="process">
                                <div className="sh-process">
                                    <Timeline
                                        className="sh-timeline"
                                        events={[
                                            { date: "Row 0 · Discovery", title: "Scope the cells", description: "Goals, audience, constraints. A fixed-fee proposal with dates we hold." },
                                            { date: "Rows 1–3 · Direction", title: "Explore routes", description: "Two or three directions, explored until a decision is real, not abstract." },
                                            { date: "Rows 4–8 · System", title: "Build the system", description: "The chosen direction built into a documented, reusable system.", color: "emerald" },
                                            { date: "Last row · Handoff", title: "Hand off the workbook", description: "Source files, guidelines, and a working session so your team owns it." },
                                        ]}
                                    />
                                </div>
                            </Tabs.Panel>

                            <Tabs.Panel value="faq">
                                <div className="sh-faq">
                                    <Accordion type="single" defaultOpen={["q0"]} className="sh-accordion">
                                        {FAQ.map((item, i) => (
                                            <Accordion.Item key={i} value={`q${i}`}>
                                                <Accordion.Trigger>
                                                    <span className="sh-faq__ref">N{i + 1}</span> {item.q}
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
                <section className="sh-section sh-about" aria-labelledby="sh-about-h">
                    <div className="sh-about__label">
                        <span className="sh-ref">Cell comment</span>
                        <span className="sh-about__tag">About</span>
                    </div>
                    <div className="sh-about__body">
                        <p className="sh-about__lead" id="sh-about-h">
                            We think the best design is mostly invisible — a grid you never notice, a number that
                            reconciles, a system that quietly holds.
                        </p>
                        <Text as="p" size="md" color="muted" className="sh-about__para">
                            FIELDWORK began in 2016 as two people and a shared dislike of decoration for its own sake.
                            We&apos;ve grown carefully since — eight people now, still small enough that the people you
                            meet are the people who do the work. We take a handful of projects at a time and give each
                            our full attention. Everything we ship is tracked, dated, and accountable to the same row.
                        </Text>
                    </div>
                </section>

                {/* ── Team — names as cells with a utilization bar ──────────── */}
                <section className="sh-section" aria-labelledby="sh-team-h">
                    <span className="sh-ref">Sheet · Roster</span>
                    <Heading as="h2" size="2xl" weight="semibold" className="sh-h2 sh-h2--mb">
                        The studio.
                    </Heading>
                    <div className="sh-team">
                        <div className="sh-team__head" aria-hidden>
                            <span>Name</span>
                            <span>Role</span>
                            <span>Utilization</span>
                        </div>
                        {TEAM.map((m) => (
                            <div key={m.name} className="sh-team__row">
                                <span className="sh-team__name">
                                    <Avatar fallback={m.initials} size="sm" className="sh-avatar" />
                                    {m.name}
                                </span>
                                <span className="sh-team__role">{m.role}</span>
                                <span className="sh-team__util">
                                    <Progress value={Math.round(m.util * 100)} max={100} variant="bar" size="sm" color="emerald" className="sh-bar" />
                                    <span className="sh-team__util-val">{Math.round(m.util * 100)}%</span>
                                </span>
                            </div>
                        ))}
                    </div>
                </section>

                {/* ── Recognition + clients ─────────────────────────────────── */}
                <section className="sh-section sh-recog" aria-labelledby="sh-recog-h">
                    <div className="sh-recog__main">
                        <span className="sh-ref">Sheet · Awards</span>
                        <Heading as="h2" size="lg" weight="semibold" className="sh-h2 sh-h2--sm">
                            Recognition ledger
                        </Heading>
                        <Table className="sh-table">
                            <Table.Head>
                                <Table.Column label="Year" />
                                <Table.Column label="Project" />
                                <Table.Column label="Award" />
                            </Table.Head>
                            <Table.Body>
                                {AWARDS.map((a) => (
                                    <Table.Row key={a.project + a.award}>
                                        <Table.Cell className="sh-td-mono">{a.year}</Table.Cell>
                                        <Table.Cell className="sh-td-strong">{a.project}</Table.Cell>
                                        <Table.Cell className="sh-td-muted">{a.award}</Table.Cell>
                                    </Table.Row>
                                ))}
                            </Table.Body>
                        </Table>
                    </div>
                    <div className="sh-recog__side">
                        <span className="sh-ref">Range · Clients</span>
                        <div className="sh-clients">
                            {CLIENTS.map((c) => (
                                <Badge key={c} color="zinc" variant="soft" size="md" className="sh-client">
                                    {c}
                                </Badge>
                            ))}
                        </div>
                        <Separator className="sh-sep" />
                        <span className="sh-ref">Press</span>
                        <ul className="sh-press">
                            <li>It&apos;s Nice That — Studio of the week</li>
                            <li>Eye Magazine №112</li>
                            <li>Slanted — Type in the wild</li>
                        </ul>
                    </div>
                </section>

                {/* ── Brief / contact CTA — a formula-bar input ─────────────── */}
                <section className="sh-section" id="contact" aria-labelledby="sh-contact-h">
                    <div className="sh-contact">
                        <div className="sh-contact__lead">
                            <span className="sh-ref">Cell · New entry</span>
                            <Heading as="h2" size="2xl" weight="semibold" className="sh-h2">
                                Add a row.
                            </Heading>
                            <p className="sh-lede sh-lede--sm">
                                A few sentences is plenty to start. We reply to every brief within two working days —
                                then it becomes a row in the ledger.
                            </p>
                            <div className="sh-contact__meta">
                                <span className="sh-contact__addr">studio@fieldwork.example</span>
                                <span className="sh-contact__addr sh-contact__addr--dim">+41 44 000 00 00 · ZRH / LIS</span>
                            </div>

                            <div className="sh-budget">
                                <span className="sh-ref">Indicative budget · €k</span>
                                <Select
                                    aria-label="Indicative budget band"
                                    className="sh-select sh-select--wide"
                                    value={budget}
                                    onValueChange={setBudget}
                                    placeholder="Select a band…"
                                    list={[
                                        { value: "", label: "Select a band…" },
                                        { value: "20", label: "€20–40k · small" },
                                        { value: "50", label: "€40–70k · standard" },
                                        { value: "90", label: "€70–120k · system" },
                                        { value: "150", label: "€120k+ · platform" },
                                    ]}
                                />
                                {budget && (
                                    <div className="sh-budget__note">
                                        Scoping near{" "}
                                        <ReasonTag
                                            value={`€${budget}k`}
                                            reason="Indicative only — the proposal sets the fixed fee after discovery. Derived from the budget band you picked and the project type."
                                            confidence={0.6}
                                            by="Studio"
                                            theme="underline"
                                        />{" "}
                                        · =BAND({budget})
                                    </div>
                                )}
                            </div>
                        </div>

                        <Card variant="outlined" padding="none" className="sh-briefcard">
                            <Card.Header className="sh-briefcard__head">
                                <span className="sh-briefcard__title">
                                    <span className="sh-fx sh-fx--sm" aria-hidden>ƒx</span>
                                    =BRIEF()
                                </span>
                                <Tooltip content="We read every brief — no bots.">
                                    <Badge color="emerald" variant="soft" size="sm" dot className="sh-status">
                                        Open · Q3
                                    </Badge>
                                </Tooltip>
                            </Card.Header>
                            <Card.Body className="sh-briefcard__body">
                                {submitted ? (
                                    <div className="sh-briefcard__done">
                                        <Badge color="emerald" variant="soft" size="md" className="sh-status">Row added</Badge>
                                        <p>Thanks — your brief is in the ledger. We&apos;ll reply within two working days.</p>
                                        <Button
                                            variant="ghost"
                                            className="sh-btn sh-btn--ghost"
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
                                            placeholder="What are you building, and what's the deadline?"
                                            className="sh-composer"
                                        />
                                        <div className="sh-briefcard__meter">
                                            <Text as="span" size="xs" color="muted">
                                                {brief.trim().length} chars
                                            </Text>
                                            <Progress
                                                value={Math.min(brief.trim().length, 160)}
                                                max={160}
                                                variant="bar"
                                                size="sm"
                                                color="emerald"
                                                className="sh-bar"
                                            />
                                        </div>
                                    </>
                                )}
                            </Card.Body>
                            {!submitted && (
                                <Card.Footer className="sh-briefcard__foot">
                                    <Text as="span" size="xs" color="muted">No NDA needed to say hello.</Text>
                                    <Button
                                        className="sh-btn sh-btn--primary"
                                        disabled={brief.trim().length < 12}
                                        iconTrailing="arrow-right"
                                        onClick={() => setSubmitted(true)}
                                    >
                                        Commit row
                                    </Button>
                                </Card.Footer>
                            )}
                        </Card>
                    </div>
                </section>

                {/* ── Footer — a status bar ─────────────────────────────────── */}
                <footer className="sh-statusbar">
                    <div className="sh-statusbar__tabs" aria-hidden>
                        <span className="sh-statusbar__tab sh-statusbar__tab--active">Selected work</span>
                        <span className="sh-statusbar__tab">Roster</span>
                        <span className="sh-statusbar__tab">Awards</span>
                        <span className="sh-statusbar__tab sh-statusbar__tab--add">+</span>
                    </div>
                    <div className="sh-statusbar__meta">
                        <span>FIELDWORK — a fictional studio, for demonstration · Style {style.num} / Spreadsheet</span>
                        <Link href="/inspiration" className="sh-statusbar__back">
                            ← Back to the gallery
                        </Link>
                    </div>
                </footer>
            </div>
        </div>
    );
}
