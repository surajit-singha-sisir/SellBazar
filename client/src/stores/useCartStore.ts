import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { CartItem, Product } from '@/types'

const API = '/api/user'

function authHeaders(userId: string): HeadersInit {
  return { 'Content-Type': 'application/json', 'x-user-id': userId }
}

export const useCartStore = defineStore('cart', () => {
  // On init: load from localStorage only if a user is already logged in.
  // Anonymous visitors start with an empty in-memory cart (no localStorage read).
  const isLoggedIn = () => !!localStorage.getItem('sb-user')

  const items = ref<CartItem[]>(
    isLoggedIn() ? (JSON.parse(localStorage.getItem('sb-cart') ?? '[]')) : []
  )
  const isOpen = ref(false)

  const totalItems = computed(() => items.value.reduce((s, i) => s + i.quantity, 0))
  const totalPrice = computed(() => items.value.reduce((s, i) => s + i.price * i.quantity, 0))
  const saleTotal  = computed(() => items.value.reduce((s, i) => s + (i.salePrice ?? i.price) * i.quantity, 0))
  const savings    = computed(() => totalPrice.value - saleTotal.value)

  function add(product: Product, qty = 1) {
    const existing = items.value.find(i => i.id === product.id)
    if (existing) existing.quantity += qty
    else items.value.push({ ...product, quantity: qty })
    persist()
    isOpen.value = true
  }

  function remove(id: string) {
    items.value = items.value.filter(i => i.id !== id)
    persist()
  }

  function updateQty(id: string, qty: number) {
    const item = items.value.find(i => i.id === id)
    if (item) {
      if (qty <= 0) remove(id)
      else { item.quantity = qty; persist() }
    }
  }

  function clear() {
    items.value = []
    persist()
  }

  /**
   * Persist to localStorage + server only when logged in.
   * Anonymous users are in-memory only (pinia).
   */
  function persist(userId?: string) {
    const uid = userId ?? JSON.parse(localStorage.getItem('sb-user') ?? 'null')?.id
    if (!uid) return // anonymous — stay in-memory only
    localStorage.setItem('sb-cart', JSON.stringify(items.value))
    fetch(`${API}/cart`, {
      method: 'POST',
      headers: authHeaders(uid),
      body: JSON.stringify({ cart: items.value }),
    }).catch(() => { /* silent — offline fallback */ })
  }

  /**
   * Called right after login.
   * Strategy: visitor's local pinia items are authoritative (they just picked them).
   * Merge with whatever the server had from past sessions (server items fill in
   * anything the visitor didn't already have), then push the merged result back.
   */
  async function syncOnLogin(userId: string) {
    try {
      const res = await fetch(`${API}/cart`, { headers: authHeaders(userId) })
      const serverItems: CartItem[] = res.ok ? (await res.json()).cart ?? [] : []

      // Visitor's current pinia items win; server fills in items not already present
      const merged = [...items.value]
      for (const s of serverItems) {
        if (!merged.find(m => m.id === s.id)) merged.push(s)
      }
      items.value = merged
    } catch { /* network unavailable — keep visitor's items */ }

    // Now persist the merged result to localStorage + server
    persist(userId)
  }

  /**
   * Called on logout: zero everything out.
   * Anonymous visitor will start fresh (no localStorage).
   */
  function clearLocal() {
    items.value = []
    localStorage.removeItem('sb-cart')
  }

  return { items, isOpen, totalItems, totalPrice, saleTotal, savings, add, remove, updateQty, clear, syncOnLogin, clearLocal }
})
