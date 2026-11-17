<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Usage analytics for the hosted `fancy-ui` MCP server at /mcp.
 *
 * - `mcp_requests`: one row per JSON-RPC message, written after the response
 *   is sent. `day` is stored rather than derived so every rollup and range
 *   query is a plain indexed comparison on any database.
 * - `mcp_sessions`: one row per MCP session, created at `initialize`; it holds
 *   the clientInfo every later request in the session is stamped with.
 * - `mcp_daily_*`: pre-rolled aggregates the dashboard reads, rebuilt per day
 *   by `mcp-stats:rollup`. Empty strings, never NULL, in their key columns so
 *   grouping is unambiguous.
 *
 * No column ever holds a raw IP: `ip_hash` is a SHA-256 salted per day.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('mcp_sessions', function (Blueprint $table) {
            $table->id();
            $table->string('session_id', 64)->unique();
            $table->string('client_name', 100)->nullable();
            $table->string('client_version', 50)->nullable();
            $table->string('protocol_version', 20)->nullable();
            $table->string('ua_family', 50)->nullable();
            $table->char('ip_hash', 64)->nullable();
            $table->unsignedInteger('request_count')->default(0);
            $table->unsignedInteger('error_count')->default(0);
            $table->timestamp('first_seen_at')->index();
            $table->timestamp('last_seen_at')->index();

            $table->index(['client_name', 'client_version']);
        });

        Schema::create('mcp_requests', function (Blueprint $table) {
            $table->id();
            $table->date('day')->index();
            $table->string('session_id', 64)->nullable();
            $table->string('jsonrpc_id', 64)->nullable();
            $table->string('method', 64);
            $table->string('target', 191)->nullable();
            $table->text('arguments')->nullable();
            $table->boolean('arguments_truncated')->default(false);
            $table->string('status', 16);
            $table->integer('error_code')->nullable();
            $table->string('error_message', 255)->nullable();
            $table->integer('result_count')->nullable();
            $table->unsignedInteger('latency_ms')->default(0);
            $table->unsignedSmallInteger('http_status')->default(200);
            $table->string('client_name', 100)->nullable();
            $table->string('client_version', 50)->nullable();
            $table->string('protocol_version', 20)->nullable();
            $table->string('ua_family', 50)->nullable();
            $table->char('ip_hash', 64)->nullable();
            $table->timestamp('created_at')->index();

            $table->index(['session_id', 'id']);
            $table->index(['target', 'day']);
            $table->index(['status', 'day']);
            $table->index(['client_name', 'day']);
        });

        Schema::create('mcp_daily_rollups', function (Blueprint $table) {
            $table->id();
            $table->date('day')->index();
            $table->string('method', 64);
            $table->string('target', 191)->default('');
            $table->string('client_name', 100)->default('');
            $table->string('client_version', 50)->default('');
            $table->string('status', 16);
            $table->integer('error_code')->default(0);
            $table->unsignedInteger('requests')->default(0);
            $table->unsignedInteger('empty_results')->default(0);
            $table->unsignedBigInteger('latency_sum')->default(0);
            $table->unsignedInteger('latency_max')->default(0);
            $table->text('latency_histogram');
            $table->timestamp('rolled_at');

            $table->index(['target', 'day']);
            $table->index(['client_name', 'day']);
            $table->index(['status', 'day']);
        });

        Schema::create('mcp_daily_clients', function (Blueprint $table) {
            $table->id();
            $table->date('day')->index();
            $table->string('client_name', 100)->default('');
            $table->string('client_version', 50)->default('');
            $table->unsignedInteger('sessions')->default(0);
            $table->unsignedInteger('requests')->default(0);
            $table->unsignedInteger('errors')->default(0);

            $table->index(['client_name', 'day']);
        });

        Schema::create('mcp_daily_arg_values', function (Blueprint $table) {
            $table->id();
            $table->date('day')->index();
            $table->string('target', 191);
            $table->string('arg_key', 64);
            $table->string('arg_value', 191);
            $table->unsignedInteger('calls')->default(0);
            $table->unsignedInteger('empty_results')->default(0);
            $table->unsignedInteger('errors')->default(0);

            $table->index(['target', 'arg_key', 'day']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('mcp_daily_arg_values');
        Schema::dropIfExists('mcp_daily_clients');
        Schema::dropIfExists('mcp_daily_rollups');
        Schema::dropIfExists('mcp_requests');
        Schema::dropIfExists('mcp_sessions');
    }
};
