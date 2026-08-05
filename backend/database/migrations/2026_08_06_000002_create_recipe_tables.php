<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('recipe_categories', function (Blueprint $table) {
            $table->id();
            $table->string('name', 100);
            $table->string('slug', 120)->unique();
            $table->string('icon', 50)->nullable();
            $table->string('color', 20)->nullable();
            $table->integer('order')->default(0);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::create('recipes', function (Blueprint $table) {
            $table->id();
            $table->string('title', 200);
            $table->string('slug', 220)->unique();
            $table->text('excerpt')->nullable();
            $table->text('description')->nullable();
            $table->json('ingredients')->nullable();
            $table->json('steps')->nullable();
            $table->unsignedSmallInteger('prep_time_minutes')->nullable();
            $table->unsignedSmallInteger('cook_time_minutes')->nullable();
            $table->unsignedSmallInteger('servings')->default(1);
            $table->string('difficulty', 20)->default('facil');
            $table->string('cover_image')->nullable();
            $table->foreignId('category_id')->nullable()->constrained('recipe_categories')->nullOnDelete();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->boolean('is_featured')->default(false);
            $table->boolean('is_cafe_do_dia')->default(false);
            $table->string('status', 20)->default('draft');
            $table->json('meta')->nullable();
            $table->integer('views_count')->default(0);
            $table->timestamp('published_at')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->index(['status', 'published_at']);
            $table->index('is_featured');
            $table->index('is_cafe_do_dia');
        });

        Schema::create('recipe_tag', function (Blueprint $table) {
            $table->id();
            $table->foreignId('recipe_id')->constrained()->cascadeOnDelete();
            $table->foreignId('tag_id')->constrained()->cascadeOnDelete();
            $table->unique(['recipe_id', 'tag_id']);
        });

        // Receitas salvas na biblioteca do usuário (reaproveita o sistema de coleções)
        Schema::create('collection_recipe', function (Blueprint $table) {
            $table->id();
            $table->foreignId('collection_id')->constrained()->cascadeOnDelete();
            $table->foreignId('recipe_id')->constrained()->cascadeOnDelete();
            $table->string('note')->nullable();
            $table->timestamps();
            $table->unique(['collection_id', 'recipe_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('collection_recipe');
        Schema::dropIfExists('recipe_tag');
        Schema::dropIfExists('recipes');
        Schema::dropIfExists('recipe_categories');
    }
};
