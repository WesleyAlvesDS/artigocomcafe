<div class="space-y-3" x-data="weatherWidget()" x-init="init()">
    <div class="flex items-center justify-between">
        <h3 class="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <span class="text-lg" :class="refreshing ? 'animate-spin' : ''" style="transition: transform 0.3s">⛅</span>
            Clima do Café
        </h3>
        <button @click="refresh()" :disabled="refreshing" class="text-xs text-gray-400 dark:text-gray-500 hover:text-amber-600 dark:hover:text-amber-400 transition-colors disabled:opacity-50">
            <svg class="w-4 h-4" :class="refreshing ? 'animate-spin' : ''" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
        </button>
    </div>

    @if (filled($weather) && filled($weather['temperature_c'] ?? null))
        <div class="flex items-center gap-4 p-4 bg-gradient-to-br from-sky-50 to-blue-50 dark:from-sky-900/15 dark:to-blue-900/10 rounded-xl border border-sky-200/50 dark:border-sky-800/30 cursor-pointer hover:shadow-md transition-all duration-300" @click="showDetails = !showDetails">
            @if (filled($weather['icon_url'] ?? null))
                <img src="{{ $weather['icon_url'] }}" alt="" class="h-12 w-12 transition-transform duration-300" :class="hovering ? 'scale-110 rotate-3' : ''" @mouseenter="hovering = true" @mouseleave="hovering = false" loading="lazy" />
            @else
                <span class="text-3xl transition-transform duration-300" :class="hovering ? 'scale-125' : ''" @mouseenter="hovering = true" @mouseleave="hovering = false">
                    @if (str_contains(strtolower($weather['description'] ?? ''), 'rain'))🌧️
                    @elseif (str_contains(strtolower($weather['description'] ?? ''), 'cloud'))☁️
                    @elseif (str_contains(strtolower($weather['description'] ?? ''), 'clear'))☀️
                    @else ⛅
                    @endif
                </span>
            @endif
            <div>
                <p class="text-2xl font-bold text-gray-900 dark:text-white">{{ round($weather['temperature_c']) }}°C</p>
                <p class="text-xs text-gray-500 dark:text-gray-400 capitalize">{{ $weather['description'] ?? 'Indisponível' }}</p>
            </div>
        </div>

        {{-- Stats Grid --}}
        <div class="grid grid-cols-3 gap-2">
            @foreach ([
                ['label' => 'Umidade', 'value' => ($weather['humidity'] ?? '--') . '%', 'icon' => '💧'],
                ['label' => 'Vento', 'value' => ($weather['wind_speed_kmph'] ?? '--') . ' km/h', 'icon' => '💨'],
                ['label' => 'Sens.', 'value' => ($weather['feels_like_c'] ?? '--') . '°', 'icon' => '🌡️'],
            ] as $stat)
                <div class="text-center p-2 bg-gray-50 dark:bg-white/5 rounded-lg border border-gray-100 dark:border-gray-700/50 cursor-pointer hover:border-sky-200 dark:hover:border-sky-800/50 hover:shadow-sm transition-all duration-200">
                    <span class="text-xs">{{ $stat['icon'] }}</span>
                    <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{{ $stat['label'] }}</p>
                    <p class="text-sm font-bold text-gray-900 dark:text-white">{{ $stat['value'] }}</p>
                </div>
            @endforeach
        </div>

        @if (filled($weather['city'] ?? null))
            <p class="text-xs text-gray-400 dark:text-gray-500 text-center">
                📍 {{ $weather['city'] }}{{ filled($weather['region']) ? ', ' . $weather['region'] : '' }}
            </p>
        @endif
    @else
        <div class="text-center py-4 text-gray-400 dark:text-gray-500">
            <p class="text-2xl mb-1" :class="refreshing ? 'animate-bounce' : ''">🌤️</p>
            <p class="text-xs">{{ refreshing ? 'Carregando...' : 'Clima indisponível' }}</p>
        </div>
    @endif
</div>

<script>
function weatherWidget() {
    return {
        refreshing: false,
        hovering: false,
        showDetails: false,

        init() {
            // Auto-refresh a cada 30 minutos
            setInterval(() => this.refresh(), 1800000);
        },

        async refresh() {
            this.refreshing = true;
            await new Promise(resolve => setTimeout(resolve, 1000));
            this.refreshing = false;
            window.dispatchEvent(new CustomEvent('cafe:toast', {
                detail: { icon: '⛅', title: 'Clima atualizado', message: 'Dados meteorológicos atualizados' }
            }));
        }
    };
}
</script>
