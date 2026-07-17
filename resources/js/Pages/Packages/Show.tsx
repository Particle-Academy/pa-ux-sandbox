import { Link } from "@inertiajs/react";
import { Seo } from "@particle-academy/fancy-inertia/seo";
import { Breadcrumbs } from "@particle-academy/react-fancy";
import { useState, type CSSProperties } from "react";
import { Layout } from "../Layout";
import { getComponentPreview, GenericPlaceholder } from "./ComponentPreviews";
import { ContextCards } from "./ContextCards";
import { Prose } from "./Prose";

type Component = { slug: string; name: string; blurb?: string; inlineEdit?: boolean };
type ApiEntry = { signature: string; description?: string };

type Pkg = {
    slug: string;
    name: string;
    tagline: string;
    language: string;
    npm?: string | null;
    composer?: string | null;
    download?: string | null;
    /** Vendorable-block install command, e.g. `npx fancy-cli add catalog-fms`. */
    cli?: string | null;
    repo?: string;
    core?: boolean;
    group?: "core" | "human" | "companion";
    accent?: string;
    ecosystem?: "ts" | "php" | "polyglot";
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

const ECO_LABEL: Record<NonNullable<Pkg["ecosystem"]>, string> = { ts: "TS", php: "PHP", polyglot: "Poly" };

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

function initials(name: string): string {
    const base = name.replace(/^@[^/]+\//, "").replace(/^particle-academy\//, "");
    const parts = base.split(/[-/]/).filter(Boolean);
    return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? parts[0]?.[1] ?? "")).toUpperCase();
}

function kindChip(pkg: Pkg): string {
    if (pkg.kind === "bridge") return "Bridge";
    if (pkg.kind === "headless") return "Headless · no UI";
    const n = pkg.components?.length ?? 0;
    const label = pkg.kind === "block" ? "Block" : "UI";
    return n > 0 ? `${label} · ${n} component${n === 1 ? "" : "s"}` : label;
}

export default function PackagesShow({
    package: pkg,
    context,
    readmeHtml = null,
}: {
    package: Pkg;
    context: Context | null;
    readmeHtml?: string | null;
}) {
    const accent = pkg.accent ?? "#8b5cf6";
    const eco = pkg.ecosystem ?? (pkg.language === "PHP" ? "php" : "ts");
    const isHeadless = pkg.kind === "headless";
    const components = pkg.components ?? [];
    const mcpTools = !isHeadless && eco === "ts" ? MCP_TOOLS[pkg.slug] : undefined;

    return (
        <Layout>
            <Seo title={pkg.name} description={pkg.tagline} />

            <Breadcrumbs>
                <Breadcrumbs.Item href="/packages">Packages</Breadcrumbs.Item>
                <Breadcrumbs.Item>{pkg.name}</Breadcrumbs.Item>
            </Breadcrumbs>

            <div style={{ "--accent": accent } as CSSProperties}>
                {/* ── Hero ─────────────────────────────────────────────── */}
                <header className="pkg-hero">
                    <span className="pkg-glyph pkg-hero__glyph">{initials(pkg.name)}</span>
                    <div className="pkg-hero__main">
                        <h1 className="pkg-hero__name">{pkg.name}</h1>
                        <div className="pkg-hero__id">{pkg.npm ?? pkg.composer ?? pkg.cli ?? pkg.repo}</div>
                        <p className="pkg-hero__tagline">{pkg.tagline}</p>
                        <div className="pkg-hero__meta">
                            <span className="pkg-eco" data-eco={eco}>{ECO_LABEL[eco]}</span>
                            <span className="pkg-kind">{kindChip(pkg)}</span>
                            {components.length > 0 && (
                                <span className="pkg-meta-chip">{components.length} components</span>
                            )}
                            {pkg.core && <span className="pkg-core-badge">Core of Human+</span>}
                        </div>
                    </div>
                </header>

                {/* ── Install card ─────────────────────────────────────── */}
                <InstallCard pkg={pkg} eco={eco} />

                {pkg.kit && (
                    <div className="mt-2 text-sm">
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

                {/* ── Doc links + peers ────────────────────────────────── */}
                <div className="pkg-doclinks">
                    {pkg.showcase && <Link className="pkg-doclink" href={pkg.showcase}>Live sandbox →</Link>}
                    {pkg.repo && <a className="pkg-doclink" href={`https://github.com/${pkg.repo}#readme`} target="_blank" rel="noopener">README →</a>}
                    {pkg.repo && <a className="pkg-doclink" href={`https://github.com/${pkg.repo}`} target="_blank" rel="noopener">GitHub →</a>}
                    {pkg.npm && <a className="pkg-doclink" href={`https://www.npmjs.com/package/${pkg.npm}`} target="_blank" rel="noopener">npm →</a>}
                    {pkg.composer && <a className="pkg-doclink" href={`https://packagist.org/packages/${pkg.composer}`} target="_blank" rel="noopener">Packagist →</a>}
                    {pkg.repo && <a className="pkg-doclink" href={`https://github.com/${pkg.repo}/issues`} target="_blank" rel="noopener">Issues →</a>}
                    {pkg.cli && <a className="pkg-doclink" href={`/r/${pkg.slug}.json`} target="_blank" rel="noopener">Registry JSON →</a>}
                </div>
                {pkg.peers && pkg.peers.length > 0 && (
                    <div className="pkg-peers">
                        <span className="pkg-peers__label">Peers</span>
                        {pkg.peers.map((peer) => (
                            <span key={peer} className="pkg-peer">{peer}</span>
                        ))}
                    </div>
                )}
                {pkg.pairs && pkg.pairs.length > 0 && (
                    <div className="pkg-peers">
                        <span className="pkg-peers__label">Pairs with</span>
                        {pkg.pairs.map((p) => (
                            <Link key={p} href={`/packages/${p}`} className="pkg-peer" style={{ textDecoration: "none" }}>{p}</Link>
                        ))}
                    </div>
                )}

                {/* ── MCP proof (UI + ts) ──────────────────────────────── */}
                {mcpTools && (
                    <div className="pkg-mcp">
                        <div className="pkg-mcp__col">
                            <div className="pkg-mcp__eyebrow">Authoring surface</div>
                            <div className="pkg-mcp__title">Humans compose it</div>
                            <p className="pkg-mcp__body">
                                Controlled <code>value</code> + <code>onChange</code>, JSON-friendly props, terse defaults — so
                                people (and agents) build it fast.
                            </p>
                        </div>
                        <div className="pkg-mcp__col">
                            <div className="pkg-mcp__eyebrow">Inhabited surface</div>
                            <div className="pkg-mcp__title">Agents drive it over MCP</div>
                            <p className="pkg-mcp__body">
                                A bridge in <code>@particle-academy/agent-integrations</code> exposes typed tools — agents read
                                and mutate state through stable handles, never DOM scraping.
                            </p>
                            <div className="pkg-mcp__tools">
                                {mcpTools.map((t) => (
                                    <span key={t} className="pkg-mcp__tool">{t}</span>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* ── Why / What / How ─────────────────────────────────── */}
                {context && (
                    <div className="mt-8">
                        <ContextCards why={context.why} what={context.what} how={context.how} />
                    </div>
                )}

                {/* ── Kind-driven body ─────────────────────────────────── */}
                {!isHeadless && components.length > 0 ? (
                    <ComponentGrid pkg={pkg} components={components} />
                ) : (
                    <HeadlessBody pkg={pkg} readmeHtml={readmeHtml} hasContext={!!context} />
                )}
            </div>
        </Layout>
    );
}

function InstallCard({ pkg, eco }: { pkg: Pkg; eco: NonNullable<Pkg["ecosystem"]> }) {
    type Tab = { id: string; cmd: string };
    const tabs: Tab[] = [];
    if (pkg.cli) tabs.push({ id: "fancy-ui", cmd: pkg.cli });
    if (pkg.npm) {
        tabs.push({ id: "npm", cmd: `npm install ${pkg.npm}` });
        tabs.push({ id: "pnpm", cmd: `pnpm add ${pkg.npm}` });
        tabs.push({ id: "yarn", cmd: `yarn add ${pkg.npm}` });
    }
    if (pkg.composer) tabs.push({ id: "composer", cmd: `composer require ${pkg.composer}` });
    if (pkg.download) tabs.push({ id: "curl", cmd: pkg.download });
    if (eco === "polyglot" && pkg.npm && !pkg.download) {
        tabs.push({ id: "npx", cmd: `npx ${pkg.npm}` });
    }

    const [active, setActive] = useState(tabs[0]?.id ?? "");
    const [copied, setCopied] = useState(false);
    const current = tabs.find((t) => t.id === active) ?? tabs[0];

    if (tabs.length === 0) return null;

    const copy = () => {
        navigator.clipboard.writeText(current!.cmd).then(() => {
            setCopied(true);
            window.setTimeout(() => setCopied(false), 1200);
        });
    };

    return (
        <div className="pkg-install fancy-card">
            <div className="pkg-tabbar" role="tablist">
                {tabs.map((t) => (
                    <button
                        key={t.id}
                        type="button"
                        role="tab"
                        className="pkg-tab"
                        aria-selected={active === t.id}
                        onClick={() => setActive(t.id)}
                    >
                        {t.id}
                    </button>
                ))}
            </div>
            <div className="pkg-install__cmd">
                <span className="sigil">$</span>
                <code>{current!.cmd}</code>
                <button type="button" className="pkg-copy" onClick={copy}>{copied ? "copied" : "copy"}</button>
            </div>
        </div>
    );
}

function ComponentGrid({ pkg, components }: { pkg: Pkg; components: Component[] }) {
    return (
        <>
            <div className="pkg-section-head">
                <h2>Components</h2>
                <p>
                    {components.length} component{components.length === 1 ? "" : "s"} · click any tile for a full demo, source, and install snippet.
                </p>
            </div>
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
                                    {Preview ? <Preview /> : <GenericPlaceholder name={c.name} />}
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
        </>
    );
}

function HeadlessBody({ pkg, readmeHtml, hasContext }: { pkg: Pkg; readmeHtml: string | null; hasContext: boolean }) {
    const api = pkg.api ?? [];
    return (
        <>
            <div className="pkg-section-head">
                <h2>API surface</h2>
                <p>This package renders no UI surface — it is the hooks / APIs / server-side tooling described above.</p>
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
            ) : (
                <div className="pkg-noui">
                    <b>Renders no UI.</b> A supporting package with no rendered components, so there are no live demos —
                    reach for the README + Changelog for the full reference, and the Issues link to file feedback.
                </div>
            )}

            {readmeHtml && (
                <div className="mt-8 fancy-card overflow-hidden">
                    <div className="flex items-center gap-2 border-b border-[var(--border-1)] px-4 py-2.5">
                        <span className="pkg-eco" data-eco={pkg.ecosystem ?? "ts"}>readme</span>
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
                </div>
            )}

            {!readmeHtml && !hasContext && (
                <div className="mt-4 text-xs text-[var(--fg-3)]">
                    Full reference:{" "}
                    <a href={`https://github.com/${pkg.repo}#readme`} target="_blank" rel="noopener" className="font-medium" style={{ color: "color-mix(in oklch, var(--accent) 80%, var(--fg-1))" }}>README →</a>
                </div>
            )}
        </>
    );
}
