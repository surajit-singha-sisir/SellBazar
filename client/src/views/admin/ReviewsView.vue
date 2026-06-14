<template>
  <div class="admin-page-wrap">
    <div class="admin-page-header">
      <div>
        <h1 class="page-title">Reviews</h1>
        <p class="page-subtitle">Moderate customer reviews and manage product ratings.</p>
      </div>
      <button class="admin-btn secondary" @click="loadReviews">
        <i class="fa-sharp fa-solid fa-arrows-rotate" :class="{ 'fa-spin': loading }"></i> Refresh
      </button>
    </div>

    <!-- Stats strip -->
    <div class="admin-grid-4" style="margin-bottom:20px">
      <div class="admin-stat-card">
        <div class="stat-icon" style="background:rgba(251,191,36,.12);color:#fbbf24">
          <i class="fa-sharp-duotone fa-solid fa-star"></i>
        </div>
        <div>
          <div class="stat-label">Total Reviews</div>
          <div class="stat-value">{{ allReviews.length }}</div>
        </div>
      </div>
      <div class="admin-stat-card">
        <div class="stat-icon" style="background:rgba(34,197,94,.12);color:#22c55e">
          <i class="fa-sharp-duotone fa-solid fa-circle-check"></i>
        </div>
        <div>
          <div class="stat-label">Approved</div>
          <div class="stat-value">{{ allReviews.filter(r => r.status === 'approved').length }}</div>
        </div>
      </div>
      <div class="admin-stat-card">
        <div class="stat-icon" style="background:rgba(249,115,22,.12);color:#f97316">
          <i class="fa-sharp-duotone fa-solid fa-clock"></i>
        </div>
        <div>
          <div class="stat-label">Pending</div>
          <div class="stat-value">{{ allReviews.filter(r => r.status === 'pending').length }}</div>
        </div>
      </div>
      <div class="admin-stat-card">
        <div class="stat-icon" style="background:rgba(139,92,246,.12);color:#8b5cf6">
          <i class="fa-sharp-duotone fa-solid fa-chart-line"></i>
        </div>
        <div>
          <div class="stat-label">Avg Rating</div>
          <div class="stat-value">{{ avgRating }}</div>
        </div>
      </div>
    </div>

    <!-- Filters -->
    <div class="admin-card" style="padding:16px;margin-bottom:16px">
      <div style="display:flex;gap:10px;flex-wrap:wrap;align-items:center">
        <div style="position:relative;flex:1;min-width:200px">
          <i class="fa-sharp fa-regular fa-search" style="position:absolute;left:12px;top:50%;transform:translateY(-50%);color:var(--text-secondary);font-size:13px"></i>
          <input v-model="search" class="admin-input" style="padding-left:34px" placeholder="Search reviewer, product…" />
        </div>
        <select v-model="filterStatus" class="admin-input" style="width:160px">
          <option value="all">All Statuses</option>
          <option value="approved">Approved</option>
          <option value="pending">Pending</option>
          <option value="rejected">Rejected</option>
        </select>
        <select v-model="filterRating" class="admin-input" style="width:140px">
          <option value="all">All Ratings</option>
          <option v-for="n in [5,4,3,2,1]" :key="n" :value="n">{{ n }} star{{ n > 1 ? 's' : '' }}</option>
        </select>
      </div>
    </div>

    <!-- Table -->
    <div class="admin-card" style="overflow:hidden">
      <div v-if="loading" style="text-align:center;padding:48px;color:var(--text-secondary)">
        <i class="fa-sharp fa-solid fa-spinner fa-spin" style="font-size:24px;color:#f97316;display:block;margin-bottom:8px"></i>
        Loading reviews…
      </div>
      <div v-else-if="loadError" style="text-align:center;padding:48px;color:#ef4444">
        <i class="fa-sharp fa-solid fa-triangle-exclamation" style="font-size:32px;display:block;margin-bottom:10px"></i>
        <p style="font-weight:600;margin-bottom:6px">Failed to load reviews</p>
        <p style="font-size:13px;color:var(--text-secondary);margin-bottom:16px">{{ loadError }}</p>
        <button class="admin-btn secondary" @click="loadReviews">
          <i class="fa-sharp fa-solid fa-arrows-rotate"></i> Retry
        </button>
      </div>
      <div v-else-if="filtered.length === 0" style="text-align:center;padding:48px;color:var(--text-secondary)">
        <i class="fa-sharp fa-regular fa-star" style="font-size:36px;display:block;margin-bottom:8px;opacity:.2"></i>
        No reviews found.
      </div>
      <div v-else class="rv-table-wrap">
        <table class="admin-table">
          <thead>
            <tr>
              <th>Product</th>
              <th>Reviewer</th>
              <th>Rating</th>
              <th>Review</th>
              <th>Images</th>
              <th>Date</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="review in filtered" :key="review.id">
              <td>
                <RouterLink :to="`/products/${review.productSlug}`"
                  class="rv-product-link" target="_blank">
                  {{ review.productName || review.productSlug }}
                  <i class="fa-sharp fa-regular fa-arrow-up-right-from-square" style="font-size:10px;opacity:.5;margin-left:4px"></i>
                </RouterLink>
              </td>
              <td>
                <div style="font-size:13px;font-weight:600">{{ review.userName }}</div>
                <div style="font-size:11px;color:var(--text-secondary)">{{ review.userEmail }}</div>
              </td>
              <td>
                <div class="rv-stars">
                  <i v-for="n in 5" :key="n"
                    :class="n <= review.rating ? 'fa-sharp fa-solid fa-star' : 'fa-sharp fa-regular fa-star'"
                    style="font-size:11px;color:#fbbf24"></i>
                </div>
              </td>
              <td style="max-width:240px">
                <p v-if="review.title" style="font-weight:600;font-size:12px;margin:0 0 2px">{{ review.title }}</p>
                <p class="rv-body">{{ review.body }}</p>
                <span v-if="review.helpful > 0" style="font-size:11px;color:var(--text-secondary)">
                  <i class="fa-sharp fa-regular fa-thumbs-up"></i> {{ review.helpful }} helpful
                </span>
              </td>
              <td>
                <div v-if="review.images?.length" style="display:flex;gap:4px;flex-wrap:wrap">
                  <img v-for="(img, i) in review.images.slice(0,3)" :key="i" :src="img"
                    style="width:36px;height:36px;object-fit:cover;border-radius:6px;border:1px solid var(--border-color);cursor:pointer"
                    @click="preview = img" />
                  <span v-if="review.images.length > 3" style="font-size:11px;color:var(--text-secondary);align-self:center">
                    +{{ review.images.length - 3 }}
                  </span>
                </div>
                <span v-else style="font-size:11px;color:var(--text-secondary)">—</span>
              </td>
              <td style="font-size:12px;white-space:nowrap;color:var(--text-secondary)">
                {{ formatDate(review.createdAt) }}
              </td>
              <td>
                <span class="status-badge" :class="statusClass(review.status)">{{ review.status }}</span>
              </td>
              <td>
                <div style="display:flex;gap:6px">
                  <button @click="openEdit(review)"
                    class="admin-btn ghost" style="padding:4px 8px;font-size:11px;color:#8b5cf6;border-color:rgba(139,92,246,.3)"
                    title="Edit">
                    <i class="fa-sharp fa-regular fa-pen-to-square"></i>
                  </button>
                  <button v-if="review.status !== 'approved'" @click="changeStatus(review, 'approved')"
                    class="admin-btn ghost" style="padding:4px 8px;font-size:11px;color:#22c55e;border-color:rgba(34,197,94,.3)"
                    title="Approve">
                    <i class="fa-sharp fa-solid fa-check"></i>
                  </button>
                  <button v-if="review.status !== 'rejected'" @click="changeStatus(review, 'rejected')"
                    class="admin-btn ghost" style="padding:4px 8px;font-size:11px;color:#f97316;border-color:rgba(249,115,22,.3)"
                    title="Reject">
                    <i class="fa-sharp fa-solid fa-ban"></i>
                  </button>
                  <button @click="confirmDelete(review)"
                    class="admin-btn ghost" style="padding:4px 8px;font-size:11px;color:#ef4444;border-color:rgba(239,68,68,.25)"
                    title="Delete">
                    <i class="fa-sharp fa-regular fa-trash-can"></i>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- ── Edit Review Modal ──────────────────────────────────────────────── -->
    <Teleport to="body">
      <Transition name="modal">
        <div v-if="editTarget" class="modal-backdrop" @click.self="editTarget = null">
          <div class="edit-modal-box">

            <!-- Header -->
            <div class="edit-modal-header">
              <div style="display:flex;align-items:center;gap:10px">
                <div class="edit-modal-icon">
                  <i class="fa-sharp fa-solid fa-pen-to-square"></i>
                </div>
                <div>
                  <div style="font-size:15px;font-weight:800;color:var(--text-primary)">Edit Review</div>
                  <div style="font-size:11px;color:var(--text-secondary);margin-top:2px">{{ editTarget.productName || editTarget.productSlug }}</div>
                </div>
              </div>
              <button class="edit-close-btn" @click="editTarget = null">
                <i class="fa-sharp fa-solid fa-xmark"></i>
              </button>
            </div>

            <!-- Body -->
            <div class="edit-modal-body">

              <!-- Reviewer info (read-only) -->
              <div class="edit-field-row">
                <div class="edit-field" style="flex:1">
                  <label class="edit-label">Reviewer Name</label>
                  <input v-model="editForm.userName" class="admin-input" placeholder="Customer name" />
                </div>
                <div class="edit-field" style="flex:1">
                  <label class="edit-label">Email <span style="color:var(--text-secondary);font-weight:400;font-size:10px">(read-only)</span></label>
                  <input :value="editTarget.userEmail" class="admin-input" disabled style="opacity:.6;cursor:not-allowed" />
                </div>
              </div>

              <!-- Rating -->
              <div class="edit-field">
                <label class="edit-label">Rating</label>
                <div class="edit-stars">
                  <button v-for="n in 5" :key="n"
                    class="edit-star-btn"
                    :class="{ filled: n <= editForm.rating, hovered: n <= editHover }"
                    @mouseenter="editHover = n"
                    @mouseleave="editHover = 0"
                    @click="editForm.rating = n">
                    <i class="fa-sharp fa-solid fa-star"></i>
                  </button>
                  <span class="edit-star-label">{{ editRatingLabel }}</span>
                </div>
              </div>

              <!-- Title -->
              <div class="edit-field">
                <label class="edit-label">Review Title</label>
                <input v-model="editForm.title" class="admin-input" placeholder="Review headline…" maxlength="120" />
                <p class="edit-hint">{{ editForm.title.length }}/120</p>
              </div>

              <!-- Body -->
              <div class="edit-field">
                <label class="edit-label">Review Body <span style="color:#ef4444">*</span></label>
                <textarea v-model="editForm.body" class="admin-input" style="resize:none;min-height:90px"
                  placeholder="Review content…" maxlength="2000" rows="4"></textarea>
                <p class="edit-hint">{{ editForm.body.length }}/2000</p>
              </div>

              <!-- Status + Admin note -->
              <div class="edit-field-row">
                <div class="edit-field" style="flex:1">
                  <label class="edit-label">Status</label>
                  <select v-model="editForm.status" class="admin-input">
                    <option value="approved">Approved</option>
                    <option value="pending">Pending</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>
              </div>

              <div class="edit-field">
                <label class="edit-label">Admin Note <span style="color:var(--text-secondary);font-weight:400;font-size:10px">(internal only)</span></label>
                <input v-model="editForm.adminNote" class="admin-input" placeholder="Optional internal note…" />
              </div>

              <!-- Images -->
              <div class="edit-field">
                <label class="edit-label">
                  Photos
                  <span style="font-weight:400;font-size:10px;color:var(--text-secondary)">(up to 5)</span>
                </label>
                <div class="edit-img-row">
                  <div v-for="(img, i) in editForm.images" :key="i" class="edit-img-thumb">
                    <img :src="img" style="width:100%;height:100%;object-fit:cover" />
                    <button class="edit-img-remove" @click="editForm.images.splice(i, 1)" title="Remove">
                      <i class="fa-sharp fa-solid fa-xmark"></i>
                    </button>
                  </div>
                  <label
                    v-if="editForm.images.length < 5"
                    class="edit-img-add"
                    :class="{ 'edit-img-uploading': editImageUploading }"
                  >
                    <i v-if="editImageUploading" class="fa-sharp fa-solid fa-spinner fa-spin" style="color:#8b5cf6"></i>
                    <template v-else>
                      <i class="fa-sharp fa-regular fa-camera" style="font-size:16px"></i>
                      <span style="font-size:9px;margin-top:2px">Add Photo</span>
                    </template>
                    <input type="file" accept="image/*" class="edit-img-input"
                      :disabled="editImageUploading" @change="onEditImagePick" />
                  </label>
                </div>
                <p v-if="editImageError" style="font-size:11px;color:#ef4444;margin:0">{{ editImageError }}</p>
              </div>

              <!-- Error -->
              <div v-if="editError" style="display:flex;align-items:center;gap:8px;font-size:12px;color:#ef4444;background:rgba(239,68,68,.08);border:1px solid rgba(239,68,68,.2);border-radius:10px;padding:10px 14px">
                <i class="fa-sharp fa-solid fa-circle-exclamation"></i>
                {{ editError }}
              </div>

            </div>

            <!-- Footer -->
            <div class="edit-modal-footer">
              <button class="admin-btn secondary" @click="editTarget = null">Cancel</button>
              <button class="admin-btn primary" :disabled="editSaving || !editForm.body.trim()" @click="saveEdit">
                <i :class="editSaving ? 'fa-sharp fa-solid fa-spinner fa-spin' : 'fa-sharp fa-solid fa-floppy-disk'"></i>
                {{ editSaving ? 'Saving…' : 'Save Changes' }}
              </button>
            </div>

          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- Delete confirm modal -->
    <Teleport to="body">
      <Transition name="modal">
        <div v-if="deleteTarget" class="modal-backdrop" @click.self="deleteTarget = null">
          <div class="modal-box">
            <div class="modal-icon" style="background:rgba(239,68,68,.1);color:#ef4444">
              <i class="fa-sharp fa-solid fa-trash-can"></i>
            </div>
            <h3>Delete Review?</h3>
            <p>This will permanently remove the review by <strong>{{ deleteTarget.userName }}</strong> and update the product rating.</p>
            <div class="modal-actions">
              <button class="admin-btn secondary" @click="deleteTarget = null">Cancel</button>
              <button class="admin-btn danger" :disabled="deleting" @click="doDelete">
                <i :class="deleting ? 'fa-sharp fa-solid fa-spinner fa-spin' : 'fa-sharp fa-solid fa-trash-can'"></i>
                {{ deleting ? 'Deleting…' : 'Delete' }}
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- Image preview -->
    <Teleport to="body">
      <Transition name="modal">
        <div v-if="preview" class="modal-backdrop" @click="preview = null" style="z-index:250">
          <img :src="preview" style="max-height:80vh;max-width:90vw;border-radius:12px;object-fit:contain" @click.stop />
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import type { Review } from '@/types'

const BASE = '/api'
function getToken() { return localStorage.getItem('sb-admin-token') }

async function apiFetch(path: string, options: RequestInit = {}) {
  const token = getToken()
  const headers: Record<string, string> = { 'Content-Type': 'application/json', 'Cache-Control': 'no-cache' }
  if (token) headers['Authorization'] = `Bearer ${token}`
  const res = await fetch(`${BASE}${path}`, { ...options, headers, cache: 'no-store' })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status}`)
  return data
}

type ApiReview = Review & { productSlug: string; productName?: string }

const allReviews   = ref<ApiReview[]>([])
const loading      = ref(false)
const loadError    = ref('')
const search       = ref('')
const filterStatus = ref('all')
const filterRating = ref<number | 'all'>('all')
const deleteTarget = ref<ApiReview | null>(null)
const deleting     = ref(false)
const preview      = ref<string | null>(null)

// ── Edit state ─────────────────────────────────────────────────────────────────
const editTarget      = ref<ApiReview | null>(null)
const editSaving      = ref(false)
const editError       = ref('')
const editHover       = ref(0)
const editImageUploading = ref(false)
const editImageError  = ref('')
const editForm = ref({
  userName:  '',
  rating:    5,
  title:     '',
  body:      '',
  status:    'approved' as 'approved' | 'pending' | 'rejected',
  adminNote: '',
  images:    [] as string[],
})
const ratingLabels = ['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent']
const editRatingLabel = computed(() =>
  ratingLabels[editHover.value || editForm.value.rating] ?? ''
)

function openEdit(review: ApiReview) {
  editTarget.value     = review
  editError.value      = ''
  editImageError.value = ''
  editHover.value      = 0
  editForm.value = {
    userName:  review.userName,
    rating:    review.rating,
    title:     review.title  ?? '',
    body:      review.body,
    status:    review.status as 'approved' | 'pending' | 'rejected',
    adminNote: review.adminNote ?? '',
    images:    [...(review.images ?? [])],
  }
}

async function onEditImagePick(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file || editForm.value.images.length >= 5) return
  if (!file.type.startsWith('image/')) { editImageError.value = 'Only image files are supported'; return }
  if (file.size > 32 * 1024 * 1024)   { editImageError.value = 'Image must be smaller than 32 MB'; return }
  editImageUploading.value = true
  editImageError.value = ''
  try {
    const form = new FormData()
    form.append('image', file, file.name)
    const res = await fetch('/api/upload/imgbb', { method: 'POST', body: form })
    const data = await res.json()
    if (!res.ok || !data.url) throw new Error(data?.error ?? 'Upload failed')
    editForm.value.images.push(data.url as string)
  } catch (err: any) {
    editImageError.value = err.message ?? 'Image upload failed'
  } finally {
    editImageUploading.value = false
    ;(e.target as HTMLInputElement).value = ''
  }
}

async function saveEdit() {
  if (!editTarget.value) return
  editSaving.value = true
  editError.value  = ''
  try {
    const updated = await apiFetch(`/reviews/${editTarget.value.id}`, {
      method: 'PUT',
      body: JSON.stringify(editForm.value),
    })
    const idx = allReviews.value.findIndex(r => r.id === editTarget.value!.id)
    if (idx !== -1) allReviews.value[idx] = { ...allReviews.value[idx], ...updated }
    editTarget.value = null
  } catch (e: any) {
    editError.value = e.message ?? 'Failed to save changes'
  } finally {
    editSaving.value = false
  }
}
// ── /Edit state ────────────────────────────────────────────────────────────────

const avgRating = computed(() => {
  const approved = allReviews.value.filter(r => r.status === 'approved')
  if (!approved.length) return '—'
  const avg = approved.reduce((s, r) => s + r.rating, 0) / approved.length
  return avg.toFixed(1)
})

const filtered = computed(() => {
  let r = allReviews.value
  if (filterStatus.value !== 'all') r = r.filter(x => x.status === filterStatus.value)
  if (filterRating.value !== 'all') r = r.filter(x => x.rating === filterRating.value)
  if (search.value.trim()) {
    const q = search.value.toLowerCase()
    r = r.filter(x =>
      x.userName.toLowerCase().includes(q) ||
      x.userEmail.toLowerCase().includes(q) ||
      (x.productName ?? '').toLowerCase().includes(q) ||
      x.body.toLowerCase().includes(q)
    )
  }
  return r
})

async function loadReviews() {
  loading.value   = true
  loadError.value = ''
  try {
    // Local server:  GET /api/reviews        → returns array directly
    // Vercel server: GET /api/admin/reviews  → returns { data: [] }
    const data = await apiFetch('/reviews')
    allReviews.value = Array.isArray(data) ? data : (data.data ?? [])
  } catch (e: any) {
    loadError.value  = e.message ?? 'Failed to load reviews'
    allReviews.value = []
  } finally {
    loading.value = false
  }
}

async function changeStatus(review: ApiReview, status: string) {
  try {
    // Local server:  PUT /api/reviews/:id    → { status, adminNote }
    // Vercel server: PATCH /api/admin/reviews/:productSlug/:id
    const updated = await apiFetch(`/reviews/${review.id}`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    })
    const idx = allReviews.value.findIndex(r => r.id === review.id)
    if (idx !== -1) allReviews.value[idx] = { ...allReviews.value[idx], ...updated }
  } catch (e: any) {
    alert(e.message)
  }
}

function confirmDelete(review: ApiReview) { deleteTarget.value = review }

async function doDelete() {
  if (!deleteTarget.value) return
  deleting.value = true
  try {
    // Local server:  DELETE /api/reviews/:id
    await apiFetch(`/reviews/${deleteTarget.value.id}`, { method: 'DELETE' })
    allReviews.value = allReviews.value.filter(r => r.id !== deleteTarget.value!.id)
    deleteTarget.value = null
  } catch (e: any) {
    alert(e.message)
  } finally {
    deleting.value = false
  }
}

function statusClass(status: string) {
  return status === 'approved' ? 'delivered' : status === 'rejected' ? 'cancelled' : 'processing'
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-BD', { year: 'numeric', month: 'short', day: 'numeric' })
}

onMounted(loadReviews)
</script>

<style scoped>
.rv-table-wrap { overflow-x: auto; }
.rv-product-link {
  font-size: 13px; font-weight: 600;
  color: var(--text-primary); text-decoration: none;
  display: inline-flex; align-items: center;
  max-width: 180px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
.rv-product-link:hover { color: #f97316; }
.rv-stars { display: flex; gap: 2px; }
.rv-body {
  font-size: 12px; color: var(--text-secondary);
  line-height: 1.5; margin: 0;
  display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
}

/* ── Edit modal ─────────────────────────────────────────────────────────────── */
.edit-modal-box {
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 20px;
  width: 96%;
  max-width: 560px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 24px 64px rgba(0,0,0,.3);
  overflow: hidden;
}
.edit-modal-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid var(--border-color);
  flex-shrink: 0; gap: 10px;
}
.edit-modal-icon {
  width: 36px; height: 36px; border-radius: 10px;
  background: rgba(139,92,246,.12); color: #8b5cf6;
  display: flex; align-items: center; justify-content: center; font-size: 14px;
}
.edit-close-btn {
  width: 30px; height: 30px; border-radius: 8px;
  border: 1px solid var(--border-color); background: transparent; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  color: var(--text-secondary); transition: all .15s;
}
.edit-close-btn:hover { background: var(--bg-primary); color: var(--text-primary); }

.edit-modal-body {
  overflow-y: auto; padding: 20px;
  display: flex; flex-direction: column; gap: 14px;
}
.edit-modal-footer {
  padding: 14px 20px;
  border-top: 1px solid var(--border-color);
  display: flex; justify-content: flex-end; gap: 10px; flex-shrink: 0;
}
.edit-field { display: flex; flex-direction: column; gap: 5px; }
.edit-field-row { display: flex; gap: 12px; flex-wrap: wrap; }
.edit-label { font-size: 12px; font-weight: 600; color: var(--text-secondary); }
.edit-hint  { font-size: 11px; color: var(--text-secondary); text-align: right; margin: 0; }

/* Stars */
.edit-stars { display: flex; align-items: center; gap: 4px; }
.edit-star-btn {
  background: none; border: none; cursor: pointer; padding: 2px;
  font-size: 26px; color: var(--border-color); transition: color .12s, transform .1s; line-height: 1;
}
.edit-star-btn.filled,
.edit-star-btn.hovered { color: #f59e0b; }
.edit-star-btn:hover { transform: scale(1.15); }
.edit-star-label { font-size: 12px; font-weight: 700; color: #f59e0b; min-width: 70px; margin-left: 4px; }

/* Delete / generic modal */
.modal-backdrop {
  position: fixed; inset: 0; z-index: 200;
  background: rgba(0,0,0,.5); backdrop-filter: blur(4px);
  display: flex; align-items: center; justify-content: center;
}
.modal-box {
  background: var(--bg-secondary); border: 1px solid var(--border-color);
  border-radius: 18px; padding: 28px; max-width: 380px; width: 90%;
  text-align: center; box-shadow: 0 24px 64px rgba(0,0,0,.25);
}
.modal-icon {
  width: 52px; height: 52px; border-radius: 14px;
  display: flex; align-items: center; justify-content: center;
  font-size: 22px; margin: 0 auto 14px;
}
.modal-box h3 { font-size: 1.1rem; font-weight: 700; margin: 0 0 8px; }
.modal-box p  { font-size: .85rem; color: var(--text-secondary); margin: 0 0 20px; }
.modal-actions { display: flex; gap: 10px; justify-content: center; }
.admin-btn.danger {
  background: #ef4444; color: white; border-color: #ef4444;
}
.admin-btn.danger:hover:not(:disabled) { background: #dc2626; }
.modal-enter-active, .modal-leave-active { transition: opacity .2s ease; }
.modal-enter-from, .modal-leave-to { opacity: 0; }

/* ── Edit modal image upload ─────────────────────────────────────────────────── */
.edit-img-row {
  display: flex; flex-wrap: wrap; gap: 8px; margin-top: 2px;
}
.edit-img-thumb {
  position: relative; width: 64px; height: 64px;
  border-radius: 10px; overflow: hidden;
  border: 1px solid var(--border-color); flex-shrink: 0;
}
.edit-img-remove {
  position: absolute; top: 2px; right: 2px;
  width: 18px; height: 18px; border-radius: 50%;
  background: rgba(0,0,0,.6); border: none; color: #fff;
  font-size: 9px; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  opacity: 0; transition: opacity .15s;
}
.edit-img-thumb:hover .edit-img-remove { opacity: 1; }
.edit-img-add {
  width: 64px; height: 64px; border-radius: 10px;
  border: 2px dashed var(--border-color);
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  cursor: pointer; color: var(--text-secondary);
  transition: border-color .15s, background .15s; gap: 2px;
}
.edit-img-add:hover {
  border-color: #8b5cf6; background: rgba(139,92,246,.06); color: #8b5cf6;
}
.edit-img-add.edit-img-uploading {
  opacity: .6; cursor: not-allowed; pointer-events: none;
}
.edit-img-input { display: none; }
</style>
