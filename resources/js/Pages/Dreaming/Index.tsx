import { Head, Link, usePage } from "@inertiajs/react";
import { Component, ErrorInfo, ReactNode, Suspense, useEffect, useMemo, useRef, useState } from "react";
import {
    Button,
    Badge,
    Card,
    Heading,
    Separator,
    Text,
} from "@particle-academy/react-fancy";
import { Layout } from "../Layout";
import { dreamDemos } from "./demos";

type Dream = {
    slug: string;
    title: string;
    blurb?: string;
    pkg?: string;
    theme?: string;
    accepted?: boolean;
    acceptedAt?: string;
    /** Package + version the dream was promoted into, e.g. `@particle-academy/react-fancy@3.3.0`. */
    acceptedInto?: string;
};

type Tally = { up: number; down: number; mine: number | null };

type Props = {
    dreams: Dream[];
    tallies: Record<string, Tally>;
    themes: string[];
};

// ── Speculative-demo preview ────────────────────────────────────────────────
// Each dream card hosts a small, scrollable live preview of the dreamed
// component so voters can actually try it. Demos are lazy-loaded on first
// intersection so we don't mount 46 React trees on page open.

class DemoErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
    state = { error: null as Error | null };
    static getDerivedStateFromError(error: Error) {
        return { error };
    }
    componentDidCatch(error: Error, info: ErrorInfo) {
        // eslint-disable-next-line no-console
        console.error("[dream demo crash]", error, info);
    }
    render() {
        if (this.state.error) {
            return (
                <div className="flex h-full items-center justify-center px-3 text-center text-[11px] text-rose-500">
                    Demo crashed: {String(this.state.error.message || this.state.error)}
                </div>
            );
        }
        return this.props.children;
    }
}

function DemoPreview({ slug }: { slug: string }) {
    const Demo = dreamDemos[slug];
    const ref = useRef<HTMLDivElement>(null);
    const [seen, setSeen] = useState(false);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        if (typeof IntersectionObserver === "undefined") {
            setSeen(true);
            return;
        }
        const io = new IntersectionObserver(
            (entries) => entries.forEach((e) => e.isIntersecting && setSeen(true)),
            { rootMargin: "400px" },
        );
        io.observe(el);
        return () => io.disconnect();
    }, []);

    // Demos were authored for the dreaming-branch sandbox, which mounted
    // them on a full-page route — most assume ~800px of horizontal canvas.
    // Cramming them into a card means a lot of scroll and clipped layout.
    // We use CSS `zoom` so the demo *thinks* it has its native viewport
    // while we render at 60% scale, plus an inner scroll container as a
    // safety net for the few demos that still overflow.
    return (
        <div
            ref={ref}
            className="mb-3 h-[28rem] overflow-hidden rounded-md border border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950"
        >
            {Demo ? (
                seen ? (
                    <Suspense
                        fallback={
                            <div className="flex h-full items-center justify-center text-[11px] text-zinc-400">
                                Loading…
                            </div>
                        }
                    >
                        <DemoErrorBoundary>
                            <div
                                className="h-full w-full overflow-auto p-3 text-zinc-700 dark:text-zinc-200"
                                style={{ zoom: 0.6 }}
                            >
                                <Demo />
                            </div>
                        </DemoErrorBoundary>
                    </Suspense>
                ) : (
                    <div className="flex h-full items-center justify-center text-[11px] text-zinc-400">
                        Scroll into view to preview
                    </div>
                )
            ) : (
                <div className="flex h-full items-center justify-center text-[11px] text-zinc-400">
                    No preview yet
                </div>
            )}
        </div>
    );
}

export default function DreamingIndex({ dreams, tallies: initialTallies, themes }: Props) {
    const { props } = usePage<{ auth: { user: unknown }; csrfToken: string }>();
    const isAuth = !!props.auth?.user;
    const csrf = props.csrfToken;

    const [tallies, setTallies] = useState(initialTallies);
    const [filter, setFilter] = useState<"all" | "up" | "down" | "undecided">("all");
    const [theme, setTheme] = useState<string>("all");

    const visible = useMemo(() => {
        return dreams.filter((d) => {
            if (theme !== "all" && d.theme !== theme) return false;
            const mine = tallies[d.slug]?.mine ?? null;
            if (filter === "up" && mine !== 1) return false;
            if (filter === "down" && mine !== -1) return false;
            if (filter === "undecided" && mine !== null && mine !== 0) return false;
            return true;
        });
    }, [dreams, tallies, filter, theme]);

    const handleVote = async (slug: string, value: 1 | -1) => {
        if (!isAuth) {
            window.location.href = "/auth/github";
            return;
        }
        const current = tallies[slug]?.mine ?? null;
        const next = current === value ? 0 : value;
        try {
            const res = await fetch("/api/votes", {
                method: "POST",
                credentials: "same-origin",
                headers: {
                    "content-type": "application/json",
                    "accept": "application/json",
                    "x-csrf-token": csrf,
                },
                body: JSON.stringify({ type: "dream", slug, value: next }),
            });
            if (!res.ok) return;
            const data = (await res.json()) as { tallies: Tally };
            setTallies((t) => ({ ...t, [slug]: data.tallies }));
        } catch {
            /* ignore */
        }
    };

    return (
        <Layout>
            <Head title="Dreaming · Fancy UI" />

            <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                    <Heading level={1} size="xl">Dreaming</Heading>
                    <Text className="mt-2 max-w-3xl">
                        Speculative components proposed for inclusion in the Fancy UI kit.
                        Browse anonymously; vote when you sign in with GitHub. Components
                        that net negative votes auto-archive once at least 3 people have weighed in.
                    </Text>
                </div>
                <div className="flex gap-2">
                    {!isAuth && (
                        <Button as="a" href="/auth/github" color="zinc">
                            Sign in to vote
                        </Button>
                    )}
                    <Button as={Link} href="/dreaming/archived" variant="ghost">
                        Archived
                    </Button>
                </div>
            </div>

            <Separator className="my-6" />

            <div className="mb-4 flex flex-wrap items-center gap-2 text-xs">
                <Text size="xs" className="font-medium text-zinc-500">Filter:</Text>
                {(["all", "up", "down", "undecided"] as const).map((f) => (
                    <button
                        key={f}
                        onClick={() => setFilter(f)}
                        className={`rounded-md px-2 py-1 transition ${
                            filter === f
                                ? "bg-violet-600 text-white"
                                : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
                        }`}
                    >
                        {f === "all" ? "all" : f === "up" ? "👍 mine" : f === "down" ? "👎 mine" : "undecided"}
                    </button>
                ))}
                {themes.length > 0 && (
                    <select
                        value={theme}
                        onChange={(e) => setTheme(e.target.value)}
                        className="ml-2 rounded-md border border-zinc-300 bg-white px-2 py-1 text-xs dark:border-zinc-700 dark:bg-zinc-900"
                    >
                        <option value="all">all themes</option>
                        {themes.map((t) => (
                            <option key={t} value={t}>
                                {t}
                            </option>
                        ))}
                    </select>
                )}
                <Text size="xs" className="ml-auto text-zinc-500">{visible.length} dreams</Text>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {visible.map((d) => {
                    const tally = tallies[d.slug] ?? { up: 0, down: 0, mine: null };
                    const score = tally.up - tally.down;
                    const mine = tally.mine ?? null;
                    return (
                        <Card key={d.slug} className="flex h-full flex-col">
                            <Card.Body>
                                <DemoPreview slug={d.slug} />
                                <div className="flex items-start justify-between gap-2">
                                    <Heading level={3} size="sm">{d.title}</Heading>
                                    <div className="flex flex-wrap items-center gap-1">
                                        {d.accepted && (
                                            <Badge color="emerald" size="sm">Shipped</Badge>
                                        )}
                                        {d.theme && <Badge color="sky" size="sm">{d.theme}</Badge>}
                                    </div>
                                </div>
                                {d.pkg && (
                                    <Text size="xs" className="mt-0.5 uppercase tracking-wider text-zinc-400">
                                        {d.pkg}
                                    </Text>
                                )}
                                {d.blurb && <Text size="xs" className="mt-2">{d.blurb}</Text>}
                                {d.accepted && d.acceptedInto && (
                                    <Text size="xs" className="mt-2 font-mono text-emerald-600 dark:text-emerald-400">
                                        ✓ shipped in {d.acceptedInto}
                                        {d.acceptedAt && ` · ${d.acceptedAt}`}
                                    </Text>
                                )}
                                <div className="mt-3 flex items-center justify-between">
                                    {d.accepted ? (
                                        <Text size="xs" className="text-zinc-500">
                                            Voting closed — accepted into the kit.
                                        </Text>
                                    ) : (
                                        <div className="flex items-center gap-1 text-xs">
                                            <Button
                                                variant={mine === 1 ? "filled" : "ghost"}
                                                color={mine === 1 ? "emerald" : "zinc"}
                                                size="sm"
                                                onClick={() => handleVote(d.slug, 1)}
                                            >
                                                👍 {tally.up}
                                            </Button>
                                            <Button
                                                variant={mine === -1 ? "filled" : "ghost"}
                                                color={mine === -1 ? "rose" : "zinc"}
                                                size="sm"
                                                onClick={() => handleVote(d.slug, -1)}
                                            >
                                                👎 {tally.down}
                                            </Button>
                                        </div>
                                    )}
                                    {!d.accepted && (
                                        <Text
                                            size="xs"
                                            className={`font-mono ${
                                                score > 0
                                                    ? "text-emerald-600"
                                                    : score < 0
                                                        ? "text-rose-600"
                                                        : "text-zinc-500"
                                            }`}
                                        >
                                            {score > 0 ? `+${score}` : score}
                                        </Text>
                                    )}
                                </div>
                            </Card.Body>
                        </Card>
                    );
                })}
                {visible.length === 0 && (
                    <div className="col-span-full rounded-lg border border-dashed border-zinc-300 p-10 text-center text-sm text-zinc-500 dark:border-zinc-700">
                        Nothing matches this filter.
                    </div>
                )}
            </div>
        </Layout>
    );
}
