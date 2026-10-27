<?php

declare(strict_types=1);

namespace Tests\Support;

use App\Models\User;
use Illuminate\Support\Facades\DB;
use ParticleAcademy\LaravelCourses\Models\Course;
use ParticleAcademy\LaravelCourses\Models\Curriculum;
use ParticleAcademy\LaravelCourses\Models\Enrollment;
use ParticleAcademy\LaravelCourses\Models\Lesson;
use ParticleAcademy\LaravelCourses\Models\Module;
use ParticleAcademy\LaravelCourses\Models\Question;
use ParticleAcademy\LaravelCourses\Models\Test;
use ParticleAcademy\LaravelCourses\Services\EnrollmentService;
use ParticleAcademy\LaravelCourses\Services\ProgressService;
use ParticleAcademy\LaravelCourses\Services\ScoringService;
use Tests\Fixtures\Curriculum\LegacyFancyCurriculumContent as Legacy;

/**
 * Stand-ins for production state, for the curriculum rebuild tests.
 *
 * `seedLegacy()` writes the pre-rebuild curriculum straight through the
 * laravel-courses models, NOT through `fancy:build-curriculum`. That matters:
 * the point of the fixture is to be independent of the code under test, so it
 * describes what production already holds rather than what today's reconciler
 * would have written.
 */
final class CurriculumFixtures
{
    /**
     * No curriculum content at all — a fresh install before any build.
     *
     * The test database is NOT empty by default: the 2026_08_02 migration runs
     * `fancy:build-curriculum` as part of `migrate`, so RefreshDatabase hands
     * every test an already-built curriculum.
     */
    public static function empty(): void
    {
        Course::query()->get()->each->delete();
        Curriculum::query()->delete();
    }

    /** Seed the curriculum exactly as production held it before the rebuild. */
    public static function seedLegacy(): Curriculum
    {
        self::empty();
        $meta = Legacy::curriculum();
        $curriculum = Curriculum::query()->create([
            'slug' => $meta['slug'],
            'title' => $meta['title'],
            'description' => $meta['description'],
            'is_published' => true,
        ]);

        foreach (Legacy::courses() as $index => $spec) {
            $course = Course::query()->create([
                'slug' => $spec['slug'],
                'title' => $spec['title'],
                'description' => $spec['description'],
                'estimated_minutes' => $spec['estimated_minutes'] ?? null,
                'sort_order' => $index,
                'is_published' => true,
            ]);
            $curriculum->courses()->attach($course->id, ['sort_order' => $index, 'is_required' => true]);

            $lessonOrder = 0;
            foreach ($spec['modules'] as $mIndex => $mSpec) {
                $module = Module::query()->create([
                    'course_id' => $course->id,
                    'slug' => $mSpec['slug'],
                    'title' => $mSpec['title'],
                    'sort_order' => $mIndex,
                ]);
                foreach ($mSpec['lessons'] as $lSpec) {
                    Lesson::query()->create([
                        'course_id' => $course->id,
                        'module_id' => $module->id,
                        'slug' => $lSpec['slug'],
                        'title' => $lSpec['title'],
                        'content' => $lSpec['content'],
                        'content_type' => 'text',
                        'sort_order' => $lessonOrder++,
                    ]);
                }
            }

            $tSpec = $spec['test'];
            $test = Test::query()->create([
                'slug' => $tSpec['slug'],
                'course_id' => $course->id,
                'title' => $tSpec['title'],
                'passing_score' => $tSpec['passing_score'] ?? 70,
                'is_final' => $tSpec['is_final'] ?? false,
            ]);
            foreach ($tSpec['questions'] as $qIndex => $qSpec) {
                $question = Question::query()->create([
                    'test_id' => $test->id,
                    'sort_order' => $qIndex,
                    'prompt' => $qSpec['prompt'],
                    'type' => $qSpec['type'],
                    'points' => $qSpec['points'] ?? 1,
                    'explanation' => $qSpec['explanation'] ?? null,
                ]);
                foreach ($qSpec['options'] ?? [] as $oIndex => $oSpec) {
                    $question->options()->create([
                        'label' => $oSpec['label'],
                        'is_correct' => $oSpec['is_correct'],
                        'sort_order' => $oIndex,
                    ]);
                }
            }
        }

        return $curriculum->refresh();
    }

    /**
     * A learner who has done EVERYTHING the legacy curriculum offered: every
     * lesson completed and every auto-gradable test passed.
     */
    public static function learnerWithFullLegacyProgress(Curriculum $curriculum): Enrollment
    {
        $user = User::factory()->create();
        $enrollment = app(EnrollmentService::class)->enroll($user->id, $curriculum);
        $progress = app(ProgressService::class);
        $scoring = app(ScoringService::class);

        $courseIds = $curriculum->courses()->pluck('courses.id');
        foreach (Lesson::query()->whereIn('course_id', $courseIds)->get() as $lesson) {
            $progress->markLessonComplete($enrollment, $lesson);
        }

        foreach (Test::query()->with('questions.options')->whereIn('course_id', $courseIds)->get() as $test) {
            $answers = $test->questions->map(fn (Question $q): array => match ($q->type->value) {
                'multiple_select' => ['question_id' => $q->id, 'answer' => ['option_ids' => $q->options->where('is_correct', true)->pluck('id')->all()]],
                'short_answer' => ['question_id' => $q->id, 'answer' => 'Scraping breaks on markup changes.'],
                default => ['question_id' => $q->id, 'answer' => ['option_id' => $q->options->firstWhere('is_correct', true)?->id]],
            })->all();
            $scoring->submitAnswers($scoring->startAttempt($enrollment, $test), $answers);
        }

        return $enrollment->refresh();
    }

    /**
     * Everything a learner owns, by primary key. Two equal results mean no
     * learner row was created, deleted or re-pointed.
     *
     * @return array<string, list<array<string, mixed>>>
     */
    public static function learnerRows(): array
    {
        $rows = static fn (string $table, array $columns): array => DB::table($table)
            ->orderBy('id')->get($columns)->map(fn ($r): array => (array) $r)->all();

        return [
            'enrollments' => $rows('enrollments', ['id', 'user_id', 'enrollable_type', 'enrollable_id', 'completed_at']),
            'lesson_completions' => $rows('lesson_completions', ['id', 'enrollment_id', 'lesson_id']),
            'test_attempts' => $rows('test_attempts', ['id', 'enrollment_id', 'test_id', 'passed', 'score']),
            'attempt_answers' => $rows('attempt_answers', ['id', 'test_attempt_id', 'question_id', 'answer', 'is_correct']),
            'certificates' => $rows('certificates', ['id', 'enrollment_id']),
        ];
    }

    /**
     * The authored structure, by primary key, so two builds can be compared.
     *
     * @return array<string, list<array<string, mixed>>>
     */
    public static function contentRows(): array
    {
        $rows = static fn (string $table, array $columns): array => DB::table($table)
            ->orderBy('id')->get($columns)->map(fn ($r): array => (array) $r)->all();

        return [
            'curriculums' => $rows('curriculums', ['id', 'slug', 'title', 'description', 'is_published']),
            'curriculum_course' => $rows('curriculum_course', ['id', 'curriculum_id', 'course_id', 'sort_order']),
            'courses' => $rows('courses', ['id', 'slug', 'title', 'description', 'sort_order', 'is_published', 'estimated_minutes']),
            'modules' => $rows('modules', ['id', 'course_id', 'slug', 'title', 'sort_order']),
            'lessons' => $rows('lessons', ['id', 'course_id', 'module_id', 'slug', 'title', 'content', 'sort_order']),
            'tests' => $rows('tests', ['id', 'slug', 'course_id', 'title', 'passing_score', 'is_final']),
            'questions' => $rows('questions', ['id', 'test_id', 'sort_order', 'prompt', 'type', 'explanation']),
            'question_options' => $rows('question_options', ['id', 'question_id', 'label', 'is_correct', 'sort_order']),
        ];
    }

    /**
     * The `<meta name="description">` content, whatever the attribute order.
     */
    public static function metaDescription(string $html): string
    {
        foreach (preg_match_all('#<meta\s[^>]*>#i', $html, $tags) ? $tags[0] : [] as $tag) {
            if (preg_match('#\sname="description"#i', $tag) && preg_match('#\scontent="([^"]*)"#i', $tag, $content)) {
                return html_entity_decode($content[1], ENT_QUOTES);
            }
        }

        return '';
    }

    /** The Inertia page object an initial (HTML) visit carries. */
    public static function inertiaPage(string $html): array
    {
        preg_match('#<script data-page="app" type="application/json">(.*?)</script>#s', $html, $page);

        return json_decode($page[1] ?? '{}', true) ?? [];
    }
}
