<template>
  <div class="admin-page-wrap">
    <div class="admin-page-header">
      <div>
        <h1 class="page-title">Analytics</h1>
        <p class="page-subtitle">Revenue trends, traffic insights &amp; performance metrics.</p>
      </div>
      <div style="display:flex;gap:8px;align-items:center">
        <select class="filter-select" v-model="period" style="font-size:12px;padding:7px 12px">
          <option value="7">Last 7 days</option>
          <option value="30">Last 30 days</option>
          <option value="90">Last 90 days</option>
        </select>
        <button class="admin-btn secondary" @click="rebuild">
          <i class="fa-sharp fa-solid fa-arrows-rotate" :class="{'fa-spin': adminStore.loading.orders}"></i> Refresh
        </button>
      </div>
    </div>

    <!-- KPI row -->
    <div class="admin-grid-4" style="margin-bottom:20px">
      <div class="admin-stat-card">
        <div class="stat-icon" style="background:rgba(249,115,22,0.12);color:#f97316">
          <i class="fa-sharp-duotone fa-solid fa-circle-dollar-to-slot"></i>
        </div>
        <div>
          <div class="stat-label">Gross Revenue</div>
          <div class="stat-value">৳{{ fmt(totalGross) }}</div>
        </div>
        <div class="stat-delta positive"><i class="fa-solid fa-arrow-trend-up"></i> All time delivered</div>
      </div>
      <div class="admin-stat-card">
        <div class="stat-icon" style="background:rgba(59,130,246,0.12);color:#3b82f6">
          <i class="fa-sharp-duotone fa-solid fa-bag-shopping"></i>
        </div>
        <div>
          <div class="stat-label">Conversion Rate</div>
          <div class="stat-value">{{ convRate }}%</div>
        </div>
        <div class="stat-delta positive"><i class="fa-solid fa-arrow-trend-up"></i> Delivered / total</div>
      </div>
      <div class="admin-stat-card">
        <div class="stat-icon" style="background:rgba(168,85,247,0.12);color:#a855f7">
          <i class="fa-sharp-duotone fa-solid fa-receipt"></i>
        </div>
        <div>
          <div class="stat-label">Avg. Order Value</div>
          <div class="stat-value">৳{{ fmt(avgOrder) }}</div>
        </div>
        <div class="stat-delta neutral"><i class="fa-solid fa-minus"></i> Revenue / orders</div>
      </div>
      <div class="admin-stat-card">
        <div class="stat-icon" style="background:rgba(239,68,68,0.12);color:#ef4444">
          <i class="fa-sharp-duotone fa-solid fa-cart-circle-xmark"></i>
        </div>
        <div>
          <div class="stat-label">Cancellation Rate</div>
          <div class="stat-value">{{ cancelRate }}%</div>
        </div>
        <div class="stat-delta negative"><i class="fa-solid fa-arrow-trend-down"></i> Cancelled / total</div>
      </div>
    </div>

    <!-- Revenue line chart + payment mix -->
    <div class="admin-grid-2" style="margin-bottom:20px">
      <div class="admin-chart-card">
        <div class="chart-header">
          <div>
            <div class="chart-title">Revenue Over Time</div>
            <div class="chart-subtitle">Daily revenue (last {{ period }} days)</div>
          </div>
          <span class="status-badge delivered">Live</span>
        </div>
        <div class="chart-canvas-wrap" style="height:260px">
          <canvas ref="lineRef"></canvas>
        </div>
      </div>
      <div class="admin-chart-card">
        <div class="chart-header">
          <div>
            <div class="chart-title">Payment Methods</div>
            <div class="chart-subtitle">Order distribution by payment</div>
          </div>
        </div>
        <div class="chart-canvas-wrap" style="height:260px;display:flex;align-items:center;justify-content:center">
          <canvas ref="payRef" style="max-width:240px"></canvas>
        </div>
      </div>
    </div>

    <!-- Order status funnel + top categories bar -->
    <div class="admin-grid-2" style="margin-bottom:20px">
      <div class="admin-chart-card">
        <div class="chart-header">
          <div>
            <div class="chart-title">Order Status Funnel</div>
            <div class="chart-subtitle">Count by status</div>
          </div>
        </div>
        <div class="chart-canvas-wrap" style="height:240px">
          <canvas ref="funnelRef"></canvas>
        </div>
      </div>
      <div class="admin-chart-card">
        <div class="chart-header">
          <div>
            <div class="chart-title">Top Categories</div>
            <div class="chart-subtitle">Product count per category</div>
          </div>
        </div>
        <div class="chart-canvas-wrap" style="height:240px">
          <canvas ref="catRef"></canvas>
        </div>
      </div>
    </div>

    <!-- Stock health table -->
    <div class="admin-chart-card" style="padding:0">
      <div class="chart-header" style="padding:16px 20px 0">
        <div>
          <div class="chart-title">Stock Health</div>
          <div class="chart-subtitle">Products needing attention</div>
        </div>
        <span class="status-badge" :class="lowStockItems.length > 0 ? 'pending' : 'delivered'">
          {{ lowStockItems.length > 0 ? `${lowStockItems.length} low stock` : 'All healthy' }}
        </span>
      </div>
      <div class="admin-table-wrap" style="border:none;border-radius:0">
        <table class="admin-table">
          <thead><tr><th>Product</th><th>Category</th><th>Price</th><th>Stock</th><th>Health</th></tr></thead>
          <tbody>
            <tr v-for="p in stockTable" :key="p.id">
              <td>
                <div style="display:flex;align-items:center;gap:10px">
                  <img :src="p.images[0]" :alt="p.name" style="width:34px;height:34px;border-radius:7px;object-fit:cover" onerror="this.src='https://via.placeholder.com/34'" />
                  <div>
                    <div style="font-size:13px;font-weight:600;max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">{{ p.name }}</div>
                    <div style="font-size:11px;color:var(--text-secondary)">{{ p.brand }}</div>
                  </div>
                </div>
              </td>
              <td><span class="status-badge processing">{{ p.category }}</span></td>
              <td style="font-weight:700;color:var(--brand)">৳{{ p.salePrice || p.price }}</td>
              <td style="font-weight:700">{{ p.stock }}</td>
              <td>
                <div style="display:flex;align-items:center;gap:8px">
                  <div class="admin-progress" style="width:80px">
                    <div class="progress-fill" :style="{width: Math.min(p.stock,100)+'%', background: p.stock < 10 ? '#ef4444' : p.stock < 25 ? '#eab308' : 'linear-gradient(90deg,var(--brand),#fb923c)'}"></div>
                  </div>
                  <span class="status-badge" :class="p.stock < 10 ? 'cancelled' : p.stock < 25 ? 'pending' : 'delivered'" style="font-size:10px">
                    {{ p.stock < 10 ? 'Critical' : p.stock < 25 ? 'Low' : 'OK' }}
                  </span>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
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
const period = ref(30)
const lineRef   = ref<HTMLCanvasElement | null>(null)
const payRef    = ref<HTMLCanvasElement | null>(null)
const funnelRef = ref<HTMLCanvasElement | null>(null)
const catRef    = ref<HTMLCanvasElement | null>(null)

let lineChart:Chart|null=null, payChart:Chart|null=null
let funnelChart:Chart|null=null, catChart:Chart|null=null

const COLORS = ['#f97316','#3b82f6','#a855f7','#22c55e','#ef4444','#06b6d4','#ec4899']

const totalGross = computed(() =>
  adminStore.orders.filter(o=>o.status==='delivered').reduce((s,o)=>s+o.total,0))
const convRate = computed(() => {
  if (!adminStore.orders.length) return '0.0'
  return ((adminStore.orders.filter(o=>o.status==='delivered').length / adminStore.orders.length)*100).toFixed(1)
})
const avgOrder = computed(() => {
  if (!adminStore.orders.length) return 0
  return Math.round(adminStore.orders.reduce((s,o)=>s+o.total,0) / adminStore.orders.length)
})
const cancelRate = computed(() => {
  if (!adminStore.orders.length) return '0.0'
  return ((adminStore.orders.filter(o=>o.status==='cancelled').length / adminStore.orders.length)*100).toFixed(1)
})
const lowStockItems = computed(() => adminStore.products.filter(p=>p.stock<25))
const stockTable = computed(() => [...adminStore.products].sort((a,b)=>a.stock-b.stock).slice(0,10))

function fmt(n:number) { return n>=1000?(n/1000).toFixed(1)+'K':n.toLocaleString() }

function getDailyRevenue() {
  const days = Number(period.value)
  const now = Date.now()
  const labels: string[] = []
  const data: number[] = []
  for (let i = days-1; i >= 0; i--) {
    const d = new Date(now - i*86400000)
    labels.push(d.toLocaleDateString('en-GB',{day:'2-digit',month:'short'}))
    const dayStr = d.toISOString().slice(0,10)
    const rev = adminStore.orders
      .filter(o=>o.status==='delivered' && o.createdAt.slice(0,10)===dayStr)
      .reduce((s,o)=>s+o.total,0)
    data.push(rev)
  }
  return { labels, data }
}

function getPaymentMix() {
  const map: Record<string,number> = {}
  adminStore.orders.forEach(o => { map[o.paymentMethod] = (map[o.paymentMethod]??0)+1 })
  return { labels: Object.keys(map), data: Object.values(map) }
}

function rebuild() {
  ;[lineChart,payChart,funnelChart,catChart].forEach(c=>c?.destroy())
  lineChart=payChart=funnelChart=catChart=null

  const isDark = document.documentElement.classList.contains('dark')
  const grid   = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'
  const tick   = isDark ? '#8888a0' : '#71717a'

  const daily = getDailyRevenue()
  if (lineRef.value) {
    lineChart = new Chart(lineRef.value, {
      type: 'line',
      data: { labels: daily.labels, datasets: [{
        label:'Revenue ৳', data: daily.data,
        borderColor:'#f97316', backgroundColor:'rgba(249,115,22,0.08)',
        tension:0.4, fill:true, pointRadius:3, pointBackgroundColor:'#f97316'
      }]},
      options: { responsive:true, maintainAspectRatio:false,
        plugins:{legend:{display:false}},
        scales:{
          x:{grid:{display:false},ticks:{color:tick,font:{size:10},maxTicksLimit:10}},
          y:{grid:{color:grid},ticks:{color:tick,font:{size:10}}}
        }}
    })
  }

  const pay = getPaymentMix()
  if (payRef.value) {
    payChart = new Chart(payRef.value, {
      type: 'pie',
      data: { labels: pay.labels, datasets: [{
        data: pay.data, backgroundColor: COLORS,
        borderWidth:2, borderColor: isDark?'#16161c':'#fff'
      }]},
      options: { responsive:true, maintainAspectRatio:true,
        plugins:{legend:{position:'bottom',labels:{color:tick,font:{size:11},boxWidth:12,padding:8}}}}
    })
  }

  const rv = adminStore.revenueByStatus
  if (funnelRef.value) {
    funnelChart = new Chart(funnelRef.value, {
      type: 'bar',
      data: { labels: rv.map(r=>r.status.charAt(0).toUpperCase()+r.status.slice(1)),
        datasets:[{label:'Orders',data:rv.map(r=>r.count),
          backgroundColor:COLORS,borderRadius:7,borderSkipped:false}]},
      options:{responsive:true,maintainAspectRatio:false,
        plugins:{legend:{display:false}},
        scales:{x:{grid:{display:false},ticks:{color:tick,font:{size:11}}},
          y:{grid:{color:grid},ticks:{color:tick,font:{size:11}}}}}
    })
  }

  const cat = adminStore.categoryBreakdown.slice(0,8)
  if (catRef.value) {
    catChart = new Chart(catRef.value, {
      type: 'bar',
      data: { labels: cat.map(c=>c.name),
        datasets:[{label:'Products',data:cat.map(c=>c.count),
          backgroundColor: 'rgba(59,130,246,0.7)',borderRadius:6,borderSkipped:false}]},
      options:{responsive:true,maintainAspectRatio:false,
        indexAxis:'y',
        plugins:{legend:{display:false}},
        scales:{x:{grid:{color:grid},ticks:{color:tick,font:{size:10}}},
          y:{grid:{display:false},ticks:{color:tick,font:{size:10}}}}}
    })
  }
}

onMounted(async () => {
  if (!adminStore.orders.length) await adminStore.loadAll()
  await nextTick(); rebuild()
})
watch([()=>adminStore.orders.length,()=>adminStore.products.length,period,()=>themeStore.isDark], async ()=>{
  await nextTick(); rebuild()
})
</script>
