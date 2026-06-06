<template>
  <!-- ── Loading skeleton (first load only) ──────────────────────────── -->
  <div v-if="productStore.isLoading && !productStore.products.length"
       class="min-h-screen bg-[var(--color-bg)] animate-pulse">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 py-12 space-y-10">
      <!-- Hero skeleton -->
      <div class="flex gap-4">
        <div class="w-64 shrink-0 space-y-2">
          <div v-for="n in 8" :key="n" class="h-11 rounded-xl bg-[var(--color-surface-2)]"></div>
        </div>
        <div class="flex-1 h-80 rounded-2xl bg-[var(--color-surface-2)]"></div>
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
      <div class="hero-bg-grid"></div>
      <div class="hero-blob hero-blob--orange"></div>
      <div class="hero-blob hero-blob--violet"></div>

      <div class="hero-content max-w-7xl mx-auto">

        <!-- Badge -->
        <div class="hero-top-row">
          <span class="hero-badge">
            <span class="pulse-dot"></span>
            বাংলাদেশের সেরা মার্কেটপ্লেস · 2027
          </span>
        </div>

        <!-- ── Two-column hero layout ─────────────────────────────── -->
        <div class="hero-two-col">

          <!-- LEFT: Dynamic Category List -->
          <aside class="hero-cat-panel" @mouseleave="activeCat = null">
            <div class="hero-cat-header">
              <i class="fa-sharp fa-solid fa-grid-2 text-[var(--color-brand)]"></i>
              <span>All Categories</span>
            </div>

            <ul class="hero-cat-list">
              <li
                v-for="(cat, idx) in displayCategories"
                :key="cat.id"
                class="hero-cat-item"
                :class="{ 'hero-cat-item--active': activeCat === cat.id }"
                @mouseenter="activeCat = cat.id"
                @click.stop="handleCatClick(cat)"
              >
                <!-- Category row -->
                <div class="hero-cat-row">
                  <span class="hero-cat-icon-wrap" :style="`background:${cat.color}18`">
                    <i :class="'fa-sharp fa-solid fa-' + cat.icon" :style="`color:${cat.color}`"></i>
                  </span>
                  <span class="hero-cat-name">{{ cat.name }}</span>
                  <span class="hero-cat-count">{{ (cat.productCount ?? cat.count ?? 0).toLocaleString() }}+</span>
                  <i v-if="cat.subcategories?.length"
                    class="fa-sharp fa-solid fa-chevron-right hero-cat-chevron"></i>
                </div>

                <!-- Subcategory flyout panel -->
                <Transition name="subpanel">
                  <div
                    v-if="cat.subcategories?.length && activeCat === cat.id"
                    class="hero-subcat-panel"
                    :class="idx >= displayCategories.length - 3 ? 'hero-subcat-panel--up' : ''"
                    @click.stop
                  >
                    <div class="hero-subcat-header">
                      <span class="hero-subcat-icon" :style="`background:${cat.color}18`">
                        <i :class="'fa-sharp fa-solid fa-' + cat.icon" :style="`color:${cat.color}`"></i>
                      </span>
                      <span class="font-semibold text-sm">{{ cat.name }}</span>
                      <RouterLink
                        :to="`/products?cat=${encodeURIComponent(cat.name)}`"
                        class="ml-auto text-xs text-orange-500 font-semibold hover:underline"
                        @click="activeCat = null"
                      >All →</RouterLink>
                    </div>
                    <div class="hero-subcat-grid">
                      <RouterLink
                        v-for="sub in cat.subcategories.slice(0, 10)" :key="sub.slug"
                        :to="`/products?cat=${encodeURIComponent(cat.name)}&sub=${sub.slug}`"
                        class="hero-subcat-link"
                        @click="activeCat = null"
                      >
                        <i :class="'fa-sharp fa-solid fa-' + sub.icon" :style="`color:${cat.color};opacity:0.8`"></i>
                        <span>{{ sub.name }}</span>
                      </RouterLink>
                    </div>
                  </div>
                </Transition>
              </li>
            </ul>

            <!-- See all link -->
            <RouterLink to="/products" class="hero-cat-all-link">
              <i class="fa-sharp fa-solid fa-layer-group text-xs"></i>
              See All Categories
              <i class="fa-sharp fa-solid fa-arrow-right text-xs"></i>
            </RouterLink>
          </aside>

          <!-- RIGHT: Swiper Carousel -->
          <div class="hero-carousel-col">
            <div class="swiper hero-swiper" ref="swiperEl">
              <div class="swiper-wrapper">
                <div
                  v-for="slide in heroSlides" :key="slide.id"
                  class="swiper-slide hero-slide"
                  :style="`background: ${slide.bg}`"
                >
                  <div class="hero-slide-content">
                    <span class="hero-slide-tag">{{ slide.tag }}</span>
                    <h2 class="hero-slide-title">{{ slide.title }}</h2>
                    <p class="hero-slide-sub">{{ slide.subtitle }}</p>
                    <RouterLink :to="slide.link" class="hero-slide-btn">
                      <i class="fa-sharp fa-solid fa-bolt"></i>
                      {{ slide.cta }}
                    </RouterLink>
                  </div>
                  <div class="hero-slide-img-wrap">
                    <img :src="slide.image" :alt="slide.title" class="hero-slide-img" />
                  </div>
                </div>
              </div>
              <!-- Swiper controls -->
              <div class="swiper-pagination hero-swiper-pagination"></div>
              <div class="swiper-button-prev hero-swiper-prev"></div>
              <div class="swiper-button-next hero-swiper-next"></div>
            </div>

            <!-- Trust strip below carousel -->
            <div class="hero-trust-row">
              <div class="hero-trust-item">
                <i class="fa-sharp fa-solid fa-truck-fast text-blue-500"></i>
                <span>Free Delivery above ৳599</span>
              </div>
              <div class="hero-trust-divider"></div>
              <div class="hero-trust-item">
                <i class="fa-sharp fa-solid fa-shield-halved text-green-500"></i>
                <span>Secure Payments</span>
              </div>
              <div class="hero-trust-divider"></div>
              <div class="hero-trust-item">
                <i class="fa-sharp fa-solid fa-rotate-left text-orange-500"></i>
                <span>Easy 7-day Returns</span>
              </div>
              <div class="hero-trust-divider"></div>
              <div class="hero-trust-item">
                <i class="fa-sharp fa-solid fa-headset text-purple-500"></i>
                <span>24/7 Support</span>
              </div>
            </div>
          </div>

        </div><!-- end .hero-two-col -->

      </div>
    </section>


    <!-- ── Featured Products ──────────────────────────────────────────── -->
    <section class="max-w-7xl mx-auto px-4 sm:px-6 py-12">
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
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { useProductStore } from '@/stores/useProductStore'
import ProductCard from '@/components/product/ProductCard.vue'
import Swiper from 'swiper'
import { Navigation, Pagination, Autoplay } from 'swiper/modules'
import 'swiper/css'
import 'swiper/css/navigation'
import 'swiper/css/pagination'

const router = useRouter()
const productStore = useProductStore()

// Active category for subcat flyout
const activeCat = ref<string | null>(null)
const swiperEl  = ref<HTMLElement | null>(null)
let swiperInstance: Swiper | null = null

function closeFlyout() { activeCat.value = null }

function handleCatClick(cat: any) {
  if (cat.subcategories?.length) {
    activeCat.value = activeCat.value === cat.id ? null : cat.id
  } else {
    router.push(`/products?cat=${encodeURIComponent(cat.name)}`)
  }
}

// Dynamic categories from store only — no static fallback shown to user
const displayCategories = computed(() => productStore.categories)

// Hero slides
const heroSlides = [
  {
    id: 1,
    tag: '🔥 Eid Special',
    title: 'Shop Smart,\nDeliver Fast',
    subtitle: 'From Dhaka to every district — same-day delivery & bKash checkout.',
    cta: 'Shop Now',
    link: '/products',
    bg: 'linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%)',
    image: 'https://placehold.co/480x320/f97316/fff?text=Eid+Sale',
  },
  {
    id: 2,
    tag: '⚡ Flash Deal',
    title: 'Electronics\nat Best Prices',
    subtitle: 'Smartphones, laptops, gadgets — up to 40% off this week only.',
    cta: 'Explore Electronics',
    link: '/products?cat=Electronics',
    bg: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
    image: 'https://placehold.co/480x320/3b82f6/fff?text=Electronics',
  },
  {
    id: 3,
    tag: '👗 New Season',
    title: 'Fresh Fashion\nDrops Daily',
    subtitle: 'Trendy styles for every occasion. Free returns on fashion items.',
    cta: 'Explore Fashion',
    link: '/products?cat=Fashion',
    bg: 'linear-gradient(135deg, #fdf4ff 0%, #fae8ff 100%)',
    image: 'https://placehold.co/480x320/d946ef/fff?text=Fashion',
  },
  {
    id: 4,
    tag: '🛒 Grocery',
    title: 'Daily Essentials\nDelivered Fast',
    subtitle: 'Fresh groceries from top brands. Order before noon, get today.',
    cta: 'Order Groceries',
    link: '/products?cat=Grocery',
    bg: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
    image: 'https://placehold.co/480x320/22c55e/fff?text=Grocery',
  },
]

onMounted(async () => {
  if (!productStore.products.length) {
    await Promise.all([
      productStore.fetchProducts(),
      productStore.fetchCategories(),
    ])
  } else if (!productStore.categories.length) {
    await productStore.fetchCategories()
  }

  document.addEventListener('click', closeFlyout)

  // Init Swiper after DOM is ready
  await nextTick()
  if (swiperEl.value) {
    swiperInstance = new Swiper(swiperEl.value, {
      modules: [Navigation, Pagination, Autoplay],
      loop: true,
      autoplay: { delay: 4500, disableOnInteraction: false },
      pagination: { el: '.hero-swiper-pagination', clickable: true },
      navigation: { nextEl: '.hero-swiper-next', prevEl: '.hero-swiper-prev' },
      speed: 600,
    })
  }
})

onUnmounted(() => {
  document.removeEventListener('click', closeFlyout)
  swiperInstance?.destroy(true, true)
})

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
