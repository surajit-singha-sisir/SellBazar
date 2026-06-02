<template>
  <div class="admin-page-wrap">
    <!-- Header -->
    <div class="admin-page-header">
      <div style="display:flex;align-items:center;gap:12px">
        <RouterLink to="/admin/products" class="admin-btn ghost" style="padding:6px 10px">
          <i class="fa-solid fa-arrow-left"></i>
        </RouterLink>
        <div>
          <h1 class="page-title">{{ isEdit ? 'Edit Product' : 'Add New Product' }}</h1>
          <p class="page-subtitle">{{ isEdit ? `Editing: ${form.name || '…'}` : 'Fill in details to create a new product' }}</p>
        </div>
      </div>
      <div style="display:flex;gap:8px">
        <RouterLink to="/admin/products" class="admin-btn secondary">Cancel</RouterLink>
        <button class="admin-btn primary" @click="submitForm" :disabled="saving || !isFormValid">
          <i v-if="saving" class="fa-solid fa-spinner-third fa-spin"></i>
          <i v-else class="fa-sharp fa-solid fa-floppy-disk"></i>
          {{ saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Product' }}
        </button>
      </div>
    </div>

    <!-- Error banner -->
    <div v-if="formError" class="pf-error-banner">
      <i class="fa-solid fa-circle-exclamation"></i> {{ formError }}
    </div>

    <div class="pf-grid">
      <!-- LEFT: main fields -->
      <div class="pf-main">
        <!-- Basic Info -->
        <div class="pf-card">
          <div class="pf-card-title">Basic Information</div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Product Name <span class="req">*</span></label>
              <input class="form-input" v-model="form.name" placeholder="e.g. Samsung Galaxy A55 5G" />
            </div>
            <div class="form-group">
              <label class="form-label">Brand <span class="req">*</span></label>
              <input class="form-input" v-model="form.brand" placeholder="e.g. Samsung" />
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">Description</label>
            <div ref="quillContainer" class="quill-editor-wrap"></div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Category <span class="req">*</span></label>
              <select class="form-input" v-model="form.category" @change="form.subcategory = ''">
                <option value="" disabled>Select category</option>
                <option v-for="cat in categoryList" :key="cat.slug" :value="cat.name">{{ cat.name }}</option>
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
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Subcategory</label>
              <!-- Show a select when the chosen category has subcategories, otherwise a free-text input -->
              <select
                v-if="subcategoryOptions.length"
                class="form-input"
                v-model="form.subcategory"
              >
                <option value="">— None —</option>
                <option v-for="sub in subcategoryOptions" :key="sub.slug" :value="sub.slug">
                  {{ sub.name }}
                </option>
              </select>
              <input
                v-else
                class="form-input"
                v-model="form.subcategory"
                placeholder="e.g. mobile-phones"
              />
              <span v-if="subcategoryOptions.length" class="form-hint">
                {{ subcategoryOptions.length }} subcategories in {{ form.category }}
              </span>
            </div>
            <div class="form-group">
              <label class="form-label">Bangla Name (optional)</label>
              <input class="form-input" v-model="form.nameBn" placeholder="e.g. স্যামসাং গ্যালাক্সি" />
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Tags</label>
              <input class="form-input" v-model="tagsInput" placeholder="phone, samsung, 5g (comma separated)" />
            </div>
            <div class="form-group">
              <label class="form-label">Location</label>
              <input class="form-input" v-model="form.location" placeholder="e.g. Dhaka" />
            </div>
          </div>
        </div>

        <!-- Pricing & Stock -->
        <div class="pf-card">
          <div class="pf-card-title">Pricing & Stock</div>
          <div class="form-row form-row-3">
            <div class="form-group">
              <label class="form-label">Regular Price (৳) <span class="req">*</span></label>
              <input class="form-input" type="number" min="0" v-model.number="form.price" placeholder="0" />
            </div>
            <div class="form-group">
              <label class="form-label">Sale Price (৳)</label>
              <input class="form-input" type="number" min="0" v-model.number="form.salePrice" placeholder="0 = no discount" />
              <span v-if="discountPct > 0" class="discount-badge">{{ discountPct }}% off</span>
            </div>
            <div class="form-group">
              <label class="form-label">Stock Qty <span class="req">*</span></label>
              <input class="form-input" type="number" min="0" v-model.number="form.stock" placeholder="0" />
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Delivery Days</label>
              <input class="form-input" type="number" min="1" v-model.number="form.deliveryDays" placeholder="3" />
            </div>
            <div class="form-group">
              <label class="form-label">Rating (0–5)</label>
              <input class="form-input" type="number" min="0" max="5" step="0.1" v-model.number="form.rating" placeholder="4.5" />
            </div>
          </div>
        </div>

        <!-- Flags -->
        <div class="pf-card">
          <div class="pf-card-title">Product Flags</div>
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
      </div>

      <!-- RIGHT: images -->
      <div class="pf-side">
        <div class="pf-card">
          <div class="pf-card-title">Product Images</div>

          <!-- Upload by file -->
          <div class="upload-zone" @click="fileInput?.click()" @dragover.prevent @drop.prevent="onDrop">
            <input ref="fileInput" type="file" accept="image/*" multiple style="display:none" @change="onFileChange" />
            <i class="fa-solid fa-cloud-arrow-up" style="font-size:28px;color:var(--brand);margin-bottom:8px"></i>
            <div style="font-weight:600;font-size:13px">Drop images here or click to upload</div>
            <div style="font-size:11px;color:var(--text-secondary);margin-top:4px">PNG, JPG, WEBP — any size (auto-compressed to ≤ 1200px)</div>
            <div v-if="uploading" style="margin-top:8px;color:var(--brand);font-size:12px">
              <i class="fa-solid fa-spinner-third fa-spin"></i> Compressing &amp; uploading…
            </div>
          </div>

          <!-- Add by URL -->
          <div style="display:flex;gap:8px;margin-top:12px">
            <input class="form-input" v-model="urlInput" placeholder="Or paste image URL…" style="flex:1" />
            <button class="admin-btn secondary" style="padding:8px 14px;flex-shrink:0" @click="addImageUrl">
              <i class="fa-solid fa-plus"></i> Add
            </button>
          </div>

          <!-- Preview gallery -->
          <div v-if="form.images.length" class="img-gallery">
            <div v-for="(img, idx) in form.images" :key="idx" class="img-thumb-wrap">
              <img :src="resolveImg(img)" :alt="`Image ${idx+1}`" class="img-thumb"
                onerror="this.src='https://placehold.co/80x80/f97316/fff?text=?'" />
              <span v-if="idx === 0" class="img-primary-badge">Main</span>
              <span v-if="img.startsWith('data:')" class="img-size-badge">{{ imgKb(img) }}KB</span>
              <button class="img-remove-btn" @click="removeImage(idx)">
                <i class="fa-solid fa-xmark"></i>
              </button>
              <div class="img-move-btns">
                <button @click="moveImage(idx, -1)" :disabled="idx===0"><i class="fa-solid fa-chevron-left"></i></button>
                <button @click="moveImage(idx, 1)" :disabled="idx===form.images.length-1"><i class="fa-solid fa-chevron-right"></i></button>
              </div>
            </div>
          </div>
          <div v-else style="text-align:center;padding:16px;color:var(--text-secondary);font-size:12px">
            No images yet. Upload or add a URL above.
          </div>

          <!-- Store page link (edit mode) -->
          <div v-if="isEdit && currentSlug" style="margin-top:16px;padding-top:14px;border-top:1px solid var(--sidebar-border)">
            <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;color:var(--text-secondary);margin-bottom:8px">
              Store Page
            </div>
            <RouterLink :to="`/products/${currentSlug}`" target="_blank"
              style="display:flex;align-items:center;gap:8px;font-size:13px;font-weight:600;color:var(--brand);text-decoration:none">
              <i class="fa-solid fa-arrow-up-right-from-square"></i>
              View on store →
            </RouterLink>
          </div>
        </div>
      </div>
    </div>

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
import { ref, computed, reactive, onMounted, nextTick } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAdminStore } from '@/stores/useAdminStore'
import { useAdminApi } from '@/composables/useAdminApi'

const router = useRouter()
const route  = useRoute()
const adminStore = useAdminStore()
const api = useAdminApi()

const isEdit = computed(() => !!route.params.id)
const currentSlug = ref('')

const saving    = ref(false)
const uploading = ref(false)
const formError = ref('')
const fileInput = ref<HTMLInputElement | null>(null)
const urlInput  = ref('')
const tagsInput = ref('')
const customCategory = ref('')
const quillContainer = ref<HTMLElement | null>(null)
let quillInstance: any = null

// ── Live categories from API ──────────────────────────────────────────────────
interface ApiSubcat { id: string; slug: string; name: string; nameBn: string; icon: string }
interface ApiCat    { id: string; slug: string; name: string; nameBn: string; icon: string; color: string; subcategories: ApiSubcat[] }

const categoryList = ref<ApiCat[]>([])

async function loadCategoryList() {
  try {
    categoryList.value = await api.fetchCategories()
  } catch {
    // fallback hardcoded names if API fails
    categoryList.value = ['Electronics','Fashion','Grocery','Home & Living','Beauty','Business','Sports','Toys','Books']
      .map((name, i) => ({ id: String(i), slug: name.toLowerCase().replace(/\s+/g, '-'), name, nameBn: '', icon: '', color: '', subcategories: [] }))
  }
}

// Subcategory options derived from the currently-selected category
const subcategoryOptions = computed<ApiSubcat[]>(() => {
  if (!form.category || form.category === '__custom__') return []
  return categoryList.value.find(c => c.name === form.category)?.subcategories ?? []
})

const form = reactive({
  name: '', nameBn: '', brand: '', category: '', subcategory: '', seller: '', description: '',
  price: 0, salePrice: 0, stock: 0, deliveryDays: 3, rating: 4.5,
  location: 'Dhaka', isFeatured: false, isNew: true,
  images: [] as string[],
})

const discountPct = computed(() => {
  if (form.salePrice > 0 && form.price > 0 && form.salePrice < form.price)
    return Math.round((1 - form.salePrice / form.price) * 100)
  return 0
})

const isFormValid = computed(() =>
  form.name.trim() !== '' &&
  form.brand.trim() !== '' &&
  (form.category !== '' && form.category !== '__custom__' || customCategory.value.trim() !== '') &&
  form.price > 0 && form.stock >= 0
)

const toast = reactive({ show: false, message: '', type: 'success' as 'success' | 'error' })
let toastTimer = 0
function showToast(msg: string, type: 'success' | 'error' = 'success') {
  clearTimeout(toastTimer)
  toast.message = msg; toast.type = type; toast.show = true
  toastTimer = window.setTimeout(() => { toast.show = false }, 3500)
}

function resolveImg(url: string) {
  // Base64 data URLs and external http(s) URLs are used as-is.
  // Only relative paths (legacy server uploads) get the API base prepended.
  if (url.startsWith('data:') || url.startsWith('http')) return url
  const base = import.meta.env.VITE_API_URL ?? 'http://localhost:4000'
  return `${base}${url}`
}

// Returns the approximate decoded KB of a data URL so admins can see image size
function imgKb(dataUrl: string): number {
  // Base64 string length × 0.75 = raw bytes; subtract the data: header
  const base64Part = dataUrl.split(',')[1] ?? ''
  return Math.round((base64Part.length * 0.75) / 1024)
}

onMounted(async () => {
  // Load categories (for subcategory dropdown) and quill in parallel
  await Promise.all([loadCategoryList(), nextTick()])
  const Quill = (window as any).Quill
  if (Quill && quillContainer.value) {
    quillInstance = new Quill(quillContainer.value, {
      theme: 'snow',
      placeholder: 'Detailed product description…',
      modules: {
        toolbar: [
          [{ header: [2, 3, false] }],
          ['bold', 'italic', 'underline', 'strike'],
          [{ color: [] }, { background: [] }],
          [{ list: 'ordered' }, { list: 'bullet' }],
          ['blockquote', 'code-block'],
          ['link'],
          ['clean'],
        ],
      },
    })
    quillInstance.on('text-change', () => {
      form.description = quillInstance.getSemanticHTML()
    })
  }

  if (!adminStore.products.length) await adminStore.loadProducts()
  if (isEdit.value) {
    const p = adminStore.products.find(x => x.id === route.params.id)
    if (p) {
      Object.assign(form, {
        name: p.name, nameBn: p.nameBn ?? '', brand: p.brand,
        category: p.category, subcategory: p.subcategory ?? '',
        seller: p.seller, description: p.description,
        price: p.price, salePrice: p.salePrice,
        stock: p.stock, deliveryDays: p.deliveryDays, rating: p.rating,
        location: p.location, isFeatured: p.isFeatured ?? false,
        isNew: p.isNew ?? false, images: [...(p.images ?? [])],
      })
      tagsInput.value = (p.tags ?? []).join(', ')
      currentSlug.value = p.slug
      // Populate Quill with existing description
      if (quillInstance && p.description) {
        quillInstance.clipboard.dangerouslyPasteHTML(p.description)
      }
    }
  }
})

async function onFileChange(e: Event) {
  const files = (e.target as HTMLInputElement).files
  if (!files) return
  uploading.value = true
  try {
    for (const file of Array.from(files)) {
      const res = await api.uploadImage(file)
      form.images.push(res.url)
    }
  } catch (err: any) {
    showToast(err.message ?? 'Upload failed', 'error')
  } finally { uploading.value = false }
}

async function onDrop(e: DragEvent) {
  const files = e.dataTransfer?.files
  if (!files) return
  uploading.value = true
  try {
    for (const file of Array.from(files)) {
      if (!file.type.startsWith('image/')) continue
      const res = await api.uploadImage(file)
      form.images.push(res.url)
    }
  } catch (err: any) {
    showToast(err.message ?? 'Upload failed', 'error')
  } finally { uploading.value = false }
}

function addImageUrl() {
  const url = urlInput.value.trim()
  if (url && !form.images.includes(url)) form.images.push(url)
  urlInput.value = ''
}

function removeImage(idx: number) { form.images.splice(idx, 1) }

function moveImage(idx: number, dir: -1 | 1) {
  const to = idx + dir
  if (to < 0 || to >= form.images.length) return
  const tmp = form.images[idx]; form.images[idx] = form.images[to]; form.images[to] = tmp
}

async function submitForm() {
  formError.value = ''
  const resolvedCategory = form.category === '__custom__' ? customCategory.value.trim() : form.category
  if (!form.name.trim() || !form.brand.trim() || !resolvedCategory || form.price <= 0) {
    formError.value = 'Please fill all required fields.'; return
  }
  const payload = {
    name: form.name.trim(), nameBn: form.nameBn.trim() || form.name.trim(),
    brand: form.brand.trim(),
    category: resolvedCategory, subcategory: form.subcategory.trim() || undefined,
    categoryBn: resolvedCategory,
    seller: form.seller.trim() || form.brand.trim(),
    description: form.description.trim(),
    price: form.price, salePrice: form.salePrice || 0,
    stock: form.stock, deliveryDays: form.deliveryDays || 3,
    rating: form.rating || 4.5, location: form.location.trim() || 'Dhaka',
    isFeatured: form.isFeatured, isNew: form.isNew,
    images: form.images,
    tags: tagsInput.value.split(',').map(t => t.trim()).filter(Boolean),
  }
  saving.value = true
  try {
    if (isEdit.value) {
      await adminStore.updateProduct(String(route.params.id), payload)
      showToast(`"${form.name}" updated`)
    } else {
      await adminStore.createProduct(payload)
      showToast(`"${form.name}" created`)
    }
    setTimeout(() => router.push('/admin/products'), 1200)
  } catch (e: any) {
    formError.value = e.message ?? 'Save failed'
  } finally { saving.value = false }
}
</script>

<style scoped>
.pf-error-banner {
  background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.25);
  color: #ef4444; border-radius: 10px; padding: 10px 14px;
  font-size: 13px; display: flex; align-items: center; gap: 8px;
  margin-bottom: 18px;
}
.pf-grid {
  display: grid;
  grid-template-columns: 1fr 340px;
  gap: 18px;
  align-items: start;
}
@media (max-width: 900px) { .pf-grid { grid-template-columns: 1fr; } }
.pf-main, .pf-side { display: flex; flex-direction: column; gap: 18px; }
.pf-card {
  background: var(--sidebar-bg); border: 1px solid var(--sidebar-border);
  border-radius: 14px; padding: 20px;
  display: flex; flex-direction: column; gap: 16px;
}
.pf-card-title {
  font-size: 13px; font-weight: 700; color: var(--text-primary);
  text-transform: uppercase; letter-spacing: 0.05em;
  padding-bottom: 10px; border-bottom: 1px solid var(--sidebar-border);
}
.form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
.form-row-3 { grid-template-columns: 1fr 1fr 1fr; }
@media (max-width:600px) { .form-row,.form-row-3 { grid-template-columns: 1fr; } }
.form-group { display: flex; flex-direction: column; gap: 6px; position: relative; }
.form-label { font-size: 11px; font-weight: 700; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.05em; }
.form-hint  { font-size: 10px; color: var(--text-secondary); margin-top: 2px; }
.req { color: var(--brand); }
.form-input {
  padding: 9px 12px; background: var(--admin-bg); border: 1px solid var(--sidebar-border);
  border-radius: 9px; color: var(--text-primary); font-size: 13px; outline: none;
  transition: border-color 0.15s, box-shadow 0.15s; width: 100%; box-sizing: border-box;
}
.form-input:focus { border-color: var(--brand); box-shadow: 0 0 0 3px rgba(249,115,22,0.12); }
.form-textarea { resize: vertical; min-height: 90px; }
select.form-input {
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%238888a0' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E");
  background-repeat: no-repeat; background-position: right 12px center; padding-right: 32px;
}
.discount-badge {
  position: absolute; bottom: -18px; left: 0;
  font-size: 10px; font-weight: 700; color: #22c55e;
}
.upload-zone {
  border: 2px dashed var(--sidebar-border); border-radius: 12px;
  padding: 24px 16px; text-align: center; cursor: pointer;
  transition: border-color 0.2s, background 0.2s; display: flex;
  flex-direction: column; align-items: center;
}
.upload-zone:hover { border-color: var(--brand); background: var(--brand-dim); }
.img-gallery { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 14px; }
.img-thumb-wrap { position: relative; width: 76px; height: 76px; border-radius: 8px; overflow: hidden; flex-shrink: 0; }
.img-thumb { width: 100%; height: 100%; object-fit: cover; display: block; }
.img-primary-badge {
  position: absolute; top: 2px; left: 2px; background: var(--brand);
  color: white; font-size: 9px; font-weight: 700; padding: 2px 5px; border-radius: 4px;
}
.img-size-badge {
  position: absolute; bottom: 20px; left: 50%; transform: translateX(-50%);
  background: rgba(0,0,0,0.62); color: #fff;
  font-size: 8px; font-weight: 700; padding: 1px 4px; border-radius: 3px;
  white-space: nowrap; pointer-events: none;
}
.img-remove-btn {
  position: absolute; top: 2px; right: 2px; width: 18px; height: 18px;
  background: rgba(0,0,0,0.6); border: none; border-radius: 50%;
  color: white; font-size: 9px; cursor: pointer; display: flex; align-items: center; justify-content: center;
}
.img-move-btns {
  position: absolute; bottom: 2px; left: 50%; transform: translateX(-50%);
  display: flex; gap: 2px;
}
.img-move-btns button {
  width: 16px; height: 16px; background: rgba(0,0,0,0.55); border: none;
  border-radius: 3px; color: white; font-size: 8px; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
}
.img-move-btns button:disabled { opacity: 0.3; cursor: default; }
.form-toggles { display: flex; gap: 20px; flex-wrap: wrap; }
.toggle-item { display: flex; align-items: center; gap: 10px; cursor: pointer; user-select: none; }
.toggle-item input[type="checkbox"] { display: none; }
.toggle-ui { width: 38px; height: 21px; border-radius: 21px; background: var(--sidebar-border); position: relative; flex-shrink: 0; transition: background 0.2s; }
.toggle-ui::before { content: ''; position: absolute; width: 15px; height: 15px; border-radius: 50%; background: white; top: 3px; left: 3px; transition: transform 0.2s; }
.toggle-item input:checked + .toggle-ui { background: var(--brand); }
.toggle-item input:checked + .toggle-ui::before { transform: translateX(17px); }
.toggle-label { font-size: 13px; font-weight: 500; color: var(--text-primary); }
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

/* ── Quill editor theme overrides ───────────────────────────────────────── */
.quill-editor-wrap { border-radius: 9px; overflow: hidden; border: 1px solid var(--sidebar-border); }
.quill-editor-wrap :deep(.ql-toolbar) {
  background: var(--admin-bg);
  border: none;
  border-bottom: 1px solid var(--sidebar-border);
  padding: 8px 10px;
  flex-wrap: wrap;
}
.quill-editor-wrap :deep(.ql-toolbar button),
.quill-editor-wrap :deep(.ql-toolbar .ql-picker-label) {
  color: var(--text-primary) !important;
}
.quill-editor-wrap :deep(.ql-toolbar button:hover),
.quill-editor-wrap :deep(.ql-toolbar button.ql-active) {
  color: var(--brand) !important;
}
.quill-editor-wrap :deep(.ql-toolbar .ql-stroke) { stroke: var(--text-secondary); }
.quill-editor-wrap :deep(.ql-toolbar button:hover .ql-stroke),
.quill-editor-wrap :deep(.ql-toolbar button.ql-active .ql-stroke) { stroke: var(--brand); }
.quill-editor-wrap :deep(.ql-toolbar .ql-fill) { fill: var(--text-secondary); }
.quill-editor-wrap :deep(.ql-toolbar button:hover .ql-fill),
.quill-editor-wrap :deep(.ql-toolbar button.ql-active .ql-fill) { fill: var(--brand); }
.quill-editor-wrap :deep(.ql-container) {
  background: var(--admin-bg);
  border: none;
  font-size: 13px;
  font-family: inherit;
  color: var(--text-primary);
  min-height: 160px;
}
.quill-editor-wrap :deep(.ql-editor) { min-height: 160px; padding: 12px 14px; line-height: 1.65; }
.quill-editor-wrap :deep(.ql-editor.ql-blank::before) {
  color: var(--text-secondary);
  font-style: normal;
  font-size: 13px;
}
.quill-editor-wrap :deep(.ql-picker-options) {
  background: var(--sidebar-bg);
  border: 1px solid var(--sidebar-border);
  border-radius: 8px;
  box-shadow: 0 4px 16px rgba(0,0,0,0.2);
}
.quill-editor-wrap :deep(.ql-picker-item) { color: var(--text-primary); }
</style>
