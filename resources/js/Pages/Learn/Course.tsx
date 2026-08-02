import { useState } from "react";
import { Head, Link, router } from "@inertiajs/react";
import {
    CoursePlayer,
    type AnswerInput,
    type Course,
    type Enrollment,
    type Lesson,
    type Test,
    type TestAttempt,
} from "@particle-academy/classroom";
import { Button, Callout } from "@particle-academy/react-fancy";
import { Layout } from "../Layout";
import { post } from "./api";

/**
 * /learn/{course} — the course itself, played by classroom's `CoursePlayer`.
 *
 * `CoursePlayer` owns modules, lessons, progress AND the graded test; this page
 * supplies the data and the four handlers it asks for. Everything the learner
 * sees is the package's UI, which is the whole point of the dogfood.
 */
export default function LearnCourse({
    course,
    enrollment,
    completedLessonIds,
    authenticated,
}: {
    course: Course;
    curriculumSlug: string;
    enrollment: Enrollment | null;
    completedLessonIds: number[];
    authenticated: boolean;
}) {
    const [completed, setCompleted] = useState<Set<number>>(new Set(completedLessonIds));

    async function handleEnroll() {
        if (!authenticated) {
            router.visit("/login");

            return;
        }

        await post("/learn/enroll");
        router.reload();
    }

    async function markLessonComplete(lesson: Lesson) {
        const result = await post<{ completed_lesson_ids: number[] }>(
            `/learn/lessons/${lesson.id}/complete`,
        );
        setCompleted(new Set(result.completed_lesson_ids));
    }

    const startAttempt = (test: Test) => post<TestAttempt>(`/learn/tests/${test.id}/attempts`);

    const submitAttempt = (attempt: TestAttempt, answers: AnswerInput[]) =>
        post<TestAttempt>(`/learn/attempts/${attempt.id}/submit`, { answers });

    return (
        <Layout>
            <Head title={`${course.title} — Fancy UI Curriculum`} />

            <div className="mx-auto max-w-4xl" data-learn-course={course.slug}>
                <Link
                    href="/learn"
                    className="text-sm text-violet-600 hover:underline dark:text-violet-400"
                >
                    ← Fancy UI Curriculum
                </Link>

                {enrollment ? (
                    <div className="mt-4">
                        <CoursePlayer
                            course={course}
                            enrollment={enrollment}
                            completedLessonIds={completed}
                            onMarkLessonComplete={markLessonComplete}
                            onStartAttempt={startAttempt}
                            onSubmitAttempt={submitAttempt}
                        />
                    </div>
                ) : (
                    <>
                        <Callout className="mt-4">
                            Reading is open to everyone. Enrol to record progress, sit the graded
                            test and earn the certificate — the learner is resolved from your
                            account, never from a value the browser supplies.
                            <div className="mt-3">
                                <Button onClick={handleEnroll}>
                                    {authenticated ? "Enrol in the curriculum" : "Sign in to enrol"}
                                </Button>
                            </div>
                        </Callout>

                        {/*
                         * Un-enrolled readers still get the real component, driven
                         * against a throwaway enrollment so the lesson content is
                         * public. The handlers reject rather than silently no-op —
                         * the server would refuse anyway (403, not enrolled), and a
                         * button that appears to work is worse than one that says no.
                         */}
                        <div className="mt-4 opacity-95">
                            <CoursePlayer
                                course={course}
                                enrollment={{ id: 0 } as Enrollment}
                                completedLessonIds={new Set()}
                                onMarkLessonComplete={async () => {
                                    await handleEnroll();
                                }}
                                onStartAttempt={async () => {
                                    await handleEnroll();
                                    throw new Error("Enrol first.");
                                }}
                                onSubmitAttempt={async () => {
                                    throw new Error("Enrol first.");
                                }}
                            />
                        </div>
                    </>
                )}
            </div>
        </Layout>
    );
}
