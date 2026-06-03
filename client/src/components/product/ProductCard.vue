<template>
  <div class="card group relative flex flex-col h-full hover:shadow-[var(--shadow-lg)] hover:-translate-y-1 transition-all duration-300 cursor-pointer">
    <!-- Badges -->
    <div class="absolute top-3 left-3 z-10 flex flex-col gap-1.5">
      <span v-if="product.isNew" class="badge badge-brand text-[10px] uppercase tracking-wide">New</span>
      <span v-if="discountPct" class="badge badge-red text-[10px]">-{{ discountPct }}%</span>
      <span v-if="product.isFeatured && !product.isNew" class="badge badge-purple text-[10px]">Top Pick</span>
    </div>

    <!-- Wishlist -->
    <button
      @click.prevent="wishlistStore.toggle(product.id)"
      class="absolute top-3 right-3 z-10 w-8 h-8 rounded-full flex items-center justify-center
             bg-[var(--color-bg)]/80 backdrop-blur-sm border border-[var(--color-border)]
             hover:bg-pink-50 hover:border-pink-200 hover:text-pink-500 transition"
      :class="wishlistStore.has(product.id) ? 'text-pink-500 bg-pink-50 border-pink-200' : 'text-[var(--color-text-muted)]'"
    >
      <i :class="wishlistStore.has(product.id) ? 'fa-sharp fa-solid fa-heart' : 'fa-sharp fa-regular fa-heart'" class="text-xs"></i>
    </button>

    <!-- Image with auto carousel on hover -->
    <RouterLink :to="`/products/${product.slug}`" class="block aspect-square bg-[var(--color-surface-2)] overflow-hidden relative"
      @mouseenter="startCarousel"
      @mouseleave="stopCarousel"
    >
      <img
        :src="product.images?.[currentImageIdx] || 'https://placehold.co/400x400/f97316/fff?text=?'"
        :alt="product.name"
        class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        loading="lazy"
      />
      <!-- Image dots indicator (only if multiple images) -->
      <div v-if="(product.images?.length ?? 0) > 1" class="absolute bottom-2 left-0 right-0 flex justify-center gap-1 z-10">
        <span
          v-for="(_, i) in product.images"
          :key="i"
          class="block rounded-full transition-all duration-300"
          :class="i === currentImageIdx
            ? 'w-3.5 h-1.5 bg-white'
            : 'w-1.5 h-1.5 bg-white/50'"
        ></span>
      </div>
    </RouterLink>

    <!-- Info -->
    <div class="p-4 flex flex-col flex-1 gap-2">
      <RouterLink :to="`/products/${product.slug}`">
        <h3 class="text-sm font-semibold leading-snug line-clamp-2 hover:text-orange-500 transition group-hover:text-orange-500">{{ product.name }}</h3>
      </RouterLink>

      <!-- Rating -->
      <div class="flex items-center gap-1.5">
        <div class="stars text-xs">
          <i v-for="n in 5" :key="n" :class="n <= Math.round(product.rating) ? 'fa-sharp fa-solid fa-star' : 'fa-sharp fa-regular fa-star'"></i>
        </div>
        <span class="text-[11px] text-[var(--color-text-muted)]">({{ (product.reviewCount ?? 0).toLocaleString() }})</span>
      </div>

      <!-- Price -->
      <div class="flex items-baseline gap-2 mt-auto">
        <span class="text-lg font-bold text-orange-500">৳{{ ((product.salePrice ?? product.price) || 0).toLocaleString() }}</span>
        <span v-if="product.salePrice" class="price-original">৳{{ (product.price || 0).toLocaleString() }}</span>
      </div>

      <!-- Delivery -->
      <div class="flex items-center gap-1.5 text-[11px] text-[var(--color-text-muted)]">
        <i class="fa-sharp fa-regular fa-truck-fast text-green-500"></i>
        <span class="text-green-600 font-medium">{{ product.deliveryDays === 1 ? 'Same Day' : `${product.deliveryDays ?? '?'}-day` }} delivery</span>
        <span>· {{ product.location }}</span>
      </div>

      <!-- Add to cart -->
      <button
        @click="handleAddToCart"
        class="mt-1 w-full py-2 rounded-xl text-xs font-semibold border border-orange-500/40 text-orange-600
               bg-orange-500/5 hover:bg-orange-500 hover:text-white hover:border-orange-500 transition-all duration-200
               flex items-center justify-center gap-2"
        :class="{ 'scale-95': adding }"
      >
        <i class="fa-sharp fa-regular fa-cart-plus"></i>
        {{ adding ? 'Added!' : 'Add to Cart' }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onUnmounted } from 'vue'
import type { Product } from '@/types'
import { useCartStore } from '@/stores/useCartStore'
import { useWishlistStore } from '@/stores/useWishlistStore'

const props = defineProps<{ product: Product }>()
const cartStore = useCartStore()
const wishlistStore = useWishlistStore()
const adding = ref(false)

const currentImageIdx = ref(0)
let carouselTimer: ReturnType<typeof setInterval> | null = null

function startCarousel() {
  if ((props.product.images?.length ?? 0) <= 1) return
  currentImageIdx.value = 0
  carouselTimer = setInterval(() => {
    currentImageIdx.value = (currentImageIdx.value + 1) % props.product.images.length
  }, 900)
}

function stopCarousel() {
  if (carouselTimer) { clearInterval(carouselTimer); carouselTimer = null }
  currentImageIdx.value = 0
}

onUnmounted(() => stopCarousel())

const discountPct = computed(() => {
  if (!props.product.salePrice) return 0
  return Math.round((1 - props.product.salePrice / props.product.price) * 100)
})

function handleAddToCart() {
  cartStore.add(props.product)
  adding.value = true
  setTimeout(() => { adding.value = false }, 1200)
}
</script>
