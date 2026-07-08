import "./fleet.css";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
    Badge,
    Button,
    Card,
    Heading,
    Navbar,
    Progress,
    Sidebar,
    Table,
    Text,
} from "@particle-academy/react-fancy";
import { EChart, registerAll } from "@particle-academy/fancy-echarts";
import { BarChart3, Map as MapIcon, Package, Truck, Users } from "lucide-react";
import type { Style } from "../../types";

/**
 * Dashboards · Style 06 — Fleet (dark, logistics dispatch console).
 *
 * A Milwaukee last-mile delivery depot at 14:06 CST, shift B, rendered as a
 * two-pane dispatch console: a 220px <Sidebar> rail beside a main column whose
 * <Navbar> topbar carries the live counters, over a split body — a full-bleed
 * live fleet map on the left and a scrollable ops panel (KPI <Card> strip +
 * "Active deliveries" <Table> + shift-target <Progress> bars) on the right.
 *
 * The map is the dashboard's one data-viz: a fancy-echarts <EChart> on a grid
 * coordinate system — a dashed 'line' pair for the two routes plus a 'scatter'
 * of five truck markers colored by status, over a CSS 44px grid. Clicking a
 * delivery row (or a truck on the map) links the two: the truck is emphasized
 * and the row highlighted — controlled React state, the Human+ tie between the
 * data grid and the visualization.
 *
 * Mounted by Inspiration/Show.tsx for `style.id === "fleet"`. SSR-safe: no
 * browser APIs in render; the clock "14:06 CST" is a static literal (never
 * Date.now()); the EChart is gated behind a mounted flag so the server emits
 * only the schematic grid placeholder and the client hydrates it in an effect.
 * The page sits below the neutral GalleryFrame (z-index 30) — nothing here
 * exceeds z-index 6.
 */

registerAll();

/* ── Palette ─────────────────────────────────────────────────────────────── */
const C_ONTIME = "#34D399";
const C_LATE = "#F59E0B";
const C_SOON = "#3B82F6";

/* ── Sidebar nav (the mockup's nav array) ────────────────────────────────── */
type NavId = "map" | "deliveries" | "vehicles" | "drivers" | "reports";
const NAV: { id: NavId; label: string; icon: ReactNode }[] = [
    { id: "map", label: "Live map", icon: <MapIcon size={16} /> },
    { id: "deliveries", label: "Deliveries", icon: <Package size={16} /> },
    { id: "vehicles", label: "Vehicles", icon: <Truck size={16} /> },
    { id: "drivers", label: "Drivers", icon: <Users size={16} /> },
    { id: "reports", label: "Reports", icon: <BarChart3 size={16} /> },
];

/* ── Truck markers — pos map from the mockup, top% flipped to bottom-up y ─── */
type TruckStat = "ontime" | "late" | "soon";
type Truck = { id: string; plate: string; x: number; y: number; color: string; stat: TruckStat };
const TRUCKS: Truck[] = [
    { id: "t1", plate: "MKE-12", x: 18, y: 30, color: C_ONTIME, stat: "ontime" },
    { id: "t2", plate: "MKE-08", x: 44, y: 42, color: C_ONTIME, stat: "ontime" },
    { id: "t3", plate: "MKE-21", x: 68, y: 70, color: C_LATE, stat: "late" },
    { id: "t4", plate: "MKE-03", x: 30, y: 72, color: C_SOON, stat: "soon" },
    { id: "t5", plate: "MKE-17", x: 78, y: 36, color: C_ONTIME, stat: "ontime" },
];
const VEH_TO_TRUCK: Record<string, string> = { "12": "t1", "08": "t2", "21": "t3", "03": "t4", "17": "t5" };
const TRUCK_TO_VEH: Record<string, string> = { t1: "12", t2: "08", t3: "21", t4: "03", t5: "17" };

/* Two schematic routes as smooth polylines in the 0–100 grid space. */
const ROUTE_AMBER: [number, number][] = [[10, 24], [34, 33], [52, 36], [70, 45], [90, 64]];
const ROUTE_BLUE: [number, number][] = [[21, 76], [44, 66], [62, 64], [80, 44], [97, 24]];

/* ── KPI strip (renderVals().kpis) ───────────────────────────────────────── */
const KPIS = [
    { k: "On-time", v: "94%" },
    { k: "Avg / stop", v: "6.2m" },
    { k: "Miles today", v: "1,840" },
];

/* ── FLEET STATUS overlay figures ────────────────────────────────────────── */
const FLEET = [
    { n: "28", cap: "en route", color: C_ONTIME },
    { n: "3", cap: "delayed", color: C_LATE },
    { n: "9", cap: "idle", color: "#6B7280" },
];

/* ── Active deliveries (renderVals().deliveries, verbatim) ───────────────── */
type Delivery = { veh: string; dest: string; driver: string; stops: string; stat: TruckStat; eta: string };
const DELIVERIES: Delivery[] = [
    { veh: "12", dest: "Third Ward — 44 pkgs", driver: "R. Diaz", stops: "12", stat: "ontime", eta: "ETA 14:20" },
    { veh: "08", dest: "Bay View route", driver: "L. Park", stops: "9", stat: "soon", eta: "ETA 14:35" },
    { veh: "21", dest: "Wauwatosa loop", driver: "T. Brooks", stops: "15", stat: "late", eta: "+22 min" },
    { veh: "03", dest: "Downtown express", driver: "M. Sy", stops: "6", stat: "ontime", eta: "ETA 14:18" },
    { veh: "17", dest: "Riverwest", driver: "J. Okonkwo", stops: "11", stat: "ontime", eta: "ETA 14:41" },
    { veh: "05", dest: "Shorewood", driver: "A. Reed", stops: "8", stat: "soon", eta: "ETA 14:52" },
    { veh: "14", dest: "Walker's Point", driver: "C. Yan", stops: "10", stat: "late", eta: "+14 min" },
];

const STAT_BADGE: Record<TruckStat, "emerald" | "blue" | "amber"> = {
    ontime: "emerald",
    soon: "blue",
    late: "amber",
};

/* ── Shift targets — a compact Progress trio at the panel foot ───────────── */
const TARGETS = [
    { label: "On-time SLA", val: 94, color: "emerald" as const, note: "target 90%" },
    { label: "Fleet in service", val: 70, color: "blue" as const, note: "28 / 40 vans" },
    { label: "Route completion", val: 61, color: "amber" as const, note: "shift B" },
];

export default function Fleet({ style }: { style: Style }) {
    /** Which nav item is lit (mockup: "Live map" active). */
    const [nav, setNav] = useState<NavId>("map");
    /** Selected vehicle — links a delivery row to its truck marker (or null). */
    const [selected, setSelected] = useState<string | null>(null);
    /** Client-only gate for the EChart (keeps the server render deterministic). */
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const selectedTruck = selected ? (VEH_TO_TRUCK[selected] ?? null) : null;

    const mapOption = useMemo(
        () => ({
            backgroundColor: "transparent",
            animationDuration: 600,
            grid: { left: 10, right: 10, top: 10, bottom: 10, containLabel: false },
            xAxis: { type: "value", min: 0, max: 100, show: false },
            yAxis: { type: "value", min: 0, max: 100, show: false },
            tooltip: {
                trigger: "item",
                backgroundColor: "#12161D",
                borderColor: "#1E242E",
                borderWidth: 1,
                padding: [6, 9],
                textStyle: { color: "#D3D8E0", fontSize: 11 },
                formatter: (p: { data?: { plate?: string; statLabel?: string } }) =>
                    p.data && p.data.plate ? `${p.data.plate} · ${p.data.statLabel}` : "",
            },
            series: [
                {
                    type: "line",
                    smooth: true,
                    symbol: "none",
                    silent: true,
                    lineStyle: { color: C_LATE, width: 2, type: [3, 8] as number[], opacity: 0.8 },
                    data: ROUTE_AMBER,
                    z: 1,
                },
                {
                    type: "line",
                    smooth: true,
                    symbol: "none",
                    silent: true,
                    lineStyle: { color: C_SOON, width: 2, type: [3, 8] as number[], opacity: 0.8 },
                    data: ROUTE_BLUE,
                    z: 1,
                },
                {
                    type: "scatter",
                    symbol: "roundRect",
                    z: 5,
                    emphasis: { scale: 1.1 },
                    label: {
                        show: true,
                        position: "bottom",
                        distance: 7,
                        formatter: (p: { data?: { plate?: string } }) => p.data?.plate ?? "",
                        color: "#D3D8E0",
                        backgroundColor: "rgba(0,0,0,0.6)",
                        padding: [1, 5],
                        borderRadius: 4,
                        fontSize: 10,
                        fontFamily: "Geist Mono, ui-monospace, monospace",
                    },
                    data: TRUCKS.map((t) => {
                        const on = t.id === selectedTruck;
                        return {
                            value: [t.x, t.y],
                            id: t.id,
                            plate: t.plate,
                            statLabel: t.stat === "ontime" ? "on time" : t.stat === "late" ? "delayed" : "arriving",
                            symbolSize: on ? 30 : 20,
                            itemStyle: {
                                color: t.color,
                                borderColor: on ? "#EAEEF4" : "rgba(0,0,0,0.35)",
                                borderWidth: on ? 2 : 1,
                                shadowBlur: 10,
                                shadowColor: "rgba(0,0,0,0.45)",
                            },
                        };
                    }),
                },
            ],
        }),
        [selectedTruck],
    );

    const onChartReady = (chart: {
        on: (ev: string, cb: (p: { seriesType?: string; data?: { id?: string } }) => void) => void;
    }) => {
        chart.on("click", (params) => {
            if (params.seriesType === "scatter" && params.data?.id) {
                const veh = TRUCK_TO_VEH[params.data.id];
                if (veh) setSelected((cur) => (cur === veh ? null : veh));
            }
        });
    };

    return (
        <div className="dbfleet-root">
            <div className="dbfleet-shell">
                {/* ── Sidebar rail ─────────────────────────────────────────── */}
                <Sidebar className="dbfleet-side">
                    <div className="dbfleet-brand">
                        <span className="dbfleet-brand__mark" aria-hidden>
                            F
                        </span>
                        <span className="dbfleet-brand__name">Fleet</span>
                    </div>
                    <nav className="dbfleet-nav" aria-label="Dispatch">
                        {NAV.map((item) => (
                            <Sidebar.Item
                                key={item.id}
                                icon={item.icon}
                                active={nav === item.id}
                                onClick={() => setNav(item.id)}
                                className="dbfleet-navitem"
                            >
                                {item.label}
                            </Sidebar.Item>
                        ))}
                    </nav>
                    <div className="dbfleet-depot">
                        dispatch · shift B
                        <br />
                        Milwaukee depot
                    </div>
                </Sidebar>

                {/* ── Main column ──────────────────────────────────────────── */}
                <div className="dbfleet-main">
                    <Navbar className="dbfleet-topbar">
                        <Navbar.Brand>
                            <Heading as="h1" size="sm" weight="semibold" className="dbfleet-topbar__title">
                                Live operations
                            </Heading>
                        </Navbar.Brand>
                        <div className="dbfleet-live">
                            <span className="dbfleet-live__active">
                                <span className="dbfleet-live__dot" aria-hidden />
                                28 active
                            </span>
                            <span className="dbfleet-live__delayed">3 delayed</span>
                            <span className="dbfleet-live__sep" aria-hidden>
                                ·
                            </span>
                            <span className="dbfleet-live__clock">14:06 CST</span>
                        </div>
                    </Navbar>

                    <div className="dbfleet-body">
                        {/* ── Live fleet map ───────────────────────────────── */}
                        <div className="dbfleet-map">
                            <div className="dbfleet-map__grid" aria-hidden />
                            <div className="dbfleet-map__chart">
                                {mounted ? (
                                    <EChart option={mapOption} onChartReady={onChartReady} style={{ height: "100%", width: "100%" }} />
                                ) : (
                                    <div className="dbfleet-map__placeholder" aria-hidden />
                                )}
                            </div>

                            <Card variant="flat" padding="none" className="dbfleet-status">
                                <Card.Body className="dbfleet-status__body">
                                    <Text as="div" size="xs" className="dbfleet-status__label">
                                        FLEET STATUS
                                    </Text>
                                    <div className="dbfleet-status__figs">
                                        {FLEET.map((f) => (
                                            <div key={f.cap} className="dbfleet-status__fig">
                                                <div className="dbfleet-status__num" style={{ color: f.color }}>
                                                    {f.n}
                                                </div>
                                                <div className="dbfleet-status__cap">{f.cap}</div>
                                            </div>
                                        ))}
                                    </div>
                                    <Progress
                                        value={70}
                                        max={100}
                                        variant="bar"
                                        size="sm"
                                        color="emerald"
                                        className="dbfleet-status__bar"
                                    />
                                </Card.Body>
                            </Card>
                        </div>

                        {/* ── Ops panel ────────────────────────────────────── */}
                        <div className="dbfleet-panel">
                            <div className="dbfleet-kpis">
                                {KPIS.map((kpi) => (
                                    <Card key={kpi.k} variant="flat" padding="none" className="dbfleet-kpi">
                                        <Card.Body className="dbfleet-kpi__body">
                                            <div className="dbfleet-kpi__k">{kpi.k}</div>
                                            <div className="dbfleet-kpi__v">{kpi.v}</div>
                                        </Card.Body>
                                    </Card>
                                ))}
                            </div>

                            <div className="dbfleet-deliv__head">
                                <span className="dbfleet-deliv__title">Active deliveries</span>
                                <div className="dbfleet-deliv__meta">
                                    <Badge color="zinc" variant="soft" size="sm" className="dbfleet-deliv__count">
                                        {DELIVERIES.length}
                                    </Badge>
                                    <Button variant="ghost" size="sm" iconTrailing="arrow-right" className="dbfleet-deliv__all">
                                        All
                                    </Button>
                                </div>
                            </div>

                            <div className="dbfleet-tablewrap">
                                <Table className="dbfleet-table">
                                    <Table.Head className="dbfleet-table__head">
                                        <Table.Column label="Vehicle" />
                                        <Table.Column label="Destination" />
                                        <Table.Column label="ETA" />
                                    </Table.Head>
                                    <Table.Body>
                                        {DELIVERIES.map((d) => {
                                            const on = selected === d.veh;
                                            return (
                                                <Table.Row
                                                    key={d.veh + d.dest}
                                                    onClick={() => setSelected((cur) => (cur === d.veh ? null : d.veh))}
                                                    className={`dbfleet-row${on ? " is-selected" : ""}`}
                                                >
                                                    <Table.Cell className="dbfleet-cell-veh">
                                                        <span className={`dbfleet-veh dbfleet-veh--${d.stat}`}>{d.veh}</span>
                                                    </Table.Cell>
                                                    <Table.Cell className="dbfleet-cell-dest">
                                                        <span className="dbfleet-dest">{d.dest}</span>
                                                        <span className="dbfleet-sub">
                                                            {d.driver} · {d.stops} stops
                                                        </span>
                                                    </Table.Cell>
                                                    <Table.Cell className="dbfleet-cell-eta">
                                                        <Badge
                                                            color={STAT_BADGE[d.stat]}
                                                            variant="soft"
                                                            size="sm"
                                                            className="dbfleet-eta"
                                                        >
                                                            {d.eta}
                                                        </Badge>
                                                    </Table.Cell>
                                                </Table.Row>
                                            );
                                        })}
                                    </Table.Body>
                                </Table>
                            </div>

                            <div className="dbfleet-targets">
                                <div className="dbfleet-targets__head">Shift targets</div>
                                {TARGETS.map((t) => (
                                    <div key={t.label} className="dbfleet-target">
                                        <div className="dbfleet-target__row">
                                            <span className="dbfleet-target__label">{t.label}</span>
                                            <span className="dbfleet-target__note">{t.note}</span>
                                        </div>
                                        <Progress
                                            value={t.val}
                                            max={100}
                                            variant="bar"
                                            size="sm"
                                            color={t.color}
                                            className="dbfleet-target__bar"
                                        />
                                    </div>
                                ))}
                            </div>

                            <div className="dbfleet-colophon">
                                Fleet — a fictional Milwaukee delivery depot, for demonstration · Dashboard {style.num} /{" "}
                                {style.name} · every surface is a restyled Fancy UI primitive
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
