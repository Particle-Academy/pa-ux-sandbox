import { Head, Link } from "@inertiajs/react";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { ArrowLeft, Check, ChevronLeft, ChevronRight, Copy, Info, Layers, Plus, X } from "lucide-react";
import { Layout } from "../Layout";
import type { Collection, Style } from "./types";
import { STYLE_COMPONENTS } from "./styles";

/**
 * Per-style shell. Each style renders its collection's FICTIONAL business
 * (FIELDWORK the studio, Mom-n-Pops the food truck) in a distinct visual
 * language using the full Fancy UI kit; within a collection they are the SAME
 * site, redesigned, and are READ-ONLY design inspiration (not starter code).
 * The GalleryFrame (neutral site chrome, deliberately NOT the style's own
 * design) makes that obvious + lets you flip between styles. A style registers
 * a component in ./styles under its collection (keyed by `style.id`); a hit
 * mounts it STATICALLY so it server-renders (React.lazy would render the
 * Suspense fallback under SSR), else the "in progress" placeholder.
 */
export default function InspirationShow({
    collection,
    style,
    styles,
}: {
    collection: Collection;
    style: Style;
    styles: Style[];
}) {
    const StyleComponent = STYLE_COMPONENTS[collection.id]?.[style.id];
    const idx = styles.findIndex((s) => s.id === style.id);
    const prev = styles.length ? styles[(idx - 1 + styles.length) % styles.length] : undefined;
    const next = styles.length ? styles[(idx + 1) % styles.length] : undefined;

    return (
        <Layout>
            <Head title={`${style.name} · ${collection.name} (demo) · Inspiration · Fancy UI`} />
            <GalleryFrame collection={collection} style={style} total={styles.length} prev={prev} next={next} />
            {StyleComponent ? <StyleComponent style={style} /> : <Placeholder collection={collection} style={style} />}
        </Layout>
    );
}

/**
 * The gallery demo-frame — consistent chrome wrapping every style, styled in
 * neutral site tokens (NOT the style's design) so it reads as a demo wrapper:
 * the fictional-business + same-site + read-only framing, "N / 20", and
 * prev/next to flip between styles.
 */
function GalleryFrame({
    collection,
    style,
    total,
    prev,
    next,
}: {
    collection: Collection;
    style: Style;
    total: number;
    prev?: Style;
    next?: Style;
}) {
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
                    href={`/inspiration/${collection.id}`}
                    style={{ display: "inline-flex", alignItems: "center", gap: 5, color: "var(--fg-2)", textDecoration: "none", fontWeight: 500, whiteSpace: "nowrap" }}
                >
                    <ArrowLeft size={14} /> {collection.name}
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
                title={`${collection.name} is ${collection.subject}. These are ${collection.count} designs of the SAME site — read-only design inspiration (blueprints to reference and remix), not starter code to fork.`}
                style={{ display: "inline-flex", alignItems: "center", gap: 5, color: "var(--fg-3)", cursor: "help", minWidth: 0 }}
            >
                <Info size={13} style={{ flexShrink: 0 }} />
                <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {collection.framing}
                </span>
            </span>

            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <GrabButton collection={collection} style={style} />
                <span style={{ width: 1, height: 14, background: "var(--border-1)" }} aria-hidden />
                {prev && (
                    <Link href={`/inspiration/${collection.id}/${prev.id}`} aria-label={`Previous style: ${prev.name}`} title={`← ${prev.name}`} style={navBtn}>
                        <ChevronLeft size={15} />
                    </Link>
                )}
                {next && (
                    <Link href={`/inspiration/${collection.id}/${next.id}`} aria-label={`Next style: ${next.name}`} title={`${next.name} →`} style={navBtn}>
                        <ChevronRight size={15} />
                    </Link>
                )}
            </div>
        </div>
    );
}

/**
 * The gallery grab toolbar. Two deliberate steps, no blind clipboard writes:
 *
 * - **Mix this** toggles the current style in/out of a mix-and-match selection
 *   (persisted in localStorage under "fancyGalleryMix"; keys are
 *   "{collection}/{id}", and bare legacy ids still resolve via /gallery/{id}.json).
 * - **Grab this design / Grab this mix** opens a popover with the assembled,
 *   copy-ready prompt — the style's own blueprint when not mixing, or the blend
 *   of every mixed blueprint when the mix is non-empty. The user reads it, then
 *   clicks Copy. Blueprints are read-only recipes an agent re-implements with
 *   the Fancy kit, NOT source to copy.
 */
function GrabButton({ collection, style }: { collection: Collection; style: Style }) {
    const selfKey = `${collection.id}/${style.id}`;
    const [mix, setMix] = useState<string[]>([]);
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [prompt, setPrompt] = useState("");
    const [copied, setCopied] = useState(false);
    const rootRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        try {
            const raw = JSON.parse(window.localStorage.getItem("fancyGalleryMix") || "[]");
            if (Array.isArray(raw)) setMix(raw.filter((x) => typeof x === "string"));
        } catch {
            /* ignore unreadable storage */
        }
    }, []);

    // Close the popover on outside-click / Escape while it is open.
    useEffect(() => {
        if (!open) return;
        const onDown = (e: MouseEvent) => {
            if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
        };
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") setOpen(false);
        };
        document.addEventListener("mousedown", onDown);
        document.addEventListener("keydown", onKey);
        return () => {
            document.removeEventListener("mousedown", onDown);
            document.removeEventListener("keydown", onKey);
        };
    }, [open]);

    const inMix = mix.includes(selfKey);
    const mixing = mix.length > 0;

    function persist(next: string[]) {
        setMix(next);
        try {
            if (next.length) window.localStorage.setItem("fancyGalleryMix", JSON.stringify(next));
            else window.localStorage.removeItem("fancyGalleryMix");
        } catch {
            /* ignore unwritable storage */
        }
        // Any change to the mix could make an open popover stale — reopen fresh.
        setOpen(false);
    }

    const toggleMix = () => persist(inMix ? mix.filter((k) => k !== selfKey) : Array.from(new Set([...mix, selfKey])));
    const clearMix = () => persist([]);

    // What the grab popover assembles: the whole mix, or just this design.
    const grabKeys = mixing ? mix : [selfKey];

    async function openGrab() {
        setOpen(true);
        setCopied(false);
        setLoading(true);
        setPrompt("");
        try {
            const bps = await Promise.all(grabKeys.map((key) => fetch(`/gallery/${key}.json`).then((r) => r.json())));
            setPrompt(assemblePrompt(bps));
        } catch {
            setPrompt("Couldn't load the blueprint — check your connection and try again.");
        } finally {
            setLoading(false);
        }
    }

    async function copyPrompt() {
        try {
            await navigator.clipboard.writeText(prompt);
            setCopied(true);
            window.setTimeout(() => setCopied(false), 1800);
        } catch {
            /* clipboard unavailable */
        }
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
    const inMixBtn: CSSProperties = {
        ...btn,
        background: "color-mix(in oklch, var(--accent) 12%, var(--surface))",
        borderColor: "color-mix(in oklch, var(--accent) 34%, var(--border-1))",
    };
    const primaryBtn: CSSProperties = { ...btn, background: "var(--fg-1)", color: "var(--surface)", borderColor: "transparent" };

    return (
        <div ref={rootRef} style={{ position: "relative", display: "flex", alignItems: "center", gap: 6 }}>
            {mixing && (
                <span
                    title={`${mix.length} design${mix.length === 1 ? "" : "s"} in your mix`}
                    style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 5,
                        height: 28,
                        padding: "0 4px 0 10px",
                        borderRadius: 999,
                        border: "1px solid var(--border-1)",
                        background: "var(--surface)",
                        color: "var(--fg-2)",
                        fontFamily: "var(--font-mono)",
                        fontSize: 12,
                        whiteSpace: "nowrap",
                    }}
                >
                    <Layers size={12} style={{ opacity: 0.7 }} />
                    Mix · {mix.length}
                    <button
                        type="button"
                        onClick={clearMix}
                        aria-label="Clear mix"
                        title="Clear your mix"
                        style={{
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            width: 20,
                            height: 20,
                            borderRadius: 999,
                            border: "none",
                            background: "transparent",
                            color: "var(--fg-3)",
                            cursor: "pointer",
                        }}
                    >
                        <X size={12} />
                    </button>
                </span>
            )}

            <button
                type="button"
                onClick={toggleMix}
                aria-pressed={inMix}
                title={inMix ? "Remove this design from your mix" : "Add this design to your mix — blend several into one prompt"}
                style={inMix ? inMixBtn : btn}
            >
                {inMix ? <Check size={13} /> : <Plus size={13} />}
                {inMix ? "In mix" : "Mix this"}
            </button>

            <button
                type="button"
                onClick={() => (open ? setOpen(false) : openGrab())}
                aria-expanded={open}
                title={mixing ? "Show the copy-ready prompt for your mix" : "Show the copy-ready prompt for this design"}
                style={btn}
            >
                <Copy size={13} />
                {mixing ? "Grab this mix" : "Grab this design"}
            </button>

            {open && (
                <div
                    role="dialog"
                    aria-label={mixing ? "Blended design prompt" : "Design prompt"}
                    style={{
                        position: "absolute",
                        top: "calc(100% + 8px)",
                        right: 0,
                        zIndex: 50,
                        width: "min(480px, 92vw)",
                        borderRadius: 12,
                        border: "1px solid var(--border-1)",
                        background: "var(--surface)",
                        boxShadow: "0 16px 40px -12px rgba(0,0,0,0.4)",
                        overflow: "hidden",
                        textAlign: "left",
                    }}
                >
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            gap: 8,
                            padding: "10px 12px",
                            borderBottom: "1px solid var(--border-1)",
                        }}
                    >
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontWeight: 600, fontSize: 12.5, color: "var(--fg-1)" }}>
                            {mixing ? <Layers size={13} /> : <Copy size={13} />}
                            {mixing ? `Blended prompt · ${mix.length} blueprints` : "Design prompt"}
                        </span>
                        <button
                            type="button"
                            onClick={() => setOpen(false)}
                            aria-label="Close"
                            style={{
                                display: "inline-flex",
                                alignItems: "center",
                                justifyContent: "center",
                                width: 24,
                                height: 24,
                                borderRadius: 6,
                                border: "none",
                                background: "transparent",
                                color: "var(--fg-3)",
                                cursor: "pointer",
                            }}
                        >
                            <X size={14} />
                        </button>
                    </div>

                    <div style={{ padding: 12 }}>
                        <p style={{ margin: "0 0 8px", fontSize: 12, lineHeight: 1.5, color: "var(--fg-3)" }}>
                            Paste into your agent — it pulls the full design + components from the fancy-ui MCP and builds it with the Fancy UI kit.
                        </p>
                        <pre
                            style={{
                                margin: 0,
                                maxHeight: 260,
                                overflow: "auto",
                                padding: "10px 12px",
                                borderRadius: 8,
                                border: "1px solid var(--border-1)",
                                background: "color-mix(in oklch, var(--fg-1) 4%, var(--surface))",
                                fontFamily: "var(--font-mono)",
                                fontSize: 11.5,
                                lineHeight: 1.55,
                                color: "var(--fg-2)",
                                whiteSpace: "pre-wrap",
                                wordBreak: "break-word",
                            }}
                        >
                            {loading ? "Loading…" : prompt}
                        </pre>
                        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 10 }}>
                            <button type="button" onClick={copyPrompt} disabled={loading || !prompt} style={{ ...primaryBtn, opacity: loading || !prompt ? 0.5 : 1 }}>
                                {copied ? <Check size={13} /> : <Copy size={13} />}
                                {copied ? "Copied" : "Copy prompt"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

/**
 * Turn one or more grabbed blueprints into an agent-ready BUILD prompt. The
 * prompt deliberately does NOT dump the recipe — it directs the agent to the
 * fancy-ui MCP server to fetch each design's full blueprint
 * (`gallery_get_blueprint`) plus the Fancy primitives it needs
 * (`search_components` / `get_component` / `install_instructions`), then rebuild
 * the look with the Fancy UI kit. That keeps the copied text short and always
 * pulls the live, authoritative recipe rather than a stale inline snapshot.
 */
function assemblePrompt(bps: Array<Record<string, unknown>>): string {
    if (!bps.length) return "";
    return bps.length === 1 ? designBuildPrompt(bps[0]) : mixBuildPrompt(bps);
}

const bpField = (bp: Record<string, unknown>, k: string) => (typeof bp[k] === "string" ? (bp[k] as string) : "");
const bpLiveUrl = (bp: Record<string, unknown>) =>
    `https://ui.particle.academy${bpField(bp, "url") || `/inspiration/${bpField(bp, "collection")}/${bpField(bp, "id")}`}`;

/** Single design: direct the agent to fetch the blueprint + components from the MCP, then build. */
function designBuildPrompt(bp: Record<string, unknown>): string {
    const name = bpField(bp, "name");
    const id = bpField(bp, "id");
    const out: string[] = [`# Build this design with Fancy UI — ${name}`, ""];
    if (bpField(bp, "thesis")) out.push(bpField(bp, "thesis"), "");
    out.push(
        `Recreate the "${name}" design from the Fancy UI Inspiration Gallery in this project, built with the Fancy UI kit. Pull the real recipe and components from the **fancy-ui MCP server** — don't guess or hand-roll HTML:`,
        "",
        `1. Get the full blueprint — design tokens, layout, per-section components, how each primitive is restyled, remix notes: call \`gallery_get_blueprint\` with style \`"${id}"\`.`,
        "2. For every Fancy primitive the blueprint names, pull it from the same MCP: `search_components` / `list_components` to find it, `get_component` for source, `install_instructions` for the exact install command + import line.",
        "3. Build it here with those components — restyle them to the blueprint's tokens and component palette, and bring your own content. The blueprint is a READ-ONLY recipe to re-implement, NOT source to copy.",
        "",
        `If the fancy-ui MCP isn't connected (or doesn't have this style), fall back to the live reference: ${bpLiveUrl(bp)}`,
    );
    return out.join("\n");
}

/** Several designs: direct the agent to fetch each blueprint from the MCP and fuse them into one direction. */
function mixBuildPrompt(bps: Array<Record<string, unknown>>): string {
    const out: string[] = [`# Blended design direction — build with Fancy UI (${bps.length} gallery blueprints)`, ""];
    out.push(
        `Blend these ${bps.length} Fancy UI Inspiration Gallery designs into ONE coherent direction for this project, built with the Fancy UI kit. Pull each recipe and the components from the **fancy-ui MCP server** — don't guess:`,
        "",
        "1. Fetch each blueprint with `gallery_get_blueprint` and blend their design tokens, layouts, and restyled-component choices into one direction:",
    );
    for (const bp of bps) out.push(`   - **${bpField(bp, "name")}** — style \`"${bpField(bp, "id")}"\`  (${bpLiveUrl(bp)})`);
    out.push(
        "2. For the Fancy primitives the blueprints name, pull them from the same MCP: `search_components` / `list_components` -> `get_component` -> `install_instructions`.",
        "3. Rebuild here with those components, restyled to the blended tokens and palette. These are READ-ONLY recipes to re-implement, not source to copy.",
        "",
        "If a style isn't in the fancy-ui MCP, use its live reference above.",
    );
    return out.join("\n");
}

function Placeholder({ collection, style }: { collection: Collection; style: Style }) {
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
                {collection.name} · style {style.num}
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
                href={`/inspiration/${collection.id}`}
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
