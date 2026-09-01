{{-- ═══════════════════════════════════════════════════════════════
     HOME FEED — Super App Artigo com Café
     Livewire + Alpine.js + Skeleton Loading + Infinite Scroll
     ═══════════════════════════════════════════════════════════════ --}}

<div class="space-y-6" x-data="homeFeed()" x-init="init()" x-cloak>

    {{-- ═══ HERO SECTION ═══ --}}
    @if (!empty($featuredArticles))
        <div class="relative overflow-hidden rounded-3xl bg-gradient-to-br from-amber-900 via-amber-800 to-orange-900 shadow-2xl shadow-amber-900/30"
             x-show="loaded" x-transition:enter="transition ease-out duration-700" x-transition:enter-start="opacity-0 scale-[0.98]" x-transition:enter-end="opacity-100 scale-100">

            <div class="absolute inset-0 opacity-10" style="background-image: url('data:image/svg+xml,%3Csvg width=&quot;60&quot; height=&quot;60&quot; viewBox=&quot;0 0 60 60&quot; xmlns=&quot;http://www.w3.org/2000/svg&quot;%3E%3Cg fill=&quot;none&quot; fill-rule=&quot;evenodd&quot;%3E%3Cg fill=&quot;%23ffffff&quot; fill-opacity=&quot;0.15&quot;%3E%3Cpath d=&quot;M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z&quot;/%3E%3C/g%3E%3C/g%3E%3C/svg%3E');"></div>
            <div class="absolute inset-0" style="background: radial-gradient(ellipse at 30% 20%, rgba(212,163,115,0.3) 0%, transparent 50%), radial-gradient(ellipse at 70% 80%, rgba(139,90,43,0.2) 0%, transparent 50%);"></div>

            <div class="relative z-10 p-8 md:p-10">
                {{-- Tabs --}}
                <div class="flex items-center gap-3 mb-6 overflow-x-auto pb-2" style="scrollbar-width: none;">
                    <span class="flex items-center gap-1.5 px-3 py-1.5 bg-white/15 backdrop-blur-sm rounded-full text-white text-xs font-semibold border border-white/20 whitespace-nowrap">
                        <span class="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
                        Destaque
                    </span>
                    @foreach (array_slice($featuredArticles, 0, 3) as $idx => $featured)
                        <button type="button" @click="activeHeroTab = {{ $idx }}"
                            class="px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-300 whitespace-nowrap"
                            :class="activeHeroTab === {{ $idx }} ? 'bg-white/20 text-white border border-white/30 scale-105' : 'text-white/60 hover:text-white hover:bg-white/10'">
                            {{ Str::limit($featured['title'], 30) }}
                        </button>
                    @endforeach
                </div>

                {{-- Hero Content --}}
                @php $hero = $featuredArticles[0]; @endphp
                <div class="flex flex-col md:flex-row gap-8 items-center">
                    <div class="flex-1 space-y-4" x-data="{ show: false }" x-init="setTimeout(() => show = true, 200)" x-show="show" x-transition:enter="transition ease-out duration-500 delay-200" x-transition:enter-start="opacity-0 translate-y-4" x-transition:enter-end="opacity-100 translate-y-0">
                        <span class="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-500/30 text-amber-200 rounded-lg text-xs font-bold uppercase tracking-wider">
                            ☕ {{ $hero['category'] }}
                        </span>
                        <h1 class="text-3xl md:text-4xl font-bold text-white leading-tight" style="font-family: 'Cormorant Garamond', serif;">
                            {{ $hero['title'] }}
                        </h1>
                        @if ($hero['excerpt'])
                            <p class="text-amber-100/80 text-base leading-relaxed line-clamp-3">
                                {{ Str::limit(strip_tags($hero['excerpt']), 200) }}
                            </p>
                        @endif
                        <div class="flex items-center gap-4 pt-2">
                            <a href="/blog/{{ $hero['slug'] }}" class="inline-flex items-center gap-2 px-6 py-3 bg-white text-amber-900 font-bold rounded-xl hover:bg-amber-50 transition-all duration-300 shadow-lg shadow-black/20 hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0">
                                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
                                Ler Artigo
                            </a>
                            <span class="text-amber-200/60 text-sm">{{ $hero['reading_time'] }} min de leitura</span>
                        </div>
                    </div>

                    @if ($hero['cover_image'])
                        <div class="w-full md:w-[380px] flex-shrink-0" x-data="{ show: false }" x-init="setTimeout(() => show = true, 400)" x-show="show" x-transition:enter="transition ease-out duration-600" x-transition:enter-start="opacity-0 scale-95" x-transition:enter-end="opacity-100 scale-100">
                            <div class="aspect-[4/3] rounded-2xl overflow-hidden shadow-2xl shadow-black/30 border border-white/10 group cursor-pointer">
                                <img src="{{ $hero['cover_image'] }}" alt="{{ $hero['title'] }}" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" loading="eager" fetchpriority="high" />
                            </div>
                        </div>
                    @endif
                </div>
            </div>
        </div>
    @endif

    {{-- ═══ FILTROS RÁPIDOS ═══ --}}
    <div class="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1" style="scrollbar-width: none;"
         x-show="loaded" x-transition:enter="transition ease-out duration-500 delay-300" x-transition:enter-start="opacity-0 translate-y-2" x-transition:enter-end="opacity-100 translate-y-0">
        @php
            $filters = [
                'all' => '✨ Para Você',
                'tecnologia' => '💻 Tecnologia',
                'financas' => '📈 Finanças',
                'educacao' => '📖 Educação',
                'receitas' => '☕ Receitas',
                'desenvolvimento' => '🧠 Dev',
                'games' => '🎮 Games',
                'curiosidades' => '🌍 Curiosidades',
            ];
        @endphp
        @foreach ($filters as $key => $label)
            <button type="button" wire:click="setFilter('{{ $key }}')"
                class="flex-shrink-0 px-4 py-2 rounded-full text-sm font-semibold transition-all duration-300"
                :class="activeFilter === '{{ $key }}' ? 'bg-amber-600 text-white shadow-lg shadow-amber-500/25 scale-105' : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 hover:border-amber-300 hover:text-amber-700 hover:scale-105'">
                {{ $label }}
            </button>
        @endforeach
    </div>

    {{-- ═══ FEED ═══ --}}
    <div class="space-y-5">

        {{-- ═══ SKELETON LOADING (initial) ═══ --}}
        <template x-if="loading && feedItems.length === 0">
            <div class="space-y-5">
                {{-- Hero skeleton --}}
                <div class="bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 overflow-hidden animate-pulse">
                    <div class="aspect-[21/9] bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700"></div>
                    <div class="p-8 space-y-4">
                        <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
                        <div class="h-8 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                        <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
                        <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
                    </div>
                </div>

                {{-- Article skeletons --}}
                @foreach (range(1, 4) as $i)
                    <div class="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden animate-pulse" style="animation-delay: {{ $i * 100 }}ms">
                        <div class="flex gap-5 p-5">
                            <div class="flex-1 space-y-3">
                                <div class="flex items-center gap-2">
                                    <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded-full w-16"></div>
                                    <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded-full w-12"></div>
                                </div>
                                <div class="h-5 bg-gray-200 dark:bg-gray-700 rounded w-4/5"></div>
                                <div class="h-5 bg-gray-200 dark:bg-gray-700 rounded w-3/5"></div>
                                <div class="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
                                <div class="h-3 bg-gray-200 dark:bg-gray-700 rounded w-4/5"></div>
                                <div class="flex items-center gap-2 pt-2">
                                    <div class="h-3 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
                                    <div class="h-3 bg-gray-200 dark:bg-gray-700 rounded w-12"></div>
                                </div>
                            </div>
                            <div class="w-32 h-32 md:w-40 md:h-40 flex-shrink-0 rounded-xl bg-gray-200 dark:bg-gray-700"></div>
                        </div>
                        <div class="px-5 pb-4 flex items-center gap-3 border-t border-gray-50 dark:border-gray-700/50 pt-3">
                            <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-12"></div>
                            <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded-full w-12"></div>
                            <div class="ml-auto h-4 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
                        </div>
                    </div>
                @endforeach

                {{-- Recipe skeleton variant --}}
                <div class="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden animate-pulse" style="animation-delay: 500ms">
                    <div class="aspect-[21/9] bg-gradient-to-r from-emerald-100 via-emerald-200 to-emerald-100 dark:from-emerald-900/30 dark:via-emerald-800/30 dark:to-emerald-900/30"></div>
                    <div class="p-5 space-y-3">
                        <div class="flex items-center gap-2">
                            <div class="h-4 bg-emerald-200 dark:bg-emerald-700 rounded-full w-20"></div>
                            <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded-full w-16"></div>
                        </div>
                        <div class="h-5 bg-gray-200 dark:bg-gray-700 rounded w-4/5"></div>
                        <div class="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
                    </div>
                </div>
            </div>
        </template>

        {{-- ═══ FEED ITEMS ═══ --}}
        @foreach ($feedItems as $idx => $item)
            <article
                wire:key="item-{{ $item['type'] }}-{{ $item['id'] }}"
                class="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden hover:shadow-lg hover:shadow-amber-900/5 transition-all duration-300 hover:-translate-y-0.5 group cursor-pointer"
                x-data="{ show: false }"
                x-intersect.once="show = true"
                x-show="show"
                x-transition:enter="transition ease-out duration-400"
                x-transition:enter-start="opacity-0 translate-y-4"
                x-transition:enter-end="opacity-100 translate-y-0"
                style="transition-delay: {{ min($idx * 50, 300) }}ms"
                @click="window.location.href = '{{ $item['type'] === 'recipe' ? '/receitas/' . $item['slug'] : '/blog/' . $item['slug'] }}'">

                {{-- Recipe cover (full width) --}}
                @if ($item['type'] === 'recipe' && ($item['cover_image'] ?? null))
                    <div class="aspect-[21/9] overflow-hidden">
                        <img src="{{ $item['cover_image'] }}" alt="{{ $item['title'] }}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                    </div>
                @endif

                <div class="flex gap-5 p-5">
                    <div class="flex-1 min-w-0">
                        <div class="flex items-center gap-2 mb-2">
                            @if ($item['type'] === 'recipe')
                                <span class="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-900/20">
                                    {{ $item['category_icon'] ?? '☕' }} {{ $item['category'] }}
                                </span>
                                @if ($item['difficulty'] ?? null)
                                    <span class="text-xs text-gray-400">•</span>
                                    <span class="text-xs text-gray-400 dark:text-gray-500">{{ $item['difficulty'] }}</span>
                                @endif
                                @if ($item['prep_time'] ?? null)
                                    <span class="text-xs text-gray-400">•</span>
                                    <span class="text-xs text-gray-400 dark:text-gray-500">{{ $item['prep_time'] }}</span>
                                @endif
                            @else
                                <span class="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-md" style="color: {{ $item['category_color'] ?? '#B27C4E' }}; background: {{ ($item['category_color'] ?? '#B27C4E') }}15;">
                                    {{ $item['category_icon'] ?? '📄' }} {{ $item['category'] }}
                                </span>
                                <span class="text-xs text-gray-400">•</span>
                                <span class="text-xs text-gray-400 dark:text-gray-500">{{ $item['reading_time'] }} min</span>
                            @endif
                        </div>

                        <h2 class="text-lg font-bold text-gray-900 dark:text-white mb-2 leading-snug group-hover:text-amber-700 dark:group-hover:text-amber-400 transition-colors" style="font-family: 'Cormorant Garamond', serif;">
                            {{ $item['title'] }}
                        </h2>

                        @if ($item['excerpt'] ?? null)
                            <p class="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 mb-3">
                                {{ Str::limit(strip_tags($item['excerpt']), 160) }}
                            </p>
                        @endif

                        <div class="flex items-center gap-4 text-xs text-gray-400 dark:text-gray-500">
                            @if ($item['author'] ?? null)
                                <span class="flex items-center gap-1">
                                    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                                    {{ $item['author'] }}
                                </span>
                            @endif
                            @if ($item['published_at'] ?? null)
                                <span>{{ $item['published_at'] }}</span>
                            @endif
                        </div>
                    </div>

                    @if ($item['type'] !== 'recipe' && ($item['cover_image'] ?? null))
                        <div class="w-32 h-32 md:w-40 md:h-40 flex-shrink-0 rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-700">
                            <img src="{{ $item['cover_image'] }}" alt="{{ $item['title'] }}" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" loading="lazy" />
                        </div>
                    @endif
                </div>

                {{-- Actions --}}
                <div class="px-5 pb-4 flex items-center gap-3 border-t border-gray-50 dark:border-gray-700/50 pt-3" @click.stop>
                    <button
                        wire:click="bookmarkArticle({{ $item['id'] }})"
                        @click.stop
                        class="flex items-center gap-1.5 text-xs font-medium transition-colors text-gray-400 dark:text-gray-500 hover:text-amber-600 dark:hover:text-amber-400">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" /></svg>
                        Salvar
                    </button>
                    @auth
                        <span class="text-xs font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-2 py-0.5 rounded-full">+15 ☕</span>
                    @endauth
                    <a href="{{ $item['type'] === 'recipe' ? '/receitas/' . $item['slug'] : '/blog/' . $item['slug'] }}" @click.stop class="ml-auto flex items-center gap-1 text-xs font-semibold text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 transition-colors">
                        {{ $item['type'] === 'recipe' ? 'Ver receita →' : 'Ler mais →' }}
                    </a>
                </div>
            </article>
        @endforeach

        {{-- ═══ LOAD MORE TRIGGER ═══ --}}
        @if ($hasMore && count($feedItems) > 0)
            <div class="text-center py-8" x-intersect.once="$wire.loadMore()">
                <div wire:loading wire:target="loadMore" class="flex items-center justify-center gap-3">
                    {{-- Skeleton cards for next batch --}}
                    <div class="space-y-4 w-full max-w-lg">
                        @foreach (range(1, 2) as $skeleton)
                            <div class="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden animate-pulse">
                                <div class="flex gap-5 p-5">
                                    <div class="flex-1 space-y-3">
                                        <div class="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
                                        <div class="h-5 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                                        <div class="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
                                    </div>
                                    <div class="w-24 h-24 bg-gray-200 dark:bg-gray-700 rounded-xl flex-shrink-0"></div>
                                </div>
                            </div>
                        @endforeach
                    </div>
                </div>
                <div wire:loading.remove wire:target="loadMore" class="text-sm text-gray-400 dark:text-gray-500">
                    <div class="flex items-center justify-center gap-2">
                        <svg class="w-4 h-4 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 14l-7 7m0 0l-7-7m7 7V3"/></svg>
                        <span>Role para carregar mais</span>
                    </div>
                </div>
            </div>
        @endif

        {{-- ═══ END OF FEED ═══ --}}
        @if (!empty($feedItems) && !$hasMore)
            <div class="text-center py-8" x-data="{ show: false }" x-init="setTimeout(() => show = true, 200)" x-show="show" x-transition>
                <div class="inline-flex items-center gap-2 px-4 py-2 bg-amber-50 dark:bg-amber-900/20 rounded-full text-sm text-amber-700 dark:text-amber-400">
                    <span>☕</span>
                    <span class="font-medium">Você viu tudo! Volte mais tarde para novos artigos.</span>
                </div>
            </div>
        @endif

        {{-- ═══ EMPTY STATE ═══ --}}
        @if (empty($feedItems) && !$loading)
            <div class="text-center py-16" x-data="{ show: false }" x-init="setTimeout(() => show = true, 200)" x-show="show" x-transition>
                <p class="text-5xl mb-4">☕</p>
                <p class="text-gray-500 dark:text-gray-400 text-lg font-medium">Nenhum artigo encontrado</p>
                <p class="text-gray-400 dark:text-gray-500 text-sm mt-1">Volte mais tarde ou explore outras categorias</p>
                <button wire:click="setFilter('all')" class="mt-4 px-4 py-2 bg-amber-600 text-white rounded-xl text-sm font-medium hover:bg-amber-700 transition-colors">
                    ✨ Ver todos
                </button>
            </div>
        @endif
    </div>
</div>

<style>[x-cloak] { display: none !important; }</style>

<script>
function homeFeed() {
    return {
        loaded: false,
        loading: false,
        activeFilter: @js($activeFilter),
        activeHeroTab: 0,
        feedItems: @js($feedItems),

        init() {
            // Delay para animação inicial
            setTimeout(() => this.loaded = true, 50);

            // Escuta eventos do Livewire
            Livewire.on('filterChanged', () => {
                this.loading = true;
                this.feedItems = @js($feedItems);
                setTimeout(() => this.loading = false, 300);
            });

            Livewire.on('showToast', (data) => {
                window.dispatchEvent(new CustomEvent('cafe:toast', { detail: data[0] }));
            });
        }
    };
}
</script>
