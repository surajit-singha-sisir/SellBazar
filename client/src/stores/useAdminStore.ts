import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useAdminApi, type ApiProduct, type ApiOrder, type AdminUser } from '@/composables/useAdminApi'

export const useAdminStore = defineStore('admin', () => {
  const api = useAdminApi()

  // ── Auth state ───────────────────────────────────────────────────────────────
  const adminUser = ref<AdminUser | null>(
    JSON.parse(localStorage.getItem('sb-admin-user') ?? 'null')
  )
  const isAdminLoggedIn = computed(() => adminUser.value !== null)

  async function adminLogin(email: string, password: string) {
    const res = await api.adminLogin(email, password)
    localStorage.setItem('sb-admin-token', res.token)
    localStorage.setItem('sb-admin-user', JSON.stringify(res.admin))
    adminUser.value = res.admin
    return res
  }

  function adminLogout() {
    adminUser.value = null
    localStorage.removeItem('sb-admin-token')
    localStorage.removeItem('sb-admin-user')
    products.value = []
    orders.value = []
  }

  // ── Data state ───────────────────────────────────────────────────────────────
  const products     = ref<ApiProduct[]>([])
  const orders       = ref<ApiOrder[]>([])
  const serverOnline = ref<boolean | null>(null)
  const loading      = ref({ products: false, orders: false, health: false, saving: false })
  const error        = ref<string | null>(null)

  // ── Derived stats ────────────────────────────────────────────────────────────
  const totalRevenue = computed(() =>
    orders.value.filter(o => o.status === 'delivered').reduce((s, o) => s + o.total, 0)
  )
  const pendingOrders = computed(() =>
    orders.value.filter(o => ['pending', 'processing'].includes(o.status)).length
  )
  const lowStock = computed(() =>
    products.value.filter(p => p.stock < 25).length
  )
  const categoryBreakdown = computed(() => {
    const map: Record<string, number> = {}
    products.value.forEach(p => { map[p.category] = (map[p.category] ?? 0) + 1 })
    return Object.entries(map).map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
  })
  const revenueByStatus = computed(() => {
    const statuses = ['delivered', 'shipped', 'processing', 'pending', 'cancelled'] as const
    return statuses.map(status => ({
      status,
      total: orders.value.filter(o => o.status === status).reduce((s, o) => s + o.total, 0),
      count: orders.value.filter(o => o.status === status).length,
    }))
  })

  // ── Load actions ─────────────────────────────────────────────────────────────
  async function loadAll() {
    await Promise.all([loadProducts(), loadOrders(), checkHealth()])
  }

  async function loadProducts() {
    loading.value.products = true
    error.value = null
    try {
      const res = await api.fetchProducts()
      products.value = res.data
    } catch (e: any) {
      error.value = e.message
      products.value = []
    } finally { loading.value.products = false }
  }

  async function loadOrders() {
    loading.value.orders = true
    try {
      const res = await api.fetchOrders()
      orders.value = res.data
    } catch { orders.value = [] }
    finally { loading.value.orders = false }
  }

  async function checkHealth() {
    loading.value.health = true
    try {
      await api.fetchHealth()
      serverOnline.value = true
    } catch { serverOnline.value = false }
    finally { loading.value.health = false }
  }

  // ── CRUD actions ─────────────────────────────────────────────────────────────
  async function createProduct(data: Partial<ApiProduct>) {
    loading.value.saving = true
    try {
      const created = await api.createProduct(data)
      products.value.unshift(created)
      return created
    } finally { loading.value.saving = false }
  }

  async function updateProduct(id: string, data: Partial<ApiProduct>) {
    loading.value.saving = true
    try {
      const updated = await api.updateProduct(id, data)
      const idx = products.value.findIndex(p => p.id === id)
      if (idx !== -1) products.value[idx] = updated
      return updated
    } finally { loading.value.saving = false }
  }

  async function deleteProduct(id: string) {
    loading.value.saving = true
    try {
      await api.deleteProduct(id)
      products.value = products.value.filter(p => p.id !== id)
    } finally { loading.value.saving = false }
  }

  return {
    // auth
    adminUser, isAdminLoggedIn, adminLogin, adminLogout,
    // data
    products, orders, serverOnline, loading, error,
    // stats
    totalRevenue, pendingOrders, lowStock, categoryBreakdown, revenueByStatus,
    // actions
    loadAll, loadProducts, loadOrders, checkHealth,
    createProduct, updateProduct, deleteProduct,
  }
})
