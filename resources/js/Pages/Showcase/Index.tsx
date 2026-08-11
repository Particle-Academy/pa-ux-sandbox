import { Head, Link, router, usePage } from "@inertiajs/react";
import { Badge, Button, Card, Heading, Icon, Text } from "@particle-academy/react-fancy";
import { Layout } from "../Layout";

type SubmissionPackage = {
    name: string;
    slug: string | null;
    registry_url: string | null;
};

type Submission = {
    id: number;
    kind: "website" | "repo";
    url: string;
    title: string | null;
    description: string | null;
    category: string | null;
    category_label: string | null;
    made_for_children: boolean;
    thumbnail_url: string | null;
    packages?: SubmissionPackage[];
};

function hostOf(url: string): string {
    try {
        return new URL(url).hostname.replace(/^www\./, "");
    } catch {
        return url.replace(/^https?:\/\//, "").replace(/\/.*$/, "");
    }
}

// ── A compact promo banner for the (now live) Pro Analytics suite ────────────
// The showcase items are the feature; this is just a slim cross-sell strip.
function ProAnalyticsBanner() {
    return (
        <div className="mt-6 flex flex-wrap items-center gap-4 rounded-2xl border border-violet-200 bg-gradient-to-r from-violet-50 to-fuchsia-50/40 p-4 dark:border-violet-900/50 dark:from-violet-950/30 dark:to-fuchsia-950/10">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-violet-600 to-fuchsia-600 text-white shadow-sm">
                <Icon name="activity" className="h-5 w-5" />
            </span>
            <div className="min-w-[14rem] flex-1">
                <div className="flex items-center gap-2">
                    <span className="font-semibold text-zinc-900 dark:text-zinc-100">Pro Analytics is live</span>
                    <Badge color="amber">Pro</Badge>
                    <Badge color="emerald" dot>new</Badge>
                </div>
                <Text size="sm" className="mt-0.5 !text-zinc-600 dark:!text-zinc-400">
                    <strong>End-user optimization, not SEO.</strong> Acquisition, audience, attention heatmaps — and
                    the human-vs-agent split GA structurally can&apos;t see — from the Fancy Pixel.
                </Text>
            </div>
            <div className="flex shrink-0 gap-2">
                <Button as={Link} href="/analytics" color="violet">View analytics</Button>
                <Button as={Link} href="/subscriptions" variant="ghost">Go Pro</Button>
            </div>
        </div>
    );
}

function SubmissionCard({ s }: { s: Submission }) {
    const host = hostOf(s.url);
    return (
        <a href={s.url} target="_blank" rel="noopener" className="group block h-full">
            <Card padding="none" className="flex h-full flex-col overflow-hidden transition duration-200 hover:-translate-y-0.5 hover:shadow-lg">
                {/* Screenshot — full 16:10 homepage capture, top-aligned, uniform across cards. */}
                <div className="relative aspect-[16/10] w-full overflow-hidden border-b border-zinc-100 bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900">
                    {s.thumbnail_url ? (
                        <img
                            src={s.thumbnail_url}
                            alt={`Screenshot of ${s.title ?? host}`}
                            loading="lazy"
                            className="absolute inset-0 h-full w-full object-cover object-top transition duration-500 group-hover:scale-[1.03]"
                        />
                    ) : (
                        <div className="grid h-full place-items-center text-zinc-300 dark:text-zinc-600">
                            <Icon name={s.kind === "repo" ? "git-branch" : "globe"} className="h-9 w-9" />
                        </div>
                    )}
                    <span className="absolute left-2.5 top-2.5 inline-flex items-center gap-1 rounded-md bg-zinc-900/70 px-2 py-0.5 text-[11px] font-medium text-white backdrop-blur-sm">
                        <Icon name={s.kind === "repo" ? "git-branch" : "globe"} className="h-3 w-3" />
                        {s.kind === "repo" ? "Repo" : "Site"}
                    </span>
                    {s.made_for_children && (
                        <span className="absolute right-2.5 top-2.5 rounded-md bg-emerald-500/85 px-2 py-0.5 text-[11px] font-medium text-white backdrop-blur-sm">
                            Kid-safe
                        </span>
                    )}
                </div>

                {/* Details */}
                <div className="flex flex-1 flex-col gap-1.5 p-4">
                    <h3 className="line-clamp-1 font-semibold text-zinc-900 dark:text-zinc-100">
                        {s.title ?? host}
                    </h3>
                    <div className="flex items-center gap-1 font-mono text-xs text-zinc-500 dark:text-zinc-400">
                        <Icon name="link" className="h-3 w-3 shrink-0" />
                        <span className="truncate">{host}</span>
                    </div>
                    {s.description && (
                        <p className="line-clamp-2 text-sm text-zinc-600 dark:text-zinc-400">{s.description}</p>
                    )}
                    {/* The verified "built with" record — packages the scan detected,
                        linked to their registry pages. Buttons (router.visit), NOT
                        anchors: the whole card is already an <a>, and nested anchors
                        break SSR hydration. */}
                    {(s.packages?.filter((p) => p.slug).length ?? 0) > 0 && (
                        <div className="flex flex-wrap gap-1 pt-1">
                            {s
                                .packages!.filter((p) => p.slug)
                                .slice(0, 4)
                                .map((p) => (
                                    <button
                                        key={p.slug}
                                        type="button"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            router.visit(`/packages/${p.slug}`);
                                        }}
                                        className="cursor-pointer rounded-full border border-violet-200 px-2 py-0.5 text-[11px] font-medium text-violet-700 hover:bg-violet-50 dark:border-violet-900/60 dark:text-violet-300 dark:hover:bg-violet-950/40"
                                    >
                                        {p.slug}
                                    </button>
                                ))}
                            {s.packages!.filter((p) => p.slug).length > 4 && (
                                <span className="px-1 text-[11px] text-zinc-500">
                                    +{s.packages!.filter((p) => p.slug).length - 4} more
                                </span>
                            )}
                        </div>
                    )}
                    <div className="mt-auto flex items-center gap-2 pt-2.5">
                        {s.category_label && <Badge color="zinc">{s.category_label}</Badge>}
                        <span className="ml-auto inline-flex items-center gap-1 text-xs font-medium text-violet-600 dark:text-violet-400">
                            <Icon name="sparkles" className="h-3.5 w-3.5" /> Fancy UI
                        </span>
                    </div>
                </div>
            </Card>
        </a>
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
                    <Heading as="h1" size="xl">Designer Showcase</Heading>
                    <Text className="mt-2 max-w-3xl">
                        Live sites and public repos built with Fancy UI
                        {submissions.length > 0 && <span className="text-zinc-400"> · {submissions.length} verified</span>}.
                    </Text>
                </div>
                {isAuth ? (
                    <Button as={Link} href="/showcase/submit" color="violet" icon="plus">
                        Submit a site or repo
                    </Button>
                ) : (
                    <Button as="a" href="/auth/github" color="zinc">
                        Sign in to submit
                    </Button>
                )}
            </div>

            <ProAnalyticsBanner />

            {submissions.length === 0 ? (
                <Card className="mt-6">
                    <div className="p-10 text-center text-sm text-zinc-500">
                        No verified submissions yet. Be the first — sign in and submit your site.
                    </div>
                </Card>
            ) : (
                <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                    {submissions.map((s) => (
                        <SubmissionCard key={s.id} s={s} />
                    ))}
                </div>
            )}
        </Layout>
    );
}
