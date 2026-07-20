<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * The node marketplace: third-party fancy-flow node packages.
 *
 * MARKETPLACE ONLY. Core builtins ship with fancy-flow and are not installable,
 * so they are deliberately absent — listing them here would tell an author to
 * install something they already have.
 *
 * The trust model lives in `provenance` + `verified`, and the two are separate
 * on purpose:
 *
 *   - `provenance` is WHERE the package came from. First-party submissions
 *     originate inside our own workstation; anything arriving from a public
 *     GitHub repo is untrusted by default.
 *   - `verified` is a claim WE make, never one the package makes. A manifest
 *     that sets it is rejected outright.
 *
 * Nothing here executes a submitted package. A node executor runs arbitrary
 * code by design — that is what a node IS — so running one to earn a checkmark
 * would be remote code execution wearing a verification badge, on the host that
 * also holds the showcase database and its agent keys. Fixture evidence is
 * recorded as an attestation (a passing CI run on the package's own repo)
 * rather than reproduced here.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('flow_node_packages', function (Blueprint $table): void {
            $table->id();

            // The canonical namespaced kind id, e.g. `@acme/salesforce_upsert`.
            // Unique because it is persisted inside every document that uses the
            // node — two packages claiming one id makes stored graphs ambiguous,
            // and that is unfixable after the fact.
            $table->string('kind')->unique();
            $table->string('name');                       // package name as installed
            $table->string('title');
            $table->text('description')->nullable();
            $table->string('category')->default('other');

            // The full manifest as submitted, validated against
            // FancyFlow\Marketplace\NodeManifest before it is stored.
            $table->json('manifest');

            // Denormalised from the manifest so the index can be listed and
            // filtered without decoding every row's JSON.
            $table->json('runtimes');                     // ["ts","php"]
            $table->boolean('pauses_for_human')->default(false);
            $table->string('side_effects')->nullable();

            $table->string('provenance')->default('external');   // first-party | external
            $table->boolean('verified')->default(false);
            $table->string('fixtures_attestation')->nullable();  // URL of a passing CI run
            $table->timestamp('verified_at')->nullable();

            $table->string('status')->default('pending')->index();  // pending | listed | rejected
            $table->text('review_note')->nullable();

            $table->string('repository')->nullable();
            $table->foreignId('submitted_by')->nullable()->constrained('users')->nullOnDelete();
            $table->string('submitted_via')->nullable();  // mcp | manual
            $table->string('agent_name')->nullable();

            $table->timestamps();

            // The listing query: status + category, newest first.
            $table->index(['status', 'category']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('flow_node_packages');
    }
};
