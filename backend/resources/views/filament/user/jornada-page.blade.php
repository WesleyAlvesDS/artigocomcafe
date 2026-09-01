<x-filament-panels::page>
<div
    x-data="{
        loaded: false,
        activeTab: 'overview',
        animatedGrains: 0,
        animatedArticles: 0,
        animatedHours: 0,
        animatedStreak: 0,
        init() {
            setTimeout(() => this.loaded = true, 100);
            this.animateCounters();
        },
        animateCounters() {
            const targets = {
                grains: {{ $evolution['total_grains'] ?? 0 }},
                articles: {{ $evolution['articles_read'] ?? 0 }},
                hours: {{ $evolution['reading_time_hours'] ?? 0 }},
                streak: {{ $evolution['daily_streak'] ?? 0 }}
            };
            const duration = 1200;
            const steps = 60;
            const interval = duration / steps;
            let step = 0;
            const timer = setInterval(() => {
                step++;
                const progress = step / steps;
                const ease = 1 - Math.pow(1 - progress, 3);
                this.animatedGrains = Math.round(targets.grains * ease);
                this.animatedArticles = Math.round(targets.articles * ease);
                this.animatedHours = Math.round(targets.hours * ease);
                this.animatedStreak = Math.round(targets.streak * ease);
                if (step >= steps) clearInterval(timer);
            }, interval);
        }
    }"
    x-cloak
    class="space-y-6"
>

    {{-- ═══ HEADER ═══ --}}
    <div x-show="loaded" x-transition.opacity.duration.500ms class="text-center mb-8">
        <h1 class="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white" style="font-family: 'Cormorant Garamond', serif;">
            📈 Minha Jornada
        </h1>
        <p class="text-gray-600 dark:text-gray-400 mt-2">Acompanhe sua evolução como leitor</p>
    </div>

    {{-- ═══ STATS CARDS ═══ --}}
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4" x-show="loaded" x-transition:enter="transition ease-out duration-500 delay-100" x-transition:enter-start="opacity-0 translate-y-4" x-transition:enter-end="opacity-100 translate-y-0">
        {{-- Grãos --}}
        <div class="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/10 p-5 rounded-2xl border border-amber-200/50 dark:border-amber-800/30 text-center hover:shadow-lg hover:shadow-amber-500/10 transition-all duration-300 hover:-translate-y-0.5">
            <div class="text-3xl mb-2">☕</div>
            <p class="text-2xl md:text-3xl font-bold text-amber-700 dark:text-amber-400" x-text="animatedGrains.toLocaleString()">0</p>
            <p class="text-xs text-amber-600/70 dark:text-amber-400/70 font-medium mt-1">Grãos</p>
        </div>

        {{-- Artigos Lidos --}}
        <div class="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/10 p-5 rounded-2xl border border-blue-200/50 dark:border-blue-800/30 text-center hover:shadow-lg hover:shadow-blue-500/10 transition-all duration-300 hover:-translate-y-0.5">
            <div class="text-3xl mb-2">📚</div>
            <p class="text-2xl md:text-3xl font-bold text-blue-700 dark:text-blue-400" x-text="animatedArticles">0</p>
            <p class="text-xs text-blue-600/70 dark:text-blue-400/70 font-medium mt-1">Artigos Lidos</p>
        </div>

        {{-- Horas de Leitura --}}
        <div class="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/10 p-5 rounded-2xl border border-purple-200/50 dark:border-purple-800/30 text-center hover:shadow-lg hover:shadow-purple-500/10 transition-all duration-300 hover:-translate-y-0.5">
            <div class="text-3xl mb-2">⏱️</div>
            <p class="text-2xl md:text-3xl font-bold text-purple-700 dark:text-purple-400" x-text="animatedHours">0</p>
            <p class="text-xs text-purple-600/70 dark:text-purple-400/70 font-medium mt-1">Horas</p>
        </div>

        {{-- Streak --}}
        <div class="bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/10 p-5 rounded-2xl border border-red-200/50 dark:border-red-800/30 text-center hover:shadow-lg hover:shadow-red-500/10 transition-all duration-300 hover:-translate-y-0.5">
            <div class="text-3xl mb-2" x-data="{ flicker: true }" x-init="setInterval(() => flicker = !flicker, 1500)" :class="flicker ? 'scale-110' : 'scale-100'" style="transition: transform 0.3s">🔥</div>
            <p class="text-2xl md:text-3xl font-bold text-red-700 dark:text-red-400" x-text="animatedStreak">0</p>
            <p class="text-xs text-red-600/70 dark:text-red-400/70 font-medium mt-1">Dias Seguidos</p>
        </div>
    </div>

    {{-- ═══ TABS ═══ --}}
    <div class="flex gap-2 overflow-x-auto no-scrollbar" x-show="loaded" x-transition:enter="transition ease-out duration-500 delay-200" x-transition:enter-start="opacity-0" x-transition:enter-end="opacity-100">
        @foreach (['overview' => '📊 Visão Geral', 'activity' => '📅 Atividade', 'categories' => '📂 Categorias'] as $key => $label)
            <button
                @click="activeTab = '{{ $key }}'"
                :class="activeTab === '{{ $key }}'
                    ? 'bg-amber-600 text-white shadow-lg shadow-amber-500/25'
                    : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'"
                class="px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all duration-300 border border-gray-200 dark:border-gray-700"
            >
                {{ $label }}
            </button>
        @endforeach
    </div>

    {{-- ═══ TAB: VISÃO GERAL ═══ --}}
    <div x-show="activeTab === 'overview'" x-transition:enter="transition ease-out duration-300" x-transition:enter-start="opacity-0" x-transition:enter-end="opacity-100" class="space-y-6">

        {{-- Conquistas --}}
        <div class="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm" x-show="loaded" x-transition:enter="transition ease-out duration-500 delay-300" x-transition:enter-start="opacity-0 translate-y-4" x-transition:enter-end="opacity-100 translate-y-0">
            <h3 class="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2" style="font-family: 'Cormorant Garamond', serif;">
                🏆 Conquistas Desbloqueadas
            </h3>
            <div class="grid grid-cols-3 md:grid-cols-6 gap-4">
                @foreach ([
                    ['icon' => '📖', 'label' => 'Primeiro Artigo', 'unlocked' => ($evolution['articles_read'] ?? 0) >= 1],
                    ['icon' => '🔥', 'label' => '3 Dias Seguidos', 'unlocked' => ($evolution['daily_streak'] ?? 0) >= 3],
                    ['icon' => '📚', 'label' => '10 Artigos', 'unlocked' => ($evolution['articles_read'] ?? 0) >= 10],
                    ['icon' => '☕', 'label' => '500 Grãos', 'unlocked' => ($evolution['total_grains'] ?? 0) >= 500],
                    ['icon' => '🎓', 'label' => 'Primeira Trilha', 'unlocked' => ($evolution['trails_completed'] ?? 0) >= 1],
                    ['icon' => '⭐', 'label' => '50 Artigos', 'unlocked' => ($evolution['articles_read'] ?? 0) >= 50],
                ] as $badge)
                    <div class="text-center p-3 rounded-xl transition-all duration-300 {{ $badge['unlocked'] ? 'bg-amber-50 dark:bg-amber-900/20 hover:scale-105' : 'bg-gray-100 dark:bg-gray-700/50 opacity-50 grayscale' }}">
                        <div class="text-2xl mb-1 {{ $badge['unlocked'] ? '' : 'grayscale' }}">{{ $badge['icon'] }}</div>
                        <p class="text-xs font-medium {{ $badge['unlocked'] ? 'text-amber-700 dark:text-amber-400' : 'text-gray-400 dark:text-gray-500' }}">{{ $badge['label'] }}</p>
                    </div>
                @endforeach
            </div>
        </div>

        {{-- Atividade Semanal --}}
        <div class="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm" x-show="loaded" x-transition:enter="transition ease-out duration-500 delay-400" x-transition:enter-start="opacity-0 translate-y-4" x-transition:enter-end="opacity-100 translate-y-0">
            <h3 class="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2" style="font-family: 'Cormorant Garamond', serif;">
                📅 Sua Semana
            </h3>
            <div class="flex items-end gap-2 h-32">
                @foreach ($weeklyActivity as $day)
                    @php
                        $maxMinutes = max(1, ...array_column($weeklyActivity, 'minutes'));
                        $height = $day['minutes'] > 0 ? max(8, ($day['minutes'] / $maxMinutes) * 100) : 4;
                        $isToday = \Carbon\Carbon::parse($day['date'])->isToday();
                    @endphp
                    <div class="flex-1 flex flex-col items-center gap-1">
                        <div
                            class="w-full rounded-t-lg transition-all duration-700 ease-out {{ $day['minutes'] > 0 ? 'bg-gradient-to-t from-amber-500 to-amber-400' : 'bg-gray-200 dark:bg-gray-700' }} {{ $isToday ? 'ring-2 ring-amber-400 ring-offset-2 dark:ring-offset-gray-800' : '' }}"
                            style="height: {{ $height }}%"
                            x-data="{ h: 0 }"
                            x-init="setTimeout(() => h = {{ $height }}, {{ $loop->index * 80 }})"
                            :style="`height: ${h}%`"
                        ></div>
                        <span class="text-[10px] {{ $isToday ? 'text-amber-600 dark:text-amber-400 font-bold' : 'text-gray-400 dark:text-gray-500' }}">
                            {{ \Carbon\Carbon::parse($day['date'])->format('D') }}
                        </span>
                    </div>
                @endforeach
            </div>
            <div class="flex justify-between mt-3 text-xs text-gray-500 dark:text-gray-400">
                <span>Total: {{ collect($weeklyActivity)->sum('minutes') }} min esta semana</span>
                <span>{{ collect($weeklyActivity)->sum('articles_read') }} artigos lidos</span>
            </div>
        </div>

        {{-- Últimos Artigos Lidos --}}
        @if (count($recentArticles) > 0)
            <div class="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm" x-show="loaded" x-transition:enter="transition ease-out duration-500 delay-500" x-transition:enter-start="opacity-0 translate-y-4" x-transition:enter-end="opacity-100 translate-y-0">
                <h3 class="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2" style="font-family: 'Cormorant Garamond', serif;">
                    📖 Últimos Lidos
                </h3>
                <div class="space-y-3">
                    @foreach ($recentArticles as $article)
                        <a href="/blog/{{ $article['slug'] }}" class="flex items-center gap-4 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-all duration-200 group">
                            <div class="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100 dark:bg-gray-700">
                                @if ($article['cover_image'])
                                    <img src="{{ $article['cover_image'] }}" alt="" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300">
                                @else
                                    <div class="w-full h-full flex items-center justify-center text-lg">📄</div>
                                @endif
                            </div>
                            <div class="flex-1 min-w-0">
                                <p class="text-sm font-medium text-gray-900 dark:text-white truncate group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">{{ $article['title'] }}</p>
                                <div class="flex items-center gap-2 mt-0.5">
                                    <span class="text-xs px-2 py-0.5 rounded-full" style="background: {{ $article['category_color'] }}20; color: {{ $article['category_color'] }}">{{ $article['category'] }}</span>
                                    <span class="text-xs text-gray-400">{{ $article['time_spent'] }} min</span>
                                </div>
                            </div>
                            <span class="text-xs text-gray-400 dark:text-gray-500 flex-shrink-0">{{ $article['completed_at'] }}</span>
                        </a>
                    @endforeach
                </div>
            </div>
        @endif
    </div>

    {{-- ═══ TAB: ATIVIDADE ═══ --}}
    <div x-show="activeTab === 'activity'" x-transition:enter="transition ease-out duration-300" x-transition:enter-start="opacity-0" x-transition:enter-end="opacity-100" class="space-y-6">
        <div class="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
            <h3 class="text-lg font-bold text-gray-900 dark:text-white mb-6" style="font-family: 'Cormorant Garamond', serif;">
                📊 Detalhes da Atividade
            </h3>
            <div class="space-y-4">
                @foreach ($weeklyActivity as $day)
                    @php
                        $isToday = \Carbon\Carbon::parse($day['date'])->isToday();
                    @endphp
                    <div class="flex items-center gap-4 p-3 rounded-xl {{ $isToday ? 'bg-amber-50 dark:bg-amber-900/20 border border-amber-200/50 dark:border-amber-800/30' : 'bg-gray-50 dark:bg-gray-700/30' }}">
                        <div class="w-16 text-center">
                            <p class="text-xs text-gray-400 dark:text-gray-500">{{ \Carbon\Carbon::parse($day['date'])->format('D') }}</p>
                            <p class="text-sm font-bold {{ $isToday ? 'text-amber-700 dark:text-amber-400' : 'text-gray-700 dark:text-gray-300' }}">{{ \Carbon\Carbon::parse($day['date'])->format('d/m') }}</p>
                        </div>
                        <div class="flex-1">
                            <div class="flex items-center gap-3">
                                <span class="text-sm text-gray-600 dark:text-gray-400">{{ $day['articles_read'] }} artigos</span>
                                <span class="text-gray-300 dark:text-gray-600">·</span>
                                <span class="text-sm text-gray-600 dark:text-gray-400">{{ $day['minutes'] }} min</span>
                            </div>
                            @if ($day['minutes'] > 0)
                                <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 mt-2">
                                    <div class="bg-gradient-to-r from-amber-400 to-amber-600 h-1.5 rounded-full transition-all duration-700" style="width: {{ min(100, ($day['minutes'] / 60) * 100) }}%"></div>
                                </div>
                            @endif
                        </div>
                        @if ($isToday)
                            <span class="text-xs font-bold text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/30 px-2 py-1 rounded-full">Hoje</span>
                        @endif
                    </div>
                @endforeach
            </div>
        </div>
    </div>

    {{-- ═══ TAB: CATEGORIAS ═══ --}}
    <div x-show="activeTab === 'categories'" x-transition:enter="transition ease-out duration-300" x-transition:enter-start="opacity-0" x-transition:enter-end="opacity-100" class="space-y-6">
        <div class="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
            <h3 class="text-lg font-bold text-gray-900 dark:text-white mb-6" style="font-family: 'Cormorant Garamond', serif;">
                📂 Progresso por Categoria
            </h3>
            @if (count($categoryProgress) > 0)
                <div class="space-y-4">
                    @foreach ($categoryProgress as $cat)
                        <div class="space-y-2">
                            <div class="flex items-center justify-between">
                                <div class="flex items-center gap-2">
                                    <span class="text-lg">{{ $cat['icon'] }}</span>
                                    <span class="text-sm font-medium text-gray-700 dark:text-gray-300">{{ $cat['name'] }}</span>
                                </div>
                                <span class="text-xs font-bold" style="color: {{ $cat['color'] }}">{{ $cat['articles_read'] }}/{{ $cat['total_articles'] }}</span>
                            </div>
                            <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 overflow-hidden">
                                <div
                                    class="h-2.5 rounded-full transition-all duration-1000 ease-out"
                                    style="width: {{ $cat['percent'] }}%; background: {{ $cat['color'] }}"
                                    x-data="{ w: 0 }"
                                    x-init="setTimeout(() => w = {{ $cat['percent'] }}, {{ $loop->index * 100 }})"
                                    :style="`width: ${w}%`"
                                ></div>
                            </div>
                            <p class="text-xs text-gray-400 dark:text-gray-500 text-right">{{ $cat['percent'] }}% concluído</p>
                        </div>
                    @endforeach
                </div>
            @else
                <div class="text-center py-8">
                    <div class="text-4xl mb-3">📂</div>
                    <p class="text-gray-500 dark:text-gray-400">Comece a ler para ver seu progresso!</p>
                </div>
            @endif
        </div>
    </div>
</div>

<style>[x-cloak] { display: none !important; }</style>
</x-filament-panels::page>
