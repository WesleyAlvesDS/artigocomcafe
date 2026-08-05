<x-filament-widgets::widget class="fi-wi-weather">
    <x-filament::section icon="heroicon-m-cloud" icon-color="primary">
        <x-slot name="heading">
            <div class="flex items-center gap-3">
                <span>🌤️ Clima</span>
                @if (filled($weather['city'] ?? null))
                    <span class="text-sm font-normal text-gray-500 dark:text-gray-400">
                        {{ $weather['city'] }}{{ filled($weather['region'] ?? null) ? ', ' . $weather['region'] : '' }}
                    </span>
                @endif
            </div>
        </x-slot>

        @if (filled($weather))
            <div class="flex items-center gap-4">
                @if (filled($weather['icon_url'] ?? null))
                    <img src="{{ $weather['icon_url'] }}" alt="" class="h-14 w-14" loading="lazy" />
                @else
                    <span class="text-4xl">🌡️</span>
                @endif

                <div>
                    <div class="text-3xl font-semibold text-gray-950 dark:text-white">
                        {{ $weather['temperature_c'] ?? '--' }}°C
                    </div>
                    <div class="text-sm text-gray-500 dark:text-gray-400">
                        {{ $weather['description'] ?? 'Indisponível' }}
                        @if (filled($weather['feels_like_c'] ?? null))
                            · Sensação {{ $weather['feels_like_c'] }}°C
                        @endif
                    </div>
                </div>
            </div>

            <dl class="mt-4 grid grid-cols-3 gap-3 text-center">
                <div class="rounded-lg bg-gray-50 p-2 dark:bg-white/5">
                    <dt class="text-xs text-gray-500 dark:text-gray-400">Umidade</dt>
                    <dd class="text-sm font-medium text-gray-950 dark:text-white">{{ $weather['humidity'] ?? '--' }}%</dd>
                </div>
                <div class="rounded-lg bg-gray-50 p-2 dark:bg-white/5">
                    <dt class="text-xs text-gray-500 dark:text-gray-400">Vento</dt>
                    <dd class="text-sm font-medium text-gray-950 dark:text-white">{{ $weather['wind_speed_kmph'] ?? '--' }} km/h</dd>
                </div>
                <div class="rounded-lg bg-gray-50 p-2 dark:bg-white/5">
                    <dt class="text-xs text-gray-500 dark:text-gray-400">UV</dt>
                    <dd class="text-sm font-medium text-gray-950 dark:text-white">{{ $weather['uv_index'] ?? '--' }}</dd>
                </div>
            </dl>
        @else
            <p class="text-sm text-gray-500 dark:text-gray-400">
                Clima indisponível no momento. Configure a integração na página <strong>Integrações</strong>.
            </p>
        @endif
    </x-filament::section>
</x-filament-widgets::widget>
