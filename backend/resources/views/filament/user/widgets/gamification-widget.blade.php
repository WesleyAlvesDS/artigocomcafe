<div class="space-y-5" x-data="gamificationWidget()" x-init="init()">

    {{-- Header --}}
    <div class="flex items-center justify-between">
        <h3 class="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <span class="text-lg" x-data="{ spin: false }" @mouseenter="spin = true" @mouseleave="spin = false" :class="spin ? 'animate-spin' : ''" style="transition: transform 0.3s">☕</span>
            Sua Jornada
        </h3>
        <span class="text-xs font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-2.5 py-1 rounded-full border border-amber-200 dark:border-amber-800 cursor-pointer hover:scale-105 transition-transform" @click="showToast('Grãos', '{{ $totalGrains }} grãos acumulados')">
            <span x-text="animatedGrains">{{ $totalGrains }}</span> Grãos
        </span>
    </div>

    {{-- Level Card --}}
    <div class="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/10 rounded-xl p-4 border border-amber-200/60 dark:border-amber-800/40 hover:shadow-md transition-shadow duration-300 cursor-pointer" @click="showToast('Nível', 'Nível {{ $level }} — {{ $levelName }}')">
        <div class="flex items-center justify-between mb-3">
            <div class="flex items-center gap-2">
                <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white text-sm font-bold shadow-lg shadow-amber-500/25 transition-transform duration-300 hover:scale-110 hover:rotate-3">
                    {{ $level }}
                </div>
                <div>
                    <p class="text-sm font-bold text-gray-900 dark:text-white">Nível <span x-text="animatedLevel">{{ $level }}</span></p>
                    <p class="text-xs text-amber-600 dark:text-amber-400 font-medium">{{ $levelName }}</p>
                </div>
            </div>
            <span class="text-xs font-bold text-amber-600 dark:text-amber-400"><span x-text="Math.round(animatedLevelProgress)">{{ round($levelProgress) }}</span>%</span>
        </div>
        <div class="w-full bg-amber-200/50 dark:bg-amber-800/30 rounded-full h-2.5 overflow-hidden">
            <div class="bg-gradient-to-r from-amber-500 to-orange-500 h-2.5 rounded-full transition-all duration-1000 ease-out relative overflow-hidden" :style="`width: ${animatedLevelProgress}%`">
                <div class="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer"></div>
            </div>
        </div>
        <p class="text-xs text-amber-700/70 dark:text-amber-300/60 mt-2">Continue lendo para subir de nível</p>
    </div>

    {{-- Streak --}}
    @if ($dailyStreak > 0)
        <div class="flex items-center gap-3 p-3 bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-900/15 dark:to-red-900/10 rounded-xl border border-orange-200/50 dark:border-orange-800/30 cursor-pointer hover:shadow-md transition-all duration-300" @click="showToast('Sequência', '{{ $dailyStreak }} dias seguidos! Mantenha a chama.')">
            <div class="text-2xl" :class="fireFlicker ? 'scale-110' : 'scale-100'" style="transition: transform 0.3s">🔥</div>
            <div>
                <p class="text-sm font-bold text-gray-900 dark:text-white"><span x-text="animatedStreak">{{ $dailyStreak }}</span> dias seguidos</p>
                <p class="text-xs text-gray-500 dark:text-gray-400">Mantenha a chama acesa!</p>
            </div>
        </div>
    @endif

    {{-- Quick Stats --}}
    <div class="grid grid-cols-2 gap-3">
        @foreach ([
            ['key' => 'articlesRead', 'value' => $articlesRead, 'label' => 'Artigos lidos', 'delay' => 100],
            ['key' => 'trailsCompleted', 'value' => $trailsCompleted, 'label' => 'Trilhas', 'delay' => 200],
            ['key' => 'missions', 'value' => $missionsCompleted . '/' . $missionsTotal, 'label' => 'Missões', 'delay' => 300, 'accent' => true],
            ['key' => 'achievements', 'value' => $achievementsUnlocked, 'label' => 'Conquistas', 'delay' => 400],
        ] as $stat)
            <div class="bg-gray-50 dark:bg-white/5 rounded-xl p-3 text-center border border-gray-100 dark:border-gray-700/50 cursor-pointer hover:border-amber-200 dark:hover:border-amber-800/50 hover:shadow-sm transition-all duration-300"
                 x-data="{ shown: false }"
                 x-intersect.once="shown = true"
                 x-show="shown"
                 x-transition:enter="transition ease-out duration-400"
                 x-transition:enter-start="opacity-0 scale-90"
                 x-transition:enter-end="opacity-100 scale-100">
                <p class="text-xl font-bold {{ ($stat['accent'] ?? false) ? 'text-amber-600 dark:text-amber-400' : 'text-gray-900 dark:text-white' }}">{{ $stat['value'] }}</p>
                <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{{ $stat['label'] }}</p>
            </div>
        @endforeach
    </div>

    {{-- Daily Mission --}}
    @if ($activeMission)
        <div class="bg-amber-50 dark:bg-amber-900/15 rounded-xl p-4 border border-amber-200/50 dark:border-amber-800/30 cursor-pointer hover:shadow-md transition-all duration-300" @click="showToast('Missão', '{{ $activeMission['title'] }}')">
            <div class="flex items-center justify-between mb-2">
                <p class="text-xs font-bold text-amber-700 dark:text-amber-300 uppercase tracking-wider">Missão do Dia</p>
                <span class="text-xs font-bold text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/30 px-2 py-0.5 rounded-full">+{{ $activeMission['reward'] }} ☕</span>
            </div>
            <p class="text-sm font-semibold text-gray-900 dark:text-white mb-2">{{ $activeMission['title'] }}</p>
            <div class="w-full bg-amber-200/50 dark:bg-amber-800/30 rounded-full h-1.5 mb-1 overflow-hidden">
                <div class="bg-amber-500 h-1.5 rounded-full transition-all duration-700 ease-out relative overflow-hidden" :style="`width: ${animatedMissionProgress}%`">
                    <div class="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer"></div>
                </div>
            </div>
            <p class="text-xs text-gray-500 dark:text-gray-400">{{ $activeMission['progress'] }} de {{ $activeMission['target'] }} concluído</p>
        </div>
    @endif

    {{-- CTA --}}
    <a href="/app#/jornada" class="block text-center text-sm font-semibold text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 transition-colors">
        Ver jornada completa →
    </a>
</div>

<style>
@keyframes shimmer {
    0% { transform: translateX(-100%); }
    100% { transform: translateX(100%); }
}
.animate-shimmer { animation: shimmer 2s infinite; }
</style>

<script>
function gamificationWidget() {
    return {
        animatedGrains: 0,
        animatedLevel: 0,
        animatedLevelProgress: 0,
        animatedStreak: 0,
        animatedMissionProgress: 0,
        fireFlicker: false,

        init() {
            // Anima contadores
            this.animateValue('animatedGrains', 0, {{ $totalGrains }}, 1500);
            this.animateValue('animatedLevel', 0, {{ $level }}, 1000);
            this.animateCounter('animatedLevelProgress', 0, {{ $levelProgress }}, 1200);
            this.animateValue('animatedStreak', 0, {{ $dailyStreak }}, 800);

            @if ($activeMission)
                this.animateCounter('animatedMissionProgress', 0, {{ $activeMission['percent'] }}, 1000);
            @endif

            // Fire flicker
            setInterval(() => { this.fireFlicker = !this.fireFlicker; }, 2000);
        },

        animateValue(prop, start, end, duration) {
            const startTime = performance.now();
            const update = (currentTime) => {
                const elapsed = currentTime - startTime;
                const progress = Math.min(elapsed / duration, 1);
                const eased = 1 - Math.pow(1 - progress, 3); // easeOutCubic
                this[prop] = Math.floor(start + (end - start) * eased);
                if (progress < 1) requestAnimationFrame(update);
            };
            requestAnimationFrame(update);
        },

        animateCounter(prop, start, end, duration) {
            const startTime = performance.now();
            const update = (currentTime) => {
                const elapsed = currentTime - startTime;
                const progress = Math.min(elapsed / duration, 1);
                const eased = 1 - Math.pow(1 - progress, 3);
                this[prop] = start + (end - start) * eased;
                if (progress < 1) requestAnimationFrame(update);
            };
            requestAnimationFrame(update);
        },

        showToast(title, message) {
            window.dispatchEvent(new CustomEvent('cafe:toast', { detail: { icon: '☕', title, message } }));
        }
    };
}
</script>
