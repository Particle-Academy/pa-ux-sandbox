import { Link } from "@inertiajs/react";
import { Seo } from "@particle-academy/fancy-inertia/seo";
import { Breadcrumbs, Button, Card, Eyebrow, Heading, Icon, Text } from "@particle-academy/react-fancy";
import { useState, type CSSProperties } from "react";
import { Layout } from "../Layout";
import { BASKETS, BasketTag, ECO_LABEL, Snippet, deScope, initials, type Basket, type Eco } from "./basket";
import { ContextCards } from "./ContextCards";
import { PkgPreview } from "./PkgPreview";
import { Prose } from "./Prose";

/**
 * A family page — several packages, one product.
 *
 * It leads with the BASKET SPLIT rather than a flat list: which of these
 * packages you can look at, and which render nothing. For `fancy-git` that is
 * one React surface against eight headless engines and adapters, and a flat
 * list of nine mono package names says none of it.
 *
 * Composed from react-fancy (Card / Button / Heading / Text / Eyebrow /
 * Breadcrumbs / Badge via BasketTag), restyled through showcase/packages.css.
 */

/** One package inside a family. */
type Member = {
    language: string;
    slug: string;
    name: string;
    tagline: string;
    basket: "ui" | "backend";
    accent: string;
    ecosystem: Eco;
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

type Family = {
    slug: string;
    name: string;
    tagline: string;
    sections: Section[];
    accent: string;
    languages: string[];
    basket: Basket;
    ui_count: number;
    backend_count: number;
    previews: number;
};
type Context = { why: string; what: string; how: string };

const CONTRACT =
    "Everything in this family ships against one shared contract — install only the pieces your stack needs. " +
    "Language mirrors behave identically, so you pick your backend and get the same product.";

/** Scroll to the per-role listing the hero's second button promises. */
function jumpRoles() {
    document.getElementById("fam-roles")?.scrollIntoView({ behavior: "smooth", block: "start" });
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
    // The flagship is what the hero's primary button opens: the surface with
    // the most to look at, falling back to anything with a page of its own.
    const flagship =
        members.find((m) => m.basket === "ui" && m.components_count > 0 && m.href)
        ?? members.find((m) => m.href)
        ?? members[0];

    return (
        <Layout>
            <Seo title={family.name} description={family.tagline} />

            <Breadcrumbs>
                <Breadcrumbs.Item as={Link} href="/packages">Packages</Breadcrumbs.Item>
                <Breadcrumbs.Item>{family.name}</Breadcrumbs.Item>
            </Breadcrumbs>

            <div style={{ "--accent": family.accent, "--acc": family.accent } as CSSProperties}>
                <div className="fam-hero">
                    <div>
                        <Eyebrow
                            className="fam-eyebrow"
                            label={`Family · ${members.length} packages, one product`}
                        />
                        <header className="pkg-hero">
                            <span className="pkg-glyph pkg-hero__glyph">{initials(family.name)}</span>
                            <div className="pkg-hero__main">
                                <Heading as="h1" className="pkg-hero__name">{family.name}</Heading>
                                <div className="pkg-hero__id">
                                    {family.languages.join(" + ")} · {members.length} packages
                                </div>
                            </div>
                        </header>

                        <Text size="lg" className="pkg-hero__tagline">{family.tagline}</Text>

                        <div className="pkg-hero__meta">
                            <BasketTag basket={family.basket} languages={family.languages} />
                        </div>

                        <div className="start-card__cta">
                            {family.ui_count > 0 && flagship?.href ? (
                                <>
                                    <Button as={Link} href={flagship.href} color="violet" icon="layout-grid" iconTrailing="arrow-right">
                                        {flagship.components_count > 0
                                            ? `Browse ${flagship.components_count} previews`
                                            : "Open the surface"}
                                    </Button>
                                    <Button variant="ghost" icon="list" onClick={jumpRoles}>
                                        All {members.length} packages
                                    </Button>
                                </>
                            ) : (
                                <Button color="teal" icon="terminal" iconTrailing="arrow-down" onClick={jumpRoles}>
                                    Install · all {members.length} packages
                                </Button>
                            )}
                        </div>
                    </div>

                    <div className="fam-hero__side">
                        <BasketMap family={family} members={members} />
                        <div className="fam-contract">
                            <Icon name="link-2" size="sm" />
                            <span>{CONTRACT}</span>
                        </div>
                    </div>
                </div>

                {/* ── One section per role ─────────────────────────────────── */}
                <div id="fam-roles">
                    {family.sections.map((section) => (
                        <section key={section.label} className="pkg-section-head">
                            <Heading as="h2" size="lg">
                                <Icon name={section.members[0]?.basket === "ui" ? "monitor-play" : "server"} size="md" />
                                {section.label}
                            </Heading>
                            <p>
                                {section.members.length} package{section.members.length === 1 ? "" : "s"} ·{" "}
                                {section.members[0]?.basket === "ui"
                                    ? "component previews inside"
                                    : "headless — install and call it"}
                                {section.capability ? ` · ${section.capability}` : ""}
                            </p>
                            <div className="mem-list">
                                {section.members.map((m) => <MemberRow key={m.slug} member={m} />)}
                            </div>
                        </section>
                    ))}
                </div>

                {/* ── Why / What / How ─────────────────────────────────────── */}
                {context && (
                    <div className="mt-10">
                        <ContextCards why={context.why} what={context.what} how={context.how} />
                    </div>
                )}

                {/* ── Shared docs ──────────────────────────────────────────── */}
                {readmeHtml && (
                    <Card padding="none" className="mt-10 overflow-hidden">
                        <div className="flex items-center gap-2 border-b border-[var(--border-1)] px-4 py-2.5">
                            <span className="pkg-eco" data-eco="polyglot">readme</span>
                            <span className="font-mono text-xs font-semibold text-[var(--fg-2)]">
                                Shared model &amp; API — README.md
                            </span>
                        </div>
                        <div className="px-4 py-6">
                            <Prose html={readmeHtml} />
                        </div>
                    </Card>
                )}

                <div className="nextbar">
                    <div>
                        <div className="nextbar__label">What next</div>
                        <div className="nextbar__text">
                            {family.ui_count > 0
                                ? "Open a surface and click any component for a live demo with source."
                                : "Install a package and drive it from code or an agent."}
                        </div>
                    </div>
                    <div className="nextbar__acts">
                        {family.ui_count > 0 && flagship?.href && (
                            <Button as={Link} href={flagship.href} variant="ghost" icon="layout-grid">
                                Component previews
                            </Button>
                        )}
                        <Button as={Link} href="/packages" variant="ghost" icon="arrow-left">All packages</Button>
                    </div>
                </div>
            </div>
        </Layout>
    );
}

/**
 * The at-a-glance map: which packages are UI, which are backend.
 *
 * The join between the two lanes is labelled "one shared contract" because that
 * is the family's actual claim — otherwise the split reads as two unrelated
 * halves rather than one product with two faces.
 */
function BasketMap({ family, members }: { family: Family; members: Member[] }) {
    const lanes = (["ui", "backend"] as const)
        .map((k) => ({
            key: k,
            title: k === "ui" ? "UI surfaces" : "Backend · renders no UI",
            icon: BASKETS[k].icon,
            accent: k === "ui" ? "var(--acc)" : "var(--lane-be)",
            note:
                k === "ui"
                    ? family.previews > 0
                        ? `${family.previews} component previews across ${family.ui_count} package${family.ui_count === 1 ? "" : "s"}`
                        : "React components"
                    : "install, then call the API",
            members: members.filter((m) => m.basket === k),
        }))
        .filter((l) => l.members.length > 0);

    return (
        <div className="bmap">
            {lanes.map((lane, i) => (
                <div key={lane.key}>
                    <div className="bmap__lane" style={{ "--acc": lane.accent } as CSSProperties}>
                        <div className="bmap__head">
                            <span className="bmap__ic"><Icon name={lane.icon} size="sm" /></span>
                            <span className="bmap__title">{lane.title}</span>
                            <span className="bmap__n">{lane.members.length}</span>
                        </div>
                        <div className="bmap__note">{lane.note}</div>
                        <div className="bmap__list">
                            {lane.members.map((m) => {
                                const body = (
                                    <>
                                        <span className={`row-dot row-dot--${m.basket}`} />
                                        <span className="mono">{deScope(m.name)}</span>
                                        <span className="lang-chip" data-eco={m.ecosystem}>{ECO_LABEL[m.ecosystem]}</span>
                                        <span className="bmap__go">
                                            {m.components_count > 0 ? `${m.components_count} previews` : "API"}
                                            <Icon name="arrow-right" size="xs" />
                                        </span>
                                    </>
                                );
                                return m.href ? (
                                    <Link key={m.slug} href={m.href} className="bmap__item">{body}</Link>
                                ) : (
                                    <span key={m.slug} className="bmap__item">{body}</span>
                                );
                            })}
                        </div>
                    </div>
                    {i === 0 && lanes.length > 1 && (
                        <div className="bmap__join">
                            <hr />
                            <span>one shared contract</span>
                            <hr />
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
}

/** One package in the family — preview or install line, then its next step. */
function MemberRow({ member: m }: { member: Member }) {
    const [copied, setCopied] = useState(false);
    const ui = m.basket === "ui";

    const copy = () => {
        if (!m.install) return;
        navigator.clipboard.writeText(m.install).then(() => {
            setCopied(true);
            window.setTimeout(() => setCopied(false), 1200);
        });
    };

    return (
        <Card
            className="mem-row"
            data-basket={m.basket}
            style={{ "--acc": ui ? m.accent : "var(--lane-be)" } as CSSProperties}
        >
            {ui && <div className="mem-pv"><PkgPreview slug={m.slug} /></div>}
            <div>
                <div className="mem-head">
                    <span className="mem-name">{deScope(m.name)}</span>
                    <span className="lang-chip" data-eco={m.ecosystem}>{m.language}</span>
                    <BasketTag basket={m.basket} />
                    {m.components_count > 0 && (
                        <span className="mem-cc">
                            <Icon name="component" size="xs" /> {m.components_count} component
                            {m.components_count === 1 ? "" : "s"}
                        </span>
                    )}
                </div>
                {m.tagline && <p className="mem-tag">{m.tagline}</p>}
                {m.install && (
                    <span className="snippet" style={{ maxWidth: "28rem" }}>
                        <span className="snippet__sigil">$</span>
                        <span className="snippet__cmd">{m.install}</span>
                        <button type="button" className="pkg-copy" onClick={copy} style={{ marginLeft: "auto" }}>
                            {copied ? "copied" : "copy"}
                        </button>
                    </span>
                )}
            </div>
            <div className="mem-act">
                {m.href ? (
                    <Button
                        as={Link}
                        href={m.href}
                        size="sm"
                        color={BASKETS[m.basket].color}
                        icon={ui ? "layout-grid" : "terminal"}
                        iconTrailing="arrow-right"
                    >
                        {ui
                            ? m.components_count > 0
                                ? `Browse ${m.components_count} preview${m.components_count === 1 ? "" : "s"}`
                                : "Open package"
                            : "Read the API"}
                    </Button>
                ) : (
                    <span className="mem-cc">Documented in this family</span>
                )}
                <div className="mem-links">
                    {m.repoUrl && <a href={m.repoUrl} target="_blank" rel="noreferrer">GitHub <Icon name="arrow-up-right" size="xs" /></a>}
                    {m.npmUrl && <a href={m.npmUrl} target="_blank" rel="noreferrer">npm <Icon name="arrow-up-right" size="xs" /></a>}
                    {m.packagistUrl && <a href={m.packagistUrl} target="_blank" rel="noreferrer">Packagist <Icon name="arrow-up-right" size="xs" /></a>}
                </div>
            </div>
        </Card>
    );
}

export type { Family, Member, Section };
