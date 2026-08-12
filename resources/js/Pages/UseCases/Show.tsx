import { Head, Link } from "@inertiajs/react";
import { Badge, Card, ContentRenderer, Heading, Icon, Text } from "@particle-academy/react-fancy";
import { Layout } from "../Layout";

type PackageRef = { slug: string; name: string; href: string };
type Step = { title: string; body: string; code?: string };
type Neighbour = { slug: string; title: string } | null;

type UseCase = {
    slug: string;
    title: string;
    category: string;
    summary: string;
    problem: string;
    steps: Step[];
    packages: PackageRef[];
    link: string | null;
    link_label: string | null;
};

/**
 * /use-cases/{slug} — problem first, then the how-to.
 *
 * The order is the whole point. A reader who is not yet convinced they have the
 * problem has no reason to read an install command, so the problem statement
 * gets the top of the page and names no Fancy package at all.
 *
 * Prose renders through `ContentRenderer` rather than a hand-rolled markdown
 * pass: it is the kit's own component, it sanitizes by default, and using it
 * here is the same rule the rest of the showcase follows — we build from the
 * suite, so gaps in it surface as our problem rather than someone else's.
 */
function UseCaseShow({ useCase, next, previous }: { useCase: UseCase; next: Neighbour; previous: Neighbour }) {
    return (
        <Layout>
            <Head title={`${useCase.title} — Use cases`}>
                <meta name="description" content={useCase.summary} />
            </Head>

            <div className="section">
                <Link
                    href="/use-cases"
                    className="inline-flex items-center gap-1 text-sm text-zinc-500 no-underline hover:text-violet-600 dark:hover:text-violet-400"
                >
                    <Icon name="arrow-left" /> All use cases
                </Link>

                <div style={{ maxWidth: 720, marginTop: 14 }}>
                    <Badge variant="soft" color="violet" size="sm">
                        {useCase.category}
                    </Badge>
                    <Heading as="h1" size="xl" style={{ marginTop: 10 }}>
                        {useCase.title}
                    </Heading>
                    <Text className="!text-zinc-600 dark:!text-zinc-400" style={{ marginTop: 10 }}>
                        {useCase.summary}
                    </Text>
                </div>

                {/* The problem, before any solution. */}
                <Card style={{ marginTop: 26, padding: 22, maxWidth: 720 }}>
                    <div className="flex items-center gap-2">
                        <Icon name="circle-alert" className="text-amber-500" />
                        <Heading as="h2" size="sm" style={{ margin: 0 }}>
                            The problem
                        </Heading>
                    </div>
                    <ContentRenderer
                        value={useCase.problem}
                        format="markdown"
                        className="mt-3 text-[15px] leading-relaxed text-zinc-700 dark:text-zinc-300"
                    />
                </Card>

                <div style={{ marginTop: 34, maxWidth: 720 }}>
                    <Heading as="h2" size="md">
                        How to solve it
                    </Heading>

                    <ol className="mt-4 list-none space-y-4 p-0">
                        {useCase.steps.map((step, i) => (
                            <li key={step.title} className="flex gap-4">
                                <span
                                    aria-hidden="true"
                                    className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-violet-100 text-sm font-semibold text-violet-700 dark:bg-violet-500/15 dark:text-violet-300"
                                >
                                    {i + 1}
                                </span>
                                <div className="min-w-0 flex-1">
                                    <Heading as="h3" size="sm" style={{ margin: 0 }}>
                                        {step.title}
                                    </Heading>
                                    <ContentRenderer
                                        value={step.body}
                                        format="markdown"
                                        className="mt-1.5 text-[15px] leading-relaxed text-zinc-700 dark:text-zinc-300"
                                    />
                                    {step.code && (
                                        <pre className="mt-2.5 overflow-x-auto rounded-lg border border-zinc-200 bg-zinc-50 p-3 text-xs leading-relaxed dark:border-zinc-800 dark:bg-zinc-900">
                                            <code className="font-mono">{step.code}</code>
                                        </pre>
                                    )}
                                </div>
                            </li>
                        ))}
                    </ol>
                </div>

                <div style={{ marginTop: 34, maxWidth: 720 }}>
                    <Heading as="h2" size="md">
                        Packages used
                    </Heading>
                    <div className="mt-3 flex flex-wrap gap-2">
                        {useCase.packages.map((pkg) => (
                            <Link
                                key={pkg.slug}
                                href={pkg.href}
                                className="rounded-lg border border-zinc-200 px-3 py-1.5 text-sm no-underline transition-colors hover:border-violet-400 hover:text-violet-600 dark:border-zinc-700 dark:hover:border-violet-500 dark:hover:text-violet-400"
                            >
                                {pkg.slug}
                            </Link>
                        ))}
                    </div>

                    {useCase.link && (
                        <Link
                            href={useCase.link}
                            className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-violet-600 no-underline hover:underline dark:text-violet-400"
                        >
                            {useCase.link_label ?? "See it in action"} <Icon name="arrow-right" />
                        </Link>
                    )}
                </div>

                <nav className="mt-10 flex flex-wrap items-center justify-between gap-3 border-t border-zinc-200 pt-5 dark:border-zinc-800">
                    {previous ? (
                        <Link
                            href={`/use-cases/${previous.slug}`}
                            className="inline-flex max-w-[45%] items-center gap-1.5 text-sm text-zinc-600 no-underline hover:text-violet-600 dark:text-zinc-400 dark:hover:text-violet-400"
                        >
                            <Icon name="arrow-left" /> <span className="truncate">{previous.title}</span>
                        </Link>
                    ) : (
                        <span />
                    )}
                    {next && (
                        <Link
                            href={`/use-cases/${next.slug}`}
                            className="inline-flex max-w-[45%] items-center gap-1.5 text-sm text-zinc-600 no-underline hover:text-violet-600 dark:text-zinc-400 dark:hover:text-violet-400"
                        >
                            <span className="truncate">{next.title}</span> <Icon name="arrow-right" />
                        </Link>
                    )}
                </nav>
            </div>
        </Layout>
    );
}

export default UseCaseShow;
