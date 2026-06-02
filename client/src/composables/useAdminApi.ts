// composables/useAdminApi.ts
// Full CRUD admin API with JWT auth support

export interface ApiProduct {
  id: string; slug: string; name: string; nameBn: string
  description: string; price: number; salePrice: number
  images: string[]; category: string; subcategory?: string; categoryBn: string
  brand: string; stock: number; rating: number; reviewCount: number
  tags: string[]; isNew?: boolean; isFeatured?: boolean
  deliveryDays: number; seller: string; location: string
  createdAt: string
}

export interface ApiOrderItem {
  productId?: string
  name: string
  quantity: number
  price: number
  image?: string
}

export interface ApiOrderCustomer {
  name: string
  email: string
  phone: string
  address: string
}

export interface ApiOrder {
  id: string
  customer: ApiOrderCustomer
  items: ApiOrderItem[]
  subtotal: number
  shipping: number
  total: number
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
  paymentMethod: string
  paymentStatus: string
  notes: string
  trackingNumber: string
  createdAt: string
  updatedAt: string
}

export interface ApiCustomer {
  id: string
  name: string
  email: string
  phone: string
  address: string
  orderCount: number
  totalSpent: number
  lastOrder: string
  firstOrder: string
  paymentMethod: string
  orders: string[]
}

export interface DashboardStats {
  totalRevenue: number
  thisMonthRevenue: number
  lastMonthRevenue: number
  revenueGrowth: number
  totalOrders: number
  statusCounts: Record<string, number>
  pendingOrders: number
  totalProducts: number
  lowStockCount: number
  outOfStock: number
  avgRating: number
  uniqueCustomers: number
  last7Days: { date: string; revenue: number; orders: number }[]
  revenueByStatus: { status: string; total: number; count: number }[]
  categoryBreakdown: { name: string; count: number }[]
  recentOrders: ApiOrder[]
}

export interface AdminUser {
  id: string; email: string; role: string; name: string
}

const BASE = '/api'

function getToken(): string | null {
  return localStorage.getItem('sb-admin-token')
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken()
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string> ?? {}),
  }
  // Don't set Content-Type for FormData (browser sets it with boundary)
  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json'
  }
  if (token) headers['Authorization'] = `Bearer ${token}`
  const res = await fetch(`${BASE}${path}`, { ...options, headers })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }))
    throw new Error(err.error ?? `API error ${res.status}`)
  }
  return res.json()
}

export function useAdminApi() {
  // ── Auth ────────────────────────────────────────────────────────────────────
  async function adminLogin(email: string, password: string) {
    return request<{ token: string; admin: AdminUser }>('/admin/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })
  }
  async function adminMe() {
    return request<{ admin: AdminUser }>('/admin/me')
  }

  // ── Dashboard ───────────────────────────────────────────────────────────────
  async function fetchDashboard() {
    return request<DashboardStats>('/admin/dashboard')
  }

  // ── Categories ─────────────────────────────────────────────────────────────
  async function fetchCategories() {
    const res = await request<{ data?: any[]; [key: string]: any }>('/categories')
    return (res.data ?? res) as Array<{
      id: string; slug: string; name: string; nameBn: string; icon: string; color: string
      subcategories: Array<{ id: string; slug: string; name: string; nameBn: string; icon: string }>
    }>
  }

  // ── Products ────────────────────────────────────────────────────────────────
  async function fetchProducts(params?: { category?: string; q?: string; limit?: number }) {
    const qs = new URLSearchParams()
    if (params?.category) qs.set('category', params.category)
    if (params?.q)        qs.set('q', params.q)
    if (params?.limit)    qs.set('limit', String(params.limit))
    const query = qs.toString() ? `?${qs}` : ''
    return request<{ data: ApiProduct[]; total: number }>(`/products${query}`)
  }

  async function createProduct(data: Partial<ApiProduct>) {
    return request<ApiProduct>('/products', { method: 'POST', body: JSON.stringify(data) })
  }

  async function updateProduct(id: string, data: Partial<ApiProduct>) {
    return request<ApiProduct>(`/products/${id}`, { method: 'PUT', body: JSON.stringify(data) })
  }

  async function deleteProduct(id: string) {
    return request<{ message: string; id: string }>(`/products/${id}`, { method: 'DELETE' })
  }

  // ── Image Upload ─────────────────────────────────────────────────────────────
  // Converts the file to a Base64 data URL entirely on the client — no server
  // round-trip needed.  Vercel serverless has no persistent disk, so uploading
  // to the API would just return an empty URL anyway.
  async function uploadImage(file: File): Promise<{ url: string; filename: string }> {
    return new Promise((resolve, reject) => {
      if (!file.type.startsWith('image/')) {
        return reject(new Error('Only image files are supported'))
      }
      const MAX_BYTES = 8 * 1024 * 1024 // 8 MB guard
      if (file.size > MAX_BYTES) {
        return reject(new Error('Image must be smaller than 8 MB'))
      }
      const reader = new FileReader()
      reader.onload  = () => resolve({ url: reader.result as string, filename: file.name })
      reader.onerror = () => reject(new Error('Failed to read image file'))
      reader.readAsDataURL(file)
    })
  }

  // ── Orders ──────────────────────────────────────────────────────────────────
  async function fetchOrders(params?: { status?: string; q?: string; page?: number; limit?: number }) {
    const qs = new URLSearchParams()
    if (params?.status) qs.set('status', params.status)
    if (params?.q)      qs.set('q', params.q)
    if (params?.page)   qs.set('page', String(params.page))
    if (params?.limit)  qs.set('limit', String(params.limit))
    const query = qs.toString() ? `?${qs}` : ''
    return request<{ data: ApiOrder[]; total: number }>(`/orders${query}`)
  }

  async function updateOrder(id: string, data: Partial<ApiOrder>) {
    return request<ApiOrder>(`/orders/${id}`, { method: 'PUT', body: JSON.stringify(data) })
  }

  async function deleteOrder(id: string) {
    return request<{ message: string; id: string }>(`/orders/${id}`, { method: 'DELETE' })
  }

  // ── Customers ───────────────────────────────────────────────────────────────
  async function fetchCustomers() {
    return request<{ data: ApiCustomer[]; total: number }>('/admin/customers')
  }

  // ── Health ──────────────────────────────────────────────────────────────────
  async function fetchHealth() {
    return request<{ status: string; service: string; time: string }>('/health')
  }

  return {
    adminLogin, adminMe,
    fetchDashboard,
    fetchCategories,
    fetchProducts, createProduct, updateProduct, deleteProduct,
    uploadImage,
    fetchOrders, updateOrder, deleteOrder,
    fetchCustomers,
    fetchHealth,
  }
}
