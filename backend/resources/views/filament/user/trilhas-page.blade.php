<x-filament-panels::page>
<div
    x-data="{
        loaded: false,
        activeTab: 'all',
        init() {
            setTimeout(() => this.loaded = true, 100);
        }
    }"
    x-cloak
    class="space-y-6"
>

    {{-- ═══ HEADER ═══ --}}
    <div x-show="loaded" x-transition.opacity.duration.500ms class="text-center mb-8">
        <h1 class="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white" style="font-family: 'Cormorant Garamond', serif;">
            🗺️ Trilhas de Estudo
        </h1>
        <p class="text-gray-600 dark:text-gray-400 mt-2">Caminhos estruturados para dominar um assunto</p>
    </div>

    {{-- ═══ STATS ═══ --}}
    <div class="grid grid-cols-3 gap-4" x-show="loaded" x-transition:enter="transition ease-out duration-500 delay-100" x-transition:enter-start="opacity-0 translate-y-4" x-transition:enter-end="opacity-100 translate-y-0">
        <div class="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/10 p-4 rounded-2xl border border-green-200/50 dark:border-green-800/30 text-center">
            <p class="text-2xl font-bold text-green-700 dark:text-green-400">{{ count($trails) }}</p>
            <p class="text-xs text-green-600/70 dark:text-green-400/70 font-medium">Disponíveis</p>
        </div>
        <div class="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/10 p-4 rounded-2xl border border-amber-200/50 dark:border-amber-800/30 text-center">
            <p class="text-2xl font-bold text-amber-700 dark:text-amber-400">{{ $inProgressTrails }}</p>
            <p class="text-xs text-amber-600/70 dark:text-amber-400/70 font-medium">Em Andamento</p>
        </div>
        <div class="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/10 p-4 rounded-2xl border border-purple-200/50 dark:border-purple-800/30 text-center">
            <p class="text-2xl font-bold text-purple-700 dark:text-purple-400">{{ $completedTrails }}</p>
            <p class="text-xs text-purple-600/70 dark:text-purple-400/70 font-medium">Concluídas</p>
        </div>
    </div>

    {{-- ═══ TABS ═══ --}}
    <div class="flex gap-2 overflow-x-auto no-scrollbar" x-show="loaded" x-transition:enter="transition ease-out duration-500 delay-200" x-transition:enter-start="opacity-0" x-transition:enter-end="opacity-100">
        @foreach (['all' => '🗺️ Todas', 'in_progress' => '🔄 Em Andamento', 'completed' => '✅ Concluídas', 'not_started' => '🆕 Não Iniciadas'] as $key => $label)
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

    {{-- ═══ TRAILS GRID ═══ --}}
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        @forelse ($trails as $trail)
            <div
                class="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 group relative overflow-hidden"
                x-data="{
                    show: false,
                    matchesFilter: @js(in_array($trail['is_completed'] ? 'completed' : ($trail['is_started'] ? 'in_progress' : 'not_started'), ['all', $trail['is_completed'] ? 'completed' : ($trail['is_started'] ? 'in_progress' : 'not_started')]))
                }"
                x-init="setTimeout(() => show = true, {{ $loop->index * 80 + 100 }})"
                x-show="loaded && show && (activeTab === 'all' || activeTab === (@js($trail['is_completed'] ? 'completed' : ($trail['is_started'] ? 'in_progress' : 'not_started'))))"
                x-transition:enter="transition ease-out duration-400"
                x-transition:enter-start="opacity-0 translate-y-4 scale-95"
                x-transition:enter-end="opacity-100 translate-y-0 scale-100"
            >
                {{-- Background glow --}}
                <div class="absolute top-0 right-0 w-32 h-32 rounded-full opacity-10 blur-3xl -translate-y-1/2 translate-x-1/2" style="background: {{ $trail['color'] }}"></div>

                <div class="relative">
                    <div class="flex items-start gap-4 mb-4">
                        <div class="w-14 h-14 rounded-xl flex items-center justify-center text-2xl flex-shrink-0 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3" style="background: {{ $trail['color'] }}20">
                            {{ $trail['icon'] }}
                        </div>
                        <div class="flex-1 min-w-0">
                            <div class="flex items-center gap-2 mb-1">
                                <h3 class="font-bold text-gray-900 dark:text-white text-lg group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">{{ $trail['title'] }}</h3>
                                @if ($trail['is_completed'])
                                    <span class="px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-bold rounded-full">✅</span>
                                @elseif ($trail['is_started'])
                                    <span class="px-2 py-0.5 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-xs font-bold rounded-full">🔄</span>
                                @endif
                            </div>
                            <p class="text-sm text-gray-500 dark:text-gray-400 line-clamp-2">{{ $trail['description'] }}</p>
                        </div>
                    </div>

                    {{-- Meta info --}}
                    <div class="flex flex-wrap gap-2 mb-4">
                        <span class="text-xs px-2.5 py-1 rounded-full font-medium" style="background: {{ $trail['color'] }}15; color: {{ $trail['color'] }}">
                            {{ ucfirst($trail['difficulty']) }}
                        </span>
                        @if ($trail['estimated_hours'])
                            <span class="text-xs px-2.5 py-1 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 font-medium">
                                ⏱️ {{ $trail['estimated_hours'] }}h
                            </span>
                        @endif
                        <span class="text-xs px-2.5 py-1 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 font-medium">
                            📄 {{ $trail['articles_count'] }} artigos
                        </span>
                        @if ($trail['recipes_count'] > 0)
                            <span class="text-xs px-2.5 py-1 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 font-medium">
                                ☕ {{ $trail['recipes_count'] }} receitas
                            </span>
                        @endif
                        <span class="text-xs px-2.5 py-1 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 font-bold">
                            +{{ $trail['grain_reward'] }} ☕
                        </span>
                    </div>

                    {{-- Progress bar --}}
                    @if ($trail['is_started'])
                        <div class="mb-4">
                            <div class="flex items-center justify-between text-xs mb-1">
                                <span class="text-gray-500 dark:text-gray-400">Progresso</span>
                                <span class="font-bold" style="color: {{ $trail['color'] }}">{{ $trail['user_progress'] }}%</span>
                            </div>
                            <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                                <div
                                    class="h-2 rounded-full transition-all duration-1000 ease-out"
                                    style="width: {{ $trail['user_progress'] }}%; background: {{ $trail['color'] }}"
                                    x-data="{ w: 0 }"
                                    x-init="setTimeout(() => w = {{ $trail['user_progress'] }}, {{ $loop->index * 100 + 300 }})"
                                    :style="`width: ${w}%`"
                                ></div>
                            </div>
                        </div>
                    @endif

                    {{-- Action button --}}
                    <div class="flex gap-2">
                        @if ($trail['is_completed'])
                            <span class="flex-1 text-center py-2.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-xl text-sm font-bold">
                                🎉 Concluída!
                            </span>
                        @elseif ($trail['is_started'])
                            <a href="/blog?trilha={{ $trail['slug'] }}" class="flex-1 text-center py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-xl text-sm font-bold hover:from-amber-600 hover:to-amber-700 transition-all duration-300 shadow-sm hover:shadow-md">
                                Continuar →
                            </a>
                        @else
                            <a href="/blog?trilha={{ $trail['slug'] }}" class="flex-1 text-center py-2.5 bg-white dark:bg-gray-700 border-2 rounded-xl text-sm font-bold transition-all duration-300 hover:shadow-md" style="border-color: {{ $trail['color'] }}; color: {{ $trail['color'] }}">
                                Iniciar Trilha
                            </a>
                        @endif
                    </div>
                </div>
            </div>
        @empty
            <div class="col-span-2 text-center py-16 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700">
                <div class="text-6xl mb-4">🗺️</div>
                <h3 class="text-lg font-bold text-gray-900 dark:text-white mb-2">Nenhuma trilha disponível</h3>
                <p class="text-gray-500 dark:text-gray-400">Novas trilhas estarão disponíveis em breve!</p>
            </div>
        @endforelse
    </div>
</div>

<style>[x-cloak] { display: none !important; }</style>
</x-filament-panels::page>
