import { Head, Link } from "@inertiajs/react";
import { ArrowLeft } from "lucide-react";
import { Layout } from "../Layout";

/**
 * One Inspiration Gallery style — mirrors App\Support\GalleryRegistry's shape.
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
 * Per-style shell. Each of the 20 styles renders FIELDWORK in a distinct visual
 * language using the full Fancy UI kit — those are separate tasks. Until a
 * style's component is built, this renders a tasteful "in progress" placeholder.
 * SSR-safe — no module-level browser APIs.
 */
export default function InspirationShow({ style }: { style: Style }) {
    return (
        <Layout>
            <Head title={`${style.name} · Inspiration · Fancy UI`} />

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
        </Layout>
    );
}
