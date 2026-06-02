<template>
  <Teleport to="body">
    <div class="toast-container">
      <TransitionGroup name="toast-slide">
        <div
          v-for="toast in notifStore.toastQueue"
          :key="toast.id"
          class="toast-card"
          :class="`toast-${toast.type}`"
        >
          <div class="toast-icon">
            <i :class="toastIcon(toast.type)"></i>
          </div>
          <div class="toast-body">
            <div class="toast-title">{{ toast.title }}</div>
            <div class="toast-msg">{{ toast.message }}</div>
          </div>
          <button class="toast-close" @click="notifStore.dismissToast(toast.id)">
            <i class="fa-solid fa-xmark"></i>
          </button>
          <div class="toast-progress" :style="{ animationDuration: '5000ms' }" @animationend="notifStore.dismissToast(toast.id)"></div>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { useNotificationStore } from '@/stores/useNotificationStore'

const notifStore = useNotificationStore()

function toastIcon(type: string) {
  return {
    new_order:    'fa-sharp-duotone fa-solid fa-bag-shopping',
    order_update: 'fa-sharp-duotone fa-solid fa-rotate',
    info:         'fa-sharp-duotone fa-solid fa-circle-info',
  }[type] ?? 'fa-sharp fa-solid fa-bell'
}
</script>

<style scoped>
.toast-container {
  position: fixed;
  bottom: 24px;
  right: 24px;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  gap: 10px;
  pointer-events: none;
  max-width: 360px;
  width: 100%;
}

.toast-card {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  background: var(--sidebar-bg, #1e1e2e);
  border: 1px solid var(--sidebar-border, rgba(255,255,255,0.08));
  border-radius: 14px;
  padding: 14px 14px 18px;
  box-shadow: 0 16px 48px rgba(0,0,0,0.35), 0 4px 12px rgba(0,0,0,0.2);
  pointer-events: all;
  position: relative;
  overflow: hidden;
  cursor: default;
}

.toast-new_order { border-left: 3px solid var(--brand, #f97316); }
.toast-order_update { border-left: 3px solid #3b82f6; }
.toast-info { border-left: 3px solid #8b5cf6; }

.toast-icon {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: var(--brand-dim, rgba(249,115,22,0.12));
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  color: var(--brand, #f97316);
  flex-shrink: 0;
}
.toast-order_update .toast-icon { background: rgba(59,130,246,0.12); color: #3b82f6; }
.toast-info .toast-icon { background: rgba(139,92,246,0.12); color: #8b5cf6; }

.toast-body { flex: 1; min-width: 0; }
.toast-title {
  font-size: 13px;
  font-weight: 700;
  color: var(--text-primary, #fff);
  margin-bottom: 2px;
}
.toast-msg {
  font-size: 12px;
  color: var(--text-secondary, rgba(255,255,255,0.5));
  line-height: 1.45;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.toast-close {
  width: 24px;
  height: 24px;
  border-radius: 6px;
  border: none;
  background: transparent;
  color: var(--text-secondary, rgba(255,255,255,0.4));
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  flex-shrink: 0;
  transition: background 0.15s, color 0.15s;
}
.toast-close:hover {
  background: var(--surface-hover, rgba(255,255,255,0.06));
  color: var(--text-primary, #fff);
}

/* Auto-dismiss progress bar */
.toast-progress {
  position: absolute;
  bottom: 0;
  left: 0;
  height: 3px;
  background: var(--brand, #f97316);
  border-radius: 0 0 14px 14px;
  animation: toast-shrink linear forwards;
  width: 100%;
  transform-origin: left;
}
@keyframes toast-shrink {
  from { transform: scaleX(1); }
  to   { transform: scaleX(0); }
}

/* Transitions */
.toast-slide-enter-active {
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.toast-slide-leave-active {
  transition: all 0.2s ease;
}
.toast-slide-enter-from {
  opacity: 0;
  transform: translateX(40px) scale(0.95);
}
.toast-slide-leave-to {
  opacity: 0;
  transform: translateX(40px);
}

@media (max-width: 480px) {
  .toast-container {
    bottom: 16px;
    right: 12px;
    left: 12px;
    max-width: 100%;
  }
}
</style>
