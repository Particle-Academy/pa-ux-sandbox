import { Link } from "@inertiajs/react";
import { Seo } from "@particle-academy/fancy-inertia/seo";
import { Badge, Card, Heading, Icon, Text } from "@particle-academy/react-fancy";
import { useMemo, useState } from "react";
import { Layout } from "../Layout";

type PackageRef = { slug: string; name: string; href: string };
type UseCase = {
    slug: string;
    title: string;
    category: string;
    summary: string;
    packages: PackageRef[];
};

/**
 * /use-cases — the "I have this problem" index.
 *
 * `/packages` answers "what is this?", which only helps a reader who already
 * knows the vocabulary. This is the door for one who does not: every card leads
 * with the problem, and the packages are the answer rather than the heading.
 */
function UseCasesIndex({ categories, useCases }: { categories: string[]; useCases: UseCase[] }) {
    const [query, setQuery] = useState("");

    const matches = useMemo(() => {
        const q = query.trim().toLowerCase();

        if (!q) {
            return useCases;
        }

        // Package names are searched too: plenty of readers arrive knowing the
        // package and wanting to see what it is FOR.
        return useCases.filter((u) =>
            [u.title, u.summary, u.category, ...u.packages.map((p) => p.slug)]
                .join(" ")
                .toLowerCase()
                .includes(q),
        );
    }, [query, useCases]);

    const grouped = useMemo(
        () =>
            categories
                .map((category) => ({
                    category,
                    items: matches.filter((u) => u.category === category),
                }))
                .filter((g) => g.items.length > 0),
        [categories, matches],
    );

    return (
        <Layout>
            {/* Head owned server-side by SeoServiceProvider's `use-cases.index`
                route. A raw <Head title> duplicates the fancy-seo Blade
                baseline's <title> under SSR. */}
            <Seo />

            <div className="section">
                <div style={{ maxWidth: 760 }}>
                    <Heading as="h1" size="xl">Use cases</Heading>
                    <Text className="!text-zinc-600 dark:!text-zinc-400" style={{ marginTop: 10 }}>
                        Start from the problem. Each one states what goes wrong, then walks through
                        solving it with the packages and components in the kit — in the order you
                        would actually do it.
                    </Text>
                </div>

                <div style={{ marginTop: 22, maxWidth: 420 }}>
                    <label className="sr-only" htmlFor="use-case-search">
                        Search use cases
                    </label>
                    <input
                        id="use-case-search"
                        type="search"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Search — agents, stripe, workflow, docx…"
                        className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-violet-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                    />
                </div>

                {grouped.length === 0 && (
                    <Card style={{ marginTop: 24, padding: 24 }}>
                        <Text size="sm">
                            Nothing matches “{query}”. Every use case is listed without a search —
                            clear the box to see all {useCases.length}.
                        </Text>
                    </Card>
                )}

                {grouped.map((group) => (
                    <div key={group.category} style={{ marginTop: 34 }}>
                        <div className="flex items-baseline gap-3">
                            <Heading as="h2" size="md">
                                {group.category}
                            </Heading>
                            <Text size="xs" className="!text-zinc-500">
                                {group.items.length}
                            </Text>
                        </div>

                        <div className="mt-3 grid gap-3 md:grid-cols-2">
                            {group.items.map((useCase) => (
                                <Link
                                    key={useCase.slug}
                                    href={`/use-cases/${useCase.slug}`}
                                    className="group block no-underline"
                                >
                                    <Card
                                        style={{ padding: 18, height: "100%" }}
                                        className="transition-colors group-hover:border-violet-400 dark:group-hover:border-violet-500"
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                            <Heading as="h3" size="sm" style={{ margin: 0 }}>
                                                {useCase.title}
                                            </Heading>
                                            <Icon
                                                name="arrow-right"
                                                className="mt-0.5 shrink-0 text-zinc-400 transition-transform group-hover:translate-x-0.5 group-hover:text-violet-500"
                                            />
                                        </div>

                                        <Text size="sm" className="!text-zinc-600 dark:!text-zinc-400" style={{ marginTop: 8 }}>
                                            {useCase.summary}
                                        </Text>

                                        <div className="mt-3 flex flex-wrap gap-1.5">
                                            {useCase.packages.slice(0, 4).map((pkg) => (
                                                <Badge key={pkg.slug} variant="soft" color="zinc" size="sm">
                                                    {pkg.slug}
                                                </Badge>
                                            ))}
                                            {useCase.packages.length > 4 && (
                                                <Badge variant="soft" color="zinc" size="sm">
                                                    +{useCase.packages.length - 4}
                                                </Badge>
                                            )}
                                        </div>
                                    </Card>
                                </Link>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </Layout>
    );
}

export default UseCasesIndex;
