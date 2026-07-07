import "./seafood.css";
import { useMemo, useRef, useState, type RefObject } from "react";
import { Badge, Button, Table } from "@particle-academy/react-fancy";
import { ClipboardList, Fish, Minus, Plus } from "lucide-react";
import type { Style } from "../../types";

/**
 * Mom-n-Pops · Style 03 — Seafood (id "seafood", light).
 *
 * The truck as a New-England-dockside lobster shack on the Milwaukee
 * lakefront: cool off-white canvas, harbor navy + lobster red, an 8px CSS
 * rope-stripe bar, a glassy sticky header, and — the signature surface — a
 * live "Today's catch board": a restyled react-fancy Table reading as dock
 * inventory. The mockup painted stock status onto the DOM post-render
 * (querySelectorAll + inline styles); here the board is CONTROLLED state and
 * everything downstream — the hero peek card's pills, each menu card's
 * availability pill, the sold-out dimming — is derived per render. Nudge a
 * row's on-hand count with the − / + steppers and the menu re-derives itself.
 *
 * Mounted by Inspiration/Show.tsx for `style.id === "seafood"`. SSR-safe: no
 * browser APIs at module scope or during render (scrollIntoView lives in
 * click handlers only), no timers, no randomness — the first paint is fully
 * deterministic and matches the mockup exactly (crab Low, oysters Out).
 */

type StockStatus = "in" | "low" | "out";

type BoardRow = {
    /** Stable handle — rows are addressed by key, never by index. */
    key: string;
    icon: string;
    name: string;
    cat: string;
    source: string;
    /** Display price string, per the mockup ("$18.00", "$2.50 ea"). */
    price: string;
    unit: "lb" | "ea";
    qty: number;
    /** At or below this quantity the row reads "Low" (0 is always out). */
    lowAt: number;
    /** How much one − / + nudge sells or restocks. */
    step: number;
    /** Restock ceiling — the truck only holds so much. */
    cap: number;
};

type Dish = {
    icon: string;
    name: string;
    price: string;
    short: string;
    /** Which catch-board row this dish draws from — availability is derived. */
    supply: string;
};

/** What came off the truck at 05:40 — the initial dock manifest. */
const DOCK_MANIFEST: BoardRow[] = [
    { key: "lobster", icon: "🦞", name: "Maine Lobster", cat: "Cold-water · whole", source: "Portland, ME", price: "$18.00", unit: "lb", qty: 22, lowAt: 8, step: 2, cap: 44 },
    { key: "shrimp", icon: "🦐", name: "Gulf Shrimp", cat: "Wild · 16/20", source: "Galveston, TX", price: "$9.50", unit: "lb", qty: 14, lowAt: 8, step: 2, cap: 30 },
    { key: "crab", icon: "🦀", name: "Jonah Crab", cat: "Claw & body", source: "Cape Cod, MA", price: "$14.00", unit: "lb", qty: 6, lowAt: 8, step: 2, cap: 20 },
    { key: "clams", icon: "🥣", name: "Chowder Clams", cat: "For the pot", source: "Ipswich, MA", price: "$6.00", unit: "lb", qty: 30, lowAt: 10, step: 5, cap: 60 },
    { key: "cod", icon: "🐟", name: "Atlantic Cod", cat: "Fry-cut fillet", source: "Boston, MA", price: "$11.00", unit: "lb", qty: 18, lowAt: 6, step: 2, cap: 36 },
    { key: "oysters", icon: "🦪", name: "Blue Point Oysters", cat: "Half shell", source: "Long Island, NY", price: "$2.50 ea", unit: "ea", qty: 0, lowAt: 12, step: 12, cap: 96 },
];

/** The menu — every dish points at the board row it draws from. */
const MENU: Dish[] = [
    { icon: "🦞", name: "Maine Lobster Roll", price: "$17", short: "Cold, lemon-mayo, split-top bun.", supply: "lobster" },
    { icon: "🧈", name: "Connecticut Roll", price: "$17", short: "Warm lobster, drawn butter.", supply: "lobster" },
    { icon: "🦐", name: "Shrimp Roll", price: "$12", short: "Poached shrimp, herb mayo, chives.", supply: "shrimp" },
    { icon: "🦀", name: "Crab Roll", price: "$14", short: "Jonah crab, lemon, tarragon.", supply: "crab" },
    { icon: "🥣", name: "Clam Chowder", price: "$6", short: "New England style, oyster crackers.", supply: "clams" },
    { icon: "🦪", name: "Raw Bar", price: "MP", short: "Blue Point oysters on the half shell.", supply: "oysters" },
];

/** The four headliners the hero peek card tracks. */
const PEEK_KEYS = ["lobster", "shrimp", "crab", "oysters"];

const STATS = [
    { v: "2×/wk", k: "lobster flown in" },
    { v: "2026", k: "est. Milwaukee" },
    { v: "both", k: "mayo & butter" },
    { v: "AM", k: "chowder made daily" },
];

const SCHEDULE = [
    { day: "Tuesday", place: "Lakeshore State Park", hours: "11–8" },
    { day: "Wednesday", place: "Veterans Park", hours: "11–8" },
    { day: "Thursday", place: "Third Ward Riverwalk", hours: "11–8" },
    { day: "Friday", place: "Discovery World lot", hours: "11–9" },
    { day: "Saturday", place: "South Shore Farmers Market", hours: "8–2" },
    { day: "Sunday", place: "Bradford Beach", hours: "11–7" },
];

const BOARD_LABEL: Record<StockStatus, string> = { in: "In stock", low: "Low", out: "Sold out" };
const PEEK_LABEL: Record<StockStatus, string> = { in: "In", low: "Low", out: "Out" };

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

const statusOf = (row: BoardRow): StockStatus =>
    row.qty <= 0 ? "out" : row.qty <= row.lowAt ? "low" : "in";

/** "22 lb" / "12 ea" / bare "0" when the crate is empty, per the mockup. */
const fmtQty = (row: BoardRow) => (row.qty === 0 ? "0" : `${row.qty} ${row.unit}`);

export default function Seafood({ style }: { style: Style }) {
    const [board, setBoard] = useState<BoardRow[]>(DOCK_MANIFEST);
    const [touched, setTouched] = useState(false);

    const menuRef = useRef<HTMLElement | null>(null);
    const catchRef = useRef<HTMLElement | null>(null);
    const findRef = useRef<HTMLElement | null>(null);

    /** in / low / out per supply key — the single derivation everything reads. */
    const stock = useMemo(() => {
        const map: Record<string, StockStatus> = {};
        for (const row of board) map[row.key] = statusOf(row);
        return map;
    }, [board]);

    const peekRows = useMemo(
        () =>
            PEEK_KEYS.map((key) => board.find((row) => row.key === key)).filter(
                (row): row is BoardRow => row !== undefined,
            ),
        [board],
    );

    const adjust = (key: string, delta: number) => {
        setBoard((rows) =>
            rows.map((row) => (row.key === key ? { ...row, qty: clamp(row.qty + delta, 0, row.cap) } : row)),
        );
        setTouched(true);
    };

    const resetBoard = () => {
        setBoard(DOCK_MANIFEST);
        setTouched(false);
    };

    /** The mockup's window.scrollBy anchor jumps, done the React way: refs +
     *  scrollIntoView (a click handler, so SSR never sees it) with the sticky
     *  offsets handled by scroll-margin-top in the CSS. */
    const jumpTo = (ref: RefObject<HTMLElement | null>) => () => {
        ref.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    };

    const availabilityOf = (dish: Dish): { label: string; out: boolean } => {
        const s = stock[dish.supply] ?? "in";
        if (s === "out") return { label: "Sold out today", out: true };
        if (s === "low") return { label: "Only a few left", out: false };
        return { label: "Available", out: false };
    };

    return (
        <div className="mpseafood-root">
            {/* The nautical rope-stripe bar — the page's strongest branding move,
                pure CSS (repeating-linear-gradient of navy/red dashes). */}
            <div className="mpseafood-rope" aria-hidden />

            {/* ── Sticky glass header ─────────────────────────────────────── */}
            <header className="mpseafood-header">
                <div className="mpseafood-header-shell">
                    <span className="mpseafood-wordmark">
                        <span className="mpseafood-wordmark-name">Mom-n-Pops</span>
                        <span className="mpseafood-wordmark-tag">Seafood Shack</span>
                    </span>
                    <nav className="mpseafood-nav" aria-label="Site">
                        <button type="button" className="mpseafood-nav-link" onClick={jumpTo(menuRef)}>
                            Menu
                        </button>
                        <button type="button" className="mpseafood-nav-link" onClick={jumpTo(catchRef)}>
                            Today's catch
                        </button>
                        <button type="button" className="mpseafood-nav-link" onClick={jumpTo(findRef)}>
                            Find us
                        </button>
                        <Button
                            size="sm"
                            className="mpseafood-btn mpseafood-btn--navy"
                            onClick={jumpTo(findRef)}
                        >
                            Find the shack
                        </Button>
                    </nav>
                </div>
            </header>

            <div className="mpseafood-shell">
                {/* ── Hero + catch peek card ──────────────────────────────── */}
                <section className="mpseafood-hero" aria-label="Welcome">
                    <div>
                        <div className="mpseafood-eyebrow">⚓ Rolls &amp; chowder · Milwaukee · Est. 2026</div>
                        <h1 className="mpseafood-h1">A little taste of the coast, on the lakefront.</h1>
                        <p className="mpseafood-lede">
                            Cold-water lobster, split-top buns griddled in butter, chowder made every morning. What
                            we serve depends on what came off the truck — see today's catch below.
                        </p>
                        <div className="mpseafood-hero-ctas">
                            <Button className="mpseafood-btn mpseafood-btn--red" onClick={jumpTo(menuRef)}>
                                See the menu
                            </Button>
                            <Button className="mpseafood-btn mpseafood-btn--shell" onClick={jumpTo(catchRef)}>
                                Today's catch
                            </Button>
                        </div>
                    </div>

                    <aside className="mpseafood-peek" aria-label="Off the truck this morning">
                        <div className="mpseafood-peek-head">
                            <Fish size={16} aria-hidden />
                            <span className="mpseafood-peek-title">Off the truck this morning</span>
                            <span className="mpseafood-peek-time">05:40</span>
                        </div>
                        <div className="mpseafood-peek-body">
                            {peekRows.map((row) => {
                                const s = statusOf(row);
                                return (
                                    <div key={row.key} className="mpseafood-peek-row" data-peek={row.key}>
                                        <span className="mpseafood-peek-emoji" aria-hidden>
                                            {row.icon}
                                        </span>
                                        <span className="mpseafood-peek-name">{row.name}</span>
                                        <Badge size="sm" className={`mpseafood-pk mpseafood-pk--${s}`}>
                                            {PEEK_LABEL[s]}
                                        </Badge>
                                    </div>
                                );
                            })}
                        </div>
                    </aside>
                </section>

                {/* ── Today's menu — availability derived from the board ──── */}
                <section ref={menuRef} className="mpseafood-menu" id="menu" aria-label="Today's menu">
                    <div className="mpseafood-menu-head">
                        <h2 className="mpseafood-menu-title">Today's menu</h2>
                        <span className="mpseafood-menu-hint">sold-out items dim automatically</span>
                    </div>
                    <div className="mpseafood-menu-grid">
                        {MENU.map((dish) => {
                            const avail = availabilityOf(dish);
                            return (
                                <article
                                    key={dish.name}
                                    className={`mpseafood-dish${avail.out ? " mpseafood-dish--out" : ""}`}
                                    data-dish={dish.supply}
                                >
                                    <div className="mpseafood-dish-top">
                                        <span className="mpseafood-dish-tile" aria-hidden>
                                            {dish.icon}
                                        </span>
                                        <span className="mpseafood-dish-price">{dish.price}</span>
                                    </div>
                                    <div className="mpseafood-dish-name">{dish.name}</div>
                                    <p className="mpseafood-dish-short">{dish.short}</p>
                                    <Badge
                                        size="sm"
                                        className={`mpseafood-avail mpseafood-avail--${avail.out ? "out" : "ok"}`}
                                    >
                                        {avail.label}
                                    </Badge>
                                </article>
                            );
                        })}
                    </div>
                </section>

                {/* ── The catch board — the page's live surface ───────────── */}
                <section
                    ref={catchRef}
                    className="mpseafood-catch"
                    id="catch"
                    aria-label="Today's catch board"
                    data-surface="catch-board"
                >
                    <div className="mpseafood-board">
                        <div className="mpseafood-board-head">
                            <span className="mpseafood-board-icon" aria-hidden>
                                <ClipboardList size={18} />
                            </span>
                            <div>
                                <div className="mpseafood-board-title">Today's catch board</div>
                                <div className="mpseafood-board-sub">
                                    Live dock inventory — this is what the menu draws from.
                                </div>
                            </div>
                            <div className="mpseafood-board-meta">
                                {touched && (
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        icon="rotate-ccw"
                                        className="mpseafood-btn mpseafood-btn--reset"
                                        onClick={resetBoard}
                                    >
                                        Reset the morning
                                    </Button>
                                )}
                                <span className="mpseafood-board-updated">
                                    {touched ? "updated just now" : "updated 2 min ago"}
                                </span>
                            </div>
                        </div>

                        <div className="mpseafood-board-scroll">
                            <Table className="mpseafood-table">
                                <Table.Head>
                                    <Table.Column label="" className="mpseafood-col-icon" />
                                    <Table.Column label="Item" className="mpseafood-col-item" />
                                    <Table.Column label="Source" className="mpseafood-col-source" />
                                    <Table.Column label="Price / lb" className="mpseafood-col-price" />
                                    <Table.Column label="On hand" className="mpseafood-col-qty" />
                                    <Table.Column label="Status" className="mpseafood-col-status" />
                                </Table.Head>
                                <Table.Body>
                                    {board.map((row) => {
                                        const s = statusOf(row);
                                        return (
                                            <Table.Row key={row.key} className="mpseafood-row">
                                                <Table.Cell className="mpseafood-cell-icon">
                                                    <span aria-hidden>{row.icon}</span>
                                                </Table.Cell>
                                                <Table.Cell className="mpseafood-cell-item">
                                                    <span className="mpseafood-item-name">{row.name}</span>
                                                    <span className="mpseafood-item-cat">{row.cat}</span>
                                                </Table.Cell>
                                                <Table.Cell className="mpseafood-cell-source">
                                                    {row.source}
                                                </Table.Cell>
                                                <Table.Cell className="mpseafood-cell-price">
                                                    {row.price}
                                                </Table.Cell>
                                                <Table.Cell className="mpseafood-cell-qty">
                                                    <span className="mpseafood-qty" data-stock={row.key}>
                                                        <button
                                                            type="button"
                                                            className="mpseafood-step"
                                                            onClick={() => adjust(row.key, -row.step)}
                                                            disabled={row.qty <= 0}
                                                            aria-label={`Sell ${row.step} ${row.unit} of ${row.name}`}
                                                        >
                                                            <Minus size={11} />
                                                        </button>
                                                        <span className="mpseafood-qty-num">{fmtQty(row)}</span>
                                                        <button
                                                            type="button"
                                                            className="mpseafood-step"
                                                            onClick={() => adjust(row.key, row.step)}
                                                            disabled={row.qty >= row.cap}
                                                            aria-label={`Restock ${row.step} ${row.unit} of ${row.name}`}
                                                        >
                                                            <Plus size={11} />
                                                        </button>
                                                    </span>
                                                </Table.Cell>
                                                <Table.Cell className="mpseafood-cell-status">
                                                    <Badge size="sm" className={`mpseafood-bpill mpseafood-bpill--${s}`}>
                                                        <span className="mpseafood-bdot" aria-hidden />
                                                        {BOARD_LABEL[s]}
                                                    </Badge>
                                                </Table.Cell>
                                            </Table.Row>
                                        );
                                    })}
                                </Table.Body>
                            </Table>
                        </div>

                        <div className="mpseafood-board-foot">
                            Live demo — nudge − / + on a row: the peek card and the menu above dim, flip their
                            pills, and recover as stock moves.
                        </div>
                    </div>
                </section>

                {/* ── Our story + stat brag-wall ──────────────────────────── */}
                <section className="mpseafood-story" aria-label="Our story">
                    <div>
                        <div className="mpseafood-eyebrow mpseafood-eyebrow--tight">Our story</div>
                        <h2 className="mpseafood-story-h2">
                            Rosa's from Maine. Sal's from Milwaukee. The truck is the compromise.
                        </h2>
                        <p className="mpseafood-story-p">
                            They fly the lobster in twice a week, split the buns by hand, and griddle everything to
                            order. Rosa swears by mayo; Sal's a butter man — so we serve it both ways. Since 2026,
                            feeding the lakefront one roll at a time.
                        </p>
                    </div>
                    <div className="mpseafood-stats">
                        {STATS.map((stat) => (
                            <div key={stat.k} className="mpseafood-stat">
                                <div className="mpseafood-stat-v">{stat.v}</div>
                                <div className="mpseafood-stat-k">{stat.k}</div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* ── Where we're docked — the tide-table schedule ────────── */}
                <section ref={findRef} className="mpseafood-find" id="find-us" aria-label="Where we're docked">
                    <h2 className="mpseafood-find-title">Where we're docked</h2>
                    <div className="mpseafood-sched">
                        {SCHEDULE.map((s) => (
                            <div key={s.day} className="mpseafood-sched-row">
                                <span className="mpseafood-sched-day">{s.day}</span>
                                <span className="mpseafood-sched-place">{s.place}</span>
                                <span className="mpseafood-sched-hours">{s.hours}</span>
                            </div>
                        ))}
                    </div>
                </section>
            </div>

            {/* ── Footer ──────────────────────────────────────────────────── */}
            <footer className="mpseafood-footer">
                <div className="mpseafood-footer-shell">
                    <span className="mpseafood-footer-brand">Mom-n-Pops Seafood Shack</span>
                    <span>
                        hello<span>@</span>momnpops.truck · @momnpops.mke
                    </span>
                    <span>© 2026 · Rosa &amp; Sal · Milwaukee</span>
                </div>
                <div className="mpseafood-demo-note">
                    Mom-n-Pops is a fictional Milwaukee food truck, for demonstration · Style {style.num} /{" "}
                    {style.name} · the catch board is the live surface
                </div>
            </footer>
        </div>
    );
}
