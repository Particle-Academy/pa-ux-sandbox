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
                        <Heading level={3} size="sm">
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
}: {
    submission: Submission;
    snippet: string;
}) {
    const [rescanning, setRescanning] = useState(false);

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

    return (
        <Layout>
            <Head title="Install your Fancy Pixel · Showcase" />

            <Breadcrumbs>
                <Breadcrumbs.Item href="/showcase">Showcase</Breadcrumbs.Item>
                <Breadcrumbs.Item href="/showcase/submit">Register</Breadcrumbs.Item>
                <Breadcrumbs.Item>Install</Breadcrumbs.Item>
            </Breadcrumbs>

            {/* Success header */}
            <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2">
                        <span className="grid h-8 w-8 place-items-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-300">
                            <Icon name="check" className="h-4 w-4" />
                        </span>
                        <Heading level={1} size="xl">
                            Your site is registered
                        </Heading>
                    </div>
                    <Text className="mt-2 max-w-2xl">
                        Add your Fancy Pixel to <span className="font-medium">{host}</span> to
                        get listed. We verify automatically — there&apos;s nothing to wait on
                        but the pixel going live.
                    </Text>
                </div>
                <div className="flex items-center gap-2">
                    <StatusBadge status={submission.status} />
                </div>
            </div>

            <div className="mt-6 grid gap-4 lg:grid-cols-[1fr_320px] lg:items-start">
                {/* ── Left: snippet + install steps ─────────────────────────── */}
                <div className="space-y-4">
                    {/* Snippet generator */}
                    <Card className="overflow-hidden border-violet-200 dark:border-violet-900/50">
                        <Card.Body>
                            <div className="flex items-center justify-between gap-3">
                                <div className="flex items-center gap-2">
                                    <Icon name="code" className="h-4 w-4 text-violet-500" />
                                    <Heading level={2} size="sm">
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
                            One line — that&apos;s the whole pixel. It carries your unique site
                            key so we can tie verification (and later, heuristics) to this
                            exact site.
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
                        {/* Visual mock of an HTML <head> with the snippet highlighted */}
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
                            Deploy the change so the pixel is live on the public URL you
                            registered — that&apos;s the page we fetch.
                        </Text>
                    </Step>

                    <Step n={4} title="We verify automatically">
                        <Text size="sm">
                            We scan for your pixel within minutes, and again twice a day. The
                            moment it&apos;s detected, your site flips to{" "}
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
                </div>

                {/* ── Right: status rail ────────────────────────────────────── */}
                <div className="space-y-4 lg:sticky lg:top-6">
                    <Card>
                        <Card.Body>
                            <Heading level={2} size="sm">
                                Verification status
                            </Heading>
                            <div className="mt-3 flex items-center gap-2">
                                <StatusBadge status={submission.status} />
                            </div>
                            <Text size="sm" className="mt-3">
                                {submission.status === "verified"
                                    ? "Your site is listed in the public Showcase."
                                    : "Once we detect the pixel, your site is listed automatically — no review queue."}
                            </Text>
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
                            waits for the pixel to go live.
                        </Text>
                    </Callout>
                </div>
            </div>
        </Layout>
    );
}
