import { Head, Link } from "@inertiajs/react";
import { ArrowLeft } from "lucide-react";
import { Layout } from "../Layout";
import type { Style } from "./types";
import { STYLE_COMPONENTS } from "./styles";

/**
 * Per-style shell. Each of the 20 styles renders FIELDWORK in a distinct visual
 * language using the full Fancy UI kit. A style registers a component in
 * ./styles (keyed by `style.id`); if one exists for this id we mount it,
 * otherwise we show a tasteful "in progress" placeholder. SSR-safe — no
 * module-level browser APIs; each style component owns its own layout rhythm.
 */
export default function InspirationShow({ style }: { style: Style }) {
    const StyleComponent = STYLE_COMPONENTS[style.id];

    return (
        <Layout>
            <Head title={`${style.name} · Inspiration · Fancy UI`} />
            {StyleComponent ? <StyleComponent style={style} /> : <Placeholder style={style} />}
        </Layout>
    );
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
