<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;
use ParticleAcademy\LaravelCourses\Models\Certificate;
use ParticleAcademy\LaravelCourses\Models\Course;
use ParticleAcademy\LaravelCourses\Models\Curriculum;
use ParticleAcademy\LaravelCourses\Models\Enrollment;
use ParticleAcademy\LaravelCourses\Models\TestAttempt;

/**
 * The Learning admin — who is enrolled, how far they got, and what the
 * curriculum is doing.
 *
 * The curriculum shipped with a learner-facing surface and no operator one, so
 * the only way to answer "is anyone finishing this?" was a database client.
 * These are the questions actually asked of a course platform: where people
 * stop, which tests fail, and who holds a certificate.
 *
 * **Read-only on purpose.** Lessons are authored in `FancyCurriculumContent`
 * and reconciled by `fancy:build-curriculum`. An admin that edited them would
 * be a second source of truth for the same text, and the next build would
 * silently overwrite whatever was typed here — the failure being that it looks
 * like it saved.
 *
 * Enrollments are POLYMORPHIC (`enrollable_type` / `enrollable_id`), so every
 * query scopes on the curriculum morph rather than a `curriculum_id` column
 * that does not exist.
 */
class AdminCurriculumController extends Controller
{
    public function index(Request $request): Response
    {
        $curriculum = Curriculum::query()->first();

        if (! $curriculum) {
            // A real state, not an error: nobody has run `fancy:build-curriculum`
            // yet. Saying so beats rendering an empty dashboard, which reads as
            // "nobody enrolled" and sends an operator looking in the wrong place.
            return Inertia::render('Admin/Curriculum', [
                'curriculum' => null,
                'stats' => null,
                'courses' => [],
                'learners' => [],
                'attempts' => [],
                'certificates' => [],
            ]);
        }

        $enrollments = $this->enrollmentsFor($curriculum)->get();

        return Inertia::render('Admin/Curriculum', [
            'curriculum' => ['title' => $curriculum->title, 'slug' => $curriculum->slug],
            'stats' => $this->stats($enrollments),
            'courses' => $this->courses($curriculum),
            'learners' => $this->learners($enrollments),
            'attempts' => $this->recentAttempts(),
            'certificates' => $this->certificates(),
        ]);
    }

    /** Enrollments on this curriculum, via the polymorphic relation. */
    private function enrollmentsFor(Curriculum $curriculum)
    {
        return Enrollment::query()
            ->where('enrollable_type', $curriculum->getMorphClass())
            ->where('enrollable_id', $curriculum->getKey());
    }

    /** @param Collection<int,Enrollment> $enrollments */
    private function stats($enrollments): array
    {
        $enrolled = $enrollments->count();
        $completed = $enrollments->whereNotNull('completed_at')->count();

        $attempts = TestAttempt::query()->count();
        $passed = TestAttempt::query()->where('passed', true)->count();

        return [
            'enrolled' => $enrolled,
            'completed' => $completed,
            // Guarded: a fresh install has zero enrollments and the division
            // would render NaN.
            'completion_rate' => $enrolled > 0 ? (int) round($completed / $enrolled * 100) : 0,
            'attempts' => $attempts,
            'pass_rate' => $attempts > 0 ? (int) round($passed / $attempts * 100) : 0,
            'certificates' => Certificate::query()->count(),
        ];
    }

    /** @return array<int,array<string,mixed>> */
    private function courses(Curriculum $curriculum): array
    {
        $courses = $curriculum->courses()->get();
        $ids = $courses->pluck('id')->all();

        if ($ids === []) {
            return [];
        }

        $lessonCounts = DB::table('lessons')
            ->join('modules', 'lessons.module_id', '=', 'modules.id')
            ->whereIn('modules.course_id', $ids)
            ->selectRaw('modules.course_id as course_id, count(*) as total')
            ->groupBy('modules.course_id')
            ->pluck('total', 'course_id');

        // Distinct learners who have completed at least one lesson in the
        // course — the honest per-course number, since enrollment is on the
        // curriculum rather than per course.
        $started = DB::table('lesson_completions')
            ->join('lessons', 'lesson_completions.lesson_id', '=', 'lessons.id')
            ->join('modules', 'lessons.module_id', '=', 'modules.id')
            ->whereIn('modules.course_id', $ids)
            ->selectRaw('modules.course_id as course_id, count(distinct lesson_completions.enrollment_id) as total')
            ->groupBy('modules.course_id')
            ->pluck('total', 'course_id');

        return $courses->map(fn (Course $c) => [
            'id' => $c->id,
            'title' => $c->title,
            'slug' => $c->slug,
            'lessons' => (int) ($lessonCounts[$c->id] ?? 0),
            'learners_started' => (int) ($started[$c->id] ?? 0),
        ])->all();
    }

    /** @param Collection<int,Enrollment> $enrollments */
    private function learners($enrollments): array
    {
        $recent = $enrollments->sortByDesc('created_at')->take(50)->values();

        $userNames = User::query()
            ->whereIn('id', $recent->pluck('user_id')->filter()->all())
            ->pluck('name', 'id');

        $done = DB::table('lesson_completions')
            ->whereIn('enrollment_id', $recent->pluck('id')->all())
            ->selectRaw('enrollment_id, count(*) as total')
            ->groupBy('enrollment_id')
            ->pluck('total', 'enrollment_id');

        return $recent->map(fn (Enrollment $e) => [
            'id' => $e->id,
            // Never a bare id — the Sites admin set this convention, and it is
            // the difference between a usable table and a list of numbers.
            'learner' => $userNames[$e->user_id] ?? "User #{$e->user_id}",
            'lessons_done' => (int) ($done[$e->id] ?? 0),
            'status' => $e->completed_at ? 'completed' : 'in progress',
            'enrolled_at' => optional($e->started_at ?? $e->created_at)->toDateString(),
        ])->all();
    }

    /** @return array<int,array<string,mixed>> */
    private function recentAttempts(): array
    {
        $attempts = TestAttempt::query()->with('test')->latest()->limit(25)->get();
        $names = $this->learnerNamesByEnrollment($attempts->pluck('enrollment_id')->filter()->all());

        return $attempts->map(fn (TestAttempt $a) => [
            'id' => $a->id,
            'learner' => $names[$a->enrollment_id] ?? 'Unknown',
            'test' => $a->test?->title ?? 'Unknown test',
            'score' => $a->score,
            'max_score' => $a->max_score,
            'passed' => (bool) $a->passed,
            'at' => optional($a->finished_at ?? $a->started_at)->toDateTimeString(),
        ])->all();
    }

    /** @return array<int,array<string,mixed>> */
    private function certificates(): array
    {
        $certs = Certificate::query()->latest()->limit(25)->get();
        $names = $this->learnerNamesByEnrollment($certs->pluck('enrollment_id')->filter()->all());

        return $certs->map(fn (Certificate $c) => [
            'id' => $c->id,
            'learner' => $names[$c->enrollment_id] ?? 'Unknown',
            'code' => $c->verification_code,
            'issued_at' => optional($c->issued_at)->toDateString(),
        ])->all();
    }

    /**
     * Enrollment id => learner name.
     *
     * Attempts and certificates both key on the enrollment, not the user, so
     * both need this hop to show a name instead of a number.
     *
     * @param  array<int,int>  $enrollmentIds
     * @return array<int,string>
     */
    private function learnerNamesByEnrollment(array $enrollmentIds): array
    {
        if ($enrollmentIds === []) {
            return [];
        }

        $userIdByEnrollment = Enrollment::query()
            ->whereIn('id', $enrollmentIds)
            ->pluck('user_id', 'id');

        $names = User::query()
            ->whereIn('id', $userIdByEnrollment->values()->filter()->all())
            ->pluck('name', 'id');

        return $userIdByEnrollment
            ->map(fn ($userId) => $names[$userId] ?? "User #{$userId}")
            ->all();
    }
}
