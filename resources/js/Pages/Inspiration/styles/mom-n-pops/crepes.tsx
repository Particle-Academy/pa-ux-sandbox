import "./crepes.css";

import { useEffect, useRef, useState } from "react";
import { Badge, Button } from "@particle-academy/react-fancy";
import type { RefObject } from "react";
import type { Style } from "../../types";

/**
 * Mom-n-Pops · Style 13 — Crêperie (Chalkboard).
 *
 * The family truck as a hand-chalked Parisian menu board transplanted to
 * Milwaukee: a deep olive-charcoal slate (#22271F), warm-ivory "chalk" type,
 * and a single antique-gold accent (#D4AF37) doing all the decorative work —
 * italic Georgia display, dashed-gold "chalk rectangle" frames, dotted price
 * leaders, and bilingual French/English copy down to the closing "Merci".
 *
 * This is the quietest surface in the collection by design: the Chalkboard is
 * pure CSS craft (dashed frames, dotted leaders, dashed row rules), not an
 * interactive component. The interactive bits — the two hero CTAs and the
 * header nav — are restyled react-fancy Buttons / hand-rolled text buttons
 * that smooth-scroll between sections, with an IntersectionObserver keeping
 * the nav's "you are here" state in sync as the visitor drifts down the board.
 *
 * Mounted by Inspiration/Show.tsx for `style.id === "crepes"`. SSR-safe:
 * no browser APIs during render (window/matchMedia only inside client-only
 * click handlers, IntersectionObserver only inside useEffect with cleanup);
 * first paint is fully deterministic — activeSection starts null.
 */

type MenuItem = {
    name: string;
    price: string;
    short: string;
    tag: "sucrée" | "salée" | "vegan";
};

/** La Carte — six crêpes, sweet and savory, exactly as chalked on the truck. */
const MENU: MenuItem[] = [
    { name: "Nutella Banane", price: "$7", short: "Nutella, banana, powdered sugar.", tag: "sucrée" },
    { name: "Citron Sucre", price: "$5", short: "Lemon, sugar, brown butter.", tag: "sucrée" },
    { name: "Jambon Gruyère", price: "$9", short: "Buckwheat galette, ham, gruyère, egg.", tag: "salée" },
    { name: "Fraises Crème", price: "$8", short: "Strawberries, chantilly, balsamic.", tag: "sucrée" },
    { name: "Ratatouille", price: "$9", short: "Buckwheat galette, summer vegetables.", tag: "vegan" },
    { name: "Caramel Pomme", price: "$8", short: "Sautéed apple, salted caramel.", tag: "sucrée" },
];

/** Où nous trouver — the Milwaukee week, French day names first. */
const SCHEDULE = [
    { day: "Mardi", place: "Cathedral Square Park", hours: "9–3" },
    { day: "Mercredi", place: "East Side — Downer Ave", hours: "9–3" },
    { day: "Jeudi", place: "Marquette — Wells St", hours: "9–3" },
    { day: "Vendredi", place: "Third Ward Riverwalk", hours: "9–8" },
    { day: "Samedi", place: "South Shore Farmers Market", hours: "8–2" },
    { day: "Dimanche", place: "Brunch — Bay View", hours: "9–2" },
] as const;

type SectionId = "carte" | "histoire" | "trouver";

const NAV: Array<{ id: SectionId; label: string }> = [
    { id: "carte", label: "La Carte" },
    { id: "histoire", label: "Notre Histoire" },
    { id: "trouver", label: "Où nous trouver" },
];

export default function Crepes({ style }: { style: Style }) {
    /*
     * The mockup's DCLogic holds no state at all — just two instant
     * window.scrollBy() handlers. The React-native port keeps that lightness:
     * refs + smooth scrollIntoView for the jumps, plus one small piece of
     * derived state (which section is under the reader) so the chalk nav can
     * quietly underline where you are. Starts null → identical SSR/client
     * first paint.
     */
    const [activeSection, setActiveSection] = useState<SectionId | null>(null);

    /* Honor prefers-reduced-motion for the scroll jumps. Detected client-side
       only (starts false → deterministic SSR paint; it never affects markup). */
    const [reduceMotion, setReduceMotion] = useState(false);

    const carteRef = useRef<HTMLElement | null>(null);
    const histoireRef = useRef<HTMLElement | null>(null);
    const trouverRef = useRef<HTMLElement | null>(null);

    const sectionRefs: Record<SectionId, RefObject<HTMLElement | null>> = {
        carte: carteRef,
        histoire: histoireRef,
        trouver: trouverRef,
    };

    /** Smooth-scroll to a board section. Client-only by nature (click handler). */
    const scrollTo = (id: SectionId) => {
        sectionRefs[id].current?.scrollIntoView({
            behavior: reduceMotion ? "auto" : "smooth",
            block: "start",
        });
    };

    useEffect(() => {
        const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
        setReduceMotion(mq.matches);
        const onChange = (event: MediaQueryListEvent) => setReduceMotion(event.matches);
        mq.addEventListener("change", onChange);
        return () => mq.removeEventListener("change", onChange);
    }, []);

    /* Keep the nav's "vous êtes ici" state in sync while scrolling. */
    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                for (const entry of entries) {
                    if (entry.isIntersecting) {
                        const id = (entry.target as HTMLElement).dataset.mpcrepesSection as
                            | SectionId
                            | undefined;
                        if (id) {
                            setActiveSection(id);
                        }
                    }
                }
            },
            /* A band across the upper-middle of the viewport decides the winner. */
            { rootMargin: "-25% 0px -60% 0px" },
        );

        for (const ref of Object.values(sectionRefs)) {
            if (ref.current) {
                observer.observe(ref.current);
            }
        }
        return () => observer.disconnect();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <div className="mpcrepes-root">
            <div className="mpcrepes-shell">
                {/* ── Header — wordmark lockup + French nav ─────────────────── */}
                <header className="mpcrepes-header">
                    <div className="mpcrepes-brand">
                        <span className="mpcrepes-brand__name">Mom-n-Pops</span>
                        <span className="mpcrepes-brand__cuisine">Crêperie</span>
                    </div>
                    <nav className="mpcrepes-nav" aria-label="Sections du tableau">
                        {NAV.map((item) => (
                            <button
                                key={item.id}
                                type="button"
                                className="mpcrepes-nav__item"
                                aria-current={activeSection === item.id ? "true" : undefined}
                                onClick={() => scrollTo(item.id)}
                            >
                                {item.label}
                            </button>
                        ))}
                    </nav>
                </header>

                {/* ── Hero — the chalk rectangle ────────────────────────────── */}
                <section className="mpcrepes-hero" aria-labelledby="mpcrepes-hero-title">
                    <div className="mpcrepes-hero__frame">
                        <div className="mpcrepes-hero__eyebrow">— depuis 2026, Milwaukee —</div>
                        <h1 id="mpcrepes-hero-title" className="mpcrepes-hero__title">
                            Crêpes, folded warm
                            <br />
                            off the <em className="mpcrepes-hero__em">billig</em>.
                        </h1>
                        <p className="mpcrepes-hero__lede">
                            Thin batter spread on a hot round griddle, filled sweet or savory, folded
                            into a warm paper cone. A little corner of Paris, parked in Milwaukee.
                        </p>
                        <div className="mpcrepes-hero__ctas">
                            <Button
                                className="mpcrepes-btn mpcrepes-btn--gold"
                                onClick={() => scrollTo("carte")}
                            >
                                Voir la carte
                            </Button>
                            <Button
                                className="mpcrepes-btn mpcrepes-btn--ghost"
                                onClick={() => scrollTo("trouver")}
                            >
                                Où est le camion ?
                            </Button>
                        </div>
                    </div>
                </section>

                {/* ── La Carte — the chalkboard menu itself ─────────────────── */}
                <section
                    ref={carteRef}
                    data-mpcrepes-section="carte"
                    className="mpcrepes-carte"
                    aria-labelledby="mpcrepes-carte-title"
                >
                    <div className="mpcrepes-carte__head">
                        <h2 id="mpcrepes-carte-title" className="mpcrepes-carte__title">
                            La Carte
                        </h2>
                        <div className="mpcrepes-carte__sub">sucrée &amp; salée</div>
                    </div>
                    <div className="mpcrepes-menu" role="list">
                        {MENU.map((m) => (
                            <div key={m.name} className="mpcrepes-menu__row" role="listitem">
                                <div className="mpcrepes-menu__main">
                                    <div className="mpcrepes-menu__line">
                                        <span className="mpcrepes-menu__name">{m.name}</span>
                                        {/* The fiddly bit worth copying exactly: a flex-1 dotted
                                            baseline leader nudged down 4px so the dots sit on the
                                            text baseline, chalk-menu style. */}
                                        <span className="mpcrepes-menu__leader" aria-hidden="true" />
                                        <span className="mpcrepes-menu__price">{m.price}</span>
                                    </div>
                                    <div className="mpcrepes-menu__desc">
                                        {m.short}
                                        <Badge
                                            size="sm"
                                            variant="outline"
                                            className="mpcrepes-tag"
                                        >
                                            {m.tag}
                                        </Badge>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* ── Notre histoire — Rosa, Sal, and the billig ────────────── */}
                <section
                    ref={histoireRef}
                    data-mpcrepes-section="histoire"
                    className="mpcrepes-story"
                    aria-labelledby="mpcrepes-story-title"
                >
                    <div>
                        <div className="mpcrepes-story__kicker">Notre histoire</div>
                        <h2 id="mpcrepes-story-title" className="mpcrepes-story__title">
                            Rosa learned on a street corner in Montmartre.
                        </h2>
                        <p className="mpcrepes-story__body">
                            One rainy semester abroad, one patient crêpier, a lifelong obsession with
                            getting the batter thin enough. Sal built the round griddle to match.
                            Milwaukee, depuis 2026.
                        </p>
                    </div>
                    {/* The emoji-in-a-chalk-frame card stands in for photography —
                        the hero's dashed rectangle again, one alpha step softer. */}
                    <div className="mpcrepes-story__card">
                        <div className="mpcrepes-story__emoji" role="img" aria-label="Une crêpe">
                            🥞
                        </div>
                        <div className="mpcrepes-story__caption">folded to order, off the billig</div>
                    </div>
                </section>

                {/* ── Où nous trouver — the Milwaukee week ──────────────────── */}
                <section
                    ref={trouverRef}
                    data-mpcrepes-section="trouver"
                    className="mpcrepes-find"
                    aria-labelledby="mpcrepes-find-title"
                >
                    <h2 id="mpcrepes-find-title" className="mpcrepes-find__title">
                        Où nous trouver
                    </h2>
                    <div className="mpcrepes-find__meta">Milwaukee · 9h–20h</div>
                    <div role="list">
                        {SCHEDULE.map((s) => (
                            <div key={s.day} className="mpcrepes-find__row" role="listitem">
                                <span className="mpcrepes-find__day">{s.day}</span>
                                <span className="mpcrepes-find__place">{s.place}</span>
                                <span className="mpcrepes-find__hours">{s.hours}</span>
                            </div>
                        ))}
                    </div>
                </section>
            </div>

            {/* ── Footer — signed off in both languages ─────────────────────── */}
            <footer className="mpcrepes-footer">
                <div className="mpcrepes-footer__inner">
                    <span className="mpcrepes-footer__brand">Mom-n-Pops Crêperie</span>
                    <span>
                        hello<span>@</span>momnpops.truck · @momnpops.mke
                    </span>
                    <span>© 2026 · Milwaukee · Merci</span>
                </div>
                <div className="mpcrepes-footer__note">
                    Mom-n-Pops — un camion fictif, pour la démonstration · Style {style.num} /
                    Crêperie
                </div>
            </footer>
        </div>
    );
}
