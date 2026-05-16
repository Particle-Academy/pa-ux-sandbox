import { StrictMode, useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";

/**
 * Public dreaming gallery — main-branch entry point. Renders the
 * server-provided dream list with per-card vote buttons backed by the
 * /api/votes endpoint. Anonymous users see counts only; the buttons
 * redirect to GitHub OAuth.
 *
 * Mount target: <div id="dreaming-gallery"
 *                    data-dreams="…json…"
 *                    data-tallies="…json…"
 *                    data-auth="0|1"
 *                    data-csrf="…"></div>
 */

type Dream = {
    slug: string;
    title: string;
    blurb?: string;
    pkg?: string;
    theme?: string;
    accepted?: boolean;
};

type Tally = { up: number; down: number; mine?: number | null };

const root = document.getElementById("dreaming-gallery");
if (root) {
    const dreams = JSON.parse(root.dataset.dreams ?? "[]") as Dream[];
    const initialTallies = JSON.parse(root.dataset.tallies ?? "{}") as Record<string, Tally>;
    const isAuth = root.dataset.auth === "1";
    const csrf = root.dataset.csrf ?? "";

    createRoot(root).render(
        <StrictMode>
            <Gallery
                dreams={dreams}
                initialTallies={initialTallies}
                isAuth={isAuth}
                csrf={csrf}
            />
        </StrictMode>,
    );
}

function Gallery({
    dreams,
    initialTallies,
    isAuth,
    csrf,
}: {
    dreams: Dream[];
    initialTallies: Record<string, Tally>;
    isAuth: boolean;
    csrf: string;
}) {
    const [tallies, setTallies] = useState(initialTallies);
    const [filter, setFilter] = useState<"all" | "up" | "down" | "undecided">("all");
    const [theme, setTheme] = useState<string>("all");

    const themes = useMemo(() => {
        return Array.from(new Set(dreams.map((d) => d.theme).filter(Boolean))).sort() as string[];
    }, [dreams]);

    const visible = useMemo(() => {
        return dreams.filter((d) => {
            if (theme !== "all" && d.theme !== theme) return false;
            const mine = tallies[d.slug]?.mine ?? null;
            if (filter === "up" && mine !== 1) return false;
            if (filter === "down" && mine !== -1) return false;
            if (filter === "undecided" && mine !== null && mine !== 0) return false;
            return true;
        });
    }, [dreams, theme, filter, tallies]);

    // On first authenticated load, migrate any localStorage votes (from the
    // dev-time dreaming branch) up to the server.
    useEffect(() => {
        if (!isAuth) return;
        try {
            const raw = window.localStorage.getItem("dreaming.votes.v1");
            if (!raw) return;
            const map = JSON.parse(raw) as Record<string, "up" | "down">;
            const slugs = Object.keys(map);
            if (slugs.length === 0) return;
            Promise.all(
                slugs.map((slug) =>
                    castVote(slug, map[slug] === "up" ? 1 : -1, csrf).catch(() => null),
                ),
            ).then(() => {
                window.localStorage.removeItem("dreaming.votes.v1");
                refreshAllTallies(slugs, setTallies);
            });
        } catch {
            /* ignore */
        }
    }, [isAuth, csrf]);

    return (
        <div>
            <div className="mb-4 flex flex-wrap items-center gap-2 text-xs">
                <span className="font-medium text-zinc-500">Filter:</span>
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
                <span className="ml-auto text-zinc-500">{visible.length} dreams</span>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {visible.map((d) => (
                    <DreamCard
                        key={d.slug}
                        dream={d}
                        tally={tallies[d.slug] ?? { up: 0, down: 0, mine: null }}
                        isAuth={isAuth}
                        csrf={csrf}
                        onVote={(next) =>
                            setTallies((t) => ({ ...t, [d.slug]: next }))
                        }
                    />
                ))}
                {visible.length === 0 && (
                    <div className="col-span-full rounded-lg border border-dashed border-zinc-300 p-10 text-center text-sm text-zinc-500 dark:border-zinc-700">
                        Nothing matches this filter.
                    </div>
                )}
            </div>
        </div>
    );
}

function DreamCard({
    dream,
    tally,
    isAuth,
    csrf,
    onVote,
}: {
    dream: Dream;
    tally: Tally;
    isAuth: boolean;
    csrf: string;
    onVote: (next: Tally) => void;
}) {
    const score = tally.up - tally.down;
    const mine = tally.mine ?? null;

    const handleVote = async (value: 1 | -1) => {
        if (!isAuth) {
            window.location.href = "/auth/github";
            return;
        }
        const next = mine === value ? 0 : value;
        const res = await castVote(dream.slug, next as 1 | 0 | -1, csrf);
        if (res?.tallies) onVote(res.tallies);
    };

    return (
        <div className="flex flex-col rounded-xl border border-zinc-200 bg-white p-4 transition hover:-translate-y-px hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex items-start justify-between gap-2">
                <div className="font-semibold">{dream.title}</div>
                {dream.theme && (
                    <span className="rounded-full bg-sky-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-sky-700 dark:bg-sky-500/15 dark:text-sky-300">
                        {dream.theme}
                    </span>
                )}
            </div>
            {dream.pkg && (
                <div className="mt-0.5 text-[10px] uppercase tracking-wider text-zinc-400">{dream.pkg}</div>
            )}
            {dream.blurb && (
                <p className="mt-2 flex-1 text-xs text-zinc-600 dark:text-zinc-300">{dream.blurb}</p>
            )}
            <div className="mt-3 flex items-center justify-between">
                <div className="flex items-center gap-1 text-xs">
                    <button
                        onClick={() => handleVote(1)}
                        title={isAuth ? "Up-vote" : "Sign in to vote"}
                        className={`inline-flex items-center gap-1 rounded-md border px-2 py-1 transition ${
                            mine === 1
                                ? "border-emerald-500 bg-emerald-500 text-white"
                                : "border-zinc-300 text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
                        }`}
                    >
                        👍 <span className="font-mono">{tally.up}</span>
                    </button>
                    <button
                        onClick={() => handleVote(-1)}
                        title={isAuth ? "Down-vote" : "Sign in to vote"}
                        className={`inline-flex items-center gap-1 rounded-md border px-2 py-1 transition ${
                            mine === -1
                                ? "border-rose-500 bg-rose-500 text-white"
                                : "border-zinc-300 text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
                        }`}
                    >
                        👎 <span className="font-mono">{tally.down}</span>
                    </button>
                </div>
                <span className={`font-mono text-xs ${score > 0 ? "text-emerald-600" : score < 0 ? "text-rose-600" : "text-zinc-500"}`}>
                    {score > 0 ? `+${score}` : score}
                </span>
            </div>
        </div>
    );
}

async function castVote(slug: string, value: 1 | 0 | -1, csrf: string): Promise<{ tallies: Tally } | null> {
    try {
        const res = await fetch("/api/votes", {
            method: "POST",
            credentials: "same-origin",
            headers: {
                "content-type": "application/json",
                "accept": "application/json",
                "x-csrf-token": csrf,
            },
            body: JSON.stringify({ type: "dream", slug, value }),
        });
        if (!res.ok) return null;
        return (await res.json()) as { tallies: Tally };
    } catch {
        return null;
    }
}

async function refreshAllTallies(
    slugs: string[],
    setTallies: React.Dispatch<React.SetStateAction<Record<string, Tally>>>,
): Promise<void> {
    try {
        const url = `/api/votes?type=dream&slugs=${encodeURIComponent(slugs.join(","))}`;
        const res = await fetch(url, { credentials: "same-origin" });
        if (!res.ok) return;
        const data = (await res.json()) as { tallies: Record<string, Tally> };
        setTallies((prev) => ({ ...prev, ...data.tallies }));
    } catch {
        /* noop */
    }
}
