<template>
  <div class="admin-page-wrap">
    <!-- ── Page Header ─────────────────────────────────────────────────── -->
    <div class="admin-page-header">
      <div>
        <h1 class="page-title">Products</h1>
        <p class="page-subtitle">{{ filtered.length }} of {{ adminStore.products.length }} products</p>
      </div>
      <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">
        <!-- Export dropdown -->
        <div class="export-wrap" v-click-outside="() => exportOpen = false">
          <button class="admin-btn secondary" @click="exportOpen = !exportOpen">
            <i class="fa-sharp fa-solid fa-file-export"></i> Export
            <i class="fa-solid fa-chevron-down" style="font-size:10px;margin-left:2px"></i>
          </button>
          <div v-if="exportOpen" class="export-dropdown">
            <button @click="doExport('excel')"><i class="fa-solid fa-file-excel" style="color:#22c55e"></i> Excel (.xlsx)</button>
            <button @click="doExport('pdf')"><i class="fa-solid fa-file-pdf" style="color:#ef4444"></i> PDF</button>
            <button @click="doExport('csv')"><i class="fa-solid fa-file-csv" style="color:#3b82f6"></i> CSV</button>
            <button @click="doExport('json')"><i class="fa-solid fa-file-code" style="color:#a855f7"></i> JSON</button>
            <button @click="doExport('image')" :disabled="exportingImage">
              <i class="fa-solid fa-image" style="color:#f97316" :class="{'fa-spin fa-spinner-third': exportingImage}"></i>
              {{ exportingImage ? 'Capturing…' : 'Image (.png)' }}
            </button>
          </div>
        </div>
        <RouterLink to="/admin/products/add" class="admin-btn primary">
          <i class="fa-sharp fa-solid fa-plus"></i> Add Product
        </RouterLink>
      </div>
    </div>

    <!-- ── Filters ────────────────────────────────────────────────────── -->
    <div class="admin-filters">
      <div class="search-wrap">
        <i class="fa-sharp fa-solid fa-magnifying-glass search-icon"></i>
        <input class="filter-input" v-model="search" placeholder="Search products…" />
      </div>
      <select class="filter-select" v-model="catFilter" @change="subFilter = ''">
        <option value="">All Categories</option>
        <option v-for="c in categories" :key="c" :value="c">{{ c }}</option>
      </select>
      <select class="filter-select" v-model="subFilter" :disabled="!catFilter || !subcategoriesForCat.length">
        <option value="">All Subcategories</option>
        <option v-for="s in subcategoriesForCat" :key="s" :value="s">{{ s }}</option>
      </select>
      <select class="filter-select" v-model="stockFilter">
        <option value="">All Stock</option>
        <option value="low">Low (&lt;25)</option>
        <option value="ok">In Stock</option>
        <option value="out">Out of Stock</option>
      </select>
      <select class="filter-select" v-model="featuredFilter">
        <option value="">All Types</option>
        <option value="featured">Featured</option>
        <option value="new">New</option>
      </select>
    </div>

    <!-- ── Table ──────────────────────────────────────────────────────── -->
    <div class="admin-table-wrap" ref="tableWrapRef">
      <div v-if="adminStore.loading.products" style="padding:32px;text-align:center;color:var(--text-secondary)">
        <i class="fa-solid fa-spinner-third fa-spin fa-2x"></i><br><br>Loading products…
      </div>
      <div v-else-if="filtered.length === 0" class="admin-empty">
        <i class="fa-sharp-duotone fa-solid fa-box-open"></i>
        <div>No products found</div>
      </div>
      <table v-else class="admin-table">
        <thead><tr>
          <th class="sortable" @click="setSort('name')">
            Product <SortIcon field="name" :sort="sort" />
          </th>
          <th class="sortable" @click="setSort('category')">
            Category <SortIcon field="category" :sort="sort" />
          </th>
          <th>Subcategory</th>
          <th class="sortable" @click="setSort('price')">
            Price <SortIcon field="price" :sort="sort" />
          </th>
          <th class="sortable" @click="setSort('stock')">
            Stock <SortIcon field="stock" :sort="sort" />
          </th>
          <th class="sortable" @click="setSort('rating')">
            Rating <SortIcon field="rating" :sort="sort" />
          </th>
          <th>Status</th>
          <th class="sortable" @click="setSort('createdAt')">
            Date Added <SortIcon field="createdAt" :sort="sort" />
          </th>
          <th>Store</th>
          <th>Actions</th>
        </tr></thead>
        <tbody>
          <tr v-for="p in paginated" :key="p.id">
            <td>
              <div style="display:flex;align-items:center;gap:10px">
                <img :src="resolveImg(p.images[0])" :alt="p.name"
                  style="width:38px;height:38px;border-radius:8px;object-fit:cover;background:var(--surface-hover);flex-shrink:0"
                  onerror="this.src='https://placehold.co/38x38/f97316/fff?text=?'" />
                <div>
                  <div style="font-weight:600;font-size:13px;max-width:180px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">{{ p.name }}</div>
                  <div style="font-size:11px;color:var(--text-secondary)">{{ p.brand }}</div>
                </div>
              </div>
            </td>
            <td><span class="status-badge processing">{{ p.category }}</span></td>
            <td>
              <span v-if="p.subcategory" class="status-badge inactive" style="font-size:11px">{{ p.subcategory }}</span>
              <span v-else style="color:var(--text-secondary);font-size:12px">—</span>
            </td>
            <td>
              <div style="font-weight:700;color:var(--brand)">৳{{ (p.salePrice || p.price).toLocaleString() }}</div>
              <div v-if="p.salePrice" style="font-size:11px;text-decoration:line-through;color:var(--text-secondary)">৳{{ p.price.toLocaleString() }}</div>
            </td>
            <td>
              <span class="status-badge" :class="p.stock === 0 ? 'cancelled' : p.stock < 10 ? 'cancelled' : p.stock < 25 ? 'pending' : 'delivered'">
                {{ p.stock === 0 ? 'Out' : p.stock }}
              </span>
            </td>
            <td>
              <div style="display:flex;align-items:center;gap:4px">
                <i class="fa-solid fa-star" style="color:#eab308;font-size:11px"></i>
                <span style="font-size:13px;font-weight:600">{{ p.rating }}</span>
                <span style="font-size:11px;color:var(--text-secondary)">({{ p.reviewCount }})</span>
              </div>
            </td>
            <td>
              <div style="display:flex;flex-direction:column;gap:3px">
                <span v-if="p.isFeatured" class="status-badge delivered" style="font-size:10px">Featured</span>
                <span v-if="p.isNew" class="status-badge processing" style="font-size:10px">New</span>
                <span v-if="!p.isFeatured && !p.isNew" class="status-badge inactive" style="font-size:10px">Regular</span>
              </div>
            </td>
            <td>
              <div style="font-size:11px;color:var(--text-secondary);white-space:nowrap">
                {{ p.createdAt ? new Date(p.createdAt).toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' }) : '—' }}
              </div>
            </td>
            <td>
              <RouterLink v-if="p.slug" :to="`/products/${p.slug}`" target="_blank"
                class="admin-btn ghost" style="padding:5px 8px;font-size:11px" title="View store page">
                <i class="fa-solid fa-arrow-up-right-from-square"></i>
              </RouterLink>
              <span v-else style="font-size:11px;color:var(--text-secondary)" title="No slug — resave to fix">—</span>
            </td>
            <td>
              <div style="display:flex;gap:6px">
                <RouterLink :to="`/admin/products/edit/${p.id}`"
                  class="admin-btn ghost" style="padding:5px 10px" title="Edit">
                  <i class="fa-sharp fa-solid fa-pen"></i>
                </RouterLink>
                <button class="admin-btn danger" style="padding:5px 10px" title="Delete" @click="confirmDelete(p)">
                  <i class="fa-sharp fa-solid fa-trash"></i>
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- ── Pagination ─────────────────────────────────────────────────── -->
    <div style="display:flex;align-items:center;justify-content:space-between;margin-top:14px;flex-wrap:wrap;gap:8px">
      <span style="font-size:12px;color:var(--text-secondary)">
        Showing {{ Math.min((page-1)*perPage+1, filtered.length) }}–{{ Math.min(page*perPage, filtered.length) }} of {{ filtered.length }}
      </span>
      <div style="display:flex;gap:6px;align-items:center">
        <select class="filter-select" v-model.number="perPage" style="padding:4px 8px;font-size:12px">
          <option :value="12">12 / page</option>
          <option :value="25">25 / page</option>
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

    <!-- DELETE CONFIRMATION -->
    <Teleport to="body">
      <Transition name="modal-fade">
        <div v-if="deleteTarget" class="modal-backdrop" @click.self="deleteTarget = null">
          <div class="confirm-dialog">
            <div class="confirm-icon">
              <i class="fa-sharp-duotone fa-solid fa-trash-can"></i>
            </div>
            <h3 class="confirm-title">Delete Product?</h3>
            <p class="confirm-body">
              You're about to permanently delete
              <strong>{{ deleteTarget.name }}</strong>.
              This action cannot be undone.
            </p>
            <div class="confirm-actions">
              <button class="admin-btn secondary" @click="deleteTarget = null" :disabled="adminStore.loading.saving">Cancel</button>
              <button class="admin-btn danger" style="flex:1" @click="doDelete" :disabled="adminStore.loading.saving">
                <i v-if="adminStore.loading.saving" class="fa-solid fa-spinner-third fa-spin"></i>
                <i v-else class="fa-sharp fa-solid fa-trash"></i>
                {{ adminStore.loading.saving ? 'Deleting…' : 'Yes, Delete' }}
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
          <i :class="toast.type === 'success' ? 'fa-solid fa-circle-check' : 'fa-solid fa-circle-exclamation'"></i>
          {{ toast.message }}
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, defineComponent, h } from 'vue'
import { useAdminStore } from '@/stores/useAdminStore'
import { useExport } from '@/composables/useExport'
import type { ApiProduct } from '@/composables/useAdminApi'

// Sort icon component
const SortIcon = defineComponent({
  props: { field: String, sort: Object },
  setup(props) {
    return () => {
      const active = props.sort?.field === props.field
      const dir = props.sort?.dir
      if (!active) return h('i', { class: 'fa-solid fa-sort', style: 'opacity:0.3;font-size:10px;margin-left:4px' })
      return h('i', { class: dir === 'asc' ? 'fa-solid fa-sort-up' : 'fa-solid fa-sort-down', style: 'color:var(--brand);font-size:10px;margin-left:4px' })
    }
  }
})

const adminStore = useAdminStore()
const exporter = useExport()

// Filters
const search        = ref('')
const catFilter     = ref('')
const subFilter     = ref('')
const stockFilter   = ref('')
const featuredFilter= ref('')
const page          = ref(1)
const perPage       = ref(12)
const exportOpen    = ref(false)

// Sorting — default: newest first (createdAt desc)
const sort = ref({ field: 'createdAt', dir: 'desc' as 'asc' | 'desc' })
function setSort(field: string) {
  if (sort.value.field === field) sort.value.dir = sort.value.dir === 'asc' ? 'desc' : 'asc'
  else { sort.value.field = field; sort.value.dir = field === 'createdAt' ? 'desc' : 'asc' }
}

const categories = computed(() =>
  [...new Set(adminStore.products.map(p => p.category))].sort()
)

// Subcategory slugs present in products for the selected category
const subcategoriesForCat = computed(() => {
  if (!catFilter.value) return []
  return [...new Set(
    adminStore.products
      .filter(p => p.category === catFilter.value && p.subcategory)
      .map(p => p.subcategory as string)
  )].sort()
})

watch([search, catFilter, subFilter, stockFilter, featuredFilter, perPage], () => { page.value = 1 })

const filtered = computed(() => {
  let list = [...adminStore.products]
  if (search.value) {
    const q = search.value.toLowerCase()
    list = list.filter(p => p.name.toLowerCase().includes(q) || p.brand.toLowerCase().includes(q) || p.category.toLowerCase().includes(q))
  }
  if (catFilter.value) list = list.filter(p => p.category === catFilter.value)
  if (subFilter.value) list = list.filter(p => p.subcategory === subFilter.value)
  if (stockFilter.value === 'low') list = list.filter(p => p.stock > 0 && p.stock < 25)
  if (stockFilter.value === 'ok')  list = list.filter(p => p.stock >= 25)
  if (stockFilter.value === 'out') list = list.filter(p => p.stock === 0)
  if (featuredFilter.value === 'featured') list = list.filter(p => p.isFeatured)
  if (featuredFilter.value === 'new') list = list.filter(p => p.isNew)

  // Sort
  list.sort((a: any, b: any) => {
    const av = a[sort.value.field] ?? ''
    const bv = b[sort.value.field] ?? ''
    const cmp = typeof av === 'number' ? av - bv : String(av).localeCompare(String(bv))
    return sort.value.dir === 'asc' ? cmp : -cmp
  })
  return list
})

const totalPages = computed(() => Math.max(1, Math.ceil(filtered.value.length / perPage.value)))
const paginated  = computed(() => filtered.value.slice((page.value-1)*perPage.value, page.value*perPage.value))

function resolveImg(url: string) {
  if (!url) return 'https://placehold.co/38x38/f97316/fff?text=?'
  // API sometimes returns space-joined URLs in images[0] — take the first one only
  const first = url.trim().split(/\s+/)[0]
  if (first.startsWith('/')) {
    const base = import.meta.env.VITE_API_URL ?? 'http://localhost:4000'
    return `${base}${first}`
  }
  return first
}

// Export
function doExport(fmt: 'excel' | 'pdf' | 'csv' | 'json') {
  exportOpen.value = false
  const data = filtered.value.map(p => ({
    Name: p.name, Brand: p.brand, Category: p.category,
    Price: p.price, SalePrice: p.salePrice, Stock: p.stock,
    Rating: p.rating, Reviews: p.reviewCount,
    Featured: p.isFeatured ? 'Yes' : 'No', New: p.isNew ? 'Yes' : 'No',
    Seller: p.seller, Location: p.location, DeliveryDays: p.deliveryDays,
  }))
  const filename = `products_${new Date().toISOString().slice(0,10)}`
  if (fmt === 'excel') exporter.exportExcel(data, filename, 'Products')
  else if (fmt === 'csv') exporter.exportCSV(data, filename)
  else if (fmt === 'json') exporter.exportJSON(data, filename)
  else exporter.exportPDF(
    ['Name','Brand','Category','Price','Sale','Stock','Rating','Featured'],
    filtered.value.map(p => [p.name, p.brand, p.category, p.price, p.salePrice||'—', p.stock, p.rating, p.isFeatured?'✓':'—']),
    filename, 'SellBazar — Products Export'
  )
}

// Delete
const deleteTarget = ref<ApiProduct | null>(null)
const toast = ref({ show: false, message: '', type: 'success' as 'success' | 'error' })
let toastTimer = 0
function showToast(msg: string, type: 'success' | 'error' = 'success') {
  clearTimeout(toastTimer)
  toast.value = { show: true, message: msg, type }
  toastTimer = window.setTimeout(() => { toast.value.show = false }, 3500)
}
function confirmDelete(p: ApiProduct) { deleteTarget.value = p }
async function doDelete() {
  if (!deleteTarget.value) return
  const name = deleteTarget.value.name
  try {
    await adminStore.deleteProduct(deleteTarget.value.id)
    deleteTarget.value = null
    showToast(`"${name}" deleted`)
  } catch (e: any) {
    deleteTarget.value = null
    showToast(e.message ?? 'Delete failed', 'error')
  }
}

// Click outside directive
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
  display: flex; align-items: center; gap: 10px;
  width: 100%; padding: 10px 14px; background: none; border: none;
  color: var(--text-primary); font-size: 13px; cursor: pointer; text-align: left;
  transition: background 0.15s;
}
.export-dropdown button:hover { background: var(--surface-hover); }
.sortable { cursor: pointer; user-select: none; white-space: nowrap; }
.sortable:hover { color: var(--brand); }
.confirm-dialog {
  background: var(--sidebar-bg); border: 1px solid var(--sidebar-border);
  border-radius: 18px; padding: 32px; width: 100%; max-width: 380px;
  text-align: center; box-shadow: 0 24px 64px rgba(0,0,0,0.4);
}
.confirm-icon {
  width: 60px; height: 60px; margin: 0 auto 16px;
  background: rgba(239,68,68,0.1); border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-size: 26px; color: #ef4444;
}
.confirm-title { font-size: 18px; font-weight: 800; color: var(--text-primary); margin: 0 0 10px; }
.confirm-body { font-size: 13px; color: var(--text-secondary); line-height: 1.6; margin: 0 0 24px; }
.confirm-actions { display: flex; gap: 10px; }
.modal-backdrop { position: fixed; inset: 0; background: rgba(0,0,0,0.65); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; z-index: 9999; padding: 16px; }
.modal-fade-enter-active, .modal-fade-leave-active { transition: opacity 0.2s ease; }
.modal-fade-enter-from, .modal-fade-leave-to { opacity: 0; }
.admin-toast {
  position: fixed; bottom: 28px; right: 28px; z-index: 10000;
  display: flex; align-items: center; gap: 10px; padding: 13px 18px;
  border-radius: 12px; font-size: 14px; font-weight: 600; color: white;
  box-shadow: 0 8px 32px rgba(0,0,0,0.3);
}
.admin-toast.success { background: #16a34a; }
.admin-toast.error   { background: #dc2626; }
.toast-slide-enter-active { animation: toast-in 0.25s ease; }
.toast-slide-leave-active { animation: toast-in 0.2s ease reverse; }
@keyframes toast-in { from { transform: translateY(16px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
</style>
