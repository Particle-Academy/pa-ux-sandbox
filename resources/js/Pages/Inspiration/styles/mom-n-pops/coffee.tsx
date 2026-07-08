import "./coffee.css";
import { Link } from "@inertiajs/react";
import { useState, type KeyboardEvent } from "react";
import { Badge, Button, Card, Heading, Modal, Navbar, Table, Text } from "@particle-academy/react-fancy";
import type { Style } from "../../types";

/**
 * Mom-n-Pops · Style 02 — Coffee.
 *
 * The family truck as a family COFFEE CART, set like a quiet magazine page:
 * warm cream paper (#F5EFE6), espresso ink, Georgia serif display type at
 * regular weight, mono eyebrows, and 1px hairline rules carrying the entire
 * vertical rhythm. No fills, no photos, no CTA button anywhere — hierarchy is
 * purely typographic, but the typography and structure run through the Fancy
 * kit: the whole page is restyled react-fancy primitives dressed down to cream.
 *
 * Restyled Fancy primitives: Navbar (the header lockup + in-page nav), Heading
 * + Text (every display headline, eyebrow, lede, story paragraph, and modal
 * label — the full typographic hierarchy), Card (the six tap-for-detail menu
 * rows, chrome-zeroed to hairline list rows with dotted price leaders), Table
 * (the weekly parking schedule as a printed transit table), and the Modal /
 * Badge / Button item-detail dialog — the page's one rounded, elevated surface.
 * Legitimately bespoke and left hand-rolled: the dotted flex-spacer price
 * leaders, the cream/hairline texture, and the split anti-scrape email footer.
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

    /** Menu rows are restyled Cards; keep them keyboard-operable like buttons. */
    const onRowKey = (item: MenuItem) => (e: KeyboardEvent<HTMLDivElement>) => {
        if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            openItem(item);
        }
    };

    return (
        <div className="mpcoffee-root" data-style-num={style.num}>
            <div className="mpcoffee-shell">
                {/* ── Header: Navbar restyled to a two-part wordmark + text nav ── */}
                <Navbar className="mpcoffee-header">
                    <Navbar.Brand className="mpcoffee-brand">
                        <Link href="/inspiration/mom-n-pops" className="mpcoffee-wordmark">
                            <span className="mpcoffee-wordmark-name">Mom-n-Pops</span>
                            <span className="mpcoffee-wordmark-tag">Coffee</span>
                        </Link>
                    </Navbar.Brand>
                    <Navbar.Items className="mpcoffee-nav">
                        <Navbar.Item href="#menu" className="mpcoffee-nav-link">
                            Menu
                        </Navbar.Item>
                        <Navbar.Item href="#story" className="mpcoffee-nav-link">
                            Story
                        </Navbar.Item>
                        <Navbar.Item href="#findus" className="mpcoffee-nav-link">
                            Find us
                        </Navbar.Item>
                    </Navbar.Items>
                </Navbar>

                {/* ── Editorial hero: eyebrow / serif display / lede ───────── */}
                <section className="mpcoffee-hero" aria-labelledby="mpcoffee-h1">
                    <Text as="div" className="mpcoffee-eyebrow">
                        Family coffee cart · Milwaukee · since 2026
                    </Text>
                    <Heading as="h1" id="mpcoffee-h1" weight="normal" className="mpcoffee-h1">
                        Small-batch coffee, pulled slow by the people who roast it.
                    </Heading>
                    <Text as="p" className="mpcoffee-lede">
                        Rosa roasts on Sundays. Sal pulls the shots. You'll find our little
                        cart wherever Milwaukee needs a good cup.
                    </Text>
                </section>

                {/* ── The list: six menu rows as restyled Cards ────────────── */}
                <section className="mpcoffee-menu" id="menu" aria-labelledby="mpcoffee-menu-title">
                    <div className="mpcoffee-menu-head">
                        <Heading
                            as="h2"
                            id="mpcoffee-menu-title"
                            weight="normal"
                            className="mpcoffee-h2 mpcoffee-h2-menu"
                        >
                            The list
                        </Heading>
                        <Text as="span" className="mpcoffee-menu-aside">
                            — six things, done well · tap for detail
                        </Text>
                    </div>
                    <div className="mpcoffee-menu-grid">
                        {MENU.map((m) => (
                            <Card
                                key={m.name}
                                variant="flat"
                                padding="none"
                                className="mpcoffee-row"
                                role="button"
                                tabIndex={0}
                                onClick={() => openItem(m)}
                                onKeyDown={onRowKey(m)}
                                aria-haspopup="dialog"
                                aria-label={`${m.name}, ${m.price} — details`}
                                data-menu-item={m.name}
                            >
                                <span className="mpcoffee-row-line">
                                    <span className="mpcoffee-row-name">{m.name}</span>
                                    <span className="mpcoffee-row-leader" aria-hidden="true" />
                                    <span className="mpcoffee-row-price">{m.price}</span>
                                </span>
                                <Text as="span" className="mpcoffee-row-short">
                                    {m.short}
                                </Text>
                            </Card>
                        ))}
                    </div>
                </section>

                {/* ── Story: pull-quote heading left, copy right ───────────── */}
                <section className="mpcoffee-story" id="story" aria-labelledby="mpcoffee-story-title">
                    <Heading
                        as="h2"
                        id="mpcoffee-story-title"
                        weight="normal"
                        className="mpcoffee-h2 mpcoffee-h2-story"
                    >
                        It started with one broken espresso machine and a lot of stubbornness.
                    </Heading>
                    <div className="mpcoffee-story-copy">
                        <Text as="p" className="mpcoffee-story-p1">
                            Rosa &amp; Sal fixed up a secondhand lever machine, bolted it to a
                            bike cart, and started serving neighbors in 2026.
                        </Text>
                        <Text as="p" className="mpcoffee-story-p2">
                            The cart's bigger now, the coffee's better, and the two of them
                            still argue about grind size every single morning.
                        </Text>
                    </div>
                </section>

                {/* ── Schedule: printed transit table (restyled Table) ─────── */}
                <section className="mpcoffee-sched" id="findus" aria-labelledby="mpcoffee-sched-title">
                    <Heading
                        as="h2"
                        id="mpcoffee-sched-title"
                        weight="normal"
                        className="mpcoffee-h2 mpcoffee-h2-sched"
                    >
                        Where the cart parks
                    </Heading>
                    <Text as="div" className="mpcoffee-sched-sub">
                        Milwaukee · mornings 7–11 unless noted
                    </Text>
                    <Table className="mpcoffee-sched-table">
                        <Table.Head>
                            <Table.Column label="Day" />
                            <Table.Column label="Place" />
                            <Table.Column label="Hours" />
                        </Table.Head>
                        <Table.Body>
                            {SCHEDULE.map((s) => (
                                <Table.Row key={s.day}>
                                    <Table.Cell>{s.day}</Table.Cell>
                                    <Table.Cell>{s.place}</Table.Cell>
                                    <Table.Cell>{s.hours}</Table.Cell>
                                </Table.Row>
                            ))}
                        </Table.Body>
                    </Table>
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
                            <Heading as="h3" weight="normal" className="mpcoffee-modal-name">
                                {sel.name}
                            </Heading>
                            <Text as="span" className="mpcoffee-modal-price">
                                {sel.price}
                            </Text>
                        </div>
                        <Text as="p" className="mpcoffee-modal-long">
                            {sel.long}
                        </Text>
                        <Text as="div" className="mpcoffee-modal-noteslabel">
                            Notes
                        </Text>
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
