<template>
  <!-- Backdrop -->
  <Transition name="backdrop">
    <div v-if="cartStore.isOpen" class="fixed inset-0 bg-black/50 z-[60] backdrop-blur-sm" @click="cartStore.isOpen = false"></div>
  </Transition>

  <!-- Drawer -->
  <Transition name="drawer">
    <div v-if="cartStore.isOpen" class="fixed right-0 top-0 h-full w-full max-w-md z-[70] flex flex-col shadow-2xl bg-[var(--color-bg)] border-l border-[var(--color-border)]">

      <!-- Header -->
      <div class="flex items-center justify-between px-5 py-4 border-b border-[var(--color-border)]">
        <div class="flex items-center gap-2">
          <i class="fa-sharp fa-solid fa-cart-shopping text-orange-500"></i>
          <h2 class="font-display font-bold text-lg">My Cart</h2>
          <span v-if="cartStore.totalItems > 0" class="badge badge-brand">{{ cartStore.totalItems }}</span>
        </div>
        <button @click="cartStore.isOpen = false" class="btn-icon w-8 h-8">
          <i class="fa-sharp fa-solid fa-xmark text-sm"></i>
        </button>
      </div>

      <!-- Empty state -->
      <div v-if="cartStore.items.length === 0" class="flex-1 flex flex-col items-center justify-center gap-4 px-8 text-center">
        <div class="w-20 h-20 rounded-3xl bg-orange-500/10 flex items-center justify-center">
          <i class="fa-sharp fa-light fa-cart-shopping text-3xl text-orange-500"></i>
        </div>
        <div>
          <p class="font-semibold text-lg mb-1">Your cart is empty</p>
          <p class="text-sm text-[var(--color-text-muted)]">Add items to start shopping</p>
        </div>
        <RouterLink to="/products" @click="cartStore.isOpen = false" class="btn-primary">
          <i class="fa-sharp fa-regular fa-arrow-right"></i> Browse Products
        </RouterLink>
      </div>

      <!-- Cart items -->
      <div v-else class="flex-1 overflow-y-auto px-5 py-4 space-y-4">
        <CartItem v-for="item in cartStore.items" :key="item.id" :item="item" />
      </div>

      <!-- Footer -->
      <div v-if="cartStore.items.length > 0" class="border-t border-[var(--color-border)] px-5 py-4 space-y-4 bg-[var(--color-surface)]">
        <!-- Savings row -->
        <div v-if="cartStore.savings > 0" class="flex items-center justify-between text-xs">
          <span class="text-[var(--color-text-muted)]">You save</span>
          <span class="text-green-500 font-semibold">৳{{ cartStore.savings.toLocaleString() }}</span>
        </div>

        <!-- Total -->
        <div class="flex items-center justify-between">
          <span class="font-semibold">Subtotal ({{ cartStore.totalItems }} items)</span>
          <div class="text-right">
            <p class="text-xs text-[var(--color-text-muted)] line-through" v-if="cartStore.savings > 0">৳{{ cartStore.totalPrice.toLocaleString() }}</p>
            <p class="text-xl font-bold gradient-text">৳{{ cartStore.saleTotal.toLocaleString() }}</p>
          </div>
        </div>

        <!-- Actions -->
        <div class="space-y-2">
          <RouterLink to="/checkout" @click="cartStore.isOpen = false" class="btn-primary w-full justify-center">
            <i class="fa-sharp fa-solid fa-lock text-xs"></i>
            Secure Checkout
          </RouterLink>
          <RouterLink to="/cart" @click="cartStore.isOpen = false" class="btn-secondary w-full justify-center">
            View Full Cart
          </RouterLink>
        </div>

        <!-- Payment icons -->
        <div class="flex items-center justify-center gap-2 text-[10px] text-[var(--color-text-muted)]">
          <i class="fa-sharp fa-solid fa-shield-check text-green-500"></i>
          Secured · bKash · Nagad · COD
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { useCartStore } from '@/stores/useCartStore'
import CartItem from './CartItem.vue'
const cartStore = useCartStore()
</script>

<style scoped>
.backdrop-enter-active, .backdrop-leave-active { transition: opacity 0.3s ease; }
.backdrop-enter-from, .backdrop-leave-to { opacity: 0; }

.drawer-enter-active, .drawer-leave-active { transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1); }
.drawer-enter-from, .drawer-leave-to { transform: translateX(100%); }
</style>
