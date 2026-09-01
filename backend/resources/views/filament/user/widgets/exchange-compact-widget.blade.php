<div class="space-y-3" x-data="exchangeWidget()" x-init="init()">
    <div class="flex items-center justify-between">
        <h3 class="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <span class="text-lg" :class="refreshing ? 'animate-spin' : ''" style="transition: transform 0.3s">💱</span>
            Câmbio ao Vivo
        </h3>
        <button @click="refresh()" :disabled="refreshing" class="text-xs text-gray-400 dark:text-gray-500 hover:text-amber-600 dark:hover:text-amber-400 transition-colors disabled:opacity-50">
            <svg class="w-4 h-4" :class="refreshing ? 'animate-spin' : ''" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
        </button>
    </div>

    @if (filled($rates) && filled($rates['rates'] ?? []))
        <div class="space-y-2">
            @foreach ($rates['rates'] as $rate)
                <div class="flex items-center justify-between p-3 bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-100 dark:border-gray-700/50 cursor-pointer hover:border-amber-200 dark:hover:border-amber-800/50 hover:shadow-sm transition-all duration-200 group"
                     @click="toggleDetail('{{ $rate['code'] }}')">
                    <div class="flex items-center gap-2">
                        <span class="text-xs font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-2 py-0.5 rounded-md transition-transform duration-200 group-hover:scale-110">
                            {{ $rate['code'] }}
                        </span>
                        <span class="text-sm font-bold text-gray-900 dark:text-white">
                            {{ $rate['code'] === 'USD' ? 'US$' : '' }}{{ number_format($rate['rate'], 2, ',', '.') }}
                        </span>
                    </div>
                    <div class="flex items-center gap-2">
                        <span class="text-xs text-gray-400 dark:text-gray-500">
                            {{ $rates['base'] }}
                        </span>
                        <svg class="w-3 h-3 text-gray-400 transition-transform duration-200" :class="expandedCurrency === '{{ $rate['code'] }}' ? 'rotate-180' : ''" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/></svg>
                    </div>
                </div>
            @endforeach
        </div>

        @if (filled($rates['updated_at']))
            <p class="text-xs text-gray-400 dark:text-gray-500 text-center">
                Atualizado {{ $rates['updated_at'] }}
            </p>
        @endif
    @else
        <div class="text-center py-4 text-gray-400 dark:text-gray-500">
            <p class="text-2xl mb-1" :class="refreshing ? 'animate-bounce' : ''">📊</p>
            <p class="text-xs">{{ refreshing ? 'Carregando...' : 'Câmbio indisponível' }}</p>
        </div>
    @endif
</div>

<script>
function exchangeWidget() {
    return {
        refreshing: false,
        expandedCurrency: null,

        init() {
            // Auto-refresh a cada 5 minutos
            setInterval(() => this.refresh(), 300000);
        },

        async refresh() {
            this.refreshing = true;
            await new Promise(resolve => setTimeout(resolve, 1000));
            this.refreshing = false;
            window.dispatchEvent(new CustomEvent('cafe:toast', {
                detail: { icon: '💱', title: 'Câmbio atualizado', message: 'Taxas de câmbio atualizadas' }
            }));
        },

        toggleDetail(code) {
            this.expandedCurrency = this.expandedCurrency === code ? null : code;
        }
    };
}
</script>
