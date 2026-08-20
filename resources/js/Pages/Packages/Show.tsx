import { Link } from "@inertiajs/react";
import { Seo } from "@particle-academy/fancy-inertia/seo";
import { Badge, Breadcrumbs, Button, Card, Heading, Icon, Text } from "@particle-academy/react-fancy";
import { useState, type CSSProperties } from "react";
import { Layout } from "../Layout";
import { BASKETS, BasketTag, ECO_LABEL, basketOfKind, initials, type Eco } from "./basket";
import { getComponentPreview, GenericPlaceholder } from "./ComponentPreviews";
import { ContextCards } from "./ContextCards";
import { PkgPreview } from "./PkgPreview";
import { Prose } from "./Prose";
import TuiFrame from "./TuiFrame";

/**
 * One package's page.
 *
 * The redesign's shape: identity and THE ONE OBVIOUS NEXT STEP on the left,
 * install + links on the right, then a body chosen by basket — a component grid
 * for a surface, an API surface for a backend. The next-step card is the point:
 * before it, a headless package and a UI package looked identical down to the
 * fold, and a visitor had to read the tagline to find out whether there was
 * anything to look at.
 *
 * Composed from react-fancy (Card / Button / Badge / Heading / Text /
 * Breadcrumbs / Icon), restyled through showcase/packages.css.
 */

type Component = {
    slug: string;
    name: string;
    blurb?: string;
    inlineEdit?: boolean;
    /**
     * A captured terminal frame (fancy-tui only) — real ANSI from the package's
     * own Ink showcase harness, attached server-side by TuiPreviewSource. A
     * package that renders to a terminal cannot have a React preview.
     */
    frame?: string;
    columns?: number;
};
type ApiEntry = { signature: string; description?: string };

type Pkg = {
    slug: string;
    name: string;
    tagline: string;
    language: string;
    npm?: string | null;
    composer?: string | null;
    pypi?: string | null;
    download?: string | null;
    /** Vendorable-block install command, e.g. `npx fancy-cli@latest add catalog-fms`. */
    cli?: string | null;
    repo?: string;
    core?: boolean;
    group?: "core" | "surfaces" | "documents" | "commerce" | "platform" | "tooling";
    accent?: string;
    ecosystem?: Eco;
    kind?: "ui" | "bridge" | "headless" | "block";
    components?: Component[];
    peers?: string[];
    /** Related package slugs to link ("Pairs with"). */
    pairs?: string[];
    /** Starter-kit slug that ships this offering as a full app. */
    kit?: string | null;
    showcase?: string | null;
    api?: ApiEntry[];
};

type Context = { why: string; what: string; how: string };
type Family = { slug: string; name: string; href: string; member_count: number };

/**
 * The MCP tool prefixes each agent-bridgeable surface exposes (mirrors the
 * bridge table in the sandbox CLAUDE.md). Drives the "MCP proof" block — UI/ts
 * surfaces that an embedded agent can drive over MCP rather than DOM scraping.
 */
const MCP_TOOLS: Record<string, string[]> = {
    "fancy-whiteboard": ["whiteboard_paint", "whiteboard_add_note", "whiteboard_move"],
    "fancy-flow": ["flow_add_node", "flow_connect", "flow_run"],
    "fancy-sheets": ["sheet_set_cell", "sheet_paint", "sheet_add_sheet"],
    "fancy-slides": ["deck_add_slide", "slide_add_element", "element_update"],
    "fancy-echarts": ["chart_set_option", "chart_read"],
    "fancy-code": ["code_read", "code_write", "code_replace"],
    "fancy-term": ["terminal_read", "terminal_write", "terminal_run"],
    "fancy-tui": ["tui_surfaces_list", "tui_surface_read", "tui_action_invoke"],
    "fancy-3d": ["scene_add_node", "scene_move", "scene_paint"],
    "fancy-3d-babylon": ["scene_add_node", "scene_move", "scene_paint"],
    "fancy-3d-three": ["scene_add_node", "scene_move", "scene_paint"],
    "fancy-screens": ["screen_focus", "screen_register"],
    "fancy-diff": ["diff_accept_hunk", "diff_reject_hunk"],
    "react-fancy": ["form_set_field", "form_submit"],
    "agent-integrations": ["agent_undo", "agent_redo", "agent_history"],
};

/** Scroll to the body section the next-step card promises. */
function jumpTo(id: string) {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

export default function PackagesShow({
    package: pkg,
    context,
    readmeHtml = null,
    family = null,
}: {
    package: Pkg;
    context: Context | null;
    readmeHtml?: string | null;
    family?: Family | null;
}) {
    const accent = pkg.accent ?? "#8b5cf6";
    const eco = pkg.ecosystem ?? (pkg.language === "PHP" ? "php" : "ts");
    const basket = basketOfKind(pkg.kind);
    const isHeadless = basket === "backend";
    const components = pkg.components ?? [];
    const mcpTools = !isHeadless && eco === "ts" ? MCP_TOOLS[pkg.slug] : undefined;

    return (
        <Layout>
            <Seo title={pkg.name} description={pkg.tagline} />

            <Breadcrumbs>
                <Breadcrumbs.Item as={Link} href="/packages">Packages</Breadcrumbs.Item>
                {family && <Breadcrumbs.Item as={Link} href={family.href}>{family.name}</Breadcrumbs.Item>}
                <Breadcrumbs.Item>{pkg.name}</Breadcrumbs.Item>
            </Breadcrumbs>

            <div style={{ "--accent": accent, "--acc": accent } as CSSProperties}>
                <div className="detail-hero">
                    {/* ── Identity + the one obvious next step ─────────────── */}
                    <div>
                        <header className="pkg-hero">
                            <span className="pkg-glyph pkg-hero__glyph">{initials(pkg.name)}</span>
                            <div className="pkg-hero__main">
                                <Heading as="h1" className="pkg-hero__name">{pkg.name}</Heading>
                                <div className="pkg-hero__id">{pkg.npm ?? pkg.composer ?? pkg.pypi ?? pkg.cli ?? pkg.repo}</div>
                            </div>
                        </header>

                        <Text size="lg" className="pkg-hero__tagline">{pkg.tagline}</Text>

                        <div className="pkg-hero__meta">
                            <BasketTag basket={basket} />
                            <span className="pkg-eco" data-eco={eco}>{ECO_LABEL[eco]}</span>
                            {components.length > 0 && (
                                <span className="pkg-meta-chip">
                                    <Icon name="component" size="xs" /> {components.length} components
                                </span>
                            )}
                            {pkg.core && (
                                <span className="pkg-core-badge">
                                    <Icon name="star" size="xs" /> Core of Human+
                                </span>
                            )}
                        </div>

                        {family && (
                            <Link href={family.href} className="fam-strip">
                                <Icon name="layers" size="sm" />
                                <span>
                                    Part of <b>{family.name}</b> — {family.member_count} packages, one product
                                </span>
                                <span className="fam-strip__go">See the family <Icon name="arrow-right" size="xs" /></span>
                            </Link>
                        )}

                        <NextStep pkg={pkg} basket={basket} componentCount={components.length} />

                        {pkg.kit && (
                            <div className="mt-4 text-sm">
                                <span className="text-[var(--fg-3)]">Want a full app to start from? </span>
                                <Link
                                    href={`/starter-kits/${pkg.kit}`}
                                    className="font-medium"
                                    style={{ color: "color-mix(in oklch, var(--accent) 80%, var(--fg-1))" }}
                                >
                                    Grab the {pkg.kit} starter kit →
                                </Link>
                            </div>
                        )}
                    </div>

                    {/* ── Install, links, peers, the MCP proof ─────────────── */}
                    <div>
                        <InstallCard pkg={pkg} eco={eco} />
                        <MetaLinks pkg={pkg} />
                        {pkg.peers && pkg.peers.length > 0 && (
                            <div className="pkg-peers">
                                <span className="pkg-peers__label">Peer dependencies</span>
                                <div className="pkg-peers__row">
                                    {pkg.peers.map((peer) => <span key={peer} className="pkg-peer">{peer}</span>)}
                                </div>
                            </div>
                        )}
                        {pkg.pairs && pkg.pairs.length > 0 && (
                            <div className="pkg-peers">
                                <span className="pkg-peers__label">Pairs with</span>
                                <div className="pkg-peers__row">
                                    {pkg.pairs.map((p) => (
                                        <Link key={p} href={`/packages/${p}`} className="pkg-peer">{p}</Link>
                                    ))}
                                </div>
                            </div>
                        )}
                        {mcpTools && <McpProof tools={mcpTools} />}
                    </div>
                </div>

                {/* ── Why / What / How ─────────────────────────────────────── */}
                {context && (
                    <div className="mt-10">
                        <ContextCards why={context.why} what={context.what} how={context.how} />
                    </div>
                )}

                {/* ── Kind-driven body ─────────────────────────────────────── */}
                {!isHeadless && components.length > 0 ? (
                    <ComponentGrid pkg={pkg} components={components} />
                ) : (
                    <HeadlessBody pkg={pkg} eco={eco} readmeHtml={readmeHtml} hasContext={!!context} />
                )}

                <NextBar pkg={pkg} basket={basket} family={family} />
            </div>
        </Layout>
    );
}

/**
 * The one obvious next step, worded for the lane.
 *
 * A UI package leads with its previews and shows three of them; a backend says
 * plainly that there is nothing to preview and points at the API. Same card,
 * opposite promise — which is the whole reason a visitor can tell the two apart
 * without reading.
 */
function NextStep({ pkg, basket, componentCount }: { pkg: Pkg; basket: "ui" | "backend"; componentCount: number }) {
    const ui = basket === "ui";
    const target = ui ? "components" : "api";
    return (
        <div className="nextstep" style={{ "--acc": ui ? (pkg.accent ?? "#8b5cf6") : "var(--lane-be)" } as CSSProperties}>
            <div className="ns-head">
                <span className="ns-ic"><Icon name={ui ? "monitor-play" : "server"} size="md" /></span>
                <div>
                    <div className="ns-label">{BASKETS[basket].tag}</div>
                    <div className="ns-text">
                        {ui
                            ? componentCount > 0
                                ? `${componentCount} components, each with a live demo, props table, and source.`
                                : "Live demos with source for every export."
                            : "Nothing to preview — install it and call the typed API, or hand it to an agent."}
                    </div>
                </div>
            </div>
            {ui && (
                <div className="ns-thumbs">
                    {[pkg.slug, ...["react-fancy", "fancy-echarts", "fancy-sheets"].filter((s) => s !== pkg.slug)]
                        .slice(0, 3)
                        .map((s) => (
                            <span className="ns-thumb" key={s}><PkgPreview slug={s} /></span>
                        ))}
                </div>
            )}
            <Button
                color={BASKETS[basket].color}
                icon={ui ? "layout-grid" : "terminal"}
                iconTrailing="arrow-down"
                onClick={() => jumpTo(target)}
            >
                {ui
                    ? componentCount > 0 ? `Browse ${componentCount} component previews` : "Browse the previews"
                    : "Read the API surface"}
            </Button>
        </div>
    );
}

function InstallCard({ pkg, eco }: { pkg: Pkg; eco: Eco }) {
    type Tab = { id: string; cmd: string };
    const tabs: Tab[] = [];
    if (pkg.cli) tabs.push({ id: "fancy-cli", cmd: pkg.cli });
    if (pkg.npm) {
        tabs.push({ id: "npm", cmd: `npm install ${pkg.npm}` });
        tabs.push({ id: "pnpm", cmd: `pnpm add ${pkg.npm}` });
        tabs.push({ id: "yarn", cmd: `yarn add ${pkg.npm}` });
    }
    if (pkg.composer) tabs.push({ id: "composer", cmd: `composer require ${pkg.composer}` });
    if (pkg.pypi) {
        tabs.push({ id: "pip", cmd: `pip install ${pkg.pypi}` });
        tabs.push({ id: "uv", cmd: `uv add ${pkg.pypi}` });
    }
    if (pkg.download) tabs.push({ id: "curl", cmd: pkg.download });
    if (eco === "polyglot" && pkg.npm && !pkg.download) {
        tabs.push({ id: "npx", cmd: `npx ${pkg.npm}` });
    }

    const [active, setActive] = useState(tabs[0]?.id ?? "");
    const [copied, setCopied] = useState(false);
    const current = tabs.find((t) => t.id === active) ?? tabs[0];

    if (!current) return null;

    const copy = () => {
        navigator.clipboard.writeText(current.cmd).then(() => {
            setCopied(true);
            window.setTimeout(() => setCopied(false), 1200);
        });
    };

    return (
        <Card padding="none" className="pkg-install">
            <div className="pkg-tabbar" role="tablist">
                {tabs.map((t) => (
                    <button
                        key={t.id}
                        type="button"
                        role="tab"
                        className="pkg-tab"
                        aria-selected={current.id === t.id}
                        onClick={() => setActive(t.id)}
                    >
                        {t.id}
                    </button>
                ))}
            </div>
            <div className="pkg-install__cmd">
                <span className="sigil">$</span>
                <code>{current.cmd}</code>
                <button type="button" className="pkg-copy" onClick={copy}>{copied ? "copied" : "copy"}</button>
            </div>
        </Card>
    );
}

/** The docs rail — README, GitHub, registry, issues. */
function MetaLinks({ pkg }: { pkg: Pkg }) {
    const links: Array<{ label: string; href: string; icon: string; external: boolean }> = [];
    if (pkg.showcase) links.push({ label: "Live sandbox", href: pkg.showcase, icon: "play", external: false });
    if (pkg.repo) links.push({ label: "README", href: `https://github.com/${pkg.repo}#readme`, icon: "book-open", external: true });
    if (pkg.repo) links.push({ label: "GitHub", href: `https://github.com/${pkg.repo}`, icon: "github", external: true });
    if (pkg.npm) links.push({ label: "npm", href: `https://www.npmjs.com/package/${pkg.npm}`, icon: "package", external: true });
    if (pkg.composer) links.push({ label: "Packagist", href: `https://packagist.org/packages/${pkg.composer}`, icon: "package", external: true });
    if (pkg.pypi) links.push({ label: "PyPI", href: `https://pypi.org/project/${pkg.pypi}`, icon: "package", external: true });
    if (pkg.repo) links.push({ label: "Issues", href: `https://github.com/${pkg.repo}/issues`, icon: "circle-dot", external: true });
    if (pkg.cli) links.push({ label: "Registry JSON", href: `/r/${pkg.slug}.json`, icon: "braces", external: true });

    return (
        <div className="meta-links">
            {links.map((l) =>
                l.external ? (
                    <a key={l.label} className="meta-link" href={l.href} target="_blank" rel="noopener">
                        <Icon name={l.icon} size="sm" /> {l.label}
                        <Icon name="arrow-up-right" size="xs" className="meta-link__arrow" />
                    </a>
                ) : (
                    <Link key={l.label} className="meta-link" href={l.href}>
                        <Icon name={l.icon} size="sm" /> {l.label}
                        <Icon name="arrow-right" size="xs" className="meta-link__arrow" />
                    </Link>
                ),
            )}
        </div>
    );
}

/**
 * One handler, two operators — the Human+ claim, shown rather than told.
 *
 * The same controlled component that a keystroke drives is the one an agent
 * drives over MCP. Side by side is the only way that reads as one mechanism
 * instead of two features.
 */
function McpProof({ tools }: { tools: string[] }) {
    return (
        <div className="pkg-mcp">
            <div className="pkg-mcp__head">
                <Icon name="cable" size="sm" />
                One handler, two operators
                <span className="pkg-mcp__head-tag">Human+ contract</span>
            </div>
            <div className="pkg-mcp__grid">
                <div className="pkg-mcp__col pkg-mcp__col--human">
                    <div className="pkg-mcp__eyebrow"><Icon name="user" size="xs" /> Human — keystroke</div>
                    <pre className="pkg-mcp__code">
                        <span className="k">&lt;Table</span>{"\n  rows={rows}\n  onChange={"}<span className="k">setRows</span>{"}\n/&gt;"}
                    </pre>
                </div>
                <div className="pkg-mcp__col pkg-mcp__col--agent">
                    <div className="pkg-mcp__eyebrow"><Icon name="bot" size="xs" /> Agent — MCP tool call</div>
                    <pre className="pkg-mcp__code">
                        <span className="a">tools.call</span>{"(\n  "}<span className="s">&quot;{tools[0]}&quot;</span>{",\n  { … }\n)"}
                    </pre>
                    <div className="pkg-mcp__tools">
                        {tools.map((t) => <span key={t} className="pkg-mcp__tool">{t}</span>)}
                    </div>
                </div>
            </div>
        </div>
    );
}

function ComponentGrid({ pkg, components }: { pkg: Pkg; components: Component[] }) {
    return (
        <section id="components" className="pkg-section-head">
            <Heading as="h2" size="lg"><Icon name="layout-grid" size="md" /> Components</Heading>
            <p>
                {components.length} component{components.length === 1 ? "" : "s"} · click any tile for a full demo,
                source, and install snippet.
            </p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {components.map((c) => {
                    const Preview = getComponentPreview(pkg.slug, c.slug);
                    return (
                        // Stretched link (NOT a <Link> wrapping the card): the live
                        // <Preview/> components render their own anchors (Button-as-a,
                        // Menu, Navbar…). Nesting them inside a <Link> is invalid HTML
                        // the browser un-nests → React #418 hydration mismatch. The
                        // overlay covers the card for whole-card navigation.
                        <div key={c.slug} className="group relative block h-full">
                            <Link
                                href={`/packages/${pkg.slug}/${c.slug}`}
                                className="absolute inset-0 z-[1] rounded-xl"
                                aria-label={`Open ${c.name}`}
                            />
                            <div className="h-full overflow-hidden rounded-xl border border-[var(--border-1)] bg-[var(--surface)] transition group-hover:-translate-y-0.5 group-hover:shadow-md">
                                <div className="flex items-center justify-between gap-2 border-b border-[var(--border-1)] px-3 py-2">
                                    <span className="flex min-w-0 items-center gap-1.5">
                                        <span className="truncate font-mono text-xs font-semibold text-[var(--fg-1)]">{c.name}</span>
                                        {c.inlineEdit && (
                                            <span
                                                className="relative z-[2] inline-flex shrink-0 items-center gap-0.5 rounded px-1.5 py-0.5 text-[10px] font-medium"
                                                style={{
                                                    background: "color-mix(in oklch, var(--accent) 14%, transparent)",
                                                    color: "color-mix(in oklch, var(--accent) 85%, var(--fg-1))",
                                                }}
                                                title="Supports view/edit mode — renders read-only in a <Form mode='view'> and becomes editable on demand"
                                            >
                                                ✎ inline&nbsp;edit
                                            </span>
                                        )}
                                    </span>
                                    <span className="shrink-0 text-xs opacity-0 transition group-hover:opacity-100" style={{ color: "color-mix(in oklch, var(--accent) 80%, var(--fg-1))" }}>
                                        Open →
                                    </span>
                                </div>
                                <div className="flex min-h-[10rem] items-center justify-center overflow-hidden p-4">
                                    {c.frame ? (
                                        <TuiFrame frame={c.frame} columns={c.columns} />
                                    ) : Preview ? (
                                        <Preview />
                                    ) : (
                                        <GenericPlaceholder name={c.name} />
                                    )}
                                </div>
                                {c.blurb && (
                                    <div className="border-t border-[var(--border-1)] px-3 py-2">
                                        <span className="text-xs text-[var(--fg-3)]">{c.blurb}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </section>
    );
}

function HeadlessBody({
    pkg,
    eco,
    readmeHtml,
    hasContext,
}: {
    pkg: Pkg;
    eco: Eco;
    readmeHtml: string | null;
    hasContext: boolean;
}) {
    const api = pkg.api ?? [];
    return (
        <section id="api" className="pkg-section-head">
            <Heading as="h2" size="lg"><Icon name="terminal" size="md" /> API surface</Heading>
            <p>Headless package — drive it from code or an agent. No component grid.</p>

            <div className="headless-note">
                <span className="headless-note__ic"><Icon name="eye-off" size="md" /></span>
                <span>
                    This package renders <b>no UI surface</b>. It exposes a typed{" "}
                    {eco === "php" ? "PHP" : eco === "py" ? "Python" : "code"} API
                    {pkg.core ? " and an MCP tool set" : ""}; issues are tracked on GitHub.
                </span>
            </div>

            {api.length > 0 ? (
                <div className="pkg-api">
                    {api.map((entry) => (
                        <div key={entry.signature} className="pkg-api__row">
                            <div className="pkg-api__sig">{entry.signature}</div>
                            {entry.description && <div className="pkg-api__desc">{entry.description}</div>}
                        </div>
                    ))}
                </div>
            ) : !readmeHtml ? (
                <div className="pkg-noui">
                    <b>No API table yet.</b> A supporting package with no rendered components, so there are no live
                    demos — reach for the README + Changelog for the full reference, and the Issues link to file
                    feedback.
                </div>
            ) : null}

            {readmeHtml && (
                <Card padding="none" className="mt-8 overflow-hidden">
                    <div className="flex items-center gap-2 border-b border-[var(--border-1)] px-4 py-2.5">
                        <span className="pkg-eco" data-eco={eco}>readme</span>
                        <span className="font-mono text-xs font-semibold text-[var(--fg-2)]">README.md</span>
                        <span className="flex-1" />
                        <a
                            href={`https://github.com/${pkg.repo}#readme`}
                            target="_blank"
                            rel="noopener"
                            className="text-xs font-medium"
                            style={{ color: "color-mix(in oklch, var(--accent) 80%, var(--fg-1))" }}
                        >
                            View on GitHub →
                        </a>
                    </div>
                    <div className="px-4 py-6">
                        <Prose html={readmeHtml} />
                    </div>
                </Card>
            )}

            {!readmeHtml && !hasContext && (
                <div className="mt-4 text-xs text-[var(--fg-3)]">
                    Full reference:{" "}
                    <a href={`https://github.com/${pkg.repo}#readme`} target="_blank" rel="noopener" className="font-medium" style={{ color: "color-mix(in oklch, var(--accent) 80%, var(--fg-1))" }}>README →</a>
                </div>
            )}
        </section>
    );
}

/** Where to go from the bottom of the page. */
function NextBar({ pkg, basket, family }: { pkg: Pkg; basket: "ui" | "backend"; family: Family | null }) {
    return (
        <div className="nextbar">
            <div>
                <div className="nextbar__label">What next</div>
                <div className="nextbar__text">
                    {basket === "ui"
                        ? "Click any component for a live demo, props, and source — or install the package and go."
                        : "Install it, then call the API from your code or over MCP."}
                </div>
            </div>
            <div className="nextbar__acts">
                {family && (
                    <Button as={Link} href={family.href} variant="ghost" icon="layers">{family.name}</Button>
                )}
                <Button as={Link} href="/packages" variant="ghost" icon="arrow-left">All packages</Button>
            </div>
        </div>
    );
}

export type { Component, Pkg };
