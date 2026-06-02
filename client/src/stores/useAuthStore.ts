import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import type { User } from '@/types'

export const useAuthStore = defineStore('auth', () => {
  const router = useRouter()

  const user = ref<User | null>(
    JSON.parse(localStorage.getItem('sb-user') ?? 'null')
  )

  const isLoggedIn = computed(() => user.value !== null)
  const initials   = computed(() =>
    user.value?.name?.split(' ').map(n => n[0]).join('').toUpperCase() ?? ''
  )

  /**
   * Called after a successful login API response.
   * Persists the user, then syncs cart & wishlist from the server.
   */
  async function login(u: User) {
    user.value = u
    localStorage.setItem('sb-user', JSON.stringify(u))

    // Lazy-import stores to avoid circular dependency at module load time
    const { useCartStore }     = await import('./useCartStore')
    const { useWishlistStore } = await import('./useWishlistStore')
    const cartStore     = useCartStore()
    const wishlistStore = useWishlistStore()

    await Promise.allSettled([
      cartStore.syncOnLogin(u.id),
      wishlistStore.syncOnLogin(u.id),
    ])
  }

  /**
   * Logout:
   *  1. Clears all user-specific local data (cart, wishlist, user record)
   *  2. Resets store state in memory
   *  3. Redirects to home page
   */
  async function logout() {
    // Lazy-import stores
    const { useCartStore }     = await import('./useCartStore')
    const { useWishlistStore } = await import('./useWishlistStore')
    const cartStore     = useCartStore()
    const wishlistStore = useWishlistStore()

    // 1. Wipe in-memory state
    cartStore.clearLocal()
    wishlistStore.clearLocal()

    // 2. Wipe auth
    user.value = null
    localStorage.removeItem('sb-user')

    // 3. Go home
    router.push({ name: 'home' })
  }

  return { user, isLoggedIn, initials, login, logout }
})
