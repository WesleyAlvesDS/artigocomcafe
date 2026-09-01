<?php

namespace App\Filament\User\Pages;

use App\Models\Article;
use App\Models\User;
use BackedEnum;
use Filament\Forms\Components\Checkbox;
use Filament\Forms\Components\TextInput;
use Filament\Notifications\Notification;
use Filament\Auth\Pages\Login;

class SuperAppLogin extends Login
{
    protected string $view = 'filament.user.super-app-login';

    public ?array $data = [];

    public static BackedEnum|string|null $navigationIcon = null;

    public static ?string $title = 'Artigo com Café';

    public function form(\Filament\Schemas\Schema $schema): \Filament\Schemas\Schema
    {
        return $schema
            ->schema([
                TextInput::make('email')
                    ->label('E-mail')
                    ->email()
                    ->required()
                    ->autocomplete()
                    ->autofocus()
                    ->placeholder('seu@email.com')
                    ->inputMode('email'),

                TextInput::make('password')
                    ->label('Senha')
                    ->password()
                    ->required()
                    ->autocomplete('current-password')
                    ->placeholder('••••••••'),

                Checkbox::make('remember')
                    ->label('Lembrar-me'),
            ])
            ->statePath('data');
    }

    /**
     * Usa a lógica de auth já existente no AuthController.
     * IMPORTANTE: updateStreak() deve ser chamado ANTES de atualizar last_visit_date.
     */
    public function authenticate(): \Filament\Auth\Http\Responses\Contracts\LoginResponse
    {
        $data = $this->data;

        if (! filled($data['email'] ?? null) || ! filled($data['password'] ?? null)) {
            Notification::make()
                ->title('Preencha e-mail e senha')
                ->warning()
                ->send();

            return $this->redirect('/app/login', navigate: true);
        }

        $user = User::where('email', $data['email'])->first();

        if (! $user || ! \Hash::check($data['password'], $user->password)) {
            Notification::make()
                ->title('E-mail ou senha incorretos')
                ->danger()
                ->send();

            return $this->redirect('/app/login', navigate: true);
        }

        // ── Streak ANTES de atualizar last_visit_date ──────
        $this->updateStreak($user);

        // ── Login via Filament ──────────────────────────────
        auth()->login($user, data_get($data, 'remember', false));

        // Atualiza timestamps (DEPOIS do streak)
        $user->update([
            'last_login_at' => now(),
            'last_visit_date' => now()->toDateString(),
        ]);

        session()->regenerate();

        return $this->redirect('/app/', navigate: true);
    }

    /**
     * Mesma lógica de streak do AuthController existente.
     */
    private function updateStreak(User $user): void
    {
        $today = now()->toDateString();
        $yesterday = now()->subDay()->toDateString();

        if ($user->last_visit_date === $yesterday) {
            $user->increment('daily_streak');
        } elseif ($user->last_visit_date !== $today) {
            $user->daily_streak = 1;
        }
    }

    protected function getFormActions(): array
    {
        return [];
    }

    public function getViewData(): array
    {
        return [
            'featuredArticles' => $this->getFeaturedArticles(),
            'stats' => $this->getSiteStats(),
        ];
    }

    protected function getFeaturedArticles(): array
    {
        return Article::published()
            ->featured()
            ->orderByDesc('published_at')
            ->limit(3)
            ->get()
            ->map(fn ($a) => [
                'title' => $a->title,
                'cover_image' => $a->cover_image ?? $a->featured_image,
                'category' => $a->category?->name ?? 'Geral',
            ])
            ->toArray();
    }

    protected function getSiteStats(): array
    {
        return [
            'articles' => Article::published()->count(),
            'recipes' => \App\Models\Recipe::published()->count(),
            'users' => User::count(),
        ];
    }
}
