import "./gyros.css";
import { useMemo, useRef, useState } from "react";
import { Badge, Button, Card, Heading, Text } from "@particle-academy/react-fancy";
import type { RefObject } from "react";
import type { Style } from "../../types";

/**
 * Inspiration Gallery · Mom-n-Pops style 06 — Gyros (Greek · Configurator).
 *
 * The same Milwaukee family truck as a Greek-blue storefront: a Greek-key
 * meander band over flag blue, Georgia serif display with antique-gold
 * accents, a "Yiayia's recipe" quote card in a gold offset picture frame, and
 * — the special surface — a four-step BUILD-YOUR-PLATE configurator whose
 * chips flip solid blue and whose sticky order summary prices as you go.
 * Restyled Fancy primitives carry every interactive surface: Button wears the
 * chips + CTAs, Card wears the step/menu/schedule/summary panels, Badge the
 * gold lockup tag + mono eyebrows, Heading/Text the serif display + ledes.
 *
 * Mounted by Inspiration/Show.tsx for mom-n-pops `style.id === "gyros"`.
 * SSR-safe: no browser APIs during render, pricing fully derived from one
 * controlled `plate` state object (no imperative paint() DOM walking like the
 * mockup), scrolling via refs inside event handlers only. Two deliberate
 * fixes over the mockup: the "Extra of all" sauce now actually charges its
 * advertised +$1, and "Add to order" appends to a small on-ticket list so the
 * button does something observable.
 */

/* ── Configurator data ───────────────────────────────────────────────────── */

type Plate = {
    form: string;
    protein: string;
    sides: string[];
    sauce: string;
};

type SingleKey = "form" | "protein" | "sauce";

type ChipSpec = { label: string; plus?: string };

const FORMAT_OPTIONS: ChipSpec[] = [
    { label: "Pita wrap" },
    { label: "Plate", plus: "+$4" },
];

const PROTEIN_OPTIONS: ChipSpec[] = [
    { label: "Pork" },
    { label: "Chicken" },
    { label: "Lamb & beef", plus: "+$2" },
    { label: "Falafel", plus: "−$1" },
];

const SIDE_OPTIONS = ["Lemon potatoes", "Greek salad", "Lemon rice", "Fries", "Dolmades"];

const SAUCE_OPTIONS: ChipSpec[] = [
    { label: "Tzatziki" },
    { label: "Spicy feta" },
    { label: "Skordalia" },
    { label: "Extra of all", plus: "+$1" },
];

const DEFAULT_PLATE: Plate = {
    form: "Pita wrap",
    protein: "Lamb & beef",
    sides: ["Lemon potatoes"],
    sauce: "Tzatziki",
};

/**
 * Derived pricing — base $10 wrap / $14 plate, +$2 lamb & beef, −$1 falafel,
 * first side included then +$2 each, +$1 for "Extra of all" sauce (the
 * mockup advertised that dollar on the chip but never charged it — fixed).
 */
function platePrice(plate: Plate): number {
    let total = plate.form === "Plate" ? 14 : 10;
    if (plate.protein === "Lamb & beef") total += 2;
    if (plate.protein === "Falafel") total -= 1;
    total += Math.max(0, plate.sides.length - 1) * 2;
    if (plate.sauce === "Extra of all") total += 1;
    return total;
}

/* ── Menu + schedule content (verbatim from the design) ──────────────────── */

const MENU = [
    { name: "Pork Gyro", price: "$10", short: "Spit pork, tzatziki, tomato, onion, fries inside." },
    { name: "Lamb Gyro", price: "$12", short: "Yiayia's lamb-and-beef blend. The signature." },
    { name: "Souvlaki Plate", price: "$14", short: "Grilled skewers, rice, lemon potatoes, salad." },
    { name: "Falafel Pita", price: "$9", short: "Chickpea falafel, hummus, tahini — vegan." },
    { name: "Chicken Gyro", price: "$10", short: "Lemon-oregano chicken, tzatziki, pita." },
    { name: "Horiatiki Salad", price: "$8", short: "Tomato, cucumber, olives, feta slab." },
];

const SCHEDULE = [
    { day: "Monday", place: "Cathedral Square Park", hours: "11–3" },
    { day: "Tuesday", place: "Marquette — Wells St", hours: "11–3" },
    { day: "Wednesday", place: "East Side — Downer Ave", hours: "5–9" },
    { day: "Thursday", place: "Brady Street", hours: "5–9" },
    { day: "Friday", place: "Third Ward Riverwalk", hours: "11–3 · 5–9" },
    { day: "Saturday", place: "Greek Fest / South Shore", hours: "10–4" },
];

/* ── Small pieces ────────────────────────────────────────────────────────── */

/** One configurator option — a react-fancy Button wearing the chip idiom. */
function Chip({
    label,
    plus,
    on,
    onPick,
}: {
    label: string;
    plus?: string;
    on: boolean;
    onPick: () => void;
}) {
    return (
        <Button
            type="button"
            className={`mpgyros-chip${on ? " mpgyros-chip--on" : ""}`}
            aria-pressed={on}
            onClick={onPick}
        >
            {label}
            {plus ? <span className="mpgyros-chip-plus">{plus}</span> : null}
        </Button>
    );
}

/** Scroll a section into view — refs + handlers only, never during render. */
function scrollToSection(ref: RefObject<HTMLElement | null>): void {
    ref.current?.scrollIntoView({ behavior: "smooth", block: "start" });
}

type TicketLine = { name: string; price: number };

/* ── Page ────────────────────────────────────────────────────────────────── */

export default function Gyros({ style }: { style: Style }) {
    const [plate, setPlate] = useState<Plate>(DEFAULT_PLATE);
    const [ticket, setTicket] = useState<TicketLine[]>([]);

    const buildRef = useRef<HTMLElement>(null);
    const menuRef = useRef<HTMLElement>(null);
    const findRef = useRef<HTMLElement>(null);

    const price = useMemo(() => platePrice(plate), [plate]);
    const orderName = `${plate.protein} ${plate.form}`;
    const ticketTotal = useMemo(
        () => ticket.reduce((sum, line) => sum + line.price, 0),
        [ticket],
    );

    const pick = (key: SingleKey, label: string) =>
        setPlate((p) => ({ ...p, [key]: label }));

    const toggleSide = (side: string) =>
        setPlate((p) => ({
            ...p,
            sides: p.sides.includes(side)
                ? p.sides.filter((s) => s !== side)
                : [...p.sides, side],
        }));

    const addToOrder = () =>
        setTicket((t) => [...t, { name: orderName, price }]);

    const steps: {
        n: number;
        label: string;
        chips: { label: string; plus?: string; on: boolean; onPick: () => void }[];
    }[] = [
        {
            n: 1,
            label: "Format",
            chips: FORMAT_OPTIONS.map((o) => ({
                ...o,
                on: plate.form === o.label,
                onPick: () => pick("form", o.label),
            })),
        },
        {
            n: 2,
            label: "Protein",
            chips: PROTEIN_OPTIONS.map((o) => ({
                ...o,
                on: plate.protein === o.label,
                onPick: () => pick("protein", o.label),
            })),
        },
        {
            n: 3,
            label: "Sides (1 included)",
            chips: SIDE_OPTIONS.map((side) => ({
                label: side,
                on: plate.sides.includes(side),
                onPick: () => toggleSide(side),
            })),
        },
        {
            n: 4,
            label: "Sauce",
            chips: SAUCE_OPTIONS.map((o) => ({
                ...o,
                on: plate.sauce === o.label,
                onPick: () => pick("sauce", o.label),
            })),
        },
    ];

    const summary = [
        { label: "Format", value: plate.form },
        { label: "Protein", value: plate.protein },
        { label: "Sides", value: `${plate.sides.length} picked` },
        { label: "Sauce", value: plate.sauce },
    ];

    return (
        <div className="mpgyros-root">
            {/* ── Greek-key meander band ─────────────────────────────────── */}
            <div className="mpgyros-keyband" aria-hidden="true">
                <div className="mpgyros-key mpgyros-key--band" />
            </div>

            {/* ── Sticky blurred header ──────────────────────────────────── */}
            <header className="mpgyros-header">
                <div className="mpgyros-header-inner">
                    <div className="mpgyros-lockup">
                        <span className="mpgyros-lockup-name">Mom-n-Pops</span>
                        <Badge className="mpgyros-lockup-tag" size="sm">
                            Gyros
                        </Badge>
                    </div>
                    <nav className="mpgyros-nav" aria-label="Site">
                        <button type="button" className="mpgyros-navlink" onClick={() => scrollToSection(menuRef)}>
                            Menu
                        </button>
                        <button type="button" className="mpgyros-navlink" onClick={() => scrollToSection(buildRef)}>
                            Build a plate
                        </button>
                        <button type="button" className="mpgyros-navlink" onClick={() => scrollToSection(findRef)}>
                            Find us
                        </button>
                        <Button
                            type="button"
                            className="mpgyros-btn mpgyros-btn--solid mpgyros-btn--pill"
                            onClick={() => scrollToSection(findRef)}
                        >
                            Find the truck
                        </Button>
                    </nav>
                </div>
            </header>

            <div className="mpgyros-shell">
                {/* ── Hero: bilingual greeting + Yiayia's framed quote ────── */}
                <section className="mpgyros-hero" aria-labelledby="mpgyros-hero-title">
                    <div>
                        <div className="mpgyros-greeting">Καλῶς ἤλθατε — welcome</div>
                        <Heading as="h1" id="mpgyros-hero-title" className="mpgyros-h1">
                            Gyros carved off the spit, the old-country way.
                        </Heading>
                        <Text as="p" className="mpgyros-lede">
                            Pork and lamb stacked and turned all day, warm pita off the
                            flat-top, tzatziki Rosa strains overnight. Build your own plate
                            below.
                        </Text>
                        <div className="mpgyros-hero-ctas">
                            <Button
                                type="button"
                                className="mpgyros-btn mpgyros-btn--solid"
                                onClick={() => scrollToSection(buildRef)}
                            >
                                Build a plate
                            </Button>
                            <Button
                                type="button"
                                className="mpgyros-btn mpgyros-btn--outline"
                                onClick={() => scrollToSection(menuRef)}
                            >
                                See the menu
                            </Button>
                        </div>
                    </div>

                    <div className="mpgyros-quote-wrap">
                        <div className="mpgyros-quote-frame" aria-hidden="true" />
                        <Card variant="elevated" padding="none" className="mpgyros-quote-card">
                            <Badge className="mpgyros-eyebrow" size="sm">
                                Yiayia's recipe
                            </Badge>
                            <div className="mpgyros-quote">"Don't rush the spit."</div>
                            <p className="mpgyros-quote-body">
                                Sal's grandmother ran a taverna outside Thessaloniki. When we
                                opened in 2026, she mailed over the marinade and that one
                                instruction. So it turns all day, and we carve to order.
                            </p>
                        </Card>
                    </div>
                </section>

                {/* ── Build your plate — the configurator surface ─────────── */}
                <section ref={buildRef} className="mpgyros-build" aria-labelledby="mpgyros-build-title">
                    <div className="mpgyros-build-grid">
                        <div>
                            <div className="mpgyros-key mpgyros-key--divider" aria-hidden="true" />
                            <Heading as="h2" id="mpgyros-build-title" className="mpgyros-h2">
                                Build your plate
                            </Heading>
                            <Text as="p" className="mpgyros-build-sub">
                                Four choices — it prices as you go.
                            </Text>

                            {steps.map((step) => (
                                <Card key={step.n} variant="outlined" padding="none" className="mpgyros-step">
                                    <div className="mpgyros-step-head">
                                        <span className="mpgyros-step-num" aria-hidden="true">
                                            {step.n}
                                        </span>
                                        <span className="mpgyros-step-label">{step.label}</span>
                                    </div>
                                    <div className="mpgyros-chips" role="group" aria-label={step.label}>
                                        {step.chips.map((chip) => (
                                            <Chip
                                                key={chip.label}
                                                label={chip.label}
                                                plus={chip.plus}
                                                on={chip.on}
                                                onPick={chip.onPick}
                                            />
                                        ))}
                                    </div>
                                </Card>
                            ))}
                        </div>

                        {/* Sticky priced order summary */}
                        <aside className="mpgyros-rail" aria-label="Your order">
                            <Card variant="elevated" padding="none" className="mpgyros-summary">
                                <Card.Header className="mpgyros-summary-head">
                                    <div className="mpgyros-summary-eyebrow">Your order</div>
                                    <div className="mpgyros-summary-name">{orderName}</div>
                                </Card.Header>
                                <Card.Body className="mpgyros-summary-body">
                                    {summary.map((row) => (
                                        <div key={row.label} className="mpgyros-summary-row">
                                            <span className="mpgyros-summary-label">{row.label}</span>
                                            <span className="mpgyros-summary-value">{row.value}</span>
                                        </div>
                                    ))}
                                    <div className="mpgyros-total-row">
                                        <span className="mpgyros-total-label">Total</span>
                                        <span className="mpgyros-total">${price}</span>
                                    </div>
                                    <Button
                                        type="button"
                                        className="mpgyros-btn mpgyros-btn--solid mpgyros-btn--add"
                                        onClick={addToOrder}
                                    >
                                        Add to order · ${price}
                                    </Button>

                                    {ticket.length > 0 && (
                                        <div className="mpgyros-ticket">
                                            <div className="mpgyros-ticket-head">
                                                <span>On the ticket</span>
                                                <button
                                                    type="button"
                                                    className="mpgyros-ticket-clear"
                                                    onClick={() => setTicket([])}
                                                >
                                                    Clear
                                                </button>
                                            </div>
                                            {ticket.map((line, i) => (
                                                <div key={`${line.name}-${i}`} className="mpgyros-ticket-row">
                                                    <span>{line.name}</span>
                                                    <span className="mpgyros-ticket-price">${line.price}</span>
                                                </div>
                                            ))}
                                            <div className="mpgyros-ticket-total">
                                                <span>
                                                    Ticket · {ticket.length} {ticket.length === 1 ? "item" : "items"}
                                                </span>
                                                <span className="mpgyros-ticket-sum">${ticketTotal}</span>
                                            </div>
                                        </div>
                                    )}
                                </Card.Body>
                            </Card>
                        </aside>
                    </div>
                </section>

                {/* ── Or a house favorite — the classic menu grid ─────────── */}
                <section ref={menuRef} className="mpgyros-menu" aria-labelledby="mpgyros-menu-title">
                    <div className="mpgyros-menu-head">
                        <Heading as="h2" id="mpgyros-menu-title" className="mpgyros-h2 mpgyros-h2--menu">
                            Or a house favorite
                        </Heading>
                    </div>
                    <div className="mpgyros-menu-grid">
                        {MENU.map((item) => (
                            <Card key={item.name} variant="outlined" padding="none" className="mpgyros-menu-card">
                                <div className="mpgyros-menu-top">
                                    <span className="mpgyros-menu-name">{item.name}</span>
                                    <span className="mpgyros-menu-price">{item.price}</span>
                                </div>
                                <p className="mpgyros-menu-desc">{item.short}</p>
                            </Card>
                        ))}
                    </div>
                </section>

                {/* ── Find us — the Milwaukee weekly route ────────────────── */}
                <section ref={findRef} className="mpgyros-find" aria-labelledby="mpgyros-find-title">
                    <Heading as="h2" id="mpgyros-find-title" className="mpgyros-h2 mpgyros-h2--find">
                        Ποῦ θὰ μᾶς βρεῖτε — find us
                    </Heading>
                    <Card variant="outlined" padding="none" className="mpgyros-sched">
                        {SCHEDULE.map((stop) => (
                            <div key={stop.day} className="mpgyros-sched-row">
                                <span className="mpgyros-sched-day">{stop.day}</span>
                                <span className="mpgyros-sched-place">{stop.place}</span>
                                <span className="mpgyros-sched-hours">{stop.hours}</span>
                            </div>
                        ))}
                    </Card>
                </section>
            </div>

            {/* ── Footer — bilingual bookend ─────────────────────────────── */}
            <footer className="mpgyros-footer">
                <div className="mpgyros-footer-inner">
                    <span className="mpgyros-footer-brand">Mom-n-Pops Gyros</span>
                    <span>
                        hello<span>@</span>momnpops.truck · @momnpops.mke
                    </span>
                    <span>© 2026 · Milwaukee · Εὐχαριστοῦμε</span>
                </div>
                <div className="mpgyros-footer-note">
                    Mom-n-Pops is fictional — style {style.num} / {style.name} of the Fancy
                    UI Inspiration Gallery.
                </div>
            </footer>
        </div>
    );
}
