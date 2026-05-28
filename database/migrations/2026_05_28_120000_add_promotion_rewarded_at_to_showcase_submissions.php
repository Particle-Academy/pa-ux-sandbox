<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('showcase_submissions', function (Blueprint $table) {
            // Set the first time a "Powered by Fancy" badge is detected on
            // the submission's URL, so promotion-xp / badge-bearer pays out
            // exactly once even across repeated scans.
            $table->timestamp('promotion_rewarded_at')->nullable()->after('rewarded_at');
        });
    }

    public function down(): void
    {
        Schema::table('showcase_submissions', function (Blueprint $table) {
            $table->dropColumn('promotion_rewarded_at');
        });
    }
};
