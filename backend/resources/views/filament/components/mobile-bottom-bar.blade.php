<!-- Mobile-only Bottom Action Bar -->
<div class="fixed bottom-0 left-0 right-0 z-40 flex h-16 items-center justify-around border-t bg-white px-4 shadow-lg md:hidden dark:border-white/10 dark:bg-gray-900 pb-safe">
    <a href="/admin" class="flex flex-col items-center text-xs text-gray-500">
        <span class="text-xl">📊</span>
        <span>Resumo</span>
    </a>
    <a href="/admin/articles" class="flex flex-col items-center text-xs text-gray-500">
        <span class="text-xl">📝</span>
        <span>Artigos</span>
    </a>
    <div x-data>
        <button @click="$dispatch('open-ai-chat')" class="flex h-12 w-12 -translate-y-6 items-center justify-center rounded-full bg-primary-600 text-white shadow-xl ring-4 ring-white dark:ring-gray-900">
            <span class="text-xl">✨</span>
        </button>
    </div>
    <a href="/admin/central-editorial" class="flex flex-col items-center text-xs text-gray-500">
        <span class="text-xl">🔎</span>
        <span>Central</span>
    </a>
    <!-- PWA Install Prompt Button (hidden se instalado) -->
    <button id="pwa-install-btn" class="hidden flex-col items-center text-xs text-primary-600">
        <span class="text-xl">📥</span>
        <span>Instalar</span>
    </button>
</div>

<style>
    /* Suporte para iPhone safe area no bottom (X, 11, 12, etc) */
    .pb-safe { padding-bottom: env(safe-area-inset-bottom); }
</style>

<script>
    let deferredPrompt;
    const installBtn = document.getElementById('pwa-install-btn');

    window.addEventListener('beforeinstallprompt', (e) => {
        // Previne o prompt automático nativo
        e.preventDefault();
        deferredPrompt = e;
        // Mostra o botão de instalação apenas se o navegador suportar o evento
        if(installBtn) {
            installBtn.classList.remove('hidden');
            installBtn.classList.add('flex');
        }
    });

    if(installBtn) {
        installBtn.addEventListener('click', async () => {
            if (deferredPrompt) {
                deferredPrompt.prompt();
                const { outcome } = await deferredPrompt.userChoice;
                if (outcome === 'accepted') {
                    installBtn.classList.add('hidden');
                    installBtn.classList.remove('flex');
                }
                deferredPrompt = null;
            }
        });
    }

    // Se já foi instalado, garante que esconde o botão
    window.addEventListener('appinstalled', () => {
        if(installBtn) {
            installBtn.classList.add('hidden');
            installBtn.classList.remove('flex');
        }
    });
</script>