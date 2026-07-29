<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('trails', function (Blueprint $table) {
            $table->id();
            $table->string('title', 200);
            $table->string('slug', 220)->unique();
            $table->text('description');
            $table->string('icon', 50)->nullable();
            $table->string('color', 7)->nullable();
            $table->string('difficulty', 20)->default('beginner');
            $table->integer('estimated_hours')->default(1);
            $table->integer('grain_reward')->default(0);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::create('article_trail', function (Blueprint $table) {
            $table->id();
            $table->foreignId('article_id')->constrained()->cascadeOnDelete();
            $table->foreignId('trail_id')->constrained()->cascadeOnDelete();
            $table->integer('order')->default(0);
            $table->boolean('is_required')->default(true);
            $table->unique(['trail_id', 'article_id']);
        });

        Schema::create('user_trail', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('trail_id')->constrained()->cascadeOnDelete();
            $table->integer('progress')->default(0);
            $table->boolean('is_completed')->default(false);
            $table->timestamp('started_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->timestamps();
            $table->unique(['user_id', 'trail_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('user_trail');
        Schema::dropIfExists('article_trail');
        Schema::dropIfExists('trails');
    }
};
