<?php

namespace App\Console\Commands;

use App\Models\PushSubscription;
use App\Models\User;
use Illuminate\Console\Command;
use Minishlink\WebPush\WebPush;
use Minishlink\WebPush\Subscription;

class SendPushNotification extends Command
{
    protected $signature = 'push:send
        {title : Notification title}
        {body : Notification body}
        {--url=/ : URL to open when notification is clicked}
        {--user= : Send only to a specific user ID}
        {--icon=/favicon-32x32.png : Notification icon}
        {--tag=article-update : Notification grouping tag}';

    protected $description = 'Send a push notification to subscribed users';

    public function handle(): int
    {
        $auth = [
            'VAPID' => [
                'subject' => 'https://artigocomcafe.com',
                'publicKey' => env('VAPID_PUBLIC_KEY'),
                'privateKey' => env('VAPID_PRIVATE_KEY'),
            ],
        ];

        if (empty($auth['VAPID']['publicKey']) || empty($auth['VAPID']['privateKey'])) {
            $this->error('VAPID keys not configured. Set VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY in .env');
            $this->info('Generate keys: php artisan push:generate-vapid-keys');
            return Command::FAILURE;
        }

        $webPush = new WebPush($auth);

        $query = PushSubscription::query();
        if ($userId = $this->option('user')) {
            $query->where('user_id', $userId);
        }

        $subscriptions = $query->get();
        $count = $subscriptions->count();

        if ($count === 0) {
            $this->warn('No subscriptions found.');
            return Command::SUCCESS;
        }

        $this->info("Sending to {$count} subscription(s)...");

        $payload = json_encode([
            'title' => $this->argument('title'),
            'body' => $this->argument('body'),
            'icon' => $this->option('icon'),
            'url' => $this->option('url'),
            'tag' => $this->option('tag'),
        ]);

        foreach ($subscriptions as $sub) {
            $subscription = Subscription::create([
                'endpoint' => $sub->endpoint,
                'publicKey' => $sub->p256dh,
                'authToken' => $sub->auth,
            ]);

            $webPush->queueNotification($subscription, $payload);
        }

        $success = 0;
        $failed = 0;

        /** @var \Minishlink\WebPush\MessageSentReport $report */
        foreach ($webPush->flush() as $report) {
            if ($report->isSuccess()) {
                $success++;
            } else {
                $failed++;
                $this->warn("Failed: {$report->getEndpoint()} - {$report->getReason()}");

                // Remove invalid subscriptions
                if ($report->isSubscriptionExpired()) {
                    PushSubscription::where('endpoint', $report->getEndpoint())->delete();
                }
            }
        }

        $this->info("Done: {$success} sent, {$failed} failed, {$count} total");

        return Command::SUCCESS;
    }
}
