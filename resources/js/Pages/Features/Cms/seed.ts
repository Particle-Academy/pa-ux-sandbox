import type { ImageAsset, ImageAssetResolver, PageDoc } from "@particle-academy/fancy-cms-ui";
import coffee from "@particle-academy/fancy-cms-ui/icons/coffee";
import mapPin from "@particle-academy/fancy-cms-ui/icons/map-pin";
import clock from "@particle-academy/fancy-cms-ui/icons/clock";

/**
 * The page the CMS micro-site's live editor opens on: a one-page site for a
 * fictional coffee cart (the Inspiration Gallery's Mom-n-Pops cast).
 *
 * It is a real Stages document — a flat node map with per-breakpoint
 * StyleProps — and it exercises the parts the tour talks about:
 *  - an image node that names an ASSET HANDLE, not a URL, resolved by the
 *    host's `imageResolver` below;
 *  - native icon nodes whose glyphs are imported one by one (opt-in data);
 *  - a responsive grid (`columnMin`) that needs no breakpoints.
 *
 * Edits stay in memory; nothing is persisted.
 */

export const HERO_ID = "hero";

/** Glyphs used by the page: imported per name, passed as `icons`. */
export const CMS_ICONS = { coffee, "map-pin": mapPin, clock };

/**
 * The host's closed asset catalogue. The document says `asset: "cart/hero"`
 * and never carries a URL, dimensions or variants of its own.
 */
const ASSETS: Record<string, ImageAsset> = {
    "cart/hero": { src: "/inspiration-thumbs/mom-n-pops/coffee.jpeg", width: 1280, height: 580 },
};

export const imageResolver: ImageAssetResolver = (handle) => ASSETS[handle] ?? null;

const px = (value: number) => ({ value, unit: "px" as const });

export const CART_PAGE: PageDoc = {
    id: "feature-cms-cart",
    seq: 0,
    meta: { title: "Corner Cart Coffee", slug: "/", scrollMode: "smooth" },
    theme: { name: "default" },
    breakpoints: ["base", "md", "lg"],
    nodes: {
        [HERO_ID]: {
            id: HERO_ID,
            type: "section",
            parent: null,
            order: "a0",
            props: {},
            layout: "stack",
            style: {
                base: {
                    direction: "column",
                    align: "start",
                    gap: px(14),
                    padding: px(28),
                    background: "#fff7ed",
                    color: "#1c1917",
                },
                md: { padding: px(40) },
            },
        },
        "hero-kicker": {
            id: "hero-kicker",
            type: "text",
            parent: HERO_ID,
            order: "a0",
            props: { content: "Open from 7am, Tuesday to Sunday" },
            style: {
                base: {
                    color: "#9a3412",
                    fontSize: px(13),
                    fontWeight: 700,
                    letterSpacing: px(1),
                    textTransform: "uppercase",
                },
            },
        },
        "hero-title": {
            id: "hero-title",
            type: "heading",
            parent: HERO_ID,
            order: "a1",
            props: { content: "Small batch coffee, poured on the corner", level: 2 },
            style: {
                // Base only: the inspectors write the base breakpoint, so a
                // size edit in the demo shows at every width.
                base: { fontSize: px(32), fontWeight: 800, lineHeight: 1.15, color: "#1c1917" },
            },
        },
        "hero-copy": {
            id: "hero-copy",
            type: "text",
            parent: HERO_ID,
            order: "a2",
            props: {
                content:
                    "One cart, two grinders and a short menu that changes with the beans. Order at the window or ahead online.",
            },
            style: { base: { fontSize: px(16), lineHeight: 1.6, color: "#44403c", maxWidth: px(560) } },
        },
        "hero-cta": {
            id: "hero-cta",
            type: "button",
            parent: HERO_ID,
            order: "a3",
            props: { label: "See the menu", href: "#menu", variant: "primary" },
            style: { base: { background: "#c2410c", color: "#ffffff" } },
        },
        "hero-image": {
            id: "hero-image",
            type: "image",
            parent: HERO_ID,
            order: "a4",
            props: { asset: "cart/hero", alt: "The Mom-n-Pops coffee cart home page design", fit: "cover" },
            style: { base: { radius: px(14), aspectRatio: "16 / 7", marginY: px(6) } },
        },
        facts: {
            id: "facts",
            type: "grid",
            parent: null,
            order: "a1",
            props: {},
            layout: "grid",
            style: {
                base: { columnMin: px(180), gap: px(12), padding: px(24), background: "#ffffff" },
                md: { paddingX: px(40) },
            },
        },
        ...fact("fact-a", "a0", "coffee", "Rotating single origins", "A new bean every fortnight."),
        ...fact("fact-b", "a1", "map-pin", "Market Street corner", "Look for the orange awning."),
        ...fact("fact-c", "a2", "clock", "7am to 2pm", "Or until the milk runs out."),
    },
};

/** One fact card: a card node holding an icon, a title and a line of copy. */
function fact(id: string, order: string, icon: string, title: string, body: string): PageDoc["nodes"] {
    return {
        [id]: {
            id,
            type: "card",
            parent: "facts",
            order,
            props: {},
            layout: "stack",
            style: {
                base: {
                    direction: "column",
                    gap: px(6),
                    padding: px(16),
                    radius: px(12),
                    border: "1px solid #fed7aa",
                    background: "#fffbf5",
                },
            },
        },
        [`${id}-icon`]: {
            id: `${id}-icon`,
            type: "icon",
            parent: id,
            order: "a0",
            props: { name: icon, decorative: true },
            style: { base: { fontSize: px(22), color: "#c2410c" } },
        },
        [`${id}-title`]: {
            id: `${id}-title`,
            type: "heading",
            parent: id,
            order: "a1",
            props: { content: title, level: 3 },
            style: { base: { fontSize: px(17), fontWeight: 700, color: "#1c1917" } },
        },
        [`${id}-body`]: {
            id: `${id}-body`,
            type: "text",
            parent: id,
            order: "a2",
            props: { content: body },
            style: { base: { fontSize: px(14), color: "#57534e" } },
        },
    };
}
