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
        <!-- Image -->
        <div class="space-y-3">
          <div class="card overflow-hidden aspect-square bg-[var(--color-surface-2)]">
            <img :src="product.images[0]" :alt="product.name" class="w-full h-full object-cover" />
          </div>
        </div>

        <!-- Info -->
        <div class="space-y-5">
          <!-- Brand + badges -->
          <div class="flex flex-wrap gap-2">
            <span class="badge badge-brand">{{ product.brand }}</span>
            <span v-if="product.isNew"      class="badge badge-green">New Arrival</span>
            <span v-if="product.isFeatured" class="badge badge-purple">Top Pick</span>
          </div>

          <h1 class="font-display font-extrabold text-3xl leading-tight">{{ product.name }}</h1>
          <p class="text-[var(--color-text-muted)] font-bangla text-lg">{{ product.nameBn }}</p>

          <!-- Rating -->
          <div class="flex items-center gap-3">
            <div class="stars">
              <i v-for="n in 5" :key="n" :class="n <= Math.round(product.rating) ? 'fa-sharp fa-solid fa-star' : 'fa-sharp fa-regular fa-star'" class="text-sm"></i>
            </div>
            <span class="font-semibold">{{ product.rating }}</span>
            <span class="text-[var(--color-text-muted)] text-sm">({{ product.reviewCount.toLocaleString() }} reviews)</span>
          </div>

          <!-- Price -->
          <div class="flex items-baseline gap-3">
            <span class="text-4xl font-extrabold text-orange-500">৳{{ (product.salePrice ?? product.price).toLocaleString() }}</span>
            <span v-if="product.salePrice" class="text-xl text-[var(--color-text-muted)] line-through">৳{{ product.price.toLocaleString() }}</span>
            <span v-if="product.salePrice" class="badge badge-red text-sm">{{ discountPct }}% OFF</span>
          </div>

          <!-- Description -->
          <p class="text-[var(--color-text-2)] leading-relaxed">{{ product.description }}</p>

          <!-- Stock + delivery -->
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

          <!-- Quantity + Cart -->
          <div class="flex items-center gap-3">
            <div class="flex items-center border border-[var(--color-border)] rounded-xl overflow-hidden">
              <button @click="qty = Math.max(1, qty - 1)" class="w-10 h-12 flex items-center justify-center hover:bg-[var(--color-surface-2)] transition">
                <i class="fa-sharp fa-solid fa-minus text-xs"></i>
              </button>
              <span class="w-12 text-center font-bold">{{ qty }}</span>
              <button @click="qty++" class="w-10 h-12 flex items-center justify-center hover:bg-[var(--color-surface-2)] transition">
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

          <!-- Tags -->
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
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useProductStore } from '@/stores/useProductStore'
import { useCartStore } from '@/stores/useCartStore'
import { useWishlistStore } from '@/stores/useWishlistStore'
import ProductCard from '@/components/product/ProductCard.vue'

const route = useRoute()
const productStore = useProductStore()
const cartStore = useCartStore()
const wishlistStore = useWishlistStore()

const loading = ref(true)
const qty = ref(1)
const added = ref(false)

const product = computed(() => productStore.getBySlug(route.params.slug as string))
const discountPct = computed(() => {
  if (!product.value?.salePrice) return 0
  return Math.round((1 - product.value.salePrice / product.value.price) * 100)
})
const related = computed(() => {
  if (!product.value) return []
  return productStore.products.filter(p => p.category === product.value!.category && p.id !== product.value!.id).slice(0, 4)
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

onMounted(load)
watch(() => route.params.slug, load)
</script>
