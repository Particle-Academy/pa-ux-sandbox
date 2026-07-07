import "./tacos.css";
import { Link } from "@inertiajs/react";
import { useEffect, useState } from "react";
import { Badge, Button, Modal, Tooltip } from "@particle-academy/react-fancy";
import type { Style } from "../../types";

/**
 * Mom-n-Pops · Style 01 — Taquería.
 *
 * The family food truck as a warm, light storefront: cream paper (#FAF4EA),
 * espresso-brown type, one chile-red accent (#D6482B), sand hairlines on white
 * cards, and food drawn entirely with emoji in tinted rounded tiles — no
 * photos anywhere. A frosted cream glass header sticks over the scroll; menu
 * cards lift on hover with a warm shadow; the single layered surface is a
 * taco-detail Modal whose open state IS the selected menu item.
 *
 * Fancy primitives worn by the design: Button (red-fill + sand-outline pills),
 * Badge (data-driven tag pills + ingredient chips + the live "Today" marker),
 * Modal (the taco detail overlay — scrim, Escape, and "Add to order" all
 * dismiss), Tooltip (the fine print behind "∞ free chips*"). Menu cards, stat
 * tiles, and the schedule rows stay hand-rolled — truer to the mockup than a
 * forced Table.
 *
 * Mounted by Inspiration/Show.tsx for mom-n-pops / `style.id === "tacos"`.
 * SSR-safe: all data static, no timers, no randomness; the only browser
 * dependence is the "Today" schedule highlight, computed in a useEffect after
 * hydration so the first paint is deterministic.
 */

type MenuItem = {
    icon: string;
    name: string;
    price: string;
    short: string;
    tag: string;
    tagBg: string;
    long: string;
    ingredients: string[];
};

const MENU: MenuItem[] = [
    {
        icon: "🌮",
        name: "Al Pastor",
        price: "$4.50",
        short: "Marinated pork, pineapple, onion, cilantro.",
        tag: "Most loved",
        tagBg: "#D6482B",
        long: "Pork shoulder marinated overnight in guajillo and achiote, shaved off the trompo and finished with griddled pineapple.",
        ingredients: ["Pork shoulder", "Achiote", "Pineapple", "Onion", "Cilantro"],
    },
    {
        icon: "🥩",
        name: "Carne Asada",
        price: "$5.00",
        short: "Grilled steak, salsa verde, onion.",
        tag: "",
        tagBg: "#2E9E8F",
        long: "Skirt steak seared hard on the flat-top, chopped fine, dressed with a bright tomatillo salsa verde.",
        ingredients: ["Skirt steak", "Salsa verde", "Onion", "Cilantro"],
    },
    {
        icon: "🐖",
        name: "Carnitas",
        price: "$4.50",
        short: "Slow-braised pork, pickled red onion.",
        tag: "",
        tagBg: "#2E9E8F",
        long: "Pork braised for hours in its own fat with orange and bay until it falls apart, then crisped on the edges.",
        ingredients: ["Pork", "Orange", "Bay", "Pickled red onion"],
    },
    {
        icon: "🐟",
        name: "Baja Fish",
        price: "$5.50",
        short: "Beer-battered cod, slaw, chipotle crema.",
        tag: "Friday only",
        tagBg: "#F3A712",
        long: "Cod in a light beer batter, fried to order, over crunchy cabbage slaw with a smoky chipotle crema.",
        ingredients: ["Cod", "Beer batter", "Cabbage", "Chipotle crema"],
    },
    {
        icon: "🌽",
        name: "Rajas Poblanas",
        price: "$4.00",
        short: "Roasted poblano, corn, crema, cotija.",
        tag: "Vegetarian",
        tagBg: "#3F7D3A",
        long: "Roasted poblano strips with sweet corn, a swipe of crema, and crumbled cotija. The meat-free option is nobody's afterthought.",
        ingredients: ["Poblano", "Sweet corn", "Crema", "Cotija"],
    },
    {
        icon: "🌶️",
        name: "Barbacoa",
        price: "$5.50",
        short: "Pull beef, consommé, onion, cilantro.",
        tag: "Weekends",
        tagBg: "#B3352E",
        long: "Beef cheek and chuck steamed with chiles until spoon-tender, served with a cup of consommé for dipping.",
        ingredients: ["Beef cheek", "Dried chiles", "Consommé", "Onion"],
    },
];

const STATS: { v: string; k: string; note?: string }[] = [
    { v: "6", k: "tacos, from $4" },
    { v: "2026", k: "est. Milwaukee" },
    { v: "3", k: "salsas, daily" },
    { v: "∞", k: "free chips*", note: "*One basket per order — Rosa's rule, Sal's portions." },
];

const SCHEDULE: { day: string; place: string; hours: string }[] = [
    { day: "Monday", place: "Cathedral Square Park", hours: "11–2" },
    { day: "Tuesday", place: "Zeidler Union Square", hours: "11–2" },
    { day: "Wednesday", place: "Bronzeville — MLK Dr", hours: "5–9" },
    { day: "Thursday", place: "Brady Street", hours: "5–9" },
    { day: "Friday", place: "Third Ward Riverwalk", hours: "11–2 · 5–9" },
    { day: "Saturday", place: "South Shore Farmers Market", hours: "8–1" },
];

export default function Tacos({ style }: { style: Style }) {
    /**
     * The selected taco populates the Modal; `open` is tracked separately so
     * the card content stays rendered while the Modal plays its exit
     * animation (closing only flips `open`, `sel` persists until reopened).
     */
    const [sel, setSel] = useState<MenuItem | null>(null);
    const [open, setOpen] = useState(false);

    /** Row index (Mon=0…Sat=5) of today's stop; -1 until hydrated / on Sundays. */
    const [todayIdx, setTodayIdx] = useState(-1);
    useEffect(() => {
        const day = new Date().getDay(); // Sun=0 … Sat=6
        setTodayIdx(day >= 1 && day <= 6 ? day - 1 : -1);
    }, []);

    const openTaco = (m: MenuItem) => {
        setSel(m);
        setOpen(true);
    };
    const closeTaco = () => setOpen(false);

    return (
        <div className="mptacos-root">
            {/* ── Sticky frosted-cream header ─────────────────────────────── */}
            <header className="mptacos-header">
                <div className="mptacos-header__in">
                    <Link href="/inspiration/mom-n-pops" className="mptacos-brand">
                        <span className="mptacos-brand__name">Mom-n-Pops</span>
                        <span className="mptacos-brand__sub">Taquería</span>
                    </Link>
                    <nav className="mptacos-nav" aria-label="Site">
                        <a href="#mptacos-menu" className="mptacos-nav__link">Menu</a>
                        <a href="#mptacos-story" className="mptacos-nav__link">Story</a>
                        <a href="#mptacos-schedule" className="mptacos-nav__link">Find us</a>
                        <Button
                            href="#mptacos-schedule"
                            color="red"
                            size="sm"
                            className="mptacos-btn mptacos-btn--primary mptacos-btn--pill"
                        >
                            Find the truck
                        </Button>
                    </nav>
                </div>
            </header>

            <div className="mptacos-container">
                {/* ── Hero ────────────────────────────────────────────────── */}
                <section className="mptacos-hero" aria-labelledby="mptacos-hero-title">
                    <div className="mptacos-eyebrow">
                        <span aria-hidden>🌮</span> Family food truck · Milwaukee · Est. 2026
                    </div>
                    <h1 id="mptacos-hero-title" className="mptacos-hero__title">
                        Tacos the way Rosa's abuela made them.
                    </h1>
                    <p className="mptacos-hero__sub">
                        Hand-pressed tortillas, slow-cooked fillings, salsas made fresh
                        every morning. Chase us down across Milwaukee.
                    </p>
                    <div className="mptacos-hero__cta">
                        <Button
                            href="#mptacos-menu"
                            color="red"
                            className="mptacos-btn mptacos-btn--primary mptacos-btn--hero"
                        >
                            View the menu
                        </Button>
                        <Button
                            href="#mptacos-schedule"
                            className="mptacos-btn mptacos-btn--outline mptacos-btn--hero"
                        >
                            This week's stops
                        </Button>
                    </div>
                </section>

                {/* ── Menu grid ───────────────────────────────────────────── */}
                <section id="mptacos-menu" className="mptacos-menu" aria-labelledby="mptacos-menu-title">
                    <div className="mptacos-menu__head">
                        <h2 id="mptacos-menu-title" className="mptacos-h2">The menu</h2>
                        <span className="mptacos-hint">tap a taco for the full story</span>
                    </div>
                    <div className="mptacos-grid">
                        {MENU.map((m) => (
                            <button
                                key={m.name}
                                type="button"
                                className="mptacos-card"
                                onClick={() => openTaco(m)}
                                aria-haspopup="dialog"
                                aria-label={`${m.name}, ${m.price} — ${m.short}`}
                            >
                                <div className="mptacos-card__top">
                                    <span className="mptacos-card__tile" aria-hidden>{m.icon}</span>
                                    {m.tag !== "" && (
                                        <Badge
                                            size="sm"
                                            variant="solid"
                                            className="mptacos-tag"
                                            style={{ background: m.tagBg }}
                                        >
                                            {m.tag}
                                        </Badge>
                                    )}
                                </div>
                                <div className="mptacos-card__row">
                                    <span className="mptacos-card__name">{m.name}</span>
                                    <span className="mptacos-card__price">{m.price}</span>
                                </div>
                                <p className="mptacos-card__short">{m.short}</p>
                            </button>
                        ))}
                    </div>
                </section>

                {/* ── Story band ──────────────────────────────────────────── */}
                <section id="mptacos-story" className="mptacos-story" aria-labelledby="mptacos-story-title">
                    <div className="mptacos-story__copy">
                        <div className="mptacos-eyebrow mptacos-eyebrow--left">Our story</div>
                        <h2 id="mptacos-story-title" className="mptacos-story__title">
                            Two parents, one griddle, a whole lot of Milwaukee.
                        </h2>
                        <p className="mptacos-story__body">
                            Rosa runs the comal; Sal runs the window; the kids run the
                            register on weekends. Everything from scratch, small batches,
                            the slow way. If the line's long, that's why — and it's worth
                            it.
                        </p>
                    </div>
                    <div className="mptacos-stats">
                        {STATS.map((s) => (
                            <div key={s.k} className="mptacos-stat">
                                <div className="mptacos-stat__v">{s.v}</div>
                                <div className="mptacos-stat__k">
                                    {s.note ? (
                                        <Tooltip content={s.note} placement="top" className="mptacos-tip">
                                            <span className="mptacos-stat__note">{s.k}</span>
                                        </Tooltip>
                                    ) : (
                                        s.k
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* ── Schedule ────────────────────────────────────────────── */}
                <section id="mptacos-schedule" className="mptacos-sched" aria-labelledby="mptacos-sched-title">
                    <h2 id="mptacos-sched-title" className="mptacos-h2 mptacos-sched__title">Find the truck</h2>
                    <div className="mptacos-sched__card">
                        {SCHEDULE.map((s, i) => (
                            <div
                                key={s.day}
                                className={`mptacos-sched__row${i === todayIdx ? " mptacos-sched__row--today" : ""}`}
                            >
                                <span className="mptacos-sched__day">
                                    {s.day}
                                    {i === todayIdx && (
                                        <Badge size="sm" variant="solid" className="mptacos-today">
                                            Today
                                        </Badge>
                                    )}
                                </span>
                                <span className="mptacos-sched__place">{s.place}</span>
                                <span className="mptacos-sched__hours">{s.hours}</span>
                            </div>
                        ))}
                    </div>
                </section>
            </div>

            {/* ── Footer band ─────────────────────────────────────────────── */}
            <footer className="mptacos-footer">
                <div className="mptacos-footer__in">
                    <span className="mptacos-footer__brand">Mom-n-Pops Taquería</span>
                    <span className="mptacos-footer__contact">
                        hello<span>@</span>momnpops.truck · @momnpops.mke
                    </span>
                    <span>© 2026 · Rosa &amp; Sal · Milwaukee</span>
                </div>
                <div className="mptacos-footer__folio">
                    Mom-n-Pops — a fictional food truck, for demonstration · Style {style.num} / Taquería
                </div>
            </footer>

            {/* ── Taco detail modal ───────────────────────────────────────── */}
            <Modal
                open={open}
                onClose={closeTaco}
                size="sm"
                className="mptacos-modal"
                aria-label={sel ? `${sel.name} — details` : "Taco details"}
            >
                {sel && (
                    <>
                        <div className="mptacos-modal__head">
                            <span className="mptacos-modal__tile" aria-hidden>{sel.icon}</span>
                            <div>
                                <h2 className="mptacos-modal__name">{sel.name}</h2>
                                <span className="mptacos-modal__price">{sel.price}</span>
                            </div>
                        </div>
                        <div className="mptacos-modal__body">
                            <p className="mptacos-modal__long">{sel.long}</p>
                            <div className="mptacos-modal__chips">
                                {sel.ingredients.map((ing) => (
                                    <Badge key={ing} variant="outline" size="md" className="mptacos-chip">
                                        {ing}
                                    </Badge>
                                ))}
                            </div>
                            <Button
                                color="red"
                                className="mptacos-btn mptacos-btn--primary mptacos-modal__add"
                                onClick={closeTaco}
                            >
                                Add to order · {sel.price}
                            </Button>
                        </div>
                    </>
                )}
            </Modal>
        </div>
    );
}
