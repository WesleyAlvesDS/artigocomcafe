<x-filament-widgets::widget>
    <x-filament::section heading="NEWSLETTER DO BARISTA">
        <div
            x-data="{
                email: '',
                subscribed: false,
                loading: false,
                async subscribe() {
                    if (!this.email || !this.email.includes('@')) return;
                    this.loading = true;
                    await new Promise(r => setTimeout(r, 1200));
                    this.loading = false;
                    this.subscribed = true;
                }
            }"
            class="space-y-3"
        >
            <p class="text-sm text-gray-600 dark:text-gray-400">
                O melhor da semana na sua xícara. Receba artigos, receitas e novidades direto no seu e-mail.
            </p>

            <div x-show="!subscribed" x-transition.opacity class="space-y-2">
                <div class="flex gap-2">
                    <input
                        type="email"
                        x-model="email"
                        placeholder="seu@email.com"
                        class="flex-1 px-3 py-2 rounded-xl text-sm bg-gray-50 dark:bg-gray-700/50 border border-amber-200/50 dark:border-amber-500/20 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none transition"
                        @keydown.enter="subscribe()"
                    />
                    <button
                        @click="subscribe()"
                        :disabled="loading"
                        class="px-4 py-2 bg-gradient-to-r from-amber-600 to-amber-700 text-white text-sm font-semibold rounded-xl hover:from-amber-700 hover:to-amber-800 disabled:opacity-50 transition-all duration-300"
                    >
                        <span x-show="!loading">Assinar</span>
                        <span x-show="loading" class="flex items-center gap-1">
                            <svg class="animate-spin h-3 w-3" fill="none" viewBox="0 0 24 24">
                                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                            </svg>
                            ...
                        </span>
                    </button>
                </div>
                <p class="text-xs text-gray-400">Sem spam. Descadastre-se quando quiser.</p>
            </div>

            <div x-show="subscribed" x-transition.scale.origin.center class="text-center py-4">
                <div class="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-2">
                    <svg class="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                    </svg>
                </div>
                <p class="font-bold text-gray-900 dark:text-white">Bem-vindo ao clube!</p>
                <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">Próximo envio: segunda-feira</p>
            </div>
        </div>
    </x-filament::section>
</x-filament-widgets::widget>
