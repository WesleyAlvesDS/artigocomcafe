<x-filament-panels::page>
<div
    x-data="{
        loaded: false,
        activeTab: 'articles',
        init() {
            setTimeout(() => this.loaded = true, 100);
        }
    }"
    x-cloak
    class="space-y-6"
>

    {{-- ═══ HEADER ═══ --}}
    <div x-show="loaded" x-transition.opacity.duration.500ms class="flex items-center justify-between">
        <div>
            <h1 class="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white" style="font-family: 'Cormorant Garamond', serif;">
                📚 Minha Biblioteca
            </h1>
            <p class="text-gray-600 dark:text-gray-400 mt-1">{{ $totalSaved }} artigos salvos</p>
        </div>
        <div class="text-4xl" x-data="{ bounce: false }" x-init="setTimeout(() => bounce = true, 500)" :class="bounce ? 'scale-110' : 'scale-100'" style="transition: transform 0.5s">📚</div>
    </div>

    {{-- ═══ TABS ═══ --}}
    <div class="flex gap-2" x-show="loaded" x-transition:enter="transition ease-out duration-500 delay-100" x-transition:enter-start="opacity-0" x-transition:enter-end="opacity-100">
        <button
            @click="activeTab = 'articles'"
            :class="activeTab === 'articles'
                ? 'bg-amber-600 text-white shadow-lg shadow-amber-500/25'
                : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'"
            class="flex-1 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 border border-gray-200 dark:border-gray-700"
        >
            📄 Artigos ({{ $totalSaved }})
        </button>
        <button
            @click="activeTab = 'collections'"
            :class="activeTab === 'collections'
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/25'
                : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'"
            class="flex-1 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 border border-gray-200 dark:border-gray-700"
        >
            📁 Coleções ({{ count($collections) }})
        </button>
    </div>

    {{-- ═══ SAVED ARTICLES ═══ --}}
    <div x-show="activeTab === 'articles'" x-transition:enter="transition ease-out duration-300" x-transition:enter-start="opacity-0" x-transition:enter-end="opacity-100" class="space-y-4">
        @forelse ($savedArticles as $article)
            <a href="/blog/{{ $article['slug'] }}"
               class="block bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-0.5 group"
               x-show="loaded"
               x-transition:enter="transition ease-out duration-400"
               x-transition:enter-start="opacity-0 translate-y-3"
               x-transition:enter-end="opacity-100 translate-y-0"
               style="transition-delay: {{ $loop->index * 60 }}ms"
            >
                <div class="flex gap-4">
                    @if ($article['cover_image'])
                        <div class="w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 bg-gray-100 dark:bg-gray-700">
                            <img src="{{ $article['cover_image'] }}" alt="" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500">
                        </div>
                    @endif
                    <div class="flex-1 min-w-0">
                        <div class="flex items-center gap-2 mb-1">
                            <span class="text-xs font-bold px-2 py-0.5 rounded-full" style="background: {{ $article['category_color'] }}20; color: {{ $article['category_color'] }}">{{ $article['category'] }}</span>
                            <span class="text-xs text-gray-400">·</span>
                            <span class="text-xs text-gray-400">{{ $article['reading_time'] }} min</span>
                        </div>
                        <h3 class="font-bold text-gray-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors line-clamp-2">{{ $article['title'] }}</h3>
                        @if ($article['excerpt'])
                            <p class="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-1">{{ $article['excerpt'] }}</p>
                        @endif
                        <div class="flex items-center gap-2 mt-2">
                            <span class="text-xs text-gray-400">{{ $article['author'] }}</span>
                            <span class="text-xs text-gray-300">·</span>
                            <span class="text-xs text-gray-400">{{ $article['published_at'] }}</span>
                        </div>
                    </div>
                </div>
            </a>
        @empty
            <div class="text-center py-16 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700">
                <div class="text-6xl mb-4">📖</div>
                <h3 class="text-lg font-bold text-gray-900 dark:text-white mb-2">Nenhum artigo salvo</h3>
                <p class="text-gray-500 dark:text-gray-400 mb-4">Salve artigos interessantes para ler depois!</p>
                <a href="/app" class="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-600 to-amber-700 text-white font-medium rounded-xl hover:from-amber-700 hover:to-amber-800 transition-all duration-300 shadow-lg shadow-amber-500/25">
                    🏠 Explorar Feed
                </a>
            </div>
        @endforelse
    </div>

    {{-- ═══ COLLECTIONS ═══ --}}
    <div x-show="activeTab === 'collections'" x-transition:enter="transition ease-out duration-300" x-transition:enter-start="opacity-0" x-transition:enter-end="opacity-100" class="space-y-4">
        @forelse ($collections as $collection)
            <div
                class="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-0.5 cursor-pointer group"
                x-show="loaded"
                x-transition:enter="transition ease-out duration-400"
                x-transition:enter-start="opacity-0 translate-y-3"
                x-transition:enter-end="opacity-100 translate-y-0"
                style="transition-delay: {{ $loop->index * 80 }}ms"
            >
                <div class="flex items-center gap-4">
                    <div class="w-14 h-14 rounded-xl flex items-center justify-center text-2xl flex-shrink-0 transition-transform duration-300 group-hover:scale-110" style="background: {{ $collection['color'] }}20">
                        {{ $collection['icon'] }}
                    </div>
                    <div class="flex-1 min-w-0">
                        <h3 class="font-bold text-gray-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">{{ $collection['name'] }}</h3>
                        @if ($collection['description'])
                            <p class="text-sm text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-1">{{ $collection['description'] }}</p>
                        @endif
                        <div class="flex items-center gap-3 mt-1">
                            <span class="text-xs text-gray-400">{{ $collection['articles_count'] }} artigos</span>
                            @if ($collection['is_public'])
                                <span class="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
                                    <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                                    Pública
                                </span>
                            @endif
                            <span class="text-xs text-gray-300">·</span>
                            <span class="text-xs text-gray-400">{{ $collection['updated_at'] }}</span>
                        </div>
                    </div>
                    <svg class="w-5 h-5 text-gray-300 dark:text-gray-600 group-hover:text-amber-500 transition-all duration-300 group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
                </div>
            </div>
        @empty
            <div class="text-center py-16 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700">
                <div class="text-6xl mb-4">📁</div>
                <h3 class="text-lg font-bold text-gray-900 dark:text-white mb-2">Nenhuma coleção</h3>
                <p class="text-gray-500 dark:text-gray-400 mb-4">Crie coleções para organizar seus artigos favoritos!</p>
                <button class="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-700 text-white font-medium rounded-xl hover:from-purple-700 hover:to-purple-800 transition-all duration-300 shadow-lg shadow-purple-500/25">
                    ➕ Criar Coleção
                </button>
            </div>
        @endforelse
    </div>
</div>

<style>[x-cloak] { display: none !important; }</style>
</x-filament-panels::page>
