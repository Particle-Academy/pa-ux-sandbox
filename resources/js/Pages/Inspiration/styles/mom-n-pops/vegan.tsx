import "./vegan.css";
import { Link } from "@inertiajs/react";
import { useEffect, useState } from "react";
import { Badge, Button, Card, Tooltip } from "@particle-academy/react-fancy";
import {
    Flame,
    GitBranch,
    Leaf,
    Nut,
    Soup,
    Sprout,
    Utensils,
    Wheat,
    type LucideIcon,
} from "lucide-react";
import type { Style } from "../../types";

/**
 * Mom-n-Pops · Style 16 — Green Bowl.
 *
 * The family food truck gone fully plant-based, told as a sourcing story: a
 * warm oat/cream page (#EFE9DB), sage-green accent (#6E8B5A) with a terracotta
 * counterpoint (#C96F4A), heavy tight-tracked sans display, and hairline
 * #D6CDB8 borders on cream cards. Zero photography — the food is emoji in
 * pale-green tiles, and the page's signature move is supply-chain data as
 * design: a "This week's sourcing" peek card in the hero, then a full
 * dark-forest node-graph panel ("Farm to bowl") where five typed, color-coded
 * steps sit on a dotted canvas joined by SVG bezier edges. Tapping a step
 * drives a controlled selection state that tints the node's border to its
 * type color and opens a detail strip below the canvas — the mockup's
 * imperative querySelector paint() pass recreated as plain declarative React.
 *
 * Fancy primitives worn by the design: Button (solid sage + outlined pills),
 * Badge (the terracotta hero flag + the hydrated "Today" schedule marker),
 * Card (sourcing peek, menu cards, stat tiles, the schedule container),
 * Tooltip (the four house sauces behind the "4" stat). The node graph is
 * hand-rolled — a five-node static DAG doesn't need a workflow editor, and
 * absolute-positioned buttons + an SVG keep the first paint deterministic.
 *
 * Mounted by Inspiration/Show.tsx for mom-n-pops / `style.id === "vegan"`.
 * SSR-safe: all data static; no timers, no randomness, no window/document at
 * render. The only browser dependence is the "Today" schedule highlight,
 * computed in a useEffect after hydration.
 */

/* ── Data (all static — the DCLogic state, lifted) ───────────────────────── */

type SourcingRow = {
    icon: LucideIcon;
    name: string;
    miles: string;
};

const SOURCING: SourcingRow[] = [
    { icon: Sprout, name: "Delicata squash · Wisco Farms", miles: "38 mi" },
    { icon: Leaf, name: "Lacinato kale · Riverbend", miles: "52 mi" },
    { icon: Nut, name: "Maitake · Prairie Fungi", miles: "71 mi" },
];

type MenuItem = {
    icon: string;
    name: string;
    price: string;
    short: string;
};

const MENU: MenuItem[] = [
    { icon: "🥗", name: "Harvest Bowl", price: "$11", short: "Wild rice, roasted squash, kale, maple-tahini." },
    { icon: "🍚", name: "Miso Ginger Bowl", price: "$11", short: "Brown rice, maitake, edamame, pickled carrot." },
    { icon: "🥑", name: "Green Goddess Bowl", price: "$10", short: "Quinoa, avocado, snap peas, cashew goddess." },
    { icon: "🍠", name: "Sweet Potato Chili", price: "$10", short: "Three-bean chili, roasted sweet potato, lime." },
    { icon: "🍄", name: "Mushroom Grain Bowl", price: "$11", short: "Farro, seared mushrooms, chimichurri." },
    { icon: "🌯", name: "Rainbow Slaw Wrap", price: "$9", short: "Crunchy slaw, crispy chickpeas, peanut-lime." },
];

/**
 * The sourcing DAG. Positions are the mockup's literal coordinates on a
 * 920×300 canvas (the panel scrolls horizontally below ~980px viewports
 * rather than reflowing — a node graph wants its geometry kept intact).
 * Each node is typed (Source / Process / Output) and carries its type color,
 * painted onto the header always and the border when selected.
 */
type SourcingNode = {
    slug: string;
    kind: "Source" | "Process" | "Output";
    icon: LucideIcon;
    name: string;
    meta: string;
    long: string;
    color: string;
    x: number;
    y: number;
};

const NODES: SourcingNode[] = [
    {
        slug: "farms",
        kind: "Source",
        icon: Sprout,
        name: "Local farms",
        meta: "5 WI growers",
        long: "Produce from five Wisconsin farms within 90 miles — squash, kale, mushrooms, roots — delivered three mornings a week.",
        color: "#6E8B5A",
        x: 20,
        y: 55,
    },
    {
        slug: "pantry",
        kind: "Source",
        icon: Wheat,
        name: "Grains & legumes",
        meta: "wild rice, farro, quinoa",
        long: "Bulk grains and legumes cooked in small batches daily — wild rice, farro, quinoa, three-bean mix.",
        color: "#C9A24A",
        x: 20,
        y: 185,
    },
    {
        slug: "roast",
        kind: "Process",
        icon: Flame,
        name: "Roast & char",
        meta: "the long way",
        long: "Everything roasted, charred, or fermented so the vegetables taste like something. The step most fast-casual skips.",
        color: "#5AA9C0",
        x: 370,
        y: 115,
    },
    {
        slug: "sauce",
        kind: "Process",
        icon: Soup,
        name: "House sauces",
        meta: "4 from scratch",
        long: "Green goddess, miso-ginger, chili-tahini, peanut-lime — the flavor engine, all made in-house.",
        color: "#C96F4A",
        x: 560,
        y: 180,
    },
    {
        slug: "bowl",
        kind: "Output",
        icon: Utensils,
        name: "Bowl assembly",
        meta: "6 bowls · vegan",
        long: "Grains, roasted veg, and a big herby sauce, built to order. Fast and filling for the drive home.",
        color: "#9BD07A",
        x: 730,
        y: 115,
    },
];

/** The mockup's three bezier edges: farms → roast, pantry → roast, → bowl. */
const EDGES: string[] = [
    "M 190 90 C 280 90, 280 150, 370 150",
    "M 190 220 C 280 220, 280 150, 370 150",
    "M 560 150 C 650 150, 650 150, 730 150",
];

const STATS: { v: string; k: string; note?: string }[] = [
    { v: "90 mi", k: "sourcing radius" },
    { v: "4", k: "house sauces", note: "Green goddess, miso-ginger, chili-tahini, peanut-lime — all made from scratch, in-house." },
    { v: "100%", k: "plants" },
    { v: "2026", k: "est. Milwaukee" },
];

const SCHEDULE: { day: string; place: string; hours: string }[] = [
    { day: "Monday", place: "Marquette — Wells St", hours: "11–3" },
    { day: "Tuesday", place: "Downtown — Cathedral Sq", hours: "11–3" },
    { day: "Wednesday", place: "East Side — Downer Ave", hours: "11–3 · 5–8" },
    { day: "Thursday", place: "Bay View — KK Ave", hours: "11–3 · 5–8" },
    { day: "Friday", place: "Third Ward Riverwalk", hours: "11–8" },
    { day: "Saturday", place: "South Shore Farmers Market", hours: "8–2" },
];

export default function Vegan({ style }: { style: Style }) {
    /** Selected sourcing step — drives the border tint + the detail strip. */
    const [sel, setSel] = useState<SourcingNode | null>(null);

    /** Row index (Mon=0…Sat=5) of today's stop; -1 until hydrated / Sundays. */
    const [todayIdx, setTodayIdx] = useState(-1);
    useEffect(() => {
        const day = new Date().getDay(); // Sun=0 … Sat=6
        setTodayIdx(day >= 1 && day <= 6 ? day - 1 : -1);
    }, []);

    return (
        <div className="mpvegan-root">
            {/* ── Sticky translucent header ───────────────────────────────── */}
            <header className="mpvegan-header">
                <div className="mpvegan-header__in">
                    <Link href="/inspiration/mom-n-pops" className="mpvegan-brand">
                        <span className="mpvegan-brand__name">Mom-n-Pops</span>
                        <span className="mpvegan-brand__sub">Green Bowl</span>
                    </Link>
                    <nav className="mpvegan-nav" aria-label="Site">
                        <a href="#mpvegan-menu" className="mpvegan-nav__link">Bowls</a>
                        <a href="#mpvegan-flow" className="mpvegan-nav__link">Where it's from</a>
                        <a href="#mpvegan-schedule" className="mpvegan-nav__link">Find us</a>
                    </nav>
                </div>
            </header>

            <div className="mpvegan-container">
                {/* ── Hero: pitch + the sourcing peek card ────────────────── */}
                <section className="mpvegan-hero" aria-labelledby="mpvegan-hero-title">
                    <div className="mpvegan-hero__copy">
                        <Badge variant="solid" size="sm" className="mpvegan-flag">
                            Plants only · Milwaukee · 2026
                        </Badge>
                        <h1 id="mpvegan-hero-title" className="mpvegan-hero__title">
                            Bowls that eat like a whole meal.
                        </h1>
                        <p className="mpvegan-hero__sub">
                            Grains, roasted vegetables, big herby sauces — 100% plants, zero
                            compromise. We roast, char, and ferment the long way so the
                            vegetables actually taste like something.
                        </p>
                        <div className="mpvegan-hero__cta">
                            <Button
                                href="#mpvegan-menu"
                                color="green"
                                className="mpvegan-btn mpvegan-btn--primary"
                            >
                                See the bowls
                            </Button>
                            <Button
                                href="#mpvegan-flow"
                                variant="ghost"
                                className="mpvegan-btn mpvegan-btn--outline"
                            >
                                Where it's from
                            </Button>
                        </div>
                    </div>

                    <Card variant="flat" padding="none" className="mpvegan-peek">
                        <div className="mpvegan-peek__eyebrow">This week's sourcing</div>
                        {SOURCING.map((s) => (
                            <div key={s.name} className="mpvegan-peek__row">
                                <s.icon size={15} className="mpvegan-peek__icon" aria-hidden />
                                <span className="mpvegan-peek__name">{s.name}</span>
                                <span className="mpvegan-peek__miles">{s.miles}</span>
                            </div>
                        ))}
                    </Card>
                </section>

                {/* ── The bowls (menu grid) ───────────────────────────────── */}
                <section id="mpvegan-menu" className="mpvegan-menu" aria-labelledby="mpvegan-menu-title">
                    <div className="mpvegan-menu__head">
                        <h2 id="mpvegan-menu-title" className="mpvegan-h2">The bowls</h2>
                        <span className="mpvegan-menu__aside">— all vegan</span>
                    </div>
                    <div className="mpvegan-grid">
                        {MENU.map((m) => (
                            <Card key={m.name} variant="flat" padding="none" className="mpvegan-card">
                                <div className="mpvegan-card__top">
                                    <span className="mpvegan-card__tile" aria-hidden>{m.icon}</span>
                                    <span className="mpvegan-card__price">{m.price}</span>
                                </div>
                                <div className="mpvegan-card__name">{m.name}</div>
                                <p className="mpvegan-card__short">{m.short}</p>
                            </Card>
                        ))}
                    </div>
                </section>

                {/* ── Farm to bowl: the sourcing flow surface ─────────────── */}
                <section id="mpvegan-flow" className="mpvegan-flow" aria-labelledby="mpvegan-flow-title">
                    <div className="mpvegan-panel">
                        <div className="mpvegan-panel__head">
                            <GitBranch size={18} className="mpvegan-panel__glyph" aria-hidden />
                            <div>
                                <div id="mpvegan-flow-title" className="mpvegan-panel__title">Farm to bowl</div>
                                <div className="mpvegan-panel__hint">
                                    How a Green Bowl comes together — tap a step.
                                </div>
                            </div>
                        </div>

                        <div className="mpvegan-panel__scroll">
                            <div
                                className="mpvegan-panel__canvas"
                                role="group"
                                aria-label="Sourcing steps, farm to bowl"
                            >
                                <svg className="mpvegan-panel__edges" aria-hidden>
                                    <defs>
                                        <marker
                                            id="mpvegan-arrow"
                                            markerWidth="9"
                                            markerHeight="9"
                                            refX="7"
                                            refY="4.5"
                                            orient="auto"
                                        >
                                            <path d="M0 0 L9 4.5 L0 9 z" fill="#4A6B3A" />
                                        </marker>
                                    </defs>
                                    {EDGES.map((d) => (
                                        <path
                                            key={d}
                                            d={d}
                                            stroke="#4A6B3A"
                                            strokeWidth={2}
                                            fill="none"
                                            markerEnd="url(#mpvegan-arrow)"
                                        />
                                    ))}
                                </svg>

                                {NODES.map((n) => {
                                    const selected = sel?.slug === n.slug;
                                    return (
                                        <button
                                            key={n.slug}
                                            type="button"
                                            className={`mpvegan-node${selected ? " mpvegan-node--selected" : ""}`}
                                            style={{
                                                left: n.x,
                                                top: n.y,
                                                borderColor: selected ? n.color : undefined,
                                            }}
                                            onClick={() => setSel(n)}
                                            aria-pressed={selected}
                                            aria-label={`${n.kind}: ${n.name} — ${n.meta}`}
                                        >
                                            <span className="mpvegan-node__head" style={{ color: n.color }}>
                                                <n.icon size={14} aria-hidden />
                                                <span className="mpvegan-node__kind">{n.kind}</span>
                                            </span>
                                            <span className="mpvegan-node__body">
                                                <span className="mpvegan-node__name">{n.name}</span>
                                                <span className="mpvegan-node__meta">{n.meta}</span>
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        <div aria-live="polite">
                            {sel && (
                                <div className="mpvegan-panel__detail">
                                    <div className="mpvegan-panel__detail-head">
                                        <span className="mpvegan-panel__detail-kind">{sel.kind}</span>
                                        <span className="mpvegan-panel__detail-name">{sel.name}</span>
                                    </div>
                                    <p className="mpvegan-panel__detail-long">{sel.long}</p>
                                </div>
                            )}
                        </div>
                    </div>
                </section>

                {/* ── Our story + stats ───────────────────────────────────── */}
                <section className="mpvegan-story" aria-labelledby="mpvegan-story-title">
                    <div className="mpvegan-story__copy">
                        <div className="mpvegan-eyebrow">Our story</div>
                        <h2 id="mpvegan-story-title" className="mpvegan-story__title">
                            We went plant-based and refused to make it boring.
                        </h2>
                        <p className="mpvegan-story__body">
                            The sauces do the heavy lifting — green goddess, miso-ginger,
                            chili-tahini, all made in-house. Milwaukee, since 2026.
                            Everything's vegan; nobody feels left out.
                        </p>
                    </div>
                    <div className="mpvegan-stats">
                        {STATS.map((s) => (
                            <Card key={s.k} variant="flat" padding="none" className="mpvegan-stat">
                                <div className="mpvegan-stat__v">{s.v}</div>
                                <div className="mpvegan-stat__k">
                                    {s.note ? (
                                        <Tooltip content={s.note} placement="top" className="mpvegan-tip">
                                            <span className="mpvegan-stat__note">{s.k}</span>
                                        </Tooltip>
                                    ) : (
                                        s.k
                                    )}
                                </div>
                            </Card>
                        ))}
                    </div>
                </section>

                {/* ── Find the truck (schedule) ───────────────────────────── */}
                <section id="mpvegan-schedule" className="mpvegan-sched" aria-labelledby="mpvegan-sched-title">
                    <h2 id="mpvegan-sched-title" className="mpvegan-h2 mpvegan-sched__title">
                        Find the truck
                    </h2>
                    <Card variant="flat" padding="none" className="mpvegan-sched__card">
                        {SCHEDULE.map((s, i) => (
                            <div
                                key={s.day}
                                className={`mpvegan-sched__row${i === todayIdx ? " mpvegan-sched__row--today" : ""}`}
                            >
                                <span className="mpvegan-sched__day">
                                    {s.day}
                                    {i === todayIdx && (
                                        <Badge size="sm" variant="solid" className="mpvegan-today">
                                            Today
                                        </Badge>
                                    )}
                                </span>
                                <span className="mpvegan-sched__place">{s.place}</span>
                                <span className="mpvegan-sched__hours">{s.hours}</span>
                            </div>
                        ))}
                    </Card>
                </section>
            </div>

            {/* ── Footer ──────────────────────────────────────────────────── */}
            <footer className="mpvegan-footer">
                <div className="mpvegan-footer__in">
                    <span className="mpvegan-footer__brand">Mom-n-Pops Green Bowl</span>
                    <span className="mpvegan-footer__contact">
                        hello<span>@</span>momnpops.truck · @momnpops.mke
                    </span>
                    <span>© 2026 · Milwaukee</span>
                </div>
                <div className="mpvegan-footer__folio">
                    Mom-n-Pops — a fictional food truck, for demonstration · Style {style.num} / Green Bowl
                </div>
            </footer>
        </div>
    );
}
