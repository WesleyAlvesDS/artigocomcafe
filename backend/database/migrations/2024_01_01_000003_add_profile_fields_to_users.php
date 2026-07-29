<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('username', 50)->unique()->after('id');
            $table->text('bio')->nullable()->after('email');
            $table->string('avatar')->nullable()->after('bio');
            $table->string('theme', 20)->default('cafe')->after('avatar');
            $table->integer('reading_time_total')->default(0)->after('theme');
            $table->integer('articles_read_count')->default(0)->after('reading_time_total');
            $table->integer('daily_streak')->default(0)->after('articles_read_count');
            $table->date('last_visit_date')->nullable()->after('daily_streak');
            $table->timestamp('last_login_at')->nullable()->after('last_visit_date');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn([
                'username', 'bio', 'avatar', 'theme',
                'reading_time_total', 'articles_read_count',
                'daily_streak', 'last_visit_date', 'last_login_at',
            ]);
        });
    }
};
