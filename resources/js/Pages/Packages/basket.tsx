import { Badge, Icon } from "@particle-academy/react-fancy";

/**
 * The BASKET language — the redesign's one repeated device.
 *
 * A package is either a UI SURFACE you can look at (violet) or a BACKEND that
 * renders nothing (teal). A family can be both. That distinction is stated on
 * the listing, on every card, on the package page and on the family map, and it
 * only reads as one language if all four spell it the same way — so the labels,
 * icons and colours live here rather than three times over.
 *
 * The colours are react-fancy `Badge` palette names, not hex: the primitive
 * already owns the light/dark reading of every hue, and a literal would only
 * have been right in one theme. CSS that needs the same hue reads
 * `--lane-ui` / `--lane-be` from showcase/packages.css.
 */

export type Basket = "ui" | "backend" | "both";
export type Eco = "ts" | "php" | "py" | "polyglot";

export const BASKETS = {
    ui: {
        label: "UI surfaces",
        icon: "monitor-play",
        color: "violet",
        cssAccent: "var(--lane-ui)",
        line: "React components you can preview right now — every card opens a page with a live demo and source.",
        tag: "UI surface",
        next: "Browse the previews",
    },
    backend: {
        label: "Backend & headless",
        icon: "server",
        color: "teal",
        cssAccent: "var(--lane-be)",
        line: "PHP / Node packages that render nothing. One install line, a typed API, and MCP tools.",
        tag: "Backend · renders no UI",
        next: "Read the API surface",
    },
} as const;

export const ECO_LABEL: Record<Eco, string> = { ts: "TS", php: "PHP", py: "Py", polyglot: "Poly" };

/** Which lane a `kind` sits in. Mirrors PackagesController::basketOfKind(). */
export function basketOfKind(kind: string | undefined): "ui" | "backend" {
    return kind === "headless" ? "backend" : "ui";
}

/** The UI / backend marker carried by every card, hero and member row. */
export function BasketTag({
    basket,
    languages,
    size = "sm",
}: {
    basket: Basket;
    languages?: string[] | null;
    size?: "sm" | "md";
}) {
    return (
        <span className="basket-tag">
            {basket === "both" ? (
                <>
                    <Badge color="violet" variant="soft" size={size}>
                        <Icon name={BASKETS.ui.icon} size="xs" /> UI
                    </Badge>
                    <span className="basket-tag__plus">+</span>
                    <Badge color="teal" variant="soft" size={size}>
                        <Icon name={BASKETS.backend.icon} size="xs" /> Backend
                    </Badge>
                </>
            ) : (
                <Badge color={BASKETS[basket].color} variant="soft" size={size}>
                    <Icon name={BASKETS[basket].icon} size="xs" /> {BASKETS[basket].tag}
                </Badge>
            )}
            {languages && languages.length > 0 && (
                <span className="basket-tag__langs">{languages.join(" · ")}</span>
            )}
        </span>
    );
}

/** A lane count — "4 UI", "9 backend". */
export function LaneChip({ basket, label }: { basket: "ui" | "backend"; label: string }) {
    return (
        <Badge color={BASKETS[basket].color} variant="soft" size="sm">
            <Icon name={BASKETS[basket].icon} size="xs" /> {label}
        </Badge>
    );
}

/** A one-line install command, in the shared shell treatment. */
export function Snippet({ cmd, className = "" }: { cmd: string; className?: string }) {
    return (
        <span className={`snippet ${className}`.trim()}>
            <span className="snippet__sigil">$</span>
            <span className="snippet__cmd">{cmd}</span>
        </span>
    );
}

/** Mono initials for a package glyph — the de-scoped name's first letters. */
export function initials(name: string): string {
    const base = name.replace(/^@[^/]+\//, "").replace(/^particle-academy\//, "");
    const parts = base.split(/[-/ ]/).filter(Boolean);
    return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? parts[0]?.[1] ?? "")).toUpperCase();
}

/** Drop the npm scope so "@particle-academy/x" reads as "x". */
export function deScope(name: string): string {
    return name.replace(/^@?particle-academy\//, "");
}
