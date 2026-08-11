import { Head, Link, router } from "@inertiajs/react";
import { useState } from "react";
import {
    Badge,
    Breadcrumbs,
    Button,
    Callout,
    Card,
    Heading,
    Icon,
    Separator,
    Text,
} from "@particle-academy/react-fancy";
import { Layout } from "../Layout";

type ScanResult = {
    badge?: boolean;
    usage_ratio?: number;
    files_scanned?: number;
    fancy_files?: number;
    passed?: boolean;
    reason?: string;
} | null;

type Submission = {
    id: number;
    site_key: string;
    kind: "website" | "repo";
    url: string;
    title: string | null;
    description: string | null;
    style: string;
    mode: string;
    status: "pending" | "verified" | "rejected";
    scanned_at: string | null;
    scan_result: ScanResult;
};

function CopyButton({ text, label = "Copy" }: { text: string; label?: string }) {
    const [copied, setCopied] = useState(false);
    return (
        <Button
            type="button"
            size="sm"
            color={copied ? "emerald" : "violet"}
            icon={copied ? "check" : "copy"}
            onClick={async () => {
                try {
                    await navigator.clipboard.writeText(text);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 1800);
                } catch {
                    /* clipboard blocked — user can select manually */
                }
            }}
        >
            {copied ? "Copied" : label}
        </Button>
    );
}

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

/** A numbered step card with a leading index chip. */
function Step({
    n,
    title,
    children,
}: {
    n: number;
    title: string;
    children: React.ReactNode;
}) {
    return (
        <Card>
            <Card.Body>
                <div className="flex items-start gap-3">
                    <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-violet-600 text-sm font-bold text-white">
                        {n}
                    </span>
                    <div className="min-w-0 flex-1">
                        <Heading as="h3" size="sm">
                            {title}
                        </Heading>
                        <div className="mt-2">{children}</div>
                    </div>
                </div>
            </Card.Body>
        </Card>
    );
}

export default function ShowcaseInstalled({
    submission,
    snippet,
    badgeMarkdown,
}: {
    submission: Submission;
    snippet: string | null;
    badgeMarkdown: string | null;
}) {
    const [rescanning, setRescanning] = useState(false);
    const isRepo = submission.kind === "repo";

    const checkNow = () => {
        setRescanning(true);
        router.post(
            `/showcase/submit/${submission.id}/rescan`,
            {},
            {
                preserveScroll: true,
                onFinish: () => setRescanning(false),
            },
        );
    };

    const host = (() => {
        try {
            return new URL(submission.url).hostname;
        } catch {
            return submission.url;
        }
    })();

    const repoSlug = (() => {
        const m = submission.url.match(/github\.com[/:]([\w.-]+\/[\w.-]+?)(?:\.git)?\/?$/i);
        return m ? m[1] : host;
    })();

    return (
        <Layout>
            <Head
                title={
                    isRepo
                        ? "Add your Fancified badge · Showcase"
                        : "Install your Fancy Pixel · Showcase"
                }
            />

            <Breadcrumbs>
                <Breadcrumbs.Item href="/showcase">Showcase</Breadcrumbs.Item>
                <Breadcrumbs.Item href="/showcase/submit">Register</Breadcrumbs.Item>
                <Breadcrumbs.Item>{isRepo ? "Badge" : "Install"}</Breadcrumbs.Item>
            </Breadcrumbs>

            {/* Success header */}
            <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2">
                        <span className="grid h-8 w-8 place-items-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-300">
                            <Icon name="check" className="h-4 w-4" />
                        </span>
                        <Heading as="h1" size="xl">
                            {isRepo ? "Your repo is registered" : "Your site is registered"}
                        </Heading>
                    </div>
                    <Text className="mt-2 max-w-2xl">
                        {isRepo ? (
                            <>
                                Add your Fancified badge to{" "}
                                <span className="font-medium">{repoSlug}</span> to get listed.
                                We verify automatically — checking the badge is in your README
                                and that Fancy powers ≥30% of your view/component files.
                            </>
                        ) : (
                            <>
                                Add your Fancy Pixel to{" "}
                                <span className="font-medium">{host}</span> to get listed. We
                                verify automatically — there&apos;s nothing to wait on but the
                                pixel going live.
                            </>
                        )}
                    </Text>
                </div>
                <div className="flex items-center gap-2">
                    <StatusBadge status={submission.status} />
                </div>
            </div>

            <div className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
                {/* ── Left: install/badge guide ─────────────────────────────── */}
                {/* `min-w-0` (and minmax(0,1fr) on the track) lets the long pixel
                    snippet scroll inside its `overflow-x-auto` <pre> instead of
                    forcing the grid wider than the viewport and pushing the status
                    rail off-screen. */}
                <div className="min-w-0 space-y-4">
                    {isRepo ? (
                        <RepoGuide
                            submission={submission}
                            badgeMarkdown={badgeMarkdown ?? ""}
                            repoSlug={repoSlug}
                            rescanning={rescanning}
                            checkNow={checkNow}
                        />
                    ) : (
                        <WebsiteGuide
                            submission={submission}
                            snippet={snippet ?? ""}
                            host={host}
                            rescanning={rescanning}
                            checkNow={checkNow}
                        />
                    )}
                </div>

                {/* ── Right: status rail ────────────────────────────────────── */}
                <div className="space-y-4 lg:sticky lg:top-6">
                    <Card>
                        <Card.Body>
                            <Heading as="h2" size="sm">
                                Verification status
                            </Heading>
                            <div className="mt-3 flex items-center gap-2">
                                <StatusBadge status={submission.status} />
                            </div>
                            <Text size="sm" className="mt-3">
                                {submission.status === "verified"
                                    ? isRepo
                                        ? "Your repo is listed in the public Showcase."
                                        : "Your site is listed in the public Showcase."
                                    : isRepo
                                      ? "Once we detect the badge AND Fancy usage ≥30%, your repo is listed automatically — no review queue."
                                      : "Once we detect the pixel, your site is listed automatically — no review queue."}
                            </Text>
                            {isRepo && submission.scan_result && (
                                <div className="mt-3 space-y-1 rounded-lg bg-zinc-50 p-2 text-[11px] dark:bg-zinc-900/50">
                                    <div className="flex items-center justify-between">
                                        <span className="text-zinc-500">Badge in README</span>
                                        <Badge
                                            size="sm"
                                            variant="soft"
                                            color={submission.scan_result.badge ? "emerald" : "zinc"}
                                        >
                                            {submission.scan_result.badge ? "found" : "missing"}
                                        </Badge>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-zinc-500">Fancy usage</span>
                                        <Badge
                                            size="sm"
                                            variant="soft"
                                            color={
                                                (submission.scan_result.usage_ratio ?? 0) >= 0.3
                                                    ? "emerald"
                                                    : "zinc"
                                            }
                                        >
                                            {Math.round(
                                                (submission.scan_result.usage_ratio ?? 0) * 100,
                                            )}
                                            % of {submission.scan_result.files_scanned ?? 0}
                                        </Badge>
                                    </div>
                                    {submission.scan_result.reason && (
                                        <Text size="xs" className="!text-amber-600 dark:!text-amber-400">
                                            {submission.scan_result.reason}
                                        </Text>
                                    )}
                                </div>
                            )}
                            <div className="mt-4 flex flex-col gap-2">
                                <Button
                                    type="button"
                                    color="violet"
                                    icon="refresh-cw"
                                    onClick={checkNow}
                                    disabled={rescanning}
                                >
                                    {rescanning ? "Checking…" : "Check now"}
                                </Button>
                                {submission.status === "verified" && (
                                    <Button as={Link} href="/showcase" variant="ghost">
                                        View the Showcase
                                    </Button>
                                )}
                            </div>
                        </Card.Body>
                    </Card>

                    <Callout color="violet" icon={<Icon name="info" />}>
                        <Text size="xs">
                            Registering never blocks. You&apos;re registered now; listing just
                            waits for {isRepo ? "the badge + scan" : "the pixel to go live"}.
                        </Text>
                    </Callout>
                </div>
            </div>
        </Layout>
    );
}

/* ── Website (pixel) install guide — unchanged behaviour ───────────────── */
function WebsiteGuide({
    submission,
    snippet,
    host,
    rescanning,
    checkNow,
}: {
    submission: Submission;
    snippet: string;
    host: string;
    rescanning: boolean;
    checkNow: () => void;
}) {
    return (
        <>
            <Card className="overflow-hidden border-violet-200 dark:border-violet-900/50">
                <Card.Body>
                    <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                            <Icon name="code" className="h-4 w-4 text-violet-500" />
                            <Heading as="h2" size="sm">
                                Your Fancy Pixel
                            </Heading>
                        </div>
                        <CopyButton text={snippet} label="Copy snippet" />
                    </div>
                    <pre className="mt-3 overflow-x-auto rounded-lg bg-zinc-900 p-3 text-[11px] leading-relaxed text-zinc-100">
                        <code>{snippet}</code>
                    </pre>
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-zinc-500">
                        <Badge color="zinc" size="sm" variant="soft">
                            site: {submission.site_key}
                        </Badge>
                        <Badge color="zinc" size="sm" variant="soft">
                            style: {submission.style}
                        </Badge>
                        <Badge color="zinc" size="sm" variant="soft">
                            mode: {submission.mode}
                        </Badge>
                    </div>
                    <Text size="xs" className="mt-2 !text-zinc-400">
                        The CDN URL activates once{" "}
                        <code className="rounded bg-zinc-100 px-1 dark:bg-zinc-800">
                            @particle-academy/fancy-pixel
                        </code>{" "}
                        publishes. Your{" "}
                        <code className="rounded bg-zinc-100 px-1 dark:bg-zinc-800">
                            data-site
                        </code>{" "}
                        key is already live.
                    </Text>
                </Card.Body>
            </Card>

            <Separator label="Install in 4 steps" />

            <Step n={1} title="Copy your snippet">
                <Text size="sm">
                    One line — that&apos;s the whole pixel. It carries your unique site key so
                    we can tie verification (and later, heuristics) to this exact site.
                </Text>
                <div className="mt-3">
                    <CopyButton text={snippet} />
                </div>
            </Step>

            <Step n={2} title="Paste it before </head> on every page">
                <Text size="sm">
                    Drop it right before the closing{" "}
                    <code className="rounded bg-zinc-100 px-1 dark:bg-zinc-800">
                        &lt;/head&gt;
                    </code>{" "}
                    tag so it loads on every page you want measured.
                </Text>
                <div className="mt-3 overflow-x-auto rounded-lg border border-zinc-200 bg-zinc-950 p-3 font-mono text-[11px] leading-relaxed dark:border-zinc-800">
                    <div className="text-zinc-500">&lt;!doctype html&gt;</div>
                    <div className="text-sky-300">&lt;html&gt;</div>
                    <div className="pl-3 text-sky-300">&lt;head&gt;</div>
                    <div className="pl-6 text-zinc-500">
                        &lt;meta charset=&quot;utf-8&quot; /&gt;
                    </div>
                    <div className="pl-6 text-zinc-500">
                        &lt;title&gt;{host}&lt;/title&gt;
                    </div>
                    <div className="my-1 rounded bg-violet-500/20 px-2 py-1 ring-1 ring-violet-500/50">
                        <div className="flex items-center gap-1.5">
                            <Icon name="arrow-right" className="h-3 w-3 text-violet-300" />
                            <span className="break-all text-violet-100">{snippet}</span>
                        </div>
                    </div>
                    <div className="pl-3 text-sky-300">&lt;/head&gt;</div>
                    <div className="pl-3 text-zinc-500">&lt;body&gt;…&lt;/body&gt;</div>
                    <div className="text-sky-300">&lt;/html&gt;</div>
                </div>
            </Step>

            <Step n={3} title="Publish your site">
                <Text size="sm">
                    Deploy the change so the pixel is live on the public URL you registered —
                    that&apos;s the page we fetch.
                </Text>
            </Step>

            <Step n={4} title="We verify automatically">
                <Text size="sm">
                    We scan for your pixel within minutes, and again twice a day. The moment
                    it&apos;s detected, your site flips to{" "}
                    <span className="font-medium text-emerald-600 dark:text-emerald-400">
                        Verified
                    </span>{" "}
                    and appears in the public Showcase.
                </Text>
                <div className="mt-3 flex flex-wrap items-center gap-3">
                    <StatusBadge status={submission.status} />
                    <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        icon="refresh-cw"
                        onClick={checkNow}
                        disabled={rescanning}
                    >
                        {rescanning ? "Checking…" : "Check now"}
                    </Button>
                    {submission.scanned_at && (
                        <Text size="xs" className="!text-zinc-400">
                            Last checked {new Date(submission.scanned_at).toLocaleString()}
                        </Text>
                    )}
                </div>
            </Step>
        </>
    );
}

/* ── Repo (README badge) install guide ─────────────────────────────────── */
function RepoGuide({
    submission,
    badgeMarkdown,
    repoSlug,
    rescanning,
    checkNow,
}: {
    submission: Submission;
    badgeMarkdown: string;
    repoSlug: string;
    rescanning: boolean;
    checkNow: () => void;
}) {
    return (
        <>
            <Card className="overflow-hidden border-violet-200 dark:border-violet-900/50">
                <Card.Body>
                    <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                            <Icon name="award" className="h-4 w-4 text-violet-500" />
                            <Heading as="h2" size="sm">
                                Your Fancified badge
                            </Heading>
                        </div>
                        <CopyButton text={badgeMarkdown} label="Copy markdown" />
                    </div>

                    {/* Live badge preview */}
                    <div className="mt-3 flex items-center gap-3">
                        <img
                            src={`/badge/fancified.svg?site=${submission.site_key}`}
                            alt="Fancified"
                            height={20}
                            className="h-5"
                        />
                        <Text size="xs" className="!text-zinc-400">
                            This is what renders in your README.
                        </Text>
                    </div>

                    <pre className="mt-3 overflow-x-auto rounded-lg bg-zinc-900 p-3 text-[11px] leading-relaxed text-zinc-100">
                        <code>{badgeMarkdown}</code>
                    </pre>
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-zinc-500">
                        <Badge color="zinc" size="sm" variant="soft">
                            site: {submission.site_key}
                        </Badge>
                        <Badge color="zinc" size="sm" variant="soft">
                            repo: {repoSlug}
                        </Badge>
                    </div>
                    <Text size="xs" className="mt-2 !text-zinc-400">
                        The badge is keyed to your submission, so we can confirm{" "}
                        <span className="font-medium">your</span> repo carries it — not just any
                        Fancified mark.
                    </Text>
                </Card.Body>
            </Card>

            <Separator label="Get listed in 4 steps" />

            <Step n={1} title="Copy the badge markdown">
                <Text size="sm">
                    One line of Markdown. It hot-links the public Fancified badge and carries
                    your unique site key.
                </Text>
                <div className="mt-3">
                    <CopyButton text={badgeMarkdown} label="Copy markdown" />
                </div>
            </Step>

            <Step n={2} title="Paste it near the top of your README.md">
                <Text size="sm">
                    Drop it just under your project title so visitors (and our verifier) see
                    you&apos;re Fancified.
                </Text>
                {/* Visual mock of a README with the badge line highlighted */}
                <div className="mt-3 overflow-x-auto rounded-lg border border-zinc-200 bg-zinc-950 p-3 font-mono text-[11px] leading-relaxed dark:border-zinc-800">
                    <div className="text-sky-300"># {repoSlug.split("/").pop()}</div>
                    <div className="my-1 rounded bg-violet-500/20 px-2 py-1 ring-1 ring-violet-500/50">
                        <div className="flex items-center gap-1.5">
                            <Icon name="arrow-right" className="h-3 w-3 text-violet-300" />
                            <span className="break-all text-violet-100">{badgeMarkdown}</span>
                        </div>
                    </div>
                    <div className="text-zinc-500">A fancy app built with Fancy UI.</div>
                    <div className="mt-1 text-zinc-600">## Getting started</div>
                </div>
            </Step>

            <Step n={3} title="Commit & push">
                <Text size="sm">
                    Push the README change to your default branch — that&apos;s the README we
                    read via the GitHub API.
                </Text>
            </Step>

            <Step n={4} title="We verify automatically">
                <Text size="sm">
                    We check that the badge is present{" "}
                    <span className="font-medium">and</span> that your codebase uses Fancy in{" "}
                    <span className="font-medium text-violet-600 dark:text-violet-400">
                        ≥30%
                    </span>{" "}
                    of its view/component files (
                    <code className="rounded bg-zinc-100 px-1 dark:bg-zinc-800">
                        .tsx .jsx .vue .svelte .blade.php
                    </code>
                    ). When both pass, your repo flips to{" "}
                    <span className="font-medium text-emerald-600 dark:text-emerald-400">
                        Verified
                    </span>{" "}
                    and appears in the Showcase.
                </Text>
                <div className="mt-3 flex flex-wrap items-center gap-3">
                    <StatusBadge status={submission.status} />
                    <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        icon="refresh-cw"
                        onClick={checkNow}
                        disabled={rescanning}
                    >
                        {rescanning ? "Checking…" : "Check now"}
                    </Button>
                    {submission.scanned_at && (
                        <Text size="xs" className="!text-zinc-400">
                            Last checked {new Date(submission.scanned_at).toLocaleString()}
                        </Text>
                    )}
                </div>
            </Step>
        </>
    );
}
