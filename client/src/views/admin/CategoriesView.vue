<template>
  <div class="space-y-6">
    <!-- Page header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="font-display text-2xl font-bold">Categories</h1>
        <p class="text-sm text-[var(--color-text-muted)] mt-1">Manage categories and subcategories</p>
      </div>
      <button @click="openAddCategory" class="btn-primary text-sm">
        <i class="fa-sharp fa-solid fa-plus mr-1"></i> Add Category
      </button>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      <div v-for="n in 6" :key="n" class="card p-4 space-y-3">
        <div class="skeleton h-6 w-1/2 rounded"></div>
        <div class="skeleton h-4 w-3/4 rounded"></div>
        <div class="skeleton h-4 w-1/3 rounded"></div>
      </div>
    </div>

    <!-- Category cards -->
    <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
      <div v-for="cat in categories" :key="cat.id" class="card overflow-hidden">
        <!-- Category header -->
        <div class="flex items-center justify-between px-4 py-3 border-b border-[var(--color-border)]" :style="`background: ${cat.color}12`">
          <div class="flex items-center gap-3">
            <div class="w-9 h-9 rounded-xl flex items-center justify-center" :style="`background: ${cat.color}22`">
              <i :class="'fa-sharp fa-solid fa-' + cat.icon" :style="`color: ${cat.color}`"></i>
            </div>
            <div>
              <p class="font-semibold text-sm">{{ cat.name }}</p>
              <p class="text-[11px] text-[var(--color-text-muted)]">{{ cat.nameBn }}</p>
            </div>
          </div>
          <div class="flex items-center gap-1">
            <button @click="openEditCategory(cat)" class="p-1.5 rounded-lg hover:bg-[var(--color-surface-2)] text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition">
              <i class="fa-sharp fa-regular fa-pen text-xs"></i>
            </button>
            <button @click="confirmDeleteCategory(cat)" class="p-1.5 rounded-lg hover:bg-red-500/10 text-[var(--color-text-muted)] hover:text-red-500 transition">
              <i class="fa-sharp fa-regular fa-trash text-xs"></i>
            </button>
          </div>
        </div>

        <!-- Subcategory list -->
        <div class="p-3 space-y-1 max-h-52 overflow-y-auto">
          <div
            v-for="sub in cat.subcategories" :key="sub.id"
            class="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-[var(--color-surface-2)] group transition"
          >
            <div class="flex items-center gap-2 min-w-0">
              <i :class="'fa-sharp fa-solid fa-' + sub.icon + ' text-xs opacity-50 shrink-0'"></i>
              <span class="text-sm truncate">{{ sub.name }}</span>
              <span v-if="sub.productCount" class="text-[10px] text-[var(--color-text-muted)] shrink-0">{{ sub.productCount }}</span>
            </div>
            <div class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition shrink-0">
              <button @click="openEditSub(cat, sub)" class="p-1 rounded hover:bg-[var(--color-surface-3)] text-[var(--color-text-muted)] transition">
                <i class="fa-sharp fa-regular fa-pen text-[10px]"></i>
              </button>
              <button @click="confirmDeleteSub(cat, sub)" class="p-1 rounded hover:bg-red-500/10 text-[var(--color-text-muted)] hover:text-red-500 transition">
                <i class="fa-sharp fa-regular fa-xmark text-[10px]"></i>
              </button>
            </div>
          </div>
          <div v-if="!cat.subcategories.length" class="text-xs text-[var(--color-text-muted)] px-3 py-2 italic">No subcategories</div>
        </div>

        <!-- Add subcategory button -->
        <div class="px-3 pb-3">
          <button
            @click="openAddSub(cat)"
            class="w-full flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-medium border border-dashed border-[var(--color-border)] text-[var(--color-text-muted)] hover:border-orange-400 hover:text-orange-500 hover:bg-orange-500/5 transition"
          >
            <i class="fa-sharp fa-solid fa-plus text-[10px]"></i> Add Subcategory
          </button>
        </div>
      </div>
    </div>

    <!-- ── Modal ── -->
    <Teleport to="body">
      <div v-if="modal.open" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" @click.self="closeModal">
        <div class="card w-full max-w-md p-6 space-y-4 shadow-2xl">
          <h2 class="font-display font-bold text-lg">{{ modal.title }}</h2>

          <div class="space-y-3">
            <div>
              <label class="block text-xs font-medium text-[var(--color-text-muted)] mb-1">Name (English) *</label>
              <input v-model="form.name" class="input-field w-full text-sm" placeholder="e.g. Mobile Phones" />
            </div>
            <div>
              <label class="block text-xs font-medium text-[var(--color-text-muted)] mb-1">Name (Bangla)</label>
              <input v-model="form.nameBn" class="input-field w-full text-sm" placeholder="e.g. মোবাইল ফোন" />
            </div>
            <div>
              <label class="block text-xs font-medium text-[var(--color-text-muted)] mb-1">Slug *</label>
              <input v-model="form.slug" class="input-field w-full text-sm font-mono" placeholder="mobile-phones" />
            </div>
            <div>
              <label class="block text-xs font-medium text-[var(--color-text-muted)] mb-1">Icon (Font Awesome name)</label>
              <div class="flex gap-2">
                <input v-model="form.icon" class="input-field flex-1 text-sm font-mono" placeholder="mobile-screen" />
                <div class="w-9 h-9 rounded-xl border border-[var(--color-border)] flex items-center justify-center shrink-0">
                  <i :class="'fa-sharp fa-solid fa-' + (form.icon || 'tag') + ' text-sm text-[var(--color-text-muted)]'"></i>
                </div>
              </div>
            </div>
            <div v-if="modal.mode === 'category' || modal.mode === 'editCategory'">
              <label class="block text-xs font-medium text-[var(--color-text-muted)] mb-1">Color</label>
              <div class="flex items-center gap-3">
                <input v-model="form.color" type="color" class="w-9 h-9 rounded-xl border border-[var(--color-border)] cursor-pointer p-0.5" />
                <span class="text-sm font-mono text-[var(--color-text-muted)]">{{ form.color }}</span>
              </div>
            </div>
          </div>

          <p v-if="modalError" class="text-red-500 text-xs">{{ modalError }}</p>

          <div class="flex gap-3 pt-2">
            <button @click="closeModal" class="btn-secondary flex-1 text-sm">Cancel</button>
            <button @click="submitModal" :disabled="saving" class="btn-primary flex-1 text-sm">
              <span v-if="saving"><i class="fa-sharp fa-solid fa-spinner-third fa-spin mr-1"></i> Saving…</span>
              <span v-else>Save</span>
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'

const API = '/api'

interface Sub  { id: string; slug: string; name: string; nameBn: string; icon: string; productCount?: number }
interface Cat  { id: string; slug: string; name: string; nameBn: string; icon: string; color: string; subcategories: Sub[]; productCount?: number }

const categories = ref<Cat[]>([])
const loading    = ref(true)

async function loadCategories() {
  loading.value = true
  try {
    const res  = await fetch(`${API}/categories`)
    const json = await res.json()
    categories.value = json.data ?? json
  } catch (e) { console.error(e) }
  finally { loading.value = false }
}
onMounted(loadCategories)

// ── Modal state ──────────────────────────────────────────────────────────────
type ModalMode = 'category' | 'editCategory' | 'sub' | 'editSub'
const modal = reactive({ open: false, title: '', mode: '' as ModalMode, catSlug: '', subSlug: '' })
const form  = reactive({ name: '', nameBn: '', slug: '', icon: '', color: '#6b7280' })
const saving = ref(false)
const modalError = ref('')

function resetForm() { Object.assign(form, { name: '', nameBn: '', slug: '', icon: '', color: '#6b7280' }); modalError.value = '' }
function closeModal() { modal.open = false; resetForm() }

function openAddCategory() {
  resetForm()
  Object.assign(modal, { open: true, title: 'Add Category', mode: 'category', catSlug: '', subSlug: '' })
}
function openEditCategory(cat: Cat) {
  resetForm()
  Object.assign(form, { name: cat.name, nameBn: cat.nameBn, slug: cat.slug, icon: cat.icon, color: cat.color })
  Object.assign(modal, { open: true, title: 'Edit Category', mode: 'editCategory', catSlug: cat.slug, subSlug: '' })
}
function openAddSub(cat: Cat) {
  resetForm()
  Object.assign(modal, { open: true, title: `Add Subcategory → ${cat.name}`, mode: 'sub', catSlug: cat.slug, subSlug: '' })
}
function openEditSub(cat: Cat, sub: Sub) {
  resetForm()
  Object.assign(form, { name: sub.name, nameBn: sub.nameBn, slug: sub.slug, icon: sub.icon, color: '#6b7280' })
  Object.assign(modal, { open: true, title: `Edit Subcategory`, mode: 'editSub', catSlug: cat.slug, subSlug: sub.slug })
}

async function submitModal() {
  if (!form.name.trim() || !form.slug.trim()) { modalError.value = 'Name and slug are required'; return }
  saving.value = true; modalError.value = ''
  try {
    let url = `${API}/categories`
    let method = 'POST'
    const body: Record<string, string> = { name: form.name, nameBn: form.nameBn, slug: form.slug, icon: form.icon }
    if (modal.mode === 'category') {
      body.color = form.color
    } else if (modal.mode === 'editCategory') {
      url = `${API}/categories/${modal.catSlug}`; method = 'PUT'; body.color = form.color
    } else if (modal.mode === 'sub') {
      url = `${API}/categories/${modal.catSlug}/subcategories`
    } else if (modal.mode === 'editSub') {
      url = `${API}/categories/${modal.catSlug}/subcategories/${modal.subSlug}`; method = 'PUT'
    }
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('sb-admin-token') ?? ''}` },
      body: JSON.stringify(body),
    })
    if (!res.ok) { const e = await res.json(); throw new Error(e.error ?? 'Request failed') }
    closeModal()
    await loadCategories()
  } catch (e: any) {
    modalError.value = e.message ?? 'An error occurred'
  } finally {
    saving.value = false
  }
}

async function confirmDeleteCategory(cat: Cat) {
  if (!confirm(`Delete category "${cat.name}"? This cannot be undone.`)) return
  await fetch(`${API}/categories/${cat.slug}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${localStorage.getItem('sb-admin-token') ?? ''}` },
  })
  await loadCategories()
}

async function confirmDeleteSub(cat: Cat, sub: Sub) {
  if (!confirm(`Delete subcategory "${sub.name}"?`)) return
  await fetch(`${API}/categories/${cat.slug}/subcategories/${sub.slug}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${localStorage.getItem('sb-admin-token') ?? ''}` },
  })
  await loadCategories()
}
</script>
