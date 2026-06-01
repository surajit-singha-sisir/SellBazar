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
      <div class="flex items-center gap-4 h-16">

        <!-- Logo -->
        <RouterLink to="/" class="flex items-center gap-2.5 shrink-0 group">
          <div class="w-9 h-9 rounded-xl bg-gradient-to-br from-orange-500 to-fuchsia-600 flex items-center justify-center shadow-[0_4px_12px_rgba(249,115,22,0.4)] group-hover:scale-105 transition-transform">
            <i class="fa-sharp fa-solid fa-store text-white text-sm"></i>
          </div>
          <div class="font-display font-extrabold text-xl leading-none">
            <span class="gradient-text">Sell</span><span class="text-[var(--color-text)]">Bazar</span>
          </div>
        </RouterLink>

        <!-- Location picker (desktop) -->
        <button class="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-[var(--color-surface-2)] transition text-sm shrink-0">
          <i class="fa-sharp fa-regular fa-location-dot text-orange-500"></i>
          <span class="text-[var(--color-text-muted)] text-xs">Deliver to</span>
          <span class="font-semibold text-[var(--color-text)] text-xs">Dhaka</span>
          <i class="fa-sharp fa-solid fa-chevron-down text-[var(--color-text-muted)] text-[10px]"></i>
        </button>

        <!-- Search bar -->
        <div class="flex-1 max-w-2xl relative" ref="searchWrap">
          <div class="relative flex items-center">
            <div class="absolute left-0 pl-3 flex items-center gap-2 z-10">
              <!-- Category dropdown -->
              <select
                v-model="searchCategory"
                class="hidden sm:block text-xs font-medium bg-transparent border-r border-[var(--color-border)] pr-2 mr-1 focus:outline-none text-[var(--color-text-2)] cursor-pointer"
              >
                <option value="">All</option>
                <option v-for="cat in productStore.categories" :key="cat" :value="cat">{{ cat }}</option>
              </select>
              <i class="fa-sharp fa-regular fa-magnifying-glass text-[var(--color-text-muted)] text-sm"></i>
            </div>
            <input
              v-model="searchQ"
              @keyup.enter="doSearch"
              @focus="showSuggestions = true"
              @blur="hideSuggestions"
              type="text"
              placeholder="Search products, brands, categories..."
              class="w-full pl-10 sm:pl-28 pr-14 py-2.5 rounded-xl text-sm input-field"
            />
            <button
              @click="doSearch"
              class="absolute right-1.5 top-1/2 -translate-y-1/2 btn-primary py-1.5 px-3 text-xs rounded-lg"
            >
              <i class="fa-sharp fa-solid fa-search"></i>
            </button>
          </div>

          <!-- Search suggestions -->
          <Transition name="fade">
            <div
              v-if="showSuggestions && searchQ.length > 1"
              class="absolute top-full mt-2 w-full card shadow-lg z-50 py-2 animate-slide-in-up"
            >
              <div
                v-for="s in suggestions"
                :key="s"
                class="px-4 py-2.5 hover:bg-[var(--color-surface-2)] cursor-pointer text-sm flex items-center gap-3 transition"
                @mousedown="selectSuggestion(s)"
              >
                <i class="fa-sharp fa-regular fa-clock-rotate-left text-[var(--color-text-muted)] text-xs"></i>
                {{ s }}
              </div>
              <div v-if="!suggestions.length" class="px-4 py-3 text-sm text-[var(--color-text-muted)]">
                No suggestions found
              </div>
            </div>
          </Transition>
        </div>

        <!-- Right actions -->
        <div class="flex items-center gap-1.5 shrink-0">

          <!-- Theme toggle -->
          <button
            @click="themeStore.toggle()"
            class="btn-icon hidden sm:flex"
            :title="themeStore.isDark ? 'Light mode' : 'Dark mode'"
          >
            <i :class="themeStore.isDark ? 'fa-sharp fa-solid fa-sun text-yellow-400' : 'fa-sharp fa-regular fa-moon text-slate-500'"></i>
          </button>

          <!-- Wishlist -->
          <RouterLink to="/account/wishlist" class="btn-icon hidden sm:flex relative">
            <i class="fa-sharp fa-regular fa-heart"></i>
            <span v-if="wishlistStore.ids.length" class="absolute -top-1 -right-1 w-4 h-4 bg-pink-500 text-white rounded-full text-[10px] flex items-center justify-center font-bold">
              {{ wishlistStore.ids.length }}
            </span>
          </RouterLink>

          <!-- Cart -->
          <button @click="cartStore.isOpen = true" class="btn-icon relative" :class="{ 'animate-cart-bounce': cartBounced }">
            <i class="fa-sharp fa-regular fa-cart-shopping"></i>
            <span
              v-if="cartStore.totalItems > 0"
              class="absolute -top-1 -right-1 w-5 h-5 bg-orange-500 text-white rounded-full text-[10px] flex items-center justify-center font-bold shadow-[0_0_8px_rgba(249,115,22,0.6)]"
            >
              {{ cartStore.totalItems > 99 ? '99+' : cartStore.totalItems }}
            </span>
          </button>

          <!-- User menu -->
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
                  <button @click="authStore.logout(); showUserMenu = false" class="menu-item text-red-500 w-full">
                    <i class="fa-sharp fa-regular fa-arrow-right-from-bracket"></i> Logout
                  </button>
                </template>
                <template v-else>
                  <RouterLink to="/login"    class="menu-item" @click="showUserMenu = false"><i class="fa-sharp fa-regular fa-right-to-bracket"></i> Login</RouterLink>
                  <RouterLink to="/register" class="menu-item" @click="showUserMenu = false"><i class="fa-sharp fa-regular fa-user-plus"></i> Register</RouterLink>
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

      <!-- Category nav (desktop) -->
      <nav class="hidden lg:flex items-center gap-1 pb-2 overflow-x-auto scrollbar-hide">
        <RouterLink
          v-for="cat in navCategories"
          :key="cat.label"
          :to="cat.to"
          class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-[var(--color-text-2)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-2)] transition whitespace-nowrap"
          active-class="bg-orange-500/10 text-orange-600"
        >
          <i :class="cat.icon + ' text-[11px]'"></i>
          {{ cat.label }}
        </RouterLink>
      </nav>
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
        <div class="divider my-2"></div>
        <button @click="themeStore.toggle(); showMobileMenu = false" class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm hover:bg-[var(--color-surface-2)] transition w-full">
          <i :class="themeStore.isDark ? 'fa-sharp fa-solid fa-sun text-yellow-400' : 'fa-sharp fa-regular fa-moon'"></i>
          {{ themeStore.isDark ? 'Light Mode' : 'Dark Mode' }}
        </button>
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
const showSuggestions = ref(false)
const showUserMenu    = ref(false)
const showMobileMenu  = ref(false)
const scrolled        = ref(false)
const cartBounced     = ref(false)

const searchWrap = ref<HTMLElement | null>(null)
const userMenu   = ref<HTMLElement | null>(null)

const navCategories = [
  { label: 'Home',          to: '/',                          icon: 'fa-sharp fa-solid fa-house' },
  { label: 'Electronics',   to: '/products?cat=Electronics',  icon: 'fa-sharp fa-solid fa-microchip' },
  { label: 'Fashion',       to: '/products?cat=Fashion',      icon: 'fa-sharp fa-solid fa-shirt' },
  { label: 'Grocery',       to: '/products?cat=Grocery',      icon: 'fa-sharp fa-solid fa-basket-shopping' },
  { label: 'Beauty',        to: '/products?cat=Beauty',       icon: 'fa-sharp fa-solid fa-pump-soap' },
  { label: 'Home & Living', to: '/products?cat=Home',         icon: 'fa-sharp fa-solid fa-couch' },
  { label: 'Sports',        to: '/products?cat=Sports',       icon: 'fa-sharp fa-solid fa-dumbbell' },
  { label: 'Business',      to: '/products?cat=Business',     icon: 'fa-sharp fa-solid fa-briefcase' },
  { label: 'Books',         to: '/products?cat=Books',        icon: 'fa-sharp fa-solid fa-book-open' },
  { label: 'Deals',         to: '/deals',                     icon: 'fa-sharp fa-solid fa-fire' },
]

const suggestions = computed(() => {
  if (!searchQ.value) return []
  const q = searchQ.value.toLowerCase()
  return productStore.products
    .filter(p => p.name.toLowerCase().includes(q))
    .slice(0, 5)
    .map(p => p.name)
})

function doSearch() {
  if (searchQ.value.trim()) {
    router.push({ path: '/products', query: { q: searchQ.value, cat: searchCategory.value || undefined } })
    showSuggestions.value = false
    showMobileMenu.value = false
  }
}

function selectSuggestion(s: string) {
  searchQ.value = s
  doSearch()
}

function hideSuggestions() {
  setTimeout(() => { showSuggestions.value = false }, 200)
}

// Scroll effect
function onScroll() { scrolled.value = window.scrollY > 10 }

// Close menus on outside click
function onClickOutside(e: MouseEvent) {
  if (userMenu.value && !userMenu.value.contains(e.target as Node)) {
    showUserMenu.value = false
  }
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
</style>
