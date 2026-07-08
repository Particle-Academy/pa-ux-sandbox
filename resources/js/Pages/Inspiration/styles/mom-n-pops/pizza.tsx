import "./pizza.css";
import { Link } from "@inertiajs/react";
import { useEffect, useMemo, useRef, useState, type RefObject } from "react";
import { Badge, Button, Callout, Card, Kanban, Table } from "@particle-academy/react-fancy";
import { ArrowLeft, CircleCheck, Radio } from "lucide-react";
import type { Style } from "../../types";

/**
 * Mom-n-Pops style 04 — Pizzeria (id "pizza", light).
 *
 * The truck as a neighborhood trattoria: warm cream paper, tomato red +
 * basil green, italic Georgia, a CSS checked-awning stripe — and one live
 * data surface baked into the storefront: a read-only order-tracker kanban
 * ("In line / In the oven / Out the window") built on the react-fancy
 * Kanban primitive, driven by cart + stage state, that physically moves
 * your ticket down the line on timers after you place an order.
 *
 * Restyled Fancy primitives: Kanban (the order tracker), Button (hero CTAs,
 * "+ Add to order", "Place order"), Badge (menu tag pills + the YOU chip),
 * Callout (the "order up" banner), Card (the hero live-oven peek shell, the
 * six pie cards, the four story stat tiles) and Table (the peek's live-queue
 * rows and the "Dove siamo" schedule ledger). The only hand-rolled surfaces
 * are pure decoration — the CSS awning stripe, the sticky blurred header,
 * and the pulsing live dot.
 *
 * Mounted by Inspiration/Show.tsx for `style.id === "pizza"`. SSR-safe:
 * deterministic first paint (no Date/random), timers armed only in a click
 * handler and cleared on unmount, scrolling via refs in handlers only.
 */

type Pie = {
    slug: string;
    icon: string;
    name: string;
    price: number; // dollars
    short: string;
    tag: string;
    tagBg: string;
};

type Ticket = {
    num: string;
    pie: string;
    meta: string;
    mine: boolean;
};

type ColKey = "queue" | "oven" | "up";

const MENU: Pie[] = [
    { slug: "margherita", icon: "🍅", name: "Margherita", price: 13, short: "San Marzano, fior di latte, basil.", tag: "The original", tagBg: "#2E7D32" },
    { slug: "pepperoni", icon: "🍕", name: "Pepperoni", price: 15, short: "Cup-and-char pepperoni, chili honey.", tag: "Most ordered", tagBg: "#B71C1C" },
    { slug: "diavola", icon: "🌶️", name: "Diavola", price: 16, short: "Spicy salami, Calabrian chili, honey.", tag: "Spicy", tagBg: "#B3352E" },
    { slug: "marinara", icon: "🧄", name: "Marinara", price: 11, short: "Tomato, garlic, oregano — no cheese.", tag: "Vegan", tagBg: "#3F7D3A" },
    { slug: "formaggi", icon: "🧀", name: "Quattro Formaggi", price: 16, short: "Mozzarella, gorgonzola, fontina, parm.", tag: "", tagBg: "#2E7D32" },
    { slug: "sausage", icon: "🥓", name: "Sausage & Peppers", price: 16, short: "Milwaukee bratwurst, roasted peppers.", tag: "Local", tagBg: "#F0A202" },
];

/** The other pies moving through the truck tonight — static ambience. */
const AMBIENT: Record<ColKey, Omit<Ticket, "mine">[]> = {
    queue: [
        { num: "319", pie: "Marinara", meta: "pickup · 2 min ago" },
        { num: "320", pie: "Diavola ×2", meta: "dine-in · just now" },
    ],
    oven: [
        { num: "316", pie: "Quattro Formaggi", meta: "in 40s" },
        { num: "317", pie: "Pepperoni", meta: "in 1:10" },
    ],
    up: [{ num: "315", pie: "Margherita", meta: "ready" }],
};

const COLUMNS: { key: ColKey; label: string; dot: string }[] = [
    { key: "queue", label: "In line", dot: "#9A8163" },
    { key: "oven", label: "In the oven", dot: "#E0623B" },
    { key: "up", label: "Out the window", dot: "#2E7D32" },
];

/** Static teaser rows in the hero's live-oven peek card. */
const PEEK = [
    { num: "315", pie: "Margherita", stage: "Out ✓" },
    { num: "316", pie: "Quattro Formaggi", stage: "In oven" },
    { num: "317", pie: "Pepperoni", stage: "In oven" },
];

const STATS = [
    { v: "90s", k: "in the oven" },
    { v: "2-day", k: "cold ferment" },
    { v: "2026", k: "est. Milwaukee" },
    { v: "6", k: "pies nightly" },
];

const SCHEDULE = [
    { day: "Tuesday", place: "Bay View — KK Ave", hours: "5–10" },
    { day: "Wednesday", place: "Riverwest — Center St", hours: "5–10" },
    { day: "Thursday", place: "Brady Street", hours: "5–10" },
    { day: "Friday", place: "Third Ward Piazza", hours: "5–11" },
    { day: "Saturday", place: "Walker's Point", hours: "5–11" },
    { day: "Sunday", place: "Humboldt Park (summer)", hours: "4–9" },
];

const MY_NUM = "318";
const STAGE_KEYS: readonly ColKey[] = ["queue", "oven", "up"];

export default function Pizza({ style }: { style: Style }) {
    const [cart, setCart] = useState<Pie[]>([]);
    const [stage, setStage] = useState(-1); // -1 not placed · 0 queue · 1 oven · 2 up

    const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
    const menuRef = useRef<HTMLElement>(null);
    const trackRef = useRef<HTMLElement>(null);
    const storyRef = useRef<HTMLElement>(null);
    const findRef = useRef<HTMLElement>(null);

    // Clear the order-progression timers if the visitor navigates away mid-bake.
    useEffect(() => {
        const timers = timersRef.current;
        return () => timers.forEach(clearTimeout);
    }, []);

    const scrollTo = (ref: RefObject<HTMLElement | null>) => () => {
        ref.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    };

    const addToCart = (pie: Pie) => setCart((c) => [...c, pie]);

    const canPlace = cart.length > 0 && stage < 0;
    const placeOrder = () => {
        if (!canPlace) return;
        setStage(0);
        timersRef.current.push(setTimeout(() => setStage(1), 3000));
        timersRef.current.push(setTimeout(() => setStage(2), 6500));
    };

    const cartTotal = cart.reduce((sum, p) => sum + p.price, 0);
    const myPie = cart.length > 0 ? cart.map((p) => p.name).join(" + ") : "Your pie";
    const done = stage === 2;

    // Compose the three columns: ambient tickets plus, once placed, YOUR
    // ticket prepended into whichever column the stage points at — so it
    // visibly migrates In line → In the oven → Out the window.
    const columns = useMemo(() => {
        const stageKey = stage >= 0 ? STAGE_KEYS[stage] : undefined;
        return COLUMNS.map((col) => {
            const tickets: Ticket[] = AMBIENT[col.key].map((t) => ({ ...t, mine: false }));
            if (stageKey === col.key) {
                tickets.unshift({ num: MY_NUM, pie: myPie, meta: "your order", mine: true });
            }
            return { ...col, tickets };
        });
    }, [stage, myPie]);

    return (
        <div className="mppizza-root">
            {/* Awning stripe — pure CSS pizzeria checker */}
            <div className="mppizza-awning" aria-hidden />

            {/* Sticky blurred-cream header */}
            <header className="mppizza-header">
                <div className="mppizza-header-in">
                    <div className="mppizza-brand">
                        <span className="mppizza-brand-name">Mom-n-Pops</span>
                        <span className="mppizza-brand-tag">Pizzeria</span>
                    </div>
                    <nav className="mppizza-nav" aria-label="Page sections">
                        <button type="button" className="mppizza-nav-link mppizza-nav-plain" onClick={scrollTo(menuRef)}>
                            Menu
                        </button>
                        <button type="button" className="mppizza-nav-link mppizza-nav-plain" onClick={scrollTo(storyRef)}>
                            Story
                        </button>
                        <button type="button" className="mppizza-nav-link mppizza-nav-plain" onClick={scrollTo(findRef)}>
                            Find us
                        </button>
                        <button type="button" className="mppizza-nav-link mppizza-nav-track" onClick={scrollTo(trackRef)}>
                            <Radio size={14} aria-hidden /> Track order
                        </button>
                    </nav>
                </div>
            </header>

            <div className="mppizza-shell">
                {/* ── Hero + live-oven peek card ─────────────────────────────── */}
                <section className="mppizza-hero">
                    <div>
                        <div className="mppizza-kicker">Wood-fired · Milwaukee · dal 2026</div>
                        <h1 className="mppizza-h1">60 seconds in a 900° oven.</h1>
                        <p className="mppizza-lede">
                            Neapolitan dough proofed two days, San Marzano tomatoes, a wood fire in the back of the
                            truck. Order ahead and watch it move from the bench to your hands.
                        </p>
                        <div className="mppizza-hero-ctas">
                            <Button className="mppizza-cta mppizza-cta-primary" onClick={scrollTo(menuRef)}>
                                Start an order
                            </Button>
                            <Button variant="ghost" className="mppizza-cta mppizza-cta-ghost" onClick={scrollTo(findRef)}>
                                Tonight's stop
                            </Button>
                        </div>
                    </div>

                    {/* Card primitive → the live-oven peek shell (dark header + queue) */}
                    <Card className="mppizza-peek" variant="flat" padding="none">
                        <div className="mppizza-peek-head">
                            <span className="mppizza-peek-dot" aria-hidden />
                            <span className="mppizza-peek-title">The oven, right now</span>
                            <span className="mppizza-peek-temp">612°F</span>
                        </div>
                        <div className="mppizza-peek-body">
                            <div className="mppizza-peek-meta">
                                <span>Live queue</span>
                                <span>4 pies ahead · ~12 min</span>
                            </div>
                            {/* Table primitive → the 3-row live queue (headerless) */}
                            <Table className="mppizza-peek-table">
                                <Table.Body>
                                    {PEEK.map((p) => (
                                        <Table.Row key={p.num} className="mppizza-peek-row">
                                            <Table.Cell className="mppizza-peek-num">#{p.num}</Table.Cell>
                                            <Table.Cell className="mppizza-peek-pie">{p.pie}</Table.Cell>
                                            <Table.Cell className="mppizza-peek-stage">{p.stage}</Table.Cell>
                                        </Table.Row>
                                    ))}
                                </Table.Body>
                            </Table>
                        </div>
                    </Card>
                </section>

                {/* ── Menu — Le Pizze ────────────────────────────────────────── */}
                <section className="mppizza-menu" ref={menuRef}>
                    <div className="mppizza-menu-head">
                        <h2 className="mppizza-h2">Le Pizze</h2>
                        <div className="mppizza-menu-sub">10-inch personal pies · add to your order</div>
                    </div>
                    <div className="mppizza-menu-grid">
                        {MENU.map((m) => (
                            /* Card primitive → each white pie card */
                            <Card key={m.slug} className="mppizza-dish" variant="flat" padding="none">
                                <div className="mppizza-dish-top">
                                    <span className="mppizza-dish-glyph" aria-hidden>
                                        {m.icon}
                                    </span>
                                    {m.tag !== "" && (
                                        <Badge variant="solid" className="mppizza-dish-tag" style={{ background: m.tagBg }}>
                                            {m.tag}
                                        </Badge>
                                    )}
                                </div>
                                <div className="mppizza-dish-name-row">
                                    <span className="mppizza-dish-name">{m.name}</span>
                                    <span className="mppizza-dish-price">${m.price}</span>
                                </div>
                                <p className="mppizza-dish-desc">{m.short}</p>
                                <Button className="mppizza-add" onClick={() => addToCart(m)}>
                                    + Add to order
                                </Button>
                            </Card>
                        ))}
                    </div>
                </section>

                {/* ── Order tracker — the embedded kanban surface ────────────── */}
                <section className="mppizza-track" ref={trackRef}>
                    <div className="mppizza-track-shell">
                        <div className="mppizza-track-head">
                            <div>
                                <div className="mppizza-track-title">Track your order</div>
                                <div className="mppizza-track-sub">
                                    Live from the truck — updates as your pie moves down the line.
                                </div>
                            </div>
                            <div className="mppizza-track-actions">
                                {cart.length > 0 && (
                                    <span className="mppizza-cart-note">
                                        {cart.length} in cart · ${cartTotal}
                                    </span>
                                )}
                                <Button className="mppizza-place" disabled={!canPlace} onClick={placeOrder}>
                                    {stage >= 0 ? "Order placed ✓" : "Place order"}
                                </Button>
                            </div>
                        </div>

                        {/* Read-only board on the Kanban primitive: no onCardMove —
                            state moves the tickets, not drags. */}
                        <Kanban className="mppizza-board">
                            {columns.map((col) => (
                                <Kanban.Column key={col.key} id={col.key} unstyled className="mppizza-col">
                                    <div className="mppizza-col-head">
                                        <span className="mppizza-col-dot" style={{ background: col.dot }} aria-hidden />
                                        <span className="mppizza-col-label">{col.label}</span>
                                        <span className="mppizza-col-count">{col.tickets.length}</span>
                                    </div>
                                    {col.tickets.map((t) => (
                                        <Kanban.Card
                                            key={t.num}
                                            id={`ticket-${t.num}`}
                                            unstyled
                                            className={`mppizza-ticket${t.mine ? " is-mine" : ""}`}
                                        >
                                            <div
                                                className="mppizza-ticket-in"
                                                style={{ borderLeftColor: t.mine ? "#2E7D32" : col.dot }}
                                            >
                                                <div className="mppizza-ticket-top">
                                                    <span className="mppizza-ticket-num">#{t.num}</span>
                                                    {t.mine && <Badge className="mppizza-you">YOU</Badge>}
                                                </div>
                                                <div className="mppizza-ticket-pie">{t.pie}</div>
                                                <div className="mppizza-ticket-meta">{t.meta}</div>
                                            </div>
                                        </Kanban.Card>
                                    ))}
                                    {col.tickets.length === 0 && <div className="mppizza-col-empty">—</div>}
                                </Kanban.Column>
                            ))}
                        </Kanban>

                        {done && (
                            <Callout color="green" icon={<CircleCheck size={16} />} className="mppizza-done">
                                Order #{MY_NUM} is up — come to the window! Grazie.
                            </Callout>
                        )}
                    </div>
                </section>

                {/* ── Story — La nostra storia ───────────────────────────────── */}
                <section className="mppizza-story" ref={storyRef}>
                    <div>
                        <div className="mppizza-kicker mppizza-kicker-tight">La nostra storia</div>
                        <h2 className="mppizza-story-h2">Sal built the oven. Rosa built the dough.</h2>
                        <p className="mppizza-story-p">
                            Sal bricked a real wood-fired oven into the back of the truck himself. Rosa spent a year on
                            the dough — two-day cold ferment, nothing but flour, water, salt, and time. Since 2026, one
                            pie at a time, out the window in ninety seconds flat.
                        </p>
                    </div>
                    <div className="mppizza-stats">
                        {STATS.map((s) => (
                            /* Card primitive → each "numbers as proof" stat tile */
                            <Card key={s.k} className="mppizza-stat" variant="flat" padding="none">
                                <div className="mppizza-stat-v">{s.v}</div>
                                <div className="mppizza-stat-k">{s.k}</div>
                            </Card>
                        ))}
                    </div>
                </section>

                {/* ── Find us — Dove siamo ───────────────────────────────────── */}
                <section className="mppizza-find" ref={findRef}>
                    <h2 className="mppizza-find-h2">Dove siamo</h2>
                    {/* Table primitive → the weekly schedule ledger (headerless) */}
                    <Table className="mppizza-sched">
                        <Table.Body>
                            {SCHEDULE.map((s) => (
                                <Table.Row key={s.day} className="mppizza-sched-row">
                                    <Table.Cell className="mppizza-sched-day">{s.day}</Table.Cell>
                                    <Table.Cell className="mppizza-sched-place">{s.place}</Table.Cell>
                                    <Table.Cell className="mppizza-sched-hours">{s.hours}</Table.Cell>
                                </Table.Row>
                            ))}
                        </Table.Body>
                    </Table>
                </section>
            </div>

            {/* ── Footer ─────────────────────────────────────────────────────── */}
            <footer className="mppizza-footer">
                <div className="mppizza-footer-in">
                    <span className="mppizza-footer-brand">Mom-n-Pops Pizzeria</span>
                    <span>hello@momnpops.truck · @momnpops.mke</span>
                    <span>© 2026 · Rosa &amp; Sal · Milwaukee</span>
                </div>
                <div className="mppizza-demonote">
                    <span>
                        Mom-n-Pops — a fictional food truck, for demonstration · Style {style.num} / {style.name}
                    </span>
                    <Link href="/inspiration/mom-n-pops" className="mppizza-back">
                        <ArrowLeft size={13} />
                        Back to the collection
                    </Link>
                </div>
            </footer>
        </div>
    );
}
