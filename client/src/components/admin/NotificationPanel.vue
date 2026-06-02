<template>
  <div class="notif-wrap" ref="panelRef">
    <!-- Bell trigger button -->
    <button class="topbar-btn notif-btn" @click="open = !open" title="Notifications">
      <i class="fa-sharp fa-solid fa-bell" :class="{ 'bell-ring': hasUnread }"></i>
      <span v-if="notifStore.unreadCount > 0" class="notif-dot">
        {{ notifStore.unreadCount > 9 ? '9+' : notifStore.unreadCount }}
      </span>
    </button>

    <!-- Dropdown panel -->
    <Transition name="panel-drop">
      <div v-if="open" class="notif-panel">
        <!-- Header -->
        <div class="panel-header">
          <div class="panel-title">
            <i class="fa-sharp-duotone fa-solid fa-bell"></i>
            Notifications
            <span v-if="notifStore.unreadCount > 0" class="unread-pill">{{ notifStore.unreadCount }} new</span>
          </div>
          <div class="panel-actions">
            <button v-if="notifStore.unreadCount > 0" class="panel-action-btn" @click="notifStore.markAllRead()" title="Mark all read">
              <i class="fa-sharp fa-solid fa-check-double"></i>
            </button>
            <button v-if="notifStore.notifications.length > 0" class="panel-action-btn danger" @click="notifStore.clearAll()" title="Clear all">
              <i class="fa-sharp fa-solid fa-trash"></i>
            </button>
          </div>
        </div>

        <!-- List -->
        <div class="panel-list" v-if="notifStore.notifications.length > 0">
          <TransitionGroup name="notif-item">
            <div
              v-for="n in notifStore.notifications"
              :key="n.id"
              class="notif-item"
              :class="{ unread: !n.read }"
              @click="handleItemClick(n)"
            >
              <div class="notif-item-icon" :class="`icon-${n.type}`">
                <i :class="typeIcon(n.type)"></i>
              </div>
              <div class="notif-item-body">
                <div class="notif-item-title">{{ n.title }}</div>
                <div class="notif-item-msg">{{ n.message }}</div>
                <div class="notif-item-time">{{ timeAgo(n.timestamp) }}</div>
              </div>
              <div v-if="!n.read" class="unread-dot"></div>
            </div>
          </TransitionGroup>
        </div>

        <!-- Empty state -->
        <div v-else class="panel-empty">
          <i class="fa-sharp-duotone fa-solid fa-bell-slash"></i>
          <span>No notifications yet</span>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useNotificationStore, type AppNotification } from '@/stores/useNotificationStore'

const notifStore = useNotificationStore()
const router     = useRouter()
const open       = ref(false)
const panelRef   = ref<HTMLElement | null>(null)

const hasUnread = computed(() => notifStore.unreadCount > 0)

function typeIcon(type: string) {
  return {
    new_order:    'fa-sharp-duotone fa-solid fa-bag-shopping',
    order_update: 'fa-sharp-duotone fa-solid fa-rotate',
    info:         'fa-sharp-duotone fa-solid fa-circle-info',
  }[type] ?? 'fa-sharp fa-solid fa-bell'
}

function handleItemClick(n: AppNotification) {
  notifStore.markRead(n.id)
  if (n.orderId) {
    open.value = false
    router.push('/admin/orders')
  }
}

function timeAgo(ts: number) {
  const diff = Date.now() - ts
  const s = Math.floor(diff / 1000)
  if (s < 60)  return 'just now'
  const m = Math.floor(s / 60)
  if (m < 60)  return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24)  return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

function onDocClick(e: MouseEvent) {
  if (panelRef.value && !panelRef.value.contains(e.target as Node)) {
    open.value = false
  }
}
onMounted(() => document.addEventListener('click', onDocClick))
onUnmounted(() => document.removeEventListener('click', onDocClick))
</script>

<style scoped>
.notif-wrap {
  position: relative;
}

/* Bell button (inherits .topbar-btn from AdminLayout) */
.topbar-btn {
  width: 34px;
  height: 34px;
  border-radius: 8px;
  border: 1px solid var(--sidebar-border);
  background: transparent;
  color: var(--text-secondary);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  transition: all 0.15s;
  position: relative;
}
.topbar-btn:hover {
  background: var(--surface-hover);
  color: var(--text-primary);
}

@keyframes bell-ring {
  0%, 100% { transform: rotate(0); }
  10%       { transform: rotate(14deg); }
  20%       { transform: rotate(-12deg); }
  30%       { transform: rotate(10deg); }
  40%       { transform: rotate(-8deg); }
  50%       { transform: rotate(6deg); }
  60%       { transform: rotate(-4deg); }
  70%       { transform: rotate(2deg); }
}
.bell-ring {
  animation: bell-ring 1.4s ease infinite;
  color: var(--brand, #f97316);
}

.notif-dot {
  position: absolute;
  top: -4px;
  right: -4px;
  background: var(--brand, #f97316);
  color: #fff;
  font-size: 9px;
  font-weight: 700;
  min-width: 16px;
  height: 16px;
  border-radius: 8px;
  padding: 0 3px;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* ── Panel ──────────────────────────────────────────────────────── */
.notif-panel {
  position: absolute;
  top: calc(100% + 10px);
  right: 0;
  width: 340px;
  background: var(--sidebar-bg);
  border: 1px solid var(--sidebar-border);
  border-radius: 16px;
  box-shadow: 0 20px 60px rgba(0,0,0,0.35), 0 4px 16px rgba(0,0,0,0.2);
  z-index: 400;
  overflow: hidden;
  max-height: 480px;
  display: flex;
  flex-direction: column;
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px;
  border-bottom: 1px solid var(--sidebar-border);
  flex-shrink: 0;
}

.panel-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  font-weight: 700;
  color: var(--text-primary);
}

.unread-pill {
  background: var(--brand, #f97316);
  color: #fff;
  font-size: 10px;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 20px;
}

.panel-actions {
  display: flex;
  gap: 4px;
}

.panel-action-btn {
  width: 28px;
  height: 28px;
  border-radius: 7px;
  border: 1px solid var(--sidebar-border);
  background: transparent;
  color: var(--text-secondary);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  transition: all 0.15s;
}
.panel-action-btn:hover {
  background: var(--surface-hover);
  color: var(--text-primary);
}
.panel-action-btn.danger:hover {
  background: rgba(239,68,68,0.1);
  color: #ef4444;
  border-color: rgba(239,68,68,0.2);
}

.panel-list {
  overflow-y: auto;
  flex: 1;
  scrollbar-width: thin;
  scrollbar-color: var(--sidebar-border) transparent;
}

.notif-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px 16px;
  cursor: pointer;
  transition: background 0.15s;
  border-bottom: 1px solid var(--sidebar-border);
  position: relative;
}
.notif-item:last-child { border-bottom: none; }
.notif-item:hover { background: var(--surface-hover); }
.notif-item.unread { background: rgba(249,115,22,0.04); }

.notif-item-icon {
  width: 34px;
  height: 34px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  flex-shrink: 0;
}
.icon-new_order    { background: rgba(249,115,22,0.12); color: var(--brand, #f97316); }
.icon-order_update { background: rgba(59,130,246,0.12); color: #3b82f6; }
.icon-info         { background: rgba(139,92,246,0.12); color: #8b5cf6; }

.notif-item-body { flex: 1; min-width: 0; }
.notif-item-title {
  font-size: 12px;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 2px;
}
.notif-item-msg {
  font-size: 11px;
  color: var(--text-secondary);
  line-height: 1.45;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}
.notif-item-time {
  font-size: 10px;
  color: var(--text-secondary);
  opacity: 0.6;
  margin-top: 4px;
}

.unread-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--brand, #f97316);
  flex-shrink: 0;
  margin-top: 5px;
}

.panel-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 48px 24px;
  color: var(--text-secondary);
  font-size: 13px;
}
.panel-empty i { font-size: 32px; opacity: 0.4; }

/* Transition */
.panel-drop-enter-active { transition: all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1); }
.panel-drop-leave-active { transition: all 0.15s ease; }
.panel-drop-enter-from, .panel-drop-leave-to {
  opacity: 0;
  transform: translateY(-8px) scale(0.97);
}

.notif-item-enter-active { transition: all 0.2s ease; }
.notif-item-leave-active { transition: all 0.15s ease; }
.notif-item-enter-from   { opacity: 0; transform: translateX(-10px); }
.notif-item-leave-to     { opacity: 0; transform: translateX(10px); }

@media (max-width: 480px) {
  .notif-panel {
    position: fixed;
    top: 60px;
    left: 12px;
    right: 12px;
    width: auto;
  }
}
</style>
