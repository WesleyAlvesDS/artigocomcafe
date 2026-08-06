<x-filament-panels::page>
    <form wire:submit="search" class="fi-section rounded-xl bg-white shadow-sm ring-1 ring-gray-950/5 dark:bg-white/5 dark:ring-white/10">
        <div class="p-6">
            <h2 class="text-base font-semibold text-gray-950 dark:text-white">
                🔎 Buscar pautas
            </h2>
            <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Pesquisa em The Guardian, Hacker News, Currents e GNews — crie um rascunho
                de artigo com um clique (capa sugerida via Openverse).
            </p>

            <div class="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-[1fr_220px]">
                <input
                    type="text"
                    wire:model="query"
                    placeholder="Ex.: inteligência artificial, café, Laravel…"
                    class="fi-input block w-full rounded-lg border-gray-300 bg-white py-2 text-sm text-gray-950 shadow-sm outline-none transition duration-75 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:opacity-70 dark:border-white/10 dark:bg-white/5 dark:text-white dark:focus:ring-primary-500"
                >
                <select
                    wire:model="source"
                    class="fi-input block w-full rounded-lg border-gray-300 bg-white py-2 text-sm text-gray-950 shadow-sm outline-none transition duration-75 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:opacity-70 dark:border-white/10 dark:bg-white/5 dark:text-white dark:focus:ring-primary-500"
                >
                    <option value="all">Todas as fontes</option>
                    <option value="guardian">The Guardian</option>
                    <option value="hackernews">Hacker News</option>
                    <option value="currents">Currents</option>
                    <option value="gnews">GNews</option>
                </select>
            </div>

            <div class="mt-4">
                <button
                    type="submit"
                    class="inline-flex items-center justify-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:bg-primary-500 dark:hover:bg-primary-400"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.8" stroke="currentColor" class="h-4 w-4">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-4.35-4.35M17 10.5a6.5 6.5 0 11-13 0 6.5 6.5 0 0113 0z" />
                    </svg>
                    Buscar pautas
                </button>
            </div>

            <div wire:loading wire:target="search" class="mt-3 text-sm text-gray-500 dark:text-gray-400">
                ⏳ Buscando nas fontes…
            </div>
        </div>
    </form>

    @if ($searched)
        <div class="mt-6">
            <div class="mb-3 flex items-center justify-between">
                <h3 class="text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    {{ count($results) }} {{ count($results) === 1 ? 'resultado' : 'resultados' }}
                </h3>
            </div>

            <div class="grid grid-cols-1 gap-4 lg:grid-cols-2">
                @forelse ($results as $index => $item)
                    <article class="fi-section rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-950/5 transition hover:shadow-md dark:bg-white/5 dark:ring-white/10">
                        <div class="flex items-start gap-3">
                            <div class="min-w-0 flex-1">
                                <div class="flex items-center gap-2">
                                    <span class="inline-flex items-center rounded-md bg-primary-50 px-2 py-0.5 text-xs font-medium text-primary-700 dark:bg-primary-500/10 dark:text-primary-400">
                                        {{ $item['source'] ?? 'Fonte' }}
                                    </span>
                                    @if ($this->humanDate($item['published_at'] ?? null))
                                        <time class="text-xs text-gray-400" datetime="{{ $item['published_at'] ?? '' }}">
                                            {{ $this->humanDate($item['published_at'] ?? null) }}
                                        </time>
                                    @endif
                                </div>

                                <h4 class="mt-2 text-sm font-semibold leading-snug text-gray-950 dark:text-white">
                                    {{ $item['title'] ?? 'Sem título' }}
                                </h4>

                                @if (filled($item['excerpt'] ?? null))
                                    <p class="mt-1 line-clamp-3 text-sm text-gray-500 dark:text-gray-400">
                                        {{ $item['excerpt'] }}
                                    </p>
                                @endif
                            </div>
                        </div>

                        <div class="mt-4 flex flex-wrap items-center gap-2">
                            @if ($this->safeUrl($item['url'] ?? null))
                                <a
                                    href="{{ $this->safeUrl($item['url'] ?? null) }}"
                                    target="_blank"
                                    rel="nofollow noopener"
                                    class="inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 transition hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
                                >
                                    Ver original
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.8" stroke="currentColor" class="h-3.5 w-3.5">
                                        <path stroke-linecap="round" stroke-linejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                                    </svg>
                                </a>
                            @endif

                            <button
                                type="button"
                                wire:click="createDraft({{ $index }})"
                                wire:loading.attr="disabled"
                                class="ml-auto inline-flex items-center gap-1.5 rounded-lg bg-primary-600 px-3 py-1.5 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:bg-primary-500 dark:hover:bg-primary-400"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.8" stroke="currentColor" class="h-4 w-4">
                                    <path stroke-linecap="round" stroke-linejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                                </svg>
                                Criar rascunho
                            </button>
                        </div>
                    </article>
                @empty
                    <div class="fi-section col-span-full rounded-xl bg-white p-10 text-center shadow-sm ring-1 ring-gray-950/5 dark:bg-white/5 dark:ring-white/10">
                        <p class="text-4xl">☕</p>
                        <p class="mt-2 text-sm text-gray-500 dark:text-gray-400">
                            Nenhum resultado encontrado. Tente outro termo ou verifique as chaves de API.
                        </p>
                    </div>
                @endforelse
            </div>
        </div>
    @endif
</x-filament-panels::page>
