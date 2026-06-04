import { ReactNode, useEffect, useState } from "react";
import { Link, router, usePage } from "@inertiajs/react";
import {
    Button,
    Callout,
    Dropdown,
    Profile,
    Tooltip,
} from "@particle-academy/react-fancy";
import { Moon, Sun } from "@particle-academy/react-fancy/icons";
import { currentTheme, toggleTheme } from "../showcase-theme";
import { CommandPalette } from "./CommandPalette";
import { avatarFrameClass, type CosmeticSlots } from "../lib/cosmetics";

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
    { to: "/starter-kits", label: "Starter Kits", match: "starter-kits" },
    { to: "/dreaming", label: "Dreaming", match: "dreaming" },
    { to: "/agent-playground", label: "Agent Playground", match: "agent-playground" },
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

    const [theme, setTheme] = useState<"light" | "dark">(() =>
        typeof window === "undefined" ? "light" : currentTheme(),
    );
    useEffect(() => {
        const onChange = (e: Event) => setTheme((e as CustomEvent<"light" | "dark">).detail);
        window.addEventListener("fancy-theme-change", onChange as EventListener);
        return () => window.removeEventListener("fancy-theme-change", onChange as EventListener);
    }, []);

    return (
        <div className="min-h-screen flex flex-col">
            <header className="nav">
                <div className="nav-inner">
                    <Link href="/" className="nav-brand" style={{ textDecoration: "none", color: "inherit" }}>
                        <img src="/showcase-assets/fancy-ui-logo.jpg" alt="Fancy UI Kit" className="mark" style={{ objectFit: "cover" }} />
                        <span>Fancy UI Kit</span>
                        <span className="ver">v0.2</span>
                    </Link>

                    <div className="nav-links">
                        {NAV_ITEMS.map((item) => {
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
                            <span>Search…</span>
                            <span className="kbd">⌘K</span>
                        </button>

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
                            style={{ height: 34, padding: "0 12px" }}
                            href="https://github.com/particle-academy"
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            <span className="gh-mark" />
                            <span>GitHub</span>
                        </a>

                        {auth ? (
                            <>
                                {auth.player && <PlayerChip player={auth.player} />}
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
                                        <Dropdown.Item onClick={() => router.visit("/profile")}>
                                            Your profile
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
                {children}
            </main>

            <CommandPalette />

            <footer className="footer">
                <div className="container">
                    <div className="footer-grid">
                        <div>
                            <div className="nav-brand" style={{ marginBottom: 14 }}>
                                <img src="/showcase-assets/fancy-ui-logo.jpg" alt="Fancy UI Kit" className="mark" style={{ objectFit: "cover" }} />
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
                                    <li><Link href="/profile">Your profile</Link></li>
                                ) : (
                                    <li><a href="/auth/github">Sign in</a></li>
                                )}
                            </ul>
                        </div>
                    </div>

                    <div className="footer-bottom">
                        <span>© Particle Academy · MIT</span>
                        <span className="right">fancy-ui · v0.2 · react-fancy 4.4.0</span>
                    </div>
                </div>
            </footer>
        </div>
    );
}

function PlayerChip({ player }: { player: PlayerSummary }) {
    return (
        <Link
            href="/profile"
            className="hidden shrink-0 items-center gap-2 whitespace-nowrap rounded-full border border-zinc-200 bg-zinc-50 py-1 pl-3 pr-1 text-xs font-medium text-zinc-600 transition hover:border-violet-300 hover:text-zinc-900 sm:flex dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:border-violet-700 dark:hover:text-zinc-100"
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
        </Link>
    );
}
