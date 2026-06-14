import { Head, router } from "@inertiajs/react";
import { useEffect, useState } from "react";
import {
    Activity, ArrowDownRight, ArrowUpRight, Bot, Columns3, Cpu, ExternalLink,
    FileCode, FileText, Flame, GitBranch, Globe, Inbox, Languages, LayoutDashboard, List,
    Lock, LogIn, LogOut, Megaphone, MonitorSmartphone, MousePointerClick, PieChart, Radio,
    Route, Smartphone, Sparkles, Split, Star, Tag, TrendingUp, User,
} from "lucide-react";
import { EChart } from "@particle-academy/fancy-echarts";
import { Layout } from "../Layout";
import { currentTheme } from "../../showcase-theme";
import "../../../css/analytics.css";

// ─── Types ──────────────────────────────────────────────────────────────────

type Site = { site_key: string; url: string | null; label: string; visible: boolean };
type Filters = { range: number; actor: "all" | "human" | "agent"; compare: boolean };

type Metric = { value: number; deltaPct: number | null; format: "int" | "decimal" | "percent" | "duration" };
type SplitRow = { sessions: number; pageviews: number; avgEngagementMs: number; bounceRate: number; pagesPerSession: number };
type Overview = { range: number; actor: string; metrics: Record<string, Metric>; split: { human: SplitRow; agent: SplitRow }; total: number } | null;

type SeriesPoint = { bucket: string; sessions: number; pageviews: number; human_sessions: number; agent_sessions: number };
type OverviewSeries = { buckets: string[]; current: SeriesPoint[]; previous: number[] } | null;

type Breakdown = { value?: string; host?: string; sessions: number };
type Acquisition = { referrer_hosts: Breakdown[]; utm_sources: Breakdown[]; utm_mediums: Breakdown[]; utm_campaigns: Breakdown[]; direct: number; referral: number; total: number } | null;
type Audience = { devices: Breakdown[]; browsers: Breakdown[]; os: Breakdown[]; languages: Breakdown[]; total: number } | null;

type Element = { target_id: string; label: string | null; clicks: number };
type PageRow = { path: string; pageviews: number; sessions: number };
type Behavior = { topPages: PageRow[]; entryPages: { path: string; sessions: number }[]; exitPages: { path: string; sessions: number }[]; topElements: Element[] } | null;

type RealtimeSession = { session_id: string; actor: string; path: string | null; last_event_at: string | null };
type Realtime = { active: number; window_seconds: number; sessions: RealtimeSession[] } | null;

type HeatCell = { x: number; y: number; count: number; weight: number };
type Heatmap = { site_key: string; path: string; grid_size: number; sample_count: number; max: number; cells: HeatCell[] } | null;
type Shot = { url: string; vw: number; vh: number; capturedAt: string | null };

type AgentAnalytics = {
    totals: { human: number; agent: number; agentPct: number };
    metrics: { human: SplitRow; agent: SplitRow };
    humanElements: Element[]; agentElements: Element[]; humanPages: PageRow[]; agentPages: PageRow[];
} | null;

type Props = {
    pro: boolean;
    proSource: "subscription" | "prize" | null;
    sites: Site[];
    site: string | null;
    filters: Filters;
    overview: Overview;
    overviewSeries: OverviewSeries;
    acquisition: Acquisition;
    audience: Audience;
    behavior: Behavior;
    realtime: Realtime;
    agent: AgentAnalytics;
    heatmap: Heatmap;
    heatmapShot: Shot | null;
};

const HUMAN = "#8b5cf6";
const AGENT = "#f59e0b";

// ─── Page ─────────────────────────────────────────────────────────────────

export default function AnalyticsIndex(props: Props) {
    if (!props.pro) {
        return (
            <Layout>
                <Head title="Analytics · Fancy UI" />
                <div className="fancy-analytics"><Upsell /></div>
            </Layout>
        );
    }

    const { sites, site, filters, overview, overviewSeries, acquisition, audience, behavior, realtime, agent, heatmap, heatmapShot } = props;
    const hasData = (overview?.total ?? 0) > 0;

    return (
        <Layout>
            <Head title="Analytics · Fancy UI" />
            <div className="fancy-analytics">
                <header className="an-head">
                    <p className="an-eyebrow">
                        <span className="tier-chip pro"><Sparkles size={11} /> Pro</span>
                        End-user optimization · not SEO
                    </p>
                    <h1 className="an-title">Analytics</h1>
                    <p className="an-sub">
                        Per-session depth across seven answers — re-scoped by every control.
                        Humans <span className="h">violet</span>, agents <span className="a">amber</span>, everywhere.
                    </p>
                </header>

                <ControlsBar filters={filters} site={site} sites={sites} />

                {!hasData ? (
                    <NoSessions site={site} filters={filters} />
                ) : (
                    <Dashboard
                        filters={filters}
                        overview={overview!}
                        series={overviewSeries!}
                        acquisition={acquisition!}
                        audience={audience!}
                        behavior={behavior!}
                        realtime={realtime!}
                        agent={agent!}
                        heatmap={heatmap}
                        shot={heatmapShot}
                    />
                )}
            </div>
        </Layout>
    );
}

// ─── Controls ───────────────────────────────────────────────────────────────

function reload(patch: Record<string, string | number | boolean>) {
    router.get("/analytics", patch, { preserveState: true, preserveScroll: true, replace: true });
}

const RANGES = [7, 28, 90] as const;

function ControlsBar({ filters, site, sites }: { filters: Filters; site: string | null; sites: Site[] }) {
    const base = (k: keyof Filters, v: string | number | boolean) => ({
        site: site ?? "", range: filters.range, actor: filters.actor, compare: filters.compare ? 1 : 0,
        [k]: typeof v === "boolean" ? (v ? 1 : 0) : v,
    });

    return (
        <div className="controls" data-analytics-controls>
            <div className="control-group">
                <Globe size={15} style={{ color: "var(--fa-fg-3)" }} />
                <select
                    data-analytics-site-picker
                    className="site-select"
                    value={site ?? ""}
                    onChange={(e) => router.get("/analytics", { site: e.target.value, range: filters.range, actor: filters.actor, compare: filters.compare ? 1 : 0 }, { preserveScroll: true })}
                >
                    {sites.map((s) => <option key={s.site_key} value={s.site_key}>{s.label ?? s.site_key}</option>)}
                </select>
            </div>

            <div className="seg" role="group" aria-label="Date range">
                {RANGES.map((r) => (
                    <button key={r} data-range={r} aria-pressed={filters.range === r} className={filters.range === r ? "on" : ""} onClick={() => reload(base("range", r))}>{r}d</button>
                ))}
            </div>

            <div className="seg actor" role="group" aria-label="Actor">
                <button data-actor="all" aria-pressed={filters.actor === "all"} className={filters.actor === "all" ? "on" : ""} onClick={() => reload(base("actor", "all"))}>All</button>
                <button data-actor="human" aria-pressed={filters.actor === "human"} className={filters.actor === "human" ? "on" : ""} onClick={() => reload(base("actor", "human"))}><span className="sw" style={{ background: HUMAN }} />Human</button>
                <button data-actor="agent" aria-pressed={filters.actor === "agent"} className={filters.actor === "agent" ? "on" : ""} onClick={() => reload(base("actor", "agent"))}><span className="sw" style={{ background: AGENT }} />Agent</button>
            </div>

            <div className="seg">
                <button data-compare-toggle aria-pressed={filters.compare} className={filters.compare ? "on" : ""} onClick={() => reload(base("compare", !filters.compare))}>
                    {filters.compare ? "☑" : "☐"} vs previous
                </button>
            </div>
        </div>
    );
}

// ─── Dashboard (scrollspy rail + sections) ──────────────────────────────────

const RAIL = [
    { id: "overview", label: "Overview", Icon: LayoutDashboard },
    { id: "acquisition", label: "Acquisition", Icon: Route },
    { id: "audience", label: "Audience", Icon: MonitorSmartphone },
    { id: "behavior", label: "Behavior", Icon: Activity },
    { id: "realtime", label: "Real-time", Icon: Radio },
    { id: "attention", label: "Attention", Icon: Flame },
    { id: "agent", label: "Agent analytics", Icon: Bot, moat: true },
] as const;

function Dashboard({ filters, overview, series, acquisition, audience, behavior, realtime, agent, heatmap, shot }: {
    filters: Filters; overview: NonNullable<Overview>; series: NonNullable<OverviewSeries>;
    acquisition: NonNullable<Acquisition>; audience: NonNullable<Audience>; behavior: NonNullable<Behavior>;
    realtime: NonNullable<Realtime>; agent: NonNullable<AgentAnalytics>; heatmap: Heatmap; shot: Shot | null;
}) {
    const [active, setActive] = useState<string>("overview");

    useEffect(() => {
        let ticking = false;
        const onScroll = () => {
            if (ticking) return;
            ticking = true;
            requestAnimationFrame(() => {
                let cur = "overview";
                for (const s of RAIL) {
                    const el = document.getElementById("sec-" + s.id);
                    if (el && el.getBoundingClientRect().top <= 180) cur = s.id;
                }
                setActive(cur);
                ticking = false;
            });
        };
        window.addEventListener("scroll", onScroll, { passive: true });
        onScroll();
        return () => window.removeEventListener("scroll", onScroll);
    }, []);

    const jump = (id: string) => {
        const el = document.getElementById("sec-" + id);
        if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 158, behavior: "smooth" });
    };

    return (
        <>
            <nav className="rail" aria-label="Sections">
                {RAIL.map((s) => (
                    <button key={s.id} className={(active === s.id ? "on " : "") + ("moat" in s && s.moat ? "moat" : "")} onClick={() => jump(s.id)}>
                        {"moat" in s && s.moat && <Star size={12} className="star" />}
                        <s.Icon size={14} />{s.label}
                    </button>
                ))}
            </nav>

            <OverviewSection overview={overview} series={series} filters={filters} />
            <AcquisitionSection data={acquisition} />
            <AudienceSection data={audience} />
            <BehaviorSection data={behavior} />
            <RealtimeSection data={realtime} />
            <AttentionSection heatmap={heatmap} shot={shot} />
            <AgentSection data={agent} />
        </>
    );
}

// ─── Shared building blocks ─────────────────────────────────────────────────

function SectionHead({ num, title, Icon, desc, right, moat }: { num: string; title: string; Icon?: typeof Activity; desc?: string; right?: React.ReactNode; moat?: boolean }) {
    return (
        <div className="section-head">
            <div>
                <div className="section-num">{num}</div>
                <h2 className="section-title">
                    {moat ? <Star size={16} style={{ color: AGENT }} /> : Icon ? <Icon size={17} style={{ color: "var(--fa-fg-2)" }} /> : null}
                    {title}
                </h2>
                {desc && <p className="section-desc">{desc}</p>}
            </div>
            {right}
        </div>
    );
}

function Cardlet({ title, Icon, legend, children, style }: { title: string; Icon?: typeof Activity; legend?: React.ReactNode; children: React.ReactNode; style?: React.CSSProperties }) {
    return (
        <div className="cardlet" style={style}>
            <div className="cardlet-h">
                <span className="t">{Icon && <Icon size={15} style={{ color: "var(--fa-fg-3)" }} />}{title}</span>
                {legend}
            </div>
            <div className="cardlet-b">{children}</div>
        </div>
    );
}

function ActorLegend() {
    return (
        <span className="actor-legend">
            <span className="it"><span className="sw h" />Human</span>
            <span className="it"><span className="sw a" />Agent</span>
        </span>
    );
}

function ActorSplit({ human, agent, tall }: { human: number; agent: number; tall?: boolean }) {
    const total = human + agent;
    const h = total > 0 ? (human / total) * 100 : 50;
    return (
        <div className={"actor-split" + (tall ? " tall" : "")}>
            <span className="h" style={{ width: `${h}%` }} />
            <span className="a" style={{ width: `${100 - h}%` }} />
        </div>
    );
}

function EmptyMini({ icon, t, b }: { icon: React.ReactNode; t: string; b: string }) {
    return <div className="empty-mini"><span className="ic">{icon}</span><span className="t">{t}</span><span className="b">{b}</span></div>;
}

function BreakdownBars({ rows, color = HUMAN, mono }: { rows: { label: string; value: number }[]; color?: string; mono?: boolean }) {
    if (rows.length === 0) return <EmptyMini icon={<Inbox size={19} />} t="No data" b="Nothing recorded in this window yet." />;
    const top = Math.max(1, ...rows.map((r) => r.value));
    return (
        <div className="bd-list">
            {rows.map((r) => (
                <div className="bd" key={r.label}>
                    <span className="bd-label"><span className={mono ? "host" : ""}>{r.label}</span></span>
                    <span className="bd-val">{r.value.toLocaleString()}</span>
                    <span className="bd-track"><span className="bd-fill" style={{ width: `${(r.value / top) * 100}%`, background: color }} /></span>
                </div>
            ))}
        </div>
    );
}

function Donut({ segments }: { segments: { name: string; value: number; color: string }[] }) {
    const total = segments.reduce((s, d) => s + d.value, 0);
    if (total === 0) return <EmptyMini icon={<PieChart size={19} />} t="No data" b="No sessions in this window yet." />;
    return (
        <div className="donut-wrap">
            <div style={{ width: 132, flexShrink: 0 }}>
                <EChart
                    style={{ width: 132, height: 132 }}
                    option={{
                        series: [{
                            type: "pie", radius: ["58%", "82%"], center: ["50%", "50%"], avoidLabelOverlap: false,
                            label: { show: false }, labelLine: { show: false },
                            data: segments.map((d) => ({ name: d.name, value: d.value, itemStyle: { color: d.color } })),
                        }],
                    }}
                />
            </div>
            <div className="donut-legend">
                {segments.map((d) => (
                    <div className="dl" key={d.name}>
                        <span className="sw" style={{ background: d.color }} />
                        <span className="nm">{d.name}</span>
                        <span className="pc">{Math.round((d.value / total) * 100)}%</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

// ─── 1 · Overview (hero) ────────────────────────────────────────────────────

const KPI_TILES: { key: string; label: string }[] = [
    { key: "sessions", label: "Sessions" },
    { key: "pageviews", label: "Pageviews" },
    { key: "avgEngagementMs", label: "Avg engagement" },
    { key: "bounceRate", label: "Bounce rate" },
    { key: "pagesPerSession", label: "Pages / session" },
];

function OverviewSection({ overview, series, filters }: { overview: NonNullable<Overview>; series: NonNullable<OverviewSeries>; filters: Filters }) {
    return (
        <section id="sec-overview" className="section hero-section fade-in">
            <SectionHead num="01 · Overview" title="Headline" Icon={LayoutDashboard} desc={`At-a-glance health and trend · last ${filters.range} days${filters.actor !== "all" ? ` · ${filters.actor}` : ""}`} right={<ActorLegend />} />
            <div className="kpi-row">
                {KPI_TILES.map((t) => {
                    const m = overview.metrics[t.key];
                    const human = (overview.split.human as Record<string, number>)[t.key] ?? 0;
                    const agent = (overview.split.agent as Record<string, number>)[t.key] ?? 0;
                    return (
                        <div className="kpi" key={t.key} data-kpi={t.label}>
                            <span className="lbl">{t.label}</span>
                            <span className="val">{fmt(m.value, m.format)}</span>
                            {filters.compare && <Delta metric={m} />}
                            <ActorSplit human={human} agent={agent} />
                        </div>
                    );
                })}
            </div>
            <Cardlet title="Sessions over time" Icon={TrendingUp} style={{ marginTop: 14 }} legend={
                <span style={{ display: "flex", gap: 14, alignItems: "center", fontSize: 11.5, color: "var(--fa-fg-3)" }}>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><span style={{ width: 14, height: 3, background: HUMAN, borderRadius: 2 }} />Current</span>
                    {filters.compare && <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><span style={{ width: 14, borderTop: "2px dashed var(--fa-fg-4)" }} />Previous</span>}
                </span>
            }>
                <OverviewChart series={series} compare={filters.compare} />
            </Cardlet>
        </section>
    );
}

function Delta({ metric }: { metric: Metric }) {
    if (metric.deltaPct === null) return <span className="delta" style={{ color: "var(--fa-fg-4)" }}>—</span>;
    const up = metric.deltaPct >= 0;
    return (
        <span className={"delta " + (up ? "up" : "down")} data-delta>
            {up ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}{Math.abs(metric.deltaPct).toFixed(1)}% <span className="vs">vs prev</span>
        </span>
    );
}

function OverviewChart({ series, compare }: { series: NonNullable<OverviewSeries>; compare: boolean }) {
    const dates = series.buckets.map((b) => b.slice(5));
    const seriesDefs: Record<string, unknown>[] = [{
        name: "Sessions", type: "line", smooth: true, showSymbol: false,
        areaStyle: { opacity: 0.14 }, lineStyle: { width: 2 }, itemStyle: { color: HUMAN },
        data: series.current.map((p) => p.sessions),
    }];
    if (compare && series.previous.length > 0) {
        seriesDefs.push({ name: "Previous", type: "line", smooth: true, showSymbol: false, lineStyle: { width: 1.5, type: "dashed", opacity: 0.7 }, itemStyle: { color: "#a1a1aa" }, data: series.previous });
    }
    return (
        <EChart
            style={{ width: "100%", height: 220 }}
            option={{
                grid: { left: 34, right: 10, top: 12, bottom: 24 },
                tooltip: { trigger: "axis" },
                xAxis: { type: "category", data: dates, boundaryGap: false },
                yAxis: { type: "value", minInterval: 1 },
                series: seriesDefs,
            }}
        />
    );
}

// ─── 2 · Acquisition ────────────────────────────────────────────────────────

function bd(rows: Breakdown[], key: "value" | "host" = "value"): { label: string; value: number }[] {
    return rows.map((r) => ({ label: (r[key] ?? r.value ?? "—") as string, value: r.sessions }));
}

function AcquisitionSection({ data }: { data: NonNullable<Acquisition> }) {
    const refTotal = data.direct + data.referral;
    return (
        <section id="sec-acquisition" className="section fade-in">
            <SectionHead num="02" title="Acquisition" Icon={Route} desc="Where sessions came from." />
            <div className="grid-3">
                <Cardlet title="Channels" Icon={PieChart}>
                    <Donut segments={[{ name: "Direct", value: data.direct, color: HUMAN }, { name: "Referral", value: data.referral, color: "#0ea5e9" }]} />
                </Cardlet>
                <Cardlet title="Top referrers" Icon={ExternalLink}>
                    <BreakdownBars rows={bd(data.referrer_hosts, "host")} mono />
                </Cardlet>
                <Cardlet title="UTM source" Icon={Tag}>
                    <BreakdownBars rows={bd(data.utm_sources)} color="#0ea5e9" />
                </Cardlet>
                <Cardlet title="UTM medium" Icon={GitBranch}>
                    <BreakdownBars rows={bd(data.utm_mediums)} color="#10b981" />
                </Cardlet>
                <Cardlet title="UTM campaign" Icon={Megaphone}>
                    <BreakdownBars rows={bd(data.utm_campaigns)} color={HUMAN} />
                </Cardlet>
                <Cardlet title="Direct vs referral" Icon={Split}>
                    <div style={{ display: "flex", flexDirection: "column", gap: 12, paddingTop: 6 }}>
                        <div><div style={{ fontSize: 12, color: "var(--fa-fg-3)", marginBottom: 5 }}>Direct</div><div className="bd-track"><span className="bd-fill" style={{ width: `${refTotal ? (data.direct / refTotal) * 100 : 0}%`, background: HUMAN }} /></div></div>
                        <div><div style={{ fontSize: 12, color: "var(--fa-fg-3)", marginBottom: 5 }}>Referral</div><div className="bd-track"><span className="bd-fill" style={{ width: `${refTotal ? (data.referral / refTotal) * 100 : 0}%`, background: "#0ea5e9" }} /></div></div>
                    </div>
                </Cardlet>
            </div>
        </section>
    );
}

// ─── 3 · Audience · Tech ────────────────────────────────────────────────────

function AudienceSection({ data }: { data: NonNullable<Audience> }) {
    const langTotal = Math.max(1, data.languages.reduce((s, l) => s + l.sessions, 0));
    return (
        <section id="sec-audience" className="section fade-in">
            <SectionHead num="03" title="Audience · Tech" Icon={MonitorSmartphone} desc="The device and context profile of visitors." />
            <div className="grid-3">
                <Cardlet title="Device" Icon={Smartphone}>
                    <Donut segments={data.devices.map((d, i) => ({ name: d.value ?? "—", value: d.sessions, color: PALETTE[i % PALETTE.length] }))} />
                </Cardlet>
                <Cardlet title="Browser" Icon={Globe}>
                    <BreakdownBars rows={bd(data.browsers)} color="#6366f1" />
                </Cardlet>
                <Cardlet title="Operating system" Icon={Cpu}>
                    <BreakdownBars rows={bd(data.os)} color="#0ea5e9" />
                </Cardlet>
                <Cardlet title="Language" Icon={Languages} style={{ gridColumn: "span 3" }}>
                    {data.languages.length === 0 ? <EmptyMini icon={<Languages size={19} />} t="No language data" b="Appears once sessions carry a language." /> : (
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 16 }}>
                            {data.languages.slice(0, 5).map((l) => {
                                const pctv = Math.round((l.sessions / langTotal) * 100);
                                return (
                                    <div key={l.value}>
                                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 6 }}><span style={{ fontFamily: "var(--fa-mono)" }}>{l.value ?? "—"}</span><span style={{ color: "var(--fa-fg-3)" }}>{pctv}%</span></div>
                                        <div className="bd-track"><span className="bd-fill" style={{ width: `${pctv}%`, background: "#10b981" }} /></div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </Cardlet>
            </div>
        </section>
    );
}

// ─── 4 · Behavior ───────────────────────────────────────────────────────────

function BehaviorSection({ data }: { data: NonNullable<Behavior> }) {
    return (
        <section id="sec-behavior" className="section fade-in">
            <SectionHead num="04" title="Behavior" Icon={Activity} desc="On-site behavior and flow." />
            <div className="grid-2">
                <Cardlet title="Top pages" Icon={FileText}>
                    {data.topPages.length === 0 ? <EmptyMini icon={<FileText size={19} />} t="No pageviews yet" b="Page views appear here once captured." /> : (
                        <table className="an-table">
                            <thead><tr><th>Path</th><th style={{ textAlign: "right" }}>Views</th><th style={{ textAlign: "right" }}>Sessions</th></tr></thead>
                            <tbody>{data.topPages.map((p) => (
                                <tr key={p.path} className="hl"><td className="mono">{p.path}</td><td className="num">{p.pageviews.toLocaleString()}</td><td className="num">{p.sessions.toLocaleString()}</td></tr>
                            ))}</tbody>
                        </table>
                    )}
                </Cardlet>
                <Cardlet title="Top clicked elements" Icon={MousePointerClick}>
                    {data.topElements.length === 0 ? <EmptyMini icon={<MousePointerClick size={19} />} t="No tracked clicks" b="Element clicks appear here once captured." /> : (
                        <table className="an-table">
                            <thead><tr><th>Element</th><th style={{ textAlign: "right" }}>Clicks</th></tr></thead>
                            <tbody>{data.topElements.map((e) => (
                                <tr key={e.target_id} className="hl">
                                    <td><div style={{ fontSize: 12.5, color: "var(--fa-fg-1)" }}>{e.label ?? "—"}</div><div className="mono" style={{ fontSize: 11, color: "var(--fa-fg-4)" }}>{e.target_id}</div></td>
                                    <td className="num">{e.clicks.toLocaleString()}</td>
                                </tr>
                            ))}</tbody>
                        </table>
                    )}
                </Cardlet>
            </div>
            <div className="grid-2" style={{ marginTop: 14 }}>
                <Cardlet title="Entry pages" Icon={LogIn}>
                    <BreakdownBars rows={data.entryPages.map((p) => ({ label: p.path, value: p.sessions }))} color="#10b981" mono />
                </Cardlet>
                <Cardlet title="Exit pages" Icon={LogOut}>
                    <BreakdownBars rows={data.exitPages.map((p) => ({ label: p.path, value: p.sessions }))} color="#f43f5e" mono />
                </Cardlet>
            </div>
        </section>
    );
}

// ─── 5 · Real-time ──────────────────────────────────────────────────────────

function RealtimeSection({ data }: { data: NonNullable<Realtime> }) {
    const human = data.sessions.filter((s) => s.actor !== "agent").length;
    const agent = data.sessions.filter((s) => s.actor === "agent").length;
    return (
        <section id="sec-realtime" className="section fade-in">
            <SectionHead num="05" title="Real-time" Icon={Radio} desc="Who's on the site right now — last 5 minutes." />
            <div className="grid-7-5">
                <Cardlet title="Live sessions" Icon={List} legend={<ActorLegend />}>
                    {data.sessions.length === 0 ? <EmptyMini icon={<Radio size={19} />} t="Nobody here right now" b="When a visitor or agent loads a tracked page, they show up live." /> : (
                        <div>
                            {data.sessions.map((s) => (
                                <div className="rt-row" key={s.session_id} data-rt-session={s.session_id}>
                                    <span className={"actor-badge " + (s.actor === "agent" ? "agent" : "human")}>{s.actor === "agent" ? <Bot size={12} /> : <User size={12} />}{s.actor}</span>
                                    <span className="mono" style={{ fontFamily: "var(--fa-mono)", fontSize: 12, color: "var(--fa-fg-1)", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.path ?? "/"}</span>
                                    <span style={{ fontSize: 11, color: "var(--fa-fg-4)", fontFamily: "var(--fa-mono)", minWidth: 56, textAlign: "right" }}>{relativeTime(s.last_event_at)}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </Cardlet>
                <Cardlet title="Active now" Icon={Activity}>
                    <div style={{ display: "flex", flexDirection: "column", gap: 16, paddingTop: 4 }}>
                        <div className="rt-now">
                            <span className="rt-pulse" />
                            <div>
                                <div className="rt-count">{data.active}</div>
                                <div style={{ fontSize: 11.5, color: "var(--fa-fg-3)", marginTop: 2 }}>active in the last 5 min</div>
                            </div>
                        </div>
                        {data.sessions.length > 0 && (
                            <div>
                                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11.5, marginBottom: 6 }}>
                                    <span style={{ color: "var(--human-ink)", fontWeight: 600 }}>{human} human</span>
                                    <span style={{ color: "var(--agent-ink)", fontWeight: 600 }}>{agent} agent</span>
                                </div>
                                <ActorSplit human={human} agent={agent} tall />
                            </div>
                        )}
                    </div>
                </Cardlet>
            </div>
        </section>
    );
}

// ─── 6 · Attention ──────────────────────────────────────────────────────────

function useTheme(): "light" | "dark" {
    const [theme, setTheme] = useState<"light" | "dark">(() => (typeof window === "undefined" ? "dark" : currentTheme()));
    useEffect(() => {
        const onChange = (e: Event) => setTheme((e as CustomEvent<"light" | "dark">).detail);
        window.addEventListener("fancy-theme-change", onChange as EventListener);
        return () => window.removeEventListener("fancy-theme-change", onChange as EventListener);
    }, []);
    return theme;
}

function blobColor(weight: number): string {
    if (weight >= 0.66) return "#f43f5e";
    if (weight >= 0.33) return "#f59e0b";
    return "#38bdf8";
}

function AttentionSection({ heatmap, shot }: { heatmap: Heatmap; shot: Shot | null }) {
    useTheme();
    return (
        <section id="sec-attention" className="section fade-in">
            <SectionHead num="06" title="Attention" Icon={Flame}
                desc={heatmap ? `Pointer & click density · ${heatmap.path} · ${heatmap.sample_count.toLocaleString()} samples` : "Pointer & click density on the busiest page."} />
            <Cardlet title="Focus heatmap" Icon={Flame} legend={<div className="heat-legend"><span>cool</span><span className="heat-ramp" /><span>hot</span></div>}>
                {!heatmap ? <EmptyMini icon={<Flame size={19} />} t="Not enough interactions" b="The heatmap needs a few hundred pointer events on this page before it paints." /> : (
                    <div className="heat-stage" data-heatmap-canvas>
                        {shot && <img src={shot.url} alt="" />}
                        {heatmap.cells.map((cell) => {
                            const left = ((cell.x + 0.5) / heatmap.grid_size) * 100;
                            const top = ((cell.y + 0.5) / heatmap.grid_size) * 100;
                            const size = (100 / heatmap.grid_size) * (1.6 + cell.weight * 2.4);
                            const c = blobColor(cell.weight);
                            return (
                                <span key={`${cell.x}-${cell.y}`} className="heat-blob" data-heat-cell={`${cell.x},${cell.y}`} title={`(${cell.x}, ${cell.y}) · ${cell.count} hits`}
                                    style={{ left: `${left}%`, top: `${top}%`, width: `${size}%`, height: `${size}%`, opacity: 0.18 + cell.weight * 0.62, background: `radial-gradient(circle, ${c} 0%, ${c}00 70%)` }} />
                            );
                        })}
                    </div>
                )}
            </Cardlet>
        </section>
    );
}

// ─── 7 · ★ Agent analytics (the moat) ───────────────────────────────────────

const AGENT_METRICS: { key: keyof SplitRow; label: string; format: Metric["format"] }[] = [
    { key: "sessions", label: "Sessions", format: "int" },
    { key: "pageviews", label: "Pageviews", format: "int" },
    { key: "avgEngagementMs", label: "Avg engagement", format: "duration" },
    { key: "bounceRate", label: "Bounce rate", format: "percent" },
    { key: "pagesPerSession", label: "Pages / session", format: "decimal" },
];

function AgentSection({ data }: { data: NonNullable<AgentAnalytics> }) {
    const topAgentPage = data.agentPages[0];
    return (
        <section id="sec-agent" className="section moat fade-in">
            <SectionHead num="07 · The moat" title="Agent analytics" moat
                desc="The dimension GA structurally can't have — how agents behave vs people on the same surface."
                right={<span className="actor-badge agent"><Bot size={11} /> Human+ exclusive</span>} />
            <div className="stack">
                <div className="grid-3">
                    <div className="kpi">
                        <span className="lbl"><Bot size={13} style={{ color: AGENT }} /> Agent share of sessions</span>
                        <span className="val" style={{ color: "var(--agent-ink)" }} data-agent-pct>{data.totals.agentPct.toFixed(1)}%</span>
                        <div style={{ marginTop: 2 }}>
                            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11.5, marginBottom: 6 }}>
                                <span style={{ color: "var(--human-ink)", fontWeight: 600 }}>{data.totals.human.toLocaleString()} human</span>
                                <span style={{ color: "var(--agent-ink)", fontWeight: 600 }}>{data.totals.agent.toLocaleString()} agent</span>
                            </div>
                            <ActorSplit human={data.totals.human} agent={data.totals.agent} tall />
                        </div>
                    </div>
                    <div className="kpi" style={{ justifyContent: "center" }}>
                        <span className="lbl">Engagement contrast</span>
                        <span style={{ fontSize: 13, color: "var(--fa-fg-2)", lineHeight: 1.5 }}>{engagementContrast(data.metrics)}</span>
                    </div>
                    <div className="kpi" style={{ justifyContent: "center" }}>
                        <span className="lbl">Top agent surface</span>
                        {topAgentPage ? <>
                            <span className="val" style={{ fontSize: 16, fontFamily: "var(--fa-mono)" }}>{topAgentPage.path}</span>
                            <span style={{ fontSize: 12, color: "var(--fa-fg-3)" }}>{topAgentPage.pageviews.toLocaleString()} agent pageviews</span>
                        </> : <span style={{ fontSize: 12.5, color: "var(--fa-fg-3)" }}>No agent pageviews yet.</span>}
                    </div>
                </div>

                <Cardlet title="Human vs agent — every headline metric" Icon={Columns3} legend={<ActorLegend />}>
                    <table className="an-table">
                        <thead><tr><th>Metric</th><th style={{ textAlign: "right" }}><span style={{ color: "var(--human-ink)" }}>Human</span></th><th style={{ textAlign: "right" }}><span style={{ color: "var(--agent-ink)" }}>Agent</span></th></tr></thead>
                        <tbody>{AGENT_METRICS.map((f) => (
                            <tr key={f.key} className="hl" data-agent-metric={f.key}>
                                <td style={{ color: "var(--fa-fg-1)", fontWeight: 500 }}>{f.label}</td>
                                <td className="num">{fmt(data.metrics.human[f.key], f.format)}</td>
                                <td className="num" style={{ color: "var(--agent-ink)" }}>{fmt(data.metrics.agent[f.key], f.format)}</td>
                            </tr>
                        ))}</tbody>
                    </table>
                </Cardlet>

                <div className="grid-3">
                    <Cardlet title="Agent-driven elements" Icon={Bot}>
                        <ElementBars rows={data.agentElements} color={AGENT} ink="var(--agent-ink)" />
                    </Cardlet>
                    <Cardlet title="Human-driven elements" Icon={User}>
                        <ElementBars rows={data.humanElements} color={HUMAN} ink="var(--human-ink)" />
                    </Cardlet>
                    <Cardlet title="Agent-driven pages" Icon={FileCode}>
                        <PageBars rows={data.agentPages} color={AGENT} ink="var(--agent-ink)" />
                    </Cardlet>
                </div>
            </div>
        </section>
    );
}

function ElementBars({ rows, color, ink }: { rows: Element[]; color: string; ink: string }) {
    if (rows.length === 0) return <EmptyMini icon={<MousePointerClick size={19} />} t="No clicks" b="No element clicks in this window." />;
    const top = Math.max(1, ...rows.map((r) => r.clicks));
    return (
        <div className="bd-list">{rows.map((e) => (
            <div className="bd" key={e.target_id}>
                <span className="bd-label"><span style={{ fontSize: 12.5, color: "var(--fa-fg-1)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{e.label ?? e.target_id}</span></span>
                <span className="bd-val" style={{ color: ink }}>{e.clicks.toLocaleString()}</span>
                <span className="bd-track"><span className="bd-fill" style={{ width: `${(e.clicks / top) * 100}%`, background: color }} /></span>
            </div>
        ))}</div>
    );
}

function PageBars({ rows, color, ink }: { rows: PageRow[]; color: string; ink: string }) {
    if (rows.length === 0) return <EmptyMini icon={<FileCode size={19} />} t="No pageviews" b="No pages driven by this actor yet." />;
    const top = Math.max(1, ...rows.map((r) => r.pageviews));
    return (
        <div className="bd-list">{rows.map((p) => (
            <div className="bd" key={p.path}>
                <span className="bd-label"><span className="host">{p.path}</span></span>
                <span className="bd-val" style={{ color: ink }}>{p.pageviews.toLocaleString()}</span>
                <span className="bd-track"><span className="bd-fill" style={{ width: `${(p.pageviews / top) * 100}%`, background: color }} /></span>
            </div>
        ))}</div>
    );
}

function engagementContrast(m: { human: SplitRow; agent: SplitRow }): React.ReactNode {
    const dwell = m.human.avgEngagementMs > 0 ? Math.round(((m.agent.avgEngagementMs - m.human.avgEngagementMs) / m.human.avgEngagementMs) * 100) : 0;
    const pages = m.human.pagesPerSession > 0 ? Math.round(((m.agent.pagesPerSession - m.human.pagesPerSession) / m.human.pagesPerSession) * 100) : 0;
    return <>Agents view <b style={{ color: "var(--agent-ink)" }}>{pages >= 0 ? "+" : ""}{pages}% pages/session</b> and <b style={{ color: "var(--agent-ink)" }}>{dwell >= 0 ? "+" : ""}{dwell}% engagement time</b> vs humans on the same surface.</>;
}

// ─── Empty / non-pro states ─────────────────────────────────────────────────

function NoSessions({ site, filters }: { site: string | null; filters: Filters }) {
    const filtered = filters.actor !== "all";
    return (
        <div className="section" style={{ marginTop: 24 }}>
            <div className="cardlet"><div className="cardlet-b" style={{ padding: 48, textAlign: "center" }}>
                <div style={{ margin: "0 auto 14px", width: 48, height: 48, borderRadius: 14, display: "grid", placeItems: "center", background: "var(--human-soft)", color: "var(--human-ink)" }}><Inbox size={22} /></div>
                <div style={{ fontSize: 16, fontWeight: 600, color: "var(--fa-fg-1)" }}>{filtered ? `No ${filters.actor} sessions in this window` : `No session data for ${site ?? "this site"} yet`}</div>
                <p style={{ fontSize: 13, color: "var(--fa-fg-3)", maxWidth: 440, margin: "8px auto 0", lineHeight: 1.55 }}>
                    {filtered ? <>Nothing matched the <b>{filters.actor}</b> filter for the last {filters.range} days. Switch back to <b>All</b> or widen the range.</>
                        : <>The dashboard reads the per-session rollup. Once the Fancy Pixel collects sessions — or the backfill runs over historical events — acquisition, audience, and the agent split appear here.</>}
                </p>
            </div></div>
        </div>
    );
}

const UPSELL_FEATURES: [string, boolean][] = [
    ["Live KPIs (sessions, pageviews, dwell)", true],
    ["Top pages & recent sessions", true],
    ["One focus heatmap", true],
    ["Acquisition — referrers, UTM, channels", false],
    ["Audience — device, browser, OS, language", false],
    ["Behavior — entry/exit, clicked elements", false],
    ["Date range, actor filter & period compare", false],
    ["★ Agent analytics — the human-vs-agent moat", false],
];

const PREVIEW = [
    { icon: <Route size={16} />, t: "Acquisition", b: "Referrers, UTM, direct vs referral." },
    { icon: <MonitorSmartphone size={16} />, t: "Audience · Tech", b: "Device, browser, OS, language." },
    { icon: <Activity size={16} />, t: "Behavior", b: "Entry/exit pages + clicked elements." },
    { icon: <Bot size={16} />, t: "Agent analytics", b: "The dimension GA can't have.", moat: true },
];

function Upsell() {
    return (
        <div style={{ paddingTop: 8 }}>
            <div className="upsell-hero">
                <span className="tier-chip pro" style={{ position: "relative", zIndex: 1 }}><Sparkles size={11} /> Pro</span>
                <h1 style={{ fontSize: 28, fontWeight: 600, letterSpacing: "-0.025em", margin: "16px 0 0", position: "relative", zIndex: 1 }}>See what Google Analytics structurally cannot</h1>
                <p style={{ fontSize: 14, color: "var(--fa-fg-2)", maxWidth: 560, margin: "10px 0 0", lineHeight: 1.6, position: "relative", zIndex: 1 }}>
                    The Pro Analytics Suite is GA-parity behavioural analytics from the Fancy Heuristics pixel — acquisition, audience, behavior, attention — plus the one dimension GA can't have: the <b style={{ color: "var(--human-ink)" }}>human</b>-vs-<b style={{ color: "var(--agent-ink)" }}>agent</b> split. Subscribe, or earn the <b>sandbox-pro</b> prize at Ambassador tier.
                </p>
                <div style={{ display: "flex", gap: 12, marginTop: 20, flexWrap: "wrap", position: "relative", zIndex: 1 }}>
                    <a href="/subscriptions" style={{ background: "var(--fa-grad)", color: "#fff", padding: "10px 18px", borderRadius: 10, fontSize: 13.5, fontWeight: 600, textDecoration: "none" }}>Go Pro</a>
                    <a href="/leaderboard" style={{ border: "1px solid var(--fa-border-2)", color: "var(--fa-fg-1)", padding: "10px 18px", borderRadius: 10, fontSize: 13.5, fontWeight: 600, textDecoration: "none" }}>Earn it — leaderboard</a>
                </div>
            </div>

            <div className="upsell-grid">
                <div className="compare">
                    <div className="compare-head"><span style={{ fontWeight: 600 }}>Light</span><span className="tier-chip" style={{ background: "var(--fa-bg-3)", color: "var(--fa-fg-2)" }}>Free</span></div>
                    {UPSELL_FEATURES.map(([f, light]) => (
                        <div key={f} className={"compare-feat" + (light ? "" : " no")}>{light ? <Sparkles size={16} style={{ color: HUMAN }} /> : <Lock size={16} />}{f}</div>
                    ))}
                </div>
                <div className="compare pro">
                    <div className="compare-head"><span style={{ fontWeight: 600 }}>Pro</span><span className="tier-chip pro">All seven sections</span></div>
                    {UPSELL_FEATURES.map(([f]) => (
                        <div key={f} className="compare-feat"><Sparkles size={16} style={{ color: HUMAN }} />{f}</div>
                    ))}
                </div>
            </div>

            <div className="preview-grid">
                {PREVIEW.map((p) => (
                    <div key={p.t} className={"preview-card" + (p.moat ? " moat" : "")}>
                        <Lock size={13} className="lock" />
                        <span className="pc-ic">{p.icon}</span>
                        <h5>{p.t}</h5>
                        <p>{p.b}</p>
                    </div>
                ))}
            </div>
        </div>
    );
}

// ─── helpers ────────────────────────────────────────────────────────────────

const PALETTE = ["#8b5cf6", "#f59e0b", "#10b981", "#ef4444", "#3b82f6", "#ec4899", "#14b8a6", "#a3a3a3"];

function fmt(value: number, format: Metric["format"]): string {
    switch (format) {
        case "duration": return formatDuration(value);
        case "percent": return `${(value * 100).toFixed(1)}%`;
        case "decimal": return value.toFixed(2);
        default: return Math.round(value).toLocaleString();
    }
}

function formatDuration(ms: number): string {
    if (!ms || ms <= 0) return "—";
    const s = ms / 1000;
    if (s < 60) return `${s.toFixed(s < 10 ? 1 : 0)}s`;
    const m = Math.floor(s / 60);
    return `${m}m ${Math.round(s % 60)}s`;
}

function relativeTime(iso: string | null): string {
    if (!iso) return "";
    const then = new Date(iso).getTime();
    if (Number.isNaN(then)) return "";
    const s = Math.max(0, Math.round((Date.now() - then) / 1000));
    if (s < 60) return `${s}s ago`;
    const m = Math.round(s / 60);
    if (m < 60) return `${m}m ago`;
    const h = Math.round(m / 60);
    return h < 24 ? `${h}h ago` : `${Math.round(h / 24)}d ago`;
}
