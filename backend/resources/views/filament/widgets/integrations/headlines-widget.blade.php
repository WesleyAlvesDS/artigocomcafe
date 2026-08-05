<x-filament-widgets::widget class="fi-wi-headlines">
    <x-filament::section icon="heroicon-m-newspaper" icon-color="warning">
        <x-slot name="heading">
            <span>📰 Manchetes externas</span>
        </x-slot>

        <div class="grid gap-4 lg:grid-cols-2">
            @foreach ([
                ['label' => 'The Guardian', 'items' => $guardian ?? [], 'emoji' => '🏛️'],
                ['label' => 'Hacker News', 'items' => $hackerNews ?? [], 'emoji' => '🟠'],
            ] as $block)
                <div>
                    <h3 class="mb-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
                        {{ $block['emoji'] }} {{ $block['label'] }}
                    </h3>

                    @if (filled($block['items']))
                        <ul class="space-y-2">
                            @foreach ($block['items'] as $item)
                                <li>
                                    <a href="{{ $item['url'] ?? '#' }}" target="_blank" rel="noopener noreferrer"
                                       class="group block rounded-lg p-2 transition hover:bg-gray-50 dark:hover:bg-white/5">
                                        <span class="block text-sm font-medium leading-snug text-gray-950 group-hover:text-primary-600 dark:text-white dark:group-hover:text-primary-400">
                                            {{ $item['title'] }}
                                        </span>
                                        <span class="mt-0.5 block text-xs text-gray-400 dark:text-gray-500">
                                            {{ $item['author'] ?? $item['section'] ?? '' }}
                                        </span>
                                    </a>
                                </li>
                            @endforeach
                        </ul>
                    @else
                        <p class="text-sm text-gray-400 dark:text-gray-500">Sem notícias no momento.</p>
                    @endif
                </div>
            @endforeach
        </div>
    </x-filament::section>
</x-filament-widgets::widget>
