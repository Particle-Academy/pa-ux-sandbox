import { Link } from "@inertiajs/react";
import { Seo } from "@particle-academy/fancy-inertia/seo";
import { Breadcrumbs, Icon } from "@particle-academy/react-fancy";
import { useState, type CSSProperties } from "react";
import { Layout } from "../Layout";
import { ContextCards } from "./ContextCards";
import { Prose } from "./Prose";

/** One package inside a family. */
type Member = {
    language: string;
    slug: string;
    name: string;
    tagline: string;
    ecosystem: "ts" | "php" | "py" | "polyglot";
    npm: string | null;
    composer: string | null;
    install: string | null;
    components_count: number;
    /** Set when this member keeps its own page (it ships components/demos). */
    href: string | null;
    stars: number | null;
    repoUrl: string | null;
    npmUrl: string | null;
    packagistUrl: string | null;
};

/** A labelled group of members — Engine, React UI, GitHub provider, … */
type Section = { label: string; capability: string | null; members: Member[] };

type Family = { slug: string; name: string; tagline: string; sections: Section[] };
type Context = { why: string; what: string; how: string };

const ECO_LABEL: Record<Member["ecosystem"], string> = { ts: "TS", php: "PHP", py: "Py", polyglot: "Poly" };

const ACCENT = "#8b5cf6";

function initials(name: string): string {
    const base = name.replace(/^@[^/]+\//, "").replace(/^particle-academy\//, "");
    const parts = base.split(/[-/ ]/).filter(Boolean);
    return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? parts[0]?.[1] ?? "")).toUpperCase();
}

export default function PackagesFamily({
    family,
    context,
    readmeHtml = null,
}: {
    family: Family;
    context: Context | null;
    readmeHtml?: string | null;
}) {
    const members = family.sections.flatMap((s) => s.members);
    const languages = [...new Set(members.map((m) => m.language))];

    return (
        <Layout>
            <Seo title={family.name} description={family.tagline} />

            <Breadcrumbs>
                <Breadcrumbs.Item href="/packages">Packages</Breadcrumbs.Item>
                <Breadcrumbs.Item>{family.name}</Breadcrumbs.Item>
            </Breadcrumbs>

            <div style={{ "--accent": ACCENT } as CSSProperties}>
                {/* ── Hero ─────────────────────────────────────────────── */}
                <header className="pkg-hero">
                    <span className="pkg-glyph pkg-hero__glyph">{initials(family.name)}</span>
                    <div className="pkg-hero__main">
                        <h1 className="pkg-hero__name">{family.name}</h1>
                        <p className="pkg-hero__tagline">{family.tagline}</p>
                        <div className="pkg-hero__meta">
                            <span className="pkg-eco" data-eco={languages.length > 1 ? "polyglot" : "ts"}>
                                {languages.length > 1 ? "Poly" : ECO_LABEL[members[0]?.ecosystem ?? "ts"]}
                            </span>
                            <span className="pkg-kind">
                                {members.length} package{members.length === 1 ? "" : "s"} · one product
                            </span>
                            {languages.map((l) => (
                                <span key={l} className="pkg-meta-chip">{l}</span>
                            ))}
                        </div>
                    </div>
                </header>

                <p className="mt-2 text-sm text-[var(--fg-3)]" style={{ maxWidth: "68ch" }}>
                    Everything in this family ships against one shared contract — install only the pieces your stack
                    needs. Language mirrors behave identically, so you pick your backend and get the same product.
                </p>

                {/* ── Sections ─────────────────────────────────────────── */}
                {family.sections.map((section) => (
                    <section
                        key={section.label}
                        style={{ marginTop: 24, paddingTop: 20, borderTop: "1px solid var(--border-1)" }}
                    >
                        <h2 style={{ fontSize: 15, fontWeight: 700, letterSpacing: "-0.01em" }}>{section.label}</h2>
                        {section.capability && (
                            <p style={{ fontSize: 12.5, color: "var(--fg-3)", margin: "2px 0 0" }}>{section.capability}</p>
                        )}
                        <div
                            className={section.members.length === 1 ? "grid gap-4" : "grid gap-4 sm:grid-cols-2"}
                            style={{ marginTop: 12 }}
                        >
                            {section.members.map((m) => (
                                <MemberCard key={m.slug} member={m} />
                            ))}
                        </div>
                    </section>
                ))}

                {/* ── Why / What / How ─────────────────────────────────── */}
                {context && (
                    <div className="mt-10">
                        <ContextCards why={context.why} what={context.what} how={context.how} />
                    </div>
                )}

                {/* ── Shared docs ──────────────────────────────────────── */}
                {readmeHtml && (
                    <div className="mt-10 fancy-card overflow-hidden">
                        <div className="flex items-center gap-2 border-b border-[var(--border-1)] px-4 py-2.5">
                            <span className="pkg-eco" data-eco="polyglot">readme</span>
                            <span className="font-mono text-xs font-semibold text-[var(--fg-2)]">
                                Shared model &amp; API — README.md
                            </span>
                        </div>
                        <div className="px-4 py-6">
                            <Prose html={readmeHtml} />
                        </div>
                    </div>
                )}
            </div>
        </Layout>
    );
}

/** One package in the family — install command + links. */
function MemberCard({ member: m }: { member: Member }) {
    const [copied, setCopied] = useState(false);
    const id = m.npm ?? m.composer ?? m.name;

    const copy = () => {
        if (!m.install) return;
        navigator.clipboard.writeText(m.install).then(() => {
            setCopied(true);
            window.setTimeout(() => setCopied(false), 1200);
        });
    };

    return (
        <div className="pkg-install fancy-card" style={{ display: "flex", flexDirection: "column" }}>
            <div className="flex items-center gap-2 border-b border-[var(--border-1)] px-4 py-2.5">
                <span className="pkg-eco" data-eco={m.ecosystem}>{ECO_LABEL[m.ecosystem]}</span>
                <span className="font-semibold text-[var(--fg-1)]">{m.language}</span>
                <span className="flex-1" />
                {m.components_count > 0 && (
                    <span className="text-xs text-[var(--fg-3)]">{m.components_count} components</span>
                )}
                {m.stars != null && m.stars > 0 && (
                    <span
                        title={`${m.stars.toLocaleString()} GitHub stars`}
                        style={{ display: "inline-flex", alignItems: "center", gap: 3, color: "#f59e0b", fontWeight: 600, fontVariantNumeric: "tabular-nums", fontSize: 12 }}
                    >
                        <Icon name="star" size="xs" />
                        {m.stars >= 1000 ? `${(m.stars / 1000).toFixed(1)}k` : m.stars}
                    </span>
                )}
            </div>

            <div className="px-4 pt-3 font-mono text-xs text-[var(--fg-3)]">{id}</div>

            {m.install && (
                <div className="pkg-install__cmd">
                    <span className="sigil">$</span>
                    <code>{m.install}</code>
                    <button type="button" className="pkg-copy" onClick={copy}>{copied ? "copied" : "copy"}</button>
                </div>
            )}

            {m.tagline && (
                <p className="px-4 pt-1 text-xs leading-relaxed text-[var(--fg-3)]">{m.tagline}</p>
            )}

            <div className="mt-auto flex flex-wrap items-center gap-x-4 gap-y-1 px-4 pb-3 pt-2 text-xs">
                {m.href && (
                    <Link href={m.href} className="font-medium" style={{ color: "color-mix(in oklch, var(--accent) 80%, var(--fg-1))" }}>
                        {m.components_count > 0 ? `${m.components_count} components →` : "Docs →"}
                    </Link>
                )}
                {m.repoUrl && <a className="pkg-link" href={m.repoUrl} target="_blank" rel="noreferrer">GitHub →</a>}
                {m.npmUrl && <a className="pkg-link" href={m.npmUrl} target="_blank" rel="noreferrer">npm →</a>}
                {m.packagistUrl && <a className="pkg-link" href={m.packagistUrl} target="_blank" rel="noreferrer">Packagist →</a>}
            </div>
        </div>
    );
}
