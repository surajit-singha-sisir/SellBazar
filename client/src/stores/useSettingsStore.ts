import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

const STORAGE_KEY = 'sb-admin-settings'

export interface AdminSettings {
  storeName: string
  storeUrl: string
  supportEmail: string
  currency: string
  timezone: string
  autoRefresh: boolean
  autoRefreshInterval: number   // seconds
  sidebarDefault: 'expanded' | 'collapsed'
  brandColor: string
  notifyOrders: boolean
  notifyStock: boolean
  notifyDaily: boolean
}

const DEFAULTS: AdminSettings = {
  storeName: 'SellBazar',
  storeUrl: 'https://sellbazar.com',
  supportEmail: 'support@sellbazar.com',
  currency: 'BDT',
  timezone: 'Asia/Dhaka',
  autoRefresh: false,
  autoRefreshInterval: 60,
  sidebarDefault: 'expanded',
  brandColor: '#f97316',
  notifyOrders: true,
  notifyStock: true,
  notifyDaily: false,
}

function load(): AdminSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return { ...DEFAULTS, ...JSON.parse(raw) }
  } catch { /* ignore */ }
  return { ...DEFAULTS }
}

export const useSettingsStore = defineStore('settings', () => {
  const settings = ref<AdminSettings>(load())

  // Persist every change to localStorage automatically
  watch(settings, (val) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(val))
    applyBrandColor(val.brandColor)
  }, { deep: true })

  function applyBrandColor(color: string) {
    document.documentElement.style.setProperty('--brand', color)
    document.documentElement.style.setProperty('--brand-dim', color + '33')
  }

  function save(patch: Partial<AdminSettings>) {
    settings.value = { ...settings.value, ...patch }
  }

  function reset() {
    settings.value = { ...DEFAULTS }
  }

  // Apply brand color immediately on store init
  applyBrandColor(settings.value.brandColor)

  return { settings, save, reset, applyBrandColor }
})
