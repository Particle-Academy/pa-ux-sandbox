<?php

use Database\Seeders\FunLabSeeder;
use Illuminate\Database\Migrations\Migration;

return new class extends Migration
{
    /**
     * Ship the Fun Lab gamification taxonomy as deploy-time content: the XP
     * metrics + levels, the achievements (including the hidden FlowRunnerUx
     * easter-egg ones), and the prizes/awards.
     *
     * Forge runs `php artisan migrate` on every deploy but NOT `db:seed`, so any
     * feature content left only in a seeder never reaches production. Invoking
     * the idempotent FunLabSeeder from a migration makes that content deploy with
     * the feature. `LFL::setup()` upserts on slug, so this is safe to re-run; the
     * seeder remains the single source of the definitions.
     */
    public function up(): void
    {
        (new FunLabSeeder)->run();
    }

    /**
     * Intentionally a no-op. Rolling back must not delete gamification content —
     * achievements/prizes are reference data, and removing them could cascade to
     * users' earned awards and progress.
     */
    public function down(): void
    {
        // reference content — not removed on rollback (see up() docblock)
    }
};
