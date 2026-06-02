<template>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 py-8">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
      <div>
        <h1 class="font-display font-bold text-2xl">
          {{ activeSubcategory !== 'All'
              ? subLabel
              : activeCategory !== 'All' ? activeCategory : 'All Products' }}
        </h1>
        <p class="text-sm text-[var(--color-text-muted)] mt-1">{{ sorted.length }} results</p>
      </div>
      <select v-model="sort" class="input-field w-auto text-sm py-2">
        <option value="">Sort: Relevance</option>
        <option value="price-asc">Price: Low to High</option>
        <option value="price-desc">Price: High to Low</option>
        <option value="rating">Top Rated</option>
        <option value="new">Newest</option>
      </select>
    </div>

    <div class="flex gap-6">
      <!-- Sidebar filters -->
      <aside class="hidden lg:block w-56 shrink-0 space-y-5">
        <!-- Categories -->
        <div class="card p-4 space-y-1">
          <h3 class="font-semibold text-sm mb-3">Categories</h3>
          <button
            v-for="cat in productStore.categoryNames" :key="cat"
            @click="selectCategory(cat)"
            class="w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition"
            :class="activeCategory === cat
              ? 'bg-orange-500/10 text-orange-600 font-medium'
              : 'hover:bg-[var(--color-surface-2)] text-[var(--color-text-2)]'"
          >
            <span>{{ cat }}</span>
            <span class="text-xs text-[var(--color-text-muted)]">{{ catCount(cat) }}</span>
          </button>
        </div>

        <!-- Subcategories (shown when a category is active) -->
        <div v-if="productStore.activeSubcategories.length" class="card p-4 space-y-1">
          <h3 class="font-semibold text-sm mb-3">Subcategories</h3>
          <button
            class="w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition"
            :class="activeSubcategory === 'All'
              ? 'bg-orange-500/10 text-orange-600 font-medium'
              : 'hover:bg-[var(--color-surface-2)] text-[var(--color-text-2)]'"
            @click="selectSubcategory('All')"
          >
            <span>All</span>
            <span class="text-xs text-[var(--color-text-muted)]">{{ catCount(activeCategory) }}</span>
          </button>
          <button
            v-for="sub in productStore.activeSubcategories" :key="sub.slug"
            @click="selectSubcategory(sub.slug)"
            class="w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition"
            :class="activeSubcategory === sub.slug
              ? 'bg-orange-500/10 text-orange-600 font-medium'
              : 'hover:bg-[var(--color-surface-2)] text-[var(--color-text-2)]'"
          >
            <span>{{ sub.name }}</span>
            <span class="text-xs text-[var(--color-text-muted)]">{{ sub.productCount ?? 0 }}</span>
          </button>
        </div>

        <!-- Price range -->
        <div class="card p-4">
          <h3 class="font-semibold text-sm mb-3">Price Range</h3>
          <div class="space-y-1">
            <button
              v-for="range in priceRanges" :key="range.label"
              @click="activePrice = activePrice === range.label ? '' : range.label"
              class="w-full text-left px-3 py-2 rounded-lg text-sm transition"
              :class="activePrice === range.label
                ? 'bg-orange-500/10 text-orange-600 font-medium'
                : 'hover:bg-[var(--color-surface-2)] text-[var(--color-text-2)]'"
            >
              {{ range.label }}
            </button>
          </div>
        </div>
      </aside>

      <!-- Product grid -->
      <div class="flex-1 min-w-0">
        <!-- Mobile category chips -->
        <div class="lg:hidden flex gap-2 mb-3 overflow-x-auto pb-1 scrollbar-hide">
          <button
            v-for="cat in productStore.categoryNames" :key="cat"
            @click="selectCategory(cat)"
            class="shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition"
            :class="activeCategory === cat
              ? 'bg-orange-500 border-orange-500 text-white'
              : 'border-[var(--color-border)] text-[var(--color-text-2)] hover:border-orange-500/40'"
          >{{ cat }}</button>
        </div>

        <!-- Mobile subcategory chips -->
        <div v-if="productStore.activeSubcategories.length" class="lg:hidden flex gap-2 mb-4 overflow-x-auto pb-1 scrollbar-hide">
          <button
            class="shrink-0 px-3 py-1 rounded-full text-xs font-medium border transition"
            :class="activeSubcategory === 'All'
              ? 'bg-orange-100 border-orange-400 text-orange-700'
              : 'border-[var(--color-border)] text-[var(--color-text-muted)]'"
            @click="selectSubcategory('All')"
          >All</button>
          <button
            v-for="sub in productStore.activeSubcategories" :key="sub.slug"
            @click="selectSubcategory(sub.slug)"
            class="shrink-0 px-3 py-1 rounded-full text-xs font-medium border transition"
            :class="activeSubcategory === sub.slug
              ? 'bg-orange-100 border-orange-400 text-orange-700'
              : 'border-[var(--color-border)] text-[var(--color-text-muted)]'"
          >{{ sub.name }}</button>
        </div>

        <!-- Loading skeleton -->
        <div v-if="productStore.isLoading" class="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <div v-for="n in 6" :key="n" class="card overflow-hidden">
            <div class="skeleton aspect-square w-full"></div>
            <div class="p-4 space-y-2">
              <div class="skeleton h-4 w-3/4 rounded"></div>
              <div class="skeleton h-4 w-1/2 rounded"></div>
              <div class="skeleton h-8 w-full rounded-xl"></div>
            </div>
          </div>
        </div>

        <!-- Empty state -->
        <div v-else-if="sorted.length === 0" class="text-center py-20">
          <div class="w-20 h-20 rounded-3xl bg-orange-500/10 flex items-center justify-center mx-auto mb-4">
            <i class="fa-sharp fa-regular fa-search text-3xl text-orange-500"></i>
          </div>
          <p class="font-semibold text-lg">No products found</p>
          <p class="text-[var(--color-text-muted)] text-sm mt-1">Try a different category or search</p>
          <button @click="clearFilters" class="btn-primary mt-4">Clear Filters</button>
        </div>

        <!-- Grid -->
        <div v-else class="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <ProductCard v-for="p in sorted" :key="p.id" :product="p" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useProductStore } from '@/stores/useProductStore'
import ProductCard from '@/components/product/ProductCard.vue'

const route        = useRoute()
const router       = useRouter()
const productStore = useProductStore()

const sort        = ref('')
const activePrice = ref('')

const activeCategory    = computed(() => productStore.activeCategory)
const activeSubcategory = computed(() => productStore.activeSubcategory)

const subLabel = computed(() => {
  const sub = productStore.activeSubcategories.find(s => s.slug === activeSubcategory.value)
  return sub?.name ?? activeSubcategory.value
})

const priceRanges = [
  { label: 'Under ৳500',         min: 0,      max: 500 },
  { label: '৳500 – ৳2,000',      min: 500,    max: 2000 },
  { label: '৳2,000 – ৳10,000',   min: 2000,   max: 10000 },
  { label: '৳10,000 – ৳50,000',  min: 10000,  max: 50000 },
  { label: 'Over ৳50,000',       min: 50000,  max: Infinity },
]

function selectCategory(cat: string) {
  productStore.setCategory(cat)
  router.replace({ query: { ...route.query, cat: cat === 'All' ? undefined : cat, sub: undefined } })
}

function selectSubcategory(sub: string) {
  productStore.setSubcategory(sub)
  router.replace({ query: { ...route.query, sub: sub === 'All' ? undefined : sub } })
}

function clearFilters() {
  productStore.setCategory('All')
  productStore.searchQuery = ''
  activePrice.value = ''
  sort.value = ''
  router.replace({ query: {} })
}

function catCount(cat: string) {
  if (cat === 'All') return productStore.products.length
  return productStore.products.filter(p => p.category === cat).length
}

const sorted = computed(() => {
  let list = [...productStore.filtered]
  if (activePrice.value) {
    const r = priceRanges.find(p => p.label === activePrice.value)
    if (r) list = list.filter(p => (p.salePrice ?? p.price) >= r.min && (p.salePrice ?? p.price) <= r.max)
  }
  if (sort.value === 'price-asc')  return [...list].sort((a, b) => (a.salePrice ?? a.price) - (b.salePrice ?? b.price))
  if (sort.value === 'price-desc') return [...list].sort((a, b) => (b.salePrice ?? b.price) - (a.salePrice ?? a.price))
  if (sort.value === 'rating')     return [...list].sort((a, b) => b.rating - a.rating)
  if (sort.value === 'new')        return [...list].sort((a, b) => (a.isNew ? 0 : 1) - (b.isNew ? 0 : 1))
  return list
})

onMounted(async () => {
  await Promise.all([productStore.fetchProducts(), productStore.fetchCategories()])
  const { cat, sub, q } = route.query as Record<string, string>
  if (cat) productStore.setCategory(cat)
  if (sub) productStore.setSubcategory(sub)
  if (q)   productStore.searchQuery = q
})

watch(() => route.query, (q) => {
  if (q.cat) productStore.setCategory(q.cat as string)
  else productStore.setCategory('All')
  if (q.sub) productStore.setSubcategory(q.sub as string)
  if (q.q)   productStore.searchQuery = q.q as string
})
</script>
