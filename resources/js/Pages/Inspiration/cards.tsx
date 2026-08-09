import { Link } from "@inertiajs/react";
import { Card } from "@particle-academy/react-fancy";
import type { CSSProperties } from "react";
import type { Collection, Style } from "./types";

/**
 * Shared Inspiration Gallery chrome — the style card, per-collection heading,
 * and gallery footer used by both the landing Index (all collections) and the
 * per-collection Catalog page. Restrained, Swiss-clean site tokens; the bold
 * range lives on the per-style pages.
 */

export function StyleCard({ style }: { style: Style }) {
    // Mono chip (dark-translucent + blur) so the num/mode read over any
    // thumbnail, light or dark.
    // Positioning now comes from Card.Media's corner slots; this is purely the
    // gallery's chip LOOK.
    const chip: CSSProperties = {
        display: "inline-block",
        fontFamily: "var(--font-mono)",
        fontSize: 10.5,
        fontWeight: 600,
        padding: "2px 7px",
        borderRadius: 999,
        background: "rgba(10,10,14,.5)",
        color: "rgba(255,255,255,.92)",
        backdropFilter: "blur(4px)",
        WebkitBackdropFilter: "blur(4px)",
        lineHeight: 1.45,
    };

    return (
        <Link
            href={`/inspiration/${style.collection}/${style.id}`}
            className="insp-card"
            style={{ "--accent": "var(--accent)" } as CSSProperties}
            aria-label={`${style.name} — style ${style.num}`}
        >
            {/* react-fancy's Card.Media — the thumbnail region this card, the
                package grid, the starter-kit grid and the showcase grid had
                each rebuilt from tokens. The `background` is load/failure
                fallback, not decoration: every style is keyed to a swatch, so a
                missing screenshot degrades to the right colour rather than to a
                hole. The wrapper stays `.insp-card`, which carries the gallery's
                own border, radius and hover. */}
            <Card.Media
                src={style.thumb}
                alt={style.name}
                height={122}
                background={style.swatch}
                objectPosition="top center"
                topLeft={<span style={chip}>{style.num}</span>}
                topRight={<span style={chip}>{style.surface ?? style.mode}</span>}
            />

            <div style={{ padding: "13px 15px 16px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8 }}>
                    <span style={{ fontSize: 14.5, fontWeight: 600, color: "var(--fg-1)", letterSpacing: "-0.01em" }}>
                        {style.name}
                    </span>
                    {style.cuisine && (
                        <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--fg-4)", whiteSpace: "nowrap" }}>
                            {style.cuisine}
                        </span>
                    )}
                </div>
                <div style={{ marginTop: 4, fontSize: 13, lineHeight: 1.5, color: "var(--fg-3)" }}>
                    {style.note}
                </div>
            </div>
        </Link>
    );
}

/**
 * A collection's heading block — brand mark + name + kicker chip, headline,
 * blurb, and the mono meta column. `link` renders the name as a link to the
 * collection's own catalog (used on the landing page).
 */
export function CollectionHeading({ collection, link = false }: { collection: Collection; link?: boolean }) {
    const name = link ? (
        <Link href={`/inspiration/${collection.id}`} style={{ color: "var(--fg-1)", textDecoration: "none" }}>
            {collection.name}
        </Link>
    ) : (
        collection.name
    );

    return (
        <header
            style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-end",
                flexWrap: "wrap",
                gap: 24,
            }}
        >
            <div style={{ maxWidth: 680 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
                    {/* Brand mark — the one place a gradient is allowed. */}
                    <span
                        className="brand-gradient"
                        style={{
                            width: 30,
                            height: 30,
                            borderRadius: 8,
                            display: "grid",
                            placeItems: "center",
                            color: "#fff",
                            fontWeight: 700,
                            fontSize: 16,
                            lineHeight: 1,
                            flexShrink: 0,
                        }}
                        aria-hidden
                    >
                        {collection.name.charAt(0)}
                    </span>
                    <span style={{ fontWeight: 600, fontSize: 15, color: "var(--fg-1)", letterSpacing: "-0.01em" }}>
                        {name}
                    </span>
                    <span
                        style={{
                            fontFamily: "var(--font-mono)",
                            fontSize: 11,
                            color: "var(--fg-3)",
                            border: "1px solid var(--border-1)",
                            borderRadius: 999,
                            padding: "2px 9px",
                            lineHeight: 1.4,
                        }}
                    >
                        {collection.kicker}
                    </span>
                </div>

                <h2
                    style={{
                        fontSize: "var(--text-4xl)",
                        fontWeight: 600,
                        letterSpacing: "-0.02em",
                        lineHeight: 1.05,
                        color: "var(--fg-1)",
                        margin: "20px 0 0",
                    }}
                >
                    {collection.title}
                </h2>

                <p
                    style={{
                        margin: "16px 0 0",
                        fontSize: 15.5,
                        lineHeight: 1.6,
                        color: "var(--fg-2)",
                        maxWidth: 620,
                    }}
                >
                    {collection.blurb}
                </p>
            </div>

            <div
                style={{
                    textAlign: "right",
                    fontFamily: "var(--font-mono)",
                    fontSize: 12.5,
                    lineHeight: 1.7,
                    color: "var(--fg-3)",
                }}
            >
                <div style={{ color: "var(--fg-1)" }}>{collection.count} styles</div>
                <div>{collection.range}</div>
                <div>Fancy UI Kit</div>
            </div>
        </header>
    );
}

export function StyleGrid({ styles }: { styles: Style[] }) {
    return (
        <div
            style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(270px, 1fr))",
                gap: 18,
                marginTop: 36,
            }}
        >
            {styles.map((s) => (
                <StyleCard key={s.id} style={s} />
            ))}
        </div>
    );
}

export function GalleryFooter({ collections }: { collections: Collection[] }) {
    return (
        <div
            style={{
                marginTop: 56,
                paddingTop: 20,
                borderTop: "1px solid var(--border-1)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: 12,
                fontSize: 12.5,
            }}
        >
            <span style={{ color: "var(--fg-3)" }}>
                {collections.map((c) => `${c.name} — ${c.subject}`).join(" · ")} · for demonstration.
            </span>
            <span style={{ fontFamily: "var(--font-mono)", color: "var(--fg-4)" }}>
                Built with the Fancy UI Kit
            </span>
        </div>
    );
}
