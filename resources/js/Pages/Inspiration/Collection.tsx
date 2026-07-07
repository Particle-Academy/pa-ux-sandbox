import { Head, Link } from "@inertiajs/react";
import { ArrowLeft } from "lucide-react";
import { Layout } from "../Layout";
import { CollectionHeading, GalleryFooter, StyleGrid } from "./cards";
import type { Collection, Style } from "./types";

/**
 * One collection's catalog — its heading + the full grid of its styles, with
 * quiet nav back to the gallery landing and across to sibling collections.
 */
export default function InspirationCollection({
    collection,
    styles,
    collections,
}: {
    collection: Collection;
    styles: Style[];
    collections: Collection[];
}) {
    const siblings = collections.filter((c) => c.id !== collection.id);

    return (
        <Layout>
            <Head title={`${collection.name} · Inspiration Gallery · Fancy UI`} />

            <div style={{ maxWidth: 1180, margin: "0 auto", paddingTop: 8 }}>
                <nav
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 14,
                        flexWrap: "wrap",
                        marginBottom: 30,
                        fontSize: 13,
                    }}
                >
                    <Link
                        href="/inspiration"
                        style={{ display: "inline-flex", alignItems: "center", gap: 5, color: "var(--fg-2)", textDecoration: "none", fontWeight: 500 }}
                    >
                        <ArrowLeft size={14} /> All collections
                    </Link>
                    {siblings.map((c) => (
                        <Link
                            key={c.id}
                            href={`/inspiration/${c.id}`}
                            style={{
                                fontFamily: "var(--font-mono)",
                                fontSize: 11.5,
                                color: "var(--fg-3)",
                                border: "1px solid var(--border-1)",
                                borderRadius: 999,
                                padding: "3px 11px",
                                textDecoration: "none",
                            }}
                        >
                            {c.name} →
                        </Link>
                    ))}
                </nav>

                <CollectionHeading collection={collection} />
                <StyleGrid styles={styles} />
                <GalleryFooter collections={collections} />
            </div>
        </Layout>
    );
}
