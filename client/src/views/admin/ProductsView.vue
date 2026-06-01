<template>
  <div class="admin-page-wrap">
    <!-- ── Page Header ─────────────────────────────────────────────────── -->
    <div class="admin-page-header">
      <div>
        <h1 class="page-title">Products</h1>
        <p class="page-subtitle">{{ filtered.length }} of {{ adminStore.products.length }} products</p>
      </div>
      <button class="admin-btn primary" @click="openAdd">
        <i class="fa-sharp fa-solid fa-plus"></i> Add Product
      </button>
    </div>

    <!-- ── Filters ────────────────────────────────────────────────────── -->
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

    <!-- ── Table ──────────────────────────────────────────────────────── -->
    <div class="admin-table-wrap">
      <div v-if="adminStore.loading.products" style="padding:32px;text-align:center;color:var(--text-secondary)">
        <i class="fa-solid fa-spinner-third fa-spin fa-2x"></i><br><br>Loading products…
      </div>
      <div v-else-if="filtered.length === 0" class="admin-empty">
        <i class="fa-sharp-duotone fa-solid fa-box-open"></i>
        <div>No products found</div>
      </div>
      <table v-else class="admin-table">
        <thead><tr>
          <th>Product</th><th>Category</th><th>Price</th><th>Stock</th>
          <th>Rating</th><th>Status</th><th>Actions</th>
        </tr></thead>
        <tbody>
          <tr v-for="p in paginated" :key="p.id">
            <td>
              <div style="display:flex;align-items:center;gap:10px">
                <img :src="p.images[0]" :alt="p.name"
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
              <div style="font-weight:700;color:var(--brand)">৳{{ (p.salePrice || p.price).toLocaleString() }}</div>
              <div v-if="p.salePrice" style="font-size:11px;text-decoration:line-through;color:var(--text-secondary)">৳{{ p.price.toLocaleString() }}</div>
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
            <td>
              <span class="status-badge" :class="p.isFeatured ? 'delivered' : 'inactive'">
                {{ p.isFeatured ? 'Featured' : 'Regular' }}
              </span>
            </td>
            <td>
              <div style="display:flex;gap:6px">
                <button class="admin-btn ghost" style="padding:5px 10px" title="Edit" @click="openEdit(p)">
                  <i class="fa-sharp fa-solid fa-pen"></i>
                </button>
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

    <!-- ═══════════════════════════════════════════════════════════════════ -->
    <!-- ADD / EDIT PRODUCT MODAL                                           -->
    <!-- ═══════════════════════════════════════════════════════════════════ -->
    <Teleport to="body">
      <Transition name="modal-fade">
        <div v-if="showModal" class="modal-backdrop" @click.self="closeModal">
          <div class="product-modal">

            <!-- Modal Header -->
            <div class="modal-header">
              <div class="modal-title-group">
                <div class="modal-icon">
                  <i :class="editingId ? 'fa-sharp fa-solid fa-pen' : 'fa-sharp fa-solid fa-plus'"></i>
                </div>
                <div>
                  <h2 class="modal-title">{{ editingId ? 'Edit Product' : 'Add New Product' }}</h2>
                  <p class="modal-subtitle">{{ editingId ? 'Update product details' : 'Fill in the details to add a new product' }}</p>
                </div>
              </div>
              <button class="modal-close" @click="closeModal"><i class="fa-solid fa-xmark"></i></button>
            </div>

            <!-- Error Banner -->
            <div v-if="formError" class="modal-error">
              <i class="fa-solid fa-circle-exclamation"></i> {{ formError }}
            </div>

            <!-- Modal Body -->
            <div class="modal-body">
              <!-- Row 1: Name + Brand -->
              <div class="form-row">
                <div class="form-group">
                  <label class="form-label">Product Name <span class="req">*</span></label>
                  <input class="form-input" v-model="form.name" placeholder="e.g. Samsung Galaxy A55" />
                </div>
                <div class="form-group">
                  <label class="form-label">Brand <span class="req">*</span></label>
                  <input class="form-input" v-model="form.brand" placeholder="e.g. Samsung" />
                </div>
              </div>

              <!-- Row 2: Category + Seller -->
              <div class="form-row">
                <div class="form-group">
                  <label class="form-label">Category <span class="req">*</span></label>
                  <select class="form-input" v-model="form.category">
                    <option value="" disabled>Select category</option>
                    <option v-for="cat in allCategories" :key="cat" :value="cat">{{ cat }}</option>
                    <option value="__custom__">+ Custom category</option>
                  </select>
                </div>
                <div class="form-group" v-if="form.category === '__custom__'">
                  <label class="form-label">Custom Category <span class="req">*</span></label>
                  <input class="form-input" v-model="customCategory" placeholder="e.g. Sports" />
                </div>
                <div class="form-group" v-else>
                  <label class="form-label">Seller</label>
                  <input class="form-input" v-model="form.seller" placeholder="e.g. TechWorld BD" />
                </div>
              </div>

              <!-- Row 3: Price + Sale Price + Stock -->
              <div class="form-row form-row-3">
                <div class="form-group">
                  <label class="form-label">Price (৳) <span class="req">*</span></label>
                  <input class="form-input" type="number" min="0" v-model.number="form.price" placeholder="0" />
                </div>
                <div class="form-group">
                  <label class="form-label">Sale Price (৳)</label>
                  <input class="form-input" type="number" min="0" v-model.number="form.salePrice" placeholder="0 = no discount" />
                </div>
                <div class="form-group">
                  <label class="form-label">Stock <span class="req">*</span></label>
                  <input class="form-input" type="number" min="0" v-model.number="form.stock" placeholder="0" />
                </div>
              </div>

              <!-- Description -->
              <div class="form-group">
                <label class="form-label">Description</label>
                <textarea class="form-input form-textarea" v-model="form.description" rows="3" placeholder="Product description…"></textarea>
              </div>

              <!-- Image URL -->
              <div class="form-group">
                <label class="form-label">Image URL</label>
                <div style="display:flex;gap:8px;align-items:flex-start">
                  <input class="form-input" v-model="form.imageUrl" placeholder="https://example.com/image.jpg" style="flex:1" />
                  <div v-if="form.imageUrl" class="img-preview">
                    <img :src="form.imageUrl" alt="preview" onerror="this.style.display='none'" />
                  </div>
                </div>
              </div>

              <!-- Row 4: Location + Delivery Days -->
              <div class="form-row">
                <div class="form-group">
                  <label class="form-label">Location</label>
                  <input class="form-input" v-model="form.location" placeholder="e.g. Dhaka" />
                </div>
                <div class="form-group">
                  <label class="form-label">Delivery Days</label>
                  <input class="form-input" type="number" min="1" v-model.number="form.deliveryDays" placeholder="3" />
                </div>
              </div>

              <!-- Toggles -->
              <div class="form-toggles">
                <label class="toggle-item">
                  <input type="checkbox" v-model="form.isFeatured" />
                  <span class="toggle-ui"></span>
                  <span class="toggle-label">Featured Product</span>
                </label>
                <label class="toggle-item">
                  <input type="checkbox" v-model="form.isNew" />
                  <span class="toggle-ui"></span>
                  <span class="toggle-label">Mark as New</span>
                </label>
              </div>
            </div>

            <!-- Modal Footer -->
            <div class="modal-footer">
              <button class="admin-btn secondary" @click="closeModal" :disabled="adminStore.loading.saving">
                Cancel
              </button>
              <button class="admin-btn primary" @click="submitForm" :disabled="adminStore.loading.saving || !isFormValid">
                <i v-if="adminStore.loading.saving" class="fa-solid fa-spinner-third fa-spin"></i>
                <i v-else :class="editingId ? 'fa-sharp fa-solid fa-floppy-disk' : 'fa-sharp fa-solid fa-plus'"></i>
                {{ adminStore.loading.saving ? 'Saving…' : editingId ? 'Save Changes' : 'Add Product' }}
              </button>
            </div>

          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- ═══════════════════════════════════════════════════════════════════ -->
    <!-- DELETE CONFIRMATION DIALOG                                         -->
    <!-- ═══════════════════════════════════════════════════════════════════ -->
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
              <button class="admin-btn secondary" @click="deleteTarget = null" :disabled="adminStore.loading.saving">
                Cancel
              </button>
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

    <!-- ── Toast notification ──────────────────────────────────────────── -->
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
import { ref, computed, reactive } from 'vue'
import { useAdminStore } from '@/stores/useAdminStore'
import type { ApiProduct } from '@/composables/useAdminApi'

const adminStore = useAdminStore()

// ── Filters & pagination ────────────────────────────────────────────────────
const search      = ref('')
const catFilter   = ref('')
const stockFilter = ref('')
const page        = ref(1)
const perPage     = 12

const categories = computed(() =>
  [...new Set(adminStore.products.map(p => p.category))].sort()
)

const allCategories = ['Electronics', 'Fashion', 'Grocery', 'Home & Living', 'Beauty', 'Business', 'Sports', 'Toys']

const filtered = computed(() => {
  let list = adminStore.products
  if (search.value) {
    const q = search.value.toLowerCase()
    list = list.filter(p => p.name.toLowerCase().includes(q) || p.brand.toLowerCase().includes(q))
  }
  if (catFilter.value) list = list.filter(p => p.category === catFilter.value)
  if (stockFilter.value === 'low') list = list.filter(p => p.stock < 25)
  if (stockFilter.value === 'ok')  list = list.filter(p => p.stock >= 25)
  return list
})

const totalPages = computed(() => Math.max(1, Math.ceil(filtered.value.length / perPage)))
const paginated  = computed(() => filtered.value.slice((page.value-1)*perPage, page.value*perPage))

// ── Toast ────────────────────────────────────────────────────────────────────
const toast = reactive({ show: false, message: '', type: 'success' as 'success' | 'error' })
let toastTimer: number
function showToast(message: string, type: 'success' | 'error' = 'success') {
  clearTimeout(toastTimer)
  toast.message = message
  toast.type    = type
  toast.show    = true
  toastTimer    = window.setTimeout(() => { toast.show = false }, 3500)
}

// ── Modal state ──────────────────────────────────────────────────────────────
const showModal    = ref(false)
const editingId    = ref<string | null>(null)
const formError    = ref('')
const customCategory = ref('')

const blankForm = () => ({
  name:         '',
  brand:        '',
  category:     '',
  seller:       '',
  price:        0,
  salePrice:    0,
  stock:        0,
  description:  '',
  imageUrl:     '',
  location:     'Dhaka',
  deliveryDays: 3,
  isFeatured:   false,
  isNew:        true,
})

const form = reactive(blankForm())

const isFormValid = computed(() =>
  form.name.trim() !== '' &&
  form.brand.trim() !== '' &&
  (form.category !== '' && form.category !== '__custom__' || customCategory.value.trim() !== '') &&
  form.price > 0 &&
  form.stock >= 0
)

function openAdd() {
  editingId.value = null
  formError.value = ''
  customCategory.value = ''
  Object.assign(form, blankForm())
  showModal.value = true
}

function openEdit(product: ApiProduct) {
  editingId.value = product.id
  formError.value = ''
  customCategory.value = ''
  Object.assign(form, {
    name:         product.name,
    brand:        product.brand,
    category:     product.category,
    seller:       product.seller,
    price:        product.price,
    salePrice:    product.salePrice,
    stock:        product.stock,
    description:  product.description,
    imageUrl:     product.images?.[0] ?? '',
    location:     product.location,
    deliveryDays: product.deliveryDays,
    isFeatured:   product.isFeatured ?? false,
    isNew:        product.isNew ?? false,
  })
  showModal.value = true
}

function closeModal() {
  showModal.value = false
  editingId.value = null
  formError.value = ''
}

async function submitForm() {
  formError.value = ''
  const resolvedCategory = form.category === '__custom__' ? customCategory.value.trim() : form.category

  if (!form.name.trim() || !form.brand.trim() || !resolvedCategory || form.price <= 0) {
    formError.value = 'Please fill in all required fields.'
    return
  }

  const payload = {
    name:         form.name.trim(),
    brand:        form.brand.trim(),
    category:     resolvedCategory,
    categoryBn:   resolvedCategory,
    seller:       form.seller.trim() || form.brand.trim(),
    price:        form.price,
    salePrice:    form.salePrice || 0,
    stock:        form.stock,
    description:  form.description.trim(),
    images:       form.imageUrl.trim() ? [form.imageUrl.trim()] : [],
    location:     form.location.trim() || 'Dhaka',
    deliveryDays: form.deliveryDays || 3,
    isFeatured:   form.isFeatured,
    isNew:        form.isNew,
  }

  try {
    if (editingId.value) {
      await adminStore.updateProduct(editingId.value, payload)
      showToast(`"${form.name}" updated successfully`)
    } else {
      await adminStore.createProduct(payload)
      showToast(`"${form.name}" added successfully`)
    }
    closeModal()
  } catch (e: any) {
    formError.value = e.message ?? 'Failed to save product'
  }
}

// ── Delete confirm ───────────────────────────────────────────────────────────
const deleteTarget = ref<ApiProduct | null>(null)

function confirmDelete(product: ApiProduct) {
  deleteTarget.value = product
}

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
</script>

<style scoped>
/* ── Modal backdrop ─────────────────────────────────────────────────────── */
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.65);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  padding: 16px;
}

/* ── Product modal ──────────────────────────────────────────────────────── */
.product-modal {
  background: var(--sidebar-bg);
  border: 1px solid var(--sidebar-border);
  border-radius: 20px;
  width: 100%;
  max-width: 680px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 32px 80px rgba(0,0,0,0.4);
  overflow: hidden;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px;
  border-bottom: 1px solid var(--sidebar-border);
  flex-shrink: 0;
  gap: 12px;
}
.modal-title-group {
  display: flex;
  align-items: center;
  gap: 14px;
}
.modal-icon {
  width: 40px;
  height: 40px;
  background: var(--brand-dim);
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--brand);
  font-size: 16px;
  flex-shrink: 0;
}
.modal-title {
  font-size: 17px;
  font-weight: 800;
  color: var(--text-primary);
  letter-spacing: -0.03em;
  margin: 0;
}
.modal-subtitle {
  font-size: 12px;
  color: var(--text-secondary);
  margin: 2px 0 0;
}
.modal-close {
  background: none;
  border: none;
  color: var(--text-secondary);
  font-size: 16px;
  cursor: pointer;
  padding: 6px;
  border-radius: 8px;
  transition: background 0.15s, color 0.15s;
  flex-shrink: 0;
}
.modal-close:hover { background: var(--surface-hover); color: var(--text-primary); }

.modal-error {
  margin: 14px 24px 0;
  background: rgba(239,68,68,0.1);
  border: 1px solid rgba(239,68,68,0.25);
  color: #ef4444;
  border-radius: 10px;
  padding: 10px 14px;
  font-size: 13px;
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.modal-body {
  padding: 20px 24px;
  overflow-y: auto;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.modal-footer {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
  padding: 16px 24px;
  border-top: 1px solid var(--sidebar-border);
  flex-shrink: 0;
}

/* ── Form elements ──────────────────────────────────────────────────────── */
.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
}
.form-row-3 {
  grid-template-columns: 1fr 1fr 1fr;
}
@media (max-width: 560px) {
  .form-row, .form-row-3 { grid-template-columns: 1fr; }
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.form-label {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
.req { color: var(--brand); }

.form-input {
  padding: 10px 13px;
  background: var(--admin-bg);
  border: 1px solid var(--sidebar-border);
  border-radius: 9px;
  color: var(--text-primary);
  font-size: 13px;
  outline: none;
  transition: border-color 0.15s, box-shadow 0.15s;
  width: 100%;
  box-sizing: border-box;
}
.form-input:focus {
  border-color: var(--brand);
  box-shadow: 0 0 0 3px rgba(249,115,22,0.12);
}
.form-input::placeholder { color: var(--text-secondary); opacity: 0.6; }
.form-textarea { resize: vertical; min-height: 72px; }

select.form-input {
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%238888a0' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 12px center;
  padding-right: 32px;
}

/* ── Image preview ──────────────────────────────────────────────────────── */
.img-preview {
  width: 48px;
  height: 48px;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid var(--sidebar-border);
  background: var(--surface-hover);
  flex-shrink: 0;
}
.img-preview img { width: 100%; height: 100%; object-fit: cover; }

/* ── Checkbox toggles ───────────────────────────────────────────────────── */
.form-toggles {
  display: flex;
  gap: 20px;
  flex-wrap: wrap;
}
.toggle-item {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  user-select: none;
}
.toggle-item input[type="checkbox"] { display: none; }
.toggle-ui {
  width: 38px;
  height: 21px;
  border-radius: 21px;
  background: var(--sidebar-border);
  position: relative;
  flex-shrink: 0;
  transition: background 0.2s;
}
.toggle-ui::before {
  content: '';
  position: absolute;
  width: 15px;
  height: 15px;
  border-radius: 50%;
  background: white;
  top: 3px;
  left: 3px;
  transition: transform 0.2s;
}
.toggle-item input:checked + .toggle-ui { background: var(--brand); }
.toggle-item input:checked + .toggle-ui::before { transform: translateX(17px); }
.toggle-label { font-size: 13px; font-weight: 500; color: var(--text-primary); }

/* ── Delete confirm dialog ──────────────────────────────────────────────── */
.confirm-dialog {
  background: var(--sidebar-bg);
  border: 1px solid var(--sidebar-border);
  border-radius: 18px;
  padding: 32px;
  width: 100%;
  max-width: 380px;
  text-align: center;
  box-shadow: 0 24px 64px rgba(0,0,0,0.4);
}
.confirm-icon {
  width: 60px;
  height: 60px;
  margin: 0 auto 16px;
  background: rgba(239,68,68,0.1);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 26px;
  color: #ef4444;
}
.confirm-title {
  font-size: 18px;
  font-weight: 800;
  color: var(--text-primary);
  margin: 0 0 10px;
  letter-spacing: -0.03em;
}
.confirm-body {
  font-size: 13px;
  color: var(--text-secondary);
  line-height: 1.6;
  margin: 0 0 24px;
}
.confirm-body strong { color: var(--text-primary); }
.confirm-actions {
  display: flex;
  gap: 10px;
}

/* ── Toast ──────────────────────────────────────────────────────────────── */
.admin-toast {
  position: fixed;
  bottom: 28px;
  right: 28px;
  z-index: 10000;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 13px 18px;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 600;
  color: white;
  box-shadow: 0 8px 32px rgba(0,0,0,0.3);
}
.admin-toast.success { background: #16a34a; }
.admin-toast.error   { background: #dc2626; }

/* ── Transitions ────────────────────────────────────────────────────────── */
.modal-fade-enter-active, .modal-fade-leave-active { transition: opacity 0.2s ease; }
.modal-fade-enter-from, .modal-fade-leave-to { opacity: 0; }
.modal-fade-enter-active .product-modal,
.modal-fade-enter-active .confirm-dialog { animation: modal-pop 0.2s ease; }
@keyframes modal-pop {
  from { transform: scale(0.95) translateY(10px); opacity: 0; }
  to   { transform: scale(1) translateY(0); opacity: 1; }
}

.toast-slide-enter-active { animation: toast-in 0.25s ease; }
.toast-slide-leave-active { animation: toast-in 0.2s ease reverse; }
@keyframes toast-in {
  from { transform: translateY(16px); opacity: 0; }
  to   { transform: translateY(0); opacity: 1; }
}
</style>
