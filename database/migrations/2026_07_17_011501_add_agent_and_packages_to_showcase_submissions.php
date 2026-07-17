<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Structured verification detail + registration provenance:
     *
     *  - `packages`       — the Fancy packages the scan detected in the project,
     *    normalized + linked to the registry (the trust-relevant artifact; the
     *    raw evidence stays in scan_result).
     *  - `registered_via` — how the submission was registered ('web' | 'agent').
     *  - `agent_name`     — the agent key's label when registered by an agent.
     */
    public function up(): void
    {
        Schema::table('showcase_submissions', function (Blueprint $table): void {
            $table->json('packages')->nullable()->after('scan_result');
            $table->string('registered_via', 20)->default('web')->after('packages');
            $table->string('agent_name', 120)->nullable()->after('registered_via');
        });
    }

    public function down(): void
    {
        Schema::table('showcase_submissions', function (Blueprint $table): void {
            $table->dropColumn(['packages', 'registered_via', 'agent_name']);
        });
    }
};
