import "./grilledcheese.css";
import { Link } from "@inertiajs/react";
import { useEffect, useRef, useState, type CSSProperties, type RefObject } from "react";
import { Badge, Button, Slider, Tooltip } from "@particle-academy/react-fancy";
import { Bot, Check, Truck } from "lucide-react";
import type { Style } from "../../types";

/**
 * Mom-n-Pops · Style 20 — Melts (grilled cheese, agentic catering).
 *
 * The truck as a late-night neon storefront: near-black plum (#141019), warm
 * cream type, and a strict two-accent discipline — butter-gold amber
 * (#F2A93B) for everything food and commerce, violet (#8B5CF6) reserved
 * exclusively for the agentic layer (the header pill, the bot avatar, chip
 * selection, the slider, the quote card's glow). A neon "MELTS · LATE" badge
 * flickers on a 5s loop; menu cards lift 4px to an amber border; all food is
 * CSS + emoji art (a hand-built dripping-cheese sandwich in the hero) — no
 * photos anywhere.
 *
 * The signature surface is the agentic catering block: brief the truck via an
 * occasion chip set + headcount Slider, watch a mono tool-call feed log every
 * interaction (scope_occasion, recalc, booking_create…), and see a sticky
 * quote card recompute line items live before "Book the truck" swaps it for a
 * green-check confirmation with a mono REF code — an AgentActivity log
 * rendered as product UI.
 *
 * Fancy primitives worn by the design: Button (amber fill, butter-gradient
 * book CTA, outline ghosts, violet occasion chips, circle drawer close),
 * Slider (headcount — violet fill + glowing thumb), Badge (menu tags, the
 * agentic pill, the quote's occasion chip, the "tonight" schedule marker),
 * Tooltip (the neon badge's backstory). The chat bubble, tool-call feed,
 * quote card, and slide-over drawer stay hand-rolled — truer to the mockup.
 *
 * Mounted by Inspiration/Show.tsx for mom-n-pops / `style.id ===
 * "grilledcheese"`. SSR-safe: the booking ref (Math.random) and feed
 * timestamps (new Date) are generated only inside event handlers; the
 * "tonight" schedule highlight hydrates in a useEffect; Escape/scroll-lock
 * live in an effect with cleanup. First paint is fully deterministic. The
 * drawer overlay tops out at z-index 25 — under the gallery frame's 30+.
 */

/* ── Menu ──────────────────────────────────────────────────────────────────── */

type MenuItem = {
    slug: string;
    name: string;
    price: string;
    short: string;
    tag: string;
    tagBg: string;
    long: string;
    ingredients: string[];
    allergens: string;
    tags: string[];
    /** Emoji art recipe — main subject + two orbiting sides + a glow tint. */
    emoji: string;
    sides: [string, string];
    tint: string;
};

const MENU: MenuItem[] = [
    {
        slug: "classic",
        name: "The Classic",
        price: "$6",
        short: "Aged cheddar, buttered sourdough.",
        tag: "The original",
        tagBg: "#F2A93B",
        long: "Sharp Wisconsin cheddar between two slices of sourdough griddled in real butter until deep golden and shattering-crisp. The one you dunk in tomato soup. Perfect, full stop.",
        ingredients: ["Aged cheddar", "Sourdough", "Butter"],
        allergens: "Gluten · dairy",
        tags: ["The original", "Vegetarian"],
        emoji: "🧀",
        sides: ["🍞", "🧈"],
        tint: "#F2A93B",
    },
    {
        slug: "three",
        name: "Three-Cheese Melt",
        price: "$8",
        short: "Cheddar, gruyère, fontina, pull for days.",
        tag: "Most loved",
        tagBg: "#F2A93B",
        long: "Cheddar for sharpness, gruyère for nuttiness, fontina for that endless cheese-pull. Three cheeses, one absurdly good melt. Cheese-pull guaranteed or Sal's disappointed.",
        ingredients: ["Cheddar", "Gruyère", "Fontina", "Sourdough"],
        allergens: "Gluten · dairy",
        tags: ["Most loved", "Vegetarian"],
        emoji: "🫕",
        sides: ["🧀", "🧀"],
        tint: "#F2C14E",
    },
    {
        slug: "truffle",
        name: "Truffle Mushroom",
        price: "$10",
        short: "Wild mushrooms, fontina, truffle.",
        tag: "",
        tagBg: "#C4A9F0",
        long: "Hard-seared wild mushrooms, melty fontina, and a whisper of truffle oil on toasted country bread. Grown-up grilled cheese that still lets you lick your fingers.",
        ingredients: ["Wild mushrooms", "Fontina", "Truffle oil", "Country bread"],
        allergens: "Gluten · dairy",
        tags: ["Vegetarian"],
        emoji: "🍄",
        sides: ["🧀", "🌿"],
        tint: "#B78A5A",
    },
    {
        slug: "caprese",
        name: "Pesto Caprese",
        price: "$9",
        short: "Fresh mozz, tomato, basil pesto.",
        tag: "Veg",
        tagBg: "#57C98A",
        long: "Fresh mozzarella, ripe tomato, and house basil pesto pressed on focaccia. Summer caught between two crisp slices — bright against all that butter.",
        ingredients: ["Fresh mozzarella", "Tomato", "Basil pesto", "Focaccia"],
        allergens: "Gluten · dairy · nuts",
        tags: ["Vegetarian"],
        emoji: "🍅",
        sides: ["🌿", "🧀"],
        tint: "#57C98A",
    },
    {
        slug: "shortrib",
        name: "Short Rib Melt",
        price: "$12",
        short: "Braised short rib, smoked gouda, onion.",
        tag: "Loaded",
        tagBg: "#F2A93B",
        long: "Red-wine-braised short rib, smoked gouda, and caramelized onion griddled till it all melts together. Barely a grilled cheese anymore — nobody's complaining.",
        ingredients: ["Braised short rib", "Smoked gouda", "Caramelized onion", "Sourdough"],
        allergens: "Gluten · dairy",
        tags: ["Loaded"],
        emoji: "🥩",
        sides: ["🧅", "🧀"],
        tint: "#E07A4A",
    },
    {
        slug: "soup",
        name: "Tomato Soup",
        price: "$4",
        short: "Roasted tomato, basil, for dunking.",
        tag: "Dunk it",
        tagBg: "#F2A93B",
        long: "Slow-roasted tomatoes blended with basil and a little cream into the only correct grilled-cheese companion. Comes in a cup built for dunking. Add it to any melt for $3.",
        ingredients: ["Roasted tomato", "Basil", "Cream"],
        allergens: "Dairy",
        tags: ["Vegetarian", "Dunk it"],
        emoji: "🥣",
        sides: ["🍅", "🌿"],
        tint: "#E0523E",
    },
];

/* ── Agentic catering ──────────────────────────────────────────────────────── */

const OCCASIONS = [
    { id: "office", label: "Office lunch" },
    { id: "party", label: "House party" },
    { id: "wedding", label: "Wedding" },
    { id: "latenight", label: "Late-night event" },
] as const;

type OccasionId = (typeof OCCASIONS)[number]["id"];

/** Per-guest pricing the agent quotes, by occasion. */
const PER_HEAD: Record<OccasionId, number> = {
    office: 10,
    party: 11,
    wedding: 15,
    latenight: 9,
};

const OPENING_LINE =
    "Tell me the occasion and how many mouths — I'll build a melt spread, price it, and hold your date.";

type FeedRow = { t: string; msg: string; ok: string };

/* ── Schedule ──────────────────────────────────────────────────────────────── */

const SCHEDULE: { day: string; place: string; hours: string }[] = [
    { day: "Wednesday", place: "Bay View — KK Ave", hours: "5–11" },
    { day: "Thursday", place: "Brady Street", hours: "5p–1a" },
    { day: "Friday", place: "Water St — bar district", hours: "7p–2:30a" },
    { day: "Saturday", place: "Water St — bar district", hours: "7p–2:30a" },
    { day: "Sunday", place: "Riverwest — Center St", hours: "5–11" },
    { day: "Mon–Tue", place: "Catering only", hours: "—" },
];

/** getDay() (Sun=0…Sat=6) → SCHEDULE row index (Wed=0 … Mon–Tue=5). */
const DAY_TO_ROW = [4, 5, 5, 0, 1, 2, 3];

/* ── Page ──────────────────────────────────────────────────────────────────── */

export default function GrilledCheese({ style }: { style: Style }) {
    /** The clicked menu item drives the slide-over drawer (null = closed). */
    const [sel, setSel] = useState<MenuItem | null>(null);

    /** The catering brief: occasion + headcount, plus the booking outcome. */
    const [occasion, setOccasion] = useState<OccasionId>("office");
    const [guests, setGuests] = useState(40);
    const [booked, setBooked] = useState(false);
    const [bookingRef, setBookingRef] = useState("");

    /** The agent narrates the planning; the feed logs it as tool calls. */
    const [agentSay, setAgentSay] = useState(OPENING_LINE);
    const [feed, setFeed] = useState<FeedRow[]>([{ t: "20:02", msg: "intake_open", ok: "ok" }]);

    /** SCHEDULE row for tonight; -1 until hydrated (deterministic SSR paint). */
    const [tonightIdx, setTonightIdx] = useState(-1);
    useEffect(() => {
        setTonightIdx(DAY_TO_ROW[new Date().getDay()]);
    }, []);

    /* Anchor targets for the in-page nav + the hero's "Cater an event →". */
    const menuRef = useRef<HTMLElement>(null);
    const caterRef = useRef<HTMLElement>(null);
    const storyRef = useRef<HTMLElement>(null);
    const scheduleRef = useRef<HTMLElement>(null);

    const jumpTo = (ref: RefObject<HTMLElement | null>) => {
        ref.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    };

    /* Escape closes the drawer; the page behind it stops scrolling. Browser
       APIs only ever run here, post-hydration, with full cleanup. */
    useEffect(() => {
        if (!sel) return;
        const onKey = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                setSel(null);
            }
        };
        document.addEventListener("keydown", onKey);
        const prevOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        return () => {
            document.removeEventListener("keydown", onKey);
            document.body.style.overflow = prevOverflow;
        };
    }, [sel]);

    /** Append a green-status row to the tool-call feed (keeps the last 6). */
    const log = (msg: string) => {
        const t = new Date().toLocaleTimeString("en-GB").slice(0, 5);
        setFeed((rows) => [...rows.slice(-5), { t, msg, ok: "ok" }]);
    };

    const pickOcc = (id: OccasionId) => {
        const label = OCCASIONS.find((o) => o.id === id)!.label;
        setOccasion(id);
        setAgentSay(`A ${label.toLowerCase()} — good call. I've tuned the spread and portions for that crowd.`);
        log(`scope_occasion · ${id}`);
    };

    const handleGuests = (value: number) => {
        setGuests(value);
        log(`recalc · ${value} guests`);
    };

    const book = () => {
        const ref = `MP-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
        setBookingRef(ref);
        setBooked(true);
        log("booking_create");
        log("email_menu · sent");
    };

    const resetPlan = () => {
        setBooked(false);
        setAgentSay("Fresh event — what's the occasion this time?");
    };

    /* The live quote — pure derived state, recomputed every render from
       occasion + guests. Same math as the mockup's renderVals(). */
    const perHead = PER_HEAD[occasion];
    const melts = Math.ceil(guests * 1.2);
    const serviceFee = occasion === "wedding" ? 350 : 220;
    const lineItems: { name: string; note: string; price: string }[] = [
        { name: "Melt platters", note: `${melts} melts · assorted`, price: `$${(melts * 4.5).toFixed(0)}` },
        { name: "Tomato soup shooters", note: `${guests} cups`, price: `$${(guests * 2).toFixed(0)}` },
        { name: "On-site griddle service", note: "90 min · staffed", price: `$${serviceFee}` },
    ];
    if (occasion === "wedding" || occasion === "party") {
        lineItems.push({ name: "Late-night snack cart", note: "mini melts + cookies", price: `$${(guests * 3).toFixed(0)}` });
    }
    const total = guests * perHead + serviceFee;
    const totalFmt = `$${total.toLocaleString("en-US")}`;
    const occLabel = OCCASIONS.find((o) => o.id === occasion)!.label;

    return (
        <div className="mpgrilledcheese-root">
            {/* ── Sticky header — blurred plum glass, neon flicker badge ────── */}
            <header className="mpgrilledcheese-header">
                <div className="mpgrilledcheese-header-in">
                    <Link href="/inspiration/mom-n-pops" className="mpgrilledcheese-brand">
                        <span className="mpgrilledcheese-brand-name">Mom-n-Pops</span>
                        <Tooltip content="The neon's flickered since night one. Sal calls it ambiance.">
                            <span className="mpgrilledcheese-neon">MELTS · LATE</span>
                        </Tooltip>
                    </Link>
                    <nav className="mpgrilledcheese-nav" aria-label="Page sections">
                        <button type="button" className="mpgrilledcheese-navlink" onClick={() => jumpTo(menuRef)}>
                            Menu
                        </button>
                        <button type="button" className="mpgrilledcheese-navlink" onClick={() => jumpTo(storyRef)}>
                            Story
                        </button>
                        <button type="button" className="mpgrilledcheese-navlink" onClick={() => jumpTo(scheduleRef)}>
                            Find us
                        </button>
                        <button type="button" className="mpgrilledcheese-agentpill" onClick={() => jumpTo(caterRef)}>
                            <span className="mpgrilledcheese-agentdot" aria-hidden />
                            agentic catering
                        </button>
                    </nav>
                </div>
            </header>

            <div className="mpgrilledcheese-container">
                {/* ── Hero — the pitch + a CSS-built dripping melt ──────────── */}
                <section className="mpgrilledcheese-hero">
                    <div>
                        <div className="mpgrilledcheese-kicker">Open late · Milwaukee · Est. 2026</div>
                        <h1 className="mpgrilledcheese-display">
                            Melted, gooey,
                            <br />
                            and open when
                            <br />
                            you need it.
                        </h1>
                        <p className="mpgrilledcheese-lede">
                            Griddled-butter sourdough, Wisconsin cheese pulled long, tomato soup for dunking. And when
                            you&apos;re feeding a crowd — brief our agent, it plans the whole thing.
                        </p>
                        <div className="mpgrilledcheese-hero-ctas">
                            <Button
                                className="mpgrilledcheese-btn mpgrilledcheese-btn--amber"
                                onClick={() => jumpTo(menuRef)}
                            >
                                See the melts
                            </Button>
                            <Button
                                className="mpgrilledcheese-btn mpgrilledcheese-btn--ghost"
                                onClick={() => jumpTo(caterRef)}
                            >
                                Cater an event →
                            </Button>
                        </div>
                    </div>

                    {/* No photos: the hero "shot" is a hand-built melt — toast
                        gradients, an amber cheese pull, steam — in the window
                        glow of the truck. */}
                    <div className="mpgrilledcheese-heroart" aria-hidden>
                        <span className="mpgrilledcheese-heroart-moon">🌙</span>
                        <div className="mpgrilledcheese-steam">
                            <i />
                            <i />
                            <i />
                        </div>
                        <div className="mpgrilledcheese-sando">
                            <span className="mpgrilledcheese-bread mpgrilledcheese-bread--top" />
                            <span className="mpgrilledcheese-cheese">
                                <i />
                                <i />
                                <i />
                            </span>
                            <span className="mpgrilledcheese-bread mpgrilledcheese-bread--bot" />
                        </div>
                        <span className="mpgrilledcheese-griddle" />
                        <span className="mpgrilledcheese-heroart-tag">tonight · water st · till 2:30a</span>
                    </div>
                </section>

                {/* ── Menu — six melts, tap for the full story ──────────────── */}
                <section className="mpgrilledcheese-menu" ref={menuRef}>
                    <div className="mpgrilledcheese-sechead">
                        <h2 className="mpgrilledcheese-h2">The melts</h2>
                        <span className="mpgrilledcheese-sechint">tap for the full melt</span>
                    </div>
                    <div className="mpgrilledcheese-grid">
                        {MENU.map((m) => (
                            <button
                                key={m.slug}
                                type="button"
                                className="mpgrilledcheese-card"
                                onClick={() => setSel(m)}
                                aria-haspopup="dialog"
                            >
                                <div className="mpgrilledcheese-card-art">
                                    <MeltArt item={m} />
                                    {m.tag !== "" && (
                                        <Badge
                                            className="mpgrilledcheese-tag"
                                            style={{ background: m.tagBg }}
                                        >
                                            {m.tag}
                                        </Badge>
                                    )}
                                </div>
                                <div className="mpgrilledcheese-card-body">
                                    <div className="mpgrilledcheese-card-line">
                                        <span className="mpgrilledcheese-card-name">{m.name}</span>
                                        <span className="mpgrilledcheese-card-price">{m.price}</span>
                                    </div>
                                    <p className="mpgrilledcheese-card-short">{m.short}</p>
                                </div>
                            </button>
                        ))}
                    </div>
                </section>

                {/* ── Agentic catering — the signature surface ──────────────── */}
                <section className="mpgrilledcheese-cater" ref={caterRef}>
                    <div className="mpgrilledcheese-cater-head">
                        <div className="mpgrilledcheese-vkicker">
                            <span className="mpgrilledcheese-vdot" aria-hidden />
                            Agentic catering
                        </div>
                        <h2 className="mpgrilledcheese-h2 mpgrilledcheese-h2--xl">Brief the truck. The agent plans it.</h2>
                        <p className="mpgrilledcheese-cater-sub">
                            Tell it the occasion and headcount — it builds a spread, prices it, and books the truck in
                            real time.
                        </p>
                    </div>

                    <div className="mpgrilledcheese-cater-grid">
                        {/* The brief: agent bubble → occasion → headcount → feed */}
                        <div className="mpgrilledcheese-brief">
                            <div className="mpgrilledcheese-say">
                                <span className="mpgrilledcheese-bot" aria-hidden>
                                    <Bot size={18} />
                                </span>
                                <div className="mpgrilledcheese-bubble" aria-live="polite">
                                    {agentSay}
                                </div>
                            </div>

                            <div className="mpgrilledcheese-panel">
                                <div className="mpgrilledcheese-panel-label">01 — Occasion</div>
                                <div className="mpgrilledcheese-chips" role="group" aria-label="Occasion">
                                    {OCCASIONS.map((o) => (
                                        <Button
                                            key={o.id}
                                            className="mpgrilledcheese-chip"
                                            aria-pressed={occasion === o.id}
                                            onClick={() => pickOcc(o.id)}
                                        >
                                            {o.label}
                                        </Button>
                                    ))}
                                </div>
                            </div>

                            <div className="mpgrilledcheese-panel">
                                <div className="mpgrilledcheese-panel-top">
                                    <div className="mpgrilledcheese-panel-label">02 — Headcount</div>
                                    <div className="mpgrilledcheese-guests">{guests} guests</div>
                                </div>
                                <Slider
                                    className="mpgrilledcheese-slider"
                                    min={10}
                                    max={200}
                                    step={5}
                                    value={guests}
                                    onValueChange={(v) => handleGuests(v as number)}
                                    aria-label="Headcount"
                                />
                                <div className="mpgrilledcheese-slider-scale">
                                    <span>10</span>
                                    <span>200</span>
                                </div>
                            </div>

                            <div className="mpgrilledcheese-feed">
                                <div className="mpgrilledcheese-feed-label">Agent · tool calls</div>
                                <ol className="mpgrilledcheese-feed-list">
                                    {feed.map((row, i) => (
                                        <li key={`${row.t}-${row.msg}-${i}`} className="mpgrilledcheese-feed-row">
                                            <span className="mpgrilledcheese-feed-t">{row.t}</span>
                                            <span className="mpgrilledcheese-feed-msg">{row.msg}</span>
                                            <span className="mpgrilledcheese-feed-ok">{row.ok}</span>
                                        </li>
                                    ))}
                                </ol>
                            </div>
                        </div>

                        {/* The sticky quote card — live math, then confirmation */}
                        <aside className="mpgrilledcheese-quote">
                            {!booked ? (
                                <div>
                                    <div className="mpgrilledcheese-quote-head">
                                        <span className="mpgrilledcheese-quote-title">Proposed spread</span>
                                        <Badge className="mpgrilledcheese-occbadge">{occLabel}</Badge>
                                    </div>
                                    <div className="mpgrilledcheese-quote-items">
                                        {lineItems.map((li) => (
                                            <div key={li.name} className="mpgrilledcheese-li">
                                                <div>
                                                    <div className="mpgrilledcheese-li-name">{li.name}</div>
                                                    <div className="mpgrilledcheese-li-note">{li.note}</div>
                                                </div>
                                                <span className="mpgrilledcheese-li-price">{li.price}</span>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="mpgrilledcheese-quote-total">
                                        <div className="mpgrilledcheese-total-line">
                                            <span className="mpgrilledcheese-total-label">Estimated total</span>
                                            <span className="mpgrilledcheese-total-num">{totalFmt}</span>
                                        </div>
                                        <div className="mpgrilledcheese-total-per">
                                            ${perHead} / guest · 90-min service
                                        </div>
                                    </div>
                                    <div className="mpgrilledcheese-quote-cta">
                                        <Button className="mpgrilledcheese-btn mpgrilledcheese-btn--book" onClick={book}>
                                            <Truck size={18} aria-hidden /> Book the truck
                                        </Button>
                                        <div className="mpgrilledcheese-quote-fine">
                                            No deposit — the agent holds your date and emails the full menu.
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="mpgrilledcheese-bookedwrap">
                                    <div className="mpgrilledcheese-booked-check" aria-hidden>
                                        <Check size={28} />
                                    </div>
                                    <h3 className="mpgrilledcheese-booked-h">Truck booked</h3>
                                    <p className="mpgrilledcheese-booked-p">
                                        The agent held your date for {guests} guests and emailed the {totalFmt} spread.
                                        Rosa or Sal will confirm within a day.
                                    </p>
                                    <div className="mpgrilledcheese-ref">REF · {bookingRef}</div>
                                    <Button
                                        variant="ghost"
                                        className="mpgrilledcheese-resetlink"
                                        onClick={resetPlan}
                                    >
                                        Plan another event
                                    </Button>
                                </div>
                            )}
                        </aside>
                    </div>
                </section>

                {/* ── Story — Rosa & Sal, in-fiction case for the agent ─────── */}
                <section className="mpgrilledcheese-story" ref={storyRef}>
                    <div className="mpgrilledcheese-storyart" aria-hidden>
                        <span className="mpgrilledcheese-storyart-moon">🌙</span>
                        <div className="mpgrilledcheese-lights">
                            <i />
                            <i />
                            <i />
                            <i />
                            <i />
                            <i />
                            <i />
                            <i />
                        </div>
                        <span className="mpgrilledcheese-storyart-truck">🚚</span>
                        <span className="mpgrilledcheese-storyart-pair">🧀🥣</span>
                        <span className="mpgrilledcheese-storyart-road" />
                    </div>
                    <div>
                        <div className="mpgrilledcheese-kicker mpgrilledcheese-kicker--story">Our story</div>
                        <h2 className="mpgrilledcheese-story-h">Comfort food for a city that stays up.</h2>
                        <p className="mpgrilledcheese-story-p">
                            Rosa &amp; Sal park outside the bars and the late shifts, griddling melts till the small
                            hours. When catering got busy, they taught an agent to scope events so nobody&apos;s ever on
                            hold — you brief it, it plans, they cook.
                        </p>
                        <p className="mpgrilledcheese-story-p2">Milwaukee, since 2026. Grilled with butter, always.</p>
                    </div>
                </section>

                {/* ── Schedule — nights & late, mono hours ──────────────────── */}
                <section className="mpgrilledcheese-schedule" ref={scheduleRef}>
                    <div className="mpgrilledcheese-sechead mpgrilledcheese-sechead--split">
                        <h2 className="mpgrilledcheese-h2">Find the truck</h2>
                        <span className="mpgrilledcheese-sechint">Milwaukee · nights &amp; late</span>
                    </div>
                    <div className="mpgrilledcheese-sched-card">
                        {SCHEDULE.map((s, i) => (
                            <div
                                key={s.day}
                                className={`mpgrilledcheese-sched-row${i === tonightIdx ? " mpgrilledcheese-sched-row--tonight" : ""}`}
                            >
                                <span className="mpgrilledcheese-sched-day">
                                    {s.day}
                                    {i === tonightIdx && (
                                        <Badge className="mpgrilledcheese-tonight" color="amber" variant="soft" size="sm" dot>
                                            tonight
                                        </Badge>
                                    )}
                                </span>
                                <span className="mpgrilledcheese-sched-place">{s.place}</span>
                                <span className="mpgrilledcheese-sched-hours">{s.hours}</span>
                            </div>
                        ))}
                    </div>
                </section>
            </div>

            {/* ── Footer ────────────────────────────────────────────────────── */}
            <footer className="mpgrilledcheese-footer">
                <div className="mpgrilledcheese-footer-in">
                    <span className="mpgrilledcheese-footer-brand">Mom-n-Pops Melts</span>
                    <span className="mpgrilledcheese-footer-contact">
                        hello<span>@</span>momnpops.truck · @momnpops.mke
                    </span>
                    <span>© 2026 · Rosa &amp; Sal · Milwaukee</span>
                </div>
                <div className="mpgrilledcheese-footer-meta">
                    <span>Mom-n-Pops — a fictional food truck, for demonstration · Style {style.num} / Melts</span>
                    <Link href="/inspiration/mom-n-pops" className="mpgrilledcheese-back">
                        ← Back to the trucks
                    </Link>
                </div>
            </footer>

            {/* ── Item drawer — fixed slide-over, capped at z-index 25 ──────── */}
            {sel && (
                <div className="mpgrilledcheese-overlay">
                    <button
                        type="button"
                        className="mpgrilledcheese-scrim"
                        onClick={() => setSel(null)}
                        aria-label="Close item details"
                    />
                    <aside
                        className="mpgrilledcheese-drawer"
                        role="dialog"
                        aria-modal="true"
                        aria-label={`${sel.name} details`}
                    >
                        <div className="mpgrilledcheese-drawer-hero">
                            <MeltArt item={sel} large />
                            <Button
                                variant="circle"
                                className="mpgrilledcheese-close"
                                onClick={() => setSel(null)}
                                aria-label="Close"
                            >
                                ×
                            </Button>
                        </div>
                        <div className="mpgrilledcheese-drawer-body">
                            <div className="mpgrilledcheese-drawer-line">
                                <h2 className="mpgrilledcheese-drawer-name">{sel.name}</h2>
                                <span className="mpgrilledcheese-drawer-price">{sel.price}</span>
                            </div>
                            <div className="mpgrilledcheese-drawer-tags">
                                {sel.tags.map((t) => (
                                    <Badge key={t} className="mpgrilledcheese-drawertag">
                                        {t}
                                    </Badge>
                                ))}
                            </div>
                            <p className="mpgrilledcheese-drawer-copy">{sel.long}</p>
                            <div className="mpgrilledcheese-drawer-label">Pressed with</div>
                            <div className="mpgrilledcheese-pills">
                                {sel.ingredients.map((ing) => (
                                    <span key={ing} className="mpgrilledcheese-pill">
                                        {ing}
                                    </span>
                                ))}
                            </div>
                            <div className="mpgrilledcheese-allergens">Allergens: {sel.allergens}</div>
                            <Button
                                className="mpgrilledcheese-btn mpgrilledcheese-btn--amber mpgrilledcheese-btn--full"
                                onClick={() => setSel(null)}
                            >
                                Add to order · {sel.price}
                            </Button>
                        </div>
                    </aside>
                </div>
            )}
        </div>
    );
}

/* ── Melt art — the no-photo food tile ──────────────────────────────────────
   Each menu item renders as a griddle-lit emoji composition: a per-item glow
   tint (CSS var), faint griddle stripes, one big subject emoji and two
   orbiting sides. Deterministic — everything comes from the item data. */
function MeltArt({ item, large = false }: { item: MenuItem; large?: boolean }) {
    return (
        <div
            className={`mpgrilledcheese-art${large ? " mpgrilledcheese-art--large" : ""}`}
            style={{ "--mpgc-tint": item.tint } as CSSProperties}
            aria-hidden
        >
            <span className="mpgrilledcheese-art-glow" />
            <span className="mpgrilledcheese-art-main">{item.emoji}</span>
            <span className="mpgrilledcheese-art-side mpgrilledcheese-art-side--a">{item.sides[0]}</span>
            <span className="mpgrilledcheese-art-side mpgrilledcheese-art-side--b">{item.sides[1]}</span>
            <span className="mpgrilledcheese-art-stripes" />
        </div>
    );
}
