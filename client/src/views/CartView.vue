<template>
  <div class="max-w-6xl mx-auto px-4 sm:px-6 py-8">
    <h1 class="font-display font-bold text-2xl mb-6 flex items-center gap-2">
      <i class="fa-sharp fa-regular fa-cart-shopping text-orange-500"></i>
      My Cart
      <span v-if="cartStore.totalItems > 0" class="badge badge-brand">{{ cartStore.totalItems }}</span>
    </h1>

    <!-- Empty -->
    <div v-if="cartStore.items.length === 0" class="text-center py-24">
      <div class="w-24 h-24 rounded-3xl bg-orange-500/10 flex items-center justify-center mx-auto mb-4">
        <i class="fa-sharp fa-light fa-cart-shopping text-4xl text-orange-500"></i>
      </div>
      <h2 class="font-display font-bold text-2xl">Your cart is empty</h2>
      <p class="text-[var(--color-text-muted)] mt-2">Browse products and add items to your cart</p>
      <RouterLink to="/products" class="btn-primary mt-6 inline-flex">Browse Products</RouterLink>
    </div>

    <div v-else class="flex flex-col lg:flex-row gap-8">
      <!-- Items -->
      <div class="flex-1 space-y-3">
        <div v-for="item in cartStore.items" :key="item.id" class="card p-4 flex gap-4 hover:shadow-md transition">
          <img :src="item.images[0]" :alt="item.name" class="w-20 h-20 rounded-xl object-cover bg-[var(--color-surface-2)] shrink-0" />
          <div class="flex-1 min-w-0">
            <RouterLink :to="`/products/${item.slug}`" class="font-semibold text-sm hover:text-orange-500 transition line-clamp-2">{{ item.name }}</RouterLink>
            <div class="flex items-center gap-2 mt-1">
              <span class="text-orange-500 font-bold">৳{{ (item.salePrice ?? item.price).toLocaleString() }}</span>
              <span v-if="item.salePrice" class="price-original text-xs">৳{{ item.price.toLocaleString() }}</span>
            </div>
            <div class="flex items-center justify-between mt-3">
              <div class="flex items-center border border-[var(--color-border)] rounded-lg overflow-hidden">
                <button @click="cartStore.updateQty(item.id, item.quantity - 1)" class="w-8 h-8 flex items-center justify-center hover:bg-[var(--color-surface-2)] transition">
                  <i class="fa-sharp fa-solid fa-minus text-xs"></i>
                </button>
                <span class="w-10 text-center text-sm font-bold">{{ item.quantity }}</span>
                <button @click="cartStore.updateQty(item.id, item.quantity + 1)" class="w-8 h-8 flex items-center justify-center hover:bg-[var(--color-surface-2)] transition">
                  <i class="fa-sharp fa-solid fa-plus text-xs"></i>
                </button>
              </div>
              <div class="flex items-center gap-2">
                <span class="font-bold text-sm">৳{{ ((item.salePrice ?? item.price) * item.quantity).toLocaleString() }}</span>
                <button @click="cartStore.remove(item.id)" class="text-red-400 hover:text-red-500 transition p-1 ml-2">
                  <i class="fa-sharp fa-regular fa-trash-can text-sm"></i>
                </button>
              </div>
            </div>
          </div>
        </div>

        <div class="flex justify-between items-center pt-2">
          <button @click="cartStore.clear()" class="btn-ghost text-red-500 hover:bg-red-50 text-sm">
            <i class="fa-sharp fa-regular fa-trash-can"></i> Clear Cart
          </button>
          <RouterLink to="/products" class="btn-ghost text-sm">
            <i class="fa-sharp fa-regular fa-arrow-left"></i> Continue Shopping
          </RouterLink>
        </div>
      </div>

      <!-- Summary -->
      <div class="lg:w-80 shrink-0">
        <div class="card p-5 sticky top-24 space-y-4">
          <h2 class="font-display font-bold text-lg">Order Summary</h2>
          <div class="space-y-2 text-sm">
            <div class="flex justify-between">
              <span class="text-[var(--color-text-muted)]">Subtotal ({{ cartStore.totalItems }} items)</span>
              <span>৳{{ cartStore.totalPrice.toLocaleString() }}</span>
            </div>
            <div v-if="cartStore.savings > 0" class="flex justify-between text-green-600">
              <span>Discount</span>
              <span>-৳{{ cartStore.savings.toLocaleString() }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-[var(--color-text-muted)]">Delivery</span>
              <span class="text-green-600 font-medium">FREE</span>
            </div>
          </div>
          <div class="divider"></div>
          <div class="flex justify-between font-bold text-lg">
            <span>Total</span>
            <span class="gradient-text">৳{{ cartStore.saleTotal.toLocaleString() }}</span>
          </div>
          <RouterLink to="/checkout" class="btn-primary w-full justify-center py-3.5">
            <i class="fa-sharp fa-solid fa-lock text-xs"></i> Proceed to Checkout
          </RouterLink>
          <div class="text-center text-xs text-[var(--color-text-muted)]">
            <i class="fa-sharp fa-solid fa-shield-check text-green-500 mr-1"></i>
            Safe & secure payment
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useCartStore } from '@/stores/useCartStore'
const cartStore = useCartStore()
</script>
