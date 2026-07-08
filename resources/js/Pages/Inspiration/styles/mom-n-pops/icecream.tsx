import "./icecream.css";

import { Link } from "@inertiajs/react";
import { useRef, useState, type KeyboardEvent } from "react";
import { Badge, Button, Card, Modal } from "@particle-academy/react-fancy";
import { IceCreamBowl } from "lucide-react";
import type { Style } from "../../types";

/**
 * Inspiration Gallery · Mom-n-Pops style 09 — Creamery.
 *
 * Rosa & Sal's frozen-custard side of the truck as a candy-colored bento:
 * the ENTIRE page is one 4-column CSS grid on a strawberry-milk pink ground.
 * A 2×2 gradient hero anchors it, six flavor tiles carry their own art
 * direction IN DATA (background, ink, column span, title size all come from
 * the flavor record — the "palette-per-item" signature move), and a mint
 * social-proof stat closes the mosaic. Zero borders anywhere; tiles are
 * borderless solid-color blocks separated only by the 14px gutter. Clicking
 * a tile opens a restyled react-fancy <Modal> whose header band inherits the
 * selected tile's bg/ink, so the tile appears to physically "open up".
 *
 * Restyled Fancy primitives: Card (the six flavor tiles + the mint stat cell —
 * variant="flat" stripped of the kit's radius/border via scoped CSS so each
 * tile keeps its data-driven bg/ink/span; Card.Header carries the icon+price
 * row, Card.Body the name+short label), Badge (the "12 flavors churning"
 * live-status pill), Button (the white "See flavors" hero pill + the pink "Add
 * a scoop" modal pill), Modal (the flavor detail card — radius 22, big soft
 * shadow, plum scrim). The flavor Cards act as buttons (role + tabIndex +
 * Enter/Space) and carry a stable `data-flavor` handle so an agent could open a
 * flavor by slug; their data-driven column spans and per-tile inline colors ARE
 * the design, so the bento grid math still lives in CSS, not a stock grid.
 *
 * Mounted by Inspiration/Show.tsx for `style.id === "icecream"`. SSR-safe:
 * no browser globals, no timers, no randomness — the modal renders nothing
 * until a flavor is chosen, so first paint is deterministic. The lone lucide
 * icon is imported statically (no window.lucide.createIcons()).
 */

type Flavor = {
    slug: string;
    /** Emoji flavor art — the mockup uses no photos; the emoji IS the image. */
    icon: string;
    name: string;
    short: string;
    price: string;
    /** Per-tile art direction, straight from the data record. */
    bg: string;
    ink: string;
    /** Column span in the 4-col bento (all flavor tiles are one row tall). */
    cspan: 1 | 2;
    /** Flavor-name size in px — wide tiles shout, small tiles whisper. */
    size: number;
    long: string;
};

const FLAVORS: Flavor[] = [
    {
        slug: "mud",
        icon: "🍫",
        name: "Milwaukee Mud",
        short: "dark chocolate, fudge ripple, nibs",
        price: "$4",
        bg: "#5A3A2E",
        ink: "#FFF3F7",
        cspan: 2,
        size: 26,
        long: "Deep dark-chocolate custard shot through with a fudge ripple and a crackle of cocoa nibs. Named for the river, tastes a lot better than it sounds.",
    },
    {
        slug: "vanilla",
        icon: "🍦",
        name: "Brown Butter Vanilla",
        short: "toasted butter, Madagascar vanilla",
        price: "$4",
        bg: "#F6E7C8",
        ink: "#5A3A00",
        cspan: 1,
        size: 18,
        long: "We brown the butter before it ever hits the custard, so the vanilla comes out deep and nutty. Quietly outsells everything.",
    },
    {
        slug: "strawbasil",
        icon: "🍓",
        name: "Strawberry Basil",
        short: "roasted local berries, basil",
        price: "$4.50",
        bg: "#F7B9C8",
        ink: "#7A1F3A",
        cspan: 1,
        size: 18,
        long: "Wisconsin strawberries roasted to concentrate them, folded into sweet cream with a whisper of fresh basil. Tastes like the July market.",
    },
    {
        slug: "caramel",
        icon: "🧈",
        name: "Salted Caramel",
        short: "burnt-sugar, flaky sea salt",
        price: "$4.50",
        bg: "#E8B96A",
        ink: "#5A3A00",
        cspan: 1,
        size: 18,
        long: "Caramel cooked till it's just this side of burnt for that bittersweet edge, with flaky sea salt stirred through.",
    },
    {
        slug: "sundae",
        icon: "🍨",
        name: "Waffle Sundae",
        short: "two scoops, hot fudge, the works",
        price: "$7",
        bg: "#C8A2E8",
        ink: "#3A1F52",
        cspan: 1,
        size: 18,
        long: "A waffle cone pressed into a bowl on the truck, two scoops, house hot fudge, whipped cream, nuts, a cherry.",
    },
    {
        slug: "float",
        icon: "🥤",
        name: "Root Beer Float",
        short: "Sprecher root beer + vanilla",
        price: "$5",
        bg: "#9FE2CF",
        ink: "#12564A",
        cspan: 2,
        size: 22,
        long: "A tall cup of Wisconsin-made Sprecher root beer poured over our brown butter vanilla till it foams over the top.",
    },
];

export default function IceCream({ style }: { style: Style }) {
    /**
     * `sel` always holds a flavor so the modal's exit animation never reads a
     * null record; `open` alone controls visibility (mockup: state.sel).
     */
    const [sel, setSel] = useState<Flavor>(FLAVORS[0]);
    const [open, setOpen] = useState(false);
    const firstTileRef = useRef<HTMLDivElement>(null);

    const openFlavor = (flavor: Flavor) => {
        setSel(flavor);
        setOpen(true);
    };

    /**
     * Flavor Cards are divs with role="button"; restore native button keys so
     * Enter/Space open the flavor just like the original <button> tiles did.
     */
    const onTileKey = (event: KeyboardEvent<HTMLDivElement>, flavor: Flavor) => {
        if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            openFlavor(flavor);
        }
    };

    return (
        <div className="mpicecream-root">
            <div className="mpicecream-shell">
                {/* ── Header — wordmark + live-status pill ─────────────────── */}
                <header className="mpicecream-head">
                    <Link href="/inspiration/mom-n-pops" className="mpicecream-brand">
                        <span className="mpicecream-brand__logo" aria-hidden>M</span>
                        Mom-n-Pops <span className="mpicecream-brand__sub">· Creamery</span>
                    </Link>
                    <Badge className="mpicecream-pill" size="sm">
                        <IceCreamBowl size={14} aria-hidden />
                        12 flavors churning
                    </Badge>
                </header>

                {/* ── The bento — the entire page is the special surface ───── */}
                <section className="mpicecream-bento" aria-label="Today's flavors">
                    {/* Hero tile — 2×2 gradient block, content pinned by space-between */}
                    <div className="mpicecream-hero">
                        <div className="mpicecream-hero__kicker">Scooped fresh · Milwaukee · 2026</div>
                        <div>
                            <h1 className="mpicecream-hero__title">The sweetest stop on the block.</h1>
                            <p className="mpicecream-hero__sub">
                                Frozen custard churned in the truck. Chase the pink truck — you’ll hear the bell.
                            </p>
                        </div>
                        <div className="mpicecream-hero__cta">
                            <Button
                                className="mpicecream-btn"
                                onClick={() => firstTileRef.current?.focus()}
                            >
                                See flavors
                            </Button>
                        </div>
                    </div>

                    {/* Flavor tiles — restyled Card (flat); per-tile palette +
                        span arrive inline, so each tile is one bento cell. */}
                    {FLAVORS.map((flavor, i) => (
                        <Card
                            key={flavor.slug}
                            ref={i === 0 ? firstTileRef : undefined}
                            variant="flat"
                            padding="none"
                            className="mpicecream-tile"
                            data-flavor={flavor.slug}
                            data-cspan={flavor.cspan}
                            style={{ background: flavor.bg, color: flavor.ink }}
                            role="button"
                            tabIndex={0}
                            onClick={() => openFlavor(flavor)}
                            onKeyDown={(event) => onTileKey(event, flavor)}
                            aria-haspopup="dialog"
                            aria-label={`${flavor.name} — ${flavor.price} — ${flavor.short}`}
                        >
                            <Card.Header className="mpicecream-tile__top">
                                <span className="mpicecream-tile__icon" aria-hidden>{flavor.icon}</span>
                                <span className="mpicecream-tile__price">{flavor.price}</span>
                            </Card.Header>
                            <Card.Body className="mpicecream-tile__label">
                                <span className="mpicecream-tile__name" style={{ fontSize: flavor.size }}>
                                    {flavor.name}
                                </span>
                                <span className="mpicecream-tile__short">{flavor.short}</span>
                            </Card.Body>
                        </Card>
                    ))}

                    {/* Stat tile — social proof as another flat Card bento cell */}
                    <Card variant="flat" padding="none" className="mpicecream-stat">
                        <div className="mpicecream-stat__num">4.9★</div>
                        <div className="mpicecream-stat__label">1,200 scoops / week</div>
                    </Card>
                </section>

                {/* ── Footer — deliberately quiet, one slim row ────────────── */}
                <footer className="mpicecream-footer">
                    <span className="mpicecream-footer__brand">Mom-n-Pops Creamery</span>
                    <span>
                        hello<span>@</span>momnpops.truck
                    </span>
                    <span>© 2026 · Rosa &amp; Sal · Milwaukee</span>
                </footer>
                <div className="mpicecream-footnote">
                    Mom-n-Pops is a fictional food truck, for demonstration · Truck {style.num} / {style.name}
                </div>
            </div>

            {/* ── Flavor detail — restyled Modal; header band wears the tile's
                   bg/ink so the tile "opens up" into the card ──────────────── */}
            <Modal
                open={open}
                onClose={() => setOpen(false)}
                size="sm"
                className="mpicecream-modal"
                aria-label={`${sel.name} details`}
            >
                <div className="mpicecream-modal__band" style={{ background: sel.bg }}>
                    <div className="mpicecream-modal__icon" aria-hidden>{sel.icon}</div>
                    <div className="mpicecream-modal__name" style={{ color: sel.ink }}>{sel.name}</div>
                </div>
                <div className="mpicecream-modal__body">
                    <p className="mpicecream-modal__long">{sel.long}</p>
                    <div className="mpicecream-modal__row">
                        <span className="mpicecream-modal__price">{sel.price}</span>
                        <Button className="mpicecream-scoop" onClick={() => setOpen(false)}>
                            Add a scoop
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
