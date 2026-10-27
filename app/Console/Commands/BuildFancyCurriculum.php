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

            // Course ids by the slug they carried BEFORE this build, read once up
            // front. A lesson's `formerly` names its old course by slug, and a
            // renamed course no longer answers to that slug once it is renamed
            // below — so resolving old slugs lazily would lose every lesson that
            // was waiting to move out of it.
            $formerCourseIds = $dry ? [] : Course::query()
                ->whereIn('slug', Content::referencedCourseSlugs())
                ->pluck('id', 'slug')
                ->all();

            foreach (Content::courses() as $index => $spec) {
                $counts['courses']++;

                if ($dry) {
                    $this->line("  would author course: {$spec['slug']}");

                    continue;
                }

                $course = $this->courseFor($spec);
                $course->fill([
                    'slug' => $spec['slug'],
                    'title' => $spec['title'],
                    'description' => $spec['description'],
                    'estimated_minutes' => $spec['estimated_minutes'] ?? null,
                    'sort_order' => $index,
                    'is_published' => true,
                ])->save();

                $curriculum->courses()->syncWithoutDetaching([
                    $course->id => ['sort_order' => $index, 'is_required' => true],
                ]);
                // syncWithoutDetaching leaves an existing pivot row's columns
                // alone, so a course that changed position keeps its old one.
                $curriculum->courses()->updateExistingPivot($course->id, ['sort_order' => $index, 'is_required' => true]);

                $this->authorModules($course, $spec['modules'] ?? [], $formerCourseIds, $counts);
                $this->authorTest($course, $spec['test'] ?? null, $counts);

                $this->components->twoColumnDetail(
                    "  <fg=green>{$spec['title']}</>",
                    ($spec['estimated_minutes'] ?? 0).' min',
                );
            }

            if ($dry) {
                foreach (Content::archived() as $slug) {
                    $this->line("  would archive course: {$slug}");
                }

                throw new DryRunComplete;
            }

            $this->archive($curriculum);
        });
    }

    /**
     * The row a course spec reconciles onto: its own slug, else the slug it
     * was `formerly` published under. Renaming in place keeps the course's id,
     * so its test, its attempts and every lesson completion stay attached.
     *
     * @param  array<string,mixed>  $spec
     */
    private function courseFor(array $spec): Course
    {
        $course = Course::query()->where('slug', $spec['slug'])->first();

        if ($course === null && isset($spec['formerly'])) {
            $course = Course::query()->where('slug', $spec['formerly'])->first();
            if ($course !== null) {
                $this->components->warn("  renamed course {$spec['formerly']} -> {$spec['slug']}");
            }
        }

        return $course ?? new Course;
    }

    /**
     * Retire the courses that are no longer taught.
     *
     * NEVER deleted. A course delete cascades to its lessons and tests, and
     * from there to lesson completions and test attempts — the learner's own
     * record. Archiving unpublishes the course and takes it out of the
     * curriculum, which removes it from /learn, from the sitemap and from the
     * curriculum's progress arithmetic, and leaves every row a learner owns
     * where it was.
     */
    private function archive(Curriculum $curriculum): void
    {
        $archived = Course::query()->whereIn('slug', Content::archived())->get();

        foreach ($archived as $course) {
            $wasListed = $curriculum->courses()->whereKey($course->id)->exists();

            if ($course->is_published || $wasListed) {
                $course->forceFill(['is_published' => false])->save();
                $curriculum->courses()->detach($course->id);
                $this->components->warn("  archived course {$course->slug} (unpublished, unlisted; learner rows kept)");
            }
        }
    }

    /**
     * @param  array<int,array<string,mixed>>  $modules
     * @param  array<string,int>  $formerCourseIds
     * @param  array<string,int>  $counts
     */
    private function authorModules(Course $course, array $modules, array $formerCourseIds, array &$counts): void
    {
        // Lesson sort_order is sequential ACROSS the whole course, not restarted
        // per module. classroom's CoursePlayer renders one flat lesson list
        // ordered by this column, so per-module numbering gave four lessons the
        // orders 0,1,0,1 and the sidebar interleaved two modules' worth of
        // lessons into an arbitrary sequence.
        $lessonOrder = 0;
        $authoredModuleIds = [];
        $authoredLessonIds = [];

        foreach ($modules as $mIndex => $mSpec) {
            $counts['modules']++;

            $module = Module::updateOrCreate(
                ['course_id' => $course->id, 'slug' => $mSpec['slug']],
                ['title' => $mSpec['title'], 'sort_order' => $mIndex],
            );
            $authoredModuleIds[] = $module->id;

            foreach ($mSpec['lessons'] ?? [] as $lSpec) {
                $counts['lessons']++;

                $this->moveLessonIn($course, $lSpec, $formerCourseIds);

                $lesson = Lesson::updateOrCreate(
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
                $authoredLessonIds[] = $lesson->id;
            }
        }

        // A lesson in a LIVE course that nothing authors any more would still
        // count toward progress and still render. It is never deleted — that
        // would cascade to completions — so it is reported, and a test fails on
        // it. The fix is a `formerly` on the lesson that replaces it.
        $stale = $course->lessons()->whereNotIn('id', $authoredLessonIds)->pluck('slug');
        foreach ($stale as $slug) {
            $this->components->error("  {$course->slug} carries an unauthored lesson: {$slug}. Give its replacement `formerly`.");
        }

        // Modules no spec names and that hold nothing: the shells a moved or
        // renamed lesson leaves behind. Safe to drop — a module owns no learner
        // data — but only when truly empty, because a module-level test
        // cascades on delete and takes its attempts with it.
        $empty = $course->modules()
            ->whereNotIn('id', $authoredModuleIds)
            ->whereDoesntHave('lessons')
            ->whereDoesntHave('tests')
            ->get();
        foreach ($empty as $module) {
            $module->delete();
            $this->components->warn("  removed empty module {$course->slug}/{$module->slug}");
        }
    }

    /**
     * Re-parent a lesson that moved here from another course (or was renamed),
     * keeping its row and therefore its id.
     *
     * Lesson completions point at a lesson ID. Authoring the moved lesson as a
     * new row would leave every learner who had finished it with a completion
     * on a lesson nobody can reach, and the same lesson unfinished in its new
     * home. Moving the row carries the completion with it.
     *
     * Idempotent: once the lesson is at its new key there is nothing to move.
     *
     * @param  array<string,mixed>  $lSpec
     * @param  array<string,int>  $formerCourseIds
     */
    private function moveLessonIn(Course $course, array $lSpec, array $formerCourseIds): void
    {
        if (! isset($lSpec['formerly'])) {
            return;
        }

        if (Lesson::query()->where('course_id', $course->id)->where('slug', $lSpec['slug'])->exists()) {
            return;
        }

        [$fromCourseSlug, $fromLessonSlug] = $lSpec['formerly'];
        $fromCourseId = $formerCourseIds[$fromCourseSlug] ?? null;
        if ($fromCourseId === null) {
            return;
        }

        $lesson = Lesson::query()->where('course_id', $fromCourseId)->where('slug', $fromLessonSlug)->first();
        if ($lesson === null) {
            return;
        }

        $lesson->forceFill(['course_id' => $course->id, 'slug' => $lSpec['slug']])->save();
        $this->components->warn("  moved lesson {$fromCourseSlug}/{$fromLessonSlug} -> {$course->slug}/{$lSpec['slug']} (completions kept)");
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

        // A renamed check keeps its row, so attempts already made on it stay
        // attempts on it.
        if (isset($spec['formerly']) && ! Test::query()->where('slug', $spec['slug'])->exists()) {
            Test::query()->where('slug', $spec['formerly'])->update(['slug' => $spec['slug']]);
        }

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

        // Questions are keyed by their POSITION in the test, not their prompt.
        // Keying on prompt meant editing the wording created a second question
        // and orphaned the first — the test then rendered both, one of them
        // stale. Found by sitting the test in a browser; the seeder's own counts
        // could never show it, because it counts what it authors rather than
        // what ends up in the table.
        $authoredIds = [];

        foreach ($spec['questions'] ?? [] as $qIndex => $qSpec) {
            $counts['questions']++;

            $question = Question::updateOrCreate(
                ['test_id' => $test->id, 'sort_order' => $qIndex],
                [
                    // Rendered as PLAIN TEXT by classroom's QuestionRenderer —
                    // deliberately, since arbitrary markup in a question is an
                    // injection surface. So markdown is stripped here rather
                    // than shipped for a renderer that will never interpret it.
                    'prompt' => self::plain($qSpec['prompt']),
                    'type' => $qSpec['type'],
                    'points' => $qSpec['points'] ?? 1,
                    'explanation' => isset($qSpec['explanation']) ? self::plain($qSpec['explanation']) : null,
                ],
            );

            $authoredIds[] = $question->id;

            // Options are keyed by POSITION, like questions, and every column is
            // rewritten inside the build's transaction — so a set is never
            // half-updated. They used to be deleted and re-created on every
            // run, which gave each option a new id per deploy: a learner's
            // stored answer (`{"option_id": 42}`) then pointed at a row that no
            // longer existed, and two consecutive builds never produced the
            // same database.
            $authoredOptionIds = [];
            foreach ($qSpec['options'] ?? [] as $oIndex => $oSpec) {
                $authoredOptionIds[] = $question->options()->updateOrCreate(
                    ['sort_order' => $oIndex],
                    [
                        'label' => self::plain($oSpec['label']),
                        'is_correct' => $oSpec['is_correct'],
                    ],
                )->id;
            }
            $question->options()->whereNotIn('id', $authoredOptionIds)->delete();
        }

        // Prune by ID, not by position. A count- or sort_order-based filter
        // cannot catch the case that actually happened: editing a prompt created
        // a SECOND row at the same sort_order as a live question, so both
        // rendered and neither looked out of range. Anything on this test that
        // was not just authored is an orphan, by definition.
        //
        // But a question somebody has ANSWERED is learner history: deleting it
        // cascades to their attempt answers. The build refuses rather than
        // destroy it, and the transaction rolls back. Keep the question count of
        // an answered test at least what it was, and reword in place.
        $orphans = $test->questions()->whereNotIn('id', $authoredIds)->get();
        foreach ($orphans as $orphan) {
            if ($orphan->answers()->exists()) {
                throw new \RuntimeException(
                    "Refusing to delete question #{$orphan->id} on {$test->slug}: learners have answered it. "
                    .'Keep the test at least as long as it was and edit questions in place.',
                );
            }
            $orphan->options()->delete();
            $orphan->delete();
        }
        if ($orphans->isNotEmpty()) {
            $this->components->warn("  pruned {$orphans->count()} orphaned question(s) from {$test->slug}");
        }
    }

    /**
     * Markdown → plain text, for the fields classroom renders verbatim.
     *
     * Question prompts, option labels and explanations go through
     * `QuestionRenderer`, which prints them as text. Backticks and asterisks
     * left in place render literally, so a prompt about `<Action>` arrived on
     * screen wearing its own backticks.
     */
    private static function plain(string $markdown): string
    {
        return preg_replace(
            ['/\*\*([^*]+)\*\*/', '/(?<!\*)\*([^*]+)\*(?!\*)/', '/`([^`]+)`/'],
            ['$1', '$1', '$1'],
            $markdown,
        );
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
