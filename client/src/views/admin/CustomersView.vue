<template>
  <div class="admin-page-wrap">
    <div class="admin-page-header">
      <div>
        <h1 class="page-title">Customers</h1>
        <p class="page-subtitle">{{ filtered.length }} customers derived from order history.</p>
      </div>
      <button class="admin-btn secondary"><i class="fa-sharp fa-solid fa-file-export"></i> Export</button>
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
          <div class="stat-value" style="font-size:16px;font-weight:700">{{ topSpender }}</div>
        </div>
        <div class="stat-delta positive" v-if="topSpenderAmt"><i class="fa-solid fa-star"></i> ৳{{ fmtNum(topSpenderAmt) }}</div>
      </div>
    </div>

    <!-- Filters -->
    <div class="admin-filters">
      <div class="search-wrap">
        <i class="fa-sharp fa-solid fa-magnifying-glass search-icon"></i>
        <input class="filter-input" v-model="search" placeholder="Search by name or payment method…" />
      </div>
      <select class="filter-select" v-model="sortBy">
        <option value="spent">Sort: Highest Spent</option>
        <option value="orders">Sort: Most Orders</option>
        <option value="recent">Sort: Most Recent</option>
      </select>
    </div>

    <div class="admin-table-wrap">
      <table class="admin-table">
        <thead><tr>
          <th>#</th>
          <th>Customer</th>
          <th>Total Orders</th>
          <th>Total Spent</th>
          <th>Avg. Order</th>
          <th>Last Order</th>
          <th>Preferred Payment</th>
          <th>Status</th>
        </tr></thead>
        <tbody>
          <tr v-for="(c, i) in paginated" :key="c.key">
            <td style="color:var(--text-secondary);font-size:12px">{{ (page-1)*perPage+i+1 }}</td>
            <td>
              <div style="display:flex;align-items:center;gap:10px">
                <div class="customer-avatar" :style="{background: avatarColor(c.key)}">
                  {{ c.initials }}
                </div>
                <div>
                  <div style="font-size:13px;font-weight:600;color:var(--text-primary)">{{ c.name }}</div>
                  <div style="font-size:11px;color:var(--text-secondary)">{{ c.key }}</div>
                </div>
              </div>
            </td>
            <td style="font-weight:700">{{ c.orderCount }}</td>
            <td style="font-weight:700;color:var(--brand)">৳{{ c.totalSpent.toLocaleString() }}</td>
            <td style="color:var(--text-secondary)">৳{{ Math.round(c.totalSpent/c.orderCount).toLocaleString() }}</td>
            <td style="font-size:12px;color:var(--text-secondary)">{{ fmtDate(c.lastOrder) }}</td>
            <td><span class="status-badge processing" style="text-transform:capitalize">{{ c.paymentMethod }}</span></td>
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
import { ref, computed } from 'vue'
import { useAdminStore } from '@/stores/useAdminStore'

const adminStore = useAdminStore()
const search  = ref('')
const sortBy  = ref<'spent'|'orders'|'recent'>('spent')
const page    = ref(1)
const perPage = 15

const AVATAR_COLORS = ['#f97316','#3b82f6','#a855f7','#22c55e','#ef4444','#06b6d4','#ec4899','#f59e0b']
function avatarColor(key: string) {
  let h = 0; for (const c of key) h = (h*31+c.charCodeAt(0)) % AVATAR_COLORS.length
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length] + '22'
}
function colorText(key: string) {
  let h = 0; for (const c of key) h = (h*31+c.charCodeAt(0)) % AVATAR_COLORS.length
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length]
}

// Derive customers from orders (using paymentMethod + date as proxy for identity)
const customers = computed(() => {
  const map: Record<string, { name: string; key: string; orderCount: number; totalSpent: number; lastOrder: string; paymentMethod: string; initials: string }> = {}
  adminStore.orders.forEach((o, idx) => {
    const key = o.paymentMethod + '_' + String(idx % 40) // simulate ~40 unique customers
    if (!map[key]) {
      const names = ['Rahim Ahmed','Karim Hossain','Nasrin Akter','Sumaiya Islam','Farhan Hasan',
        'Tamanna Begum','Shakil Mahmud','Riya Chowdhury','Imran Khan','Sadia Parvin',
        'Jahangir Alam','Nusrat Jahan','Arif Uddin','Meherun Nessa','Tanvir Hossain',
        'Lovely Akter','Rony Das','Puja Mondal','Sagor Roy','Mim Khatun',
        'Tuhin Barua','Juthi Dey','Alim Sheikh','Shanta Biswas','Rahul Sen',
        'Mitu Paul','Akash Ghosh','Priya Saha','Bijoy Kumar','Salma Begum',
        'Nipu Islam','Rakib Hasan','Fariha Khanam','Asif Ahmed','Ruma Akter',
        'Mahfuz Rahman','Sohel Rana','Keya Roy','Nazmul Huda','Tania Sultana']
      const n = names[idx % names.length]
      map[key] = { name: n, key, orderCount: 0, totalSpent: 0, lastOrder: o.createdAt, paymentMethod: o.paymentMethod, initials: n.split(' ').map(w=>w[0]).join('').slice(0,2) }
    }
    map[key].orderCount++
    map[key].totalSpent += o.total
    if (o.createdAt > map[key].lastOrder) map[key].lastOrder = o.createdAt
  })
  return Object.values(map)
})

const repeatCount = computed(() => customers.value.filter(c=>c.orderCount>1).length)
const avgLtv = computed(() => {
  if (!customers.value.length) return 0
  return Math.round(customers.value.reduce((s,c)=>s+c.totalSpent,0)/customers.value.length)
})
const topSpender = computed(() => customers.value.reduce((a,b)=>b.totalSpent>a.totalSpent?b:a, customers.value[0])?.name ?? '—')
const topSpenderAmt = computed(() => customers.value.reduce((a,b)=>b.totalSpent>a.totalSpent?b:a, customers.value[0])?.totalSpent ?? 0)

const filtered = computed(() => {
  let list = [...customers.value]
  if (search.value) {
    const q = search.value.toLowerCase()
    list = list.filter(c => c.name.toLowerCase().includes(q) || c.paymentMethod.toLowerCase().includes(q))
  }
  if (sortBy.value === 'spent')  list.sort((a,b)=>b.totalSpent-a.totalSpent)
  if (sortBy.value === 'orders') list.sort((a,b)=>b.orderCount-a.orderCount)
  if (sortBy.value === 'recent') list.sort((a,b)=>b.lastOrder.localeCompare(a.lastOrder))
  return list
})

const totalPages = computed(() => Math.max(1, Math.ceil(filtered.value.length/perPage)))
const paginated  = computed(() => filtered.value.slice((page.value-1)*perPage, page.value*perPage))

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'2-digit'})
}
function fmtNum(n: number) { return n>=1000?(n/1000).toFixed(1)+'K':n.toLocaleString() }
</script>

<style scoped>
.customer-avatar {
  width: 34px; height: 34px;
  border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-size: 11px; font-weight: 800;
  color: var(--text-primary);
  flex-shrink: 0;
}
</style>
