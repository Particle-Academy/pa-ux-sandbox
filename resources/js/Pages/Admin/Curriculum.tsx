import { Head, Link } from "@inertiajs/react";
import { Badge, Card, Table, Text } from "@particle-academy/react-fancy";
import { adminLayout } from "./AdminLayout";
import { PageHeader, StatCard, EmptyRow } from "./ui";

type Stats = {
    enrolled: number;
    completed: number;
    completion_rate: number;
    attempts: number;
    pass_rate: number;
    certificates: number;
};
type CourseRow = { id: number; title: string; slug: string; lessons: number; learners_started: number };
type LearnerRow = { id: number; learner: string; lessons_done: number; status: string; enrolled_at: string | null };
type AttemptRow = {
    id: number;
    learner: string;
    test: string;
    score: number | null;
    max_score: number | null;
    passed: boolean;
    at: string | null;
};
type CertRow = { id: number; learner: string; code: string; issued_at: string | null };

/**
 * /admin/curriculum — the operator view of the Fancy UI Curriculum.
 *
 * Read-only by design. Lessons are authored in `FancyCurriculumContent` and
 * reconciled by `php artisan fancy:build-curriculum`; an edit surface here would
 * be a second source of truth that the next build silently overwrites, and the
 * failure mode is that it looks like it saved.
 */
function AdminCurriculum({
    curriculum,
    stats,
    courses,
    learners,
    attempts,
    certificates,
}: {
    curriculum: { title: string; slug: string } | null;
    stats: Stats | null;
    courses: CourseRow[];
    learners: LearnerRow[];
    attempts: AttemptRow[];
    certificates: CertRow[];
}) {
    // Not an error state: the content simply has not been built yet. Saying so
    // beats an empty dashboard, which reads as "nobody enrolled" and sends an
    // operator looking in entirely the wrong place.
    if (!curriculum || !stats) {
        return (
            <>
                <Head title="Curriculum — Admin" />
                <PageHeader title="Curriculum" sub="The Fancy UI Curriculum" />
                <Card style={{ padding: 24 }}>
                    <Text size="sm">
                        No curriculum has been built yet. Run{" "}
                        <code className="font-mono">php artisan fancy:build-curriculum</code> to author
                        it from <code className="font-mono">FancyCurriculumContent</code>.
                    </Text>
                </Card>
            </>
        );
    }

    return (
        <>
            <Head title="Curriculum — Admin" />
            <PageHeader
                title="Curriculum"
                sub={curriculum.title}
                actions={
                    <Link href={`/learn`} className="text-sm text-violet-600 hover:underline dark:text-violet-400">
                        View as a learner →
                    </Link>
                }
            />

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard label="Enrolled" value={stats.enrolled} icon="users" />
                <StatCard
                    label="Completed"
                    value={stats.completed}
                    icon="check-circle"
                    sub={`${stats.completion_rate}% of enrolments`}
                />
                <StatCard
                    label="Test attempts"
                    value={stats.attempts}
                    icon="clipboard-check"
                    sub={`${stats.pass_rate}% passed`}
                />
                <StatCard label="Certificates" value={stats.certificates} icon="award" />
            </div>

            <Card style={{ padding: 0, marginTop: 18 }}>
                <div style={{ padding: "14px 16px" }}>
                    <Text weight="semibold">Courses</Text>
                    <Text size="xs" className="!text-zinc-500">
                        Learners started counts anyone who has completed at least one lesson — enrolment
                        is on the curriculum, not per course.
                    </Text>
                </div>
                {courses.length === 0 ? (
                    <EmptyRow>No courses in this curriculum yet.</EmptyRow>
                ) : (
                    <Table>
                        <Table.Head>
                            <Table.Row>
                                <Table.Column label="Course" />
                                <Table.Column label="Lessons" />
                                <Table.Column label="Learners started" />
                            </Table.Row>
                        </Table.Head>
                        <Table.Body>
                            {courses.map((c) => (
                                <Table.Row key={c.id}>
                                    <Table.Cell>
                                        <Link href={`/learn/${c.slug}`} className="hover:underline">
                                            {c.title}
                                        </Link>
                                    </Table.Cell>
                                    <Table.Cell>{c.lessons}</Table.Cell>
                                    <Table.Cell>{c.learners_started}</Table.Cell>
                                </Table.Row>
                            ))}
                        </Table.Body>
                    </Table>
                )}
            </Card>

            <Card style={{ padding: 0, marginTop: 18 }}>
                <div style={{ padding: "14px 16px" }}>
                    <Text weight="semibold">Learners</Text>
                </div>
                {learners.length === 0 ? (
                    <EmptyRow>Nobody has enrolled yet.</EmptyRow>
                ) : (
                    <Table>
                        <Table.Head>
                            <Table.Row>
                                <Table.Column label="Learner" />
                                <Table.Column label="Lessons done" />
                                <Table.Column label="Status" />
                                <Table.Column label="Enrolled" />
                            </Table.Row>
                        </Table.Head>
                        <Table.Body>
                            {learners.map((l) => (
                                <Table.Row key={l.id}>
                                    <Table.Cell>{l.learner}</Table.Cell>
                                    <Table.Cell>{l.lessons_done}</Table.Cell>
                                    <Table.Cell>
                                        <Badge color={l.status === "completed" ? "green" : "zinc"} variant="soft" size="sm">
                                            {l.status}
                                        </Badge>
                                    </Table.Cell>
                                    <Table.Cell>{l.enrolled_at ?? "—"}</Table.Cell>
                                </Table.Row>
                            ))}
                        </Table.Body>
                    </Table>
                )}
            </Card>

            <div className="grid gap-[18px] lg:grid-cols-2" style={{ marginTop: 18 }}>
                <Card style={{ padding: 0 }}>
                    <div style={{ padding: "14px 16px" }}>
                        <Text weight="semibold">Recent test attempts</Text>
                    </div>
                    {attempts.length === 0 ? (
                        <EmptyRow>No attempts yet.</EmptyRow>
                    ) : (
                        <Table>
                            <Table.Head>
                                <Table.Row>
                                    <Table.Column label="Learner" />
                                    <Table.Column label="Test" />
                                    <Table.Column label="Score" />
                                    <Table.Column label="Result" />
                                </Table.Row>
                            </Table.Head>
                            <Table.Body>
                                {attempts.map((a) => (
                                    <Table.Row key={a.id}>
                                        <Table.Cell>{a.learner}</Table.Cell>
                                        <Table.Cell>{a.test}</Table.Cell>
                                        <Table.Cell>
                                            {a.score ?? "—"}
                                            {a.max_score ? ` / ${a.max_score}` : ""}
                                        </Table.Cell>
                                        <Table.Cell>
                                            <Badge color={a.passed ? "green" : "red"} variant="soft" size="sm">
                                                {a.passed ? "passed" : "failed"}
                                            </Badge>
                                        </Table.Cell>
                                    </Table.Row>
                                ))}
                            </Table.Body>
                        </Table>
                    )}
                </Card>

                <Card style={{ padding: 0 }}>
                    <div style={{ padding: "14px 16px" }}>
                        <Text weight="semibold">Certificates issued</Text>
                    </div>
                    {certificates.length === 0 ? (
                        <EmptyRow>None issued yet.</EmptyRow>
                    ) : (
                        <Table>
                            <Table.Head>
                                <Table.Row>
                                    <Table.Column label="Learner" />
                                    <Table.Column label="Code" />
                                    <Table.Column label="Issued" />
                                </Table.Row>
                            </Table.Head>
                            <Table.Body>
                                {certificates.map((c) => (
                                    <Table.Row key={c.id}>
                                        <Table.Cell>{c.learner}</Table.Cell>
                                        <Table.Cell>
                                            <code className="font-mono text-xs">{c.code}</code>
                                        </Table.Cell>
                                        <Table.Cell>{c.issued_at ?? "—"}</Table.Cell>
                                    </Table.Row>
                                ))}
                            </Table.Body>
                        </Table>
                    )}
                </Card>
            </div>
        </>
    );
}

AdminCurriculum.layout = adminLayout;
export default AdminCurriculum;
