<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Laravel\Socialite\Facades\Socialite;
use App\Models\User;

class SocialiteController extends Controller
{
    public function redirect(Request $request, string $provider): JsonResponse
    {
        if ($provider !== 'google') {
            return response()->json(['message' => 'Provider not supported'], 400);
        }

        $state = $request->query('state', '');
        $next = $request->query('next', '');

        $socialiteState = $state ? $state . '|' . $next : $next;

        $url = Socialite::driver($provider)
            ->with(['state' => $socialiteState])
            ->redirect()
            ->getTargetUrl();

        return response()->json(['url' => $url]);
    }

    public function callback(Request $request, string $provider): JsonResponse
    {
        if ($provider !== 'google') {
            return response()->json(['message' => 'Provider not supported'], 400);
        }

        try {
            $socialUser = Socialite::driver($provider)->user();
        } catch (\Exception $e) {
            return response()->json(['message' => 'Social login failed', 'error' => $e->getMessage()], 400);
        }

        $user = User::where('email', $socialUser->getEmail())->first();

        if (!$user) {
            $name = $socialUser->getName() ?: $socialUser->getNickname() ?: 'User';
            $parts = explode(' ', $name, 2);
            $firstName = $parts[0] ?? 'User';
            $lastName = $parts[1] ?? '';

            $user = User::create([
                'name' => $name,
                'username' => $socialUser->getNickname() ?: strtolower(str_replace(' ', '.', $name)),
                'email' => $socialUser->getEmail(),
                'password' => bcrypt(\Illuminate\Support\Str::random(32)),
                'theme' => 'coffee',
            ]);
        }

        $token = $user->createToken('socialite-' . $provider)->plainTextToken;

        return response()->json([
            'user' => $user,
            'token' => $token,
            'provider' => $provider,
        ]);
    }
}
