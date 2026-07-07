import "./coffee.css";
import { Link } from "@inertiajs/react";
import { useState } from "react";
import { Badge, Button, Modal } from "@particle-academy/react-fancy";
import type { Style } from "../../types";

/**
 * Mom-n-Pops · Style 02 — Coffee.
 *
 * The family truck as a family COFFEE CART, set like a quiet magazine page:
 * warm cream paper (#F5EFE6), espresso ink, Georgia serif display type at
 * regular weight, mono eyebrows, and 1px hairline rules carrying the entire
 * vertical rhythm. No cards, no fills, no photos, no CTA button anywhere —
 * hierarchy is purely typographic. Six menu rows with classic dotted price
 * leaders open the one elevated surface on the page: a restyled react-fancy
 * Modal item card (the only rounded corner in the design). The schedule is a
 * printed-transit-table grid; the footer keeps the anti-scrape split email.
 *
 * Mounted by Inspiration/Show.tsx for `style.id === "coffee"`. SSR-safe: the
 * only state is the selected menu item (modal), no browser APIs at render,
 * no timers, no randomness — first paint is fully deterministic.
 */

type MenuItem = {
    name: string;
    price: string;
    short: string;
    long: string;
    ingredients: string[];
};

const MENU: MenuItem[] = [
    {
        name: "Cortado",
        price: "$3.75",
        short: "Two ristretto shots, warm milk.",
        long: "Equal parts espresso and steamed milk in a small glass. Silky, balanced, no fuss — the drink Rosa makes for herself before service.",
        ingredients: ["House espresso", "Whole milk"],
    },
    {
        name: "Cold Brew",
        price: "$4.25",
        short: "18-hour steep, chocolate finish.",
        long: "Coarse-ground and steeped cold for eighteen hours, so it's smooth and low-acid with a cocoa finish. Served over a big cube.",
        ingredients: ["Cold-steeped coffee", "Big ice"],
    },
    {
        name: "Cardamom Latte",
        price: "$4.75",
        short: "Fresh-ground cardamom, honey.",
        long: "Our signature — cardamom ground fresh into the milk, a spoon of honey, a double shot. Warm and a little floral. Sal's grandmother's idea.",
        ingredients: ["Espresso", "Cardamom", "Honey", "Milk"],
    },
    {
        name: "Milwaukee Drip",
        price: "$2.75",
        short: "Batch brew of this week's roast.",
        long: "A big pot of whatever Rosa roasted on Sunday. Ask what it is — she loves telling you. Free refills if you're hanging around the cart.",
        ingredients: ["Single-origin drip"],
    },
    {
        name: "Morning Bun",
        price: "$4.00",
        short: "Croissant dough, orange, cinnamon sugar.",
        long: "Laminated dough rolled with orange zest and cinnamon sugar, baked until the edges caramelize.",
        ingredients: ["Butter", "Orange zest", "Cinnamon sugar"],
    },
    {
        name: "Almond Croissant",
        price: "$4.50",
        short: "Twice-baked, frangipane, flaked almonds.",
        long: "Yesterday's croissant reborn — soaked, filled with almond frangipane, baked again, dusted with sugar. Always sells out first.",
        ingredients: ["Almond frangipane", "Butter", "Powdered sugar"],
    },
];

const SCHEDULE = [
    { day: "Mon", place: "Cathedral Square Park", hours: "7–11" },
    { day: "Tue", place: "Marquette — Wells St", hours: "7–11" },
    { day: "Wed", place: "Bronzeville — MLK Dr", hours: "7–11" },
    { day: "Thu", place: "Brady Street", hours: "7–11" },
    { day: "Fri", place: "Third Ward Riverwalk", hours: "7–1" },
    { day: "Sat", place: "South Shore Farmers Market", hours: "8–1" },
];

export default function Coffee({ style }: { style: Style }) {
    /**
     * `sel` keeps the last-opened item so the Modal's exit animation still
     * has content while it fades; `open` alone drives visibility.
     */
    const [sel, setSel] = useState<MenuItem | null>(null);
    const [open, setOpen] = useState(false);

    const openItem = (item: MenuItem) => {
        setSel(item);
        setOpen(true);
    };
    const close = () => setOpen(false);

    return (
        <div className="mpcoffee-root" data-style-num={style.num}>
            <div className="mpcoffee-shell">
                {/* ── Header: two-part wordmark + text nav ─────────────────── */}
                <header className="mpcoffee-header">
                    <Link href="/inspiration/mom-n-pops" className="mpcoffee-wordmark">
                        <span className="mpcoffee-wordmark-name">Mom-n-Pops</span>
                        <span className="mpcoffee-wordmark-tag">Coffee</span>
                    </Link>
                    <nav className="mpcoffee-nav" aria-label="Sections">
                        <a href="#menu">Menu</a>
                        <a href="#story">Story</a>
                        <a href="#findus">Find us</a>
                    </nav>
                </header>

                {/* ── Editorial hero: eyebrow / serif display / lede ───────── */}
                <section className="mpcoffee-hero" aria-labelledby="mpcoffee-h1">
                    <div className="mpcoffee-eyebrow">Family coffee cart · Milwaukee · since 2026</div>
                    <h1 id="mpcoffee-h1" className="mpcoffee-h1">
                        Small-batch coffee, pulled slow by the people who roast it.
                    </h1>
                    <p className="mpcoffee-lede">
                        Rosa roasts on Sundays. Sal pulls the shots. You'll find our little
                        cart wherever Milwaukee needs a good cup.
                    </p>
                </section>

                {/* ── The list: six menu rows with dotted price leaders ────── */}
                <section className="mpcoffee-menu" id="menu" aria-labelledby="mpcoffee-menu-title">
                    <div className="mpcoffee-menu-head">
                        <h2 id="mpcoffee-menu-title" className="mpcoffee-h2 mpcoffee-h2-menu">The list</h2>
                        <span className="mpcoffee-menu-aside">— six things, done well · tap for detail</span>
                    </div>
                    <div className="mpcoffee-menu-grid">
                        {MENU.map((m) => (
                            <button
                                key={m.name}
                                type="button"
                                className="mpcoffee-row"
                                onClick={() => openItem(m)}
                                aria-haspopup="dialog"
                                aria-label={`${m.name}, ${m.price} — details`}
                            >
                                <span className="mpcoffee-row-line">
                                    <span className="mpcoffee-row-name">{m.name}</span>
                                    <span className="mpcoffee-row-leader" aria-hidden="true" />
                                    <span className="mpcoffee-row-price">{m.price}</span>
                                </span>
                                <span className="mpcoffee-row-short">{m.short}</span>
                            </button>
                        ))}
                    </div>
                </section>

                {/* ── Story: pull-quote heading left, copy right ───────────── */}
                <section className="mpcoffee-story" id="story" aria-labelledby="mpcoffee-story-title">
                    <h2 id="mpcoffee-story-title" className="mpcoffee-h2 mpcoffee-h2-story">
                        It started with one broken espresso machine and a lot of stubbornness.
                    </h2>
                    <div className="mpcoffee-story-copy">
                        <p className="mpcoffee-story-p1">
                            Rosa &amp; Sal fixed up a secondhand lever machine, bolted it to a
                            bike cart, and started serving neighbors in 2026.
                        </p>
                        <p className="mpcoffee-story-p2">
                            The cart's bigger now, the coffee's better, and the two of them
                            still argue about grind size every single morning.
                        </p>
                    </div>
                </section>

                {/* ── Schedule: printed transit-table grid ─────────────────── */}
                <section className="mpcoffee-sched" id="findus" aria-labelledby="mpcoffee-sched-title">
                    <h2 id="mpcoffee-sched-title" className="mpcoffee-h2 mpcoffee-h2-sched">Where the cart parks</h2>
                    <div className="mpcoffee-sched-sub">Milwaukee · mornings 7–11 unless noted</div>
                    <div role="list">
                        {SCHEDULE.map((s) => (
                            <div key={s.day} role="listitem" className="mpcoffee-sched-row">
                                <span className="mpcoffee-sched-day">{s.day}</span>
                                <span className="mpcoffee-sched-place">{s.place}</span>
                                <span className="mpcoffee-sched-hours">{s.hours}</span>
                            </div>
                        ))}
                    </div>
                </section>
            </div>

            {/* ── Footer: brand / anti-scrape email / colophon ─────────────── */}
            <footer className="mpcoffee-footer">
                <div className="mpcoffee-footer-inner">
                    <span className="mpcoffee-footer-brand">Mom-n-Pops Coffee</span>
                    <span className="mpcoffee-footer-contact">
                        hello<span>@</span>momnpops.truck · @momnpops.mke
                    </span>
                    <span>© 2026 · Milwaukee</span>
                </div>
            </footer>

            {/* ── Item detail modal — the page's one elevated surface ──────── */}
            <Modal
                open={open}
                onClose={close}
                size="sm"
                className="mpcoffee-modal"
                aria-label={sel ? `${sel.name} — detail` : "Menu item detail"}
            >
                {sel && (
                    <div className="mpcoffee-modal-inner">
                        <div className="mpcoffee-modal-head">
                            <h3 className="mpcoffee-modal-name">{sel.name}</h3>
                            <span className="mpcoffee-modal-price">{sel.price}</span>
                        </div>
                        <p className="mpcoffee-modal-long">{sel.long}</p>
                        <div className="mpcoffee-modal-noteslabel">Notes</div>
                        <div className="mpcoffee-modal-chips">
                            {sel.ingredients.map((i) => (
                                <Badge key={i} variant="outline" size="md" className="mpcoffee-chip">
                                    {i}
                                </Badge>
                            ))}
                        </div>
                        <div className="mpcoffee-modal-foot">
                            <Button variant="ghost" size="sm" className="mpcoffee-close" onClick={close}>
                                Close
                            </Button>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
}
