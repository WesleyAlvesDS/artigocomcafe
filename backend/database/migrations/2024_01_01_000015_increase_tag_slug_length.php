<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('tags', function (Blueprint $table) {
            $table->string('name', 255)->change();
            $table->string('slug', 255)->change();
        });
        Schema::table('articles', function (Blueprint $table) {
            $table->string('title', 255)->change();
            $table->string('slug', 255)->change();
        });
    }

    public function down(): void
    {
        Schema::table('tags', function (Blueprint $table) {
            $table->string('slug', 60)->change();
        });
        Schema::table('articles', function (Blueprint $table) {
            $table->string('title', 200)->change();
            $table->string('slug', 220)->change();
        });
    }
};
