import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import type { User } from '@/types'

// Decode a JWT payload without a library (no signature verification — server validates on protected routes)
function parseJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const base64 = token.split('.')[1]
    if (!base64) return null
    const json = atob(base64.replace(/-/g, '+').replace(/_/g, '/'))
    return JSON.parse(json)
  } catch {
    return null
  }
}

function isTokenValid(token: string | null): boolean {
  if (!token) return false
  const payload = parseJwtPayload(token)
  if (!payload || typeof payload.exp !== 'number') return false
  return payload.exp * 1000 > Date.now()
}

// Restore session only if stored token is still valid
function restoreSession(): { user: User | null; token: string | null } {
  try {
    const token = localStorage.getItem('sb-token')
    const userStr = localStorage.getItem('sb-user')
    if (token && userStr && isTokenValid(token)) {
      return { user: JSON.parse(userStr), token }
    }
  } catch { /* ignore */ }
  // Clear any stale / tampered data
  localStorage.removeItem('sb-user')
  localStorage.removeItem('sb-token')
  return { user: null, token: null }
}

export const useAuthStore = defineStore('auth', () => {
  const router = useRouter()

  const { user: _restoredUser, token: _restoredToken } = restoreSession()

  const user  = ref<User | null>(_restoredUser)
  const token = ref<string | null>(_restoredToken)

  const isLoggedIn = computed(() => user.value !== null && isTokenValid(token.value))
  const initials   = computed(() =>
    user.value?.name?.split(' ').map(n => n[0]).join('').toUpperCase() ?? ''
  )

  /**
   * Called after a successful login API response.
   * Persists the user + token, then syncs cart & wishlist from the server.
   */
  async function login(u: User, jwt: string) {
    // Reject if the token is already expired (should never happen, but guard anyway)
    if (!isTokenValid(jwt)) {
      throw new Error('Received an invalid or expired token from server')
    }
    user.value  = u
    token.value = jwt
    localStorage.setItem('sb-user',  JSON.stringify(u))
    localStorage.setItem('sb-token', jwt)

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
   *  1. Clears all user-specific local data (cart, wishlist, user record, token)
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
    user.value  = null
    token.value = null
    localStorage.removeItem('sb-user')
    localStorage.removeItem('sb-token')

    // 3. Go home
    router.push({ name: 'home' })
  }

  return { user, token, isLoggedIn, initials, login, logout }
})
