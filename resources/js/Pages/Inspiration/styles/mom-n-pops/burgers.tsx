import "./burgers.css";

import { useEffect, useState } from "react";
import {
    Badge,
    Button,
    Card,
    Command,
    Tooltip,
    useCommand,
} from "@particle-academy/react-fancy";
import { Clock, Command as CommandKey } from "lucide-react";
import type { Style } from "../../types";

/**
 * Inspiration Gallery · Mom-n-Pops style 08 — Diner (Burgers).
 *
 * MOM-N-POPS (a FICTIONAL Milwaukee family food truck — Rosa & Sal, est. 2026)
 * as a retro-comic burger diner: cream paper page (#F6F1E7), a #D22B2B diner-red
 * sticky header and footer, a #1C2733 navy hero, mustard #FFC93C CTAs, and the
 * signature "sticker" card system — 2px navy cartoon outlines with hard 4px
 * offset shadows (teal #4CD7E0 under the stat cards). A pure-CSS checkerboard
 * strip opens the page; prices, hours and kbd hints run in mono.
 *
 * The star surface is the ⌘K quick-order palette: the react-fancy `Command`
 * primitive restyled to the sticker look (8px offset shadow so it visually
 * outranks the 4px cards). The SAME menu array feeds the card grid and the
 * palette; both "+ Add" and palette rows push into one controlled `cart` state
 * (rows are hand-rolled `role="option"` buttons so the palette stays open and
 * doubles as a mini cart — Command.Item would close on select), and a footer
 * bar with count + running total appears once the cart has items. Prices are
 * stored numeric (no parseInt on "$8" strings).
 *
 * Mounted by Inspiration/Show.tsx for `style.id === "burgers"`. SSR-safe: the
 * global Cmd/Ctrl+K toggle lives in a cleaned-up useEffect, icons are static
 * lucide-react imports (no window.lucide hydration), and first paint is fully
 * deterministic (palette closed, cart empty). All page z-indexes stay under 30
 * — the kit Command overlay is re-pinned to 29 so the GalleryFrame keeps the
 * top layer.
 */

type MenuItem = {
    icon: string;
    name: string;
    short: string;
    /** Dollars — kept numeric so the cart total is real math, not parseInt. */
    price: number;
};

const MENU: MenuItem[] = [
    { icon: "🍔", name: "The Classic Smash", short: "single, American, secret sauce", price: 8 },
    { icon: "🍔", name: "The Double", short: "two patties, grilled onion", price: 11 },
    { icon: "🥓", name: "Bacon Cheddar", short: "thick-cut bacon, BBQ mayo", price: 10 },
    { icon: "🫓", name: "Patty Melt", short: "rye, Swiss, onion jam", price: 10 },
    { icon: "🥬", name: "Veggie Smash", short: "black-bean-beet patty", price: 9 },
    { icon: "🥤", name: "Malted Shake", short: "vanilla · choc · Door County cherry", price: 5 },
];

/** The hero "tonight" card repeats the three hot movers. */
const HOT: MenuItem[] = [MENU[0], MENU[2], MENU[5]];

const STATS: Array<{ v: string; k: string; lock?: boolean }> = [
    { v: "2:30a", k: "weekend close" },
    { v: "2026", k: "est. Milwaukee" },
    { v: "fresh", k: "never frozen" },
    { v: "🔒", k: "secret sauce", lock: true },
];

const SCHEDULE = [
    { day: "Tuesday", place: "Marquette — Wells St", hours: "11–8" },
    { day: "Wednesday", place: "Bay View — KK Ave", hours: "11–8" },
    { day: "Thursday", place: "Brady Street", hours: "11–9" },
    { day: "Friday", place: "Water St — bar district", hours: "6p–2:30a" },
    { day: "Saturday", place: "Water St — bar district", hours: "6p–2:30a" },
    { day: "Sunday", place: "Humboldt Park", hours: "12–7" },
];

const money = (n: number) => `$${n}`;

/**
 * Palette rows — hand-rolled inside the Command context so a click adds to the
 * cart WITHOUT closing the palette (the mockup's palette doubles as a mini
 * cart). `role="option"` keeps the kit's ArrowUp/ArrowDown focus-walk working;
 * `useCommand()` reads the live query from Command.Input for filtering.
 */
function PaletteRows({ onAdd }: { onAdd: (item: MenuItem) => void }) {
    const { query } = useCommand();
    const q = query.trim().toLowerCase();
    const rows = q
        ? MENU.filter((m) => `${m.name} ${m.short}`.toLowerCase().includes(q))
        : MENU;

    return (
        <Command.List className="mpburgers-cmdk-list">
            {rows.length === 0 && (
                <div className="mpburgers-cmdk-empty">
                    Nothing on the menu by that name — try “smash”.
                </div>
            )}
            {rows.map((m) => (
                <button
                    key={m.name}
                    type="button"
                    role="option"
                    className="mpburgers-cmdk-row"
                    onClick={() => onAdd(m)}
                >
                    <span className="mpburgers-cmdk-tile" aria-hidden>
                        {m.icon}
                    </span>
                    <span className="mpburgers-cmdk-info">
                        <span className="mpburgers-cmdk-name">{m.name}</span>
                        <span className="mpburgers-cmdk-short">{m.short}</span>
                    </span>
                    <span className="mpburgers-cmdk-price">{money(m.price)}</span>
                </button>
            ))}
        </Command.List>
    );
}

export default function Burgers({ style }: { style: Style }) {
    const [palOpen, setPalOpen] = useState(false);
    const [cart, setCart] = useState<MenuItem[]>([]);

    const cartTotal = cart.reduce((sum, item) => sum + item.price, 0);
    const addToCart = (item: MenuItem) => setCart((c) => [...c, item]);

    /* Global ⌘K / Ctrl+K toggle — window access stays inside the effect.
       Escape + backdrop-click closing is handled by the Command primitive. */
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
                e.preventDefault();
                setPalOpen((open) => !open);
            }
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, []);

    return (
        <div className="mpburgers-root">
            {/* ── Checkerboard strip — pure CSS, instantly reads "diner" ───── */}
            <div className="mpburgers-checker" aria-hidden />

            {/* ── Sticky red header ─────────────────────────────────────────── */}
            <header className="mpburgers-header">
                <div className="mpburgers-header-inner">
                    <span className="mpburgers-wordmark">
                        <span className="mpburgers-wordmark-name">Mom-n-Pops</span>
                        <Badge className="mpburgers-tag" variant="solid" size="sm">
                            DINER
                        </Badge>
                    </span>
                    <nav className="mpburgers-nav" aria-label="Diner">
                        <a href="#mpburgers-menu">Menu</a>
                        <a href="#mpburgers-story">Story</a>
                        <a href="#mpburgers-find">Find us</a>
                        <Button
                            className="mpburgers-chip"
                            onClick={() => setPalOpen(true)}
                            aria-label="Quick order — opens the command palette (Cmd or Ctrl K)"
                        >
                            <CommandKey size={14} aria-hidden />
                            Quick order
                            <span className="mpburgers-chip-kbd">⌘K</span>
                            {cart.length > 0 && (
                                <span className="mpburgers-chip-count" aria-hidden>
                                    {cart.length}
                                </span>
                            )}
                        </Button>
                    </nav>
                </div>
            </header>

            {/* ── Hero — dark navy, open-late pitch + live "tonight" card ──── */}
            <section className="mpburgers-hero" aria-labelledby="mpburgers-hero-title">
                <div className="mpburgers-hero-inner">
                    <div className="mpburgers-hero-copy">
                        <div className="mpburgers-eyebrow">Open Late</div>
                        <h1 id="mpburgers-hero-title" className="mpburgers-display">
                            Smashed thin.
                            <br />
                            <span className="mpburgers-display-hi">Crispy edges.</span>
                        </h1>
                        <p className="mpburgers-lede">
                            Fresh beef smashed on a screaming flat-top, American cheese, soft
                            potato bun, secret sauce. In a hurry? Hit{" "}
                            <span className="mpburgers-kbd">⌘K</span> and order without
                            leaving the page.
                        </p>
                        <div className="mpburgers-hero-cta">
                            <Button
                                className="mpburgers-btn mpburgers-btn--red"
                                href="#mpburgers-menu"
                            >
                                See the menu
                            </Button>
                            <Button
                                className="mpburgers-btn mpburgers-btn--yellow"
                                onClick={() => setPalOpen(true)}
                            >
                                Quick order
                            </Button>
                        </div>
                    </div>

                    <Card className="mpburgers-tonight" padding="none">
                        <Card.Header className="mpburgers-tonight-head">
                            <Clock size={15} aria-hidden />
                            Tonight · Water St bar district · till 2:30 AM
                        </Card.Header>
                        <Card.Body className="mpburgers-tonight-body">
                            <div className="mpburgers-tonight-note">
                                Griddle running · ~6 min a burger
                            </div>
                            <ul className="mpburgers-hot" aria-label="Hot tonight">
                                {HOT.map((m) => (
                                    <li key={m.name} className="mpburgers-hot-row">
                                        <span className="mpburgers-hot-icon" aria-hidden>
                                            {m.icon}
                                        </span>
                                        <span className="mpburgers-hot-name">{m.name}</span>
                                        <span className="mpburgers-hot-price">
                                            {money(m.price)}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        </Card.Body>
                    </Card>
                </div>
            </section>

            <div className="mpburgers-container">
                {/* ── Menu grid — "Order up!" ───────────────────────────────── */}
                <section
                    className="mpburgers-menu"
                    id="mpburgers-menu"
                    aria-labelledby="mpburgers-menu-title"
                >
                    <div className="mpburgers-menu-head">
                        <h2 id="mpburgers-menu-title" className="mpburgers-h2">
                            Order up!
                        </h2>
                        <div className="mpburgers-menu-sub">
                            tap + to add · or press ⌘K anywhere
                        </div>
                    </div>
                    <div className="mpburgers-menu-grid">
                        {MENU.map((m) => (
                            <Card key={m.name} className="mpburgers-menu-card" padding="none">
                                <Card.Body className="mpburgers-menu-card-body">
                                    <div className="mpburgers-menu-top">
                                        <span className="mpburgers-menu-emoji" aria-hidden>
                                            {m.icon}
                                        </span>
                                        <span className="mpburgers-menu-price">
                                            {money(m.price)}
                                        </span>
                                    </div>
                                    <div className="mpburgers-menu-name">{m.name}</div>
                                    <p className="mpburgers-menu-short">{m.short}</p>
                                    <Button
                                        className="mpburgers-add"
                                        onClick={() => addToCart(m)}
                                        aria-label={`Add ${m.name} to the order`}
                                    >
                                        + Add
                                    </Button>
                                </Card.Body>
                            </Card>
                        ))}
                    </div>
                </section>

                {/* ── Story + stats ─────────────────────────────────────────── */}
                <section
                    className="mpburgers-story"
                    id="mpburgers-story"
                    aria-labelledby="mpburgers-story-title"
                >
                    <div className="mpburgers-story-copy">
                        <Badge className="mpburgers-story-pill" variant="solid" size="sm">
                            OUR STORY
                        </Badge>
                        <h2 id="mpburgers-story-title" className="mpburgers-h2 mpburgers-h2--left">
                            A flat-top, a spatula, and a mean secret sauce.
                        </h2>
                        <p className="mpburgers-story-body">
                            Rosa smashes; Sal dresses; the sauce recipe is locked in a drawer
                            nobody&apos;s allowed to open. Fresh never frozen, ground that
                            morning, smashed so thin the edges lace and crisp. Milwaukee,
                            since 2026. Open late on weekends.
                        </p>
                    </div>
                    <div className="mpburgers-stats">
                        {STATS.map((s) => {
                            const card = (
                                <Card
                                    key={s.k}
                                    className={`mpburgers-stat${s.lock ? " mpburgers-stat--lock" : ""}`}
                                    padding="none"
                                >
                                    <Card.Body className="mpburgers-stat-body">
                                        <div className="mpburgers-stat-v">{s.v}</div>
                                        <div className="mpburgers-stat-k">{s.k}</div>
                                    </Card.Body>
                                </Card>
                            );
                            return s.lock ? (
                                <Tooltip
                                    key={s.k}
                                    content="The recipe stays in the drawer. Nobody opens it — not even Sal."
                                    className="mpburgers-tip"
                                >
                                    {card}
                                </Tooltip>
                            ) : (
                                card
                            );
                        })}
                    </div>
                </section>

                {/* ── Schedule — find the truck ─────────────────────────────── */}
                <section
                    className="mpburgers-find"
                    id="mpburgers-find"
                    aria-labelledby="mpburgers-find-title"
                >
                    <h2 id="mpburgers-find-title" className="mpburgers-h3">
                        Find the truck
                    </h2>
                    <Card className="mpburgers-sched" padding="none">
                        <Card.Body className="mpburgers-sched-body">
                            {SCHEDULE.map((s) => (
                                <div key={s.day} className="mpburgers-sched-row">
                                    <span className="mpburgers-sched-day">{s.day}</span>
                                    <span className="mpburgers-sched-place">{s.place}</span>
                                    <span className="mpburgers-sched-hours">{s.hours}</span>
                                </div>
                            ))}
                        </Card.Body>
                    </Card>
                </section>
            </div>

            {/* ── Footer — red band mirroring the header ───────────────────── */}
            <footer className="mpburgers-footer">
                <div className="mpburgers-footer-inner">
                    <span className="mpburgers-footer-mark">Mom-n-Pops Diner</span>
                    <span className="mpburgers-footer-contact">
                        hello<span>@</span>momnpops.truck · @momnpops.mke
                    </span>
                    <span className="mpburgers-footer-copy">© 2026 · Milwaukee</span>
                </div>
                <div className="mpburgers-footer-note">
                    Mom-n-Pops is a fictional food truck, for demonstration · style{" "}
                    {style.num} / {style.name} · built from restyled Fancy UI primitives
                </div>
            </footer>

            {/* ── ⌘K quick-order palette (react-fancy Command, portaled) ───── */}
            <Command
                open={palOpen}
                onClose={() => setPalOpen(false)}
                className="mpburgers-cmdk"
            >
                <Command.Input placeholder="Add to order — search the menu…" />
                <PaletteRows onAdd={addToCart} />
                {cart.length > 0 && (
                    <div className="mpburgers-cmdk-cart">
                        <span className="mpburgers-cmdk-cart-count">
                            {cart.length} item{cart.length === 1 ? "" : "s"} added
                        </span>
                        <span className="mpburgers-cmdk-cart-total">
                            {money(cartTotal)}
                        </span>
                    </div>
                )}
            </Command>

            {/* Screen-reader order announcements — visually hidden, polite. */}
            <div className="mpburgers-sr" aria-live="polite">
                {cart.length > 0 &&
                    `${cart.length} item${cart.length === 1 ? "" : "s"} in the order — ${money(cartTotal)}`}
            </div>
        </div>
    );
}
