import "./ramen.css";

import { Badge, Button, Card, Kanban } from "@particle-academy/react-fancy";
import { CheckCircle2, Soup } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { RefObject } from "react";
import type { Style } from "../../types";

/**
 * Mom-n-Pops · Style 12 — Ramen (ラーメン).
 *
 * The family truck as a late-night ramen-ya: near-black warm surfaces
 * (#100C0B page / #17110F cards), warm-tan ink, one hot red accent
 * (#E23B2E CTAs, #FF5A3C prices + kanji), gold eyebrows and a pulsing
 * red "broth's on" lamp in the hero. The special surface is the ORDER
 * TRACKER — a three-column kanban (In line / At the pot / At the window)
 * of live tickets driven by controlled state: "+ Add" feeds the cart,
 * "Place order" drops ticket #42 into the queue and two timers walk it
 * to the window, where a green Itadakimasu banner lights up.
 *
 * Fancy primitives restyled hard for this idiom: Button (solid-red
 * primary / outlined ghost / inset +Add), Badge (the green YOU pill),
 * Card (tonight card, menu cards, tracker shell), Kanban (the board —
 * unstyled columns + cards re-skinned as status-colored order tickets).
 *
 * Mounted by Inspiration/Show.tsx for `style.id === "ramen"`. SSR-safe:
 * no browser APIs during render; stage timers start inside a click
 * handler and are cleared on unmount; scroll-nav uses refs +
 * scrollIntoView with CSS scroll-margin-top. Sticky header stays at
 * z-index 20 — under the gallery frame's 30.
 */

type MenuItem = {
    slug: string;
    icon: string;
    name: string;
    price: number;
    short: string;
};

type Ticket = {
    num: string;
    pie: string;
    meta: string;
    mine?: boolean;
};

type ColumnKey = "queue" | "pot" | "up";

/** The six bowls, exactly as chalked on the truck. */
const MENU: MenuItem[] = [
    { slug: "tonkotsu", icon: "🍜", name: "Tonkotsu", price: 13, short: "20-hr pork broth, chashu, jammy egg. Signature." },
    { slug: "shoyu", icon: "🍜", name: "Shoyu", price: 12, short: "Chicken-dashi, soy tare, chicken chashu." },
    { slug: "miso", icon: "🍜", name: "Miso", price: 13, short: "Red miso, corn, butter, ground pork." },
    { slug: "spicy", icon: "🌶️", name: "Spicy Tantanmen", price: 14, short: "Sesame-chili broth, ground pork, chili oil." },
    { slug: "veg", icon: "🥬", name: "Shio Vegetable", price: 12, short: "Kombu-shiitake broth, tofu, greens. Vegan." },
    { slug: "gyoza", icon: "🥟", name: "Pork Gyoza ×6", price: 6, short: "Crisp-bottomed, ponzu." },
];

/** Hot tonight — the hero side-card's three movers. */
const HOT = [
    { name: "Tonkotsu", price: "$13" },
    { name: "Miso", price: "$13" },
    { name: "Pork Gyoza", price: "$6" },
];

/** Fake fellow customers so the board always feels alive. */
const AMBIENT: Record<ColumnKey, Ticket[]> = {
    queue: [
        { num: "43", pie: "Miso ×2", meta: "just now" },
        { num: "44", pie: "Spicy Tantanmen", meta: "pickup" },
    ],
    pot: [
        { num: "40", pie: "Tonkotsu", meta: "noodles in" },
        { num: "41", pie: "Shoyu", meta: "assembling" },
    ],
    up: [{ num: "39", pie: "Gyoza + Miso", meta: "ready" }],
};

const COLUMNS: { key: ColumnKey; label: string }[] = [
    { key: "queue", label: "In line" },
    { key: "pot", label: "At the pot" },
    { key: "up", label: "At the window" },
];

/** Order stage (0/1/2) → the kanban column the user's ticket sits in. */
const STAGE_COLUMN: ColumnKey[] = ["queue", "pot", "up"];

const STATS = [
    { v: "20 hr", k: "tonkotsu broth" },
    { v: "1 AM", k: "weekend close" },
    { v: "fresh", k: "noodles daily" },
    { v: "2026", k: "est. Milwaukee" },
];

const SCHEDULE = [
    { day: "Tuesday", place: "Marquette — Wells St", hours: "5–10" },
    { day: "Wednesday", place: "East Side — Downer Ave", hours: "5–10" },
    { day: "Thursday", place: "Riverwest — Center St", hours: "5–11" },
    { day: "Friday", place: "Water St — bar district", hours: "6p–1a" },
    { day: "Saturday", place: "Water St — bar district", hours: "6p–1a" },
    { day: "Sunday", place: "Bay View — KK Ave", hours: "5–10" },
];

const MY_NUM = "42";

export default function Ramen({ style }: { style: Style }) {
    const [cart, setCart] = useState<MenuItem[]>([]);
    /** -1 = not placed · 0 = in line · 1 = at the pot · 2 = at the window */
    const [stage, setStage] = useState(-1);

    const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
    const menuRef = useRef<HTMLElement | null>(null);
    const trackRef = useRef<HTMLElement | null>(null);
    const findRef = useRef<HTMLElement | null>(null);

    // Clear the kitchen-stage timers if the visitor leaves mid-order.
    useEffect(() => {
        const timers = timersRef.current;
        return () => {
            timers.forEach((t) => clearTimeout(t));
        };
    }, []);

    const hasCart = cart.length > 0;
    const cartTotal = cart.reduce((sum, item) => sum + item.price, 0);
    const canPlace = hasCart && stage < 0;
    const done = stage === 2;
    const myPie = hasCart ? cart.map((c) => c.name).join(" + ") : "Your bowl";
    const mineColumn: ColumnKey | null = stage >= 0 ? STAGE_COLUMN[stage] : null;

    const addToCart = (item: MenuItem) => {
        setCart((c) => [...c, item]);
    };

    const placeOrder = () => {
        if (!canPlace) {
            return;
        }
        setStage(0);
        timersRef.current.push(setTimeout(() => setStage(1), 3000));
        timersRef.current.push(setTimeout(() => setStage(2), 6500));
    };

    const scrollTo = (ref: RefObject<HTMLElement | null>) => {
        ref.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    };

    const columns = COLUMNS.map(({ key, label }) => {
        const tickets: Ticket[] =
            mineColumn === key
                ? [{ num: MY_NUM, pie: myPie, meta: "your order", mine: true }, ...AMBIENT[key]]
                : AMBIENT[key];
        return { key, label, tickets };
    });

    return (
        <div className="mpramen-root">
            {/* ── Sticky header — wordmark + katakana + scroll nav ─────────── */}
            <header className="mpramen-header">
                <div className="mpramen-header__inner">
                    <span className="mpramen-mark">
                        <span className="mpramen-mark__name">Mom-n-Pops</span>
                        <span className="mpramen-mark__kana" lang="ja">ラーメン</span>
                    </span>
                    <nav className="mpramen-nav" aria-label="Truck">
                        <button type="button" className="mpramen-nav__link" onClick={() => scrollTo(menuRef)}>
                            Menu
                        </button>
                        <button type="button" className="mpramen-nav__link" onClick={() => scrollTo(trackRef)}>
                            Order ahead
                        </button>
                        <button type="button" className="mpramen-nav__link" onClick={() => scrollTo(findRef)}>
                            Find us
                        </button>
                        <Button className="mpramen-pill" onClick={() => scrollTo(findRef)}>
                            Find the truck
                        </Button>
                    </nav>
                </div>
            </header>

            {/* ── Hero — lamp + headline + CTAs · tonight card ─────────────── */}
            <section className="mpramen-hero" aria-labelledby="mpramen-hero-title">
                <div className="mpramen-hero__copy">
                    <div className="mpramen-hero__eyebrow">
                        <span className="mpramen-lamp" aria-hidden />
                        <span className="mpramen-eyebrow">Open late · Milwaukee · 2026</span>
                    </div>
                    <h1 id="mpramen-hero-title" className="mpramen-hero__title">
                        A 20-hour bowl of broth.
                    </h1>
                    <p className="mpramen-hero__dek">
                        Pork bones simmered till the broth turns milky, noodles made fresh, egg jammy in the
                        middle. Order ahead and skip the cold-night line.
                    </p>
                    <div className="mpramen-hero__ctas">
                        <Button className="mpramen-btn-primary" onClick={() => scrollTo(menuRef)}>
                            See the bowls
                        </Button>
                        <Button className="mpramen-btn-ghost" onClick={() => scrollTo(trackRef)}>
                            Order ahead
                        </Button>
                    </div>
                </div>

                <Card variant="outlined" padding="none" className="mpramen-card mpramen-tonight">
                    <Card.Header className="mpramen-tonight__head">
                        <Soup size={15} aria-hidden />
                        Tonight · Water St · till 1 AM
                    </Card.Header>
                    <Card.Body className="mpramen-tonight__body">
                        <div className="mpramen-tonight__note">Broth&apos;s on. Pickup ~10 min.</div>
                        {HOT.map((h) => (
                            <div key={h.name} className="mpramen-tonight__row">
                                <span className="mpramen-tonight__bowl" aria-hidden>
                                    🍜
                                </span>
                                <span className="mpramen-tonight__name">{h.name}</span>
                                <span className="mpramen-tonight__price">{h.price}</span>
                            </div>
                        ))}
                    </Card.Body>
                </Card>
            </section>

            <div className="mpramen-main">
                {/* ── Menu — the six bowls, + Add feeds the tracker ────────── */}
                <section ref={menuRef} className="mpramen-menu" aria-labelledby="mpramen-menu-title">
                    <div className="mpramen-menu__head">
                        <h2 id="mpramen-menu-title" className="mpramen-h2">
                            The bowls{" "}
                            <span className="mpramen-kanji" lang="ja">
                                丼
                            </span>
                        </h2>
                        <span className="mpramen-hint">tap + to add to your order</span>
                    </div>
                    <div className="mpramen-menu__grid">
                        {MENU.map((m) => (
                            <Card key={m.slug} variant="outlined" padding="none" className="mpramen-card mpramen-dish">
                                <Card.Body className="mpramen-dish__body">
                                    <div className="mpramen-dish__top">
                                        <span className="mpramen-dish__icon" aria-hidden>
                                            {m.icon}
                                        </span>
                                        <span className="mpramen-dish__price">${m.price}</span>
                                    </div>
                                    <div className="mpramen-dish__name">{m.name}</div>
                                    <p className="mpramen-dish__short">{m.short}</p>
                                    <Button className="mpramen-add" onClick={() => addToCart(m)}>
                                        + Add
                                    </Button>
                                </Card.Body>
                            </Card>
                        ))}
                    </div>
                </section>

                {/* ── Order ahead — the kanban order tracker ───────────────── */}
                <section ref={trackRef} className="mpramen-track" aria-labelledby="mpramen-track-title">
                    <Card variant="outlined" padding="none" className="mpramen-card mpramen-tracker">
                        <Card.Header className="mpramen-tracker__head">
                            <div>
                                <div id="mpramen-track-title" className="mpramen-tracker__title">
                                    Order ahead
                                </div>
                                <div className="mpramen-tracker__sub">
                                    Watch your bowl move from the pot to the window.
                                </div>
                            </div>
                            <div className="mpramen-tracker__actions">
                                {hasCart && (
                                    <span className="mpramen-tracker__cart">
                                        {cart.length} · ${cartTotal}
                                    </span>
                                )}
                                <Button
                                    className="mpramen-btn-primary mpramen-place"
                                    disabled={!canPlace}
                                    onClick={placeOrder}
                                >
                                    {stage >= 0 ? "Order placed ✓" : "Place order"}
                                </Button>
                            </div>
                        </Card.Header>

                        <Kanban className="mpramen-board">
                            {columns.map((col) => (
                                <Kanban.Column key={col.key} id={col.key} unstyled className="mpramen-col">
                                    <div className="mpramen-col__head">
                                        <span
                                            className={`mpramen-col__dot mpramen-col__dot--${col.key}`}
                                            aria-hidden
                                        />
                                        <span className="mpramen-col__label">{col.label}</span>
                                    </div>
                                    {col.tickets.map((t) => (
                                        <Kanban.Card
                                            key={t.num}
                                            id={`ticket-${t.num}`}
                                            unstyled
                                            className={[
                                                "mpramen-ticket",
                                                `mpramen-ticket--${col.key}`,
                                                t.mine ? "mpramen-ticket--mine" : "",
                                            ]
                                                .join(" ")
                                                .trim()}
                                        >
                                            <div className="mpramen-ticket__row">
                                                <span className="mpramen-ticket__num">#{t.num}</span>
                                                {t.mine && (
                                                    <Badge size="sm" className="mpramen-you">
                                                        YOU
                                                    </Badge>
                                                )}
                                            </div>
                                            <div className="mpramen-ticket__pie">{t.pie}</div>
                                            <div className="mpramen-ticket__meta">{t.meta}</div>
                                        </Kanban.Card>
                                    ))}
                                    {col.tickets.length === 0 && (
                                        <div className="mpramen-col__empty" aria-hidden>
                                            —
                                        </div>
                                    )}
                                </Kanban.Column>
                            ))}
                        </Kanban>

                        {done && (
                            <div className="mpramen-done" role="status">
                                <CheckCircle2 size={16} aria-hidden />
                                Bowl #{MY_NUM} is up at the window. Itadakimasu.
                            </div>
                        )}
                    </Card>
                </section>

                {/* ── Story + stats — 物語 ─────────────────────────────────── */}
                <section className="mpramen-story" aria-labelledby="mpramen-story-title">
                    <div>
                        <div className="mpramen-eyebrow mpramen-story__eyebrow">
                            <span lang="ja">物語</span> · Our story
                        </div>
                        <h2 id="mpramen-story-title" className="mpramen-story__title">
                            The broth starts before we open and never really stops.
                        </h2>
                        <p className="mpramen-story__copy">
                            Sal keeps a tonkotsu going almost around the clock; Rosa pulls the noodles and cures
                            the eggs. On a January night in Milwaukee, the window fogs up and the line
                            doesn&apos;t care. Since 2026. Open late, always.
                        </p>
                    </div>
                    <div className="mpramen-stats">
                        {STATS.map((s) => (
                            <div key={s.k} className="mpramen-stat">
                                <div className="mpramen-stat__value">{s.v}</div>
                                <div className="mpramen-stat__label">{s.k}</div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* ── Find the truck — the week, printed-timetable style ───── */}
                <section ref={findRef} className="mpramen-find" aria-labelledby="mpramen-find-title">
                    <h2 id="mpramen-find-title" className="mpramen-h2 mpramen-find__title">
                        Find the truck
                    </h2>
                    <div className="mpramen-schedule">
                        {SCHEDULE.map((s) => (
                            <div key={s.day} className="mpramen-schedule__row">
                                <span className="mpramen-schedule__day">{s.day}</span>
                                <span className="mpramen-schedule__place">{s.place}</span>
                                <span className="mpramen-schedule__hours">{s.hours}</span>
                            </div>
                        ))}
                    </div>
                </section>
            </div>

            {/* ── Footer ───────────────────────────────────────────────────── */}
            <footer className="mpramen-footer">
                <div className="mpramen-footer__inner">
                    <span className="mpramen-footer__mark">
                        Mom-n-Pops{" "}
                        <span className="mpramen-footer__kana" lang="ja">
                            ラーメン
                        </span>
                    </span>
                    <span>
                        hello<span>@</span>momnpops.truck · @momnpops.mke
                    </span>
                    <span>
                        © 2026 · Milwaukee · Style {style.num} — {style.name}
                    </span>
                </div>
            </footer>
        </div>
    );
}
