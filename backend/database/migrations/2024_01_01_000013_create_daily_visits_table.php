<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('daily_visits', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->date('visit_date');
            $table->integer('articles_read')->default(0);
            $table->integer('time_spent_minutes')->default(0);
            $table->integer('grains_earned')->default(0);
            $table->timestamps();
            $table->unique(['user_id', 'visit_date']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('daily_visits');
    }
};
