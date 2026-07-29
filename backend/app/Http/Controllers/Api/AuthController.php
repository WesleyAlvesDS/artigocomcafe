<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function register(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'username' => 'required|string|max:50|unique:users|alpha_dash',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:8|confirmed',
            'theme' => 'sometimes|string|in:cafe,livros,tecnologia,natureza,espaco,games,musica',
        ]);

        $user = User::create([
            'name' => $validated['name'],
            'username' => $validated['username'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'theme' => $validated['theme'] ?? 'cafe',
            'last_visit_date' => now()->toDateString(),
            'last_login_at' => now(),
        ]);

        $token = $user->createToken('auth-token')->plainTextToken;

        return response()->json([
            'user' => $user->only(['id', 'name', 'username', 'email', 'theme', 'avatar']),
            'token' => $token,
        ], 201);
    }

    public function login(Request $request): JsonResponse
    {
        $request->validate([
            'email' => 'required|string|email',
            'password' => 'required|string',
        ]);

        $user = User::where('email', $request->email)->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['As credenciais fornecidas estão incorretas.'],
            ]);
        }

        $user->update([
            'last_login_at' => now(),
            'last_visit_date' => now()->toDateString(),
        ]);

        $token = $user->createToken('auth-token')->plainTextToken;

        $this->updateStreak($user);

        return response()->json([
            'user' => $user->only(['id', 'name', 'username', 'email', 'theme', 'avatar']),
            'token' => $token,
        ]);
    }

    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json(['message' => 'Logout realizado com sucesso.']);
    }

    public function me(Request $request): JsonResponse
    {
        $user = $request->user()->loadCount(['collections', 'achievements']);

        $user->total_grains = $user->total_grains;
        $user->completed_trails = $user->completed_trails_count;

        return response()->json(['user' => $user]);
    }

    public function updateProfile(Request $request): JsonResponse
    {
        $user = $request->user();

        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'bio' => 'nullable|string|max:500',
            'avatar' => 'nullable|string|max:255',
            'theme' => 'sometimes|string|in:cafe,livros,tecnologia,natureza,espaco,games,musica',
        ]);

        $user->update($validated);

        return response()->json(['user' => $user, 'message' => 'Perfil atualizado.']);
    }

    private function updateStreak(User $user): void
    {
        $today = now()->toDateString();
        $yesterday = now()->subDay()->toDateString();

        if ($user->last_visit_date === $yesterday) {
            $user->increment('daily_streak');
        } elseif ($user->last_visit_date !== $today) {
            $user->daily_streak = 1;
        }

        $user->last_visit_date = $today;
        $user->save();
    }
}
