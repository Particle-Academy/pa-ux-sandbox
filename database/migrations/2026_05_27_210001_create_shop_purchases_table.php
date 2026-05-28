<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('shop_purchases', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('shop_item_id')->constrained()->cascadeOnDelete();

            // Stored at purchase time (NOT joined from items) so admin
            // price changes never rewrite history.
            $table->unsignedBigInteger('paid_amount');

            // null for cosmetics (forever); set for services with TTL.
            $table->timestamp('expires_at')->nullable();

            // Optional polymorphic target (e.g. ShowcaseSubmission for
            // featured-showcase service).
            $table->nullableMorphs('ref');

            $table->json('metadata')->nullable();
            $table->timestamps();

            $table->index(['user_id', 'created_at']);
            $table->index('expires_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('shop_purchases');
    }
};
