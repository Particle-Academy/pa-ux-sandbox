import { Head, Link } from "@inertiajs/react";
import { Badge, Icon } from "@particle-academy/react-fancy";
import { Fragment, useMemo, useState, type CSSProperties, type ReactNode } from "react";
import { Layout } from "../Layout";

/**
 * One merged catalog entry — emitted by PackagesController::index(). Every
 * package (UI grid + companions) carries the design classification
 * (group / accent / ecosystem / kind) the listing groups + styles by.
 */
type Pkg = {
    slug: string;
    name: string;
    tagline: string;
    language: string;
    core: boolean;
    group: "core" | "human" | "companion";
    accent: string;
    ecosystem: "ts" | "php" | "polyglot";
    kind: "ui" | "bridge" | "headless";
    components_count: number;
    npm: string | null;
    composer: string | null;
    download: string | null;
    repoUrl: string;
    npmUrl: string | null;
    packagistUrl: string | null;
};

type KindFilter = "all" | "ui" | "headless";
type EcoFilter = "all" | "ts" | "php" | "polyglot";

const GROUP_ORDER: Pkg["group"][] = ["core", "human", "companion"];
const GROUP_META: Record<Pkg["group"], { title: string; blurb: string }> = {
    core: {
        title: "Fancy Core",
        blurb: "The stack you reach for to ship a real web app — components, the Inertia bridge, server-state, SEO, live-update detection, and the agent backbone.",
    },
    human: {
        title: "The Human+ surfaces",
        blurb: "Rich, controlled UI surfaces humans and agents inhabit together — whiteboard, flow, sheets, slides, code, charts, 3D — driven over MCP bridges, never DOM scraping.",
    },
    companion: {
        title: "Companion packages",
        blurb: "Headless backends, document writers, isomorphic ports, and tooling developed alongside the kit — plus the react-fancy editor companions.",
    },
};

const ECO_LABEL: Record<Pkg["ecosystem"], string> = { ts: "TS", php: "PHP", polyglot: "Poly" };

/** Mono initials for the glyph — first letters of the de-scoped name parts. */
function initials(name: string): string {
    const base = name.replace(/^@[^/]+\//, "").replace(/^particle-academy\//, "");
    const parts = base.split(/[-/]/).filter(Boolean);
    return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? parts[0]?.[1] ?? "")).toUpperCase();
}

function installCmd(p: Pkg): string {
    if (p.npm) return `npm install ${p.npm}`;
    if (p.composer) return `composer require ${p.composer}`;
    if (p.download) return p.download;
    return p.name;
}

export default function PackagesIndex({ packages }: { packages: Pkg[] }) {
    const [query, setQuery] = useState("");
    const [kind, setKind] = useState<KindFilter>("all");
    const [eco, setEco] = useState<EcoFilter>("all");

    const totalComponents = packages.reduce((s, p) => s + p.components_count, 0);

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        return packages.filter((p) => {
            if (kind === "ui" && p.kind === "headless") return false;
            if (kind === "headless" && p.kind !== "headless") return false;
            if (eco !== "all" && p.ecosystem !== eco) return false;
            if (q && !(`${p.name} ${p.slug} ${p.tagline}`.toLowerCase().includes(q))) return false;
            return true;
        });
    }, [packages, query, kind, eco]);

    const groups = GROUP_ORDER.map((g) => {
        let items = filtered.filter((p) => p.group === g);
        // Supporting (companion) packages list alphabetically; the core + Human+
        // surfaces keep their curated narrative order.
        if (g === "companion") {
            items = [...items].sort((a, b) => a.name.localeCompare(b.name));
        }
        return { group: g, meta: GROUP_META[g], items };
    }).filter((s) => s.items.length > 0);

    return (
        <Layout>
            <Head title="Packages · Fancy UI" />

            <header className="pkgs-head">
                <div>
                    <h1 className="pkgs-head__title">Packages</h1>
                    <p className="pkgs-head__sub">
                        Every Fancy UI package — UI surfaces with a live preview, headless backends with a one-line install.
                        Each tile opens a full per-package page with a per-component demo.
                    </p>
                </div>
                <div className="pkgs-stats">
                    <span className="pkgs-stat"><b>{packages.length}</b> packages</span>
                    <span className="pkgs-stat"><b>{totalComponents}</b> components</span>
                    <span className="pkgs-stat"><b>MIT</b> licensed</span>
                </div>
            </header>

            <div className="pkgs-toolbar">
                <label className="pkgs-search">
                    <Icon name="search" size={16} />
                    <input
                        type="search"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Search packages…"
                        aria-label="Search packages"
                    />
                </label>
                <div className="pkgs-chips" role="group" aria-label="Filter by kind">
                    {(["all", "ui", "headless"] as KindFilter[]).map((k) => (
                        <button
                            key={k}
                            type="button"
                            className="pkgs-chip"
                            aria-pressed={kind === k}
                            onClick={() => setKind(k)}
                        >
                            {k === "all" ? "All kinds" : k === "ui" ? "UI" : "Headless"}
                        </button>
                    ))}
                </div>
                <div className="pkgs-chips" role="group" aria-label="Filter by ecosystem">
                    {(["all", "ts", "php", "polyglot"] as EcoFilter[]).map((e) => (
                        <button
                            key={e}
                            type="button"
                            className="pkgs-chip"
                            aria-pressed={eco === e}
                            onClick={() => setEco(e)}
                        >
                            {e === "all" ? "All" : e === "ts" ? "TypeScript" : e === "php" ? "PHP" : "Polyglot"}
                        </button>
                    ))}
                </div>
            </div>

            {groups.length === 0 ? (
                <div className="pkgs-empty">
                    No packages match <b>{query || `${kind}/${eco}`}</b>. Try clearing a filter.
                </div>
            ) : (
                groups.map(({ group, meta, items }) => (
                    <section key={group} className="pkg-group">
                        <div className="pkg-group__head">
                            <h2 className="pkg-group__title">{meta.title}</h2>
                            <span className="pkg-group__count">{items.length}</span>
                        </div>
                        <p className="pkg-group__blurb">{meta.blurb}</p>
                        <div className="pkg-grid">
                            {items.map((p) =>
                                p.kind === "headless" ? (
                                    <HeadlessTile key={p.slug} pkg={p} />
                                ) : (
                                    <PreviewTile key={p.slug} pkg={p} />
                                ),
                            )}
                        </div>
                    </section>
                ))
            )}
        </Layout>
    );
}

/** UI / bridge package → preview tile (mini visual + Explore →). */
function PreviewTile({ pkg }: { pkg: Pkg }) {
    return (
        <Link href={`/packages/${pkg.slug}`} className="pkg-tile" style={{ "--accent": pkg.accent } as CSSProperties}>
            <PreviewVisual pkg={pkg} />
            <div className="pkg-tile__body">
                <div className="pkg-tile__row">
                    <h3 className="pkg-tile__name">{pkg.name}</h3>
                    <span className="pkg-eco" data-eco={pkg.ecosystem}>{ECO_LABEL[pkg.ecosystem]}</span>
                </div>
                <p className="pkg-tile__tagline">{pkg.tagline}</p>
                <div className="pkg-tile__foot">
                    <span>
                        {pkg.components_count > 0
                            ? `${pkg.components_count} component${pkg.components_count === 1 ? "" : "s"}`
                            : pkg.kind === "bridge" ? "bridge" : "surface"}
                    </span>
                    <span className="pkg-tile__explore">Explore →</span>
                </div>
            </div>
        </Link>
    );
}

/** The visual at the top of a preview tile — a per-package inline mini-preview. */
function PreviewVisual({ pkg }: { pkg: Pkg }) {
    return (
        <div className="pkg-tile__preview">
            <PkgPreview slug={pkg.slug} />
        </div>
    );
}

const VIOLET = "#8b5cf6";
const AMBER = "#f59e0b";
const SKY = "#0ea5e9";

/**
 * Per-package mini-visual — a tiny, recognizable thumbnail of what the package
 * does, rendered from primitives (no external screenshots). Ported from the
 * design mockup's `PkgPreview`. Unmapped UI packages fall back to a package glyph.
 */
function PkgPreview({ slug }: { slug: string }): ReactNode {
    const map: Record<string, ReactNode> = {
        "react-fancy": (
            <div className="mp" style={{ gap: 6, flexWrap: "wrap", maxWidth: 280 }}>
                <span style={{ background: VIOLET, color: "#fff", fontSize: 11, fontWeight: 600, padding: "5px 11px", borderRadius: 8, display: "inline-flex", gap: 5, alignItems: "center" }}><Icon name="plus" size={11} />Button</span>
                <Badge color="emerald" dot size="sm">live</Badge>
                <Badge color="violet" size="sm">beta</Badge>
                <span className="mp-box" style={{ padding: "5px 9px", fontSize: 10 }}>Card</span>
                <span style={{ width: 26, height: 26, borderRadius: 999, background: VIOLET, color: "#fff", display: "grid", placeItems: "center", fontSize: 10, fontWeight: 600 }}>RK</span>
            </div>
        ),
        "agent-integrations": (
            <div className="mp" style={{ flexDirection: "column", gap: 7 }}>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 11, color: AMBER, fontWeight: 600 }}><Icon name="bot" size={14} />agent · MCP</span>
                <span className="mp" style={{ gap: 5 }}>
                    <span style={{ width: 8, height: 8, borderRadius: 999, background: VIOLET }} />
                    <span style={{ width: 22, height: 3, background: "var(--border-2)" }} />
                    <span style={{ width: 8, height: 8, borderRadius: 999, background: AMBER }} />
                </span>
            </div>
        ),
        "fancy-whiteboard": (
            <div className="mp" style={{ gap: 6 }}>
                <span style={{ width: 50, height: 50, background: "#fde68a", borderRadius: 5, transform: "rotate(-5deg)", padding: 6, fontSize: 8, color: "#713f12" }}>Ship ✨</span>
                <span style={{ width: 50, height: 50, background: "#bae6fd", borderRadius: 5, transform: "rotate(4deg)", padding: 6, fontSize: 8, color: "#0c4a6e" }}>Review</span>
            </div>
        ),
        "fancy-flow": (
            <div className="mp" style={{ gap: 5 }}>
                {[0, 1, 2].map((i) => (
                    <Fragment key={i}>
                        <span className="mp-box" style={{ width: 26, height: 18 }} />
                        {i < 2 && <span style={{ width: 10, height: 2, background: "var(--border-2)" }} />}
                    </Fragment>
                ))}
            </div>
        ),
        "fancy-sheets": (
            <span className="mp-box" style={{ padding: 0, overflow: "hidden" }}>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 22px)" }}>
                    {Array.from({ length: 12 }, (_, i) => (
                        <span key={i} style={{ height: 16, borderRight: "1px solid var(--border-1)", borderBottom: "1px solid var(--border-1)", fontSize: 7, color: "var(--fg-4)", display: "grid", placeItems: "center" }}>{i === 5 ? "=Σ" : ""}</span>
                    ))}
                </div>
            </span>
        ),
        "fancy-slides": (
            <span className="mp-box" style={{ width: 90, height: 54, padding: 8 }}>
                <div style={{ width: "60%", height: 6, background: VIOLET, borderRadius: 2, marginBottom: 5 }} />
                <div style={{ width: "90%", height: 4, background: "var(--bg-3)", borderRadius: 2, marginBottom: 3 }} />
                <div style={{ width: "75%", height: 4, background: "var(--bg-3)", borderRadius: 2 }} />
            </span>
        ),
        "fancy-code": (
            <span className="mp-box" style={{ width: 110, padding: 8, fontFamily: "var(--font-mono)", fontSize: 8.5, lineHeight: 1.5 }}>
                <div><span style={{ color: VIOLET }}>const</span> <span style={{ color: AMBER }}>x</span> = <span style={{ color: "#10b981" }}>42</span>;</div>
                <div style={{ color: "var(--fg-4)" }}>// fancy-code</div>
            </span>
        ),
        "fancy-echarts": (
            <span className="mp" style={{ alignItems: "flex-end", gap: 3, height: 44 }}>
                {[40, 70, 35, 85, 55, 65, 45].map((h, i) => (
                    <span key={i} style={{ width: 7, height: `${h}%`, borderRadius: 2, background: i === 3 ? VIOLET : "var(--bg-3)" }} />
                ))}
            </span>
        ),
        "fancy-term": (
            <span className="mp-box" style={{ width: 120, padding: 8, fontFamily: "var(--font-mono)", fontSize: 9, background: "#0a0a0c", border: "1px solid #27272a", color: "#86efac" }}>
                <span style={{ color: "#71717a" }}>$</span> fancy --help<span className="mp-caret">▋</span>
            </span>
        ),
        "fancy-diff": (
            <span className="mp-box" style={{ width: 120, padding: 0, overflow: "hidden", fontFamily: "var(--font-mono)", fontSize: 8.5 }}>
                <div style={{ padding: "2px 7px", background: "color-mix(in oklch,#ef4444 12%,transparent)", color: "#dc2626" }}>- old line</div>
                <div style={{ padding: "2px 7px", background: "color-mix(in oklch,#10b981 12%,transparent)", color: "#059669" }}>+ new line</div>
            </span>
        ),
        "fancy-artboard": (
            <div className="mp" style={{ gap: 5 }}>
                {[0, 1, 2].map((i) => <span key={i} className="mp-box" style={{ width: 26, height: 34, transform: `rotate(${(i - 1) * 4}deg)` }} />)}
            </div>
        ),
        "fancy-screens": (
            <div className="mp" style={{ gap: 5 }}>
                <span className="mp-box" style={{ width: 36, height: 28 }} />
                <span className="mp-box" style={{ width: 36, height: 28 }} />
            </div>
        ),
        "fancy-pixel": (
            <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 10, fontWeight: 600, color: AMBER, border: `1px solid color-mix(in oklch,${AMBER} 35%,transparent)`, padding: "3px 9px", borderRadius: 999 }}><Icon name="badge-check" size={12} />Verified</span>
        ),
        "fancy-3d": <Icon name="box" size={34} style={{ color: VIOLET }} />,
        "fancy-3d-babylon": (
            <div className="mp" style={{ flexDirection: "column", gap: 4 }}>
                <Icon name="box" size={28} style={{ color: VIOLET }} />
                <span style={{ fontSize: 9, fontWeight: 600, color: "var(--fg-3)" }}>Babylon.js</span>
            </div>
        ),
        "fancy-3d-three": (
            <div className="mp" style={{ flexDirection: "column", gap: 4 }}>
                <Icon name="box" size={28} style={{ color: AMBER }} />
                <span style={{ fontSize: 9, fontWeight: 600, color: "var(--fg-3)" }}>three.js</span>
            </div>
        ),
        "fancy-mlm-ui": (
            // A tiny downline tree: root → two legs, tier-colored.
            <div className="mp" style={{ flexDirection: "column", gap: 3 }}>
                <span style={{ width: 12, height: 12, borderRadius: 999, background: "#14b8a6" }} />
                <span className="mp" style={{ gap: 0 }}>
                    <span style={{ width: 14, height: 2, background: "var(--border-2)", transform: "rotate(35deg)" }} />
                    <span style={{ width: 14, height: 2, background: "var(--border-2)", transform: "rotate(-35deg)" }} />
                </span>
                <span className="mp" style={{ gap: 14 }}>
                    <span style={{ width: 10, height: 10, borderRadius: 999, background: AMBER }} />
                    <span style={{ width: 10, height: 10, borderRadius: 999, background: VIOLET }} />
                </span>
                <span style={{ fontSize: 8.5, fontWeight: 600, color: "#14b8a6" }}>+150 pts · L1</span>
            </div>
        ),
        "fancy-x-files-ui": (
            <span className="mp-box" style={{ width: 120, padding: 8, fontFamily: "var(--font-mono)", fontSize: 8.5, lineHeight: 1.6, textAlign: "left" }}>
                <div style={{ color: "var(--fg-4)" }}># robots.txt</div>
                <div>User-agent: <span style={{ color: VIOLET }}>*</span></div>
                <div>Disallow: <span style={{ color: "#dc2626" }}>/admin</span></div>
            </span>
        ),
        "fancy-cms-ui": (
            // The editor's three panes in miniature: layers | canvas | inspector.
            <div className="mp" style={{ gap: 4, alignItems: "stretch" }}>
                <span className="mp-box" style={{ width: 24, height: 56, padding: 4, display: "flex", flexDirection: "column", gap: 3 }}>
                    {[0, 1, 2, 3].map((i) => (
                        <span key={i} style={{ height: 4, borderRadius: 2, background: i === 0 ? SKY : "var(--bg-3)", marginLeft: i === 0 ? 0 : 4 }} />
                    ))}
                </span>
                <span className="mp-box" style={{ width: 62, height: 56, padding: 7, textAlign: "center" }}>
                    <div style={{ width: "72%", height: 6, background: "var(--fg-3)", borderRadius: 2, margin: "2px auto 4px" }} />
                    <div style={{ width: "88%", height: 4, background: "var(--bg-3)", borderRadius: 2, margin: "0 auto 3px" }} />
                    <div style={{ width: 26, height: 9, background: SKY, borderRadius: 3, margin: "4px auto 0" }} />
                </span>
                <span className="mp-box" style={{ width: 24, height: 56, padding: 4, display: "flex", flexDirection: "column", gap: 3 }}>
                    {[0, 1, 2].map((i) => (
                        <Fragment key={i}>
                            <span style={{ height: 2.5, width: "60%", borderRadius: 2, background: "var(--bg-3)" }} />
                            <span style={{ height: 4, borderRadius: 2, border: "1px solid var(--border-2)" }} />
                        </Fragment>
                    ))}
                </span>
            </div>
        ),
        "catalog-fms": (
            <div className="mp" style={{ gap: 6 }}>
                <span className="mp-box" style={{ padding: "6px 9px", textAlign: "center" }}>
                    <div style={{ fontSize: 11, fontWeight: 700 }}>$29</div>
                    <div style={{ fontSize: 7.5, color: "var(--fg-4)" }}>/month</div>
                </span>
                <span className="mp-box" style={{ padding: "6px 9px", textAlign: "center", borderColor: VIOLET }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: VIOLET }}>$99</div>
                    <div style={{ fontSize: 7.5, color: "var(--fg-4)" }}>/month</div>
                </span>
            </div>
        ),
        "fancy-inertia": (
            <span className="mp-box" style={{ width: 130, padding: 9 }}>
                <div style={{ fontSize: 9, color: "var(--fg-3)", marginBottom: 5 }}>useFancyForm()</div>
                <div className="mp-line" style={{ width: "100%", marginBottom: 4 }} />
                <span style={{ fontSize: 8, padding: "2px 7px", borderRadius: 5, background: VIOLET, color: "#fff" }}>Submit</span>
            </span>
        ),
    };
    return map[slug] ?? <Icon name="package" size={28} style={{ color: "var(--fg-4)" }} />;
}

/** Headless package → install-snippet tile (glyph + $ npm install + links). */
function HeadlessTile({ pkg }: { pkg: Pkg }) {
    const cmd = installCmd(pkg);
    const verb = pkg.npm ? "npm install" : pkg.composer ? "composer require" : "$";
    const target = pkg.npm ?? pkg.composer ?? "";
    return (
        <div
            className="pkg-tile pkg-tile--headless"
            style={{ "--accent": pkg.accent } as CSSProperties}
        >
            {/* Stretched link — the whole tile navigates to the detail page
                WITHOUT nesting <a> in <a>. The GitHub/npm/Packagist anchors below
                are real links; wrapping the tile in a single <Link> would nest
                them → invalid HTML the browser un-nests → React #418 hydration
                mismatch. This overlay covers the tile; the external links sit
                above it via z-index (.pkg-link). */}
            <Link href={`/packages/${pkg.slug}`} className="pkg-tile__stretch" aria-label={pkg.name} />
            <div className="pkg-tile__body">
                <div className="pkg-tile__head">
                    <span className="pkg-glyph">{initials(pkg.name)}</span>
                    <div className="min-w-0">
                        <h3 className="pkg-tile__name">{pkg.name}</h3>
                    </div>
                    <span className="pkg-eco" data-eco={pkg.ecosystem} style={{ marginLeft: "auto" }}>
                        {ECO_LABEL[pkg.ecosystem]}
                    </span>
                </div>
                <div className="pkg-snippet">
                    <span className="pkg-snippet__sigil">$</span>
                    <span className="pkg-snippet__cmd">
                        {target ? <>{verb} <b>{target}</b></> : cmd}
                    </span>
                </div>
                <p className="pkg-tile__tagline">{pkg.tagline}</p>
                <div className="pkg-links">
                    <span className="pkg-tile__explore" style={{ opacity: 1, color: "color-mix(in oklch, var(--accent) 80%, var(--fg-1))" }}>
                        Docs →
                    </span>
                    <a className="pkg-link" href={pkg.repoUrl} target="_blank" rel="noreferrer">GitHub →</a>
                    {pkg.npmUrl && <a className="pkg-link" href={pkg.npmUrl} target="_blank" rel="noreferrer">npm →</a>}
                    {pkg.packagistUrl && <a className="pkg-link" href={pkg.packagistUrl} target="_blank" rel="noreferrer">Packagist →</a>}
                </div>
            </div>
        </div>
    );
}
