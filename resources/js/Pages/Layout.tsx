import { ReactNode, useEffect, useState } from "react";
import { Link, usePage } from "@inertiajs/react";
import {
    Action,
    Brand,
    Callout,
    Dropdown,
    Menu,
    Navbar,
    Profile,
    Separator,
    Text,
    Tooltip,
} from "@particle-academy/react-fancy";
import { applyTheme, currentTheme, toggleTheme } from "../showcase-theme";

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
        const onChange = (e: Event) => {
            const detail = (e as CustomEvent<"light" | "dark">).detail;
            setTheme(detail);
        };
        window.addEventListener("fancy-theme-change", onChange as EventListener);
        return () => window.removeEventListener("fancy-theme-change", onChange as EventListener);
    }, []);

    return (
        <div className="min-h-screen">
            <header className="sticky top-0 z-30 border-b border-zinc-200 bg-white/80 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/80">
                <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-2.5">
                    <Link href="/" className="shrink-0">
                        <Brand
                            logo="/showcase-assets/fancy-ui-logo.jpg"
                            name="Fancy UI Kit"
                        />
                    </Link>

                    <Navbar className="ml-2">
                        {NAV_ITEMS.map((item) => (
                            <Link
                                key={item.to}
                                href={item.to}
                                className={`rounded-md px-2.5 py-1.5 text-sm transition ${
                                    path.startsWith(item.match)
                                        ? "bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100"
                                        : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
                                }`}
                            >
                                {item.label}
                            </Link>
                        ))}
                    </Navbar>

                    <div className="ml-auto flex items-center gap-2">
                        <Tooltip content={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}>
                            <Action
                                variant="ghost"
                                size="sm"
                                onClick={() => setTheme(toggleTheme())}
                                aria-label="Toggle theme"
                            >
                                {theme === "dark" ? "☀" : "☾"}
                            </Action>
                        </Tooltip>

                        {auth ? (
                            <Dropdown>
                                <Dropdown.Trigger>
                                    <Profile
                                        avatar={auth.avatar_url ?? undefined}
                                        name={auth.github_username ?? auth.name}
                                    />
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
                            <Action
                                as="a"
                                href="/auth/github"
                                size="sm"
                                color="zinc"
                            >
                                Sign in with GitHub
                            </Action>
                        )}
                    </div>
                </div>
            </header>

            {flash.auth_error && (
                <div className="mx-auto max-w-7xl px-4 pt-3">
                    <Callout color="red" icon="circle-x">
                        {flash.auth_error}
                    </Callout>
                </div>
            )}
            {flash.submitted && (
                <div className="mx-auto max-w-7xl px-4 pt-3">
                    <Callout color="emerald" icon="circle-check">
                        {flash.submitted}
                    </Callout>
                </div>
            )}

            <main className="mx-auto max-w-7xl px-4 py-8">{children}</main>

            <footer className="mt-16 border-t border-zinc-200 dark:border-zinc-800">
                <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2 px-4 py-4 text-xs text-zinc-500 dark:text-zinc-400">
                    <Text size="xs">
                        Fancy UI Kit · <a href="/docs/human-plus-ux.md" className="underline-offset-2 hover:underline">Human+ UX whitepaper</a>
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
            <button type="submit" className="w-full text-left">
                Sign out
            </button>
        </form>
    );
}
