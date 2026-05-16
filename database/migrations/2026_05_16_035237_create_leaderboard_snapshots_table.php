<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('leaderboard_snapshots', function (Blueprint $table): void {
            $table->id();
            $table->enum('scope', ['all_time', 'last_30_days'])->default('all_time');
            $table->json('rows');
            $table->timestamp('generated_at')->useCurrent();
            $table->timestamps();
            $table->index(['scope', 'generated_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('leaderboard_snapshots');
    }
};
