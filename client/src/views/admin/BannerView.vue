<template>
  <div class="admin-page-wrap">

    <!-- ── Page header ─────────────────────────────────────────────────── -->
    <div class="admin-page-header">
      <div style="display:flex;align-items:center;gap:12px">
        <div>
          <h1 class="page-title">Hero Carousel</h1>
          <p class="page-subtitle">Manage homepage banner slides — images display at 4:1 ratio</p>
        </div>
      </div>
      <button class="admin-btn primary" @click="openAdd">
        <i class="fa-sharp fa-solid fa-plus"></i> Add Slide
      </button>
    </div>

    <!-- ── Empty state ──────────────────────────────────────────────────── -->
    <div v-if="!slides.length" class="banner-empty">
      <i class="fa-sharp fa-solid fa-images"></i>
      <p>No slides yet. Add your first banner slide.</p>
      <button class="admin-btn primary" @click="openAdd">
        <i class="fa-sharp fa-solid fa-plus"></i> Add First Slide
      </button>
    </div>

    <!-- ── Slides grid ──────────────────────────────────────────────────── -->
    <div v-else class="banner-grid">
      <div
        v-for="(slide, idx) in slides"
        :key="slide.id"
        class="banner-card"
        :class="{ 'banner-card--inactive': !slide.active }"
      >
        <!-- 4:1 image preview -->
        <div class="banner-img-wrap">
          <img
            :src="slide.image || 'https://placehold.co/1200x300/f97316/fff?text=No+Image'"
            :alt="slide.title"
            class="banner-img"
            onerror="this.src='https://placehold.co/1200x300/f97316/fff?text=No+Image'"
          />
          <div class="banner-img-overlay">
            <span class="banner-order-badge">#{{ idx + 1 }}</span>
            <span v-if="!slide.active" class="banner-inactive-badge">
              <i class="fa-sharp fa-solid fa-eye-slash"></i> Hidden
            </span>
          </div>
        </div>

        <!-- Slide info -->
        <div class="banner-card-body">
          <div class="banner-card-meta">
            <span class="banner-tag-pill">{{ slide.tag }}</span>
            <span class="banner-link-label">
              <i class="fa-sharp fa-solid fa-link text-[10px]"></i>
              {{ slide.link || '/' }}
            </span>
          </div>
          <h3 class="banner-card-title">{{ slide.title }}</h3>
          <p class="banner-card-sub">{{ slide.subtitle }}</p>
          <div class="banner-card-cta-preview">CTA: <strong>{{ slide.cta }}</strong></div>
        </div>

        <!-- Actions -->
        <div class="banner-card-actions">
          <!-- Reorder -->
          <div class="banner-reorder">
            <button :disabled="idx === 0" @click="moveSlide(idx, -1)" class="admin-btn ghost icon-btn" title="Move up">
              <i class="fa-sharp fa-solid fa-chevron-left"></i>
            </button>
            <button :disabled="idx === slides.length - 1" @click="moveSlide(idx, 1)" class="admin-btn ghost icon-btn" title="Move down">
              <i class="fa-sharp fa-solid fa-chevron-right"></i>
            </button>
          </div>

          <!-- Toggle active -->
          <button
            class="admin-btn ghost icon-btn"
            :class="slide.active ? 'text-green-500' : 'text-gray-400'"
            :title="slide.active ? 'Hide slide' : 'Show slide'"
            @click="toggleActive(slide)"
          >
            <i :class="slide.active ? 'fa-sharp fa-solid fa-eye' : 'fa-sharp fa-solid fa-eye-slash'"></i>
          </button>

          <!-- Edit -->
          <button class="admin-btn ghost icon-btn" title="Edit" @click="openEdit(slide)">
            <i class="fa-sharp fa-solid fa-pen"></i>
          </button>

          <!-- Delete -->
          <button class="admin-btn ghost icon-btn text-red-500" title="Delete" @click="confirmDelete(slide)">
            <i class="fa-sharp fa-solid fa-trash"></i>
          </button>
        </div>
      </div>
    </div>

    <!-- ── Add / Edit modal ─────────────────────────────────────────────── -->
    <Teleport to="body">
      <Transition name="modal-fade">
        <div v-if="modalOpen" class="banner-modal-backdrop" @click.self="closeModal">
          <div class="banner-modal">

            <div class="banner-modal-header">
              <h2>{{ editingSlide ? 'Edit Slide' : 'Add New Slide' }}</h2>
              <button class="admin-btn ghost icon-btn" @click="closeModal">
                <i class="fa-sharp fa-solid fa-xmark"></i>
              </button>
            </div>

            <div class="banner-modal-body">

              <!-- Image upload — 4:1 ratio enforced -->
              <div class="bm-field">
                <label class="bm-label">
                  Banner Image <span class="req">*</span>
                  <span class="bm-hint">4:1 ratio (e.g. 1200×300 px)</span>
                </label>

                <div
                  class="banner-upload-zone"
                  :class="{ 'is-uploading': uploading, 'has-image': !!form.image }"
                  @click="!uploading && fileInput?.click()"
                  @dragover.prevent
                  @drop.prevent="onDrop"
                >
                  <input ref="fileInput" type="file" accept="image/*" style="display:none" @change="onFileChange" />

                  <!-- Preview at 4:1 -->
                  <div v-if="form.image" class="banner-preview-wrap">
                    <img :src="form.image" alt="Preview" class="banner-preview-img"
                      onerror="this.src='https://placehold.co/1200x300/f97316/fff?text=Error'" />
                    <div class="banner-preview-actions">
                      <button class="bpa-btn" @click.stop="fileInput?.click()" title="Replace image">
                        <i class="fa-sharp fa-solid fa-arrows-rotate"></i> Replace
                      </button>
                      <button class="bpa-btn bpa-btn--danger" @click.stop="form.image = ''" title="Remove image">
                        <i class="fa-sharp fa-solid fa-trash"></i> Remove
                      </button>
                    </div>
                  </div>

                  <!-- Upload prompt -->
                  <div v-else class="banner-upload-prompt">
                    <div v-if="uploading" class="banner-uploading">
                      <i class="fa-solid fa-spinner fa-spin"></i>
                      <span>Uploading to ImgBB…</span>
                      <div class="banner-upload-progress">
                        <div class="banner-upload-bar" :style="`width:${uploadProgress}%`"></div>
                      </div>
                    </div>
                    <template v-else>
                      <i class="fa-sharp fa-solid fa-cloud-arrow-up"></i>
                      <span class="bup-title">Click or drag to upload</span>
                      <span class="bup-sub">PNG, JPG, WEBP · Recommended: 1200×300 (4:1)</span>
                    </template>
                  </div>
                </div>

                <!-- URL fallback -->
                <div class="bm-url-row">
                  <input
                    class="bm-input"
                    v-model="form.image"
                    placeholder="Or paste image URL directly…"
                    :disabled="uploading"
                  />
                </div>
              </div>

              <!-- Tag -->
              <div class="bm-row">
                <div class="bm-field">
                  <label class="bm-label">Tag / Badge</label>
                  <input class="bm-input" v-model="form.tag" placeholder="e.g. 🔥 Eid Special" />
                </div>
                <!-- CTA Text -->
                <div class="bm-field">
                  <label class="bm-label">Button Text</label>
                  <input class="bm-input" v-model="form.cta" placeholder="e.g. Shop Now" />
                </div>
              </div>

              <!-- Title -->
              <div class="bm-field">
                <label class="bm-label">Headline <span class="req">*</span></label>
                <input class="bm-input" v-model="form.title" placeholder="e.g. Shop Smart, Deliver Fast" />
              </div>

              <!-- Subtitle -->
              <div class="bm-field">
                <label class="bm-label">Subtitle</label>
                <textarea class="bm-input bm-textarea" v-model="form.subtitle"
                  placeholder="Brief description shown under the headline…" rows="2"></textarea>
              </div>

              <!-- Link -->
              <div class="bm-field">
                <label class="bm-label">Link URL</label>
                <input class="bm-input" v-model="form.link" placeholder="e.g. /products or /products?cat=Electronics" />
              </div>

              <!-- Active toggle -->
              <div class="bm-field bm-toggle-row">
                <label class="bm-label" style="margin:0">Show on homepage</label>
                <label class="bm-toggle">
                  <input type="checkbox" v-model="form.active" />
                  <span class="bm-toggle-ui"></span>
                </label>
              </div>
            </div>

            <div class="banner-modal-footer">
              <button class="admin-btn secondary" @click="closeModal">Cancel</button>
              <button class="admin-btn primary" @click="saveSlide" :disabled="!form.image || !form.title || uploading">
                <i class="fa-sharp fa-solid fa-floppy-disk"></i>
                {{ editingSlide ? 'Save Changes' : 'Add Slide' }}
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- ── Delete confirm ───────────────────────────────────────────────── -->
    <Teleport to="body">
      <Transition name="modal-fade">
        <div v-if="deleteTarget" class="banner-modal-backdrop" @click.self="deleteTarget = null">
          <div class="banner-modal banner-modal--sm">
            <div class="banner-modal-header">
              <h2>Delete Slide</h2>
              <button class="admin-btn ghost icon-btn" @click="deleteTarget = null">
                <i class="fa-sharp fa-solid fa-xmark"></i>
              </button>
            </div>
            <div class="banner-modal-body" style="text-align:center;padding:2rem 1.5rem">
              <div style="font-size:3rem;margin-bottom:1rem">🗑️</div>
              <p style="font-size:0.95rem;color:var(--text-secondary)">
                Delete "<strong style="color:var(--text-primary)">{{ deleteTarget?.title }}</strong>"?
                This cannot be undone.
              </p>
            </div>
            <div class="banner-modal-footer">
              <button class="admin-btn secondary" @click="deleteTarget = null">Cancel</button>
              <button class="admin-btn danger" @click="doDelete">
                <i class="fa-sharp fa-solid fa-trash"></i> Delete
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- ── Toast ─────────────────────────────────────────────────────────── -->
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
import { ref, reactive, onMounted } from 'vue'

// ── Slide type ────────────────────────────────────────────────────────────────
interface Slide {
  id: string
  tag: string
  title: string
  subtitle: string
  cta: string
  link: string
  image: string
  active: boolean
  order: number
}

const STORAGE_KEY = 'sb-banner-slides'

// ── Default slides (used when nothing in storage) ─────────────────────────────
const defaultSlides: Slide[] = [
  {
    id: '1', tag: '🔥 Eid Special', title: 'Shop Smart, Deliver Fast',
    subtitle: 'From Dhaka to every district — same-day delivery & bKash checkout.',
    cta: 'Shop Now', link: '/products',
    image: 'https://placehold.co/1200x300/f97316/fff?text=Eid+Sale',
    active: true, order: 0,
  },
  {
    id: '2', tag: '⚡ Flash Deal', title: 'Electronics at Best Prices',
    subtitle: 'Smartphones, laptops, gadgets — up to 40% off this week only.',
    cta: 'Explore Electronics', link: '/products?cat=Electronics',
    image: 'https://placehold.co/1200x300/3b82f6/fff?text=Electronics',
    active: true, order: 1,
  },
  {
    id: '3', tag: '👗 New Season', title: 'Fresh Fashion Drops Daily',
    subtitle: 'Trendy styles for every occasion. Free returns on fashion items.',
    cta: 'Explore Fashion', link: '/products?cat=Fashion',
    image: 'https://placehold.co/1200x300/d946ef/fff?text=Fashion',
    active: true, order: 2,
  },
  {
    id: '4', tag: '🛒 Grocery', title: 'Daily Essentials Delivered Fast',
    subtitle: 'Fresh groceries from top brands. Order before noon, get today.',
    cta: 'Order Groceries', link: '/products?cat=Grocery',
    image: 'https://placehold.co/1200x300/22c55e/fff?text=Grocery',
    active: true, order: 3,
  },
]

// ── State ─────────────────────────────────────────────────────────────────────
const slides      = ref<Slide[]>([])
const modalOpen   = ref(false)
const editingSlide = ref<Slide | null>(null)
const deleteTarget = ref<Slide | null>(null)
const uploading   = ref(false)
const uploadProgress = ref(0)
const fileInput   = ref<HTMLInputElement | null>(null)
const toast       = reactive({ show: false, message: '', type: 'success' as 'success' | 'error' })
let toastTimer    = 0

const form = reactive<Slide>({
  id: '', tag: '', title: '', subtitle: '', cta: 'Shop Now',
  link: '/', image: '', active: true, order: 0,
})

// ── Persistence ───────────────────────────────────────────────────────────────
function loadSlides() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    slides.value = raw ? JSON.parse(raw) : [...defaultSlides]
  } catch {
    slides.value = [...defaultSlides]
  }
}

function persist() {
  slides.value.forEach((s, i) => { s.order = i })
  localStorage.setItem(STORAGE_KEY, JSON.stringify(slides.value))
}

// ── CRUD ──────────────────────────────────────────────────────────────────────
function openAdd() {
  editingSlide.value = null
  Object.assign(form, {
    id: '', tag: '', title: '', subtitle: '', cta: 'Shop Now',
    link: '/', image: '', active: true, order: slides.value.length,
  })
  modalOpen.value = true
}

function openEdit(slide: Slide) {
  editingSlide.value = slide
  Object.assign(form, { ...slide })
  modalOpen.value = true
}

function closeModal() {
  modalOpen.value = false
  editingSlide.value = null
}

function saveSlide() {
  if (!form.image || !form.title) return

  if (editingSlide.value) {
    const idx = slides.value.findIndex(s => s.id === editingSlide.value!.id)
    if (idx > -1) Object.assign(slides.value[idx], { ...form })
    showToast('Slide updated', 'success')
  } else {
    slides.value.push({
      ...form,
      id: Date.now().toString(),
      order: slides.value.length,
    })
    showToast('Slide added', 'success')
  }

  persist()
  closeModal()
}

function confirmDelete(slide: Slide) {
  deleteTarget.value = slide
}

function doDelete() {
  if (!deleteTarget.value) return
  slides.value = slides.value.filter(s => s.id !== deleteTarget.value!.id)
  persist()
  showToast('Slide deleted', 'success')
  deleteTarget.value = null
}

function toggleActive(slide: Slide) {
  slide.active = !slide.active
  persist()
}

function moveSlide(idx: number, dir: -1 | 1) {
  const target = idx + dir
  if (target < 0 || target >= slides.value.length) return
  const arr = [...slides.value]
  ;[arr[idx], arr[target]] = [arr[target], arr[idx]]
  slides.value = arr
  persist()
}

// ── ImgBB upload — same API key as ProductFormView ────────────────────────────
const IMGBB_KEY = 'f3c12080238055cf04e5a657a47ee058'
const MAX_PX    = 1920
const QUALITY   = 0.85

function compressTo4x1(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img  = new Image()
    img.onload = () => {
      URL.revokeObjectURL(url)
      // Enforce 4:1 aspect ratio by cropping center
      const targetRatio = 4 / 1
      const srcRatio    = img.naturalWidth / img.naturalHeight

      let sx = 0, sy = 0, sw = img.naturalWidth, sh = img.naturalHeight
      if (srcRatio > targetRatio) {
        // Too wide — crop sides
        sw = Math.round(img.naturalHeight * targetRatio)
        sx = Math.round((img.naturalWidth - sw) / 2)
      } else if (srcRatio < targetRatio) {
        // Too tall — crop top/bottom
        sh = Math.round(img.naturalWidth / targetRatio)
        sy = Math.round((img.naturalHeight - sh) / 2)
      }

      // Scale down if too large
      let dw = sw, dh = sh
      if (dw > MAX_PX) { dh = Math.round((dh / dw) * MAX_PX); dw = MAX_PX }

      const canvas = document.createElement('canvas')
      canvas.width  = dw
      canvas.height = dh
      const ctx = canvas.getContext('2d')!
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, dw, dh)
      ctx.drawImage(img, sx, sy, sw, sh, 0, 0, dw, dh)

      canvas.toBlob(
        blob => blob ? resolve(blob) : reject(new Error('toBlob failed')),
        'image/webp', QUALITY
      )
    }
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Load failed')) }
    img.src = url
  })
}

async function uploadToImgBB(file: File): Promise<string> {
  uploadProgress.value = 10
  const blob     = await compressTo4x1(file)
  uploadProgress.value = 40
  const webpFile = new File([blob], file.name.replace(/\.[^.]+$/, '.webp'), { type: blob.type })
  const fd       = new FormData()
  fd.append('image', webpFile)

  uploadProgress.value = 60
  const res  = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_KEY}`, { method: 'POST', body: fd })
  uploadProgress.value = 90
  const json = await res.json()
  if (!json.success) throw new Error(json?.error?.message ?? 'ImgBB upload failed')
  uploadProgress.value = 100
  return json.data.display_url as string
}

async function onFileChange(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  try {
    uploading.value = true
    uploadProgress.value = 0
    form.image = await uploadToImgBB(file)
    showToast('Image uploaded', 'success')
  } catch (err: any) {
    showToast(err.message ?? 'Upload failed', 'error')
  } finally {
    uploading.value = false
    uploadProgress.value = 0
    if (fileInput.value) fileInput.value.value = ''
  }
}

async function onDrop(e: DragEvent) {
  const file = e.dataTransfer?.files?.[0]
  if (!file || !file.type.startsWith('image/')) return
  // Re-use file input flow via a synthetic change event simulation
  try {
    uploading.value = true
    uploadProgress.value = 0
    form.image = await uploadToImgBB(file)
    showToast('Image uploaded', 'success')
  } catch (err: any) {
    showToast(err.message ?? 'Upload failed', 'error')
  } finally {
    uploading.value = false
    uploadProgress.value = 0
  }
}

// ── Toast ─────────────────────────────────────────────────────────────────────
function showToast(msg: string, type: 'success' | 'error' = 'success') {
  clearTimeout(toastTimer)
  toast.message = msg; toast.type = type; toast.show = true
  toastTimer = window.setTimeout(() => { toast.show = false }, 3000)
}

onMounted(loadSlides)
</script>

<style scoped>
/* ── Layout ──────────────────────────────────────────────────────────────── */
.banner-empty {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  gap: 1rem; padding: 5rem 2rem; text-align: center;
  color: var(--text-secondary); font-size: 0.9rem;
}
.banner-empty i { font-size: 3rem; opacity: 0.3; }

/* ── Cards grid ─────────────────────────────────────────────────────────── */
.banner-grid {
  display: flex; flex-direction: column; gap: 1rem;
}

.banner-card {
  background: var(--sidebar-bg);
  border: 1px solid var(--sidebar-border);
  border-radius: 14px;
  overflow: hidden;
  transition: box-shadow 0.15s, opacity 0.15s;
}
.banner-card:hover { box-shadow: 0 4px 20px rgba(0,0,0,0.10); }
.banner-card--inactive { opacity: 0.6; }

/* 4:1 image container */
.banner-img-wrap {
  position: relative;
  width: 100%;
  aspect-ratio: 4 / 1;
  background: var(--admin-bg);
  overflow: hidden;
}
.banner-img {
  width: 100%; height: 100%; object-fit: cover; display: block;
}
.banner-img-overlay {
  position: absolute; inset: 0;
  display: flex; align-items: flex-start; justify-content: space-between;
  padding: 0.5rem;
  background: linear-gradient(to bottom, rgba(0,0,0,0.35) 0%, transparent 50%);
}
.banner-order-badge {
  background: rgba(0,0,0,0.6); color: #fff;
  font-size: 11px; font-weight: 700; padding: 2px 8px; border-radius: 20px;
}
.banner-inactive-badge {
  background: rgba(239,68,68,0.85); color: #fff;
  font-size: 10px; font-weight: 700; padding: 2px 8px; border-radius: 20px;
  display: flex; align-items: center; gap: 4px;
}

/* Card body */
.banner-card-body {
  padding: 0.85rem 1rem 0.6rem;
}
.banner-card-meta {
  display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.4rem;
  flex-wrap: wrap;
}
.banner-tag-pill {
  font-size: 11px; font-weight: 700; padding: 2px 8px; border-radius: 20px;
  background: rgba(249,115,22,0.12); color: var(--brand);
  border: 1px solid rgba(249,115,22,0.25);
}
.banner-link-label {
  font-size: 11px; color: var(--text-secondary);
  display: flex; align-items: center; gap: 3px;
}
.banner-card-title {
  font-size: 0.95rem; font-weight: 700; color: var(--text-primary);
  margin: 0 0 0.2rem; line-height: 1.3;
}
.banner-card-sub {
  font-size: 0.78rem; color: var(--text-secondary); margin: 0 0 0.35rem;
  line-height: 1.4;
  overflow: hidden; text-overflow: ellipsis;
  display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;
}
.banner-card-cta-preview {
  font-size: 0.75rem; color: var(--text-secondary);
}

/* Card actions */
.banner-card-actions {
  display: flex; align-items: center; gap: 0.4rem;
  padding: 0.6rem 1rem; border-top: 1px solid var(--sidebar-border);
  flex-wrap: wrap;
}
.banner-reorder { display: flex; gap: 0.25rem; }
.icon-btn {
  width: 32px !important; height: 32px !important;
  padding: 0 !important; border-radius: 8px !important;
  display: flex; align-items: center; justify-content: center;
  font-size: 12px;
}

/* ── Modal ───────────────────────────────────────────────────────────────── */
.banner-modal-backdrop {
  position: fixed; inset: 0; background: rgba(0,0,0,0.55);
  backdrop-filter: blur(4px); z-index: 1000;
  display: flex; align-items: center; justify-content: center;
  padding: 1rem;
}
.banner-modal {
  background: var(--sidebar-bg);
  border: 1px solid var(--sidebar-border);
  border-radius: 16px;
  width: 100%; max-width: 640px;
  max-height: 90vh; overflow-y: auto;
  box-shadow: 0 24px 64px rgba(0,0,0,0.35);
  display: flex; flex-direction: column;
}
.banner-modal--sm { max-width: 420px; }
.banner-modal-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 1rem 1.25rem; border-bottom: 1px solid var(--sidebar-border);
  flex-shrink: 0;
}
.banner-modal-header h2 {
  font-size: 1rem; font-weight: 700; color: var(--text-primary); margin: 0;
}
.banner-modal-body { padding: 1.25rem; display: flex; flex-direction: column; gap: 1rem; flex: 1; }
.banner-modal-footer {
  display: flex; justify-content: flex-end; gap: 0.5rem;
  padding: 0.85rem 1.25rem; border-top: 1px solid var(--sidebar-border);
  flex-shrink: 0;
}

/* ── Form fields ─────────────────────────────────────────────────────────── */
.bm-field { display: flex; flex-direction: column; gap: 0.4rem; }
.bm-row { display: grid; grid-template-columns: 1fr 1fr; gap: 0.85rem; }
@media (max-width: 480px) { .bm-row { grid-template-columns: 1fr; } }

.bm-label {
  font-size: 0.78rem; font-weight: 600; color: var(--text-secondary);
  display: flex; align-items: center; gap: 0.5rem;
}
.bm-hint {
  font-size: 0.72rem; font-weight: 400; color: var(--brand);
  background: rgba(249,115,22,0.08); padding: 1px 6px; border-radius: 4px;
}
.bm-input {
  width: 100%; padding: 0.55rem 0.75rem;
  border: 1px solid var(--sidebar-border); border-radius: 8px;
  background: var(--admin-bg); color: var(--text-primary);
  font-size: 0.85rem; outline: none; transition: border-color 0.15s;
}
.bm-input:focus { border-color: var(--brand); }
.bm-textarea { resize: vertical; min-height: 60px; }
.bm-url-row { margin-top: 0.5rem; }

/* Toggle */
.bm-toggle-row {
  flex-direction: row !important; align-items: center; justify-content: space-between;
  padding: 0.6rem 0.85rem; background: var(--admin-bg);
  border: 1px solid var(--sidebar-border); border-radius: 8px;
}
.bm-toggle { position: relative; display: inline-flex; cursor: pointer; }
.bm-toggle input { display: none; }
.bm-toggle-ui {
  width: 40px; height: 22px; border-radius: 11px;
  background: var(--sidebar-border); transition: background 0.2s;
  position: relative;
}
.bm-toggle-ui::after {
  content: ''; position: absolute; top: 3px; left: 3px;
  width: 16px; height: 16px; border-radius: 50%; background: #fff;
  transition: transform 0.2s; box-shadow: 0 1px 3px rgba(0,0,0,0.2);
}
.bm-toggle input:checked + .bm-toggle-ui { background: var(--brand); }
.bm-toggle input:checked + .bm-toggle-ui::after { transform: translateX(18px); }

/* ── Upload zone ─────────────────────────────────────────────────────────── */
.banner-upload-zone {
  border: 2px dashed var(--sidebar-border);
  border-radius: 10px; overflow: hidden; cursor: pointer;
  transition: border-color 0.2s, background 0.2s;
  background: var(--admin-bg);
}
.banner-upload-zone:hover:not(.is-uploading) { border-color: var(--brand); }
.banner-upload-zone.has-image { border-style: solid; cursor: default; }

/* 4:1 preview */
.banner-preview-wrap {
  position: relative; width: 100%; aspect-ratio: 4 / 1; overflow: hidden;
}
.banner-preview-img { width: 100%; height: 100%; object-fit: cover; display: block; }
.banner-preview-actions {
  position: absolute; inset: 0;
  display: flex; align-items: center; justify-content: center; gap: 0.5rem;
  background: rgba(0,0,0,0.45); opacity: 0; transition: opacity 0.2s;
}
.banner-preview-wrap:hover .banner-preview-actions { opacity: 1; }
.bpa-btn {
  display: flex; align-items: center; gap: 0.35rem;
  padding: 0.45rem 0.85rem; border-radius: 8px; border: none; cursor: pointer;
  font-size: 0.78rem; font-weight: 600;
  background: rgba(255,255,255,0.95); color: #333;
  transition: background 0.15s;
}
.bpa-btn:hover { background: #fff; }
.bpa-btn--danger { background: rgba(239,68,68,0.85); color: #fff; }
.bpa-btn--danger:hover { background: #ef4444; }

/* Upload prompt */
.banner-upload-prompt {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  gap: 0.4rem; padding: 2rem 1rem; text-align: center;
}
.banner-upload-prompt i { font-size: 2rem; color: var(--brand); opacity: 0.6; }
.bup-title { font-size: 0.85rem; font-weight: 600; color: var(--text-primary); }
.bup-sub { font-size: 0.72rem; color: var(--text-secondary); }

.banner-uploading {
  display: flex; flex-direction: column; align-items: center; gap: 0.5rem;
  padding: 1.5rem 1rem;
}
.banner-uploading i { font-size: 1.5rem; color: var(--brand); }
.banner-uploading span { font-size: 0.82rem; color: var(--text-secondary); }
.banner-upload-progress {
  width: 180px; height: 4px; background: var(--sidebar-border);
  border-radius: 99px; overflow: hidden;
}
.banner-upload-bar {
  height: 100%; background: var(--brand); border-radius: 99px;
  transition: width 0.3s ease;
}

/* ── Danger button ───────────────────────────────────────────────────────── */
.admin-btn.danger {
  background: #ef4444; color: #fff; border-color: #ef4444;
}
.admin-btn.danger:hover { background: #dc2626; }

/* ── Transitions ─────────────────────────────────────────────────────────── */
.modal-fade-enter-active, .modal-fade-leave-active { transition: opacity 0.2s ease; }
.modal-fade-enter-from, .modal-fade-leave-to { opacity: 0; }
.modal-fade-enter-active .banner-modal,
.modal-fade-leave-active .banner-modal {
  transition: transform 0.2s ease;
}
.modal-fade-enter-from .banner-modal { transform: scale(0.96) translateY(8px); }
.modal-fade-leave-to .banner-modal   { transform: scale(0.96) translateY(8px); }

.toast-slide-enter-active, .toast-slide-leave-active { transition: all 0.25s ease; }
.toast-slide-enter-from { opacity: 0; transform: translateY(12px); }
.toast-slide-leave-to   { opacity: 0; transform: translateY(12px); }

/* ── req asterisk ────────────────────────────────────────────────────────── */
.req { color: #ef4444; }

/* ── Responsive ─────────────────────────────────────────────────────────── */
@media (max-width: 600px) {
  .banner-modal { max-width: 100%; border-radius: 12px; }
  .banner-card-actions { gap: 0.25rem; }
}
</style>
