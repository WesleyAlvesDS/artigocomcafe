<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        $models = [
            \App\Models\Article::class,
            \App\Models\Category::class,
            \App\Models\Tag::class,
            \App\Models\User::class,
            \App\Models\Media::class,
        ];

        foreach ($models as $model) {
            $model::observe(\App\Observers\AuditObserver::class);
        }
    }
}
