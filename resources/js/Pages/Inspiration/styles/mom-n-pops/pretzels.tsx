import "./pretzels.css";
import { Link } from "@inertiajs/react";
import { Fragment, useState } from "react";
import { Badge, Button, Callout, Card, Navbar, Tooltip } from "@particle-academy/react-fancy";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import type { Style } from "../../types";

/**
 * Mom-n-Pops · Style 15 — Brezeln.
 *
 * The family food truck as a refined biergarten menu-board: warm parchment
 * (#F4F1E7) under white hero/header/card panels, dark coffee-brown ink, and a
 * restrained two-hue palette — Bavarian blue (#1C6BB0) for money and action,
 * pretzel amber (#C6873A) for kickers and midday chips. The design's signature
 * move is the pure-CSS Bavarian rautenmuster (four 45deg-family linear
 * gradients on a 28px tile): an 18px flag ribbon up top, reused as the hero
 * card's backdrop. German-English garnish carries the theme (Brezeln, seit
 * 2026, Die Speisekarte, Unsere Geschichte). Zero photos — the hero is an
 * 88px pretzel emoji on a white hairline card. Motion is essentially none:
 * hairlines, white space, and one soft shadow do all the work.
 *
 * The special surface is "Where we'll be": a week calendar drawn as a
 * day-part band grid (two service windows, 11–3 and 3–9, not an hour agenda).
 * Stops are controlled JSON events; tapping a chip promotes it into a solid
 * blue detail banner with a gold trust-but-verify "Set a reminder" toggle.
 * The mockup's inert chevrons are wired to real week paging over a
 * three-week schedule array, and the mockup's imperative paint() today-badge
 * hack is replaced by a declarative `today` flag on the data.
 *
 * Fancy primitives worn by the design: Navbar (the sticky biergarten header —
 * brand + anchor items + the "Find the truck" pill), Card (the six Speisekarte
 * menu items and the four Geschichte stat tiles, flattened to white hairline
 * panels), Callout (the selected-stop promotion, restyled from an alert into
 * the one solid-blue banner), Button (blue fills, cream outline, ghost chevron
 * week-pagers, the gold reminder toggle), Badge (the BREZELN wordmark tag
 * stripped to letterspaced blue caps), Tooltip (the Monday today-badge fine
 * print). Only the band grid itself is hand-rolled — react-fancy's Calendar is
 * a date picker, not a day-part week board — with stable data-stop/data-week
 * handles on every chip so agents never guess DOM.
 *
 * Mounted by Inspiration/Show.tsx for mom-n-pops / `style.id === "pretzels"`.
 * SSR-safe: all data static, no timers, no Date/randomness during render;
 * "today" is a deterministic flag on the schedule data (Mon Jul 7, the
 * fictional brand-date), so first paint is identical on server and client.
 */

type MenuItem = { name: string; price: string; short: string };

type Stop = { place: string; hours: string; note: string };

type Band = "mid" | "eve";

type Day = {
    dow: string;
    date: string;
    /** Deterministic "today" — the fictional brand date, never the wall clock. */
    today?: boolean;
    mid: Stop | null;
    eve: Stop | null;
};

type Week = { id: string; tag: string; label: string; days: Day[] };

const MENU: MenuItem[] = [
    { name: "Classic Soft Pretzel", price: "$5", short: "Lye-dipped, coarse salt, house mustard." },
    { name: "Beer-Cheese Pretzel", price: "$7", short: "Wisconsin cheddar-ale dip." },
    { name: "Pretzel Bites", price: "$6", short: "A basket, two mustards." },
    { name: "Cinnamon-Sugar Twist", price: "$5", short: "Buttered, cinnamon sugar." },
    { name: "Bratwurst Pretzel Bun", price: "$9", short: "Local brat, kraut, mustard." },
    { name: "Obatzda & Pretzel", price: "$8", short: "Bavarian beer-cheese spread." },
];

const STATS: { v: string; k: string }[] = [
    { v: "by hand", k: "every twist" },
    { v: "lye-dipped", k: "real mahogany shell" },
    { v: "2026", k: "est. Milwaukee" },
    { v: "3", k: "beer gardens / wk" },
];

/**
 * Three weeks of the Milwaukee beer-garden circuit. The middle week is the
 * mockup's hardcoded Jul 7–13 verbatim; its neighbors extend the same
 * evening-heavy rhythm so the (previously inert) chevrons page real data.
 */
const WEEKS: Week[] = [
    {
        id: "jun30",
        tag: "Last week",
        label: "Jun 30 – Jul 6",
        days: [
            { dow: "Mon", date: "30", mid: null, eve: null },
            { dow: "Tue", date: "1", mid: null, eve: { place: "Estabrook Beer Garden", hours: "3–9", note: "Riverside, dog-friendly" } },
            { dow: "Wed", date: "2", mid: null, eve: { place: "Hubbard Park", hours: "3–9", note: "Shorewood beer garden" } },
            { dow: "Thu", date: "3", mid: null, eve: { place: "Juneau Park", hours: "3–9", note: "Lakefront bluff" } },
            { dow: "Fri", date: "4", mid: { place: "Veterans Park", hours: "11–3", note: "Fourth on the lakefront" }, eve: { place: "Veterans Park", hours: "4–9", note: "Fireworks crowd" } },
            { dow: "Sat", date: "5", mid: { place: "S. Shore Beer Garden", hours: "12–4", note: "Lakefront" }, eve: { place: "S. Shore Beer Garden", hours: "4–9", note: "Sunset pretzels" } },
            { dow: "Sun", date: "6", mid: { place: "Humboldt Park", hours: "12–7", note: "Bandshell" }, eve: null },
        ],
    },
    {
        id: "jul7",
        tag: "This week",
        label: "Jul 7–13",
        days: [
            { dow: "Mon", date: "7", today: true, mid: null, eve: null },
            { dow: "Tue", date: "8", mid: null, eve: { place: "Estabrook Beer Garden", hours: "3–9", note: "Riverside, dog-friendly" } },
            { dow: "Wed", date: "9", mid: null, eve: { place: "Hubbard Park", hours: "3–9", note: "Shorewood beer garden" } },
            { dow: "Thu", date: "10", mid: null, eve: { place: "Brady Street", hours: "3–9", note: "Evening stroll" } },
            { dow: "Fri", date: "11", mid: { place: "Third Ward Riverwalk", hours: "11–2", note: "Lunch rush" }, eve: { place: "Third Ward Riverwalk", hours: "5–9", note: "Happy hour" } },
            { dow: "Sat", date: "12", mid: { place: "S. Shore Beer Garden", hours: "12–4", note: "Lakefront" }, eve: { place: "S. Shore Beer Garden", hours: "4–9", note: "Sunset pretzels" } },
            { dow: "Sun", date: "13", mid: { place: "Humboldt Park", hours: "12–7", note: "Bandshell" }, eve: null },
        ],
    },
    {
        id: "jul14",
        tag: "Next week",
        label: "Jul 14–20",
        days: [
            { dow: "Mon", date: "14", mid: null, eve: null },
            { dow: "Tue", date: "15", mid: null, eve: { place: "Estabrook Beer Garden", hours: "3–9", note: "Riverside, dog-friendly" } },
            { dow: "Wed", date: "16", mid: null, eve: { place: "The Landing at Hoyt Park", hours: "3–9", note: "Tosa beer garden" } },
            { dow: "Thu", date: "17", mid: null, eve: { place: "Cathedral Square", hours: "5–9", note: "Jazz in the park" } },
            { dow: "Fri", date: "18", mid: { place: "Third Ward Riverwalk", hours: "11–2", note: "Lunch rush" }, eve: { place: "Third Ward Riverwalk", hours: "5–9", note: "Happy hour" } },
            { dow: "Sat", date: "19", mid: { place: "Kadish Park", hours: "12–4", note: "River overlook" }, eve: { place: "Kadish Park", hours: "4–9", note: "City-lights view" } },
            { dow: "Sun", date: "20", mid: { place: "Humboldt Park", hours: "12–7", note: "Bandshell" }, eve: null },
        ],
    },
];

/** The two service windows — a day-part band grid, not an hour grid. */
const BANDS: { band: Band; label: string }[] = [
    { band: "mid", label: "11–3" },
    { band: "eve", label: "3–9" },
];

/** Index of the brand's "current" week (Jul 7–13) — the default view. */
const THIS_WEEK = 1;

export default function Pretzels({ style }: { style: Style }) {
    /** Which week the calendar shows; chevrons page it over WEEKS. */
    const [weekIdx, setWeekIdx] = useState(THIS_WEEK);

    /**
     * Selected stop — indices into the CURRENT week (day index + band).
     * Selection promotes the chip into the blue detail banner below the
     * grid, and clears whenever the week pages so the banner never refers
     * to an off-screen stop.
     */
    const [sel, setSel] = useState<{ d: number; band: Band } | null>(null);

    /** Stops the visitor asked to be reminded about, keyed week:dow:band. */
    const [reminders, setReminders] = useState<Set<string>>(() => new Set());

    const week = WEEKS[weekIdx];
    const selDay = sel ? week.days[sel.d] : null;
    const selStop = sel && selDay ? selDay[sel.band] : null;
    const selKey = sel && selDay ? `${week.id}:${selDay.dow}:${sel.band}` : null;
    const reminded = selKey !== null && reminders.has(selKey);

    const changeWeek = (delta: number) => {
        setWeekIdx((i) => Math.min(WEEKS.length - 1, Math.max(0, i + delta)));
        setSel(null);
    };

    const toggleReminder = () => {
        if (selKey === null) {
            return;
        }
        setReminders((prev) => {
            const next = new Set(prev);
            if (next.has(selKey)) {
                next.delete(selKey);
            } else {
                next.add(selKey);
            }
            return next;
        });
    };

    return (
        <div className="mppretzels-root">
            {/* ── Bavarian diamond ribbon (pure-CSS rautenmuster) ─────────── */}
            <div className="mppretzels-rauten mppretzels-ribbon" aria-hidden />

            {/* ── Sticky white hairline header (Navbar, restyled) ─────────── */}
            <Navbar className="mppretzels-header">
                <Navbar.Brand className="mppretzels-brandwrap">
                    <Link href="/inspiration/mom-n-pops" className="mppretzels-brand">
                        <span className="mppretzels-brand__name">Mom-n-Pops</span>
                        <Badge size="sm" variant="soft" className="mppretzels-brand__tag">
                            BREZELN
                        </Badge>
                    </Link>
                </Navbar.Brand>
                <Navbar.Items className="mppretzels-nav">
                    <Navbar.Item href="#mppretzels-menu" className="mppretzels-nav__link">
                        Menu
                    </Navbar.Item>
                    <Navbar.Item href="#mppretzels-cal" className="mppretzels-nav__link">
                        Where we&rsquo;ll be
                    </Navbar.Item>
                    <Navbar.Item href="#mppretzels-story" className="mppretzels-nav__link">
                        Story
                    </Navbar.Item>
                    <Button
                        href="#mppretzels-cal"
                        size="sm"
                        className="mppretzels-btn mppretzels-btn--primary mppretzels-btn--nav"
                    >
                        Find the truck
                    </Button>
                </Navbar.Items>
            </Navbar>

            {/* ── Hero: copy left, emoji card over the diamond pattern ────── */}
            <section className="mppretzels-hero" aria-labelledby="mppretzels-hero-title">
                <div className="mppretzels-hero__in">
                    <div className="mppretzels-hero__copy">
                        <div className="mppretzels-kicker">Hand-rolled · Milwaukee · seit 2026</div>
                        <h1 id="mppretzels-hero-title" className="mppretzels-hero__title">
                            Big soft pretzels, twisted by hand.
                        </h1>
                        <p className="mppretzels-hero__sub">
                            Lye-dipped, salted, baked to a deep mahogany, served warm with
                            mustard you&rsquo;ll want to drink. We follow the beer gardens —
                            check the calendar.
                        </p>
                        <div className="mppretzels-hero__cta">
                            <Button
                                href="#mppretzels-menu"
                                className="mppretzels-btn mppretzels-btn--primary mppretzels-btn--hero"
                            >
                                See the menu
                            </Button>
                            <Button
                                href="#mppretzels-cal"
                                className="mppretzels-btn mppretzels-btn--secondary mppretzels-btn--hero"
                            >
                                This week&rsquo;s stops
                            </Button>
                        </div>
                    </div>
                    <div className="mppretzels-hero__art">
                        <div className="mppretzels-rauten mppretzels-hero__backdrop" aria-hidden />
                        <div className="mppretzels-hero__card">
                            <div className="mppretzels-hero__emoji" aria-hidden>🥨</div>
                            <div className="mppretzels-hero__caption">baked in small batches, all day</div>
                        </div>
                    </div>
                </div>
            </section>

            <div className="mppretzels-container">
                {/* ── Die Speisekarte (menu grid) ─────────────────────────── */}
                <section id="mppretzels-menu" className="mppretzels-menu" aria-labelledby="mppretzels-menu-title">
                    <div className="mppretzels-menu__head">
                        <h2 id="mppretzels-menu-title" className="mppretzels-h2">Die Speisekarte</h2>
                        <span className="mppretzels-menu__aside">— the menu</span>
                    </div>
                    <div className="mppretzels-menu__grid">
                        {MENU.map((m) => (
                            <Card
                                key={m.name}
                                variant="flat"
                                padding="none"
                                className="mppretzels-menu__card"
                            >
                                <div className="mppretzels-menu__row">
                                    <span className="mppretzels-menu__name">{m.name}</span>
                                    <span className="mppretzels-menu__price">{m.price}</span>
                                </div>
                                <p className="mppretzels-menu__short">{m.short}</p>
                            </Card>
                        ))}
                    </div>
                </section>

                {/* ── Where we'll be (weekly day-part band calendar) ──────── */}
                <section id="mppretzels-cal" className="mppretzels-cal" aria-labelledby="mppretzels-cal-title">
                    <div className="mppretzels-cal__frame" data-week={week.id}>
                        <div className="mppretzels-cal__toolbar">
                            <CalendarDays size={18} className="mppretzels-cal__icon" aria-hidden />
                            <div className="mppretzels-cal__titles">
                                <div id="mppretzels-cal-title" className="mppretzels-cal__title">
                                    Where we&rsquo;ll be
                                </div>
                                <div className="mppretzels-cal__helper">
                                    {week.tag} · {week.label} · tap a stop for details
                                </div>
                            </div>
                            <div className="mppretzels-cal__nav">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="mppretzels-btn mppretzels-btn--chev"
                                    aria-label="Previous week"
                                    disabled={weekIdx === 0}
                                    onClick={() => changeWeek(-1)}
                                >
                                    <ChevronLeft size={16} aria-hidden />
                                </Button>
                                <span className="mppretzels-cal__label">{week.label}</span>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="mppretzels-btn mppretzels-btn--chev"
                                    aria-label="Next week"
                                    disabled={weekIdx === WEEKS.length - 1}
                                    onClick={() => changeWeek(1)}
                                >
                                    <ChevronRight size={16} aria-hidden />
                                </Button>
                            </div>
                        </div>

                        <div className="mppretzels-cal__scroll">
                            <div className="mppretzels-cal__grid">
                                {/* Corner spacer over the time-band gutter */}
                                <div className="mppretzels-cal__corner" aria-hidden />

                                {/* Day header row — the today badge is declarative */}
                                {week.days.map((d) => (
                                    <div key={d.dow} className="mppretzels-cal__dayhead">
                                        <div className="mppretzels-cal__dow">{d.dow}</div>
                                        {d.today ? (
                                            <Tooltip
                                                content="Heute — the oven rests on Mondays."
                                                placement="top"
                                                className="mppretzels-tip"
                                            >
                                                <div className="mppretzels-cal__date mppretzels-cal__date--today">
                                                    {d.date}
                                                </div>
                                            </Tooltip>
                                        ) : (
                                            <div className="mppretzels-cal__date">{d.date}</div>
                                        )}
                                    </div>
                                ))}

                                {/* Two day-part band rows: 11–3 amber, 3–9 blue */}
                                {BANDS.map(({ band, label }) => (
                                    <Fragment key={band}>
                                        <div className="mppretzels-cal__gutter">{label}</div>
                                        {week.days.map((d, di) => {
                                            const stop = d[band];
                                            const active = sel !== null && sel.d === di && sel.band === band;
                                            return (
                                                <div key={`${d.dow}-${band}`} className="mppretzels-cal__cell">
                                                    {stop && (
                                                        <button
                                                            type="button"
                                                            className={`mppretzels-chip mppretzels-chip--${band}${active ? " mppretzels-chip--active" : ""}`}
                                                            data-stop={`${week.id}:${d.dow}:${band}`}
                                                            aria-pressed={active}
                                                            aria-label={`${stop.place}, ${d.dow} ${d.date}, ${stop.hours}`}
                                                            onClick={() => setSel(active ? null : { d: di, band })}
                                                        >
                                                            <span className="mppretzels-chip__place">{stop.place}</span>
                                                            <span className="mppretzels-chip__hours">{stop.hours}</span>
                                                        </button>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </Fragment>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Selected-stop promotion — a Callout restyled into the
                        one high-saturation block; the stable data-selected-stop
                        handle rides the inner row (Callout forwards no rest props). */}
                    {selDay && selStop && (
                        <Callout color="blue" className="mppretzels-banner">
                            <div className="mppretzels-banner__inner" data-selected-stop={selKey ?? undefined}>
                                <div className="mppretzels-banner__main">
                                    <div className="mppretzels-banner__when">
                                        {selDay.dow} {selDay.date} · {selStop.hours}
                                    </div>
                                    <div className="mppretzels-banner__place">{selStop.place}</div>
                                    <div className="mppretzels-banner__note">{selStop.note}</div>
                                </div>
                                <Button
                                    className={`mppretzels-btn mppretzels-btn--gold${reminded ? " mppretzels-btn--gold-set" : ""}`}
                                    onClick={toggleReminder}
                                >
                                    {reminded ? "Reminder set — see you there" : "Set a reminder"}
                                </Button>
                            </div>
                        </Callout>
                    )}
                </section>

                {/* ── Unsere Geschichte (story + stats) ───────────────────── */}
                <section id="mppretzels-story" className="mppretzels-story" aria-labelledby="mppretzels-story-title">
                    <div className="mppretzels-story__copy">
                        <div className="mppretzels-kicker">Unsere Geschichte</div>
                        <h2 id="mppretzels-story-title" className="mppretzels-story__title">
                            Milwaukee loves a beer garden. We brought the pretzels.
                        </h2>
                        <p className="mppretzels-story__body">
                            Sal&rsquo;s family is old Milwaukee German; the pretzel recipe came
                            off a card in his grandfather&rsquo;s hand. Rosa perfected the lye
                            dip. Hand-twisted, baked in small batches so they&rsquo;re always
                            warm. Milwaukee, seit 2026.
                        </p>
                    </div>
                    <div className="mppretzels-stats">
                        {STATS.map((s) => (
                            <Card
                                key={s.k}
                                variant="flat"
                                padding="none"
                                className="mppretzels-stat"
                            >
                                <div className="mppretzels-stat__v">{s.v}</div>
                                <div className="mppretzels-stat__k">{s.k}</div>
                            </Card>
                        ))}
                    </div>
                </section>
            </div>

            {/* ── Dark coffee-brown footer ────────────────────────────────── */}
            <footer className="mppretzels-footer">
                <div className="mppretzels-footer__in">
                    <span className="mppretzels-footer__brand">Mom-n-Pops Brezeln</span>
                    <span className="mppretzels-footer__contact">
                        hello<span>@</span>momnpops.truck · @momnpops.mke
                    </span>
                    <span>© 2026 · Milwaukee</span>
                </div>
                <div className="mppretzels-footer__folio">
                    Mom-n-Pops — a fictional food truck, for demonstration · Style {style.num} / Brezeln
                </div>
            </footer>
        </div>
    );
}
