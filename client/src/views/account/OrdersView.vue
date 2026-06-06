<template>
  <div class="max-w-4xl mx-auto px-4 sm:px-6 py-8">
    <h1 class="font-display font-bold text-2xl mb-6 flex items-center gap-2">
      <i class="fa-sharp fa-regular fa-box text-orange-500"></i>
      My Orders
    </h1>

    <div v-if="loading" class="text-center py-16 text-[var(--color-text-muted)]">
      <i class="fa-sharp fa-solid fa-spinner fa-spin text-3xl mb-3 block text-orange-500"></i>
      Loading your orders...
    </div>

    <div v-else-if="error" class="text-center py-16 text-red-500">
      <i class="fa-sharp fa-solid fa-triangle-exclamation text-3xl mb-3 block"></i>
      {{ error }}
      <button @click="fetchOrders" class="btn-ghost mt-4">Retry</button>
    </div>

    <div v-else class="space-y-4">
      <div
        v-for="order in orders"
        :key="order.id"
        class="card overflow-hidden order-card-clickable"
        @click="openInvoice(order)"
      >

        <!-- ── Order header ────────────────────────────────────────────── -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-5 pb-4">
          <div>
            <div class="flex items-center gap-2 mb-1 flex-wrap">
              <span class="font-bold text-sm font-mono tracking-wide">{{ order.id }}</span>
              <span :class="statusBadge(order.status)" class="badge text-[10px] uppercase tracking-wide">{{ order.status }}</span>
              <span v-if="order.paymentStatus === 'paid'" class="badge badge-green text-[10px]">Paid</span>
              <span v-else class="badge badge-red text-[10px]">{{ order.paymentStatus }}</span>
            </div>
            <p class="text-xs text-[var(--color-text-muted)]">
              <i class="fa-sharp fa-regular fa-clock mr-1"></i>{{ formatDate(order.createdAt) }}
            </p>
          </div>
          <div class="text-right flex-shrink-0">
            <p class="font-bold text-orange-500 text-lg">৳{{ order.total.toLocaleString() }}</p>
            <p class="text-xs text-[var(--color-text-muted)] capitalize">
              <i class="fa-sharp fa-regular fa-credit-card mr-1"></i>{{ order.paymentMethod }}
            </p>
            <p class="text-[10px] text-[var(--color-text-muted)] mt-1 opacity-60">
              <i class="fa-sharp fa-regular fa-file-lines mr-1"></i>Click for invoice
            </p>
          </div>
        </div>

        <!-- ── Timeline ────────────────────────────────────────────────── -->
        <div class="px-5 pb-4">
          <div class="timeline">
            <div v-for="(step, i) in timelineSteps(order.status)" :key="step.key + i"
              class="timeline-step"
              :class="{ 'step-done': step.done, 'step-active': step.active, 'step-upcoming': !step.done && !step.active }">
              <div v-if="i < 4" class="timeline-line" :class="step.done ? 'line-done' : 'line-pending'"></div>
              <div class="timeline-dot"><i :class="step.icon"></i></div>
              <div class="timeline-label">
                <span class="step-name">{{ step.label }}</span>
                <span v-if="step.active" class="step-eta">{{ step.eta }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Tracking -->
        <div v-if="order.trackingNumber" class="mx-5 mb-4 flex items-center gap-2 text-xs bg-orange-500/8 border border-orange-500/20 rounded-lg px-3 py-2">
          <i class="fa-sharp fa-solid fa-truck-fast text-orange-500"></i>
          <span class="text-[var(--color-text-muted)]">Tracking:</span>
          <span class="font-mono font-semibold text-orange-500">{{ order.trackingNumber }}</span>
        </div>

        <!-- ── Items + Review buttons ──────────────────────────────────── -->
        <div class="divider mx-5"></div>
        <div class="px-5 pb-5 mt-3 space-y-3">
          <p class="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wide mb-2">Items</p>

          <div v-for="item in order.items" :key="item.productId + item.name" class="flex items-center gap-3">
            <!-- Thumb -->
            <div class="shrink-0">
              <img v-if="item.image" :src="item.image" class="w-11 h-11 rounded-lg object-cover bg-[var(--color-surface-2)]" />
              <div v-else class="w-11 h-11 rounded-lg bg-orange-500/10 flex items-center justify-center">
                <i class="fa-sharp fa-regular fa-box text-orange-400 text-sm"></i>
              </div>
            </div>

            <!-- Name + qty + price -->
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium truncate text-[var(--color-text-2)]">{{ item.name }}</p>
              <p class="text-xs text-[var(--color-text-muted)]">×{{ item.quantity }} · ৳{{ (item.price * item.quantity).toLocaleString() }}</p>
            </div>

            <!-- Review button (shipped or delivered, if productId known) -->
            <template v-if="(order.status === 'shipped' || order.status === 'delivered') && item.productId">
              <!-- Already reviewed -->
              <span v-if="reviewedKey(order.id, item.productId)"
                class="shrink-0 inline-flex items-center gap-1.5 text-xs text-green-600 bg-green-500/8 border border-green-500/20 rounded-lg px-2.5 py-1.5 font-medium">
                <i class="fa-sharp fa-solid fa-circle-check text-[11px]"></i> Reviewed
              </span>
              <!-- Write review -->
              <button v-else
                class="shrink-0 inline-flex items-center gap-1.5 text-xs font-semibold text-orange-600 bg-orange-500/8 border border-orange-400/30 rounded-lg px-2.5 py-1.5 hover:bg-orange-500/15 hover:border-orange-500/50 transition"
                @click.stop="openReviewModal(order, item)">
                <i class="fa-sharp fa-regular fa-star text-[11px]"></i>
                Write a Review
              </button>
            </template>
          </div>
        </div>

      </div><!-- /order card -->

      <!-- Empty state -->
      <div v-if="orders.length === 0" class="text-center py-16">
        <div class="w-20 h-20 rounded-3xl bg-orange-500/10 flex items-center justify-center mx-auto mb-4">
          <i class="fa-sharp fa-regular fa-box text-3xl text-orange-500"></i>
        </div>
        <h2 class="font-display font-bold text-xl">No orders yet</h2>
        <p class="text-[var(--color-text-muted)] text-sm mt-2">When you place an order, it will appear here</p>
        <RouterLink to="/products" class="btn-primary mt-4 inline-flex">Start Shopping</RouterLink>
      </div>
    </div>

    <!-- ══════════════════════════════════════════════════════════════
         REVIEW MODAL
    ══════════════════════════════════════════════════════════════ -->
    <Teleport to="body">
      <Transition name="review-fade">
        <div v-if="reviewModal.open" class="rv-backdrop" @click.self="closeReviewModal">
          <div class="rv-box">

            <!-- Header -->
            <div class="rv-header">
              <div class="rv-header-left">
                <div class="rv-product-thumb">
                  <img v-if="reviewModal.item?.image" :src="reviewModal.item.image" :alt="reviewModal.item.name" />
                  <i v-else class="fa-sharp fa-regular fa-box text-orange-400"></i>
                </div>
                <div>
                  <div class="rv-title">Review Product</div>
                  <div class="rv-product-name">{{ reviewModal.item?.name }}</div>
                </div>
              </div>
              <button class="rv-close" @click="closeReviewModal">
                <i class="fa-sharp fa-solid fa-xmark"></i>
              </button>
            </div>

            <!-- Body -->
            <div class="rv-body">

              <!-- Star rating picker -->
              <div class="rv-field">
                <label class="rv-label">Your Rating <span class="rv-req">*</span></label>
                <div class="rv-stars">
                  <button v-for="n in 5" :key="n"
                    class="rv-star-btn"
                    :class="{ filled: n <= reviewForm.rating, hovered: n <= hoverRating }"
                    @mouseenter="hoverRating = n"
                    @mouseleave="hoverRating = 0"
                    @click="reviewForm.rating = n">
                    <i class="fa-sharp fa-solid fa-star"></i>
                  </button>
                  <span class="rv-rating-label">{{ ratingLabel }}</span>
                </div>
              </div>

              <!-- Title -->
              <div class="rv-field">
                <label class="rv-label">Review Title</label>
                <input v-model="reviewForm.title"
                  class="input-field" placeholder="Sum up your experience in a few words…"
                  maxlength="120" />
                <p class="rv-hint">{{ reviewForm.title.length }}/120</p>
              </div>

              <!-- Body -->
              <div class="rv-field">
                <label class="rv-label">Your Review <span class="rv-req">*</span></label>
                <textarea v-model="reviewForm.body"
                  class="input-field resize-none" rows="4"
                  placeholder="What did you like or dislike? How was the quality and delivery?"
                  maxlength="2000"></textarea>
                <p class="rv-hint">{{ reviewForm.body.length }}/2000</p>
              </div>

              <!-- Error -->
              <div v-if="reviewModal.error"
                class="flex items-start gap-2 text-xs text-red-600 bg-red-500/8 border border-red-400/25 rounded-xl px-3 py-2.5">
                <i class="fa-sharp fa-solid fa-circle-exclamation mt-0.5 shrink-0"></i>
                {{ reviewModal.error }}
              </div>

              <!-- Success -->
              <div v-if="reviewModal.success"
                class="flex items-start gap-2 text-sm text-green-600 bg-green-500/8 border border-green-500/20 rounded-xl px-3 py-3">
                <i class="fa-sharp fa-solid fa-circle-check mt-0.5 shrink-0"></i>
                <div>
                  <strong>Review submitted!</strong> It'll appear on the product page after moderation. Thank you!
                </div>
              </div>

            </div><!-- /body -->

            <!-- Footer -->
            <div class="rv-footer" v-if="!reviewModal.success">
              <p class="rv-disclaimer">
                <i class="fa-sharp fa-solid fa-shield-halved text-green-500"></i>
                Reviews are verified purchases only and go through moderation.
              </p>
              <div class="rv-actions">
                <button class="btn-secondary" @click="closeReviewModal">Cancel</button>
                <button class="btn-primary" :disabled="reviewModal.submitting || !canSubmitReview" @click="submitReview">
                  <i v-if="reviewModal.submitting" class="fa-sharp fa-solid fa-spinner fa-spin"></i>
                  <i v-else class="fa-sharp fa-solid fa-paper-plane"></i>
                  {{ reviewModal.submitting ? 'Submitting…' : 'Submit Review' }}
                </button>
              </div>
            </div>

          </div>
        </div>
      </Transition>
    </Teleport>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '@/stores/useAuthStore'

const authStore = useAuthStore()
const API = '/api'

// ── Types ─────────────────────────────────────────────────────────────────────
interface OrderItem {
  productId?: string
  name: string
  quantity: number
  price: number
  image?: string
}
interface Order {
  id: string
  items: OrderItem[]
  subtotal: number
  shipping: number
  total: number
  status: string
  paymentMethod: string
  paymentStatus: string
  trackingNumber: string
  createdAt: string
  updatedAt: string
}

// ── Orders state ──────────────────────────────────────────────────────────────
const orders  = ref<Order[]>([])
const loading = ref(true)
const error   = ref('')

async function fetchOrders() {
  loading.value = true
  error.value   = ''
  try {
    const savedIds: string[] = JSON.parse(localStorage.getItem('sb-order-ids') ?? '[]')
    if (savedIds.length === 0) { orders.value = []; return }
    const results = await Promise.all(
      savedIds.map(id =>
        fetch(`${API}/orders/by-id/${id}`)
          .then(r => r.ok ? r.json() : null)
          .catch(() => null)
      )
    )
    orders.value = (results.filter(Boolean) as Order[])
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  } catch {
    error.value = 'Could not load orders. Please try again.'
  } finally {
    loading.value = false
  }
}

onMounted(fetchOrders)

// ── Already-reviewed set ──────────────────────────────────────────────────────
// Primary source: server eligibility check. localStorage is the fast cache.
const reviewedKeys = ref<Set<string>>(
  new Set(JSON.parse(localStorage.getItem('sb-reviewed') ?? '[]'))
)
function reviewedKey(orderId: string, productId: string) {
  return reviewedKeys.value.has(`${orderId}:${productId}`)
}
function markReviewed(orderId: string, productId: string) {
  reviewedKeys.value.add(`${orderId}:${productId}`)
  localStorage.setItem('sb-reviewed', JSON.stringify([...reviewedKeys.value]))
}

// ── Review modal state ────────────────────────────────────────────────────────
const reviewModal = ref({
  open:       false,
  order:      null as Order | null,
  item:       null as OrderItem | null,
  submitting: false,
  error:      '',
  success:    false,
})

const reviewForm = ref({ rating: 0, title: '', body: '' })
const hoverRating = ref(0)

const ratingLabels = ['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent']
const ratingLabel  = computed(() =>
  ratingLabels[hoverRating.value || reviewForm.value.rating] ?? ''
)

const canSubmitReview = computed(() =>
  reviewForm.value.rating > 0 && reviewForm.value.body.trim().length >= 10
)

function openReviewModal(order: Order, item: OrderItem) {
  // Must be logged in
  if (!authStore.isLoggedIn || !authStore.user) {
    alert('Please log in to write a review.')
    return
  }
  reviewModal.value = { open: true, order, item, submitting: false, error: '', success: false }
  reviewForm.value  = { rating: 0, title: '', body: '' }
  hoverRating.value = 0
}

function closeReviewModal() {
  reviewModal.value.open = false
}

async function submitReview() {
  if (!canSubmitReview.value) return
  const { order, item } = reviewModal.value
  if (!order || !item) return

  reviewModal.value.submitting = true
  reviewModal.value.error      = ''

  try {
    const user = authStore.user!

    // API needs the product SLUG, not numeric id.
    // item.productId may be a numeric string like "1"; look it up from seed mapping.
    // We pass it as-is — the server checks productId === p.id OR p.slug, so both work.
    const productSlug = item.productId!

    const res = await fetch(`${API}/reviews/${encodeURIComponent(productSlug)}`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userEmail:   user.email ?? '',
        userName:    user.name  ?? 'Customer',
        userId:      user.id    ?? '',
        rating:      reviewForm.value.rating,
        title:       reviewForm.value.title.trim(),
        body:        reviewForm.value.body.trim(),
        images:      [],
      }),
    })

    const data = await res.json()

    if (!res.ok) {
      // 403 = not a verified buyer, 409 = already reviewed
      reviewModal.value.error = data.error ?? `Error ${res.status}`
      return
    }

    // Mark reviewed in local cache
    markReviewed(order.id, item.productId!)
    reviewModal.value.success = true
    setTimeout(closeReviewModal, 2500)

  } catch {
    reviewModal.value.error = 'Could not submit review. Please check your connection.'
  } finally {
    reviewModal.value.submitting = false
  }
}

// ── Timeline ──────────────────────────────────────────────────────────────────
type StepKey = 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
const STEPS: { key: StepKey; label: string; icon: string; eta: string }[] = [
  { key: 'pending',    label: 'Order Placed',      icon: 'fa-sharp fa-solid fa-circle-check',           eta: 'Just now'  },
  { key: 'processing', label: 'Processing',         icon: 'fa-sharp fa-solid fa-gear',                   eta: '1-2 hours' },
  { key: 'shipped',    label: 'Shipped',            icon: 'fa-sharp fa-solid fa-truck-fast',             eta: '1-2 days'  },
  { key: 'delivered',  label: 'Out for Delivery',   icon: 'fa-sharp fa-solid fa-house-chimney',          eta: 'Today'     },
  { key: 'delivered',  label: 'Delivered',          icon: 'fa-sharp-duotone fa-solid fa-box-circle-check', eta: ''        },
]

function timelineSteps(status: string) {
  const order    = ['pending', 'processing', 'shipped', 'delivered']
  const currentIdx = order.indexOf(status === 'delivered' ? 'delivered' : status)
  return STEPS.map((step, i) => ({
    ...step,
    done:   i < (status === 'cancelled' ? 0 : (currentIdx === 3 ? 5 : currentIdx)),
    active: status === 'cancelled' ? false : (i === (currentIdx === 3 ? 4 : currentIdx)),
  }))
}

const statusBadgeMap: Record<string, string> = {
  delivered:  'badge-green',
  shipped:    'badge-brand',
  processing: 'badge-purple',
  pending:    'badge-red',
  cancelled:  'badge-red',
}
function statusBadge(s: string) { return statusBadgeMap[s] ?? 'badge-brand' }

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-BD', {
    year: 'numeric', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}
</script>

<style scoped>
/* ── Timeline (unchanged from before) ────────────────────────────────────── */
.timeline { display:flex; align-items:flex-start; gap:0; position:relative; overflow-x:auto; padding-bottom:4px; }
.timeline-step { display:flex; flex-direction:column; align-items:center; flex:1; min-width:56px; position:relative; }
.timeline-line { position:absolute; top:15px; left:50%; width:100%; height:2px; z-index:0; }
.line-done    { background:#f97316; }
.line-pending { background:var(--color-border, rgba(255,255,255,0.1)); }
.timeline-dot { width:30px; height:30px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:12px; z-index:1; transition:all .3s; border:2px solid transparent; flex-shrink:0; }
.step-done .timeline-dot     { background:#f97316; color:#fff; border-color:#f97316; }
.step-active .timeline-dot   { background:var(--color-bg,#fff); color:#f97316; border-color:#f97316; box-shadow:0 0 0 4px rgba(249,115,22,.15); animation:pulse-ring 2s ease infinite; }
.step-upcoming .timeline-dot { background:var(--color-surface-2,rgba(255,255,255,.05)); color:var(--color-text-muted); border-color:var(--color-border); }
@keyframes pulse-ring { 0%,100%{box-shadow:0 0 0 4px rgba(249,115,22,.15)} 50%{box-shadow:0 0 0 7px rgba(249,115,22,.08)} }
.timeline-label { display:flex; flex-direction:column; align-items:center; gap:2px; margin-top:6px; text-align:center; }
.step-name  { font-size:10px; font-weight:600; color:var(--color-text-muted); white-space:nowrap; }
.step-done .step-name   { color:#f97316; }
.step-active .step-name { color:var(--color-text); font-weight:700; }
.step-eta { font-size:9px; color:#f97316; font-weight:500; white-space:nowrap; }

/* ── Review modal backdrop ───────────────────────────────────────────────── */
.rv-backdrop {
  position: fixed; inset: 0; z-index: 600;
  background: rgba(0,0,0,0.6);
  backdrop-filter: blur(4px);
  display: flex; align-items: center; justify-content: center;
  padding: 16px;
}

.rv-box {
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: 20px;
  width: 100%;
  max-width: 520px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 24px 64px rgba(0,0,0,0.4);
  overflow: hidden;
}

/* Header */
.rv-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 18px 20px;
  border-bottom: 1px solid var(--color-border);
  flex-shrink: 0; gap: 12px;
}
.rv-header-left { display: flex; align-items: center; gap: 12px; min-width: 0; }
.rv-product-thumb {
  width: 44px; height: 44px; border-radius: 10px;
  overflow: hidden; flex-shrink: 0;
  background: var(--color-surface-2);
  display: flex; align-items: center; justify-content: center;
  img { width: 100%; height: 100%; object-fit: cover; }
}
.rv-title        { font-size: 15px; font-weight: 800; color: var(--color-text); }
.rv-product-name { font-size: 12px; color: var(--color-text-muted); margin-top: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 260px; }
.rv-close {
  width: 32px; height: 32px; border-radius: 8px; border: 1px solid var(--color-border);
  background: transparent; cursor: pointer; display: flex; align-items: center; justify-content: center;
  color: var(--color-text-muted); flex-shrink: 0; transition: all .15s;
  &:hover { background: var(--color-surface-2); color: var(--color-text); }
}

/* Body */
.rv-body { overflow-y: auto; padding: 20px; display: flex; flex-direction: column; gap: 16px; }

.rv-field { display: flex; flex-direction: column; gap: 6px; }
.rv-label { font-size: 12px; font-weight: 600; color: var(--color-text-muted); }
.rv-req   { color: #ef4444; }
.rv-hint  { font-size: 11px; color: var(--color-text-muted); text-align: right; margin-top: 2px; }

/* Stars */
.rv-stars {
  display: flex; align-items: center; gap: 6px;
}
.rv-star-btn {
  background: none; border: none; cursor: pointer; padding: 2px;
  font-size: 28px; color: var(--color-border);
  transition: color .12s, transform .1s;
  line-height: 1;
  &.filled, &.hovered { color: #f59e0b; }
  &:hover { transform: scale(1.15); }
  &:active { transform: scale(0.95); }
}
.rv-rating-label {
  font-size: 13px; font-weight: 700; color: #f59e0b;
  min-width: 80px; margin-left: 4px;
}

/* Footer */
.rv-footer {
  padding: 14px 20px;
  border-top: 1px solid var(--color-border);
  display: flex; align-items: center; justify-content: space-between;
  gap: 12px; flex-wrap: wrap; flex-shrink: 0;
}
.rv-disclaimer {
  font-size: 11px; color: var(--color-text-muted);
  display: flex; align-items: center; gap: 5px;
}
.rv-actions { display: flex; gap: 8px; }

/* Transition */
.review-fade-enter-active { transition: opacity .25s ease, transform .25s ease; }
.review-fade-leave-active { transition: opacity .2s ease, transform .2s ease; }
.review-fade-enter-from, .review-fade-leave-to { opacity: 0; transform: scale(0.96) translateY(8px); }
</style>
