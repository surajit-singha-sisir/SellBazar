<template>
  <div class="admin-page-wrap">
    <!-- Header -->
    <div class="admin-page-header">
      <div>
        <h1 class="page-title">Dashboard</h1>
        <p class="page-subtitle">Welcome back — here's what's happening at SellBazar.</p>
      </div>
      <div style="display:flex;gap:8px;align-items:center">
        <span class="status-badge" :class="adminStore.serverOnline ? 'delivered' : 'cancelled'">
          <i :class="adminStore.serverOnline ? 'fa-solid fa-circle-check' : 'fa-solid fa-circle-xmark'"></i>
          Server {{ adminStore.serverOnline ? 'Online' : 'Offline' }}
        </span>
        <button class="admin-btn secondary" @click="adminStore.loadAll()">
          <i class="fa-sharp fa-solid fa-arrows-rotate" :class="{'fa-spin': isLoading}"></i> Refresh
        </button>
      </div>
    </div>

    <!-- Stat cards -->
    <div class="admin-grid-4" style="margin-bottom:20px">
      <div class="admin-stat-card">
        <div class="stat-icon" style="background:rgba(249,115,22,0.12);color:#f97316">
          <i class="fa-sharp-duotone fa-solid fa-circle-dollar-to-slot"></i>
        </div>
        <div>
          <div class="stat-label">Total Revenue</div>
          <div class="stat-value">৳{{ fmtCurrency(adminStore.totalRevenue) }}</div>
        </div>
        <div class="stat-delta" :class="revenueGrowth >= 0 ? 'positive' : 'negative'">
          <i :class="revenueGrowth >= 0 ? 'fa-solid fa-arrow-trend-up' : 'fa-solid fa-arrow-trend-down'"></i>
          {{ revenueGrowth >= 0 ? '+' : '' }}{{ revenueGrowth.toFixed(1) }}% vs last month
        </div>
      </div>
      <div class="admin-stat-card">
        <div class="stat-icon" style="background:rgba(59,130,246,0.12);color:#3b82f6">
          <i class="fa-sharp-duotone fa-solid fa-bag-shopping"></i>
        </div>
        <div>
          <div class="stat-label">Total Orders</div>
          <div class="stat-value">{{ adminStore.orders.length }}</div>
        </div>
        <div class="stat-delta positive"><i class="fa-solid fa-arrow-trend-up"></i> +{{ adminStore.pendingOrders }} pending</div>
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
      <div v-if="adminStore.dashboard" class="admin-stat-card" style="display:none"></div>
    </div>

    <!-- Charts row -->
    <div class="admin-grid-2" style="margin-bottom:20px">
      <!-- Revenue by status bar chart -->
      <div class="admin-chart-card">
        <div class="chart-header">
          <div>
            <div class="chart-title">Revenue by Status</div>
            <div class="chart-subtitle">Order revenue breakdown</div>
          </div>
          <span class="status-badge delivered">Live</span>
        </div>
        <div class="chart-canvas-wrap" style="height:240px">
          <canvas ref="barChartRef"></canvas>
        </div>
      </div>
      <!-- Category doughnut -->
      <div class="admin-chart-card">
        <div class="chart-header">
          <div>
            <div class="chart-title">Product Categories</div>
            <div class="chart-subtitle">Distribution by category</div>
          </div>
        </div>
        <div class="chart-canvas-wrap" style="height:240px;display:flex;align-items:center;justify-content:center">
          <canvas ref="doughnutRef" style="max-width:240px"></canvas>
        </div>
      </div>
    </div>

    <!-- Bottom row: recent orders + top products -->
    <div class="admin-grid-2">
      <!-- Recent orders -->
      <div class="admin-chart-card" style="padding:0">
        <div class="chart-header" style="padding:16px 20px 0">
          <div>
            <div class="chart-title">Recent Orders</div>
            <div class="chart-subtitle">Last {{ recentOrders.length }} orders</div>
          </div>
          <RouterLink to="/admin/orders" class="admin-btn ghost" style="padding:6px 10px;font-size:12px">
            View all <i class="fa-solid fa-arrow-right"></i>
          </RouterLink>
        </div>
        <div v-if="isLoading" style="padding:20px;text-align:center;color:var(--text-secondary);font-size:13px">
          <i class="fa-solid fa-spinner-third fa-spin"></i> Loading orders…
        </div>
        <div v-else-if="recentOrders.length === 0" style="padding:20px;text-align:center;color:var(--text-secondary);font-size:13px">
          No orders yet.
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
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import { useAdminStore } from '@/stores/useAdminStore'
import { useThemeStore } from '@/stores/useThemeStore'
import Chart from 'chart.js/auto'

const adminStore = useAdminStore()
const themeStore = useThemeStore()
const barChartRef  = ref<HTMLCanvasElement | null>(null)
const doughnutRef  = ref<HTMLCanvasElement | null>(null)
let barChart: Chart | null = null
let doughnutChart: Chart | null = null

const isLoading = computed(() =>
  adminStore.loading.products || adminStore.loading.orders
)
const revenueGrowth = computed(() => adminStore.dashboard?.revenueGrowth ?? 0)
const recentOrders = computed(() =>
  [...adminStore.orders].sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 6)
)
const topProducts = computed(() =>
  [...adminStore.products].sort((a,b) => b.stock - a.stock).slice(0, 6)
)
const avgRating = computed(() => {
  if (!adminStore.products.length) return '—'
  const avg = adminStore.products.reduce((s,p) => s + p.rating, 0) / adminStore.products.length
  return avg.toFixed(1)
})

function fmtCurrency(n: number) {
  return n >= 1000 ? (n/1000).toFixed(1) + 'K' : n.toLocaleString()
}
function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'2-digit' })
}

const CHART_COLORS = ['#f97316','#3b82f6','#a855f7','#22c55e','#ef4444']

function buildCharts() {
  if (barChart) { barChart.destroy(); barChart = null }
  if (doughnutChart) { doughnutChart.destroy(); doughnutChart = null }

  const isDark = document.documentElement.classList.contains('dark')
  const gridColor = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'
  const labelColor = isDark ? '#8888a0' : '#71717a'

  if (barChartRef.value) {
    const rv = adminStore.revenueByStatus
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
})

watch([() => adminStore.revenueByStatus, () => adminStore.categoryBreakdown, () => themeStore.isDark], async () => {
  await nextTick()
  buildCharts()
}, { deep: true })
</script>

<style scoped>
.admin-page-wrap { padding-bottom: 32px; }
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
</style>
