import "./helm.css";
import { useEffect, useState, type CSSProperties } from "react";
import {
    Badge,
    Card,
    Heading,
    Navbar,
    Progress,
    Text,
    Timeline,
    type Color,
} from "@particle-academy/react-fancy";
import { EChart, registerAll } from "@particle-academy/fancy-echarts";
import { Activity, Bell } from "lucide-react";
import type { Style } from "../../types";

/**
 * Dashboards · Style 02 — Helm (Cloud infrastructure NOC wallboard).
 *
 * A status-first single-screen NOC board (no sidebar): a Navbar topbar with a
 * live wall-clock, five oversized KPI stat Cards, a 24-tile service-health wall
 * (each tile a compact Card + status Badge + a fancy-echarts sparkline), and a
 * right rail stacking a global-throughput EChart bar over a scrolling active-
 * alerts Timeline. Every metric is monospace; health drives green/amber/red
 * washes on tiles, glowing status dots, and severity dots on the feed.
 *
 * Built from restyled Fancy primitives: Navbar (shell), Card (KPI tiles +
 * service tiles + rail panels), Badge (Operational + service status), Progress
 * (saturation meter), Timeline (alerts feed), Heading/Text, and 25 EChart
 * instances (24 service sparklines + the throughput bar).
 *
 * Mounted by Inspiration/Show.tsx for `style.id === "helm"`. SSR-safe: the mock
 * data (sparklines + throughput wave) is precomputed deterministically at module
 * scope (no Math.random/Date.now during render); every EChart mounts client-side
 * inside the wrapper's effect; the live clock starts from a fixed string and is
 * only advanced in useEffect, so the server render and first client render match.
 */

/* ── Status palette (the mockup's sv/dc maps, as derived styles) ──────────── */

type SvcStatus = "ok" | "warn" | "err";

const STATUS: Record<SvcStatus, { dot: string; bg: string; border: string; spark: string }> = {
    ok: { dot: "#34D399", bg: "#0E1A14", border: "#1C3A2A", spark: "rgba(52,211,153,0.55)" },
    warn: { dot: "#F59E0B", bg: "#1E1708", border: "#3E3212", spark: "rgba(245,158,11,0.55)" },
    err: { dot: "#EF4444", bg: "#1E0E0E", border: "#3E1A1A", spark: "rgba(239,68,68,0.55)" },
};

type Severity = "crit" | "warn" | "info";

const SEV: Record<Severity, { color: Color; glow: string }> = {
    crit: { color: "red", glow: "#EF4444" },
    warn: { color: "amber", glow: "#F59E0B" },
    info: { color: "blue", glow: "#3B82F6" },
};

/* ── Deterministic mock data (replaces the mockup's Math.random spark()) ───── */

/** Seeded LCG → 10 sparkline heights in the 30–100 band. Same on server + client. */
function seededSpark(seed: number): number[] {
    let s = (seed * 1103515245 + 12345) & 0x7fffffff;
    const out: number[] = [];
    for (let i = 0; i < 10; i++) {
        s = (s * 1103515245 + 12345) & 0x7fffffff;
        out.push(30 + Math.round((s / 0x7fffffff) * 70));
    }
    return out;
}

/** A tiny, silent, animation-free EChart bar sparkline. */
function sparkOption(values: number[], color: string) {
    return {
        animation: false,
        grid: { left: 0, right: 0, top: 2, bottom: 0, containLabel: false },
        xAxis: { type: "category" as const, show: false, boundaryGap: true, data: values.map((_, i) => i) },
        yAxis: { type: "value" as const, show: false, min: 0, max: 100 },
        series: [
            {
                type: "bar" as const,
                data: values,
                barWidth: "68%",
                silent: true,
                itemStyle: { color, borderRadius: [1, 1, 0, 0] as [number, number, number, number] },
            },
        ],
    };
}

const RAW_SERVICES: { name: string; status: SvcStatus; rps: string }[] = [
    { name: "api-gateway", status: "ok", rps: "6.2k" },
    { name: "auth", status: "ok", rps: "3.1k" },
    { name: "payments", status: "warn", rps: "820" },
    { name: "search", status: "ok", rps: "2.4k" },
    { name: "orders", status: "ok", rps: "1.9k" },
    { name: "inventory", status: "ok", rps: "1.1k" },
    { name: "notifications", status: "ok", rps: "1.1k" },
    { name: "billing", status: "warn", rps: "640" },
    { name: "cdn-edge", status: "ok", rps: "8.8k" },
    { name: "media", status: "ok", rps: "540" },
    { name: "analytics", status: "ok", rps: "2.0k" },
    { name: "webhooks", status: "ok", rps: "410" },
    { name: "email", status: "ok", rps: "1.3k" },
    { name: "queue", status: "err", rps: "0" },
    { name: "cache", status: "ok", rps: "3.4k" },
    { name: "ml-infer", status: "ok", rps: "760" },
    { name: "recs", status: "ok", rps: "990" },
    { name: "geo", status: "ok", rps: "220" },
    { name: "reports", status: "ok", rps: "180" },
    { name: "audit", status: "ok", rps: "90" },
    { name: "scheduler", status: "ok", rps: "120" },
    { name: "exports", status: "ok", rps: "70" },
    { name: "identity", status: "ok", rps: "3.0k" },
    { name: "gateway-eu", status: "ok", rps: "2.2k" },
];

/** Precompute each tile's spark + chart option once — fully static, so EChart
 *  never re-runs setOption when unrelated UI state (tile focus) changes. */
const SERVICES = RAW_SERVICES.map((s, i) => {
    const spark = seededSpark(i + 1);
    return { ...s, spark, option: sparkOption(spark, STATUS[s.status].spark) };
});

/** 30-point rolling throughput wave (deterministic — sinusoidal, no randomness). */
const TP = Array.from({ length: 30 }, (_, i) => 40 + Math.round(Math.sin(i * 0.5) * 26 + 22));

const THROUGHPUT_OPTION = {
    animation: false,
    grid: { left: 0, right: 0, top: 4, bottom: 0, containLabel: false },
    xAxis: { type: "category" as const, show: false, boundaryGap: true, data: TP.map((_, i) => i) },
    yAxis: { type: "value" as const, show: false, min: 0, max: 100 },
    series: [
        {
            type: "bar" as const,
            data: TP,
            barWidth: "80%",
            silent: true,
            itemStyle: {
                borderRadius: [1, 1, 0, 0] as [number, number, number, number],
                color: {
                    type: "linear" as const,
                    x: 0,
                    y: 0,
                    x2: 0,
                    y2: 1,
                    colorStops: [
                        { offset: 0, color: "#3B82F6" },
                        { offset: 1, color: "#1D4ED8" },
                    ],
                },
            },
        },
    ],
};

const HERO = [
    { k: "Requests / s", v: "18.4k", sub: "▲ 4% · 5m", col: "#EAEEF4" },
    { k: "p95 latency", v: "142", sub: "ms · ▲ 9", col: "#F59E0B" },
    { k: "Error rate", v: "0.42%", sub: "▼ 0.1%", col: "#34D399" },
    { k: "Saturation", v: "63%", sub: "CPU avg", col: "#EAEEF4", meter: 63 },
    { k: "Incidents", v: "0", sub: "open · P1/P2", col: "#34D399" },
];

const ALERTS: { sev: Severity; msg: string; svc: string; ago: string }[] = [
    { sev: "warn", msg: "payments p95 above 300ms", svc: "payments", ago: "2m" },
    { sev: "crit", msg: "queue: consumer lag 4.2k msgs", svc: "queue", ago: "5m" },
    { sev: "info", msg: "autoscale api-gateway 6→8 pods", svc: "api-gateway", ago: "11m" },
    { sev: "warn", msg: "billing ret/min elevated", svc: "billing", ago: "18m" },
    { sev: "info", msg: "deploy search@2.14.1 ok", svc: "search", ago: "24m" },
    { sev: "info", msg: "cache hit rate 88%", svc: "cache", ago: "31m" },
];

// ECharts touches the DOM; register modules once at module load (client + SSR safe).
registerAll();

/* ── Page ─────────────────────────────────────────────────────────────────── */

export default function Helm({ style }: { style: Style }) {
    // Live wall-clock — deterministic first paint, advanced only in an effect.
    const [clock, setClock] = useState("14:06:22");
    // Click a service tile to spotlight it (others dim) — controlled focus state.
    const [focus, setFocus] = useState<string | null>(null);

    useEffect(() => {
        const pad = (n: number) => String(n).padStart(2, "0");
        const tick = () => {
            const d = new Date();
            setClock(`${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`);
        };
        tick();
        const id = window.setInterval(tick, 1000);
        return () => window.clearInterval(id);
    }, []);

    return (
        <div className="dbhelm-root">
            {/* ── Topbar (Navbar) — brand + status cluster + live clock ──────── */}
            <Navbar className="dbhelm-topbar">
                <Navbar.Brand className="dbhelm-brand">
                    <span className="dbhelm-mark" aria-hidden>
                        H
                    </span>
                    <span className="dbhelm-brand__name">Helm</span>
                    <span className="dbhelm-brand__crumb">/ NOC · us-east-1</span>
                </Navbar.Brand>
                <Navbar.Items className="dbhelm-cluster">
                    <Badge className="dbhelm-op" color="emerald" variant="soft" size="sm" dot>
                        Operational
                    </Badge>
                    <span className="dbhelm-uptime">uptime 99.98% · 30d</span>
                    <span className="dbhelm-clock" aria-label="Wall clock">
                        {clock}
                    </span>
                </Navbar.Items>
            </Navbar>

            {/* ── Hero KPI row — five oversized stat Cards ───────────────────── */}
            <div className="dbhelm-kpis">
                {HERO.map((h) => (
                    <Card key={h.k} className="dbhelm-kpi" variant="outlined" padding="none">
                        <div className="dbhelm-kpi__k">{h.k}</div>
                        <div className="dbhelm-kpi__v" style={{ color: h.col }}>
                            {h.v}
                        </div>
                        {typeof h.meter === "number" ? (
                            <Progress
                                className="dbhelm-kpi__meter"
                                value={h.meter}
                                max={100}
                                size="sm"
                                color="blue"
                            />
                        ) : null}
                        <div className="dbhelm-kpi__sub">{h.sub}</div>
                    </Card>
                ))}
            </div>

            {/* ── Body — service wall (2fr) + right rail (1fr) ───────────────── */}
            <div className="dbhelm-body">
                {/* Service health wall */}
                <Card className="dbhelm-wall" variant="outlined" padding="none">
                    <div className="dbhelm-wall__head">
                        <Heading as="h2" size="xs" weight="semibold" className="dbhelm-panel-title">
                            Service health wall
                        </Heading>
                        <span className="dbhelm-mono-dim">24 services</span>
                    </div>
                    <div className="dbhelm-wall__grid">
                        {SERVICES.map((s) => {
                            const tone = STATUS[s.status];
                            const dim = focus !== null && focus !== s.name;
                            return (
                                <Card
                                    key={s.name}
                                    variant="outlined"
                                    padding="none"
                                    className={
                                        "dbhelm-svc" +
                                        (focus === s.name ? " dbhelm-svc--focus" : "") +
                                        (dim ? " dbhelm-svc--dim" : "")
                                    }
                                    style={{ background: tone.bg, border: `1px solid ${tone.border}` } as CSSProperties}
                                    data-svc={s.status}
                                    role="button"
                                    tabIndex={0}
                                    aria-pressed={focus === s.name}
                                    onClick={() => setFocus((c) => (c === s.name ? null : s.name))}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter" || e.key === " ") {
                                            e.preventDefault();
                                            setFocus((c) => (c === s.name ? null : s.name));
                                        }
                                    }}
                                >
                                    <div className="dbhelm-svc__top">
                                        <span
                                            className="dbhelm-dot"
                                            style={{ background: tone.dot, boxShadow: `0 0 7px ${tone.dot}` }}
                                            aria-hidden
                                        />
                                        <span className="dbhelm-svc__rps">{s.rps}</span>
                                    </div>
                                    <div className="dbhelm-svc__name">{s.name}</div>
                                    <EChart
                                        className="dbhelm-svc__spark"
                                        option={s.option}
                                        style={{ height: 22, width: "100%" }}
                                    />
                                </Card>
                            );
                        })}
                    </div>
                </Card>

                {/* Right rail — throughput + alerts */}
                <div className="dbhelm-rail">
                    <Card className="dbhelm-tp" variant="outlined" padding="none">
                        <div className="dbhelm-tp__head">
                            <Activity size={15} className="dbhelm-ic-blue" aria-hidden />
                            <Heading as="h2" size="xs" weight="semibold" className="dbhelm-panel-title">
                                Global throughput
                            </Heading>
                        </div>
                        <EChart
                            className="dbhelm-tp__chart"
                            option={THROUGHPUT_OPTION}
                            style={{ height: 70, width: "100%" }}
                        />
                        <div className="dbhelm-tp__foot">
                            <span>18.4k rps</span>
                            <span>p95 142ms</span>
                        </div>
                    </Card>

                    <Card className="dbhelm-alerts" variant="outlined" padding="none">
                        <div className="dbhelm-alerts__head">
                            <Bell size={15} className="dbhelm-ic-amber" aria-hidden />
                            <Heading as="h2" size="xs" weight="semibold" className="dbhelm-panel-title">
                                Active alerts
                            </Heading>
                            <span className="dbhelm-alerts__firing">2 firing</span>
                        </div>
                        <div className="dbhelm-alerts__body">
                            <Timeline animated={false} className="dbhelm-alerts-tl">
                                {ALERTS.map((a, i) => (
                                    <Timeline.Item
                                        key={i}
                                        color={SEV[a.sev].color}
                                        className={`dbhelm-alert dbhelm-alert--${a.sev}`}
                                    >
                                        <div className="dbhelm-alert__msg">{a.msg}</div>
                                        <div className="dbhelm-alert__meta">
                                            {a.svc} · {a.ago}
                                        </div>
                                    </Timeline.Item>
                                ))}
                            </Timeline>
                        </div>
                    </Card>
                </div>
            </div>

            {/* Colophon — sits inside the board's flow (frame owns back-nav). */}
            <Text as="div" size="xs" className="dbhelm-colophon">
                Helm — a fictional cloud NOC, for demonstration · Dashboard {style.num} / {style.name} · every
                surface is a restyled Fancy UI primitive
            </Text>
        </div>
    );
}
