import { useMemo, useState } from "react";
import {
    Button,
    Badge,
    Card,
    Sidebar,
    Tabs,
    Text,
    Tooltip,
    useToast,
} from "@particle-academy/react-fancy";
import { EChart, registerAll } from "@particle-academy/fancy-echarts";
import {
    Activity,
    ArrowDownRight,
    ArrowUpRight,
    Bell,
    ChevronDown,
    CreditCard,
    Download,
    Filter,
    Home,
    Key,
    MoreHorizontal,
    Plus,
    RefreshCw,
    Search,
    Settings,
    User,
    Users,
    Webhook,
} from "lucide-react";

// ECharts registration is module-scoped per bundle entry: this file is also
// the standalone starter-kit zip's src/Kit.tsx, where no app shell has
// registered anything — without this, init() dies with "Renderer 'undefined'
// is not imported". Idempotent, so the showcase calling it again is free.
registerAll();

// ─── Dashboard data ───────────────────────────────────────────────────────

const PERIODS = [
    { id: "7d", label: "7d" },
    { id: "30d", label: "30d" },
    { id: "90d", label: "90d" },
] as const;
type Period = (typeof PERIODS)[number]["id"];

const KPIS = [
    {
        label: "MRR",
        value: "$187,420",
        delta: 12.4,
        comparison: "vs $166,720 last period",
        spark: [144, 152, 149, 158, 163, 161, 168, 172, 174, 178, 181, 179, 184, 187],
        tone: "violet" as const,
    },
    {
        label: "ARR",
        value: "$2.25M",
        delta: 18.2,
        comparison: "vs $1.90M last year",
        spark: [1.6, 1.65, 1.71, 1.76, 1.82, 1.88, 1.91, 1.95, 2.02, 2.08, 2.14, 2.19, 2.22, 2.25],
        tone: "emerald" as const,
    },
    {
        label: "Active customers",
        value: "412",
        delta: 1.9,
        comparison: "+8 net new this period",
        spark: [380, 386, 391, 394, 392, 398, 401, 403, 405, 407, 408, 410, 411, 412],
        tone: "sky" as const,
    },
    {
        label: "Churn",
        value: "1.8%",
        delta: -14.3,
        deltaIsGood: true,
        comparison: "down 0.3pp from 2.1%",
        spark: [2.6, 2.5, 2.4, 2.3, 2.3, 2.2, 2.2, 2.1, 2.1, 2.0, 2.0, 1.9, 1.9, 1.8],
        tone: "amber" as const,
    },
];

// 30-day daily MRR series for the main chart.
const REVENUE_DATES = Array.from({ length: 30 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (29 - i));
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
});
const REVENUE_MRR = [
    155, 158, 161, 159, 162, 165, 168, 167, 170, 172, 171, 174, 176, 178, 177,
    179, 181, 180, 182, 184, 183, 185, 184, 186, 187, 185, 186, 187, 188, 187,
];
const REVENUE_NEW = [
    1.2, 1.8, 0.9, 1.5, 2.1, 1.7, 2.4, 1.1, 1.9, 2.3, 1.4, 2.6, 2.2, 1.8, 2.5,
    1.6, 2.0, 1.3, 2.7, 2.1, 1.9, 2.4, 1.5, 2.8, 2.2, 1.7, 2.0, 2.5, 2.3, 1.9,
];

type Activity = {
    who: string;
    initials: string;
    avatarTone: "violet" | "emerald" | "amber" | "sky" | "rose";
    action: string;
    target: string;
    when: string;
    category: "billing" | "webhook" | "auth" | "team";
    severity: "info" | "success" | "warning" | "danger";
};

const ACTIVITY: Activity[] = [
    { who: "Acme Robotics", initials: "AR", avatarTone: "violet", action: "upgraded to", target: "Scale plan", when: "2 min ago", category: "billing", severity: "success" },
    { who: "Vector Foods", initials: "VF", avatarTone: "emerald", action: "renewed", target: "annual contract", when: "18 min ago", category: "billing", severity: "success" },
    { who: "Webhook delivery", initials: "W", avatarTone: "sky", action: "failed for", target: "checkout.session.completed", when: "32 min ago", category: "webhook", severity: "danger" },
    { who: "Boreal Press", initials: "BP", avatarTone: "amber", action: "added 12 seats to", target: "Team plan", when: "1 hr ago", category: "billing", severity: "info" },
    { who: "Maya Chen", initials: "MC", avatarTone: "rose", action: "rotated", target: "live API key", when: "2 hr ago", category: "auth", severity: "warning" },
    { who: "Solstice Labs", initials: "SL", avatarTone: "violet", action: "invited", target: "3 new admins", when: "3 hr ago", category: "team", severity: "info" },
    { who: "Lumen Cycles", initials: "LC", avatarTone: "amber", action: "downgraded to", target: "Starter plan", when: "5 hr ago", category: "billing", severity: "warning" },
    { who: "Webhook delivery", initials: "W", avatarTone: "sky", action: "delivered", target: "invoice.payment_succeeded", when: "5 hr ago", category: "webhook", severity: "success" },
    { who: "Acme Robotics", initials: "AR", avatarTone: "violet", action: "deleted", target: "API key prod_live_a3f2", when: "6 hr ago", category: "auth", severity: "danger" },
    { who: "Rita Kumar", initials: "RK", avatarTone: "emerald", action: "joined", target: "Particle Console", when: "8 hr ago", category: "team", severity: "info" },
];

type Customer = {
    name: string;
    domain: string;
    initials: string;
    avatarTone: "violet" | "emerald" | "amber" | "sky" | "rose";
    plan: "Scale" | "Team" | "Starter" | "Trial";
    status: "Active" | "Past due" | "Trial" | "Churned";
    mrr: number;
    seats: number;
    lastSeen: string;
    region: "NA" | "EU" | "APAC" | "LATAM";
};

const CUSTOMERS: Customer[] = [
    { name: "Acme Robotics", domain: "acme.io", initials: "AR", avatarTone: "violet", plan: "Scale", status: "Active", mrr: 9990, seats: 142, lastSeen: "2 min ago", region: "NA" },
    { name: "Vector Foods", domain: "vector.co", initials: "VF", avatarTone: "emerald", plan: "Scale", status: "Active", mrr: 5800, seats: 78, lastSeen: "12 min ago", region: "EU" },
    { name: "Boreal Press", domain: "boreal.pub", initials: "BP", avatarTone: "amber", plan: "Team", status: "Active", mrr: 2490, seats: 36, lastSeen: "1 hr ago", region: "NA" },
    { name: "Solstice Labs", domain: "solstice.dev", initials: "SL", avatarTone: "violet", plan: "Scale", status: "Active", mrr: 12900, seats: 187, lastSeen: "23 min ago", region: "APAC" },
    { name: "Lumen Cycles", domain: "lumen.bike", initials: "LC", avatarTone: "amber", plan: "Starter", status: "Trial", mrr: 0, seats: 5, lastSeen: "3 hr ago", region: "EU" },
    { name: "Maple & Tile", domain: "maple.shop", initials: "MT", avatarTone: "rose", plan: "Team", status: "Past due", mrr: 1490, seats: 18, lastSeen: "12 d ago", region: "NA" },
    { name: "Northwind Air", domain: "northwind.aero", initials: "NA", avatarTone: "sky", plan: "Scale", status: "Active", mrr: 14900, seats: 240, lastSeen: "5 min ago", region: "LATAM" },
    { name: "Cobalt Studio", domain: "cobalt.studio", initials: "CS", avatarTone: "emerald", plan: "Team", status: "Active", mrr: 990, seats: 12, lastSeen: "47 min ago", region: "EU" },
    { name: "Pinetop Outfit", domain: "pinetop.gear", initials: "PO", avatarTone: "amber", plan: "Starter", status: "Churned", mrr: 0, seats: 0, lastSeen: "32 d ago", region: "NA" },
    { name: "Helios Energy", domain: "helios.energy", initials: "HE", avatarTone: "violet", plan: "Scale", status: "Active", mrr: 8400, seats: 96, lastSeen: "1 hr ago", region: "APAC" },
];

// ─── Top-level layout ─────────────────────────────────────────────────────

export function ReactDashboardKit() {
    const [activeNav, setActiveNav] = useState("overview");
    const [period, setPeriod] = useState<Period>("30d");
    const [activityTab, setActivityTab] = useState<"all" | "billing" | "webhook" | "team">("all");
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState<Customer["status"] | "all">("all");
    const [sortKey, setSortKey] = useState<"mrr" | "seats" | "lastSeen">("mrr");
    const { toast } = useToast();

    const filteredCustomers = useMemo(() => {
        let rows = [...CUSTOMERS];
        if (search) {
            const q = search.toLowerCase();
            rows = rows.filter((r) => r.name.toLowerCase().includes(q) || r.domain.toLowerCase().includes(q));
        }
        if (statusFilter !== "all") {
            rows = rows.filter((r) => r.status === statusFilter);
        }
        rows.sort((a, b) => {
            if (sortKey === "mrr") return b.mrr - a.mrr;
            if (sortKey === "seats") return b.seats - a.seats;
            return 0; // last seen kept in source order
        });
        return rows;
    }, [search, statusFilter, sortKey]);

    const filteredActivity = useMemo(() => {
        if (activityTab === "all") return ACTIVITY;
        return ACTIVITY.filter((a) => a.category === activityTab);
    }, [activityTab]);

    return (
        <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-50 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
            <div className="grid grid-cols-[14rem_1fr] md:grid-cols-[15rem_1fr]">
                <DashboardSidebar active={activeNav} onChange={setActiveNav} />

                <div className="border-l border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
                    {/* Page header */}
                    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
                        <div>
                            <Text size="xs" className="!font-mono !text-zinc-500">Particle Console · Overview</Text>
                            <h1 className="mt-0.5 text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
                                Customer revenue
                            </h1>
                            <Text size="sm" className="mt-1 !text-zinc-500">
                                Wed, May 19 · synced 12s ago · 412 customers tracked
                            </Text>
                        </div>
                        <div className="flex items-center gap-2">
                            <PeriodSwitcher value={period} onChange={setPeriod} />
                            <Button variant="ghost" size="sm" onClick={() => toast({ title: "Refreshed", description: "Pulled fresh data from Stripe." })}>
                                <RefreshCw size={14} />
                            </Button>
                            <Button color="violet" size="sm" onClick={() => toast({ title: "Export started", description: "CSV will email when ready." })}>
                                <Download size={14} className="mr-1" /> Export
                            </Button>
                        </div>
                    </div>

                    {/* KPI strip */}
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                        {KPIS.map((k) => (
                            <KpiCard key={k.label} {...k} />
                        ))}
                    </div>

                    {/* Main chart + activity feed */}
                    <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_22rem]">
                        <RevenueChartCard period={period} />
                        <ActivityCard
                            tab={activityTab}
                            onTabChange={setActivityTab}
                            items={filteredActivity}
                        />
                    </div>

                    {/* Customer table */}
                    <div className="mt-5">
                        <CustomerTableCard
                            search={search}
                            onSearch={setSearch}
                            statusFilter={statusFilter}
                            onStatusFilter={setStatusFilter}
                            sortKey={sortKey}
                            onSortKey={setSortKey}
                            rows={filteredCustomers}
                            onOpen={(c) => toast({ title: c.name, description: `Opened — last seen ${c.lastSeen}` })}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}

// ─── Sidebar ──────────────────────────────────────────────────────────────

function DashboardSidebar({ active, onChange }: { active: string; onChange: (id: string) => void }) {
    return (
        <Sidebar className="bg-zinc-50 px-3 py-5 dark:bg-zinc-950">
            <div className="mb-5 flex items-center gap-2 px-2">
                <span className="grid size-7 place-items-center rounded-lg bg-gradient-to-br from-violet-500 to-sky-500 text-white shadow-sm">
                    <Activity size={14} />
                </span>
                <div className="leading-tight">
                    <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Particle</div>
                    <div className="text-[10px] uppercase tracking-wider text-zinc-500">Console</div>
                </div>
            </div>

            <Text size="xs" className="mb-1 px-2 !font-semibold !uppercase !tracking-wider !text-zinc-400">
                Workspace
            </Text>
            <Sidebar.Group>
                <Sidebar.Item href="#" active={active === "overview"} onClick={() => onChange("overview")} icon={<Home size={14} />}>
                    Overview
                </Sidebar.Item>
                <Sidebar.Item href="#" active={active === "customers"} onClick={() => onChange("customers")} icon={<Users size={14} />} badge={<Badge color="violet" size="sm">412</Badge>}>
                    Customers
                </Sidebar.Item>
                <Sidebar.Item href="#" active={active === "billing"} onClick={() => onChange("billing")} icon={<CreditCard size={14} />} badge={<Badge color="amber" size="sm">3</Badge>}>
                    Billing
                </Sidebar.Item>
            </Sidebar.Group>

            <Text size="xs" className="mt-5 mb-1 px-2 !font-semibold !uppercase !tracking-wider !text-zinc-400">
                Developers
            </Text>
            <Sidebar.Group>
                <Sidebar.Item href="#" active={active === "webhooks"} onClick={() => onChange("webhooks")} icon={<Webhook size={14} />}>
                    Webhooks
                </Sidebar.Item>
                <Sidebar.Item href="#" active={active === "keys"} onClick={() => onChange("keys")} icon={<Key size={14} />}>
                    API keys
                </Sidebar.Item>
                <Sidebar.Item href="#" active={active === "audit"} onClick={() => onChange("audit")} icon={<Activity size={14} />}>
                    Audit log
                </Sidebar.Item>
            </Sidebar.Group>

            <Text size="xs" className="mt-5 mb-1 px-2 !font-semibold !uppercase !tracking-wider !text-zinc-400">
                Account
            </Text>
            <Sidebar.Group>
                <Sidebar.Item href="#" active={active === "team"} onClick={() => onChange("team")} icon={<User size={14} />}>
                    Team
                </Sidebar.Item>
                <Sidebar.Item href="#" active={active === "settings"} onClick={() => onChange("settings")} icon={<Settings size={14} />}>
                    Settings
                </Sidebar.Item>
            </Sidebar.Group>

            <div className="mt-auto pt-6">
                <div className="rounded-lg border border-violet-200 bg-gradient-to-br from-violet-50 to-sky-50 p-3 dark:border-violet-800 dark:from-violet-500/10 dark:to-sky-500/10">
                    <div className="flex items-center gap-1.5">
                        <Bell size={12} className="text-violet-600 dark:text-violet-300" />
                        <Text size="xs" className="!font-semibold !text-violet-900 dark:!text-violet-100">Trial ends in 4d</Text>
                    </div>
                    <Text size="xs" className="mt-1 !text-zinc-600 dark:!text-zinc-300">
                        Upgrade to keep your 12 webhooks live.
                    </Text>
                    <Button color="violet" size="sm" className="mt-2 w-full">Upgrade</Button>
                </div>
            </div>
        </Sidebar>
    );
}

// ─── Period switcher ──────────────────────────────────────────────────────

function PeriodSwitcher({ value, onChange }: { value: Period; onChange: (p: Period) => void }) {
    return (
        <div className="inline-flex overflow-hidden rounded-md border border-zinc-200 bg-white text-xs dark:border-zinc-700 dark:bg-zinc-900">
            {PERIODS.map((p, i) => (
                <button
                    key={p.id}
                    onClick={() => onChange(p.id)}
                    className={`px-3 py-1.5 font-medium transition ${
                        i > 0 ? "border-l border-zinc-200 dark:border-zinc-700" : ""
                    } ${
                        value === p.id
                            ? "bg-violet-600 text-white"
                            : "text-zinc-600 hover:bg-zinc-50 dark:text-zinc-300 dark:hover:bg-zinc-800"
                    }`}
                >
                    {p.label}
                </button>
            ))}
        </div>
    );
}

// ─── KPI card with sparkline ──────────────────────────────────────────────

type Tone = "violet" | "emerald" | "sky" | "amber";

function KpiCard({ label, value, delta, deltaIsGood, comparison, spark, tone }: {
    label: string;
    value: string;
    delta: number;
    deltaIsGood?: boolean;
    comparison: string;
    spark: number[];
    tone: Tone;
}) {
    const positive = deltaIsGood !== undefined ? deltaIsGood : delta >= 0;
    const deltaColor = positive ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400";
    const sparkColor = TONE_COLORS[tone];

    return (
        <Card className="group relative overflow-hidden">
            <div className={`absolute inset-x-0 top-0 h-px bg-gradient-to-r ${TONE_GRADIENTS[tone]}`} />
            <Card.Body className="!p-4">
                <div className="flex items-baseline justify-between gap-2">
                    <Text size="xs" className="!font-semibold !uppercase !tracking-wider !text-zinc-500">{label}</Text>
                    <span className={`inline-flex items-center gap-0.5 text-[11px] font-semibold ${deltaColor}`}>
                        {positive ? <ArrowUpRight size={11} /> : <ArrowDownRight size={11} />}
                        {Math.abs(delta).toFixed(1)}%
                    </span>
                </div>
                <div className="mt-2 flex items-end justify-between gap-2">
                    <div className="font-mono text-[28px] font-semibold leading-none tracking-tight text-zinc-900 dark:text-zinc-100">
                        {value}
                    </div>
                    <div className="-mb-1 h-9 w-20 shrink-0">
                        <EChart
                            style={{ width: "100%", height: "100%" }}
                            option={{
                                grid: { left: 0, right: 0, top: 2, bottom: 2 },
                                xAxis: { type: "category", show: false, data: spark.map((_, i) => i) },
                                yAxis: { type: "value", show: false, scale: true },
                                series: [{
                                    type: "line",
                                    data: spark,
                                    smooth: true,
                                    symbol: "none",
                                    lineStyle: { color: sparkColor, width: 1.5 },
                                    areaStyle: { color: sparkColor + "26" },
                                }],
                                tooltip: { show: false },
                            }}
                        />
                    </div>
                </div>
                <Text size="xs" className="mt-1.5 !text-zinc-500">{comparison}</Text>
            </Card.Body>
        </Card>
    );
}

const TONE_COLORS: Record<Tone, string> = {
    violet: "#8b5cf6",
    emerald: "#10b981",
    sky: "#0ea5e9",
    amber: "#f59e0b",
};

const TONE_GRADIENTS: Record<Tone, string> = {
    violet: "from-violet-400/40 to-sky-400/40",
    emerald: "from-emerald-400/40 to-teal-400/40",
    sky: "from-sky-400/40 to-indigo-400/40",
    amber: "from-amber-400/40 to-rose-400/40",
};

// ─── Revenue chart card ───────────────────────────────────────────────────

function RevenueChartCard({ period }: { period: Period }) {
    const slice = period === "7d" ? -7 : period === "30d" ? -30 : -30; // demo only has 30 days of data
    return (
        <Card className="overflow-hidden">
            <Card.Body className="!p-0">
                <div className="flex flex-wrap items-start justify-between gap-3 border-b border-zinc-100 px-5 pb-3 pt-4 dark:border-zinc-800">
                    <div>
                        <Text size="xs" className="!font-semibold !uppercase !tracking-wider !text-zinc-500">Revenue</Text>
                        <div className="mt-0.5 flex items-baseline gap-2">
                            <div className="font-mono text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">$187,420</div>
                            <span className="inline-flex items-center gap-0.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                                <ArrowUpRight size={12} /> 12.4%
                            </span>
                        </div>
                        <Text size="xs" className="!text-zinc-500">Monthly recurring revenue, daily aggregated</Text>
                    </div>
                    <div className="flex items-center gap-3 text-xs">
                        <LegendDot color="#8b5cf6" label="MRR" />
                        <LegendDot color="#10b981" label="New MRR" />
                    </div>
                </div>
                <div className="h-[280px] px-2 py-2">
                    <EChart
                        style={{ width: "100%", height: "100%" }}
                        option={{
                            grid: { left: 48, right: 16, top: 8, bottom: 28 },
                            tooltip: {
                                trigger: "axis",
                                confine: true,
                                backgroundColor: "rgba(24, 24, 27, 0.95)",
                                borderColor: "rgba(255,255,255,0.1)",
                                textStyle: { color: "#fff", fontSize: 11 },
                                axisPointer: { type: "line", lineStyle: { color: "#a78bfa", type: "dashed" } },
                            },
                            legend: { show: false },
                            xAxis: {
                                type: "category",
                                data: REVENUE_DATES.slice(slice),
                                boundaryGap: false,
                                axisLine: { show: false },
                                axisTick: { show: false },
                                axisLabel: { fontSize: 10, color: "#a1a1aa", interval: Math.floor(REVENUE_DATES.slice(slice).length / 6) },
                            },
                            yAxis: [
                                {
                                    type: "value",
                                    axisLine: { show: false },
                                    axisTick: { show: false },
                                    splitLine: { lineStyle: { color: "rgba(161,161,170,0.15)", type: "dashed" } },
                                    axisLabel: { fontSize: 10, color: "#a1a1aa", formatter: (v: number) => "$" + v + "k" },
                                },
                            ],
                            series: [
                                {
                                    name: "MRR ($k)",
                                    type: "line",
                                    data: REVENUE_MRR.slice(slice),
                                    smooth: true,
                                    symbol: "none",
                                    lineStyle: { color: "#8b5cf6", width: 2.5 },
                                    areaStyle: {
                                        color: {
                                            type: "linear",
                                            x: 0, y: 0, x2: 0, y2: 1,
                                            colorStops: [
                                                { offset: 0, color: "rgba(139, 92, 246, 0.35)" },
                                                { offset: 1, color: "rgba(139, 92, 246, 0.02)" },
                                            ],
                                        },
                                    },
                                },
                                {
                                    name: "New MRR ($k)",
                                    type: "bar",
                                    data: REVENUE_NEW.slice(slice),
                                    itemStyle: { color: "rgba(16, 185, 129, 0.85)", borderRadius: [2, 2, 0, 0] },
                                    barWidth: "35%",
                                },
                            ],
                        }}
                    />
                </div>
            </Card.Body>
        </Card>
    );
}

function LegendDot({ color, label }: { color: string; label: string }) {
    return (
        <span className="inline-flex items-center gap-1.5 text-zinc-600 dark:text-zinc-400">
            <span className="size-2 rounded-full" style={{ background: color }} />
            {label}
        </span>
    );
}

// ─── Activity feed card ───────────────────────────────────────────────────

const ACTIVITY_TABS = [
    { id: "all" as const, label: "All" },
    { id: "billing" as const, label: "Billing" },
    { id: "webhook" as const, label: "Webhooks" },
    { id: "team" as const, label: "Team" },
];

function ActivityCard({ tab, onTabChange, items }: {
    tab: "all" | "billing" | "webhook" | "team";
    onTabChange: (t: "all" | "billing" | "webhook" | "team") => void;
    items: Activity[];
}) {
    return (
        <Card className="overflow-hidden">
            <Card.Body className="!p-0">
                <div className="border-b border-zinc-100 px-4 pt-3 dark:border-zinc-800">
                    <div className="flex items-baseline justify-between">
                        <Text size="xs" className="!font-semibold !uppercase !tracking-wider !text-zinc-500">Activity</Text>
                        <Tooltip content="Last 24 hours, live">
                            <span className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
                                <span className="size-1.5 animate-pulse rounded-full bg-emerald-500" />
                                live
                            </span>
                        </Tooltip>
                    </div>
                    <div className="mt-2">
                        <Tabs activeTab={tab} onTabChange={(t) => onTabChange(t as typeof tab)}>
                            <Tabs.List>
                                {ACTIVITY_TABS.map((t) => (
                                    <Tabs.Tab key={t.id} value={t.id}>{t.label}</Tabs.Tab>
                                ))}
                            </Tabs.List>
                        </Tabs>
                    </div>
                </div>
                <ul className="max-h-[280px] divide-y divide-zinc-100 overflow-y-auto dark:divide-zinc-800">
                    {items.length === 0 ? (
                        <li className="px-4 py-8 text-center text-xs text-zinc-500">No events in this period.</li>
                    ) : items.map((a, i) => (
                        <li key={i} className="flex items-start gap-2.5 px-4 py-2.5">
                            <ActivityAvatar tone={a.avatarTone} initials={a.initials} severity={a.severity} />
                            <div className="min-w-0 flex-1">
                                <Text size="xs" className="!text-zinc-700 dark:!text-zinc-200">
                                    <span className="font-semibold text-zinc-900 dark:text-zinc-100">{a.who}</span>{" "}
                                    {a.action}{" "}
                                    <span className="font-mono text-[11px] text-violet-700 dark:text-violet-300">{a.target}</span>
                                </Text>
                                <Text size="xs" className="!text-[10px] !text-zinc-500">{a.when}</Text>
                            </div>
                        </li>
                    ))}
                </ul>
            </Card.Body>
        </Card>
    );
}

function ActivityAvatar({ tone, initials, severity }: { tone: Activity["avatarTone"]; initials: string; severity: Activity["severity"] }) {
    const grad = {
        violet: "from-violet-400 to-sky-500",
        emerald: "from-emerald-400 to-teal-500",
        amber: "from-amber-400 to-orange-500",
        sky: "from-sky-400 to-indigo-500",
        rose: "from-rose-400 to-pink-500",
    }[tone];
    const ring = {
        info: "ring-zinc-200 dark:ring-zinc-700",
        success: "ring-emerald-300 dark:ring-emerald-700",
        warning: "ring-amber-300 dark:ring-amber-700",
        danger: "ring-rose-300 dark:ring-rose-700",
    }[severity];
    return (
        <span className={`mt-0.5 inline-flex size-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${grad} text-[10px] font-semibold text-white ring-2 ${ring}`}>
            {initials}
        </span>
    );
}

// ─── Customer table card ──────────────────────────────────────────────────

const PLAN_BADGE: Record<Customer["plan"], { color: "violet" | "emerald" | "amber" | "zinc"; label: string }> = {
    Scale: { color: "violet", label: "Scale" },
    Team: { color: "emerald", label: "Team" },
    Starter: { color: "amber", label: "Starter" },
    Trial: { color: "zinc", label: "Trial" },
};

const STATUS_DOT: Record<Customer["status"], string> = {
    Active: "bg-emerald-500",
    "Past due": "bg-amber-500",
    Trial: "bg-sky-500",
    Churned: "bg-zinc-400",
};

const STATUS_FILTERS: Array<{ id: Customer["status"] | "all"; label: string }> = [
    { id: "all", label: "All" },
    { id: "Active", label: "Active" },
    { id: "Trial", label: "Trial" },
    { id: "Past due", label: "Past due" },
    { id: "Churned", label: "Churned" },
];

function CustomerTableCard({
    search,
    onSearch,
    statusFilter,
    onStatusFilter,
    sortKey,
    onSortKey,
    rows,
    onOpen,
}: {
    search: string;
    onSearch: (s: string) => void;
    statusFilter: Customer["status"] | "all";
    onStatusFilter: (s: Customer["status"] | "all") => void;
    sortKey: "mrr" | "seats" | "lastSeen";
    onSortKey: (k: "mrr" | "seats" | "lastSeen") => void;
    rows: Customer[];
    onOpen: (c: Customer) => void;
}) {
    return (
        <Card className="overflow-hidden">
            <Card.Body className="!p-0">
                {/* Toolbar */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-100 px-4 py-3 dark:border-zinc-800">
                    <div className="flex flex-wrap items-center gap-2">
                        <div className="relative">
                            <Search size={14} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                            <input
                                value={search}
                                onChange={(e) => onSearch(e.target.value)}
                                placeholder="Search customers…"
                                className="h-8 w-56 rounded-md border border-zinc-200 bg-white pl-8 pr-3 text-xs text-zinc-700 outline-none placeholder:text-zinc-400 focus:border-violet-400 focus:ring-2 focus:ring-violet-200/60 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:focus:border-violet-600 dark:focus:ring-violet-500/20"
                            />
                        </div>
                        <div className="inline-flex overflow-hidden rounded-md border border-zinc-200 text-[11px] dark:border-zinc-700">
                            {STATUS_FILTERS.map((f, i) => (
                                <button
                                    key={f.id}
                                    onClick={() => onStatusFilter(f.id)}
                                    className={`px-2.5 py-1 ${i > 0 ? "border-l border-zinc-200 dark:border-zinc-700" : ""} ${
                                        statusFilter === f.id
                                            ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                                            : "text-zinc-600 hover:bg-zinc-50 dark:text-zinc-300 dark:hover:bg-zinc-800"
                                    }`}
                                >
                                    {f.label}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm">
                            <Filter size={13} className="mr-1" /> Filter
                        </Button>
                        <Button color="violet" size="sm">
                            <Plus size={13} className="mr-1" /> New customer
                        </Button>
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-zinc-50/60 text-left text-[10px] uppercase tracking-wider text-zinc-500 dark:bg-zinc-900/50">
                            <tr>
                                <th className="px-4 py-2 font-semibold">Customer</th>
                                <th className="px-4 py-2 font-semibold">Plan</th>
                                <th className="px-4 py-2 font-semibold">Status</th>
                                <th className="px-4 py-2 text-right font-semibold">
                                    <SortHeader label="MRR" id="mrr" current={sortKey} onClick={onSortKey} />
                                </th>
                                <th className="px-4 py-2 text-right font-semibold">
                                    <SortHeader label="Seats" id="seats" current={sortKey} onClick={onSortKey} />
                                </th>
                                <th className="px-4 py-2 font-semibold">Region</th>
                                <th className="px-4 py-2 font-semibold">Last seen</th>
                                <th className="px-4 py-2" />
                            </tr>
                        </thead>
                        <tbody>
                            {rows.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="px-4 py-10 text-center text-xs text-zinc-500">
                                        No customers match this filter.
                                    </td>
                                </tr>
                            ) : rows.map((c) => (
                                <tr key={c.name} className="border-t border-zinc-100 transition hover:bg-zinc-50/60 dark:border-zinc-800 dark:hover:bg-zinc-900/60">
                                    <td className="px-4 py-2.5">
                                        <div className="flex items-center gap-2.5">
                                            <ActivityAvatar tone={c.avatarTone} initials={c.initials} severity="info" />
                                            <div className="leading-tight">
                                                <div className="font-medium text-zinc-900 dark:text-zinc-100">{c.name}</div>
                                                <div className="font-mono text-[10px] text-zinc-500">{c.domain}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-4 py-2.5">
                                        <Badge color={PLAN_BADGE[c.plan].color} size="sm">{PLAN_BADGE[c.plan].label}</Badge>
                                    </td>
                                    <td className="px-4 py-2.5">
                                        <span className="inline-flex items-center gap-1.5 text-xs text-zinc-700 dark:text-zinc-300">
                                            <span className={`size-1.5 rounded-full ${STATUS_DOT[c.status]}`} />
                                            {c.status}
                                        </span>
                                    </td>
                                    <td className="px-4 py-2.5 text-right">
                                        <span className="font-mono font-medium text-zinc-900 dark:text-zinc-100">
                                            {c.mrr > 0 ? `$${c.mrr.toLocaleString()}` : <span className="text-zinc-400">—</span>}
                                        </span>
                                    </td>
                                    <td className="px-4 py-2.5 text-right font-mono text-zinc-700 dark:text-zinc-300">{c.seats}</td>
                                    <td className="px-4 py-2.5">
                                        <span className="inline-flex rounded bg-zinc-100 px-1.5 py-0.5 font-mono text-[10px] text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">{c.region}</span>
                                    </td>
                                    <td className="px-4 py-2.5 text-xs text-zinc-500">{c.lastSeen}</td>
                                    <td className="px-4 py-2.5 text-right">
                                        <div className="flex justify-end gap-0.5">
                                            <Button variant="ghost" size="sm" onClick={() => onOpen(c)}>Open</Button>
                                            <Button variant="ghost" size="sm">
                                                <MoreHorizontal size={14} />
                                            </Button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Footer */}
                <div className="flex flex-wrap items-center justify-between gap-2 border-t border-zinc-100 px-4 py-2.5 dark:border-zinc-800">
                    <Text size="xs" className="!text-zinc-500">
                        Showing <span className="font-medium text-zinc-700 dark:text-zinc-300">{rows.length}</span> of {CUSTOMERS.length} customers
                    </Text>
                    <Text size="xs" className="!text-zinc-500 !font-mono">
                        Built from Sidebar · Card · Tabs · Button · Badge · EChart · Tooltip · Toast
                    </Text>
                </div>
            </Card.Body>
        </Card>
    );
}

function SortHeader({ label, id, current, onClick }: {
    label: string;
    id: "mrr" | "seats" | "lastSeen";
    current: "mrr" | "seats" | "lastSeen";
    onClick: (id: "mrr" | "seats" | "lastSeen") => void;
}) {
    const active = current === id;
    return (
        <button
            onClick={() => onClick(id)}
            className={`inline-flex items-center gap-0.5 transition ${active ? "text-zinc-900 dark:text-zinc-100" : "hover:text-zinc-700 dark:hover:text-zinc-300"}`}
        >
            {label} <ChevronDown size={10} className={active ? "opacity-100" : "opacity-30"} />
        </button>
    );
}

