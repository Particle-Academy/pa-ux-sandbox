import { ReactNode, useEffect, useState } from "react";
import { Link, router, usePage } from "@inertiajs/react";
import {
    Button,
    Callout,
    Dropdown,
    Profile,
    Tooltip,
} from "@particle-academy/react-fancy";
import { Moon, Sun, Sparkles, Check, Bot } from "lucide-react";
import {
    useFancyTransition,
    FANCY_TRANSITION_LABELS,
} from "@particle-academy/fancy-inertia";
import { FancyInertiaPwa } from "@particle-academy/fancy-inertia/pwa";
import { CoBrowsePresence } from "@particle-academy/agent-integrations";
import { currentTheme, toggleTheme } from "../showcase-theme";
import { CommandPalette } from "./CommandPalette";
import { useCoBrowse } from "../agent/CoBrowseProvider";
import { avatarFrameClass, type CosmeticSlots } from "../lib/cosmetics";
import { ActiveUsersOverlay } from "../components/ActiveUsersOverlay";
import { AgentAnalyticsSink } from "../components/AgentAnalyticsSink";

type Flash = {
    auth_error?: string | null;
    submitted?: string | null;
    success?: string | null;
    error?: string | null;
};
type PlayerSummary = {
    coins: number;
    level: number;
    levelName: string | null;
    totalXp: number;
    nextThreshold: number | null;
    progress: number;
    cosmetics: CosmeticSlots;
    optedOut: boolean;
    pro: boolean;
    proSource: "subscription" | "prize" | null;
};
type AuthUser = {
    name: string;
    github_username: string | null;
    avatar_url: string | null;
    player?: PlayerSummary | null;
};
// `admin` is a server-computed link (from the `admin` Gate), present only for
// admins. It is deliberately NOT the model's `is_admin` flag and is a separate
// prop from `user`; it's a UI hint only — access is enforced server-side.
type Auth = { user: AuthUser | null; admin?: { url: string } | null };
type SharedProps = { flash: Flash; auth: Auth; csrfToken: string };

const NAV_ITEMS: Array<{ to: string; label: string; match: string }> = [
    { to: "/docs", label: "Docs", match: "docs" },
    { to: "/packages", label: "Packages", match: "packages" },
    { to: "/fancy-tui", label: "TUI", match: "fancy-tui" },
    { to: "/starter-kits", label: "Starter Kits", match: "starter-kits" },
    { to: "/inspiration", label: "Inspiration", match: "inspiration" },
    { to: "/showcase", label: "Showcase", match: "showcase" },
    { to: "/shop", label: "Shop", match: "shop" },
    { to: "/leaderboard", label: "Leaderboard", match: "leaderboard" },
];

export function Layout({
    children,
    bleed = false,
}: {
    children: ReactNode;
    /**
     * Full-bleed pages (the landing + playground) own their own `.section` /
     * `.container` rhythm and must sit flush under the sticky nav. When true the
     * `<main>` drops the max-w-7xl + padding wrapper so there's no top seam or
     * width mismatch against the 1200px nav/footer containers.
     */
    bleed?: boolean;
}) {
    const { props, url } = usePage<SharedProps>();
    const auth = props.auth?.user ?? null;
    const adminLink = props.auth?.admin ?? null;
    const flash = props.flash ?? {};
    const path = url.replace(/^\/+/, "").split("?")[0];

    // Pro Analytics lives behind the `analytics-suite` Pro feature. The link
    // lives in the user menu (below) for Pro users to keep the main nav lean;
    // non-Pro users can still reach the upsell at /analytics directly — the
    // server enforces the gate either way.
    const isPro = auth?.player?.pro ?? false;
    const navItems = NAV_ITEMS;

    // Start "light" so the server render and the client's FIRST render agree —
    // reading the real theme during render (the blade inline script may have set
    // it to dark from localStorage/system) would mismatch on hydration. The page
    // colors are already correct (the inline script sets the `dark` class on
    // <html> before React); this state only drives the toggle icon, which we sync
    // to the real theme right after mount.
    const [theme, setTheme] = useState<"light" | "dark">("light");
    useEffect(() => {
        setTheme(currentTheme());
        const onChange = (e: Event) => setTheme((e as CustomEvent<"light" | "dark">).detail);
        window.addEventListener("fancy-theme-change", onChange as EventListener);
        return () => window.removeEventListener("fancy-theme-change", onChange as EventListener);
    }, []);

    return (
        <div className="min-h-screen flex flex-col">
            <header className="nav">
                <div className="nav-inner">
                    <Link href="/" className="nav-brand" style={{ textDecoration: "none", color: "inherit" }}>
                        {/* loading="lazy" stops React 19 from auto-emitting an
                            <link rel="preload" as="image"> for this img — under
                            Inertia's synchronous renderToString SSR that preload
                            lands in the #app body, but the client hoists it to
                            <head>, causing a hydration mismatch (#418). */}
                        <img src="/showcase-assets/fancy-ui-logo.jpg" alt="Fancy UI Kit" className="mark" style={{ objectFit: "cover" }} loading="lazy" />
                        <span>Fancy UI Kit</span>
                        <span className="ver">v0.4</span>
                    </Link>

                    <div className="nav-links">
                        {navItems.map((item) => {
                            const active = path === item.match || path.startsWith(item.match + "/");
                            return (
                                <Link
                                    key={item.to}
                                    href={item.to}
                                    className="nav-link"
                                    style={
                                        active
                                            ? { background: "var(--bg-1)", color: "var(--fg-1)" }
                                            : undefined
                                    }
                                    aria-current={active ? "page" : undefined}
                                >
                                    {item.label}
                                </Link>
                            );
                        })}
                    </div>

                    <div className="nav-spacer" />

                    <div className="nav-actions">
                        <button
                            onClick={() =>
                                window.dispatchEvent(
                                    new KeyboardEvent("keydown", { key: "k", metaKey: true, ctrlKey: true }),
                                )
                            }
                            className="btn btn-ghost"
                            style={{ height: 34, padding: "0 12px" }}
                            aria-label="Search"
                        >
                            <span className="kbd">⌘K</span>
                        </button>

                        <TransitionSwitcher />

                        <CoBrowseControl />

                        <Tooltip content={theme === "dark" ? "Light mode" : "Dark mode"}>
                            <button
                                onClick={() => setTheme(toggleTheme())}
                                className="btn btn-ghost"
                                style={{ height: 34, padding: "0 10px" }}
                                aria-label="Toggle theme"
                            >
                                {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
                            </button>
                        </Tooltip>

                        <a
                            className="btn btn-ghost nav-gh"
                            style={{ height: 34, padding: "0 10px" }}
                            href="https://github.com/particle-academy"
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label="GitHub"
                            title="GitHub"
                        >
                            <span className="gh-mark" />
                        </a>

                        {auth ? (
                            <>
                                <Dropdown>
                                    <Dropdown.Trigger>
                                        <button className={`rounded-full transition hover:ring-2 hover:ring-violet-400/30 ${avatarFrameClass(auth.player?.cosmetics)}`}>
                                            <Profile
                                                src={auth.avatar_url ?? undefined}
                                                name={auth.github_username ?? auth.name}
                                                size="sm"
                                            />
                                        </button>
                                    </Dropdown.Trigger>
                                    <Dropdown.Items>
                                        {auth.player && (
                                            <>
                                                <div className="px-2 py-1.5">
                                                    <PlayerChip player={auth.player} />
                                                </div>
                                                <Dropdown.Separator />
                                            </>
                                        )}
                                        <Dropdown.Item onClick={() => router.visit("/profile")}>
                                            Your profile
                                        </Dropdown.Item>
                                        <Dropdown.Item onClick={() => router.visit("/referrals")}>
                                            Refer a friend
                                        </Dropdown.Item>
                                        {isPro && (
                                            <Dropdown.Item onClick={() => router.visit("/analytics")}>
                                                Analytics
                                            </Dropdown.Item>
                                        )}
                                        <Dropdown.Item onClick={() => router.visit("/showcase/mine")}>
                                            My submissions
                                        </Dropdown.Item>
                                        <Dropdown.Item onClick={() => router.visit("/shop")}>
                                            Coin shop
                                        </Dropdown.Item>
                                        {auth.github_username && (
                                            <Dropdown.Item
                                                onClick={() =>
                                                    window.open(`https://github.com/${auth.github_username}`, "_blank", "noopener")
                                                }
                                            >
                                                View GitHub profile
                                            </Dropdown.Item>
                                        )}
                                        {adminLink && (
                                            <>
                                                <Dropdown.Separator />
                                                <Dropdown.Item onClick={() => router.visit(adminLink.url)}>
                                                    Admin
                                                </Dropdown.Item>
                                            </>
                                        )}
                                        <Dropdown.Separator />
                                        <Dropdown.Item danger onClick={() => router.post("/auth/logout")}>
                                            Sign out
                                        </Dropdown.Item>
                                    </Dropdown.Items>
                                </Dropdown>
                            </>
                        ) : (
                            <a className="btn btn-primary" style={{ height: 34, padding: "0 14px" }} href="/auth/github">
                                <span className="gh-mark" />
                                <span>Sign in</span>
                            </a>
                        )}
                    </div>
                </div>
            </header>

            {auth && <ActiveUsersOverlay />}
            <AgentAnalyticsSink />

            {flash.auth_error && (
                <div className="mx-auto w-full max-w-7xl px-4 pt-3">
                    <Callout color="red">{flash.auth_error}</Callout>
                </div>
            )}
            {flash.error && (
                <div className="mx-auto w-full max-w-7xl px-4 pt-3">
                    <Callout color="red">{flash.error}</Callout>
                </div>
            )}
            {flash.submitted && (
                <div className="mx-auto w-full max-w-7xl px-4 pt-3">
                    <Callout color="green">{flash.submitted}</Callout>
                </div>
            )}
            {flash.success && (
                <div className="mx-auto w-full max-w-7xl px-4 pt-3">
                    <Callout color="green">{flash.success}</Callout>
                </div>
            )}

            <main className={bleed ? "flex-1" : "mx-auto w-full max-w-7xl flex-1 px-4 py-10 md:py-14"}>
                {/* The page crossfade is mounted once at the App root
                    (showcase-app.tsx) via <FancyPageTransition>, so it persists
                    across navigation regardless of how each page attaches its
                    Layout. The transition is chosen by the nav switcher below. */}
                {children}
            </main>

            <CommandPalette />

            <footer className="footer">
                <div className="container">
                    {/* Bold, unmissable cross-link to Particle Academy AI (new tab). */}
                    <a
                        href="https://ai.particle.academy/"
                        target="_blank"
                        rel="noopener noreferrer"
                        data-footer-ai-link
                        style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            gap: 16,
                            marginBottom: 28,
                            padding: "16px 20px",
                            borderRadius: 14,
                            border: "1px solid color-mix(in oklch, #8b5cf6 45%, transparent)",
                            background: "linear-gradient(90deg, color-mix(in oklch, #8b5cf6 16%, transparent), color-mix(in oklch, #f59e0b 12%, transparent))",
                            textDecoration: "none",
                            color: "var(--fg-1)",
                        }}
                    >
                        <span style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                            <span style={{ fontSize: 16, fontWeight: 800, letterSpacing: 0.2 }}>
                                ⚡ Particle Academy AI
                            </span>
                            <span style={{ fontSize: 13, color: "var(--fg-2)" }}>
                                ai.particle.academy — the AI side of Particle Academy
                            </span>
                        </span>
                        <span style={{ fontSize: 14, fontWeight: 700, whiteSpace: "nowrap", color: "#8b5cf6" }}>
                            Visit&nbsp;→
                        </span>
                    </a>
                    <div className="footer-grid">
                        <div>
                            <div className="nav-brand" style={{ marginBottom: 14 }}>
                                {/* loading="lazy" stops React 19 from auto-emitting an
                            <link rel="preload" as="image"> for this img — under
                            Inertia's synchronous renderToString SSR that preload
                            lands in the #app body, but the client hoists it to
                            <head>, causing a hydration mismatch (#418). */}
                        <img src="/showcase-assets/fancy-ui-logo.jpg" alt="Fancy UI Kit" className="mark" style={{ objectFit: "cover" }} loading="lazy" />
                                <span>Fancy UI Kit</span>
                            </div>
                            <p style={{ margin: 0, fontSize: 13, lineHeight: 1.6, color: "var(--fg-2)", maxWidth: 320 }}>
                                UI primitives engineered for Human+ UX — applications where humans and
                                agents share the same surface, trading control fluidly over MCP bridges.
                            </p>
                        </div>

                        <div>
                            <h5>Packages</h5>
                            <ul>
                                <li><Link href="/packages">All packages</Link></li>
                                <li><Link href="/starter-kits">Starter kits</Link></li>
                                <li><Link href="/showcase">Showcase</Link></li>
                                <li><Link href="/agent-playground">Agent Playground</Link></li>
                            </ul>
                        </div>

                        <div>
                            <h5>Learn</h5>
                            <ul>
                                <li><Link href="/docs">Docs</Link></li>
                                <li><Link href="/dreaming">Dreaming</Link></li>
                                <li><a href="/docs/human-plus-ux.md">Human+ whitepaper</a></li>
                                <li><Link href="/leaderboard">Leaderboard</Link></li>
                            </ul>
                        </div>

                        <div>
                            <h5>Connect</h5>
                            <ul>
                                <li>
                                    <a href="https://github.com/particle-academy" target="_blank" rel="noopener noreferrer">
                                        GitHub
                                    </a>
                                </li>
                                <li><Link href="/shop">Coin shop</Link></li>
                                {auth ? (
                                    <>
                                        <li><Link href="/showcase/mine">My submissions</Link></li>
                                        <li><Link href="/profile">Your profile</Link></li>
                                        <li><Link href="/referrals">Refer a friend</Link></li>
                                    </>
                                ) : (
                                    <li><a href="/auth/github">Sign in</a></li>
                                )}
                            </ul>
                        </div>
                    </div>

                    <div className="footer-bottom">
                        <span>© Particle Academy · MIT</span>
                        <span className="right">fancy-ui · v0.4 · react-fancy 4.4.0</span>
                    </div>
                </div>
            </footer>

            {/* fancy-inertia's Inertia⇄PWA adapter. Same redeploy detector as
                before (new build → "refresh" prompt, via Inertia's asset version)
                + offline-aware navigation (defers a visit made offline, replays on
                reconnect) + an offline notice. The SW half is inert here — the
                showcase registers no service worker — so detection is unchanged. */}
            <FancyInertiaPwa
                updateTitle="Fancy UI just updated"
                updateDescription="Refresh to get the latest build."
            />
        </div>
    );
}

/**
 * Live page-transition picker. Reads/sets the active transition from
 * fancy-inertia's <FancyTransitionProvider> (persisted to localStorage), so
 * choosing one here re-scopes every subsequent navigation across the showcase.
 */
function TransitionSwitcher() {
    const { transition, setTransition, transitions } = useFancyTransition();
    return (
        <Dropdown>
            <Dropdown.Trigger>
                {/* No Tooltip wrapper — its hover bubble overlapped the open
                    menu's first item. The aria-label carries the accessible name. */}
                <button
                    className="btn btn-ghost"
                    style={{ height: 34, padding: "0 10px" }}
                    aria-label="Page transition"
                    title="Page transition"
                >
                    <Sparkles size={16} />
                </button>
            </Dropdown.Trigger>
            <Dropdown.Items>
                {transitions.map((t) => (
                    <Dropdown.Item key={t} onClick={() => setTransition(t)}>
                        <span className="inline-flex w-full items-center justify-between gap-6">
                            {FANCY_TRANSITION_LABELS[t]}
                            {transition === t && <Check size={14} className="text-violet-500" />}
                        </span>
                    </Dropdown.Item>
                ))}
            </Dropdown.Items>
        </Dropdown>
    );
}

/**
 * Site-wide co-browsing control. A connected agent can drive *any* page while
 * the human watches; this is the human's entry point + take-back. The session
 * itself (the in-page MCP server + relay) lives in <CoBrowseProvider> above the
 * page outlet, so it survives Inertia navigations — this is just its surface.
 */
function CoBrowseControl() {
    const session = useCoBrowse();
    const [open, setOpen] = useState(false);
    if (!session) return null;
    const sharing = session.session != null;
    return (
        <div className="co-browse-control" style={{ position: "relative" }}>
            <Tooltip content="Let an agent co-drive this site">
                <button
                    className="btn btn-ghost"
                    style={{ height: 34, padding: "0 10px", position: "relative" }}
                    onClick={() => setOpen((o) => !o)}
                    aria-label="Agent co-browsing"
                    aria-expanded={open}
                    data-co-browse-trigger
                >
                    <Bot size={16} />
                    {sharing && (
                        <span className="co-browse-trigger-dot" data-state={session.relayState} aria-hidden />
                    )}
                </button>
            </Tooltip>
            {open && (
                <>
                    <div className="co-browse-popover-scrim" onClick={() => setOpen(false)} aria-hidden />
                    <div className="co-browse-popover" role="dialog" aria-label="Agent co-browsing">
                        <CoBrowsePresence session={session} />
                    </div>
                </>
            )}
        </div>
    );
}

function PlayerChip({ player }: { player: PlayerSummary }) {
    return (
        <div
            className="flex shrink-0 items-center gap-2 whitespace-nowrap rounded-full border border-zinc-200 bg-zinc-50 py-1 pl-3 pr-1 text-xs font-medium text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300"
            title={`${player.levelName ?? "Level " + player.level} · ${player.totalXp.toLocaleString()} XP${player.pro ? ` · Pro (${player.proSource})` : ""}`}
        >
            {player.pro && (
                <span className="rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                    Pro
                </span>
            )}
            <span className="inline-flex items-center gap-1">
                <span className="text-violet-600 dark:text-violet-400">Lv {player.level}</span>
            </span>
            <span className="rounded-full bg-amber-100 px-2 py-0.5 font-semibold text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">
                {player.coins.toLocaleString()} ◈
            </span>
        </div>
    );
}
