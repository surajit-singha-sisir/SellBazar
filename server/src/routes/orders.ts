import { Router } from 'express'
import { requireAdmin } from '../middleware/auth.js'
import { redis, KEYS } from '../lib/redis.js'
import { broadcast } from './events.js'

const router = Router()

function daysAgo(n: number) {
  const d = new Date()
  d.setDate(d.getDate() - n)
  d.setHours(Math.floor(Math.random() * 14) + 6, Math.floor(Math.random() * 59), 0, 0)
  return d.toISOString()
}

// ── Seed data (used only on first run when Redis is empty) ───────────────────
const SEED_ORDERS = [
  { id:'SB-240001', customer:{name:'Rahim Uddin',email:'rahim.uddin@gmail.com',phone:'01711-234567',address:'House 12, Road 5, Dhanmondi, Dhaka'}, items:[{productId:'1',name:'Samsung Galaxy A55 5G',quantity:1,price:39999,image:'https://placehold.co/60x60/f97316/fff?text=A55'}], subtotal:39999,shipping:80,total:40079,status:'delivered',paymentMethod:'bkash',paymentStatus:'paid',notes:'',trackingNumber:'SA-TRK-78234',createdAt:daysAgo(5),updatedAt:daysAgo(3) },
  { id:'SB-240002', customer:{name:'Fatema Begum',email:'fatema.b@yahoo.com',phone:'01812-345678',address:'Apt 4B, Bashundhara R/A, Dhaka'}, items:[{productId:'4',name:'Jamdani Muslin Saree',quantity:2,price:7200,image:'https://placehold.co/60x60/ec4899/fff?text=Saree'}], subtotal:14400,shipping:120,total:14520,status:'shipped',paymentMethod:'cod',paymentStatus:'pending',notes:'Please wrap carefully',trackingNumber:'SA-TRK-78299',createdAt:daysAgo(3),updatedAt:daysAgo(2) },
  { id:'SB-240003', customer:{name:'Karim Hossain',email:'k.hossain@outlook.com',phone:'01955-456789',address:'Village: Shibpur, Narsingdi'}, items:[{productId:'7',name:'PRAN Mango Juice 1L',quantity:12,price:99,image:'https://placehold.co/60x60/fbbf24/fff?text=Juice'},{productId:'11',name:'RFL Pressure Cooker 5L',quantity:1,price:1799,image:'https://placehold.co/60x60/f59e0b/fff?text=RFL'}], subtotal:2987,shipping:150,total:3137,status:'processing',paymentMethod:'nagad',paymentStatus:'paid',notes:'',trackingNumber:'',createdAt:daysAgo(1),updatedAt:daysAgo(1) },
  { id:'SB-240004', customer:{name:'Sumaiya Akter',email:'sumaiya.akter@gmail.com',phone:'01676-567890',address:'Holding 8, GEC Circle, Chittagong'}, items:[{productId:'8',name:'Lenovo IdeaPad Slim 5',quantity:1,price:84999,image:'https://placehold.co/60x60/0ea5e9/fff?text=Lenovo'}], subtotal:84999,shipping:200,total:85199,status:'pending',paymentMethod:'bkash',paymentStatus:'paid',notes:'Call before delivery',trackingNumber:'',createdAt:daysAgo(0),updatedAt:daysAgo(0) },
  { id:'SB-240005', customer:{name:'Nasir Ahmed',email:'nasir.a@proton.me',phone:'01517-678901',address:'Plot 22, DOHS, Mirpur, Dhaka'}, items:[{productId:'2',name:'Nike Air Max 2027',quantity:1,price:9499,image:'https://placehold.co/60x60/6366f1/fff?text=Nike'},{productId:'9',name:'Aarong Cotton Kurta',quantity:3,price:2800,image:'https://placehold.co/60x60/84cc16/fff?text=Kurta'}], subtotal:17899,shipping:80,total:17979,status:'delivered',paymentMethod:'rocket',paymentStatus:'paid',notes:'',trackingNumber:'SA-TRK-77891',createdAt:daysAgo(4),updatedAt:daysAgo(2) },
  { id:'SB-240006', customer:{name:'Nusrat Jahan',email:'nusrat.jahan22@gmail.com',phone:'01399-789012',address:'Road 3, Block D, Sylhet Sadar'}, items:[{productId:'12',name:'Meril Splash Body Wash',quantity:4,price:299,image:'https://placehold.co/60x60/a78bfa/fff?text=Meril'}], subtotal:1196,shipping:80,total:1276,status:'cancelled',paymentMethod:'cod',paymentStatus:'refunded',notes:'Customer requested cancellation',trackingNumber:'',createdAt:daysAgo(6),updatedAt:daysAgo(5) },
  { id:'SB-240007', customer:{name:'Jamal Uddin',email:'jamal.u@bd.net',phone:'01711-890123',address:'Shahjalal Upashahar, Sylhet'}, items:[{productId:'5',name:'Xiaomi Redmi Note 13 Pro',quantity:1,price:29999,image:'https://placehold.co/60x60/f97316/fff?text=Redmi'}], subtotal:29999,shipping:80,total:30079,status:'pending',paymentMethod:'bkash',paymentStatus:'paid',notes:'',trackingNumber:'',createdAt:daysAgo(0),updatedAt:daysAgo(0) },
  { id:'SB-240008', customer:{name:'Rekha Das',email:'rekha.das@gmail.com',phone:'01612-901234',address:'Hospital Road, Rajshahi'}, items:[{productId:'3',name:'Walton Primo X7 Ultra',quantity:1,price:24999,image:'https://placehold.co/60x60/10b981/fff?text=Walton'},{productId:'6',name:'Smart QR POS Terminal',quantity:1,price:3800,image:'https://placehold.co/60x60/8b5cf6/fff?text=POS'}], subtotal:28799,shipping:150,total:28949,status:'delivered',paymentMethod:'bank_transfer',paymentStatus:'paid',notes:'Business address, contact Mr. Das',trackingNumber:'SA-TRK-78998',createdAt:daysAgo(2),updatedAt:daysAgo(1) },
  { id:'SB-240009', customer:{name:'Arif Rahman',email:'arif.r@gmail.com',phone:'01855-012345',address:'New Market Area, Comilla'}, items:[{productId:'10',name:'Symphony Z55 Pro',quantity:2,price:15499,image:'https://placehold.co/60x60/06b6d4/fff?text=Symphony'}], subtotal:30998,shipping:120,total:31118,status:'shipped',paymentMethod:'nagad',paymentStatus:'paid',notes:'',trackingNumber:'SA-TRK-78401',createdAt:daysAgo(3),updatedAt:daysAgo(1) },
  { id:'SB-240010', customer:{name:'Lailun Nahar',email:'lailun.n@yahoo.com',phone:'01411-123456',address:'Court Road, Mymensingh'}, items:[{productId:'9',name:'Aarong Cotton Kurta',quantity:2,price:2800,image:'https://placehold.co/60x60/84cc16/fff?text=Kurta'},{productId:'12',name:'Meril Splash Body Wash',quantity:2,price:299,image:'https://placehold.co/60x60/a78bfa/fff?text=Meril'}], subtotal:6198,shipping:100,total:6298,status:'delivered',paymentMethod:'bkash',paymentStatus:'paid',notes:'',trackingNumber:'SA-TRK-78102',createdAt:daysAgo(20),updatedAt:daysAgo(18) },
]

async function getOrders(): Promise<any[]> {
  // Use a dedicated seeded flag so an intentionally-empty list never re-seeds
  const seeded = await redis.get<string>(`${KEYS.seeded}:orders`)
  if (seeded) {
    return (await redis.get<any[]>(KEYS.orders)) ?? []
  }
  // First run — seed data into Redis and mark as seeded
  await redis.set(KEYS.orders, SEED_ORDERS)
  await redis.set(`${KEYS.seeded}:orders`, '1')
  return SEED_ORDERS
}

async function saveOrders(orders: any[]) {
  await redis.set(KEYS.orders, orders)
}

// ── Public: track by ID ───────────────────────────────────────────────────────
router.get('/by-id/:id', async (req, res) => {
  const orders = await getOrders()
  const order = orders.find((o: any) => o.id === req.params.id)
  if (!order) return res.status(404).json({ error: 'Order not found' })
  const { id, items, subtotal, shipping, total, status, paymentMethod, paymentStatus, trackingNumber, createdAt, updatedAt, customer } = order
  res.json({ id, items, subtotal, shipping, total, status, paymentMethod, paymentStatus, trackingNumber, createdAt, updatedAt, customer })
})

// ── Admin: list all orders ────────────────────────────────────────────────────
router.get('/', requireAdmin, async (req, res) => {
  const { status, q, limit, page } = req.query as Record<string, string>
  let result = await getOrders()
  if (status && status !== 'all') result = result.filter((o: any) => o.status === status)
  if (q) {
    const lq = q.toLowerCase()
    result = result.filter((o: any) =>
      o.id.toLowerCase().includes(lq) || o.customer.name.toLowerCase().includes(lq) ||
      o.customer.email.toLowerCase().includes(lq) || o.customer.phone.includes(lq)
    )
  }
  result.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  const total = result.length
  const pageNum = parseInt(page ?? '1')
  const pageSize = parseInt(limit ?? '50')
  result = result.slice((pageNum - 1) * pageSize, pageNum * pageSize)
  res.json({ data: result, total, page: pageNum, pageSize })
})

// ── Admin: stats ──────────────────────────────────────────────────────────────
router.get('/stats', requireAdmin, async (_req, res) => {
  const orders = await getOrders()
  const statusCounts = orders.reduce((acc: any, o: any) => { acc[o.status] = (acc[o.status] ?? 0) + 1; return acc }, {})
  const revenue = orders.filter((o: any) => o.paymentStatus === 'paid').reduce((sum: number, o: any) => sum + o.total, 0)
  res.json({ total: orders.length, statusCounts, revenue, pending: statusCounts['pending'] ?? 0 })
})

// ── Admin: get single order ───────────────────────────────────────────────────
router.get('/:id', requireAdmin, async (req, res) => {
  const orders = await getOrders()
  const order = orders.find((o: any) => o.id === req.params.id)
  if (!order) return res.status(404).json({ error: 'Order not found' })
  res.json(order)
})

// ── Public: create order (storefront checkout) ────────────────────────────────
router.post('/', async (req, res) => {
  const { customer, items, subtotal, shipping, total, paymentMethod } = req.body
  if (!customer || !items?.length || !total) return res.status(400).json({ error: 'customer, items, and total are required' })
  const order = {
    id: `SB-${Date.now()}`, customer, items,
    subtotal: Number(subtotal ?? total), shipping: Number(shipping ?? 0),
    discount: Number(req.body.discount ?? 0), couponCode: req.body.couponCode ?? null,
    total: Number(total), status: 'pending', paymentMethod: paymentMethod ?? 'cod',
    paymentStatus: 'pending', notes: req.body.notes ?? '', trackingNumber: '',
    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
  }
  const orders = await getOrders()
  orders.unshift(order)
  await saveOrders(orders)
  broadcast('orders_updated')
  res.status(201).json(order)
})

// ── Admin: update order ───────────────────────────────────────────────────────
router.put('/:id', requireAdmin, async (req, res) => {
  const orders = await getOrders()
  const idx = orders.findIndex((o: any) => o.id === req.params.id)
  if (idx === -1) return res.status(404).json({ error: 'Order not found' })
  orders[idx] = { ...orders[idx], ...req.body, id: orders[idx].id, updatedAt: new Date().toISOString() }
  await saveOrders(orders)
  broadcast('orders_updated')
  res.json(orders[idx])
})

// ── Admin: delete order ───────────────────────────────────────────────────────
router.delete('/:id', requireAdmin, async (req, res) => {
  const orders = await getOrders()
  const idx = orders.findIndex((o: any) => o.id === req.params.id)
  if (idx === -1) return res.status(404).json({ error: 'Order not found' })
  const [deleted] = orders.splice(idx, 1)
  await saveOrders(orders)
  broadcast('orders_updated')
  res.json({ message: 'Order deleted', id: deleted.id })
})

export default router
