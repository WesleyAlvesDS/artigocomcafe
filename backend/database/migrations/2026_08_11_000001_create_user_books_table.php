<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('user_books', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('ol_key', 64);
            $table->string('title', 500);
            $table->string('subtitle', 500)->nullable();
            $table->json('authors')->nullable();
            $table->unsignedInteger('first_publish_year')->nullable();
            $table->unsignedInteger('cover_id')->nullable();
            $table->json('covers')->nullable();
            $table->json('isbn')->nullable();
            $table->decimal('rating_avg', 3, 1)->nullable();
            $table->unsignedInteger('rating_count')->nullable();
            $table->string('shelf', 20)->default('quero_ler');
            $table->unsignedTinyInteger('user_rating')->nullable();
            $table->text('user_review')->nullable();
            $table->timestamp('finished_at')->nullable();
            $table->timestamps();

            $table->unique(['user_id', 'ol_key']);
            $table->index(['user_id', 'shelf']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('user_books');
    }
};
