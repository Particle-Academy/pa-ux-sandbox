<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\User;
use App\Support\Curriculum\FancyCurriculumContent as Content;
use Illuminate\Foundation\Testing\RefreshDatabase;
use ParticleAcademy\LaravelCourses\Models\Curriculum;
use ParticleAcademy\LaravelCourses\Models\Lesson;
use ParticleAcademy\LaravelCourses\Models\Test as CourseTest;
use ParticleAcademy\LaravelCourses\Services\CertificateService;
use ParticleAcademy\LaravelCourses\Services\EnrollmentService;
use ParticleAcademy\LaravelCourses\Services\ProgressService;
use ParticleAcademy\LaravelCourses\Services\ScoringService;
use Tests\TestCase;

/**
 * The dogfood, as a test.
 *
 * This walks the whole learner journey against the real authored curriculum:
 * enrol, complete every lesson, pass every test, earn the certificate. It is the
 * thing that proves laravel-courses works from a consumer's side rather than
 * from its own suite — which matters, because until this showcase installed it
 * from Packagist the package had only ever been consumed by symlink.
 */
class FancyCurriculumTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->artisan('fancy:build-curriculum')->assertExitCode(0);
    }

    public function test_the_curriculum_is_authored_with_every_course_published(): void
    {
        $curriculum = Curriculum::where('slug', Content::CURRICULUM_SLUG)->firstOrFail();

        $this->assertTrue((bool) $curriculum->is_published);
        $this->assertCount(7, $curriculum->courses);

        foreach ($curriculum->courses as $course) {
            $this->assertTrue((bool) $course->is_published, "{$course->slug} is not published");
        }
    }

    public function test_exactly_one_test_is_final(): void
    {
        $finals = CourseTest::where('is_final', true)->get();

        // More than one final means more than one thing certifies, which makes
        // "certified" meaningless. Zero means nobody can ever be certified.
        $this->assertCount(1, $finals);
        $this->assertSame('human-plus-final', $finals->first()->slug);
    }

    public function test_every_auto_graded_question_has_exactly_one_correct_answer_where_required(): void
    {
        foreach (CourseTest::with('questions.options')->get() as $test) {
            foreach ($test->questions as $q) {
                $correct = $q->options->where('is_correct', true)->count();

                if ($q->type->value === 'short_answer') {
                    $this->assertSame(0, $q->options->count(), "short_answer should carry no options: {$q->prompt}");

                    continue;
                }

                if ($q->type->value === 'multiple_select') {
                    // ScoringService requires an exact set match, and an empty
                    // correct set can never be satisfied.
                    $this->assertGreaterThan(0, $correct, "multiple_select with no correct option: {$q->prompt}");

                    continue;
                }

                // single choice / true_false: gradeSingleChoice() takes
                // firstWhere('is_correct', true), so a second correct option is
                // unreachable and silently ungradeable.
                $this->assertSame(1, $correct, "expected exactly one correct option: {$q->prompt}");
                $this->assertGreaterThan(1, $q->options->count(), "needs distractors: {$q->prompt}");
            }
        }
    }

    public function test_a_learner_can_complete_the_whole_curriculum_and_earn_a_certificate(): void
    {
        $user = User::factory()->create();
        $curriculum = Curriculum::where('slug', Content::CURRICULUM_SLUG)->firstOrFail();

        $enrollments = $this->app->make(EnrollmentService::class);
        $progress = $this->app->make(ProgressService::class);
        $scoring = $this->app->make(ScoringService::class);
        $certificates = $this->app->make(CertificateService::class);

        $enrollment = $enrollments->enroll($user->id, $curriculum);

        // Every lesson in every course.
        $courseIds = $curriculum->courses->pluck('id');
        foreach (Lesson::whereIn('course_id', $courseIds)->get() as $lesson) {
            $progress->markLessonComplete($enrollment, $lesson);
        }

        // Every test, answering correctly.
        foreach (CourseTest::with('questions.options')->whereIn('course_id', $courseIds)->get() as $test) {
            $answers = [];
            foreach ($test->questions as $q) {
                $answers[] = match ($q->type->value) {
                    'multiple_select' => [
                        'question_id' => $q->id,
                        'answer' => ['option_ids' => $q->options->where('is_correct', true)->pluck('id')->all()],
                    ],
                    'short_answer' => [
                        'question_id' => $q->id,
                        'answer' => 'Because DOM scraping breaks on markup changes and gives no semantics.',
                    ],
                    default => [
                        'question_id' => $q->id,
                        'answer' => ['option_id' => $q->options->firstWhere('is_correct', true)?->id],
                    ],
                };
            }

            $attempt = $scoring->submitAnswers($scoring->startAttempt($enrollment, $test), $answers);

            if ($test->questions->contains(fn ($q) => $q->type->value === 'short_answer')) {
                // The final carries a short answer, so it parks at passed=null
                // until a human grades it. That is the designed behaviour, not a
                // failure — and it is why the capstone cannot self-certify.
                $this->assertNull($attempt->passed, "{$test->slug} should await grading");

                foreach ($attempt->answers()->get() as $answer) {
                    $question = $answer->question;
                    if ($question->type->value === 'short_answer') {
                        $scoring->gradeShortAnswer($answer, true, (float) $question->points);
                    }
                }

                $this->assertTrue((bool) $attempt->refresh()->passed, "{$test->slug} should pass once graded");

                continue;
            }

            $this->assertTrue((bool) $attempt->passed, "{$test->slug} not passed with all-correct answers");
        }

        $this->assertTrue($progress->isFullyComplete($enrollment->refresh()));

        $certificate = $certificates->issue($enrollment->refresh());
        $this->assertNotEmpty($certificate->verification_code);
        $this->assertMatchesRegularExpression('/^CERT-\d{4}-[A-Z0-9]{6}$/', $certificate->certificate_number);

        // And the public check agrees.
        $this->getJson("api/courses/verify/{$certificate->verification_code}")
            ->assertOk()
            ->assertJson(['valid' => true]);
    }

    public function test_a_wrong_answer_fails_the_course_test(): void
    {
        $user = User::factory()->create();
        $curriculum = Curriculum::where('slug', Content::CURRICULUM_SLUG)->firstOrFail();
        $enrollment = $this->app->make(EnrollmentService::class)->enroll($user->id, $curriculum);
        $scoring = $this->app->make(ScoringService::class);

        $test = CourseTest::with('questions.options')->where('slug', 'fancy-core-test')->firstOrFail();

        $answers = $test->questions->map(fn ($q) => [
            'question_id' => $q->id,
            'answer' => ['option_id' => $q->options->firstWhere('is_correct', false)?->id],
        ])->all();

        $attempt = $scoring->submitAnswers($scoring->startAttempt($enrollment, $test), $answers);

        $this->assertSame(0.0, (float) $attempt->score);
        $this->assertFalse((bool) $attempt->passed);
    }

    public function test_the_authoring_api_stays_denied_to_anonymous_callers(): void
    {
        // The showcase binds AuthorizesCourseAdmin to the is_admin gate. This is
        // the regression guard: if that binding is ever loosened, anyone could
        // rewrite the curriculum or mint a certificate.
        $this->postJson('api/courses/curriculums', ['slug' => 'x', 'title' => 'x'])->assertForbidden();
        $this->postJson('api/courses/admin/completions', [])->assertForbidden();

        $nonAdmin = User::factory()->create(['is_admin' => false]);
        $this->actingAs($nonAdmin)
            ->postJson('api/courses/curriculums', ['slug' => 'y', 'title' => 'y'])
            ->assertForbidden();
    }

    public function test_an_admin_can_reach_the_authoring_api(): void
    {
        $admin = User::factory()->create(['is_admin' => true]);

        $this->actingAs($admin)
            ->postJson('api/courses/curriculums', ['slug' => 'admin-made', 'title' => 'Admin made'])
            ->assertCreated();
    }
}
