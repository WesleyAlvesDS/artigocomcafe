<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Grain;
use App\Models\Reward;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class RoasteryController extends Controller
{
    /**
     * List all available rewards and user's unlocked/active ones.
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $userRewards = $user->rewards()->get()->keyBy('id');

        $rewards = Reward::active()
            ->orderBy('sort_order')
            ->get()
            ->map(function ($reward) use ($userRewards) {
                $userReward = $userRewards->get($reward->id);
                return [
                    'id' => $reward->id,
                    'name' => $reward->name,
                    'slug' => $reward->slug,
                    'description' => $reward->description,
                    'type' => $reward->type,
                    'category' => $reward->category,
                    'icon' => $reward->icon,
                    'image_url' => $reward->image_url,
                    'content' => $reward->content,
                    'grain_cost' => $reward->grain_cost,
                    'rarity' => $reward->rarity,
                    'is_unlocked' => $userReward !== null,
                    'is_active' => $userReward ? (bool) $userReward->pivot->is_active : false,
                    'unlocked_at' => $userReward ? $userReward->pivot->unlocked_at : null,
                ];
            });

        $totalGrainsEarned = $user->grains()->where('type', 'earned')->sum('amount');
        $totalGrainsSpent = $user->grains()->where('type', 'spent')->sum('amount');
        $balance = $totalGrainsEarned - $totalGrainsSpent;

        // Group rewards by type for easier frontend rendering
        $grouped = [
            'themes' => $rewards->where('type', 'theme')->values(),
            'avatars' => $rewards->where('type', 'avatar')->values(),
            'frames' => $rewards->where('type', 'frame')->values(),
            'specials' => $rewards->where('type', 'special')->values(),
        ];

        return response()->json([
            'rewards' => $rewards,
            'grouped' => $grouped,
            'balance' => $balance,
            'total_earned' => $totalGrainsEarned,
            'total_spent' => $totalGrainsSpent,
            'unlocked_count' => $rewards->where('is_unlocked', true)->count(),
            'total_count' => $rewards->count(),
            'active_count' => $rewards->where('is_active', true)->count(),
        ]);
    }

    /**
     * Roast (spend) grains to unlock a reward.
     */
    public function roast(Request $request, Reward $reward): JsonResponse
    {
        $user = $request->user();

        if (!$reward->is_active) {
            return response()->json(['message' => 'Esta recompensa não está disponível.'], 400);
        }

        // Check if already unlocked
        if ($user->rewards()->where('reward_id', $reward->id)->exists()) {
            return response()->json(['message' => 'Você já desbloqueou esta recompensa.'], 409);
        }

        // Check balance
        $balance = $user->total_grains;
        if ($balance < $reward->grain_cost) {
            return response()->json([
                'message' => 'Grãos insuficientes. Você precisa de ' . $reward->grain_cost . ' grãos, mas tem apenas ' . $balance . '.',
                'needed' => $reward->grain_cost - $balance,
                'balance' => $balance,
                'cost' => $reward->grain_cost,
            ], 400);
        }

        // Spend grains
        Grain::create([
            'user_id' => $user->id,
            'amount' => $reward->grain_cost,
            'type' => 'spent',
            'source' => 'torrefacao',
            'description' => "Torrefação: {$reward->name}",
            'metadata' => ['reward_id' => $reward->id, 'reward_slug' => $reward->slug],
        ]);

        // Unlock reward
        $user->rewards()->attach($reward->id, [
            'is_active' => true,
            'unlocked_at' => now(),
            'activated_at' => now(),
        ]);

        // If it's a theme, auto-activate it and deactivate others
        if ($reward->type === 'theme') {
            $user->rewards()
                ->where('reward_id', '!=', $reward->id)
                ->wherePivot('is_active', true)
                ->update(['is_active' => false]);
        }

        return response()->json([
            'message' => "☕ Você torrou {$reward->grain_cost} grãos e desbloqueou: {$reward->name}!",
            'reward' => [
                'id' => $reward->id,
                'name' => $reward->name,
                'slug' => $reward->slug,
                'type' => $reward->type,
                'icon' => $reward->icon,
                'rarity' => $reward->rarity,
                'is_unlocked' => true,
                'is_active' => $reward->type === 'theme',
            ],
            'new_balance' => $balance - $reward->grain_cost,
        ]);
    }

    /**
     * Activate or deactivate a reward.
     */
    public function toggle(Request $request, Reward $reward): JsonResponse
    {
        $user = $request->user();

        $userReward = $user->rewards()->where('reward_id', $reward->id)->first();

        if (!$userReward) {
            return response()->json(['message' => 'Você ainda não desbloqueou esta recompensa.'], 404);
        }

        $currentlyActive = (bool) $userReward->pivot->is_active;
        $newActive = !$currentlyActive;

        // For themes, deactivate other themes when activating a new one
        if ($reward->type === 'theme' && $newActive) {
            $user->rewards()
                ->where('reward_id', '!=', $reward->id)
                ->wherePivot('is_active', true)
                ->update(['is_active' => false]);
        }

        $user->rewards()->updateExistingPivot($reward->id, [
            'is_active' => $newActive,
            'activated_at' => $newActive ? now() : null,
        ]);

        return response()->json([
            'message' => $newActive ? "{$reward->name} ativado!" : "{$reward->name} desativado.",
            'is_active' => $newActive,
        ]);
    }

    /**
     * Get currently active theme (for frontend theme switching).
     */
    public function activeTheme(Request $request): JsonResponse
    {
        $user = $request->user();

        $activeTheme = $user->rewards()
            ->where('type', 'theme')
            ->wherePivot('is_active', true)
            ->first();

        return response()->json([
            'theme' => $activeTheme ? [
                'id' => $activeTheme->id,
                'name' => $activeTheme->name,
                'slug' => $activeTheme->slug,
                'icon' => $activeTheme->icon,
                'content' => $activeTheme->content,
            ] : null,
        ]);
    }
}
