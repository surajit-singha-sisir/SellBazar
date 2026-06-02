<template>
  <div class="max-w-4xl mx-auto px-4 sm:px-6 py-8">
    <h1 class="font-display font-bold text-2xl mb-6 flex items-center gap-2">
      <i class="fa-sharp fa-regular fa-box text-orange-500"></i>
      My Orders
    </h1>

    <div v-if="loading" class="text-center py-16 text-[var(--color-text-muted)]">
      <i class="fa-sharp fa-solid fa-spinner fa-spin text-3xl mb-3 block text-orange-500"></i>
      Loading your orders...
    </div>

    <div v-else-if="error" class="text-center py-16 text-red-500">
      <i class="fa-sharp fa-solid fa-triangle-exclamation text-3xl mb-3 block"></i>
      {{ error }}
      <button @click="fetchOrders" class="btn-ghost mt-4">Retry</button>
    </div>

    <div v-else class="space-y-6">
      <!-- Order cards -->
      <div v-for="order in orders" :key="order.id" class="card overflow-hidden">
        <!-- Header row -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-5 pb-4">
          <div>
            <div class="flex items-center gap-2 mb-1">
              <span class="font-bold text-sm font-mono tracking-wide">{{ order.id }}</span>
              <span :class="statusBadge(order.status)" class="badge text-[10px] uppercase tracking-wide">{{ order.status }}</span>
              <span v-if="order.paymentStatus === 'paid'" class="badge badge-green text-[10px]">Paid</span>
              <span v-else class="badge badge-red text-[10px]">{{ order.paymentStatus }}</span>
            </div>
            <p class="text-xs text-[var(--color-text-muted)]">
              <i class="fa-sharp fa-regular fa-clock mr-1"></i>{{ formatDate(order.createdAt) }}
            </p>
          </div>
          <div class="text-right flex-shrink-0">
            <p class="font-bold text-orange-500 text-lg">৳{{ order.total.toLocaleString() }}</p>
            <p class="text-xs text-[var(--color-text-muted)] capitalize">
              <i class="fa-sharp fa-regular fa-credit-card mr-1"></i>{{ order.paymentMethod }}
            </p>
          </div>
        </div>

        <!-- ── Order Status Timeline ─────────────────────────────────── -->
        <div class="px-5 pb-4">
          <div class="timeline">
            <div v-for="(step, i) in timelineSteps(order.status)" :key="step.key"
              class="timeline-step"
              :class="{ 'step-done': step.done, 'step-active': step.active, 'step-upcoming': !step.done && !step.active }">
              <!-- Connector line -->
              <div v-if="i < 4" class="timeline-line" :class="step.done ? 'line-done' : 'line-pending'"></div>
              <!-- Dot -->
              <div class="timeline-dot">
                <i :class="step.icon"></i>
              </div>
              <!-- Label -->
              <div class="timeline-label">
                <span class="step-name">{{ step.label }}</span>
                <span v-if="step.active" class="step-eta">{{ step.eta }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Tracking number -->
        <div v-if="order.trackingNumber" class="mx-5 mb-4 flex items-center gap-2 text-xs bg-orange-500/8 border border-orange-500/20 rounded-lg px-3 py-2">
          <i class="fa-sharp fa-solid fa-truck-fast text-orange-500"></i>
          <span class="text-[var(--color-text-muted)]">Tracking:</span>
          <span class="font-mono font-semibold text-orange-500">{{ order.trackingNumber }}</span>
        </div>

        <!-- Divider + items -->
        <div class="divider mx-5"></div>
        <div class="px-5 pb-5 space-y-2 mt-3">
          <p class="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wide mb-2">Items</p>
          <div v-for="item in order.items" :key="item.name" class="flex items-center justify-between text-sm gap-3">
            <div class="flex items-center gap-3 min-w-0">
              <img v-if="item.image" :src="item.image" class="w-10 h-10 rounded-lg object-cover bg-[var(--color-surface-2)] shrink-0" />
              <div class="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center shrink-0" v-else>
                <i class="fa-sharp fa-regular fa-box text-orange-400 text-sm"></i>
              </div>
              <span class="truncate text-[var(--color-text-2)]">{{ item.name }}</span>
            </div>
            <div class="text-right shrink-0">
              <span class="text-[var(--color-text-muted)] text-xs mr-2">×{{ item.quantity }}</span>
              <span class="font-medium">৳{{ (item.price * item.quantity).toLocaleString() }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Empty state -->
      <div v-if="orders.length === 0" class="text-center py-16">
        <div class="w-20 h-20 rounded-3xl bg-orange-500/10 flex items-center justify-center mx-auto mb-4">
          <i class="fa-sharp fa-regular fa-box text-3xl text-orange-500"></i>
        </div>
        <h2 class="font-display font-bold text-xl">No orders yet</h2>
        <p class="text-[var(--color-text-muted)] text-sm mt-2">When you place an order, it will appear here</p>
        <RouterLink to="/products" class="btn-primary mt-4 inline-flex">Start Shopping</RouterLink>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useAuthStore } from '@/stores/useAuthStore'

const authStore = useAuthStore()

interface OrderItem { name: string; quantity: number; price: number; image?: string }
interface Order {
  id: string
  items: OrderItem[]
  subtotal: number
  shipping: number
  total: number
  status: string
  paymentMethod: string
  paymentStatus: string
  trackingNumber: string
  createdAt: string
  updatedAt: string
}

const orders  = ref<Order[]>([])
const loading = ref(true)
const error   = ref('')

async function fetchOrders() {
  loading.value = true
  error.value   = ''
  try {
    const savedIds: string[] = JSON.parse(localStorage.getItem('sb-order-ids') ?? '[]')
    if (savedIds.length === 0) { orders.value = []; return }

    const results = await Promise.all(
      savedIds.map(id =>
        fetch(`http://localhost:4000/api/orders/by-id/${id}`)
          .then(r => r.ok ? r.json() : null)
          .catch(() => null)
      )
    )
    orders.value = (results.filter(Boolean) as Order[])
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  } catch {
    error.value = 'Could not load orders. Please try again.'
  } finally {
    loading.value = false
  }
}

onMounted(fetchOrders)

// ── Status timeline ────────────────────────────────────────────────────────
type StepKey = 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
const STEPS: { key: StepKey; label: string; icon: string; eta: string }[] = [
  { key: 'pending',    label: 'Order Placed',  icon: 'fa-sharp fa-solid fa-circle-check',    eta: 'Just now' },
  { key: 'processing', label: 'Processing',    icon: 'fa-sharp fa-solid fa-gear',             eta: '1-2 hours' },
  { key: 'shipped',    label: 'Shipped',       icon: 'fa-sharp fa-solid fa-truck-fast',       eta: '1-2 days' },
  { key: 'delivered',  label: 'Out for Delivery', icon: 'fa-sharp fa-solid fa-house-chimney', eta: 'Today' },
  { key: 'delivered',  label: 'Delivered',     icon: 'fa-sharp-duotone fa-solid fa-box-circle-check', eta: '' },
]

function timelineSteps(status: string) {
  const order = ['pending', 'processing', 'shipped', 'delivered']
  const currentIdx = order.indexOf(status === 'delivered' ? 'delivered' : status)

  return STEPS.map((step, i) => ({
    ...step,
    done:   i < (status === 'cancelled' ? 0 : (currentIdx === 3 ? 5 : currentIdx)),
    active: status === 'cancelled' ? false : (i === (currentIdx === 3 ? 4 : currentIdx)),
  }))
}

const statusBadgeMap: Record<string, string> = {
  delivered:  'badge-green',
  shipped:    'badge-brand',
  processing: 'badge-purple',
  pending:    'badge-red',
  cancelled:  'badge-red',
}
function statusBadge(s: string) { return statusBadgeMap[s] ?? 'badge-brand' }

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-BD', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}
</script>

<style scoped>
/* ── Timeline ─────────────────────────────────────────────────────────────── */
.timeline {
  display: flex;
  align-items: flex-start;
  gap: 0;
  position: relative;
  overflow-x: auto;
  padding-bottom: 4px;
}

.timeline-step {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 1;
  min-width: 56px;
  position: relative;
}

/* Connector line between steps */
.timeline-line {
  position: absolute;
  top: 15px;
  left: 50%;
  width: 100%;
  height: 2px;
  z-index: 0;
}
.line-done    { background: #f97316; }
.line-pending { background: var(--color-border, rgba(255,255,255,0.1)); }

/* Dot */
.timeline-dot {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  z-index: 1;
  transition: all 0.3s;
  border: 2px solid transparent;
  flex-shrink: 0;
}

.step-done .timeline-dot {
  background: #f97316;
  color: #fff;
  border-color: #f97316;
}
.step-active .timeline-dot {
  background: var(--color-bg, #fff);
  color: #f97316;
  border-color: #f97316;
  box-shadow: 0 0 0 4px rgba(249,115,22,0.15);
  animation: pulse-ring 2s ease infinite;
}
.step-upcoming .timeline-dot {
  background: var(--color-surface-2, rgba(255,255,255,0.05));
  color: var(--color-text-muted);
  border-color: var(--color-border);
}

@keyframes pulse-ring {
  0%, 100% { box-shadow: 0 0 0 4px rgba(249,115,22,0.15); }
  50%       { box-shadow: 0 0 0 7px rgba(249,115,22,0.08); }
}

/* Label */
.timeline-label {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  margin-top: 6px;
  text-align: center;
}
.step-name {
  font-size: 10px;
  font-weight: 600;
  color: var(--color-text-muted);
  white-space: nowrap;
}
.step-done .step-name   { color: #f97316; }
.step-active .step-name { color: var(--color-text); font-weight: 700; }

.step-eta {
  font-size: 9px;
  color: #f97316;
  font-weight: 500;
  white-space: nowrap;
}
</style>
