<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('active_users', function (Blueprint $table) {
            $table->id();

            // Row-per-presence, upserted in place (NOT append-only). Real users
            // upsert on user_id; fakes upsert on fake_key. The unique user_id
            // index still permits many NULLs (one per fake), so the two coexist.
            $table->foreignId('user_id')->nullable()->unique();
            $table->string('fake_key')->nullable()->unique();

            $table->string('name');
            $table->string('avatar_url')->nullable();

            // Coarse activity descriptor derived from the route (or the fake feed).
            $table->string('activity_type')->nullable();
            $table->string('activity_label')->nullable();
            $table->timestamp('activity_at')->nullable();

            // Glow flags — the latest activity was an XP award / achievement unlock.
            $table->boolean('is_xp')->default(false);
            $table->boolean('is_achievement')->default(false);

            $table->timestamp('last_active_at')->nullable()->index();
            $table->boolean('is_fake')->default(false)->index();

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('active_users');
    }
};
