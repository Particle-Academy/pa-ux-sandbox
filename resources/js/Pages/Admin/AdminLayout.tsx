import { type ReactNode, useEffect, useState } from "react";
import { Link, router, usePage } from "@inertiajs/react";
import { Avatar, Badge, Dropdown, Icon } from "@particle-academy/react-fancy";
import { currentTheme, toggleTheme } from "../../showcase-theme";
import "../../../css/admin.css";

type AdminAuth = { user: { name: string; github_username: string | null; avatar_url: string | null; is_admin?: boolean } | null };
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
        ],
    },
    {
        section: "Community",
        items: [
            { label: "Users", icon: "users", href: "/admin/users" },
            { label: "Submissions", icon: "image", href: "/admin/submissions" },
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
    users: { group: "Community", crumb: "Users" },
    submissions: { group: "Community", crumb: "Submissions" },
};

function initials(name: string): string {
    return name.split(/\s+/).slice(0, 2).map((p) => p[0]?.toUpperCase() ?? "").join("") || "?";
}

export function AdminLayout({ children }: { children: ReactNode }) {
    const { props, url } = usePage<AdminShared>();
    const user = props.auth?.user ?? null;
    const pending = props.pending ?? 0;
    const path = url.replace(/\/+$/, "").replace(/\?.*$/, ""); // strip trailing slash + query
    const seg = path.replace(/^\/admin\/?/, "").split("/")[0] ?? "";
    const meta = CRUMB[seg] ?? { group: "Admin", crumb: seg };

    const [collapsed, setCollapsed] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);
    const [theme, setTheme] = useState<"light" | "dark">(() => (typeof window === "undefined" ? "dark" : currentTheme()));
    useEffect(() => {
        const onChange = (e: Event) => setTheme((e as CustomEvent<"light" | "dark">).detail);
        window.addEventListener("fancy-theme-change", onChange as EventListener);
        return () => window.removeEventListener("fancy-theme-change", onChange as EventListener);
    }, []);

    const isActive = (href: string) => (href === "/admin" ? path === "/admin" : path.startsWith(href));

    return (
        <div className={`admin-root${collapsed ? " collapsed" : ""}${mobileOpen ? " mobile-open" : ""}`}>
            {mobileOpen && <div className="admin-mobile-scrim" onClick={() => setMobileOpen(false)} />}

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
                                const badge = it.href === "/admin/submissions" && pending > 0 ? pending : it.badge;
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
                    <button
                        className="btn btn-ghost"
                        style={{ height: 34, width: 34, padding: 0, display: "grid", placeItems: "center" }}
                        onClick={() => {
                            setCollapsed((c) => !c);
                            setMobileOpen((m) => !m);
                        }}
                        aria-label="Toggle sidebar"
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
                                    <Avatar src={user.avatar_url ?? undefined} fallback={initials(user.name)} size="sm" />
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
        </div>
    );
}

/** Helper so a page can opt into the persistent admin shell with one line. */
export const adminLayout = (page: ReactNode) => <AdminLayout>{page}</AdminLayout>;
