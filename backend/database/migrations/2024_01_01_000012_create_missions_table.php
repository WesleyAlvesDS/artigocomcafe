<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('missions', function (Blueprint $table) {
            $table->id();
            $table->string('title', 200);
            $table->text('description');
            $table->string('icon', 50)->nullable();
            $table->string('type', 30)->default('daily');
            $table->json('conditions')->nullable();
            $table->integer('grain_reward')->default(0);
            $table->integer('expires_in_hours')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::create('user_mission', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('mission_id')->constrained()->cascadeOnDelete();
            $table->integer('progress')->default(0);
            $table->integer('target')->default(1);
            $table->boolean('is_completed')->default(false);
            $table->timestamp('completed_at')->nullable();
            $table->date('assigned_date')->nullable();
            $table->timestamps();
            $table->unique(['user_id', 'mission_id', 'assigned_date']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('user_mission');
        Schema::dropIfExists('missions');
    }
};
