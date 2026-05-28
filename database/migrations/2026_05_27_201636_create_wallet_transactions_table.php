<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('wallet_transactions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('wallet_id')->constrained()->cascadeOnDelete();
            $table->enum('kind', ['credit', 'debit']);
            $table->unsignedBigInteger('amount');
            $table->string('reason');

            // Polymorphic ref to the originating record (XpAward,
            // ShopPurchase, ShowcaseSubmission, etc.) so audit views can
            // link back to what triggered the move. Both nullable so
            // manual admin grants don't need a source row.
            $table->nullableMorphs('ref');

            $table->json('metadata')->nullable();
            $table->timestamps();

            $table->index(['wallet_id', 'created_at']);
            $table->index(['kind', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('wallet_transactions');
    }
};
