<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('dream_archives', function (Blueprint $table): void {
            $table->id();
            $table->string('slug', 120)->unique();
            $table->string('title');
            $table->text('blurb')->nullable();
            $table->string('pkg')->nullable();
            $table->string('theme')->nullable();
            $table->integer('up_votes')->default(0);
            $table->integer('down_votes')->default(0);
            $table->enum('reason', ['auto_negative', 'manual'])->default('auto_negative');
            $table->timestamp('archived_at')->useCurrent();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('dream_archives');
    }
};
