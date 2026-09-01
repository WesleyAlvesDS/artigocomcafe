<?php

namespace App\Filament\Pages;

use App\Models\Setting;
use App\Services\Integrations\CurrentsService;
use App\Services\Integrations\ExchangeRateService;
use App\Services\Integrations\GNewsService;
use App\Services\Integrations\GuardianService;
use App\Services\Integrations\HackerNewsService;
use App\Services\Integrations\OpenWeatherService;
use BackedEnum;
use Filament\Actions\Action;
use UnitEnum;
use Filament\Actions\Actions;
use Filament\Forms\Components\Section;
use Filament\Forms\Components\TextInput;
use Filament\Notifications\Notification;
use Filament\Pages\Page;
use Filament\Schemas\Components\EmbeddedSchema;
use Filament\Schemas\Components\Form;
use Filament\Schemas\Schema;
use Filament\Support\Icons\Heroicon;

class Integrations extends Page
{
    protected static string|BackedEnum|null $navigationIcon = Heroicon::OutlinedGlobeAlt;

    protected static ?string $navigationLabel = 'Integrações';

    protected static ?string $title = 'Integrações de API';

    protected static string|UnitEnum|null $navigationGroup = 'Configurações';

    protected static ?int $navigationSort = 5;

    public function mount(): void
    {
        $this->form->fill([
            'guardian_api_key' => Setting::get('guardian_api_key'),
            'currents_api_key' => Setting::get('currents_api_key'),
            'gnews_api_key' => Setting::get('gnews_api_key'),
            'openrouter_api_key' => Setting::get('openrouter_api_key'),
            'unsplash_api_key' => Setting::get('unsplash_api_key'),
            'openverse_client_id' => Setting::get('openverse_client_id'),
            'openverse_client_secret' => Setting::get('openverse_client_secret'),
            'ipinfo_token' => Setting::get('ipinfo_token'),
            'groq_api_key' => Setting::get('groq_api_key'),
            'gemini_api_key' => Setting::get('gemini_api_key'),
        ]);
    }

    public function form(Schema $schema): Schema
    {
        return $schema->components([
            Section::make('📰 Notícias')
                ->description('Guardian, Currents e GNews para alimentar o blog com conteúdo externo.')
                ->schema([
                    TextInput::make('guardian_api_key')
                        ->label('The Guardian — API Key')
                        ->password()
                        ->revealable()
                        ->helperText('Gratuita em open-platform.theguardian.com. Deixe vazio para usar a chave demo "test".'),
                    TextInput::make('currents_api_key')
                        ->label('Currents API — API Key')
                        ->password()
                        ->revealable(),
                    TextInput::make('gnews_api_key')
                        ->label('GNews — API Key')
                        ->password()
                        ->revealable(),
                    TextInput::make('openrouter_api_key')
                        ->label('OpenRouter — API Key')
                        ->password()
                        ->revealable()
                        ->helperText('Chave sk-or-v1-... usada pelo Copilot Editorial.'),
                ]),

            Section::make('🖼️ Imagens')
                ->description('Unsplash e Openverse (Creative Commons) para gerar thumbnails automáticas.')
                ->schema([
                    TextInput::make('unsplash_api_key')
                        ->label('Unsplash — Access Key')
                        ->password()
                        ->revealable(),
                    TextInput::make('openverse_client_id')
                        ->label('Openverse — Client ID')
                        ->password()
                        ->revealable(),
                    TextInput::make('openverse_client_secret')
                        ->label('Openverse — Client Secret')
                        ->password()
                        ->revealable(),
                ]),

            Section::make('🧠 Inteligência Artificial')
                ->description('Groq e Google Gemini para o Assistente Editorial (Fase 3).')
                ->schema([
                    TextInput::make('groq_api_key')
                        ->label('Groq Cloud — API Key')
                        ->password()
                        ->revealable()
                        ->helperText('Modelos rápidos e gratuitos (Llama, Mixtral).'),
                    TextInput::make('gemini_api_key')
                        ->label('Google Gemini — API Key')
                        ->password()
                        ->revealable(),
                ]),

            Section::make('📍 Localização')
                ->description('IPinfo para personalizar conteúdo por região do visitante.')
                ->schema([
                    TextInput::make('ipinfo_token')
                        ->label('IPinfo — Access Token')
                        ->password()
                        ->revealable(),
                ]),
        ]);
    }

    public function content(Schema $schema): Schema
    {
        return $schema->components([
            Form::make([
                EmbeddedSchema::make('form'),
            ])
                ->id('form')
                ->livewireSubmitHandler('save')
                ->footer([
                    Actions::make($this->getFormActions()),
                ]),
        ]);
    }

    protected function getFormActions(): array
    {
        return [
            Action::make('save')
                ->label('Salvar integrações')
                ->submit('save')
                ->keyBindings(['mod+s']),
            Action::make('test')
                ->label('Testar conexões')
                ->color('gray')
                ->action('testConnections'),
        ];
    }

    public function save(): void
    {
        $state = $this->form->getState();

        foreach ($state as $key => $value) {
            Setting::set($key, $value ?? '');
        }

        Notification::make()
            ->title('Integrações salvas com sucesso!')
            ->success()
            ->send();
    }

    public function testConnections(): void
    {
        $results = [];

        // fresh=true ignora o cache para testar a conexão de verdade
        $guardian = app(GuardianService::class)->headlines(1, fresh: true);
        $results['The Guardian'] = filled($guardian['items'] ?? []);

        $hackerNews = app(HackerNewsService::class)->headlines(1, fresh: true);
        $results['Hacker News'] = filled($hackerNews['items'] ?? []);

        $currents = app(CurrentsService::class)->headlines('café', 1, fresh: true);
        $results['Currents'] = filled($currents['items'] ?? []);

        $gnews = app(GNewsService::class)->headlines('café', 1, fresh: true);
        $results['GNews'] = filled($gnews['items'] ?? []);

        $weather = app(OpenWeatherService::class)->current(fresh: true);
        $results['Clima (wttr.in)'] = filled($weather['temperature_c'] ?? null);

        $exchange = app(ExchangeRateService::class)->latest('BRL', fresh: true);
        $results['Câmbio (open.er-api)'] = filled($exchange['rates'] ?? []);

        $failed = collect($results)->filter(fn (bool $ok) => ! $ok)->keys()->all();
        $passed = collect($results)->filter(fn (bool $ok) => $ok)->keys()->all();

        if (empty($failed)) {
            Notification::make()
                ->title('Todas as integrações estão funcionando!')
                ->body('✓ '.implode(' · ✓ ', $passed))
                ->success()
                ->send();

            return;
        }

        Notification::make()
            ->title('Algumas integrações falharam')
            ->body('✓ '.implode(' · ✓ ', $passed).(filled($failed) ? "\n✗ ".implode(' · ✗ ', $failed) : ''))
            ->warning()
            ->send();
    }

    public static function canAccess(): bool
    {
        return auth()->user()?->isAdministrator() ?? false;
    }
}
