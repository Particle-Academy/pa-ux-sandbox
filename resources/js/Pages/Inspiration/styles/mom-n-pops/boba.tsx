import "./boba.css";

import { Link } from "@inertiajs/react";
import { useEffect, useRef, useState } from "react";
import { Badge, Button, Card, Navbar, Table } from "@particle-academy/react-fancy";
import type { Style } from "../../types";

/**
 * Inspiration Gallery · Mom-n-Pops style 19 — Boba.
 *
 * Rosa & Sal's bubble-tea window as a Y2K pastel candy site: a full-page
 * pink→lavender→sky gradient with two blurred blob shapes morphing behind
 * everything, frosted-glass cards floating on top, 999px pills everywhere,
 * and one hot-pink→violet gradient doing every accent job (wordmark suffix,
 * H1 text clip, selected chips, prices, CTAs). No founder-story section —
 * this truck sells freshness + build-it-yourself agency instead of heritage.
 *
 * The special surface is the BUILD-YOUR-BOBA configurator: four single-select
 * chip groups (Tea base / Milk / Sweetness / Topping) feeding a live summary
 * rail — cup name, description, and a computed price that all read from ONE
 * shared priceFor() function so the summary card, the Add-to-order button,
 * and any future configure_drink MCP bridge always report the same number.
 * The mockup's imperative paint() DOM repaint is replaced with declarative
 * selected-state styling via data-on + a .15s transition.
 *
 * Restyled Fancy primitives: Navbar (the frosted sticky header — brand slot +
 * section-link items + the "🧋 n" order Badge), Button (gradient + white hero
 * pills, every option chip, the Add-to-order bar), Badge (the "SHAKEN FRESH"
 * hero pill + the header order-count pill), Card (the glass configurator shell,
 * the white "Your cup" summary, six frosted menu favorites), Table (the "Find
 * the truck" schedule — day / place / hours). The morphing blobs, gradient text
 * clips, and the frosted-glass surface treatment are hand-rolled — no primitive
 * owns those. Each chip carries stable data-group/data-opt handles so an agent
 * can drive the configurator without guessing DOM.
 *
 * Mounted by Inspiration/Show.tsx for `style.id === "boba"`. SSR-safe: no
 * browser globals outside event handlers/effects, no randomness, the only
 * timer (the "added" flash) lives in useEffect with cleanup, and first paint
 * is deterministic (default cup, empty order). Section jumps use refs +
 * scrollIntoView with CSS scroll-margin-top clearing the sticky chrome.
 * Sticky header sits at z-index 20, under the gallery frame.
 */

type OptionKey = "base" | "milk" | "sweet" | "top";

type Cup = Record<OptionKey, string>;

type StepDef = {
    key: OptionKey;
    label: string;
    opts: string[];
};

/** The four configurator groups, straight from the truck's build card. */
const STEPS: StepDef[] = [
    { key: "base", label: "Tea base", opts: ["Black Milk Tea", "Classic", "Taro", "Matcha"] },
    { key: "milk", label: "Milk", opts: ["Whole milk", "Oat milk", "None"] },
    { key: "sweet", label: "Sweetness", opts: ["0%", "25%", "50%", "75%", "100%"] },
    {
        key: "top",
        label: "Topping",
        opts: ["Tapioca pearls", "Brown sugar boba", "Popping boba", "Lychee jelly", "Cheese foam"],
    },
];

/** Rosa's default pour — the OG cup. */
const DEFAULT_CUP: Cup = {
    base: "Black Milk Tea",
    milk: "Whole milk",
    sweet: "50%",
    top: "Tapioca pearls",
};

/**
 * Single source of truth for the cup price: $5 base, +$0.75 for brown-sugar
 * or popping boba, +$1 for cheese foam, +$0.50 for a Taro or Matcha base.
 * The summary card, the Add-to-order label, and any agent bridge all call
 * this same function so the number can never drift.
 */
function priceFor(cup: Cup): number {
    let p = 5;
    if (cup.top === "Brown sugar boba" || cup.top === "Popping boba") {
        p += 0.75;
    }
    if (cup.top === "Cheese foam") {
        p += 1;
    }
    if (cup.base === "Taro" || cup.base === "Matcha") {
        p += 0.5;
    }
    return p;
}

type MenuItem = { name: string; price: string; short: string };

const MENU: MenuItem[] = [
    { name: "Brown Sugar Milk Tea", price: "$6", short: "Tiger-striped, warm brown sugar boba." },
    { name: "Classic Milk Tea", price: "$5", short: "The OG — black tea, milk, pearls." },
    { name: "Taro Milk Tea", price: "$6", short: "Real steamed taro, creamy, purple." },
    { name: "Matcha Latte", price: "$6", short: "Ceremonial matcha, oat option." },
    { name: "Strawberry Fruit Tea", price: "$6", short: "Real berries, green tea, popping boba." },
    { name: "Mango Green Tea", price: "$6", short: "Mango, jasmine green tea, lychee jelly." },
];

type Stop = { day: string; place: string; hours: string };

const SCHEDULE: Stop[] = [
    { day: "Tuesday", place: "Marquette — Wells St", hours: "12–8" },
    { day: "Wednesday", place: "East Side — Downer Ave", hours: "12–9" },
    { day: "Thursday", place: "UWM campus", hours: "12–9" },
    { day: "Friday", place: "Third Ward Riverwalk", hours: "12–10" },
    { day: "Saturday", place: "Night Market — Bronzeville", hours: "4–11" },
    { day: "Sunday", place: "Bay View — KK Ave", hours: "12–8" },
];

export default function Boba({ style }: { style: Style }) {
    const [cup, setCup] = useState<Cup>(DEFAULT_CUP);
    const [orderCount, setOrderCount] = useState(0);
    const [justAdded, setJustAdded] = useState(false);

    const buildRef = useRef<HTMLElement | null>(null);
    const menuRef = useRef<HTMLElement | null>(null);
    const findRef = useRef<HTMLElement | null>(null);

    /* The "added ✦" flash fades itself out; timer restarts on every add and
       cleans up on unmount. */
    useEffect(() => {
        if (orderCount === 0) {
            return;
        }
        const t = setTimeout(() => setJustAdded(false), 2400);
        return () => clearTimeout(t);
    }, [orderCount]);

    const pick = (key: OptionKey, value: string) => {
        setCup((c) => ({ ...c, [key]: value }));
    };

    const addToOrder = () => {
        setOrderCount((n) => n + 1);
        setJustAdded(true);
    };

    const jumpTo = (ref: { current: HTMLElement | null }) => () => {
        ref.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    };

    const price = priceFor(cup);
    const cupPrice = `$${price.toFixed(2)}`;
    const cupName = `${cup.base} ✦ ${cup.top}`;
    const cupDesc = `${cup.milk} · ${cup.sweet} sweet`;

    return (
        <div className="mpboba-root">
            {/* Morphing pastel blobs behind everything (pure CSS motion). */}
            <div className="mpboba-blob mpboba-blob--pink" aria-hidden />
            <div className="mpboba-blob mpboba-blob--sky" aria-hidden />

            <div className="mpboba-page">
                {/* ── Frosted sticky header — restyled Navbar ───────────── */}
                <Navbar className="mpboba-header">
                    <Navbar.Brand className="mpboba-brand-wrap">
                        <Link href="/inspiration/mom-n-pops" className="mpboba-brand">
                            <span className="mpboba-brand__name">Mom-n-Pops</span>
                            <span className="mpboba-brand__sub">Boba ✦</span>
                        </Link>
                    </Navbar.Brand>
                    <Navbar.Items className="mpboba-nav">
                        <button type="button" className="mpboba-nav__link" onClick={jumpTo(buildRef)}>
                            Build a drink
                        </button>
                        <button type="button" className="mpboba-nav__link" onClick={jumpTo(menuRef)}>
                            Menu
                        </button>
                        <button type="button" className="mpboba-nav__link" onClick={jumpTo(findRef)}>
                            Find us
                        </button>
                        {orderCount > 0 && (
                            <Badge
                                className="mpboba-cart"
                                aria-label={`${orderCount} ${orderCount === 1 ? "cup" : "cups"} in your order`}
                            >
                                🧋 {orderCount}
                            </Badge>
                        )}
                    </Navbar.Items>
                </Navbar>

                <main className="mpboba-main">
                    {/* ── Hero ──────────────────────────────────────────── */}
                    <section className="mpboba-hero">
                        <div className="mpboba-hero__copy">
                            <Badge className="mpboba-heropill" size="md">
                                ✦ SHAKEN FRESH · MILWAUKEE · 2026 ✦
                            </Badge>
                            <h1 className="mpboba-h1">Boba, built your way.</h1>
                            <p className="mpboba-lede">
                                Real brewed tea, chewy tapioca, sealed and shaken to order. Mix your perfect cup
                                in the builder below.
                            </p>
                            <div className="mpboba-cta">
                                <Button className="mpboba-btn mpboba-btn--grad" onClick={jumpTo(buildRef)}>
                                    Build a drink ✦
                                </Button>
                                <Button className="mpboba-btn mpboba-btn--white" onClick={jumpTo(menuRef)}>
                                    See favorites
                                </Button>
                            </div>
                        </div>
                        <div className="mpboba-hero__art" aria-hidden>
                            <div className="mpboba-heroblob">🧋</div>
                        </div>
                    </section>

                    {/* ── Build-your-boba configurator ──────────────────── */}
                    <section className="mpboba-build" ref={buildRef} aria-labelledby="mpboba-build-title">
                        <Card className="mpboba-builder" variant="outlined" padding="none">
                            <div className="mpboba-builder__grid">
                                <div className="mpboba-steps">
                                    <div className="mpboba-steps__head">
                                        <span className="mpboba-steps__glyph" aria-hidden>
                                            ✦
                                        </span>
                                        <div>
                                            <div className="mpboba-steps__title" id="mpboba-build-title">
                                                Build-your-boba
                                            </div>
                                            <div className="mpboba-steps__sub">tap the options — it mixes as you go</div>
                                        </div>
                                    </div>

                                    {STEPS.map((step) => (
                                        <div className="mpboba-group" key={step.key} role="group" aria-label={step.label}>
                                            <div className="mpboba-group__label">{step.label}</div>
                                            <div className="mpboba-group__chips">
                                                {step.opts.map((opt) => {
                                                    const on = cup[step.key] === opt;
                                                    return (
                                                        <Button
                                                            key={opt}
                                                            className="mpboba-chip"
                                                            data-group={step.key}
                                                            data-opt={opt}
                                                            data-on={on ? "true" : "false"}
                                                            aria-pressed={on}
                                                            onClick={() => pick(step.key, opt)}
                                                        >
                                                            {opt}
                                                        </Button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="mpboba-rail">
                                    <Card className="mpboba-cup" variant="flat" padding="none">
                                        <div className="mpboba-cup__label">Your cup</div>
                                        <div className="mpboba-cup__name">{cupName}</div>
                                        <div className="mpboba-cup__desc">{cupDesc}</div>
                                        <div className="mpboba-cup__pricerow">
                                            <span className="mpboba-cup__pricelabel">Price</span>
                                            <span className="mpboba-cup__price">{cupPrice}</span>
                                        </div>
                                    </Card>
                                    <Button className="mpboba-add" onClick={addToOrder}>
                                        Add to order · {cupPrice}
                                    </Button>
                                    <div className="mpboba-added" data-show={justAdded ? "true" : "false"} aria-live="polite">
                                        {orderCount > 0
                                            ? `✦ Added — ${orderCount} ${orderCount === 1 ? "cup" : "cups"} in your order`
                                            : ""}
                                    </div>
                                </div>
                            </div>
                        </Card>
                    </section>

                    {/* ── House favorites ───────────────────────────────── */}
                    <section className="mpboba-menu" ref={menuRef} aria-labelledby="mpboba-menu-title">
                        <h2 className="mpboba-h2" id="mpboba-menu-title">
                            Or a house favorite
                        </h2>
                        <div className="mpboba-menu__grid">
                            {MENU.map((m) => (
                                <Card className="mpboba-menucard" variant="outlined" padding="none" key={m.name}>
                                    <div className="mpboba-menucard__row">
                                        <span className="mpboba-menucard__name">{m.name}</span>
                                        <span className="mpboba-menucard__price">{m.price}</span>
                                    </div>
                                    <p className="mpboba-menucard__short">{m.short}</p>
                                </Card>
                            ))}
                        </div>
                    </section>

                    {/* ── Find the truck ────────────────────────────────── */}
                    <section className="mpboba-find" ref={findRef} aria-labelledby="mpboba-find-title">
                        <h2 className="mpboba-h3" id="mpboba-find-title">
                            Find the truck
                        </h2>
                        <Table className="mpboba-sched">
                            <Table.Body>
                                {SCHEDULE.map((s) => (
                                    <Table.Row key={s.day}>
                                        <Table.Cell className="mpboba-sched__day">{s.day}</Table.Cell>
                                        <Table.Cell className="mpboba-sched__place">{s.place}</Table.Cell>
                                        <Table.Cell className="mpboba-sched__hours">{s.hours}</Table.Cell>
                                    </Table.Row>
                                ))}
                            </Table.Body>
                        </Table>
                    </section>
                </main>

                {/* ── Footer ────────────────────────────────────────────── */}
                <footer className="mpboba-footer">
                    <div className="mpboba-footer__in">
                        <span className="mpboba-footer__brand">Mom-n-Pops Boba ✦</span>
                        <span className="mpboba-footer__contact">
                            hello<span>@</span>momnpops.truck · @momnpops.mke
                        </span>
                        <span>© 2026 · Milwaukee</span>
                    </div>
                    <div className="mpboba-footer__folio">
                        <span className="mpboba-footer__note">
                            Mom-n-Pops — a fictional truck, for demonstration · Style {style.num} / {style.name}
                        </span>
                        <Link href="/inspiration/mom-n-pops" className="mpboba-footer__back">
                            ← Back to the trucks
                        </Link>
                    </div>
                </footer>
            </div>
        </div>
    );
}
