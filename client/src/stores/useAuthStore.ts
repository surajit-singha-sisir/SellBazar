import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { User } from '@/types'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(
    JSON.parse(localStorage.getItem('sb-user') ?? 'null')
  )

  const isLoggedIn = computed(() => user.value !== null)
  const initials   = computed(() => user.value?.name?.split(' ').map(n => n[0]).join('').toUpperCase() ?? '')

  function login(u: User) {
    user.value = u
    localStorage.setItem('sb-user', JSON.stringify(u))
  }

  function logout() {
    user.value = null
    localStorage.removeItem('sb-user')
  }

  return { user, isLoggedIn, initials, login, logout }
})
