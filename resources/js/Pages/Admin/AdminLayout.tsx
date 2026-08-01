import { Fragment, type ReactNode, useEffect, useState } from "react";
import { Link, router, usePage } from "@inertiajs/react";
import { Badge, Dropdown, Icon, MobileMenu } from "@particle-academy/react-fancy";
import { currentTheme, toggleTheme } from "../../showcase-theme";
import { PlayerAvatar, type PlayerIdentityData } from "../../components/PlayerIdentity";
import "../../../css/admin.css";

type AdminAuth = { user: { name: string; github_username: string | null; avatar_url: string | null; identity: PlayerIdentityData; is_admin?: boolean } | null };
type AdminShared = { auth: AdminAuth; pending?: number };

type NavItem = { label: string; icon: string; href: string; badge?: number };
type NavGroup = { section?: string; items: NavItem[] };

const NAV: NavGroup[] = [
    { items: [{ label: "Dashboard", icon: "layout-dashboard", href: "/admin" }] },
    {
        section: "Catalog",
        items: [
            { label: "Plans", icon: "credit-card", href: "/admin/plans" },
            { label: "Products", icon: "package", href: "/admin/products" },
            { label: "Features", icon: "toggle-right", href: "/admin/features" },
        ],
    },
    {
        section: "Engagement",
        items: [
            { label: "Gamification", icon: "award", href: "/admin/gamification" },
            { label: "Coin Shop", icon: "coins", href: "/admin/shop" },
            { label: "Referral Program", icon: "git-merge", href: "/admin/mlm" },
        ],
    },
    {
        section: "Community",
        items: [
            { label: "Sites", icon: "activity", href: "/admin/sites" },
            { label: "Users", icon: "users", href: "/admin/users" },
        ],
    },
    {
        section: "System",
        items: [
            { label: "Settings", icon: "settings", href: "/admin/settings" },
            { label: "Well-known files", icon: "file-text", href: "/admin/well-known-files" },
        ],
    },
];

/** group + crumb for the topbar breadcrumb, keyed by the leading path segment. */
const CRUMB: Record<string, { group: string; crumb: string }> = {
    "": { group: "Overview", crumb: "Dashboard" },
    plans: { group: "Catalog", crumb: "Plans" },
    products: { group: "Catalog", crumb: "Products" },
    features: { group: "Catalog", crumb: "Features" },
    gamification: { group: "Engagement", crumb: "Gamification" },
    shop: { group: "Engagement", crumb: "Coin Shop" },
    mlm: { group: "Engagement", crumb: "Referral Program" },
    heuristics: { group: "Analytics", crumb: "Heuristics" },
    sites: { group: "Community", crumb: "Sites" },
    users: { group: "Community", crumb: "Users" },
    submissions: { group: "Community", crumb: "Submissions" },
    settings: { group: "System", crumb: "Settings" },
    "well-known-files": { group: "System", crumb: "Well-known files" },
};

export function AdminLayout({ children }: { children: ReactNode }) {
    const { props, url } = usePage<AdminShared>();
    const user = props.auth?.user ?? null;
    const pending = props.pending ?? 0;
    const path = url.replace(/\/+$/, "").replace(/\?.*$/, ""); // strip trailing slash + query
    const seg = path.replace(/^\/admin\/?/, "").split("/")[0] ?? "";
    const meta = CRUMB[seg] ?? { group: "Admin", crumb: seg };

    const [collapsed, setCollapsed] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);

    // `collapsed` (the desktop rail shrinking to icons) and `mobileOpen` (the
    // drawer) are different features that happen to share one button, so the
    // button has to know which viewport it is on. Start false — matching the
    // server render — and sync after mount, same as `theme` below; reading
    // matchMedia during render would mismatch on hydration.
    const [isMobile, setIsMobile] = useState(false);
    useEffect(() => {
        // Keep in step with the `max-width: 860px` block in admin.css, which is
        // what actually hides the rail.
        const mq = window.matchMedia("(max-width: 860px)");
        const sync = () => {
            setIsMobile(mq.matches);
            // Widening past the breakpoint must also close the drawer. The
            // flyout is portalled and `position: fixed`, so a drawer left open
            // does not tuck itself away with the layout — it hangs over the
            // desktop admin with the body still scroll-locked.
            if (!mq.matches) {
                setMobileOpen(false);
            }
        };
        sync();
        mq.addEventListener("change", sync);
        return () => mq.removeEventListener("change", sync);
    }, []);

    // Close on navigation. Belt and braces: the admin shell remounts on an
    // Inertia visit today, but that is an implementation detail of how the
    // pages attach their layout, not a guarantee — and a drawer left open
    // hangs over the page you just arrived at.
    useEffect(() => setMobileOpen(false), [path]);

    // Start "dark" so the server render and the client's FIRST render agree —
    // reading the real theme during render (currentTheme() → localStorage/media
    // query) mismatches on hydration whenever the user is in light mode, and a
    // #418 here discards the whole server-rendered admin layout ("page breaks,
    // then reforms"). Same pattern as Pages/Layout.tsx: sync post-mount.
    const [theme, setTheme] = useState<"light" | "dark">("dark");
    useEffect(() => {
        setTheme(currentTheme());
        const onChange = (e: Event) => setTheme((e as CustomEvent<"light" | "dark">).detail);
        window.addEventListener("fancy-theme-change", onChange as EventListener);
        return () => window.removeEventListener("fancy-theme-change", onChange as EventListener);
    }, []);

    const isActive = (href: string) => (href === "/admin" ? path === "/admin" : path.startsWith(href));

    return (
        <div className={`admin-root${collapsed ? " collapsed" : ""}`}>
            {/* The rail. Hidden outright below 860px, where the drawer below
                replaces it — so `collapsed` is now purely a desktop concern. */}
            <aside className="sb">
                <Link href="/admin" className="sb-brand">
                    <span className="sb-mark">F</span>
                    <span className="txt">
                        <span className="name">Particle Academy</span>
                        <span className="sub">admin · v2.4</span>
                    </span>
                </Link>
                <nav className="sb-nav">
                    {NAV.map((grp, gi) => (
                        <div key={gi} style={{ display: "contents" }}>
                            {grp.section && <div className="sb-section">{grp.section}</div>}
                            {grp.items.map((it) => {
                                const badge = it.href === "/admin/sites" && pending > 0 ? pending : it.badge;
                                return (
                                    <Link key={it.href} href={it.href} className={`sb-item${isActive(it.href) ? " active" : ""}`} title={collapsed ? it.label : undefined}>
                                        <Icon name={it.icon} size={18} className="sb-ico" />
                                        <span className="label">{it.label}</span>
                                        {badge ? <span className="badge-slot"><Badge color="violet" size="sm">{String(badge)}</Badge></span> : null}
                                    </Link>
                                );
                            })}
                        </div>
                    ))}
                </nav>
                <div className="sb-foot">
                    <a className="sb-item" href="/docs">
                        <Icon name="book-open" size={18} className="sb-ico" />
                        <span className="label">Documentation</span>
                    </a>
                </div>
            </aside>

            <div className="admin-main">
                <header className="tb">
                    {/* One button, two jobs, decided by viewport. It used to do
                        BOTH at once — `setCollapsed` and `setMobileOpen` fired
                        together — so opening the drawer on a phone also
                        collapsed it, and you got 256px of unlabelled icons. */}
                    <button
                        className="btn btn-ghost"
                        style={{ height: 34, width: 34, padding: 0, display: "grid", placeItems: "center" }}
                        onClick={() => (isMobile ? setMobileOpen((m) => !m) : setCollapsed((c) => !c))}
                        aria-label={isMobile ? (mobileOpen ? "Close menu" : "Open menu") : "Toggle sidebar"}
                        aria-expanded={isMobile ? mobileOpen : undefined}
                        aria-controls={isMobile ? "admin-mobile-nav" : undefined}
                    >
                        <Icon name="panel-left" size={17} />
                    </button>
                    <div className="tb-crumb">
                        <span>{meta.group}</span>
                        <Icon name="chevron-right" size={14} style={{ color: "var(--fg-4)" }} />
                        <b>{meta.crumb}</b>
                    </div>
                    <div style={{ flex: 1 }} />
                    <div
                        className="tb-search"
                        onClick={() => window.dispatchEvent(new KeyboardEvent("keydown", { key: "k", metaKey: true, ctrlKey: true }))}
                    >
                        <Icon name="search" size={15} />
                        <span>Search…</span>
                        <span className="kbd">⌘K</span>
                    </div>
                    <button
                        className="btn btn-ghost"
                        style={{ height: 34, width: 34, padding: 0, display: "grid", placeItems: "center" }}
                        onClick={() => setTheme(toggleTheme())}
                        aria-label="Toggle theme"
                    >
                        <Icon name={theme === "dark" ? "sun" : "moon"} size={16} />
                    </button>
                    {user && (
                        <Dropdown>
                            <Dropdown.Trigger>
                                <button style={{ display: "flex", alignItems: "center", gap: 8, border: "none", background: "transparent", cursor: "pointer", padding: 2 }}>
                                    <PlayerAvatar player={user.identity} size="sm" />
                                    <Icon name="chevron-down" size={14} style={{ color: "var(--fg-3)" }} />
                                </button>
                            </Dropdown.Trigger>
                            <Dropdown.Items>
                                <Dropdown.Item onClick={() => router.visit("/profile")}>Your profile</Dropdown.Item>
                                <Dropdown.Item onClick={() => router.visit("/")}>View showcase site</Dropdown.Item>
                                <Dropdown.Separator />
                                <Dropdown.Item danger onClick={() => router.post("/auth/logout")}>Sign out</Dropdown.Item>
                            </Dropdown.Items>
                        </Dropdown>
                    )}
                </header>

                <main className="admin-content">{children}</main>
            </div>

            {/* The admin nav for every viewport too narrow to show the rail.
                react-fancy's own MobileMenu, not a hand-rolled drawer — the
                showcase should be running the kit it sells, and this brings the
                body-scroll lock, Escape-to-close and backdrop the CSS-transform
                version never had. Same NAV array as the rail, so a link added
                there appears here too. */}
            <div id="admin-mobile-nav">
                <MobileMenu.Flyout
                    open={mobileOpen}
                    onClose={() => setMobileOpen(false)}
                    side="left"
                    title="Particle Academy · admin"
                >
                    {NAV.map((grp, gi) => (
                        <Fragment key={gi}>
                            {grp.section && <div className="admin-mm-section">{grp.section}</div>}
                            {grp.items.map((it) => {
                                const badge = it.href === "/admin/sites" && pending > 0 ? pending : it.badge;
                                return (
                                    <MobileMenu.Item
                                        key={it.href}
                                        href={it.href}
                                        className="admin-mm-item"
                                        active={isActive(it.href)}
                                        icon={<Icon name={it.icon} size={18} />}
                                        badge={badge ? <Badge color="violet" size="sm">{String(badge)}</Badge> : undefined}
                                    >
                                        {it.label}
                                    </MobileMenu.Item>
                                );
                            })}
                        </Fragment>
                    ))}

                    {/* The rail's footer link, kept reachable rather than lost. */}
                    <div className="admin-mm-section">Help</div>
                    <MobileMenu.Item
                        href="/docs"
                        className="admin-mm-item"
                        icon={<Icon name="book-open" size={18} />}
                    >
                        Documentation
                    </MobileMenu.Item>
                </MobileMenu.Flyout>
            </div>
        </div>
    );
}

/** Helper so a page can opt into the persistent admin shell with one line. */
export const adminLayout = (page: ReactNode) => <AdminLayout>{page}</AdminLayout>;
