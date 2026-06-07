<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Server-captured page screenshots used as the real background for the focus
 * heatmap (the Hotjar/Crazy-Egg model). Sandbox-owned so the fancy-heuristics
 * package's own schema stays untouched. One row per (site_key, path).
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('site_page_shots', function (Blueprint $table) {
            $table->id();
            $table->string('site_key')->index();
            $table->string('path');
            $table->string('image_path');
            $table->unsignedInteger('vw');
            $table->unsignedInteger('vh');
            $table->timestamp('captured_at')->nullable();
            $table->timestamps();

            $table->unique(['site_key', 'path']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('site_page_shots');
    }
};
