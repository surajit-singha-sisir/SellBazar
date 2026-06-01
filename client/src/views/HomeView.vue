<template>
  <div class="bg-mesh min-h-screen">
    <!-- Hero Section -->
    <section class="relative overflow-hidden py-12 px-4 sm:px-6 max-w-7xl mx-auto">
      <div class="grid lg:grid-cols-2 gap-8 items-center">
        <!-- Hero text -->
        <div class="space-y-6">
          <div class="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-orange-500/30 bg-orange-500/5 text-sm font-medium text-orange-600">
            <span class="w-2 h-2 rounded-full bg-orange-500 animate-pulse"></span>
            বাংলাদেশের সেরা মার্কেটপ্লেস · 2027
          </div>
          <h1 class="font-display text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-tight">
            <span class="gradient-text">Shop Smart,</span><br/>
            <span class="text-[var(--color-text)]">Deliver Fast</span>
          </h1>
          <p class="text-[var(--color-text-2)] text-lg max-w-md leading-relaxed">
            From Dhaka to every district — millions of products, instant bKash checkout, and same-day delivery across Bangladesh.
          </p>
          <div class="flex flex-wrap gap-3">
            <RouterLink to="/products" class="btn-primary text-base px-8 py-3.5">
              <i class="fa-sharp fa-solid fa-bolt"></i> Shop Now
            </RouterLink>
            <RouterLink to="/deals" class="btn-secondary text-base px-8 py-3.5">
              🔥 Today's Deals
            </RouterLink>
          </div>
          <!-- Trust badges -->
          <div class="flex flex-wrap gap-4 pt-2">
            <div class="flex items-center gap-2 text-sm text-[var(--color-text-muted)]">
              <i class="fa-sharp fa-solid fa-shield-check text-green-500"></i> Secure Payment
            </div>
            <div class="flex items-center gap-2 text-sm text-[var(--color-text-muted)]">
              <i class="fa-sharp fa-solid fa-truck-fast text-blue-500"></i> Fast Delivery
            </div>
            <div class="flex items-center gap-2 text-sm text-[var(--color-text-muted)]">
              <i class="fa-sharp fa-solid fa-rotate-left text-orange-500"></i> Easy Returns
            </div>
          </div>
        </div>

        <!-- Hero visual -->
        <div class="relative hidden lg:flex items-center justify-center">
          <div class="relative w-96 h-96">
            <div class="absolute inset-0 rounded-full bg-gradient-to-br from-orange-500/20 to-fuchsia-500/20 blur-3xl"></div>
            <div class="relative grid grid-cols-2 gap-4 p-6">
              <div v-for="p in productStore.featured.slice(0,4)" :key="p.id"
                class="card hover:shadow-lg transition-all duration-300 hover:-translate-y-1 overflow-hidden cursor-pointer"
                @click="$router.push(`/products/${p.slug}`)"
              >
                <img :src="p.images[0]" :alt="p.name" class="w-full h-24 object-cover" />
                <div class="p-2">
                  <p class="text-[10px] font-semibold line-clamp-1">{{ p.name }}</p>
                  <p class="text-orange-500 font-bold text-xs">৳{{ (p.salePrice ?? p.price).toLocaleString() }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Stats Bar -->
    <section class="border-y border-[var(--color-border)] bg-[var(--color-surface)] py-4 px-4">
      <div class="max-w-7xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div v-for="stat in stats" :key="stat.label" class="flex items-center gap-3 justify-center">
          <div class="w-10 h-10 rounded-xl flex items-center justify-center" :style="`background: ${stat.color}15`">
            <i :class="stat.icon" :style="`color: ${stat.color}`"></i>
          </div>
          <div>
            <p class="font-display font-bold text-lg leading-none">{{ stat.value }}</p>
            <p class="text-xs text-[var(--color-text-muted)]">{{ stat.label }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- Categories -->
    <section class="max-w-7xl mx-auto px-4 sm:px-6 py-12">
      <div class="flex items-center justify-between mb-6">
        <h2 class="font-display text-2xl font-bold">Browse Categories</h2>
        <RouterLink to="/products" class="btn-ghost text-sm">See all <i class="fa-sharp fa-regular fa-arrow-right"></i></RouterLink>
      </div>
      <div class="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        <RouterLink
          v-for="cat in categories" :key="cat.id"
          :to="`/products?cat=${cat.name}`"
          class="card flex flex-col items-center gap-2 py-4 px-2 hover:shadow-md hover:-translate-y-1 transition-all duration-200 text-center group"
        >
          <div class="w-12 h-12 rounded-2xl flex items-center justify-center text-xl transition-transform group-hover:scale-110" :style="`background: ${cat.color}18`">
            {{ cat.icon }}
          </div>
          <span class="text-xs font-medium leading-tight text-[var(--color-text-2)] group-hover:text-[var(--color-text)]">{{ cat.name }}</span>
          <span class="text-[10px] text-[var(--color-text-muted)]">{{ cat.count }}+</span>
        </RouterLink>
      </div>
    </section>

    <!-- Featured Products -->
    <section class="max-w-7xl mx-auto px-4 sm:px-6 pb-12">
      <div class="flex items-center justify-between mb-6">
        <div>
          <h2 class="font-display text-2xl font-bold">Featured Products</h2>
          <p class="text-sm text-[var(--color-text-muted)] mt-1">Handpicked by our editors</p>
        </div>
        <RouterLink to="/products" class="btn-ghost text-sm">View all <i class="fa-sharp fa-regular fa-arrow-right"></i></RouterLink>
      </div>
      <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        <ProductCard v-for="p in productStore.featured" :key="p.id" :product="p" />
      </div>
    </section>

    <!-- Deals Banner -->
    <section class="max-w-7xl mx-auto px-4 sm:px-6 pb-12">
      <div class="relative overflow-hidden rounded-3xl bg-gradient-to-r from-orange-600 via-orange-500 to-fuchsia-600 p-8 sm:p-12 text-white">
        <div class="absolute inset-0 opacity-10" style="background-image: radial-gradient(circle, white 1px, transparent 1px); background-size: 30px 30px;"></div>
        <div class="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div>
            <span class="text-4xl">🎉</span>
            <h2 class="font-display text-3xl font-extrabold mt-2">Eid Special Sale!</h2>
            <p class="text-white/80 mt-1 text-lg">Up to 70% off — Limited time offer</p>
            <div class="flex gap-3 mt-4 text-center">
              <div v-for="t in countdown" :key="t.label" class="bg-white/20 rounded-xl px-4 py-2 min-w-[60px]">
                <p class="font-display font-extrabold text-2xl">{{ t.value }}</p>
                <p class="text-xs text-white/70">{{ t.label }}</p>
              </div>
            </div>
          </div>
          <RouterLink to="/deals" class="shrink-0 bg-white text-orange-600 font-bold py-3 px-8 rounded-2xl hover:bg-orange-50 transition shadow-xl text-base">
            Shop Deals →
          </RouterLink>
        </div>
      </div>
    </section>

    <!-- New Arrivals -->
    <section class="max-w-7xl mx-auto px-4 sm:px-6 pb-12">
      <div class="flex items-center justify-between mb-6">
        <div>
          <h2 class="font-display text-2xl font-bold">New Arrivals</h2>
          <p class="text-sm text-[var(--color-text-muted)] mt-1">Fresh drops this week</p>
        </div>
        <RouterLink to="/products?filter=new" class="btn-ghost text-sm">See all <i class="fa-sharp fa-regular fa-arrow-right"></i></RouterLink>
      </div>
      <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        <ProductCard v-for="p in productStore.newArr" :key="p.id" :product="p" />
      </div>
    </section>

    <!-- Payment methods -->
    <section class="max-w-7xl mx-auto px-4 sm:px-6 pb-16">
      <div class="card p-8 text-center">
        <h3 class="font-display font-bold text-xl mb-2">Secure & Easy Payments</h3>
        <p class="text-[var(--color-text-muted)] text-sm mb-6">Pay the way you prefer — trusted by millions of Bangladeshis</p>
        <div class="flex flex-wrap justify-center gap-3">
          <div v-for="pm in paymentMethods" :key="pm.name" class="payment-badge hover:shadow-md transition">
            <span>{{ pm.icon }}</span>
            <span class="font-medium">{{ pm.name }}</span>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useProductStore } from '@/stores/useProductStore'
import ProductCard from '@/components/product/ProductCard.vue'

const productStore = useProductStore()
onMounted(() => productStore.fetchProducts())

const stats = [
  { label: 'Products', value: '2M+', icon: 'fa-sharp fa-solid fa-boxes-stacked', color: '#f97316' },
  { label: 'Sellers', value: '50K+', icon: 'fa-sharp fa-solid fa-store', color: '#d946ef' },
  { label: 'Deliveries', value: '10M+', icon: 'fa-sharp fa-solid fa-truck-fast', color: '#3b82f6' },
  { label: 'Happy Users', value: '5M+', icon: 'fa-sharp fa-solid fa-face-smile', color: '#22c55e' },
]

const categories = [
  { id:'1', name:'Electronics', icon:'📱', color:'#3b82f6', count:45000 },
  { id:'2', name:'Fashion',     icon:'👗', color:'#ec4899', count:80000 },
  { id:'3', name:'Grocery',     icon:'🛒', color:'#22c55e', count:12000 },
  { id:'4', name:'Beauty',      icon:'💄', color:'#a78bfa', count:8000 },
  { id:'5', name:'Home',        icon:'🏠', color:'#f97316', count:25000 },
  { id:'6', name:'Sports',      icon:'⚽', color:'#0ea5e9', count:15000 },
  { id:'7', name:'Business',    icon:'💼', color:'#8b5cf6', count:5000 },
  { id:'8', name:'Books',       icon:'📚', color:'#fbbf24', count:30000 },
]

const paymentMethods = [
  { name:'bKash',  icon:'📱' },
  { name:'Nagad',  icon:'💳' },
  { name:'Rocket', icon:'🚀' },
  { name:'VISA',   icon:'💵' },
  { name:'Mastercard', icon:'🔵' },
  { name:'Cash on Delivery', icon:'💰' },
  { name:'Upay',   icon:'🏦' },
]

// Countdown timer
const countdown = ref([
  { label: 'Hours', value: '08' },
  { label: 'Mins',  value: '45' },
  { label: 'Secs',  value: '30' },
])

let timer: ReturnType<typeof setInterval>
onMounted(() => {
  let h = 8, m = 45, s = 30
  timer = setInterval(() => {
    s--
    if (s < 0) { s = 59; m-- }
    if (m < 0) { m = 59; h-- }
    if (h < 0) { h = 23; m = 59; s = 59 }
    countdown.value = [
      { label:'Hours', value: String(h).padStart(2,'0') },
      { label:'Mins',  value: String(m).padStart(2,'0') },
      { label:'Secs',  value: String(s).padStart(2,'0') },
    ]
  }, 1000)
})
onUnmounted(() => clearInterval(timer))
</script>
