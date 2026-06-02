<template>
  <div class="admin-page-wrap">
    <div class="admin-page-header">
      <div>
        <h1 class="page-title">Reports</h1>
        <p class="page-subtitle">Business summary across sales, orders, and products</p>
      </div>
      <div style="display:flex;gap:8px;align-items:center">
        <select class="rp-select" v-model="period">
          <option value="7">Last 7 days</option>
          <option value="30">Last 30 days</option>
          <option value="90">Last 90 days</option>
          <option value="all">All time</option>
        </select>
        <div class="rp-export-wrap" ref="exportMenuRef">
          <button class="admin-btn primary" @click="exportMenuOpen = !exportMenuOpen">
            <i class="fa-sharp fa-solid fa-download"></i> Export
            <i class="fa-solid fa-chevron-down" style="font-size:10px;margin-left:2px"></i>
          </button>
          <Transition name="rp-dropdown">
            <div v-if="exportMenuOpen" class="rp-export-menu">
              <button v-for="fmt in exportFormats" :key="fmt.id"
                class="rp-export-item" @click="runExport(fmt.id)">
                <span class="rp-export-icon" :style="`background:${fmt.bg}`">
                  <i :class="fmt.icon" :style="`color:${fmt.color}`"></i>
                </span>
                <div>
                  <div class="rp-export-label">{{ fmt.label }}</div>
                  <div class="rp-export-desc">{{ fmt.desc }}</div>
                </div>
              </button>
            </div>
          </Transition>
        </div>
      </div>
    </div>

    <!-- KPI cards -->
    <div class="rp-kpi-grid">
      <div class="rp-kpi-card" v-for="kpi in kpis" :key="kpi.label">
        <div class="rp-kpi-icon" :style="`background:${kpi.bg}`">
          <i :class="kpi.icon" :style="`color:${kpi.color}`"></i>
        </div>
        <div class="rp-kpi-body">
          <div class="rp-kpi-value">{{ kpi.value }}</div>
          <div class="rp-kpi-label">{{ kpi.label }}</div>
        </div>
        <div class="rp-kpi-trend" :class="kpi.up ? 'up' : 'down'">
          <i :class="kpi.up ? 'fa-solid fa-arrow-trend-up' : 'fa-solid fa-arrow-trend-down'"></i>
          {{ kpi.trend }}
        </div>
      </div>
    </div>

    <div class="rp-grid">
      <!-- Sales by status -->
      <div class="rp-card">
        <div class="rp-card-title">
          <i class="fa-sharp-duotone fa-solid fa-chart-pie text-orange-400"></i>
          Orders by Status
        </div>
        <div class="rp-status-list">
          <div v-for="s in statusBreakdown" :key="s.label" class="rp-status-row">
            <div class="rp-status-info">
              <span class="rp-status-dot" :style="`background:${s.color}`"></span>
              <span class="rp-status-label">{{ s.label }}</span>
            </div>
            <div class="rp-status-bar-wrap">
              <div class="rp-status-bar" :style="`width:${s.pct}%;background:${s.color}`"></div>
            </div>
            <span class="rp-status-count">{{ s.count }}</span>
          </div>
        </div>
      </div>

      <!-- Top products -->
      <div class="rp-card">
        <div class="rp-card-title">
          <i class="fa-sharp-duotone fa-solid fa-box-open text-blue-400"></i>
          Top Products by Revenue
        </div>
        <div class="rp-table-wrap">
          <table class="rp-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Product</th>
                <th>Qty Sold</th>
                <th>Revenue</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(p, i) in topProducts" :key="p.name">
                <td class="rp-rank">{{ i + 1 }}</td>
                <td class="rp-product-name">{{ p.name }}</td>
                <td>{{ p.qty }}</td>
                <td class="rp-revenue">৳{{ p.revenue.toLocaleString() }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Payment methods -->
      <div class="rp-card">
        <div class="rp-card-title">
          <i class="fa-sharp-duotone fa-solid fa-credit-card text-purple-400"></i>
          Payment Methods
        </div>
        <div class="rp-payment-list">
          <div v-for="pm in paymentBreakdown" :key="pm.method" class="rp-payment-row">
            <div class="rp-payment-left">
              <i :class="pm.icon" :style="`color:${pm.color}`"></i>
              <span>{{ pm.method }}</span>
            </div>
            <div class="rp-payment-right">
              <span class="rp-payment-count">{{ pm.count }} orders</span>
              <span class="rp-payment-amt">৳{{ pm.total.toLocaleString() }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Recent activity -->
      <div class="rp-card">
        <div class="rp-card-title">
          <i class="fa-sharp-duotone fa-solid fa-clock-rotate-left text-green-400"></i>
          Recent Orders
        </div>
        <div class="rp-table-wrap">
          <table class="rp-table">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Customer</th>
                <th>Total</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="o in recentOrders" :key="o.id">
                <td class="rp-order-id">{{ o.id }}</td>
                <td>{{ o.customer.name }}</td>
                <td class="rp-revenue">৳{{ o.total.toLocaleString() }}</td>
                <td><span class="rp-badge" :class="`rp-badge-${o.status}`">{{ o.status }}</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useAdminStore } from '@/stores/useAdminStore'
import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

const adminStore = useAdminStore()
const period = ref('30')
const exportMenuOpen = ref(false)
const exportMenuRef  = ref<HTMLElement | null>(null)
const reportRef      = ref<HTMLElement | null>(null)

const orders   = computed(() => adminStore.orders   ?? [])
const products = computed(() => adminStore.products ?? [])

// Close dropdown on outside click
function onDocClick(e: MouseEvent) {
  if (exportMenuRef.value && !exportMenuRef.value.contains(e.target as Node))
    exportMenuOpen.value = false
}
onMounted(() => document.addEventListener('click', onDocClick))
onUnmounted(() => document.removeEventListener('click', onDocClick))

// ── Export formats ────────────────────────────────────────────────────────
const exportFormats = [
  { id: 'csv',   label: 'CSV',         desc: 'Comma-separated values',    icon: 'fa-solid fa-file-csv',          color: '#16a34a', bg: 'rgba(22,163,74,0.12)'    },
  { id: 'excel', label: 'Excel',       desc: 'Microsoft Excel (.xlsx)',    icon: 'fa-solid fa-file-excel',        color: '#1d6f42', bg: 'rgba(29,111,66,0.12)'    },
  { id: 'pdf',   label: 'PDF',         desc: 'Printable document',         icon: 'fa-solid fa-file-pdf',          color: '#dc2626', bg: 'rgba(220,38,38,0.12)'    },
  { id: 'json',  label: 'JSON',        desc: 'Raw structured data',        icon: 'fa-solid fa-file-code',         color: '#f59e0b', bg: 'rgba(245,158,11,0.12)'   },
  { id: 'png',   label: 'Image (PNG)', desc: 'Screenshot of this page',    icon: 'fa-solid fa-file-image',        color: '#8b5cf6', bg: 'rgba(139,92,246,0.12)'   },
]

// ── Shared data rows ──────────────────────────────────────────────────────
const headers = ['Order ID', 'Customer', 'Email', 'Phone', 'Total (BDT)', 'Status', 'Payment', 'Date']
function getRows() {
  return orders.value.map(o => [
    o.id,
    o.customer.name,
    o.customer.email,
    o.customer.phone,
    o.total,
    o.status,
    o.paymentMethod,
    new Date(o.createdAt).toLocaleDateString('en-BD'),
  ])
}

// ── Dispatch ──────────────────────────────────────────────────────────────
function runExport(id: string) {
  exportMenuOpen.value = false
  if (id === 'csv')   exportCSV()
  if (id === 'excel') exportExcel()
  if (id === 'pdf')   exportPDF()
  if (id === 'json')  exportJSON()
  if (id === 'png')   exportPNG()
}

// ── CSV ───────────────────────────────────────────────────────────────────
function exportCSV() {
  const csv = [headers, ...getRows()].map(r => r.join(',')).join('\n')
  download(new Blob([csv], { type: 'text/csv' }), 'sellbazar-report.csv')
}

// ── Excel ─────────────────────────────────────────────────────────────────
function exportExcel() {
  const wb = XLSX.utils.book_new()

  // Orders sheet
  const wsOrders = XLSX.utils.aoa_to_sheet([headers, ...getRows()])
  XLSX.utils.book_append_sheet(wb, wsOrders, 'Orders')

  // Top Products sheet
  const productHeaders = ['Product', 'Qty Sold', 'Revenue (BDT)']
  const productRows = topProducts.value.map(p => [p.name, p.qty, p.revenue])
  const wsProducts = XLSX.utils.aoa_to_sheet([productHeaders, ...productRows])
  XLSX.utils.book_append_sheet(wb, wsProducts, 'Top Products')

  // Summary sheet
  const paid    = orders.value.filter(o => o.paymentStatus === 'paid')
  const revenue = paid.reduce((s, o) => s + o.total, 0)
  const wsSummary = XLSX.utils.aoa_to_sheet([
    ['Metric', 'Value'],
    ['Total Revenue (BDT)', revenue],
    ['Total Orders', orders.value.length],
    ['Paid Orders', paid.length],
    ['Total Products', products.value.length],
    ['Generated At', new Date().toLocaleString()],
  ])
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Summary')

  XLSX.writeFile(wb, 'sellbazar-report.xlsx')
}

// ── PDF ───────────────────────────────────────────────────────────────────
function exportPDF() {
  const doc = new jsPDF({ orientation: 'landscape' })
  const paid    = orders.value.filter(o => o.paymentStatus === 'paid')
  const revenue = paid.reduce((s, o) => s + o.total, 0)

  // Header
  doc.setFillColor(249, 115, 22)
  doc.rect(0, 0, 297, 18, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(13)
  doc.setFont('helvetica', 'bold')
  doc.text('SellBazar — Orders Report', 10, 12)
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.text(`Generated: ${new Date().toLocaleString()}`, 220, 12)

  // KPI summary row
  doc.setTextColor(40, 40, 40)
  doc.setFontSize(9)
  doc.text(`Total Revenue: BDT ${revenue.toLocaleString()}`, 10, 26)
  doc.text(`Total Orders: ${orders.value.length}`, 80, 26)
  doc.text(`Paid Orders: ${paid.length}`, 140, 26)
  doc.text(`Products: ${products.value.length}`, 200, 26)

  // Orders table
  autoTable(doc, {
    head: [headers],
    body: getRows(),
    startY: 32,
    styles: { fontSize: 8, cellPadding: 3 },
    headStyles: { fillColor: [249, 115, 22], textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [250, 250, 250] },
  })

  // Top products table on next page
  doc.addPage()
  doc.setFillColor(249, 115, 22)
  doc.rect(0, 0, 297, 18, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(13)
  doc.setFont('helvetica', 'bold')
  doc.text('SellBazar — Top Products by Revenue', 10, 12)

  autoTable(doc, {
    head: [['#', 'Product', 'Qty Sold', 'Revenue (BDT)']],
    body: topProducts.value.map((p, i) => [i + 1, p.name, p.qty, `BDT ${p.revenue.toLocaleString()}`]),
    startY: 24,
    styles: { fontSize: 9, cellPadding: 3 },
    headStyles: { fillColor: [249, 115, 22], textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [250, 250, 250] },
  })

  doc.save('sellbazar-report.pdf')
}

// ── JSON ──────────────────────────────────────────────────────────────────
function exportJSON() {
  const paid    = orders.value.filter(o => o.paymentStatus === 'paid')
  const revenue = paid.reduce((s, o) => s + o.total, 0)
  const payload = {
    generatedAt: new Date().toISOString(),
    summary: {
      totalRevenue: revenue,
      totalOrders: orders.value.length,
      paidOrders: paid.length,
      totalProducts: products.value.length,
    },
    orders: orders.value,
    topProducts: topProducts.value,
    paymentBreakdown: paymentBreakdown.value,
    statusBreakdown: statusBreakdown.value,
  }
  download(
    new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' }),
    'sellbazar-report.json'
  )
}

// ── PNG (html2canvas via CDN) ─────────────────────────────────────────────
async function exportPNG() {
  const h2c = (window as any).html2canvas
  if (!h2c) {
    alert('html2canvas not loaded. Please refresh and try again.')
    return
  }
  const el = document.querySelector('.admin-page-wrap') as HTMLElement
  if (!el) return
  const canvas = await h2c(el, { scale: 2, useCORS: true, backgroundColor: '#0f0f17' })
  const a = document.createElement('a')
  a.href = canvas.toDataURL('image/png')
  a.download = 'sellbazar-report.png'
  a.click()
}

// ── Helper ────────────────────────────────────────────────────────────────
function download(blob: Blob, name: string) {
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = name
  a.click()
  URL.revokeObjectURL(a.href)
}

// ── KPIs ──────────────────────────────────────────────────────────────────
const kpis = computed(() => {
  const paid    = orders.value.filter(o => o.paymentStatus === 'paid')
  const revenue = paid.reduce((s, o) => s + o.total, 0)
  const avg     = paid.length ? Math.round(revenue / paid.length) : 0
  return [
    { label: 'Total Revenue',   value: `৳${revenue.toLocaleString()}`, icon: 'fa-sharp-duotone fa-solid fa-coins',          color: '#f97316', bg: 'rgba(249,115,22,0.12)',  trend: '+12%', up: true  },
    { label: 'Total Orders',    value: orders.value.length,            icon: 'fa-sharp-duotone fa-solid fa-bag-shopping',   color: '#3b82f6', bg: 'rgba(59,130,246,0.12)',  trend: '+8%',  up: true  },
    { label: 'Avg Order Value', value: `৳${avg.toLocaleString()}`,     icon: 'fa-sharp-duotone fa-solid fa-chart-line',     color: '#8b5cf6', bg: 'rgba(139,92,246,0.12)',  trend: '+3%',  up: true  },
    { label: 'Total Products',  value: products.value.length,          icon: 'fa-sharp-duotone fa-solid fa-box-open',       color: '#22c55e', bg: 'rgba(34,197,94,0.12)',   trend: '+5%',  up: true  },
  ]
})

// ── Status breakdown ──────────────────────────────────────────────────────
const statusBreakdown = computed(() => {
  const map: Record<string, { color: string }> = {
    delivered:  { color: '#22c55e' },
    shipped:    { color: '#3b82f6' },
    processing: { color: '#8b5cf6' },
    pending:    { color: '#f59e0b' },
    cancelled:  { color: '#ef4444' },
  }
  const total = orders.value.length || 1
  return Object.entries(map).map(([label, { color }]) => {
    const count = orders.value.filter(o => o.status === label).length
    return { label: label.charAt(0).toUpperCase() + label.slice(1), count, color, pct: Math.round((count / total) * 100) }
  }).filter(s => s.count > 0)
})

// ── Top products ──────────────────────────────────────────────────────────
const topProducts = computed(() => {
  const map: Record<string, { name: string; qty: number; revenue: number }> = {}
  for (const o of orders.value) {
    for (const item of o.items) {
      if (!map[item.name]) map[item.name] = { name: item.name, qty: 0, revenue: 0 }
      map[item.name].qty     += item.quantity
      map[item.name].revenue += item.price * item.quantity
    }
  }
  return Object.values(map).sort((a, b) => b.revenue - a.revenue).slice(0, 6)
})

// ── Payment breakdown ────────────────────────────────────────────────────
const paymentBreakdown = computed(() => {
  const icons: Record<string, { icon: string; color: string }> = {
    bkash:         { icon: 'fa-solid fa-mobile-screen-button', color: '#e2136e' },
    nagad:         { icon: 'fa-solid fa-wallet',               color: '#f7931e' },
    rocket:        { icon: 'fa-solid fa-rocket',               color: '#8b3fcd' },
    cod:           { icon: 'fa-solid fa-money-bill-wave',      color: '#22c55e' },
    card:          { icon: 'fa-regular fa-credit-card',        color: '#1a1f71' },
    bank_transfer: { icon: 'fa-solid fa-building-columns',     color: '#0ea5e9' },
  }
  const map: Record<string, { count: number; total: number }> = {}
  for (const o of orders.value) {
    const pm = o.paymentMethod ?? 'cod'
    if (!map[pm]) map[pm] = { count: 0, total: 0 }
    map[pm].count++
    map[pm].total += o.total
  }
  return Object.entries(map)
    .map(([method, { count, total }]) => ({
      method: method.charAt(0).toUpperCase() + method.slice(1).replace('_', ' '),
      count, total,
      ...(icons[method] ?? { icon: 'fa-solid fa-circle-dollar', color: '#6b7280' }),
    }))
    .sort((a, b) => b.total - a.total)
})

// ── Recent orders ────────────────────────────────────────────────────────
const recentOrders = computed(() =>
  [...orders.value]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 7)
)
</script>

<style scoped>
/* Export dropdown */
.rp-export-wrap { position: relative; }
.rp-export-menu {
  position: absolute; top: calc(100% + 8px); right: 0; z-index: 500;
  background: var(--sidebar-bg); border: 1px solid var(--sidebar-border);
  border-radius: 13px; min-width: 220px;
  box-shadow: 0 16px 48px rgba(0,0,0,0.25); overflow: hidden; padding: 6px;
}
.rp-export-item {
  display: flex; align-items: center; gap: 12px; width: 100%;
  padding: 9px 10px; border: none; background: transparent;
  border-radius: 9px; cursor: pointer; text-align: left;
  transition: background 0.15s;
}
.rp-export-item:hover { background: var(--surface-hover); }
.rp-export-icon {
  width: 34px; height: 34px; border-radius: 9px; flex-shrink: 0;
  display: flex; align-items: center; justify-content: center; font-size: 14px;
}
.rp-export-label { font-size: 13px; font-weight: 600; color: var(--text-primary); }
.rp-export-desc  { font-size: 11px; color: var(--text-secondary); margin-top: 1px; }
.rp-dropdown-enter-active, .rp-dropdown-leave-active { transition: opacity 0.15s ease, transform 0.15s ease; }
.rp-dropdown-enter-from, .rp-dropdown-leave-to { opacity: 0; transform: translateY(-6px) scale(0.97); }

.rp-select {
  padding: 8px 12px; background: var(--sidebar-bg);
  border: 1px solid var(--sidebar-border); border-radius: 9px;
  color: var(--text-primary); font-size: 13px; outline: none; cursor: pointer;
}
.rp-kpi-grid {
  display: grid; grid-template-columns: repeat(4,1fr); gap: 16px; margin-bottom: 20px;
}
@media(max-width:900px){ .rp-kpi-grid { grid-template-columns: repeat(2,1fr); } }
@media(max-width:500px){ .rp-kpi-grid { grid-template-columns: 1fr; } }

.rp-kpi-card {
  background: var(--sidebar-bg); border: 1px solid var(--sidebar-border);
  border-radius: 14px; padding: 18px 16px;
  display: flex; align-items: center; gap: 14px;
}
.rp-kpi-icon {
  width: 44px; height: 44px; border-radius: 12px; flex-shrink: 0;
  display: flex; align-items: center; justify-content: center; font-size: 18px;
}
.rp-kpi-body { flex: 1; min-width: 0; }
.rp-kpi-value { font-size: 22px; font-weight: 800; color: var(--text-primary); line-height: 1.1; }
.rp-kpi-label { font-size: 11px; color: var(--text-secondary); margin-top: 3px; }
.rp-kpi-trend { font-size: 11px; font-weight: 700; white-space: nowrap; display: flex; align-items: center; gap: 3px; }
.rp-kpi-trend.up   { color: #22c55e; }
.rp-kpi-trend.down { color: #ef4444; }

.rp-grid {
  display: grid; grid-template-columns: 1fr 1fr; gap: 18px;
}
@media(max-width:900px){ .rp-grid { grid-template-columns: 1fr; } }

.rp-card {
  background: var(--sidebar-bg); border: 1px solid var(--sidebar-border);
  border-radius: 14px; padding: 20px; display: flex; flex-direction: column; gap: 14px;
}
.rp-card-title {
  font-size: 13px; font-weight: 700; color: var(--text-primary);
  text-transform: uppercase; letter-spacing: 0.05em;
  padding-bottom: 10px; border-bottom: 1px solid var(--sidebar-border);
  display: flex; align-items: center; gap: 8px;
}

/* Status bars */
.rp-status-list { display: flex; flex-direction: column; gap: 10px; }
.rp-status-row  { display: flex; align-items: center; gap: 10px; }
.rp-status-info { display: flex; align-items: center; gap: 7px; min-width: 100px; }
.rp-status-dot  { width: 9px; height: 9px; border-radius: 50%; flex-shrink: 0; }
.rp-status-label{ font-size: 13px; color: var(--text-primary); }
.rp-status-bar-wrap { flex: 1; background: var(--sidebar-border); border-radius: 99px; height: 7px; overflow: hidden; }
.rp-status-bar  { height: 100%; border-radius: 99px; transition: width 0.6s ease; }
.rp-status-count{ font-size: 12px; font-weight: 700; color: var(--text-secondary); min-width: 24px; text-align: right; }

/* Table */
.rp-table-wrap { overflow-x: auto; }
.rp-table { width: 100%; border-collapse: collapse; font-size: 12px; }
.rp-table th {
  text-align: left; font-size: 10px; font-weight: 700; text-transform: uppercase;
  letter-spacing: 0.06em; color: var(--text-secondary);
  padding: 0 8px 8px; border-bottom: 1px solid var(--sidebar-border);
}
.rp-table td { padding: 9px 8px; border-bottom: 1px solid var(--sidebar-border); color: var(--text-primary); }
.rp-table tr:last-child td { border-bottom: none; }
.rp-rank    { font-weight: 700; color: var(--brand); width: 24px; }
.rp-product-name { font-weight: 500; max-width: 160px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.rp-order-id { font-weight: 600; color: var(--brand); font-size: 11px; }
.rp-revenue { font-weight: 700; color: var(--text-primary); }

/* Payment */
.rp-payment-list { display: flex; flex-direction: column; gap: 10px; }
.rp-payment-row  {
  display: flex; align-items: center; justify-content: space-between;
  padding: 10px 12px; background: var(--admin-bg);
  border-radius: 9px; border: 1px solid var(--sidebar-border);
}
.rp-payment-left  { display: flex; align-items: center; gap: 10px; font-size: 13px; font-weight: 500; color: var(--text-primary); }
.rp-payment-right { display: flex; flex-direction: column; align-items: flex-end; gap: 2px; }
.rp-payment-count { font-size: 11px; color: var(--text-secondary); }
.rp-payment-amt   { font-size: 13px; font-weight: 700; color: var(--text-primary); }

/* Status badges */
.rp-badge { font-size: 10px; font-weight: 700; padding: 2px 8px; border-radius: 99px; text-transform: capitalize; }
.rp-badge-delivered  { background: rgba(34,197,94,0.12);  color: #22c55e; }
.rp-badge-shipped    { background: rgba(59,130,246,0.12); color: #3b82f6; }
.rp-badge-processing { background: rgba(139,92,246,0.12); color: #8b5cf6; }
.rp-badge-pending    { background: rgba(245,158,11,0.12); color: #f59e0b; }
.rp-badge-cancelled  { background: rgba(239,68,68,0.12);  color: #ef4444; }
</style>
