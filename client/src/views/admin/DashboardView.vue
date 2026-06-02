<template>
  <div class="admin-page-wrap">
    <!-- Header -->
    <div class="admin-page-header">
      <div>
        <h1 class="page-title">Dashboard</h1>
        <p class="page-subtitle">Welcome back — here's what's happening at SellBazar.</p>
      </div>
      <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">
        <span class="status-badge" :class="adminStore.serverOnline ? 'delivered' : 'cancelled'">
          <i :class="adminStore.serverOnline ? 'fa-solid fa-circle-check' : 'fa-solid fa-circle-xmark'"></i>
          Server {{ adminStore.serverOnline ? 'Online' : 'Offline' }}
        </span>
        <button class="admin-btn secondary" @click="adminStore.loadAll()">
          <i class="fa-sharp fa-solid fa-arrows-rotate" :class="{'fa-spin': isLoading}"></i> Refresh
        </button>
      </div>
    </div>

    <!-- Period Filter -->
    <div class="period-filter-bar">
      <button
        v-for="p in PERIODS"
        :key="p.key"
        class="period-btn"
        :class="{ active: selectedPeriod === p.key }"
        @click="selectedPeriod = p.key"
      >
        {{ p.label }}
      </button>
      <span class="period-info" v-if="periodLabel">
        <i class="fa-regular fa-calendar"></i> {{ periodLabel }}
      </span>
    </div>

    <!-- Stat cards -->
    <div class="admin-grid-4" style="margin-bottom:20px">
      <div class="admin-stat-card">
        <div class="stat-icon" style="background:rgba(249,115,22,0.12);color:#f97316">
          <i class="fa-sharp-duotone fa-solid fa-circle-dollar-to-slot"></i>
        </div>
        <div>
          <div class="stat-label">Total Revenue</div>
          <div class="stat-value">৳{{ fmtCurrency(filteredRevenue) }}</div>
        </div>
        <div class="stat-delta" :class="revenueGrowth >= 0 ? 'positive' : 'negative'">
          <i :class="revenueGrowth >= 0 ? 'fa-solid fa-arrow-trend-up' : 'fa-solid fa-arrow-trend-down'"></i>
          {{ revenueGrowth >= 0 ? '+' : '' }}{{ revenueGrowth.toFixed(1) }}% vs prev period
        </div>
      </div>
      <div class="admin-stat-card">
        <div class="stat-icon" style="background:rgba(59,130,246,0.12);color:#3b82f6">
          <i class="fa-sharp-duotone fa-solid fa-bag-shopping"></i>
        </div>
        <div>
          <div class="stat-label">Total Orders</div>
          <div class="stat-value">{{ filteredOrders.length }}</div>
        </div>
        <div class="stat-delta positive"><i class="fa-solid fa-arrow-trend-up"></i> +{{ filteredPendingOrders }} pending</div>
      </div>
      <div class="admin-stat-card">
        <div class="stat-icon" style="background:rgba(168,85,247,0.12);color:#a855f7">
          <i class="fa-sharp-duotone fa-solid fa-boxes-stacked"></i>
        </div>
        <div>
          <div class="stat-label">Total Products</div>
          <div class="stat-value">{{ adminStore.products.length }}</div>
        </div>
        <div class="stat-delta negative" v-if="adminStore.lowStock > 0">
          <i class="fa-solid fa-triangle-exclamation"></i> {{ adminStore.lowStock }} low stock
        </div>
        <div class="stat-delta positive" v-else><i class="fa-solid fa-circle-check"></i> All stocked</div>
      </div>
      <div class="admin-stat-card">
        <div class="stat-icon" style="background:rgba(34,197,94,0.12);color:#22c55e">
          <i class="fa-sharp-duotone fa-solid fa-star-sharp-half-stroke"></i>
        </div>
        <div>
          <div class="stat-label">Avg. Rating</div>
          <div class="stat-value">{{ avgRating }}</div>
        </div>
        <div class="stat-delta positive"><i class="fa-solid fa-star"></i> Across all products</div>
      </div>
    </div>

    <!-- Charts row -->
    <div class="admin-grid-2" style="margin-bottom:20px">
      <!-- Revenue over time line chart -->
      <div class="admin-chart-card">
        <div class="chart-header">
          <div>
            <div class="chart-title">Revenue — {{ selectedPeriodObj?.label ?? 'All Time' }}</div>
            <div class="chart-subtitle">Daily paid order revenue</div>
          </div>
          <span class="status-badge delivered">Live</span>
        </div>
        <div class="chart-canvas-wrap" style="height:240px">
          <canvas ref="lineChartRef"></canvas>
        </div>
      </div>
      <!-- Revenue by status bar chart -->
      <div class="admin-chart-card">
        <div class="chart-header">
          <div>
            <div class="chart-title">Revenue by Status</div>
            <div class="chart-subtitle">Order revenue breakdown</div>
          </div>
        </div>
        <div class="chart-canvas-wrap" style="height:240px">
          <canvas ref="barChartRef"></canvas>
        </div>
      </div>
    </div>

    <!-- Charts row 2 -->
    <div class="admin-grid-2" style="margin-bottom:20px">
      <!-- Category doughnut -->
      <div class="admin-chart-card">
        <div class="chart-header">
          <div>
            <div class="chart-title">Product Categories</div>
            <div class="chart-subtitle">Distribution by top-level category</div>
          </div>
        </div>
        <div class="chart-canvas-wrap" style="height:240px;display:flex;align-items:center;justify-content:center">
          <canvas ref="doughnutRef" style="max-width:240px"></canvas>
        </div>
      </div>
      <!-- Subcategory bar chart -->
      <div class="admin-chart-card">
        <div class="chart-header">
          <div>
            <div class="chart-title">Subcategory Breakdown</div>
            <div class="chart-subtitle">
              Products per subcategory
              <span v-if="subCatFilter" class="sub-filter-badge">
                {{ subCatFilter }}
                <button @click="subCatFilter = ''" title="Clear filter">×</button>
              </span>
            </div>
          </div>
          <!-- Category picker -->
          <select
            v-model="subCatFilter"
            class="sub-cat-select"
            title="Filter by category"
          >
            <option value="">All Categories</option>
            <option v-for="c in adminStore.categoryBreakdown" :key="c.name" :value="c.name">
              {{ c.name }}
            </option>
          </select>
        </div>
        <div class="chart-canvas-wrap" style="height:240px">
          <canvas ref="subCatBarRef"></canvas>
        </div>
        <div v-if="subcatBreakdown.length === 0" style="text-align:center;color:var(--text-secondary);font-size:12px;padding:8px 0">
          No subcategory data — assign subcategories to products.
        </div>
      </div>
    </div>

    <!-- Charts row 3: Quick Stats -->
    <div class="admin-grid-2" style="margin-bottom:20px">
      <!-- Quick stats -->
      <div class="admin-chart-card" style="display:flex;flex-direction:column;gap:14px">
        <div class="chart-header">
          <div>
            <div class="chart-title">Quick Stats</div>
            <div class="chart-subtitle">Store performance — {{ selectedPeriodObj?.label }}</div>
          </div>
        </div>
        <div class="quick-stat-row">
          <span class="quick-stat-label"><i class="fa-sharp-duotone fa-solid fa-users" style="color:#3b82f6"></i> Unique Customers</span>
          <span class="quick-stat-val">{{ filteredUniqueCustomers }}</span>
        </div>
        <div class="quick-stat-row">
          <span class="quick-stat-label"><i class="fa-sharp-duotone fa-solid fa-boxes-stacked" style="color:#a855f7"></i> Out of Stock</span>
          <span class="quick-stat-val" style="color:#ef4444">{{ adminStore.dashboard?.outOfStock ?? adminStore.products.filter(p=>p.stock===0).length }}</span>
        </div>
        <div class="quick-stat-row">
          <span class="quick-stat-label"><i class="fa-sharp-duotone fa-solid fa-circle-dollar-to-slot" style="color:#22c55e"></i> Period Revenue</span>
          <span class="quick-stat-val" style="color:var(--brand)">৳{{ fmtCurrency(filteredRevenue) }}</span>
        </div>
        <div class="quick-stat-row">
          <span class="quick-stat-label"><i class="fa-sharp-duotone fa-solid fa-triangle-exclamation" style="color:#f59e0b"></i> Low Stock Items</span>
          <span class="quick-stat-val" style="color:#f59e0b">{{ adminStore.lowStock }}</span>
        </div>
        <div class="quick-stat-row">
          <span class="quick-stat-label"><i class="fa-sharp-duotone fa-solid fa-star-sharp" style="color:#eab308"></i> Avg. Product Rating</span>
          <span class="quick-stat-val">{{ avgRating }}</span>
        </div>
        <div class="quick-stat-row">
          <span class="quick-stat-label"><i class="fa-sharp-duotone fa-solid fa-bag-shopping" style="color:#f97316"></i> Period Orders</span>
          <span class="quick-stat-val">{{ filteredOrders.length }}</span>
        </div>
      </div>
    </div>

    <!-- Bottom row: recent orders + top products -->
    <div class="admin-grid-2" style="margin-bottom:20px">
      <!-- Recent orders -->
      <div class="admin-chart-card" style="padding:0">
        <div class="chart-header" style="padding:16px 20px 0">
          <div>
            <div class="chart-title">Recent Orders</div>
            <div class="chart-subtitle">Last {{ recentOrders.length }} orders in period</div>
          </div>
          <RouterLink to="/admin/orders" class="admin-btn ghost" style="padding:6px 10px;font-size:12px">
            View all <i class="fa-solid fa-arrow-right"></i>
          </RouterLink>
        </div>
        <div v-if="isLoading" style="padding:20px;text-align:center;color:var(--text-secondary);font-size:13px">
          <i class="fa-solid fa-spinner-third fa-spin"></i> Loading orders…
        </div>
        <div v-else-if="recentOrders.length === 0" style="padding:20px;text-align:center;color:var(--text-secondary);font-size:13px">
          No orders in this period.
        </div>
        <div v-else class="admin-table-wrap" style="border:none;border-radius:0">
          <table class="admin-table">
            <thead><tr>
              <th>Order ID</th><th>Total</th><th>Status</th><th>Date</th>
            </tr></thead>
            <tbody>
              <tr v-for="o in recentOrders" :key="o.id">
                <td><span style="font-family:monospace;font-size:12px;color:var(--brand)">#{{ o.id.slice(-6).toUpperCase() }}</span></td>
                <td style="font-weight:600">৳{{ o.total.toLocaleString() }}</td>
                <td><span class="status-badge" :class="o.status">{{ o.status }}</span></td>
                <td style="color:var(--text-secondary);font-size:12px">{{ fmtDate(o.createdAt) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Top products -->
      <div class="admin-chart-card" style="padding:0">
        <div class="chart-header" style="padding:16px 20px 0">
          <div>
            <div class="chart-title">Top Products</div>
            <div class="chart-subtitle">By stock level</div>
          </div>
          <RouterLink to="/admin/products" class="admin-btn ghost" style="padding:6px 10px;font-size:12px">
            View all <i class="fa-solid fa-arrow-right"></i>
          </RouterLink>
        </div>
        <div v-if="isLoading" style="padding:20px;text-align:center;color:var(--text-secondary);font-size:13px">
          <i class="fa-solid fa-spinner-third fa-spin"></i> Loading products…
        </div>
        <div v-else style="padding:4px 0 8px">
          <div v-for="p in topProducts" :key="p.id" class="top-product-row">
            <img :src="p.images[0]" :alt="p.name" class="top-product-img" onerror="this.src='https://via.placeholder.com/40'" />
            <div style="flex:1;min-width:0">
              <div class="top-product-name">{{ p.name }}</div>
              <div class="admin-progress" style="margin-top:5px">
                <div class="progress-fill" :style="{width: Math.min(p.stock,100)+'%'}"></div>
              </div>
            </div>
            <div style="text-align:right;flex-shrink:0">
              <div style="font-weight:700;font-size:13px;color:var(--brand)">৳{{ p.salePrice || p.price }}</div>
              <div style="font-size:11px;color:var(--text-secondary)">{{ p.stock }} left</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Customer Map -->
    <div class="admin-chart-card" style="padding:0;margin-top:0">
      <div class="chart-header" style="padding:16px 20px 0">
        <div>
          <div class="chart-title">Customer Locations</div>
          <div class="chart-subtitle">Mapped from order delivery addresses ({{ mapPins.length }} customers)</div>
        </div>
        <RouterLink to="/admin/customers" class="admin-btn ghost" style="padding:6px 10px;font-size:12px">
          View customers <i class="fa-solid fa-arrow-right"></i>
        </RouterLink>
      </div>
      <div ref="dashMapEl" style="height:320px;border-radius:0 0 14px 14px;z-index:1"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { useAdminStore } from '@/stores/useAdminStore'
import { useThemeStore } from '@/stores/useThemeStore'
import Chart from 'chart.js/auto'

const adminStore = useAdminStore()
const themeStore = useThemeStore()
const barChartRef  = ref<HTMLCanvasElement | null>(null)
const doughnutRef  = ref<HTMLCanvasElement | null>(null)
const lineChartRef = ref<HTMLCanvasElement | null>(null)
const subCatBarRef = ref<HTMLCanvasElement | null>(null)
const dashMapEl    = ref<HTMLElement | null>(null)
let barChart: Chart | null = null
let doughnutChart: Chart | null = null
let lineChart: Chart | null = null
let subCatChart: Chart | null = null
let leafletMap: any = null

// ── Subcategory filter + breakdown ────────────────────────────────────────────
const subCatFilter = ref('')

const subcatBreakdown = computed(() => {
  const map = new Map<string, number>()
  adminStore.products.forEach(p => {
    if (!p.subcategory) return
    if (subCatFilter.value && p.category !== subCatFilter.value) return
    map.set(p.subcategory, (map.get(p.subcategory) ?? 0) + 1)
  })
  return [...map.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 14) // cap at 14 for readability
})

// ── Period filter ─────────────────────────────────────────────────────────────
const PERIODS = [
  { key: 'today',   label: 'Today',    days: 1  },
  { key: '7d',      label: '7 Days',   days: 7  },
  { key: '30d',     label: '30 Days',  days: 30 },
  { key: '3m',      label: '3 Months', days: 90 },
  { key: '1y',      label: 'This Year',days: 365},
  { key: 'all',     label: 'All Time', days: 0  },
] as const
type PeriodKey = typeof PERIODS[number]['key']

const selectedPeriod = ref<PeriodKey>('30d')
const selectedPeriodObj = computed(() => PERIODS.find(p => p.key === selectedPeriod.value))

function periodStart(days: number): Date | null {
  if (days === 0) return null
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() - (days - 1))
  return d
}

function inPeriod(dateStr: string): boolean {
  const obj = selectedPeriodObj.value
  if (!obj || obj.days === 0) return true
  const start = periodStart(obj.days)!
  return new Date(dateStr) >= start
}

const periodLabel = computed(() => {
  const obj = selectedPeriodObj.value
  if (!obj || obj.days === 0) return 'All orders'
  const start = periodStart(obj.days)!
  const end = new Date()
  const fmt = (d: Date) => d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
  return `${fmt(start)} – ${fmt(end)}`
})

// ── Filtered orders ───────────────────────────────────────────────────────────
const filteredOrders = computed(() =>
  adminStore.orders.filter(o => inPeriod(o.createdAt))
)

const filteredRevenue = computed(() =>
  filteredOrders.value
    .filter(o => o.paymentStatus === 'paid')
    .reduce((s, o) => s + o.total, 0)
)

const filteredPendingOrders = computed(() =>
  filteredOrders.value.filter(o => ['pending', 'processing'].includes(o.status)).length
)

const filteredUniqueCustomers = computed(() => {
  const emails = new Set(filteredOrders.value.map(o => o.customer?.email).filter(Boolean))
  return emails.size || filteredOrders.value.length
})

// Period-over-period revenue growth
const revenueGrowth = computed(() => {
  const obj = selectedPeriodObj.value
  if (!obj || obj.days === 0) return adminStore.dashboard?.revenueGrowth ?? 0
  // prev period
  const prevStart = new Date()
  prevStart.setHours(0, 0, 0, 0)
  prevStart.setDate(prevStart.getDate() - obj.days * 2 + 1)
  const prevEnd = new Date()
  prevEnd.setHours(0, 0, 0, 0)
  prevEnd.setDate(prevEnd.getDate() - obj.days)
  const prevRevenue = adminStore.orders
    .filter(o => o.paymentStatus === 'paid')
    .filter(o => { const d = new Date(o.createdAt); return d >= prevStart && d < prevEnd })
    .reduce((s, o) => s + o.total, 0)
  if (prevRevenue === 0) return filteredRevenue.value > 0 ? 100 : 0
  return ((filteredRevenue.value - prevRevenue) / prevRevenue) * 100
})

// ── Other computed ─────────────────────────────────────────────────────────────
const isLoading = computed(() =>
  adminStore.loading.products || adminStore.loading.orders
)

const recentOrders = computed(() =>
  [...filteredOrders.value]
    .sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 6)
)

const topProducts = computed(() =>
  [...adminStore.products].sort((a,b) => b.stock - a.stock).slice(0, 6)
)

const avgRating = computed(() => {
  if (!adminStore.products.length) return '—'
  const avg = adminStore.products.reduce((s,p) => s + p.rating, 0) / adminStore.products.length
  return avg.toFixed(1)
})

// ── Map ──────────────────────────────────────────────────────────────────────
const BD_CITIES: Record<string,{lat:number;lng:number}> = {
  dhaka:{lat:23.8103,lng:90.4125}, chittagong:{lat:22.3569,lng:91.7832},
  sylhet:{lat:24.8949,lng:91.8687}, rajshahi:{lat:24.3745,lng:88.6042},
  khulna:{lat:22.8456,lng:89.5403}, barisal:{lat:22.7010,lng:90.3535},
  rangpur:{lat:25.7439,lng:89.2752}, mymensingh:{lat:24.7471,lng:90.4203},
  comilla:{lat:23.4607,lng:91.1809}, narsingdi:{lat:23.9139,lng:90.7153},
  gazipur:{lat:23.9999,lng:90.4203}, narayanganj:{lat:23.6238,lng:90.4996},
  mirpur:{lat:23.8041,lng:90.3618}, dhanmondi:{lat:23.7461,lng:90.3742},
  uttara:{lat:23.8759,lng:90.3795}, gulshan:{lat:23.7925,lng:90.4078},
  bashundhara:{lat:23.8182,lng:90.4267}, dohs:{lat:23.8041,lng:90.3618},
}
function cityCoords(address: string): {lat:number;lng:number}|null {
  const lower = address.toLowerCase()
  for (const [city, coord] of Object.entries(BD_CITIES)) {
    if (lower.includes(city)) return coord
  }
  return null
}
const mapPins = computed(() => {
  const customerMap = new Map<string, {name:string;spent:number;orders:number;address:string}>()
  adminStore.orders.forEach(o => {
    const key = o.customer?.email ?? o.id
    if (!customerMap.has(key)) {
      customerMap.set(key, { name: o.customer?.name ?? '?', spent: 0, orders: 0, address: o.customer?.address ?? '' })
    }
    const c = customerMap.get(key)!
    c.spent += o.total
    c.orders++
  })
  return Array.from(customerMap.values())
    .map(c => ({ ...cityCoords(c.address), ...c }))
    .filter(p => p.lat) as {lat:number;lng:number;name:string;spent:number;orders:number;address:string}[]
})

async function initDashMap() {
  if (!dashMapEl.value || leafletMap) return
  try {
    const L = (await import('leaflet')).default
    await import('leaflet/dist/leaflet.css')
    leafletMap = L.map(dashMapEl.value, { center: [23.8103, 90.4125], zoom: 7, zoomControl: true })
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(leafletMap)
    const icon = L.divIcon({
      className: '',
      html: `<div style="width:26px;height:26px;background:#f97316;border:2px solid white;border-radius:50%;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 8px rgba(0,0,0,0.35)"><i class="fa-solid fa-user" style="color:white;font-size:11px"></i></div>`,
      iconSize: [26, 26], iconAnchor: [13, 13]
    })
    mapPins.value.forEach(pin => {
      L.marker([pin.lat + (Math.random()-0.5)*0.06, pin.lng + (Math.random()-0.5)*0.06], { icon })
        .bindPopup(`<b>${pin.name}</b><br><small>${pin.address}</small><br>Orders: ${pin.orders} | Spent: ৳${pin.spent.toLocaleString()}`)
        .addTo(leafletMap)
    })
  } catch (e) { console.error('Dashboard map init failed', e) }
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function fmtCurrency(n: number) {
  return n >= 1000 ? (n/1000).toFixed(1) + 'K' : n.toLocaleString()
}
function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'2-digit' })
}

const CHART_COLORS = ['#f97316','#3b82f6','#a855f7','#22c55e','#ef4444']

// ── Charts ────────────────────────────────────────────────────────────────────
function buildSubcatChart() {
  if (subCatChart) { subCatChart.destroy(); subCatChart = null }
  if (!subCatBarRef.value || subcatBreakdown.value.length === 0) return
  const isDark = document.documentElement.classList.contains('dark')
  const gridColor  = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'
  const labelColor = isDark ? '#8888a0' : '#71717a'
  const EXTENDED_COLORS = [
    '#f97316','#3b82f6','#a855f7','#22c55e','#ef4444',
    '#eab308','#06b6d4','#ec4899','#84cc16','#8b5cf6',
    '#14b8a6','#f43f5e','#0ea5e9','#d97706',
  ]
  subCatChart = new Chart(subCatBarRef.value, {
    type: 'bar',
    data: {
      labels: subcatBreakdown.value.map(s => s.name),
      datasets: [{
        label: 'Products',
        data: subcatBreakdown.value.map(s => s.count),
        backgroundColor: subcatBreakdown.value.map((_, i) => EXTENDED_COLORS[i % EXTENDED_COLORS.length]),
        borderRadius: 6,
        borderSkipped: false,
      }],
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      indexAxis: 'y' as const,
      plugins: { legend: { display: false } },
      scales: {
        x: { grid: { color: gridColor }, ticks: { color: labelColor, font: { size: 11 } } },
        y: { grid: { display: false }, ticks: { color: labelColor, font: { size: 11 } } },
      },
    },
  })
}

function buildCharts() {
  if (barChart) { barChart.destroy(); barChart = null }
  if (doughnutChart) { doughnutChart.destroy(); doughnutChart = null }
  if (lineChart) { lineChart.destroy(); lineChart = null }
  buildSubcatChart()

  const isDark = document.documentElement.classList.contains('dark')
  const gridColor = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'
  const labelColor = isDark ? '#8888a0' : '#71717a'

  // Revenue over time line chart (grouped by period)
  if (lineChartRef.value) {
    const obj = selectedPeriodObj.value
    const days = obj?.days ?? 0
    const labels: string[] = []
    const data: number[] = []

    if (days === 0 || days > 90) {
      // Group by month
      const monthMap = new Map<string, number>()
      filteredOrders.value
        .filter(o => o.paymentStatus === 'paid')
        .forEach(o => {
          const key = o.createdAt.slice(0, 7) // YYYY-MM
          monthMap.set(key, (monthMap.get(key) ?? 0) + o.total)
        })
      const sorted = [...monthMap.entries()].sort(([a],[b]) => a.localeCompare(b))
      sorted.forEach(([key, val]) => {
        const d = new Date(key + '-01')
        labels.push(d.toLocaleDateString('en-GB', { month: 'short', year: '2-digit' }))
        data.push(val)
      })
    } else {
      // Group by day
      for (let i = days - 1; i >= 0; i--) {
        const d = new Date()
        d.setDate(d.getDate() - i)
        labels.push(d.toLocaleDateString('en-GB', { day:'2-digit', month:'short' }))
        const dayStr = d.toISOString().slice(0, 10)
        data.push(filteredOrders.value
          .filter(o => o.paymentStatus === 'paid' && o.createdAt.slice(0,10) === dayStr)
          .reduce((s, o) => s + o.total, 0))
      }
    }

    lineChart = new Chart(lineChartRef.value, {
      type: 'line',
      data: {
        labels,
        datasets: [{
          label: 'Revenue ৳',
          data,
          borderColor: '#f97316',
          backgroundColor: 'rgba(249,115,22,0.08)',
          tension: 0.4, fill: true,
          pointRadius: 4, pointBackgroundColor: '#f97316',
          pointBorderColor: isDark ? '#16161c' : '#fff',
          pointBorderWidth: 2,
        }]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { grid: { display: false }, ticks: { color: labelColor, font: { size: 11 }, maxRotation: 45 } },
          y: { grid: { color: gridColor }, ticks: { color: labelColor, font: { size: 11 } } }
        }
      }
    })
  }

  // Revenue by status (filtered)
  if (barChartRef.value) {
    const statuses = ['delivered', 'shipped', 'processing', 'pending', 'cancelled'] as const
    const rv = statuses.map(status => ({
      status,
      total: filteredOrders.value.filter(o => o.status === status).reduce((s, o) => s + o.total, 0),
    }))
    barChart = new Chart(barChartRef.value, {
      type: 'bar',
      data: {
        labels: rv.map(r => r.status.charAt(0).toUpperCase() + r.status.slice(1)),
        datasets: [{
          label: 'Revenue (৳)',
          data: rv.map(r => r.total),
          backgroundColor: CHART_COLORS,
          borderRadius: 7,
          borderSkipped: false,
        }]
      },
      options: {
        responsive: true, maintainAspectRatio: true,
        plugins: { legend: { display: false } },
        scales: {
          x: { grid: { display: false }, ticks: { color: labelColor, font: { size: 11 } } },
          y: { grid: { color: gridColor }, ticks: { color: labelColor, font: { size: 11 } } }
        }
      }
    })
  }

  // Category doughnut (products — not period filtered)
  if (doughnutRef.value) {
    const cat = adminStore.categoryBreakdown.slice(0, 6)
    doughnutChart = new Chart(doughnutRef.value, {
      type: 'doughnut',
      data: {
        labels: cat.map(c => c.name),
        datasets: [{
          data: cat.map(c => c.count),
          backgroundColor: CHART_COLORS,
          borderWidth: 2,
          borderColor: isDark ? '#16161c' : '#ffffff'
        }]
      },
      options: {
        responsive: true, maintainAspectRatio: true,
        cutout: '65%',
        plugins: {
          legend: {
            position: 'bottom',
            labels: { color: labelColor, font: { size: 11 }, boxWidth: 12, padding: 10 }
          }
        }
      }
    })
  }
}

onMounted(async () => {
  if (!adminStore.orders.length && !adminStore.products.length) {
    await adminStore.loadAll()
  }
  await nextTick()
  buildCharts()
  initDashMap()
})

onUnmounted(() => {
  if (leafletMap) { leafletMap.remove(); leafletMap = null }
})

// Rebuild charts when period, data, or theme changes
watch([selectedPeriod, () => adminStore.orders, () => adminStore.categoryBreakdown, () => themeStore.isDark], async () => {
  await nextTick()
  buildCharts()
}, { deep: true })

// Rebuild subcategory chart when filter or products change
watch([subCatFilter, () => adminStore.products], async () => {
  await nextTick()
  buildSubcatChart()
}, { deep: true })

watch(mapPins, async () => {
  if (leafletMap) { leafletMap.remove(); leafletMap = null }
  await nextTick()
  initDashMap()
}, { deep: true })
</script>

<style scoped>
.admin-page-wrap { padding-bottom: 32px; }

/* Period filter bar */
.period-filter-bar {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}
.period-btn {
  padding: 6px 14px;
  border-radius: 20px;
  border: 1.5px solid var(--sidebar-border);
  background: transparent;
  color: var(--text-secondary);
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.18s;
  letter-spacing: 0.01em;
}
.period-btn:hover {
  border-color: var(--brand);
  color: var(--brand);
}
.period-btn.active {
  background: var(--brand);
  border-color: var(--brand);
  color: #fff;
}
.period-info {
  margin-left: 6px;
  font-size: 11px;
  color: var(--text-secondary);
  display: flex;
  align-items: center;
  gap: 5px;
}

/* Product rows */
.top-product-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 20px;
  border-bottom: 1px solid var(--sidebar-border);
  transition: background 0.15s;
  &:last-child { border-bottom: none; }
  &:hover { background: var(--surface-hover); }
}
.top-product-img {
  width: 38px; height: 38px;
  border-radius: 8px;
  object-fit: cover;
  background: var(--surface-hover);
  flex-shrink: 0;
}
.top-product-name {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 160px;
}

/* Quick stats */
.quick-stat-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 0;
  border-bottom: 1px solid var(--sidebar-border);
  &:last-child { border-bottom: none; }
}
.quick-stat-label {
  display: flex; align-items: center; gap: 8px;
  font-size: 12px; color: var(--text-secondary);
}
.quick-stat-val {
  font-size: 14px; font-weight: 800; color: var(--text-primary);
}

/* Subcategory chart controls */
.sub-cat-select {
  padding: 5px 10px;
  border-radius: 8px;
  border: 1px solid var(--sidebar-border);
  background: var(--admin-bg);
  color: var(--text-secondary);
  font-size: 11px;
  cursor: pointer;
  outline: none;
}
.sub-cat-select:focus { border-color: var(--brand); color: var(--text-primary); }
.sub-filter-badge {
  display: inline-flex; align-items: center; gap: 4px;
  background: rgba(249,115,22,0.12); color: var(--brand);
  font-size: 10px; font-weight: 700; padding: 2px 6px;
  border-radius: 6px; margin-left: 6px;
}
.sub-filter-badge button {
  background: none; border: none; color: inherit; cursor: pointer;
  font-size: 12px; line-height: 1; padding: 0; opacity: 0.7;
}
.sub-filter-badge button:hover { opacity: 1; }
</style>
