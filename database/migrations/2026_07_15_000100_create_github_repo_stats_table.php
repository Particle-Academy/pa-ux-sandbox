<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Per-repo GitHub star counts, refreshed by `showcase:refresh-leaderboard`
 * (absolute counts) and nudged in real time by the `star` webhook. Read by the
 * packages page to show a live star count on each package tile.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('github_repo_stats', function (Blueprint $table) {
            $table->id();
            $table->string('repo')->unique(); // owner/name
            $table->unsignedInteger('stars')->default(0);
            $table->timestamp('synced_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('github_repo_stats');
    }
};
