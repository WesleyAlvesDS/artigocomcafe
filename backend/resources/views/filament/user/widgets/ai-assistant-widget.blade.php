<div class="space-y-4" x-data="aiAssistant()" x-init="init()">

    {{-- Header --}}
    <div class="flex items-center justify-between">
        <h3 class="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <span class="text-lg">🤖</span> Pergunte ao Barista
        </h3>
        <span class="flex items-center gap-1 text-xs font-semibold" :class="available ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-400'">
            <span class="w-1.5 h-1.5 rounded-full" :class="available ? 'bg-emerald-500 animate-pulse' : 'bg-gray-400'"></span>
            <span x-text="available ? 'online' : 'offline'">online</span>
        </span>
    </div>

    {{-- Chat Area --}}
    <div class="bg-gray-50 dark:bg-white/5 rounded-xl min-h-[120px] border border-gray-100 dark:border-gray-700/50 overflow-hidden flex flex-col">
        {{-- Messages --}}
        <div class="flex-1 p-3 space-y-3 max-h-[200px] overflow-y-auto" x-ref="chatMessages">
            @if (empty($messages))
                <div class="flex items-start gap-2" x-show="!loading">
                    <div class="w-6 h-6 rounded-lg bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center text-white text-xs flex-shrink-0">☕</div>
                    <div class="bg-white dark:bg-gray-800 rounded-xl rounded-tl-sm px-3 py-2 border border-gray-100 dark:border-gray-700 shadow-sm">
                        <p class="text-sm text-gray-600 dark:text-gray-300">Olá! Sou o Barista IA. No que posso ajudar sua leitura hoje? ☕</p>
                    </div>
                </div>
            @endif

            <template x-for="(msg, index) in messages" :key="index">
                <div class="flex items-start gap-2" x-show="true" x-transition:enter="transition ease-out duration-200" x-transition:enter-start="opacity-0 translate-y-2" x-transition:enter-end="opacity-100 translate-y-0">
                    <div class="w-6 h-6 rounded-lg flex items-center justify-center text-white text-xs flex-shrink-0" :class="msg.role === 'user' ? 'bg-gray-400' : 'bg-gradient-to-br from-amber-500 to-orange-500'" x-text="msg.role === 'user' ? '👤' : '☕'"></div>
                    <div class="rounded-xl rounded-tl-sm px-3 py-2 shadow-sm max-w-[85%]" :class="msg.role === 'user' ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-900 dark:text-amber-100' : 'bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 text-gray-600 dark:text-gray-300'">
                        <p class="text-sm whitespace-pre-wrap" x-text="msg.content"></p>
                    </div>
                </div>
            </template>

            {{-- Typing indicator --}}
            <div x-show="loading" class="flex items-start gap-2">
                <div class="w-6 h-6 rounded-lg bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center text-white text-xs flex-shrink-0">☕</div>
                <div class="bg-white dark:bg-gray-800 rounded-xl rounded-tl-sm px-4 py-3 border border-gray-100 dark:border-gray-700 shadow-sm">
                    <div class="flex gap-1.5">
                        <div class="w-2 h-2 bg-amber-400 rounded-full animate-bounce" style="animation-delay: 0ms"></div>
                        <div class="w-2 h-2 bg-amber-400 rounded-full animate-bounce" style="animation-delay: 150ms"></div>
                        <div class="w-2 h-2 bg-amber-400 rounded-full animate-bounce" style="animation-delay: 300ms"></div>
                    </div>
                </div>
            </div>
        </div>

        {{-- Input --}}
        <div class="p-3 border-t border-gray-100 dark:border-gray-700/50">
            <form @submit.prevent="sendMessage()" class="flex gap-2">
                <input type="text" x-model="query" @keydown.enter.prevent="sendMessage()" :disabled="!available" placeholder="Faça uma pergunta..." class="flex-1 px-3 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 transition-all disabled:opacity-50" />
                <button type="submit" :disabled="!query.trim() || loading || !available" class="px-3 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl font-bold text-sm hover:from-amber-600 hover:to-orange-600 transition-all shadow-lg shadow-amber-500/20 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 active:scale-95">
                    <span x-show="!loading">→</span>
                    <span x-show="loading" class="animate-spin">⟳</span>
                </button>
            </form>
        </div>
    </div>

    {{-- Quick Actions --}}
    <div class="grid grid-cols-3 gap-2">
        @foreach ([
            ['icon' => '📝', 'label' => 'Resumir', 'prompt' => 'Resuma o artigo atual para mim'],
            ['icon' => '🔍', 'label' => 'SEO', 'prompt' => 'Sugira títulos SEO para este artigo'],
            ['icon' => '🌐', 'label' => 'Traduzir', 'prompt' => 'Traduza este artigo para inglês'],
        ] as $action)
            <button type="button" @click="quickAction('{{ $action['prompt'] }}')" :disabled="!available || loading"
                class="px-2 py-1.5 text-xs font-medium bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-gray-700/50 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-amber-50 hover:border-amber-200 hover:text-amber-700 dark:hover:bg-amber-900/20 dark:hover:border-amber-800 dark:hover:text-amber-400 transition-all duration-200 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed">
                {{ $action['icon'] }} {{ $action['label'] }}
            </button>
        @endforeach
    </div>
</div>

<script>
function aiAssistant() {
    return {
        query: '',
        messages: [],
        loading: false,
        available: {{ ($available ?? true) ? 'true' : 'false' }},

        init() {
            // Escuta eventos de toast
            window.addEventListener('cafe:toast', (e) => {
                // Pode ser usado para feedback
            });
        },

        async sendMessage() {
            if (!this.query.trim() || this.loading) return;

            const userMsg = this.query;
            this.messages.push({ role: 'user', content: userMsg });
            this.query = '';
            this.loading = true;

            this.$nextTick(() => {
                this.$refs.chatMessages.scrollTop = this.$refs.chatMessages.scrollHeight;
            });

            try {
                // Simula chamada à API (substitua por chamada real)
                await new Promise(resolve => setTimeout(resolve, 1500));

                const responses = [
                    'Posso ajudar com isso! baseado no contexto do artigo, recomendo explorar mais sobre este tema. ☕',
                    'Ótima pergunta! Vou pesquisar mais informações sobre isso para você.',
                    'Interessante! Esse é um tema que relaciona com vários artigos da nossa biblioteca.',
                ];

                this.messages.push({
                    role: 'assistant',
                    content: responses[Math.floor(Math.random() * responses.length)]
                });
            } catch (error) {
                this.messages.push({
                    role: 'assistant',
                    content: 'Desculpe, não consegui processar sua pergunta. Tente novamente. ☕'
                });
            } finally {
                this.loading = false;
                this.$nextTick(() => {
                    this.$refs.chatMessages.scrollTop = this.$refs.chatMessages.scrollHeight;
                });
            }
        },

        quickAction(prompt) {
            this.query = prompt;
            this.sendMessage();
        }
    };
}
</script>
