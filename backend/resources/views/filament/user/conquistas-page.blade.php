{{-- ═══════════════════════════════════════════════════════════════
     CONQUISTAS — Super App Artigo com Café
     Badges + Milestones + Animações de Desbloqueio
     ═══════════════════════════════════════════════════════════════ --}}

<x-filament-panels::page>
<div
    x-data="{
        loaded: false,
        activeTab: 'all',
        showUnlockModal: false,
        selectedAchievement: null,
        animatedPercent: 0,
        animatedUnlocked: 0,
        init() {
            setTimeout(() => this.loaded = true, 100);
            this.animateCounters();
        },
        animateCounters() {
            const duration = 1200;
            const steps = 40;
            const interval = duration / steps;
            let step = 0;
            const timer = setInterval(() => {
                step++;
                const progress = step / steps;
                const ease = 1 - Math.pow(1 - progress, 3);
                this.animatedPercent = Math.round({{ $completionPercent }} * ease);
                this.animatedUnlocked = Math.round({{ $totalUnlocked }} * ease);
                if (step >= steps) clearInterval(timer);
            }, interval);
        },
        openAchievement(achievement) {
            this.selectedAchievement = achievement;
            this.showUnlockModal = true;
        },
        getRarityColor(rarity) {
            const colors = {
                common: 'from-gray-400 to-gray-500',
                uncommon: 'from-green-400 to-emerald-500',
                rare: 'from-blue-400 to-indigo-500',
                epic: 'from-purple-400 to-violet-500',
                legendary: 'from-amber-400 to-orange-500',
            };
            return colors[rarity] || colors.common;
        },
        getRarityLabel(rarity) {
            const labels = {
                common: 'Comum',
                uncommon: 'Incomum',
                rare: 'Raro',
                epic: 'Épico',
                legendary: 'Lendário',
            };
            return labels[rarity] || 'Comum';
        },
        getRarityBg(rarity) {
            const bgs = {
                common: 'bg-gray-100 dark:bg-gray-700',
                uncommon: 'bg-green-50 dark:bg-green-900/20',
                rare: 'bg-blue-50 dark:bg-blue-900/20',
                epic: 'bg-purple-50 dark:bg-purple-900/20',
                legendary: 'bg-amber-50 dark:bg-amber-900/20',
            };
            return bgs[rarity] || bgs.common;
        }
    }"
    x-cloak
    class="space-y-6"
>

    {{-- ═══ HEADER ═══ --}}
    <div x-show="loaded" x-transition.opacity.duration.500ms class="text-center mb-8">
        <div class="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl shadow-lg shadow-amber-500/30 mb-4" x-data="{ bounce: false }" x-init="setTimeout(() => bounce = true, 300)" :class="bounce ? 'scale-110 rotate-3' : 'scale-100'" style="transition: transform 0.5s">
            <span class="text-4xl">🏆</span>
        </div>
        <h1 class="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white" style="font-family: 'Cormorant Garamond', serif;">
            Minhas Conquistas
        </h1>
        <p class="text-gray-600 dark:text-gray-400 mt-2">Desbloqueie badges completando desafios</p>
    </div>

    {{-- ═══ PROGRESS OVERVIEW ═══ --}}
    <div class="bg-gradient-to-br from-amber-50 via-orange-50 to-amber-50 dark:from-amber-900/20 dark:via-orange-900/10 dark:to-amber-900/20 p-6 rounded-2xl border border-amber-200/50 dark:border-amber-800/30" x-show="loaded" x-transition:enter="transition ease-out duration-500 delay-100" x-transition:enter-start="opacity-0 translate-y-4" x-transition:enter-end="opacity-100 translate-y-0">
        <div class="flex items-center justify-between mb-4">
            <div>
                <h3 class="text-lg font-bold text-gray-900 dark:text-white" style="font-family: 'Cormorant Garamond', serif;">Progresso Geral</h3>
                <p class="text-sm text-gray-500 dark:text-gray-400">{{ $totalUnlocked }} de {{ $totalAvailable }} conquistas desbloqueadas</p>
            </div>
            <div class="text-right">
                <p class="text-3xl font-bold text-amber-600 dark:text-amber-400" x-text="animatedPercent + '%'">0%</p>
            </div>
        </div>

        {{-- Progress Bar --}}
        <div class="w-full bg-amber-200/50 dark:bg-amber-800/30 rounded-full h-4 overflow-hidden">
            <div
                class="h-4 rounded-full bg-gradient-to-r from-amber-400 via-amber-500 to-orange-500 transition-all duration-1000 ease-out relative overflow-hidden"
                x-data="{ w: 0 }"
                x-init="setTimeout(() => w = {{ $completionPercent }}, 300)"
                :style="`width: ${w}%`"
            >
                <div class="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-[shimmer_2s_ease-in-out_infinite]"></div>
            </div>
        </div>

        {{-- Stats --}}
        <div class="grid grid-cols-3 gap-4 mt-4">
            <div class="text-center">
                <p class="text-2xl font-bold text-amber-700 dark:text-amber-400" x-text="animatedUnlocked">0</p>
                <p class="text-xs text-amber-600/70 dark:text-amber-400/70">Desbloqueadas</p>
            </div>
            <div class="text-center">
                <p class="text-2xl font-bold text-gray-500 dark:text-gray-400">{{ $totalAvailable - $totalUnlocked }}</p>
                <p class="text-xs text-gray-400 dark:text-gray-500">Restantes</p>
            </div>
            <div class="text-center">
                <p class="text-2xl font-bold text-amber-600 dark:text-amber-400">{{ collect($unlockedAchievements)->sum('grain_reward') }}</p>
                <p class="text-xs text-amber-600/70 dark:text-amber-400/70">☕ Grãos ganhos</p>
            </div>
        </div>
    </div>

    {{-- ═══ TABS ═══ --}}
    <div class="flex gap-2 overflow-x-auto no-scrollbar" x-show="loaded" x-transition:enter="transition ease-out duration-500 delay-200" x-transition:enter-start="opacity-0" x-transition:enter-end="opacity-100">
        @foreach ([
            'all' => '🏆 Todas (' . $totalAvailable . ')',
            'unlocked' => '✅ Desbloqueadas (' . $totalUnlocked . ')',
            'locked' => '🔒 Bloqueadas (' . ($totalAvailable - $totalUnlocked) . ')',
            'milestones' => '🎯 Marcos',
        ] as $key => $label)
            <button
                @click="activeTab = '{{ $key }}'"
                :class="activeTab === '{{ $key }}'
                    ? 'bg-amber-600 text-white shadow-lg shadow-amber-500/25'
                    : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'"
                class="flex-shrink-0 px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all duration-300 border border-gray-200 dark:border-gray-700"
            >
                {{ $label }}
            </button>
        @endforeach
    </div>

    {{-- ═══ ALL ACHIEVEMENTS ═══ --}}
    <div x-show="activeTab === 'all' || activeTab === 'unlocked' || activeTab === 'locked'" x-transition:enter="transition ease-out duration-300" x-transition:enter-start="opacity-0" x-transition:enter-end="opacity-100">
        <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            @forelse ($allAchievements as $achievement)
                @php
                    $shouldShow = $activeTab === 'all'
                        || ($activeTab === 'unlocked' && $achievement['is_unlocked'])
                        || ($activeTab === 'locked' && ! $achievement['is_unlocked']);
                @endphp
                <div
                    class="relative bg-white dark:bg-gray-800 p-5 rounded-2xl border transition-all duration-300 cursor-pointer group
                        {{ $achievement['is_unlocked']
                            ? 'border-amber-200/50 dark:border-amber-800/30 hover:shadow-lg hover:shadow-amber-500/10 hover:-translate-y-1'
                            : 'border-gray-200 dark:border-gray-700 opacity-60 grayscale hover:grayscale-0 hover:opacity-80' }}"
                    x-show="loaded"
                    x-transition:enter="transition ease-out duration-400"
                    x-transition:enter-start="opacity-0 scale-90"
                    x-transition:enter-end="opacity-100 scale-100"
                    style="transition-delay: {{ $loop->index * 50 }}ms"
                    @click="openAchievement(@js($achievement))"
                >
                    {{-- Rarity indicator --}}
                    <div class="absolute top-2 right-2">
                        <span class="text-[10px] font-bold px-1.5 py-0.5 rounded-full text-white bg-gradient-to-r {{ $achievement['is_unlocked'] ? 'from-amber-400 to-amber-500' : 'from-gray-400 to-gray-500' }}">
                            {{ $achievement['rarity'] }}
                        </span>
                    </div>

                    {{-- Icon --}}
                    <div class="text-center mb-3">
                        <div class="w-16 h-16 mx-auto rounded-2xl flex items-center justify-center text-3xl transition-all duration-300 group-hover:scale-110 group-hover:rotate-3
                            {{ $achievement['is_unlocked']
                                ? 'bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900/30 dark:to-orange-900/30'
                                : 'bg-gray-100 dark:bg-gray-700' }}">
                            {{ $achievement['icon'] }}
                        </div>
                    </div>

                    {{-- Info --}}
                    <div class="text-center">
                        <h4 class="font-bold text-sm text-gray-900 dark:text-white {{ $achievement['is_unlocked'] ? '' : 'text-gray-500 dark:text-gray-400' }}">
                            {{ $achievement['name'] }}
                        </h4>
                        <p class="text-xs text-gray-400 dark:text-gray-500 mt-1 line-clamp-2">
                            {{ $achievement['description'] }}
                        </p>
                    </div>

                    {{-- Reward --}}
                    @if ($achievement['grain_reward'] > 0)
                        <div class="mt-3 text-center">
                            <span class="inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full
                                {{ $achievement['is_unlocked']
                                    ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'
                                    : 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500' }}">
                                +{{ $achievement['grain_reward'] }} ☕
                            </span>
                        </div>
                    @endif

                    {{-- Unlocked badge --}}
                    @if ($achievement['is_unlocked'])
                        <div class="absolute -top-2 -left-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center shadow-lg shadow-green-500/30">
                            <svg class="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"/></svg>
                        </div>
                    @endif

                    {{-- Glow effect for unlocked --}}
                    @if ($achievement['is_unlocked'])
                        <div class="absolute inset-0 rounded-2xl bg-gradient-to-br from-amber-400/5 to-orange-400/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                    @endif
                </div>
            @empty
                <div class="col-span-full text-center py-16">
                    <div class="text-6xl mb-4">🏆</div>
                    <p class="text-gray-500 dark:text-gray-400 text-lg font-medium">Nenhuma conquista disponível</p>
                </div>
            @endforelse
        </div>
    </div>

    {{-- ═══ MILESTONES ═══ --}}
    <div x-show="activeTab === 'milestones'" x-transition:enter="transition ease-out duration-300" x-transition:enter-start="opacity-0" x-transition:enter-end="opacity-100" class="space-y-4">
        @forelse ($milestones as $idx => $milestone)
            <div
                class="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-0.5 {{ $milestone['completed'] ? 'ring-2 ring-green-400/50 dark:ring-green-500/30' : '' }}"
                x-show="loaded"
                x-transition:enter="transition ease-out duration-400"
                x-transition:enter-start="opacity-0 translate-y-3"
                x-transition:enter-end="opacity-100 translate-y-0"
                style="transition-delay: {{ $idx * 80 }}ms"
            >
                <div class="flex items-start gap-4">
                    <div class="w-14 h-14 rounded-xl flex items-center justify-center text-2xl flex-shrink-0 transition-all duration-300
                        {{ $milestone['completed']
                            ? 'bg-green-100 dark:bg-green-900/30 group-hover:scale-110'
                            : 'bg-gray-100 dark:bg-gray-700' }}">
                        {{ $milestone['completed'] ? '✅' : $milestone['icon'] }}
                    </div>
                    <div class="flex-1 min-w-0">
                        <div class="flex items-center justify-between mb-1">
                            <h3 class="font-bold text-gray-900 dark:text-white {{ $milestone['completed'] ? 'line-through opacity-70' : '' }}">
                                {{ $milestone['title'] }}
                            </h3>
                            <span class="text-xs font-bold {{ $milestone['completed'] ? 'text-green-600 dark:text-green-400' : 'text-gray-400 dark:text-gray-500' }}">
                                {{ min($milestone['current'], $milestone['target']) }}/{{ $milestone['target'] }}
                            </span>
                        </div>
                        <p class="text-sm text-gray-500 dark:text-gray-400 mb-3">{{ $milestone['description'] }}</p>

                        <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 overflow-hidden">
                            <div
                                class="h-2.5 rounded-full transition-all duration-1000 ease-out
                                    {{ $milestone['completed'] ? 'bg-gradient-to-r from-green-400 to-green-500' : 'bg-gradient-to-r from-amber-400 to-amber-600' }}"
                                x-data="{ w: 0 }"
                                x-init="setTimeout(() => w = {{ min(100, ($milestone['current'] / max(1, $milestone['target'])) * 100) }}, {{ $idx * 100 + 200 }})"
                                :style="`width: ${w}%`"
                            ></div>
                        </div>

                        <div class="flex items-center justify-between mt-2 text-xs">
                            <span class="text-gray-400 dark:text-gray-500">
                                {{ $milestone['current'] }}/{{ $milestone['target'] }} {{ $milestone['current'] >= $milestone['target'] ? '✓' : '' }}
                            </span>
                            @if ($milestone['completed'])
                                <span class="text-green-600 dark:text-green-400 font-bold">🎉 Completo!</span>
                            @else
                                <span class="text-amber-600 dark:text-amber-400 font-medium">
                                    {{ $milestone['target'] - $milestone['current'] }} restantes
                                </span>
                            @endif
                        </div>
                    </div>
                </div>
            </div>
        @empty
            <div class="text-center py-16 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700">
                <div class="text-6xl mb-4">🎯</div>
                <p class="text-gray-500 dark:text-gray-400 font-medium">Nenhum marco disponível</p>
            </div>
        @endforelse
    </div>

    {{-- ═══ ACHIEVEMENT DETAIL MODAL ═══ --}}
    <div x-show="showUnlockModal" x-transition:enter="transition ease-out duration-300" x-transition:enter-start="opacity-0" x-transition:enter-end="opacity-100" x-transition:leave="transition ease-in duration-200" x-transition:leave-start="opacity-100" x-transition:leave-end="opacity-0" class="fixed inset-0 z-50 flex items-center justify-center p-4" @keydown.escape.window="showUnlockModal = false">
        <div class="absolute inset-0 bg-black/50 backdrop-blur-sm" @click="showUnlockModal = false"></div>
        <div class="relative w-full max-w-md bg-white dark:bg-gray-800 rounded-3xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden" x-transition:enter="transition ease-out duration-300" x-transition:enter-start="opacity-0 scale-90" x-transition:enter-end="opacity-100 scale-100" @click.stop>

            {{-- Header --}}
            <div class="relative p-8 text-center" :class="selectedAchievement?.is_unlocked ? 'bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/10' : 'bg-gray-50 dark:bg-gray-700/50'">
                <button @click="showUnlockModal = false" class="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-white/80 dark:bg-gray-800/80 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
                </button>

                <div class="w-24 h-24 mx-auto rounded-2xl flex items-center justify-center text-5xl mb-4 transition-all duration-500
                    {{ $achievement['is_unlocked'] ?? false ? 'bg-gradient-to-br from-amber-200 to-orange-200 dark:from-amber-800/30 dark:to-orange-800/30 shadow-lg shadow-amber-500/20' : 'bg-gray-200 dark:bg-gray-600' }}"
                    x-data="{ show: false }"
                    x-init="setTimeout(() => show = true, 100)"
                    x-show="show"
                    x-transition:enter="transition ease-out duration-500"
                    x-transition:enter-start="opacity-0 scale-50 rotate-180"
                    x-transition:enter-end="opacity-100 scale-100 rotate-0">
                    <span x-text="selectedAchievement?.icon">🏆</span>
                </div>

                <span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold text-white bg-gradient-to-r"
                    :class="getRarityColor(selectedAchievement?.rarity)">
                    <span x-text="getRarityLabel(selectedAchievement?.rarity)"></span>
                </span>
            </div>

            {{-- Content --}}
            <div class="p-6 text-center space-y-4">
                <h3 class="text-xl font-bold text-gray-900 dark:text-white" x-text="selectedAchievement?.name" style="font-family: 'Cormorant Garamond', serif;"></h3>
                <p class="text-gray-500 dark:text-gray-400" x-text="selectedAchievement?.description"></p>

                <div class="inline-flex items-center gap-2 px-4 py-2 bg-amber-50 dark:bg-amber-900/20 rounded-full" x-show="selectedAchievement?.grain_reward > 0">
                    <span class="text-lg">☕</span>
                    <span class="font-bold text-amber-700 dark:text-amber-400">+<span x-text="selectedAchievement?.grain_reward"></span> Grãos</span>
                </div>

                <div class="pt-4 border-t border-gray-100 dark:border-gray-700">
                    <template x-if="selectedAchievement?.is_unlocked">
                        <div class="space-y-2">
                            <div class="flex items-center justify-center gap-2 text-green-600 dark:text-green-400">
                                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
                                <span class="font-bold">Desbloqueada!</span>
                            </div>
                            <p class="text-xs text-gray-400 dark:text-gray-500">Conquistada em <span x-text="selectedAchievement?.earned_at"></span></p>
                        </div>
                    </template>
                    <template x-if="!selectedAchievement?.is_unlocked">
                        <div class="space-y-2">
                            <div class="flex items-center justify-center gap-2 text-gray-400 dark:text-gray-500">
                                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>
                                <span class="font-medium">Bloqueada</span>
                            </div>
                            <p class="text-xs text-gray-400 dark:text-gray-500">Continue lendo para desbloquear</p>
                        </div>
                    </template>
                </div>
            </div>
        </div>
    </div>
</div>

<style>
[x-cloak] { display: none !important; }
@keyframes shimmer {
    0%, 100% { transform: translateX(-100%); }
    50% { transform: translateX(100%); }
}
</style>
</x-filament-panels::page>
