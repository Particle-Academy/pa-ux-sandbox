import { Head, Link } from "@inertiajs/react";
import { Badge, Button, Card, Heading, Progress, Text } from "@particle-academy/react-fancy";
import { Layout } from "../Layout";

/**
 * /learn — the Fancy UI Curriculum.
 *
 * The kit teaching itself, on `particle-academy/laravel-courses` and
 * `@particle-academy/classroom`, both installed from real registries the same
 * way any external consumer installs them. That is the point: until this page
 * existed, those packages had only ever been consumed by symlink, so the
 * registry-install path was never exercised.
 */

type Course = {
    slug: string;
    title: string;
    description: string | null;
    estimatedMinutes: number | null;
    lessonCount: number;
    hasTest: boolean;
};

type ProgressSummary = {
    lessons_total: number;
    lessons_completed: number;
    tests_total: number;
    tests_passed: number;
    overall_percent: number;
};

export default function LearnIndex({
    curriculum,
    courses,
    progress,
    enrolled,
}: {
    curriculum: { slug: string; title: string; description: string | null };
    courses: Course[];
    progress: ProgressSummary | null;
    enrolled: boolean;
}) {
    const totalMinutes = courses.reduce((sum, c) => sum + (c.estimatedMinutes ?? 0), 0);

    return (
        <Layout>
            <Head title={`${curriculum.title} — Curriculum`} />

            <div className="mx-auto max-w-4xl" data-learn-index="">
                <Heading as="h1" size="2xl">{curriculum.title}</Heading>
                {curriculum.description ? (
                    <Text className="mt-3 text-lg text-zinc-600 dark:text-zinc-300">
                        {curriculum.description}
                    </Text>
                ) : null}

                <div className="mt-4 flex flex-wrap items-center gap-2">
                    <Badge>{courses.length} courses</Badge>
                    <Badge>{courses.reduce((s, c) => s + c.lessonCount, 0)} lessons</Badge>
                    <Badge>~{Math.round(totalMinutes / 60)}h</Badge>
                    <Badge color="violet">Certificate on completion</Badge>
                </div>

                {progress ? (
                    <Card className="mt-8" data-learn-progress="">
                        <Heading as="h3" size="md">Your progress</Heading>
                        <Progress
                            className="mt-3"
                            value={progress.overall_percent}
                            max={100}
                            color="violet"
                        />
                        <Text className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                            {progress.lessons_completed} of {progress.lessons_total} lessons ·{" "}
                            {progress.tests_passed} of {progress.tests_total} tests passed ·{" "}
                            {progress.overall_percent}% overall
                        </Text>
                    </Card>
                ) : null}

                <div className="mt-8 grid gap-4">
                    {courses.map((course, i) => (
                        <Card key={course.slug} data-learn-course={course.slug}>
                            <div className="flex flex-wrap items-start justify-between gap-4">
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm tabular-nums text-zinc-400">
                                            {String(i + 1).padStart(2, "0")}
                                        </span>
                                        <Heading as="h3" size="md">{course.title}</Heading>
                                    </div>
                                    {course.description ? (
                                        <Text className="mt-2 text-zinc-600 dark:text-zinc-300">
                                            {course.description}
                                        </Text>
                                    ) : null}
                                    <div className="mt-3 flex flex-wrap gap-2">
                                        <Badge>
                                            {course.lessonCount} {course.lessonCount === 1 ? "lesson" : "lessons"}
                                        </Badge>
                                        {course.estimatedMinutes ? (
                                            <Badge>{course.estimatedMinutes} min</Badge>
                                        ) : null}
                                        {course.hasTest ? <Badge color="emerald">Graded test</Badge> : null}
                                    </div>
                                </div>
                                <Button as={Link} href={`/learn/${course.slug}`}>
                                    Open
                                </Button>
                            </div>
                        </Card>
                    ))}
                </div>

                {!enrolled ? (
                    <Text className="mt-8 text-sm text-zinc-500 dark:text-zinc-400">
                        Reading is open to everyone. Sign in to track progress, sit the graded
                        tests, and earn the certificate — the learner is resolved from your
                        account, never from a value the browser supplies.
                    </Text>
                ) : null}
            </div>
        </Layout>
    );
}
