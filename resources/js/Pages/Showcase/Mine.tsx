import { Head, Link } from "@inertiajs/react";
import { Badge, Button, Card, Heading, Icon, Text } from "@particle-academy/react-fancy";
import { Layout } from "../Layout";

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

export default function MySubmissions({ submissions }: { submissions: Submission[] }) {
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
                    {submissions.map((s) => {
                        const host = hostOf(s.url);
                        const hasActivity = !!s.stats && s.stats.totalEvents > 0;
                        return (
                            <Card key={s.id}>
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
                                    </div>
                                </Card.Body>
                            </Card>
                        );
                    })}
                </div>
            )}
        </Layout>
    );
}
