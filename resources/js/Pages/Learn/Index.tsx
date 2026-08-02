import { Head, router } from "@inertiajs/react";
import { CurriculumOverview, type Course, type Curriculum } from "@particle-academy/classroom";
import { Layout } from "../Layout";
import { post } from "./api";

/**
 * /learn — the Fancy UI Curriculum.
 *
 * The surface is `CurriculumOverview` from `@particle-academy/classroom`,
 * installed from npm like any consumer would. Nothing here re-implements a
 * course list: a dogfood that hand-rolls the UI it is dogfooding proves nothing
 * about the package, and the first attempt at this page did exactly that.
 */
export default function LearnIndex({
    curriculum,
    courseProgress,
    enrolled,
    authenticated,
}: {
    curriculum: Curriculum;
    courseProgress: Record<number, number>;
    enrolled: boolean;
    authenticated: boolean;
    summary: Record<string, number> | null;
}) {
    async function handleEnroll() {
        if (!authenticated) {
            router.visit("/login");

            return;
        }

        await post("/learn/enroll");
        router.reload();
    }

    return (
        <Layout>
            <Head title={`${curriculum.title} — Curriculum`} />

            <div className="mx-auto max-w-4xl" data-learn-index="">
                <CurriculumOverview
                    curriculum={curriculum}
                    courseProgress={courseProgress}
                    onEnroll={enrolled ? undefined : handleEnroll}
                    onOpenCourse={(course: Course) => router.visit(`/learn/${course.slug}`)}
                />
            </div>
        </Layout>
    );
}
