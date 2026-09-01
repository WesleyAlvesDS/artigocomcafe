<x-filament-panels::page>
<div x-data="dashboardApp()" x-init="init()" x-cloak class="min-h-screen">

    {{-- ═══════════════════════════════════════════════════════════════
         MOBILE HEADER — Visível apenas em < lg
         ═══════════════════════════════════════════════════════════════ --}}
    <header class="lg:hidden fixed top-0 left-0 right-0 z-40 bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl border-b border-gray-200/50 dark:border-gray-700/50">
        <div class="flex items-center justify-between px-4 h-14">
            {{-- Hamburger --}}
            <button @click="mobileDrawer = true" class="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                <svg class="w-5 h-5 text-gray-700 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/>
                </svg>
            </button>

            {{-- Logo --}}
            <a href="/app" class="flex items-center gap-2">
                <span class="text-xl">☕</span>
                <span class="font-bold text-gray-900 dark:text-white text-sm" style="font-family: 'Cormorant Garamond', serif;">Artigo com Café</span>
            </a>

            {{-- Search + Notifications --}}
            <div class="flex items-center gap-1">
                <button @click="searchOpen = true" class="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                    <svg class="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                    </svg>
                </button>
                @if (auth()->user())
                    <a href="/app/configuracoes" class="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors relative">
                        <svg class="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/>
                        </svg>
                        <span class="absolute top-1.5 right-1.5 w-2 h-2 bg-amber-500 rounded-full"></span>
                    </a>
                @endif
            </div>
        </div>
    </header>

    {{-- ═══════════════════════════════════════════════════════════════
         MOBILE DRAWER — Sidebar deslizante
         ═══════════════════════════════════════════════════════════════ --}}
    {{-- Backdrop --}}
    <div x-show="mobileDrawer" x-transition:enter="transition ease-out duration-300" x-transition:enter-start="opacity-0" x-transition:enter-end="opacity-100" x-transition:leave="transition ease-in duration-200" x-transition:leave-start="opacity-100" x-transition:leave-end="opacity-0" class="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm lg:hidden" @click="mobileDrawer = false"></div>

    {{-- Drawer Panel --}}
    <div x-show="mobileDrawer" x-transition:enter="transition ease-out duration-300 transform" x-transition:enter-start="-translate-x-full" x-transition:enter-end="translate-x-0" x-transition:leave="transition ease-in duration-200 transform" x-transition:leave-start="translate-x-0" x-transition:leave-end="-translate-x-full" class="fixed top-0 left-0 bottom-0 z-50 w-[300px] bg-white dark:bg-gray-900 shadow-2xl overflow-y-auto overscroll-contain lg:hidden" @click.away="mobileDrawer = false" @keydown.escape.window="mobileDrawer = false">

        {{-- Drawer Header --}}
        <div class="p-5 border-b border-gray-100 dark:border-gray-800">
            @if (auth()->user())
                <div class="flex items-center gap-3">
                    <div class="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white text-lg font-bold shadow-lg shadow-amber-500/25">
                        {{ substr(auth()->user()->name ?? 'U', 0, 1) }}
                    </div>
                    <div class="min-w-0 flex-1">
                        <p class="text-sm font-bold text-gray-900 dark:text-white truncate">{{ auth()->user()->name ?? 'Leitor' }}</p>
                        <p class="text-xs text-amber-600 dark:text-amber-400 font-medium">Nível {{ min(10, 1 + (int) floor((auth()->user()->total_grains ?? 0) / 300)) }} · {{ number_format(auth()->user()->total_grains ?? 0) }} ☕</p>
                    </div>
                </div>
            @else
                <div class="text-center">
                    <span class="text-3xl">☕</span>
                    <p class="text-sm font-bold text-gray-900 dark:text-white mt-2">Artigo com Café</p>
                    <p class="text-xs text-gray-500 dark:text-gray-400">O café é o convite, a leitura é o destino</p>
                </div>
            @endif
        </div>

        {{-- Drawer Navigation --}}
        <nav class="p-3 space-y-1">
            @foreach ([
                ['href' => '/app', 'icon' => '🏠', 'label' => 'Início (Feed)', 'id' => 'feed'],
                ['href' => '/app/jornada', 'icon' => '📈', 'label' => 'Jornada', 'id' => 'jornada'],
                ['href' => '/app/trilhas', 'icon' => '🗺️', 'label' => 'Trilhas', 'id' => 'trilhas'],
                ['href' => '/app/missoes', 'icon' => '🎯', 'label' => 'Missões', 'id' => 'missoes', 'badge' => 'Nova'],
                ['href' => '/app/biblioteca', 'icon' => '📚', 'label' => 'Biblioteca', 'id' => 'biblioteca'],
                ['href' => '/app/conquistas', 'icon' => '🏆', 'label' => 'Conquistas', 'id' => 'conquistas'],
            ] as $nav)
                <a href="{{ $nav['href'] }}"
                   class="flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-all duration-200 {{ (request()->is(ltrim($nav['href'], '/').'*') || request()->is(ltrim($nav['href'], '/'))) ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-400 font-semibold' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800' }}"
                   @click="mobileDrawer = false">
                    <span class="text-lg">{{ $nav['icon'] }}</span>
                    {{ $nav['label'] }}
                    @if ($nav['badge'] ?? false)
                        <span class="ml-auto text-[10px] font-bold bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 px-2 py-0.5 rounded-full">{{ $nav['badge'] }}</span>
                    @endif
                </a>
            @endforeach
        </nav>

        {{-- Drawer Categories --}}
        <div class="px-3 pb-3">
            <h4 class="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider px-4 mb-2">Explorar</h4>
            <div class="space-y-0.5">
                @foreach ([
                    ['slug' => 'tecnologia', 'icon' => '💻', 'label' => 'Tecnologia'],
                    ['slug' => 'financas', 'icon' => '📈', 'label' => 'Finanças'],
                    ['slug' => 'educacao', 'icon' => '📖', 'label' => 'Educação'],
                    ['slug' => 'desenvolvimento', 'icon' => '🧠', 'label' => 'Desenvolvimento'],
                    ['slug' => 'games', 'icon' => '🎮', 'label' => 'Games'],
                    ['slug' => 'curiosidades', 'icon' => '🌍', 'label' => 'Curiosidades'],
                ] as $cat)
                    <a href="/blog?categoria={{ $cat['slug'] }}" @click="mobileDrawer = false" class="flex items-center gap-3 px-4 py-2.5 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-xl text-sm transition-colors">
                        <span>{{ $cat['icon'] }}</span>
                        {{ $cat['label'] }}
                    </a>
                @endforeach
            </div>
        </div>

        {{-- Drawer Footer --}}
        <div class="p-4 border-t border-gray-100 dark:border-gray-800 space-y-2">
            <button @click="toggleTheme(); mobileDrawer = false" class="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-xl transition-colors">
                <span x-text="theme === 'dark' ? '☀️' : '🌙'"></span>
                <span x-text="theme === 'dark' ? 'Tema Claro' : 'Tema Escuro'"></span>
            </button>
            @if (auth()->user())
                <a href="/app/configuracoes" @click="mobileDrawer = false" class="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-xl transition-colors">
                    <span>⚙️</span> Configurações
                </a>
            @endif
            <a href="/" class="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-400 dark:text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-xl transition-colors">
                ← Voltar ao site
            </a>
        </div>
    </div>

    {{-- ═══════════════════════════════════════════════════════════════
         DESKTOP LAYOUT — 3 colunas
         ═══════════════════════════════════════════════════════════════ --}}
    <div class="max-w-[1600px] mx-auto lg:grid lg:grid-cols-[260px_1fr_320px] lg:gap-6 lg:items-start pt-14 lg:pt-0">

        {{-- ═══ SIDEBAR ESQUERDA (Desktop only) ═══ --}}
        <aside class="hidden lg:block sticky top-6 space-y-5" x-show="loaded" x-transition:enter="transition ease-out duration-500 delay-100" x-transition:enter-start="opacity-0 -translate-x-4" x-transition:enter-end="opacity-100 translate-x-0">

            {{-- User Card --}}
            @if (auth()->user())
                <div class="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/15 dark:to-orange-900/10 p-4 rounded-2xl border border-amber-200/50 dark:border-amber-800/30 cursor-pointer hover:shadow-lg hover:shadow-amber-500/10 transition-all duration-300"
                     @click="showUserMenu = !showUserMenu"
                     x-data="{ hover: false }"
                     @mouseenter="hover = true" @mouseleave="hover = false"
                     :class="hover ? 'scale-[1.02]' : ''">
                    <div class="flex items-center gap-3">
                        <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white text-lg font-bold shadow-lg shadow-amber-500/25 transition-transform duration-300"
                             :class="hover ? 'rotate-3 scale-110' : ''">
                            {{ substr(auth()->user()->name ?? 'U', 0, 1) }}
                        </div>
                        <div class="min-w-0 flex-1">
                            <p class="text-sm font-bold text-gray-900 dark:text-white truncate">{{ auth()->user()->name ?? 'Leitor' }}</p>
                            <p class="text-xs text-amber-600 dark:text-amber-400 font-medium">Nível {{ min(10, 1 + (int) floor((auth()->user()->total_grains ?? 0) / 300)) }} · {{ number_format(auth()->user()->total_grains ?? 0) }} ☕</p>
                        </div>
                        <svg class="w-4 h-4 text-gray-400 transition-transform duration-300" :class="showUserMenu ? 'rotate-180' : ''" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/></svg>
                    </div>

                    {{-- User Menu Dropdown --}}
                    <div x-show="showUserMenu" x-transition:enter="transition ease-out duration-200" x-transition:enter-start="opacity-0 -translate-y-2" x-transition:enter-end="opacity-100 translate-y-0" class="mt-3 pt-3 border-t border-amber-200/50 dark:border-amber-800/30 space-y-1">
                        <a href="/app/edit-profile" class="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-white/50 dark:hover:bg-white/5 rounded-lg transition-colors">
                            <span>👤</span> Meu Perfil
                        </a>
                        <a href="/app/jornada" class="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-white/50 dark:hover:bg-white/5 rounded-lg transition-colors">
                            <span>📈</span> Minha Jornada
                        </a>
                        <a href="/app/configuracoes" class="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-white/50 dark:hover:bg-white/5 rounded-lg transition-colors">
                            <span>⚙️</span> Configurações
                        </a>
                        <button @click="toggleTheme()" class="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-white/50 dark:hover:bg-white/5 rounded-lg transition-colors text-left">
                            <span x-text="theme === 'dark' ? '☀️' : '🌙'"></span>
                            <span x-text="theme === 'dark' ? 'Tema Claro' : 'Tema Escuro'"></span>
                        </button>
                    </div>
                </div>
            @endif

            {{-- Navegação Principal --}}
            <div class="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
                <nav class="space-y-1">
                    @foreach ([
                        ['href' => '/app', 'icon' => '🏠', 'label' => 'Início (Feed)', 'id' => 'feed'],
                        ['href' => '/app/jornada', 'icon' => '📈', 'label' => 'Jornada', 'id' => 'jornada'],
                        ['href' => '/app/trilhas', 'icon' => '🗺️', 'label' => 'Trilhas', 'id' => 'trilhas'],
                        ['href' => '/app/missoes', 'icon' => '🎯', 'label' => 'Missões', 'id' => 'missoes', 'badge' => 'Nova'],
                        ['href' => '/app/biblioteca', 'icon' => '📚', 'label' => 'Biblioteca', 'id' => 'biblioteca'],
                    ] as $nav)
                        <a href="{{ $nav['href'] }}"
                           class="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm transition-all duration-200 group"
                           :class="activeSection === '{{ $nav['id'] }}' ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-400 font-semibold shadow-sm' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50 hover:translate-x-1'"
                           @click.prevent="navigateTo('{{ $nav['id'] }}')">
                            <span class="text-lg transition-transform duration-200 group-hover:scale-110">{{ $nav['icon'] }}</span>
                            {{ $nav['label'] }}
                            @if ($nav['badge'] ?? false)
                                <span class="ml-auto text-[10px] font-bold bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 px-1.5 py-0.5 rounded-full animate-pulse">{{ $nav['badge'] }}</span>
                            @endif
                        </a>
                    @endforeach
                </nav>
            </div>

            {{-- Explorar Categorias --}}
            <div class="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm" x-data="{ expanded: true }">
                <button @click="expanded = !expanded" class="w-full flex items-center justify-between px-1 mb-3">
                    <h4 class="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Explorar</h4>
                    <svg class="w-4 h-4 text-gray-400 transition-transform duration-200" :class="expanded ? 'rotate-180' : ''" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/></svg>
                </button>
                <div class="space-y-1" x-show="expanded" x-transition>
                    @foreach ([
                        ['slug' => 'tecnologia', 'icon' => '💻', 'label' => 'Tecnologia'],
                        ['slug' => 'financas', 'icon' => '📈', 'label' => 'Finanças'],
                        ['slug' => 'educacao', 'icon' => '📖', 'label' => 'Educação'],
                        ['slug' => 'desenvolvimento', 'icon' => '🧠', 'label' => 'Desenvolvimento'],
                        ['slug' => 'games', 'icon' => '🎮', 'label' => 'Games'],
                        ['slug' => 'curiosidades', 'icon' => '🌍', 'label' => 'Curiosidades'],
                    ] as $cat)
                        <a href="/blog?categoria={{ $cat['slug'] }}" class="flex items-center gap-3 px-3 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-lg text-sm transition-all duration-200 hover:translate-x-1 hover:text-amber-600 dark:hover:text-amber-400 group">
                            <span class="text-base transition-transform duration-200 group-hover:scale-125">{{ $cat['icon'] }}</span>
                            {{ $cat['label'] }}
                        </a>
                    @endforeach
                </div>
            </div>

            {{-- Footer --}}
            <div class="px-2">
                <a href="/" class="flex items-center gap-2 px-3 py-2 text-xs text-gray-400 dark:text-gray-500 hover:text-amber-600 dark:hover:text-amber-400 rounded-lg transition-colors">
                    ← Voltar ao site
                </a>
            </div>
        </aside>

        {{-- ═══ MAIN FEED ═══ --}}
        <main class="min-w-0 max-w-[768px] mx-auto lg:mx-0 px-4 lg:px-0 py-6 pb-24 lg:pb-6" x-show="loaded" x-transition:enter="transition ease-out duration-500 delay-200" x-transition:enter-start="opacity-0 translate-y-4" x-transition:enter-end="opacity-100 translate-y-0">
            {{ $slot }}
        </main>

        {{-- ═══ WIDGETS DIREITA (Desktop only) ═══ --}}
        <aside class="hidden lg:block sticky top-6 space-y-5 max-h-[calc(100vh-3rem)] overflow-y-auto scrollbar-thin" x-show="loaded" x-transition:enter="transition ease-out duration-500 delay-300" x-transition:enter-start="opacity-0 translate-x-4" x-transition:enter-end="opacity-100 translate-x-0">

            @foreach ($widgets as $index => $widget)
                <div
                    x-data="{
                        visible: false,
                        loaded: false,
                        hovered: false,
                        init() {
                            const observer = new IntersectionObserver((entries) => {
                                entries.forEach(entry => {
                                    if (entry.isIntersecting && !this.visible) {
                                        this.visible = true;
                                        setTimeout(() => { this.loaded = true; }, {{ 100 + ($index * 80) }});
                                        observer.unobserve(entry.target);
                                    }
                                });
                            }, { rootMargin: '100px', threshold: 0.1 });
                            this.$nextTick(() => observer.observe(this.$el));
                        }
                    }"
                    @mouseenter="hovered = true"
                    @mouseleave="hovered = false"
                    :class="hovered ? 'border-amber-200 dark:border-amber-800/50 shadow-lg' : 'border-gray-200 dark:border-gray-700'"
                    class="bg-white dark:bg-gray-800 rounded-2xl border shadow-sm transition-all duration-300 hover:-translate-y-0.5 overflow-hidden"
                >
                    {{-- Skeleton --}}
                    <div x-show="!loaded" class="p-5 space-y-3">
                        <div class="flex items-center gap-3">
                            <div class="w-10 h-10 rounded-xl bg-gray-200 dark:bg-gray-700 animate-pulse"></div>
                            <div class="flex-1 space-y-2">
                                <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3 animate-pulse"></div>
                                <div class="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2 animate-pulse"></div>
                            </div>
                        </div>
                        <div class="space-y-2">
                            <div class="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full animate-pulse"></div>
                            <div class="h-3 bg-gray-200 dark:bg-gray-700 rounded w-4/5 animate-pulse"></div>
                        </div>
                    </div>

                    {{-- Content --}}
                    <div x-show="loaded" x-transition:enter="transition ease-out duration-400" x-transition:enter-start="opacity-0" x-transition:enter-end="opacity-100">
                        {{ $widget }}
                    </div>
                </div>
            @endforeach
        </aside>
    </div>

    {{-- ═══════════════════════════════════════════════════════════════
         MOBILE BOTTOM NAVIGATION
         ═══════════════════════════════════════════════════════════════ --}}
    <nav class="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-t border-gray-200/50 dark:border-gray-700/50 safe-area-bottom">
        <div class="flex items-center justify-around h-16 px-2">
            @foreach ([
                ['href' => '/app', 'icon' => '🏠', 'label' => 'Início', 'id' => 'feed'],
                ['href' => '/app/trilhas', 'icon' => '🗺️', 'label' => 'Trilhas', 'id' => 'trilhas'],
                ['href' => '/app/missoes', 'icon' => '🎯', 'label' => 'Missões', 'id' => 'missoes'],
                ['href' => '/app/biblioteca', 'icon' => '📚', 'label' => 'Salvos', 'id' => 'biblioteca'],
                ['href' => '/app/conquistas', 'icon' => '🏆', 'label' => 'Ranking', 'id' => 'conquistas'],
            ] as $nav)
                <a href="{{ $nav['href'] }}"
                   class="flex flex-col items-center justify-center gap-0.5 py-1 px-3 rounded-xl transition-all duration-200 min-w-[56px] {{ (request()->is(ltrim($nav['href'], '/'))) ? 'text-amber-600 dark:text-amber-400' : 'text-gray-400 dark:text-gray-500' }}"
                   @click.prevent="navigateTo('{{ $nav['id'] }}')">
                    <span class="text-xl transition-transform duration-200 {{ (request()->is(ltrim($nav['href'], '/'))) ? 'scale-110' : '' }}">{{ $nav['icon'] }}</span>
                    <span class="text-[10px] font-medium {{ (request()->is(ltrim($nav['href'], '/'))) ? 'text-amber-600 dark:text-amber-400 font-bold' : '' }}">{{ $nav['label'] }}</span>
                    @if ($nav['id'] === 'missoes')
                        <span class="absolute -top-0.5 right-1/2 translate-x-3 w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse"></span>
                    @endif
                </a>
            @endforeach
        </div>
    </nav>

    {{-- ═══ SEARCH OVERLAY ═══ --}}
    <div x-show="searchOpen" x-transition:enter="transition ease-out duration-200" x-transition:enter-start="opacity-0" x-transition:enter-end="opacity-100" x-transition:leave="transition ease-in duration-150" x-transition:leave-start="opacity-100" x-transition:leave-end="opacity-0" class="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] px-4" @keydown.escape.window="searchOpen = false">
        <div class="absolute inset-0 bg-black/40 backdrop-blur-sm" @click="searchOpen = false"></div>
        <div class="relative w-full max-w-xl bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden" x-transition:enter="transition ease-out duration-200" x-transition:enter-start="opacity-0 scale-95" x-transition:enter-end="opacity-100 scale-100">
            <div class="flex items-center gap-3 px-5 py-4 border-b border-gray-100 dark:border-gray-700">
                <svg class="w-5 h-5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
                <input type="text" x-model="searchQuery" x-ref="searchInput" @keydown.enter="executeSearch()" placeholder="Buscar artigos, receitas, trilhas..." class="flex-1 bg-transparent text-gray-900 dark:text-white text-lg outline-none placeholder-gray-400" autofocus />
                <kbd class="hidden sm:inline px-2 py-1 text-xs text-gray-400 bg-gray-100 dark:bg-gray-700 rounded-lg">ESC</kbd>
                <button @click="searchOpen = false" class="lg:hidden w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
                    <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
                </button>
            </div>
            <div class="p-4 max-h-[50vh] overflow-y-auto">
                <p class="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3">Categorias Populares</p>
                <div class="grid grid-cols-2 gap-2">
                    @foreach (['Tecnologia', 'Finanças', 'Receitas', 'Educação', 'Games', 'Curiosidades'] as $cat)
                        <a href="/blog?categoria={{ Str::slug($cat) }}" @click="searchOpen = false" class="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-amber-50 dark:hover:bg-amber-900/20 hover:text-amber-600 dark:hover:text-amber-400 rounded-lg transition-all duration-200">
                            {{ $cat }}
                        </a>
                    @endforeach
                </div>
            </div>
        </div>
    </div>

    {{-- ═══ TOAST NOTIFICATIONS ═══ --}}
    <div x-show="toast.show" x-transition:enter="transition ease-out duration-300" x-transition:enter-start="opacity-0 translate-y-2" x-transition:enter-end="opacity-100 translate-y-0" x-transition:leave="transition ease-in duration-200" x-transition:leave-start="opacity-100" x-transition:leave-end="opacity-0 translate-y-2" class="fixed bottom-20 lg:bottom-6 right-4 lg:right-6 z-50 max-w-sm bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-4 flex items-center gap-3">
        <span class="text-2xl" x-text="toast.icon"></span>
        <div class="min-w-0 flex-1">
            <p class="text-sm font-semibold text-gray-900 dark:text-white" x-text="toast.title"></p>
            <p class="text-xs text-gray-500 dark:text-gray-400" x-text="toast.message"></p>
        </div>
        <button @click="toast.show = false" class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 flex-shrink-0">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
        </button>
    </div>
</div>

<style>
[x-cloak] { display: none !important; }

/* Safe area for iPhone notch */
.safe-area-bottom { padding-bottom: env(safe-area-inset-bottom, 0); }

/* Bottom nav active indicator */
nav a.active-indicator::before {
    content: '';
    position: absolute;
    top: 0;
    left: 50%;
    transform: translateX(-50%);
    width: 20px;
    height: 2px;
    background: #B27C4E;
    border-radius: 1px;
}

/* Scrollbar */
.scrollbar-thin::-webkit-scrollbar { width: 4px; }
.scrollbar-thin::-webkit-scrollbar-track { background: transparent; }
.scrollbar-thin::-webkit-scrollbar-thumb { background: rgba(178, 124, 78, 0.2); border-radius: 2px; }

/* Mobile body scroll lock when drawer is open */
body.drawer-open { overflow: hidden; }

/* Smooth page transitions */
@media (prefers-reduced-motion: no-preference) {
    .page-transition { animation: pageSlideIn 0.3s ease-out; }
}

@keyframes pageSlideIn {
    from { opacity: 0; transform: translateY(8px); }
    to { opacity: 1; transform: translateY(0); }
}
</style>

<script>
function dashboardApp() {
    return {
        loaded: false,
        activeSection: 'feed',
        showUserMenu: false,
        searchOpen: false,
        searchQuery: '',
        mobileDrawer: false,
        theme: localStorage.getItem('theme') || 'light',
        toast: { show: false, icon: '', title: '', message: '' },

        init() {
            setTimeout(() => this.loaded = true, 50);

            // Ctrl+K / Cmd+K para busca
            document.addEventListener('keydown', (e) => {
                if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                    e.preventDefault();
                    this.searchOpen = !this.searchOpen;
                    if (this.searchOpen) {
                        this.$nextTick(() => this.$refs.searchInput?.focus());
                    }
                }
            });

            // Detecta seção ativa da URL
            this.detectSection();
            window.addEventListener('popstate', () => this.detectSection());

            // Body scroll lock quando drawer abre
            this.$watch('mobileDrawer', (val) => {
                document.body.classList.toggle('drawer-open', val);
            });

            // Escuta eventos de toast do Livewire
            if (window.Livewire) {
                Livewire.on('showToast', (data) => {
                    if (data[0]) {
                        this.showToast(data[0].icon || '🔔', data[0].title || 'Notificação', data[0].message || '');
                    }
                });
            }

            // Detecta mudança de tema do sistema
            if (window.matchMedia) {
                window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
                    if (!localStorage.getItem('theme')) {
                        this.theme = e.matches ? 'dark' : 'light';
                        document.documentElement.classList.toggle('dark', e.matches);
                    }
                });
            }
        },

        detectSection() {
            const path = window.location.pathname;
            if (path.includes('/jornada')) this.activeSection = 'jornada';
            else if (path.includes('/trilhas')) this.activeSection = 'trilhas';
            else if (path.includes('/missoes')) this.activeSection = 'missoes';
            else if (path.includes('/biblioteca')) this.activeSection = 'biblioteca';
            else if (path.includes('/conquistas')) this.activeSection = 'conquistas';
            else if (path.includes('/configuracoes')) this.activeSection = 'configuracoes';
            else this.activeSection = 'feed';
        },

        navigateTo(section) {
            this.activeSection = section;
            this.mobileDrawer = false;
            window.location.href = section === 'feed' ? '/app' : '/app/' + section;
        },

        toggleTheme() {
            this.theme = this.theme === 'dark' ? 'light' : 'dark';
            localStorage.setItem('theme', this.theme);
            document.documentElement.classList.toggle('dark', this.theme === 'dark');
            this.showToast('🎨', 'Tema alterado', `Modo ${this.theme === 'dark' ? 'escuro' : 'claro'} ativado`);
        },

        executeSearch() {
            if (this.searchQuery.trim()) {
                window.location.href = `/blog?q=${encodeURIComponent(this.searchQuery)}`;
            }
        },

        showToast(icon, title, message) {
            this.toast = { show: true, icon, title, message };
            setTimeout(() => this.toast.show = false, 4000);
        }
    };
}
</script>
</x-filament-panels::page>
