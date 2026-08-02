<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Support\Curriculum\FancyCurriculumContent as Content;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use ParticleAcademy\LaravelCourses\Models\Course;
use ParticleAcademy\LaravelCourses\Models\Curriculum;
use ParticleAcademy\LaravelCourses\Models\Lesson;
use ParticleAcademy\LaravelCourses\Models\Module;
use ParticleAcademy\LaravelCourses\Models\Question;
use ParticleAcademy\LaravelCourses\Models\Test;

/**
 * Authors the Fancy UI Curriculum into laravel-courses.
 *
 * Idempotent by slug, so it is safe on every deploy — the content in
 * FancyCurriculumContent is the source of truth and this only reconciles the
 * database to it.
 *
 * It writes through the MODELS rather than the package's HTTP API on purpose.
 * `AuthorizesCourseAdmin` gates the HTTP layer; a console command has already
 * decided who is running it, which is the same layering the package's own
 * services use. Do not "fix" this by having it authenticate against its own API.
 */
class BuildFancyCurriculum extends Command
{
    protected $signature = 'fancy:build-curriculum
                            {--fresh : Delete the curriculum and its courses first, then rebuild}
                            {--dry-run : Report what would change without writing}';

    protected $description = 'Author (or reconcile) the Fancy UI Curriculum';

    public function handle(): int
    {
        $dry = (bool) $this->option('dry-run');

        if ($this->option('fresh') && ! $dry) {
            $this->purge();
        }

        if ($dry) {
            $this->components->info('Dry run — nothing will be written.');
        }

        $counts = ['courses' => 0, 'modules' => 0, 'lessons' => 0, 'tests' => 0, 'questions' => 0];

        try {
            $this->author($dry, $counts);
        } catch (DryRunComplete) {
            $this->newLine();
            $this->components->info('Dry run complete — transaction rolled back, nothing written.');

            return self::SUCCESS;
        }

        $this->newLine();
        $this->components->info(sprintf(
            '%d courses, %d modules, %d lessons, %d tests, %d questions.',
            $counts['courses'], $counts['modules'], $counts['lessons'], $counts['tests'], $counts['questions'],
        ));

        return self::SUCCESS;
    }

    /** @param array<string,int> $counts */
    private function author(bool $dry, array &$counts): void
    {
        DB::transaction(function () use ($dry, &$counts): void {
            $meta = Content::curriculum();

            $curriculum = $dry
                ? new Curriculum($meta)
                : Curriculum::updateOrCreate(
                    ['slug' => $meta['slug']],
                    [
                        'title' => $meta['title'],
                        'description' => $meta['description'],
                        'is_published' => true,
                    ],
                );

            foreach (Content::courses() as $index => $spec) {
                $counts['courses']++;

                if ($dry) {
                    $this->line("  would author course: {$spec['slug']}");

                    continue;
                }

                $course = Course::updateOrCreate(
                    ['slug' => $spec['slug']],
                    [
                        'title' => $spec['title'],
                        'description' => $spec['description'],
                        'estimated_minutes' => $spec['estimated_minutes'] ?? null,
                        'sort_order' => $index,
                        'is_published' => true,
                    ],
                );

                $curriculum->courses()->syncWithoutDetaching([
                    $course->id => ['sort_order' => $index, 'is_required' => true],
                ]);

                $this->authorModules($course, $spec['modules'] ?? [], $counts);
                $this->authorTest($course, $spec['test'] ?? null, $counts);

                $this->components->twoColumnDetail(
                    "  <fg=green>{$spec['title']}</>",
                    ($spec['estimated_minutes'] ?? 0).' min',
                );
            }

            if ($dry) {
                throw new DryRunComplete;
            }
        });
    }

    /**
     * @param  array<int,array<string,mixed>>  $modules
     * @param  array<string,int>  $counts
     */
    private function authorModules(Course $course, array $modules, array &$counts): void
    {
        // Lesson sort_order is sequential ACROSS the whole course, not restarted
        // per module. classroom's CoursePlayer renders one flat lesson list
        // ordered by this column, so per-module numbering gave four lessons the
        // orders 0,1,0,1 and the sidebar interleaved two modules' worth of
        // lessons into an arbitrary sequence.
        $lessonOrder = 0;

        foreach ($modules as $mIndex => $mSpec) {
            $counts['modules']++;

            $module = Module::updateOrCreate(
                ['course_id' => $course->id, 'slug' => $mSpec['slug']],
                ['title' => $mSpec['title'], 'sort_order' => $mIndex],
            );

            foreach ($mSpec['lessons'] ?? [] as $lSpec) {
                $counts['lessons']++;

                Lesson::updateOrCreate(
                    ['course_id' => $course->id, 'slug' => $lSpec['slug']],
                    [
                        'module_id' => $module->id,
                        'title' => $lSpec['title'],
                        // LessonView renders content through ContentRenderer with
                        // format="html", so markdown stored raw appears literally,
                        // backticks and asterisks and all. The source stays
                        // markdown because that is what is reviewable in a diff;
                        // it is converted on the way into the database.
                        'content' => self::markdownToHtml($lSpec['content']),
                        'content_type' => 'text',
                        'estimated_minutes' => $lSpec['estimated_minutes'] ?? null,
                        'sort_order' => $lessonOrder++,
                    ],
                );
            }
        }
    }

    /**
     * The narrow markdown subset the curriculum uses → HTML.
     *
     * Deliberately not a markdown library: the input is ours, the subset is
     * small, and `ContentRenderer` sanitises what it receives anyway. Everything
     * is escaped first, so an unrecognised construct degrades to visible text
     * rather than markup.
     */
    public static function markdownToHtml(string $markdown): string
    {
        $out = [];

        foreach (preg_split('/```\n?/', $markdown) as $i => $part) {
            if ($i % 2 === 1) {
                $out[] = '<pre><code>'.e(rtrim($part, "\n")).'</code></pre>';

                continue;
            }

            foreach (preg_split('/\n{2,}/', trim($part)) as $block) {
                $block = trim($block);

                if ($block === '') {
                    continue;
                }

                if (str_starts_with($block, '- ')) {
                    $items = preg_split('/\n(?=- )/', $block);
                    $out[] = '<ul>'.implode('', array_map(
                        fn (string $li) => '<li>'.self::inline(preg_replace('/^- /', '', $li)).'</li>',
                        $items,
                    )).'</ul>';

                    continue;
                }

                if (preg_match('/^\d+\.\s/', $block) === 1) {
                    $items = preg_split('/\n(?=\d+\.\s)/', $block);
                    $out[] = '<ol>'.implode('', array_map(
                        fn (string $li) => '<li>'.self::inline(preg_replace('/^\d+\.\s/', '', $li)).'</li>',
                        $items,
                    )).'</ol>';

                    continue;
                }

                $out[] = '<p>'.self::inline($block).'</p>';
            }
        }

        return implode("\n", $out);
    }

    /** Bold, italic and inline code. `**` is matched before `*`, or it eats it. */
    private static function inline(string $text): string
    {
        $escaped = e(preg_replace('/\s*\n\s*/', ' ', trim($text)));

        return preg_replace(
            ['/\*\*([^*]+)\*\*/', '/(?<!\*)\*([^*]+)\*(?!\*)/', '/`([^`]+)`/'],
            ['<strong>$1</strong>', '<em>$1</em>', '<code>$1</code>'],
            $escaped,
        );
    }

    /**
     * @param  array<string,mixed>|null  $spec
     * @param  array<string,int>  $counts
     */
    private function authorTest(Course $course, ?array $spec, array &$counts): void
    {
        if ($spec === null) {
            return;
        }

        $counts['tests']++;

        $test = Test::updateOrCreate(
            ['slug' => $spec['slug']],
            [
                // Attached at COURSE level deliberately. Module- and lesson-level
                // tests do count toward progress as of laravel-courses 0.1.0, but
                // course level keeps "finished the course" and "passed its test"
                // the same statement.
                'course_id' => $course->id,
                'title' => $spec['title'],
                'passing_score' => $spec['passing_score'] ?? 70,
                'is_final' => $spec['is_final'] ?? false,
            ],
        );

        foreach ($spec['questions'] ?? [] as $qIndex => $qSpec) {
            $counts['questions']++;

            $question = Question::updateOrCreate(
                ['test_id' => $test->id, 'prompt' => $qSpec['prompt']],
                [
                    'type' => $qSpec['type'],
                    'points' => $qSpec['points'] ?? 1,
                    'explanation' => $qSpec['explanation'] ?? null,
                    'sort_order' => $qIndex,
                ],
            );

            // Options are replaced wholesale rather than reconciled: they have no
            // natural key beyond their label, and a half-updated option set is a
            // silently mis-graded question.
            $question->options()->delete();

            foreach ($qSpec['options'] ?? [] as $oIndex => $oSpec) {
                $question->options()->create([
                    'label' => $oSpec['label'],
                    'is_correct' => $oSpec['is_correct'],
                    'sort_order' => $oIndex,
                ]);
            }
        }
    }

    private function purge(): void
    {
        $curriculum = Curriculum::where('slug', Content::CURRICULUM_SLUG)->first();

        if (! $curriculum) {
            return;
        }

        // Courses cascade to modules, lessons, tests, questions and options.
        // Enrollments are NOT touched: wiping someone's progress because the
        // content was rebuilt is the kind of thing that should require saying so.
        $slugs = collect(Content::courses())->pluck('slug');
        Course::whereIn('slug', $slugs)->get()->each->delete();
        $curriculum->delete();

        $this->components->warn('Purged the curriculum and its courses. Enrollments left intact.');
    }
}

/** Thrown to roll back a --dry-run transaction. Never escapes handle(). */
final class DryRunComplete extends \RuntimeException {}
