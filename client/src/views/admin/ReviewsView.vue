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
const search       = ref('')
const filterStatus = ref('all')
const filterRating = ref<number | 'all'>('all')
const deleteTarget = ref<ApiReview | null>(null)
const deleting     = ref(false)
const preview      = ref<string | null>(null)

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
  loading.value = true
  try {
    const data = await apiFetch('/admin/reviews')
    allReviews.value = data.data ?? []
  } catch (e) {
    console.error('[AdminReviews] load:', e)
  } finally {
    loading.value = false
  }
}

async function changeStatus(review: ApiReview, status: string) {
  try {
    const updated = await apiFetch(`/admin/reviews/${review.productSlug}/${review.id}`, {
      method: 'PATCH',
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
    await apiFetch(`/admin/reviews/${deleteTarget.value.productSlug}/${deleteTarget.value.id}`, { method: 'DELETE' })
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
  &:hover:not(:disabled) { background: #dc2626; }
}
.modal-enter-active, .modal-leave-active { transition: opacity .2s ease; }
.modal-enter-from, .modal-leave-to { opacity: 0; }
</style>
