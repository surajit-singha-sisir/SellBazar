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
    <template v-else>
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

      <div class="grid lg:grid-cols-2 gap-8 lg:gap-12">

        <!-- Image Gallery -->
        <div class="space-y-3">

          <!-- Main Swiper -->
          <div class="card overflow-hidden aspect-square bg-[var(--color-surface-2)] relative">
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
                  class="w-full h-full object-cover"
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
            :slides-per-view="product.images.length"
            :space-between="8"
            class="thumbs-swiper w-full"
            @swiper="onThumbsSwiper"
          >
            <SwiperSlide
              v-for="(img, i) in product.images"
              :key="i"
              class="!aspect-square rounded-xl overflow-hidden border-2 cursor-pointer transition-all duration-200"
              :class="i === activeIdx
                ? 'border-orange-500 shadow-[0_0_0_2px_rgba(249,115,22,0.3)]'
                : 'border-[var(--color-border)] opacity-60 hover:opacity-100 hover:border-orange-300'"
            >
              <img :src="img" :alt="`thumb ${i + 1}`" class="w-full h-full object-cover" draggable="false" />
            </SwiperSlide>
          </Swiper>

          <!-- Hint -->
          <p class="text-center text-xs text-[var(--color-text-muted)]">
            <i class="fa-sharp fa-regular fa-hand-pointer mr-1 text-orange-400"></i>
            Click image to enlarge · Auto-slides every 3s
          </p>
        </div>

        <!-- Product Info -->
        <div class="space-y-5">
          <div class="flex flex-wrap gap-2">
            <span class="badge badge-brand">{{ product.brand }}</span>
            <span v-if="product.isNew"      class="badge badge-green">New Arrival</span>
            <span v-if="product.isFeatured" class="badge badge-purple">Top Pick</span>
          </div>

          <h1 class="font-display font-extrabold text-3xl leading-tight">{{ product.name }}</h1>
          <p class="text-[var(--color-text-muted)] font-bangla text-lg">{{ product.nameBn }}</p>

          <div class="flex items-center gap-3">
            <div class="stars">
              <i v-for="n in 5" :key="n"
                :class="n <= Math.round(product.rating) ? 'fa-sharp fa-solid fa-star' : 'fa-sharp fa-regular fa-star'"
                class="text-sm"></i>
            </div>
            <span class="font-semibold">{{ product.rating }}</span>
            <span class="text-[var(--color-text-muted)] text-sm">({{ product.reviewCount.toLocaleString() }} reviews)</span>
          </div>

          <div class="flex items-baseline gap-3">
            <span class="text-4xl font-extrabold text-orange-500">৳{{ (product.salePrice ?? product.price).toLocaleString() }}</span>
            <span v-if="product.salePrice" class="text-xl text-[var(--color-text-muted)] line-through">৳{{ product.price.toLocaleString() }}</span>
            <span v-if="product.salePrice" class="badge badge-red text-sm">{{ discountPct }}% OFF</span>
          </div>

          <p class="text-[var(--color-text-2)] leading-relaxed">{{ product.description }}</p>

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

      <!-- Related products -->
      <div class="mt-16">
        <h2 class="font-display font-bold text-2xl mb-6">Related Products</h2>
        <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          <ProductCard v-for="p in related" :key="p.id" :product="p" />
        </div>
      </div>
    </template>
  </div>

  <!-- Lightbox -->
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
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
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
import ProductCard          from '@/components/product/ProductCard.vue'

const route         = useRoute()
const productStore  = useProductStore()
const cartStore     = useCartStore()
const wishlistStore = useWishlistStore()

const loading = ref(true)
const qty     = ref(1)
const added   = ref(false)

// ── Swiper instances ──────────────────────────────────────────
const mainModules  = [Navigation, Thumbs, Autoplay]
const thumbModules = [Thumbs]
const lbModules    = [Navigation, Pagination]

const mainSwiper   = ref<SwiperType | null>(null)
const thumbsSwiper = ref<SwiperType | null>(null)

const activeIdx = ref(0)

function onMainSwiper(sw: SwiperType)   { mainSwiper.value   = sw }
function onThumbsSwiper(sw: SwiperType) { thumbsSwiper.value = sw }
function onLbSwiper(_sw: SwiperType)    { /* lightbox swiper ready */ }

function onSlideChange(sw: SwiperType) {
  activeIdx.value = sw.realIndex
}

// ── Lightbox ─────────────────────────────────────────────────
const lightboxOpen = ref(false)

function openLightbox() { lightboxOpen.value = true }

function onKeyDown(e: KeyboardEvent) {
  if (e.key === 'Escape') lightboxOpen.value = false
}

// ── Product ───────────────────────────────────────────────────
const product = computed(() => productStore.getBySlug(route.params.slug as string))

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

watch(() => product.value, () => {
  activeIdx.value = 0
  mainSwiper.value?.slideTo(0)
})

function addToCart() {
  if (!product.value) return
  cartStore.add(product.value, qty.value)
  added.value = true
  setTimeout(() => { added.value = false }, 1500)
}

async function load() {
  loading.value = true
  await productStore.fetchProducts()
  loading.value = false
}

onMounted(() => {
  load()
  window.addEventListener('keydown', onKeyDown)
})
onUnmounted(() => window.removeEventListener('keydown', onKeyDown))
watch(() => route.params.slug, load)
</script>

<style scoped lang="scss">
/* Thumbs: active slide highlight */
.thumbs-swiper :deep(.swiper-slide-thumb-active) {
  border-color: rgb(249 115 22) !important;
  opacity: 1 !important;
  box-shadow: 0 0 0 2px rgba(249, 115, 22, 0.35);
}

/* Override Swiper nav button colours inside main swiper */
:deep(.swiper-button-prev),
:deep(.swiper-button-next) {
  display: none; /* we use custom buttons */
}

/* Lightbox pagination dots */
.lb-swiper :deep(.swiper-pagination-bullet) {
  background: rgba(255, 255, 255, 0.45);
  opacity: 1;
}
.lb-swiper :deep(.swiper-pagination-bullet-active) {
  background: #ffffff;
  transform: scale(1.3);
}
.lb-swiper :deep(.swiper-pagination) {
  bottom: -28px;
}

/* Lightbox fade transition */
.lb-enter-active,
.lb-leave-active { transition: opacity 0.2s ease; }
.lb-enter-from,
.lb-leave-to     { opacity: 0; }
</style>
