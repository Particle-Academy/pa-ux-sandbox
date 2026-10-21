<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * The newest "What's new" cursor each account has been shown (fancy-whats-new,
 * through fancy-inertia's createHttpStorage), so a notice shown once stays
 * shown once across devices.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('seen_notices', 191)->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('seen_notices');
        });
    }
};
