<template>
  <div class="admin-page-wrap">
    <div class="admin-page-header">
      <div>
        <h1 class="page-title">Products</h1>
        <p class="page-subtitle">{{ filtered.length }} of {{ adminStore.products.length }} products</p>
      </div>
      <button class="admin-btn primary"><i class="fa-sharp fa-solid fa-plus"></i> Add Product</button>
    </div>

    <div class="admin-filters">
      <div class="search-wrap">
        <i class="fa-sharp fa-solid fa-magnifying-glass search-icon"></i>
        <input class="filter-input" v-model="search" placeholder="Search products…" />
      </div>
      <select class="filter-select" v-model="catFilter">
        <option value="">All Categories</option>
        <option v-for="c in categories" :key="c" :value="c">{{ c }}</option>
      </select>
      <select class="filter-select" v-model="stockFilter">
        <option value="">All Stock</option>
        <option value="low">Low (&lt;25)</option>
        <option value="ok">In Stock</option>
      </select>
    </div>

    <div class="admin-table-wrap">
      <div v-if="adminStore.loading.products" style="padding:32px;text-align:center;color:var(--text-secondary)">
        <i class="fa-solid fa-spinner-third fa-spin fa-2x"></i><br><br>Loading products…
      </div>
      <table v-else class="admin-table">
        <thead><tr>
          <th>Product</th><th>Category</th><th>Price</th><th>Stock</th><th>Rating</th><th>Status</th><th>Actions</th>
        </tr></thead>
        <tbody>
          <tr v-for="p in paginated" :key="p.id">
            <td>
              <div style="display:flex;align-items:center;gap:10px">
                <img :src="p.images[0]" :alt="p.name" style="width:36px;height:36px;border-radius:7px;object-fit:cover;background:var(--surface-hover)" onerror="this.src='https://via.placeholder.com/36'" />
                <div>
                  <div style="font-weight:600;font-size:13px;max-width:180px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">{{ p.name }}</div>
                  <div style="font-size:11px;color:var(--text-secondary)">{{ p.brand }}</div>
                </div>
              </div>
            </td>
            <td><span class="status-badge processing">{{ p.category }}</span></td>
            <td>
              <div style="font-weight:700;color:var(--brand)">৳{{ p.salePrice || p.price }}</div>
              <div v-if="p.salePrice" style="font-size:11px;text-decoration:line-through;color:var(--text-secondary)">৳{{ p.price }}</div>
            </td>
            <td>
              <span class="status-badge" :class="p.stock < 10 ? 'cancelled' : p.stock < 25 ? 'pending' : 'delivered'">
                {{ p.stock }}
              </span>
            </td>
            <td>
              <div style="display:flex;align-items:center;gap:4px">
                <i class="fa-solid fa-star" style="color:#eab308;font-size:11px"></i>
                <span style="font-size:13px;font-weight:600">{{ p.rating }}</span>
                <span style="font-size:11px;color:var(--text-secondary)">({{ p.reviewCount }})</span>
              </div>
            </td>
            <td><span class="status-badge" :class="p.isFeatured ? 'delivered' : 'inactive'">{{ p.isFeatured ? 'Featured' : 'Regular' }}</span></td>
            <td>
              <div style="display:flex;gap:6px">
                <button class="admin-btn ghost" style="padding:5px 8px"><i class="fa-sharp fa-solid fa-pen"></i></button>
                <button class="admin-btn danger" style="padding:5px 8px"><i class="fa-sharp fa-solid fa-trash"></i></button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Pagination -->
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
const search      = ref('')
const catFilter   = ref('')
const stockFilter = ref('')
const page        = ref(1)
const perPage     = 12

const categories = computed(() => [...new Set(adminStore.products.map(p => p.category))].sort())

const filtered = computed(() => {
  let list = adminStore.products
  if (search.value) {
    const q = search.value.toLowerCase()
    list = list.filter(p => p.name.toLowerCase().includes(q) || p.brand.toLowerCase().includes(q))
  }
  if (catFilter.value) list = list.filter(p => p.category === catFilter.value)
  if (stockFilter.value === 'low') list = list.filter(p => p.stock < 25)
  if (stockFilter.value === 'ok') list = list.filter(p => p.stock >= 25)
  return list
})

const totalPages = computed(() => Math.max(1, Math.ceil(filtered.value.length / perPage)))
const paginated  = computed(() => filtered.value.slice((page.value-1)*perPage, page.value*perPage))
</script>
