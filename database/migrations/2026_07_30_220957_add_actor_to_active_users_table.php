<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Who actually performed the activity — the person, or their agent.
 *
 * An agent driving a co-browse session acts through the real UI, so its
 * navigation arrives as an ordinary Inertia visit on the same authenticated
 * session as the human's. Nothing distinguished them, so the presence feed
 * credited every agent action to the signed-in person by name.
 *
 * Wrong twice over: the audit trail is false, and gamification cannot score
 * agent-driven activity while agent and human events are indistinguishable.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('active_users', function (Blueprint $table) {
            // 'human' | 'agent'. Defaulted so every existing row — all of which
            // predate agent attribution — keeps reading as the human it recorded.
            $table->string('actor_kind')->default('human')->after('activity_label');
            // Only set when actor_kind is 'agent'; the label shown to the human.
            $table->string('actor_name')->nullable()->after('actor_kind');
        });
    }

    public function down(): void
    {
        Schema::table('active_users', function (Blueprint $table) {
            $table->dropColumn(['actor_kind', 'actor_name']);
        });
    }
};
