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
  // Reviews
  totalReviews: number
  pendingReviews: number
  approvedReviews: number
  reviewAvgRating: number
  recentReviews: Array<{
    id: string; productSlug: string; productName?: string
    userName: string; userEmail: string; rating: number
    title: string; body: string; status: string
    helpful: number; createdAt: string
  }>
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
  // Always bypass Vercel edge cache for API calls — products/orders change dynamically
  headers['Cache-Control'] = 'no-cache'
  const res = await fetch(`${BASE}${path}`, { ...options, headers, cache: 'no-store' })
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

  // ── Image compression → WebP conversion (Canvas API, zero dependencies) ──
  //
  // Pipeline for every uploaded file:
  //   original File  →  resize to ≤ MAX_PX on longest side
  //                  →  encode as WebP at WEBP_QUALITY
  //                  →  if browser lacks WebP support, fall back to JPEG
  //                  →  return a Blob ready for multipart upload
  //
  // Typical output: a 1200px product photo goes from 2–5 MB → 80–200 KB WebP.
  const MAX_PX       = 1920   // longest side in pixels (keeps crisp detail)
  const WEBP_QUALITY = 0.82   // 0–1; 0.82 gives excellent quality/size balance

  function compressToWebP(file: File): Promise<Blob> {
    return new Promise((resolve, reject) => {
      const objectUrl = URL.createObjectURL(file)
      const img = new Image()

      img.onload = () => {
        URL.revokeObjectURL(objectUrl)

        // ── Calculate new dimensions, preserving aspect ratio ──────────────
        let { naturalWidth: w, naturalHeight: h } = img
        if (w > MAX_PX || h > MAX_PX) {
          if (w >= h) { h = Math.round((h / w) * MAX_PX); w = MAX_PX }
          else        { w = Math.round((w / h) * MAX_PX); h = MAX_PX }
        }

        const canvas = document.createElement('canvas')
        canvas.width  = w
        canvas.height = h
        const ctx = canvas.getContext('2d')!

        // White background so transparent PNGs don't become black in WebP
        ctx.fillStyle = '#ffffff'
        ctx.fillRect(0, 0, w, h)
        ctx.drawImage(img, 0, 0, w, h)

        // ── Try WebP first, fall back to JPEG if browser doesn't support it ─
        canvas.toBlob(
          blob => {
            if (blob) return resolve(blob)
            // WebP not supported (very old Safari) — try JPEG
            canvas.toBlob(
              jpegBlob => {
                if (jpegBlob) return resolve(jpegBlob)
                reject(new Error('Canvas toBlob failed'))
              },
              'image/jpeg',
              WEBP_QUALITY
            )
          },
          'image/webp',
          WEBP_QUALITY
        )
      }

      img.onerror = () => {
        URL.revokeObjectURL(objectUrl)
        reject(new Error('Could not load image for compression'))
      }

      img.src = objectUrl
    })
  }

  // ── ImgBB Image Upload ────────────────────────────────────────────────────
  //
  // Full pipeline:
  //   File  →  compressToWebP()  →  POST to ImgBB  →  returns https:// URL
  //
  // The URL stored in form.images[] is always a short i.ibb.co CDN link —
  // never a base64 blob — so the JSON payload sent to the backend stays tiny.
  //
  // ImgBB raw limit: 32 MB — we enforce 25 MB on the *original* file as a
  // safety margin (the compressed WebP will be far smaller anyway).
  const IMGBB_API_KEY = 'f3c12080238055cf04e5a657a47ee058'

  async function uploadImage(file: File): Promise<{ url: string; filename: string }> {
    if (!file.type.startsWith('image/')) throw new Error('Only image files are supported')
    if (file.size > 25 * 1024 * 1024)   throw new Error('Image must be smaller than 25 MB')

    // Step 1 — compress & convert to WebP
    const compressed = await compressToWebP(file)

    // Step 2 — build multipart payload
    const baseName = file.name.replace(/\.[^.]+$/, '')   // strip extension
    const webpFile = new File([compressed], `${baseName}.webp`, { type: compressed.type })

    const formData = new FormData()
    formData.append('image', webpFile)
    formData.append('name', baseName)

    // Step 3 — upload to ImgBB
    const res = await fetch(
      `https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`,
      { method: 'POST', body: formData }
    )

    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err?.error?.message ?? `ImgBB upload failed (HTTP ${res.status})`)
    }

    const json = await res.json()
    if (!json.success) throw new Error('ImgBB upload was not successful')

    // display_url → full-resolution CDN image (i.ibb.co/…)
    return { url: json.data.display_url as string, filename: `${baseName}.webp` }
  }

  // ── Compress legacy base64 data URLs on edit-product load ─────────────────
  // Products saved before the ImgBB migration may have base64 in images[].
  // Recompress them (still as JPEG for simplicity) so the next save doesn't 413.
  // Real https:// URLs are passed through untouched.
  function compressLegacyDataUrl(src: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.onload = () => {
        let { naturalWidth: w, naturalHeight: h } = img
        if (w > MAX_PX || h > MAX_PX) {
          if (w >= h) { h = Math.round((h / w) * MAX_PX); w = MAX_PX }
          else        { w = Math.round((w / h) * MAX_PX); h = MAX_PX }
        }
        const canvas = document.createElement('canvas')
        canvas.width = w; canvas.height = h
        canvas.getContext('2d')!.drawImage(img, 0, 0, w, h)
        resolve(canvas.toDataURL('image/jpeg', WEBP_QUALITY))
      }
      img.onerror = () => reject(new Error('Could not load image for compression'))
      img.src = src
    })
  }

  async function compressImages(images: string[]): Promise<string[]> {
    return Promise.all(
      images.map(async url => {
        if (!url.startsWith('data:')) return url               // real URL — keep as-is
        const kb = Math.round((url.length * 0.75) / 1024)
        if (kb <= 250) return url                              // already small enough
        try { return await compressLegacyDataUrl(url) }
        catch { return url }                                   // best-effort
      })
    )
  }

  // ── Payload guard before every save ──────────────────────────────────────
  // Last-resort: drop any base64 still > 500 KB that slipped through above.
  // With ImgBB active this should never fire for new uploads.
  const LIMIT_BYTES = 500 * 1024
  function sanitiseImages(images: string[]): string[] {
    if (!images?.length) return images
    return images.filter(url => {
      if (!url.startsWith('data:')) return true
      const bytes = Math.ceil(url.length * 0.75)
      if (bytes > LIMIT_BYTES) {
        console.warn(`[SellBazar] Dropped oversized base64 image (${Math.round(bytes / 1024)} KB)`)
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
    request,
  }
}
