import { Head } from "@inertiajs/react";
import { Badge, Card, Heading, Icon, Table, Text } from "@particle-academy/react-fancy";
import { useFancyQuery } from "@particle-academy/fancy-query";
import { useMemo, useState } from "react";
import { Layout } from "./Layout";
import { avatarFrameClass, nameColorClass, type CosmeticSlots } from "../lib/cosmetics";

type Row = {
    github_username: string;
    merged_prs: number;
    stars?: number;
    issues_opened?: number;
    votes_cast: number;
    score: number;
};

type Player = {
    rank: number;
    name: string;
    avatar_url: string | null;
    total_xp: number;
    coins: number;
    cosmetics: CosmeticSlots;
};

type Props = {
    scope: "all_time" | "last_30_days";
    snapshot: { generated_at: string } | null;
    rows: Row[];
    players: Player[];
};

const AVATAR_FALLBACK = "/showcase-assets/fancy-ui-logo.jpg";

/** A segmented pill switch — the redesign's one navigation idiom for a page. */
function PillTabs<T extends string>({
    value,
    onChange,
    options,
}: {
    value: T;
    onChange: (next: T) => void;
    options: { value: T; label: string }[];
}) {
    return (
        <div className="inline-flex rounded-full border border-zinc-200 bg-zinc-100/70 p-1 dark:border-zinc-800 dark:bg-zinc-900/70">
            {options.map((o) => {
                const on = o.value === value;
                return (
                    <button
                        key={o.value}
                        type="button"
                        onClick={() => onChange(o.value)}
                        className={[
                            "rounded-full px-3.5 py-1.5 text-xs font-semibold transition",
                            on
                                ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-800 dark:text-zinc-50"
                                : "text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200",
                        ].join(" ")}
                    >
                        {o.label}
                    </button>
                );
            })}
        </div>
    );
}

export default function Leaderboard({ scope, snapshot, rows, players }: Props) {
    const [view, setView] = useState<"players" | "contributors">("players");

    return (
        <Layout>
            <Head title="Leaderboard · Fancy UI" />

            <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                    <Heading level={1} size="xl">Leaderboard</Heading>
                    <Text className="mt-2 max-w-3xl">
                        {view === "players"
                            ? "Top players by total XP earned across the showcase — exploring, tinkering, driving agents, and shipping projects."
                            : "Top contributors across the whole package ecosystem — stars, merged PRs, and opened issues on every Particle-Academy repo, plus votes cast. No account needed: log in with GitHub to claim your score."}
                    </Text>
                </div>
                <PillTabs
                    value={view}
                    onChange={setView}
                    options={[
                        { value: "players", label: "Players" },
                        { value: "contributors", label: "Contributors" },
                    ]}
                />
            </div>

            {view === "players" ? (
                <PlayersBoard players={players} />
            ) : (
                <ContributorsTable scope={scope} snapshot={snapshot} rows={rows} />
            )}
        </Layout>
    );
}

/** Four aggregates, all derived from the real player rows — nothing invented. */
function StatStrip({ players }: { players: Player[] }) {
    const stats = useMemo(() => {
        const xp = players.reduce((n, p) => n + p.total_xp, 0);
        const coins = players.reduce((n, p) => n + p.coins, 0);
        return [
            { label: "Players ranked", icon: "users", value: players.length.toLocaleString() },
            { label: "XP earned", icon: "zap", value: xp.toLocaleString() },
            { label: "Coins in circulation", icon: "coins", value: coins.toLocaleString(), gold: true },
            { label: "Top score", icon: "trophy", value: (players[0]?.total_xp ?? 0).toLocaleString() },
        ];
    }, [players]);

    return (
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {stats.map((s) => (
                <div
                    key={s.label}
                    className="rounded-xl border border-zinc-200 bg-zinc-50/60 px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900/40"
                >
                    <div className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                        <Icon name={s.icon} size={12} />
                        {s.label}
                    </div>
                    <div
                        className={`mt-1 font-mono text-2xl font-semibold tabular-nums ${
                            s.gold ? "text-amber-500 dark:text-amber-400" : "text-zinc-900 dark:text-zinc-50"
                        }`}
                    >
                        {s.value}
                    </div>
                </div>
            ))}
        </div>
    );
}

/** The top three, centred on first place — 2nd · 1st · 3rd, tallest in the middle. */
function Podium({ players }: { players: Player[] }) {
    const [first, second, third] = players;
    const order = [second, first, third].filter(Boolean) as Player[];
    if (order.length === 0) return null;

    const tone = (rank: number) =>
        rank === 1
            ? { ring: "ring-amber-400/70", chip: "bg-amber-400/15 text-amber-600 dark:text-amber-300", label: "1st", icon: "crown" }
            : rank === 2
              ? { ring: "ring-sky-400/60", chip: "bg-sky-400/15 text-sky-600 dark:text-sky-300", label: "2nd", icon: "medal" }
              : { ring: "ring-orange-400/50", chip: "bg-orange-400/15 text-orange-600 dark:text-orange-300", label: "3rd", icon: "medal" };

    return (
        <div className="mt-5 grid items-end gap-3 sm:grid-cols-3">
            {order.map((p) => {
                const t = tone(p.rank);
                const champion = p.rank === 1;
                return (
                    <div
                        key={p.rank}
                        className={[
                            "flex flex-col items-center rounded-2xl border bg-white px-4 text-center dark:bg-zinc-900",
                            champion
                                ? "order-first border-amber-300/60 py-6 shadow-sm sm:order-none dark:border-amber-500/30"
                                : "border-zinc-200 py-5 dark:border-zinc-800",
                        ].join(" ")}
                    >
                        <span className={`mb-3 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide ${t.chip}`}>
                            <Icon name={t.icon} size={12} />
                            {t.label}
                        </span>
                        <img
                            src={p.avatar_url ?? AVATAR_FALLBACK}
                            alt=""
                            className={[
                                "rounded-full object-cover ring-2 ring-offset-2 ring-offset-white dark:ring-offset-zinc-900",
                                champion ? "h-16 w-16" : "h-12 w-12",
                                t.ring,
                                avatarFrameClass(p.cosmetics),
                            ].join(" ")}
                        />
                        <div className={`mt-3 truncate font-semibold ${champion ? "text-base" : "text-sm"} ${nameColorClass(p.cosmetics)}`}>
                            {p.name}
                        </div>
                        <div className="mt-3 flex w-full items-center justify-center gap-6">
                            <div>
                                <div className="text-[10px] font-medium uppercase tracking-wide text-zinc-400">XP</div>
                                <div className="font-mono text-sm font-semibold tabular-nums text-zinc-900 dark:text-zinc-50">
                                    {p.total_xp.toLocaleString()}
                                </div>
                            </div>
                            <div>
                                <div className="text-[10px] font-medium uppercase tracking-wide text-zinc-400">Coins</div>
                                <div className="font-mono text-sm font-semibold tabular-nums text-amber-500 dark:text-amber-400">
                                    {p.coins.toLocaleString()}
                                </div>
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

function PlayersBoard({ players }: { players: Player[] }) {
    if (players.length === 0) {
        return (
            <Card className="mt-6">
                <div className="p-10 text-center text-sm text-zinc-500">
                    No players yet. Sign in and start earning XP — browse packages, try demos, drive the agent bridges.
                </div>
            </Card>
        );
    }

    const rest = players.slice(3);

    return (
        <>
            <StatStrip players={players} />
            <Podium players={players} />

            {rest.length > 0 && (
                <Card className="mt-5 overflow-hidden">
                    <Table>
                        <Table.Head>
                            <Table.Row>
                                <Table.Column label="#" />
                                <Table.Column label="Player" />
                                <Table.Column label="Coins" className="!text-right" />
                                <Table.Column label="XP" className="!text-right" />
                            </Table.Row>
                        </Table.Head>
                        <Table.Body>
                            {rest.map((p) => (
                                <Table.Row key={p.rank}>
                                    <Table.Cell className="font-mono text-zinc-400 tabular-nums">{p.rank}</Table.Cell>
                                    <Table.Cell>
                                        <span className="flex items-center gap-2.5">
                                            <img
                                                src={p.avatar_url ?? AVATAR_FALLBACK}
                                                alt=""
                                                className={`h-7 w-7 rounded-full object-cover ${avatarFrameClass(p.cosmetics)}`}
                                            />
                                            <span className={`font-medium ${nameColorClass(p.cosmetics)}`}>{p.name}</span>
                                        </span>
                                    </Table.Cell>
                                    <Table.Cell className="text-right font-mono tabular-nums text-amber-600 dark:text-amber-400">
                                        {p.coins.toLocaleString()}
                                    </Table.Cell>
                                    <Table.Cell className="text-right font-mono font-semibold tabular-nums">
                                        {p.total_xp.toLocaleString()}
                                    </Table.Cell>
                                </Table.Row>
                            ))}
                        </Table.Body>
                    </Table>
                </Card>
            )}

            <div className="mt-4 flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
                <Icon name="info" size={13} />
                XP comes from exploring packages, running agents, and shipping showcase submissions.
            </div>
        </>
    );
}

type Contributors = { scope: Props["scope"]; snapshot: { generated_at: string } | null; rows: Row[] };

/**
 * Dogfoods @particle-academy/fancy-query: the scope toggle no longer does a
 * full Inertia page reload — `useFancyQuery` keyed by scope caches each cut and
 * refetches in place. The initial scope is seeded straight from the Inertia
 * props (`initialData`), so the first paint needs no request.
 */
function ContributorsTable({ scope: initialScope, snapshot: initialSnapshot, rows: initialRows }: Omit<Props, "players">) {
    const [scope, setScope] = useState<Props["scope"]>(initialScope);

    const { data, isFetching } = useFancyQuery<Contributors>(
        ["leaderboard-contributors", scope],
        () => fetch(`/api/leaderboard/contributors?scope=${scope}`).then((r) => r.json()),
        {
            initialData:
                scope === initialScope
                    ? { scope: initialScope, snapshot: initialSnapshot, rows: initialRows }
                    : undefined,
        },
    );

    const rows = data?.rows ?? [];
    const snapshot = data?.snapshot ?? null;

    const switchScope = (next: Props["scope"]) => {
        setScope(next);
        // Keep the URL shareable without a full Inertia reload.
        window.history.replaceState(null, "", next === "all_time" ? "/leaderboard" : `/leaderboard?scope=${next}`);
    };

    return (
        <>
            <div className="mt-5 inline-flex items-center gap-2">
                <PillTabs
                    value={scope}
                    onChange={switchScope}
                    options={[
                        { value: "all_time", label: "All time" },
                        { value: "last_30_days", label: "Last 30 days" },
                    ]}
                />
                {isFetching && <Text size="xs" className="!text-zinc-400">updating…</Text>}
            </div>

            {rows.length === 0 ? (
                <Card className="mt-5">
                    <div className="p-10 text-center text-sm text-zinc-500">
                        The contributor snapshot hasn&rsquo;t been generated yet. It refreshes on a schedule —
                        check back shortly.
                    </div>
                </Card>
            ) : (
                <Card className="mt-5 overflow-hidden">
                    <Table>
                        <Table.Head>
                            <Table.Row>
                                <Table.Column label="#" />
                                <Table.Column label="Contributor" />
                                <Table.Column label="Stars" className="!text-right" />
                                <Table.Column label="Merged PRs" className="!text-right" />
                                <Table.Column label="Issues" className="!text-right" />
                                <Table.Column label="Votes" className="!text-right" />
                                <Table.Column label="Score" className="!text-right" />
                            </Table.Row>
                        </Table.Head>
                        <Table.Body>
                            {rows.map((row, i) => (
                                <Table.Row key={row.github_username}>
                                    <Table.Cell className="font-mono text-zinc-400 tabular-nums">{i + 1}</Table.Cell>
                                    <Table.Cell>
                                        <span className="flex items-center gap-2">
                                            <a
                                                href={`https://github.com/${row.github_username}`}
                                                target="_blank"
                                                rel="noopener"
                                                className="font-medium hover:underline"
                                            >
                                                {row.github_username}
                                            </a>
                                            {i === 0 && <Badge color="amber" variant="soft" size="sm">top</Badge>}
                                        </span>
                                    </Table.Cell>
                                    <Table.Cell className="text-right font-mono tabular-nums text-amber-600 dark:text-amber-400">{row.stars ?? 0}</Table.Cell>
                                    <Table.Cell className="text-right font-mono tabular-nums">{row.merged_prs}</Table.Cell>
                                    <Table.Cell className="text-right font-mono tabular-nums">{row.issues_opened ?? 0}</Table.Cell>
                                    <Table.Cell className="text-right font-mono tabular-nums">{row.votes_cast}</Table.Cell>
                                    <Table.Cell className="text-right font-mono font-semibold tabular-nums">{row.score}</Table.Cell>
                                </Table.Row>
                            ))}
                        </Table.Body>
                    </Table>
                </Card>
            )}
            {snapshot && (
                <Text size="xs" className="mt-3 text-zinc-500">
                    Generated {new Date(snapshot.generated_at).toLocaleString()}.
                </Text>
            )}
        </>
    );
}
