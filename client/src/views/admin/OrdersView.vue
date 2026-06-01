<template>
  <div class="admin-page-wrap">
    <div class="admin-page-header">
      <div>
        <h1 class="page-title">Orders</h1>
        <p class="page-subtitle">{{ filtered.length }} of {{ adminStore.orders.length }} orders</p>
      </div>
      <div style="display:flex;gap:8px">
        <button class="admin-btn secondary"><i class="fa-sharp fa-solid fa-file-export"></i> Export</button>
      </div>
    </div>

    <div class="admin-filters">
      <div class="search-wrap">
        <i class="fa-sharp fa-solid fa-magnifying-glass search-icon"></i>
        <input class="filter-input" v-model="search" placeholder="Search order ID, customer, email…" />
      </div>
      <select class="filter-select" v-model="statusFilter">
        <option value="">All Status</option>
        <option v-for="s in statuses" :key="s" :value="s">{{ capitalize(s) }}</option>
      </select>
    </div>

    <!-- Summary strip -->
    <div class="admin-grid-4" style="margin-bottom:20px">
      <div v-for="s in adminStore.revenueByStatus" :key="s.status" class="admin-stat-card" style="padding:14px 16px;gap:8px">
        <div class="stat-label">{{ capitalize(s.status) }}</div>
        <div style="font-size:20px;font-weight:800;letter-spacing:-0.03em;color:var(--text-primary)">{{ s.count }}</div>
        <div style="font-size:11px;color:var(--brand);font-weight:600">৳{{ s.total.toLocaleString() }}</div>
      </div>
    </div>

    <div class="admin-table-wrap">
      <div v-if="adminStore.loading.orders" style="padding:32px;text-align:center;color:var(--text-secondary)">
        <i class="fa-solid fa-spinner-third fa-spin fa-2x"></i><br><br>Loading orders…
      </div>
      <div v-else-if="!paginated.length" class="admin-empty">
        <i class="fa-sharp-duotone fa-solid fa-bag-shopping"></i>
        <span>No orders found</span>
      </div>
      <table v-else class="admin-table">
        <thead><tr>
          <th>Order ID</th>
          <th>Customer</th>
          <th>Items</th>
          <th>Total</th>
          <th>Payment</th>
          <th>Status</th>
          <th>Date</th>
          <th>Actions</th>
        </tr></thead>
        <tbody>
          <tr v-for="o in paginated" :key="o.id">
            <td>
              <span style="font-family:monospace;font-size:12px;font-weight:700;color:var(--brand)">{{ o.id }}</span>
            </td>
            <td>
              <div style="font-size:13px;font-weight:600;color:var(--text-primary)">{{ o.customer?.name ?? '—' }}</div>
              <div style="font-size:11px;color:var(--text-secondary)">{{ o.customer?.phone ?? '' }}</div>
            </td>
            <td>
              <div style="font-size:12px;max-width:180px">
                <span v-for="(item, i) in (o.items ?? []).slice(0,2)" :key="i"
                  style="display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;color:var(--text-secondary)">
                  {{ item.quantity }}× {{ item.name }}
                </span>
                <span v-if="(o.items?.length ?? 0) > 2" style="font-size:11px;color:var(--text-secondary)">
                  +{{ o.items.length - 2 }} more
                </span>
              </div>
            </td>
            <td style="font-weight:700;color:var(--brand)">৳{{ o.total.toLocaleString() }}</td>
            <td>
              <span class="status-badge processing" style="text-transform:capitalize">{{ o.paymentMethod }}</span>
            </td>
            <td><span class="status-badge" :class="o.status">{{ o.status }}</span></td>
            <td style="font-size:12px;color:var(--text-secondary)">{{ fmtDate(o.createdAt) }}</td>
            <td>
              <div style="display:flex;gap:6px">
                <button class="admin-btn ghost" style="padding:5px 8px" title="View details"
                  @click="selectedOrder = selectedOrder?.id === o.id ? null : o">
                  <i class="fa-sharp fa-solid fa-eye"></i>
                </button>
                <button class="admin-btn ghost" style="padding:5px 8px" title="Print">
                  <i class="fa-sharp fa-solid fa-print"></i>
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Order detail panel -->
    <Transition name="slide-up">
      <div v-if="selectedOrder" class="order-detail-panel">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px">
          <h3 style="font-size:15px;font-weight:700;color:var(--text-primary)">
            Order {{ selectedOrder.id }}
          </h3>
          <button class="admin-btn ghost" style="padding:4px 8px" @click="selectedOrder = null">
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>
        <div class="order-detail-grid">
          <div>
            <div class="detail-section-label">Customer</div>
            <div style="font-size:13px;font-weight:600">{{ selectedOrder.customer?.name }}</div>
            <div style="font-size:12px;color:var(--text-secondary)">{{ selectedOrder.customer?.email }}</div>
            <div style="font-size:12px;color:var(--text-secondary)">{{ selectedOrder.customer?.phone }}</div>
            <div style="font-size:12px;color:var(--text-secondary);margin-top:4px">{{ selectedOrder.customer?.address }}</div>
          </div>
          <div>
            <div class="detail-section-label">Payment</div>
            <div style="font-size:13px;font-weight:600;text-transform:capitalize">{{ selectedOrder.paymentMethod }}</div>
            <span class="status-badge" :class="selectedOrder.paymentStatus === 'paid' ? 'delivered' : 'pending'">
              {{ selectedOrder.paymentStatus }}
            </span>
            <div v-if="selectedOrder.trackingNumber" style="font-size:12px;color:var(--text-secondary);margin-top:6px">
              Tracking: {{ selectedOrder.trackingNumber }}
            </div>
          </div>
          <div>
            <div class="detail-section-label">Items</div>
            <div v-for="item in selectedOrder.items" :key="item.name"
              style="display:flex;justify-content:space-between;font-size:12px;padding:3px 0;border-bottom:1px solid var(--sidebar-border)">
              <span style="color:var(--text-secondary)">{{ item.quantity }}× {{ item.name }}</span>
              <span style="font-weight:600">৳{{ (item.price * item.quantity).toLocaleString() }}</span>
            </div>
            <div style="display:flex;justify-content:space-between;font-size:13px;font-weight:700;margin-top:8px;color:var(--brand)">
              <span>Total</span><span>৳{{ selectedOrder.total.toLocaleString() }}</span>
            </div>
          </div>
        </div>
      </div>
    </Transition>

    <div style="display:flex;align-items:center;justify-content:space-between;margin-top:14px;flex-wrap:wrap;gap:8px">
      <span style="font-size:12px;color:var(--text-secondary)">
        Showing {{ filtered.length ? (page-1)*perPage+1 : 0 }}–{{ Math.min(page*perPage,filtered.length) }} of {{ filtered.length }}
      </span>
      <div style="display:flex;gap:6px">
        <button class="admin-btn secondary" style="padding:6px 12px" :disabled="page===1" @click="page--">
          <i class="fa-solid fa-chevron-left"></i>
        </button>
        <span style="padding:6px 12px;font-size:13px;font-weight:600;color:var(--brand)">{{ page }} / {{ totalPages }}</span>
        <button class="admin-btn secondary" style="padding:6px 12px" :disabled="page>=totalPages" @click="page++">
          <i class="fa-solid fa-chevron-right"></i>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useAdminStore } from '@/stores/useAdminStore'
import type { ApiOrder } from '@/composables/useAdminApi'

const adminStore = useAdminStore()
const search       = ref('')
const statusFilter = ref('')
const page         = ref(1)
const perPage      = 15
const selectedOrder = ref<ApiOrder | null>(null)

const statuses = ['pending','processing','shipped','delivered','cancelled']
const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

// Reset page when filters change
watch([search, statusFilter], () => { page.value = 1 })

const filtered = computed(() => {
  let list = adminStore.orders
  if (search.value) {
    const q = search.value.toLowerCase()
    list = list.filter(o =>
      o.id.toLowerCase().includes(q) ||
      o.customer?.name?.toLowerCase().includes(q) ||
      o.customer?.email?.toLowerCase().includes(q) ||
      o.customer?.phone?.includes(q) ||
      o.paymentMethod.toLowerCase().includes(q)
    )
  }
  if (statusFilter.value) list = list.filter(o => o.status === statusFilter.value)
  return list
})

const totalPages = computed(() => Math.max(1, Math.ceil(filtered.value.length / perPage)))
const paginated  = computed(() => filtered.value.slice((page.value-1)*perPage, page.value*perPage))

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' })
}
</script>

<style scoped>
.order-detail-panel {
  background: var(--surface);
  border: 1px solid var(--sidebar-border);
  border-radius: 14px;
  padding: 20px;
  margin-top: 16px;
}
.order-detail-grid {
  display: grid;
  grid-template-columns: 1fr 1fr 1.5fr;
  gap: 20px;
}
@media (max-width: 768px) {
  .order-detail-grid { grid-template-columns: 1fr; }
}
.detail-section-label {
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--text-secondary);
  margin-bottom: 8px;
}
.slide-up-enter-active, .slide-up-leave-active { transition: opacity 0.2s, transform 0.2s; }
.slide-up-enter-from, .slide-up-leave-to { opacity: 0; transform: translateY(10px); }
</style>
