<?php

namespace App\Filament\User\Pages;

use App\Models\Article;
use App\Models\Category;
use Filament\Pages\Page;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Carbon;
use BackedEnum;
use UnitEnum;

class JornadaPage extends Page
{
    protected string $view = 'filament.user.jornada-page';

    protected static ?string $title = 'Minha Jornada';

    protected static BackedEnum|string|null $navigationIcon = 'heroicon-o-chart-bar';

    protected static ?string $navigationLabel = 'Jornada';

    protected static ?int $navigationSort = 1;

    protected static string|UnitEnum|null $navigationGroup = 'Explorar';

    protected static ?string $slug = 'jornada';

    public array $evolution = [];
    public array $weeklyActivity = [];
    public array $categoryProgress = [];
    public array $recentArticles = [];
    public int $totalMinutesRead = 0;


    public function mount(): void
    {
        $user = Auth::user();
        if (! $user) {
            return;
        }

        $this->loadEvolution($user);
        $this->loadWeeklyActivity($user);
        $this->loadCategoryProgress($user);
        $this->loadRecentArticles($user);
    }

    protected function loadEvolution($user): void
    {
        $this->evolution = [
            'total_grains' => $user->total_grains,
            'articles_read' => $user->articles_read_count,
            'reading_time_hours' => (int) ($user->reading_time_total / 60),
            'trails_completed' => $user->completed_trails_count,
            'achievements_unlocked' => $user->achievements_count,
            'daily_streak' => $user->daily_streak,
            'collections_count' => $user->collections()->count(),
            'categories_explored' => $user->categories_explored_count,
        ];

        $this->totalMinutesRead = (int) $user->reading_time_total;
    }

    protected function loadWeeklyActivity($user): void
    {
        $since = Carbon::now()->subDays(6)->startOfDay();
        $progress = $user->readingProgress()
            ->where('is_completed', true)
            ->whereNotNull('completed_at')
            ->where('completed_at', '>=', $since)
            ->get(['article_id', 'time_spent_seconds', 'completed_at']);

        $byDay = [];
        for ($i = 6; $i >= 0; $i--) {
            $day = Carbon::now()->subDays($i)->toDateString();
            $byDay[$day] = ['articles_read' => 0, 'minutes' => 0];
        }

        foreach ($progress as $row) {
            $day = Carbon::parse($row->completed_at)->toDateString();
            if (! isset($byDay[$day])) {
                continue;
            }
            $byDay[$day]['articles_read']++;
            $byDay[$day]['minutes'] += (int) ceil(($row->time_spent_seconds ?? 0) / 60);
        }

        $this->weeklyActivity = array_map(
            fn ($date, $v) => ['date' => $date, 'articles_read' => $v['articles_read'], 'minutes' => $v['minutes']],
            array_keys($byDay),
            array_values($byDay)
        );
    }

    protected function loadCategoryProgress($user): void
    {
        $completedArticleIds = $user->readingProgress()
            ->where('is_completed', true)
            ->pluck('article_id');

        $completedArticles = $completedArticleIds->isEmpty()
            ? collect()
            : Article::whereIn('id', $completedArticleIds)->get(['id', 'category_id']);

        $this->categoryProgress = Category::where('is_active', true)
            ->orderBy('order')
            ->get()
            ->map(function ($category) use ($completedArticles) {
                $totalArticles = $category->articles()->where('status', 'published')->count();
                $articlesRead = $completedArticles->where('category_id', $category->id)->count();

                return [
                    'name' => $category->name,
                    'slug' => $category->slug,
                    'icon' => $category->icon ?? '📖',
                    'color' => $category->color ?? '#B27C4E',
                    'articles_read' => $articlesRead,
                    'total_articles' => $totalArticles,
                    'percent' => $totalArticles > 0
                        ? (int) round(($articlesRead / $totalArticles) * 100)
                        : 0,
                ];
            })
            ->filter(fn ($c) => $c['total_articles'] > 0)
            ->values()
            ->toArray();
    }

    protected function loadRecentArticles($user): void
    {
        $this->recentArticles = $user->readingProgress()
            ->where('is_completed', true)
            ->with('article:id,title,slug,cover_image,category_id')
            ->with('article.category:id,name,slug,color')
            ->orderByDesc('completed_at')
            ->limit(5)
            ->get()
            ->map(fn ($progress) => [
                'title' => $progress->article?->title ?? 'Artigo removido',
                'slug' => $progress->article?->slug,
                'cover_image' => $progress->article?->cover_image,
                'category' => $progress->article?->category?->name ?? 'Geral',
                'category_color' => $progress->article?->category?->color ?? '#B27C4E',
                'time_spent' => (int) ceil(($progress->time_spent_seconds ?? 0) / 60),
                'completed_at' => $progress->completed_at?->diffForHumans(),
            ])
            ->toArray();
    }
}
