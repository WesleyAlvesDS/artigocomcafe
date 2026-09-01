/**
 * ═══════════════════════════════════════════════════════════════
 * ARTIGO COM CAFÉ — Push Notification Manager
 * Gerencia inscrição e permissões de notificações push
 * ═══════════════════════════════════════════════════════════════
 */

const PushManager = {
    vapidPublicKey: null,
    swRegistration: null,

    /**
     * Inicializa o Push Manager
     */
    async init(vapidPublicKey) {
        this.vapidPublicKey = vapidPublicKey;

        if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
            console.warn('Push notifications not supported');
            return false;
        }

        try {
            this.swRegistration = await navigator.serviceWorker.register('/sw.js');
            console.log('Service Worker registered');
            return true;
        } catch (error) {
            console.error('Service Worker registration failed:', error);
            return false;
        }
    },

    /**
     * Verifica se o usuário já está inscrito
     */
    async isSubscribed() {
        if (!this.swRegistration) {
            return false;
        }

        try {
            const subscription = await this.swRegistration.pushManager.getSubscription();
            return subscription !== null;
        } catch (error) {
            console.error('Error checking subscription:', error);
            return false;
        }
    },

    /**
     * Solicita permissão e inscreve o usuário
     */
    async subscribe() {
        if (!this.swRegistration || !this.vapidPublicKey) {
            console.error('Push Manager not initialized');
            return null;
        }

        try {
            // Solicita permissão
            const permission = await Notification.requestPermission();
            if (permission !== 'granted') {
                console.warn('Notification permission denied');
                return null;
            }

            // Converte a chave VAPID
            const applicationServerKey = this.urlBase64ToUint8Array(this.vapidPublicKey);

            // Inscreve no push
            const subscription = await this.swRegistration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey
            });

            // Enquota a inscrição para o servidor
            await this.sendSubscriptionToServer(subscription);

            console.log('Push subscription successful');
            return subscription;
        } catch (error) {
            console.error('Push subscription failed:', error);
            return null;
        }
    },

    /**
     * Remove a inscrição
     */
    async unsubscribe() {
        if (!this.swRegistration) {
            return false;
        }

        try {
            const subscription = await this.swRegistration.pushManager.getSubscription();
            if (!subscription) {
                return true;
            }

            // Remove do servidor
            await this.removeSubscriptionFromServer(subscription.endpoint);

            // Remove do navegador
            await subscription.unsubscribe();

            console.log('Push unsubscribe successful');
            return true;
        } catch (error) {
            console.error('Push unsubscribe failed:', error);
            return false;
        }
    },

    /**
     * Envia a inscrição para o servidor
     */
    async sendSubscriptionToServer(subscription) {
        const response = await fetch('/api/user/push-subscription', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': this.getCsrfToken(),
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
            throw new Error('Failed to send subscription to server');
        }

        return response.json();
    },

    /**
     * Remove a inscrição do servidor
     */
    async removeSubscriptionFromServer(endpoint) {
        const response = await fetch('/api/user/push-subscription', {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': this.getCsrfToken(),
                'Accept': 'application/json',
            },
            body: JSON.stringify({ endpoint })
        });

        return response.json();
    },

    /**
     * Verifica o status da inscrição no servidor
     */
    async checkServerStatus() {
        try {
            const response = await fetch('/api/user/push-subscription/status', {
                headers: {
                    'X-CSRF-TOKEN': this.getCsrfToken(),
                    'Accept': 'application/json',
                }
            });
            return await response.json();
        } catch (error) {
            console.error('Error checking server status:', error);
            return { is_subscribed: false, device_count: 0 };
        }
    },

    /**
     * Obtém o token CSRF
     */
    getCsrfToken() {
        const meta = document.querySelector('meta[name="csrf-token"]');
        return meta ? meta.getAttribute('content') : '';
    },

    /**
     * Converte chave VAPID para Uint8Array
     */
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
    },

    /**
     * Mostra uma notificação local (fallback)
     */
    showLocalNotification(title, body, options = {}) {
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification(title, {
                body,
                icon: options.icon || '/favicon-32x32.png',
                badge: options.badge || '/favicon-32x32.png',
                tag: options.tag || 'artigo-com-cafe',
                data: options.data || {},
            });
        }
    }
};

// Exporta para uso global
window.PushManager = PushManager;

export default PushManager;
