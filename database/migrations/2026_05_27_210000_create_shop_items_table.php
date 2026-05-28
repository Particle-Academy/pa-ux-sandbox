<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('shop_items', function (Blueprint $table) {
            $table->id();
            $table->string('slug')->unique();
            $table->string('name');
            $table->text('description')->nullable();

            // 'cosmetic' = grant lives on user.cosmetic_slots forever
            // 'service'  = time-bounded effect on some other record
            //              (e.g. featured-showcase: ref->ShowcaseSubmission,
            //              metadata.duration_days flips featured_until)
            $table->enum('kind', ['cosmetic', 'service']);

            $table->unsignedBigInteger('price');
            $table->boolean('active')->default(true);
            $table->unsignedInteger('order')->default(0);
            $table->json('metadata')->nullable();
            $table->timestamps();

            $table->index(['kind', 'active']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('shop_items');
    }
};
