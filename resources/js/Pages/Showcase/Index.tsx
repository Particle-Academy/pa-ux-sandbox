import { Head, Link, usePage } from "@inertiajs/react";
import { Badge, Button, Card, FauxClient, Heading, Icon, Separator, Text } from "@particle-academy/react-fancy";
import { Layout } from "../Layout";

type Submission = {
    id: number;
    kind: "website" | "repo";
    url: string;
    title: string | null;
    description: string | null;
    thumbnail_url: string | null;
};

// ── Coming soon: Fancy Analytics Suite ──────────────────────────────────────
// A sneak-peek teaser for the upcoming Pixel + Heuristics + Pro Analytics work.
// The mock dashboard renders inside a FauxClient "device" frame (the FauxDevice).
// All numbers are static fixtures — no data source yet.

// Heat blobs overlaid on a wireframe of the real page (x/y in %, r in px) —
// this is an overlay heatmap on the actual site, not an abstract cell grid.
const HEAT_BLOBS = [
    { x: 50, y: 40, r: 30, hot: 0.7 }, // hero CTA — hottest
    { x: 84, y: 13, r: 14, hot: 0.5 }, // nav action
    { x: 24, y: 80, r: 15, hot: 0.42 }, // first card
    { x: 72, y: 82, r: 11, hot: 0.3 }, // third card
];

const SECTION_BARS = [
    { label: "Hero", pct: 92 },
    { label: "Pricing", pct: 74 },
    { label: "Docs", pct: 58 },
    { label: "Footer", pct: 21 },
];

const SESSIONS = [
    { who: "Human", where: "/pricing", tone: "emerald" as const },
    { who: "Agent · Claude", where: "/docs/api", tone: "violet" as const },
    { who: "Human", where: "/showcase", tone: "emerald" as const },
];

function Sparkline({ points, className = "" }: { points: number[]; className?: string }) {
    const w = 64;
    const h = 20;
    const max = Math.max(...points, 1);
    const d = points
        .map((p, i) => `${(i / (points.length - 1)) * w},${h - (p / max) * h}`)
        .join(" ");
    return (
        <svg viewBox={`0 0 ${w} ${h}`} className={className} preserveAspectRatio="none" aria-hidden>
            <polyline points={d} fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}

function MockAnalyticsDashboard() {
    return (
        <div className="space-y-3 bg-white p-3 text-zinc-800 dark:bg-zinc-950 dark:text-zinc-100">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                    <Icon name="activity" className="h-3.5 w-3.5 text-violet-500" />
                    <span className="text-[11px] font-semibold">Fancy Analytics</span>
                </div>
                <span className="inline-flex items-center gap-1 text-[9px] font-medium text-emerald-500">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> live
                </span>
            </div>

            {/* Metric tiles */}
            <div className="grid grid-cols-2 gap-2">
                <div className="rounded-lg border border-zinc-200 p-2 dark:border-zinc-800">
                    <div className="text-[9px] uppercase tracking-wide text-zinc-400">Avg. time on page</div>
                    <div className="mt-0.5 text-sm font-semibold">2m 14s</div>
                    <Sparkline points={[3, 4, 3.5, 5, 4.5, 6, 5.5, 7]} className="mt-1 h-4 w-full text-violet-500" />
                </div>
                <div className="rounded-lg border border-zinc-200 p-2 dark:border-zinc-800">
                    <div className="text-[9px] uppercase tracking-wide text-zinc-400">Clickthrough</div>
                    <div className="mt-0.5 text-sm font-semibold">38%</div>
                    <Sparkline points={[2, 3, 2.5, 4, 5, 4.5, 6, 6.5]} className="mt-1 h-4 w-full text-emerald-500" />
                </div>
            </div>

            {/* Focus heatmap — a live overlay on the real page, not an abstract grid */}
            <div className="rounded-lg border border-zinc-200 p-2 dark:border-zinc-800">
                <div className="mb-1 flex items-center gap-1 text-[9px] uppercase tracking-wide text-zinc-400">
                    <Icon name="flame" className="h-3 w-3 text-orange-500" /> Focus heatmap
                    <span className="ml-auto font-mono text-zinc-300 dark:text-zinc-600">/pricing</span>
                </div>
                <div className="relative h-[84px] overflow-hidden rounded-md bg-zinc-50 dark:bg-zinc-900">
                    {/* wireframe of the actual page being measured */}
                    <div className="space-y-1 p-1.5">
                        <div className="flex items-center gap-1">
                            <div className="h-1.5 w-1.5 rounded-full bg-zinc-300 dark:bg-zinc-700" />
                            <div className="h-1 w-7 rounded bg-zinc-200 dark:bg-zinc-800" />
                            <div className="ml-auto h-1 w-4 rounded bg-zinc-200 dark:bg-zinc-800" />
                            <div className="h-1 w-4 rounded bg-zinc-300 dark:bg-zinc-700" />
                        </div>
                        <div className="h-7 rounded bg-zinc-200 dark:bg-zinc-800" />
                        <div className="grid grid-cols-3 gap-1">
                            <div className="h-4 rounded bg-zinc-200 dark:bg-zinc-800" />
                            <div className="h-4 rounded bg-zinc-200 dark:bg-zinc-800" />
                            <div className="h-4 rounded bg-zinc-200 dark:bg-zinc-800" />
                        </div>
                    </div>
                    {/* the heat overlay */}
                    <div className="pointer-events-none absolute inset-0">
                        {HEAT_BLOBS.map((b, i) => (
                            <div
                                key={i}
                                className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full"
                                style={{
                                    left: `${b.x}%`,
                                    top: `${b.y}%`,
                                    width: b.r * 2,
                                    height: b.r * 2,
                                    background: `radial-gradient(circle, rgba(239,68,68,${b.hot}) 0%, rgba(249,115,22,${b.hot * 0.5}) 45%, transparent 72%)`,
                                }}
                            />
                        ))}
                    </div>
                </div>
            </div>

            {/* Section engagement bars */}
            <div className="space-y-1.5">
                {SECTION_BARS.map((b) => (
                    <div key={b.label} className="flex items-center gap-2">
                        <span className="w-12 shrink-0 text-[9px] text-zinc-500">{b.label}</span>
                        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                            <div className="h-full rounded-full bg-violet-500" style={{ width: `${b.pct}%` }} />
                        </div>
                        <span className="w-7 shrink-0 text-right text-[9px] tabular-nums text-zinc-400">{b.pct}%</span>
                    </div>
                ))}
            </div>

            {/* Live sessions (human + agent) */}
            <div className="space-y-1">
                {SESSIONS.map((s, i) => (
                    <div key={i} className="flex items-center gap-2 text-[10px]">
                        <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${s.tone === "violet" ? "bg-violet-500" : "bg-emerald-500"}`} />
                        <span className="font-medium">{s.who}</span>
                        <span className="text-zinc-400">{s.where}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

function ComingSoonAnalytics() {
    const features = [
        { icon: "sparkles", text: "Fancy Pixel — a one-line badge to show your site is built with Fancy UI." },
        { icon: "mouse-pointer-click", text: "Clickthroughs, time-on-page & scroll depth — per page, human vs. agent." },
        { icon: "flame", text: "Mouse-movement focus heatmaps that show where attention actually lands." },
        { icon: "bot", text: "Built for Human+ UX — agents are first-class visitors, measured too." },
    ];
    return (
        <Card className="mt-6 overflow-hidden border-violet-200 bg-gradient-to-br from-violet-50/70 to-transparent dark:border-violet-900/50 dark:from-violet-950/30">
            <div className="grid gap-6 p-6 lg:grid-cols-[1fr_auto] lg:items-center">
                <div className="space-y-4">
                    <div className="flex flex-wrap items-center gap-2">
                        <Badge color="violet" dot>Coming soon</Badge>
                        <Badge color="amber">Pro</Badge>
                    </div>
                    <Heading level={2} size="lg">Know exactly how people — and agents — use your site</Heading>
                    <Text className="max-w-xl">
                        We're building the <strong>Fancy Analytics Suite</strong>: drop in the new
                        <span className="mx-1 font-medium text-violet-600 dark:text-violet-300">Fancy Pixel</span>
                        and <span className="font-medium text-violet-600 dark:text-violet-300">Fancy Heuristics</span>
                        captures how every visitor — human or agent — actually moves through your pages. Pro members
                        get the full dashboard: engagement, attention heatmaps, and session replay-grade insight.
                    </Text>
                    <ul className="space-y-2">
                        {features.map((f) => (
                            <li key={f.text} className="flex items-start gap-2.5">
                                <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-md bg-violet-100 text-violet-600 dark:bg-violet-900/40 dark:text-violet-300">
                                    <Icon name={f.icon} className="h-3 w-3" />
                                </span>
                                <Text size="sm" className="!text-zinc-600 dark:!text-zinc-300">{f.text}</Text>
                            </li>
                        ))}
                    </ul>
                </div>

                <div className="mx-auto w-full max-w-[280px]">
                    <FauxClient variant="device">
                        <MockAnalyticsDashboard />
                    </FauxClient>
                    <Text size="xs" className="mt-2 text-center !text-zinc-400">Sneak peek · mock data</Text>
                </div>
            </div>
        </Card>
    );
}

export default function ShowcaseIndex({ submissions }: { submissions: Submission[] }) {
    const { props } = usePage<{ auth: { user: unknown } }>();
    const isAuth = !!props.auth?.user;

    return (
        <Layout>
            <Head title="Designer Showcase · Fancy UI" />

            <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                    <Heading level={1} size="xl">Designer Showcase</Heading>
                    <Text className="mt-2 max-w-3xl">
                        Live sites and public repos built with Fancy UI.
                    </Text>
                </div>
                {isAuth ? (
                    <Button as={Link} href="/showcase/submit" color="violet">
                        Submit a site or repo
                    </Button>
                ) : (
                    <Button as="a" href="/auth/github" color="zinc">
                        Sign in to submit
                    </Button>
                )}
            </div>

            <ComingSoonAnalytics />

            {submissions.length === 0 ? (
                <Card className="mt-6">
                    <div className="p-10 text-center text-sm text-zinc-500">
                        No verified submissions yet. Be the first — sign in and submit your site.
                    </div>
                </Card>
            ) : (
                <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {submissions.map((s) => (
                        <a
                            key={s.id}
                            href={s.url}
                            target="_blank"
                            rel="noopener"
                            className="block"
                        >
                            <Card className="overflow-hidden transition hover:-translate-y-px hover:shadow-md">
                                {s.thumbnail_url ? (
                                    <img src={s.thumbnail_url} alt="" className="h-32 w-full object-cover" />
                                ) : (
                                    <div className="grid h-32 place-items-center bg-zinc-50 text-sm text-zinc-500 dark:bg-zinc-900">
                                        {s.kind === "repo" ? "⎇ repo" : "🌐 site"}
                                    </div>
                                )}
                                <Card.Body>
                                    <Heading level={2} size="sm">
                                        {s.title ?? new URL(s.url).hostname}
                                    </Heading>
                                    {s.description && (
                                        <Text size="xs" className="mt-1">{s.description}</Text>
                                    )}
                                </Card.Body>
                            </Card>
                        </a>
                    ))}
                </div>
            )}
        </Layout>
    );
}
