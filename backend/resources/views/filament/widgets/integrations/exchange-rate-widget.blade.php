<x-filament-widgets::widget class="fi-wi-exchange">
    <x-filament::section icon="heroicon-m-banknotes" icon-color="success">
        <x-slot name="heading">
            <span>💱 Câmbio — Base {{ $rates['base'] ?? 'BRL' }}</span>
        </x-slot>

        @if (filled($rates) && filled($rates['rates'] ?? []))
            <ul class="space-y-2">
                @foreach ($rates['rates'] as $rate)
                    <li class="flex items-center justify-between gap-4 rounded-lg bg-gray-50 px-3 py-2 dark:bg-white/5">
                        <div class="flex items-center gap-2">
                            <span class="fi-badge fi-color-custom fi-color-gray rounded-md bg-gray-500/10 px-2 py-0.5 text-xs font-semibold text-gray-700 dark:text-gray-300">
                                {{ $rate['code'] }}
                            </span>
                            <span class="text-sm text-gray-500 dark:text-gray-400">
                                {{ number_format($rate['rate'], 2, ',', '.') }}
                            </span>
                        </div>
                        <span class="text-sm font-medium text-gray-950 dark:text-white">
                            {{ $rate['code'] === 'USD' ? 'US$' : '' }}{{ number_format($rate['inverse'] ?? 0, 2, ',', '.') }} {{ $rates['base'] }}
                        </span>
                    </li>
                @endforeach
            </ul>

            <p class="mt-3 text-xs text-gray-400 dark:text-gray-500">
                Atualizado {{ $rates['updated_at'] ?? 'recentemente' }} · Fonte: {{ $rates['source'] ?? '' }}
            </p>
        @else
            <p class="text-sm text-gray-500 dark:text-gray-400">
                Câmbio indisponível no momento.
            </p>
        @endif
    </x-filament::section>
</x-filament-widgets::widget>
