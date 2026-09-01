<?php

namespace App\Filament\User\Pages;

use App\Models\PushSubscription;
use App\Models\Setting;
use BackedEnum;
use Filament\Pages\Page;
use Illuminate\Support\Facades\Auth;
use UnitEnum;

class ConfiguracoesPage extends Page
{
    protected string $view = 'filament.user.configuracoes-page';

    protected static ?string $title = 'Configurações';

    protected static BackedEnum|string|null $navigationIcon = 'heroicon-o-cog-6-tooth';

    protected static ?string $navigationLabel = 'Configurações';

    protected static ?int $navigationSort = 99;

    protected static ?string $slug = 'configuracoes';

    // ── Estado ─────────────────────────────────────────────
    public bool $pushEnabled = false;
    public int $pushDeviceCount = 0;
    public bool $notifyAchievements = true;
    public bool $notifyMissions = true;
    public bool $notifyNewArticles = false;
    public bool $notifyStreak = true;
    public bool $notifyWeeklyDigest = false;
    public string $theme = 'light';
    public string $language = 'pt-BR';


    public function mount(): void
    {
        $user = Auth::user();
        if (! $user) {
            return;
        }

        $this->loadPreferences($user);
        $this->loadPushStatus();
    }

    protected function loadPreferences($user): void
    {
        // Load per-user preferences from Setting model using user-prefixed key
        $key = "user_{$user->id}_preferences";
        $raw = Setting::get($key);

        $preferences = is_array($raw) ? $raw : (is_string($raw) ? json_decode($raw, true) ?? [] : []);

        $this->notifyAchievements = $preferences['notify_achievements'] ?? true;
        $this->notifyMissions = $preferences['notify_missions'] ?? true;
        $this->notifyNewArticles = $preferences['notify_new_articles'] ?? false;
        $this->notifyStreak = $preferences['notify_streak'] ?? true;
        $this->notifyWeeklyDigest = $preferences['notify_weekly_digest'] ?? false;
        $this->theme = $preferences['theme'] ?? 'light';
        $this->language = $preferences['language'] ?? 'pt-BR';
    }

    protected function loadPushStatus(): void
    {
        $user = Auth::user();
        $this->pushDeviceCount = PushSubscription::where('user_id', $user->id)->count();
        $this->pushEnabled = $this->pushDeviceCount > 0;
    }

    /**
     * Salva as preferências de notificação
     */
    public function savePreferences(): void
    {
        $user = Auth::user();
        if (! $user) {
            return;
        }

        $preferences = [
            'notify_achievements' => $this->notifyAchievements,
            'notify_missions' => $this->notifyMissions,
            'notify_new_articles' => $this->notifyNewArticles,
            'notify_streak' => $this->notifyStreak,
            'notify_weekly_digest' => $this->notifyWeeklyDigest,
            'theme' => $this->theme,
            'language' => $this->language,
        ];

        // Save using user-prefixed key in the global settings table
        Setting::set("user_{$user->id}_preferences", json_encode($preferences), 'user');

        // Aplica o tema
        $this->dispatch('themeChanged', theme: $this->theme);

        $this->dispatch('showToast', icon: '✅', title: 'Preferências salvas!', message: 'Suas configurações foram atualizadas.');
    }

    /**
     * Remove todos os dispositivos push
     */
    public function clearAllPushDevices(): void
    {
        $user = Auth::user();
        if (! $user) {
            return;
        }

        PushSubscription::where('user_id', $user->id)->delete();

        $this->pushEnabled = false;
        $this->pushDeviceCount = 0;

        $this->dispatch('showToast', icon: '🔔', title: 'Notificações desativadas', message: 'Todos os dispositivos foram removidos.');
    }
}
