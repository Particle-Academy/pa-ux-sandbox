import "./bagels.css";
import { Link } from "@inertiajs/react";
import { useState } from "react";
import { Badge, Button, Card, Modal, Table } from "@particle-academy/react-fancy";
import type { Style } from "../../types";

/**
 * Inspiration Gallery · Mom-n-Pops style 11 — The Daily Bagel (Newsprint).
 *
 * Rosa & Sal's bagel truck set as a small-town broadsheet front page: a
 * three-rule masthead (3px/1px/2px), a lead story with a drop cap and CSS
 * two-column body, the menu as tappable classifieds with dotted price
 * leaders, a mirrored owners feature, a week listings block, a WANTED
 * catering classified, and a right-side paper sheet for the "full column"
 * on any menu item. Photos are recreated as etched ink SVG art (shared
 * <symbol> sprite) run through the mockup's site-wide grayscale(1)
 * contrast(1.12) treatment — no photo assets.
 *
 * Restyled Fancy primitives carry every interactive + data surface: Card →
 * the six tappable classified menu rows (transparent, #C8C4B8 hairline, the
 * dotted-leader price line), Table → the Mon–Sat week listings, Modal → the
 * "full column" restyled as a right-side paper sheet (radius 0, repainted
 * #F1EFE6, dark scrim), Button → the red "Order Ahead" masthead action, the
 * catering quote, the drawer close (variant="circle") + the inverted "Add to
 * order" bar, and Badge → the square ink tag / ingredient chips. The
 * three-rule masthead hierarchy, drop-cap typesetting, dotted leaders, and
 * SVG art plates stay hand-rolled — they have no primitive equivalent.
 *
 * Mounted by Inspiration/Show.tsx for `style.id === "bagels"`. SSR-safe: the
 * only state is a nullable selected item plus three booleans; there are NO
 * browser APIs anywhere (the Modal primitive owns Escape + scroll-lock), no
 * Math.random / Date.now in render, and art alternates deterministically
 * (variant assigned in data). The Modal portals to <body>, so its scoped
 * styles live under .mpbagels-drawer, which re-declares the newsprint tokens.
 */

type BagelVariant = "a" | "b";

type MenuItem = {
    slug: string;
    name: string;
    price: string;
    short: string;
    long: string;
    ingredients: string[];
    allergens: string;
    tags: string[];
    /** Alternates a/b by index, mirroring the mockup's imgId assignment. */
    variant: BagelVariant;
};

const MENU: MenuItem[] = [
    {
        slug: "everything",
        name: "The Everything",
        price: "$5",
        short: "Everything bagel, scallion schmear.",
        long: "Our everything bagel — seeds toasted so they don't taste raw — split, toasted, and loaded with a generous schmear of house scallion cream cheese. The one Sal eats every single day.",
        ingredients: ["Everything bagel", "Scallion cream cheese"],
        allergens: "Gluten · dairy · sesame",
        tags: ["Staff pick", "Vegetarian"],
        variant: "a",
    },
    {
        slug: "lox",
        name: "Lox & Schmear",
        price: "$11",
        short: "Plain bagel, hand-sliced lox, capers, onion.",
        long: "A proper appetizing plate on a bagel — hand-sliced cured salmon, plain cream cheese, capers, tomato, and shaved red onion. Rosa slices the lox to order; she will not be rushed.",
        ingredients: ["Plain bagel", "Cured lox", "Cream cheese", "Capers", "Red onion", "Tomato"],
        allergens: "Gluten · dairy · fish",
        tags: ["The classic"],
        variant: "b",
    },
    {
        slug: "pastrami",
        name: "Pastrami on Rye",
        price: "$12",
        short: "House pastrami, deli mustard, rye bagel.",
        long: "Not technically a bagel move, but we cure and steam our own pastrami and pile it on a rye bagel with deli mustard and a pickle. Nobody's complained yet.",
        ingredients: ["Rye bagel", "House pastrami", "Deli mustard", "Pickle"],
        allergens: "Gluten",
        tags: ["Deli"],
        variant: "a",
    },
    {
        slug: "bec",
        name: "Bacon Egg & Cheese",
        price: "$6",
        short: "The Milwaukee morning fix.",
        long: "Griddled egg, crisp bacon, and American melted into the nooks of a plain or everything bagel. The reason the line forms at 7am. Add hot sauce, we insist.",
        ingredients: ["Bagel", "Egg", "Bacon", "American cheese"],
        allergens: "Gluten · dairy · egg",
        tags: ["Best seller"],
        variant: "b",
    },
    {
        slug: "avocado",
        name: "Avocado Smash",
        price: "$8",
        short: "Smashed avocado, chili, lemon, radish.",
        long: "Smashed avocado with lemon, chili flake, and thin-sliced radish on a toasted whole-wheat everything. Yes, on a bagel. Rosa says it counts.",
        ingredients: ["Whole-wheat bagel", "Avocado", "Chili flake", "Radish", "Lemon"],
        allergens: "Gluten · sesame",
        tags: ["Vegetarian"],
        variant: "a",
    },
    {
        slug: "bw",
        name: "Black & White Cookie",
        price: "$3",
        short: "Half vanilla, half chocolate, all argument.",
        long: "A soft cakey black-and-white, iced by hand. Which side you eat first says a lot about you, apparently. Rosa's is a genuine New York recipe — no notes.",
        ingredients: ["Cake cookie", "Vanilla fondant", "Chocolate fondant"],
        allergens: "Gluten · dairy · egg",
        tags: ["Vegetarian"],
        variant: "b",
    },
];

const SCHEDULE = [
    { day: "Mon", place: "Cathedral Square" },
    { day: "Tue", place: "Marquette / Wells" },
    { day: "Wed", place: "East Side / Downer" },
    { day: "Thu", place: "Brady Street" },
    { day: "Fri", place: "Third Ward Riverwalk" },
    { day: "Sat", place: "South Shore Market" },
];

/**
 * Hidden SVG sprite: the etched bagel glyph + halftone/hatch patterns every
 * art plate reuses via same-document fragment references. Fixed ids are safe
 * (prefixed, page mounts once) and identical on server and client. The
 * fragment refs resolve document-wide, so the portaled Modal art works too.
 */
function InkDefs() {
    return (
        <svg className="mpbagels-defs" aria-hidden="true" focusable="false" width="0" height="0">
            <defs>
                <pattern id="mpbagels-tone" width="6" height="6" patternUnits="userSpaceOnUse">
                    <circle cx="3" cy="3" r="0.9" fill="#141414" opacity="0.13" />
                </pattern>
                <pattern
                    id="mpbagels-hatch"
                    width="5"
                    height="5"
                    patternUnits="userSpaceOnUse"
                    patternTransform="rotate(-24)"
                >
                    <line x1="0" y1="0" x2="0" y2="5" stroke="#141414" strokeWidth="1" opacity="0.14" />
                </pattern>
                <symbol id="mpbagels-glyph" viewBox="0 0 100 78">
                    <ellipse cx="50" cy="40" rx="42" ry="27" fill="#E4E0D1" stroke="#141414" strokeWidth="2.5" />
                    <ellipse cx="50" cy="40" rx="42" ry="27" fill="url(#mpbagels-hatch)" />
                    <path d="M12 47 Q50 68 88 47" fill="none" stroke="#141414" strokeWidth="1.1" opacity="0.3" />
                    <path d="M17 30 Q50 12 83 30" fill="none" stroke="#141414" strokeWidth="1.1" opacity="0.22" />
                    <ellipse cx="50" cy="38" rx="15" ry="8.5" fill="#F1EFE6" stroke="#141414" strokeWidth="2" />
                    <g stroke="#141414" strokeWidth="2" strokeLinecap="round" fill="none">
                        <path d="M28 25 l5 -2" />
                        <path d="M41 19 l4 3" />
                        <path d="M58 18 l5 1" />
                        <path d="M71 25 l4 -3" />
                        <path d="M22 39 l5 2" />
                        <path d="M79 38 l-5 2" />
                        <path d="M33 53 l5 1" />
                        <path d="M63 54 l5 -2" />
                        <path d="M48 58 l4 2" />
                        <path d="M68 32 l4 2" />
                        <path d="M32 33 l-4 2" />
                        <path d="M50 24 l-4 -2" />
                    </g>
                </symbol>
            </defs>
        </svg>
    );
}

/**
 * The press-photo stand-ins. `hero` = this morning's dozen on the tray with a
 * 50¢ stamp; `a` = one big everything bagel, still steaming; `b` = the deli
 * stack with a FRESH tag. `compact` renders the 88x74 classified thumbnails.
 */
function BagelArt({ variant, compact = false }: { variant: "hero" | BagelVariant; compact?: boolean }) {
    if (compact) {
        return variant === "a" ? (
            <svg viewBox="0 0 100 78" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false">
                <rect width="100" height="78" fill="url(#mpbagels-tone)" opacity="0.5" />
                <use href="#mpbagels-glyph" x="4" y="3" width="92" height="72" />
            </svg>
        ) : (
            <svg viewBox="0 0 100 78" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false">
                <rect width="100" height="78" fill="url(#mpbagels-tone)" opacity="0.5" />
                <use href="#mpbagels-glyph" x="-8" y="16" width="72" height="56" />
                <use href="#mpbagels-glyph" x="34" y="4" width="72" height="56" />
            </svg>
        );
    }

    if (variant === "hero") {
        return (
            <svg viewBox="0 0 480 300" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false">
                <rect width="480" height="300" fill="url(#mpbagels-tone)" opacity="0.45" />
                <line x1="16" y1="104" x2="464" y2="104" stroke="#141414" strokeWidth="1" opacity="0.25" />
                <line x1="16" y1="196" x2="464" y2="196" stroke="#141414" strokeWidth="1" opacity="0.25" />
                <use href="#mpbagels-glyph" x="14" y="16" width="104" height="81" />
                <use href="#mpbagels-glyph" x="128" y="16" width="104" height="81" />
                <use href="#mpbagels-glyph" x="242" y="16" width="104" height="81" />
                <use href="#mpbagels-glyph" x="356" y="16" width="104" height="81" />
                <use href="#mpbagels-glyph" x="24" y="108" width="104" height="81" />
                <use href="#mpbagels-glyph" x="138" y="108" width="104" height="81" />
                <use href="#mpbagels-glyph" x="252" y="108" width="104" height="81" />
                <use href="#mpbagels-glyph" x="366" y="108" width="104" height="81" />
                <use href="#mpbagels-glyph" x="14" y="200" width="104" height="81" />
                <use href="#mpbagels-glyph" x="128" y="200" width="104" height="81" />
                <use href="#mpbagels-glyph" x="242" y="200" width="104" height="81" />
                <use href="#mpbagels-glyph" x="356" y="200" width="104" height="81" />
                <g>
                    <circle cx="430" cy="46" r="27" fill="#F1EFE6" stroke="#141414" strokeWidth="2" />
                    <circle cx="430" cy="46" r="22" fill="none" stroke="#141414" strokeWidth="1" opacity="0.5" />
                    <text
                        x="430"
                        y="52"
                        textAnchor="middle"
                        fontFamily="Georgia, 'Times New Roman', serif"
                        fontWeight="900"
                        fontSize="15"
                        fill="#141414"
                    >
                        50¢
                    </text>
                </g>
            </svg>
        );
    }

    if (variant === "a") {
        return (
            <svg viewBox="0 0 480 300" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false">
                <rect width="480" height="300" fill="url(#mpbagels-tone)" opacity="0.35" />
                <circle cx="240" cy="160" r="122" fill="url(#mpbagels-tone)" />
                <circle cx="240" cy="160" r="122" fill="none" stroke="#141414" strokeWidth="1" opacity="0.35" />
                <use href="#mpbagels-glyph" x="90" y="54" width="300" height="234" />
                <g stroke="#141414" strokeWidth="2" fill="none" strokeLinecap="round" opacity="0.55">
                    <path d="M205 46 q6 -12 0 -22 q-6 -10 0 -20" />
                    <path d="M240 42 q6 -12 0 -22 q-6 -10 0 -20" />
                    <path d="M275 46 q6 -12 0 -22 q-6 -10 0 -20" />
                </g>
            </svg>
        );
    }

    return (
        <svg viewBox="0 0 480 300" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false">
            <rect width="480" height="300" fill="url(#mpbagels-tone)" opacity="0.35" />
            <line x1="40" y1="288" x2="440" y2="288" stroke="#141414" strokeWidth="3" />
            <use href="#mpbagels-glyph" x="122" y="118" width="236" height="184" />
            <use href="#mpbagels-glyph" x="112" y="62" width="236" height="184" transform="rotate(-3 230 154)" />
            <use href="#mpbagels-glyph" x="132" y="6" width="236" height="184" transform="rotate(2 250 98)" />
            <g>
                <line x1="348" y1="122" x2="392" y2="92" stroke="#141414" strokeWidth="1.5" />
                <rect x="376" y="72" width="70" height="32" fill="#F1EFE6" stroke="#141414" strokeWidth="2" />
                <text
                    x="411"
                    y="93"
                    textAnchor="middle"
                    fontFamily="Georgia, 'Times New Roman', serif"
                    fontWeight="900"
                    fontSize="14"
                    letterSpacing="2"
                    fill="#141414"
                >
                    FRESH
                </text>
            </g>
        </svg>
    );
}

export default function Bagels({ style }: { style: Style }) {
    /**
     * `sel` holds the item shown in the "full column" (kept through the Modal's
     * exit animation); `open` alone drives visibility. `added` / `quoted` are
     * the two confirm-copy toggles. Initial paint renders no Modal at all.
     */
    const [sel, setSel] = useState<MenuItem | null>(null);
    const [open, setOpen] = useState(false);
    const [added, setAdded] = useState(false);
    const [quoted, setQuoted] = useState(false);

    const openItem = (item: MenuItem) => {
        setSel(item);
        setAdded(false);
        setOpen(true);
    };
    const close = () => setOpen(false);

    return (
        <div className="mpbagels-root">
            <InkDefs />
            <div className="mpbagels-sheet">
                {/* ── Masthead ──────────────────────────────────────────────── */}
                <header className="mpbagels-masthead">
                    <div className="mpbagels-dateline">
                        <span>Vol. I · No. 1</span>
                        <span>Milwaukee, Wisconsin</span>
                        <span>Est. 2026 · 50¢</span>
                    </div>
                    <div className="mpbagels-plateband">
                        <Link href="/inspiration/mom-n-pops" className="mpbagels-nameplate">
                            <span className="mpbagels-title">The Daily Bagel</span>
                            <span className="mpbagels-tagline">
                                Mom-n-Pops · all the schmear that's fit to spread
                            </span>
                        </Link>
                    </div>
                    <nav className="mpbagels-nav" aria-label="The Daily Bagel sections">
                        <a href="#mpbagels-menu">The Menu</a>
                        <a href="#mpbagels-story">Our Story</a>
                        <a href="#mpbagels-schedule">Where to Find Us</a>
                        <Button
                            type="button"
                            variant="ghost"
                            className="mpbagels-nav-order"
                            onClick={() => openItem(MENU[3])}
                        >
                            Order Ahead
                        </Button>
                        <a href="#mpbagels-catering">Catering</a>
                    </nav>
                </header>

                {/* ── Lead story ────────────────────────────────────────────── */}
                <section className="mpbagels-lead" aria-labelledby="mpbagels-headline">
                    <div className="mpbagels-lead-copy">
                        <p className="mpbagels-kicker">Front Page · Boiled &amp; Baked Daily</p>
                        <h1 id="mpbagels-headline" className="mpbagels-headline">
                            Kettle-Boiled Bagels Arrive in Milwaukee, Locals Rejoice
                        </h1>
                        <div className="mpbagels-columns">
                            <p className="mpbagels-drop">
                                Rosa &amp; Sal roll, boil, and bake every bagel before dawn in a
                                converted delivery truck — no steaming, no shortcuts, no
                                exceptions. The crust cracks; the inside pulls.
                            </p>
                            <p>
                                The schmears are whipped in-house, the lox is hand-sliced to
                                order, and the coffee is bottomless if you linger. Sources close
                                to the truck confirm the everything-seasoning is applied "with
                                reckless generosity."
                            </p>
                        </div>
                    </div>
                    <figure className="mpbagels-figure">
                        <div className="mpbagels-art mpbagels-art-hero">
                            <BagelArt variant="hero" />
                        </div>
                        <figcaption className="mpbagels-figcap">
                            FIG. 1 — This morning's dozen, still warm.
                        </figcaption>
                    </figure>
                </section>

                {/* ── The menu, set as classifieds (Card grid) ──────────────── */}
                <section id="mpbagels-menu" className="mpbagels-menu" aria-label="The menu">
                    <div className="mpbagels-menubar">
                        <span className="mpbagels-menubar-title">— THE MENU —</span>
                        <span className="mpbagels-menubar-hint">tap any item for the full column</span>
                    </div>
                    <div className="mpbagels-classifieds">
                        {MENU.map((item) => (
                            <Card
                                key={item.slug}
                                variant="flat"
                                padding="none"
                                className="mpbagels-row"
                                role="button"
                                tabIndex={0}
                                onClick={() => openItem(item)}
                                onKeyDown={(event) => {
                                    if (event.key === "Enter" || event.key === " ") {
                                        event.preventDefault();
                                        openItem(item);
                                    }
                                }}
                                aria-haspopup="dialog"
                                aria-label={`${item.name}, ${item.price} — read the full column`}
                            >
                                <span className="mpbagels-art mpbagels-thumb" aria-hidden="true">
                                    <BagelArt variant={item.variant} compact />
                                </span>
                                <span className="mpbagels-row-body">
                                    <span className="mpbagels-row-line">
                                        <span className="mpbagels-row-name">{item.name}</span>
                                        <span className="mpbagels-leader" aria-hidden="true" />
                                        <span className="mpbagels-row-price">{item.price}</span>
                                    </span>
                                    <span className="mpbagels-row-short">{item.short}</span>
                                </span>
                            </Card>
                        ))}
                    </div>
                </section>

                {/* ── Our story ─────────────────────────────────────────────── */}
                <section id="mpbagels-story" className="mpbagels-story" aria-labelledby="mpbagels-story-title">
                    <div className="mpbagels-art mpbagels-art-story">
                        <BagelArt variant="a" />
                    </div>
                    <div>
                        <h2 id="mpbagels-story-title" className="mpbagels-story-title">
                            Two Owners, One Kettle, Zero Days Off (Almost)
                        </h2>
                        <div className="mpbagels-columns">
                            <p>
                                Rosa learned to boil bagels at a Brooklyn counter; Sal learned to
                                schmooze at a Milwaukee deli. In 2026 they split the difference
                                and parked between the two. Rosa handles the dough — a two-day
                                cold ferment, malt in the boil — while Sal works the window and
                                never forgets a regular's order.
                            </p>
                            <p>
                                "A bagel is 90% patience," Rosa is quoted as saying, mid-roll,
                                flour to the elbows. The truck sells out most mornings by eleven.
                            </p>
                        </div>
                    </div>
                </section>

                {/* ── Week listings (Table) ─────────────────────────────────── */}
                <section id="mpbagels-schedule" className="mpbagels-schedule" aria-labelledby="mpbagels-schedule-title">
                    <div className="mpbagels-schedule-head">
                        <span id="mpbagels-schedule-title" className="mpbagels-schedule-title">
                            WHERE TO FIND THE TRUCK THIS WEEK
                        </span>
                    </div>
                    <Table className="mpbagels-schedule-table">
                        <Table.Body>
                            {SCHEDULE.map((stop) => (
                                <Table.Row key={stop.day} className="mpbagels-stop">
                                    <Table.Cell className="mpbagels-stop-day">{stop.day}</Table.Cell>
                                    <Table.Cell className="mpbagels-stop-place">{stop.place}</Table.Cell>
                                </Table.Row>
                            ))}
                        </Table.Body>
                    </Table>
                </section>

                {/* ── Catering classified ───────────────────────────────────── */}
                <section id="mpbagels-catering" className="mpbagels-catering" aria-label="Catering">
                    <div className="mpbagels-ad">
                        <div className="mpbagels-ad-copy">
                            <p className="mpbagels-kicker">Classified · Catering</p>
                            <p className="mpbagels-ad-headline">
                                WANTED: Your office, a bagel spread, and a dozen happy people.
                            </p>
                            <p className="mpbagels-ad-sub" aria-live="polite">
                                {quoted
                                    ? "Noted — the assistant is drafting your spread. Expect a call before the ovens cool."
                                    : "Boxed dozens, schmear flights, lox platters. Our assistant will build the order — just say the word."}
                            </p>
                        </div>
                        <Button type="button" className="mpbagels-quote" onClick={() => setQuoted(true)}>
                            {quoted ? "Quote requested" : "Get a quote →"}
                        </Button>
                    </div>
                </section>

                {/* ── Footer ────────────────────────────────────────────────── */}
                <footer className="mpbagels-footer">
                    <div className="mpbagels-footer-row">
                        <span className="mpbagels-footer-brand">The Daily Bagel · Mom-n-Pops</span>
                        <span>
                            hello<span>@</span>momnpops.truck · @momnpops.mke
                        </span>
                        <span>© 2026 · Rosa &amp; Sal · Milwaukee · Printed with love</span>
                    </div>
                    <div className="mpbagels-folio">
                        <span>
                            A Mom-n-Pops fiction, for demonstration · Style {style.num} / The Daily Bagel
                        </span>
                        <Link href="/inspiration/mom-n-pops" className="mpbagels-back">
                            Back to the trucks →
                        </Link>
                    </div>
                </footer>
            </div>

            {/* ── The full column: Modal restyled as a right-side paper sheet ─ */}
            <Modal
                open={open}
                onClose={close}
                size="lg"
                className="mpbagels-drawer"
                aria-label={sel ? `${sel.name} — the full column` : "Menu item — the full column"}
            >
                {sel && (
                    <>
                        <div className="mpbagels-drawer-hero">
                            <div className="mpbagels-art mpbagels-drawer-art">
                                <BagelArt variant={sel.variant} />
                            </div>
                            <Button
                                type="button"
                                variant="circle"
                                className="mpbagels-close"
                                onClick={close}
                                aria-label="Close the full column"
                            >
                                ×
                            </Button>
                        </div>
                        <div className="mpbagels-drawer-body">
                            <p className="mpbagels-kicker">The Menu · Full Column</p>
                            <div className="mpbagels-drawer-line">
                                <h2 className="mpbagels-drawer-name">{sel.name}</h2>
                                <span className="mpbagels-drawer-price">{sel.price}</span>
                            </div>
                            <div className="mpbagels-tags">
                                {sel.tags.map((tag) => (
                                    <Badge key={tag} variant="outline" className="mpbagels-tag">
                                        {tag}
                                    </Badge>
                                ))}
                            </div>
                            <p className="mpbagels-drawer-copy">{sel.long}</p>
                            <p className="mpbagels-builtwith">Built with</p>
                            <div className="mpbagels-ings">
                                {sel.ingredients.map((ingredient) => (
                                    <Badge key={ingredient} variant="outline" className="mpbagels-ing">
                                        {ingredient}
                                    </Badge>
                                ))}
                            </div>
                            <p className="mpbagels-allergens">Allergens: {sel.allergens}</p>
                            <Button
                                type="button"
                                className="mpbagels-addbar"
                                onClick={() => setAdded(true)}
                                aria-live="polite"
                            >
                                {added
                                    ? "Added to the order — see you at the window"
                                    : `Add to order · ${sel.price}`}
                            </Button>
                        </div>
                    </>
                )}
            </Modal>
        </div>
    );
}
