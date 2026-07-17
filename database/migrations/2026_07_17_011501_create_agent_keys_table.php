<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Agent access keys. A signed-in user mints a key and hands it to an AI
     * agent; the agent then registers / verifies showcase projects ON THE
     * USER'S BEHALF via the MCP tools, attributed and revocable. Only a SHA-256
     * hash is stored — the plaintext (`fancy_agent_…`) is shown once at mint.
     */
    public function up(): void
    {
        Schema::create('agent_keys', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('name', 120);
            $table->string('token_hash', 64)->unique();
            $table->timestamp('last_used_at')->nullable();
            $table->timestamp('revoked_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('agent_keys');
    }
};
