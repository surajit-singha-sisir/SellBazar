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
            <div v-for="(step, i) in timelineSteps(order.status)" :key="step.label + i"
              class="timeline-step"
              :class="{ 'step-done': step.done, 'step-active': step.active, 'step-upcoming': !step.done && !step.active }">
              <div v-if="i < 4" class="timeline-line" :class="step.done || step.active ? 'line-done' : 'line-pending'"></div>
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
              <RouterLink
                v-if="item.productId"
                :to="productLink(item)"
                class="text-sm font-medium truncate block text-[var(--color-text-2)] hover:text-orange-500 transition-colors"
                @click.stop
              >{{ item.name }}</RouterLink>
              <p v-else class="text-sm font-medium truncate text-[var(--color-text-2)]">{{ item.name }}</p>
              <p class="text-xs text-[var(--color-text-muted)]">×{{ item.quantity }} · ৳{{ (item.price * item.quantity).toLocaleString() }}</p>
            </div>

            <!-- Review button (delivered only, if productId known) -->
            <template v-if="order.status === 'delivered' && item.productId">
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
         INVOICE MODAL
    ══════════════════════════════════════════════════════════════ -->
    <Teleport to="body">
      <Transition name="review-fade">
        <div v-if="invoiceOrder" class="rv-backdrop" @click.self="invoiceOrder = null">
          <div class="inv-box">

            <!-- Header -->
            <div class="inv-modal-header">
              <div style="display:flex;align-items:center;gap:10px">
                <div class="inv-modal-icon"><i class="fa-sharp fa-solid fa-receipt"></i></div>
                <div>
                  <div class="inv-modal-title">Order #{{ invoiceOrder.id.slice(-8).toUpperCase() }}</div>
                  <div class="inv-modal-sub">{{ formatDate(invoiceOrder.createdAt) }}</div>
                </div>
              </div>
              <div style="display:flex;gap:8px;align-items:center">
                <button class="inv-print-btn" @click="printInvoice(invoiceOrder)">
                  <i class="fa-sharp fa-solid fa-print"></i> Print
                </button>
                <button class="rv-close" @click="invoiceOrder = null">
                  <i class="fa-sharp fa-solid fa-xmark"></i>
                </button>
              </div>
            </div>

            <!-- Body -->
            <div class="inv-modal-body">

              <!-- Customer + Payment grid -->
              <div class="inv-grid-2">
                <div class="inv-info-card">
                  <div class="inv-info-label"><i class="fa-sharp fa-solid fa-user"></i> Customer</div>
                  <div class="inv-info-name">{{ invoiceOrder.customer?.name ?? '—' }}</div>
                  <div class="inv-info-row" v-if="invoiceOrder.customer?.email">
                    <i class="fa-sharp fa-solid fa-envelope"></i>{{ invoiceOrder.customer.email }}
                  </div>
                  <div class="inv-info-row" v-if="invoiceOrder.customer?.phone">
                    <i class="fa-sharp fa-solid fa-phone"></i>{{ invoiceOrder.customer.phone }}
                  </div>
                  <div class="inv-info-row" v-if="invoiceOrder.customer?.address">
                    <i class="fa-sharp fa-solid fa-location-dot"></i>{{ invoiceOrder.customer.address }}
                  </div>
                </div>
                <div class="inv-info-card">
                  <div class="inv-info-label"><i class="fa-sharp fa-solid fa-credit-card"></i> Payment & Status</div>
                  <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:8px">
                    <span class="inv-badge inv-badge--orange" style="text-transform:capitalize">{{ invoiceOrder.paymentMethod }}</span>
                    <span class="inv-badge" :class="invoiceOrder.paymentStatus==='paid' ? 'inv-badge--green' : 'inv-badge--yellow'">{{ invoiceOrder.paymentStatus }}</span>
                    <span class="inv-badge" :class="statusInvClass(invoiceOrder.status)" style="text-transform:capitalize">{{ invoiceOrder.status }}</span>
                  </div>
                  <div class="inv-info-row" v-if="invoiceOrder.trackingNumber">
                    <i class="fa-sharp fa-solid fa-truck" style="color:#f97316"></i>
                    <span class="font-mono font-bold text-orange-500">{{ invoiceOrder.trackingNumber }}</span>
                  </div>
                  <div class="inv-info-row" v-if="invoiceOrder.notes" style="font-style:italic;opacity:0.7">
                    <i class="fa-sharp fa-solid fa-note-sticky"></i>{{ invoiceOrder.notes }}
                  </div>
                </div>
              </div>

              <!-- Items table -->
              <div class="inv-items-card">
                <div class="inv-info-label"><i class="fa-sharp fa-solid fa-box"></i> Items</div>
                <table class="inv-table">
                  <thead>
                    <tr>
                      <th style="width:36px"></th>
                      <th>Product</th>
                      <th style="text-align:right">Price</th>
                      <th style="text-align:center">Qty</th>
                      <th style="text-align:right">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="item in invoiceOrder.items" :key="item.productId + item.name">
                      <td>
                        <img v-if="item.image" :src="item.image" :alt="item.name" class="inv-item-img" />
                        <div v-else class="inv-item-img-ph"><i class="fa-sharp fa-regular fa-box"></i></div>
                      </td>
                      <td class="inv-item-name">{{ item.name }}</td>
                      <td style="text-align:right;font-size:13px">৳{{ item.price.toLocaleString() }}</td>
                      <td style="text-align:center;font-weight:700">{{ item.quantity }}</td>
                      <td style="text-align:right;font-weight:700;color:#f97316">৳{{ (item.price * item.quantity).toLocaleString() }}</td>
                    </tr>
                  </tbody>
                  <tfoot>
                    <tr>
                      <td colspan="3"></td>
                      <td class="inv-tfoot-label">Subtotal</td>
                      <td class="inv-tfoot-val">৳{{ (invoiceOrder.subtotal ?? invoiceOrder.total).toLocaleString() }}</td>
                    </tr>
                    <tr v-if="invoiceOrder.shipping">
                      <td colspan="3"></td>
                      <td class="inv-tfoot-label">Shipping</td>
                      <td class="inv-tfoot-val">৳{{ Number(invoiceOrder.shipping).toLocaleString() }}</td>
                    </tr>
                    <tr class="inv-total-row">
                      <td colspan="3"></td>
                      <td class="inv-tfoot-label" style="font-weight:800;color:#f97316">Total</td>
                      <td class="inv-tfoot-val" style="font-weight:900;font-size:16px;color:#f97316">৳{{ invoiceOrder.total.toLocaleString() }}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>

            </div><!-- /body -->
          </div>
        </div>
      </Transition>
    </Teleport>

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

              <!-- Image upload -->
              <div class="rv-field">
                <label class="rv-label">
                  Photos
                  <span class="rv-label-sub">(up to 5, optional)</span>
                </label>
                <div class="rv-image-row">
                  <div
                    v-for="(img, i) in reviewForm.images"
                    :key="i"
                    class="rv-img-thumb"
                  >
                    <img :src="img" class="w-full h-full object-cover" />
                    <button
                      class="rv-img-remove"
                      @click="removeReviewImage(i)"
                      title="Remove"
                    ><i class="fa-sharp fa-solid fa-xmark"></i></button>
                  </div>
                  <label
                    v-if="reviewForm.images.length < 5"
                    class="rv-img-add"
                    :class="{ 'rv-img-uploading': reviewImageUploading }"
                  >
                    <i v-if="reviewImageUploading" class="fa-sharp fa-solid fa-spinner fa-spin text-orange-500"></i>
                    <template v-else>
                      <i class="fa-sharp fa-regular fa-camera text-lg"></i>
                      <span class="text-[9px] mt-0.5">Add Photo</span>
                    </template>
                    <input
                      type="file"
                      accept="image/*"
                      class="hidden"
                      :disabled="reviewImageUploading"
                      @change="onReviewImagePick"
                    />
                  </label>
                </div>
                <p v-if="reviewImageError" class="rv-hint" style="color:#ef4444">{{ reviewImageError }}</p>
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
  productSlug?: string
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

// ── Invoice modal ─────────────────────────────────────────────────────────────
const invoiceOrder = ref<Order | null>(null)

function openInvoice(order: Order) {
  invoiceOrder.value = order
}

function statusInvClass(status: string) {
  const map: Record<string, string> = {
    delivered: 'inv-badge--green', shipped: 'inv-badge--blue',
    processing: 'inv-badge--purple', pending: 'inv-badge--yellow', cancelled: 'inv-badge--red',
  }
  return map[status] ?? 'inv-badge--orange'
}

function printInvoice(o: Order) {
  const win = window.open('', '_blank')
  if (!win) return
  const itemRows = o.items.map((item, i) => `
    <tr>
      <td style="color:#aaa;font-size:11px">${i + 1}</td>
      <td>${item.name}</td>
      <td style="text-align:right">৳${item.price.toLocaleString()}</td>
      <td style="text-align:center;font-weight:700">${item.quantity}</td>
      <td style="text-align:right;font-weight:700;color:#f97316">৳${(item.price * item.quantity).toLocaleString()}</td>
    </tr>`).join('')
  win.document.write(`<!DOCTYPE html>
<html><head><meta charset="utf-8"/><title>Invoice #${o.id.slice(-8).toUpperCase()}</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:'Segoe UI',system-ui,sans-serif;background:#f3f4f6;padding:32px;color:#111}
  .inv{background:#fff;border-radius:12px;overflow:hidden;max-width:780px;margin:0 auto;box-shadow:0 4px 24px rgba(0,0,0,.1)}
  .inv-head{background:linear-gradient(135deg,#f97316,#d946ef);color:#fff;padding:28px;display:flex;justify-content:space-between;align-items:flex-start}
  .brand{font-size:22px;font-weight:900;letter-spacing:-.03em}.brand-sub{font-size:11px;opacity:.8;margin-top:3px}
  .inv-no{text-align:right}.inv-no-label{font-size:13px;font-weight:800;letter-spacing:.1em;opacity:.9}
  .inv-no-val{font-size:11px;opacity:.8;margin-top:4px}
  .inv-body{padding:24px 28px}
  .grid2{display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:24px}
  .info-block h4{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.1em;color:#888;margin-bottom:8px}
  .info-block p{font-size:13px;color:#444;line-height:1.6}
  .info-block .name{font-size:15px;font-weight:700;color:#111;margin-bottom:4px}
  .badge{display:inline-block;padding:2px 10px;border-radius:20px;font-size:11px;font-weight:700;text-transform:uppercase}
  .badge-orange{background:#fff7ed;color:#c2410c}.badge-green{background:#f0fdf4;color:#15803d}.badge-yellow{background:#fefce8;color:#a16207}
  table{width:100%;border-collapse:collapse;font-size:13px}
  thead th{padding:8px 12px;text-align:left;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.07em;color:#888;background:#f8f8f8;border-bottom:1px solid #eee}
  tbody td{padding:11px 12px;border-bottom:1px solid #f0f0f0;color:#333}
  tfoot td{padding:7px 12px;font-size:13px;color:#555;background:#fafafa}
  .grand td{font-size:15px;font-weight:900;color:#f97316;border-top:2px solid #f97316}
  .inv-foot{background:#111;color:rgba(255,255,255,.7);padding:16px 28px;display:flex;justify-content:space-between;align-items:center;font-size:12px}
  .inv-foot .total{font-size:24px;font-weight:900;color:#f97316}
  @media print{body{padding:0;background:#fff}.inv{box-shadow:none;border-radius:0}}
</style></head>
<body><div class="inv">
  <div class="inv-head">
    <div><div class="brand">SellBazar</div><div class="brand-sub">sellbazar.com</div></div>
    <div class="inv-no">
      <div class="inv-no-label">INVOICE</div>
      <div class="inv-no-val">#${o.id.slice(-8).toUpperCase()}</div>
      <div class="inv-no-val">${formatDate(o.createdAt)}</div>
    </div>
  </div>
  <div class="inv-body">
    <div class="grid2">
      <div class="info-block">
        <h4>Bill To</h4>
        <div class="name">${o.customer?.name ?? '—'}</div>
        ${o.customer?.email ? `<p>${o.customer.email}</p>` : ''}
        ${o.customer?.phone ? `<p>${o.customer.phone}</p>` : ''}
        ${o.customer?.address ? `<p style="margin-top:4px">${o.customer.address}</p>` : ''}
      </div>
      <div class="info-block">
        <h4>Order Info</h4>
        <p><strong>Payment:</strong> ${o.paymentMethod}</p>
        <p style="margin-top:4px">
          <span class="badge ${o.paymentStatus === 'paid' ? 'badge-green' : 'badge-yellow'}">${o.paymentStatus}</span>
          <span class="badge badge-orange" style="margin-left:6px">${o.status}</span>
        </p>
        ${o.trackingNumber ? `<p style="margin-top:8px">🚚 ${o.trackingNumber}</p>` : ''}
      </div>
    </div>
    <table>
      <thead><tr><th>#</th><th>Product</th><th style="text-align:right">Unit Price</th><th style="text-align:center">Qty</th><th style="text-align:right">Subtotal</th></tr></thead>
      <tbody>${itemRows}</tbody>
      <tfoot>
        <tr><td colspan="3"></td><td style="text-align:right">Subtotal</td><td style="text-align:right;font-weight:700">৳${(o.subtotal ?? o.total).toLocaleString()}</td></tr>
        ${o.shipping ? `<tr><td colspan="3"></td><td style="text-align:right">Shipping</td><td style="text-align:right">৳${Number(o.shipping).toLocaleString()}</td></tr>` : ''}
        <tr class="grand"><td colspan="3"></td><td style="text-align:right">Total</td><td style="text-align:right">৳${o.total.toLocaleString()}</td></tr>
      </tfoot>
    </table>
  </div>
  <div class="inv-foot"><span>Thank you for shopping with SellBazar!</span><div class="total">৳${o.total.toLocaleString()}</div></div>
</div></body></html>`)
  win.document.close()
  win.onload = () => { win.focus(); win.print() }
  setTimeout(() => { try { win.focus(); win.print() } catch {} }, 800)
}

// ── Product link helper ───────────────────────────────────────────────────────
// Orders store productId (numeric string like "1") — we need the slug for the
// /products/:slug route. If item has a productSlug field, use it; otherwise fall
// back to a lookup in the seeded product list via productId.
const SEED_SLUG_MAP: Record<string, string> = {
  '1':'samsung-galaxy-a55','2':'nike-air-max-2027','3':'walton-primo-x7',
  '4':'muslin-saree-jamdani','5':'xiaomi-redmi-note-13','6':'bkash-qr-scanner',
  '7':'pran-mango-juice-1l','8':'lenovo-ideapad-slim5','9':'aarong-kurta-men',
  '10':'symphony-z55','11':'rfl-pressure-cooker','12':'meril-splash',
  '13':'sony-wh1000xm5','14':'apple-watch-s9','15':'basmati-rice-5kg',
  '16':'loreal-vitamin-c','17':'walton-ac-1ton','18':'gp-cricket-bat',
  '19':'humayun-himu','20':'polo-shirt-men','21':'canon-eos-r50',
  '22':'samsung-65-qled-tv','23':'ladies-kurti-set','24':'atomic-habits-bangla',
  '25':'rasasi-oud-perfume','26':'miyako-rice-cooker','27':'yoga-mat-tpe',
}

function productLink(item: OrderItem): string {
  if (item.productSlug) return `/products/${item.productSlug}`
  const id = item.productId ?? ''
  // If it already looks like a slug (contains non-numeric chars), use directly
  if (!/^\d+$/.test(id)) return `/products/${id}`
  // Map numeric id → slug
  return `/products/${SEED_SLUG_MAP[id] ?? id}`
}

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

const reviewForm = ref({ rating: 0, title: '', body: '', images: [] as string[] })
const hoverRating = ref(0)
const reviewImageUploading = ref(false)
const reviewImageError    = ref('')

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
  reviewModal.value    = { open: true, order, item, submitting: false, error: '', success: false }
  reviewForm.value     = { rating: 0, title: '', body: '', images: [] }
  hoverRating.value    = 0
  reviewImageError.value = ''
}

function removeReviewImage(i: number) {
  reviewForm.value.images.splice(i, 1)
}

async function onReviewImagePick(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file || reviewForm.value.images.length >= 5) return
  if (!file.type.startsWith('image/')) { reviewImageError.value = 'Only image files are supported'; return }
  if (file.size > 25 * 1024 * 1024)   { reviewImageError.value = 'Image must be smaller than 25 MB'; return }
  reviewImageUploading.value = true
  reviewImageError.value = ''
  try {
    // Compress via canvas (max 1600px, webp 0.82)
    const blob = await new Promise<Blob>((resolve, reject) => {
      const url = URL.createObjectURL(file)
      const img = new Image()
      img.onload = () => {
        URL.revokeObjectURL(url)
        let w = img.naturalWidth, h = img.naturalHeight
        const MAX = 1600
        if (w > MAX || h > MAX) {
          if (w >= h) { h = Math.round(h / w * MAX); w = MAX }
          else        { w = Math.round(w / h * MAX); h = MAX }
        }
        const canvas = document.createElement('canvas')
        canvas.width = w; canvas.height = h
        const ctx = canvas.getContext('2d')!
        ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, w, h)
        ctx.drawImage(img, 0, 0, w, h)
        canvas.toBlob(b => b ? resolve(b) : reject(new Error('Compression failed')), 'image/webp', 0.82)
      }
      img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Could not load image')) }
      img.src = url
    })
    const base64 = await new Promise<string>((res, rej) => {
      const reader = new FileReader()
      reader.onload  = () => res((reader.result as string).split(',')[1])
      reader.onerror = () => rej(new Error('Failed to read file'))
      reader.readAsDataURL(blob)
    })
    const baseName = file.name.replace(/\.[^.]+$/, '')
    const uploadRes = await fetch('/api/upload/imgbb', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ base64, name: baseName }),
    })
    const data = await uploadRes.json()
    if (!uploadRes.ok || !data.url) throw new Error(data?.error ?? 'Upload failed')
    reviewForm.value.images.push(data.url as string)
  } catch (err: any) {
    reviewImageError.value = err.message ?? 'Image upload failed'
  } finally {
    reviewImageUploading.value = false
    ;(e.target as HTMLInputElement).value = ''
  }
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

    // API routes on productSlug — resolve numeric id → slug if needed
    const rawId = item.productId!
    const productSlug = /^\d+$/.test(rawId) ? (SEED_SLUG_MAP[rawId] ?? rawId) : rawId

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
        images:      reviewForm.value.images,
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
// 5 visual steps mapped from 4 API statuses:
//   pending → processing → shipped → [out_for_delivery] → delivered
// "out_for_delivery" is a visual-only sub-step of "shipped":
//   - when status === 'shipped'  → shipped is active, out_for_delivery is upcoming
//   - when status === 'delivered'→ both out_for_delivery AND delivered are shown as done/active

interface TimelineStep {
  label: string
  icon:  string
  eta:   string
  done:  boolean
  active: boolean
}

function timelineSteps(status: string): TimelineStep[] {
  const cancelled = status === 'cancelled'

  // Visual order index for each API status
  // 0=pending, 1=processing, 2=shipped, 3=out_for_delivery(visual), 4=delivered
  const statusIndex: Record<string, number> = {
    pending:    0,
    processing: 1,
    shipped:    2,
    delivered:  4,   // skips visual step 3 — both 3+4 light up
  }
  const idx = cancelled ? -1 : (statusIndex[status] ?? 0)

  const DEFS = [
    { label: 'Order Placed',      icon: 'fa-sharp fa-solid fa-circle-check',    eta: 'Just now'  },
    { label: 'Processing',        icon: 'fa-sharp fa-solid fa-gear',             eta: '1–2 hours' },
    { label: 'Shipped',           icon: 'fa-sharp fa-solid fa-truck-fast',       eta: '1–2 days'  },
    { label: 'Out for Delivery',  icon: 'fa-sharp fa-solid fa-house-chimney',    eta: 'Today'     },
    { label: 'Delivered',         icon: 'fa-sharp fa-solid fa-box-circle-check', eta: ''          },
  ]

  return DEFS.map((def, i) => {
    if (cancelled) {
      return { ...def, done: false, active: false }
    }
    // When delivered: steps 0-3 are all "done", step 4 is "active"
    // When shipped:   steps 0-1 are "done", step 2 is "active", 3-4 are upcoming
    const done   = i < idx
    const active = i === idx
    return { ...def, done, active }
  })
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
/* ── Clickable order card ────────────────────────────────────────────────── */
.order-card-clickable {
  cursor: pointer;
  transition: box-shadow 0.15s, transform 0.1s;
}
.order-card-clickable:hover {
  box-shadow: 0 6px 24px rgba(249,115,22,0.12);
  transform: translateY(-1px);
}

/* ── Invoice modal ───────────────────────────────────────────────────────── */
.inv-box {
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: 20px;
  width: 100%;
  max-width: 680px;
  max-height: 92vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 24px 64px rgba(0,0,0,0.4);
  overflow: hidden;
}
.inv-modal-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 16px 20px; border-bottom: 1px solid var(--color-border);
  flex-shrink: 0; gap: 10px; flex-wrap: wrap;
}
.inv-modal-icon {
  width: 38px; height: 38px; border-radius: 10px;
  background: rgba(249,115,22,0.12); color: #f97316;
  display: flex; align-items: center; justify-content: center; font-size: 15px;
}
.inv-modal-title { font-size: 15px; font-weight: 800; color: var(--color-text); }
.inv-modal-sub   { font-size: 11px; color: var(--color-text-muted); margin-top: 2px; }
.inv-print-btn {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 7px 14px; border-radius: 8px; border: none; cursor: pointer;
  background: #f97316; color: #fff; font-size: 12px; font-weight: 700;
  transition: background 0.15s;
}
.inv-print-btn:hover { background: #ea580c; }
.inv-modal-body { overflow-y: auto; padding: 18px; display: flex; flex-direction: column; gap: 14px; flex: 1; }

.inv-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
@media (max-width: 520px) { .inv-grid-2 { grid-template-columns: 1fr; } }

.inv-info-card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 12px; padding: 14px;
}
.inv-info-label {
  font-size: 10px; font-weight: 700; text-transform: uppercase;
  letter-spacing: 0.1em; color: var(--color-text-muted);
  display: flex; align-items: center; gap: 6px; margin-bottom: 8px;
  i { color: #f97316; font-size: 11px; }
}
.inv-info-name { font-size: 14px; font-weight: 700; color: var(--color-text); margin-bottom: 6px; }
.inv-info-row {
  display: flex; align-items: flex-start; gap: 7px;
  font-size: 12px; color: var(--color-text-muted); margin-top: 4px; line-height: 1.5;
  i { font-size: 10px; flex-shrink: 0; margin-top: 2px; }
}
.inv-badge {
  display: inline-block; padding: 2px 8px; border-radius: 20px;
  font-size: 10px; font-weight: 700; text-transform: uppercase;
}
.inv-badge--orange { background: rgba(249,115,22,0.10); color: #c2410c; }
.inv-badge--green  { background: rgba(34,197,94,0.10);  color: #15803d; }
.inv-badge--yellow { background: rgba(234,179,8,0.10);  color: #a16207; }
.inv-badge--blue   { background: rgba(59,130,246,0.10); color: #1d4ed8; }
.inv-badge--purple { background: rgba(168,85,247,0.10); color: #7e22ce; }
.inv-badge--red    { background: rgba(239,68,68,0.10);  color: #b91c1c; }

.inv-items-card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 12px; padding: 14px;
}
.inv-table {
  width: 100%; border-collapse: collapse; font-size: 13px; margin-top: 8px;
}
.inv-table thead th {
  padding: 7px 10px; text-align: left; font-size: 10px; font-weight: 700;
  text-transform: uppercase; letter-spacing: 0.07em; color: var(--color-text-muted);
  background: var(--color-surface-2); border-bottom: 1px solid var(--color-border);
}
.inv-table tbody td {
  padding: 9px 10px; border-bottom: 1px solid var(--color-border);
  color: var(--color-text); vertical-align: middle;
}
.inv-table tfoot td { padding: 5px 10px; }
.inv-total-row td  { border-top: 2px solid #f97316; }
.inv-tfoot-label   { text-align: right; font-size: 12px; color: var(--color-text-muted); }
.inv-tfoot-val     { text-align: right; font-weight: 700; color: var(--color-text); }
.inv-item-img {
  width: 34px; height: 34px; border-radius: 7px; object-fit: cover; display: block;
}
.inv-item-img-ph {
  width: 34px; height: 34px; border-radius: 7px;
  background: var(--color-surface-2);
  display: flex; align-items: center; justify-content: center;
  font-size: 12px; color: var(--color-text-muted);
}
.inv-item-name { font-weight: 500; max-width: 220px; }

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

/* ── Review image upload ───────────────────────────────────────────────── */
.rv-label-sub {
  font-size: 10px;
  font-weight: 400;
  color: var(--color-text-muted);
  text-transform: none;
  margin-left: 4px;
}
.rv-image-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 4px;
}
.rv-img-thumb {
  position: relative;
  width: 68px;
  height: 68px;
  border-radius: 10px;
  overflow: hidden;
  border: 1px solid var(--color-border);
  flex-shrink: 0;
}
.rv-img-remove {
  position: absolute;
  top: 2px;
  right: 2px;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: rgba(0,0,0,0.6);
  border: none;
  color: #fff;
  font-size: 9px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity .15s;
}
.rv-img-thumb:hover .rv-img-remove { opacity: 1; }
.rv-img-add {
  width: 68px;
  height: 68px;
  border-radius: 10px;
  border: 2px dashed var(--color-border);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: var(--color-text-muted);
  transition: border-color .15s, background .15s;
  font-size: 11px;
  gap: 2px;
}
.rv-img-add:hover {
  border-color: #f97316;
  background: rgba(249,115,22,0.05);
  color: #f97316;
}
.rv-img-add.rv-img-uploading {
  opacity: 0.6;
  cursor: not-allowed;
  pointer-events: none;
}
</style>
