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

    const groups = GROUP_ORDER.map((g) => ({
        group: g,
        meta: GROUP_META[g],
        items: filtered.filter((p) => p.group === g),
    })).filter((s) => s.items.length > 0);

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
        <Link
            href={`/packages/${pkg.slug}`}
            className="pkg-tile pkg-tile--headless"
            style={{ "--accent": pkg.accent } as CSSProperties}
        >
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
                    <a href={pkg.repoUrl} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()}>GitHub →</a>
                    {pkg.npmUrl && <a href={pkg.npmUrl} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()}>npm →</a>}
                    {pkg.packagistUrl && <a href={pkg.packagistUrl} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()}>Packagist →</a>}
                </div>
            </div>
        </Link>
    );
}
