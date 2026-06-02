import { defineStore } from 'pinia'
import { ref } from 'vue'

const API = 'http://localhost:4000/api/user'

function authHeaders(userId: string): HeadersInit {
  return { 'Content-Type': 'application/json', 'x-user-id': userId }
}

export const useWishlistStore = defineStore('wishlist', () => {
  // Anonymous visitors start with an empty in-memory wishlist (no localStorage read).
  const isLoggedIn = () => !!localStorage.getItem('sb-user')

  const ids = ref<string[]>(
    isLoggedIn() ? (JSON.parse(localStorage.getItem('sb-wishlist') ?? '[]')) : []
  )

  function toggle(id: string) {
    const idx = ids.value.indexOf(id)
    if (idx === -1) ids.value.push(id)
    else ids.value.splice(idx, 1)
    persist()
  }

  function has(id: string) {
    return ids.value.includes(id)
  }

  /**
   * Persist to localStorage + server only when logged in.
   * Anonymous users are in-memory only (pinia).
   */
  function persist(userId?: string) {
    const uid = userId ?? JSON.parse(localStorage.getItem('sb-user') ?? 'null')?.id
    if (!uid) return // anonymous — stay in-memory only
    localStorage.setItem('sb-wishlist', JSON.stringify(ids.value))
    fetch(`${API}/wishlist`, {
      method: 'POST',
      headers: authHeaders(uid),
      body: JSON.stringify({ wishlist: ids.value }),
    }).catch(() => { /* silent — offline fallback */ })
  }

  /**
   * Called right after login.
   * Visitor's pinia wishlist + server's saved wishlist are unioned.
   */
  async function syncOnLogin(userId: string) {
    try {
      const res = await fetch(`${API}/wishlist`, { headers: authHeaders(userId) })
      const serverIds: string[] = res.ok ? (await res.json()).wishlist ?? [] : []
      // Union: keep everything from both visitor session and past server saves
      ids.value = Array.from(new Set([...ids.value, ...serverIds]))
    } catch { /* keep visitor's items */ }

    persist(userId)
  }

  /**
   * Called on logout: zero everything out.
   */
  function clearLocal() {
    ids.value = []
    localStorage.removeItem('sb-wishlist')
  }

  return { ids, toggle, has, syncOnLogin, clearLocal }
})
