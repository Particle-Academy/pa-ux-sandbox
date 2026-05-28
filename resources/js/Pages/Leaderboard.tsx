import { Head, Link } from "@inertiajs/react";
import { Card, Heading, Table, Text } from "@particle-academy/react-fancy";
import { useState } from "react";
import { Layout } from "./Layout";
import { avatarFrameClass, nameColorClass, type CosmeticSlots } from "../lib/cosmetics";

type Row = {
    github_username: string;
    merged_prs: number;
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

export default function Leaderboard({ scope, snapshot, rows, players }: Props) {
    const [view, setView] = useState<"players" | "contributors">("players");

    return (
        <Layout>
            <Head title="Leaderboard · Fancy UI" />

            <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                    <Heading level={1} size="xl">Leaderboard</Heading>
                    <Text className="mt-2 max-w-3xl">
                        {view === "players"
                            ? "Top players by total XP earned across the showcase — exploring, tinkering, driving agents, and shipping projects."
                            : "Top contributors by merged PRs across every Particle-Academy repo and votes cast on dreams."}
                    </Text>
                </div>
                <div className="inline-flex overflow-hidden rounded-md border border-zinc-300 text-xs dark:border-zinc-700">
                    <button
                        onClick={() => setView("players")}
                        className={`px-3 py-1.5 ${view === "players" ? "bg-violet-600 text-white" : "text-zinc-600 dark:text-zinc-300"}`}
                    >
                        Players
                    </button>
                    <button
                        onClick={() => setView("contributors")}
                        className={`border-l border-zinc-300 px-3 py-1.5 dark:border-zinc-700 ${view === "contributors" ? "bg-violet-600 text-white" : "text-zinc-600 dark:text-zinc-300"}`}
                    >
                        Contributors
                    </button>
                </div>
            </div>

            {view === "players" ? (
                <PlayersTable players={players} />
            ) : (
                <ContributorsTable scope={scope} snapshot={snapshot} rows={rows} />
            )}
        </Layout>
    );
}

function PlayersTable({ players }: { players: Player[] }) {
    if (players.length === 0) {
        return (
            <Card className="mt-6">
                <div className="p-10 text-center text-sm text-zinc-500">
                    No players yet. Sign in and start earning XP — browse packages, try demos, drive the agent bridges.
                </div>
            </Card>
        );
    }

    return (
        <Card className="mt-6 overflow-hidden">
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
                    {players.map((p) => (
                        <Table.Row key={p.rank}>
                            <Table.Cell className="font-mono">{p.rank}</Table.Cell>
                            <Table.Cell>
                                <span className="flex items-center gap-2.5">
                                    <img
                                        src={p.avatar_url ?? "/showcase-assets/fancy-ui-logo.jpg"}
                                        alt=""
                                        className={`h-7 w-7 rounded-full object-cover ${avatarFrameClass(p.cosmetics)}`}
                                    />
                                    <span className={`font-medium ${nameColorClass(p.cosmetics)}`}>{p.name}</span>
                                </span>
                            </Table.Cell>
                            <Table.Cell className="text-right font-mono text-amber-600 dark:text-amber-400">
                                {p.coins.toLocaleString()}
                            </Table.Cell>
                            <Table.Cell className="text-right font-mono font-semibold">
                                {p.total_xp.toLocaleString()}
                            </Table.Cell>
                        </Table.Row>
                    ))}
                </Table.Body>
            </Table>
        </Card>
    );
}

function ContributorsTable({ scope, snapshot, rows }: Omit<Props, "players">) {
    return (
        <>
            <div className="mt-4 inline-flex overflow-hidden rounded-md border border-zinc-300 text-xs dark:border-zinc-700">
                <Link
                    href="?scope=all_time"
                    className={`px-3 py-1.5 ${scope === "all_time" ? "bg-violet-600 text-white" : "text-zinc-600 dark:text-zinc-300"}`}
                >
                    All time
                </Link>
                <Link
                    href="?scope=last_30_days"
                    className={`border-l border-zinc-300 px-3 py-1.5 dark:border-zinc-700 ${scope === "last_30_days" ? "bg-violet-600 text-white" : "text-zinc-600 dark:text-zinc-300"}`}
                >
                    Last 30 days
                </Link>
            </div>

            {rows.length === 0 ? (
                <Card className="mt-6">
                    <div className="p-10 text-center text-sm text-zinc-500">
                        No leaderboard snapshot yet. Run <code className="font-mono">php artisan showcase:refresh-leaderboard</code>{" "}
                        or wait for the scheduled job. Requires <code className="font-mono">GITHUB_API_TOKEN</code> for full PR counts.
                    </div>
                </Card>
            ) : (
                <Card className="mt-6 overflow-hidden">
                    <Table>
                        <Table.Head>
                            <Table.Row>
                                <Table.Column label="#" />
                                <Table.Column label="Contributor" />
                                <Table.Column label="Merged PRs" className="!text-right" />
                                <Table.Column label="Votes cast" className="!text-right" />
                                <Table.Column label="Score" className="!text-right" />
                            </Table.Row>
                        </Table.Head>
                        <Table.Body>
                            {rows.map((row, i) => (
                                <Table.Row key={row.github_username}>
                                    <Table.Cell className="font-mono">{i + 1}</Table.Cell>
                                    <Table.Cell>
                                        <a
                                            href={`https://github.com/${row.github_username}`}
                                            target="_blank"
                                            rel="noopener"
                                            className="font-medium hover:underline"
                                        >
                                            {row.github_username}
                                        </a>
                                    </Table.Cell>
                                    <Table.Cell className="text-right font-mono">{row.merged_prs}</Table.Cell>
                                    <Table.Cell className="text-right font-mono">{row.votes_cast}</Table.Cell>
                                    <Table.Cell className="text-right font-mono font-semibold">{row.score}</Table.Cell>
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
