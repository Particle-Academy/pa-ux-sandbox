import { StatList } from "@particle-academy/react-fancy";
import { Head } from "@inertiajs/react";
import { Layout } from "../Layout";
import { CollectionHeading, GalleryFooter, StyleGrid } from "./cards";
import type { Collection, Style } from "./types";

type CollectionWithStyles = Collection & { styles: Style[] };

/**
 * The Inspiration Gallery landing — every collection, each a fictional
 * business designed twenty ways from the same restyled Fancy UI primitives
 * (FIELDWORK the studio, Mom-n-Pops the food truck, more to come). Restrained,
 * Swiss-clean chrome; the bold range lives on the per-style pages.
 *
 * Built bespoke on the design tokens (var(--fg-1) / var(--surface) /
 * var(--border-1) / var(--accent) / var(--font-mono)); honors light + dark via
 * those tokens. SSR-safe — no module-level browser APIs.
 */
export default function InspirationIndex({ collections }: { collections: CollectionWithStyles[] }) {
    const total = collections.reduce((n, c) => n + c.count, 0);

    return (
        <Layout>
            <Head title="Inspiration Gallery · Fancy UI" />

            <div style={{ maxWidth: 1180, margin: "0 auto", paddingTop: 8 }}>
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
                        <h1
                            style={{
                                fontSize: "var(--text-6xl)",
                                fontWeight: 600,
                                letterSpacing: "-0.02em",
                                lineHeight: 1.05,
                                color: "var(--fg-1)",
                                margin: 0,
                            }}
                        >
                            Inspiration Gallery
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
                            Fictional businesses, each designed twenty ways — every page built from the
                            same Fancy UI primitives, restyled. A design kit is really a box of primitives
                            you can arrange for almost any use case. These are read-only blueprints to
                            reference and remix — not starter code to fork.
                        </p>
                    </div>

                    {/* react-fancy's StatList — built for exactly this stack
                        (story #170, task 224). The hand-rolled copy is gone. */}
                    <StatList
                        items={[
                            { value: total, label: "designs" },
                            { value: collections.length, label: "collections" },
                            { value: "Fancy", label: "UI Kit" },
                        ]}
                        style={{ fontSize: 12.5, lineHeight: 1.7 }}
                    />
                </header>

                {collections.map((collection) => (
                    <section
                        key={collection.id}
                        style={{ marginTop: 64, paddingTop: 40, borderTop: "1px solid var(--border-1)" }}
                    >
                        <CollectionHeading collection={collection} link />
                        <StyleGrid styles={collection.styles} />
                    </section>
                ))}

                <GalleryFooter collections={collections} />
            </div>
        </Layout>
    );
}
