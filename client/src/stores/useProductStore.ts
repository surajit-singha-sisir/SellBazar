import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Product, Category } from '@/types'

const API = '/api'

// Strip leading "fa-" so templates can safely prepend "fa-sharp fa-solid fa-"
function stripFaPrefix(icon: string): string {
  return icon ? icon.replace(/^fa-/, '') : 'tag'
}

// Sort products by updatedAt DESC, falling back to createdAt DESC
function byLatest(a: Product, b: Product): number {
  const ta = new Date((a as any).updatedAt ?? (a as any).createdAt ?? 0).getTime()
  const tb = new Date((b as any).updatedAt ?? (b as any).createdAt ?? 0).getTime()
  return tb - ta
}

export const useProductStore = defineStore('products', () => {
  const products      = ref<Product[]>([])
  const categories    = ref<Category[]>([])
  const isLoading     = ref(false)
  const searchQuery   = ref('')
  const activeCategory    = ref('All')
  const activeSubcategory = ref('All')

  // Prevent duplicate concurrent fetches
  let _fetchProductsPromise: Promise<void> | null = null
  let _fetchCategoriesPromise: Promise<void> | null = null

  // ── derived ──────────────────────────────────────────────────────────────
  const categoryNames = computed(() => ['All', ...new Set(products.value.map(p => p.category))])

  const activeSubcategories = computed(() => {
    const cat = categories.value.find(c => c.name === activeCategory.value)
    return cat?.subcategories ?? []
  })

  // All products matching current filters, newest first
  const filtered = computed(() => {
    let list = [...products.value]
    if (activeCategory.value !== 'All')
      list = list.filter(p => p.category === activeCategory.value)
    if (activeSubcategory.value !== 'All')
      list = list.filter(p => p.subcategory === activeSubcategory.value)
    if (searchQuery.value.trim()) {
      const q = searchQuery.value.toLowerCase()
      list = list.filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.brand.toLowerCase().includes(q) ||
        p.tags.some(t => t.includes(q))
      )
    }
    return list.sort(byLatest)
  })

  // Featured products — newest updatedAt first
  const featured = computed(() =>
    products.value.filter(p => p.isFeatured).sort(byLatest)
  )

  // New arrivals — newest updatedAt first
  const newArr = computed(() =>
    products.value.filter(p => p.isNew).sort(byLatest)
  )

  // ── API calls ────────────────────────────────────────────────────────────
  async function fetchProducts(params: Record<string, string> = {}) {
    // If a fetch is already in-flight, return the same promise (no double fetch)
    if (_fetchProductsPromise) return _fetchProductsPromise
    isLoading.value = true
    _fetchProductsPromise = (async () => {
      try {
        const qs = new URLSearchParams(params).toString()
        const res = await fetch(`${API}/products${qs ? '?' + qs : ''}`, {
          cache: 'no-store',
          headers: { 'Cache-Control': 'no-cache' },
        })
        if (!res.ok) throw new Error('Failed to fetch products')
        const json = await res.json()
        products.value = json.data ?? json
      } catch (e) {
        console.error('fetchProducts:', e)
      } finally {
        isLoading.value = false
        _fetchProductsPromise = null
      }
    })()
    return _fetchProductsPromise
  }

  async function fetchCategories() {
    if (_fetchCategoriesPromise) return _fetchCategoriesPromise
    _fetchCategoriesPromise = (async () => {
      try {
        const res = await fetch(`${API}/categories`, {
          cache: 'no-store',
          headers: { 'Cache-Control': 'no-cache' },
        })
        if (!res.ok) throw new Error('Failed to fetch categories')
        const json = await res.json()
        categories.value = (json.data ?? json).map((c: any) => ({
          ...c,
          icon: stripFaPrefix(c.icon),
          count: c.productCount ?? c.count ?? 0,
          subcategories: (c.subcategories ?? []).map((s: any) => ({
            ...s,
            icon: stripFaPrefix(s.icon),
          })),
        }))
      } catch (e) {
        console.error('fetchCategories:', e)
      } finally {
        _fetchCategoriesPromise = null
      }
    })()
    return _fetchCategoriesPromise
  }

  async function fetchProductBySlug(slug: string): Promise<Product | null> {
    try {
      const res = await fetch(`${API}/products/${slug}`, {
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache' },
      })
      if (!res.ok) return null
      return await res.json()
    } catch {
      return null
    }
  }

  function getBySlug(slug: string) {
    return products.value.find(p => p.slug === slug || p.id === slug)
  }

  function setCategory(cat: string) {
    activeCategory.value = cat
    activeSubcategory.value = 'All'
  }

  function setSubcategory(sub: string) {
    activeSubcategory.value = sub
  }

  return {
    products, categories, isLoading, searchQuery,
    activeCategory, activeSubcategory,
    categoryNames, activeSubcategories,
    filtered, featured, newArr,
    fetchProducts, fetchCategories, fetchProductBySlug, getBySlug,
    setCategory, setSubcategory,
  }
})
