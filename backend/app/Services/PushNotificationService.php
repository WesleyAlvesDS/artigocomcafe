<?php

namespace App\Services;

use App\Models\PushSubscription;
use App\Models\User;
use Illuminate\Support\Facades\Log;
use Minishlink\WebPush\WebPush;
use Minishlink\WebPush\Subscription;

class PushNotificationService
{
    private ?WebPush $webPush = null;

    public function __construct()
    {
        $this->initWebPush();
    }

    protected function initWebPush(): void
    {
        $publicKey = config('services.vapid.public_key', env('VAPID_PUBLIC_KEY'));
        $privateKey = config('services.vapid.private_key', env('VAPID_PRIVATE_KEY'));

        if (empty($publicKey) || empty($privateKey)) {
            return;
        }

        $this->webPush = new WebPush([
            'VAPID' => [
                'subject' => 'https://artigocomcafe.com',
                'publicKey' => $publicKey,
                'privateKey' => $privateKey,
            ],
        ]);
    }

    /**
     * Envia notificação para um usuário específico
     */
    public function sendToUser(User $user, string $title, string $body, array $data = []): void
    {
        if (! $this->webPush) {
            Log::warning('Push notifications not configured (missing VAPID keys)');
            return;
        }

        $subscriptions = PushSubscription::where('user_id', $user->id)->get();

        if ($subscriptions->isEmpty()) {
            return;
        }

        $payload = json_encode(array_merge([
            'title' => $title,
            'body' => $body,
            'icon' => $data['icon'] ?? '/favicon-32x32.png',
            'badge' => $data['badge'] ?? '/favicon-32x32.png',
            'url' => $data['url'] ?? '/app',
            'tag' => $data['tag'] ?? 'achievement-' . ($data['achievement_id'] ?? 'general'),
            'data' => $data,
        ]));

        foreach ($subscriptions as $sub) {
            try {
                $subscription = Subscription::create([
                    'endpoint' => $sub->endpoint,
                    'publicKey' => $sub->p256dh,
                    'authToken' => $sub->auth,
                ]);

                $this->webPush->queueNotification($subscription, $payload);
            } catch (\Exception $e) {
                Log::error("Failed to queue push notification: {$e->getMessage()}");
            }
        }

        $this->flush();
    }

    /**
     * Envia notificação de conquista desbloqueada
     */
    public function sendAchievementUnlocked(User $user, string $achievementName, string $achievementIcon, int $grainReward, string $achievementSlug): void
    {
        $this->sendToUser(
            $user,
            "🏆 Conquista Desbloqueada!",
            "Você desbloqueou \"{$achievementName}\" e ganhou +{$grainReward} ☕ grãos!",
            [
                'icon' => $achievementIcon,
                'url' => "/app/conquistas",
                'tag' => "achievement-{$achievementSlug}",
                'achievement_id' => $achievementSlug,
                'type' => 'achievement_unlocked',
                'grain_reward' => $grainReward,
            ]
        );
    }

    /**
     * Envia notificação de missão concluída
     */
    public function sendMissionCompleted(User $user, string $missionTitle, int $grainReward): void
    {
        $this->sendToUser(
            $user,
            "🎯 Missão Concluída!",
            "\"{$missionTitle}\" completa! +{$grainReward} ☕ grãos adicionados.",
            [
                'icon' => '🎯',
                'url' => '/app/missoes',
                'tag' => 'mission-completed',
                'type' => 'mission_completed',
                'grain_reward' => $grainReward,
            ]
        );
    }

    /**
     * Envia notificação de streak
     */
    public function sendStreakMilestone(User $user, int $streakDays): void
    {
        $messages = [
            3 => "🔥 Você está em chamas! {$streakDays} dias seguidos!",
            7 => "🔥 1ª semana completa! Você é incrível!",
            14 => "🔥 2 semanas seguidas! impressionante!",
            30 => "🔥 1 MÊS INABALÁVEL! Você é lendário!",
        ];

        $message = $messages[$streakDays] ?? "🔥 {$streakDays} dias seguidos! Continue assim!";

        $this->sendToUser(
            $user,
            "🔥 Streak Atualizado!",
            $message,
            [
                'icon' => '🔥',
                'url' => '/app/jornada',
                'tag' => "streak-{$streakDays}",
                'type' => 'streak_milestone',
                'streak_days' => $streakDays,
            ]
        );
    }

    /**
     * Envia notificação de novo artigo em destaque
     */
    public function sendNewFeaturedArticle(User $user, string $articleTitle, string $articleSlug): void
    {
        $this->sendToUser(
            $user,
            "📰 Novo Artigo em Destaque!",
            "\"{$articleTitle}\" está no feed. Confira agora!",
            [
                'icon' => '📰',
                'url' => "/blog/{$articleSlug}",
                'tag' => "featured-{$articleSlug}",
                'type' => 'new_featured_article',
            ]
        );
    }

    /**
     * Envia notificação para todos os usuários inscritos
     */
    public function sendToAll(string $title, string $body, array $data = []): void
    {
        if (! $this->webPush) {
            Log::warning('Push notifications not configured (missing VAPID keys)');
            return;
        }

        $subscriptions = PushSubscription::all();

        if ($subscriptions->isEmpty()) {
            return;
        }

        $payload = json_encode(array_merge([
            'title' => $title,
            'body' => $body,
            'icon' => $data['icon'] ?? '/favicon-32x32.png',
            'badge' => $data['badge'] ?? '/favicon-32x32.png',
            'url' => $data['url'] ?? '/app',
            'tag' => $data['tag'] ?? 'broadcast',
            'data' => $data,
        ]));

        foreach ($subscriptions as $sub) {
            try {
                $subscription = Subscription::create([
                    'endpoint' => $sub->endpoint,
                    'publicKey' => $sub->p256dh,
                    'authToken' => $sub->auth,
                ]);

                $this->webPush->queueNotification($subscription, $payload);
            } catch (\Exception $e) {
                Log::error("Failed to queue push notification: {$e->getMessage()}");
            }
        }

        $this->flush();
    }

    /**
     * Processa e envia todas as notificações enfileiradas
     */
    protected function flush(): void
    {
        if (! $this->webPush) {
            return;
        }

        try {
            foreach ($this->webPush->flush() as $report) {
                if ($report->isSubscriptionExpired()) {
                    PushSubscription::where('endpoint', $report->getEndpoint())->delete();
                    Log::info("Removed expired push subscription: {$report->getEndpoint()}");
                }
            }
        } catch (\Exception $e) {
            Log::error("Failed to flush push notifications: {$e->getMessage()}");
        }
    }

    /**
     * Verifica se o push está configurado
     */
    public function isConfigured(): bool
    {
        return $this->webPush !== null;
    }
}
