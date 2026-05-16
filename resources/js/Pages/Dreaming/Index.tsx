import { Head, Link, usePage } from "@inertiajs/react";
import { useMemo, useState } from "react";
import {
    Action,
    Badge,
    Card,
    
    Heading,
    Separator,
    Text,
} from "@particle-academy/react-fancy";
import { Layout } from "../Layout";

type Dream = {
    slug: string;
    title: string;
    blurb?: string;
    pkg?: string;
    theme?: string;
};

type Tally = { up: number; down: number; mine: number | null };

type Props = {
    dreams: Dream[];
    tallies: Record<string, Tally>;
    themes: string[];
};

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
                        <Action as="a" href="/auth/github" color="zinc">
                            Sign in to vote
                        </Action>
                    )}
                    <Action as={Link} href="/dreaming/archived" variant="ghost">
                        Archived
                    </Action>
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

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {visible.map((d) => {
                    const tally = tallies[d.slug] ?? { up: 0, down: 0, mine: null };
                    const score = tally.up - tally.down;
                    const mine = tally.mine ?? null;
                    return (
                        <Card key={d.slug} className="flex h-full flex-col">
                            <Card.Body>
                                <div className="flex items-start justify-between gap-2">
                                    <Heading level={3} size="sm">{d.title}</Heading>
                                    {d.theme && <Badge color="sky" size="sm">{d.theme}</Badge>}
                                </div>
                                {d.pkg && (
                                    <Text size="xs" className="mt-0.5 uppercase tracking-wider text-zinc-400">
                                        {d.pkg}
                                    </Text>
                                )}
                                {d.blurb && <Text size="xs" className="mt-2">{d.blurb}</Text>}
                                <div className="mt-3 flex items-center justify-between">
                                    <div className="flex items-center gap-1 text-xs">
                                        <Action
                                            variant={mine === 1 ? "filled" : "ghost"}
                                            color={mine === 1 ? "emerald" : "zinc"}
                                            size="sm"
                                            onClick={() => handleVote(d.slug, 1)}
                                        >
                                            👍 {tally.up}
                                        </Action>
                                        <Action
                                            variant={mine === -1 ? "filled" : "ghost"}
                                            color={mine === -1 ? "rose" : "zinc"}
                                            size="sm"
                                            onClick={() => handleVote(d.slug, -1)}
                                        >
                                            👎 {tally.down}
                                        </Action>
                                    </div>
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
