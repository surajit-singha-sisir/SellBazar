<template>
  <!-- Top announcement bar -->
  <div class="bg-gradient-to-r from-orange-600 via-orange-500 to-fuchsia-600 text-white text-center py-1.5 text-xs font-medium tracking-wide">
    <span class="font-bangla">🎉 ঈদ স্পেশাল সেল — সর্বোচ্চ ৭০% ছাড়!</span>
    &nbsp;|&nbsp; Free delivery on orders over ৳599 &nbsp;|&nbsp;
    <RouterLink to="/deals" class="underline hover:no-underline">Shop Now →</RouterLink>
  </div>

  <!-- Main header -->
  <header
    class="sticky top-0 z-50 glass-nav border-b border-[var(--color-border)] transition-all duration-300"
    :class="{ 'shadow-md': scrolled }"
  >
    <div class="max-w-7xl mx-auto px-4 sm:px-6">

      <!-- ── Row 1: Logo / Location  ←→  Actions ──────────────────────── -->
      <div class="flex items-center justify-between gap-3 h-14">

        <!-- Left: Logo + Location -->
        <div class="flex items-center gap-3 shrink-0">
          <RouterLink to="/" class="flex items-center gap-2.5 group">
            <div class="w-9 h-9 rounded-xl bg-gradient-to-br from-orange-500 to-fuchsia-600 flex items-center justify-center shadow-[0_4px_12px_rgba(249,115,22,0.4)] group-hover:scale-105 transition-transform">
              <i class="fa-sharp fa-solid fa-store text-white text-sm"></i>
            </div>
            <div class="font-display font-extrabold text-xl leading-none hidden sm:block">
              <span class="gradient-text">Sell</span><span class="text-[var(--color-text)]">Bazar</span>
            </div>
          </RouterLink>

        </div>

        <!-- Right: Wishlist · Cart · Account · Mobile toggle -->
        <div class="flex items-center gap-1.5 shrink-0">

          <!-- Mobile search icon — appears on scroll -->
          <Transition name="fade">
            <button
              v-if="searchVisible"
              @click="showMobileSearch = !showMobileSearch"
              class="btn-icon sm:hidden"
              :class="{ 'bg-orange-500/10 text-orange-600': showMobileSearch }"
              aria-label="Search"
            >
              <i class="fa-sharp fa-solid fa-magnifying-glass"></i>
            </button>
          </Transition>

          <!-- Wishlist -->
          <RouterLink to="/wishlist" class="btn-icon hidden sm:flex relative" title="Wishlist">
            <i class="fa-sharp fa-regular fa-heart"></i>
            <span v-if="wishlistStore.ids.length" class="absolute -top-1 -right-1 w-4 h-4 bg-pink-500 text-white rounded-full text-[10px] flex items-center justify-center font-bold">
              {{ wishlistStore.ids.length }}
            </span>
          </RouterLink>

          <!-- Cart -->
          <button @click="cartStore.isOpen = true" class="btn-icon relative" :class="{ 'animate-cart-bounce': cartBounced }" title="Cart">
            <i class="fa-sharp fa-regular fa-cart-shopping"></i>
            <span
              v-if="cartStore.totalItems > 0"
              class="absolute -top-1 -right-1 w-5 h-5 bg-orange-500 text-white rounded-full text-[10px] flex items-center justify-center font-bold shadow-[0_0_8px_rgba(249,115,22,0.6)]"
            >
              {{ cartStore.totalItems > 99 ? '99+' : cartStore.totalItems }}
            </span>
          </button>

          <!-- User / Account menu -->
          <div class="relative" ref="userMenu">
            <button
              @click="showUserMenu = !showUserMenu"
              class="btn-icon"
              :class="authStore.isLoggedIn ? 'bg-orange-500/10 border-orange-500/30 text-orange-600' : ''"
            >
              <span v-if="authStore.isLoggedIn" class="font-bold text-xs">{{ authStore.initials }}</span>
              <i v-else class="fa-sharp fa-regular fa-user"></i>
            </button>

            <Transition name="fade">
              <div v-if="showUserMenu" class="absolute right-0 top-full mt-2 w-52 card shadow-xl z-50 py-2 animate-slide-in-up">
                <template v-if="authStore.isLoggedIn">
                  <div class="px-4 py-2.5 border-b border-[var(--color-border)]">
                    <p class="font-semibold text-sm">{{ authStore.user?.name }}</p>
                    <p class="text-xs text-[var(--color-text-muted)]">{{ authStore.user?.phone ?? authStore.user?.email }}</p>
                  </div>
                  <RouterLink to="/account/orders"  class="menu-item" @click="showUserMenu = false"><i class="fa-sharp fa-regular fa-box"></i> My Orders</RouterLink>
                  <RouterLink to="/account/profile" class="menu-item" @click="showUserMenu = false"><i class="fa-sharp fa-regular fa-user-gear"></i> Profile</RouterLink>
                  <div class="divider my-1"></div>
                  <!-- Dark mode toggle (logged in) -->
                  <button @click="themeStore.toggle()" class="menu-item w-full justify-between">
                    <span class="flex items-center gap-2.5">
                      <i :class="themeStore.isDark ? 'fa-sharp fa-solid fa-sun text-yellow-400' : 'fa-sharp fa-regular fa-moon text-slate-400'"></i>
                      {{ themeStore.isDark ? 'Light Mode' : 'Dark Mode' }}
                    </span>
                    <!-- pill toggle indicator -->
                    <span
                      class="relative inline-flex w-8 h-4 rounded-full transition-colors duration-300 shrink-0"
                      :class="themeStore.isDark ? 'bg-orange-500' : 'bg-[var(--color-border)]'"
                    >
                      <span
                        class="absolute top-0.5 left-0.5 w-3 h-3 rounded-full bg-white shadow transition-transform duration-300"
                        :class="themeStore.isDark ? 'translate-x-4' : 'translate-x-0'"
                      ></span>
                    </span>
                  </button>
                  <div class="divider my-1"></div>
                  <button @click="handleLogout" class="menu-item text-red-500 w-full">
                    <i class="fa-sharp fa-regular fa-arrow-right-from-bracket"></i> Logout
                  </button>
                </template>
                <template v-else>
                  <RouterLink to="/login"    class="menu-item" @click="showUserMenu = false"><i class="fa-sharp fa-regular fa-right-to-bracket"></i> Login</RouterLink>
                  <RouterLink to="/register" class="menu-item" @click="showUserMenu = false"><i class="fa-sharp fa-regular fa-user-plus"></i> Register</RouterLink>
                  <div class="divider my-1"></div>
                  <!-- Dark mode toggle (guest) -->
                  <button @click="themeStore.toggle()" class="menu-item w-full justify-between">
                    <span class="flex items-center gap-2.5">
                      <i :class="themeStore.isDark ? 'fa-sharp fa-solid fa-sun text-yellow-400' : 'fa-sharp fa-regular fa-moon text-slate-400'"></i>
                      {{ themeStore.isDark ? 'Light Mode' : 'Dark Mode' }}
                    </span>
                    <!-- pill toggle indicator -->
                    <span
                      class="relative inline-flex w-8 h-4 rounded-full transition-colors duration-300 shrink-0"
                      :class="themeStore.isDark ? 'bg-orange-500' : 'bg-[var(--color-border)]'"
                    >
                      <span
                        class="absolute top-0.5 left-0.5 w-3 h-3 rounded-full bg-white shadow transition-transform duration-300"
                        :class="themeStore.isDark ? 'translate-x-4' : 'translate-x-0'"
                      ></span>
                    </span>
                  </button>
                </template>
              </div>
            </Transition>
          </div>

          <!-- Mobile menu toggle -->
          <button @click="showMobileMenu = !showMobileMenu" class="btn-icon lg:hidden">
            <i :class="showMobileMenu ? 'fa-sharp fa-solid fa-xmark' : 'fa-sharp fa-solid fa-bars'"></i>
          </button>
        </div>
      </div>
      <!-- end Row 1 -->

      <!-- ── Row 2: Category nav (left) · Search bar (right, scroll-revealed) ── -->
      <div class="flex items-center gap-3 border-t border-[var(--color-border)]/50 py-1.5">

        <!-- Category nav links -->
        <nav class="flex items-center gap-0.5 overflow-x-auto scrollbar-hide flex-1 min-w-0">
          <RouterLink
            v-for="cat in navCategories"
            :key="cat.label"
            :to="cat.to"
            class="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-[var(--color-text-2)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-2)] transition whitespace-nowrap shrink-0"
            active-class="bg-orange-500/10 text-orange-600"
          >
            <i :class="cat.icon + ' text-[11px]'"></i>
            {{ cat.label }}
          </RouterLink>
        </nav>

        <!-- Search bar — hidden at top, slides in on scroll -->
        <Transition name="header-search">
          <div v-show="searchVisible" class="relative shrink-0 w-64 lg:w-80" ref="searchWrap">
            <div class="relative flex items-center">
              <div class="absolute left-0 pl-3 flex items-center gap-2 z-10">
                <select
                  v-model="searchCategory"
                  class="hidden sm:block text-xs font-medium bg-transparent border-r border-[var(--color-border)] pr-2 mr-1 focus:outline-none text-[var(--color-text-2)] cursor-pointer"
                >
                  <option value="">All</option>
                  <option v-for="cat in productStore.categoryNames.filter(c => c !== 'All')" :key="cat" :value="cat">{{ cat }}</option>
                </select>
              </div>
              <input
                v-model="searchQ"
                @keyup.enter="doSearch"
                @focus="showSuggestions = true"
                @blur="hideSuggestions"
                type="text"
                placeholder="Search…"
                class="w-full pl-4 sm:pl-14 pr-10 py-2 rounded-xl text-xs input-field"
              />
              <button
                @click="doSearch"
                class="absolute right-1.5 top-1/2 -translate-y-1/2 btn-primary py-1.5 px-2.5 text-xs rounded-lg"
              >
                <i class="fa-sharp fa-solid fa-search"></i>
              </button>
            </div>

            <!-- Suggestions dropdown -->
            <Transition name="fade">
              <div
                v-if="showSuggestions && searchQ.length > 1"
                class="absolute top-full mt-2 w-96 card shadow-lg z-50 py-2 animate-slide-in-up max-h-80 overflow-y-auto right-0"
              >
                <div
                  v-for="s in suggestions" :key="s.id"
                  class="px-3 py-2 hover:bg-[var(--color-surface-2)] cursor-pointer flex items-center gap-3 transition"
                  @mousedown="selectSuggestion(s.name)"
                >
                  <img :src="s.image" :alt="s.name"
                    class="w-9 h-9 rounded-lg object-cover shrink-0 bg-[var(--color-surface-2)]"
                    onerror="this.src='https://placehold.co/36x36/f97316/fff?text=?'" />
                  <div class="flex-1 min-w-0">
                    <p class="text-sm font-medium leading-snug truncate">{{ s.name }}</p>
                    <p class="text-xs text-[var(--color-text-muted)] truncate">{{ s.category }} · {{ s.brand }}</p>
                  </div>
                  <span class="text-xs font-bold text-orange-500 shrink-0">৳{{ (s.salePrice ?? s.price).toLocaleString() }}</span>
                </div>
                <div v-if="!suggestions.length" class="px-4 py-3 text-sm text-[var(--color-text-muted)] flex items-center gap-2">
                  <i class="fa-sharp fa-regular fa-magnifying-glass opacity-50"></i>
                  No results for "{{ searchQ }}"
                </div>
                <div v-if="suggestions.length" class="border-t border-[var(--color-border)] mt-1 pt-1">
                  <button
                    @mousedown="doSearch"
                    class="w-full px-4 py-2 text-xs text-orange-500 font-semibold hover:bg-[var(--color-surface-2)] transition flex items-center justify-center gap-2"
                  >
                    <i class="fa-sharp fa-regular fa-magnifying-glass"></i>
                    View all results for "{{ searchQ }}"
                  </button>
                </div>
              </div>
            </Transition>
          </div>
        </Transition>

      </div>
      <!-- end Row 2 -->

      <!-- Mobile search bar drop-down — sm and below, shown on scroll -->
      <Transition name="slide">
        <div v-if="showMobileSearch && searchVisible" class="sm:hidden border-t border-[var(--color-border)] px-4 py-3">
          <div class="flex items-center gap-2 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl px-3 py-2 focus-within:border-[var(--color-brand)] focus-within:ring-2 focus-within:ring-orange-500/10 transition">
            <i class="fa-sharp fa-solid fa-magnifying-glass text-[var(--color-text-muted)] text-sm shrink-0"></i>
            <input
              v-model="searchQ"
              @keyup.enter="doSearch"
              @focus="showSuggestions = true"
              @blur="hideSuggestions"
              type="text"
              placeholder="Search products, brands…"
              class="flex-1 bg-transparent border-none outline-none text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-muted)]"
              autofocus
            />
            <button @click="doSearch" class="btn-primary py-1.5 px-3 text-xs rounded-lg shrink-0">
              Go
            </button>
          </div>
          <!-- Mobile suggestions -->
          <div
            v-if="showSuggestions && searchQ.length > 1 && suggestions.length"
            class="mt-2 card shadow-lg py-2 max-h-60 overflow-y-auto"
          >
            <div
              v-for="s in suggestions" :key="s.id"
              class="px-3 py-2 hover:bg-[var(--color-surface-2)] cursor-pointer flex items-center gap-3 transition"
              @mousedown="selectSuggestion(s.name); showMobileSearch = false"
            >
              <img :src="s.image" :alt="s.name" class="w-8 h-8 rounded-lg object-cover shrink-0 bg-[var(--color-surface-2)]" onerror="this.src='https://placehold.co/32x32/f97316/fff?text=?'" />
              <div class="flex-1 min-w-0">
                <p class="text-sm font-medium truncate">{{ s.name }}</p>
                <p class="text-xs text-[var(--color-text-muted)] truncate">{{ s.category }} · ৳{{ (s.salePrice ?? s.price).toLocaleString() }}</p>
              </div>
            </div>
          </div>
        </div>
      </Transition>

    </div>

    <!-- Mobile menu -->
    <Transition name="slide">
      <div v-if="showMobileMenu" class="lg:hidden border-t border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-4 space-y-1">
        <RouterLink v-for="cat in navCategories" :key="cat.label" :to="cat.to" @click="showMobileMenu = false"
          class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm hover:bg-[var(--color-surface-2)] transition"
          active-class="bg-orange-500/10 text-orange-600 font-medium"
        >
          <i :class="cat.icon + ' w-5 text-center text-[var(--color-brand)]'"></i>
          {{ cat.label }}
        </RouterLink>
      </div>
    </Transition>
  </header>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useThemeStore }    from '@/stores/useThemeStore'
import { useCartStore }     from '@/stores/useCartStore'
import { useAuthStore }     from '@/stores/useAuthStore'
import { useProductStore }  from '@/stores/useProductStore'
import { useWishlistStore } from '@/stores/useWishlistStore'

const router        = useRouter()
const themeStore    = useThemeStore()
const cartStore     = useCartStore()
const authStore     = useAuthStore()
const productStore  = useProductStore()
const wishlistStore = useWishlistStore()

const searchQ        = ref('')
const searchCategory = ref('')
const showSuggestions  = ref(false)
const showUserMenu     = ref(false)
const showMobileMenu   = ref(false)
const showMobileSearch = ref(false)
const scrolled         = ref(false)
const searchVisible    = ref(false)
const cartBounced      = ref(false)

const userMenu   = ref<HTMLElement | null>(null)

const navCategories = [
  { label: 'Home',          to: '/',                          icon: 'fa-sharp fa-solid fa-house' },
  { label: 'Electronics',   to: '/products?cat=Electronics',  icon: 'fa-sharp fa-solid fa-microchip' },
  { label: 'Fashion',       to: '/products?cat=Fashion',      icon: 'fa-sharp fa-solid fa-shirt' },
  { label: 'Grocery',       to: '/products?cat=Grocery',      icon: 'fa-sharp fa-solid fa-basket-shopping' },
  { label: 'Beauty',        to: '/products?cat=Beauty',       icon: 'fa-sharp fa-solid fa-pump-soap' },
  { label: 'Home & Living', to: '/products?cat=Home%20%26%20Living', icon: 'fa-sharp fa-solid fa-couch' },
  { label: 'Sports',        to: '/products?cat=Sports',       icon: 'fa-sharp fa-solid fa-dumbbell' },
  { label: 'Business',      to: '/products?cat=Business',     icon: 'fa-sharp fa-solid fa-briefcase' },
  { label: 'Books',         to: '/products?cat=Books',        icon: 'fa-sharp fa-solid fa-book-open' },
  { label: 'Deals',         to: '/deals',                     icon: 'fa-sharp fa-solid fa-fire' },
]

const suggestions = computed(() => {
  if (!searchQ.value.trim()) return []
  const q = searchQ.value.toLowerCase()
  return productStore.products
    .filter(p => {
      const catMatch = !searchCategory.value || p.category === searchCategory.value
      const textMatch =
        p.name.toLowerCase().includes(q) ||
        p.brand.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        p.tags.some(t => t.toLowerCase().includes(q))
      return catMatch && textMatch
    })
    .slice(0, 6)
    .map(p => ({
      id: p.id,
      name: p.name,
      brand: p.brand,
      category: p.category,
      price: p.price,
      salePrice: p.salePrice,
      image: p.images?.[0] ?? '',
      slug: p.slug,
    }))
})

function doSearch() {
  if (searchQ.value.trim()) {
    router.push({ path: '/products', query: { q: searchQ.value.trim(), cat: searchCategory.value || undefined } })
    showSuggestions.value = false
    showMobileMenu.value = false
  }
}

function selectSuggestion(name: string) {
  searchQ.value = name
  doSearch()
}

function hideSuggestions() {
  setTimeout(() => { showSuggestions.value = false }, 200)
}

// Scroll effect — search appears after scrolling past ~220px (below hero search bar)
function onScroll() {
  scrolled.value = window.scrollY > 10
  const wasVisible = searchVisible.value
  searchVisible.value = window.scrollY > 220
  // Auto-close mobile search drawer when scrolling back to top
  if (wasVisible && !searchVisible.value) showMobileSearch.value = false
}

// Close menus on outside click
function onClickOutside(e: MouseEvent) {
  if (userMenu.value && !userMenu.value.contains(e.target as Node)) {
    showUserMenu.value = false
  }
}

async function handleLogout() {
  showUserMenu.value = false
  await authStore.logout()  // clears stores + redirects to home
}

// Cart bounce animation on add
watch(() => cartStore.totalItems, () => {
  cartBounced.value = true
  setTimeout(() => { cartBounced.value = false }, 600)
})

onMounted(() => {
  window.addEventListener('scroll', onScroll)
  document.addEventListener('click', onClickOutside)
})
onUnmounted(() => {
  window.removeEventListener('scroll', onScroll)
  document.removeEventListener('click', onClickOutside)
})
</script>

<style scoped lang="scss">
.menu-item {
  @apply flex items-center gap-2.5 px-4 py-2.5 text-sm
         text-[var(--color-text-2)] hover:text-[var(--color-text)]
         hover:bg-[var(--color-surface-2)] transition cursor-pointer;
}

.fade-enter-active, .fade-leave-active { transition: opacity 0.15s ease, transform 0.15s ease; }
.fade-enter-from { opacity: 0; transform: translateY(-4px); }
.fade-leave-to   { opacity: 0; transform: translateY(-4px); }

.slide-enter-active, .slide-leave-active { transition: max-height 0.3s ease, opacity 0.3s ease; overflow: hidden; }
.slide-enter-from { max-height: 0; opacity: 0; }
.slide-enter-to   { max-height: 600px; opacity: 1; }
.slide-leave-from { max-height: 600px; opacity: 1; }
.slide-leave-to   { max-height: 0; opacity: 0; }

// Header search bar slide-in from top
.header-search-enter-active {
  transition: opacity 0.25s ease, transform 0.25s ease, max-width 0.25s ease;
}
.header-search-leave-active {
  transition: opacity 0.18s ease, transform 0.18s ease, max-width 0.18s ease;
}
.header-search-enter-from {
  opacity: 0;
  transform: translateY(-8px) scaleY(0.85);
  max-width: 0;
}
.header-search-leave-to {
  opacity: 0;
  transform: translateY(-8px) scaleY(0.85);
  max-width: 0;
}
</style>
