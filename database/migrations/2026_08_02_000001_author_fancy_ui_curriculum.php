<?php

declare(strict_types=1);

use App\Support\Curriculum\FancyCurriculumContent as Content;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schema;
use ParticleAcademy\LaravelCourses\Models\Course;
use ParticleAcademy\LaravelCourses\Models\Curriculum;

/**
 * Author the Fancy UI Curriculum as part of deployment.
 *
 * /learn 404s when the curriculum row is absent — `firstOrFail()` is doing
 * exactly its job. The content is defined in CODE (FancyCurriculumContent), so
 * it should exist wherever the code does; leaving it to a remembered manual
 * `artisan` call meant production shipped the page and none of its content, and
 * a 404 that looks like a routing bug.
 *
 * A migration is the right hook because the deploy already runs
 * `migrate --force`. `fancy:build-curriculum` is idempotent — it reconciles by
 * slug — so this is safe to run on a database that already has it.
 */
return new class extends Migration
{
    public function up(): void
    {
        // Defensive: if laravel-courses' own migrations have not run yet in this
        // batch, skip rather than fail the whole deploy. The next `migrate` run
        // picks it up, and a failed deploy is a worse outcome than a page that
        // is one deploy behind.
        if (! Schema::hasTable('curriculums')) {
            return;
        }

        Artisan::call('fancy:build-curriculum');
    }

    public function down(): void
    {
        if (! Schema::hasTable('curriculums')) {
            return;
        }

        // Content only. Enrollments and certificates are learner records and are
        // never destroyed by a content rollback.
        Course::query()
            ->whereIn('slug', collect(Content::courses())->pluck('slug'))
            ->get()
            ->each
            ->delete();

        Curriculum::query()
            ->where('slug', Content::CURRICULUM_SLUG)
            ->delete();
    }
};
