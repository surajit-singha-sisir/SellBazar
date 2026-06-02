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

  // Vercel hard limit is 4.5 MB per request body.  Base64 adds ~33 % overhead,
  // so we budget 3 MB of raw data URL bytes → safely under 4 MB on the wire.
  // Images that are still large data URLs (e.g. uploaded before the canvas
  // compression fix) are stripped and replaced with a placeholder so the save
  // never 413s.  Newly uploaded images are always compressed to ≤ ~200 KB each.
  const BODY_BUDGET_BYTES = 3 * 1024 * 1024          // 3 MB raw budget
  const PLACEHOLDER = 'https://placehold.co/800x800/f97316/fff?text=Image'

  function sanitiseImages(images: string[]): string[] {
    if (!images?.length) return images
    let budget = BODY_BUDGET_BYTES
    return images.map(url => {
      if (!url.startsWith('data:')) return url   // external URL — keep as-is
      const bytes = Math.ceil(url.length * 0.75)  // approx decoded bytes
      if (bytes > budget) {
        console.warn(`[SellBazar] Image stripped from payload (${Math.round(bytes/1024)} KB, budget exhausted). Re-upload to compress it.`)
        return PLACEHOLDER
      }
      budget -= bytes
      return url
    })
  }

  async function createProduct(data: Partial<ApiProduct>) {
    const payload = { ...data, images: sanitiseImages(data.images ?? []) }
    return request<ApiProduct>('/products', { method: 'POST', body: JSON.stringify(payload) })
  }

  async function updateProduct(id: string, data: Partial<ApiProduct>) {
    const payload = { ...data, images: sanitiseImages(data.images ?? []) }
    return request<ApiProduct>(`/products/${id}`, { method: 'PUT', body: JSON.stringify(payload) })
  }

  async function deleteProduct(id: string) {
    return request<{ message: string; id: string }>(`/products/${id}`, { method: 'DELETE' })
  }

  // ── Image Upload ─────────────────────────────────────────────────────────────
  // Compresses + resizes the image entirely in the browser via <canvas> before
  // converting to a Base64 data URL.  This keeps each image under ~150 KB so
  // the product payload always stays well within Vercel's 4.5 MB body limit,
  // regardless of the original file size.
  //
  //  Max output dimensions : 1200 × 1200 px (longest edge)
  //  Output format         : image/jpeg, quality 0.78
  //  Typical output size   : 60–150 KB  (≈ 80–200 KB as Base64)
  async function uploadImage(file: File): Promise<{ url: string; filename: string }> {
    if (!file.type.startsWith('image/')) {
      throw new Error('Only image files are supported')
    }
    if (file.size > 20 * 1024 * 1024) {
      throw new Error('Image must be smaller than 20 MB')
    }

    return new Promise((resolve, reject) => {
      const img = new Image()
      const objectUrl = URL.createObjectURL(file)

      img.onload = () => {
        URL.revokeObjectURL(objectUrl)

        // ── resize so longest edge ≤ 1200 px ──────────────────────────────
        const MAX = 1200
        let { naturalWidth: w, naturalHeight: h } = img
        if (w > MAX || h > MAX) {
          if (w >= h) { h = Math.round((h / w) * MAX); w = MAX }
          else        { w = Math.round((w / h) * MAX); h = MAX }
        }

        const canvas = document.createElement('canvas')
        canvas.width  = w
        canvas.height = h
        const ctx = canvas.getContext('2d')!
        ctx.drawImage(img, 0, 0, w, h)

        // ── encode as JPEG at quality 0.78 ────────────────────────────────
        const dataUrl = canvas.toDataURL('image/jpeg', 0.78)
        resolve({ url: dataUrl, filename: file.name.replace(/\.[^.]+$/, '.jpg') })
      }

      img.onerror = () => {
        URL.revokeObjectURL(objectUrl)
        reject(new Error('Failed to decode image file'))
      }

      img.src = objectUrl
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
