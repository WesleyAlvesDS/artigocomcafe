<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('reading_progress', function (Blueprint $table) {
            // Receitas agora também são rastreadas nesta tabela (Fase 6 - receitas.md)
            // Nota: o índice (user_id, is_completed) já existe da migration 000008 — não recriar.
            $table->foreignId('article_id')->nullable()->change();
            $table->foreignId('recipe_id')->nullable()->after('article_id')
                ->constrained('recipes')
                ->nullOnDelete();

            $table->unique(['user_id', 'recipe_id']);
        });
    }

    public function down(): void
    {
        Schema::table('reading_progress', function (Blueprint $table) {
            $table->dropUnique(['user_id', 'recipe_id']);
            $table->dropConstrainedForeignId('recipe_id');
            $table->foreignId('article_id')->nullable(false)->change();
        });
    }
};
