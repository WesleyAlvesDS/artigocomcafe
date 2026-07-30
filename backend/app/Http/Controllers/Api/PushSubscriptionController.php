<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\PushSubscription;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PushSubscriptionController extends Controller
{
    public function subscribe(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'endpoint' => 'required|url',
            'keys' => 'required|array',
            'keys.p256dh' => 'required|string',
            'keys.auth' => 'required|string',
        ]);

        $user = $request->user();

        $subscription = PushSubscription::updateOrCreate(
            ['user_id' => $user->id, 'endpoint' => $validated['endpoint']],
            [
                'p256dh' => $validated['keys']['p256dh'],
                'auth' => $validated['keys']['auth'],
            ]
        );

        return response()->json([
            'message' => 'Inscrito com sucesso!',
            'subscription' => $subscription,
        ]);
    }

    public function unsubscribe(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'endpoint' => 'required|string',
        ]);

        $user = $request->user();

        PushSubscription::where('user_id', $user->id)
            ->where('endpoint', $validated['endpoint'])
            ->delete();

        return response()->json(['message' => 'Removido com sucesso.']);
    }

    public function status(Request $request): JsonResponse
    {
        $user = $request->user();
        $count = PushSubscription::where('user_id', $user->id)->count();

        return response()->json([
            'is_subscribed' => $count > 0,
            'device_count' => $count,
        ]);
    }
}
