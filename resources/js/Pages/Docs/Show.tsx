import { Link } from "@inertiajs/react";
import { Seo } from "@particle-academy/fancy-inertia/seo";
import { Button, Heading, Separator, Text } from "@particle-academy/react-fancy";
import { Layout } from "../Layout";
import { DocsBody } from "./DocsEmbeds";

type Page = {
    slug: string;
    title: string;
    description?: string;
    section?: string;
};

type Section = {
    label: string;
    pages: Page[];
};

type Neighbor = { slug: string; title: string } | null;

type Props = {
    page: Page;
    html: string;
    sections: Section[];
    neighbors: { prev: Neighbor; next: Neighbor };
};

export default function DocsShow({ page, html, sections, neighbors }: Props) {
    return (
        <Layout>
            <Seo
                title={`${page.title} — Docs`}
                description={page.description ?? `${page.title} — Fancy UI documentation.`}
                type="article"
            />

            <div className="grid gap-8 lg:grid-cols-[14rem_1fr]">
                <aside className="lg:sticky lg:top-20 lg:max-h-[calc(100vh-6rem)] lg:overflow-auto">
                    <nav>
                        {sections.map((section) => (
                            <div key={section.label} className="mb-6">
                                <Text size="xs" className="mb-2 font-semibold uppercase tracking-wider !text-zinc-500">
                                    {section.label}
                                </Text>
                                <ul className="space-y-0.5 text-sm">
                                    {section.pages.map((p) => {
                                        const active = p.slug === page.slug;
                                        return (
                                            <li key={p.slug}>
                                                <Link
                                                    href={`/docs/${p.slug}`}
                                                    className={`block rounded-md px-2 py-1 ${
                                                        active
                                                            ? "bg-violet-50 font-medium text-violet-900 dark:bg-violet-500/15 dark:text-violet-100"
                                                            : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-100"
                                                    }`}
                                                >
                                                    {p.title}
                                                </Link>
                                            </li>
                                        );
                                    })}
                                </ul>
                            </div>
                        ))}
                    </nav>
                </aside>

                <article className="min-w-0">
                    {page.section && (
                        <Text size="xs" className="font-semibold uppercase tracking-wider !text-violet-600 dark:!text-violet-300">
                            {page.section}
                        </Text>
                    )}
                    <Heading level={1} size="xl" className="mt-1">{page.title}</Heading>
                    {page.description && <Text className="mt-2 max-w-3xl !text-zinc-600 dark:!text-zinc-300">{page.description}</Text>}

                    <Separator className="my-6" />

                    <DocsBody html={html} />

                    <Separator className="mt-12" />

                    <div className="mt-6 flex flex-wrap items-stretch justify-between gap-3">
                        <div>
                            {neighbors.prev && (
                                <Button as={Link} href={`/docs/${neighbors.prev.slug}`} variant="ghost" icon="arrow-left">
                                    <span>
                                        <span className="block text-[10px] uppercase tracking-wider text-zinc-500">Previous</span>
                                        <span>{neighbors.prev.title}</span>
                                    </span>
                                </Button>
                            )}
                        </div>
                        <div>
                            {neighbors.next && (
                                <Button as={Link} href={`/docs/${neighbors.next.slug}`} variant="ghost" iconTrailing="arrow-right">
                                    <span>
                                        <span className="block text-[10px] uppercase tracking-wider text-zinc-500">Next</span>
                                        <span>{neighbors.next.title}</span>
                                    </span>
                                </Button>
                            )}
                        </div>
                    </div>
                </article>
            </div>

            <style>{`
                .docs-prose { color: rgb(63 63 70); line-height: 1.7; font-size: 0.95rem; }
                .dark .docs-prose { color: rgb(212 212 216); }
                .docs-prose h2 { font-size: 1.5rem; font-weight: 600; margin-top: 2.5rem; margin-bottom: 0.5rem; color: rgb(24 24 27); letter-spacing: -0.01em; }
                .dark .docs-prose h2 { color: rgb(244 244 245); }
                .docs-prose h3 { font-size: 1.125rem; font-weight: 600; margin-top: 2rem; margin-bottom: 0.5rem; color: rgb(24 24 27); }
                .dark .docs-prose h3 { color: rgb(244 244 245); }
                .docs-prose h4 { font-size: 0.95rem; font-weight: 600; margin-top: 1.5rem; margin-bottom: 0.25rem; color: rgb(24 24 27); }
                .dark .docs-prose h4 { color: rgb(244 244 245); }
                .docs-prose p { margin-top: 0.75rem; margin-bottom: 0.75rem; }
                .docs-prose ul { list-style: disc; padding-left: 1.5rem; margin: 0.75rem 0; }
                .docs-prose ol { list-style: decimal; padding-left: 1.5rem; margin: 0.75rem 0; }
                .docs-prose li { margin: 0.25rem 0; }
                .docs-prose a { color: rgb(124 58 237); text-decoration: underline; text-underline-offset: 3px; }
                .dark .docs-prose a { color: rgb(196 181 253); }
                .docs-prose code { background: rgb(244 244 245); padding: 0.1em 0.35em; border-radius: 0.25rem; font-family: ui-monospace, monospace; font-size: 0.85em; color: rgb(63 63 70); }
                .dark .docs-prose code { background: rgb(39 39 42); color: rgb(228 228 231); }
                .docs-prose pre { background: rgb(9 9 11); color: rgb(244 244 245); padding: 1rem 1.25rem; border-radius: 0.5rem; overflow-x: auto; font-family: ui-monospace, monospace; font-size: 0.85em; line-height: 1.55; margin: 1rem 0; }
                .docs-prose pre code { background: transparent; padding: 0; color: inherit; font-size: inherit; }
                .docs-prose blockquote { border-left: 3px solid rgb(167 139 250); padding-left: 1rem; margin: 1rem 0; color: rgb(82 82 91); font-style: italic; }
                .dark .docs-prose blockquote { color: rgb(161 161 170); border-color: rgb(124 58 237); }
                .docs-prose table { width: 100%; border-collapse: collapse; margin: 1rem 0; font-size: 0.9em; }
                .docs-prose th, .docs-prose td { border: 1px solid rgb(228 228 231); padding: 0.5rem 0.75rem; text-align: left; }
                .dark .docs-prose th, .dark .docs-prose td { border-color: rgb(39 39 42); }
                .docs-prose th { background: rgb(250 250 250); font-weight: 600; }
                .dark .docs-prose th { background: rgb(24 24 27); }
                .docs-prose hr { border: 0; border-top: 1px solid rgb(228 228 231); margin: 2rem 0; }
                .dark .docs-prose hr { border-color: rgb(39 39 42); }
            `}</style>
        </Layout>
    );
}
