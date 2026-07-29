<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('collections', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('name', 100);
            $table->text('description')->nullable();
            $table->string('icon', 50)->nullable();
            $table->string('color', 7)->nullable();
            $table->integer('order')->default(0);
            $table->boolean('is_public')->default(false);
            $table->timestamps();

            $table->unique(['user_id', 'name']);
        });

        Schema::create('article_collection', function (Blueprint $table) {
            $table->id();
            $table->foreignId('article_id')->constrained()->cascadeOnDelete();
            $table->foreignId('collection_id')->constrained()->cascadeOnDelete();
            $table->text('note')->nullable();
            $table->timestamps();
            $table->unique(['article_id', 'collection_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('article_collection');
        Schema::dropIfExists('collections');
    }
};
