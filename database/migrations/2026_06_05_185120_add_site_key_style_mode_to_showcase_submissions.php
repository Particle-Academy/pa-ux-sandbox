<?php

use App\Models\ShowcaseSubmission;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('showcase_submissions', function (Blueprint $table): void {
            $table->string('site_key')->nullable()->unique()->after('id');
            $table->string('style')->default('badge')->after('description');
            $table->string('mode')->default('floating')->after('style');
        });

        // Backfill a unique site_key for any rows created before this column
        // existed so every submission can generate its pixel snippet.
        ShowcaseSubmission::query()
            ->whereNull('site_key')
            ->get()
            ->each(function (ShowcaseSubmission $submission): void {
                $submission->forceFill(['site_key' => Str::lower(Str::random(12))])->saveQuietly();
            });
    }

    public function down(): void
    {
        Schema::table('showcase_submissions', function (Blueprint $table): void {
            $table->dropUnique(['site_key']);
            $table->dropColumn(['site_key', 'style', 'mode']);
        });
    }
};
