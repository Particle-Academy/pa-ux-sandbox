<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            // Map of cosmetic slot -> value, e.g.
            //   { 'avatar-frame': 'gold-frame', 'name-color': 'rainbow' }
            // Slot keys come from the shop_items.metadata.slot for
            // 'cosmetic' kind items.
            $table->json('cosmetic_slots')->nullable()->after('avatar_url');
        });

        Schema::table('showcase_submissions', function (Blueprint $table) {
            // Set by the 'featured-showcase' shop service. When NOT NULL
            // and in the future, the submission appears in the featured
            // strip on /showcase.
            $table->timestamp('featured_until')->nullable()->after('status');
            $table->index('featured_until');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('cosmetic_slots');
        });

        Schema::table('showcase_submissions', function (Blueprint $table) {
            $table->dropIndex(['featured_until']);
            $table->dropColumn('featured_until');
        });
    }
};
