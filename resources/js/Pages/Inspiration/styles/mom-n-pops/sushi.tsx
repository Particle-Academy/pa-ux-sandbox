import "./sushi.css";
import { Link } from "@inertiajs/react";
import { useRef, useState } from "react";
import { Badge, Button, Callout, Card, Heading, Table, Text } from "@particle-academy/react-fancy";
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
 * Built from RESTYLED Fancy primitives, not hand-rolled markup: Heading/Text
 * carry the display + prose, Table wears the two data lists (the dotted-leader
 * counter menu and the Find-us timetable — zero-chrome, hairline-only), Badge
 * carries the open/few/full seat-availability status, Card wears the seven
 * night cards (as a controlled card-radio group) and the inverted selected-
 * night bar, Callout wears the reservation confirmation, and Button wears the
 * nav links, the party stepper, the Reserve CTA, and Change. Bespoke art that
 * no primitive owns stays hand-rolled: the enso mark, the dotted-leader
 * texture, the frosted sticky header, and the declarative selection ring.
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

/** Two dotted-leader columns — a Table each, laid side-by-side on the grid. */
const MENU_COLS = [MENU.slice(0, 3), MENU.slice(3)];

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
                        <Text as="p" className="mpsushi-eyebrow">
                            Eight seats · Milwaukee · since 2026
                        </Text>
                        <Heading as="h1" className="mpsushi-display">
                            Rolled to order.
                            <br />
                            Nothing sits.
                            <br />
                            <span className="mpsushi-display__accent">Nothing hurried.</span>
                        </Heading>
                        <Text as="p" className="mpsushi-lede">
                            A tiny sushi counter on wheels. Fish cut that morning, rice seasoned by
                            hand. Walk up for a roll — or book one of eight omakase seats.
                        </Text>
                    </div>
                    <div className="mpsushi-hero__mark" aria-hidden>
                        <span className="mpsushi-enso__ring" />
                        <span className="mpsushi-enso__disc">
                            <span className="mpsushi-enso__glyph">鮨</span>
                        </span>
                    </div>
                </section>
            </div>

            {/* ── お品書き · The counter menu (two Tables) ─────────────────── */}
            <div className="mpsushi-band">
                <div className="mpsushi-container">
                    <section ref={menuRef} className="mpsushi-section" aria-labelledby="mpsushi-menu-h">
                        <div className="mpsushi-rulehead">
                            <Heading as="h2" id="mpsushi-menu-h" className="mpsushi-h2">
                                お品書き · The counter menu
                            </Heading>
                            <span className="mpsushi-rulehead__rule" aria-hidden />
                        </div>
                        <div className="mpsushi-menu">
                            {MENU_COLS.map((col, ci) => (
                                <Table key={ci} className="mpsushi-menu__table">
                                    <Table.Body>
                                        {col.map((m) => (
                                            <Table.Row key={m.name} className="mpsushi-menu__row">
                                                <Table.Cell className="mpsushi-menu__name">
                                                    {m.name}
                                                </Table.Cell>
                                                <Table.Cell className="mpsushi-menu__leadcell">
                                                    <span className="mpsushi-menu__leader" aria-hidden />
                                                </Table.Cell>
                                                <Table.Cell className="mpsushi-menu__price">
                                                    {m.price}
                                                </Table.Cell>
                                            </Table.Row>
                                        ))}
                                    </Table.Body>
                                </Table>
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
                            <Heading as="h2" id="mpsushi-book-h" className="mpsushi-h2">
                                おまかせ · Reserve omakase
                            </Heading>
                            <span className="mpsushi-rulehead__rule" aria-hidden />
                        </div>
                        <Text as="p" className="mpsushi-book__sub">
                            $60 / seat · 12 courses, chef's choice · two seatings a night, eight
                            seats each. Pick a night.
                        </Text>

                        <div className="mpsushi-week" role="radiogroup" aria-label="Pick an omakase night">
                            {NIGHTS.map((night) => {
                                const isPicked = night.id === pickedId;
                                const isFull = night.state === "full";
                                return (
                                    <Card
                                        key={night.id}
                                        variant="outlined"
                                        padding="none"
                                        role="radio"
                                        aria-checked={isPicked}
                                        aria-label={`${night.label} — ${night.seats}`}
                                        aria-disabled={isFull || undefined}
                                        tabIndex={isFull ? -1 : 0}
                                        data-night={night.id}
                                        onClick={() => pickNight(night)}
                                        onKeyDown={(e) => {
                                            if (isFull) {
                                                return;
                                            }
                                            if (e.key === "Enter" || e.key === " ") {
                                                e.preventDefault();
                                                pickNight(night);
                                            }
                                        }}
                                        className={
                                            "mpsushi-night" +
                                            (isPicked ? " mpsushi-night--picked" : "") +
                                            (isFull ? " mpsushi-night--full" : "")
                                        }
                                    >
                                        <span className="mpsushi-night__dow">{night.dow}</span>
                                        <span className="mpsushi-night__date">{night.date}</span>
                                        <Badge
                                            variant="soft"
                                            className={`mpsushi-seatbadge mpsushi-seatbadge--${night.state}`}
                                            data-seats={night.state}
                                        >
                                            {night.seats}
                                        </Badge>
                                    </Card>
                                );
                            })}
                        </div>

                        {picked && (
                            <Card variant="flat" padding="none" className="mpsushi-bar">
                                <div className="mpsushi-bar__info">
                                    <div className="mpsushi-bar__label">Selected</div>
                                    <div className="mpsushi-bar__night">{picked.label}</div>
                                    <div className="mpsushi-bar__meta">
                                        {picked.seats} · ${SEAT_PRICE} / seat
                                    </div>
                                </div>

                                {reserved ? (
                                    <Callout
                                        color="gray"
                                        className="mpsushi-confirm"
                                        icon={
                                            <span className="mpsushi-confirm__badge" aria-hidden>
                                                <Check size={14} strokeWidth={3} />
                                            </span>
                                        }
                                    >
                                        <div className="mpsushi-confirm__row">
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
                                    </Callout>
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
                            </Card>
                        )}
                    </section>
                </div>
            </div>

            {/* ── Story pull-quote + Find us (schedule) ───────────────────── */}
            <div className="mpsushi-band">
                <div className="mpsushi-container">
                    <section className="mpsushi-story">
                        <Heading as="h2" className="mpsushi-quote">
                            Sal apprenticed for a year before we sold a single roll.
                        </Heading>
                        <Text as="p" className="mpsushi-story__body">
                            Rosa runs the rice — the part everyone underrates. Sal trained under an
                            itamae in Chicago and won't cut corners. The truck holds eight seats at
                            a little counter, and that's exactly how they like it.
                        </Text>
                    </section>

                    <section ref={findRef} className="mpsushi-find" aria-labelledby="mpsushi-find-h">
                        <Heading as="h2" id="mpsushi-find-h" className="mpsushi-h2 mpsushi-find__h">
                            Find us
                        </Heading>
                        <Table className="mpsushi-sched">
                            <Table.Body>
                                {SCHEDULE.map((s) => (
                                    <Table.Row key={s.day} className="mpsushi-sched__row">
                                        <Table.Cell className="mpsushi-sched__day">{s.day}</Table.Cell>
                                        <Table.Cell className="mpsushi-sched__place">{s.place}</Table.Cell>
                                        <Table.Cell className="mpsushi-sched__hours">{s.hours}</Table.Cell>
                                    </Table.Row>
                                ))}
                            </Table.Body>
                        </Table>
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
