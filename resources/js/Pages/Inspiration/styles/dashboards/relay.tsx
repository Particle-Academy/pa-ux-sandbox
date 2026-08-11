import "./relay.css";
import { useMemo, useState } from "react";
import {
    Avatar,
    Badge,
    Button,
    Card,
    Heading,
    Kanban,
    Navbar,
    Progress,
    Separator,
    Table,
    Tabs,
    Text,
} from "@particle-academy/react-fancy";
import { type EChartsOption, EChart, registerAll } from "@particle-academy/fancy-echarts";
import { Clock } from "lucide-react";
import type { Style } from "../../types";

/**
 * Dashboards · app 12 — Relay (id "relay", light).
 *
 * A support helpdesk rendered board-first: a slim 52px Navbar top bar (gradient
 * "R" mark, a segmented Board / List / Agents Tabs switcher, an overlapping
 * online-agent Avatar stack + presence dot), a flush 5-cell KPI strip of
 * restyled Cards joined by vertical Separators, and — the whole workspace — a
 * horizontally-scrolling Kanban ticket board (New / Triage / In progress /
 * Waiting / Resolved). Every ticket card is a composed Fancy cell: a mono id, a
 * color-coded priority Badge, the subject, an assignee Avatar, the customer, and
 * an SLA Badge that turns red on breach.
 *
 * The mockup's imperative paint() colour-lookup + window.lucide dependency are
 * replaced with declarative props: priority→colour and SLA-breach→red are data,
 * the segmented switcher is controlled Tabs state, and the board is a controlled
 * Kanban (onCardMove reclassifies tickets between stages — the same surface an
 * agent bridge would drive). The switcher additionally reveals two enhancement
 * views the flat mockup only stubbed: a List Table of every open ticket and an
 * Agents view (per-rep load Progress + a resolved/opened EChart).
 *
 * Mounted by Inspiration/Show.tsx for `style.id === "relay"`. SSR-safe:
 * deterministic first paint (no Date/random), no browser APIs during render,
 * static imports; registerAll() is a pure module-eval call. Full-bleed root,
 * page-level z-index stays under the gallery frame's 30.
 */

registerAll();

/* ── Types + the mockup's renderVals() data, verbatim ───────────────────────── */

type Priority = "Urgent" | "High" | "Normal" | "Low";
type ColKey = "new" | "triage" | "progress" | "waiting" | "resolved";

type Ticket = {
    id: string;
    pri: Priority;
    subj: string;
    agent: string; // initials, or "—" when unassigned
    cust: string;
    sla: string; // "4m" / "1h" / "—"
    breach: boolean;
};

type Column = {
    key: ColKey;
    label: string;
    dot: string; // status colour
    n: number; // full backend queue depth (the badge count)
    cards: Ticket[]; // the sampled tickets shown on the board
};

const PRI: Record<Priority, { fg: string; bg: string }> = {
    Urgent: { fg: "#DC2626", bg: "#FDE7E7" },
    High: { fg: "#EA580C", bg: "#FCEBDD" },
    Normal: { fg: "#4338CA", bg: "#EEF0FB" },
    Low: { fg: "#64748B", bg: "#EEF1F5" },
};

const card = (
    id: string,
    pri: Priority,
    subj: string,
    agent: string,
    cust: string,
    sla: string,
    breach = false,
): Ticket => ({ id, pri, subj, agent, cust, sla, breach });

const INITIAL_COLUMNS: Column[] = [
    {
        key: "new",
        label: "New",
        dot: "#64748B",
        n: 8,
        cards: [
            card("#8241", "Urgent", "Can't reset my password", "AK", "M. Lee", "4m"),
            card("#8242", "Normal", "Where do I download invoices?", "—", "J. Vale", "9m"),
            card("#8243", "Low", "Feature idea: dark mode", "—", "S. Kim", "14m"),
        ],
    },
    {
        key: "triage",
        label: "Triage",
        dot: "#8B5CF6",
        n: 5,
        cards: [
            card("#8238", "High", "Billing charged twice", "JR", "P. Ortiz", "22m"),
            card("#8239", "Normal", "Export fails on large files", "AK", "D. Roy", "28m"),
        ],
    },
    {
        key: "progress",
        label: "In progress",
        dot: "#4338CA",
        n: 11,
        cards: [
            card("#8231", "Urgent", "API returning 500s", "TN", "N. Bell", "2m", true),
            card("#8233", "High", "SSO login loop", "MB", "R. Cole", "18m"),
            card("#8235", "Normal", "Team seats not updating", "JR", "L. Fox", "41m"),
        ],
    },
    {
        key: "waiting",
        label: "Waiting",
        dot: "#EA580C",
        n: 7,
        cards: [
            card("#8220", "Normal", "Awaiting customer logs", "AK", "T. Ng", "1h"),
            card("#8222", "Low", "Refund confirmation", "MB", "E. Diaz", "2h"),
        ],
    },
    {
        key: "resolved",
        label: "Resolved",
        dot: "#0EA5A0",
        n: 318,
        cards: [
            card("#8210", "Normal", "Password reset ✓", "TN", "K. Ito", "—"),
            card("#8209", "High", "Payment retry succeeded ✓", "JR", "A. Bourne", "—"),
        ],
    },
];

const STRIP = [
    { v: "142", k: "open", col: "#1C2530" },
    { v: "24", k: "unassigned", col: "#EA580C" },
    { v: "12m", k: "avg reply", col: "#0EA5A0" },
    { v: "318", k: "resolved today", col: "#1C2530" },
    { v: "6", k: "SLA breach", col: "#DC2626" },
];

const ONLINE = ["AK", "JR", "TN", "MB"];

const AGENTS = [
    { initials: "AK", name: "Amara Kane", role: "Tier 2 support", load: 78 },
    { initials: "JR", name: "Jonah Reyes", role: "Billing & payments", load: 64 },
    { initials: "TN", name: "Thea Nolan", role: "Platform & API", load: 91 },
    { initials: "MB", name: "Milo Barnes", role: "Onboarding", load: 52 },
];

/* Agents-view chart — resolved vs opened over the last 7 days (enhancement).
   Plain option literal, exactly as the EChart docs pass it (no cast needed). */
const WEEK = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const RESOLVED_WK = [58, 69, 55, 74, 80, 47, 33];
const OPENED_WK = [64, 72, 58, 81, 77, 42, 29];

const THROUGHPUT_OPTION: EChartsOption = {
    grid: { left: 6, right: 10, top: 34, bottom: 6, containLabel: true },
    tooltip: { trigger: "axis", axisPointer: { type: "shadow" } },
    legend: {
        data: ["Opened", "Resolved"],
        top: 2,
        right: 2,
        itemWidth: 10,
        itemHeight: 10,
        textStyle: { color: "#5B6674", fontSize: 11 },
    },
    xAxis: {
        type: "category",
        data: WEEK,
        axisTick: { show: false },
        axisLine: { lineStyle: { color: "#E5EAF0" } },
        axisLabel: { color: "#8895A6", fontSize: 11 },
    },
    yAxis: {
        type: "value",
        splitLine: { lineStyle: { color: "#EEF1F5" } },
        axisLabel: { color: "#8895A6", fontSize: 11 },
    },
    series: [
        {
            name: "Opened",
            type: "bar",
            data: OPENED_WK,
            barWidth: 11,
            itemStyle: { color: "#4338CA", borderRadius: [3, 3, 0, 0] },
        },
        {
            name: "Resolved",
            type: "bar",
            data: RESOLVED_WK,
            barWidth: 11,
            itemStyle: { color: "#38BDF8", borderRadius: [3, 3, 0, 0] },
        },
    ],
};

type ViewKey = "board" | "list" | "agents";

/* ── Page ───────────────────────────────────────────────────────────────────── */

export default function Relay({ style }: { style: Style }) {
    const [view, setView] = useState<ViewKey>("board");
    const [columns, setColumns] = useState<Column[]>(INITIAL_COLUMNS);

    /** Reclassify a ticket by dropping it into another stage (controlled Kanban). */
    const moveCard = (cardId: string, from: string, to: string, toIndex: number) => {
        if (from === to && toIndex < 0) return;
        setColumns((prev) => {
            const ticketId = cardId.replace(/^ticket-/, "");
            const fromCol = prev.find((c) => c.key === from);
            const ticket = fromCol?.cards.find((t) => t.id === ticketId);
            if (!ticket) return prev;
            return prev.map((c) => {
                if (c.key === from && c.key === to) {
                    const rest = c.cards.filter((t) => t.id !== ticketId);
                    const idx = Math.min(Math.max(toIndex, 0), rest.length);
                    rest.splice(idx, 0, ticket);
                    return { ...c, cards: rest };
                }
                if (c.key === from) return { ...c, cards: c.cards.filter((t) => t.id !== ticketId) };
                if (c.key === to) {
                    const next = c.cards.slice();
                    const idx = Math.min(Math.max(toIndex, 0), next.length);
                    next.splice(idx, 0, ticket);
                    return { ...c, cards: next };
                }
                return c;
            });
        });
    };

    /** Flattened ticket list for the List view. */
    const allTickets = useMemo(
        () =>
            columns.flatMap((c) =>
                c.cards.map((t) => ({ ...t, stage: c.label, stageDot: c.dot })),
            ),
        [columns],
    );

    /** Live per-agent open (non-resolved) ticket counts for the Agents view. */
    const agentOpen = useMemo(() => {
        const counts: Record<string, number> = {};
        for (const c of columns) {
            if (c.key === "resolved") continue;
            for (const t of c.cards) {
                if (t.agent !== "—") counts[t.agent] = (counts[t.agent] ?? 0) + 1;
            }
        }
        return counts;
    }, [columns]);

    return (
        <div className="dbrelay-root">
            {/* ── Slim top bar — Navbar shell, no sidebar (board-first) ───────── */}
            <Navbar className="dbrelay-topbar">
                <div className="dbrelay-topbar-left">
                    <Navbar.Brand className="dbrelay-brand">
                        <span className="dbrelay-mark" aria-hidden>
                            R
                        </span>
                        <span className="dbrelay-word">Relay</span>
                    </Navbar.Brand>

                    <Tabs
                        activeTab={view}
                        onTabChange={(v) => setView(v as ViewKey)}
                        variant="pills"
                        className="dbrelay-switch"
                    >
                        <Tabs.List className="dbrelay-switch-list">
                            <Tabs.Tab value="board">Board</Tabs.Tab>
                            <Tabs.Tab value="list">List</Tabs.Tab>
                            <Tabs.Tab value="agents">Agents</Tabs.Tab>
                        </Tabs.List>
                    </Tabs>
                </div>

                <div className="dbrelay-topbar-right">
                    <Badge className="dbrelay-sla-badge">
                        <Clock size={13} aria-hidden />
                        SLA 30m
                    </Badge>
                    <div className="dbrelay-online-stack" aria-label="Agents online">
                        {ONLINE.map((o) => (
                            <Avatar key={o} fallback={o} size="sm" className="dbrelay-av" />
                        ))}
                    </div>
                    <span className="dbrelay-online">
                        <span className="dbrelay-online-dot" aria-hidden />7 online
                    </span>
                </div>
            </Navbar>

            {/* ── Thin metric strip — 5 restyled Cards joined by Separators ───── */}
            <div className="dbrelay-strip" role="group" aria-label="Queue metrics">
                {STRIP.map((s, i) => (
                    <div key={s.k} className="dbrelay-strip-cell">
                        <Card variant="flat" padding="none" className="dbrelay-kpi">
                            <span className="dbrelay-kpi-v" style={{ color: s.col }}>
                                {s.v}
                            </span>
                            <span className="dbrelay-kpi-k">{s.k}</span>
                        </Card>
                        {i < STRIP.length - 1 && (
                            <Separator orientation="vertical" className="dbrelay-strip-sep" />
                        )}
                    </div>
                ))}
            </div>

            {/* ── Workspace — Board / List / Agents ──────────────────────────── */}
            <div className="dbrelay-body">
                {view === "board" && (
                    <Kanban className="dbrelay-board" onCardMove={moveCard}>
                        {columns.map((col) => (
                            <Kanban.Column
                                key={col.key}
                                id={col.key}
                                unstyled
                                className="dbrelay-col"
                            >
                                <div className="dbrelay-col-head">
                                    <span
                                        className="dbrelay-col-dot"
                                        style={{ background: col.dot }}
                                        aria-hidden
                                    />
                                    <span className="dbrelay-col-label">{col.label}</span>
                                    <Badge className="dbrelay-col-count">{col.n}</Badge>
                                </div>
                                {col.cards.map((t) => (
                                    <Kanban.Card
                                        key={t.id}
                                        id={`ticket-${t.id}`}
                                        unstyled
                                        className="dbrelay-ticket"
                                    >
                                        <div className="dbrelay-ticket-top">
                                            <span className="dbrelay-ticket-id">{t.id}</span>
                                            <Badge
                                                className="dbrelay-pri"
                                                style={{ color: PRI[t.pri].fg, background: PRI[t.pri].bg }}
                                            >
                                                {t.pri}
                                            </Badge>
                                        </div>
                                        <div className="dbrelay-ticket-subj">{t.subj}</div>
                                        <div className="dbrelay-ticket-foot">
                                            <Avatar
                                                fallback={t.agent === "—" ? "?" : t.agent}
                                                size="xs"
                                                className={
                                                    "dbrelay-assignee" +
                                                    (t.agent === "—" ? " is-unassigned" : "")
                                                }
                                            />
                                            <span className="dbrelay-ticket-cust">{t.cust}</span>
                                            <Badge
                                                className={"dbrelay-sla" + (t.breach ? " is-breach" : "")}
                                            >
                                                <Clock size={11} aria-hidden />
                                                {t.sla}
                                            </Badge>
                                        </div>
                                    </Kanban.Card>
                                ))}
                                {col.cards.length === 0 && (
                                    <div className="dbrelay-col-empty">Drop tickets here</div>
                                )}
                            </Kanban.Column>
                        ))}
                    </Kanban>
                )}

                {view === "list" && (
                    <div className="dbrelay-listwrap">
                        <Card variant="flat" padding="none" className="dbrelay-listcard">
                            <Table className="dbrelay-table">
                                <Table.Head>
                                    <Table.Column label="Ticket" />
                                    <Table.Column label="Priority" />
                                    <Table.Column label="Subject" />
                                    <Table.Column label="Assignee" />
                                    <Table.Column label="Stage" />
                                    <Table.Column label="SLA" />
                                </Table.Head>
                                <Table.Body>
                                    {allTickets.map((t) => (
                                        <Table.Row key={t.id} className="dbrelay-trow">
                                            <Table.Cell className="dbrelay-tid">{t.id}</Table.Cell>
                                            <Table.Cell>
                                                <Badge
                                                    className="dbrelay-pri"
                                                    style={{ color: PRI[t.pri].fg, background: PRI[t.pri].bg }}
                                                >
                                                    {t.pri}
                                                </Badge>
                                            </Table.Cell>
                                            <Table.Cell className="dbrelay-tsubj">{t.subj}</Table.Cell>
                                            <Table.Cell>
                                                <span className="dbrelay-tassignee">
                                                    <Avatar
                                                        fallback={t.agent === "—" ? "?" : t.agent}
                                                        size="xs"
                                                        className={
                                                            "dbrelay-assignee" +
                                                            (t.agent === "—" ? " is-unassigned" : "")
                                                        }
                                                    />
                                                    <span>{t.cust}</span>
                                                </span>
                                            </Table.Cell>
                                            <Table.Cell>
                                                <span className="dbrelay-tstage">
                                                    <span
                                                        className="dbrelay-col-dot"
                                                        style={{ background: t.stageDot }}
                                                        aria-hidden
                                                    />
                                                    {t.stage}
                                                </span>
                                            </Table.Cell>
                                            <Table.Cell>
                                                <span
                                                    className={
                                                        "dbrelay-tsla" + (t.breach ? " is-breach" : "")
                                                    }
                                                >
                                                    {t.sla}
                                                </span>
                                            </Table.Cell>
                                        </Table.Row>
                                    ))}
                                </Table.Body>
                            </Table>
                        </Card>
                    </div>
                )}

                {view === "agents" && (
                    <div className="dbrelay-agentswrap">
                        <div className="dbrelay-agentgrid">
                            {AGENTS.map((a) => {
                                const open = agentOpen[a.initials] ?? 0;
                                const loadColor =
                                    a.load > 85 ? "rose" : a.load > 70 ? "amber" : "indigo";
                                return (
                                    <Card
                                        key={a.initials}
                                        variant="flat"
                                        padding="none"
                                        className="dbrelay-agentcard"
                                    >
                                        <div className="dbrelay-agent-head">
                                            <Avatar
                                                fallback={a.initials}
                                                size="md"
                                                status="online"
                                                className="dbrelay-agent-av"
                                            />
                                            <div className="dbrelay-agent-meta">
                                                <span className="dbrelay-agent-name">{a.name}</span>
                                                <span className="dbrelay-agent-role">{a.role}</span>
                                            </div>
                                            <Badge className="dbrelay-agent-open">{open} open</Badge>
                                        </div>
                                        <div className="dbrelay-agent-loadrow">
                                            <span className="dbrelay-agent-loadlabel">Load</span>
                                            <Progress
                                                value={a.load}
                                                max={100}
                                                size="sm"
                                                color={loadColor as never}
                                                className="dbrelay-agent-load"
                                            />
                                            <span className="dbrelay-agent-loadpct">{a.load}%</span>
                                        </div>
                                    </Card>
                                );
                            })}
                        </div>

                        <Card variant="flat" padding="none" className="dbrelay-chartcard">
                            <div className="dbrelay-chart-head">
                                <div>
                                    <Heading as="h3" className="dbrelay-chart-title">
                                        Throughput
                                    </Heading>
                                    <Text as="p" className="dbrelay-chart-sub">
                                        Opened vs resolved · last 7 days
                                    </Text>
                                </div>
                                <Button className="dbrelay-chart-btn">Export</Button>
                            </div>
                            <EChart option={THROUGHPUT_OPTION} style={{ height: 260 }} />
                        </Card>
                    </div>
                )}
            </div>

            <span hidden aria-hidden>
                {style.num}
            </span>
        </div>
    );
}
