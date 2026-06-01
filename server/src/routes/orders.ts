import { Router } from 'express'
import { requireAdmin } from '../middleware/auth.js'

const router = Router()

// ── Realistic seed orders ─────────────────────────────────────────────────────
let orders = [
  {
    id: 'SB-240001',
    customer: { name: 'Rahim Uddin', email: 'rahim.uddin@gmail.com', phone: '01711-234567', address: 'House 12, Road 5, Dhanmondi, Dhaka' },
    items: [
      { productId: '1', name: 'Samsung Galaxy A55 5G', quantity: 1, price: 39999, image: 'https://placehold.co/60x60/f97316/fff?text=A55' }
    ],
    subtotal: 39999, shipping: 80, total: 40079,
    status: 'delivered', paymentMethod: 'bkash', paymentStatus: 'paid',
    notes: '', trackingNumber: 'SA-TRK-78234',
    createdAt: '2027-01-05T08:30:00Z', updatedAt: '2027-01-07T14:00:00Z'
  },
  {
    id: 'SB-240002',
    customer: { name: 'Fatema Begum', email: 'fatema.b@yahoo.com', phone: '01812-345678', address: 'Apt 4B, Bashundhara R/A, Dhaka' },
    items: [
      { productId: '4', name: 'Jamdani Muslin Saree', quantity: 2, price: 7200, image: 'https://placehold.co/60x60/ec4899/fff?text=Saree' }
    ],
    subtotal: 14400, shipping: 120, total: 14520,
    status: 'shipped', paymentMethod: 'cod', paymentStatus: 'pending',
    notes: 'Please wrap carefully', trackingNumber: 'SA-TRK-78299',
    createdAt: '2027-01-10T11:15:00Z', updatedAt: '2027-01-11T09:00:00Z'
  },
  {
    id: 'SB-240003',
    customer: { name: 'Karim Hossain', email: 'k.hossain@outlook.com', phone: '01955-456789', address: 'Village: Shibpur, Narsingdi' },
    items: [
      { productId: '7', name: 'PRAN Mango Juice 1L', quantity: 12, price: 99, image: 'https://placehold.co/60x60/fbbf24/fff?text=Juice' },
      { productId: '11', name: 'RFL Pressure Cooker 5L', quantity: 1, price: 1799, image: 'https://placehold.co/60x60/f59e0b/fff?text=RFL' }
    ],
    subtotal: 2987, shipping: 150, total: 3137,
    status: 'processing', paymentMethod: 'nagad', paymentStatus: 'paid',
    notes: '', trackingNumber: '',
    createdAt: '2027-01-15T06:45:00Z', updatedAt: '2027-01-15T08:00:00Z'
  },
  {
    id: 'SB-240004',
    customer: { name: 'Sumaiya Akter', email: 'sumaiya.akter@gmail.com', phone: '01676-567890', address: 'Holding 8, GEC Circle, Chittagong' },
    items: [
      { productId: '8', name: 'Lenovo IdeaPad Slim 5', quantity: 1, price: 84999, image: 'https://placehold.co/60x60/0ea5e9/fff?text=Lenovo' }
    ],
    subtotal: 84999, shipping: 200, total: 85199,
    status: 'pending', paymentMethod: 'bkash', paymentStatus: 'paid',
    notes: 'Call before delivery', trackingNumber: '',
    createdAt: '2027-01-18T13:20:00Z', updatedAt: '2027-01-18T13:20:00Z'
  },
  {
    id: 'SB-240005',
    customer: { name: 'Nasir Ahmed', email: 'nasir.a@proton.me', phone: '01517-678901', address: 'Plot 22, DOHS, Mirpur, Dhaka' },
    items: [
      { productId: '2', name: 'Nike Air Max 2027', quantity: 1, price: 9499, image: 'https://placehold.co/60x60/6366f1/fff?text=Nike' },
      { productId: '9', name: 'Aarong Cotton Kurta', quantity: 3, price: 2800, image: 'https://placehold.co/60x60/84cc16/fff?text=Kurta' }
    ],
    subtotal: 17899, shipping: 80, total: 17979,
    status: 'delivered', paymentMethod: 'rocket', paymentStatus: 'paid',
    notes: '', trackingNumber: 'SA-TRK-77891',
    createdAt: '2027-01-08T09:10:00Z', updatedAt: '2027-01-10T16:30:00Z'
  },
  {
    id: 'SB-240006',
    customer: { name: 'Nusrat Jahan', email: 'nusrat.jahan22@gmail.com', phone: '01399-789012', address: 'Road 3, Block D, Sylhet Sadar' },
    items: [
      { productId: '12', name: 'Meril Splash Body Wash', quantity: 4, price: 299, image: 'https://placehold.co/60x60/a78bfa/fff?text=Meril' }
    ],
    subtotal: 1196, shipping: 80, total: 1276,
    status: 'cancelled', paymentMethod: 'cod', paymentStatus: 'refunded',
    notes: 'Customer requested cancellation', trackingNumber: '',
    createdAt: '2027-01-12T17:00:00Z', updatedAt: '2027-01-13T10:00:00Z'
  },
  {
    id: 'SB-240007',
    customer: { name: 'Jamal Uddin', email: 'jamal.u@bd.net', phone: '01711-890123', address: 'Shahjalal Upashahar, Sylhet' },
    items: [
      { productId: '5', name: 'Xiaomi Redmi Note 13 Pro', quantity: 1, price: 29999, image: 'https://placehold.co/60x60/f97316/fff?text=Redmi' }
    ],
    subtotal: 29999, shipping: 80, total: 30079,
    status: 'pending', paymentMethod: 'bkash', paymentStatus: 'paid',
    notes: '', trackingNumber: '',
    createdAt: '2027-01-19T10:55:00Z', updatedAt: '2027-01-19T10:55:00Z'
  },
  {
    id: 'SB-240008',
    customer: { name: 'Rekha Das', email: 'rekha.das@gmail.com', phone: '01612-901234', address: 'Hospital Road, Rajshahi' },
    items: [
      { productId: '3', name: 'Walton Primo X7 Ultra', quantity: 1, price: 24999, image: 'https://placehold.co/60x60/10b981/fff?text=Walton' },
      { productId: '6', name: 'Smart QR POS Terminal', quantity: 1, price: 3800, image: 'https://placehold.co/60x60/8b5cf6/fff?text=POS' }
    ],
    subtotal: 28799, shipping: 150, total: 28949,
    status: 'processing', paymentMethod: 'bank_transfer', paymentStatus: 'paid',
    notes: 'Business address, contact Mr. Das', trackingNumber: '',
    createdAt: '2027-01-17T15:30:00Z', updatedAt: '2027-01-17T18:00:00Z'
  },
  {
    id: 'SB-240009',
    customer: { name: 'Arif Rahman', email: 'arif.r@gmail.com', phone: '01855-012345', address: 'New Market Area, Comilla' },
    items: [
      { productId: '10', name: 'Symphony Z55 Pro', quantity: 2, price: 15499, image: 'https://placehold.co/60x60/06b6d4/fff?text=Symphony' }
    ],
    subtotal: 30998, shipping: 120, total: 31118,
    status: 'shipped', paymentMethod: 'nagad', paymentStatus: 'paid',
    notes: '', trackingNumber: 'SA-TRK-78401',
    createdAt: '2027-01-14T12:00:00Z', updatedAt: '2027-01-16T09:00:00Z'
  },
  {
    id: 'SB-240010',
    customer: { name: 'Lailun Nahar', email: 'lailun.n@yahoo.com', phone: '01411-123456', address: 'Court Road, Mymensingh' },
    items: [
      { productId: '9', name: 'Aarong Cotton Kurta', quantity: 2, price: 2800, image: 'https://placehold.co/60x60/84cc16/fff?text=Kurta' },
      { productId: '12', name: 'Meril Splash Body Wash', quantity: 2, price: 299, image: 'https://placehold.co/60x60/a78bfa/fff?text=Meril' }
    ],
    subtotal: 6198, shipping: 100, total: 6298,
    status: 'delivered', paymentMethod: 'bkash', paymentStatus: 'paid',
    notes: '', trackingNumber: 'SA-TRK-78102',
    createdAt: '2027-01-03T07:00:00Z', updatedAt: '2027-01-05T11:00:00Z'
  },
]

// ── ADMIN routes (all protected) ──────────────────────────────────────────────

// GET /api/orders  — list all orders with optional filters
router.get('/', requireAdmin, (req, res) => {
  const { status, q, limit, page } = req.query as Record<string, string>
  let result = [...orders]

  if (status && status !== 'all') {
    result = result.filter(o => o.status === status)
  }
  if (q) {
    const lq = q.toLowerCase()
    result = result.filter(o =>
      o.id.toLowerCase().includes(lq) ||
      o.customer.name.toLowerCase().includes(lq) ||
      o.customer.email.toLowerCase().includes(lq) ||
      o.customer.phone.includes(lq)
    )
  }

  // Sort newest first
  result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

  const total = result.length
  const pageNum = parseInt(page ?? '1')
  const pageSize = parseInt(limit ?? '50')
  result = result.slice((pageNum - 1) * pageSize, pageNum * pageSize)

  res.json({ data: result, total, page: pageNum, pageSize })
})

// GET /api/orders/stats  — summary statistics for dashboard
router.get('/stats', requireAdmin, (req, res) => {
  const statusCounts = orders.reduce((acc, o) => {
    acc[o.status] = (acc[o.status] ?? 0) + 1
    return acc
  }, {} as Record<string, number>)

  const revenue = orders
    .filter(o => o.paymentStatus === 'paid')
    .reduce((sum, o) => sum + o.total, 0)

  res.json({
    total: orders.length,
    statusCounts,
    revenue,
    pending: statusCounts['pending'] ?? 0,
  })
})

// GET /api/orders/:id  — get single order
router.get('/:id', requireAdmin, (req, res) => {
  const order = orders.find(o => o.id === req.params.id)
  if (!order) return res.status(404).json({ error: 'Order not found' })
  res.json(order)
})

// POST /api/orders  — create order (public — storefront checkout)
// Note: storefront creates orders; only GET/PUT/DELETE are admin-only
router.post('/', (req, res) => {
  const { customer, items, subtotal, shipping, total, paymentMethod } = req.body
  if (!customer || !items?.length || !total) {
    return res.status(400).json({ error: 'customer, items, and total are required' })
  }
  const order = {
    id: `SB-${Date.now()}`,
    customer,
    items,
    subtotal: Number(subtotal ?? total),
    shipping: Number(shipping ?? 80),
    total: Number(total),
    status: 'pending' as const,
    paymentMethod: paymentMethod ?? 'cod',
    paymentStatus: 'pending',
    notes: req.body.notes ?? '',
    trackingNumber: '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
  orders.unshift(order)
  res.status(201).json(order)
})

// PUT /api/orders/:id  — update order status / details
router.put('/:id', requireAdmin, (req, res) => {
  const idx = orders.findIndex(o => o.id === req.params.id)
  if (idx === -1) return res.status(404).json({ error: 'Order not found' })
  const updated = {
    ...orders[idx],
    ...req.body,
    id: orders[idx].id,
    updatedAt: new Date().toISOString(),
  }
  orders[idx] = updated
  res.json(updated)
})

// DELETE /api/orders/:id  — delete order
router.delete('/:id', requireAdmin, (req, res) => {
  const idx = orders.findIndex(o => o.id === req.params.id)
  if (idx === -1) return res.status(404).json({ error: 'Order not found' })
  const [deleted] = orders.splice(idx, 1)
  res.json({ message: 'Order deleted', id: deleted.id })
})

export default router
