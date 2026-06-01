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
        <input class="filter-input" v-model="search" placeholder="Search order ID or method…" />
      </div>
      <select class="filter-select" v-model="statusFilter">
        <option value="">All Status</option>
        <option v-for="s in statuses" :key="s" :value="s">{{ s }}</option>
      </select>
    </div>

    <!-- Summary strip -->
    <div class="admin-grid-4" style="margin-bottom:20px">
      <div v-for="s in adminStore.revenueByStatus" :key="s.status" class="admin-stat-card" style="padding:14px 16px;gap:8px">
        <div class="stat-label">{{ s.status }}</div>
        <div style="font-size:20px;font-weight:800;letter-spacing:-0.03em;color:var(--text-primary)">{{ s.count }}</div>
        <div style="font-size:11px;color:var(--brand);font-weight:600">৳{{ s.total.toLocaleString() }}</div>
      </div>
    </div>

    <div class="admin-table-wrap">
      <div v-if="adminStore.loading.orders" style="padding:32px;text-align:center;color:var(--text-secondary)">
        <i class="fa-solid fa-spinner-third fa-spin fa-2x"></i><br><br>Loading orders…
      </div>
      <table v-else class="admin-table">
        <thead><tr>
          <th>Order ID</th><th>Items</th><th>Total</th><th>Payment</th><th>Status</th><th>Date</th><th>Actions</th>
        </tr></thead>
        <tbody>
          <tr v-for="o in paginated" :key="o.id">
            <td><span style="font-family:monospace;font-size:12px;font-weight:700;color:var(--brand)">#{{ o.id.slice(-8).toUpperCase() }}</span></td>
            <td>
              <div style="font-size:12px;max-width:180px">
                <span v-for="(item, i) in o.items.slice(0,2)" :key="i" style="display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;color:var(--text-secondary)">
                  {{ item.quantity }}x {{ item.name }}
                </span>
                <span v-if="o.items.length > 2" style="font-size:11px;color:var(--text-secondary)">+{{ o.items.length - 2 }} more</span>
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
                <button class="admin-btn ghost" style="padding:5px 8px" title="View"><i class="fa-sharp fa-solid fa-eye"></i></button>
                <button class="admin-btn ghost" style="padding:5px 8px" title="Print"><i class="fa-sharp fa-solid fa-print"></i></button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div style="display:flex;align-items:center;justify-content:space-between;margin-top:14px;flex-wrap:wrap;gap:8px">
      <span style="font-size:12px;color:var(--text-secondary)">
        Showing {{ (page-1)*perPage+1 }}–{{ Math.min(page*perPage,filtered.length) }} of {{ filtered.length }}
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
import { ref, computed } from 'vue'
import { useAdminStore } from '@/stores/useAdminStore'

const adminStore = useAdminStore()
const search       = ref('')
const statusFilter = ref('')
const page         = ref(1)
const perPage      = 15

const statuses = ['pending','processing','shipped','delivered','cancelled']

const filtered = computed(() => {
  let list = adminStore.orders
  if (search.value) {
    const q = search.value.toLowerCase()
    list = list.filter(o => o.id.toLowerCase().includes(q) || o.paymentMethod.toLowerCase().includes(q))
  }
  if (statusFilter.value) list = list.filter(o => o.status === statusFilter.value)
  return list
})

const totalPages = computed(() => Math.max(1, Math.ceil(filtered.value.length / perPage)))
const paginated  = computed(() => filtered.value.slice((page.value-1)*perPage, page.value*perPage))

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' })
}
</script>
