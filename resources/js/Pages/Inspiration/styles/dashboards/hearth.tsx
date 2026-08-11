import "./hearth.css";
import { useMemo, useState, type CSSProperties } from "react";
import {
    Badge,
    Button,
    Card,
    Heading,
    Navbar,
    Progress,
    Switch,
    Table,
    Text,
} from "@particle-academy/react-fancy";
import { type EChartsOption, EChart, registerAll } from "@particle-academy/fancy-echarts";
import {
    Cctv,
    Clapperboard,
    CloudSun,
    House,
    Lightbulb,
    Lock,
    type LucideIcon,
    Moon,
    Speaker,
    Sunrise,
    Thermometer,
    Warehouse,
    Zap,
} from "lucide-react";
import type { Style } from "../../types";

/**
 * Dashboards · Style 07 — Hearth (smart home).
 *
 * A consumer smart-home surface with NO operator app-shell: a single centered
 * 1080px column over a near-black teal page. A light restyled <Navbar> carries
 * the gradient "H" lockup + a weather <Badge>; a status greeting; a four-up row
 * of scene <Button> toggles (single-select, cyan-tinted when active); a 2-up
 * card grid — a Climate <Card> whose thermostat ring is a fancy-echarts <EChart>
 * gauge (with a hand-rolled centered temperature overlay) beside a key/value
 * readout, and an Energy <Card> whose hourly consumption is an <EChart> bar with
 * a top-rounded cyan gradient — then a full-width Devices <Card> whose body is a
 * <Table> of six device rows, each with a lucide icon tile, a status <Badge>,
 * and a controlled react-fancy <Switch>. A <Progress> meter in the Devices
 * header reflects the live on-count.
 *
 * Mounted by Inspiration/Show.tsx for `style.id === "hearth"`. SSR-safe: no
 * browser APIs during render, deterministic first paint (the gauge's 62% and the
 * bar heights are static data, never the wall clock), the only motion is a CSS
 * opacity pulse on the header "live" dot. All state is controlled (scene =
 * single-select value; device toggles = booleans) so, per the Human+ contract,
 * every scene and device is an agent-addressable handle. Both charts are
 * fancy-echarts <EChart> (SSR-safe: container renders, ECharts inits in an
 * effect) — never hand-rolled SVG/div bars. Nothing here is fixed or z-indexed,
 * so it sits cleanly below the gallery frame's z-index 30.
 */

registerAll();

/* ── Data (the mockup's DCLogic.renderVals(), recreated verbatim) ─────────── */

type Scene = {
    id: string;
    label: string;
    sub: string;
    icon: LucideIcon;
    col: string;
};

const SCENES: Scene[] = [
    { id: "morning", label: "Good morning", sub: "6:30 AM", icon: Sunrise, col: "#F59E0B" },
    { id: "home", label: "Home", sub: "active", icon: House, col: "#22D3EE" },
    { id: "movie", label: "Movie", sub: "dim + TV", icon: Clapperboard, col: "#8B5CF6" },
    { id: "night", label: "Good night", sub: "10:30 PM", icon: Moon, col: "#60A5FA" },
];

const CLIMATE: { k: string; v: string }[] = [
    { k: "Temperature", v: "70°F" },
    { k: "Humidity", v: "44%" },
    { k: "Air quality", v: "Good" },
];

/** Twelve hourly percent-of-peak heights (peak 88), 12a → now. */
const ENERGY = [30, 22, 18, 20, 35, 58, 72, 64, 50, 68, 88, 74];

type Device = {
    id: string;
    name: string;
    detail: string;
    status: string;
    icon: LucideIcon;
    on: boolean;
};

const DEVICES: Device[] = [
    { id: "lights", name: "Living room lights", detail: "3 bulbs · 60%", status: "On", icon: Lightbulb, on: true },
    { id: "thermostat", name: "Thermostat", detail: "Living room", status: "Heating 72°", icon: Thermometer, on: true },
    { id: "door", name: "Front door", detail: "Front entry", status: "Locked", icon: Lock, on: true },
    { id: "speaker", name: "Kitchen speaker", detail: "Kitchen", status: "Playing", icon: Speaker, on: true },
    { id: "garage", name: "Garage", detail: "Garage door", status: "Closed", icon: Warehouse, on: false },
    { id: "cam", name: "Backyard cam", detail: "Backyard", status: "Recording", icon: Cctv, on: true },
];

/* ── Chart options (static, deterministic — no window/Date/random) ────────── */

const ACCENT = "#22D3EE";

/** Thermostat ring — a single-value gauge, cyan progress arc on a dark track. */
const gaugeOption: EChartsOption = {
    series: [
        {
            type: "gauge",
            startAngle: 90,
            endAngle: -270,
            radius: "94%",
            center: ["50%", "50%"],
            min: 0,
            max: 100,
            progress: { show: true, width: 11, roundCap: true, itemStyle: { color: ACCENT } },
            axisLine: { lineStyle: { width: 11, color: [[1, "#1A2E32"]] } },
            axisTick: { show: false },
            splitLine: { show: false },
            axisLabel: { show: false },
            pointer: { show: false },
            anchor: { show: false },
            title: { show: false },
            detail: { show: false },
            data: [{ value: 62 }],
        },
    ],
};

/** Energy today — 12 hourly bars, top-rounded vertical cyan gradient. */
const energyOption: EChartsOption = {
    grid: { left: 2, right: 2, top: 10, bottom: 22, containLabel: false },
    tooltip: {
        trigger: "axis",
        axisPointer: { type: "none" },
        backgroundColor: "#0B1416",
        borderColor: "#1D3438",
        textStyle: { color: "#DCE8E8", fontSize: 11 },
        formatter: (raw) => {
            // `trigger: "axis"` delivers an array and `"item"` a single params
            // object; ECharts types the callback as both, so narrow rather than
            // annotate only the shape this chart happens to produce.
            const p = (Array.isArray(raw) ? raw : [raw]) as unknown as { dataIndex: number }[];
            return `${ENERGY[p[0].dataIndex]}% of peak`;
        },
    },
    xAxis: {
        type: "category",
        data: ENERGY.map((_, i) => (i === 0 ? "12a" : i === 6 ? "12p" : i === 11 ? "now" : "")),
        axisTick: { show: false },
        axisLine: { show: false },
        axisLabel: {
            interval: 0,
            color: "#4E6B6E",
            fontSize: 10,
            fontFamily: "Geist Mono, ui-monospace, monospace",
        },
    },
    yAxis: {
        type: "value",
        max: 100,
        show: true,
        splitLine: { show: false },
        axisLabel: { show: false },
        axisLine: { show: false },
        axisTick: { show: false },
    },
    series: [
        {
            type: "bar",
            data: ENERGY,
            barWidth: "58%",
            itemStyle: {
                borderRadius: [3, 3, 0, 0],
                color: {
                    type: "linear",
                    x: 0,
                    y: 0,
                    x2: 0,
                    y2: 1,
                    colorStops: [
                        { offset: 0, color: "#22d3ee" },
                        { offset: 1, color: "#0891b2" },
                    ],
                },
            },
        },
    ],
};

/* ── Page ─────────────────────────────────────────────────────────────────── */

export default function Hearth({ style }: { style: Style }) {
    /** Single-select scene (only "Home" active in the mock). */
    const [scene, setScene] = useState<string>("home");
    /** Controlled on/off per device — each id is an agent-addressable handle. */
    const [deviceOn, setDeviceOn] = useState<Record<string, boolean>>(() =>
        Object.fromEntries(DEVICES.map((d) => [d.id, d.on])),
    );

    const onCount = useMemo(() => Object.values(deviceOn).filter(Boolean).length, [deviceOn]);

    return (
        <div className="dbhearth-root">
            <div className="dbhearth-shell">
                {/* ── Header — brand lockup + weather chip ─────────────────── */}
                <Navbar className="dbhearth-nav">
                    <Navbar.Brand className="dbhearth-brand">
                        <span className="dbhearth-brand__mark" aria-hidden>
                            H
                        </span>
                        <span className="dbhearth-brand__word">Hearth</span>
                    </Navbar.Brand>
                    <Navbar.Items className="dbhearth-navmeta">
                        <Badge className="dbhearth-weather" color="cyan" variant="soft" size="sm">
                            <CloudSun size={14} aria-hidden />
                            72°F · clear
                        </Badge>
                        <span className="dbhearth-place">
                            <span className="dbhearth-livedot" aria-hidden />
                            Home
                        </span>
                    </Navbar.Items>
                </Navbar>

                {/* ── Welcome greeting ─────────────────────────────────────── */}
                <div className="dbhearth-welcome">
                    <Text as="div" size="sm" className="dbhearth-eyebrow">
                        Welcome home
                    </Text>
                    <Heading as="h1" className="dbhearth-greeting">
                        Everything&apos;s calm. 8 devices on.
                    </Heading>
                </div>

                {/* ── Scene selector — single-select toggle tiles ──────────── */}
                <div className="dbhearth-scenes" role="group" aria-label="Scenes">
                    {SCENES.map((s) => {
                        const active = scene === s.id;
                        const SceneIcon = s.icon;
                        return (
                            <Button
                                key={s.id}
                                type="button"
                                variant="ghost"
                                className={"dbhearth-scene" + (active ? " is-active" : "")}
                                aria-pressed={active}
                                onClick={() => setScene(s.id)}
                                style={{ "--dbhearth-scene-col": s.col } as CSSProperties}
                            >
                                <span className="dbhearth-scene__icon" aria-hidden>
                                    <SceneIcon size={18} />
                                </span>
                                <span className="dbhearth-scene__label">{s.label}</span>
                                <span className="dbhearth-scene__sub">{active ? "active" : s.sub}</span>
                            </Button>
                        );
                    })}
                </div>

                {/* ── Climate + Energy ─────────────────────────────────────── */}
                <div className="dbhearth-grid2">
                    {/* Climate */}
                    <Card variant="flat" padding="none" className="dbhearth-card dbhearth-climate">
                        <Card.Body className="dbhearth-climate__body">
                            <div className="dbhearth-gauge">
                                <EChart option={gaugeOption} style={{ width: 140, height: 140 }} />
                                <div className="dbhearth-gauge__overlay" aria-hidden>
                                    <div className="dbhearth-gauge__temp">70°</div>
                                    <div className="dbhearth-gauge__cap">heating to 72°</div>
                                </div>
                            </div>
                            <div className="dbhearth-readout">
                                <Heading as="h2" size="sm" weight="semibold" className="dbhearth-readout__title">
                                    Living room
                                </Heading>
                                <dl className="dbhearth-deflist">
                                    {CLIMATE.map((c) => (
                                        <div key={c.k} className="dbhearth-deflist__row">
                                            <dt>{c.k}</dt>
                                            <dd>{c.v}</dd>
                                        </div>
                                    ))}
                                </dl>
                            </div>
                        </Card.Body>
                    </Card>

                    {/* Energy */}
                    <Card variant="flat" padding="none" className="dbhearth-card dbhearth-energy">
                        <Card.Header className="dbhearth-energy__head">
                            <span className="dbhearth-energy__title">
                                <Zap size={15} aria-hidden />
                                Energy today
                            </span>
                            <span className="dbhearth-energy__kwh">18.4 kWh</span>
                        </Card.Header>
                        <Card.Body className="dbhearth-energy__body">
                            <Badge className="dbhearth-delta" color="emerald" variant="soft" size="sm">
                                −12% vs yesterday
                            </Badge>
                            <EChart option={energyOption} style={{ height: 132, width: "100%" }} />
                        </Card.Body>
                    </Card>
                </div>

                {/* ── Devices ──────────────────────────────────────────────── */}
                <Card variant="flat" padding="none" className="dbhearth-card dbhearth-devices">
                    <Card.Header className="dbhearth-devices__head">
                        <span className="dbhearth-devices__title">Devices</span>
                        <span className="dbhearth-devices__count">
                            <Progress
                                value={onCount}
                                max={DEVICES.length}
                                variant="bar"
                                size="sm"
                                color="cyan"
                                className="dbhearth-devices__meter"
                            />
                            <span className="dbhearth-devices__num">
                                {onCount} of {DEVICES.length} on
                            </span>
                        </span>
                    </Card.Header>
                    <Card.Body className="dbhearth-devices__body">
                        <Table className="dbhearth-devtable">
                            <Table.Head>
                                <Table.Column label="Device" />
                                <Table.Column label="Status" />
                                <Table.Column label="" />
                            </Table.Head>
                            <Table.Body>
                                {DEVICES.map((d) => {
                                    const on = deviceOn[d.id];
                                    const DeviceIcon = d.icon;
                                    return (
                                        <Table.Row key={d.id} className="dbhearth-devrow">
                                            <Table.Cell>
                                                <span className="dbhearth-dev">
                                                    <span
                                                        className={"dbhearth-dev__icon" + (on ? " is-on" : "")}
                                                        aria-hidden
                                                    >
                                                        <DeviceIcon size={18} />
                                                    </span>
                                                    <span className="dbhearth-dev__meta">
                                                        <span className="dbhearth-dev__name">{d.name}</span>
                                                        <span className="dbhearth-dev__detail">{d.detail}</span>
                                                    </span>
                                                </span>
                                            </Table.Cell>
                                            <Table.Cell>
                                                <Badge
                                                    className={"dbhearth-devstatus " + (on ? "is-on" : "is-off")}
                                                    color={on ? "cyan" : "zinc"}
                                                    variant="soft"
                                                    size="sm"
                                                    dot={on}
                                                >
                                                    {on ? d.status : "Off"}
                                                </Badge>
                                            </Table.Cell>
                                            <Table.Cell className="dbhearth-dev__power">
                                                <Switch
                                                    checked={on}
                                                    onCheckedChange={(v) =>
                                                        setDeviceOn((prev) => ({ ...prev, [d.id]: v }))
                                                    }
                                                    color="cyan"
                                                    aria-label={`Toggle ${d.name}`}
                                                />
                                            </Table.Cell>
                                        </Table.Row>
                                    );
                                })}
                            </Table.Body>
                        </Table>
                    </Card.Body>
                </Card>

                {/* ── Colophon ─────────────────────────────────────────────── */}
                <div className="dbhearth-colophon">
                    Hearth — a fictional smart-home dashboard, for demonstration · App {style.num} / {style.name} ·
                    every surface is a restyled Fancy UI primitive
                </div>
            </div>
        </div>
    );
}
