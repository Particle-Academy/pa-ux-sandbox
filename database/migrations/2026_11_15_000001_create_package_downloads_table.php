<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Public download counts per package and registry, written daily by
 * `packages:fetch-downloads` and read by /packages, each package page and the
 * home page.
 *
 * Every count is nullable on purpose. NULL means "not measured" (the source
 * has no such figure, or no fetch has succeeded yet) and is rendered as
 * nothing; 0 means a registry said zero. A failed fetch leaves the counts and
 * `fetched_at` alone and records itself in `last_error` / `failed_at`.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('package_downloads', function (Blueprint $table) {
            $table->id();
            $table->string('slug');
            $table->string('source', 16); // npm | packagist | pypi
            $table->string('name');       // the PUBLISHED name asked for
            $table->unsignedBigInteger('daily')->nullable();
            $table->unsignedBigInteger('weekly')->nullable();
            $table->unsignedBigInteger('monthly')->nullable();
            $table->unsignedBigInteger('total')->nullable();
            $table->timestamp('fetched_at')->nullable();
            $table->timestamp('failed_at')->nullable();
            $table->text('last_error')->nullable();
            $table->unsignedInteger('consecutive_failures')->default(0);
            $table->timestamps();

            $table->unique(['slug', 'source']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('package_downloads');
    }
};
