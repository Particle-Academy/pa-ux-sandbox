import { useState } from "react";
import { Head, Link } from "@inertiajs/react";
import { Badge, Button, Card, Heading, Text } from "@particle-academy/react-fancy";
import { Layout } from "../Layout";

/**
 * /learn/{course} — modules, lessons, and the course's graded test.
 *
 * Lesson content is markdown authored in `FancyCurriculumContent`. It is
 * rendered by a deliberately small renderer rather than pulled through a
 * markdown library: the content is ours, the subset used is narrow, and adding a
 * dependency to render our own prose is a poor trade. It escapes nothing into
 * `dangerouslySetInnerHTML` — every branch produces React elements.
 */

type Lesson = {
    id: number;
    slug: string;
    title: string;
    content: string | null;
    estimatedMinutes: number | null;
    completed: boolean;
};

type Module = { slug: string; title: string; lessons: Lesson[] };

export default function LearnCourse({
    course,
    modules,
    test,
    enrolled,
}: {
    course: { slug: string; title: string; description: string | null; estimatedMinutes: number | null };
    modules: Module[];
    test: { slug: string; title: string; passing_score: number | null } | null;
    enrolled: boolean;
    enrollmentId: number | null;
}) {
    const firstLesson = modules[0]?.lessons[0]?.slug ?? null;
    const [open, setOpen] = useState<string | null>(firstLesson);

    return (
        <Layout>
            <Head title={`${course.title} — Fancy UI Curriculum`} />

            <div className="mx-auto max-w-3xl" data-learn-course={course.slug}>
                <Link href="/learn" className="text-sm text-violet-600 hover:underline dark:text-violet-400">
                    ← Fancy UI Curriculum
                </Link>

                <Heading as="h1" size="2xl" className="mt-3">
                    {course.title}
                </Heading>
                {course.description ? (
                    <Text className="mt-3 text-lg text-zinc-600 dark:text-zinc-300">{course.description}</Text>
                ) : null}

                {modules.map((module) => (
                    /*
                     * A <div>, not a <section>, and deliberately.
                     *
                     * The showcase's landing CSS carries an UNLAYERED
                     * `section, .section { padding: 96px 0 }` plus a
                     * `section + section` border, for full-bleed marketing bands.
                     * Tailwind v4 emits utilities inside `@layer utilities`, and
                     * unlayered CSS beats layered CSS in the cascade regardless of
                     * specificity — so `py-0` does NOT override it (measured: the
                     * class applied and computed padding stayed 96px). Only
                     * `!important` would win, which is a worse trade than not using
                     * the element. Every other page here uses <section> only with a
                     * landing class that wants that padding.
                     */
                    <div key={module.slug} className="mt-10" data-learn-module={module.slug}>
                        <Heading as="h2" size="lg">{module.title}</Heading>

                        <div className="mt-4 grid gap-3">
                            {module.lessons.map((lesson) => {
                                const isOpen = open === lesson.slug;

                                return (
                                    <Card key={lesson.slug} data-learn-lesson={lesson.slug}>
                                        <button
                                            type="button"
                                            className="flex w-full items-center justify-between gap-4 text-left"
                                            onClick={() => setOpen(isOpen ? null : lesson.slug)}
                                            aria-expanded={isOpen}
                                        >
                                            <span className="flex min-w-0 items-center gap-3">
                                                <span
                                                    aria-hidden
                                                    className={
                                                        "inline-block size-2 shrink-0 rounded-full " +
                                                        (lesson.completed ? "bg-emerald-500" : "bg-zinc-300 dark:bg-zinc-700")
                                                    }
                                                />
                                                <span className="truncate font-medium">{lesson.title}</span>
                                            </span>
                                            <span className="shrink-0 text-sm text-zinc-500">
                                                {lesson.estimatedMinutes ? `${lesson.estimatedMinutes} min` : ""}
                                            </span>
                                        </button>

                                        {isOpen && lesson.content ? (
                                            <div className="mt-4 border-t border-zinc-200 pt-4 dark:border-zinc-800">
                                                <Markdown source={lesson.content} />
                                            </div>
                                        ) : null}
                                    </Card>
                                );
                            })}
                        </div>
                    </div>
                ))}

                {test ? (
                    <Card className="mt-10" data-learn-test={test.slug}>
                        <Heading as="h3" size="md">{test.title}</Heading>
                        <Text className="mt-2 text-zinc-600 dark:text-zinc-300">
                            {test.passing_score
                                ? `Pass mark ${test.passing_score}%.`
                                : "Graded test."}{" "}
                            {enrolled
                                ? "Answers are graded on submission."
                                : "Sign in to sit this test and record the result."}
                        </Text>
                        <div className="mt-4">
                            <Badge color={enrolled ? "emerald" : "zinc"}>
                                {enrolled ? "Available" : "Sign in required"}
                            </Badge>
                        </div>
                    </Card>
                ) : null}
            </div>
        </Layout>
    );
}

/**
 * The narrow markdown subset the curriculum actually uses: headings are avoided
 * inside lessons, so this handles fenced code, bold, inline code, and
 * paragraphs. Anything it does not recognise renders as plain text — which is
 * the right failure mode for prose.
 */
function Markdown({ source }: { source: string }) {
    const blocks: React.ReactNode[] = [];
    const parts = source.split(/```\n?/);

    parts.forEach((part, i) => {
        if (i % 2 === 1) {
            blocks.push(
                <pre
                    key={`code-${i}`}
                    className="my-4 overflow-x-auto rounded-lg bg-zinc-900 p-4 text-sm text-zinc-100"
                >
                    <code>{part.replace(/\n$/, "")}</code>
                </pre>,
            );
            return;
        }

        part
            .split(/\n{2,}/)
            .map((p) => p.trim())
            .filter(Boolean)
            .forEach((paragraph, j) => {
                if (paragraph.startsWith("- ")) {
                    blocks.push(
                        <ul key={`ul-${i}-${j}`} className="my-3 list-disc space-y-1 pl-5">
                            {paragraph.split(/\n(?=- )/).map((li, k) => (
                                <li key={k} className="text-zinc-700 dark:text-zinc-300">
                                    {inline(li.replace(/^- /, ""))}
                                </li>
                            ))}
                        </ul>,
                    );
                    return;
                }

                // Ordered lists. Without this the numbered contract in the
                // capstone renders as one run-on paragraph — the items are what
                // is being taught, so losing the structure loses the lesson.
                if (/^\d+\.\s/.test(paragraph)) {
                    blocks.push(
                        <ol key={`ol-${i}-${j}`} className="my-3 list-decimal space-y-2 pl-5">
                            {paragraph.split(/\n(?=\d+\.\s)/).map((li, k) => (
                                <li key={k} className="text-zinc-700 dark:text-zinc-300">
                                    {inline(li.replace(/^\d+\.\s/, ""))}
                                </li>
                            ))}
                        </ol>,
                    );
                    return;
                }

                blocks.push(
                    <p key={`p-${i}-${j}`} className="my-3 leading-relaxed text-zinc-700 dark:text-zinc-300">
                        {inline(paragraph)}
                    </p>,
                );
            });
    });

    return <div data-learn-lesson-body="">{blocks}</div>;
}

/**
 * Bold, italic and inline code, as React nodes. Never HTML.
 *
 * `**bold**` must be matched before `*italic*` in the alternation, or the
 * single-asterisk branch eats the first two characters of every bold run.
 */
function inline(text: string): React.ReactNode[] {
    return text.split(/(\*\*[^*]+\*\*|\*[^*\n]+\*|`[^`]+`)/g).map((chunk, i) => {
        if (chunk.startsWith("**") && chunk.endsWith("**")) {
            return <strong key={i}>{chunk.slice(2, -2)}</strong>;
        }
        if (chunk.startsWith("*") && chunk.endsWith("*") && chunk.length > 2) {
            return <em key={i}>{chunk.slice(1, -1)}</em>;
        }
        if (chunk.startsWith("`") && chunk.endsWith("`") && chunk.length > 2) {
            return (
                <code
                    key={i}
                    className="rounded bg-zinc-100 px-1 py-0.5 text-[0.9em] dark:bg-zinc-800"
                >
                    {chunk.slice(1, -1)}
                </code>
            );
        }
        return <span key={i}>{chunk.replace(/\n/g, " ")}</span>;
    });
}
