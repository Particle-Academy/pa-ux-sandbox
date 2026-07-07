import "./bbq.css";
import { useRef, useState, type CSSProperties, type RefObject } from "react";
import {
    Badge,
    Button,
    Card,
    Heading,
    Progress,
    Table,
    Text,
    Tooltip,
} from "@particle-academy/react-fancy";
import { Flame } from "lucide-react";
import type { Style } from "../../types";

/**
 * Mom-n-Pops · Style 07 — Smokehouse (BBQ).
 *
 * The family food truck as a LOW & SLOW smokehouse: warm butcher-paper tan
 * page, dark charcoal bands (header / hero / footer), one rust-ember accent,
 * weight-900 uppercase display type with mono annotations everywhere — nav,
 * eyebrows ("// LOW & SLOW"), prices, hour axes, schedule days. No photos:
 * the page sells scarcity with DATA instead of imagery — a live sellout
 * meter in the hero and a full-width "on the pit" cook-timeline Gantt where
 * finished cuts get a solid smoke-ramp fill and cuts still cooking wear a
 * 45° diagonal hatch.
 *
 * Restyled Fancy primitives: Button (hero CTAs), Progress (sellout meters,
 * per-cut smoke-ramp colors), Card (menu board + stat cards), Table (the
 * schedule), Badge (sell-out ETA chip), Tooltip (live-pit dot), Heading/Text.
 * The Gantt itself is hand-rolled — bars positioned declaratively from data
 * (left/width percentages), no imperative paint() pass like the mockup.
 *
 * Mounted by Inspiration/Show.tsx for `style.id === "bbq"`. SSR-safe: no
 * browser APIs during render, deterministic first paint ("now 1:00 PM" is
 * static data, never the wall clock), the only animation is a CSS opacity
 * pulse on the live status dot. Sticky header sits at z-index 20, under the
 * gallery frame's 30.
 */

/* ── Data (the mockup's DCLogic.renderVals(), verbatim) ─────────────────── */

type Cut = {
    slug: string;
    name: string;
    status: string;
    start: number; // % across the 4a→6p axis
    width: number; // % across the 4a→6p axis
    done: boolean;
    label: string;
};

const CUT_COLORS: Record<string, string> = {
    brisket: "#C24A1E",
    pork: "#D98A3C",
    ribs: "#E0A94E",
    sausage: "#B8763A",
    burntends: "#A83A18",
    cornbread: "#D9B96A",
};

const ROWS: Cut[] = [
    { slug: "brisket", name: "Brisket", status: "done 12:30 · slicing", start: 0, width: 78, done: true, label: "14 hr" },
    { slug: "pork", name: "Pulled Pork", status: "done 1:00 · pulling", start: 4, width: 66, done: true, label: "12 hr" },
    { slug: "ribs", name: "St. Louis Ribs", status: "on the pit · ~2:00", start: 28, width: 38, done: false, label: "6 hr" },
    { slug: "sausage", name: "Smoked Sausage", status: "done 11:00", start: 14, width: 24, done: true, label: "4 hr" },
    { slug: "burntends", name: "Burnt Ends", status: "on the pit · ~3:00", start: 0, width: 92, done: false, label: "16 hr" },
    { slug: "cornbread", name: "Skillet Cornbread", status: "baked hourly", start: 60, width: 14, done: true, label: "hourly" },
];

const HOURS = ["4a", "6a", "8a", "10a", "12p", "2p", "4p", "6p"];

const METERS = [
    { name: "Brisket", left: "~9 lb left", pct: 35, col: "#C24A1E" },
    { name: "Pulled Pork", left: "~14 lb left", pct: 55, col: "#D98A3C" },
    { name: "Burnt Ends", left: "1 pan · almost gone", pct: 14, col: "#A83A18" },
    { name: "Ribs", left: "ready ~2 PM", pct: 80, col: "#E0A94E" },
];

const MENU = [
    { name: "Brisket", price: "$14", short: "Post-oak smoked 14 hrs, salt & pepper bark." },
    { name: "Pulled Pork", price: "$11", short: "Shoulder pulled by hand, vinegar splash." },
    { name: "St. Louis Ribs", price: "$16", short: "Half rack, dry-rubbed, tug off the bone." },
    { name: "Smoked Sausage", price: "$8", short: "Coarse beef & pork link, snappy." },
    { name: "Burnt Ends", price: "$15", short: "Cubed point, glazed & double-smoked." },
    { name: "Skillet Cornbread", price: "$5", short: "Honey butter, cast-iron edges." },
];

const STATS = [
    { v: "14 hr", k: "brisket on the pit" },
    { v: "4 AM", k: "fire lit daily" },
    { v: "3", k: "house sauces" },
    { v: "½ cord", k: "post-oak / day" },
];

const SCHEDULE = [
    { day: "Wednesday", place: "Walker's Point", hours: "11–sellout" },
    { day: "Thursday", place: "Bay View — KK Ave", hours: "11–sellout" },
    { day: "Friday", place: "Third Ward Riverwalk", hours: "11–sellout" },
    { day: "Saturday", place: "Sherman Phoenix lot", hours: "11–sellout" },
    { day: "Sunday", place: "Humboldt Park", hours: "11–sellout" },
    { day: "Mon–Tue", place: "Closed — tending the fire", hours: "—" },
];

/* ── Page ───────────────────────────────────────────────────────────────── */

export default function Bbq({ style }: { style: Style }) {
    /** Click a cut row to spotlight its bar on the timeline (others dim). */
    const [focusCut, setFocusCut] = useState<string | null>(null);

    const menuRef = useRef<HTMLElement | null>(null);
    const pitRef = useRef<HTMLElement | null>(null);
    const findRef = useRef<HTMLElement | null>(null);

    const scrollTo = (ref: RefObject<HTMLElement | null>) => {
        ref.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    };

    const barStyle = (r: Cut): CSSProperties => ({
        left: `${r.start}%`,
        width: `${r.width}%`,
        background: r.done
            ? CUT_COLORS[r.slug]
            : `repeating-linear-gradient(45deg, ${CUT_COLORS[r.slug]}, ${CUT_COLORS[r.slug]} 6px, #241C14 6px, #241C14 12px)`,
    });

    return (
        <div className="mpbbq-root">
            {/* ── Sticky header — charcoal bar on a 3px ember line ─────────── */}
            <header className="mpbbq-header">
                <div className="mpbbq-shell mpbbq-header__in">
                    <span className="mpbbq-mark">
                        <span className="mpbbq-mark__word">Mom-n-Pops</span>
                        <span className="mpbbq-mark__tag">SMOKEHOUSE</span>
                    </span>
                    <nav className="mpbbq-nav" aria-label="Smokehouse sections">
                        <button type="button" className="mpbbq-nav__link" onClick={() => scrollTo(menuRef)}>
                            Menu
                        </button>
                        <button
                            type="button"
                            className="mpbbq-nav__link mpbbq-nav__link--hot"
                            onClick={() => scrollTo(pitRef)}
                        >
                            On the pit
                        </button>
                        <button type="button" className="mpbbq-nav__link" onClick={() => scrollTo(findRef)}>
                            Find us
                        </button>
                    </nav>
                </div>
            </header>

            {/* ── Hero — headline left, live sellout meter right ───────────── */}
            <section className="mpbbq-hero" aria-labelledby="mpbbq-hero-h">
                <div className="mpbbq-shell mpbbq-hero__grid">
                    <div>
                        <div className="mpbbq-eyebrow">// LOW &amp; SLOW · MILWAUKEE · EST. 2026</div>
                        <h1 id="mpbbq-hero-h" className="mpbbq-h1">
                            14 hours. One fire. No shortcuts.
                        </h1>
                        <Text as="p" className="mpbbq-lede">
                            Post-oak smoke, salt-and-pepper bark, meat that pulls apart when you look at it. When
                            it sells out, we go home — so check the pit before you drive over.
                        </Text>
                        <div className="mpbbq-cta">
                            <Button className="mpbbq-btn mpbbq-btn--fill" onClick={() => scrollTo(menuRef)}>
                                See the board
                            </Button>
                            <Button
                                className="mpbbq-btn mpbbq-btn--line"
                                variant="ghost"
                                onClick={() => scrollTo(pitRef)}
                            >
                                ON THE PIT →
                            </Button>
                        </div>
                    </div>

                    {/* Sellout meter — the hero's hook */}
                    <div className="mpbbq-meterpanel" aria-label="What's left on the board right now">
                        <div className="mpbbq-meterpanel__head">
                            <Tooltip content="Live from the pit — Sal updates the board between sprays.">
                                <span className="mpbbq-live-dot" aria-hidden />
                            </Tooltip>
                            <span className="mpbbq-meterpanel__title">Pit at 225°F · hour 9 of 14</span>
                        </div>
                        <div className="mpbbq-meterpanel__body">
                            {METERS.map((m) => (
                                <div
                                    key={m.name}
                                    className="mpbbq-meter"
                                    style={{ "--mpbbq-mcol": m.col } as CSSProperties}
                                >
                                    <div className="mpbbq-meter__row">
                                        <span className="mpbbq-meter__name">{m.name}</span>
                                        <span className="mpbbq-meter__left">{m.left}</span>
                                    </div>
                                    <Progress className="mpbbq-meter__bar" value={m.pct} max={100} size="sm" />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            <div className="mpbbq-shell">
                {/* ── The board (menu) ─────────────────────────────────────── */}
                <section ref={menuRef} className="mpbbq-menu" aria-labelledby="mpbbq-menu-h">
                    <div className="mpbbq-sechead">
                        <Heading as="h2" className="mpbbq-h2" id="mpbbq-menu-h">
                            The board
                        </Heading>
                        <span className="mpbbq-aside">— by the ½lb · when it's gone, it's gone</span>
                    </div>
                    <div className="mpbbq-menu__grid">
                        {MENU.map((m) => (
                            <Card key={m.name} className="mpbbq-item" variant="flat" padding="none">
                                <div className="mpbbq-item__row">
                                    <span className="mpbbq-item__name">{m.name}</span>
                                    <span className="mpbbq-item__price">{m.price}</span>
                                </div>
                                <Text as="p" className="mpbbq-item__desc">
                                    {m.short}
                                </Text>
                            </Card>
                        ))}
                    </div>
                </section>

                {/* ── On the pit — the live cook-timeline Gantt ────────────── */}
                <section ref={pitRef} className="mpbbq-pit" aria-labelledby="mpbbq-pit-h">
                    <div className="mpbbq-pit__panel">
                        <div className="mpbbq-pit__head">
                            <Flame size={18} className="mpbbq-pit__flame" aria-hidden />
                            <div>
                                <div className="mpbbq-pit__title" id="mpbbq-pit-h">
                                    On the pit right now
                                </div>
                                <div className="mpbbq-pit__sub">live cook timeline · now 1:00 PM</div>
                            </div>
                        </div>

                        <div className="mpbbq-axis">
                            <div className="mpbbq-axis__label">Cut</div>
                            <div className="mpbbq-axis__hours">
                                {HOURS.map((h) => (
                                    <span key={h} className="mpbbq-axis__h">
                                        {h}
                                    </span>
                                ))}
                            </div>
                        </div>

                        {ROWS.map((r) => (
                            <button
                                key={r.slug}
                                type="button"
                                className={"mpbbq-row" + (focusCut === r.slug ? " mpbbq-row--focus" : "")}
                                onClick={() => setFocusCut((c) => (c === r.slug ? null : r.slug))}
                                aria-pressed={focusCut === r.slug}
                                title={`${r.name} — ${r.status}`}
                            >
                                <span className="mpbbq-row__meta">
                                    <span className="mpbbq-row__name">{r.name}</span>
                                    <span className="mpbbq-row__status">{r.status}</span>
                                </span>
                                <span className="mpbbq-row__track">
                                    <span
                                        className={
                                            "mpbbq-bar" +
                                            (r.done ? "" : " mpbbq-bar--cooking") +
                                            (focusCut && focusCut !== r.slug ? " mpbbq-bar--dim" : "")
                                        }
                                        style={barStyle(r)}
                                    >
                                        <span className="mpbbq-bar__label">{r.label}</span>
                                    </span>
                                </span>
                            </button>
                        ))}

                        <div className="mpbbq-pit__legend">
                            <span>■ done · ▨ still on the pit</span>
                            <Badge className="mpbbq-eta" size="sm">
                                sell-out ETA ~7 PM
                            </Badge>
                        </div>
                    </div>
                </section>

                {/* ── Our story + stat cards ───────────────────────────────── */}
                <section className="mpbbq-story" aria-labelledby="mpbbq-story-h">
                    <div>
                        <div className="mpbbq-story__eyebrow">// OUR STORY</div>
                        <Heading as="h2" className="mpbbq-story__h2" id="mpbbq-story-h">
                            Sal gets up at 4am so you don't have to.
                        </Heading>
                        <Text as="p" className="mpbbq-story__body">
                            The fire goes in before dawn. Sal splits the oak and minds the temperature all day;
                            Rosa runs the sides and the three house sauces — none of them ketchup. Milwaukee,
                            since 2026. First come, first served.
                        </Text>
                    </div>
                    <div className="mpbbq-stats">
                        {STATS.map((s) => (
                            <Card key={s.k} className="mpbbq-stat" variant="flat" padding="none">
                                <div className="mpbbq-stat__v">{s.v}</div>
                                <div className="mpbbq-stat__k">{s.k}</div>
                            </Card>
                        ))}
                    </div>
                </section>

                {/* ── Find the pit (schedule) ──────────────────────────────── */}
                <section ref={findRef} className="mpbbq-find" aria-labelledby="mpbbq-find-h">
                    <Heading as="h2" className="mpbbq-h2 mpbbq-find__h" id="mpbbq-find-h">
                        Find the pit
                    </Heading>
                    <Table className="mpbbq-sched">
                        <Table.Head>
                            <Table.Column label="Day" />
                            <Table.Column label="Where" />
                            <Table.Column label="Hours" />
                        </Table.Head>
                        <Table.Body>
                            {SCHEDULE.map((s) => (
                                <Table.Row
                                    key={s.day}
                                    className={s.hours === "—" ? "mpbbq-sched__closed" : undefined}
                                >
                                    <Table.Cell>{s.day}</Table.Cell>
                                    <Table.Cell>{s.place}</Table.Cell>
                                    <Table.Cell>{s.hours}</Table.Cell>
                                </Table.Row>
                            ))}
                        </Table.Body>
                    </Table>
                </section>
            </div>

            {/* ── Footer — dark mono colophon ──────────────────────────────── */}
            <footer className="mpbbq-footer">
                <div className="mpbbq-shell mpbbq-footer__row">
                    <span className="mpbbq-footer__mark">Mom-n-Pops Smokehouse</span>
                    <span>
                        hello<span>@</span>momnpops.truck · @momnpops.mke
                    </span>
                    <span>© 2026 · Milwaukee</span>
                </div>
                <div className="mpbbq-shell">
                    <div className="mpbbq-footer__base">
                        Mom-n-Pops — a fictional Milwaukee food truck, for demonstration · Truck {style.num} /{" "}
                        {style.name} · every interactive surface is a restyled Fancy UI primitive
                    </div>
                </div>
            </footer>
        </div>
    );
}
