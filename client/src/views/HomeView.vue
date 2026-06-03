<template>
  <!-- ── Loading skeleton (first load only) ──────────────────────────── -->
  <div v-if="productStore.isLoading && !productStore.products.length"
       class="min-h-screen bg-[var(--color-bg)] animate-pulse">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 py-12 space-y-10">
      <!-- Hero skeleton -->
      <div class="grid lg:grid-cols-2 gap-8 items-center">
        <div class="space-y-4">
          <div class="h-4 w-48 rounded-full bg-[var(--color-surface-2)]"></div>
          <div class="h-12 w-3/4 rounded-xl bg-[var(--color-surface-2)]"></div>
          <div class="h-12 w-1/2 rounded-xl bg-[var(--color-surface-2)]"></div>
          <div class="h-4 w-full rounded bg-[var(--color-surface-2)]"></div>
          <div class="flex gap-3">
            <div class="h-11 w-32 rounded-2xl bg-[var(--color-surface-2)]"></div>
            <div class="h-11 w-36 rounded-2xl bg-[var(--color-surface-2)]"></div>
          </div>
        </div>
        <div class="hidden lg:block h-80 rounded-3xl bg-[var(--color-surface-2)]"></div>
      </div>
      <!-- Category chips skeleton -->
      <div class="grid grid-cols-4 lg:grid-cols-8 gap-3">
        <div v-for="n in 8" :key="n" class="h-24 rounded-2xl bg-[var(--color-surface-2)]"></div>
      </div>
      <!-- Product cards skeleton -->
      <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        <div v-for="n in 8" :key="n" class="h-64 rounded-2xl bg-[var(--color-surface-2)]"></div>
      </div>
    </div>
  </div>

  <!-- ── Main content ─────────────────────────────────────────────────── -->
  <div v-else class="bg-mesh min-h-screen">

    <!-- ── Hero Section ──────────────────────────────────────────────── -->
    <section class="hero-section">
      <!-- Decorative blobs -->
      <div class="hero-blob hero-blob--orange"></div>
      <div class="hero-blob hero-blob--violet"></div>
      <div class="hero-blob hero-blob--blue"></div>

      <div class="hero-content max-w-7xl mx-auto">
        <div class="grid lg:grid-cols-2 gap-10 xl:gap-16 items-center">

          <!-- ── Left: Text ──────────────────────────────────────────── -->
          <div class="flex flex-col gap-5 text-center lg:text-left items-center lg:items-start">

            <!-- Pill badge -->
            <span class="hero-badge">
              <span class="pulse-dot"></span>
              বাংলাদেশের সেরা মার্কেটপ্লেস · 2027
            </span>

            <!-- Headline -->
            <h1 class="font-display font-extrabold leading-[1.1] text-[clamp(2.4rem,6vw,4rem)]">
              <span class="gradient-text block">Shop Smart,</span>
              <span class="text-[var(--color-text)]">Deliver Fast</span>
            </h1>

            <!-- Sub-copy -->
            <p class="text-[var(--color-text-2)] text-base sm:text-lg leading-relaxed max-w-md">
              From Dhaka to every district — millions of products,
              instant <strong class="text-[var(--color-text)] font-semibold">bKash checkout</strong>,
              and same-day delivery across Bangladesh.
            </p>

            <!-- CTA buttons -->
            <div class="flex flex-wrap gap-3 justify-center lg:justify-start">
              <RouterLink to="/products" class="btn-primary text-base px-8 py-3.5">
                <i class="fa-sharp fa-solid fa-bolt"></i> Shop Now
              </RouterLink>
              <RouterLink to="/deals" class="btn-secondary text-base px-8 py-3.5">
                <i class="fa-sharp fa-solid fa-fire text-orange-400"></i> Today's Deals
              </RouterLink>
            </div>

            <!-- Trust strip -->
            <div class="hero-trust">
              <span class="trust-item">
                <i class="fa-sharp fa-solid fa-shield-halved text-green-500"></i> Secure Payment
              </span>
              <span class="trust-item">
                <i class="fa-sharp fa-solid fa-truck-fast text-blue-500"></i> Fast Delivery
              </span>
              <span class="trust-item">
                <i class="fa-sharp fa-solid fa-rotate-left text-orange-500"></i> Easy Returns
              </span>
              <span class="trust-item">
                <i class="fa-sharp fa-solid fa-headset text-purple-500"></i> 24/7 Support
              </span>
            </div>
          </div>

          <!-- ── Right: Floating product cards ──────────────────────── -->
          <div class="hero-visual">
            <div class="glow-ring"></div>

            <!-- 2×2 grid, visible sm+ (hidden on tiny phones) -->
            <div class="hidden sm:grid grid-cols-2 gap-3 sm:gap-4 relative">
              <div
                v-for="p in productStore.featured.slice(0, 4)"
                :key="p.id"
                class="hero-card"
                @click="$router.push(`/products/${p.slug}`)"
              >
                <img
                  :src="p.images[0]"
                  :alt="p.name"
                  onerror="this.src='https://placehold.co/280x210/f97316/fff?text=Product'"
                />
                <div class="hero-card-body">
                  <p class="hero-card-name">{{ p.name }}</p>
                  <p class="hero-card-price">৳{{ (p.salePrice ?? p.price).toLocaleString() }}</p>
                </div>
              </div>

              <!-- Skeleton placeholders if products not loaded yet -->
              <template v-if="!productStore.featured.length">
                <div
                  v-for="n in 4" :key="'sk-' + n"
                  class="hero-card animate-pulse"
                >
                  <div class="w-full aspect-[4/3] bg-[var(--color-surface-2)]"></div>
                  <div class="hero-card-body space-y-1.5">
                    <div class="h-2.5 w-3/4 rounded bg-[var(--color-surface-2)]"></div>
                    <div class="h-2.5 w-1/2 rounded bg-[var(--color-surface-2)]"></div>
                  </div>
                </div>
              </template>
            </div>

            <!-- Single scrollable row on mobile (< sm) -->
            <div class="flex sm:hidden gap-3 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
              <div
                v-for="p in productStore.featured.slice(0, 4)"
                :key="p.id"
                class="hero-card shrink-0 w-40"
                @click="$router.push(`/products/${p.slug}`)"
              >
                <img
                  :src="p.images[0]"
                  :alt="p.name"
                  onerror="this.src='https://placehold.co/160x120/f97316/fff?text=?'"
                />
                <div class="hero-card-body">
                  <p class="hero-card-name">{{ p.name }}</p>
                  <p class="hero-card-price">৳{{ (p.salePrice ?? p.price).toLocaleString() }}</p>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>


    <!-- ── Categories ─────────────────────────────────────────────────── -->
    <section class="max-w-7xl mx-auto px-4 sm:px-6 py-12">
      <div class="flex items-center justify-between mb-6">
        <h2 class="font-display text-2xl font-bold">Browse Categories</h2>
        <RouterLink to="/products" class="btn-ghost text-sm">See all <i class="fa-sharp fa-regular fa-arrow-right"></i></RouterLink>
      </div>
      <div class="grid grid-cols-4 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        <div
          v-for="cat in displayCategories" :key="cat.id"
          class="relative group"
        >
          <RouterLink
            :to="`/products?cat=${encodeURIComponent(cat.name)}`"
            class="card flex flex-col items-center gap-2 py-4 px-2 hover:shadow-md hover:-translate-y-1 transition-all duration-200 text-center"
          >
            <div class="w-12 h-12 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110" :style="`background: ${cat.color}18`">
              <i :class="'fa-sharp fa-solid fa-' + cat.icon + ' text-lg'" :style="`color: ${cat.color}`"></i>
            </div>
            <span class="text-xs font-medium leading-tight text-[var(--color-text-2)] group-hover:text-[var(--color-text)]">{{ cat.name }}</span>
            <span class="text-[10px] text-[var(--color-text-muted)]">{{ (cat.productCount ?? cat.count ?? 0).toLocaleString() }}+</span>
          </RouterLink>
          <!-- Subcategory flyout on hover -->
          <div
            v-if="cat.subcategories && cat.subcategories.length"
            class="absolute top-full left-1/2 -translate-x-1/2 mt-1 z-30 hidden group-hover:block w-44 card shadow-xl p-2 rounded-xl"
          >
            <RouterLink
              v-for="sub in cat.subcategories.slice(0, 6)" :key="sub.slug"
              :to="`/products?cat=${encodeURIComponent(cat.name)}&sub=${sub.slug}`"
              class="flex items-center gap-2 px-3 py-2 rounded-lg text-xs hover:bg-[var(--color-surface-2)] text-[var(--color-text-2)] hover:text-[var(--color-text)] transition"
            >
              <i :class="'fa-sharp fa-solid fa-' + sub.icon + ' w-4 text-center opacity-60'"></i>
              {{ sub.name }}
            </RouterLink>
          </div>
        </div>
      </div>
    </section>

    <!-- ── Featured Products ──────────────────────────────────────────── -->
    <section class="max-w-7xl mx-auto px-4 sm:px-6 pb-12">
      <div class="flex items-center justify-between mb-6">
        <div>
          <h2 class="font-display text-2xl font-bold">Featured Products</h2>
          <p class="text-sm text-[var(--color-text-muted)] mt-1">Handpicked by our editors</p>
        </div>
        <RouterLink to="/products" class="btn-ghost text-sm">View all <i class="fa-sharp fa-regular fa-arrow-right"></i></RouterLink>
      </div>
      <div v-if="productStore.featured.length" class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        <ProductCard v-for="p in productStore.featured" :key="p.id" :product="p" />
      </div>
      <!-- inline mini-skeleton while re-fetching after stale nav -->
      <div v-else class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 animate-pulse">
        <div v-for="n in 8" :key="n" class="h-64 rounded-2xl bg-[var(--color-surface-2)]"></div>
      </div>
    </section>


    <!-- ── Deals Banner ───────────────────────────────────────────────── -->
    <section class="max-w-7xl mx-auto px-4 sm:px-6 pb-12">
      <div class="relative overflow-hidden rounded-3xl bg-gradient-to-r from-orange-600 via-orange-500 to-fuchsia-600 p-8 sm:p-12 text-white">
        <div class="absolute inset-0 opacity-10" style="background-image: radial-gradient(circle, white 1px, transparent 1px); background-size: 30px 30px;"></div>
        <div class="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div>
            <div class="flex items-center gap-2 mb-2">
              <i class="fa-sharp fa-solid fa-tag text-white/80 text-2xl"></i>
              <span class="text-sm font-semibold bg-white/20 px-3 py-1 rounded-full">Limited Time</span>
            </div>
            <h2 class="font-display text-3xl font-extrabold mt-2">Eid Special Sale!</h2>
            <p class="text-white/80 mt-1 text-lg">Up to 70% off — Hurry before it ends</p>
            <div class="flex gap-3 mt-4 text-center">
              <div v-for="t in countdown" :key="t.label" class="bg-white/20 rounded-xl px-4 py-2 min-w-[60px]">
                <p class="font-display font-extrabold text-2xl">{{ t.value }}</p>
                <p class="text-xs text-white/70">{{ t.label }}</p>
              </div>
            </div>
          </div>
          <RouterLink to="/deals" class="shrink-0 bg-white text-orange-600 font-bold py-3 px-8 rounded-2xl hover:bg-orange-50 transition shadow-xl text-base">
            <i class="fa-sharp fa-solid fa-fire mr-1"></i> Shop Deals
          </RouterLink>
        </div>
      </div>
    </section>

    <!-- ── New Arrivals ───────────────────────────────────────────────── -->
    <section class="max-w-7xl mx-auto px-4 sm:px-6 pb-12">
      <div class="flex items-center justify-between mb-6">
        <div>
          <h2 class="font-display text-2xl font-bold">New Arrivals</h2>
          <p class="text-sm text-[var(--color-text-muted)] mt-1">Fresh drops this week</p>
        </div>
        <RouterLink to="/products?filter=new" class="btn-ghost text-sm">See all <i class="fa-sharp fa-regular fa-arrow-right"></i></RouterLink>
      </div>
      <div v-if="productStore.newArr.length" class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        <ProductCard v-for="p in productStore.newArr" :key="p.id" :product="p" />
      </div>
      <div v-else class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 animate-pulse">
        <div v-for="n in 4" :key="n" class="h-64 rounded-2xl bg-[var(--color-surface-2)]"></div>
      </div>
    </section>


    <!-- ── Why SellBazar ──────────────────────────────────────────────── -->
    <section class="max-w-7xl mx-auto px-4 sm:px-6 pb-12">
      <h2 class="font-display text-2xl font-bold text-center mb-8">Why Choose SellBazar?</h2>
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div v-for="f in features" :key="f.title" class="card p-5 text-center hover:shadow-md transition">
          <div class="w-12 h-12 rounded-2xl mx-auto mb-3 flex items-center justify-center" :style="`background:${f.color}18`">
            <i :class="f.icon + ' text-xl'" :style="`color:${f.color}`"></i>
          </div>
          <h3 class="font-semibold text-sm mb-1">{{ f.title }}</h3>
          <p class="text-xs text-[var(--color-text-muted)]">{{ f.desc }}</p>
        </div>
      </div>
    </section>

    <!-- ── Payment methods ────────────────────────────────────────────── -->
    <section class="max-w-7xl mx-auto px-4 sm:px-6 pb-16">
      <div class="card p-8 text-center">
        <h3 class="font-display font-bold text-xl mb-2">Secure & Easy Payments</h3>
        <p class="text-[var(--color-text-muted)] text-sm mb-6">Pay the way you prefer — trusted by millions of Bangladeshis</p>
        <div class="flex flex-wrap justify-center gap-3">
          <div v-for="pm in paymentMethods" :key="pm.name"
            class="payment-badge hover:shadow-md transition flex items-center gap-2">
            <i :class="pm.icon + ' text-base'" :style="`color:${pm.color}`"></i>
            <span class="font-medium">{{ pm.name }}</span>
          </div>
        </div>
      </div>
    </section>

  </div><!-- end v-else main content -->
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useProductStore } from '@/stores/useProductStore'
import ProductCard from '@/components/product/ProductCard.vue'

const productStore = useProductStore()

onMounted(async () => {
  // Only fetch if store is empty (avoids redundant refetch on back-navigation)
  if (!productStore.products.length) {
    await Promise.all([
      productStore.fetchProducts(),
      productStore.fetchCategories(),
    ])
  } else if (!productStore.categories.length) {
    await productStore.fetchCategories()
  }
})


// Static fallback — icons are bare names (no fa- prefix); the template prepends "fa-sharp fa-solid fa-"
const staticCategories = [
  { id: '1', slug: 'electronics', name: 'Electronics', icon: 'microchip',       color: '#3b82f6', count: 45000, subcategories: [] },
  { id: '2', slug: 'fashion',     name: 'Fashion',     icon: 'shirt',           color: '#ec4899', count: 80000, subcategories: [] },
  { id: '3', slug: 'grocery',     name: 'Grocery',     icon: 'basket-shopping', color: '#22c55e', count: 12000, subcategories: [] },
  { id: '4', slug: 'beauty',      name: 'Beauty',      icon: 'pump-soap',       color: '#a78bfa', count: 8000,  subcategories: [] },
  { id: '5', slug: 'home',        name: 'Home',        icon: 'couch',           color: '#f97316', count: 25000, subcategories: [] },
  { id: '6', slug: 'sports',      name: 'Sports',      icon: 'dumbbell',        color: '#0ea5e9', count: 15000, subcategories: [] },
  { id: '7', slug: 'business',    name: 'Business',    icon: 'briefcase',       color: '#8b5cf6', count: 5000,  subcategories: [] },
  { id: '8', slug: 'books',       name: 'Books',       icon: 'book-open',       color: '#fbbf24', count: 30000, subcategories: [] },
]
const displayCategories = computed(() =>
  productStore.categories.length ? productStore.categories : staticCategories
)

const features = [
  { title: 'Free Delivery',   desc: 'On orders above ৳599',      icon: 'fa-sharp fa-solid fa-truck',         color: '#3b82f6' },
  { title: 'Easy Returns',    desc: '7-day hassle-free returns',  icon: 'fa-sharp fa-solid fa-rotate-left',   color: '#f97316' },
  { title: 'Secure Payments', desc: 'bKash, Nagad & more',       icon: 'fa-sharp fa-solid fa-shield-halved', color: '#22c55e' },
  { title: '24/7 Support',    desc: 'Always here to help',       icon: 'fa-sharp fa-solid fa-headset',       color: '#d946ef' },
]

const paymentMethods = [
  { name: 'bKash',            icon: 'fa-sharp fa-solid fa-mobile-screen-button', color: '#e2136e' },
  { name: 'Nagad',            icon: 'fa-sharp fa-solid fa-wallet',               color: '#f7931e' },
  { name: 'Rocket',           icon: 'fa-sharp fa-solid fa-rocket',               color: '#8b3fcd' },
  { name: 'VISA',             icon: 'fa-brands fa-cc-visa',                      color: '#1a1f71' },
  { name: 'Mastercard',       icon: 'fa-brands fa-cc-mastercard',                color: '#eb001b' },
  { name: 'Cash on Delivery', icon: 'fa-sharp fa-solid fa-money-bill-wave',      color: '#22c55e' },
  { name: 'Upay',             icon: 'fa-sharp fa-solid fa-building-columns',     color: '#005baa' },
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
      { label: 'Hours', value: String(h).padStart(2, '0') },
      { label: 'Mins',  value: String(m).padStart(2, '0') },
      { label: 'Secs',  value: String(s).padStart(2, '0') },
    ]
  }, 1000)
})
onUnmounted(() => clearInterval(timer))
</script>
