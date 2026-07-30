<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Minishlink\WebPush\VAPID;

class GenerateVapidKeys extends Command
{
    protected $signature = 'push:generate-vapid-keys';
    protected $description = 'Generate VAPID keys for Web Push notifications (P-256 ECDSA)';

    public function handle(): int
    {
        $this->info('Generating VAPID keys (P-256 ECDSA)...');

        try {
            $keys = VAPID::createVapidKeys();

            $this->info('Public Key:  ' . $keys['publicKey']);
            $this->info('Private Key: ' . $keys['privateKey']);
            $this->newLine();
            $this->warn('Add these to your .env file:');
            $this->line('VAPID_PUBLIC_KEY=' . $keys['publicKey']);
            $this->line('VAPID_PRIVATE_KEY=' . $keys['privateKey']);
            $this->newLine();
            $this->warn('Also update APPLICATION_SERVER_KEY in src/lib/push.ts with the public key.');

            return Command::SUCCESS;
        } catch (\Exception $e) {
            $this->error('Failed to generate VAPID keys: ' . $e->getMessage());
            $this->info('');
            $this->info('Alternative: run "npx web-push generate-vapid-keys" (Node.js)');
            return Command::FAILURE;
        }
    }
}
