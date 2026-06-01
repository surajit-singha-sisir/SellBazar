<template>
  <div class="admin-page-wrap">
    <div class="admin-page-header">
      <div>
        <h1 class="page-title">Orders</h1>
        <p class="page-subtitle">{{ filtered.length }} of {{ adminStore.orders.length }} orders</p>
      </div>
      <div style="display:flex;gap:8px;flex-wrap:wrap">
        <button class="admin-btn secondary" @click="adminStore.loadOrders()">
          <i class="fa-sharp fa-solid fa-arrows-rotate" :class="{'fa-spin': adminStore.loading.orders}"></i> Refresh
        </button>
        <div class="export-wrap" v-click-outside="() => exportOpen = false">
          <button class="admin-btn secondary" @click="exportOpen = !exportOpen">
            <i class="fa-sharp fa-solid fa-file-export"></i> Export <i class="fa-solid fa-chevron-down" style="font-size:10px"></i>
          </button>
          <div v-if="exportOpen" class="export-dropdown">
            <button @click="doExport('excel')"><i class="fa-solid fa-file-excel" style="color:#22c55e"></i> Excel (.xlsx)</button>
            <button @click="doExport('pdf')"><i class="fa-solid fa-file-pdf" style="color:#ef4444"></i> PDF</button>
            <button @click="doExport('csv')"><i class="fa-solid fa-file-csv" style="color:#3b82f6"></i> CSV</button>
            <button @click="doExport('json')"><i class="fa-solid fa-file-code" style="color:#a855f7"></i> JSON</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Filters -->
    <div class="admin-filters">
      <div class="search-wrap">
        <i class="fa-sharp fa-solid fa-magnifying-glass search-icon"></i>
        <input class="filter-input" v-model="search" placeholder="Search order ID, customer, email…" />
      </div>
      <select class="filter-select" v-model="statusFilter">
        <option value="">All Status</option>
        <option v-for="s in statuses" :key="s" :value="s">{{ capitalize(s) }}</option>
      </select>
      <select class="filter-select" v-model="payFilter">
        <option value="">All Payment</option>
        <option value="cod">COD</option>
        <option value="bkash">bKash</option>
        <option value="card">Card</option>
        <option value="nagad">Nagad</option>
      </select>
      <select class="filter-select" v-model="sortField">
        <option value="createdAt">Sort: Date</option>
        <option value="total">Sort: Total</option>
        <option value="status">Sort: Status</option>
      </select>
      <button class="admin-btn ghost" style="padding:8px 12px" @click="sortDir = sortDir==='asc'?'desc':'asc'" title="Toggle sort direction">
        <i :class="sortDir==='asc' ? 'fa-solid fa-sort-up' : 'fa-solid fa-sort-down'" style="color:var(--brand)"></i>
      </button>
    </div>

    <!-- Summary strip -->
    <div class="admin-grid-4" style="margin-bottom:20px">
      <div v-for="s in adminStore.revenueByStatus" :key="s.status" class="admin-stat-card" style="padding:14px 16px;gap:8px;cursor:pointer"
        :style="statusFilter===s.status?{borderColor:'var(--brand)'}:{}"
        @click="statusFilter = statusFilter===s.status?'':s.status">
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
          <th class="sortable" @click="setSortField('total')">Total <i class="fa-solid fa-sort" style="font-size:10px;opacity:0.4"></i></th>
          <th>Payment</th>
          <th>Status</th>
          <th class="sortable" @click="setSortField('createdAt')">Date <i class="fa-solid fa-sort" style="font-size:10px;opacity:0.4"></i></th>
          <th>Actions</th>
        </tr></thead>
        <tbody>
          <tr v-for="o in paginated" :key="o.id">
            <td>
              <span style="font-family:monospace;font-size:12px;font-weight:700;color:var(--brand)">#{{ o.id.slice(-8).toUpperCase() }}</span>
            </td>
            <td>
              <div style="font-size:13px;font-weight:600;color:var(--text-primary)">{{ o.customer?.name ?? '—' }}</div>
              <div style="font-size:11px;color:var(--text-secondary)">{{ o.customer?.email ?? o.customer?.phone ?? '' }}</div>
            </td>
            <td>
              <div style="font-size:12px;max-width:160px">
                <span v-for="(item, i) in (o.items ?? []).slice(0,2)" :key="i"
                  style="display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;color:var(--text-secondary)">
                  {{ item.quantity }}× {{ item.name }}
                </span>
                <span v-if="(o.items?.length ?? 0) > 2" style="font-size:11px;color:var(--brand)">+{{ o.items.length - 2 }} more</span>
              </div>
            </td>
            <td style="font-weight:700;color:var(--brand)">৳{{ o.total.toLocaleString() }}</td>
            <td>
              <div>
                <span class="status-badge processing" style="text-transform:capitalize">{{ o.paymentMethod }}</span>
                <div style="font-size:10px;margin-top:3px" :style="{color: o.paymentStatus==='paid'?'#22c55e':'#f97316'}">
                  {{ o.paymentStatus }}
                </div>
              </div>
            </td>
            <td>
              <!-- Inline status update -->
              <select class="status-select" :class="o.status"
                :value="o.status"
                @change="updateStatus(o.id, ($event.target as HTMLSelectElement).value)"
                :disabled="updatingId === o.id">
                <option v-for="s in statuses" :key="s" :value="s">{{ capitalize(s) }}</option>
              </select>
            </td>
            <td style="font-size:12px;color:var(--text-secondary);white-space:nowrap">{{ fmtDate(o.createdAt) }}</td>
            <td>
              <div style="display:flex;gap:5px">
                <button class="admin-btn ghost" style="padding:5px 8px" title="View details"
                  @click="selectedOrder = selectedOrder?.id === o.id ? null : o">
                  <i class="fa-sharp fa-solid fa-eye"></i>
                </button>
                <button class="admin-btn ghost" style="padding:5px 8px" title="Print" @click="printOrder(o)">
                  <i class="fa-sharp fa-solid fa-print"></i>
                </button>
                <button class="admin-btn danger" style="padding:5px 8px" title="Delete" @click="confirmDelete(o)">
                  <i class="fa-sharp fa-solid fa-trash"></i>
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
            Order #{{ selectedOrder.id.slice(-8).toUpperCase() }}
          </h3>
          <div style="display:flex;gap:8px">
            <button class="admin-btn ghost" style="padding:5px 10px;font-size:12px" @click="printOrder(selectedOrder)">
              <i class="fa-sharp fa-solid fa-print"></i> Print
            </button>
            <button class="admin-btn ghost" style="padding:4px 8px" @click="selectedOrder = null">
              <i class="fa-solid fa-xmark"></i>
            </button>
          </div>
        </div>
        <div class="order-detail-grid">
          <div>
            <div class="detail-section-label">Customer</div>
            <div style="font-size:13px;font-weight:600">{{ selectedOrder.customer?.name }}</div>
            <div style="font-size:12px;color:var(--text-secondary)">{{ selectedOrder.customer?.email }}</div>
            <div style="font-size:12px;color:var(--text-secondary)">{{ selectedOrder.customer?.phone }}</div>
            <div style="font-size:12px;color:var(--text-secondary);margin-top:4px;line-height:1.5">{{ selectedOrder.customer?.address }}</div>
          </div>
          <div>
            <div class="detail-section-label">Payment & Shipping</div>
            <div style="font-size:13px;font-weight:600;text-transform:capitalize">{{ selectedOrder.paymentMethod }}</div>
            <span class="status-badge" :class="selectedOrder.paymentStatus === 'paid' ? 'delivered' : 'pending'">
              {{ selectedOrder.paymentStatus }}
            </span>
            <div v-if="selectedOrder.trackingNumber" style="font-size:12px;color:var(--text-secondary);margin-top:6px">
              <i class="fa-solid fa-truck" style="color:var(--brand)"></i> {{ selectedOrder.trackingNumber }}
            </div>
            <div v-if="selectedOrder.notes" style="font-size:12px;color:var(--text-secondary);margin-top:6px;font-style:italic">
              "{{ selectedOrder.notes }}"
            </div>
          </div>
          <div>
            <div class="detail-section-label">Items</div>
            <div v-for="item in selectedOrder.items" :key="item.name"
              style="display:flex;justify-content:space-between;font-size:12px;padding:4px 0;border-bottom:1px solid var(--sidebar-border)">
              <span style="color:var(--text-secondary)">{{ item.quantity }}× {{ item.name }}</span>
              <span style="font-weight:600">৳{{ (item.price * item.quantity).toLocaleString() }}</span>
            </div>
            <div style="display:flex;justify-content:space-between;font-size:12px;color:var(--text-secondary);margin-top:6px">
              <span>Shipping</span><span>৳{{ selectedOrder.shipping?.toLocaleString() ?? 0 }}</span>
            </div>
            <div style="display:flex;justify-content:space-between;font-size:14px;font-weight:800;margin-top:6px;color:var(--brand)">
              <span>Total</span><span>৳{{ selectedOrder.total.toLocaleString() }}</span>
            </div>
          </div>
        </div>
      </div>
    </Transition>

    <!-- Pagination -->
    <div style="display:flex;align-items:center;justify-content:space-between;margin-top:14px;flex-wrap:wrap;gap:8px">
      <span style="font-size:12px;color:var(--text-secondary)">
        Showing {{ filtered.length ? (page-1)*perPage+1 : 0 }}–{{ Math.min(page*perPage,filtered.length) }} of {{ filtered.length }}
      </span>
      <div style="display:flex;gap:6px;align-items:center">
        <select class="filter-select" v-model.number="perPage" style="padding:4px 8px;font-size:12px">
          <option :value="15">15 / page</option>
          <option :value="30">30 / page</option>
          <option :value="50">50 / page</option>
        </select>
        <button class="admin-btn secondary" style="padding:6px 12px" :disabled="page===1" @click="page--">
          <i class="fa-solid fa-chevron-left"></i>
        </button>
        <span style="padding:6px 12px;font-size:13px;font-weight:600;color:var(--brand)">{{ page }} / {{ totalPages }}</span>
        <button class="admin-btn secondary" style="padding:6px 12px" :disabled="page>=totalPages" @click="page++">
          <i class="fa-solid fa-chevron-right"></i>
        </button>
      </div>
    </div>

    <!-- Delete confirm -->
    <Teleport to="body">
      <Transition name="modal-fade">
        <div v-if="deleteTarget" class="modal-backdrop" @click.self="deleteTarget = null">
          <div class="confirm-dialog">
            <div class="confirm-icon"><i class="fa-sharp-duotone fa-solid fa-trash-can"></i></div>
            <h3 class="confirm-title">Delete Order?</h3>
            <p class="confirm-body">Order <strong>#{{ deleteTarget.id.slice(-8).toUpperCase() }}</strong> will be permanently removed.</p>
            <div class="confirm-actions">
              <button class="admin-btn secondary" @click="deleteTarget=null" :disabled="adminStore.loading.saving">Cancel</button>
              <button class="admin-btn danger" style="flex:1" @click="doDelete" :disabled="adminStore.loading.saving">
                <i v-if="adminStore.loading.saving" class="fa-solid fa-spinner-third fa-spin"></i>
                <i v-else class="fa-sharp fa-solid fa-trash"></i>
                {{ adminStore.loading.saving ? 'Deleting…' : 'Delete' }}
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- Toast -->
    <Teleport to="body">
      <Transition name="toast-slide">
        <div v-if="toast.show" class="admin-toast" :class="toast.type">
          <i :class="toast.type==='success'?'fa-solid fa-circle-check':'fa-solid fa-circle-exclamation'"></i>
          {{ toast.message }}
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useAdminStore } from '@/stores/useAdminStore'
import { useExport } from '@/composables/useExport'
import type { ApiOrder } from '@/composables/useAdminApi'

const adminStore = useAdminStore()
const exporter   = useExport()

const search       = ref('')
const statusFilter = ref('')
const payFilter    = ref('')
const sortField    = ref('createdAt')
const sortDir      = ref<'asc'|'desc'>('desc')
const page         = ref(1)
const perPage      = ref(15)
const exportOpen   = ref(false)
const selectedOrder = ref<ApiOrder | null>(null)
const deleteTarget  = ref<ApiOrder | null>(null)
const updatingId    = ref<string | null>(null)
const toast = ref({ show: false, message: '', type: 'success' as 'success'|'error' })
let toastTimer = 0

const statuses = ['pending','processing','shipped','delivered','cancelled']
const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

watch([search, statusFilter, payFilter, sortField, sortDir, perPage], () => { page.value = 1 })

function setSortField(f: string) {
  if (sortField.value === f) sortDir.value = sortDir.value === 'asc' ? 'desc' : 'asc'
  else { sortField.value = f; sortDir.value = 'desc' }
}

const filtered = computed(() => {
  let list = [...adminStore.orders]
  if (search.value) {
    const q = search.value.toLowerCase()
    list = list.filter(o =>
      o.id.toLowerCase().includes(q) ||
      o.customer?.name?.toLowerCase().includes(q) ||
      o.customer?.email?.toLowerCase().includes(q) ||
      o.customer?.phone?.includes(q)
    )
  }
  if (statusFilter.value) list = list.filter(o => o.status === statusFilter.value)
  if (payFilter.value) list = list.filter(o => o.paymentMethod.toLowerCase().includes(payFilter.value))

  list.sort((a: any, b: any) => {
    const av = a[sortField.value] ?? ''
    const bv = b[sortField.value] ?? ''
    const cmp = typeof av === 'number' ? av - bv : String(av).localeCompare(String(bv))
    return sortDir.value === 'asc' ? cmp : -cmp
  })
  return list
})

const totalPages = computed(() => Math.max(1, Math.ceil(filtered.value.length / perPage.value)))
const paginated  = computed(() => filtered.value.slice((page.value-1)*perPage.value, page.value*perPage.value))

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' })
}

function showToast(msg: string, type: 'success'|'error' = 'success') {
  clearTimeout(toastTimer)
  toast.value = { show: true, message: msg, type }
  toastTimer = window.setTimeout(() => { toast.value.show = false }, 3500)
}

async function updateStatus(id: string, status: string) {
  updatingId.value = id
  try {
    await adminStore.updateOrder(id, { status: status as any })
    showToast(`Status updated to ${status}`)
  } catch (e: any) { showToast(e.message ?? 'Update failed', 'error') }
  finally { updatingId.value = null }
}

function confirmDelete(o: ApiOrder) { deleteTarget.value = o }
async function doDelete() {
  if (!deleteTarget.value) return
  try {
    await adminStore.deleteOrder(deleteTarget.value.id)
    if (selectedOrder.value?.id === deleteTarget.value.id) selectedOrder.value = null
    deleteTarget.value = null
    showToast('Order deleted')
  } catch (e: any) { deleteTarget.value = null; showToast(e.message ?? 'Delete failed', 'error') }
}

function printOrder(o: ApiOrder) {
  const w = window.open('', '_blank')
  if (!w) return
  w.document.write(`<html><head><title>Order ${o.id}</title>
  <style>body{font-family:sans-serif;padding:24px;max-width:600px;margin:0 auto}h1{font-size:18px}table{width:100%;border-collapse:collapse;margin-top:12px}td,th{border:1px solid #ddd;padding:8px;font-size:13px}th{background:#f97316;color:white}</style>
  </head><body>
  <h1>SellBazar — Order #${o.id.slice(-8).toUpperCase()}</h1>
  <p><strong>Date:</strong> ${fmtDate(o.createdAt)}</p>
  <p><strong>Customer:</strong> ${o.customer?.name} | ${o.customer?.phone}</p>
  <p><strong>Address:</strong> ${o.customer?.address}</p>
  <p><strong>Payment:</strong> ${o.paymentMethod} (${o.paymentStatus})</p>
  <p><strong>Status:</strong> ${o.status}</p>
  <table><thead><tr><th>Item</th><th>Qty</th><th>Price</th><th>Total</th></tr></thead><tbody>
  ${o.items.map(i=>`<tr><td>${i.name}</td><td>${i.quantity}</td><td>৳${i.price}</td><td>৳${i.price*i.quantity}</td></tr>`).join('')}
  </tbody></table>
  <p style="text-align:right;font-size:16px;font-weight:bold;margin-top:12px">Grand Total: ৳${o.total.toLocaleString()}</p>
  <script>window.print()<\/script></body></html>`)
  w.document.close()
}

function doExport(fmt: 'excel'|'pdf'|'csv'|'json') {
  exportOpen.value = false
  const data = filtered.value.map(o => ({
    OrderID: o.id,
    Customer: o.customer?.name ?? '',
    Email: o.customer?.email ?? '',
    Phone: o.customer?.phone ?? '',
    Address: o.customer?.address ?? '',
    Items: o.items?.map(i => `${i.quantity}x ${i.name}`).join('; ') ?? '',
    Subtotal: o.subtotal, Shipping: o.shipping, Total: o.total,
    Payment: o.paymentMethod, PaymentStatus: o.paymentStatus,
    Status: o.status, Date: fmtDate(o.createdAt),
  }))
  const filename = `orders_${new Date().toISOString().slice(0,10)}`
  if (fmt === 'excel') exporter.exportExcel(data, filename, 'Orders')
  else if (fmt === 'csv') exporter.exportCSV(data, filename)
  else if (fmt === 'json') exporter.exportJSON(data, filename)
  else exporter.exportPDF(
    ['Order ID','Customer','Total','Payment','Status','Date'],
    filtered.value.map(o => [o.id.slice(-8), o.customer?.name??'', `৳${o.total}`, o.paymentMethod, o.status, fmtDate(o.createdAt)]),
    filename, 'SellBazar — Orders Export'
  )
}

const vClickOutside = {
  mounted(el: any, binding: any) {
    el._clickHandler = (e: Event) => { if (!el.contains(e.target)) binding.value(e) }
    document.addEventListener('click', el._clickHandler)
  },
  unmounted(el: any) { document.removeEventListener('click', el._clickHandler) }
}
</script>

<style scoped>
.status-select {
  padding: 4px 8px; border-radius: 8px; font-size: 11px; font-weight: 700;
  border: 1px solid var(--sidebar-border); cursor: pointer; outline: none;
  background: var(--admin-bg); color: var(--text-primary); transition: border-color 0.15s;
}
.status-select.pending    { border-color: #f59e0b; color: #f59e0b; }
.status-select.processing { border-color: #3b82f6; color: #3b82f6; }
.status-select.shipped    { border-color: #a855f7; color: #a855f7; }
.status-select.delivered  { border-color: #22c55e; color: #22c55e; }
.status-select.cancelled  { border-color: #ef4444; color: #ef4444; }
.export-wrap { position: relative; }
.export-dropdown {
  position: absolute; top: calc(100% + 6px); right: 0; z-index: 200;
  background: var(--sidebar-bg); border: 1px solid var(--sidebar-border);
  border-radius: 10px; box-shadow: 0 8px 32px rgba(0,0,0,0.25);
  min-width: 160px; overflow: hidden;
}
.export-dropdown button {
  display: flex; align-items: center; gap: 10px; width: 100%;
  padding: 10px 14px; background: none; border: none;
  color: var(--text-primary); font-size: 13px; cursor: pointer; text-align: left;
  transition: background 0.15s;
}
.export-dropdown button:hover { background: var(--surface-hover); }
.sortable { cursor: pointer; user-select: none; }
.sortable:hover { color: var(--brand); }
.order-detail-panel {
  background: var(--surface); border: 1px solid var(--sidebar-border);
  border-radius: 14px; padding: 20px; margin-top: 16px;
}
.order-detail-grid { display: grid; grid-template-columns: 1fr 1fr 1.5fr; gap: 20px; }
@media (max-width: 768px) { .order-detail-grid { grid-template-columns: 1fr; } }
.detail-section-label { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: var(--text-secondary); margin-bottom: 8px; }
.confirm-dialog { background: var(--sidebar-bg); border: 1px solid var(--sidebar-border); border-radius: 18px; padding: 32px; width: 100%; max-width: 380px; text-align: center; box-shadow: 0 24px 64px rgba(0,0,0,0.4); }
.confirm-icon { width: 60px; height: 60px; margin: 0 auto 16px; background: rgba(239,68,68,0.1); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 26px; color: #ef4444; }
.confirm-title { font-size: 18px; font-weight: 800; color: var(--text-primary); margin: 0 0 10px; }
.confirm-body { font-size: 13px; color: var(--text-secondary); line-height: 1.6; margin: 0 0 24px; }
.confirm-actions { display: flex; gap: 10px; }
.modal-backdrop { position: fixed; inset: 0; background: rgba(0,0,0,0.65); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; z-index: 9999; padding: 16px; }
.modal-fade-enter-active, .modal-fade-leave-active { transition: opacity 0.2s ease; }
.modal-fade-enter-from, .modal-fade-leave-to { opacity: 0; }
.admin-toast { position: fixed; bottom: 28px; right: 28px; z-index: 10000; display: flex; align-items: center; gap: 10px; padding: 13px 18px; border-radius: 12px; font-size: 14px; font-weight: 600; color: white; box-shadow: 0 8px 32px rgba(0,0,0,0.3); }
.admin-toast.success { background: #16a34a; }
.admin-toast.error   { background: #dc2626; }
.toast-slide-enter-active { animation: toast-in 0.25s ease; }
.toast-slide-leave-active { animation: toast-in 0.2s ease reverse; }
@keyframes toast-in { from { transform: translateY(16px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
.slide-up-enter-active, .slide-up-leave-active { transition: opacity 0.2s, transform 0.2s; }
.slide-up-enter-from, .slide-up-leave-to { opacity: 0; transform: translateY(10px); }
</style>
