<div x-data="{ 
    open: false, 
    message: '', 
    response: '', 
    loading: false,
    usage: { tokens: 0 },
    history: [],
    init() {
        // Escuta eventos de preenchimento de conteúdo para sugestões proativas
        this.$watch('message', val => {
            if(val.length > 10) this.debouncedAnalyze(val);
        });
    },
    debouncedAnalyze: _.debounce(function(val) {
        // Poderia disparar análise automática de SEO/tom aqui
    }, 2000),
    async send(prompt = null) {
        const promptToSend = prompt || this.message;
        if(!promptToSend) return;

        this.loading = true;
        try {
            const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';
            const res = await fetch('/api/ai/ask', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'X-CSRF-TOKEN': csrfToken },
                body: JSON.stringify({ 
                    prompt: promptToSend, 
                    context: 'Artigo em edição: Título=' + (document.querySelector('[data-ai-context="title"]')?.value || '') + ' | Conteúdo=' + (document.querySelector('[data-ai-context="content"]')?.innerText || '').substring(0, 2000)
                })
            });
            const data = await res.json();
            this.response = data.reply || data?.data?.reply || 'Sem resposta.';
            this.usage.tokens += (data.tokens || data?.data?.tokens || 50);
            
            // Adiciona ao histórico
            this.history.unshift({ role: 'user', text: promptToSend });
            this.history.unshift({ role: 'assistant', text: this.response });
            
        } catch (e) {
            this.response = 'Erro ao conectar com a IA.';
        }
        this.loading = false;
        if(!prompt) this.message = '';
    },
    applyToEditor(action) {
        // Injeta a resposta no RichEditor (Tiptap)
        const editor = document.querySelector('[data-ai-context="content"]')?.__tiptap || null;
        if(editor && this.response) {
            if(action === 'replace') editor.commands.setContent(this.response);
            if(action === 'append') editor.commands.insertContentAtEnd(this.response);
            this.response = '';
        }
    }
}"
class="bg-gray-50 dark:bg-gray-800/50 rounded-xl border p-4 mt-4"
>
    <div class="flex items-center justify-between mb-3">
        <h4 class="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <span class="text-lg">🤖</span> Copilot de Refinamento
            <span class="text-xs bg-primary-100 text-primary-700 px-2 py-0.5 rounded">Ao vivo</span>
        </h4>
        <span class="text-xs text-gray-400">Tokens: <span x-text="usage.tokens"></span></span>
    </div>

    <div class="h-40 overflow-y-auto p-2 bg-white dark:bg-gray-900 rounded-lg border mb-3" style="font-size: 0.8rem;">
        <template x-for="msg in history" :key="msg.text">
            <div class="mb-2 p-2 rounded" :class="msg.role === 'user' ? 'bg-primary-50 text-right' : 'bg-gray-100 dark:bg-gray-800'">
                <strong x-text="msg.role === 'user' ? 'Você' : 'IA'"></strong>: <span x-text="msg.text"></span>
            </div>
        </template>
        <div x-show="loading" class="flex items-center gap-2 text-primary-500 animate-pulse py-2">
            <svg class="h-4 w-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
            </svg>
            <span class="text-xs">Modelando texto...</span>
        </div>
        <template x-if="response && !history.some(h => h.text === response)">
            <div class="mb-2 p-2 bg-green-50 dark:bg-green-900/20 rounded border border-green-200">
                <strong class="text-green-700">Sugestão:</strong> <span x-text="response"></span>
                <div class="flex gap-2 mt-2">
                    <button @click="applyToEditor('append')" class="text-xs bg-green-600 text-white px-2 py-1 rounded">Anexar ao Final</button>
                    <button @click="applyToEditor('replace')" class="text-xs bg-yellow-600 text-white px-2 py-1 rounded">Substituir Tudo</button>
                </div>
            </div>
        </template>
    </div>

    <div class="flex gap-2">
        <input 
            type="text" 
            x-model="message" 
            @keydown.enter.prevent="send()" 
            placeholder="Peça para expandir, reescrever, melhorar SEO, adicionar exemplos..." 
            class="flex-1 rounded-lg border-gray-300 bg-white py-2 px-3 text-sm focus:ring-2 focus:ring-primary-500 dark:border-white/10 dark:bg-white/5"
        >
        <button @click="send()" class="rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-primary-500">Enviar</button>
    </div>

    <div class="mt-2 flex flex-wrap gap-1">
        <button @click="send('Expanda este artigo para 1200+ palavras com mais exemplos e dados.')" class="rounded bg-white px-2 py-1 text-xs shadow-sm dark:bg-white/10">📝 Expandir +</button>
        <button @click="send('Melhore o SEO: densidade de palavra-chave, headings, meta description.')" class="rounded bg-white px-2 py-1 text-xs shadow-sm dark:bg-white/10">📈 Otimizar SEO</button>
        <button @click="send('Reescreva com tom mais persuasivo e storytelling.')" class="rounded bg-white px-2 py-1 text-xs shadow-sm dark:bg-white/10">✨ Storytelling</button>
        <button @click="send('Adicione FAQ estruturado (Schema.org) no final.')" class="rounded bg-white px-2 py-1 text-xs shadow-sm dark:bg-white/10">❓ Adicionar FAQ</button>
    </div>
</div>