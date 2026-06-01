<template>
  <div class="admin-page-wrap">
    <div class="admin-page-header">
      <div>
        <h1 class="page-title">Customers</h1>
        <p class="page-subtitle">{{ filtered.length }} customers from order history.</p>
      </div>
      <div style="display:flex;gap:8px;flex-wrap:wrap">
        <button class="admin-btn secondary" @click="load">
          <i class="fa-sharp fa-solid fa-arrows-rotate" :class="{'fa-spin': adminStore.loading.customers}"></i> Refresh
        </button>
        <div class="export-wrap" v-click-outside="() => exportOpen = false">
          <button class="admin-btn secondary" @click="exportOpen = !exportOpen">
            <i class="fa-sharp fa-solid fa-file-export"></i> Export <i class="fa-solid fa-chevron-down" style="font-size:10px"></i>
          </button>
          <div v-if="exportOpen" class="export-dropdown">
            <button @click="doExport('excel')"><i class="fa-solid fa-file-excel" style="color:#22c55e"></i> Excel</button>
            <button @click="doExport('pdf')"><i class="fa-solid fa-file-pdf" style="color:#ef4444"></i> PDF</button>
            <button @click="doExport('csv')"><i class="fa-solid fa-file-csv" style="color:#3b82f6"></i> CSV</button>
            <button @click="doExport('json')"><i class="fa-solid fa-file-code" style="color:#a855f7"></i> JSON</button>
          </div>
        </div>
        <button class="admin-btn secondary" :class="showMap?'primary':''" @click="showMap=!showMap">
          <i class="fa-sharp fa-solid fa-map-location-dot"></i> {{ showMap ? 'Hide Map' : 'Show Map' }}
        </button>
      </div>
    </div>

    <!-- Summary cards -->
    <div class="admin-grid-4" style="margin-bottom:20px">
      <div class="admin-stat-card">
        <div class="stat-icon" style="background:rgba(59,130,246,0.12);color:#3b82f6">
          <i class="fa-sharp-duotone fa-solid fa-users"></i>
        </div>
        <div>
          <div class="stat-label">Total Customers</div>
          <div class="stat-value">{{ customers.length }}</div>
        </div>
        <div class="stat-delta positive"><i class="fa-solid fa-user-plus"></i> Unique buyers</div>
      </div>
      <div class="admin-stat-card">
        <div class="stat-icon" style="background:rgba(34,197,94,0.12);color:#22c55e">
          <i class="fa-sharp-duotone fa-solid fa-repeat"></i>
        </div>
        <div>
          <div class="stat-label">Repeat Buyers</div>
          <div class="stat-value">{{ repeatCount }}</div>
        </div>
        <div class="stat-delta positive"><i class="fa-solid fa-arrow-trend-up"></i> 2+ orders</div>
      </div>
      <div class="admin-stat-card">
        <div class="stat-icon" style="background:rgba(168,85,247,0.12);color:#a855f7">
          <i class="fa-sharp-duotone fa-solid fa-coin"></i>
        </div>
        <div>
          <div class="stat-label">Avg. Lifetime Value</div>
          <div class="stat-value">৳{{ fmtNum(avgLtv) }}</div>
        </div>
        <div class="stat-delta neutral"><i class="fa-solid fa-minus"></i> Per customer</div>
      </div>
      <div class="admin-stat-card">
        <div class="stat-icon" style="background:rgba(249,115,22,0.12);color:#f97316">
          <i class="fa-sharp-duotone fa-solid fa-crown"></i>
        </div>
        <div>
          <div class="stat-label">Top Spender</div>
          <div class="stat-value" style="font-size:15px">{{ topSpender?.name ?? '—' }}</div>
        </div>
        <div class="stat-delta positive" v-if="topSpender">
          <i class="fa-solid fa-star"></i> ৳{{ fmtNum(topSpender.totalSpent) }}
        </div>
      </div>
    </div>

    <!-- Leaflet Map -->
    <Transition name="slide-up">
      <div v-if="showMap" class="map-card">
        <div class="chart-header" style="padding:14px 18px 0">
          <div>
            <div class="chart-title">Customer Locations</div>
            <div class="chart-subtitle">Approximate locations based on address data ({{ mapPins.length }} mapped)</div>
          </div>
        </div>
        <div ref="mapEl" style="height:340px;border-radius:0 0 14px 14px;z-index:1"></div>
      </div>
    </Transition>

    <!-- Filters -->
    <div class="admin-filters">
      <div class="search-wrap">
        <i class="fa-sharp fa-solid fa-magnifying-glass search-icon"></i>
        <input class="filter-input" v-model="search" placeholder="Search by name, email, address…" />
      </div>
      <select class="filter-select" v-model="sortBy">
        <option value="totalSpent">Sort: Highest Spent</option>
        <option value="orderCount">Sort: Most Orders</option>
        <option value="lastOrder">Sort: Most Recent</option>
        <option value="name">Sort: Name A–Z</option>
      </select>
      <select class="filter-select" v-model="loyaltyFilter">
        <option value="">All Customers</option>
        <option value="loyal">Loyal (2+ orders)</option>
        <option value="new">New (1 order)</option>
      </select>
    </div>

    <div class="admin-table-wrap">
      <div v-if="adminStore.loading.customers" style="padding:32px;text-align:center;color:var(--text-secondary)">
        <i class="fa-solid fa-spinner-third fa-spin fa-2x"></i><br><br>Loading customers…
      </div>
      <table v-else class="admin-table">
        <thead><tr>
          <th>#</th>
          <th class="sortable" @click="sortBy='name'">Customer</th>
          <th class="sortable" @click="sortBy='orderCount'">Orders</th>
          <th class="sortable" @click="sortBy='totalSpent'">Total Spent</th>
          <th>Avg. Order</th>
          <th class="sortable" @click="sortBy='lastOrder'">Last Order</th>
          <th>Payment</th>
          <th>Status</th>
        </tr></thead>
        <tbody>
          <tr v-for="(c, i) in paginated" :key="c.id">
            <td style="color:var(--text-secondary);font-size:12px">{{ (page-1)*perPage+i+1 }}</td>
            <td>
              <div style="display:flex;align-items:center;gap:10px">
                <div class="customer-avatar" :style="{background: avatarBg(c.id), color: avatarFg(c.id)}">
                  {{ initials(c.name) }}
                </div>
                <div>
                  <div style="font-size:13px;font-weight:600;color:var(--text-primary)">{{ c.name }}</div>
                  <div style="font-size:11px;color:var(--text-secondary)">{{ c.email || c.phone || '—' }}</div>
                  <div v-if="c.address" style="font-size:10px;color:var(--text-secondary);max-width:160px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">
                    <i class="fa-solid fa-location-dot" style="color:var(--brand);font-size:9px"></i> {{ c.address }}
                  </div>
                </div>
              </div>
            </td>
            <td style="font-weight:700">{{ c.orderCount }}</td>
            <td style="font-weight:700;color:var(--brand)">৳{{ c.totalSpent.toLocaleString() }}</td>
            <td style="color:var(--text-secondary)">৳{{ Math.round(c.totalSpent/c.orderCount).toLocaleString() }}</td>
            <td style="font-size:12px;color:var(--text-secondary)">{{ fmtDate(c.lastOrder) }}</td>
            <td><span class="status-badge processing" style="text-transform:capitalize">{{ c.paymentMethod || '—' }}</span></td>
            <td>
              <span class="status-badge" :class="c.orderCount > 1 ? 'delivered' : 'pending'">
                {{ c.orderCount > 1 ? 'Loyal' : 'New' }}
              </span>
            </td>
          </tr>
          <tr v-if="paginated.length === 0">
            <td colspan="8" style="text-align:center;padding:32px;color:var(--text-secondary)">No customers found.</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div style="display:flex;align-items:center;justify-content:space-between;margin-top:14px;flex-wrap:wrap;gap:8px">
      <span style="font-size:12px;color:var(--text-secondary)">
        Showing {{ Math.min((page-1)*perPage+1, filtered.length) }}–{{ Math.min(page*perPage, filtered.length) }} of {{ filtered.length }}
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
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { useAdminStore } from '@/stores/useAdminStore'
import { useExport } from '@/composables/useExport'

const adminStore = useAdminStore()
const exporter   = useExport()

const search        = ref('')
const sortBy        = ref<string>('totalSpent')
const loyaltyFilter = ref('')
const page          = ref(1)
const perPage       = 15
const exportOpen    = ref(false)
const showMap       = ref(false)
const mapEl         = ref<HTMLElement | null>(null)
let leafletMap: any = null

const COLORS = ['#f97316','#3b82f6','#a855f7','#22c55e','#ef4444','#06b6d4','#ec4899','#f59e0b']
function hashIdx(s: string) { let h=0; for(const c of s) h=(h*31+c.charCodeAt(0))%COLORS.length; return Math.abs(h)%COLORS.length }
function avatarBg(id: string) { return COLORS[hashIdx(id)] + '22' }
function avatarFg(id: string) { return COLORS[hashIdx(id)] }
function initials(name: string) { return (name||'?').split(' ').map((w:string)=>w[0]).join('').slice(0,2).toUpperCase() }

// Use real API data (from /api/admin/customers)
const customers = computed(() => adminStore.customers)

const repeatCount = computed(() => customers.value.filter(c=>c.orderCount>1).length)
const avgLtv = computed(() => {
  if (!customers.value.length) return 0
  return Math.round(customers.value.reduce((s,c)=>s+c.totalSpent,0)/customers.value.length)
})
const topSpender = computed(() =>
  customers.value.reduce((a,b) => b.totalSpent > (a?.totalSpent??-1) ? b : a, customers.value[0] ?? null)
)

watch([search, sortBy, loyaltyFilter], () => { page.value = 1 })

const filtered = computed(() => {
  let list = [...customers.value]
  if (search.value) {
    const q = search.value.toLowerCase()
    list = list.filter(c =>
      c.name.toLowerCase().includes(q) ||
      c.email?.toLowerCase().includes(q) ||
      c.address?.toLowerCase().includes(q) ||
      c.phone?.includes(q)
    )
  }
  if (loyaltyFilter.value === 'loyal') list = list.filter(c=>c.orderCount>1)
  if (loyaltyFilter.value === 'new')   list = list.filter(c=>c.orderCount===1)
  list.sort((a:any,b:any) => {
    if (sortBy.value === 'name') return a.name.localeCompare(b.name)
    if (sortBy.value === 'lastOrder') return b.lastOrder.localeCompare(a.lastOrder)
    return (b[sortBy.value]??0) - (a[sortBy.value]??0)
  })
  return list
})

const totalPages = computed(() => Math.max(1, Math.ceil(filtered.value.length/perPage)))
const paginated  = computed(() => filtered.value.slice((page.value-1)*perPage, page.value*perPage))

// Bangladesh city lat/lng lookup for rough mapping
const BD_CITIES: Record<string,{lat:number;lng:number}> = {
  dhaka:{lat:23.8103,lng:90.4125}, chittagong:{lat:22.3569,lng:91.7832},
  sylhet:{lat:24.8949,lng:91.8687}, rajshahi:{lat:24.3745,lng:88.6042},
  khulna:{lat:22.8456,lng:89.5403}, barisal:{lat:22.7010,lng:90.3535},
  rangpur:{lat:25.7439,lng:89.2752}, mymensingh:{lat:24.7471,lng:90.4203},
  comilla:{lat:23.4607,lng:91.1809}, narsingdi:{lat:23.9139,lng:90.7153},
  gazipur:{lat:23.9999,lng:90.4203}, narayanganj:{lat:23.6238,lng:90.4996},
}

function cityCoords(address: string): {lat:number;lng:number}|null {
  const lower = address.toLowerCase()
  for (const [city, coord] of Object.entries(BD_CITIES)) {
    if (lower.includes(city)) return coord
  }
  return null
}

const mapPins = computed(() =>
  customers.value
    .filter(c => c.address)
    .map(c => ({ ...cityCoords(c.address), name: c.name, spent: c.totalSpent, orders: c.orderCount, address: c.address }))
    .filter(p => p.lat) as {lat:number;lng:number;name:string;spent:number;orders:number;address:string}[]
)

// Init Leaflet map
async function initMap() {
  if (!mapEl.value || leafletMap) return
  try {
    const L = (await import('leaflet')).default
    await import('leaflet/dist/leaflet.css')

    leafletMap = L.map(mapEl.value, { center: [23.8103, 90.4125], zoom: 7 })
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(leafletMap)

    // Custom marker icon
    const icon = L.divIcon({
      className: '',
      html: `<div style="width:28px;height:28px;background:#f97316;border:2px solid white;border-radius:50%;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 8px rgba(0,0,0,0.35)"><i class="fa-solid fa-user" style="color:white;font-size:12px"></i></div>`,
      iconSize: [28, 28], iconAnchor: [14, 14]
    })

    mapPins.value.forEach(pin => {
      L.marker([pin.lat + (Math.random()-0.5)*0.08, pin.lng + (Math.random()-0.5)*0.08], { icon })
        .bindPopup(`<b>${pin.name}</b><br><small>${pin.address}</small><br>Orders: ${pin.orders} | Spent: ৳${pin.spent.toLocaleString()}`)
        .addTo(leafletMap)
    })
  } catch (e) { console.error('Leaflet init failed', e) }
}

watch(showMap, async (val) => {
  if (val) { await nextTick(); initMap() }
  else if (leafletMap) { leafletMap.remove(); leafletMap = null }
})

watch(mapPins, () => {
  if (!leafletMap) return
  // re-init for simplicity
  leafletMap.remove(); leafletMap = null
  nextTick(() => initMap())
}, { deep: true })

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'2-digit'})
}
function fmtNum(n: number) { return n>=1000?(n/1000).toFixed(1)+'K':n.toLocaleString() }

function doExport(fmt: 'excel'|'pdf'|'csv'|'json') {
  exportOpen.value = false
  const data = filtered.value.map(c => ({
    Name: c.name, Email: c.email, Phone: c.phone, Address: c.address,
    Orders: c.orderCount, TotalSpent: c.totalSpent,
    AvgOrder: Math.round(c.totalSpent/c.orderCount),
    LastOrder: fmtDate(c.lastOrder), FirstOrder: fmtDate(c.firstOrder),
    Payment: c.paymentMethod, Loyalty: c.orderCount>1?'Loyal':'New'
  }))
  const filename = `customers_${new Date().toISOString().slice(0,10)}`
  if (fmt === 'excel') exporter.exportExcel(data, filename, 'Customers')
  else if (fmt === 'csv') exporter.exportCSV(data, filename)
  else if (fmt === 'json') exporter.exportJSON(data, filename)
  else exporter.exportPDF(
    ['Name','Email','Orders','Total Spent','Last Order','Status'],
    filtered.value.map(c=>[c.name, c.email||'—', c.orderCount, `৳${c.totalSpent}`, fmtDate(c.lastOrder), c.orderCount>1?'Loyal':'New']),
    filename, 'SellBazar — Customers Export'
  )
}

async function load() {
  await adminStore.loadCustomers()
}

onMounted(load)
onUnmounted(() => { if (leafletMap) { leafletMap.remove(); leafletMap = null } })

const vClickOutside = {
  mounted(el: any, binding: any) {
    el._clickHandler = (e: Event) => { if (!el.contains(e.target)) binding.value(e) }
    document.addEventListener('click', el._clickHandler)
  },
  unmounted(el: any) { document.removeEventListener('click', el._clickHandler) }
}
</script>

<style scoped>
.export-wrap { position: relative; }
.export-dropdown {
  position: absolute; top: calc(100% + 6px); right: 0; z-index: 200;
  background: var(--sidebar-bg); border: 1px solid var(--sidebar-border);
  border-radius: 10px; box-shadow: 0 8px 32px rgba(0,0,0,0.25);
  min-width: 160px; overflow: hidden;
}
.export-dropdown button {
  display: flex; align-items: center; gap: 10px; width: 100%; padding: 10px 14px;
  background: none; border: none; color: var(--text-primary); font-size: 13px;
  cursor: pointer; text-align: left; transition: background 0.15s;
}
.export-dropdown button:hover { background: var(--surface-hover); }
.map-card {
  background: var(--sidebar-bg); border: 1px solid var(--sidebar-border);
  border-radius: 14px; margin-bottom: 20px; overflow: hidden;
}
.customer-avatar {
  width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center;
  justify-content: center; font-size: 12px; font-weight: 800; flex-shrink: 0;
}
.sortable { cursor: pointer; user-select: none; }
.sortable:hover { color: var(--brand); }
.slide-up-enter-active, .slide-up-leave-active { transition: opacity 0.25s, transform 0.25s; }
.slide-up-enter-from, .slide-up-leave-to { opacity: 0; transform: translateY(-8px); }
</style>
