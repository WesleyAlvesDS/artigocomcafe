<!-- Mobile-only Bottom Action Bar -->
<div class="fixed bottom-0 left-0 right-0 z-40 flex h-16 items-center justify-around border-t bg-white px-4 shadow-lg md:hidden dark:border-white/10 dark:bg-gray-900">
    <a href="/admin/articles" class="flex flex-col items-center text-xs text-gray-500">
        <span class="text-xl">🏠</span>
        <span>Artigos</span>
    </a>
    <a href="/admin/central-editorial" class="flex flex-col items-center text-xs text-gray-500">
        <span class="text-xl">🔎</span>
        <span>Central</span>
    </a>
    <div x-data>
        <button @click="$dispatch('open-ai-chat')" class="flex h-12 w-12 -translate-y-6 items-center justify-center rounded-full bg-primary-600 text-white shadow-xl">
            <span class="text-xl">✨</span>
        </button>
    </div>
</div>

<div 
    x-data="{ 
        open: false, 
        message: '', 
        response: '', 
        loading: false,
        usage: { tokens: 0 },
        context: '',
        poller: null,
        init() {
            // Não fazemos polling no init. Ativamos ao abrir o chat.
        },
        startPolling() {
            if (this.poller) return;
            this.poller = setInterval(() => {
                const titleInput = document.querySelector('[data-ai-context="title"]');
                const contentInput = document.querySelector('[data-ai-context="content"]');

                let text = '';
                if(titleInput) text += 'Título: ' + (titleInput.value || '') + '\n';
                if(contentInput) text += 'Conteúdo: ' + (contentInput.innerText || '').substring(0, 1000) + '\n';

                this.context = text;
            }, 3000);
        },
        stopPolling() {
            if (this.poller) {
                clearInterval(this.poller);
                this.poller = null;
            }
        },
        async ask(customPrompt = null) {
            const promptToSend = customPrompt || this.message;
            if(!promptToSend) return;

            this.startPolling(); // garante contexto fresco

            this.loading = true;
            try {
                const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';
                const res = await fetch('/api/ai/ask', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json',
                        'X-CSRF-TOKEN': csrfToken,
                    },
                    body: JSON.stringify({
                        prompt: promptToSend,
                        context: this.context
                    })
                });
                const data = await res.json();
                this.response = data.reply || data?.data?.reply || 'Sem resposta.';
                this.usage.tokens += (data.tokens || data?.data?.tokens || 50);
            } catch (e) {
                this.response = 'Erro ao conectar com a IA.';
            }
            this.loading = false;
            if(!customPrompt) this.message = '';
        }
    }"
    @open-ai-chat.window="open = true; startPolling()"
    class="fixed bottom-20 right-6 z-50 md:bottom-6"
>
    <!-- Balloon Button -->
    <button 
        @click="open = !open"
        class="hidden h-14 w-14 items-center justify-center rounded-full bg-primary-600 text-white shadow-2xl transition hover:scale-110 active:scale-95 md:flex dark:bg-primary-500"
    >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="h-6 w-6">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.456-2.455L18 2.25l.259 1.036a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.456 2.455zm0 10.53L18 20.25l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 17.5l1.036-.259a3.375 3.375 0 002.456-2.455l.259-1.036.259 1.036a3.375 3.375 0 002.455 2.456l1.036.259-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
        </svg>
    </button>

    <!-- Chat Window -->
    <div 
        x-show="open" 
        x-transition
        class="absolute bottom-16 right-0 w-[90vw] max-w-sm overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-gray-950/5 dark:bg-gray-900 dark:ring-white/10 md:bottom-20"
        style="display: none;"
    >
        <div class="bg-primary-600 p-4 text-white">
            <div class="flex items-center justify-between">
                <h3 class="text-sm font-bold">Copilot Editorial AI</h3>
                <span class="rounded bg-black/20 px-1.5 py-0.5 text-[9px]">v4.0</span>
            </div>
            <p class="text-[10px] opacity-80">Análise de SEO & Contexto em tempo real</p>
        </div>
        
        <!-- Quick Actions -->
        <div class="flex gap-1 border-b bg-gray-50 p-2 dark:border-white/10 dark:bg-white/5">
            <button @click="ask('Analise o SEO deste texto, sugira melhorias e palavras-chave.')" class="rounded bg-white px-2 py-1 text-[10px] shadow-sm dark:bg-white/10">📊 Auditoria SEO</button>
            <button @click="ask('Melhore este texto e deixe mais persuasivo para leitores.')" class="rounded bg-white px-2 py-1 text-[10px] shadow-sm dark:bg-white/10">✍️ Reescrever</button>
            <button @click="ask('Gere 3 ideias de títulos magnéticos para este conteúdo.')" class="rounded bg-white px-2 py-1 text-[10px] shadow-sm dark:bg-white/10">💡 Títulos</button>
        </div>

        <div class="h-60 overflow-y-auto p-4 text-xs dark:text-gray-200">
            <template x-if="!response && !loading">
                <p class="text-gray-400 italic">Estou lendo o seu artigo em tempo real. Escolha uma ação rápida ou digite abaixo como um Copilot.</p>
            </template>
            <div x-show="loading" class="animate-pulse text-primary-500">Lendo conteúdo e gerando estratégia SEO...</div>
            <div x-text="response" class="whitespace-pre-wrap leading-relaxed"></div>
        </div>

        <div class="border-t p-3 dark:border-white/10">
            <textarea 
                x-model="message"
                @keydown.enter.prevent="ask()"
                placeholder="Pergunte ao Copilot..."
                class="w-full rounded-lg border-none bg-gray-100 p-2 text-xs focus:ring-2 focus:ring-primary-500 dark:bg-white/5"
                rows="2"
            ></textarea>
            <div class="mt-2 flex items-center justify-between">
                <span class="text-[9px] text-gray-400 uppercase tracking-tighter">
                    Tokens usados: <span x-text="usage.tokens"></span>
                </span>
                <button @click="ask()" class="rounded bg-primary-600 px-3 py-1 text-[10px] font-bold text-white shadow">ENVIAR</button>
            </div>
        </div>
    </div>
</div>
