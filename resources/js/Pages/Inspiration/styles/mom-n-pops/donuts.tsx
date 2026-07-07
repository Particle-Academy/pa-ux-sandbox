import "./donuts.css";

import { Link } from "@inertiajs/react";
import { useRef, useState, type RefObject } from "react";
import { Badge, Button, Card, StickyNote, Tooltip } from "@particle-academy/react-fancy";
import { StickyNote as StickyNoteIcon } from "lucide-react";
import type { Style } from "../../types";

/**
 * Inspiration Gallery · Mom-n-Pops style 14 — Donuts.
 *
 * Mom-n-Pops (a FICTIONAL Milwaukee family food truck, Rosa & Sal, est. 2026)
 * as a candy-neubrutalist donut stand: a warm cream page, a full-bleed yellow
 * polka-dot hero with a giant donut medallion, weight-900 uppercase type with
 * a 1px black text-stroke, and thick #1B1B1B borders with hard offset slab
 * shadows on every card and button. The special surface is "Today's specials
 * board" — a framed dot-grid whiteboard where Rosa's day-of extras live as
 * five clickable pastel react-fancy <StickyNote>s (tap one → a detail card
 * with the long story-copy and an Add-to-order CTA), complete with a pinned
 * indigo agent cursor and an "agent tidied the layout" Human+ presence chip.
 * The notes deliberately wear a soft blur shadow + near-square 4px radius —
 * a different material from the neubrutalist cards around them.
 *
 * Mounted by Inspiration/Show.tsx for `style.id === "donuts"`. SSR-safe: no
 * browser APIs during render; note positions/colors/rotations are static data
 * rendered declaratively (the mockup's imperative paint() pass is gone); the
 * mockup's sticky header goes static here because the GalleryFrame owns the
 * sticky top edge (z-index 30) — in-page nav scrolls via refs +
 * scrollIntoView with CSS scroll-margin-top compensating for the frame.
 */

type MenuItem = { icon: string; name: string; price: string; short: string };

const MENU: MenuItem[] = [
    { icon: "🍩", name: "Old Fashioned", price: "$2.50", short: "Sour-cream cake, crackly glaze." },
    { icon: "🍩", name: "Boston Cream", price: "$3", short: "Custard, chocolate top." },
    { icon: "🥓", name: "Maple Bacon Bar", price: "$4", short: "Candied Nueske's bacon." },
    { icon: "🍩", name: "Strawberry Sprinkle", price: "$3", short: "Pink glaze, rainbow jimmies." },
    { icon: "🍋", name: "Lemon Poppy", price: "$3", short: "Lemon curd, poppy sugar." },
    { icon: "🌱", name: "Vegan Cinnamon", price: "$3", short: "Plant-based, cinnamon sugar." },
];

/**
 * Rosa's board notes. Position (x/y as % of the 340px canvas — the mockup's
 * hardcoded 40,30 / 280,60 / 520,34 / 150,180 / 400,190 pixels converted so
 * the board survives narrower desktops), pastel fill, and a static tilt.
 */
type SpecialNote = {
    slug: string;
    tag: string;
    name: string;
    short: string;
    price: string;
    long: string;
    color: string;
    rot: number;
    x: number;
    y: number;
};

const NOTES: SpecialNote[] = [
    {
        slug: "special",
        tag: "TODAY",
        name: "Maple Bacon Bar",
        short: "candied Nueske's bacon",
        price: "$4",
        rot: -2.5,
        color: "#FDE68A",
        x: 3.6,
        y: 8.8,
        long: "A long john under maple glaze, crowned with candied Wisconsin Nueske's bacon. Today's headliner — most-photographed donut we make.",
    },
    {
        slug: "maple",
        tag: "WARM",
        name: "Boston Cream",
        short: "custard, chocolate top",
        price: "$3",
        rot: 2,
        color: "#FCD9A8",
        x: 25.5,
        y: 17.6,
        long: "Pillowy raised donut piped full of real vanilla custard, capped with chocolate ganache.",
    },
    {
        slug: "lemon",
        tag: "NEW",
        name: "Lemon Poppy",
        short: "lemon curd, poppy sugar",
        price: "$3",
        rot: -1.5,
        color: "#FEF08A",
        x: 47.3,
        y: 10,
        long: "Bright lemon curd inside a soft raised shell, rolled in poppy-seed sugar.",
    },
    {
        slug: "vegan",
        tag: "VEGAN",
        name: "Vegan Cinnamon",
        short: "plant-based, cinnamon sugar",
        price: "$3",
        rot: 1.5,
        color: "#C7EACB",
        x: 13.6,
        y: 52.9,
        long: "A plant-based cake donut tossed warm in cinnamon sugar. Rosa reworked it a dozen times until nobody could tell.",
    },
    {
        slug: "limited",
        tag: "LAST 6",
        name: "Strawberry Sprinkle",
        short: "pink glaze, rainbow jimmies",
        price: "$3",
        rot: -2,
        color: "#FBC7DE",
        x: 36.4,
        y: 55.9,
        long: "Pink strawberry glaze under a truly irresponsible amount of sprinkles. Almost gone today.",
    },
];

const SCHEDULE = [
    { day: "Tuesday", place: "Cathedral Square Park", hours: "7–12" },
    { day: "Wednesday", place: "Marquette — Wells St", hours: "7–12" },
    { day: "Thursday", place: "Bronzeville — MLK Dr", hours: "7–12" },
    { day: "Friday", place: "Third Ward Riverwalk", hours: "7–1" },
    { day: "Saturday", place: "South Shore Farmers Market", hours: "8–1" },
    { day: "Sunday", place: "Humboldt Park", hours: "8–1" },
];

export default function Donuts({ style }: { style: Style }) {
    const [sel, setSel] = useState<SpecialNote | null>(null);
    const [added, setAdded] = useState<string[]>([]);

    const menuRef = useRef<HTMLElement | null>(null);
    const boardRef = useRef<HTMLElement | null>(null);
    const findRef = useRef<HTMLElement | null>(null);

    /** Instant scroll, matching the mockup (no smooth behavior). */
    const scrollTo = (ref: RefObject<HTMLElement | null>) => () => {
        ref.current?.scrollIntoView({ block: "start" });
    };

    const toggleNote = (note: SpecialNote) => {
        setSel((cur) => (cur?.slug === note.slug ? null : note));
    };

    const addToOrder = (slug: string) => {
        setAdded((a) => (a.includes(slug) ? a : [...a, slug]));
    };

    return (
        <div className="mpdonuts-root">
            {/* ── Header — black bar: wordmark + cuisine tag + bold nav ─────── */}
            <header className="mpdonuts-header">
                <div className="mpdonuts-header__in">
                    <span className="mpdonuts-brand">
                        <span className="mpdonuts-wordmark">Mom-n-Pops</span>
                        <span className="mpdonuts-cuisine">DONUTS</span>
                    </span>
                    <nav className="mpdonuts-nav" aria-label="Truck sections">
                        <button type="button" className="mpdonuts-nav__link" onClick={scrollTo(menuRef)}>
                            Menu
                        </button>
                        <button type="button" className="mpdonuts-nav__link" onClick={scrollTo(boardRef)}>
                            Today&apos;s board
                        </button>
                        <button type="button" className="mpdonuts-nav__link" onClick={scrollTo(findRef)}>
                            Find us
                        </button>
                    </nav>
                </div>
            </header>

            {/* ── Hero — yellow polka-dot band, stroked headline, medallion ──── */}
            <section className="mpdonuts-hero" aria-labelledby="mpdonuts-hero-h">
                <div className="mpdonuts-hero__in">
                    <div className="mpdonuts-hero__copy">
                        <Badge className="mpdonuts-heropill" variant="outline">
                            FRIED FRESH · MILWAUKEE · 2026 !
                        </Badge>
                        <h1 id="mpdonuts-hero-h" className="mpdonuts-h1">
                            Hot donuts,
                            <br />
                            right now!
                        </h1>
                        <p className="mpdonuts-lede">
                            Cake &amp; raised, glazed while you watch, sprinkles applied with zero restraint. Follow
                            the sugar smell to the truck.
                        </p>
                        <div className="mpdonuts-ctas">
                            <Button className="mpdonuts-btn mpdonuts-btn--pink" onClick={scrollTo(menuRef)}>
                                See the dozen
                            </Button>
                            <Button className="mpdonuts-btn mpdonuts-btn--blue" onClick={scrollTo(boardRef)}>
                                Today&apos;s board
                            </Button>
                        </div>
                    </div>
                    <div className="mpdonuts-hero__art">
                        <div className="mpdonuts-medal" role="img" aria-label="A glazed donut">
                            <span aria-hidden>🍩</span>
                        </div>
                    </div>
                </div>
            </section>

            <div className="mpdonuts-container">
                {/* ── The Dozen — rotated title plate + 3-col menu card grid ── */}
                <section className="mpdonuts-menu" ref={menuRef} aria-labelledby="mpdonuts-menu-h">
                    <div className="mpdonuts-plate">
                        <h2 id="mpdonuts-menu-h" className="mpdonuts-plate__h">
                            The Dozen
                        </h2>
                    </div>
                    <div className="mpdonuts-menugrid">
                        {MENU.map((m) => (
                            <Card key={m.name} className="mpdonuts-mcard">
                                <Card.Body className="mpdonuts-mcard__body">
                                    <div className="mpdonuts-mcard__top">
                                        <span className="mpdonuts-mcard__emoji" aria-hidden>
                                            {m.icon}
                                        </span>
                                        <span className="mpdonuts-mcard__price">{m.price}</span>
                                    </div>
                                    <div className="mpdonuts-mcard__name">{m.name}</div>
                                    <p className="mpdonuts-mcard__short">{m.short}</p>
                                </Card.Body>
                            </Card>
                        ))}
                    </div>
                </section>

                {/* ── Today's specials board — the embedded whiteboard surface ── */}
                <section className="mpdonuts-boardsec" ref={boardRef} aria-labelledby="mpdonuts-board-h">
                    <div className="mpdonuts-board">
                        <div className="mpdonuts-board__bar">
                            <StickyNoteIcon size={18} className="mpdonuts-board__icon" aria-hidden />
                            <div className="mpdonuts-board__titles">
                                <div id="mpdonuts-board-h" className="mpdonuts-board__title">
                                    Today&apos;s specials board
                                </div>
                                <div className="mpdonuts-board__hint">
                                    Rosa scribbles the day&apos;s extras here — tap one.
                                </div>
                            </div>
                            <Tooltip content="A Human+ surface — an agent nudged the notes into a tidy grid overnight. Rosa still writes every one.">
                                <Badge className="mpdonuts-agentchip">
                                    <span className="mpdonuts-agentchip__dot" aria-hidden />
                                    agent tidied the layout
                                </Badge>
                            </Tooltip>
                        </div>

                        <div className="mpdonuts-board__canvas">
                            {NOTES.map((n) => (
                                <button
                                    key={n.slug}
                                    type="button"
                                    data-note={n.slug}
                                    className="mpdonuts-notewrap"
                                    style={{ left: `${n.x}%`, top: `${n.y}%` }}
                                    aria-pressed={sel?.slug === n.slug}
                                    aria-label={`${n.tag} special: ${n.name}, ${n.price}`}
                                    onClick={() => toggleNote(n)}
                                >
                                    <StickyNote
                                        id={`mpdonuts-note-${n.slug}`}
                                        className="mpdonuts-note"
                                        color={n.color}
                                        rotate={n.rot}
                                        width={190}
                                        editable={false}
                                    >
                                        <span className="mpdonuts-note__tag">{n.tag}</span>
                                        <span className="mpdonuts-note__name">{n.name}</span>
                                        <span className="mpdonuts-note__short">{n.short}</span>
                                        <span className="mpdonuts-note__price">{n.price}</span>
                                    </StickyNote>
                                </button>
                            ))}

                            {/* Pinned agent presence cursor */}
                            <div className="mpdonuts-cursor" aria-hidden>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="#6366f1">
                                    <path d="M4 2 L20 12 L13 13 L17 21 L13 22 L9 14 L4 18 Z" />
                                </svg>
                                <span className="mpdonuts-cursor__label">agent</span>
                            </div>
                        </div>
                    </div>

                    {/* Selected special — detail card (conditional) */}
                    {sel && (
                        <div className="mpdonuts-detail">
                            <div className="mpdonuts-detail__copy">
                                <div className="mpdonuts-detail__name">{sel.name}</div>
                                <p className="mpdonuts-detail__long">{sel.long}</p>
                            </div>
                            <span className="mpdonuts-detail__price">{sel.price}</span>
                            <Button
                                className="mpdonuts-addbtn"
                                onClick={() => addToOrder(sel.slug)}
                                disabled={added.includes(sel.slug)}
                            >
                                {added.includes(sel.slug) ? "Added to order ✓" : "Add to order"}
                            </Button>
                        </div>
                    )}
                </section>

                {/* ── Find the truck — six-day Milwaukee route ────────────────── */}
                <section className="mpdonuts-find" ref={findRef} aria-labelledby="mpdonuts-find-h">
                    <h2 id="mpdonuts-find-h" className="mpdonuts-find__h">
                        Find the truck
                    </h2>
                    <div className="mpdonuts-sched">
                        {SCHEDULE.map((s) => (
                            <div key={s.day} className="mpdonuts-schedrow">
                                <span className="mpdonuts-schedrow__day">{s.day}</span>
                                <span className="mpdonuts-schedrow__place">{s.place}</span>
                                <span className="mpdonuts-schedrow__hours">{s.hours}</span>
                            </div>
                        ))}
                    </div>
                </section>
            </div>

            {/* ── Footer — black bar mirroring the header ─────────────────────── */}
            <footer className="mpdonuts-footer">
                <div className="mpdonuts-footer__in">
                    <span className="mpdonuts-footer__brand">Mom-n-Pops Donuts</span>
                    <span className="mpdonuts-footer__contact">
                        hello<span>@</span>momnpops.truck · @momnpops.mke
                    </span>
                    <span className="mpdonuts-footer__copy">© 2026 · Milwaukee</span>
                </div>
                <div className="mpdonuts-footer__meta">
                    <span>
                        MOM-N-POPS — A FICTIONAL FOOD TRUCK, FOR DEMONSTRATION · STYLE {style.num} / DONUTS
                    </span>
                    <Link href="/inspiration/mom-n-pops" className="mpdonuts-footer__back">
                        ← back to the gallery
                    </Link>
                </div>
            </footer>
        </div>
    );
}
