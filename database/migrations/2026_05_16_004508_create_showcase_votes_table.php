<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('showcase_votes', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('subject_type', 40);
            $table->string('subject_slug', 120);
            $table->tinyInteger('value');
            $table->timestamps();
            $table->unique(['user_id', 'subject_type', 'subject_slug'], 'showcase_votes_unique_user_subject');
            $table->index(['subject_type', 'subject_slug']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('showcase_votes');
    }
};
