import { Router } from 'express'
import multer from 'multer'
import { existsSync, mkdirSync } from 'fs'
import { join, extname } from 'path'
import { randomBytes } from 'crypto'
import { requireAdmin } from '../middleware/auth.js'
import { redis, KEYS } from '../lib/redis.js'
import { broadcast } from './events.js'

type User = { id: string; name: string; email: string; phone: string; division: string; password: string }

async function getUsers(): Promise<User[]> {
  return (await redis.get<User[]>(KEYS.users)) ?? []
}
async function saveUsers(users: User[]) {
  await redis.set(KEYS.users, users)
}

function normalizePhone(raw: string): string {
  const digits = raw.replace(/\D/g, '')
  if (digits.startsWith('880')) return '+' + digits
  if (digits.startsWith('0'))   return '+880' + digits.slice(1)
  return '+880' + digits
}

const router = Router()

// ── Helpers ───────────────────────────────────────────────────────────────────
async function getProducts() { return (await redis.get<any[]>(KEYS.products)) ?? [] }
async function getOrders()   { return (await redis.get<any[]>(KEYS.orders))   ?? [] }

// ── Upload setup ─────────────────────────────────────────────────────────────
const UPLOAD_DIR = join(process.env.VERCEL ? '/tmp' : process.cwd(), 'uploads')
try { if (!existsSync(UPLOAD_DIR)) mkdirSync(UPLOAD_DIR, { recursive: true }) } catch {}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const ext = extname(file.originalname).toLowerCase() || '.jpg'
    cb(null, randomBytes(12).toString('hex') + ext)
  },
})
const upload = multer({
  storage, limits: { fileSize: 8 * 1024 * 1024 },
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
router.get('/dashboard', requireAdmin, async (_req, res) => {
  const [products, orders] = await Promise.all([getProducts(), getOrders()])

  const now = new Date()
  const thisMonth = now.getMonth(), thisYear = now.getFullYear()
  const lastMonth = thisMonth === 0 ? 11 : thisMonth - 1
  const lastMonthYear = thisMonth === 0 ? thisYear - 1 : thisYear

  function inMonth(dateStr: string, month: number, year: number) {
    const d = new Date(dateStr)
    return d.getMonth() === month && d.getFullYear() === year
  }

  const paidOrders      = orders.filter((o: any) => o.paymentStatus === 'paid')
  const totalRevenue    = paidOrders.reduce((s: number, o: any) => s + o.total, 0)
  const thisMonthRev    = paidOrders.filter((o: any) => inMonth(o.createdAt, thisMonth, thisYear)).reduce((s: number, o: any) => s + o.total, 0)
  const lastMonthRev    = paidOrders.filter((o: any) => inMonth(o.createdAt, lastMonth, lastMonthYear)).reduce((s: number, o: any) => s + o.total, 0)
  const revenueGrowth   = lastMonthRev > 0 ? ((thisMonthRev - lastMonthRev) / lastMonthRev) * 100 : 0

  const statusCounts = orders.reduce((acc: any, o: any) => { acc[o.status] = (acc[o.status] ?? 0) + 1; return acc }, {})

  const totalProducts  = products.length
  const lowStockCount  = products.filter((p: any) => p.stock < 25).length
  const outOfStock     = products.filter((p: any) => p.stock === 0).length
  const avgRating      = products.length ? (products.reduce((s: number, p: any) => s + p.rating, 0) / products.length).toFixed(2) : 0
  const uniqueCustomers = [...new Set(orders.map((o: any) => o.customer?.email).filter(Boolean))].length

  const last7: { date: string; revenue: number; orders: number }[] = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now); d.setDate(d.getDate() - i)
    const dateStr = d.toISOString().slice(0, 10)
    const dayOrders = orders.filter((o: any) => o.createdAt.slice(0, 10) === dateStr)
    last7.push({ date: dateStr, revenue: dayOrders.filter((o: any) => o.paymentStatus === 'paid').reduce((s: number, o: any) => s + o.total, 0), orders: dayOrders.length })
  }

  const revenueByStatus = ['pending','processing','shipped','delivered','cancelled'].map(status => ({
    status,
    total: orders.filter((o: any) => o.status === status).reduce((s: number, o: any) => s + o.total, 0),
    count: orders.filter((o: any) => o.status === status).length,
  }))

  const catMap: Record<string, number> = {}
  products.forEach((p: any) => { catMap[p.category] = (catMap[p.category] ?? 0) + 1 })
  const categoryBreakdown = Object.entries(catMap).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count)

  const recentOrders = [...orders].sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5)

  res.json({
    totalRevenue, thisMonthRevenue: thisMonthRev, lastMonthRevenue: lastMonthRev,
    revenueGrowth: Number(revenueGrowth.toFixed(1)),
    totalOrders: orders.length, statusCounts,
    pendingOrders: (statusCounts['pending'] ?? 0) + (statusCounts['processing'] ?? 0),
    totalProducts, lowStockCount, outOfStock, avgRating: Number(avgRating), uniqueCustomers,
    last7Days: last7, revenueByStatus, categoryBreakdown, recentOrders,
  })
})

// ── POST /api/admin/customers ───────────────────────────────────────────────
router.post('/customers', requireAdmin, async (req, res) => {
  const { name, email, phone, division, password } = req.body
  if (!name || !phone || !email || !password)
    return res.status(400).json({ error: 'Name, email, phone and password are required' })
  if (password.length < 6)
    return res.status(400).json({ error: 'Password must be at least 6 characters' })

  const users = await getUsers()
  const normalizedPhone = normalizePhone(phone)

  if (users.find(u => u.email === email.toLowerCase().trim()))
    return res.status(409).json({ field: 'email', error: 'This email is already registered' })
  if (users.find(u => normalizePhone(u.phone) === normalizedPhone))
    return res.status(409).json({ field: 'phone', error: 'This phone number is already registered' })

  const newUser: User = {
    id:       'admin_' + Date.now().toString(36),
    name:     name.trim(),
    email:    email.toLowerCase().trim(),
    phone:    normalizedPhone,
    division: division ?? 'Dhaka',
    password,
  }
  users.push(newUser)
  await saveUsers(users)

  const { password: _pw, ...safe } = newUser
  res.status(201).json({ ok: true, customer: safe })
})

// ── GET /api/admin/customers ─────────────────────────────────────────────────
router.get('/customers', requireAdmin, async (_req, res) => {
  const orders = await getOrders()
  const map: Record<string, any> = {}
  orders.forEach((o: any) => {
    const email = o.customer?.email ?? o.id
    if (!map[email]) {
      map[email] = { id: email, name: o.customer?.name ?? 'Unknown', email: o.customer?.email ?? '', phone: o.customer?.phone ?? '', address: o.customer?.address ?? '', orderCount: 0, totalSpent: 0, lastOrder: o.createdAt, firstOrder: o.createdAt, paymentMethod: o.paymentMethod, orders: [] }
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

// ── POST /api/admin/migrate-seed-flags ───────────────────────────────────────
// One-time call: writes sb:seeded:* flags for any collection that already has
// data in Redis (so the new seed-guard logic doesn't re-seed them on next load)
router.post('/migrate-seed-flags', requireAdmin, async (_req, res) => {
  const results: Record<string, string> = {}
  for (const col of ['products', 'orders', 'categories'] as const) {
    const key = KEYS[col]
    const data = await redis.get<any[]>(key)
    const flagKey = `${KEYS.seeded}:${col}`
    if (data !== null) {
      await redis.set(flagKey, '1')
      results[col] = `flag set (${Array.isArray(data) ? data.length : 0} items)`
    } else {
      results[col] = 'no data — flag NOT set (will seed on next request)'
    }
  }
  res.json({ ok: true, results })
})

// ── DELETE /api/admin/reset-collection/:col ───────────────────────────────────
// Wipes a collection AND its seed flag so it will re-seed on next request.
router.delete('/reset-collection/:col', requireAdmin, async (req, res) => {
  const col = req.params.col as 'products' | 'orders' | 'categories'
  if (!['products', 'orders', 'categories'].includes(col))
    return res.status(400).json({ error: 'col must be products | orders | categories' })
  await redis.del(KEYS[col])
  await redis.del(`${KEYS.seeded}:${col}`)
  if (col === 'products') broadcast('products_updated')
  if (col === 'orders')   broadcast('orders_updated')
  res.json({ ok: true, message: `${col} cleared — will auto-reseed on next request` })
})

export default router
