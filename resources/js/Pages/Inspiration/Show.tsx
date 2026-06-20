import { Head, Link } from "@inertiajs/react";
import { useEffect, useState, type CSSProperties } from "react";
import { ArrowLeft, Check, ChevronLeft, ChevronRight, Copy, Info, X } from "lucide-react";
import { Layout } from "../Layout";
import type { Style } from "./types";
import { STYLE_COMPONENTS } from "./styles";

/**
 * Per-style shell. Each of the 20 styles renders FIELDWORK — a FICTIONAL studio —
 * in a distinct visual language using the full Fancy UI kit; they are the SAME
 * one-page site, redesigned, and are READ-ONLY design inspiration (not starter
 * code). The GalleryFrame (neutral site chrome, deliberately NOT the style's own
 * design) makes that obvious + lets you flip between styles. A style registers a
 * component in ./styles (keyed by `style.id`); a hit mounts it STATICALLY so it
 * server-renders (React.lazy would render the Suspense fallback under SSR), else
 * the "in progress" placeholder.
 */
export default function InspirationShow({ style, styles }: { style: Style; styles: Style[] }) {
    const StyleComponent = STYLE_COMPONENTS[style.id];
    const idx = styles.findIndex((s) => s.id === style.id);
    const prev = styles.length ? styles[(idx - 1 + styles.length) % styles.length] : undefined;
    const next = styles.length ? styles[(idx + 1) % styles.length] : undefined;

    return (
        <Layout>
            <Head title={`${style.name} · FIELDWORK (demo) · Inspiration · Fancy UI`} />
            <GalleryFrame style={style} total={styles.length} prev={prev} next={next} />
            {StyleComponent ? <StyleComponent style={style} /> : <Placeholder style={style} />}
        </Layout>
    );
}

/**
 * The gallery demo-frame — consistent chrome wrapping every style, styled in
 * neutral site tokens (NOT the style's design) so it reads as a demo wrapper:
 * the fictional-studio + same-site + read-only framing, "N / 20", and prev/next
 * to flip between styles. The "Grab this design" affordance lands here once the
 * blueprint registry ships.
 */
function GalleryFrame({ style, total, prev, next }: { style: Style; total: number; prev?: Style; next?: Style }) {
    const navBtn: CSSProperties = {
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: 28,
        height: 28,
        borderRadius: 8,
        border: "1px solid var(--border-1)",
        color: "var(--fg-2)",
        background: "var(--surface)",
        textDecoration: "none",
    };
    return (
        <div
            data-gallery-frame=""
            style={{
                position: "sticky",
                top: 0,
                zIndex: 30,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 12,
                flexWrap: "wrap",
                padding: "7px 16px",
                borderBottom: "1px solid var(--border-1)",
                background: "color-mix(in oklch, var(--surface) 88%, transparent)",
                backdropFilter: "blur(10px)",
                WebkitBackdropFilter: "blur(10px)",
                fontSize: 12.5,
            }}
        >
            <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                <Link
                    href="/inspiration"
                    style={{ display: "inline-flex", alignItems: "center", gap: 5, color: "var(--fg-2)", textDecoration: "none", fontWeight: 500, whiteSpace: "nowrap" }}
                >
                    <ArrowLeft size={14} /> Gallery
                </Link>
                <span style={{ width: 1, height: 14, background: "var(--border-1)" }} aria-hidden />
                <span style={{ fontFamily: "var(--font-mono)", color: "var(--fg-3)", whiteSpace: "nowrap" }}>
                    {style.num} / {String(total).padStart(2, "0")}
                </span>
                <span style={{ color: "var(--fg-1)", fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {style.name}
                </span>
            </div>

            <span
                title="FIELDWORK is a fictional studio. These are 20 designs of the SAME one-page site — read-only design inspiration (blueprints to reference and remix), not starter code to fork."
                style={{ display: "inline-flex", alignItems: "center", gap: 5, color: "var(--fg-3)", cursor: "help", minWidth: 0 }}
            >
                <Info size={13} style={{ flexShrink: 0 }} />
                <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    Fictional studio · the same site, 20 ways · read-only
                </span>
            </span>

            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <GrabButton style={style} />
                <span style={{ width: 1, height: 14, background: "var(--border-1)" }} aria-hidden />
                {prev && (
                    <Link href={`/inspiration/${prev.id}`} aria-label={`Previous style: ${prev.name}`} title={`← ${prev.name}`} style={navBtn}>
                        <ChevronLeft size={15} />
                    </Link>
                )}
                {next && (
                    <Link href={`/inspiration/${next.id}`} aria-label={`Next style: ${next.name}`} title={`${next.name} →`} style={navBtn}>
                        <ChevronRight size={15} />
                    </Link>
                )}
            </div>
        </div>
    );
}

/**
 * "Grab this design" — copies the style's read-only design BLUEPRINT (a recipe
 * an agent re-implements with the Fancy kit, NOT source to copy) as an
 * agent-ready prompt, and tracks a mix-and-match selection in localStorage so
 * several blueprints can be blended into one direction.
 */
function GrabButton({ style }: { style: Style }) {
    const [copied, setCopied] = useState<"one" | "mix" | null>(null);
    const [mix, setMix] = useState<string[]>([]);

    useEffect(() => {
        try {
            const raw = JSON.parse(window.localStorage.getItem("fancyGalleryMix") || "[]");
            if (Array.isArray(raw)) setMix(raw.filter((x) => typeof x === "string"));
        } catch {
            /* ignore unreadable storage */
        }
    }, []);

    const flash = (which: "one" | "mix") => {
        setCopied(which);
        window.setTimeout(() => setCopied((c) => (c === which ? null : c)), 1800);
    };

    async function grab() {
        try {
            const bp = await fetch(`/gallery/${style.id}.json`).then((r) => r.json());
            await navigator.clipboard.writeText(blueprintToPrompt(bp));
            const next = Array.from(new Set([...mix, style.id]));
            window.localStorage.setItem("fancyGalleryMix", JSON.stringify(next));
            setMix(next);
            flash("one");
        } catch {
            /* clipboard / fetch unavailable */
        }
    }

    async function copyMix() {
        try {
            const bps = await Promise.all(mix.map((id) => fetch(`/gallery/${id}.json`).then((r) => r.json())));
            const header =
                `# Blended design direction — ${bps.length} Fancy UI gallery blueprints\n\n` +
                "Blend these read-only design recipes into one direction for the project — mix and match their tokens, layouts, and restyled-component choices. Re-implement with the Fancy UI kit; do not copy source.\n\n";
            await navigator.clipboard.writeText(header + bps.map(blueprintToPrompt).join("\n\n---\n\n"));
            flash("mix");
        } catch {
            /* ignore */
        }
    }

    function clearMix() {
        window.localStorage.removeItem("fancyGalleryMix");
        setMix([]);
    }

    const btn: CSSProperties = {
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        height: 28,
        padding: "0 11px",
        borderRadius: 999,
        border: "1px solid var(--border-1)",
        background: "var(--surface)",
        color: "var(--fg-1)",
        fontWeight: 600,
        fontSize: 12,
        cursor: "pointer",
        whiteSpace: "nowrap",
    };

    return (
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            {mix.length > 1 && (
                <button
                    type="button"
                    onClick={copyMix}
                    title={`Copy ${mix.length} grabbed blueprints to blend into one direction`}
                    style={{ ...btn, fontFamily: "var(--font-mono)", fontWeight: 500, paddingRight: 8 }}
                >
                    {copied === "mix" ? <Check size={13} /> : null}
                    Mix · {mix.length}
                    <span
                        role="button"
                        aria-label="Clear mix"
                        title="Clear grabbed mix"
                        onClick={(e) => {
                            e.stopPropagation();
                            clearMix();
                        }}
                        style={{ display: "inline-flex", marginLeft: 2, opacity: 0.6 }}
                    >
                        <X size={12} />
                    </span>
                </button>
            )}
            <button
                type="button"
                onClick={grab}
                title="Copy this design's blueprint — a read-only recipe to re-implement with the Fancy kit (composable; grab several to mix-and-match)"
                style={btn}
            >
                {copied === "one" ? <Check size={13} /> : <Copy size={13} />}
                {copied === "one" ? "Copied" : "Grab this design"}
            </button>
        </div>
    );
}

/** Format a grab-blueprint as an agent-ready, re-implementable design prompt. */
function blueprintToPrompt(bp: Record<string, unknown>): string {
    const out: string[] = [];
    const get = (k: string) => bp[k] as string | undefined;
    out.push(`# Design blueprint — ${get("name")} (Fancy UI Inspiration Gallery)`, "");
    if (get("thesis")) out.push(get("thesis")!, "");
    out.push(
        "READ-ONLY design inspiration. Re-implement this recipe in your project with the Fancy UI kit — restyle the primitives, bring your own content. It is NOT source to copy, and it composes with other gallery blueprints.",
        "",
    );
    const tokens = bp.tokens as Record<string, string> | undefined;
    if (tokens) {
        out.push("## Design tokens");
        for (const [k, v] of Object.entries(tokens)) out.push(`- ${k}: ${v}`);
        out.push("");
    }
    if (get("layout")) out.push("## Layout", get("layout")!, "");
    const sections = bp.sections as Array<Record<string, unknown>> | undefined;
    if (Array.isArray(sections) && sections.length) {
        out.push("## Sections");
        for (const s of sections) {
            const comps = Array.isArray(s.components) && s.components.length ? ` · components: ${(s.components as string[]).join(", ")}` : "";
            const restyle = s.restyle ? ` · restyle: ${s.restyle}` : "";
            out.push(`- **${s.name}** — ${s.what}${comps}${restyle}`);
        }
        out.push("");
    }
    const palette = bp.palette as Array<Record<string, string>> | undefined;
    if (Array.isArray(palette) && palette.length) {
        out.push("## Component palette (how each Fancy primitive is restyled)");
        for (const p of palette) out.push(`- ${p.component}: ${p.restyle}`);
        out.push("");
    }
    if (get("contentArchetype")) out.push("## Content archetype", get("contentArchetype")!, "");
    if (get("remix")) out.push("## Remix", get("remix")!, "");
    out.push(`Live reference: https://ui.particle.academy${get("url") || `/inspiration/${get("id")}`}`);
    return out.join("\n");
}

function Placeholder({ style }: { style: Style }) {
    return (
        <div
            style={{
                maxWidth: 640,
                margin: "0 auto",
                minHeight: "48vh",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                textAlign: "center",
                padding: "48px 0",
            }}
        >
            <span
                style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: 12,
                    color: "var(--fg-3)",
                    letterSpacing: "0.04em",
                }}
            >
                FIELDWORK · style {style.num}
            </span>

            <h1
                style={{
                    fontSize: "var(--text-4xl)",
                    fontWeight: 600,
                    letterSpacing: "-0.02em",
                    color: "var(--fg-1)",
                    margin: "14px 0 0",
                }}
            >
                {style.name}
            </h1>

            <p style={{ margin: "12px 0 0", fontSize: 16, lineHeight: 1.6, color: "var(--fg-2)" }}>
                {style.note}
            </p>

            <div
                style={{
                    marginTop: 28,
                    padding: "10px 16px",
                    borderRadius: 999,
                    border: "1px solid var(--border-1)",
                    background: "var(--surface)",
                    fontSize: 13,
                    color: "var(--fg-3)",
                }}
            >
                This style is in progress.
            </div>

            <Link
                href="/inspiration"
                style={{
                    marginTop: 26,
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    fontSize: 14,
                    fontWeight: 500,
                    color: "var(--accent)",
                    textDecoration: "none",
                }}
            >
                <ArrowLeft size={15} />
                Back to the gallery
            </Link>
        </div>
    );
}
