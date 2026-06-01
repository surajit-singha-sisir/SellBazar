<template>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 py-8">
    <!-- Header -->
    <div class="relative overflow-hidden rounded-3xl bg-gradient-to-r from-orange-600 to-fuchsia-600 p-8 text-white mb-10">
      <div class="absolute inset-0 opacity-10" style="background-image: radial-gradient(circle, white 1px, transparent 1px); background-size: 20px 20px;"></div>
      <div class="relative z-10">
        <div class="inline-flex items-center gap-2 bg-white/20 rounded-full px-3 py-1.5 text-sm mb-3">
          <span class="w-2 h-2 bg-yellow-300 rounded-full animate-pulse"></span>
          Limited Time Offers
        </div>
        <h1 class="font-display text-4xl font-extrabold mb-2">🔥 Today's Deals</h1>
        <p class="text-white/80 text-lg">Flash sales, bundle offers &amp; exclusive discounts for Bangladesh</p>
        <div class="flex gap-3 mt-4">
          <div v-for="t in countdown" :key="t.label" class="bg-white/20 backdrop-blur-sm rounded-xl px-4 py-2 text-center min-w-[64px]">
            <p class="font-display font-extrabold text-2xl">{{ t.value }}</p>
            <p class="text-xs text-white/70">{{ t.label }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Deal categories -->
    <div class="flex gap-2 mb-8 overflow-x-auto pb-1 scrollbar-hide">
      <button
        v-for="tab in tabs" :key="tab"
        @click="activeTab = tab"
        class="shrink-0 px-4 py-2 rounded-full text-sm font-medium border transition"
        :class="activeTab === tab ? 'bg-orange-500 border-orange-500 text-white' : 'border-[var(--color-border)] text-[var(--color-text-2)] hover:border-orange-500/40'"
      >
        {{ tab }}
      </button>
    </div>

    <!-- Deal products -->
    <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
      <ProductCard v-for="p in dealProducts" :key="p.id" :product="p" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useProductStore } from '@/stores/useProductStore'
import ProductCard from '@/components/product/ProductCard.vue'

const productStore = useProductStore()
const activeTab = ref('All Deals')
const tabs = ['All Deals', 'Electronics', 'Fashion', 'Grocery', 'Beauty', 'Flash Sale']

const dealProducts = computed(() => {
  const list = productStore.products.filter(p => p.salePrice)
  if (activeTab.value === 'All Deals' || activeTab.value === 'Flash Sale') return list
  return list.filter(p => p.category === activeTab.value)
})

const countdown = ref([{ label:'Hours', value:'08' }, { label:'Mins', value:'45' }, { label:'Secs', value:'30' }])
let timer: ReturnType<typeof setInterval>
onMounted(() => {
  productStore.fetchProducts()
  let h = 8, m = 45, s = 30
  timer = setInterval(() => {
    s--
    if (s < 0) { s = 59; m-- }
    if (m < 0) { m = 59; h-- }
    if (h < 0) { h = 23 }
    countdown.value = [
      { label:'Hours', value: String(h).padStart(2,'0') },
      { label:'Mins',  value: String(m).padStart(2,'0') },
      { label:'Secs',  value: String(s).padStart(2,'0') },
    ]
  }, 1000)
})
onUnmounted(() => clearInterval(timer))
</script>
