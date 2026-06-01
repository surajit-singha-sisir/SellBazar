import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useWishlistStore = defineStore('wishlist', () => {
  const ids = ref<string[]>(
    JSON.parse(localStorage.getItem('sb-wishlist') ?? '[]')
  )

  function toggle(id: string) {
    const idx = ids.value.indexOf(id)
    if (idx === -1) ids.value.push(id)
    else ids.value.splice(idx, 1)
    localStorage.setItem('sb-wishlist', JSON.stringify(ids.value))
  }

  function has(id: string) {
    return ids.value.includes(id)
  }

  return { ids, toggle, has }
})
