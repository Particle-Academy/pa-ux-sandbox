<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Tracks which endings each user has discovered in a hidden Easter-egg story,
 * so we can award "reach the win" and "reach every ending" achievements.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('easter_egg_endings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('egg');     // story id, e.g. "deep-system"
            $table->string('ending');  // ending slug, e.g. "win"
            $table->timestamps();

            $table->unique(['user_id', 'egg', 'ending']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('easter_egg_endings');
    }
};
