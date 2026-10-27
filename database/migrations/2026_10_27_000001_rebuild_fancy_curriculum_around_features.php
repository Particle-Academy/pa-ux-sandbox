<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schema;

/**
 * Rebuild the Fancy UI Curriculum around the eight Features (2026-10-27).
 *
 * The 2026_08_02 migration is what put the curriculum on production, and a
 * migration runs once — so changed content reaches production only through a
 * NEW migration that runs the reconcile again. This is that migration. The
 * deploy already runs `migrate --force`.
 *
 * What the reconcile does to existing data, all inside one transaction:
 *
 *  - Feature courses are created; Commerce is renamed to Ecommerce in place.
 *  - Lessons that survive the rebuild are MOVED (same row, same id) into their
 *    new course, so every lesson completion on them carries over.
 *  - Surfaces, Platform and Tooling are ARCHIVED: unpublished and taken out of
 *    the curriculum, never deleted. Their lessons, tests, completions and
 *    attempts all remain in the database.
 *  - No enrollment, completion, attempt, answer or certificate is created,
 *    deleted or re-pointed. tests/Feature/Curriculum/FeatureCurriculumTest.php
 *    proves it against a frozen copy of the pre-rebuild content.
 */
return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('curriculums')) {
            return;
        }

        Artisan::call('fancy:build-curriculum');
    }

    /**
     * Deliberately nothing. Undoing the rebuild would mean moving lessons back
     * and re-publishing archived courses, and any rollback that deletes content
     * cascades into learner records. Restore the previous content by checking
     * out the previous FancyCurriculumContent and running the build.
     */
    public function down(): void {}
};
