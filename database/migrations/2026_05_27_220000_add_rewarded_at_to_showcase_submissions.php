<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('showcase_submissions', function (Blueprint $table) {
            // Set the first time a submission becomes verified, so the
            // projects-xp / first-project reward fires exactly once even
            // if it's re-verified (auto-scan then manual, or toggled).
            $table->timestamp('rewarded_at')->nullable()->after('featured_until');
        });
    }

    public function down(): void
    {
        Schema::table('showcase_submissions', function (Blueprint $table) {
            $table->dropColumn('rewarded_at');
        });
    }
};
