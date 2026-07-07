import "./poke.css";
import { useMemo, useRef, useState } from "react";
import { Badge, Button, Card, Heading, Text } from "@particle-academy/react-fancy";
import type { RefObject } from "react";
import type { Style } from "../../types";

/**
 * Inspiration Gallery · Mom-n-Pops style 17 — Poke (Hawaiian · Configurator).
 *
 * The Milwaukee family truck as a vacation import: light seafoam page, a
 * full-bleed 160° teal-gradient hero ("Aloha, Milwaukee" in a sunshine-yellow
 * badge, a 🍥 medallion instead of photography), coral pops on the brand
 * suffix, hero CTA, and signature prices. The special surface is a four-step
 * BUILD-YOUR-BOWL configurator — chips flip solid teal while a sticky summary
 * card re-prices live and a procedural "bowl preview" re-scatters fish cubes
 * and edamame pips on every choice. Restyled Fancy primitives carry every
 * interactive surface: Button wears the chips + pill CTAs + Add-to-order,
 * Card wears the step/signature/schedule/summary panels, Badge the aloha
 * hero badge, Heading/Text the 60px sans display + ledes.
 *
 * Mounted by Inspiration/Show.tsx for mom-n-pops `style.id === "poke"`.
 * SSR-safe: the mockup rebuilt #pokecubes with Math.random() + innerHTML on
 * every paint — here the scatter is a pure function of the bowl state (an
 * FNV-1a hash of the selection seeds a mulberry32 PRNG), so the first paint
 * is deterministic, server and client agree, and every selection change
 * still reshuffles the bowl exactly like the original. Scrolling is refs +
 * scrollIntoView inside handlers only; no timers, no browser APIs in render.
 * One deliberate fix over the mockup: "Add to order" was visual-only — here
 * it appends to a small on-ice order list so the CTA does something
 * observable. And "Both fish" now actually shows both fish in the preview
 * (the mockup painted every cube ahi-red).
 */

/* ── Configurator data (verbatim from the design) ────────────────────────── */

type Bowl = {
    base: string;
    protein: string;
    toppings: string[];
    sauce: string;
};

type SingleKey = "base" | "protein" | "sauce";

type ChipSpec = { label: string; plus?: string };

const BASE_OPTIONS: ChipSpec[] = [
    { label: "White rice" },
    { label: "Brown rice" },
    { label: "Salad greens" },
    { label: "Half & half" },
];

const PROTEIN_OPTIONS: ChipSpec[] = [
    { label: "Ahi tuna" },
    { label: "Salmon" },
    { label: "Both fish", plus: "+$2" },
    { label: "Marinated tofu", plus: "−$1" },
];

const TOPPING_OPTIONS = [
    "Edamame",
    "Avocado",
    "Mango",
    "Cucumber",
    "Seaweed salad",
    "Masago",
    "Crispy onion",
    "Jalapeño",
];

const SAUCE_OPTIONS: ChipSpec[] = [
    { label: "Shoyu" },
    { label: "Spicy mayo" },
    { label: "Ginger-sesame" },
    { label: "Ponzu" },
];

const DEFAULT_BOWL: Bowl = {
    base: "White rice",
    protein: "Ahi tuna",
    toppings: ["Edamame", "Avocado"],
    sauce: "Shoyu",
};

/** Derived pricing — $12 base, +$2 both fish, −$1 tofu, 2 toppings free then +75¢. */
function bowlPrice(bowl: Bowl): number {
    let total = 12;
    if (bowl.protein === "Both fish") total += 2;
    if (bowl.protein === "Marinated tofu") total -= 1;
    total += Math.max(0, bowl.toppings.length - 2) * 0.75;
    return total;
}

/* ── Signatures + schedule content (verbatim from the design) ────────────── */

const SIGNATURES = [
    { name: "Classic Ahi", price: "$13", short: "Ahi, shoyu, avocado, edamame, crispy onion." },
    { name: "Spicy Salmon", price: "$13", short: "Salmon, spicy mayo, mango, jalapeño." },
    { name: "Tofu Aloha", price: "$11", short: "Marinated tofu, ginger-sesame — vegan." },
];

const SCHEDULE = [
    { day: "Monday", place: "Cathedral Square Park", hours: "11–3" },
    { day: "Tuesday", place: "Marquette — Wells St", hours: "11–3" },
    { day: "Wednesday", place: "Downtown — Water St", hours: "11–3" },
    { day: "Thursday", place: "Lakefront — Veterans Park", hours: "11–7" },
    { day: "Friday", place: "Third Ward Riverwalk", hours: "11–7" },
    { day: "Saturday", place: "Bradford Beach", hours: "11–7" },
];

/* ── Deterministic bowl-preview scatter (the mockup's #pokecubes) ────────── */

const CUBE_AHI = "#E4574B";
const CUBE_SALMON = "#F0805E";
const CUBE_TOFU = "#E8C05E";
const PIP_GREEN = "#8FBF6A";

/** Two alternating cube colors per protein — "Both fish" genuinely mixes. */
function cubeColors(protein: string): [string, string] {
    if (protein === "Salmon") return [CUBE_SALMON, CUBE_SALMON];
    if (protein === "Marinated tofu") return [CUBE_TOFU, CUBE_TOFU];
    if (protein === "Both fish") return [CUBE_AHI, CUBE_SALMON];
    return [CUBE_AHI, CUBE_AHI];
}

/** FNV-1a string hash — turns the current selection into a PRNG seed. */
function hashSeed(input: string): number {
    let hash = 2166136261;
    for (let i = 0; i < input.length; i++) {
        hash ^= input.charCodeAt(i);
        hash = Math.imul(hash, 16777619);
    }
    return hash >>> 0;
}

/** mulberry32 — tiny deterministic PRNG; same seed, same scatter, SSR-safe. */
function mulberry32(seed: number): () => number {
    let a = seed >>> 0;
    return () => {
        a = (a + 0x6d2b79f5) | 0;
        let t = Math.imul(a ^ (a >>> 15), 1 | a);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

type BowlArt = {
    cubes: { x: number; y: number; rot: number; color: string }[];
    pips: { x: number; y: number }[];
};

/** Same geometry as the mockup: 7 protein cubes + 5 edamame pips in 120px. */
function scatterBowl(bowl: Bowl): BowlArt {
    const seed = hashSeed(`${bowl.base}|${bowl.protein}|${bowl.toppings.join("+")}|${bowl.sauce}`);
    const rand = mulberry32(seed);
    const [colorA, colorB] = cubeColors(bowl.protein);
    const cubes = Array.from({ length: 7 }, (_, i) => ({
        x: 18 + rand() * 78,
        y: 18 + rand() * 78,
        rot: rand() * 40,
        color: i % 2 ? colorB : colorA,
    }));
    const pips = Array.from({ length: 5 }, () => ({
        x: 14 + rand() * 84,
        y: 14 + rand() * 84,
    }));
    return { cubes, pips };
}

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
            className={`mppoke-chip${on ? " mppoke-chip--on" : ""}`}
            aria-pressed={on}
            onClick={onPick}
        >
            {label}
            {plus ? <span className="mppoke-chip-plus">{plus}</span> : null}
        </Button>
    );
}

/** Scroll a section into view — refs + handlers only, never during render. */
function scrollToSection(ref: RefObject<HTMLElement | null>): void {
    ref.current?.scrollIntoView({ behavior: "smooth", block: "start" });
}

type OrderLine = { name: string; price: number };

const usd = (value: number): string => `$${value.toFixed(2)}`;

/* ── Page ────────────────────────────────────────────────────────────────── */

export default function Poke({ style }: { style: Style }) {
    const [bowl, setBowl] = useState<Bowl>(DEFAULT_BOWL);
    const [order, setOrder] = useState<OrderLine[]>([]);

    const buildRef = useRef<HTMLElement>(null);
    const sigRef = useRef<HTMLElement>(null);
    const findRef = useRef<HTMLElement>(null);

    const price = useMemo(() => bowlPrice(bowl), [bowl]);
    const art = useMemo(() => scatterBowl(bowl), [bowl]);
    const bowlName = `${bowl.protein} bowl`;
    const orderTotal = useMemo(
        () => order.reduce((sum, line) => sum + line.price, 0),
        [order],
    );

    const pick = (key: SingleKey, label: string) =>
        setBowl((b) => ({ ...b, [key]: label }));

    const toggleTopping = (topping: string) =>
        setBowl((b) => ({
            ...b,
            toppings: b.toppings.includes(topping)
                ? b.toppings.filter((t) => t !== topping)
                : [...b.toppings, topping],
        }));

    const addToOrder = () =>
        setOrder((o) => [...o, { name: bowlName, price }]);

    const steps: {
        n: number;
        label: string;
        hint: string;
        chips: { label: string; plus?: string; on: boolean; onPick: () => void }[];
    }[] = [
        {
            n: 1,
            label: "Base",
            hint: "pick one",
            chips: BASE_OPTIONS.map((o) => ({
                ...o,
                on: bowl.base === o.label,
                onPick: () => pick("base", o.label),
            })),
        },
        {
            n: 2,
            label: "Protein",
            hint: "pick one",
            chips: PROTEIN_OPTIONS.map((o) => ({
                ...o,
                on: bowl.protein === o.label,
                onPick: () => pick("protein", o.label),
            })),
        },
        {
            n: 3,
            label: "Toppings",
            hint: "2 free, then +75¢",
            chips: TOPPING_OPTIONS.map((topping) => ({
                label: topping,
                on: bowl.toppings.includes(topping),
                onPick: () => toggleTopping(topping),
            })),
        },
        {
            n: 4,
            label: "Sauce",
            hint: "pick one",
            chips: SAUCE_OPTIONS.map((o) => ({
                ...o,
                on: bowl.sauce === o.label,
                onPick: () => pick("sauce", o.label),
            })),
        },
    ];

    const summary = [
        { label: "Base", value: bowl.base },
        { label: "Protein", value: bowl.protein },
        { label: "Toppings", value: `${bowl.toppings.length} picked` },
        { label: "Sauce", value: bowl.sauce },
    ];

    return (
        <div className="mppoke-root">
            {/* ── Sticky translucent header ──────────────────────────────── */}
            <header className="mppoke-header">
                <div className="mppoke-header-inner">
                    <div className="mppoke-lockup">
                        <span className="mppoke-lockup-name">Mom-n-Pops</span>
                        <span className="mppoke-lockup-suffix">Poke</span>
                    </div>
                    <nav className="mppoke-nav" aria-label="Site">
                        <button type="button" className="mppoke-navlink" onClick={() => scrollToSection(buildRef)}>
                            Build a bowl
                        </button>
                        <button type="button" className="mppoke-navlink" onClick={() => scrollToSection(sigRef)}>
                            Signatures
                        </button>
                        <button type="button" className="mppoke-navlink" onClick={() => scrollToSection(findRef)}>
                            Find us
                        </button>
                        <Button
                            type="button"
                            className="mppoke-btn mppoke-btn--pill"
                            onClick={() => scrollToSection(findRef)}
                        >
                            Find the truck
                        </Button>
                    </nav>
                </div>
            </header>

            {/* ── Hero — full-bleed teal gradient, emoji medallion ───────── */}
            <section className="mppoke-hero" aria-labelledby="mppoke-hero-title">
                <div className="mppoke-shell">
                    <div className="mppoke-hero-grid">
                        <div>
                            <Badge className="mppoke-aloha" size="sm">
                                Aloha, Milwaukee · Est. 2026
                            </Badge>
                            <Heading as="h1" id="mppoke-hero-title" className="mppoke-h1">
                                Sunshine in a bowl.
                            </Heading>
                            <Text as="p" className="mppoke-lede">
                                Sushi-grade fish, big scoops of rice, all the toppings, sauces
                                that pop. Build your own below — or grab a signature.
                            </Text>
                            <div className="mppoke-hero-ctas">
                                <Button
                                    type="button"
                                    className="mppoke-btn mppoke-btn--coral"
                                    onClick={() => scrollToSection(buildRef)}
                                >
                                    Build a bowl
                                </Button>
                                <Button
                                    type="button"
                                    className="mppoke-btn mppoke-btn--glass"
                                    onClick={() => scrollToSection(sigRef)}
                                >
                                    Signatures
                                </Button>
                            </div>
                        </div>
                        <div className="mppoke-medallion-wrap">
                            <div className="mppoke-medallion" aria-hidden="true">
                                <span className="mppoke-medallion-emoji">🍥</span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <div className="mppoke-shell">
                {/* ── Build your bowl — the configurator surface ─────────── */}
                <section ref={buildRef} className="mppoke-build" aria-labelledby="mppoke-build-title">
                    <div className="mppoke-build-grid">
                        <div>
                            <Heading as="h2" id="mppoke-build-title" className="mppoke-h2">
                                Build your bowl
                            </Heading>
                            <Text as="p" className="mppoke-build-sub">
                                Four steps. Tap as you go — the bowl updates live.
                            </Text>

                            {steps.map((step) => (
                                <Card key={step.n} variant="outlined" padding="none" className="mppoke-step">
                                    <div className="mppoke-step-head">
                                        <span className="mppoke-step-num" aria-hidden="true">
                                            {step.n}
                                        </span>
                                        <span className="mppoke-step-label">{step.label}</span>
                                        <span className="mppoke-step-hint">{step.hint}</span>
                                    </div>
                                    <div className="mppoke-chips" role="group" aria-label={step.label}>
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

                        {/* Sticky bowl summary — live preview + derived price */}
                        <aside className="mppoke-rail" aria-label="Your bowl">
                            <Card variant="elevated" padding="none" className="mppoke-summary">
                                <Card.Header className="mppoke-summary-head">
                                    <div className="mppoke-bowl" aria-hidden="true">
                                        <div className="mppoke-bowl-bits">
                                            {art.cubes.map((cube, i) => (
                                                <span
                                                    key={`cube-${i}`}
                                                    className="mppoke-cube"
                                                    style={{
                                                        left: `${cube.x}px`,
                                                        top: `${cube.y}px`,
                                                        transform: `rotate(${cube.rot}deg)`,
                                                        background: cube.color,
                                                    }}
                                                />
                                            ))}
                                            {art.pips.map((pip, i) => (
                                                <span
                                                    key={`pip-${i}`}
                                                    className="mppoke-pip"
                                                    style={{
                                                        left: `${pip.x}px`,
                                                        top: `${pip.y}px`,
                                                        background: PIP_GREEN,
                                                    }}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                    <div className="mppoke-summary-name">{bowlName}</div>
                                </Card.Header>
                                <Card.Body className="mppoke-summary-body">
                                    {summary.map((row) => (
                                        <div key={row.label} className="mppoke-summary-row">
                                            <span className="mppoke-summary-label">{row.label}</span>
                                            <span className="mppoke-summary-value">{row.value}</span>
                                        </div>
                                    ))}
                                    <div className="mppoke-total-row" aria-live="polite">
                                        <span className="mppoke-total-label">Total</span>
                                        <span className="mppoke-total">{usd(price)}</span>
                                    </div>
                                    <Button
                                        type="button"
                                        className="mppoke-btn mppoke-btn--add"
                                        onClick={addToOrder}
                                    >
                                        Add to order · {usd(price)}
                                    </Button>

                                    {order.length > 0 && (
                                        <div className="mppoke-order">
                                            <div className="mppoke-order-head">
                                                <span>On ice</span>
                                                <button
                                                    type="button"
                                                    className="mppoke-order-clear"
                                                    onClick={() => setOrder([])}
                                                >
                                                    Clear
                                                </button>
                                            </div>
                                            {order.map((line, i) => (
                                                <div key={`${line.name}-${i}`} className="mppoke-order-row">
                                                    <span>{line.name}</span>
                                                    <span className="mppoke-order-price">{usd(line.price)}</span>
                                                </div>
                                            ))}
                                            <div className="mppoke-order-total">
                                                <span>
                                                    Order · {order.length} {order.length === 1 ? "bowl" : "bowls"}
                                                </span>
                                                <span className="mppoke-order-sum">{usd(orderTotal)}</span>
                                            </div>
                                        </div>
                                    )}
                                </Card.Body>
                            </Card>
                        </aside>
                    </div>
                </section>

                {/* ── Or a signature — coral-priced preset grid ──────────── */}
                <section ref={sigRef} className="mppoke-sigs" aria-labelledby="mppoke-sigs-title">
                    <div className="mppoke-sigs-head">
                        <Heading as="h2" id="mppoke-sigs-title" className="mppoke-h2 mppoke-h2--sub">
                            Or a signature
                        </Heading>
                    </div>
                    <div className="mppoke-sigs-grid">
                        {SIGNATURES.map((sig) => (
                            <Card key={sig.name} variant="outlined" padding="none" className="mppoke-sig-card">
                                <div className="mppoke-sig-top">
                                    <span className="mppoke-sig-name">{sig.name}</span>
                                    <span className="mppoke-sig-price">{sig.price}</span>
                                </div>
                                <p className="mppoke-sig-desc">{sig.short}</p>
                            </Card>
                        ))}
                    </div>
                </section>

                {/* ── Find the truck — the Milwaukee weekly route ────────── */}
                <section ref={findRef} className="mppoke-find" aria-labelledby="mppoke-find-title">
                    <Heading as="h2" id="mppoke-find-title" className="mppoke-h2 mppoke-h2--sub mppoke-h2--find">
                        Find the truck
                    </Heading>
                    <Card variant="outlined" padding="none" className="mppoke-sched">
                        {SCHEDULE.map((stop) => (
                            <div key={stop.day} className="mppoke-sched-row">
                                <span className="mppoke-sched-day">{stop.day}</span>
                                <span className="mppoke-sched-place">{stop.place}</span>
                                <span className="mppoke-sched-hours">{stop.hours}</span>
                            </div>
                        ))}
                    </Card>
                </section>
            </div>

            {/* ── Footer — deep-sea bookend ──────────────────────────────── */}
            <footer className="mppoke-footer">
                <div className="mppoke-footer-inner">
                    <span className="mppoke-footer-brand">Mom-n-Pops Poke</span>
                    <span>
                        hello<span>@</span>momnpops.truck · @momnpops.mke
                    </span>
                    <span>© 2026 · Milwaukee</span>
                </div>
                <div className="mppoke-footer-note">
                    Mom-n-Pops (Rosa &amp; Sal, est. 2026) is fictional — style {style.num} /{" "}
                    {style.name} of the Fancy UI Inspiration Gallery.
                </div>
            </footer>
        </div>
    );
}
