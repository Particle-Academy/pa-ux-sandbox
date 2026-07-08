import "./meridian.css";
import { Link } from "@inertiajs/react";
import { useMemo, useState, type CSSProperties } from "react";
import {
    Avatar,
    Badge,
    Button,
    Card,
    Heading,
    Navbar,
    Table,
    Tabs,
    Text,
    Tooltip,
} from "@particle-academy/react-fancy";
import { EChart, registerAll } from "@particle-academy/fancy-echarts";
import { CreditCard, PiggyBank, Plus, TrendingUp, Wifi } from "lucide-react";
import type { Style } from "../../types";

/**
 * Dashboards · Style 17 — Meridian (Personal banking, dark).
 *
 * A consumer money app as a centered single-column dashboard (max-width 1080px)
 * on a near-black navy page (#0A0F1C): a slim top bar (sky-gradient "M" wordmark
 * + inline nav + circular "DA" avatar), a 1fr:1fr row pairing a gradient debit-
 * card hero with a stack of three account tiles, a 1.5fr:1fr row pairing a
 * spending cash-flow chart with a "Send again" quick-transfer panel, and a
 * full-width recent-transactions list. Retail-friendly density — 16px gaps, big
 * rounded cards, oversized mono balances, one sky + one pink accent.
 *
 * Built from restyled Fancy primitives: Navbar (brand + nav), Avatar (DA
 * monogram + payee bubbles), Tabs (the controlled Accounts/Payments/Cards/Invest
 * nav), Card (the debit-card hero, the account tiles, and every panel), Table
 * (recent transactions), Badge (account-icon chips + txn category tags), Button
 * (the dashed "New transfer" add tile), lucide Icon (contactless / account
 * glyphs), Heading/Text/Tooltip. The only real chart — Spending — is a
 * fancy-echarts <EChart> grouped bar (two series, sky "in" / pink "out", over
 * eight week categories), replacing the mockup's imperative data-h bar heights.
 *
 * Mounted by Inspiration/Show.tsx for `style.id === "meridian"`. SSR-safe: no
 * browser APIs during render; all data is static deterministic literals (no
 * Math.random/Date.now — "this month" / "Today" are copy, not a wall clock);
 * <EChart> mounts a container and inits echarts in an effect. Full-bleed under
 * the neutral GalleryFrame (every z-index < 30). Genuine controlled state: the
 * nav Tabs, the in/out spending legend toggle, a selected quick-transfer payee,
 * and a spotlighted transaction row.
 */

const MONO = "Geist Mono, ui-monospace, SFMono-Regular, monospace";

const IN_COLOR = "#38BDF8";
const OUT_COLOR = "#F472B6";
const CREDIT = "#34D399";
const DEBIT = "#F472B6";

/* ── Mock data (the mockup's DCLogic.renderVals(), verbatim) ────────────── */

type Account = {
    slug: string;
    name: string;
    sub: string;
    bal: string;
    icon: typeof PiggyBank;
};

const ACCOUNTS: Account[] = [
    { slug: "savings", name: "Savings", sub: "2.4% APY", bal: "$34,200", icon: PiggyBank },
    { slug: "credit", name: "Credit card", sub: "Due Jul 28", bal: "−$842", icon: CreditCard },
    { slug: "invest", name: "Investments", sub: "▲ 1.8% today", bal: "$58,910", icon: TrendingUp },
];

/** Eight weeks of cash flow, values normalized 0-100 as in the mockup. */
const WEEKS = ["Wk1", "Wk2", "Wk3", "Wk4", "Wk5", "Wk6", "Wk7", "Wk8"];
const FLOW_IN = [60, 40, 100, 36, 80, 44, 90, 50];
const FLOW_OUT = [44, 70, 52, 60, 48, 88, 40, 64];

type Payee = { slug: string; init: string; name: string; bg: string };

const PAYEES: Payee[] = [
    { slug: "kai", init: "KL", name: "Kai L.", bg: "#6366F1" },
    { slug: "rosa", init: "RS", name: "Rosa S.", bg: "#EC4899" },
    { slug: "theo", init: "TN", name: "Theo N.", bg: "#0891B2" },
    { slug: "mia", init: "MB", name: "Mia B.", bg: "#F59E0B" },
];

type Txn = {
    id: string;
    icon: string;
    name: string;
    cat: string;
    when: string;
    amt: string;
    credit: boolean;
    bal: string;
};

const TXNS: Txn[] = [
    { id: "wf", icon: "🛒", name: "Whole Foods", cat: "Groceries", when: "Today", amt: "−$84.20", credit: false, bal: "$12,480" },
    { id: "pay", icon: "💰", name: "Payroll — Acme", cat: "Income", when: "Jul 5", amt: "+$3,200", credit: true, bal: "$12,564" },
    { id: "we", icon: "⚡", name: "WE Energies", cat: "Utilities", when: "Jul 4", amt: "−$112.40", credit: false, bal: "$9,364" },
    { id: "col", icon: "☕", name: "Colectivo", cat: "Dining", when: "Jul 4", amt: "−$5.75", credit: false, bal: "$9,476" },
    { id: "tr", icon: "🏦", name: "Transfer → Savings", cat: "Transfer", when: "Jul 1", amt: "−$500", credit: false, bal: "$9,482" },
    { id: "apl", icon: "📱", name: "Apple", cat: "Subscriptions", when: "Jul 1", amt: "−$9.99", credit: false, bal: "$9,982" },
];

const NAV = [
    { value: "accounts", label: "Accounts" },
    { value: "payments", label: "Payments" },
    { value: "cards", label: "Cards" },
    { value: "invest", label: "Invest" },
];

/* Register every ECharts module once for this bundle entry. */
registerAll();

/* ── Spending option builder — grouped bar, driven by legend visibility ──── */
function spendingOption(showIn: boolean, showOut: boolean) {
    const series: Record<string, unknown>[] = [];
    if (showIn) {
        series.push({
            name: "in",
            type: "bar",
            data: FLOW_IN,
            barWidth: 9,
            barGap: "35%",
            itemStyle: { color: IN_COLOR, borderRadius: [3, 3, 0, 0] },
            animationDelay: (i: number) => i * 45,
        });
    }
    if (showOut) {
        series.push({
            name: "out",
            type: "bar",
            data: FLOW_OUT,
            barWidth: 9,
            barGap: "35%",
            itemStyle: { color: OUT_COLOR, borderRadius: [3, 3, 0, 0] },
            animationDelay: (i: number) => i * 45 + 22,
        });
    }
    return {
        grid: { left: 2, right: 2, top: 12, bottom: 22 },
        animationDuration: 720,
        animationEasing: "cubicOut",
        tooltip: {
            trigger: "axis",
            backgroundColor: "#0B1220",
            borderColor: "#1E2A3E",
            borderWidth: 1,
            padding: [6, 10],
            textStyle: { color: "#DCE3EF", fontSize: 11 },
            axisPointer: { type: "shadow", shadowStyle: { color: "rgba(56,189,248,0.05)" } },
        },
        xAxis: {
            type: "category",
            data: WEEKS,
            axisTick: { show: false },
            axisLine: { lineStyle: { color: "#1E2A3E" } },
            axisLabel: {
                interval: 0,
                color: "#4E5B70",
                fontFamily: MONO,
                fontSize: 10,
                formatter: (v: string) => (v === "Wk1" || v === "Wk4" || v === "Wk8" ? v : ""),
            },
        },
        yAxis: { type: "value", show: false, max: 110 },
        series,
    };
}

/* ── Page ───────────────────────────────────────────────────────────────── */

export default function Meridian({ style }: { style: Style }) {
    const [nav, setNav] = useState("accounts");
    const [showIn, setShowIn] = useState(true);
    const [showOut, setShowOut] = useState(true);
    const [payee, setPayee] = useState<string | null>(null);
    const [openTxn, setOpenTxn] = useState<string | null>(null);

    const chartOption = useMemo(() => spendingOption(showIn, showOut), [showIn, showOut]);

    /** Toggle a spending series, but never let both go dark. */
    const toggleIn = () => setShowIn((v) => (v && !showOut ? v : !v));
    const toggleOut = () => setShowOut((v) => (v && !showIn ? v : !v));

    return (
        <div className="dbmeridian-root">
            <div className="dbmeridian-shell">
                {/* ── Top bar (restyled Navbar) ───────────────────────────── */}
                <Navbar className="dbmeridian-nav">
                    <Navbar.Brand className="dbmeridian-brandwrap">
                        <Link href="/inspiration/dashboards" className="dbmeridian-brand">
                            <span className="dbmeridian-mark" aria-hidden>
                                M
                            </span>
                            <span className="dbmeridian-brand__name">Meridian</span>
                        </Link>
                    </Navbar.Brand>
                    <Navbar.Items className="dbmeridian-navitems">
                        <Tabs activeTab={nav} onTabChange={setNav} className="dbmeridian-navtabs">
                            <Tabs.List className="dbmeridian-navtabs__list">
                                {NAV.map((n) => (
                                    <Tabs.Tab key={n.value} value={n.value}>
                                        {n.label}
                                    </Tabs.Tab>
                                ))}
                            </Tabs.List>
                        </Tabs>
                        <Avatar fallback="DA" size="sm" className="dbmeridian-avatar" />
                    </Navbar.Items>
                </Navbar>

                {/* ── Row 1 — debit-card hero + other accounts ─────────────── */}
                <div className="dbmeridian-grid dbmeridian-grid--top">
                    {/* Debit card hero (restyled gradient Card) */}
                    <Card variant="outlined" padding="none" className="dbmeridian-hero">
                        <Card.Body className="dbmeridian-hero__body">
                            <div className="dbmeridian-hero__top">
                                <div>
                                    <div className="dbmeridian-hero__label">Everyday checking</div>
                                    <div className="dbmeridian-hero__bal">$12,480.55</div>
                                </div>
                                <Tooltip content="Contactless enabled">
                                    <span className="dbmeridian-hero__wifi" aria-label="Contactless">
                                        <Wifi size={22} />
                                    </span>
                                </Tooltip>
                            </div>
                            <div className="dbmeridian-hero__foot">
                                <div className="dbmeridian-hero__pan">{"•••• •••• •••• 4019"}</div>
                                <div className="dbmeridian-hero__meta">
                                    <span>DANA ARROYO</span>
                                    <span>08/29</span>
                                </div>
                            </div>
                        </Card.Body>
                    </Card>

                    {/* Other accounts — a stack of restyled Card tiles */}
                    <div className="dbmeridian-accts">
                        {ACCOUNTS.map((a) => {
                            const Glyph = a.icon;
                            return (
                                <Card key={a.slug} variant="outlined" padding="none" className="dbmeridian-acct">
                                    <Card.Body className="dbmeridian-acct__body">
                                        <Badge className={`dbmeridian-acct__chip dbmeridian-acct__chip--${a.slug}`}>
                                            <Glyph size={18} aria-hidden />
                                        </Badge>
                                        <div className="dbmeridian-acct__meta">
                                            <span className="dbmeridian-acct__name">{a.name}</span>
                                            <span className="dbmeridian-acct__sub">{a.sub}</span>
                                        </div>
                                        <span className="dbmeridian-acct__bal">{a.bal}</span>
                                    </Card.Body>
                                </Card>
                            );
                        })}
                    </div>
                </div>

                {/* ── Row 2 — spending + send again ────────────────────────── */}
                <div className="dbmeridian-grid dbmeridian-grid--mid">
                    {/* Spending cash flow */}
                    <Card variant="outlined" padding="none" className="dbmeridian-panel dbmeridian-spending">
                        <Card.Header className="dbmeridian-panel__head">
                            <div>
                                <Heading as="h2" size="sm" weight="semibold" className="dbmeridian-panel__title">
                                    Spending
                                </Heading>
                                <span className="dbmeridian-panel__sub">$2,840 this month</span>
                            </div>
                            <div className="dbmeridian-legend" role="group" aria-label="Toggle cash flow series">
                                <button
                                    type="button"
                                    className={`dbmeridian-legend__chip dbmeridian-legend__chip--in${showIn ? " is-on" : ""}`}
                                    onClick={toggleIn}
                                    aria-pressed={showIn}
                                >
                                    <span className="dbmeridian-legend__dot" aria-hidden />
                                    in
                                </button>
                                <button
                                    type="button"
                                    className={`dbmeridian-legend__chip dbmeridian-legend__chip--out${showOut ? " is-on" : ""}`}
                                    onClick={toggleOut}
                                    aria-pressed={showOut}
                                >
                                    <span className="dbmeridian-legend__dot" aria-hidden />
                                    out
                                </button>
                            </div>
                        </Card.Header>
                        <Card.Body className="dbmeridian-spending__body">
                            <EChart option={chartOption} style={{ width: "100%", height: 150 }} />
                        </Card.Body>
                    </Card>

                    {/* Send again (quick transfer) */}
                    <Card variant="outlined" padding="none" className="dbmeridian-panel dbmeridian-send">
                        <Card.Header className="dbmeridian-panel__head dbmeridian-send__head">
                            <Heading as="h2" size="sm" weight="semibold" className="dbmeridian-panel__title">
                                Send again
                            </Heading>
                        </Card.Header>
                        <Card.Body className="dbmeridian-send__body">
                            <div className="dbmeridian-payees">
                                {PAYEES.map((p) => (
                                    <button
                                        key={p.slug}
                                        type="button"
                                        className={`dbmeridian-payee${payee === p.slug ? " is-selected" : ""}`}
                                        style={{ "--pay": p.bg } as CSSProperties}
                                        onClick={() => setPayee((c) => (c === p.slug ? null : p.slug))}
                                        aria-pressed={payee === p.slug}
                                    >
                                        <Avatar fallback={p.init} size="md" className="dbmeridian-payee__av" />
                                        <span className="dbmeridian-payee__name">{p.name}</span>
                                    </button>
                                ))}
                            </div>
                            <Button variant="ghost" className="dbmeridian-add">
                                <Plus size={16} aria-hidden />
                                New transfer
                            </Button>
                        </Card.Body>
                    </Card>
                </div>

                {/* ── Row 3 — recent transactions (Card + Table) ───────────── */}
                <Card variant="outlined" padding="none" className="dbmeridian-panel dbmeridian-txns">
                    <Card.Header className="dbmeridian-panel__head dbmeridian-txns__head">
                        <Heading as="h2" size="sm" weight="semibold" className="dbmeridian-panel__title">
                            Recent transactions
                        </Heading>
                        <Button variant="ghost" size="sm" className="dbmeridian-seeall">
                            See all
                        </Button>
                    </Card.Header>
                    <Card.Body className="dbmeridian-txns__body">
                        <Table className="dbmeridian-txn-table">
                            <Table.Head>
                                <Table.Column label="" />
                                <Table.Column label="Merchant" />
                                <Table.Column label="Amount" />
                                <Table.Column label="Balance" />
                            </Table.Head>
                            <Table.Body>
                                {TXNS.map((t) => (
                                    <Table.Row
                                        key={t.id}
                                        className={`dbmeridian-txn${openTxn === t.id ? " is-open" : ""}`}
                                        onClick={() => setOpenTxn((c) => (c === t.id ? null : t.id))}
                                    >
                                        <Table.Cell className="dbmeridian-txn__iconcell">
                                            <span className="dbmeridian-txn__icon" aria-hidden>
                                                {t.icon}
                                            </span>
                                        </Table.Cell>
                                        <Table.Cell className="dbmeridian-txn__namecell">
                                            <span className="dbmeridian-txn__name">{t.name}</span>
                                            <span className="dbmeridian-txn__sub">
                                                <Badge className="dbmeridian-txn__cat">{t.cat}</Badge>
                                                <span className="dbmeridian-txn__when"> {"·"} {t.when}</span>
                                            </span>
                                        </Table.Cell>
                                        <Table.Cell
                                            className={`dbmeridian-txn__amt dbmeridian-txn__amt--${t.credit ? "credit" : "debit"}`}
                                        >
                                            {t.amt}
                                        </Table.Cell>
                                        <Table.Cell className="dbmeridian-txn__bal">{t.bal}</Table.Cell>
                                    </Table.Row>
                                ))}
                            </Table.Body>
                        </Table>
                    </Card.Body>
                </Card>

                {/* ── Colophon ─────────────────────────────────────────────── */}
                <footer className="dbmeridian-foot">
                    <Text as="span" size="xs" className="dbmeridian-foot__note">
                        Meridian — a fictional banking dashboard, for demonstration · App {style.num} / {style.name} ·
                        every surface is a restyled Fancy UI primitive
                    </Text>
                    <Link href="/inspiration/dashboards" className="dbmeridian-foot__back">
                        Back to the gallery
                    </Link>
                </footer>
            </div>
        </div>
    );
}
