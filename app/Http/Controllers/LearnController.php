<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Support\Curriculum\FancyCurriculumContent as Content;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use ParticleAcademy\LaravelCourses\Models\Curriculum;
use ParticleAcademy\LaravelCourses\Models\Enrollment;
use ParticleAcademy\LaravelCourses\Models\Lesson;
use ParticleAcademy\LaravelCourses\Models\Test;
use ParticleAcademy\LaravelCourses\Models\TestAttempt;
use ParticleAcademy\LaravelCourses\Services\EnrollmentService;
use ParticleAcademy\LaravelCourses\Services\ProgressService;
use ParticleAcademy\LaravelCourses\Services\ScoringService;

/**
 * /learn — the Fancy UI Curriculum, rendered by @particle-academy/classroom.
 *
 * The pages mount `CurriculumOverview` and `CoursePlayer` from the package
 * rather than re-implementing a course UI. That is the entire point of the
 * exercise: a dogfood that hand-rolls the surface it is meant to be dogfooding
 * proves nothing about the package.
 *
 * Payloads are therefore shaped as the package's OWN TypeScript interfaces
 * expect — snake_case, nested `modules` / `lessons` / `tests`, matching what its
 * API resources return. Do not "tidy" these into camelCase; the components read
 * these exact keys.
 */
class LearnController extends Controller
{
    public function __construct(
        private readonly ProgressService $progress,
        private readonly EnrollmentService $enrollments,
        private readonly ScoringService $scoring,
    ) {}

    public function index(Request $request): Response
    {
        $curriculum = Curriculum::query()
            ->with(['courses' => fn ($q) => $q->orderBy('curriculum_course.sort_order')])
            ->where('slug', Content::CURRICULUM_SLUG)
            ->firstOrFail();

        $enrollment = $this->enrollmentFor($request, $curriculum);

        // CurriculumOverview reads `courseProgress` as course id => percent.
        $courseProgress = [];
        if ($enrollment) {
            foreach ($curriculum->courses as $course) {
                $lessonIds = $course->lessons()->pluck('id');
                $total = $lessonIds->count();
                $done = $total > 0
                    ? $enrollment->lessonCompletions()->whereIn('lesson_id', $lessonIds)->count()
                    : 0;
                $courseProgress[$course->id] = $total > 0 ? (int) round($done / $total * 100) : 0;
            }
        }

        return Inertia::render('Learn/Index', [
            'curriculum' => $curriculum->toArray(),
            'courseProgress' => (object) $courseProgress,
            'enrolled' => $enrollment !== null,
            'authenticated' => $request->user() !== null,
            'summary' => $enrollment ? $this->progress->summary($enrollment) : null,
        ]);
    }

    public function course(Request $request, string $slug): Response
    {
        $curriculum = Curriculum::where('slug', Content::CURRICULUM_SLUG)->firstOrFail();

        $course = $curriculum->courses()
            ->where('courses.slug', $slug)
            ->with([
                'modules' => fn ($q) => $q->orderBy('sort_order'),
                'modules.lessons' => fn ($q) => $q->orderBy('sort_order'),
                'lessons' => fn ($q) => $q->orderBy('sort_order'),
                'tests.questions' => fn ($q) => $q->orderBy('sort_order'),
                'tests.questions.options' => fn ($q) => $q->orderBy('sort_order'),
            ])
            ->firstOrFail();

        $enrollment = $this->enrollmentFor($request, $curriculum);

        return Inertia::render('Learn/Course', [
            'course' => $course->toArray(),
            'curriculumSlug' => $curriculum->slug,
            'enrollment' => $enrollment?->toArray(),
            'completedLessonIds' => $enrollment
                ? $enrollment->lessonCompletions()->pluck('lesson_id')->all()
                : [],
            'authenticated' => $request->user() !== null,
        ]);
    }

    /**
     * The learner actions, as first-party `web` routes.
     *
     * classroom ships a `CoursesClient` that talks to the package's own
     * `api/courses/*` routes. Those sit on the `api` middleware group, which in
     * Laravel 11+ carries no session — so a browser session cannot authenticate
     * against them, and `LearnerResolver` (correctly) refuses to take the
     * learner id from the request body. An Inertia host therefore routes these
     * through its own session-authenticated endpoints and calls the package's
     * SERVICES directly, which is the layer they are designed for.
     *
     * The components are still the package's. That is what the dogfood is for.
     */
    public function enroll(Request $request): JsonResponse
    {
        $curriculum = Curriculum::where('slug', Content::CURRICULUM_SLUG)->firstOrFail();

        $enrollment = $this->enrollments->enroll(
            $request->user()->getAuthIdentifier(),
            $curriculum,
        );

        return response()->json($enrollment->toArray(), 201);
    }

    public function completeLesson(Request $request, Lesson $lesson): JsonResponse
    {
        $enrollment = $this->requireEnrollment($request);

        $this->progress->markLessonComplete($enrollment, $lesson);

        return response()->json([
            'completed_lesson_ids' => $enrollment->lessonCompletions()->pluck('lesson_id')->all(),
            'summary' => $this->progress->summary($enrollment->refresh()),
        ]);
    }

    public function startAttempt(Request $request, Test $test): JsonResponse
    {
        $enrollment = $this->requireEnrollment($request);

        return response()->json(
            $this->scoring->startAttempt($enrollment, $test)->toArray(),
            201,
        );
    }

    public function submitAttempt(Request $request, TestAttempt $attempt): JsonResponse
    {
        $enrollment = $this->requireEnrollment($request);

        // An attempt belongs to an enrollment. Without this check a learner
        // could submit answers against somebody else's attempt by guessing an
        // id — the package's own controllers make the same comparison.
        abort_unless((int) $attempt->enrollment_id === (int) $enrollment->getKey(), 403);

        $answers = $request->validate([
            'answers' => 'present|array',
            'answers.*.question_id' => 'required|integer',
        ])['answers'];

        return response()->json(
            $this->scoring->submitAnswers($attempt, $answers)->toArray(),
        );
    }

    private function requireEnrollment(Request $request): Enrollment
    {
        $curriculum = Curriculum::where('slug', Content::CURRICULUM_SLUG)->firstOrFail();
        $enrollment = $this->enrollmentFor($request, $curriculum);

        abort_if($enrollment === null, 403, 'Not enrolled.');

        return $enrollment;
    }

    private function enrollmentFor(Request $request, Curriculum $curriculum): ?Enrollment
    {
        $user = $request->user();

        if (! $user) {
            return null;
        }

        return Enrollment::query()
            ->where('user_id', $user->getAuthIdentifier())
            ->where('enrollable_type', Curriculum::class)
            ->where('enrollable_id', $curriculum->getKey())
            ->first();
    }
}
