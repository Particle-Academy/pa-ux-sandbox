import { ReactNode, useEffect, useState } from "react";
import { Link, usePage } from "@inertiajs/react";
import {
    Action,
    Callout,
    Dropdown,
    Menu,
    Navbar,
    Profile,
    Text,
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
};
type AuthUser = {
    name: string;
    github_username: string | null;
    avatar_url: string | null;
    player?: PlayerSummary | null;
};
type Auth = { user: AuthUser | null };
type SharedProps = { flash: Flash; auth: Auth; csrfToken: string };

const NAV_ITEMS: Array<{ to: string; label: string; match: string }> = [
    { to: "/docs", label: "Docs", match: "docs" },
    { to: "/packages", label: "Packages", match: "packages" },
    { to: "/starter-kits", label: "Starter Kits", match: "starter-kits" },
    { to: "/dreaming", label: "Dreaming", match: "dreaming" },
    { to: "/showcase", label: "Showcase", match: "showcase" },
    { to: "/shop", label: "Shop", match: "shop" },
    { to: "/leaderboard", label: "Leaderboard", match: "leaderboard" },
];

export function Layout({ children }: { children: ReactNode }) {
    const { props, url } = usePage<SharedProps>();
    const auth = props.auth?.user ?? null;
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
            <Navbar className="sticky top-0 z-30 border-b border-zinc-200 bg-white/85 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/85">
                <Navbar.Brand>
                    <Link href="/" className="flex items-center gap-2.5">
                        <img
                            src="/showcase-assets/fancy-ui-logo.jpg"
                            alt=""
                            className="h-7 w-7 rounded-md shadow-sm ring-1 ring-zinc-900/5"
                        />
                        <span className="text-sm font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
                            Fancy UI Kit
                        </span>
                    </Link>
                </Navbar.Brand>

                <Navbar.Items>
                    {NAV_ITEMS.map((item) => (
                        <Navbar.Item
                            key={item.to}
                            href={item.to}
                            active={path === item.match || path.startsWith(item.match + "/")}
                        >
                            {item.label}
                        </Navbar.Item>
                    ))}
                </Navbar.Items>

                <div className="flex items-center gap-2">
                    <button
                        onClick={() =>
                            window.dispatchEvent(
                                new KeyboardEvent("keydown", { key: "k", metaKey: true, ctrlKey: true }),
                            )
                        }
                        className="hidden h-8 items-center gap-2 rounded-md border border-zinc-200 bg-zinc-50 px-2.5 text-xs text-zinc-500 hover:border-zinc-300 hover:text-zinc-700 md:flex dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:border-zinc-700 dark:hover:text-zinc-200"
                        aria-label="Search"
                    >
                        <span>Search…</span>
                        <kbd className="rounded border border-zinc-300 bg-white px-1 font-mono text-[10px] text-zinc-500 dark:border-zinc-700 dark:bg-zinc-950">
                            ⌘K
                        </kbd>
                    </button>

                    <Tooltip content={theme === "dark" ? "Light mode" : "Dark mode"}>
                        <Action
                            variant="ghost"
                            size="sm"
                            onClick={() => setTheme(toggleTheme())}
                            aria-label="Toggle theme"
                        >
                            {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
                        </Action>
                    </Tooltip>

                    {auth ? (
                        <>
                            {auth.player && <PlayerChip player={auth.player} />}
                            <Dropdown>
                                <Dropdown.Trigger>
                                    <button className={`rounded-full transition hover:ring-2 hover:ring-violet-400/30 ${avatarFrameClass(auth.player?.cosmetics)}`}>
                                        <Profile
                                            avatar={auth.avatar_url ?? undefined}
                                            name={auth.github_username ?? auth.name}
                                        />
                                    </button>
                                </Dropdown.Trigger>
                                <Dropdown.Content>
                                    <Menu>
                                        <Menu.Item asChild>
                                            <Link href="/profile">Your profile</Link>
                                        </Menu.Item>
                                        <Menu.Item asChild>
                                            <Link href="/shop">Coin shop</Link>
                                        </Menu.Item>
                                        <Menu.Item asChild>
                                            <a
                                                href={`https://github.com/${auth.github_username}`}
                                                target="_blank"
                                                rel="noopener"
                                            >
                                                View GitHub profile
                                            </a>
                                        </Menu.Item>
                                        <Menu.Separator />
                                        <Menu.Item asChild>
                                            <SignOutForm csrf={props.csrfToken} />
                                        </Menu.Item>
                                    </Menu>
                                </Dropdown.Content>
                            </Dropdown>
                        </>
                    ) : (
                        <Action as="a" href="/auth/github" size="sm" color="zinc">
                            Sign in with GitHub
                        </Action>
                    )}
                </div>
            </Navbar>

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

            <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-10 md:py-14">{children}</main>

            <CommandPalette />

            <footer className="border-t border-zinc-200 dark:border-zinc-800">
                <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2 px-4 py-5 text-xs text-zinc-500 dark:text-zinc-400">
                    <Text size="xs">
                        Fancy UI Kit ·{" "}
                        <a href="/docs/human-plus-ux.md" className="underline-offset-2 hover:underline">
                            Human+ UX whitepaper
                        </a>
                    </Text>
                    <Text size="xs">© Particle Academy · MIT</Text>
                </div>
            </footer>
        </div>
    );
}

function PlayerChip({ player }: { player: PlayerSummary }) {
    return (
        <Link
            href="/profile"
            className="hidden items-center gap-2 rounded-full border border-zinc-200 bg-zinc-50 py-1 pl-2.5 pr-1 text-xs font-medium text-zinc-600 transition hover:border-violet-300 hover:text-zinc-900 sm:flex dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:border-violet-700 dark:hover:text-zinc-100"
            title={`${player.levelName ?? "Level " + player.level} · ${player.totalXp.toLocaleString()} XP`}
        >
            <span className="inline-flex items-center gap-1">
                <span className="text-violet-600 dark:text-violet-400">Lv {player.level}</span>
            </span>
            <span className="rounded-full bg-amber-100 px-2 py-0.5 font-semibold text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">
                {player.coins.toLocaleString()} ◈
            </span>
        </Link>
    );
}

function SignOutForm({ csrf }: { csrf: string }) {
    return (
        <form method="POST" action="/auth/logout" className="block w-full">
            <input type="hidden" name="_token" value={csrf} />
            <button type="submit" className="w-full text-left">Sign out</button>
        </form>
    );
}
