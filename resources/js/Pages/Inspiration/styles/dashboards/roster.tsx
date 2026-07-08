import "./roster.css";
import { Fragment, useState, type CSSProperties } from "react";
import {
    Avatar,
    Badge,
    Button,
    Card,
    Heading,
    Kanban,
    Navbar,
    Pillbox,
    Progress,
    Separator,
    Table,
    Tabs,
    Text,
    Timeline,
} from "@particle-academy/react-fancy";
import { EChart, registerAll } from "@particle-academy/fancy-echarts";
import { Link } from "@inertiajs/react";
import type { Style } from "../../types";

/**
 * Dashboards · Style 14 — Roster (HR & people ops).
 *
 * A light-lavender back-of-house RECRUITING board: a 52px white topbar (gradient
 * "R" mark + Roster/Recruiting wordmark, a segmented Pipeline / Roles / Calendar
 * switcher, a mono meta count) over a full-bleed work area, closed by a pinned
 * 4-cell KPI strip. The hero is a horizontal Kanban of five funnel stages
 * (Applied → Hired); each candidate is a compact restyled card with an initials
 * Avatar, a 5-segment fit-score meter, and a mono time-in-stage stamp.
 *
 * Built almost entirely from restyled Fancy primitives — the whole point of the
 * gallery is to DEMONSTRATE THE KIT, not hand-roll divs:
 *   • Navbar (+ Brand)  — the topbar shell
 *   • Tabs              — the Pipeline/Roles/Calendar switcher, wired to real
 *                         state (the mock's tabs were static); each tab renders
 *                         a different Fancy surface
 *   • Kanban (+ Column/Card) — the pipeline board; candidate cards DRAG between
 *                         stages (Human+ controlled state) and the stage totals
 *                         follow the move
 *   • Avatar            — per-person initials chips
 *   • Progress          — the 5-segment fit-score meter (5 restyled bars/card)
 *   • Badge             — stage-count pills (violet→green ramp), status + deltas
 *   • Table             — the Roles view (Pillbox team filter + Button)
 *   • Timeline          — the Calendar view (upcoming interviews)
 *   • Card + Separator  — the divided KPI strip
 *   • EChart            — a violet trend sparkline under each KPI (the review's
 *                         blessed chart upgrade; fancy-echarts mounts client-side
 *                         and is SSR-safe)
 *
 * Mounted by Inspiration/Show.tsx for `style.id === "roster"`. SSR-safe: all
 * data is static module constants (no Math.random / Date.now / browser APIs in
 * render); the only state is drag/tab/filter via useState. Full-bleed root, own
 * background; every page-level layer stays under the gallery frame's z-index 30.
 */

registerAll();

/* ── Data — the mockup's DCLogic.renderVals(), verbatim ────────────────────── */

type Cand = {
    id: string;
    init: string;
    name: string;
    role: string;
    bg: string;
    score: number;
    ago: string;
};

const c = (id: string, init: string, name: string, role: string, bg: string, score: number, ago: string): Cand => ({
    id,
    init,
    name,
    role,
    bg,
    score,
    ago,
});

/** Stage-progress ramp: muted → violet-500 → violet-600 → violet-800 → green (Hired). */
const STAGE_RAMP = ["#8A7FA0", "#8B5CF6", "#7C3AED", "#5B21B6", "#0F9D58"];

const STAGES: { id: string; label: string; cands: Cand[] }[] = [
    {
        id: "applied",
        label: "Applied",
        cands: [
            c("JM", "JM", "Jordan Mills", "Sr. Frontend Eng", "#8B5CF6", 3, "2d"),
            c("AP", "AP", "Aisha Patel", "Product Designer", "#EC4899", 4, "3d"),
            c("RC", "RC", "Ray Chen", "Backend Eng", "#0891B2", 2, "4d"),
        ],
    },
    {
        id: "screening",
        label: "Screening",
        cands: [
            c("LK", "LK", "Lena Kraus", "Sr. Frontend Eng", "#F59E0B", 4, "1d"),
            c("TB", "TB", "Theo Brooks", "Data Eng", "#0EA5A0", 3, "2d"),
        ],
    },
    {
        id: "interview",
        label: "Interview",
        cands: [
            c("MS", "MS", "Mara Silva", "Product Designer", "#EC4899", 5, "today"),
            c("DO", "DO", "Deji Okoro", "Backend Eng", "#0891B2", 4, "1d"),
            c("NF", "NF", "Nadia Farah", "EM", "#8B5CF6", 4, "1d"),
        ],
    },
    {
        id: "offer",
        label: "Offer",
        cands: [
            c("CV", "CV", "Cara Voss", "Sr. Frontend Eng", "#F43F5E", 5, "today"),
            c("PW", "PW", "Paul Wei", "Data Eng", "#0EA5A0", 5, "2d"),
        ],
    },
    {
        id: "hired",
        label: "Hired",
        cands: [
            c("EM", "EM", "Elena Marín", "Product Designer", "#0F9D58", 5, "Jul 1"),
            c("SB", "SB", "Sam Byrne", "Backend Eng", "#0F9D58", 5, "Jun 28"),
        ],
    },
];

const INITIAL_COUNTS: Record<string, number> = {
    applied: 42,
    screening: 24,
    interview: 14,
    offer: 6,
    hired: 3,
};

const RAMP_BY_ID: Record<string, string> = Object.fromEntries(
    STAGES.map((s, i) => [s.id, STAGE_RAMP[i]]),
);

/* ── KPI strip + static trend sparklines (violet accent) ───────────────────── */

const sparkOption = (data: number[]) => ({
    animation: false,
    grid: { left: 1, right: 1, top: 6, bottom: 3 },
    xAxis: { type: "category", show: false, boundaryGap: false, data: data.map((_, i) => i) },
    yAxis: { type: "value", show: false, scale: true },
    tooltip: { show: false },
    series: [
        {
            type: "line",
            data,
            smooth: true,
            symbol: "none",
            lineStyle: { color: "#7C3AED", width: 2 },
            areaStyle: { color: "rgba(124,58,237,0.12)" },
        },
    ],
});

const KPIS = [
    { k: "Time to hire", v: "24d", delta: "▼ 3d", col: "#0F9D58", opt: sparkOption([31, 30, 28, 27, 26, 24]) },
    { k: "Offer accept", v: "82%", delta: "▲ 5%", col: "#0F9D58", opt: sparkOption([70, 73, 72, 77, 80, 82]) },
    { k: "Pipeline value", v: "42", delta: "active", col: "#8A7FA0", opt: sparkOption([40, 44, 41, 45, 43, 42]) },
    { k: "Cost / hire", v: "$4.2k", delta: "▼ $300", col: "#0F9D58", opt: sparkOption([4.9, 4.7, 4.8, 4.5, 4.4, 4.2]) },
];

/* ── Roles view (Table) — open reqs snapshot ──────────────────────────────── */

type RoleRow = { role: string; dept: string; stage: string; cands: number; status: "Open" | "Hot" | "Closing" };

const ROLES: RoleRow[] = [
    { role: "Sr. Frontend Eng", dept: "Engineering", stage: "Interview", cands: 8, status: "Hot" },
    { role: "Product Designer", dept: "Design", stage: "Screening", cands: 6, status: "Open" },
    { role: "Backend Eng", dept: "Engineering", stage: "Applied", cands: 11, status: "Open" },
    { role: "Data Eng", dept: "Data", stage: "Offer", cands: 3, status: "Closing" },
    { role: "Engineering Manager", dept: "Engineering", stage: "Interview", cands: 4, status: "Hot" },
    { role: "Product Manager", dept: "Product", stage: "Screening", cands: 5, status: "Open" },
    { role: "DevOps Eng", dept: "Platform", stage: "Applied", cands: 3, status: "Open" },
    { role: "UX Researcher", dept: "Design", stage: "Interview", cands: 2, status: "Closing" },
];

const STATUS_COLOR: Record<RoleRow["status"], string> = {
    Open: "#7C3AED",
    Hot: "#F59E0B",
    Closing: "#0F9D58",
};

/* ── Calendar view (Timeline) — this week's interviews ────────────────────── */

const EVENTS = [
    { date: "Today · 2:00 PM", title: "Mara Silva — Onsite loop", description: "Product Designer · final round with the design team.", color: "violet" as const },
    { date: "Today · 4:30 PM", title: "Deji Okoro — System design", description: "Backend Eng · 60 min with Nadia + Sal.", color: "violet" as const },
    { date: "Tomorrow · 10:00 AM", title: "Cara Voss — Offer call", description: "Sr. Frontend Eng · verbal offer + comp walk-through.", color: "green" as const },
    { date: "Thu · 11:00 AM", title: "Nadia Farah — EM panel", description: "Engineering Manager · cross-functional panel.", color: "violet" as const },
    { date: "Fri · 3:00 PM", title: "Paul Wei — Team fit", description: "Data Eng · final conversation before an offer.", color: "violet" as const },
];

/* ── Page ─────────────────────────────────────────────────────────────────── */

export default function Roster({ style }: { style: Style }) {
    const [tab, setTab] = useState("pipeline");
    const [board, setBoard] = useState<Record<string, Cand[]>>(() =>
        Object.fromEntries(STAGES.map((s) => [s.id, s.cands])),
    );
    const [counts, setCounts] = useState<Record<string, number>>(INITIAL_COUNTS);
    const [deptFilter, setDeptFilter] = useState<string[]>([]);

    /** Drag a candidate between stages — the board AND the stage totals follow. */
    const onCardMove = (cardId: string, from: string, to: string, toIndex: number) => {
        setBoard((prev) => {
            const next = { ...prev };
            const fromArr = [...next[from]];
            const idx = fromArr.findIndex((x) => x.id === cardId);
            if (idx < 0) {
                return prev;
            }
            const [moved] = fromArr.splice(idx, 1);
            next[from] = fromArr;
            const toArr = from === to ? fromArr : [...next[to]];
            const at = Math.max(0, Math.min(toIndex, toArr.length));
            toArr.splice(at, 0, moved);
            next[to] = toArr;
            return next;
        });
        if (from !== to) {
            setCounts((prev) => ({
                ...prev,
                [from]: Math.max(0, prev[from] - 1),
                [to]: prev[to] + 1,
            }));
        }
    };

    const rolesShown = deptFilter.length
        ? ROLES.filter((r) => deptFilter.some((d) => r.dept.toLowerCase().includes(d.toLowerCase())))
        : ROLES;

    return (
        <div className="dbroster-root">
            <Tabs activeTab={tab} onTabChange={setTab} variant="pills" className="dbroster-app">
                {/* ── Topbar — Navbar shell ───────────────────────────────── */}
                <Navbar className="dbroster-topbar">
                    <div className="dbroster-navleft">
                        <Navbar.Brand className="dbroster-brand">
                            <Link href="/inspiration/dashboards" className="dbroster-brand__link">
                                <span className="dbroster-brand__mark" aria-hidden>
                                    R
                                </span>
                                <span className="dbroster-brand__word">Roster</span>
                                <span className="dbroster-brand__sub">/ Recruiting</span>
                            </Link>
                        </Navbar.Brand>

                        <Tabs.List className="dbroster-tabs">
                            <Tabs.Tab value="pipeline">Pipeline</Tabs.Tab>
                            <Tabs.Tab value="roles">Roles</Tabs.Tab>
                            <Tabs.Tab value="calendar">Calendar</Tabs.Tab>
                        </Tabs.List>
                    </div>

                    <div className="dbroster-navright">
                        <span className="dbroster-live" aria-hidden />
                        <Badge className="dbroster-meta" variant="soft">
                            18 open roles · 42 candidates
                        </Badge>
                    </div>
                </Navbar>

                {/* ── Work area — one panel per view ──────────────────────── */}
                <Tabs.Panels className="dbroster-body">
                    {/* Pipeline: the Kanban hero */}
                    <Tabs.Panel value="pipeline" className="dbroster-panel">
                        <Kanban className="dbroster-board" onCardMove={onCardMove}>
                            {STAGES.map((s) => (
                                <Kanban.Column key={s.id} id={s.id} unstyled className="dbroster-col">
                                    <div className="dbroster-colhead">
                                        <span className="dbroster-colhead__label">{s.label}</span>
                                        <Badge
                                            className="dbroster-scount"
                                            style={{ background: RAMP_BY_ID[s.id], color: "#fff" }}
                                        >
                                            {counts[s.id]}
                                        </Badge>
                                    </div>

                                    {board[s.id].map((cd) => (
                                        <Kanban.Card key={cd.id} id={cd.id} unstyled className="dbroster-card">
                                            <div
                                                className="dbroster-card__in"
                                                style={{ "--dbroster-avbg": cd.bg } as CSSProperties}
                                            >
                                                <div className="dbroster-card__top">
                                                    <Avatar fallback={cd.init} size="sm" className="dbroster-av" />
                                                    <div className="dbroster-card__id">
                                                        <div className="dbroster-card__name">{cd.name}</div>
                                                        <div className="dbroster-card__role">{cd.role}</div>
                                                    </div>
                                                </div>
                                                <div className="dbroster-card__foot">
                                                    <div
                                                        className="dbroster-score"
                                                        role="img"
                                                        aria-label={`Fit score ${cd.score} of 5`}
                                                    >
                                                        {[0, 1, 2, 3, 4].map((i) => (
                                                            <Progress
                                                                key={i}
                                                                className="dbroster-seg"
                                                                value={i < cd.score ? 100 : 0}
                                                                max={100}
                                                                size="sm"
                                                            />
                                                        ))}
                                                    </div>
                                                    <span className="dbroster-card__ago">{cd.ago}</span>
                                                </div>
                                            </div>
                                        </Kanban.Card>
                                    ))}
                                </Kanban.Column>
                            ))}
                        </Kanban>
                    </Tabs.Panel>

                    {/* Roles: a Table with a Pillbox team filter */}
                    <Tabs.Panel value="roles" className="dbroster-panel">
                        <div className="dbroster-view">
                            <div className="dbroster-view__head">
                                <div>
                                    <Heading as="h2" size="md" weight="semibold" className="dbroster-view__h">
                                        Open roles
                                    </Heading>
                                    <Text as="p" size="sm" className="dbroster-view__sub">
                                        18 open reqs · {rolesShown.length} shown
                                    </Text>
                                </div>
                                <div className="dbroster-view__tools">
                                    <Pillbox
                                        value={deptFilter}
                                        onChange={setDeptFilter}
                                        placeholder="Filter by team…"
                                        className="dbroster-pillbox"
                                        aria-label="Filter roles by team"
                                    />
                                    <Button className="dbroster-btn" variant="ghost">
                                        + New role
                                    </Button>
                                </div>
                            </div>

                            <div className="dbroster-tablewrap">
                                <Table className="dbroster-table">
                                    <Table.Head>
                                        <Table.Column label="Role" />
                                        <Table.Column label="Team" />
                                        <Table.Column label="Stage" />
                                        <Table.Column label="Candidates" />
                                        <Table.Column label="Status" />
                                    </Table.Head>
                                    <Table.Body>
                                        {rolesShown.map((r) => (
                                            <Table.Row key={r.role}>
                                                <Table.Cell className="dbroster-td-role">{r.role}</Table.Cell>
                                                <Table.Cell>{r.dept}</Table.Cell>
                                                <Table.Cell>{r.stage}</Table.Cell>
                                                <Table.Cell className="dbroster-td-num">{r.cands}</Table.Cell>
                                                <Table.Cell>
                                                    <Badge
                                                        className="dbroster-status"
                                                        style={{
                                                            color: STATUS_COLOR[r.status],
                                                            background: `${STATUS_COLOR[r.status]}1A`,
                                                        }}
                                                    >
                                                        {r.status}
                                                    </Badge>
                                                </Table.Cell>
                                            </Table.Row>
                                        ))}
                                    </Table.Body>
                                </Table>
                            </div>
                        </div>
                    </Tabs.Panel>

                    {/* Calendar: a Timeline of this week's interviews */}
                    <Tabs.Panel value="calendar" className="dbroster-panel">
                        <div className="dbroster-view">
                            <div className="dbroster-view__head">
                                <div>
                                    <Heading as="h2" size="md" weight="semibold" className="dbroster-view__h">
                                        Upcoming interviews
                                    </Heading>
                                    <Text as="p" size="sm" className="dbroster-view__sub">
                                        Next 5 scheduled · this week
                                    </Text>
                                </div>
                            </div>
                            <div className="dbroster-timelinewrap">
                                <Timeline className="dbroster-timeline" events={EVENTS} animated={false} />
                            </div>
                        </div>
                    </Tabs.Panel>
                </Tabs.Panels>

                {/* ── Pinned KPI strip — divided borderless Cards + sparklines ─ */}
                <footer className="dbroster-kpis" aria-label="Recruiting metrics">
                    {KPIS.map((m, i) => (
                        <Fragment key={m.k}>
                            <Card variant="flat" padding="none" className="dbroster-kpi">
                                <div className="dbroster-kpi__k">{m.k}</div>
                                <div className="dbroster-kpi__valrow">
                                    <span className="dbroster-kpi__v">{m.v}</span>
                                    <Badge className="dbroster-kpi__delta" style={{ color: m.col }}>
                                        {m.delta}
                                    </Badge>
                                </div>
                                <div className="dbroster-kpi__spark">
                                    <EChart option={m.opt} style={{ height: 30, width: "100%" }} />
                                </div>
                            </Card>
                            {i < KPIS.length - 1 && (
                                <Separator orientation="vertical" className="dbroster-kpisep" />
                            )}
                        </Fragment>
                    ))}
                </footer>
            </Tabs>

            <span className="dbroster-fineprint">
                Roster — a fictional recruiting board, for demonstration · Dashboard {style.num} / {style.name} ·
                every surface is a restyled Fancy UI primitive
            </span>
        </div>
    );
}
