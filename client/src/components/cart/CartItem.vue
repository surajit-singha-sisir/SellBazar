<template>
  <div class="flex gap-3 py-2">
    <img :src="item.images[0]" :alt="item.name" class="w-16 h-16 rounded-xl object-cover bg-[var(--color-surface-2)] shrink-0" />
    <div class="flex-1 min-w-0">
      <p class="text-sm font-medium line-clamp-2 leading-tight">{{ item.name }}</p>
      <div class="flex items-center gap-2 mt-1">
        <span class="text-orange-500 font-bold text-sm">৳{{ (item.salePrice ?? item.price).toLocaleString() }}</span>
        <span v-if="item.salePrice" class="text-[var(--color-text-muted)] line-through text-xs">৳{{ item.price.toLocaleString() }}</span>
      </div>
      <div class="flex items-center justify-between mt-2">
        <div class="flex items-center gap-1 border border-[var(--color-border)] rounded-lg overflow-hidden">
          <button @click="cartStore.updateQty(item.id, item.quantity - 1)" class="w-7 h-7 flex items-center justify-center hover:bg-[var(--color-surface-2)] transition text-xs">
            <i class="fa-sharp fa-solid fa-minus"></i>
          </button>
          <span class="w-8 text-center text-sm font-semibold">{{ item.quantity }}</span>
          <button @click="cartStore.updateQty(item.id, item.quantity + 1)" class="w-7 h-7 flex items-center justify-center hover:bg-[var(--color-surface-2)] transition text-xs">
            <i class="fa-sharp fa-solid fa-plus"></i>
          </button>
        </div>
        <button @click="cartStore.remove(item.id)" class="text-red-400 hover:text-red-500 transition p-1">
          <i class="fa-sharp fa-regular fa-trash-can text-sm"></i>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { CartItem } from '@/types'
import { useCartStore } from '@/stores/useCartStore'
defineProps<{ item: CartItem }>()
const cartStore = useCartStore()
</script>
