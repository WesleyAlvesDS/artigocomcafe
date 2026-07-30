<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('rewards', function (Blueprint $table) {
            $table->id();
            $table->string('name', 100);
            $table->string('slug', 120)->unique();
            $table->text('description')->nullable();
            $table->string('type', 30); // theme, avatar, frame, special
            $table->string('category', 30)->nullable(); // cafe, livros, tecnologia, natureza, espaco, games, musica
            $table->string('icon', 50)->nullable();
            $table->string('image_url', 255)->nullable();
            $table->json('content')->nullable(); // CSS vars, SVG data, etc.
            $table->integer('grain_cost')->default(100);
            $table->string('rarity', 20)->default('common'); // common, uncommon, rare, epic, legendary
            $table->boolean('is_active')->default(true);
            $table->integer('sort_order')->default(0);
            $table->timestamps();
        });

        Schema::create('user_reward', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('reward_id')->constrained()->cascadeOnDelete();
            $table->boolean('is_active')->default(false);
            $table->timestamp('unlocked_at');
            $table->timestamp('activated_at')->nullable();
            $table->unique(['user_id', 'reward_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('user_reward');
        Schema::dropIfExists('rewards');
    }
};
