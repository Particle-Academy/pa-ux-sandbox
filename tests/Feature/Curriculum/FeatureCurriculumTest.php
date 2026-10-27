<?php

use App\Support\Curriculum\FancyCurriculumContent;
use App\Support\FeatureSites;
use ParticleAcademy\LaravelCourses\Models\Course;
use ParticleAcademy\LaravelCourses\Models\Curriculum;
use ParticleAcademy\LaravelCourses\Models\Lesson;
use ParticleAcademy\LaravelCourses\Models\Test as CourseTest;
use ParticleAcademy\LaravelCourses\Models\TestAttempt;
use ParticleAcademy\LaravelCourses\Services\ProgressService;
use Tests\Support\CurriculumFixtures;
use Tests\TestCase;

uses(TestCase::class);

/*
 * The curriculum, rebuilt around the eight Features (owner ask, 2026-10-27).
 *
 * Two kinds of guarantee live here. The CONTENT ones: Fancy Core first, then
 * one course per Feature in nav order, each with modules, lessons and a check
 * whose questions have one defensible answer. And the LEARNER ones, which are
 * the reason the rebuild is a reconcile and not a reseed: a production
 * database already holds enrollments, lesson completions and test attempts
 * against the OLD courses, and none of them may be lost or re-pointed at the
 * wrong thing. Those tests seed the frozen pre-rebuild curriculum
 * (tests/Fixtures/Curriculum) as production holds it, put a learner's whole
 * history on it, and run the real `fancy:build-curriculum` over the top.
 */

/** Fancy Core, then the Features in nav order, then the capstone that certifies. */
const CURRICULUM_COURSE_ORDER = [
    'fancy-core',
    'fancy-flow', 'fancy-tui', 'fancy-cms', 'fancy-documents',
    'fancy-git', 'fancy-3d', 'fancy-ecommerce', 'fancy-gamification',
    'human-plus-ux',
];

/** Each Feature's course. */
const CURRICULUM_FEATURE_COURSES = [
    'flow' => 'fancy-flow', 'tui' => 'fancy-tui', 'cms' => 'fancy-cms', 'documents' => 'fancy-documents',
    'git' => 'fancy-git', '3d' => 'fancy-3d', 'ecommerce' => 'fancy-ecommerce', 'gamification' => 'fancy-gamification',
];

/** Courses that are not Features and are retired, never deleted. */
const CURRICULUM_ARCHIVED = ['fancy-surfaces', 'fancy-platform', 'fancy-tooling'];

/**
 * Where each pre-rebuild lesson must end up: [old course, old lesson] => new
 * course. The lesson ROW moves, so a completion recorded against it moves too.
 */
const CURRICULUM_MOVED_LESSONS = [
    ['fancy-surfaces', 'fancy-flow', 'fancy-flow'],
    ['fancy-surfaces', 'per-node-jobs', 'fancy-flow'],
    ['fancy-tooling', 'vendored-nodes', 'fancy-flow'],
    ['fancy-surfaces', 'fancy-3d-and-map', 'fancy-3d'],
    ['fancy-commerce', 'catalog-and-fms', 'fancy-ecommerce'],
    ['fancy-documents', 'the-three-writers', 'fancy-documents'],
    ['fancy-tooling', 'fancy-cli', 'fancy-core'],
    ['fancy-core', 'what-react-fancy-is', 'fancy-core'],
    ['fancy-core', 'polymorphic-as', 'fancy-core'],
    ['fancy-core', 'inertia-bridge', 'fancy-core'],
    ['fancy-core', 'fancy-query', 'fancy-core'],
    ['human-plus-ux', 'two-constraints', 'human-plus-ux'],
    ['human-plus-ux', 'six-requirements', 'human-plus-ux'],
    ['human-plus-ux', 'propose-then-apply', 'human-plus-ux'],
    ['human-plus-ux', 'deny-by-default', 'human-plus-ux'],
];

function curriculumListedSlugs(): array
{
    return Curriculum::query()->where('slug', 'fancy-ui')->firstOrFail()
        ->courses()->orderBy('curriculum_course.sort_order')->pluck('courses.slug')->all();
}

/** Legacy lesson ids, keyed "course/lesson", read BEFORE the rebuild. */
function curriculumLegacyLessonIds(): array
{
    $ids = [];
    foreach (Lesson::query()->with('course')->get() as $lesson) {
        $ids[$lesson->course->slug.'/'.$lesson->slug] = $lesson->id;
    }

    return $ids;
}

// ── Content ──────────────────────────────────────────────────────────────

it('lists Fancy Core first, then one course per Feature in nav order, then the capstone', function () {
    $this->artisan('fancy:build-curriculum')->assertExitCode(0);

    expect(curriculumListedSlugs())->toBe(CURRICULUM_COURSE_ORDER);
});

it('gives every Feature a course, named in FeatureSites', function (string $feature) {
    $this->artisan('fancy:build-curriculum')->assertExitCode(0);

    expect(FeatureSites::find($feature)['course'] ?? null)->toBe(CURRICULUM_FEATURE_COURSES[$feature]);

    $course = Course::query()->where('slug', CURRICULUM_FEATURE_COURSES[$feature])->first();
    expect($course)->not->toBeNull()
        ->and((bool) $course->is_published)->toBeTrue();
    $this->get('/learn/'.$course->slug)->assertOk();
})->with(array_keys(CURRICULUM_FEATURE_COURSES));

it('gives every listed course modules of lessons and one check whose questions have exactly one correct answer', function () {
    $this->artisan('fancy:build-curriculum')->assertExitCode(0);

    foreach (CURRICULUM_COURSE_ORDER as $slug) {
        $course = Course::query()->where('slug', $slug)->with(['modules.lessons', 'tests.questions.options'])->firstOrFail();

        $modules = $course->modules->filter(fn ($m) => $m->lessons->isNotEmpty());
        expect($modules->count())->toBeGreaterThanOrEqual(1, "{$slug} has no module with lessons")
            ->and($course->modules->count())->toBe($modules->count(), "{$slug} carries an empty module");

        if (in_array($slug, CURRICULUM_FEATURE_COURSES, true)) {
            expect($modules->count())->toBeGreaterThanOrEqual(2, "{$slug} needs 2-3 modules")
                ->and($modules->count())->toBeLessThanOrEqual(3, "{$slug} needs 2-3 modules");
        }

        expect($course->tests)->toHaveCount(1, "{$slug} needs exactly one check");
        $test = $course->tests->first();
        expect($test->questions->count())->toBeGreaterThanOrEqual(3, "{$slug}'s check is too thin");

        foreach ($test->questions as $q) {
            if ($q->type->value === 'short_answer') {
                continue;
            }
            $correct = $q->options->where('is_correct', true)->count();
            if ($q->type->value === 'multiple_select') {
                expect($correct)->toBeGreaterThan(0, "{$slug}: {$q->prompt}");

                continue;
            }
            expect($correct)->toBe(1, "{$slug}: one correct answer: {$q->prompt}")
                ->and($q->options->count())->toBeGreaterThan(1, "{$slug}: needs distractors: {$q->prompt}");
        }
    }
});

it('keeps exactly one final, certifying test', function () {
    CurriculumFixtures::seedLegacy();
    $this->artisan('fancy:build-curriculum')->assertExitCode(0);

    $listed = Curriculum::query()->where('slug', 'fancy-ui')->firstOrFail()->courses()->pluck('courses.id');
    expect(CourseTest::query()->whereIn('course_id', $listed)->where('is_final', true)->pluck('slug')->all())
        ->toBe(['human-plus-final']);
});

// ── Archiving ────────────────────────────────────────────────────────────

it('archives the courses that are not Features without deleting them', function () {
    CurriculumFixtures::seedLegacy();
    $this->artisan('fancy:build-curriculum')->assertExitCode(0);

    foreach (CURRICULUM_ARCHIVED as $slug) {
        $course = Course::query()->where('slug', $slug)->first();
        expect($course)->not->toBeNull("{$slug} was deleted; it must be archived")
            ->and((bool) $course->is_published)->toBeFalse("{$slug} is still published")
            ->and($course->curriculums()->count())->toBe(0, "{$slug} is still in the curriculum");
    }

    expect(curriculumListedSlugs())->toBe(CURRICULUM_COURSE_ORDER);
});

it('keeps fancy-platform off /learn and the sitemap, and sends its old URL to /learn', function () {
    CurriculumFixtures::seedLegacy();
    $this->artisan('fancy:build-curriculum')->assertExitCode(0);

    $page = CurriculumFixtures::inertiaPage($this->get('/learn')->assertOk()->getContent());
    $listed = array_column($page['props']['curriculum']['courses'] ?? [], 'slug');
    expect($listed)->toBe(CURRICULUM_COURSE_ORDER)
        ->and($listed)->not->toContain('fancy-platform');

    $this->get('/learn/fancy-platform')->assertStatus(301)->assertRedirect('/learn');
    $this->get('/sitemap.xml')->assertOk()->assertDontSee('/learn/fancy-platform', false);
});

it('301s the renamed Commerce course to Ecommerce', function () {
    CurriculumFixtures::seedLegacy();
    $this->artisan('fancy:build-curriculum')->assertExitCode(0);

    $this->get('/learn/fancy-commerce')->assertStatus(301)->assertRedirect('/learn/fancy-ecommerce');
});

// ── Learner data ─────────────────────────────────────────────────────────

it('keeps every learner row through the rebuild', function () {
    $curriculum = CurriculumFixtures::seedLegacy();
    CurriculumFixtures::learnerWithFullLegacyProgress($curriculum);
    $before = CurriculumFixtures::learnerRows();

    expect($before['lesson_completions'])->toHaveCount(17)
        ->and($before['test_attempts'])->toHaveCount(7);

    $this->artisan('fancy:build-curriculum')->assertExitCode(0);

    expect(CurriculumFixtures::learnerRows())->toBe($before);
});

it('moves each surviving lesson ROW into its Feature course, so its completion moves with it', function () {
    $curriculum = CurriculumFixtures::seedLegacy();
    $enrollment = CurriculumFixtures::learnerWithFullLegacyProgress($curriculum);
    $legacyIds = curriculumLegacyLessonIds();

    $this->artisan('fancy:build-curriculum')->assertExitCode(0);

    foreach (CURRICULUM_MOVED_LESSONS as [$fromCourse, $fromLesson, $toCourse]) {
        $id = $legacyIds["{$fromCourse}/{$fromLesson}"];
        $lesson = Lesson::query()->with('course')->findOrFail($id);
        expect($lesson->course->slug)->toBe($toCourse, "{$fromCourse}/{$fromLesson} should now be in {$toCourse}")
            ->and($enrollment->lessonCompletions()->where('lesson_id', $id)->exists())->toBeTrue();
    }

    // And the learner SEES it: the Flow course shows progress from day one.
    $flowLessons = Course::query()->where('slug', 'fancy-flow')->firstOrFail()->lessons()->pluck('id');
    $done = $enrollment->lessonCompletions()->whereIn('lesson_id', $flowLessons)->count();
    expect($done)->toBe(3);

    $summary = app(ProgressService::class)->summary($enrollment->refresh());
    expect($summary['lessons_completed'])->toBe(count(CURRICULUM_MOVED_LESSONS));
});

it('carries a passed Commerce check over to the Ecommerce course it became', function () {
    $curriculum = CurriculumFixtures::seedLegacy();
    $enrollment = CurriculumFixtures::learnerWithFullLegacyProgress($curriculum);
    $commerceTestId = CourseTest::query()->where('slug', 'fancy-commerce-test')->value('id');

    $this->artisan('fancy:build-curriculum')->assertExitCode(0);

    $test = CourseTest::query()->with('course')->findOrFail($commerceTestId);
    expect($test->course->slug)->toBe('fancy-ecommerce')
        ->and(TestAttempt::query()->where('enrollment_id', $enrollment->id)->where('test_id', $commerceTestId)->where('passed', true)->exists())->toBeTrue();
});

it('leaves no unauthored lesson in a listed course, even after moving lessons', function () {
    CurriculumFixtures::seedLegacy();
    $this->artisan('fancy:build-curriculum')->assertExitCode(0);

    foreach (FancyCurriculumContent::courses() as $spec) {
        $authored = [];
        foreach ($spec['modules'] as $module) {
            foreach ($module['lessons'] as $lesson) {
                $authored[] = $lesson['slug'];
            }
        }
        $inDb = Course::query()->where('slug', $spec['slug'])->firstOrFail()
            ->lessons()->orderBy('sort_order')->pluck('slug')->all();

        expect($inDb)->toBe($authored, "{$spec['slug']} carries lessons nobody authors");
    }
});

it('refuses to delete a question a learner has answered, and rolls back', function () {
    $curriculum = CurriculumFixtures::seedLegacy();
    $enrollment = CurriculumFixtures::learnerWithFullLegacyProgress($curriculum);

    // A question at a position the content no longer authors, with an answer on it.
    $test = CourseTest::query()->where('slug', 'fancy-core-test')->firstOrFail();
    $extra = $test->questions()->create(['sort_order' => 99, 'prompt' => 'Retired?', 'type' => 'true_false', 'points' => 1]);
    $attempt = TestAttempt::query()->where('enrollment_id', $enrollment->id)->where('test_id', $test->id)->firstOrFail();
    $attempt->answers()->create(['question_id' => $extra->id, 'answer' => ['option_id' => null], 'is_correct' => false]);
    $before = [CurriculumFixtures::contentRows(), CurriculumFixtures::learnerRows()];

    expect(fn () => $this->artisan('fancy:build-curriculum')->run())
        ->toThrow(RuntimeException::class, 'learners have answered it');

    expect([CurriculumFixtures::contentRows(), CurriculumFixtures::learnerRows()])->toBe($before);
});

it('is idempotent: a second build changes nothing', function () {
    $curriculum = CurriculumFixtures::seedLegacy();
    CurriculumFixtures::learnerWithFullLegacyProgress($curriculum);

    $this->artisan('fancy:build-curriculum')->assertExitCode(0);
    $first = [CurriculumFixtures::contentRows(), CurriculumFixtures::learnerRows()];

    $this->artisan('fancy:build-curriculum')->assertExitCode(0);
    $second = [CurriculumFixtures::contentRows(), CurriculumFixtures::learnerRows()];

    expect($second)->toBe($first);
});

it('is idempotent on a fresh database too', function () {
    $this->artisan('fancy:build-curriculum')->assertExitCode(0);
    $first = CurriculumFixtures::contentRows();

    $this->artisan('fancy:build-curriculum')->assertExitCode(0);

    expect(CurriculumFixtures::contentRows())->toBe($first);
});

// ── The Feature pages link to their course ───────────────────────────────

it('gives each Feature page a Learn link to its course', function (string $feature) {
    $this->artisan('fancy:build-curriculum')->assertExitCode(0);

    $page = CurriculumFixtures::inertiaPage($this->get("/features/{$feature}")->assertOk()->getContent());
    $slug = CURRICULUM_FEATURE_COURSES[$feature];

    expect($page['props']['feature']['course'] ?? null)->toMatchArray([
        'slug' => $slug,
        'href' => "/learn/{$slug}",
    ]);
})->with(array_keys(CURRICULUM_FEATURE_COURSES));

it('renders no Learn link when the course does not exist', function () {
    // The curriculum tables emptied, as on a fresh install before any build.
    CurriculumFixtures::empty();
    $page = CurriculumFixtures::inertiaPage($this->get('/features/flow')->assertOk()->getContent());

    expect($page['props']['feature'])->toHaveKey('course')
        ->and($page['props']['feature']['course'])->toBeNull();
});

it('renders no Learn link when the course is unpublished or unlisted', function () {
    $this->artisan('fancy:build-curriculum')->assertExitCode(0);
    Course::query()->where('slug', 'fancy-git')->update(['is_published' => false]);
    $tui = Course::query()->where('slug', 'fancy-tui')->firstOrFail();
    $tui->curriculums()->detach();

    foreach (['git', 'tui'] as $feature) {
        $page = CurriculumFixtures::inertiaPage($this->get("/features/{$feature}")->assertOk()->getContent());
        expect($page['props']['feature'])->toHaveKey('course')
            ->and($page['props']['feature']['course'])->toBeNull("{$feature} links to a course a learner cannot open");
    }
});

// ── SEO ──────────────────────────────────────────────────────────────────

it('gives every course its own title, description and canonical', function (string $slug) {
    $this->artisan('fancy:build-curriculum')->assertExitCode(0);
    $course = Course::query()->where('slug', $slug)->firstOrFail();
    $html = $this->get("/learn/{$slug}")->assertOk()->getContent();

    preg_match('#<title[^>]*>(.*?)</title>#si', $html, $title);
    preg_match('#rel="canonical" href="([^"]*)"#i', $html, $canonical);

    expect(html_entity_decode($title[1] ?? '', ENT_QUOTES))->toContain($course->title)
        ->and(CurriculumFixtures::metaDescription($html))->toBe($course->description)
        ->and($canonical[1] ?? '')->toBe(rtrim((string) config('app.url'), '/')."/learn/{$slug}");
})->with(CURRICULUM_COURSE_ORDER);

it('lists every course in the sitemap and no archived one', function () {
    $this->artisan('fancy:build-curriculum')->assertExitCode(0);
    $xml = $this->get('/sitemap.xml')->assertOk()->getContent();

    foreach (CURRICULUM_COURSE_ORDER as $slug) {
        expect($xml)->toContain("/learn/{$slug}<");
    }
    foreach ([...CURRICULUM_ARCHIVED, 'fancy-commerce'] as $slug) {
        expect($xml)->not->toContain("/learn/{$slug}<");
    }
});
