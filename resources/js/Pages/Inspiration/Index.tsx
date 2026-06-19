import { Head, Link } from "@inertiajs/react";
import type { CSSProperties } from "react";
import { Layout } from "../Layout";

/**
 * One Inspiration Gallery style — emitted by InspirationController::index().
 * Mirrors App\Support\GalleryRegistry's entry shape.
 */
type Style = {
    id: string;
    num: string;
    name: string;
    note: string;
    mode: "light" | "dark";
    swatch: string;
};

/**
 * The FIELDWORK catalog — one fictional creative-studio portfolio designed
 * twenty ways, common → experimental. Restrained, Swiss-clean chrome (the index
 * is Style 01-adjacent); the bold range lives on the per-style pages.
 *
 * Built bespoke on the design tokens (var(--fg-1) / var(--surface) /
 * var(--border-1) / var(--accent) / var(--font-mono)); honors light + dark via
 * those tokens. SSR-safe — no module-level browser APIs.
 */
export default function InspirationIndex({ styles }: { styles: Style[] }) {
    return (
        <Layout>
            <Head title="Inspiration Gallery · Fancy UI" />

            <div style={{ maxWidth: 1180, margin: "0 auto", paddingTop: 8 }}>
                <Header count={styles.length} />

                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fill, minmax(270px, 1fr))",
                        gap: 18,
                        marginTop: 44,
                    }}
                >
                    {styles.map((s) => (
                        <StyleCard key={s.id} style={s} />
                    ))}
                </div>

                <Footer />
            </div>
        </Layout>
    );
}

function Header({ count }: { count: number }) {
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
                        F
                    </span>
                    <span style={{ fontWeight: 600, fontSize: 15, color: "var(--fg-1)", letterSpacing: "-0.01em" }}>
                        FIELDWORK
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
                        style index
                    </span>
                </div>

                <h1
                    style={{
                        fontSize: "var(--text-6xl)",
                        fontWeight: 600,
                        letterSpacing: "-0.02em",
                        lineHeight: 1.05,
                        color: "var(--fg-1)",
                        margin: "22px 0 0",
                    }}
                >
                    One portfolio, twenty ways to build it.
                </h1>

                <p
                    style={{
                        margin: "18px 0 0",
                        fontSize: 16,
                        lineHeight: 1.6,
                        color: "var(--fg-2)",
                        maxWidth: 600,
                    }}
                >
                    The same creative-studio site, designed twenty times — from quiet Swiss grids to
                    agent-native surfaces. Each is a self-contained starting point built on the Fancy UI
                    Kit. Pick one and fork it.
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
                <div style={{ color: "var(--fg-1)" }}>{count} styles</div>
                <div>common → experimental</div>
                <div>Fancy UI Kit</div>
            </div>
        </header>
    );
}

/**
 * Very-light swatches need a faint inset ring so the thumbnail edge reads
 * against the card surface. Anything whiter than ~#f0 (or pure paper tones)
 * gets the ring; gradients + dark swatches don't.
 */
function isVeryLight(swatch: string): boolean {
    const m = /^#([0-9a-f]{6})$/i.exec(swatch.trim());
    if (!m) return false; // gradients etc. — skip
    const n = parseInt(m[1], 16);
    const r = (n >> 16) & 0xff;
    const g = (n >> 8) & 0xff;
    const b = n & 0xff;
    // Perceived luminance; near-white reads as "very light".
    return 0.2126 * r + 0.7152 * g + 0.0722 * b > 235;
}

function StyleCard({ style }: { style: Style }) {
    const thumbStyle: CSSProperties = {
        position: "relative",
        height: 122,
        background: style.swatch,
        // Faint inset ring keeps very-light thumbnails from bleeding into the card.
        boxShadow: isVeryLight(style.swatch) ? "inset 0 0 0 1px var(--border-1)" : undefined,
    };

    return (
        <Link
            href={`/inspiration/${style.id}`}
            className="insp-card"
            style={{ "--accent": "var(--accent)" } as CSSProperties}
            aria-label={`${style.name} — FIELDWORK designed style ${style.num}`}
        >
            {/* TODO: real thumbnail — placeholder swatch until per-style
                screenshots land (a later task). */}
            <div style={thumbStyle}>
                <span
                    style={{
                        position: "absolute",
                        top: 9,
                        left: 11,
                        fontFamily: "var(--font-mono)",
                        fontSize: 11,
                        fontWeight: 500,
                        color: style.mode === "dark" ? "rgba(255,255,255,.72)" : "rgba(0,0,0,.55)",
                    }}
                >
                    {style.num}
                </span>
                <span
                    style={{
                        position: "absolute",
                        top: 8,
                        right: 9,
                        fontFamily: "var(--font-mono)",
                        fontSize: 10.5,
                        fontWeight: 500,
                        padding: "2px 8px",
                        borderRadius: 999,
                        background:
                            style.mode === "dark" ? "rgba(255,255,255,.12)" : "rgba(0,0,0,.06)",
                        color: style.mode === "dark" ? "rgba(255,255,255,.85)" : "rgba(0,0,0,.6)",
                    }}
                >
                    {style.mode}
                </span>
            </div>

            <div style={{ padding: "13px 15px 16px" }}>
                <div style={{ fontSize: 14.5, fontWeight: 600, color: "var(--fg-1)", letterSpacing: "-0.01em" }}>
                    {style.name}
                </div>
                <div style={{ marginTop: 4, fontSize: 13, lineHeight: 1.5, color: "var(--fg-3)" }}>
                    {style.note}
                </div>
            </div>
        </Link>
    );
}

function Footer() {
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
                FIELDWORK — a fictional studio, for demonstration.
            </span>
            <span style={{ fontFamily: "var(--font-mono)", color: "var(--fg-4)" }}>
                Built with the Fancy UI Kit
            </span>
        </div>
    );
}
