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
import { Moon, Sun } from "lucide-react";
import { currentTheme, toggleTheme } from "../showcase-theme";

type Flash = { auth_error?: string | null; submitted?: string | null };
type AuthUser = {
    name: string;
    github_username: string | null;
    avatar_url: string | null;
};
type Auth = { user: AuthUser | null };
type SharedProps = { flash: Flash; auth: Auth; csrfToken: string };

const NAV_ITEMS: Array<{ to: string; label: string; match: string }> = [
    { to: "/packages", label: "Packages", match: "packages" },
    { to: "/starter-kits", label: "Starter Kits", match: "starter-kits" },
    { to: "/dreaming", label: "Dreaming", match: "dreaming" },
    { to: "/showcase", label: "Showcase", match: "showcase" },
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
                        <Dropdown>
                            <Dropdown.Trigger>
                                <button className="rounded-full transition hover:ring-2 hover:ring-violet-400/30">
                                    <Profile
                                        avatar={auth.avatar_url ?? undefined}
                                        name={auth.github_username ?? auth.name}
                                    />
                                </button>
                            </Dropdown.Trigger>
                            <Dropdown.Content>
                                <Menu>
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
            {flash.submitted && (
                <div className="mx-auto w-full max-w-7xl px-4 pt-3">
                    <Callout color="green">{flash.submitted}</Callout>
                </div>
            )}

            <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-10 md:py-14">{children}</main>

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

function SignOutForm({ csrf }: { csrf: string }) {
    return (
        <form method="POST" action="/auth/logout" className="block w-full">
            <input type="hidden" name="_token" value={csrf} />
            <button type="submit" className="w-full text-left">Sign out</button>
        </form>
    );
}
