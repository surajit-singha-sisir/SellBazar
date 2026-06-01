import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { CartItem, Product } from '@/types'

export const useCartStore = defineStore('cart', () => {
  const items = ref<CartItem[]>(
    JSON.parse(localStorage.getItem('sb-cart') ?? '[]')
  )
  const isOpen = ref(false)

  const totalItems  = computed(() => items.value.reduce((s, i) => s + i.quantity, 0))
  const totalPrice  = computed(() => items.value.reduce((s, i) => s + i.price * i.quantity, 0))
  const saleTotal   = computed(() => items.value.reduce((s, i) => s + (i.salePrice ?? i.price) * i.quantity, 0))
  const savings     = computed(() => totalPrice.value - saleTotal.value)

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

  function persist() {
    localStorage.setItem('sb-cart', JSON.stringify(items.value))
  }

  return { items, isOpen, totalItems, totalPrice, saleTotal, savings, add, remove, updateQty, clear }
})
