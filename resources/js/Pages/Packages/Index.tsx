import { Head, Link } from "@inertiajs/react";
import {
    Button,
    Card,
    Eyebrow,
    Grid,
    Heading,
    Icon,
    Input,
    MultiSwitch,
    StatList,
    Text,
} from "@particle-academy/react-fancy";
import { useMemo, useState, type CSSProperties } from "react";
import { Layout } from "../Layout";
import {
    BASKETS,
    BasketTag,
    ECO_LABEL,
    LaneChip,
    Snippet,
    deScope,
    initials,
    type Basket,
    type Eco,
} from "./basket";
import { PkgPreview } from "./PkgPreview";

/**
 * The /packages listing.
 *
 * ── The basket language ─────────────────────────────────────────────────
 * The redesign's load-bearing device, repeated on every card: a package is
 * either a UI SURFACE you can look at (violet) or a BACKEND that renders
 * nothing (teal). The two cards at the top of the page state the split AND act
 * as the primary filter, so the distinction is a control rather than a caption.
 * `basket` comes from the server (derived from `kind`) — see PackagesController.
 *
 * ── Composition ─────────────────────────────────────────────────────────
 * Everything here is react-fancy: Card / Button / Badge / Input / MultiSwitch /
 * Heading / Text / StatList / Eyebrow / Grid / Icon, restyled through
 * showcase/packages.css. This page is the kit's own catalogue — a hand-rolled
 * card here would be the page that sells the kit not using it, and the gap it
 * papers over would never get filed.
 */

/** One package inside a family card. */
type Member = {
    slug: string;
    name: string;
    tagline: string;
    role: string;
    basket: Basket;
    language: string;
    ecosystem: Eco;
    components_count: number;
    href: string | null;
    accent: string;
};

/**
 * One merged catalog entry — emitted by PackagesController::index(). Every
 * package (UI grid + companions) carries the design classification
 * (group / accent / ecosystem / kind / basket) the listing groups + styles by.
 */
type Pkg = {
    slug: string;
    name: string;
    tagline: string;
    language: string;
    core: boolean;
    group: Group;
    accent: string;
    ecosystem: Eco;
    kind: "ui" | "bridge" | "headless" | "block";
    /** Which lane this listing sits in — "both" only ever for a family. */
    basket: Basket;
    /** How many of a family's members are UI surfaces / headless backends. */
    ui_count: number;
    backend_count: number;
    components_count: number;
    stars: number | null;
    npm: string | null;
    composer: string | null;
    pypi?: string | null;
    download: string | null;
    repoUrl: string | null;
    npmUrl: string | null;
    packagistUrl: string | null;
    /** True for a consolidated family card (related packages shown as one). */
    family?: boolean;
    /** The languages a family spans, e.g. ["PHP", "Node / TypeScript"]. */
    languages?: string[] | null;
    /** How many packages the family contains. */
    member_count?: number;
    /** The family's members, in declaration order. */
    members?: Member[];
    /** Where this card links — a package page, or the family page. */
    href: string;
};

type Group = "core" | "surfaces" | "documents" | "commerce" | "platform" | "tooling";
type KindFilter = "all" | "ui" | "backend";
type EcoFilter = "all" | "ts" | "php" | "polyglot";

const GROUP_ORDER: Group[] = ["core", "surfaces", "documents", "commerce", "platform", "tooling"];
const GROUP_META: Record<Group, { title: string; blurb: string }> = {
    core: {
        title: "Start here",
        blurb: "The stack every Fancy app begins with.",
    },
    surfaces: {
        title: "Surfaces",
        blurb: "Rich, controlled UI humans and agents inhabit together — whiteboard, flow, sheets, slides, code, terminal, charts, maps, 3D — driven over MCP bridges, never DOM scraping.",
    },
    documents: {
        title: "Documents",
        blurb: "Read and write real office files from an agent — xlsx, pptx, docx — plus the shared document and file cores they are built on.",
    },
    commerce: {
        title: "Commerce & growth",
        blurb: "Sell, gate, and grow — Stripe catalog, feature management and quotas, gamification, and multi-level referral engines.",
    },
    platform: {
        title: "Web platform",
        blurb: "How your app meets the web and its crawlers — SEO on the first byte, well-known + agent-facing files, interaction analytics, verification, and installability.",
    },
    tooling: {
        title: "Agents & tooling",
        blurb: "The workbench — Git as an agent-driveable surface, MCP servers and relays, the source-vendoring CLI, and the shared plumbing underneath.",
    },
};

/** Tile title — de-scoped so "@particle-academy/x" reads as "x" beside the
 *  family display names, instead of a ragged mix of both. */
function displayName(p: Pkg | Member): string {
    return "family" in p && p.family ? p.name : deScope(p.name);
}

function installCmd(p: Pkg): string {
    if (p.npm) return `npm install ${p.npm}`;
    if (p.composer) return `composer require ${p.composer}`;
    if (p.download) return p.download;
    return p.name;
}

/** The slug whose thumbnail stands for this listing — a family shows its
 *  flagship surface, because "fancy-git" has no picture but fancy-git-ui does. */
function previewSlug(p: Pkg): string {
    if (!p.family) return p.slug;
    return (p.members ?? []).find((m) => m.basket === "ui" && m.components_count > 0)?.slug
        ?? (p.members ?? []).find((m) => m.basket === "ui")?.slug
        ?? p.slug;
}

export default function PackagesIndex({ packages }: { packages: Pkg[] }) {
    const [query, setQuery] = useState("");
    const [basket, setBasket] = useState<KindFilter>("all");
    const [eco, setEco] = useState<EcoFilter>("all");

    const totalComponents = packages.reduce((s, p) => s + p.components_count, 0);
    // Families collapse several packages into one card, so count the members —
    // "37 packages" would undercount the ~70 we actually publish.
    const totalPackages = packages.reduce((s, p) => s + (p.member_count ?? 1), 0);

    // Basket totals count LISTINGS, and a family that spans both is counted in
    // each — it genuinely offers you both, and dropping it from one lane would
    // make the two numbers describe a suite that does not exist.
    const basketTotals = {
        ui: packages.filter((p) => p.basket !== "backend").length,
        backend: packages.filter((p) => p.basket !== "ui").length,
    };

    const filtering = query.trim() !== "" || basket !== "all" || eco !== "all";

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        return packages.filter((p) => {
            if (basket !== "all" && p.basket !== basket && p.basket !== "both") return false;
            if (eco !== "all") {
                const memberMatch = (p.members ?? []).some((m) => m.ecosystem === eco);
                if (p.ecosystem !== eco && !memberMatch) return false;
            }
            if (q) {
                const hay = `${p.name} ${p.slug} ${p.tagline} ${(p.members ?? []).map((m) => m.name).join(" ")}`;
                if (!hay.toLowerCase().includes(q)) return false;
            }
            return true;
        });
    }, [packages, query, basket, eco]);

    // Fancy Core leads the page as a full-width band rather than a lone tile in
    // an otherwise-empty grid — until a filter is on, at which point it is just
    // another result and lists as a card like everything else.
    const core = filtered.filter((p) => p.group === "core");

    const groups = GROUP_ORDER.filter((g) => g !== "core" || filtering)
        .map((g) => {
            // Every section lists alphabetically by slug (the clean, de-scoped
            // id), so the catalog is scannable A→Z within each theme.
            const items = filtered.filter((p) => p.group === g).sort((a, b) => a.slug.localeCompare(b.slug));
            return { group: g, meta: GROUP_META[g], items };
        })
        .filter((s) => s.items.length > 0);

    const clear = () => {
        setQuery("");
        setBasket("all");
        setEco("all");
    };

    return (
        <Layout>
            <Head title="Packages · Fancy UI" />

            <header className="pkgs-head">
                <div>
                    <Heading as="h1" size="2xl" className="pkgs-head__title">Packages</Heading>
                    <Text className="pkgs-head__sub">
                        Every Fancy UI package — UI surfaces with a live preview, headless backends with a one-line
                        install. Related packages are grouped as one family; each card opens its full page, with
                        per-component demos.
                    </Text>
                </div>
                <StatList
                    className="pkgs-stats"
                    items={[
                        { key: "packages", value: totalPackages, label: "packages" },
                        { key: "listings", value: packages.length, label: "listings" },
                        { key: "components", value: totalComponents, label: "components" },
                        { key: "licence", value: "MIT", label: "licensed" },
                    ]}
                />
            </header>

            <div className="basket-band">
                {(["ui", "backend"] as const).map((k) => (
                    <BasketCard
                        key={k}
                        basket={k}
                        count={basketTotals[k]}
                        on={basket === k}
                        onPick={() => setBasket(basket === k ? "all" : k)}
                    />
                ))}
            </div>

            <div className="pkgs-toolbar">
                <Input
                    type="search"
                    className="pkgs-search"
                    value={query}
                    onValueChange={setQuery}
                    placeholder="Search packages and families…"
                    aria-label="Search packages"
                    leading={<Icon name="search" size="sm" />}
                />
                <span className="pkgs-toolbar__grow" />
                {/* react-fancy 5.23.0 (#24, #25): `style` is typeable on
                    MultiSwitch now, so the lane colour goes on the control
                    itself instead of a wrapper, and `labelHidden` names the
                    radiogroup for screen readers without the design having to
                    draw a label. Both of these were workarounds here until
                    that release. */}
                <MultiSwitch
                    size="sm"
                    className="pkgs-switch"
                    label="Filter by basket"
                    labelHidden
                    style={{ "--acc": basket === "backend" ? BASKETS.backend.cssAccent : BASKETS.ui.cssAccent } as CSSProperties}
                    value={basket}
                    onValueChange={(v) => setBasket(v as KindFilter)}
                    list={[
                        { value: "all", label: "All kinds" },
                        { value: "ui", label: "UI" },
                        { value: "backend", label: "Headless" },
                    ]}
                />
                <MultiSwitch
                    size="sm"
                    className="pkgs-switch"
                    label="Filter by ecosystem"
                    labelHidden
                    value={eco}
                    onValueChange={(v) => setEco(v as EcoFilter)}
                    list={[
                        { value: "all", label: "All" },
                        { value: "ts", label: "TypeScript" },
                        { value: "php", label: "PHP" },
                    ]}
                />
            </div>

            {!filtering && core.map((p) => <StartBand key={p.slug} pkg={p} />)}

            {groups.length === 0 && core.length === 0 && (
                <div className="pkgs-empty">
                    <Icon name="search-x" size="xl" />
                    <Text weight="semibold">No packages match your filters.</Text>
                    <Button variant="ghost" size="sm" icon="x" onClick={clear}>Clear filters</Button>
                </div>
            )}

            {groups.map(({ group, meta, items }) => {
                const ui = items.filter((p) => p.basket !== "backend").length;
                const be = items.filter((p) => p.basket !== "ui").length;
                return (
                    <section key={group} className="pkg-group">
                        <div className="pkg-group__head">
                            <Heading as="h2" size="lg" className="pkg-group__title">{meta.title}</Heading>
                            <span className="pkg-group__count">{items.length}</span>
                            <span className="pkg-group__mix">
                                {ui > 0 && <LaneChip basket="ui" label={`${ui} UI`} />}
                                {be > 0 && <LaneChip basket="backend" label={`${be} backend`} />}
                            </span>
                        </div>
                        <Text size="sm" className="pkg-group__blurb">{meta.blurb}</Text>
                        <Grid cols={3} gap="sm" className="pkg-grid">
                            {items.map((p) => <ListingCard key={p.slug} pkg={p} />)}
                        </Grid>
                    </section>
                );
            })}
        </Layout>
    );
}

/**
 * One of the two baskets, as a control.
 *
 * A <Card interactive> in button clothing rather than a <button> wrapping a
 * card: the card IS the affordance, and `aria-pressed` + the keyboard handler
 * are what make a div-rooted primitive an honest toggle.
 */
function BasketCard({
    basket,
    count,
    on,
    onPick,
}: {
    basket: "ui" | "backend";
    count: number;
    on: boolean;
    onPick: () => void;
}) {
    const b = BASKETS[basket];
    return (
        <Card
            interactive
            className="basket-card"
            role="button"
            tabIndex={0}
            aria-pressed={on}
            onClick={onPick}
            onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onPick();
                }
            }}
            style={{ "--acc": b.cssAccent } as CSSProperties}
        >
            <div className="bc-head">
                <span className="bc-ic"><Icon name={b.icon} size="md" /></span>
                <span className="bc-title">{b.label}</span>
                <span className="bc-n">{count} listings</span>
            </div>
            <p className="bc-line">{b.line}</p>
            {basket === "ui" ? (
                <div className="bc-thumbs">
                    {["react-fancy", "fancy-sheets", "fancy-echarts", "fancy-whiteboard"].map((s) => (
                        <span className="bc-thumb" key={s}><PkgPreview slug={s} /></span>
                    ))}
                </div>
            ) : (
                <div className="bc-thumbs bc-thumbs--be">
                    <Snippet cmd="composer require particle-academy/holy-sheet" />
                    <Snippet cmd="npm install @particle-academy/fancy-query" />
                </div>
            )}
            <span className="bc-act">
                {on ? "Showing" : "Show"} {b.label} only
                <Icon name={on ? "check" : "arrow-right"} size="xs" />
            </span>
        </Card>
    );
}

/**
 * Fancy Core, opened up — the one listing that leads with its members rather
 * than a thumbnail, because "start here" is only useful if you can see what
 * "here" contains.
 */
function StartBand({ pkg }: { pkg: Pkg }) {
    const members = pkg.members ?? [];
    const flagship = members.find((m) => m.components_count > 0) ?? members[0];
    return (
        <Card className="start-card" style={{ "--acc": pkg.accent } as CSSProperties}>
            <div className="start-card__grid">
                <div>
                    <Eyebrow className="start-card__eyebrow" label="Start here" />
                    <Heading as="h2" size="xl" className="start-card__title">{pkg.name}</Heading>
                    <Text size="sm" className="start-card__blurb">{pkg.tagline}</Text>
                    <div style={{ marginTop: "var(--space-4)" }}>
                        <BasketTag basket={pkg.basket} languages={pkg.languages} />
                    </div>
                    <div className="start-card__cta">
                        {flagship?.href && (
                            <Button as={Link} href={flagship.href} color="violet" icon="layout-grid" iconTrailing="arrow-right">
                                {flagship.components_count > 0
                                    ? `Browse ${flagship.components_count} component previews`
                                    : "Open the surface"}
                            </Button>
                        )}
                        <Button as={Link} href={pkg.href} variant="ghost" icon="layers">
                            See all {pkg.member_count ?? members.length} packages
                        </Button>
                    </div>
                </div>
                <div className="start-rows">
                    {members.map((m) => (
                        <Link
                            key={m.slug}
                            href={m.href ?? pkg.href}
                            className="start-row"
                            data-basket={m.basket}
                        >
                            <span className={`row-dot row-dot--${m.basket}`} />
                            <span className="start-row__name">{displayName(m)}</span>
                            <span className="start-row__role">{m.role}</span>
                            <span className="start-row__act">
                                {m.components_count > 0 ? `${m.components_count} previews →` : "API →"}
                            </span>
                        </Link>
                    ))}
                </div>
            </div>
        </Card>
    );
}

/**
 * One listing — a single package or a whole family.
 *
 * UI listings lead with a preview thumbnail and a "browse the previews" step;
 * headless ones lead with the install line and a "read the API surface" step.
 * Same card, same footer, opposite lane.
 */
function ListingCard({ pkg }: { pkg: Pkg }) {
    const ui = pkg.basket !== "backend";
    const isFamily = !!pkg.family;
    const lane = ui ? "ui" : "backend";
    const cta = ctaLabel(pkg);

    return (
        <Card
            interactive
            padding="none"
            className="lcard"
            style={{ "--acc": pkg.accent } as CSSProperties}
        >
            {/* Stretched link — the whole card navigates WITHOUT nesting <a> in
                <a>. The external links in the footer are real anchors; wrapping
                the card in a single <Link> would nest them → invalid HTML the
                browser un-nests → React #418 hydration mismatch. */}
            <Link href={pkg.href} className="lcard__stretch" aria-label={displayName(pkg)} />

            <div className="lcard__tag">
                <BasketTag basket={pkg.basket} languages={isFamily ? pkg.languages : null} />
            </div>

            {ui ? (
                <Card.Media height={108} className="lcard__pv">
                    <span className="mp-slot"><PkgPreview slug={previewSlug(pkg)} /></span>
                    {isFamily && <span className="lcard__pv-stack" />}
                </Card.Media>
            ) : (
                <Card.Media height={72} className="lcard__pv lcard__pv--be">
                    <Snippet cmd={installCmd(pkg)} />
                    {isFamily && <span className="lcard__pv-stack" />}
                </Card.Media>
            )}

            <Card.Body className="lcard__body">
                <div className="lcard__row">
                    <span className="pkg-glyph pkg-glyph--sm">
                        {initials(pkg.name)}
                    </span>
                    <h3 className={`lcard__name${ui ? "" : " lcard__name--mono"}`}>{displayName(pkg)}</h3>
                    <span className="pkg-eco" data-eco={pkg.ecosystem}>{ECO_LABEL[pkg.ecosystem]}</span>
                    {isFamily && (
                        <span className="fam-count">{pkg.member_count} packages · one product</span>
                    )}
                </div>
                <p className="lcard__tagline">{pkg.tagline}</p>
                {isFamily && (
                    <div className="fam-split">
                        {pkg.ui_count > 0 && (
                            <span className="fam-lane" data-basket="ui">
                                <Icon name="monitor-play" size="xs" />
                                {pkg.ui_count} UI{pkg.components_count > 0 ? ` · ${pkg.components_count} previews` : ""}
                            </span>
                        )}
                        {pkg.backend_count > 0 && (
                            <span className="fam-lane" data-basket="backend">
                                <Icon name="server" size="xs" />
                                {pkg.backend_count} backend
                            </span>
                        )}
                    </div>
                )}
            </Card.Body>

            <Card.Footer className="lcard__cta">
                <Button
                    size="sm"
                    color={BASKETS[lane].color}
                    className="lcard__go"
                    icon={cta.icon}
                    iconTrailing="arrow-right"
                    tabIndex={-1}
                    aria-hidden
                >
                    {cta.label}
                </Button>
                {pkg.repoUrl && !isFamily ? (
                    <a className="lcard__second pkg-link" href={pkg.repoUrl} target="_blank" rel="noreferrer">
                        GitHub →
                    </a>
                ) : (
                    <span className="lcard__second">Docs</span>
                )}
            </Card.Footer>
        </Card>
    );
}

/** The one obvious next step for this listing, worded for its lane. */
function ctaLabel(pkg: Pkg): { label: string; icon: string } {
    if (pkg.family) return { label: `Explore ${pkg.name}`, icon: "layers" };
    if (pkg.basket === "backend") return { label: "Read the API surface", icon: "terminal" };
    return pkg.components_count > 0
        ? { label: `Browse ${pkg.components_count} preview${pkg.components_count === 1 ? "" : "s"}`, icon: "layout-grid" }
        : { label: "Open package", icon: "layout-grid" };
}

export type { Member, Pkg };
