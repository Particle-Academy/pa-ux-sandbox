<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Presence rows snapshot the user's identity (name + avatar) so a broadcast
 * never has to join back to `users`. Cosmetics are part of that identity —
 * without them the live "active users" pills are the one place a player's
 * purchased frame / name colour would silently not show up.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('active_users', function (Blueprint $table) {
            $table->json('cosmetic_slots')->nullable()->after('avatar_url');
        });
    }

    public function down(): void
    {
        Schema::table('active_users', function (Blueprint $table) {
            $table->dropColumn('cosmetic_slots');
        });
    }
};
