<template>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 py-8">
    <!-- Loading -->
    <div v-if="loading" class="flex items-center justify-center py-32">
      <div class="w-12 h-12 rounded-full border-4 border-orange-500/30 border-t-orange-500 animate-spin"></div>
    </div>

    <!-- Not found -->
    <div v-else-if="!product" class="text-center py-24">
      <p class="text-5xl mb-4">🔍</p>
      <h2 class="font-display font-bold text-2xl">Product not found</h2>
      <RouterLink to="/products" class="btn-primary mt-6 inline-flex">← Back to Products</RouterLink>
    </div>

    <!-- Product detail -->
    <template v-else-if="product">
      <!-- Breadcrumb -->
      <nav class="flex items-center gap-2 text-xs text-[var(--color-text-muted)] mb-6">
        <RouterLink to="/" class="hover:text-orange-500">Home</RouterLink>
        <i class="fa-sharp fa-regular fa-chevron-right text-[10px]"></i>
        <RouterLink to="/products" class="hover:text-orange-500">Products</RouterLink>
        <i class="fa-sharp fa-regular fa-chevron-right text-[10px]"></i>
        <RouterLink :to="`/products?cat=${product.category}`" class="hover:text-orange-500">{{ product.category }}</RouterLink>
        <i class="fa-sharp fa-regular fa-chevron-right text-[10px]"></i>
        <span class="text-[var(--color-text)] font-medium truncate max-w-[200px]">{{ product.name }}</span>
      </nav>

      <div class="product-grid">

        <!-- Image Gallery -->
        <div class="gallery-col">

          <!-- Main Swiper -->
          <div class="main-image-wrap card overflow-hidden bg-[var(--color-surface-2)] relative">
            <Swiper
              :modules="mainModules"
              :thumbs="{ swiper: thumbsSwiper }"
              :navigation="{ prevEl: '.main-prev', nextEl: '.main-next' }"
              :autoplay="{ delay: 3000, disableOnInteraction: false, pauseOnMouseEnter: true }"
              :loop="true"
              :space-between="0"
              class="w-full h-full"
              @swiper="onMainSwiper"
              @slide-change="onSlideChange"
              @click="openLightbox"
            >
              <SwiperSlide v-for="(img, i) in product.images" :key="i" class="w-full h-full cursor-pointer">
                <img
                  :src="img"
                  :alt="`${product.name} view ${i + 1}`"
                  class="w-full h-full object-contain"
                  draggable="false"
                />
              </SwiperSlide>
            </Swiper>

            <!-- Nav arrows -->
            <button class="main-prev absolute left-3 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-black/40 hover:bg-black/65 text-white flex items-center justify-center transition backdrop-blur-sm">
              <i class="fa-sharp fa-solid fa-chevron-left text-xs"></i>
            </button>
            <button class="main-next absolute right-3 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-black/40 hover:bg-black/65 text-white flex items-center justify-center transition backdrop-blur-sm">
              <i class="fa-sharp fa-solid fa-chevron-right text-xs"></i>
            </button>

            <!-- Slide counter -->
            <div class="absolute bottom-3 right-3 z-10 bg-black/50 text-white text-xs px-2 py-1 rounded-full backdrop-blur-sm">
              {{ activeIdx + 1 }} / {{ product.images.length }}
            </div>
          </div>

          <!-- Thumbs Swiper -->
          <Swiper
            :modules="thumbModules"
            watch-slides-progress
            :slides-per-view="Math.min(product.images.length, 5)"
            :space-between="8"
            class="thumbs-swiper w-full mt-3"
            @swiper="onThumbsSwiper"
          >
            <SwiperSlide
              v-for="(img, i) in product.images"
              :key="i"
              class="thumb-slide rounded-xl overflow-hidden border-2 cursor-pointer transition-all duration-200"
              :class="i === activeIdx
                ? 'border-orange-500 shadow-[0_0_0_2px_rgba(249,115,22,0.3)]'
                : 'border-[var(--color-border)] opacity-60 hover:opacity-100 hover:border-orange-300'"
            >
              <img :src="img" :alt="`thumb ${i + 1}`" class="w-full h-full object-cover" draggable="false" />
            </SwiperSlide>
          </Swiper>

        </div>

        <!-- Product Info -->
        <div class="info-col">
          <div class="flex flex-wrap gap-2">
            <span class="badge badge-brand">{{ product.brand }}</span>
            <span v-if="product.isNew"      class="badge badge-green">New Arrival</span>
            <span v-if="product.isFeatured" class="badge badge-purple">Top Pick</span>
          </div>

          <h1 class="product-title">{{ product.name }}</h1>
          <p class="text-[var(--color-text-muted)] font-bangla text-lg break-words">{{ product.nameBn }}</p>

          <div class="flex items-center gap-3">
            <div class="stars">
              <i v-for="n in 5" :key="n"
                :class="n <= Math.round(product.rating) ? 'fa-sharp fa-solid fa-star' : 'fa-sharp fa-regular fa-star'"
                class="text-sm"></i>
            </div>
            <span class="font-semibold">{{ product.rating }}</span>
            <span class="text-[var(--color-text-muted)] text-sm">({{ (product.reviewCount ?? 0).toLocaleString() }} reviews)</span>
          </div>

          <div class="price-row">
            <span class="price-main">৳{{ ((product.salePrice ?? product.price) || 0).toLocaleString() }}</span>
            <span v-if="product.salePrice" class="price-original">৳{{ (product.price || 0).toLocaleString() }}</span>
            <span v-if="product.salePrice" class="badge badge-red text-sm">{{ discountPct }}% OFF</span>
          </div>

          <div class="card p-4 space-y-3 bg-[var(--color-surface-2)]">
            <div class="flex items-center gap-3 text-sm">
              <i class="fa-sharp fa-solid fa-circle-check text-green-500"></i>
              <span class="text-green-600 font-medium">In Stock</span>
              <span class="text-[var(--color-text-muted)]">({{ product.stock }} units)</span>
            </div>
            <div class="flex items-center gap-3 text-sm">
              <i class="fa-sharp fa-regular fa-truck-fast text-blue-500"></i>
              <span>Delivered in <strong>{{ product.deliveryDays }} day{{ product.deliveryDays !== 1 ? 's' : '' }}</strong></span>
            </div>
            <div class="flex items-center gap-3 text-sm">
              <i class="fa-sharp fa-regular fa-location-dot text-orange-500"></i>
              <span>Ships from <strong>{{ product.location }}</strong></span>
            </div>
            <div class="flex items-center gap-3 text-sm">
              <i class="fa-sharp fa-regular fa-store text-purple-500"></i>
              <span>Seller: <strong>{{ product.seller }}</strong></span>
            </div>
          </div>

          <div class="flex items-center gap-3">
            <div class="flex items-center border border-[var(--color-border)] rounded-xl overflow-hidden">
              <button @click="qty = Math.max(1, qty - 1)"
                class="w-10 h-12 flex items-center justify-center hover:bg-[var(--color-surface-2)] transition">
                <i class="fa-sharp fa-solid fa-minus text-xs"></i>
              </button>
              <span class="w-12 text-center font-bold">{{ qty }}</span>
              <button @click="qty++"
                class="w-10 h-12 flex items-center justify-center hover:bg-[var(--color-surface-2)] transition">
                <i class="fa-sharp fa-solid fa-plus text-xs"></i>
              </button>
            </div>
            <button @click="addToCart" class="btn-primary flex-1 py-3.5 text-base">
              <i class="fa-sharp fa-regular fa-cart-plus"></i>
              {{ added ? '✓ Added!' : 'Add to Cart' }}
            </button>
            <button @click="wishlistStore.toggle(product.id)" class="btn-icon w-12 h-12"
              :class="wishlistStore.has(product.id) ? 'text-pink-500 border-pink-300 bg-pink-50' : ''">
              <i :class="wishlistStore.has(product.id) ? 'fa-sharp fa-solid fa-heart' : 'fa-sharp fa-regular fa-heart'"></i>
            </button>
          </div>

          <div class="flex flex-wrap gap-2">
            <span v-for="tag in product.tags" :key="tag" class="tag">#{{ tag }}</span>
          </div>
        </div>
      </div>

      <!-- Product Description (full width) -->
      <div v-if="product.description" class="mt-12">
        <h2 class="font-display font-bold text-2xl mb-5">Product Description</h2>
        <div class="card p-6 sm:p-8">
          <div class="product-description" v-html="product.description"></div>
        </div>
      </div>

      <!-- Related products -->
      <div class="mt-16">
        <h2 class="font-display font-bold text-2xl mb-6">Related Products</h2>
        <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          <ProductCard v-for="p in related" :key="p.id" :product="p" />
        </div>
      </div>

      <!-- Customer Reviews (read-only: submitted via account area) -->
      <div class="mt-16" id="reviews">
        <h2 class="font-display font-bold text-2xl flex items-center gap-2 mb-6">
          <i class="fa-sharp-duotone fa-solid fa-star text-amber-400"></i>
          Customer Reviews
          <span class="text-base font-normal text-[var(--color-text-muted)] ml-1">({{ reviews.length }})</span>
        </h2>

        <!-- Rating summary bar -->
        <div v-if="reviews.length > 0" class="review-summary card p-5 mb-6">
          <div class="flex items-center gap-6 flex-wrap">
            <div class="text-center">
              <div class="text-5xl font-black text-amber-400">{{ avgRating }}</div>
              <div class="stars mt-1">
                <i v-for="n in 5" :key="n"
                  :class="n <= Math.round(Number(avgRating)) ? 'fa-sharp fa-solid fa-star' : 'fa-sharp fa-regular fa-star'"
                  class="text-sm text-amber-400"></i>
              </div>
              <div class="text-xs text-[var(--color-text-muted)] mt-1">{{ reviews.length }} reviews</div>
            </div>
            <div class="flex-1 min-w-[180px] space-y-1.5">
              <div v-for="n in [5,4,3,2,1]" :key="n" class="flex items-center gap-2 text-xs">
                <span class="w-4 text-right text-[var(--color-text-muted)]">{{ n }}</span>
                <i class="fa-sharp fa-solid fa-star text-amber-400 text-[10px]"></i>
                <div class="flex-1 h-2 rounded-full bg-[var(--color-surface-2)] overflow-hidden">
                  <div class="h-full rounded-full bg-amber-400 transition-all duration-500"
                    :style="{ width: ratingBarPct(n) + '%' }"></div>
                </div>
                <span class="w-5 text-[var(--color-text-muted)]">{{ ratingCount(n) }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- CTA: write review from account orders -->
        <div class="review-notice card p-4 mb-6 flex items-center gap-3 text-sm">
          <i class="fa-sharp fa-regular fa-pen-to-square text-orange-400 text-base flex-shrink-0"></i>
          <span>
            Purchased this product?
            <RouterLink to="/account/orders" class="text-orange-500 font-semibold hover:underline">Go to My Orders</RouterLink>
            to leave a review.
          </span>
        </div>

        <!-- Review loading -->
        <div v-if="reviewsLoading" class="text-center py-10 text-[var(--color-text-muted)]">
          <i class="fa-sharp fa-solid fa-spinner fa-spin text-2xl text-orange-500 block mb-2"></i>
          Loading reviews…
        </div>

        <!-- No reviews yet -->
        <div v-else-if="reviews.length === 0" class="text-center py-12 text-[var(--color-text-muted)]">
          <i class="fa-sharp fa-regular fa-star text-4xl block mb-3 opacity-30"></i>
          <p class="font-medium">No reviews yet</p>
          <p class="text-sm">Be the first to review via your order history!</p>
        </div>

        <!-- Review list -->
        <div v-else class="space-y-4">
          <div v-for="review in reviews" :key="review.id" class="review-card card p-5">
            <div class="flex items-start gap-3">
              <!-- Avatar -->
              <div class="review-avatar flex-shrink-0">{{ review.userName.charAt(0).toUpperCase() }}</div>
              <div class="flex-1 min-w-0">
                <div class="flex items-center justify-between gap-2 flex-wrap">
                  <div>
                    <span class="font-semibold text-sm">{{ review.userName }}</span>
                    <span class="text-xs text-[var(--color-text-muted)] ml-2">{{ formatDate(review.createdAt) }}</span>
                  </div>
                  <div class="flex gap-0.5">
                    <i v-for="n in 5" :key="n"
                      :class="n <= review.rating ? 'fa-sharp fa-solid fa-star' : 'fa-sharp fa-regular fa-star'"
                      class="text-xs text-amber-400"></i>
                  </div>
                </div>
                <p v-if="review.title" class="font-semibold text-sm mt-1.5">{{ review.title }}</p>
                <p class="text-sm text-[var(--color-text-muted)] mt-1 leading-relaxed whitespace-pre-line">{{ review.body }}</p>
                <!-- Review images -->
                <div v-if="review.images?.length" class="flex flex-wrap gap-2 mt-3">
                  <img v-for="(img, i) in review.images" :key="i" :src="img"
                    class="w-16 h-16 object-cover rounded-lg border border-[var(--color-border)] cursor-pointer hover:opacity-80 transition"
                    @click="openReviewLightbox(review.images, i)" />
                </div>
                <!-- Helpful -->
                <button @click="markHelpful(review)" class="mt-3 text-xs text-[var(--color-text-muted)] hover:text-orange-500 flex items-center gap-1.5 transition">
                  <i class="fa-sharp fa-regular fa-thumbs-up"></i>
                  Helpful {{ review.helpful > 0 ? `(${review.helpful})` : '' }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>

  <!-- Review image lightbox -->
  <Teleport to="body">
    <Transition name="lb">
      <div v-if="reviewLightbox.open"
        class="fixed inset-0 z-[210] flex items-center justify-center bg-black/92 backdrop-blur-sm"
        @click.self="reviewLightbox.open = false">
        <button @click="reviewLightbox.open = false"
          class="absolute top-4 right-4 text-white/80 hover:text-white w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition z-10">
          <i class="fa-sharp fa-solid fa-xmark text-lg"></i>
        </button>
        <img v-if="reviewLightbox.images[reviewLightbox.index]"
          :src="reviewLightbox.images[reviewLightbox.index]"
          class="max-h-[85vh] max-w-[90vw] object-contain rounded-xl" />
        <button v-if="reviewLightbox.index > 0" @click="reviewLightbox.index--"
          class="absolute left-3 text-white/80 hover:text-white w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition z-10">
          <i class="fa-sharp fa-solid fa-chevron-left"></i>
        </button>
        <button v-if="reviewLightbox.index < reviewLightbox.images.length - 1" @click="reviewLightbox.index++"
          class="absolute right-3 text-white/80 hover:text-white w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition z-10">
          <i class="fa-sharp fa-solid fa-chevron-right"></i>
        </button>
      </div>
    </Transition>
  </Teleport>

  <Teleport to="body">
    <Transition name="lb">
      <div
        v-if="lightboxOpen"
        class="fixed inset-0 z-[200] flex items-center justify-center bg-black/92 backdrop-blur-sm"
        @click.self="lightboxOpen = false"
      >
        <button
          @click="lightboxOpen = false"
          class="absolute top-4 right-4 text-white/80 hover:text-white w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition z-10"
        >
          <i class="fa-sharp fa-solid fa-xmark text-lg"></i>
        </button>

        <div class="w-full max-w-3xl px-14" v-if="product">
          <Swiper
            :modules="lbModules"
            :navigation="{ prevEl: '.lb-prev', nextEl: '.lb-next' }"
            :pagination="{ clickable: true, dynamicBullets: true }"
            :initial-slide="activeIdx"
            :loop="true"
            :space-between="24"
            class="lb-swiper"
            @swiper="onLbSwiper"
          >
            <SwiperSlide
              v-for="(img, i) in product.images"
              :key="i"
              class="flex items-center justify-center"
            >
              <img
                :src="img"
                :alt="`${product.name} view ${i + 1}`"
                class="max-h-[80vh] max-w-full object-contain rounded-xl"
              />
            </SwiperSlide>
          </Swiper>
        </div>

        <button class="lb-prev absolute left-3 text-white/80 hover:text-white w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition z-10">
          <i class="fa-sharp fa-solid fa-chevron-left"></i>
        </button>
        <button class="lb-next absolute right-3 text-white/80 hover:text-white w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition z-10">
          <i class="fa-sharp fa-solid fa-chevron-right"></i>
        </button>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, reactive } from 'vue'
import { useRoute } from 'vue-router'
import { Swiper, SwiperSlide } from 'swiper/vue'
import { Navigation, Pagination, Thumbs, Autoplay } from 'swiper/modules'
import type { Swiper as SwiperType } from 'swiper'
import 'swiper/css'
import 'swiper/css/navigation'
import 'swiper/css/pagination'
import 'swiper/css/thumbs'
import 'swiper/css/autoplay'

import { useProductStore }  from '@/stores/useProductStore'
import { useCartStore }     from '@/stores/useCartStore'
import { useWishlistStore } from '@/stores/useWishlistStore'
import type { Product, Review } from '@/types'
import ProductCard          from '@/components/product/ProductCard.vue'

const route         = useRoute()
const productStore  = useProductStore()
const cartStore     = useCartStore()
const wishlistStore = useWishlistStore()

const loading = ref(true)
const product = ref<Product | null>(null)
const qty     = ref(1)
const added   = ref(false)

// ── Swiper instances ──────────────────────────────────────────
const mainModules  = [Navigation, Thumbs, Autoplay]
const thumbModules = [Thumbs]
const lbModules    = [Navigation, Pagination]

const mainSwiper   = ref<SwiperType | null>(null)
const thumbsSwiper = ref<SwiperType | null>(null)
const activeIdx    = ref(0)

function onMainSwiper(sw: SwiperType)   { mainSwiper.value   = sw }
function onThumbsSwiper(sw: SwiperType) { thumbsSwiper.value = sw }
function onLbSwiper(_sw: SwiperType)    { /* lightbox swiper ready */ }
function onSlideChange(sw: SwiperType)  { activeIdx.value = sw.realIndex }

// ── Lightbox ─────────────────────────────────────────────────
const lightboxOpen = ref(false)
function openLightbox() { lightboxOpen.value = true }
function onKeyDown(e: KeyboardEvent) {
  if (e.key === 'Escape') { lightboxOpen.value = false; reviewLightbox.open = false }
}

// ── Computed ──────────────────────────────────────────────────
const discountPct = computed(() => {
  if (!product.value?.salePrice) return 0
  return Math.round((1 - product.value.salePrice / product.value.price) * 100)
})

const related = computed(() => {
  if (!product.value) return []
  return productStore.products
    .filter(p => p.category === product.value!.category && p.id !== product.value!.id)
    .slice(0, 4)
})

function addToCart() {
  if (!product.value) return
  cartStore.add(product.value, qty.value)
  added.value = true
  setTimeout(() => { added.value = false }, 1500)
}

// ── Reviews (read-only display — submitted from account/orders) ───────────────
const reviews        = ref<Review[]>([])
const reviewsLoading = ref(false)

const reviewLightbox = reactive({ open: false, images: [] as string[], index: 0 })
function openReviewLightbox(imgs: string[], i: number) {
  reviewLightbox.images = imgs; reviewLightbox.index = i; reviewLightbox.open = true
}

const avgRating = computed(() => {
  if (!reviews.value.length) return '0.0'
  const avg = reviews.value.reduce((s, r) => s + r.rating, 0) / reviews.value.length
  return avg.toFixed(1)
})

function ratingCount(n: number) { return reviews.value.filter(r => r.rating === n).length }
function ratingBarPct(n: number) {
  if (!reviews.value.length) return 0
  return Math.round((ratingCount(n) / reviews.value.length) * 100)
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-BD', { year: 'numeric', month: 'short', day: 'numeric' })
}

async function loadReviews(slug: string) {
  reviewsLoading.value = true
  try {
    const res = await fetch(`/api/reviews/product/${slug}`, { cache: 'no-store' })
    if (res.ok) {
      const data = await res.json()
      // backend returns a plain array
      reviews.value = Array.isArray(data) ? data : (data.data ?? [])
    }
  } catch (e) {
    console.error('[Reviews] load failed:', e)
  } finally {
    reviewsLoading.value = false
  }
}

async function markHelpful(review: Review) {
  try {
    const res = await fetch(`/api/reviews/${review.id}/helpful`, { method: 'POST' })
    if (res.ok) {
      const data = await res.json()
      review.helpful = data.helpful
    }
  } catch {}
}

// ── Load ──────────────────────────────────────────────────────
async function load(slug: string) {
  product.value = null
  loading.value = true
  activeIdx.value = 0
  mainSwiper.value?.slideTo(0)
  reviews.value = []

  try {
    let found: Product | null | undefined = productStore.getBySlug(slug)
    if (!found) found = await productStore.fetchProductBySlug(slug)
    product.value = found ?? null
  } catch (e) {
    console.error('[ProductDetail] load failed:', e)
    product.value = null
  } finally {
    loading.value = false
  }

  if (productStore.products.length === 0) productStore.fetchProducts().catch(() => {})
  if (product.value) loadReviews(slug)
}

onMounted(() => {
  load(route.params.slug as string)
  window.addEventListener('keydown', onKeyDown)
})
onUnmounted(() => window.removeEventListener('keydown', onKeyDown))
watch(() => route.params.slug, (slug) => { if (slug) load(slug as string) })
</script>

<style scoped lang="scss">
/* ── Layout grid ─────────────────────────────────────────────────────────── */
.product-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem 3rem;
  align-items: start;
}
@media (max-width: 900px) {
  .product-grid { grid-template-columns: 1fr; gap: 1.5rem; }
}

/* ── Gallery column ──────────────────────────────────────────────────────── */
.gallery-col {
  /* Stick to top on desktop when info panel scrolls */
  position: sticky;
  top: 80px;
  display: flex;
  flex-direction: column;
  gap: 0;
  min-width: 0;           /* prevent overflow from breaking grid */
}
@media (max-width: 900px) {
  .gallery-col { position: static; }
}

/* Main image box: fixed square capped at 520px, never expands beyond container */
.main-image-wrap {
  width: 100%;
  max-width: 520px;
  aspect-ratio: 1 / 1;
  margin: 0 auto;
  border-radius: 16px;
  overflow: hidden;
}
@media (max-width: 480px) {
  .main-image-wrap { max-width: 100%; border-radius: 12px; }
}

/* Thumbs: fixed height squares */
.thumb-slide {
  aspect-ratio: 1 / 1;
  max-width: 72px;
}
@media (max-width: 480px) {
  .thumb-slide { max-width: 56px; }
}

/* ── Info column ─────────────────────────────────────────────────────────── */
.info-col {
  display: flex;
  flex-direction: column;
  gap: 1.1rem;
  min-width: 0;           /* critical: prevents text from blowing out the grid */
}

/* Title: clamp font size, allow wrapping */
.product-title {
  font-family: var(--font-display, inherit);
  font-weight: 800;
  font-size: clamp(1.35rem, 3vw, 1.85rem);
  line-height: 1.25;
  word-break: break-word;
  overflow-wrap: anywhere;
  hyphens: auto;
}

/* Price row */
.price-row {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 0.5rem 0.75rem;
}
.price-main {
  font-size: clamp(1.6rem, 5vw, 2.2rem);
  font-weight: 800;
  color: rgb(249 115 22);
  word-break: break-all;  /* ৳ signs and long numbers don't overflow */
}
.price-original {
  font-size: clamp(1rem, 3vw, 1.25rem);
  color: var(--color-text-muted);
  text-decoration: line-through;
}

/* ── Description (v-html) ────────────────────────────────────────────────── */
.product-description {
  color: var(--color-text-2, var(--color-text-muted));
  line-height: 1.75;
  /* The two most important rules for v-html text wrapping */
  overflow-wrap: anywhere;
  word-break: break-word;
  min-width: 0;
  max-width: 100%;
}
/* Rich text elements inside v-html */
.product-description :deep(*) {
  max-width: 100%;
  overflow-wrap: anywhere;
  word-break: break-word;
}
.product-description :deep(h2) { font-size: 1.1rem; font-weight: 700; margin: 12px 0 6px; }
.product-description :deep(h3) { font-size: 1rem;   font-weight: 600; margin: 10px 0 4px; }
.product-description :deep(p)  { margin: 0 0 8px; line-height: 1.7; }
.product-description :deep(strong) { font-weight: 700; }
.product-description :deep(em)     { font-style: italic; }
.product-description :deep(s)      { text-decoration: line-through; }
.product-description :deep(ul),
.product-description :deep(ol)     { padding-left: 1.25rem; margin: 6px 0 10px; }
.product-description :deep(ul)     { list-style: disc; }
.product-description :deep(ol)     { list-style: decimal; }
.product-description :deep(li)     { margin-bottom: 4px; line-height: 1.65; }
.product-description :deep(blockquote) {
  border-left: 3px solid rgb(249 115 22);
  padding-left: 12px; margin: 10px 0;
  color: var(--color-text-muted); font-style: italic;
}
.product-description :deep(pre) {
  background: var(--color-surface-2); border-radius: 8px;
  padding: 10px 14px; font-size: 12px;
  overflow-x: auto; white-space: pre-wrap; word-break: break-all;
  margin: 8px 0;
}
.product-description :deep(code) {
  background: var(--color-surface-2); border-radius: 4px;
  padding: 1px 5px; font-size: 12px; word-break: break-all;
}
.product-description :deep(a) {
  color: rgb(249 115 22); text-decoration: underline;
  word-break: break-all;
}
.product-description :deep(img) {
  max-width: 100%; height: auto; border-radius: 8px; margin: 8px 0;
}
.product-description :deep(table) {
  width: 100%; border-collapse: collapse; font-size: 13px; margin: 8px 0;
}
.product-description :deep(td),
.product-description :deep(th) {
  border: 1px solid var(--color-border); padding: 6px 10px;
  word-break: break-word;
}

/* ── Thumbs Swiper active highlight ──────────────────────────────────────── */
.thumbs-swiper :deep(.swiper-slide-thumb-active) {
  border-color: rgb(249 115 22) !important;
  opacity: 1 !important;
  box-shadow: 0 0 0 2px rgba(249, 115, 22, 0.35);
}

/* Hide default Swiper nav (we use custom buttons) */
:deep(.swiper-button-prev),
:deep(.swiper-button-next) { display: none; }

/* ── Lightbox ─────────────────────────────────────────────────────────────── */
.lb-swiper :deep(.swiper-pagination-bullet) {
  background: rgba(255,255,255,0.45); opacity: 1;
}
.lb-swiper :deep(.swiper-pagination-bullet-active) {
  background: #fff; transform: scale(1.3);
}
.lb-swiper :deep(.swiper-pagination) { bottom: -28px; }

.lb-enter-active, .lb-leave-active { transition: opacity 0.2s ease; }
.lb-enter-from, .lb-leave-to { opacity: 0; }

/* ── Reviews ─────────────────────────────────────────────────────────────── */
.review-avatar {
  width: 36px; height: 36px; border-radius: 10px; flex-shrink: 0;
  background: linear-gradient(135deg, #f97316, #c026d3);
  display: flex; align-items: center; justify-content: center;
  color: white; font-size: 14px; font-weight: 800;
}
.review-card {
  transition: box-shadow .2s;
  &:hover { box-shadow: 0 4px 16px rgba(0,0,0,.08); }
}
.review-notice {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 12px;
}

</style>
