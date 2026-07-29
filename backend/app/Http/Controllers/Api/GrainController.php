<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class GrainController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        $totalEarned = $user->grains()->where('type', 'earned')->sum('amount');
        $totalSpent = $user->grains()->where('type', 'spent')->sum('amount');
        $balance = $totalEarned - $totalSpent;

        $recent = $user->grains()
            ->orderBy('created_at', 'desc')
            ->take(20)
            ->get();

        return response()->json([
            'balance' => $balance,
            'total_earned' => $totalEarned,
            'total_spent' => $totalSpent,
            'recent' => $recent,
        ]);
    }
}
