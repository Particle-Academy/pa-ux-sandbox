import { Head, Link, router, usePage } from "@inertiajs/react";
import { Fragment, useMemo, useState } from "react";
import { Badge, Button, Card, Heading, Icon, Text } from "@particle-academy/react-fancy";
import { Layout } from "../Layout";

type AgentKeyRow = {
    id: number;
    name: string;
    created_at: string | null;
    last_used_at: string | null;
    revoked: boolean;
};

type Stats = {
    pageviews: number;
    sessions: number;
    clicks: number;
    human: number;
    agent: number;
    totalEvents: number;
} | null;

type Submission = {
    id: number;
    site_key: string;
    kind: "website" | "repo";
    url: string;
    title: string | null;
    description: string | null;
    status: "pending" | "verified" | "rejected";
    scanned_at: string | null;
    stats: Stats;
};

function StatusBadge({ status }: { status: Submission["status"] }) {
    if (status === "verified") {
        return (
            <Badge color="emerald" dot>
                Verified
            </Badge>
        );
    }
    if (status === "rejected") {
        return (
            <Badge color="amber" dot>
                Not detected yet
            </Badge>
        );
    }
    return (
        <Badge color="zinc" dot>
            Pending
        </Badge>
    );
}

function hostOf(url: string): string {
    try {
        return new URL(url).hostname;
    } catch {
        return url;
    }
}

function Stat({ label, value }: { label: string; value: string | number }) {
    return (
        <div className="flex min-w-[64px] flex-col">
            <span className="text-lg font-semibold tabular-nums text-zinc-900 dark:text-zinc-100">
                {value}
            </span>
            <span className="text-[11px] uppercase tracking-wide text-zinc-500">{label}</span>
        </div>
    );
}

/**
 * Grouping. A list of registered sites is mostly repetition — every unverified
 * row carries the same "add the pixel" hint. Splitting verified from awaiting
 * collapses that noise into one labelled block instead of N identical ones.
 */
type Group = "verified" | "pending";

const groupOf = (s: Submission): Group => (s.status === "verified" ? "verified" : "pending");

const GROUP_LABEL: Record<Group, string> = {
    verified: "Verified",
    pending: "Awaiting verification",
};

function orderByGroup(list: Submission[]): Submission[] {
    return [
        ...list.filter((s) => groupOf(s) === "verified"),
        ...list.filter((s) => groupOf(s) !== "verified"),
    ];
}

/** A heading only on the first row of each group, so groups read as sections. */
function groupHeadingFor(list: Submission[], i: number): { label: string; count: number } | null {
    const g = groupOf(list[i]);
    if (i > 0 && groupOf(list[i - 1]) === g) {
        return null;
    }
    return { label: GROUP_LABEL[g], count: list.filter((s) => groupOf(s) === g).length };
}

function GroupHeader({ label, count }: { label: string; count: number }) {
    return (
        <div className="flex items-center gap-3 pt-2">
            <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-200">{label}</span>
            <span className="rounded-full bg-zinc-100 px-2 py-0.5 font-mono text-[11px] tabular-nums text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
                {count}
            </span>
            <span className="h-px flex-1 bg-zinc-200 dark:bg-zinc-800" />
        </div>
    );
}

/** Three aggregates, all derived from the rows already on the page. */
function SubmissionsSummary({ submissions }: { submissions: Submission[] }) {
    const summary = useMemo(() => {
        const verified = submissions.filter((s) => s.status === "verified");
        const pageviews = verified.reduce((n, s) => n + (s.stats?.pageviews ?? 0), 0);
        const human = submissions.reduce((n, s) => n + (s.stats?.human ?? 0), 0);
        const agent = submissions.reduce((n, s) => n + (s.stats?.agent ?? 0), 0);
        const total = human + agent;
        return {
            registered: submissions.length,
            verified: verified.length,
            awaiting: submissions.length - verified.length,
            pageviews,
            agentShare: total > 0 ? Math.round((agent / total) * 100) : null,
        };
    }, [submissions]);

    const boxes = [
        {
            icon: "globe",
            label: "Registered",
            value: summary.registered.toLocaleString(),
            sub: `${summary.verified} verified · ${summary.awaiting} awaiting`,
        },
        {
            icon: "eye",
            label: "Total pageviews",
            value: summary.pageviews.toLocaleString(),
            sub: "across verified sites",
        },
        {
            icon: "bot",
            label: "Agent traffic",
            value: summary.agentShare === null ? "—" : `${summary.agentShare}%`,
            sub: summary.agentShare === null ? "no events yet" : "of recorded events",
            accent: true,
        },
    ];

    return (
        <div className="mt-6 grid gap-3 sm:grid-cols-3">
            {boxes.map((b) => (
                <div
                    key={b.label}
                    className="rounded-xl border border-zinc-200 bg-zinc-50/60 px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900/40"
                >
                    <div className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                        <Icon name={b.icon} size={12} />
                        {b.label}
                    </div>
                    <div
                        className={`mt-1 font-mono text-2xl font-semibold tabular-nums ${
                            b.accent ? "text-sky-600 dark:text-sky-400" : "text-zinc-900 dark:text-zinc-50"
                        }`}
                    >
                        {b.value}
                    </div>
                    <div className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">{b.sub}</div>
                </div>
            ))}
        </div>
    );
}

export default function MySubmissions({
    submissions,
    agentKeys = [],
}: {
    submissions: Submission[];
    agentKeys?: AgentKeyRow[];
}) {
    const [deletingId, setDeletingId] = useState<number | null>(null);
    const [keyName, setKeyName] = useState("");
    const [minting, setMinting] = useState(false);
    const flash = (usePage().props as { flash?: { agent_key_plaintext?: string | null } }).flash;
    const freshKey = flash?.agent_key_plaintext ?? null;

    const mintKey = (e: React.FormEvent) => {
        e.preventDefault();
        setMinting(true);
        router.post(
            "/showcase/agent-keys",
            { name: keyName },
            {
                preserveScroll: true,
                onSuccess: () => setKeyName(""),
                onFinish: () => setMinting(false),
            },
        );
    };

    const revokeKey = (key: AgentKeyRow) => {
        if (!window.confirm(`Revoke “${key.name}”? Agents holding it lose access immediately.`)) {
            return;
        }
        router.delete(`/showcase/agent-keys/${key.id}`, { preserveScroll: true });
    };

    const remove = (s: Submission) => {
        const label = s.title || hostOf(s.url);
        if (!window.confirm(`Remove “${label}” from your submissions? This delists it from the Showcase.`)) {
            return;
        }
        setDeletingId(s.id);
        router.delete(`/showcase/submit/${s.id}`, {
            preserveScroll: true,
            onFinish: () => setDeletingId(null),
        });
    };

    return (
        <Layout>
            <Head title="Your submissions · Showcase" />

            <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                    <Heading level={1} size="xl">
                        Your submissions
                    </Heading>
                    <Text className="mt-2 max-w-2xl">
                        Manage the sites and repos you&apos;ve registered, track verification, and
                        see basic stats for each. The full analytics suite — heatmaps, sessions,
                        trends — lives under Analytics for Pro.
                    </Text>
                </div>
                <Button as={Link} href="/showcase/submit" color="violet" icon="plus">
                    Register a site
                </Button>
            </div>

            {submissions.length > 0 && <SubmissionsSummary submissions={submissions} />}

            {submissions.length === 0 ? (
                <Card className="mt-8">
                    <Card.Body>
                        <div className="flex flex-col items-center gap-3 py-10 text-center">
                            <span className="grid h-12 w-12 place-items-center rounded-full bg-violet-100 text-violet-600 dark:bg-violet-900/40 dark:text-violet-300">
                                <Icon name="sparkles" className="h-6 w-6" />
                            </span>
                            <Heading level={2} size="md">
                                No submissions yet
                            </Heading>
                            <Text className="max-w-md">
                                Register a website or repo to get listed in the Showcase. Add the
                                Fancy Pixel (or Fancified badge) and we verify automatically — no
                                review queue.
                            </Text>
                            <Button
                                as={Link}
                                href="/showcase/submit"
                                color="violet"
                                icon="plus"
                                className="mt-1"
                            >
                                Register your first site
                            </Button>
                        </div>
                    </Card.Body>
                </Card>
            ) : (
                <div className="mt-8 space-y-4">
                    {orderByGroup(submissions).map((s, i, list) => {
                        const host = hostOf(s.url);
                        const hasActivity = !!s.stats && s.stats.totalEvents > 0;
                        const heading = groupHeadingFor(list, i);
                        return (
                            <Fragment key={s.id}>
                            {heading && <GroupHeader label={heading.label} count={heading.count} />}
                            <Card>
                                <Card.Body>
                                    <div className="flex flex-wrap items-start justify-between gap-3">
                                        <div className="min-w-0">
                                            <div className="flex items-center gap-2">
                                                <Icon
                                                    name={s.kind === "repo" ? "award" : "globe"}
                                                    className="h-4 w-4 text-violet-500"
                                                />
                                                <Heading level={2} size="sm" className="truncate">
                                                    {s.title || host}
                                                </Heading>
                                                <Badge color="zinc" size="sm" variant="soft">
                                                    {s.kind}
                                                </Badge>
                                            </div>
                                            <a
                                                href={s.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="mt-1 inline-block max-w-full truncate text-sm text-zinc-500 hover:text-violet-600"
                                            >
                                                {s.url}
                                            </a>
                                        </div>
                                        <StatusBadge status={s.status} />
                                    </div>

                                    {/* Basic stats — free, owner-only */}
                                    <div className="mt-4 rounded-lg bg-zinc-50 p-3 dark:bg-zinc-900/50">
                                        {hasActivity ? (
                                            <div className="flex flex-wrap gap-x-8 gap-y-3">
                                                <Stat
                                                    label="Pageviews"
                                                    value={s.stats!.pageviews.toLocaleString()}
                                                />
                                                <Stat
                                                    label="Sessions"
                                                    value={s.stats!.sessions.toLocaleString()}
                                                />
                                                <Stat
                                                    label="Clicks"
                                                    value={s.stats!.clicks.toLocaleString()}
                                                />
                                                <Stat
                                                    label="Human"
                                                    value={s.stats!.human.toLocaleString()}
                                                />
                                                <Stat
                                                    label="Agent"
                                                    value={s.stats!.agent.toLocaleString()}
                                                />
                                            </div>
                                        ) : (
                                            <Text size="sm" className="!text-zinc-400">
                                                No activity yet — stats appear once your{" "}
                                                {s.kind === "repo" ? "badge" : "pixel"} starts
                                                reporting.
                                            </Text>
                                        )}
                                    </div>

                                    <div className="mt-4 flex flex-wrap items-center gap-2">
                                        <Button
                                            as={Link}
                                            href={`/showcase/submit/${s.id}/installed`}
                                            size="sm"
                                            variant="ghost"
                                            icon="pencil"
                                        >
                                            Manage
                                        </Button>
                                        <Button
                                            as={Link}
                                            href={`/analytics?site=${encodeURIComponent(s.site_key)}`}
                                            size="sm"
                                            variant="ghost"
                                            icon="trending-up"
                                        >
                                            Full analytics
                                        </Button>
                                        {s.status === "verified" && (
                                            <Button
                                                as={Link}
                                                href="/showcase"
                                                size="sm"
                                                variant="ghost"
                                                icon="eye"
                                            >
                                                View in Showcase
                                            </Button>
                                        )}
                                        <div className="ml-auto">
                                            <Button
                                                type="button"
                                                size="sm"
                                                variant="ghost"
                                                color="red"
                                                icon="trash-2"
                                                onClick={() => remove(s)}
                                                disabled={deletingId === s.id}
                                            >
                                                {deletingId === s.id ? "Removing…" : "Delete"}
                                            </Button>
                                        </div>
                                    </div>
                                </Card.Body>
                            </Card>
                            </Fragment>
                        );
                    })}
                </div>
            )}

            {/* Agent access — mint a key an AI agent presents to the showcase
                MCP tools to register + verify projects on your behalf. */}
            <div className="mt-12">
                <Heading level={2} size="lg">
                    Agent access
                </Heading>
                <Text className="mt-2 max-w-2xl">
                    Mint a key and hand it to your AI agent. With your permission, it can
                    register your projects here, check verification, and rescan — via the
                    showcase tools on the Fancy UI MCP server at{" "}
                    <code className="rounded bg-zinc-100 px-1 py-0.5 text-[13px] dark:bg-zinc-900">
                        ui.particle.academy/mcp
                    </code>
                    . Every registration is attributed to the key, and revoking it cuts
                    access instantly.
                </Text>

                {freshKey && (
                    <Card className="mt-4 border-violet-300 dark:border-violet-700">
                        <Card.Body>
                            <div className="flex items-center gap-2">
                                <Icon name="key" className="h-4 w-4 text-violet-500" />
                                <Text size="sm" className="font-semibold">
                                    Copy your new key now — it won&apos;t be shown again.
                                </Text>
                            </div>
                            <code className="mt-2 block overflow-x-auto rounded-md bg-zinc-100 px-3 py-2 text-sm dark:bg-zinc-900">
                                {freshKey}
                            </code>
                        </Card.Body>
                    </Card>
                )}

                <Card className="mt-4">
                    <Card.Body>
                        <form onSubmit={mintKey} className="flex flex-wrap items-end gap-3">
                            <div className="min-w-[220px] flex-1">
                                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500">
                                    Key name
                                </label>
                                <input
                                    type="text"
                                    required
                                    maxLength={120}
                                    value={keyName}
                                    onChange={(e) => setKeyName(e.target.value)}
                                    placeholder="e.g. Claude Code"
                                    className="mt-1 w-full rounded-md border border-zinc-300 bg-transparent px-3 py-2 text-sm outline-none focus:border-violet-500 dark:border-zinc-700"
                                />
                            </div>
                            <Button type="submit" color="violet" icon="key" disabled={minting}>
                                {minting ? "Minting…" : "Mint key"}
                            </Button>
                        </form>

                        {agentKeys.length > 0 && (
                            <ul className="mt-5 divide-y divide-zinc-200 dark:divide-zinc-800">
                                {agentKeys.map((key) => (
                                    <li
                                        key={key.id}
                                        className="flex flex-wrap items-center gap-3 py-3"
                                    >
                                        <Icon name="key" className="h-4 w-4 text-violet-500" />
                                        <span className="text-sm font-medium">{key.name}</span>
                                        {key.revoked ? (
                                            <Badge color="zinc" size="sm" variant="soft">
                                                Revoked
                                            </Badge>
                                        ) : (
                                            <Badge color="emerald" size="sm" variant="soft">
                                                Active
                                            </Badge>
                                        )}
                                        <span className="text-xs text-zinc-500">
                                            {key.last_used_at
                                                ? `last used ${new Date(key.last_used_at).toLocaleDateString()}`
                                                : "never used"}
                                        </span>
                                        {!key.revoked && (
                                            <div className="ml-auto">
                                                <Button
                                                    type="button"
                                                    size="sm"
                                                    variant="ghost"
                                                    color="red"
                                                    icon="shield-off"
                                                    onClick={() => revokeKey(key)}
                                                >
                                                    Revoke
                                                </Button>
                                            </div>
                                        )}
                                    </li>
                                ))}
                            </ul>
                        )}
                    </Card.Body>
                </Card>
            </div>
        </Layout>
    );
}
