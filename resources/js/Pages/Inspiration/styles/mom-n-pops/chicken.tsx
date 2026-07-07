import "./chicken.css";
import { useState } from "react";
import { Badge, Button, Heading, Modal, Table, Text } from "@particle-academy/react-fancy";
import type { Style } from "../../types";

/**
 * Inspiration Gallery · Mom-n-Pops 05 — Fried Chicken.
 *
 * The truck as a COUNTY-FAIR HAND-BILL: everything is typographic print
 * language on three full-bleed color bands — deep teal, menu cream, and a
 * near-black brown footer — held together by mustard-gold rules and one brick
 * red. The special "Poster" surface is the hero itself: a 3px gold ticket
 * frame around a clamp()-sized 900-weight headline, with a double-border
 * eyebrow badge doing the hand-set print gag. Zero photos, zero gradients —
 * dotted price leaders, a rotated sticker chip, and a gold-framed timetable
 * carry the whole identity.
 *
 * The Fancy kit wears the poster: Badge → gold ticket eyebrow / rotated red
 * sticker / square ingredient chips, Button → dotted-leader menu rows + the
 * red order CTA, Table → the gold-framed Milwaukee timetable, Modal → the
 * cream item card with its 3px near-black header rule. The dotted leaders,
 * poster frame, and color bands are hand-rolled CSS.
 *
 * Mounted by Inspiration/Show.tsx for `style.id === "chicken"`. SSR-safe: the
 * only state is the selected menu item (initially null → the Modal renders
 * nothing on the server); no browser APIs, no randomness, no timers.
 */

type MenuItem = {
    name: string;
    price: string;
    long: string;
    ingredients: string[];
};

type Stop = {
    day: string;
    place: string;
    hours: string;
};

const MENU: MenuItem[] = [
    {
        name: "Skillet Fried",
        price: "$9",
        long: "Three pieces — breast, thigh, drumstick — brined a full day in buttermilk and Rosa's spice blend, then fried in cast iron. The crust crackles; the inside gushes.",
        ingredients: ["Buttermilk brine", "Skillet dredge", "Bone-in chicken"],
    },
    {
        name: "Hot Honey Sando",
        price: "$11",
        long: "A whole fried thigh on a griddled potato bun with chili-infused hot honey and bread-and-butter pickles. Sweet, heat, crunch.",
        ingredients: ["Fried thigh", "Hot honey", "Pickles", "Potato bun"],
    },
    {
        name: "Nashville Hot",
        price: "$11",
        long: "Fried chicken dredged through a cayenne-and-lard paste till it glows red, cooled by a swipe of comeback sauce and white bread.",
        ingredients: ["Cayenne paste", "Comeback sauce", "White bread"],
    },
    {
        name: "Chicken & Waffle",
        price: "$12",
        long: "A crisp buttermilk waffle under a fried thigh, with bourbon-barrel maple and whipped butter. Breakfast, lunch, dinner — nobody's checking.",
        ingredients: ["Buttermilk waffle", "Fried thigh", "Bourbon maple"],
    },
    {
        name: "Buttermilk Tenders",
        price: "$9",
        long: "Four hand-cut tenders, same brine, same crust. Pick two sauces: ranch, honey mustard, comeback, or hot honey.",
        ingredients: ["Chicken tenders", "Buttermilk brine", "Two sauces"],
    },
    {
        name: "Skillet Mac",
        price: "$5",
        long: "Elbows in a three-cheese sauce with a buttery cracker crust. The side that thinks it's a main. Add pulled chicken for $3.",
        ingredients: ["Cheddar", "Gruyère", "Cracker crust"],
    },
];

const SCHEDULE: Stop[] = [
    { day: "Tuesday", place: "Sherman Park", hours: "11–7" },
    { day: "Wednesday", place: "Bronzeville — MLK Dr", hours: "11–7" },
    { day: "Thursday", place: "Walker's Point", hours: "11–8" },
    { day: "Friday", place: "Third Ward Riverwalk", hours: "11–8" },
    { day: "Saturday", place: "Washington Park", hours: "11–8" },
    { day: "Sunday", place: "after-church — Capitol Dr", hours: "12–5" },
];

export default function FriedChicken({ style }: { style: Style }) {
    /**
     * The mockup's entire stateful surface: one selected menu item. `sel`
     * keeps the last item during the Modal's exit animation; `open` drives
     * the dialog. Initial paint (SSR + hydration) renders no modal at all.
     */
    const [sel, setSel] = useState<MenuItem | null>(null);
    const [open, setOpen] = useState(false);

    const openItem = (item: MenuItem) => {
        setSel(item);
        setOpen(true);
    };
    const close = () => setOpen(false);

    return (
        <div className="mpchicken-root">
            {/* ── Teal band: header + poster hero ─────────────────────────── */}
            <div className="mpchicken-shell">
                <header className="mpchicken-header">
                    <span className="mpchicken-lockup">
                        <span className="mpchicken-lockup__word">Mom-n-Pops</span>
                        <span className="mpchicken-lockup__tag">FRIED CHICKEN</span>
                    </span>
                    <nav className="mpchicken-nav" aria-label="Sections">
                        <a href="#mpchicken-menu">Menu</a>
                        <a href="#mpchicken-story">Story</a>
                        <a href="#mpchicken-find">Find us</a>
                    </nav>
                </header>

                {/* The "Poster" surface — a gold hand-bill frame, all type. */}
                <section className="mpchicken-hero" aria-labelledby="mpchicken-hero-h">
                    <Badge className="mpchicken-hero__badge" color="amber" variant="outline" size="md">
                        EST. MILWAUKEE 2026 ★ FRESH DAILY
                    </Badge>
                    <Heading as="h1" id="mpchicken-hero-h" className="mpchicken-hero__title">
                        Fried the
                        <br />
                        slow way.
                    </Heading>
                    <Text as="p" className="mpchicken-hero__deck">
                        24-hour buttermilk brine, cast-iron skillets, a crust that shatters. Rosa&apos;s
                        grandmother&apos;s recipe — one napkin won&apos;t be enough.
                    </Text>
                </section>
            </div>

            {/* ── Cream band: the menu ─────────────────────────────────────── */}
            <div className="mpchicken-band mpchicken-band--cream" id="mpchicken-menu">
                <div className="mpchicken-shell">
                    <section className="mpchicken-menu" aria-labelledby="mpchicken-menu-h">
                        <div className="mpchicken-menu__head">
                            <Badge className="mpchicken-sticker" color="red" variant="solid" size="md">
                                THE MENU
                            </Badge>
                            <Heading as="h2" id="mpchicken-menu-h" className="mpchicken-menu__title">
                                Get you some.
                            </Heading>
                        </div>
                        <div className="mpchicken-menu__grid">
                            {MENU.map((m) => (
                                <Button
                                    key={m.name}
                                    variant="ghost"
                                    className="mpchicken-menurow"
                                    labelClassName="mpchicken-menurow__label"
                                    onClick={() => openItem(m)}
                                    aria-haspopup="dialog"
                                    aria-label={`${m.name} — ${m.price}, see details`}
                                >
                                    <span className="mpchicken-menurow__name">{m.name}</span>
                                    <span className="mpchicken-menurow__leader" aria-hidden="true" />
                                    <span className="mpchicken-menurow__price">{m.price}</span>
                                </Button>
                            ))}
                        </div>
                    </section>
                </div>
            </div>

            {/* ── Teal band: story + schedule ──────────────────────────────── */}
            <div className="mpchicken-shell">
                <section className="mpchicken-story" id="mpchicken-story" aria-labelledby="mpchicken-story-h">
                    <Heading as="h2" id="mpchicken-story-h" className="mpchicken-story__title">
                        A recipe card &amp; a cast-iron skillet.
                    </Heading>
                    <div>
                        <Text as="p" className="mpchicken-story__body">
                            Rosa&apos;s grandmother wrote the dredge on an index card that now lives, laminated,
                            taped inside the truck. Sal handles the fryers. Nothing&apos;s pre-breaded, nothing
                            sits — if you&apos;re eating it, it was raw twenty minutes ago. Milwaukee, since 2026.
                        </Text>
                    </div>
                </section>

                <section className="mpchicken-find" id="mpchicken-find" aria-labelledby="mpchicken-find-h">
                    <Heading as="h2" id="mpchicken-find-h" className="mpchicken-find__title">
                        Find the truck
                    </Heading>
                    <Table className="mpchicken-sched">
                        <Table.Body>
                            {SCHEDULE.map((s) => (
                                <Table.Row key={s.day} className="mpchicken-sched__row">
                                    <Table.Cell className="mpchicken-sched__day">{s.day}</Table.Cell>
                                    <Table.Cell className="mpchicken-sched__place">{s.place}</Table.Cell>
                                    <Table.Cell className="mpchicken-sched__hours">{s.hours}</Table.Cell>
                                </Table.Row>
                            ))}
                        </Table.Body>
                    </Table>
                    <p className="mpchicken-find__note">Mondays: dark — the fryers rest.</p>
                </section>
            </div>

            {/* ── Near-black band: footer ──────────────────────────────────── */}
            <footer className="mpchicken-footer">
                <div className="mpchicken-shell">
                    <div className="mpchicken-footer__row">
                        <span className="mpchicken-footer__mark">Mom-n-Pops Fried Chicken</span>
                        <span className="mpchicken-footer__mail">
                            hello<span>@</span>momnpops.truck
                        </span>
                        <span>© 2026 · Milwaukee</span>
                    </div>
                    <div className="mpchicken-footer__base">
                        Mom-n-Pops — a fictional food truck, for demonstration · Style {style.num} / {style.name}
                    </div>
                </div>
            </footer>

            {/* ── Item-detail modal (renders nothing until a row is tapped) ── */}
            <Modal open={open && sel !== null} onClose={close} size="sm" className="mpchicken-modal">
                {sel && (
                    <>
                        <Modal.Header className="mpchicken-modal__head">
                            <span className="mpchicken-modal__name">{sel.name}</span>
                            <span className="mpchicken-modal__price">{sel.price}</span>
                        </Modal.Header>
                        <Modal.Body className="mpchicken-modal__body">
                            <p className="mpchicken-modal__long">{sel.long}</p>
                            <div className="mpchicken-modal__label">What&apos;s in it</div>
                            <div className="mpchicken-modal__chips">
                                {sel.ingredients.map((ing) => (
                                    <Badge key={ing} className="mpchicken-chip" color="zinc" variant="outline" size="sm">
                                        {ing}
                                    </Badge>
                                ))}
                            </div>
                            <Button className="mpchicken-modal__cta" onClick={close}>
                                Add to order · {sel.price}
                            </Button>
                        </Modal.Body>
                    </>
                )}
            </Modal>
        </div>
    );
}
