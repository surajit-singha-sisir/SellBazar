import { Router } from 'express'
import multer from 'multer'
import { existsSync, mkdirSync } from 'fs'
import { join, extname } from 'path'
import { randomBytes } from 'crypto'
import { requireAdmin } from '../middleware/auth.js'
import { products } from './products.js'
import ordersRouter from './orders.js'

const router = Router()

// ── Upload setup ─────────────────────────────────────────────────────────────
const UPLOAD_DIR = join(process.cwd(), 'uploads')
if (!existsSync(UPLOAD_DIR)) mkdirSync(UPLOAD_DIR, { recursive: true })

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const ext = extname(file.originalname).toLowerCase() || '.jpg'
    cb(null, randomBytes(12).toString('hex') + ext)
  },
})
const upload = multer({
  storage,
  limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true)
    else cb(new Error('Only image files allowed'))
  },
})

// ── POST /api/admin/upload ───────────────────────────────────────────────────
router.post('/upload', requireAdmin, upload.single('image'), (req: any, res) => {
  if (!req.file) return res.status(400).json({ error: 'No image file provided' })
  res.json({ url: `/uploads/${req.file.filename}`, filename: req.file.filename })
})

// ── GET /api/admin/dashboard ─────────────────────────────────────────────────
router.get('/dashboard', requireAdmin, (req: any, res) => {
  // Pull orders from the orders module via a temporary import trick
  // We pass orders from req context set by index.ts
  const orders: any[] = req.app.locals.orders ?? []

  const now = new Date()
  const thisMonth = now.getMonth()
  const thisYear  = now.getFullYear()
  const lastMonth = thisMonth === 0 ? 11 : thisMonth - 1
  const lastMonthYear = thisMonth === 0 ? thisYear - 1 : thisYear

  function inMonth(dateStr: string, month: number, year: number) {
    const d = new Date(dateStr)
    return d.getMonth() === month && d.getFullYear() === year
  }

  const paidOrders   = orders.filter(o => o.paymentStatus === 'paid')
  const deliveredOrders = orders.filter(o => o.status === 'delivered')

  const totalRevenue     = paidOrders.reduce((s: number, o: any) => s + o.total, 0)
  const thisMonthRevenue = paidOrders.filter(o => inMonth(o.createdAt, thisMonth, thisYear))
                            .reduce((s: number, o: any) => s + o.total, 0)
  const lastMonthRevenue = paidOrders.filter(o => inMonth(o.createdAt, lastMonth, lastMonthYear))
                            .reduce((s: number, o: any) => s + o.total, 0)
  const revenueGrowth    = lastMonthRevenue > 0
    ? ((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100
    : 0

  const statusCounts = orders.reduce((acc: any, o: any) => {
    acc[o.status] = (acc[o.status] ?? 0) + 1
    return acc
  }, {})

  const totalProducts  = products.length
  const lowStockCount  = products.filter((p: any) => p.stock < 25).length
  const outOfStock     = products.filter((p: any) => p.stock === 0).length
  const avgRating      = products.length
    ? (products.reduce((s: number, p: any) => s + p.rating, 0) / products.length).toFixed(2)
    : 0

  // Unique customers derived from orders
  const uniqueCustomers = [...new Set(orders.map((o: any) => o.customer?.email).filter(Boolean))].length

  // Revenue by day — last 7 days
  const last7: { date: string; revenue: number; orders: number }[] = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now)
    d.setDate(d.getDate() - i)
    const dateStr = d.toISOString().slice(0, 10)
    const dayOrders = orders.filter((o: any) => o.createdAt.slice(0, 10) === dateStr)
    last7.push({
      date: dateStr,
      revenue: dayOrders.filter((o: any) => o.paymentStatus === 'paid').reduce((s: number, o: any) => s + o.total, 0),
      orders: dayOrders.length,
    })
  }

  // Revenue by status
  const revenueByStatus = ['pending','processing','shipped','delivered','cancelled'].map(status => ({
    status,
    total: orders.filter((o: any) => o.status === status).reduce((s: number, o: any) => s + o.total, 0),
    count: orders.filter((o: any) => o.status === status).length,
  }))

  // Category breakdown
  const catMap: Record<string, number> = {}
  products.forEach((p: any) => { catMap[p.category] = (catMap[p.category] ?? 0) + 1 })
  const categoryBreakdown = Object.entries(catMap)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)

  // Top products by revenue
  const productRevMap: Record<string, number> = {}
  orders.forEach((o: any) => {
    o.items?.forEach((item: any) => {
      const pid = item.productId ?? item.name
      productRevMap[pid] = (productRevMap[pid] ?? 0) + item.price * item.quantity
    })
  })

  // Recent orders (last 5)
  const recentOrders = [...orders]
    .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5)

  res.json({
    totalRevenue, thisMonthRevenue, lastMonthRevenue, revenueGrowth: Number(revenueGrowth.toFixed(1)),
    totalOrders: orders.length, statusCounts, pendingOrders: (statusCounts['pending'] ?? 0) + (statusCounts['processing'] ?? 0),
    totalProducts, lowStockCount, outOfStock,
    avgRating: Number(avgRating), uniqueCustomers,
    last7Days: last7, revenueByStatus, categoryBreakdown, recentOrders,
  })
})

// ── GET /api/admin/customers ─────────────────────────────────────────────────
router.get('/customers', requireAdmin, (req: any, res) => {
  const orders: any[] = req.app.locals.orders ?? []

  const map: Record<string, any> = {}
  orders.forEach((o: any) => {
    const email = o.customer?.email ?? o.id
    if (!map[email]) {
      map[email] = {
        id: email,
        name: o.customer?.name ?? 'Unknown',
        email: o.customer?.email ?? '',
        phone: o.customer?.phone ?? '',
        address: o.customer?.address ?? '',
        orderCount: 0,
        totalSpent: 0,
        lastOrder: o.createdAt,
        firstOrder: o.createdAt,
        paymentMethod: o.paymentMethod,
        orders: [],
      }
    }
    map[email].orderCount++
    map[email].totalSpent += o.total
    if (o.createdAt > map[email].lastOrder)  map[email].lastOrder  = o.createdAt
    if (o.createdAt < map[email].firstOrder) map[email].firstOrder = o.createdAt
    map[email].orders.push(o.id)
  })

  const customers = Object.values(map).sort((a: any, b: any) => b.totalSpent - a.totalSpent)
  res.json({ data: customers, total: customers.length })
})

export default router
