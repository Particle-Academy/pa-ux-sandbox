import "./sushi.css";
import { Link } from "@inertiajs/react";
import { useRef, useState } from "react";
import { Button } from "@particle-academy/react-fancy";
import { ArrowLeft, Check } from "lucide-react";
import type { Style } from "../../types";

/**
 * Mom-n-Pops · Style 10 — Sushi (鮨).
 *
 * The Milwaukee family food truck as a tiny eight-seat sushi counter: warm
 * rice-paper off-white, one deep vermilion accent, an enso double-circle
 * hero mark, kanji-prefixed section headings with rules extending to the
 * right, and a dotted-leader counter menu. Calm, editorial, unhurried — no
 * animation at all; the page's only motion is a blurred sticky header and a
 * smooth scroll from the nav. The special surface is RESERVATIONS: a
 * seven-night week strip of card-radio nights color-coded by seat
 * availability (open / few / full), which reveals an inverted near-black
 * summary bar with a party-size stepper and a live-total vermilion Reserve
 * CTA. All of it is controlled React state with stable data-night handles —
 * the mockup's imperative paint() pass is expressed declaratively instead.
 *
 * Mounted by Inspiration/Show.tsx for `style.id === "sushi"` (collection
 * mom-n-pops). SSR-safe: no browser APIs at render time; nav scrolling uses
 * refs inside click handlers only; night data is hardcoded (deterministic
 * first paint). Sticky header stays under the GalleryFrame's z-index 30.
 */

/* ── Data (all deterministic — a real build would fetch availability) ────── */

type NightState = "open" | "few" | "full";

type Night = {
    id: string;
    dow: string;
    date: string;
    label: string;
    state: NightState;
    seats: string;
};

const NIGHTS: Night[] = [
    { id: "tue", dow: "Tue", date: "8", label: "Tuesday Jul 8", state: "open", seats: "6 seats" },
    { id: "wed", dow: "Wed", date: "9", label: "Wednesday Jul 9", state: "few", seats: "2 seats" },
    { id: "thu", dow: "Thu", date: "10", label: "Thursday Jul 10", state: "open", seats: "8 seats" },
    { id: "fri", dow: "Fri", date: "11", label: "Friday Jul 11", state: "full", seats: "Full" },
    { id: "sat", dow: "Sat", date: "12", label: "Saturday Jul 12", state: "few", seats: "3 seats" },
    { id: "sun", dow: "Sun", date: "13", label: "Sunday Jul 13", state: "open", seats: "8 seats" },
    { id: "mon", dow: "Mon", date: "14", label: "Monday Jul 14", state: "full", seats: "Closed" },
];

const MENU = [
    { name: "Salmon Avocado Roll", price: "$7" },
    { name: "Spicy Tuna Roll", price: "$8" },
    { name: "Dragon Roll", price: "$12" },
    { name: "Cucumber Roll", price: "$5" },
    { name: "Chirashi Bowl", price: "$14" },
    { name: "Miso Soup", price: "$3" },
];

const SCHEDULE = [
    { day: "Tuesday", place: "Downtown — Cathedral Sq", hours: "11–2 lunch" },
    { day: "Wednesday", place: "Marquette — Wells St", hours: "11–2 lunch" },
    { day: "Thursday", place: "Third Ward Riverwalk", hours: "11–2 · omakase pm" },
    { day: "Friday", place: "Historic Third Ward", hours: "omakase only" },
    { day: "Saturday", place: "South Shore Market", hours: "9–1 · omakase pm" },
    { day: "Sunday", place: "East Side — Downer", hours: "omakase only" },
];

const SEAT_PRICE = 60;
const MIN_PARTY = 1;
const MAX_PARTY = 8;

/* ── Page ────────────────────────────────────────────────────────────────── */

export default function Sushi({ style }: { style: Style }) {
    const [pickedId, setPickedId] = useState<string | null>(null);
    const [party, setParty] = useState(2);
    const [reserved, setReserved] = useState(false);

    const menuRef = useRef<HTMLElement | null>(null);
    const bookRef = useRef<HTMLElement | null>(null);
    const findRef = useRef<HTMLElement | null>(null);

    const picked = NIGHTS.find((n) => n.id === pickedId) ?? null;
    const total = party * SEAT_PRICE;

    /** Smooth-scroll a section into view — refs only, runs on click (client). */
    const scrollTo = (ref: React.RefObject<HTMLElement | null>) => () => {
        ref.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    };

    const pickNight = (night: Night) => {
        if (night.state === "full") {
            return;
        }
        setPickedId(night.id);
        setReserved(false);
    };

    const bumpParty = (delta: number) => {
        setParty((p) => Math.min(MAX_PARTY, Math.max(MIN_PARTY, p + delta)));
        setReserved(false);
    };

    return (
        <div className="mpsushi-root">
            {/* ── Sticky header: enso dot · wordmark · 寿司 · nav ─────────── */}
            <header className="mpsushi-header">
                <div className="mpsushi-container mpsushi-header__inner">
                    <div className="mpsushi-brand">
                        <span className="mpsushi-brand__enso" aria-hidden />
                        <span className="mpsushi-brand__name">Mom-n-Pops</span>
                        <span className="mpsushi-brand__kanji">寿司</span>
                    </div>
                    <nav className="mpsushi-nav" aria-label="Page sections">
                        <Button variant="ghost" className="mpsushi-navlink" onClick={scrollTo(menuRef)}>
                            Menu
                        </Button>
                        <Button variant="ghost" className="mpsushi-navlink" onClick={scrollTo(bookRef)}>
                            Reserve omakase
                        </Button>
                        <Button variant="ghost" className="mpsushi-navlink" onClick={scrollTo(findRef)}>
                            Find us
                        </Button>
                    </nav>
                </div>
            </header>

            {/* ── Hero: three-line headline + the enso mark ───────────────── */}
            <div className="mpsushi-container">
                <section className="mpsushi-hero">
                    <div className="mpsushi-hero__copy">
                        <p className="mpsushi-eyebrow">Eight seats · Milwaukee · since 2026</p>
                        <h1 className="mpsushi-display">
                            Rolled to order.
                            <br />
                            Nothing sits.
                            <br />
                            <span className="mpsushi-display__accent">Nothing hurried.</span>
                        </h1>
                        <p className="mpsushi-lede">
                            A tiny sushi counter on wheels. Fish cut that morning, rice seasoned by
                            hand. Walk up for a roll — or book one of eight omakase seats.
                        </p>
                    </div>
                    <div className="mpsushi-hero__mark" aria-hidden>
                        <span className="mpsushi-enso__ring" />
                        <span className="mpsushi-enso__disc">
                            <span className="mpsushi-enso__glyph">鮨</span>
                        </span>
                    </div>
                </section>
            </div>

            {/* ── お品書き · The counter menu ──────────────────────────────── */}
            <div className="mpsushi-band">
                <div className="mpsushi-container">
                    <section ref={menuRef} className="mpsushi-section" aria-labelledby="mpsushi-menu-h">
                        <div className="mpsushi-rulehead">
                            <h2 id="mpsushi-menu-h" className="mpsushi-h2">
                                お品書き · The counter menu
                            </h2>
                            <span className="mpsushi-rulehead__rule" aria-hidden />
                        </div>
                        <div className="mpsushi-menu">
                            {MENU.map((m) => (
                                <div key={m.name} className="mpsushi-menu__row">
                                    <span className="mpsushi-menu__name">{m.name}</span>
                                    <span className="mpsushi-menu__leader" aria-hidden />
                                    <span className="mpsushi-menu__price">{m.price}</span>
                                </div>
                            ))}
                        </div>
                    </section>
                </div>
            </div>

            {/* ── おまかせ · Reserve omakase — the Reservations surface ───── */}
            <div className="mpsushi-band mpsushi-band--tinted">
                <div className="mpsushi-container">
                    <section ref={bookRef} data-book className="mpsushi-section" aria-labelledby="mpsushi-book-h">
                        <div className="mpsushi-rulehead mpsushi-rulehead--tight">
                            <h2 id="mpsushi-book-h" className="mpsushi-h2">
                                おまかせ · Reserve omakase
                            </h2>
                            <span className="mpsushi-rulehead__rule" aria-hidden />
                        </div>
                        <p className="mpsushi-book__sub">
                            $60 / seat · 12 courses, chef's choice · two seatings a night, eight
                            seats each. Pick a night.
                        </p>

                        <div className="mpsushi-week" role="radiogroup" aria-label="Pick an omakase night">
                            {NIGHTS.map((night) => {
                                const isPicked = night.id === pickedId;
                                const isFull = night.state === "full";
                                return (
                                    <button
                                        key={night.id}
                                        type="button"
                                        role="radio"
                                        aria-checked={isPicked}
                                        aria-label={`${night.label} — ${night.seats}`}
                                        data-night={night.id}
                                        disabled={isFull}
                                        onClick={() => pickNight(night)}
                                        className={
                                            "mpsushi-night" +
                                            (isPicked ? " mpsushi-night--picked" : "") +
                                            (isFull ? " mpsushi-night--full" : "")
                                        }
                                    >
                                        <span className="mpsushi-night__dow">{night.dow}</span>
                                        <span className="mpsushi-night__date">{night.date}</span>
                                        <span
                                            className={`mpsushi-night__seats mpsushi-night__seats--${night.state}`}
                                            data-seats={night.state}
                                        >
                                            {night.seats}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>

                        {picked && (
                            <div className="mpsushi-bar">
                                <div className="mpsushi-bar__info">
                                    <div className="mpsushi-bar__label">Selected</div>
                                    <div className="mpsushi-bar__night">{picked.label}</div>
                                    <div className="mpsushi-bar__meta">
                                        {picked.seats} · ${SEAT_PRICE} / seat
                                    </div>
                                </div>

                                {reserved ? (
                                    <div className="mpsushi-confirm" role="status">
                                        <span className="mpsushi-confirm__badge" aria-hidden>
                                            <Check size={14} strokeWidth={3} />
                                        </span>
                                        <div className="mpsushi-confirm__copy">
                                            <div className="mpsushi-confirm__title">
                                                Seats requested — {picked.label}, party of {party}.
                                            </div>
                                            <div className="mpsushi-confirm__note">
                                                Rosa texts back within the hour. Nothing charged until
                                                you're at the counter.
                                            </div>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            className="mpsushi-change"
                                            onClick={() => setReserved(false)}
                                        >
                                            Change
                                        </Button>
                                    </div>
                                ) : (
                                    <>
                                        <div className="mpsushi-stepper" aria-label="Party size">
                                            <Button
                                                variant="ghost"
                                                className="mpsushi-step"
                                                aria-label="One fewer seat"
                                                disabled={party <= MIN_PARTY}
                                                onClick={() => bumpParty(-1)}
                                            >
                                                −
                                            </Button>
                                            <span className="mpsushi-stepper__count" aria-live="polite">
                                                {party}
                                            </span>
                                            <Button
                                                variant="ghost"
                                                className="mpsushi-step"
                                                aria-label="One more seat"
                                                disabled={party >= MAX_PARTY}
                                                onClick={() => bumpParty(1)}
                                            >
                                                +
                                            </Button>
                                        </div>
                                        <Button className="mpsushi-cta" onClick={() => setReserved(true)}>
                                            Reserve {party} · ${total}
                                        </Button>
                                    </>
                                )}
                            </div>
                        )}
                    </section>
                </div>
            </div>

            {/* ── Story pull-quote + Find us (schedule) ───────────────────── */}
            <div className="mpsushi-band">
                <div className="mpsushi-container">
                    <section className="mpsushi-story">
                        <h2 className="mpsushi-quote">
                            Sal apprenticed for a year before we sold a single roll.
                        </h2>
                        <p className="mpsushi-story__body">
                            Rosa runs the rice — the part everyone underrates. Sal trained under an
                            itamae in Chicago and won't cut corners. The truck holds eight seats at
                            a little counter, and that's exactly how they like it.
                        </p>
                    </section>

                    <section ref={findRef} className="mpsushi-find" aria-labelledby="mpsushi-find-h">
                        <h2 id="mpsushi-find-h" className="mpsushi-h2 mpsushi-find__h">
                            Find us
                        </h2>
                        <div className="mpsushi-sched">
                            {SCHEDULE.map((s) => (
                                <div key={s.day} className="mpsushi-sched__row">
                                    <span className="mpsushi-sched__day">{s.day}</span>
                                    <span className="mpsushi-sched__place">{s.place}</span>
                                    <span className="mpsushi-sched__hours">{s.hours}</span>
                                </div>
                            ))}
                        </div>
                    </section>
                </div>
            </div>

            {/* ── Footer ───────────────────────────────────────────────────── */}
            <footer className="mpsushi-footer">
                <div className="mpsushi-container mpsushi-footer__inner">
                    <span className="mpsushi-footer__brand">Mom-n-Pops 寿司</span>
                    <span>
                        hello<span>@</span>momnpops.truck · @momnpops.mke
                    </span>
                    <span>© 2026 · Milwaukee</span>
                </div>
                <div className="mpsushi-container mpsushi-demoline">
                    <span>
                        Mom-n-Pops — a fictional food truck, for demonstration · Style {style.num} /{" "}
                        {style.name}
                    </span>
                    <Link href="/inspiration/mom-n-pops" className="mpsushi-back">
                        <ArrowLeft size={13} />
                        Back to the collection
                    </Link>
                </div>
            </footer>
        </div>
    );
}
