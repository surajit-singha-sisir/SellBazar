import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export interface AppNotification {
  id: string
  type: 'new_order' | 'order_update' | 'info'
  title: string
  message: string
  orderId?: string
  timestamp: number
  read: boolean
}

export const useNotificationStore = defineStore('notifications', () => {
  const notifications = ref<AppNotification[]>(
    JSON.parse(localStorage.getItem('sb-admin-notifications') ?? '[]')
  )
  const toastQueue = ref<AppNotification[]>([])

  const unreadCount = computed(() => notifications.value.filter(n => !n.read).length)

  function persist() {
    // Keep last 50 notifications only
    if (notifications.value.length > 50) {
      notifications.value = notifications.value.slice(0, 50)
    }
    localStorage.setItem('sb-admin-notifications', JSON.stringify(notifications.value))
  }

  function push(notif: Omit<AppNotification, 'id' | 'timestamp' | 'read'>) {
    const newNotif: AppNotification = {
      ...notif,
      id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      timestamp: Date.now(),
      read: false,
    }
    notifications.value.unshift(newNotif)
    toastQueue.value.push(newNotif)
    persist()
    return newNotif
  }

  function dismissToast(id: string) {
    toastQueue.value = toastQueue.value.filter(t => t.id !== id)
  }

  function markRead(id: string) {
    const n = notifications.value.find(n => n.id === id)
    if (n) n.read = true
    persist()
  }

  function markAllRead() {
    notifications.value.forEach(n => { n.read = true })
    persist()
  }

  function clearAll() {
    notifications.value = []
    toastQueue.value = []
    persist()
  }

  return {
    notifications,
    toastQueue,
    unreadCount,
    push,
    dismissToast,
    markRead,
    markAllRead,
    clearAll,
  }
})
