import { Seo } from "@particle-academy/fancy-inertia/seo";
import { Breadcrumbs, Icon } from "@particle-academy/react-fancy";
import { useState, type CSSProperties } from "react";
import { Layout } from "../Layout";
import { ContextCards } from "./ContextCards";
import { Prose } from "./Prose";

/** One language mirror of a parity capability. */
type Member = {
    language: string;
    slug: string;
    name: string;
    tagline: string;
    ecosystem: "ts" | "php" | "polyglot";
    npm: string | null;
    composer: string | null;
    install: string | null;
    stars: number | null;
    repoUrl: string | null;
    npmUrl: string | null;
    packagistUrl: string | null;
};

type Group = { slug: string; name: string; tagline: string; members: Member[] };
type Context = { why: string; what: string; how: string };

const ECO_LABEL: Record<Member["ecosystem"], string> = { ts: "TS", php: "PHP", polyglot: "Poly" };

const ACCENT = "#8b5cf6";

function initials(name: string): string {
    const base = name.replace(/^@[^/]+\//, "").replace(/^particle-academy\//, "");
    const parts = base.split(/[-/ ]/).filter(Boolean);
    return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? parts[0]?.[1] ?? "")).toUpperCase();
}

export default function PackagesParity({
    group,
    context,
    readmeHtml = null,
}: {
    group: Group;
    context: Context | null;
    readmeHtml?: string | null;
}) {
    return (
        <Layout>
            <Seo title={`${group.name} — every language`} description={group.tagline} />

            <Breadcrumbs>
                <Breadcrumbs.Item href="/packages">Packages</Breadcrumbs.Item>
                <Breadcrumbs.Item>{group.name}</Breadcrumbs.Item>
            </Breadcrumbs>

            <div style={{ "--accent": ACCENT } as CSSProperties}>
                {/* ── Hero ─────────────────────────────────────────────── */}
                <header className="pkg-hero">
                    <span className="pkg-glyph pkg-hero__glyph">{initials(group.name)}</span>
                    <div className="pkg-hero__main">
                        <h1 className="pkg-hero__name">{group.name}</h1>
                        <p className="pkg-hero__tagline">{group.tagline}</p>
                        <div className="pkg-hero__meta">
                            <span className="pkg-eco" data-eco="polyglot">Poly</span>
                            <span className="pkg-kind">
                                One capability · {group.members.length} language{group.members.length === 1 ? "" : "s"}
                            </span>
                        </div>
                    </div>
                </header>

                {/* ── Why one page ─────────────────────────────────────── */}
                <p className="mt-2 text-sm text-[var(--fg-3)]" style={{ maxWidth: "64ch" }}>
                    The same headless capability, offered as a native package per language — an identical model and API, so
                    you pick your stack and get the same behavior. More languages are on the way.
                </p>

                {/* ── Per-language install cards ────────────────────────── */}
                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                    {group.members.map((m) => (
                        <LanguageCard key={m.slug} member={m} />
                    ))}
                </div>

                {/* ── Why / What / How ─────────────────────────────────── */}
                {context && (
                    <div className="mt-10">
                        <ContextCards why={context.why} what={context.what} how={context.how} />
                    </div>
                )}

                {/* ── Shared docs (canonical README) ────────────────────── */}
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

/** A single language's install + links — one card per mirror. */
function LanguageCard({ member: m }: { member: Member }) {
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
                {m.stars != null && (
                    <span
                        title={`${m.stars.toLocaleString()} GitHub stars`}
                        style={{ display: "inline-flex", alignItems: "center", gap: 3, color: "#f59e0b", fontWeight: 600, fontVariantNumeric: "tabular-nums", fontSize: 12 }}
                    >
                        <Icon name="star" size={12} />
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

            <div className="mt-auto flex flex-wrap items-center gap-x-4 gap-y-1 px-4 pb-3 pt-1 text-xs">
                {m.repoUrl && <a className="pkg-link" href={m.repoUrl} target="_blank" rel="noreferrer">GitHub →</a>}
                {m.npmUrl && <a className="pkg-link" href={m.npmUrl} target="_blank" rel="noreferrer">npm →</a>}
                {m.packagistUrl && <a className="pkg-link" href={m.packagistUrl} target="_blank" rel="noreferrer">Packagist →</a>}
            </div>
        </div>
    );
}
