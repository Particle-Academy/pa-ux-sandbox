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
        Schema::table('showcase_submissions', function (Blueprint $table) {
            // Submitter self-declarations (captured on the submit form).
            $table->string('category')->nullable()->after('description');
            $table->boolean('nsfw_declared')->default(false)->after('category');
            $table->boolean('made_for_children')->default(false)->after('nsfw_declared');

            // Hybrid NSFW moderation: the scan's classifier sets `flagged` on an
            // *undeclared* hit; an admin then `confirmed` (→ suspend) or `cleared`.
            // none | flagged | confirmed | cleared.
            $table->string('nsfw_status')->default('none')->after('made_for_children');
            $table->string('nsfw_flag_reason')->nullable()->after('nsfw_status');

            // Suspension overlays verification (a verified site can be suspended).
            // Kept generic so it covers NSFW confirmation + any manual suspension.
            $table->timestamp('suspended_at')->nullable()->after('nsfw_flag_reason');
            $table->string('suspension_reason')->nullable()->after('suspended_at');

            $table->index('nsfw_status');
            $table->index('suspended_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('showcase_submissions', function (Blueprint $table) {
            $table->dropIndex(['nsfw_status']);
            $table->dropIndex(['suspended_at']);
            $table->dropColumn([
                'category', 'nsfw_declared', 'made_for_children',
                'nsfw_status', 'nsfw_flag_reason', 'suspended_at', 'suspension_reason',
            ]);
        });
    }
};
