<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Trilhas agora podem incluir receitas além de artigos (Fase 6 - receitas.md)
        Schema::create('trail_recipe', function (Blueprint $table) {
            $table->id();
            $table->foreignId('trail_id')->constrained()->cascadeOnDelete();
            $table->foreignId('recipe_id')->constrained()->cascadeOnDelete();
            $table->unsignedSmallInteger('order')->default(0);
            $table->boolean('is_required')->default(true);
            $table->timestamps();

            $table->unique(['trail_id', 'recipe_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('trail_recipe');
    }
};
