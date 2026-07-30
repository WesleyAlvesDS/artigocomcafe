import { api } from './api'

/**
 * VAPID public key for Web Push (P-256 ECDSA).
 * Generate a new pair with: npx web-push generate-vapid-keys
 * Or: php artisan push:generate-vapid-keys
 */
const APPLICATION_SERVER_KEY = import.meta.env.PUBLIC_VAPID_KEY
  || 'BIoCtu4RLk9RBwDCT7cDrbPuQK-R9u2dUIEKjnZu-CSR17TZmciJ3oTPb6I-2vG_apIx5KnJE8RelWJQOcgFZws'

/**
 * Convert a base64 string (VAPID public key) to Uint8Array for the Push API.
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

export function isPushSupported(): boolean {
  return 'Notification' in window && 'serviceWorker' in navigator && 'PushManager' in window
}

export function getPermissionState(): NotificationPermission {
  if (!('Notification' in window)) return 'denied'
  return Notification.permission
}

export async function subscribeToPush(): Promise<PushSubscription | null> {
  try {
    const registration = await navigator.serviceWorker.ready
    const permission = await Notification.requestPermission()
    if (permission !== 'granted') return null

    let subscription = await registration.pushManager.getSubscription()
    if (!subscription) {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(APPLICATION_SERVER_KEY),
      })
    }

    await api.post('/user/push-subscription', {
      endpoint: subscription.endpoint,
      keys: {
        p256dh: arrayBufferToBase64(subscription.getKey('p256dh')),
        auth: arrayBufferToBase64(subscription.getKey('auth')),
      },
    })

    return subscription
  } catch (error) {
    console.error('Failed to subscribe to push:', error)
    return null
  }
}

export async function unsubscribeFromPush(): Promise<boolean> {
  try {
    const registration = await navigator.serviceWorker.ready
    const subscription = await registration.pushManager.getSubscription()
    if (!subscription) return true

    await api.delete('/user/push-subscription', { endpoint: subscription.endpoint })
    await subscription.unsubscribe()
    return true
  } catch (error) {
    console.error('Failed to unsubscribe from push:', error)
    return false
  }
}

export async function isSubscribed(): Promise<boolean> {
  try {
    const registration = await navigator.serviceWorker.ready
    const subscription = await registration.pushManager.getSubscription()
    return subscription !== null
  } catch {
    return false
  }
}

function arrayBufferToBase64(buffer: ArrayBuffer | null): string {
  if (!buffer) return ''
  const bytes = new Uint8Array(buffer)
  let binary = ''
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary)
}
