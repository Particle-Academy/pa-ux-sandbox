<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('showcase_submissions', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->enum('kind', ['website', 'repo']);
            $table->string('url');
            $table->string('title')->nullable();
            $table->text('description')->nullable();
            $table->enum('status', ['pending', 'verified', 'rejected'])->default('pending');
            $table->json('scan_result')->nullable();
            $table->string('thumbnail_url')->nullable();
            $table->timestamp('scanned_at')->nullable();
            $table->timestamps();
            $table->index(['status']);
            $table->index(['kind', 'url']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('showcase_submissions');
    }
};
