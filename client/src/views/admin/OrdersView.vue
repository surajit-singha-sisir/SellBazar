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
                <button class="action-btn view" title="View details" @click="openDetail(o)">
                  <i class="fa-sharp fa-solid fa-eye"></i>
                </button>
                <button class="action-btn delete" title="Delete order" @click="confirmDelete(o)">
                  <i class="fa-sharp fa-solid fa-trash"></i>
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

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

    <!-- Order Detail Modal -->
    <Teleport to="body">
      <Transition name="modal-fade">
        <div v-if="selectedOrder" class="modal-backdrop" @click.self="selectedOrder = null">
          <div class="order-modal-box">

            <!-- Header -->
            <div class="order-modal-header">
              <div style="display:flex;align-items:center;gap:10px">
                <div class="order-modal-icon">
                  <i class="fa-sharp fa-solid fa-receipt"></i>
                </div>
                <div>
                  <div class="order-modal-title">Order #{{ selectedOrder.id.slice(-8).toUpperCase() }}</div>
                  <div class="order-modal-sub">{{ fmtDateFull(selectedOrder.createdAt) }}</div>
                </div>
              </div>
              <div style="display:flex;align-items:center;gap:8px">
                <button class="admin-btn primary" style="padding:7px 16px;font-size:12px;gap:6px" @click="printOrder(selectedOrder)">
                  <i class="fa-sharp fa-solid fa-print"></i> Print
                </button>
                <button class="admin-btn ghost" style="padding:6px 10px" @click="selectedOrder = null">
                  <i class="fa-sharp fa-solid fa-xmark fa-lg"></i>
                </button>
              </div>
            </div>

            <!-- Body -->
            <div class="order-modal-body">

              <!-- Row 1: Customer + Payment -->
              <div class="order-modal-grid-2">

                <!-- Customer -->
                <div class="order-info-card">
                  <div class="oic-label"><i class="fa-sharp fa-solid fa-user"></i> Customer</div>
                  <div class="oic-name">{{ selectedOrder.customer?.name ?? '—' }}</div>
                  <div class="oic-row" v-if="selectedOrder.customer?.email">
                    <i class="fa-sharp fa-solid fa-envelope"></i>
                    <a :href="'mailto:' + selectedOrder.customer.email">{{ selectedOrder.customer.email }}</a>
                  </div>
                  <div class="oic-row" v-if="selectedOrder.customer?.phone">
                    <i class="fa-sharp fa-solid fa-phone"></i>
                    <a :href="'tel:' + selectedOrder.customer.phone">{{ selectedOrder.customer.phone }}</a>
                  </div>
                  <div class="oic-row" v-if="selectedOrder.customer?.address">
                    <i class="fa-sharp fa-solid fa-location-dot"></i>
                    <span>{{ selectedOrder.customer.address }}</span>
                  </div>
                </div>

                <!-- Payment & status -->
                <div class="order-info-card">
                  <div class="oic-label"><i class="fa-sharp fa-solid fa-credit-card"></i> Payment & Status</div>
                  <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:10px">
                    <span class="status-badge processing" style="text-transform:capitalize;font-size:12px">{{ selectedOrder.paymentMethod }}</span>
                    <span class="status-badge" :class="selectedOrder.paymentStatus==='paid'?'delivered':'pending'" style="font-size:12px">{{ selectedOrder.paymentStatus }}</span>
                  </div>
                  <div class="oic-label" style="margin-top:8px"><i class="fa-sharp fa-solid fa-circle-half-stroke"></i> Update Order Status</div>
                  <div class="status-update-row">
                    <select class="status-select-lg" :class="detailStatus"
                      v-model="detailStatus"
                      :disabled="updatingId === selectedOrder.id">
                      <option v-for="s in statuses" :key="s" :value="s">{{ capitalize(s) }}</option>
                    </select>
                    <button class="admin-btn primary" style="padding:7px 14px;font-size:12px"
                      :disabled="detailStatus === selectedOrder.status || updatingId === selectedOrder.id"
                      @click="saveDetailStatus">
                      <i v-if="updatingId === selectedOrder.id" class="fa-solid fa-spinner-third fa-spin"></i>
                      <i v-else class="fa-sharp fa-solid fa-floppy-disk"></i>
                      Save
                    </button>
                  </div>
                  <div v-if="selectedOrder.trackingNumber" class="oic-row" style="margin-top:10px">
                    <i class="fa-sharp fa-solid fa-truck" style="color:var(--brand)"></i>
                    <span>{{ selectedOrder.trackingNumber }}</span>
                  </div>
                  <div v-if="selectedOrder.notes" class="oic-row" style="margin-top:6px;font-style:italic">
                    <i class="fa-sharp fa-solid fa-note-sticky"></i>
                    <span>{{ selectedOrder.notes }}</span>
                  </div>
                </div>
              </div>

              <!-- Row 2: Items table -->
              <div class="order-items-card">
                <div class="oic-label"><i class="fa-sharp fa-solid fa-box"></i> Order Items</div>
                <table class="order-items-table">
                  <thead>
                    <tr>
                      <th style="width:40px"></th>
                      <th>Product</th>
                      <th style="text-align:right">Unit Price</th>
                      <th style="text-align:center">Qty</th>
                      <th style="text-align:right">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="(item, idx) in selectedOrder.items" :key="idx">
                      <td>
                        <img v-if="item.image" :src="item.image" :alt="item.name" class="oitem-img" onerror="this.style.display='none'" />
                        <div v-else class="oitem-img-ph"><i class="fa-sharp fa-solid fa-box"></i></div>
                      </td>
                      <td class="oitem-name">{{ item.name }}</td>
                      <td style="text-align:right;font-size:13px">৳{{ item.price.toLocaleString() }}</td>
                      <td style="text-align:center;font-weight:700">{{ item.quantity }}</td>
                      <td style="text-align:right;font-weight:700;color:var(--brand)">৳{{ (item.price * item.quantity).toLocaleString() }}</td>
                    </tr>
                  </tbody>
                  <tfoot>
                    <tr>
                      <td colspan="3"></td>
                      <td style="font-size:12px;color:var(--text-secondary);text-align:right;padding:6px 12px">Subtotal</td>
                      <td style="text-align:right;padding:6px 12px;font-weight:700">৳{{ (selectedOrder.subtotal ?? selectedOrder.total).toLocaleString() }}</td>
                    </tr>
                    <tr v-if="selectedOrder.shipping">
                      <td colspan="3"></td>
                      <td style="font-size:12px;color:var(--text-secondary);text-align:right;padding:6px 12px">Shipping</td>
                      <td style="text-align:right;padding:6px 12px">৳{{ Number(selectedOrder.shipping).toLocaleString() }}</td>
                    </tr>
                    <tr class="total-row">
                      <td colspan="3"></td>
                      <td style="text-align:right;padding:8px 12px;font-weight:800;font-size:14px;color:var(--brand)">Total</td>
                      <td style="text-align:right;padding:8px 12px;font-weight:900;font-size:16px;color:var(--brand)">৳{{ selectedOrder.total.toLocaleString() }}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>

            </div><!-- /body -->
          </div>
        </div>
      </Transition>
    </Teleport>

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
const detailStatus  = ref<string>('')
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

function openDetail(o: ApiOrder) {
  selectedOrder.value = o
  detailStatus.value  = o.status
}

function fmtDateFull(d: string) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })
}

async function saveDetailStatus() {
  if (!selectedOrder.value) return
  const id     = selectedOrder.value.id
  const status = detailStatus.value
  updatingId.value = id
  try {
    await adminStore.updateOrder(id, { status: status as any })
    selectedOrder.value = { ...selectedOrder.value, status: status as any }
    showToast(`Status updated to ${status}`)
  } catch (e: any) {
    showToast(e.message ?? 'Update failed', 'error')
  } finally {
    updatingId.value = null
  }
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
  const win = window.open('', '_blank')
  if (!win) return
  const itemRows = o.items.map((item, i) => `
    <tr>
      <td style="color:#aaa;font-size:11px">${i + 1}</td>
      <td>${item.name}</td>
      <td style="text-align:right">৳${item.price.toLocaleString()}</td>
      <td style="text-align:center;font-weight:700">${item.quantity}</td>
      <td style="text-align:right;font-weight:700;color:#f97316">৳${(item.price * item.quantity).toLocaleString()}</td>
    </tr>`).join('')
  win.document.write(`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <title>Invoice #${o.id.slice(-8).toUpperCase()}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Segoe UI', system-ui, sans-serif; background: #f3f4f6; padding: 32px; color: #111; }
    .inv { background: #fff; border-radius: 12px; overflow: hidden; max-width: 780px; margin: 0 auto; box-shadow: 0 4px 24px rgba(0,0,0,0.1); }
    .inv-head { background: linear-gradient(135deg,#f97316,#d946ef); color: #fff; padding: 28px; display: flex; justify-content: space-between; align-items: flex-start; }
    .brand { font-size: 22px; font-weight: 900; letter-spacing: -0.03em; }
    .brand-sub { font-size: 11px; opacity: 0.8; margin-top: 3px; }
    .inv-no { text-align: right; }
    .inv-no-label { font-size: 13px; font-weight: 800; letter-spacing: 0.1em; opacity: 0.9; }
    .inv-no-val { font-size: 11px; opacity: 0.8; margin-top: 4px; }
    .inv-body { padding: 24px 28px; }
    .grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 24px; }
    .info-block h4 { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: #888; margin-bottom: 8px; }
    .info-block p { font-size: 13px; color: #444; line-height: 1.6; }
    .info-block .name { font-size: 15px; font-weight: 700; color: #111; margin-bottom: 4px; }
    .badge { display: inline-block; padding: 2px 10px; border-radius: 20px; font-size: 11px; font-weight: 700; text-transform: uppercase; }
    .badge-orange { background: #fff7ed; color: #c2410c; }
    .badge-green  { background: #f0fdf4; color: #15803d; }
    .badge-yellow { background: #fefce8; color: #a16207; }
    table { width: 100%; border-collapse: collapse; font-size: 13px; }
    thead th { padding: 8px 12px; text-align: left; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.07em; color: #888; background: #f8f8f8; border-bottom: 1px solid #eee; }
    tbody td { padding: 11px 12px; border-bottom: 1px solid #f0f0f0; color: #333; }
    tfoot td { padding: 7px 12px; font-size: 13px; color: #555; background: #fafafa; }
    .grand td { font-size: 15px; font-weight: 900; color: #f97316; border-top: 2px solid #f97316; }
    .inv-foot { background: #111; color: rgba(255,255,255,0.7); padding: 16px 28px; display: flex; justify-content: space-between; align-items: center; font-size: 12px; }
    .inv-foot .total { font-size: 24px; font-weight: 900; color: #f97316; }
    @media print { body { padding: 0; background: #fff; } .inv { box-shadow: none; border-radius: 0; } }
  </style>
</head>
<body>
  <div class="inv">
    <div class="inv-head">
      <div><div class="brand">SellBazar</div><div class="brand-sub">sellbazar.com</div></div>
      <div class="inv-no">
        <div class="inv-no-label">INVOICE</div>
        <div class="inv-no-val">#${o.id.slice(-8).toUpperCase()}</div>
        <div class="inv-no-val">${fmtDateFull(o.createdAt)}</div>
      </div>
    </div>
    <div class="inv-body">
      <div class="grid2">
        <div class="info-block">
          <h4>Bill To</h4>
          <div class="name">${o.customer?.name ?? '—'}</div>
          ${o.customer?.email ? `<p>${o.customer.email}</p>` : ''}
          ${o.customer?.phone ? `<p>${o.customer.phone}</p>` : ''}
          ${o.customer?.address ? `<p style="margin-top:4px">${o.customer.address}</p>` : ''}
        </div>
        <div class="info-block">
          <h4>Order Info</h4>
          <p><strong>Payment:</strong> ${o.paymentMethod}</p>
          <p style="margin-top:4px">
            <span class="badge ${o.paymentStatus==='paid'?'badge-green':'badge-yellow'}">${o.paymentStatus}</span>
            <span class="badge badge-orange" style="margin-left:6px">${o.status}</span>
          </p>
          ${o.trackingNumber ? `<p style="margin-top:8px">🚚 ${o.trackingNumber}</p>` : ''}
          ${o.notes ? `<p style="margin-top:6px;font-style:italic;color:#888">"${o.notes}"</p>` : ''}
        </div>
      </div>
      <table>
        <thead><tr><th>#</th><th>Product</th><th style="text-align:right">Unit Price</th><th style="text-align:center">Qty</th><th style="text-align:right">Subtotal</th></tr></thead>
        <tbody>${itemRows}</tbody>
        <tfoot>
          <tr><td colspan="3"></td><td style="text-align:right">Subtotal</td><td style="text-align:right;font-weight:700">৳${(o.subtotal ?? o.total).toLocaleString()}</td></tr>
          ${o.shipping ? `<tr><td colspan="3"></td><td style="text-align:right">Shipping</td><td style="text-align:right">৳${Number(o.shipping).toLocaleString()}</td></tr>` : ''}
          <tr class="grand"><td colspan="3"></td><td style="text-align:right">Total</td><td style="text-align:right">৳${o.total.toLocaleString()}</td></tr>
        </tfoot>
      </table>
    </div>
    <div class="inv-foot">
      <span>Thank you for shopping with SellBazar!</span>
      <div class="total">৳${o.total.toLocaleString()}</div>
    </div>
  </div>
</body>
</html>`)
  win.document.close()
  win.onload = () => { win.focus(); win.print(); }
  setTimeout(() => { try { win.focus(); win.print() } catch {} }, 800)
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
/* ── Action buttons in table ────────────────────────────────────────── */
.action-btn {
  width: 32px; height: 32px; border-radius: 8px; border: 1px solid var(--sidebar-border);
  display: inline-flex; align-items: center; justify-content: center;
  cursor: pointer; font-size: 13px; transition: all 0.15s;
  background: var(--surface);
}
.action-btn.view   { color: #3b82f6; }
.action-btn.view:hover   { background: rgba(59,130,246,0.12); border-color: #3b82f6; }
.action-btn.delete { color: #ef4444; }
.action-btn.delete:hover { background: rgba(239,68,68,0.12); border-color: #ef4444; }
.action-btn:active { transform: scale(0.92); }

/* ── Order detail modal ─────────────────────────────────────────────── */
.order-modal-box {
  background: var(--sidebar-bg); border: 1px solid var(--sidebar-border);
  border-radius: 18px; width: 100%; max-width: 820px;
  max-height: 88vh; display: flex; flex-direction: column;
  box-shadow: 0 24px 64px rgba(0,0,0,0.5); overflow: hidden;
}
.order-modal-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 18px 22px; border-bottom: 1px solid var(--sidebar-border);
  flex-shrink: 0; flex-wrap: wrap; gap: 10px;
}
.order-modal-icon {
  width: 40px; height: 40px; border-radius: 10px;
  background: rgba(249,115,22,0.12); color: var(--brand);
  display: flex; align-items: center; justify-content: center; font-size: 16px;
}
.order-modal-title { font-size: 16px; font-weight: 800; color: var(--text-primary); }
.order-modal-sub   { font-size: 12px; color: var(--text-secondary); margin-top: 2px; }
.order-modal-body  { overflow-y: auto; padding: 20px; flex: 1; display: flex; flex-direction: column; gap: 16px; }

/* ── Info cards inside modal ────────────────────────────────────────── */
.order-modal-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
@media (max-width: 640px) { .order-modal-grid-2 { grid-template-columns: 1fr; } }

.order-info-card {
  background: var(--surface); border: 1px solid var(--sidebar-border);
  border-radius: 12px; padding: 16px;
}
.oic-label {
  font-size: 10px; font-weight: 700; text-transform: uppercase;
  letter-spacing: 0.1em; color: var(--text-secondary);
  display: flex; align-items: center; gap: 6px; margin-bottom: 10px;
  i { color: var(--brand); font-size: 11px; }
}
.oic-name { font-size: 15px; font-weight: 700; color: var(--text-primary); margin-bottom: 8px; }
.oic-row  {
  display: flex; align-items: flex-start; gap: 8px;
  font-size: 12px; color: var(--text-secondary); margin-top: 5px; line-height: 1.5;
  i { color: var(--brand); font-size: 11px; flex-shrink: 0; margin-top: 2px; }
  a { color: var(--text-secondary); text-decoration: none; }
  a:hover { color: var(--brand); }
}

/* ── Status update row ──────────────────────────────────────────────── */
.status-update-row { display: flex; gap: 8px; align-items: center; margin-top: 8px; }
.status-select-lg {
  flex: 1; padding: 7px 10px; border-radius: 8px; font-size: 12px; font-weight: 700;
  border: 1px solid var(--sidebar-border); cursor: pointer; outline: none;
  background: var(--admin-bg); color: var(--text-primary);
  transition: border-color 0.15s;
}
.status-select-lg.pending    { border-color: #f59e0b; color: #f59e0b; }
.status-select-lg.processing { border-color: #3b82f6; color: #3b82f6; }
.status-select-lg.shipped    { border-color: #a855f7; color: #a855f7; }
.status-select-lg.delivered  { border-color: #22c55e; color: #22c55e; }
.status-select-lg.cancelled  { border-color: #ef4444; color: #ef4444; }

/* ── Items table inside modal ───────────────────────────────────────── */
.order-items-card {
  background: var(--surface); border: 1px solid var(--sidebar-border);
  border-radius: 12px; padding: 16px;
}
.order-items-table {
  width: 100%; border-collapse: collapse; font-size: 13px; margin-top: 10px;
}
.order-items-table thead th {
  padding: 8px 12px; text-align: left; font-size: 10px; font-weight: 700;
  text-transform: uppercase; letter-spacing: 0.07em; color: var(--text-secondary);
  background: var(--surface-hover); border-bottom: 1px solid var(--sidebar-border);
}
.order-items-table tbody td {
  padding: 10px 12px; border-bottom: 1px solid var(--sidebar-border);
  color: var(--text-primary); vertical-align: middle;
}
.order-items-table tfoot td { padding: 6px 12px; color: var(--text-secondary); }
.order-items-table .total-row td { border-top: 2px solid var(--brand); }
.oitem-img {
  width: 36px; height: 36px; border-radius: 7px;
  object-fit: cover; display: block;
}
.oitem-img-ph {
  width: 36px; height: 36px; border-radius: 7px;
  background: var(--surface-hover); display: flex;
  align-items: center; justify-content: center;
  font-size: 12px; color: var(--text-secondary);
}
.oitem-name { font-weight: 500; max-width: 260px; }
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
