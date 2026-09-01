<x-filament-panels::page>
<div
    x-data="{
        loaded: false,
        activeTab: 'daily',
        showToast: false,
        toastMessage: '',
        toastIcon: '',
        init() {
            setTimeout(() => this.loaded = true, 100);
        },
        showNotification(icon, message) {
            this.toastIcon = icon;
            this.toastMessage = message;
            this.showToast = true;
            setTimeout(() => this.showToast = false, 3000);
        }
    }"
    x-cloak
    class="space-y-6"
>

    {{-- ═══ HEADER ═══ --}}
    <div x-show="loaded" x-transition.opacity.duration.500ms class="text-center mb-8">
        <h1 class="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white" style="font-family: 'Cormorant Garamond', serif;">
            🎯 Missões
        </h1>
        <p class="text-gray-600 dark:text-gray-400 mt-2">Complete missões e ganhe grãos extras</p>
    </div>

    {{-- ═══ STATS ═══ --}}
    <div class="grid grid-cols-2 gap-4" x-show="loaded" x-transition:enter="transition ease-out duration-500 delay-100" x-transition:enter-start="opacity-0 translate-y-4" x-transition:enter-end="opacity-100 translate-y-0">
        <div class="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/10 p-5 rounded-2xl border border-amber-200/50 dark:border-amber-800/30 text-center">
            <div class="text-3xl mb-2">☀️</div>
            <p class="text-2xl font-bold text-amber-700 dark:text-amber-400">{{ $dailyCompleted }}/{{ $dailyTotal }}</p>
            <p class="text-xs text-amber-600/70 dark:text-amber-400/70 font-medium mt-1">Missões Diárias</p>
        </div>
        <div class="bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/10 p-5 rounded-2xl border border-purple-200/50 dark:border-purple-800/30 text-center">
            <div class="text-3xl mb-2">📅</div>
            <p class="text-2xl font-bold text-purple-700 dark:text-purple-400">{{ $weeklyCompleted }}/{{ $weeklyTotal }}</p>
            <p class="text-xs text-purple-600/70 dark:text-purple-400/70 font-medium mt-1">Missões Semanais</p>
        </div>
    </div>

    {{-- ═══ TABS ═══ --}}
    <div class="flex gap-2" x-show="loaded" x-transition:enter="transition ease-out duration-500 delay-200" x-transition:enter-start="opacity-0" x-transition:enter-end="opacity-100">
        <button
            @click="activeTab = 'daily'"
            :class="activeTab === 'daily'
                ? 'bg-amber-600 text-white shadow-lg shadow-amber-500/25'
                : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'"
            class="flex-1 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 border border-gray-200 dark:border-gray-700"
        >
            ☀️ Diárias
        </button>
        <button
            @click="activeTab = 'weekly'"
            :class="activeTab === 'weekly'
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/25'
                : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'"
            class="flex-1 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 border border-gray-200 dark:border-gray-700"
        >
            📅 Semanais
        </button>
    </div>

    {{-- ═══ DAILY MISSIONS ═══ --}}
    <div x-show="activeTab === 'daily'" x-transition:enter="transition ease-out duration-300" x-transition:enter-start="opacity-0" x-transition:enter-end="opacity-100" class="space-y-4">
        @forelse ($dailyMissions as $mission)
            <div
                class="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-0.5 {{ $mission['is_completed'] ? 'ring-2 ring-green-400/50 dark:ring-green-500/30' : '' }}"
                x-data="{ progress: {{ $mission['progress'] }}, target: {{ $mission['target'] }}, completed: {{ $mission['is_completed'] ? 'true' : 'false' }}, percent: {{ $mission['target'] > 0 ? round(($mission['progress'] / $mission['target']) * 100) : 0 }} }"
                x-show="loaded"
                x-transition:enter="transition ease-out duration-400"
                x-transition:enter-start="opacity-0 translate-y-3"
                x-transition:enter-end="opacity-100 translate-y-0"
                style="transition-delay: {{ $loop->index * 80 }}ms"
            >
                <div class="flex items-start gap-4">
                    <div class="w-12 h-12 rounded-xl {{ $mission['is_completed'] ? 'bg-green-100 dark:bg-green-900/30' : 'bg-amber-100 dark:bg-amber-900/30' }} flex items-center justify-center text-2xl flex-shrink-0 transition-all duration-300">
                        @if ($mission['is_completed'])
                            ✅
                        @else
                            {{ $mission['icon'] }}
                        @endif
                    </div>
                    <div class="flex-1 min-w-0">
                        <div class="flex items-center justify-between mb-1">
                            <h3 class="font-bold text-gray-900 dark:text-white {{ $mission['is_completed'] ? 'line-through opacity-70' : '' }}">{{ $mission['title'] }}</h3>
                            <span class="text-xs font-bold bg-gradient-to-r from-amber-500 to-amber-600 text-white px-2.5 py-1 rounded-full shadow-sm">+{{ $mission['reward'] }} ☕</span>
                        </div>
                        @if ($mission['description'])
                            <p class="text-sm text-gray-500 dark:text-gray-400 mb-3">{{ $mission['description'] }}</p>
                        @endif
                        <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 mb-2 overflow-hidden">
                            <div
                                class="h-2.5 rounded-full transition-all duration-700 ease-out {{ $mission['is_completed'] ? 'bg-gradient-to-r from-green-400 to-green-500' : 'bg-gradient-to-r from-amber-400 to-amber-600' }}"
                                x-data="{ w: 0 }"
                                x-init="setTimeout(() => w = {{ $mission['target'] > 0 ? round(($mission['progress'] / $mission['target']) * 100) : 0 }}, {{ $loop->index * 100 + 200 }})"
                                :style="`width: ${w}%`"
                            ></div>
                        </div>
                        <div class="flex items-center justify-between text-xs">
                            <span class="text-gray-500 dark:text-gray-400">{{ $mission['progress'] }}/{{ $mission['target'] }}</span>
                            @if ($mission['is_completed'])
                                <span class="text-green-600 dark:text-green-400 font-bold flex items-center gap-1">
                                    <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
                                    Concluída!
                                </span>
                            @else
                                <span class="text-amber-600 dark:text-amber-400 font-medium">{{ round(($mission['progress'] / max(1, $mission['target'])) * 100) }}%</span>
                            @endif
                        </div>
                    </div>
                </div>
            </div>
        @empty
            <div class="text-center py-12 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700">
                <div class="text-5xl mb-4">☀️</div>
                <p class="text-gray-500 dark:text-gray-400 font-medium">Nenhuma missão disponível hoje</p>
                <p class="text-sm text-gray-400 dark:text-gray-500 mt-1">Volte amanhã para novas missões!</p>
            </div>
        @endforelse
    </div>

    {{-- ═══ WEEKLY MISSIONS ═══ --}}
    <div x-show="activeTab === 'weekly'" x-transition:enter="transition ease-out duration-300" x-transition:enter-start="opacity-0" x-transition:enter-end="opacity-100" class="space-y-4">
        @forelse ($weeklyMissions as $mission)
            <div
                class="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-0.5 {{ $mission['is_completed'] ? 'ring-2 ring-green-400/50 dark:ring-green-500/30' : '' }}"
                x-data="{ progress: {{ $mission['progress'] }}, target: {{ $mission['target'] }}, completed: {{ $mission['is_completed'] ? 'true' : 'false' }} }"
                x-show="loaded"
                x-transition:enter="transition ease-out duration-400"
                x-transition:enter-start="opacity-0 translate-y-3"
                x-transition:enter-end="opacity-100 translate-y-0"
                style="transition-delay: {{ $loop->index * 80 }}ms"
            >
                <div class="flex items-start gap-4">
                    <div class="w-12 h-12 rounded-xl {{ $mission['is_completed'] ? 'bg-green-100 dark:bg-green-900/30' : 'bg-purple-100 dark:bg-purple-900/30' }} flex items-center justify-center text-2xl flex-shrink-0">
                        @if ($mission['is_completed'])
                            ✅
                        @else
                            {{ $mission['icon'] }}
                        @endif
                    </div>
                    <div class="flex-1 min-w-0">
                        <div class="flex items-center justify-between mb-1">
                            <h3 class="font-bold text-gray-900 dark:text-white {{ $mission['is_completed'] ? 'line-through opacity-70' : '' }}">{{ $mission['title'] }}</h3>
                            <span class="text-xs font-bold bg-gradient-to-r from-purple-500 to-purple-600 text-white px-2.5 py-1 rounded-full shadow-sm">+{{ $mission['reward'] }} ☕</span>
                        </div>
                        @if ($mission['description'])
                            <p class="text-sm text-gray-500 dark:text-gray-400 mb-3">{{ $mission['description'] }}</p>
                        @endif
                        <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 mb-2 overflow-hidden">
                            <div
                                class="h-2.5 rounded-full transition-all duration-700 ease-out {{ $mission['is_completed'] ? 'bg-gradient-to-r from-green-400 to-green-500' : 'bg-gradient-to-r from-purple-400 to-purple-600' }}"
                                x-data="{ w: 0 }"
                                x-init="setTimeout(() => w = {{ $mission['target'] > 0 ? round(($mission['progress'] / $mission['target']) * 100) : 0 }}, {{ $loop->index * 100 + 200 }})"
                                :style="`width: ${w}%`"
                            ></div>
                        </div>
                        <div class="flex items-center justify-between text-xs">
                            <span class="text-gray-500 dark:text-gray-400">{{ $mission['progress'] }}/{{ $mission['target'] }}</span>
                            @if ($mission['is_completed'])
                                <span class="text-green-600 dark:text-green-400 font-bold">✅ Concluída!</span>
                            @else
                                <span class="text-purple-600 dark:text-purple-400 font-medium">{{ round(($mission['progress'] / max(1, $mission['target'])) * 100) }}%</span>
                            @endif
                        </div>
                    </div>
                </div>
            </div>
        @empty
            <div class="text-center py-12 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700">
                <div class="text-5xl mb-4">📅</div>
                <p class="text-gray-500 dark:text-gray-400 font-medium">Nenhuma missão semanal disponível</p>
                <p class="text-sm text-gray-400 dark:text-gray-500 mt-1">Novas missões semanais toda segunda-feira!</p>
            </div>
        @endforelse
    </div>

    {{-- ═══ TOAST ═══ --}}
    <div x-show="showToast" x-transition:enter="transition ease-out duration-300" x-transition:enter-start="opacity-0 translate-y-2" x-transition:enter-end="opacity-100 translate-y-0" x-transition:leave="transition ease-in duration-200" x-transition:leave-start="opacity-100" x-transition:leave-end="opacity-0 translate-y-2" class="fixed bottom-6 right-6 z-50 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-4 flex items-center gap-3">
        <span class="text-2xl" x-text="toastIcon"></span>
        <p class="text-sm font-medium text-gray-900 dark:text-white" x-text="toastMessage"></p>
    </div>
</div>

<style>[x-cloak] { display: none !important; }</style>
</x-filament-panels::page>
