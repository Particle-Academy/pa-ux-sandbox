<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schema;

/**
 * Carry the 2026-11-15 rebrand ("Fancy UI" -> "Fancy Dev Kit") into the
 * curriculum rows on production.
 *
 * The curriculum's title and its final-certification test title now read
 * App\Support\Brand::NAME, but the rows on production were written by earlier
 * migrations, and a migration runs once. Running the reconcile again is the
 * only path that content takes to production; it is idempotent by slug, so it
 * updates titles in place and touches no enrollment, completion, attempt or
 * certificate.
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

    /** Deliberately nothing: the previous titles come back by running the build on the previous content. */
    public function down(): void {}
};
