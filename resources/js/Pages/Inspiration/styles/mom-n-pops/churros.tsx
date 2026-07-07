import "./churros.css";
import { Link } from "@inertiajs/react";
import { useEffect, useState } from "react";
import { Badge, Button, Card, Heading } from "@particle-academy/react-fancy";
import type { Style } from "../../types";

/**
 * Mom-n-Pops · Style 18 — Churros (carnival marquee storefront, dark mode).
 *
 * The family food truck as a state-fair midway booth after dark: deep maroon
 * page (#3A0E12), cream type (#FBEFD8), one carnival-gold accent (#F4A825)
 * doing every job — CTAs, the plaque heading, borders, prices, the badge —
 * and a red/cream striped awning bar across the very top. THE signature
 * surface is the hero's marquee-light frame: a 3px gold border whose top edge
 * carries a string of CSS radial-gradient light bulbs blinking in two
 * alternating phases (the classic marquee chase), guarded by
 * prefers-reduced-motion. No photos anywhere — emoji posters in inset panels
 * (🥨 in the marquee, 🎡 in the story) with mono captions stand in for
 * photography.
 *
 * Fancy primitives worn by the design: Button (gold-filled + maroon-outlined
 * midway CTAs), Badge (the gold "★ Step right up ★" pill + the live "Today"
 * schedule marker), Card (the six Midway Menu cards), Heading (the inverted
 * gold plaque h2 + section titles). The marquee frame, awning stripe, and
 * schedule list are hand-rolled — no primitive wears those shapes.
 *
 * Mounted by Inspiration/Show.tsx for mom-n-pops / `style.id === "churros"`.
 * The mockup's DCLogic held no state at all — its two scroll CTAs become
 * anchor-mode Buttons + scroll-margin-top (no window.scrollBy needed).
 * SSR-safe: all data static, the only browser dependence is the "Today"
 * schedule highlight, computed in a useEffect after hydration so the first
 * paint is deterministic; the bulb blink is pure CSS.
 */

type MenuItem = {
    icon: string;
    name: string;
    price: string;
    short: string;
};

const MENU: MenuItem[] = [
    { icon: "🥨", name: "Classic Churros", price: "$5", short: "Five, rolled in cinnamon sugar, chocolate to dunk." },
    { icon: "🍫", name: "Chocolate-Dipped", price: "$6", short: "Half-dipped in dark chocolate, sprinkles." },
    { icon: "🍮", name: "Dulce de Leche", price: "$6", short: "Filled with warm dulce de leche." },
    { icon: "🍨", name: "Churro Sundae", price: "$8", short: "Over vanilla custard, chocolate, caramel." },
    { icon: "🧂", name: "Cinnamon Bites", price: "$5", short: "A cup of poppable bites, choice of dip." },
    { icon: "☕", name: "Mexican Hot Chocolate", price: "$4", short: "Thick, cinnamon, a little chili warmth." },
];

/** `jsDays` maps each row to JS getDay() values (Sun=0 … Sat=6) for "Today". */
const SCHEDULE: { day: string; place: string; hours: string; jsDays: number[] }[] = [
    { day: "Wednesday", place: "Humboldt Park", hours: "4–9", jsDays: [3] },
    { day: "Thursday", place: "Brady Street", hours: "4–10", jsDays: [4] },
    { day: "Friday", place: "Third Ward Riverwalk", hours: "3–10", jsDays: [5] },
    { day: "Saturday", place: "State Fair Park / Summerfest", hours: "12–10", jsDays: [6] },
    { day: "Sunday", place: "South Shore Park", hours: "12–8", jsDays: [0] },
    { day: "Mon–Tue", place: "Private events", hours: "—", jsDays: [1, 2] },
];

export default function Churros({ style }: { style: Style }) {
    /** Row index of today's booth stop; -1 until hydrated (deterministic SSR). */
    const [todayIdx, setTodayIdx] = useState(-1);
    useEffect(() => {
        const day = new Date().getDay();
        setTodayIdx(SCHEDULE.findIndex((row) => row.jsDays.includes(day)));
    }, []);

    return (
        <div className="mpchurros-root">
            {/* ── Carnival awning stripe — one repeating-linear-gradient ──── */}
            <div className="mpchurros-awning" aria-hidden />

            {/* ── Sticky maroon header, gold bottom rule (z-index < 30) ───── */}
            <header className="mpchurros-header">
                <div className="mpchurros-header__in">
                    <Link href="/inspiration/mom-n-pops" className="mpchurros-brand">
                        <span className="mpchurros-brand__name">Mom-n-Pops</span>
                        <span className="mpchurros-brand__desc">Churros</span>
                    </Link>
                    <nav className="mpchurros-nav" aria-label="Site">
                        <a href="#mpchurros-menu" className="mpchurros-nav__link">Menu</a>
                        <a href="#mpchurros-story" className="mpchurros-nav__link">Story</a>
                        <a href="#mpchurros-find" className="mpchurros-nav__link">Find us</a>
                    </nav>
                </div>
            </header>

            {/* ── Hero — pitch left, marquee-light frame right ────────────── */}
            <section className="mpchurros-hero" aria-labelledby="mpchurros-hero-title">
                <div className="mpchurros-hero__in">
                    <div className="mpchurros-hero__copy">
                        <Badge className="mpchurros-badge">★ Step right up · Milwaukee · 2026 ★</Badge>
                        <h1 id="mpchurros-hero-title" className="mpchurros-hero__title">
                            Hot, crispy, cinnamon-rolled.
                        </h1>
                        <p className="mpchurros-hero__sub">
                            Fried to order, tossed in cinnamon sugar, dipped in whatever
                            you like. The best part of the fair, parked on your block.
                        </p>
                        <div className="mpchurros-hero__cta">
                            <Button href="#mpchurros-menu" className="mpchurros-btn mpchurros-btn--gold">
                                Get your churros
                            </Button>
                            <Button
                                href="#mpchurros-find"
                                variant="ghost"
                                className="mpchurros-btn mpchurros-btn--outline"
                            >
                                Find the booth
                            </Button>
                        </div>
                    </div>

                    {/* THE signature surface: gold frame + blinking bulb chase */}
                    <div className="mpchurros-marquee">
                        <span className="mpchurros-bulbs" aria-hidden />
                        <div className="mpchurros-marquee__panel">
                            <div className="mpchurros-marquee__emoji" aria-hidden>🥨</div>
                            <div className="mpchurros-marquee__caption">fried the second you order</div>
                        </div>
                    </div>
                </div>
            </section>

            <div className="mpchurros-container">
                {/* ── The Midway Menu — gold plaque over a 3×2 Card grid ──── */}
                <section id="mpchurros-menu" className="mpchurros-menu" aria-labelledby="mpchurros-menu-title">
                    <div className="mpchurros-plaquewrap">
                        <Heading as="h2" id="mpchurros-menu-title" className="mpchurros-plaque">
                            The Midway Menu
                        </Heading>
                    </div>
                    <div className="mpchurros-grid">
                        {MENU.map((m) => (
                            <Card key={m.name} padding="none" className="mpchurros-mcard">
                                <div className="mpchurros-mcard__top">
                                    <span className="mpchurros-mcard__icon" aria-hidden>{m.icon}</span>
                                    <span className="mpchurros-mcard__price">{m.price}</span>
                                </div>
                                <div className="mpchurros-mcard__name">{m.name}</div>
                                <p className="mpchurros-mcard__short">{m.short}</p>
                            </Card>
                        ))}
                    </div>
                </section>

                {/* ── Our story — ferris-wheel poster beside the meet-cute ── */}
                <section id="mpchurros-story" className="mpchurros-story" aria-labelledby="mpchurros-story-title">
                    <div className="mpchurros-story__poster">
                        <div className="mpchurros-story__emoji" aria-hidden>🎡</div>
                        <div className="mpchurros-story__caption">met in a churro line at the State Fair</div>
                    </div>
                    <div className="mpchurros-story__copy">
                        <div className="mpchurros-eyebrow">Our story</div>
                        <h2 id="mpchurros-story-title" className="mpchurros-story__title">
                            We fell in love at the state fair. Obviously.
                        </h2>
                        <p className="mpchurros-story__body">
                            Rosa &amp; Sal met in a churro line at the Wisconsin State
                            Fair and decided the world needed good ones year-round —
                            piped fresh, fried crisp, rolled in cinnamon sugar the
                            second they come out. Milwaukee, since 2026.
                        </p>
                    </div>
                </section>

                {/* ── Find the booth — table-as-list schedule ─────────────── */}
                <section id="mpchurros-find" className="mpchurros-find" aria-labelledby="mpchurros-find-title">
                    <Heading as="h2" id="mpchurros-find-title" className="mpchurros-h2">
                        Find the booth
                    </Heading>
                    <div className="mpchurros-sched">
                        {SCHEDULE.map((s, i) => (
                            <div
                                key={s.day}
                                className={`mpchurros-sched__row${i === todayIdx ? " mpchurros-sched__row--today" : ""}`}
                            >
                                <span className="mpchurros-sched__day">
                                    {s.day}
                                    {i === todayIdx && (
                                        <Badge size="sm" className="mpchurros-today">Today</Badge>
                                    )}
                                </span>
                                <span className="mpchurros-sched__place">{s.place}</span>
                                <span className="mpchurros-sched__hours">{s.hours}</span>
                            </div>
                        ))}
                    </div>
                </section>
            </div>

            {/* ── Footer — gold top rule bookends the header's bottom ─────── */}
            <footer className="mpchurros-footer">
                <div className="mpchurros-footer__in">
                    <span className="mpchurros-footer__brand">Mom-n-Pops Churros</span>
                    <span className="mpchurros-footer__contact">
                        hello<span>@</span>momnpops.truck · @momnpops.mke
                    </span>
                    <span>© 2026 · Milwaukee</span>
                </div>
                <div className="mpchurros-footer__folio">
                    Mom-n-Pops — a fictional food truck, for demonstration · Style {style.num} / Churros
                </div>
            </footer>
        </div>
    );
}
