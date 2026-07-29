<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Article;
use App\Models\DailyVisit;
use App\Models\Grain;
use App\Models\ReadingProgress;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ReadingProgressController extends Controller
{
    public function update(Request $request, Article $article): JsonResponse
    {
        $validated = $request->validate([
            'progress_percent' => 'required|integer|min:0|max:100',
            'time_spent_seconds' => 'required|integer|min:0',
            'scroll_depth' => 'integer|min:0|max:100',
        ]);

        $user = $request->user();

        $progress = ReadingProgress::updateOrCreate(
            ['user_id' => $user->id, 'article_id' => $article->id],
            [
                'progress_percent' => $validated['progress_percent'],
                'time_spent_seconds' => $validated['time_spent_seconds'],
                'scroll_depth' => $validated['scroll_depth'] ?? 0,
                'started_at' => now(),
            ]
        );

        if ($validated['progress_percent'] >= 90 && !$progress->is_completed) {
            $this->completeReading($user, $article, $progress);
        }

        return response()->json(['progress' => $progress]);
    }

    public function complete(Request $request, Article $article): JsonResponse
    {
        $user = $request->user();

        $progress = ReadingProgress::firstOrCreate(
            ['user_id' => $user->id, 'article_id' => $article->id],
            ['progress_percent' => 100, 'time_spent_seconds' => 0, 'scroll_depth' => 100]
        );

        if (!$progress->is_completed) {
            $this->completeReading($user, $article, $progress);
        }

        return response()->json(['message' => 'Leitura concluída!', 'progress' => $progress]);
    }

    public function progress(Request $request): JsonResponse
    {
        $user = $request->user();

        $inProgress = ReadingProgress::where('user_id', $user->id)
            ->where('is_completed', false)
            ->where('progress_percent', '>', 0)
            ->with(['article' => function ($q) {
                $q->published()->with('category:id,name,slug');
            }])
            ->orderBy('updated_at', 'desc')
            ->take(10)
            ->get()
            ->filter(fn($p) => $p->article !== null)
            ->values();

        return response()->json(['in_progress' => $inProgress]);
    }

    private function completeReading(User $user, Article $article, ReadingProgress $progress): void
    {
        $progress->update([
            'is_completed' => true,
            'progress_percent' => 100,
            'completed_at' => now(),
        ]);

        $article->increment('reading_count');

        $readingTimeMinutes = (int) ceil($progress->time_spent_seconds / 60);
        $readingTimeMinutes = max(1, $readingTimeMinutes);

        $grainAmount = $readingTimeMinutes >= 5 ? 5 : 1;

        $user->increment('articles_read_count');
        $user->increment('reading_time_total', $readingTimeMinutes);

        Grain::create([
            'user_id' => $user->id,
            'amount' => $grainAmount,
            'type' => 'earned',
            'source' => 'read_article',
            'description' => "Leitura concluída: {$article->title}",
        ]);

        $dailyVisit = DailyVisit::firstOrCreate(
            ['user_id' => $user->id, 'visit_date' => now()->toDateString()],
            ['articles_read' => 0, 'time_spent_minutes' => 0, 'grains_earned' => 0]
        );

        $dailyVisit->increment('articles_read');
        $dailyVisit->increment('time_spent_minutes', $readingTimeMinutes);
        $dailyVisit->increment('grains_earned', $grainAmount);
    }
}
