{{-- ═══════════════════════════════════════════════════════════════
     PUSH NOTIFICATION MANAGER
     Gerencia permissões e inscrição de notificações push
     ═══════════════════════════════════════════════════════════════ --}}

<div
    x-data="pushNotificationManager()"
    x-init="init()"
    class="hidden"
>
    {{-- Botão de ativar notificações (aparece quando necessário) --}}
    <div
        x-show="showEnableBanner"
        x-transition:enter="transition ease-out duration-300"
        x-transition:enter-start="opacity-0 translate-y-4"
        x-transition:enter-end="opacity-100 translate-y-0"
        x-transition:leave="transition ease-in duration-200"
        x-transition:leave-start="opacity-100"
        x-transition:leave-end="opacity-0 translate-y-4"
        class="fixed bottom-20 left-4 right-4 md:left-auto md:right-4 md:w-96 z-40"
    >
        <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 p-4 flex items-center gap-4">
            <div class="w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-2xl flex-shrink-0">
                🔔
            </div>
            <div class="flex-1 min-w-0">
                <p class="text-sm font-bold text-gray-900 dark:text-white">Ative as notificações!</p>
                <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Receba alertas de conquistas e novos artigos</p>
            </div>
            <div class="flex gap-2 flex-shrink-0">
                <button
                    @click="enableNotifications()"
                    :disabled="loading"
                    class="px-3 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-lg transition-colors disabled:opacity-50"
                >
                    <span x-show="!loading">Ativar</span>
                    <span x-show="loading" class="flex items-center gap-1">
                        <svg class="animate-spin h-3 w-3" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg>
                    </span>
                </button>
                <button
                    @click="dismissBanner()"
                    class="px-2 py-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
                </button>
            </div>
        </div>
    </div>

    {{-- Toast de confirmação --}}
    <div
        x-show="showSuccessToast"
        x-transition:enter="transition ease-out duration-300"
        x-transition:enter-start="opacity-0 translate-y-2"
        x-transition:enter-end="opacity-100 translate-y-0"
        x-transition:leave="transition ease-in duration-200"
        x-transition:leave-start="opacity-100"
        x-transition:leave-end="opacity-0 translate-y-2"
        class="fixed bottom-6 left-1/2 -translate-x-1/2 z-50"
    >
        <div class="bg-green-600 text-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2 text-sm font-medium">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
            <span x-text="successMessage"></span>
        </div>
    </div>
</div>

<script>
function pushNotificationManager() {
    return {
        showEnableBanner: false,
        showSuccessToast: false,
        successMessage: '',
        loading: false,
        isSubscribed: false,
        dismissed: false,

        async init() {
            // Verifica se push é suportado
            if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
                return;
            }

            // Verifica se já foi dispensado
            if (localStorage.getItem('push_banner_dismissed')) {
                return;
            }

            // Verifica permissão atual
            const permission = Notification.permission;
            if (permission === 'granted') {
                // Já tem permissão, verifica inscrição
                await this.checkSubscription();
                return;
            }

            if (permission === 'denied') {
                return;
            }

            // Permissão não determinada - mostra banner após 5 segundos
            setTimeout(() => {
                if (!this.dismissed) {
                    this.showEnableBanner = true;
                }
            }, 5000);
        },

        async checkSubscription() {
            try {
                const registration = await navigator.serviceWorker.ready;
                const subscription = await registration.pushManager.getSubscription();
                this.isSubscribed = subscription !== null;
            } catch (error) {
                console.error('Error checking subscription:', error);
            }
        },

        async enableNotifications() {
            this.loading = true;

            try {
                // Inicializa service worker
                const registration = await navigator.serviceWorker.register('/sw.js');
                await navigator.serviceWorker.ready;

                // Solicita permissão
                const permission = await Notification.requestPermission();

                if (permission !== 'granted') {
                    this.showBanner = false;
                    return;
                }

                // Converte chave VAPID
                const vapidPublicKey = @json(config('services.vapid.public_key', env('VAPID_PUBLIC_KEY')));
                const applicationServerKey = this.urlBase64ToUint8Array(vapidPublicKey);

                // Inscreve no push
                const subscription = await registration.pushManager.subscribe({
                    userVisibleOnly: true,
                    applicationServerKey
                });

                // Envia para o servidor
                await this.sendToServer(subscription);

                this.isSubscribed = true;
                this.showEnableBanner = false;
                this.showSuccess('Notificações ativadas! 🔔');

            } catch (error) {
                console.error('Push subscription error:', error);
            } finally {
                this.loading = false;
            }
        },

        async sendToServer(subscription) {
            const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';

            const response = await fetch('/api/user/push-subscription', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': csrfToken,
                    'Accept': 'application/json',
                },
                body: JSON.stringify({
                    endpoint: subscription.endpoint,
                    keys: {
                        p256dh: btoa(String.fromCharCode.apply(null, new Uint8Array(subscription.getKey('p256dh')))),
                        auth: btoa(String.fromCharCode.apply(null, new Uint8Array(subscription.getKey('auth'))))
                    }
                })
            });

            if (!response.ok) {
                throw new Error('Failed to save subscription');
            }
        },

        dismissBanner() {
            this.showEnableBanner = false;
            this.dismissed = true;
            localStorage.setItem('push_banner_dismissed', 'true');
        },

        showSuccess(message) {
            this.successMessage = message;
            this.showSuccessToast = true;
            setTimeout(() => this.showSuccessToast = false, 3000);
        },

        urlBase64ToUint8Array(base64String) {
            const padding = '='.repeat((4 - base64String.length % 4) % 4);
            const base64 = (base64String + padding)
                .replace(/-/g, '+')
                .replace(/_/g, '/');
            const rawData = window.atob(base64);
            const outputArray = new Uint8Array(rawData.length);
            for (let i = 0; i < rawData.length; ++i) {
                outputArray[i] = rawData.charCodeAt(i);
            }
            return outputArray;
        }
    };
}
</script>
