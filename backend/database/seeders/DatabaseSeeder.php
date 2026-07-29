<?php

namespace Database\Seeders;

use App\Models\Achievement;
use App\Models\Category;
use App\Models\Mission;
use App\Models\Tag;
use App\Models\Trail;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->call([
            CategorySeeder::class,
            AchievementSeeder::class,
            MissionSeeder::class,
        ]);
    }
}
