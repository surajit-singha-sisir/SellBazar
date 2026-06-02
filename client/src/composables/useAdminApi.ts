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

  // ── Canvas compress helper (used only for legacy base64 cleanup on edit load) ─
  // Resizes to ≤ 1200px and re-encodes as JPEG 0.78 quality.
  function compressImageSrc(src: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.crossOrigin = 'anonymous'
      img.onload = () => {
        const MAX = 1200
        let w = img.naturalWidth, h = img.naturalHeight
        if (w > MAX || h > MAX) {
          if (w >= h) { h = Math.round((h / w) * MAX); w = MAX }
          else        { w = Math.round((w / h) * MAX); h = MAX }
        }
        const canvas = document.createElement('canvas')
        canvas.width = w; canvas.height = h
        canvas.getContext('2d')!.drawImage(img, 0, 0, w, h)
        resolve(canvas.toDataURL('image/jpeg', 0.78))
      }
      img.onerror = () => reject(new Error('Could not load image for compression'))
      img.src = src
    })
  }

  // ── Image Upload → Cloudinary CDN (returns a real https:// URL) ──────────
  // Requires two Vite env vars (set in .env.local / Vercel dashboard):
  //   VITE_CLOUDINARY_CLOUD_NAME   – your Cloudinary cloud name
  //   VITE_CLOUDINARY_UPLOAD_PRESET – an *unsigned* upload preset
  async function uploadImage(file: File): Promise<{ url: string; filename: string }> {
    if (!file.type.startsWith('image/')) throw new Error('Only image files are supported')
    if (file.size > 20 * 1024 * 1024)   throw new Error('Image must be smaller than 20 MB')

    const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME as string | undefined
    const preset    = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET as string | undefined

    if (!cloudName || !preset || cloudName === 'your_cloud_name') {
      throw new Error(
        'Cloudinary is not configured.\n' +
        'Add VITE_CLOUDINARY_CLOUD_NAME and VITE_CLOUDINARY_UPLOAD_PRESET to your .env.local file ' +
        '(or Vercel Environment Variables) then restart the dev server.\n' +
        'See client/.env.example for instructions.'
      )
    }

    const formData = new FormData()
    formData.append('file', file)
    formData.append('upload_preset', preset)
    formData.append('folder', 'sellbazar/products')

    const res = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      { method: 'POST', body: formData }
    )

    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err?.error?.message ?? `Cloudinary upload failed (HTTP ${res.status})`)
    }

    const data = await res.json()
    // Use the secure_url (https) returned by Cloudinary
    return { url: data.secure_url as string, filename: file.name }
  }

  // ── Compress legacy base64 data URLs in an images array ──────────────────
  // Called on edit-product load so any oversized base64 images stored before
  // the Cloudinary migration are recompressed before a re-save.
  // Real https:// URLs (Cloudinary, Unsplash, etc.) are passed through as-is.
  async function compressImages(images: string[]): Promise<string[]> {
    return Promise.all(
      images.map(async url => {
        if (!url.startsWith('data:')) return url          // real URL — keep as-is
        const kb = Math.round((url.length * 0.75) / 1024)
        if (kb <= 250) return url                         // already small enough
        try { return await compressImageSrc(url) }
        catch { return url }
      })
    )
  }

  // ── Payload guard before every save ──────────────────────────────────────
  // Safety net: drop any base64 blob that is still > 500 KB after compression.
  // With Cloudinary configured this should never trigger; it only fires when
  // someone pastes an old base64 URL that couldn't be recompressed.
  const LIMIT_BYTES = 500 * 1024
  function sanitiseImages(images: string[]): string[] {
    if (!images?.length) return images
    return images.filter(url => {
      if (!url.startsWith('data:')) return true          // real URL — always keep
      const bytes = Math.ceil(url.length * 0.75)
      if (bytes > LIMIT_BYTES) {
        console.warn(`[SellBazar] Dropped oversized base64 image (${Math.round(bytes / 1024)} KB) — configure Cloudinary to avoid this`)
        return false
      }
      return true
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
    uploadImage, compressImages,
    fetchOrders, updateOrder, deleteOrder,
    fetchCustomers,
    fetchHealth,
  }
}
