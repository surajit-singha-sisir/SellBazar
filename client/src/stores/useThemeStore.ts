import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

// Apply theme immediately on script parse (prevent FOUC)
const stored = localStorage.getItem('sb-theme')
// Default to light if no preference set
const initialDark = stored !== null ? stored === 'dark' : false
document.documentElement.classList.toggle('dark', initialDark)

export const useThemeStore = defineStore('theme', () => {
  const isDark = ref<boolean>(initialDark)

  function toggle() {
    isDark.value = !isDark.value
  }

  function setDark(val: boolean) {
    isDark.value = val
  }

  watch(isDark, (val) => {
    localStorage.setItem('sb-theme', val ? 'dark' : 'light')
    document.documentElement.classList.toggle('dark', val)
  })

  return { isDark, toggle, setDark }
})
