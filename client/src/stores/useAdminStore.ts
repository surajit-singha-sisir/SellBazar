import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useAdminApi, type ApiProduct, type ApiOrder, type ApiCustomer, type DashboardStats, type AdminUser } from '@/composables/useAdminApi'
import { useNotificationStore } from '@/stores/useNotificationStore'
import { useProductStore } from '@/stores/useProductStore'

export const useAdminStore = defineStore('admin', () => {
  const api = useAdminApi()
  const notifStore = useNotificationStore()

  // Track known order IDs to detect truly new orders
  const knownOrderIds = ref<Set<string>>(new Set())
  let initialLoadDone = false

  // ── Auth state ────────────────────────────────────────────────────────────
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
    customers.value = []
    dashboard.value = null
  }

  // ── Data state ────────────────────────────────────────────────────────────
  const products     = ref<ApiProduct[]>([])
  const orders       = ref<ApiOrder[]>([])
  const customers    = ref<ApiCustomer[]>([])
  const dashboard    = ref<DashboardStats | null>(null)
  const serverOnline = ref<boolean | null>(null)
  const loading      = ref({ products: false, orders: false, customers: false, dashboard: false, health: false, saving: false })
  const error        = ref<string | null>(null)

  // ── Derived stats (fallback when dashboard not loaded) ────────────────────
  const totalRevenue = computed(() =>
    dashboard.value?.totalRevenue ??
    orders.value.filter(o => o.paymentStatus === 'paid').reduce((s, o) => s + o.total, 0)
  )
  const pendingOrders = computed(() =>
    dashboard.value?.pendingOrders ??
    orders.value.filter(o => ['pending', 'processing'].includes(o.status)).length
  )
  const lowStock = computed(() =>
    dashboard.value?.lowStockCount ??
    products.value.filter(p => p.stock < 25).length
  )
  const categoryBreakdown = computed(() => {
    if (dashboard.value?.categoryBreakdown) return dashboard.value.categoryBreakdown
    const map: Record<string, number> = {}
    products.value.forEach(p => { map[p.category] = (map[p.category] ?? 0) + 1 })
    return Object.entries(map).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count)
  })
  const revenueByStatus = computed(() => {
    if (dashboard.value?.revenueByStatus) return dashboard.value.revenueByStatus
    const statuses = ['delivered', 'shipped', 'processing', 'pending', 'cancelled'] as const
    return statuses.map(status => ({
      status,
      total: orders.value.filter(o => o.status === status).reduce((s, o) => s + o.total, 0),
      count: orders.value.filter(o => o.status === status).length,
    }))
  })

  // ── Load actions ──────────────────────────────────────────────────────────
  async function loadAll() {
    await Promise.all([loadProducts(), loadOrders(), checkHealth(), loadDashboard()])
  }

  async function loadDashboard() {
    loading.value.dashboard = true
    try {
      dashboard.value = await api.fetchDashboard()
    } catch { /* fallback to computed */ }
    finally { loading.value.dashboard = false }
  }

  async function loadProducts() {
    loading.value.products = true
    error.value = null
    try {
      const res = await api.fetchProducts()
      products.value = res.data
      // ── Keep public store in sync after every full reload ─────────────────
      const productStore = useProductStore()
      productStore.products = res.data as any
    } catch (e: any) {
      error.value = e.message
      products.value = []
    } finally { loading.value.products = false }
  }

  async function loadOrders() {
    loading.value.orders = true
    try {
      const res = await api.fetchOrders()
      const fetched: ApiOrder[] = res.data

      if (initialLoadDone) {
        // Detect brand-new orders (IDs we haven't seen before)
        const newOrders = fetched.filter(o => !knownOrderIds.value.has(o.id))
        newOrders.forEach(o => {
          notifStore.push({
            type: 'new_order',
            title: 'New Order Received!',
            message: `Order #${o.id} — ৳${o.total.toLocaleString()} from ${o.customer?.name ?? 'Customer'}`,
            orderId: o.id,
          })
        })
      }

      // Update known IDs
      fetched.forEach(o => knownOrderIds.value.add(o.id))
      initialLoadDone = true
      orders.value = fetched
    } catch { orders.value = [] }
    finally { loading.value.orders = false }
  }

  async function loadCustomers() {
    loading.value.customers = true
    try {
      const res = await api.fetchCustomers()
      customers.value = res.data
    } catch { customers.value = [] }
    finally { loading.value.customers = false }
  }

  async function checkHealth() {
    loading.value.health = true
    try {
      await api.fetchHealth()
      serverOnline.value = true
    } catch { serverOnline.value = false }
    finally { loading.value.health = false }
  }

  // ── Product CRUD ──────────────────────────────────────────────────────────
  async function createProduct(data: Partial<ApiProduct>) {
    loading.value.saving = true
    try {
      const created = await api.createProduct(data)
      // Update admin store list
      products.value.unshift(created)
      // ── Sync public product store with the server-returned object ─────────
      // Use the created object (which has the server-assigned id + slug) so
      // the store link and ProductDetailView resolve correctly.
      const productStore = useProductStore()
      productStore.products.unshift(created as any)
      return created
    } finally { loading.value.saving = false }
  }

  async function updateProduct(id: string, data: Partial<ApiProduct>) {
    loading.value.saving = true
    try {
      const updated = await api.updateProduct(id, data)
      // Update admin store
      const idx = products.value.findIndex(p => p.id === id)
      if (idx !== -1) products.value[idx] = updated
      // ── Sync public product store ─────────────────────────────────────────
      const productStore = useProductStore()
      const pidx = productStore.products.findIndex((p: any) => p.id === id)
      if (pidx !== -1) productStore.products[pidx] = updated as any
      return updated
    } finally { loading.value.saving = false }
  }

  async function deleteProduct(id: string) {
    loading.value.saving = true
    try {
      await api.deleteProduct(id)
      // Update admin store
      products.value = products.value.filter(p => p.id !== id)
      // ── Sync public product store ─────────────────────────────────────────
      const productStore = useProductStore()
      productStore.products = productStore.products.filter((p: any) => p.id !== id)
    } finally { loading.value.saving = false }
  }

  // ── Order CRUD ────────────────────────────────────────────────────────────
  async function updateOrder(id: string, data: Partial<ApiOrder>) {
    loading.value.saving = true
    try {
      const updated = await api.updateOrder(id, data)
      const idx = orders.value.findIndex(o => o.id === id)
      if (idx !== -1) orders.value[idx] = updated
      return updated
    } finally { loading.value.saving = false }
  }

  async function deleteOrder(id: string) {
    loading.value.saving = true
    try {
      await api.deleteOrder(id)
      orders.value = orders.value.filter(o => o.id !== id)
    } finally { loading.value.saving = false }
  }

  // ── Image upload ──────────────────────────────────────────────────────────
  async function uploadImage(file: File) {
    return api.uploadImage(file)
  }

  return {
    // auth
    adminUser, isAdminLoggedIn, adminLogin, adminLogout,
    // data
    products, orders, customers, dashboard, serverOnline, loading, error,
    // stats
    totalRevenue, pendingOrders, lowStock, categoryBreakdown, revenueByStatus,
    // actions
    loadAll, loadDashboard, loadProducts, loadOrders, loadCustomers, checkHealth,
    createProduct, updateProduct, deleteProduct,
    updateOrder, deleteOrder,
    uploadImage,
  }
})
