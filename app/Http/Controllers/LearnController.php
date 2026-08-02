<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Support\Curriculum\FancyCurriculumContent as Content;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use ParticleAcademy\LaravelCourses\Models\Curriculum;
use ParticleAcademy\LaravelCourses\Models\Enrollment;
use ParticleAcademy\LaravelCourses\Services\ProgressService;

/**
 * /learn — the Fancy UI Curriculum, running on laravel-courses + classroom.
 *
 * This is the kit dogfooding its own education stack: the curriculum teaches
 * Fancy UI, and it is served by two Fancy packages installed from real
 * registries the same way any external consumer would install them.
 *
 * The catalogue is public. Progress, enrollment and certificates require an
 * account — laravel-courses resolves the learner from the authenticated user,
 * and `allow_input_user_id` is left at its default of false, so a caller cannot
 * claim to be someone else.
 */
class LearnController extends Controller
{
    public function __construct(private readonly ProgressService $progress) {}

    public function index(Request $request): Response
    {
        $curriculum = Curriculum::query()
            ->with(['courses' => fn ($q) => $q->orderBy('curriculum_course.sort_order')])
            ->where('slug', Content::CURRICULUM_SLUG)
            ->firstOrFail();

        $enrollment = $this->enrollmentFor($request, $curriculum);

        return Inertia::render('Learn/Index', [
            'curriculum' => [
                'slug' => $curriculum->slug,
                'title' => $curriculum->title,
                'description' => $curriculum->description,
            ],
            'courses' => $curriculum->courses->map(fn ($course) => [
                'slug' => $course->slug,
                'title' => $course->title,
                'description' => $course->description,
                'estimatedMinutes' => $course->estimated_minutes,
                'lessonCount' => $course->lessons()->count(),
                'hasTest' => $course->tests()->exists(),
            ])->all(),
            'progress' => $enrollment ? $this->progress->summary($enrollment) : null,
            'enrolled' => $enrollment !== null,
        ]);
    }

    public function course(Request $request, string $slug): Response
    {
        $curriculum = Curriculum::where('slug', Content::CURRICULUM_SLUG)->firstOrFail();

        $course = $curriculum->courses()
            ->where('courses.slug', $slug)
            ->with([
                'modules' => fn ($q) => $q->orderBy('sort_order'),
                'lessons' => fn ($q) => $q->orderBy('sort_order'),
            ])
            ->firstOrFail();

        $enrollment = $this->enrollmentFor($request, $curriculum);
        $completed = $enrollment
            ? $enrollment->lessonCompletions()->pluck('lesson_id')->all()
            : [];

        return Inertia::render('Learn/Course', [
            'course' => [
                'slug' => $course->slug,
                'title' => $course->title,
                'description' => $course->description,
                'estimatedMinutes' => $course->estimated_minutes,
            ],
            'modules' => $course->modules->map(fn ($module) => [
                'slug' => $module->slug,
                'title' => $module->title,
                'lessons' => $course->lessons
                    ->where('module_id', $module->id)
                    ->values()
                    ->map(fn ($lesson) => [
                        'id' => $lesson->id,
                        'slug' => $lesson->slug,
                        'title' => $lesson->title,
                        'content' => $lesson->content,
                        'estimatedMinutes' => $lesson->estimated_minutes,
                        'completed' => in_array($lesson->id, $completed, true),
                    ])->all(),
            ])->all(),
            'test' => $course->tests()->first()?->only(['slug', 'title', 'passing_score']),
            'enrolled' => $enrollment !== null,
            'enrollmentId' => $enrollment?->id,
        ]);
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
