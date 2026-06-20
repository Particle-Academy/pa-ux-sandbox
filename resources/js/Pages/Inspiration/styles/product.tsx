import "./product.css";
import { Link } from "@inertiajs/react";
import { useMemo, useState, type CSSProperties, type ReactNode } from "react";
import {
    Avatar,
    Badge,
    Button,
    Card,
    Chart,
    Dropdown,
    Heading,
    Input,
    Pagination,
    Progress,
    Select,
    Separator,
    Switch,
    Table,
    Tabs,
    Text,
    Tooltip,
} from "@particle-academy/react-fancy";
import {
    ArrowDownRight,
    ArrowLeft,
    ArrowUpRight,
    Bell,
    CircleDollarSign,
    Compass,
    Folder,
    Gauge,
    LayoutGrid,
    LifeBuoy,
    MoreHorizontal,
    Search,
    Settings,
    Sparkles,
    Target,
    Users,
} from "lucide-react";
import type { Style } from "../types";

/**
 * Inspiration Gallery · Style — Product UI (id "product", light).
 *
 * FIELDWORK rendered as a Fancy *product / admin dashboard*: a fixed left
 * Sidebar, a top Navbar with search + actions, a tabbed workspace, KPI stat
 * cards with sparklines + deltas, a filterable projects Table, and native
 * react-fancy charts — the studio's portfolio as the studio's own internal
 * operations console. The thesis: the same primitives that wear Swiss can wear
 * a data-dense SaaS admin idiom, restyled hard via scoped CSS + tokens.
 *
 * Mounted by Inspiration/Show.tsx for `style.id === "product"`. SSR-safe: no
 * module-level browser APIs; all interactivity is controlled React state. Inner
 * links use the stretched-link pattern (one <Link> per row) so no anchor is ever
 * nested inside another (avoids React #418 under SSR).
 */

type ProjectStatus = "Live" | "In build" | "Discovery" | "Paused";

type ProjectRow = {
    id: string;
    name: string;
    client: string;
    lead: string;
    initials: string;
    discipline: string;
    status: ProjectStatus;
    progress: number;
    budget: number; // €k
    health: "good" | "watch" | "risk";
    updated: string;
};

const PROJECTS: ProjectRow[] = [
    { id: "FW-241", name: "Meridian", client: "Meridian Cartography", lead: "Anja Vester", initials: "AV", discipline: "Brand system", status: "Live", progress: 100, budget: 92, health: "good", updated: "2d" },
    { id: "FW-238", name: "Quanta Console", client: "Quanta Labs", lead: "Rhea Okonkwo", initials: "RO", discipline: "Product UI", status: "In build", progress: 64, budget: 140, health: "good", updated: "4h" },
    { id: "FW-236", name: "Low Tide", client: "Saltworks Press", lead: "Tomas Pell", initials: "TP", discipline: "Editorial", status: "In build", progress: 38, budget: 58, health: "watch", updated: "1d" },
    { id: "FW-233", name: "Ostro Wayfind", client: "Ostro Maritime", lead: "Liang Mori", initials: "LM", discipline: "Signage", status: "Discovery", progress: 12, budget: 76, health: "good", updated: "6h" },
    { id: "FW-230", name: "Atlas Botanic", client: "Atlas Botanic", lead: "Anja Vester", initials: "AV", discipline: "Identity", status: "Paused", progress: 22, budget: 44, health: "risk", updated: "9d" },
    { id: "FW-228", name: "Paper Radio", client: "Paper Radio Co.", lead: "Tomas Pell", initials: "TP", discipline: "Packaging", status: "Live", progress: 100, budget: 31, health: "good", updated: "3d" },
    { id: "FW-225", name: "Northwind OS", client: "Northwind", lead: "Rhea Okonkwo", initials: "RO", discipline: "Design system", status: "In build", progress: 81, budget: 165, health: "watch", updated: "11h" },
    { id: "FW-221", name: "Studio Føn", client: "Studio Føn", lead: "Liang Mori", initials: "LM", discipline: "Motion", status: "Live", progress: 100, budget: 53, health: "good", updated: "5d" },
];

const STATUS_TONE: Record<ProjectStatus, { color: string; dot: boolean }> = {
    Live: { color: "emerald", dot: true },
    "In build": { color: "blue", dot: true },
    Discovery: { color: "violet", dot: true },
    Paused: { color: "zinc", dot: false },
};

const HEALTH_LABEL: Record<ProjectRow["health"], { label: string; cls: string }> = {
    good: { label: "On track", cls: "ok" },
    watch: { label: "Watch", cls: "watch" },
    risk: { label: "At risk", cls: "risk" },
};

const KPIS = [
    {
        key: "active",
        label: "Active projects",
        value: "18",
        delta: "+3",
        up: true,
        icon: <Folder size={15} />,
        spark: [8, 9, 9, 11, 12, 12, 14, 15, 16, 18],
        color: "var(--ip-accent)",
    },
    {
        key: "utilization",
        label: "Studio utilization",
        value: "87%",
        delta: "+5.2pts",
        up: true,
        icon: <Gauge size={15} />,
        spark: [62, 68, 71, 70, 74, 79, 81, 83, 86, 87],
        color: "var(--ip-emerald)",
    },
    {
        key: "pipeline",
        label: "Pipeline value",
        value: "€1.24M",
        delta: "+€180k",
        up: true,
        icon: <CircleDollarSign size={15} />,
        spark: [820, 910, 880, 960, 1010, 1060, 1100, 1150, 1190, 1240],
        color: "var(--ip-violet)",
    },
    {
        key: "nps",
        label: "Client NPS",
        value: "72",
        delta: "-4",
        up: false,
        icon: <Target size={15} />,
        spark: [70, 74, 76, 78, 77, 79, 80, 76, 74, 72],
        color: "var(--ip-amber)",
    },
];

const NAV_PRIMARY = [
    { id: "overview", label: "Overview", icon: <LayoutGrid size={16} /> },
    { id: "projects", label: "Projects", icon: <Folder size={16} />, badge: "18" },
    { id: "clients", label: "Clients", icon: <Users size={16} /> },
    { id: "capacity", label: "Capacity", icon: <Gauge size={16} /> },
    { id: "billing", label: "Billing", icon: <CircleDollarSign size={16} /> },
];

const NAV_STUDIO = [
    { id: "discover", label: "Discovery", icon: <Compass size={16} /> },
    { id: "settings", label: "Settings", icon: <Settings size={16} /> },
    { id: "support", label: "Support", icon: <LifeBuoy size={16} /> },
];

const SERVICES = [
    { name: "Brand systems", share: 34, color: "var(--ip-accent)" },
    { name: "Product & web", share: 28, color: "var(--ip-violet)" },
    { name: "Editorial & type", share: 21, color: "var(--ip-emerald)" },
    { name: "Motion & signage", share: 17, color: "var(--ip-amber)" },
];

const TEAM = [
    { name: "Anja Vester", role: "Design director", initials: "AV", load: 78, status: "online" as const },
    { name: "Rhea Okonkwo", role: "Product & systems", initials: "RO", load: 91, status: "online" as const },
    { name: "Tomas Pell", role: "Type & editorial", initials: "TP", load: 64, status: "busy" as const },
    { name: "Liang Mori", role: "Motion & 3D", initials: "LM", load: 52, status: "away" as const },
];

const ACTIVITY = [
    { who: "Rhea Okonkwo", what: "shipped a build to", target: "Quanta Console", when: "4h", tone: "blue" },
    { who: "Anja Vester", what: "approved the brand system for", target: "Meridian", when: "2d", tone: "emerald" },
    { who: "Tomas Pell", what: "flagged a deadline risk on", target: "Low Tide", when: "1d", tone: "amber" },
    { who: "Liang Mori", what: "opened discovery for", target: "Ostro Wayfind", when: "6h", tone: "violet" },
];

const REVENUE_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug"];
const REVENUE_BOOKED = [82, 96, 88, 104, 118, 126, 134, 151];
const REVENUE_TARGET = [90, 95, 100, 105, 112, 120, 128, 140];

const PER_PAGE = 5;

export default function Product({ style }: { style: Style }) {
    const [tab, setTab] = useState("overview");
    const [statusFilter, setStatusFilter] = useState<string>("all");
    const [query, setQuery] = useState("");
    const [onlyActive, setOnlyActive] = useState(false);
    const [page, setPage] = useState(1);

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        return PROJECTS.filter((p) => {
            if (statusFilter !== "all" && p.status !== statusFilter) return false;
            if (onlyActive && (p.status === "Live" || p.status === "Paused")) return false;
            if (q && !`${p.name} ${p.client} ${p.lead} ${p.discipline}`.toLowerCase().includes(q)) return false;
            return true;
        });
    }, [statusFilter, query, onlyActive]);

    const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
    const safePage = Math.min(page, totalPages);
    const pageRows = filtered.slice((safePage - 1) * PER_PAGE, safePage * PER_PAGE);

    const resetPage = <T,>(setter: (v: T) => void) => (v: T) => {
        setter(v);
        setPage(1);
    };

    return (
        <div className="insp-product" style={{ "--ip-accent": "var(--blue-600)" } as CSSProperties}>
            <div className="ip-app">
                {/* ── Sidebar ─────────────────────────────────────────────── */}
                <aside className="ip-sidebar">
                    <div className="ip-side-brand">
                        <span className="ip-mark brand-gradient" aria-hidden>F</span>
                        <span className="ip-brand-name">FIELDWORK</span>
                        <Badge color="zinc" variant="soft" size="sm" className="ip-brand-plan">
                            Studio OS
                        </Badge>
                    </div>

                    <nav className="ip-nav" aria-label="Workspace">
                        <span className="ip-nav-label">Workspace</span>
                        {NAV_PRIMARY.map((item) => (
                            <SideLink
                                key={item.id}
                                icon={item.icon}
                                label={item.label}
                                badge={item.badge}
                                active={item.id === "overview"}
                            />
                        ))}
                        <span className="ip-nav-label ip-nav-label--space">Studio</span>
                        {NAV_STUDIO.map((item) => (
                            <SideLink key={item.id} icon={item.icon} label={item.label} />
                        ))}
                    </nav>

                    <div className="ip-side-foot">
                        <Card variant="flat" padding="none" className="ip-upsell">
                            <div className="ip-upsell-icon" aria-hidden>
                                <Sparkles size={15} />
                            </div>
                            <div>
                                <div className="ip-upsell-title">Capacity is tight</div>
                                <div className="ip-upsell-body">3 leads above 85% load this sprint.</div>
                            </div>
                        </Card>
                        <Profile />
                    </div>
                </aside>

                {/* ── Main column ─────────────────────────────────────────── */}
                <div className="ip-main">
                    {/* Top navbar */}
                    <header className="ip-topbar">
                        <div className="ip-crumbs">
                            <Link href="/inspiration" className="ip-crumb">Studio</Link>
                            <span className="ip-crumb-sep" aria-hidden>/</span>
                            <span className="ip-crumb ip-crumb--active">Overview</span>
                        </div>

                        <div className="ip-topbar-search">
                            <Input
                                type="search"
                                value={query}
                                onValueChange={resetPage(setQuery)}
                                placeholder="Search projects, clients, leads…"
                                leading={<Search size={15} />}
                                size="sm"
                                aria-label="Search the studio"
                                className="ip-search-input"
                            />
                        </div>

                        <div className="ip-topbar-actions">
                            <Tooltip content="3 unread updates">
                                <button type="button" className="ip-icon-btn" aria-label="Notifications">
                                    <Bell size={16} />
                                    <span className="ip-icon-dot" aria-hidden />
                                </button>
                            </Tooltip>
                            <Button color="blue" size="sm" iconTrailing="plus" className="ip-cta">
                                New project
                            </Button>
                            <Avatar fallback="AV" size="sm" status="online" />
                        </div>
                    </header>

                    <div className="ip-content">
                        {/* Page heading */}
                        <div className="ip-page-head">
                            <div>
                                <span className="ip-eyebrow">Studio overview</span>
                                <Heading as="h1" size="2xl" weight="semibold" className="ip-page-title">
                                    Good morning, Anja
                                </Heading>
                                <Text as="p" size="sm" className="ip-page-sub">
                                    Eight live engagements, four in discovery. Utilization is up week over week.
                                </Text>
                            </div>
                            <div className="ip-segment" role="group" aria-label="Range">
                                {["7d", "30d", "QTD", "YTD"].map((r, i) => (
                                    <button
                                        key={r}
                                        type="button"
                                        className={`ip-segment-btn${i === 1 ? " is-active" : ""}`}
                                    >
                                        {r}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* KPI cards */}
                        <div className="ip-kpis">
                            {KPIS.map((k) => (
                                <Card key={k.key} variant="outlined" padding="none" className="ip-kpi">
                                    <Card.Body className="ip-kpi-body">
                                        <div className="ip-kpi-top">
                                            <span className="ip-kpi-icon" aria-hidden>{k.icon}</span>
                                            <span className="ip-kpi-name">{k.label}</span>
                                        </div>
                                        <div className="ip-kpi-value">{k.value}</div>
                                        <div className="ip-kpi-foot">
                                            <span className={`ip-delta ${k.up ? "up" : "down"}`}>
                                                {k.up ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
                                                {k.delta}
                                            </span>
                                            <span className="ip-kpi-spark">
                                                <Chart.Sparkline data={k.spark} width={88} height={28} color={k.color} />
                                            </span>
                                        </div>
                                    </Card.Body>
                                </Card>
                            ))}
                        </div>

                        {/* Workspace tabs */}
                        <Tabs activeTab={tab} onTabChange={setTab} variant="underline" className="ip-tabs">
                            <Tabs.List className="ip-tablist">
                                <Tabs.Tab value="overview">Overview</Tabs.Tab>
                                <Tabs.Tab value="projects">Projects</Tabs.Tab>
                                <Tabs.Tab value="capacity">Capacity</Tabs.Tab>
                            </Tabs.List>

                            <Tabs.Panels>
                                {/* OVERVIEW ──────────────────────────────────── */}
                                <Tabs.Panel value="overview">
                                    <div className="ip-grid-2">
                                        <Card variant="outlined" padding="none" className="ip-panel ip-panel--wide">
                                            <Card.Header className="ip-panel-head">
                                                <div>
                                                    <span className="ip-panel-eyebrow">Revenue</span>
                                                    <h3 className="ip-panel-title">Booked vs. target</h3>
                                                </div>
                                                <div className="ip-legend">
                                                    <span className="ip-legend-item"><i className="ip-swatch ip-swatch--accent" />Booked</span>
                                                    <span className="ip-legend-item"><i className="ip-swatch ip-swatch--muted" />Target</span>
                                                </div>
                                            </Card.Header>
                                            <Card.Body className="ip-panel-body">
                                                <Chart.Area
                                                    labels={REVENUE_LABELS}
                                                    series={[
                                                        { label: "Booked", data: REVENUE_BOOKED, color: "var(--blue-600)" },
                                                        { label: "Target", data: REVENUE_TARGET, color: "var(--zinc-300)" },
                                                    ]}
                                                    height={220}
                                                    curve="monotone"
                                                    fillOpacity={0.12}
                                                    grid={{ horizontal: true, vertical: false }}
                                                    tooltip
                                                    responsive
                                                />
                                            </Card.Body>
                                        </Card>

                                        <Card variant="outlined" padding="none" className="ip-panel">
                                            <Card.Header className="ip-panel-head">
                                                <div>
                                                    <span className="ip-panel-eyebrow">Mix</span>
                                                    <h3 className="ip-panel-title">Revenue by discipline</h3>
                                                </div>
                                            </Card.Header>
                                            <Card.Body className="ip-panel-body ip-mix">
                                                <Chart.Donut
                                                    size={148}
                                                    strokeWidth={20}
                                                    showLegend={false}
                                                    data={SERVICES.map((s) => ({ label: s.name, value: s.share, color: s.color }))}
                                                />
                                                <ul className="ip-mix-legend">
                                                    {SERVICES.map((s) => (
                                                        <li key={s.name}>
                                                            <span className="ip-mix-dot" style={{ background: s.color }} aria-hidden />
                                                            <span className="ip-mix-name">{s.name}</span>
                                                            <span className="ip-mix-val">{s.share}%</span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </Card.Body>
                                        </Card>
                                    </div>

                                    <div className="ip-grid-2 ip-grid-2--lean">
                                        <Card variant="outlined" padding="none" className="ip-panel">
                                            <Card.Header className="ip-panel-head">
                                                <div>
                                                    <span className="ip-panel-eyebrow">Activity</span>
                                                    <h3 className="ip-panel-title">Latest in the studio</h3>
                                                </div>
                                                <Button variant="ghost" size="sm" className="ip-ghost-link">View all</Button>
                                            </Card.Header>
                                            <Card.Body className="ip-panel-body ip-feed">
                                                {ACTIVITY.map((a, i) => (
                                                    <div key={i} className="ip-feed-row">
                                                        <span className={`ip-feed-bullet tone-${a.tone}`} aria-hidden />
                                                        <p className="ip-feed-text">
                                                            <b>{a.who}</b> {a.what} <span className="ip-feed-target">{a.target}</span>
                                                        </p>
                                                        <span className="ip-feed-when">{a.when}</span>
                                                    </div>
                                                ))}
                                            </Card.Body>
                                        </Card>

                                        <Card variant="outlined" padding="none" className="ip-panel">
                                            <Card.Header className="ip-panel-head">
                                                <div>
                                                    <span className="ip-panel-eyebrow">Team</span>
                                                    <h3 className="ip-panel-title">Load this sprint</h3>
                                                </div>
                                                <Badge color="amber" variant="soft" size="sm" dot>Tight</Badge>
                                            </Card.Header>
                                            <Card.Body className="ip-panel-body ip-team">
                                                {TEAM.map((m) => (
                                                    <div key={m.name} className="ip-team-row">
                                                        <Avatar fallback={m.initials} size="sm" status={m.status} />
                                                        <div className="ip-team-meta">
                                                            <span className="ip-team-name">{m.name}</span>
                                                            <span className="ip-team-role">{m.role}</span>
                                                        </div>
                                                        <div className="ip-team-load">
                                                            <Progress
                                                                value={m.load}
                                                                max={100}
                                                                variant="bar"
                                                                size="sm"
                                                                color={m.load > 85 ? "amber" : "blue"}
                                                                className="ip-load-bar"
                                                            />
                                                            <span className="ip-team-pct">{m.load}%</span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </Card.Body>
                                        </Card>
                                    </div>
                                </Tabs.Panel>

                                {/* PROJECTS ──────────────────────────────────── */}
                                <Tabs.Panel value="projects">
                                    <Card variant="outlined" padding="none" className="ip-panel">
                                        <Card.Header className="ip-panel-head ip-table-toolbar">
                                            <div className="ip-toolbar-left">
                                                <h3 className="ip-panel-title">All projects</h3>
                                                <Badge color="zinc" variant="soft" size="sm">{filtered.length}</Badge>
                                            </div>
                                            <div className="ip-toolbar-right">
                                                <label className="ip-switch-field">
                                                    <Switch
                                                        checked={onlyActive}
                                                        onCheckedChange={resetPage(setOnlyActive)}
                                                        color="blue"
                                                    />
                                                    <span>In progress only</span>
                                                </label>
                                                <Select
                                                    list={[
                                                        { value: "all", label: "All statuses" },
                                                        { value: "Live", label: "Live" },
                                                        { value: "In build", label: "In build" },
                                                        { value: "Discovery", label: "Discovery" },
                                                        { value: "Paused", label: "Paused" },
                                                    ]}
                                                    value={statusFilter}
                                                    onValueChange={resetPage(setStatusFilter)}
                                                    size="sm"
                                                    aria-label="Filter by status"
                                                    className="ip-status-select"
                                                />
                                            </div>
                                        </Card.Header>

                                        <Card.Body className="ip-table-wrap">
                                            <Table className="ip-table">
                                                <Table.Head>
                                                    <Table.Column label="Project" />
                                                    <Table.Column label="Lead" />
                                                    <Table.Column label="Status" />
                                                    <Table.Column label="Progress" />
                                                    <Table.Column label="Budget" />
                                                    <Table.Column label="Health" />
                                                    <Table.Column label="" />
                                                </Table.Head>
                                                <Table.Body>
                                                    {pageRows.map((p) => {
                                                        const tone = STATUS_TONE[p.status];
                                                        const health = HEALTH_LABEL[p.health];
                                                        return (
                                                            <Table.Row key={p.id} className="ip-row">
                                                                <Table.Cell className="ip-cell-project">
                                                                    <span className="ip-proj-id">{p.id}</span>
                                                                    <span className="ip-proj-name">{p.name}</span>
                                                                    <span className="ip-proj-client">{p.client} · {p.discipline}</span>
                                                                </Table.Cell>
                                                                <Table.Cell>
                                                                    <span className="ip-lead">
                                                                        <Avatar fallback={p.initials} size="xs" />
                                                                        <span>{p.lead}</span>
                                                                    </span>
                                                                </Table.Cell>
                                                                <Table.Cell>
                                                                    <Badge color={tone.color as never} variant="soft" size="sm" dot={tone.dot}>
                                                                        {p.status}
                                                                    </Badge>
                                                                </Table.Cell>
                                                                <Table.Cell>
                                                                    <span className="ip-prog">
                                                                        <Progress
                                                                            value={p.progress}
                                                                            max={100}
                                                                            variant="bar"
                                                                            size="sm"
                                                                            color={p.progress === 100 ? "emerald" : "blue"}
                                                                            className="ip-prog-bar"
                                                                        />
                                                                        <span className="ip-prog-num">{p.progress}%</span>
                                                                    </span>
                                                                </Table.Cell>
                                                                <Table.Cell className="ip-cell-budget">€{p.budget}k</Table.Cell>
                                                                <Table.Cell>
                                                                    <span className={`ip-health ${health.cls}`}>
                                                                        <span className="ip-health-dot" aria-hidden />
                                                                        {health.label}
                                                                    </span>
                                                                </Table.Cell>
                                                                <Table.Cell className="ip-cell-actions">
                                                                    <Dropdown placement="bottom-end">
                                                                        <Dropdown.Trigger>
                                                                            <button type="button" className="ip-row-action" aria-label={`Actions for ${p.name}`}>
                                                                                <MoreHorizontal size={16} />
                                                                            </button>
                                                                        </Dropdown.Trigger>
                                                                        <Dropdown.Items>
                                                                            <Dropdown.Item>Open project</Dropdown.Item>
                                                                            <Dropdown.Item>Assign lead</Dropdown.Item>
                                                                            <Dropdown.Item>Duplicate</Dropdown.Item>
                                                                            <Dropdown.Separator />
                                                                            <Dropdown.Item danger>Archive</Dropdown.Item>
                                                                        </Dropdown.Items>
                                                                    </Dropdown>
                                                                </Table.Cell>
                                                            </Table.Row>
                                                        );
                                                    })}
                                                    {pageRows.length === 0 && (
                                                        <Table.Row>
                                                            <Table.Cell colSpan={7} className="ip-empty">
                                                                No projects match these filters.
                                                            </Table.Cell>
                                                        </Table.Row>
                                                    )}
                                                </Table.Body>
                                            </Table>
                                        </Card.Body>

                                        <Card.Footer className="ip-table-foot">
                                            <span className="ip-foot-meta">
                                                Showing {filtered.length === 0 ? 0 : (safePage - 1) * PER_PAGE + 1}–
                                                {Math.min(safePage * PER_PAGE, filtered.length)} of {filtered.length}
                                            </span>
                                            <Pagination page={safePage} totalPages={totalPages} onPageChange={setPage} />
                                        </Card.Footer>
                                    </Card>
                                </Tabs.Panel>

                                {/* CAPACITY ──────────────────────────────────── */}
                                <Tabs.Panel value="capacity">
                                    <div className="ip-grid-2">
                                        <Card variant="outlined" padding="none" className="ip-panel ip-panel--wide">
                                            <Card.Header className="ip-panel-head">
                                                <div>
                                                    <span className="ip-panel-eyebrow">Throughput</span>
                                                    <h3 className="ip-panel-title">Projects shipped per month</h3>
                                                </div>
                                                <Badge color="emerald" variant="soft" size="sm">+18% YoY</Badge>
                                            </Card.Header>
                                            <Card.Body className="ip-panel-body">
                                                <Chart.Bar
                                                    height={216}
                                                    showValues
                                                    data={[
                                                        { label: "Mar", value: 4 },
                                                        { label: "Apr", value: 6 },
                                                        { label: "May", value: 5 },
                                                        { label: "Jun", value: 8 },
                                                        { label: "Jul", value: 7 },
                                                        { label: "Aug", value: 9, color: "var(--blue-600)" },
                                                    ]}
                                                />
                                            </Card.Body>
                                        </Card>

                                        <Card variant="outlined" padding="none" className="ip-panel">
                                            <Card.Header className="ip-panel-head">
                                                <div>
                                                    <span className="ip-panel-eyebrow">Booked</span>
                                                    <h3 className="ip-panel-title">Allocation runway</h3>
                                                </div>
                                            </Card.Header>
                                            <Card.Body className="ip-panel-body ip-runway">
                                                {[
                                                    { q: "Q3 2026", pct: 96, tag: "Full" },
                                                    { q: "Q4 2026", pct: 71, tag: "Filling" },
                                                    { q: "Q1 2027", pct: 34, tag: "Open" },
                                                ].map((r) => (
                                                    <div key={r.q} className="ip-runway-row">
                                                        <div className="ip-runway-top">
                                                            <span className="ip-runway-q">{r.q}</span>
                                                            <span className="ip-runway-tag">{r.tag}</span>
                                                        </div>
                                                        <Progress
                                                            value={r.pct}
                                                            max={100}
                                                            variant="bar"
                                                            size="md"
                                                            color={r.pct > 90 ? "rose" : r.pct > 60 ? "amber" : "emerald"}
                                                            className="ip-runway-bar"
                                                        />
                                                        <span className="ip-runway-pct">{r.pct}% booked</span>
                                                    </div>
                                                ))}
                                                <Separator className="ip-runway-sep" />
                                                <Button color="blue" variant="ghost" size="sm" iconTrailing="arrow-right" className="ip-ghost-link">
                                                    Open capacity planner
                                                </Button>
                                            </Card.Body>
                                        </Card>
                                    </div>
                                </Tabs.Panel>
                            </Tabs.Panels>
                        </Tabs>

                        {/* Brief / CTA banner */}
                        <Card variant="flat" padding="none" className="ip-brief">
                            <div className="ip-brief-main">
                                <span className="ip-brief-eyebrow">New engagement</span>
                                <h3 className="ip-brief-title">Spin up a project workspace</h3>
                                <p className="ip-brief-body">
                                    Open a brief, assign a lead, and the dashboard tracks scope, budget, and runway from day one.
                                </p>
                            </div>
                            <div className="ip-brief-actions">
                                <Button color="blue" size="md" iconTrailing="plus" className="ip-cta">New project</Button>
                                <Button variant="ghost" size="md" className="ip-ghost-link">Import from brief</Button>
                            </div>
                        </Card>

                        {/* Back to gallery */}
                        <div className="ip-footer">
                            <span className="ip-footer-note">
                                FIELDWORK — a fictional studio, for demonstration · Style {style.num} / Product UI
                            </span>
                            <Link href="/inspiration" className="ip-back">
                                <ArrowLeft size={14} />
                                Back to the gallery
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

/** A restyled sidebar link — hand-composed to wear the product idiom. The whole
 *  row is the click target via the stretched-link pattern. */
function SideLink({
    icon,
    label,
    badge,
    active = false,
}: {
    icon: ReactNode;
    label: string;
    badge?: string;
    active?: boolean;
}) {
    return (
        <div className={`ip-nav-item${active ? " is-active" : ""}`}>
            <Link href="/inspiration" className="ip-nav-stretch" aria-label={label} />
            <span className="ip-nav-icon" aria-hidden>{icon}</span>
            <span className="ip-nav-text">{label}</span>
            {badge ? <Badge color="zinc" variant="soft" size="sm" className="ip-nav-badge">{badge}</Badge> : null}
        </div>
    );
}

/** The signed-in user chip at the foot of the sidebar. */
function Profile() {
    return (
        <div className="ip-profile">
            <Avatar fallback="AV" size="sm" status="online" />
            <div className="ip-profile-meta">
                <span className="ip-profile-name">Anja Vester</span>
                <span className="ip-profile-role">Design director</span>
            </div>
            <span className="ip-profile-chev" aria-hidden>
                <MoreHorizontal size={15} />
            </span>
        </div>
    );
}
