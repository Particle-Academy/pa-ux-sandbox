<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Ownership proof, a separate and stronger fact than `status = verified`.
     *
     *  - `ownership_verified_at` — when the CURRENT proof was first seen; null
     *    when the latest scan found none.
     *  - `ownership_method` — `pixel_key` (this submission's site_key on the
     *    homepage's pixel <script>), `badge_key` (this submission's site_key on
     *    the README's Fancified badge) or `github_owner` (the submitter's GitHub
     *    login owns the repo's namespace).
     *
     * Nullable, no backfill: every existing row starts unproven and earns it on
     * its next scan. See .ai/plans/fancy-support.md section 1.1.
     */
    public function up(): void
    {
        Schema::table('showcase_submissions', function (Blueprint $table): void {
            $table->timestamp('ownership_verified_at')->nullable()->after('scanned_at');
            $table->string('ownership_method', 20)->nullable()->after('ownership_verified_at');
            $table->index(['user_id', 'ownership_verified_at']);
        });
    }

    public function down(): void
    {
        Schema::table('showcase_submissions', function (Blueprint $table): void {
            $table->dropIndex(['user_id', 'ownership_verified_at']);
            $table->dropColumn(['ownership_verified_at', 'ownership_method']);
        });
    }
};
