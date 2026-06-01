<template>
  <div class="max-w-5xl mx-auto px-4 sm:px-6 py-8">
    <h1 class="font-display font-bold text-2xl mb-6 flex items-center gap-2">
      <i class="fa-sharp fa-regular fa-heart text-pink-500"></i>
      My Wishlist
      <span v-if="wishlistProducts.length" class="badge badge-brand">{{ wishlistProducts.length }}</span>
    </h1>

    <div v-if="wishlistProducts.length === 0" class="text-center py-20">
      <div class="w-20 h-20 rounded-3xl bg-pink-500/10 flex items-center justify-center mx-auto mb-4">
        <i class="fa-sharp fa-regular fa-heart text-3xl text-pink-500"></i>
      </div>
      <h2 class="font-display font-bold text-xl">Your wishlist is empty</h2>
      <p class="text-[var(--color-text-muted)] text-sm mt-2">Heart items while browsing to save them here</p>
      <RouterLink to="/products" class="btn-primary mt-6 inline-flex">Explore Products</RouterLink>
    </div>

    <div v-else class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
      <ProductCard v-for="p in wishlistProducts" :key="p.id" :product="p" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useWishlistStore } from '@/stores/useWishlistStore'
import { useProductStore } from '@/stores/useProductStore'
import ProductCard from '@/components/product/ProductCard.vue'

const wishlistStore = useWishlistStore()
const productStore  = useProductStore()

const wishlistProducts = computed(() =>
  productStore.products.filter(p => wishlistStore.has(p.id))
)

onMounted(() => productStore.fetchProducts())
</script>
