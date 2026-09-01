{{-- ═══════════════════════════════════════════════════════════════
     CONFIGURAÇÕES — Super App Artigo com Café
     Notificações Push + Preferências + Tema
     ═══════════════════════════════════════════════════════════════ --}}

<x-filament-panels::page>
<div
    x-data="{
        loaded: false,
        saving: false,
        saved: false,
        activeTab: 'notifications',
        init() {
            setTimeout(() => this.loaded = true, 100);
        },
        async saveForm() {
            this.saving = true;
            await $wire.savePreferences();
            this.saving = false;
            this.saved = true;
            setTimeout(() => this.saved = false, 3000);
        }
    }"
    x-cloak
    class="max-w-3xl mx-auto space-y-6"
>

    {{-- ═══ HEADER ═══ --}}
    <div x-show="loaded" x-transition.opacity.duration.500ms class="text-center mb-8">
        <div class="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-gray-600 to-gray-700 rounded-2xl shadow-lg mb-4">
            <span class="text-3xl">⚙️</span>
        </div>
        <h1 class="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white" style="font-family: 'Cormorant Garamond', serif;">
            Configurações
        </h1>
        <p class="text-gray-600 dark:text-gray-400 mt-2">Gerencie suas preferências e notificações</p>
    </div>

    {{-- ═══ TABS ═══ --}}
    <div class="flex gap-2 overflow-x-auto no-scrollbar" x-show="loaded" x-transition:enter="transition ease-out duration-500 delay-100" x-transition:enter-start="opacity-0" x-transition:enter-end="opacity-100">
        @foreach ([
            'notifications' => '🔔 Notificações',
            'appearance' => '🎨 Aparência',
            'account' => '👤 Conta',
        ] as $key => $label)
            <button
                @click="activeTab = '{{ $key }}'"
                :class="activeTab === '{{ $key }}'
                    ? 'bg-amber-600 text-white shadow-lg shadow-amber-500/25'
                    : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'"
                class="flex-shrink-0 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all duration-300 border border-gray-200 dark:border-gray-700"
            >
                {{ $label }}
            </button>
        @endforeach
    </div>

    {{-- ═══ TAB: NOTIFICAÇÕES ═══ --}}
    <div x-show="activeTab === 'notifications'" x-transition:enter="transition ease-out duration-300" x-transition:enter-start="opacity-0" x-transition:enter-end="opacity-100" class="space-y-6">

        {{-- Status Push --}}
        <div class="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm" x-show="loaded" x-transition:enter="transition ease-out duration-500 delay-200" x-transition:enter-start="opacity-0 translate-y-4" x-transition:enter-end="opacity-100 translate-y-0">
            <div class="flex items-center justify-between mb-4">
                <div class="flex items-center gap-3">
                    <div class="w-12 h-12 rounded-xl {{ $pushEnabled ? 'bg-green-100 dark:bg-green-900/30' : 'bg-gray-100 dark:bg-gray-700' }} flex items-center justify-center text-2xl">
                        {{ $pushEnabled ? '🔔' : '🔕' }}
                    </div>
                    <div>
                        <h3 class="font-bold text-gray-900 dark:text-white">Notificações Push</h3>
                        <p class="text-sm text-gray-500 dark:text-gray-400">
                            @if ($pushEnabled)
                                Ativo em {{ $pushDeviceCount }} {{ $pushDeviceCount === 1 ? 'dispositivo' : 'dispositivos' }}
                            @else
                                Nenhum dispositivo conectado
                            @endif
                        </p>
                    </div>
                </div>
                @if ($pushEnabled)
                    <button
                        wire:click="clearAllPushDevices"
                        onclick="return confirm('Isso desativará notificações em todos os seus dispositivos. Continuar?')"
                        class="px-4 py-2 text-sm font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-xl hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                    >
                        Desativar
                    </button>
                @endif
            </div>

            @if (!$pushEnabled)
                <div class="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-xl border border-amber-200/50 dark:border-amber-800/30">
                    <p class="text-sm text-amber-700 dark:text-amber-400">
                        💡 Ative as notificações para receber alertas de conquistas, missões e novos artigos.
                    </p>
                </div>
            @endif
        </div>

        {{-- Preferências de Notificação --}}
        <div class="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm" x-show="loaded" x-transition:enter="transition ease-out duration-500 delay-300" x-transition:enter-start="opacity-0 translate-y-4" x-transition:enter-end="opacity-100 translate-y-0">
            <h3 class="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2" style="font-family: 'Cormorant Garamond', serif;">
                📬 O que notificar
            </h3>

            <div class="space-y-1">
                {{-- Conquistas --}}
                <label class="flex items-center justify-between p-4 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer group">
                    <div class="flex items-center gap-3">
                        <span class="text-xl">🏆</span>
                        <div>
                            <p class="font-medium text-gray-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">Conquistas</p>
                            <p class="text-xs text-gray-500 dark:text-gray-400">Quando você desbloqueia uma nova conquista</p>
                        </div>
                    </div>
                    <div class="relative">
                        <input type="checkbox" wire:model.live="notifyAchievements" class="sr-only peer">
                        <div class="w-11 h-6 bg-gray-200 dark:bg-gray-700 rounded-full peer peer-checked:bg-amber-500 transition-colors"></div>
                        <div class="absolute left-[2px] top-[2px] w-5 h-5 bg-white rounded-full shadow peer-checked:translate-x-full transition-transform"></div>
                    </div>
                </label>

                {{-- Missões --}}
                <label class="flex items-center justify-between p-4 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer group">
                    <div class="flex items-center gap-3">
                        <span class="text-xl">🎯</span>
                        <div>
                            <p class="font-medium text-gray-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">Missões</p>
                            <p class="text-xs text-gray-500 dark:text-gray-400">Quando você completa uma missão diária ou semanal</p>
                        </div>
                    </div>
                    <div class="relative">
                        <input type="checkbox" wire:model.live="notifyMissions" class="sr-only peer">
                        <div class="w-11 h-6 bg-gray-200 dark:bg-gray-700 rounded-full peer peer-checked:bg-amber-500 transition-colors"></div>
                        <div class="absolute left-[2px] top-[2px] w-5 h-5 bg-white rounded-full shadow peer-checked:translate-x-full transition-transform"></div>
                    </div>
                </label>

                {{-- Streak --}}
                <label class="flex items-center justify-between p-4 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer group">
                    <div class="flex items-center gap-3">
                        <span class="text-xl">🔥</span>
                        <div>
                            <p class="font-medium text-gray-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">Sequência (Streak)</p>
                            <p class="text-xs text-gray-500 dark:text-gray-400">Marcos de dias seguidos (3, 7, 14, 30 dias)</p>
                        </div>
                    </div>
                    <div class="relative">
                        <input type="checkbox" wire:model.live="notifyStreak" class="sr-only peer">
                        <div class="w-11 h-6 bg-gray-200 dark:bg-gray-700 rounded-full peer peer-checked:bg-amber-500 transition-colors"></div>
                        <div class="absolute left-[2px] top-[2px] w-5 h-5 bg-white rounded-full shadow peer-checked:translate-x-full transition-transform"></div>
                    </div>
                </label>

                {{-- Novos Artigos --}}
                <label class="flex items-center justify-between p-4 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer group">
                    <div class="flex items-center gap-3">
                        <span class="text-xl">📰</span>
                        <div>
                            <p class="font-medium text-gray-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">Novos Artigos</p>
                            <p class="text-xs text-gray-500 dark:text-gray-400">Quando um novo artigo entra em destaque</p>
                        </div>
                    </div>
                    <div class="relative">
                        <input type="checkbox" wire:model.live="notifyNewArticles" class="sr-only peer">
                        <div class="w-11 h-6 bg-gray-200 dark:bg-gray-700 rounded-full peer peer-checked:bg-amber-500 transition-colors"></div>
                        <div class="absolute left-[2px] top-[2px] w-5 h-5 bg-white rounded-full shadow peer-checked:translate-x-full transition-transform"></div>
                    </div>
                </label>

                {{-- Digest Semanal --}}
                <label class="flex items-center justify-between p-4 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer group">
                    <div class="flex items-center gap-3">
                        <span class="text-xl">📊</span>
                        <div>
                            <p class="font-medium text-gray-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">Resumo Semanal</p>
                            <p class="text-xs text-gray-500 dark:text-gray-400">Resumo da sua atividade toda segunda-feira</p>
                        </div>
                    </div>
                    <div class="relative">
                        <input type="checkbox" wire:model.live="notifyWeeklyDigest" class="sr-only peer">
                        <div class="w-11 h-6 bg-gray-200 dark:bg-gray-700 rounded-full peer peer-checked:bg-amber-500 transition-colors"></div>
                        <div class="absolute left-[2px] top-[2px] w-5 h-5 bg-white rounded-full shadow peer-checked:translate-x-full transition-transform"></div>
                    </div>
                </label>
            </div>
        </div>
    </div>

    {{-- ═══ TAB: APARÊNCIA ═══ --}}
    <div x-show="activeTab === 'appearance'" x-transition:enter="transition ease-out duration-300" x-transition:enter-start="opacity-0" x-transition:enter-end="opacity-100" class="space-y-6">
        <div class="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
            <h3 class="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2" style="font-family: 'Cormorant Garamond', serif;">
                🎨 Tema
            </h3>

            <div class="grid grid-cols-3 gap-3">
                @foreach ([
                    'light' => ['label' => 'Claro', 'icon' => '☀️', 'bg' => 'bg-white', 'border' => 'border-gray-200'],
                    'dark' => ['label' => 'Escuro', 'icon' => '🌙', 'bg' => 'bg-gray-800', 'border' => 'border-gray-700'],
                    'auto' => ['label' => 'Automático', 'icon' => '💻', 'bg' => 'bg-gradient-to-r from-white to-gray-800', 'border' => 'border-gray-300'],
                ] as $value => $option)
                    <button
                        wire:click="$set('theme', '{{ $value }}')"
                        class="p-4 rounded-xl border-2 transition-all duration-300 text-center {{ $theme === $value ? 'border-amber-500 shadow-lg shadow-amber-500/20' : 'border-gray-200 dark:border-gray-700 hover:border-amber-300' }}"
                    >
                        <span class="text-2xl block mb-2">{{ $option['icon'] }}</span>
                        <span class="text-sm font-medium {{ $theme === $value ? 'text-amber-600 dark:text-amber-400' : 'text-gray-600 dark:text-gray-400' }}">{{ $option['label'] }}</span>
                    </button>
                @endforeach
            </div>
        </div>

        <div class="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
            <h3 class="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2" style="font-family: 'Cormorant Garamond', serif;">
                🌐 Idioma
            </h3>

            <select wire:model.live="language" class="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all">
                <option value="pt-BR">🇧🇷 Português (Brasil)</option>
                <option value="en">🇺🇸 English</option>
                <option value="es">🇪🇸 Español</option>
            </select>
        </div>
    </div>

    {{-- ═══ TAB: CONTA ═══ --}}
    <div x-show="activeTab === 'account'" x-transition:enter="transition ease-out duration-300" x-transition:enter-start="opacity-0" x-transition:enter-end="opacity-100" class="space-y-6">
        <div class="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
            <h3 class="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2" style="font-family: 'Cormorant Garamond', serif;">
                👤 Informações da Conta
            </h3>

            <div class="space-y-4">
                <div class="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                    <div class="flex items-center gap-3">
                        <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white text-lg font-bold">
                            {{ substr(auth()->user()->name ?? 'U', 0, 1) }}
                        </div>
                        <div>
                            <p class="font-medium text-gray-900 dark:text-white">{{ auth()->user()->name ?? 'Leitor' }}</p>
                            <p class="text-sm text-gray-500 dark:text-gray-400">{{ auth()->user()->email ?? '' }}</p>
                        </div>
                    </div>
                    <a href="/app/edit-profile" class="px-4 py-2 text-sm font-medium text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 rounded-xl hover:bg-amber-100 dark:hover:bg-amber-900/30 transition-colors">
                        Editar →
                    </a>
                </div>

                <div class="grid grid-cols-2 gap-4">
                    <div class="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl text-center">
                        <p class="text-2xl font-bold text-amber-600 dark:text-amber-400">{{ number_format(auth()->user()->total_grains ?? 0) }}</p>
                        <p class="text-xs text-gray-500 dark:text-gray-400">☕ Grãos</p>
                    </div>
                    <div class="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl text-center">
                        <p class="text-2xl font-bold text-amber-600 dark:text-amber-400">{{ auth()->user()->articles_read_count ?? 0 }}</p>
                        <p class="text-xs text-gray-500 dark:text-gray-400">📚 Artigos Lidos</p>
                    </div>
                </div>
            </div>
        </div>

        {{-- Links Úteis --}}
        <div class="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
            <h3 class="font-bold text-gray-900 dark:text-white mb-4" style="font-family: 'Cormorant Garamond', serif;">
                🔗 Links Úteis
            </h3>
            <div class="space-y-2">
                <a href="/app/jornada" class="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors group">
                    <span class="text-sm text-gray-700 dark:text-gray-300 group-hover:text-amber-600 dark:group-hover:text-amber-400">📈 Minha Jornada</span>
                    <svg class="w-4 h-4 text-gray-400 group-hover:text-amber-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
                </a>
                <a href="/app/conquistas" class="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors group">
                    <span class="text-sm text-gray-700 dark:text-gray-300 group-hover:text-amber-600 dark:group-hover:text-amber-400">🏆 Minhas Conquistas</span>
                    <svg class="w-4 h-4 text-gray-400 group-hover:text-amber-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
                </a>
                <a href="/app/biblioteca" class="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors group">
                    <span class="text-sm text-gray-700 dark:text-gray-300 group-hover:text-amber-600 dark:group-hover:text-amber-400">📚 Minha Biblioteca</span>
                    <svg class="w-4 h-4 text-gray-400 group-hover:text-amber-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
                </a>
            </div>
        </div>
    </div>

    {{-- ═══ SAVE BUTTON ═══ --}}
    <div class="flex justify-end sticky bottom-4" x-show="loaded" x-transition:enter="transition ease-out duration-500 delay-400" x-transition:enter-start="opacity-0 translate-y-4" x-transition:enter-end="opacity-100 translate-y-0">
        <button
            @click="saveForm()"
            :disabled="saving"
            class="px-6 py-3 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white font-bold rounded-xl transition-all duration-300 shadow-lg shadow-amber-500/25 hover:shadow-xl hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
            <template x-if="!saving && !saved">
                <span class="flex items-center gap-2">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
                    Salvar Preferências
                </span>
            </template>
            <template x-if="saving">
                <span class="flex items-center gap-2">
                    <svg class="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg>
                    Salvando...
                </span>
            </template>
            <template x-if="saved">
                <span class="flex items-center gap-2">
                    <svg class="w-5 h-5 text-green-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
                    Salvo! ✅
                </span>
            </template>
        </button>
    </div>
</div>

<style>[x-cloak] { display: none !important; }</style>
</x-filament-panels::page>
