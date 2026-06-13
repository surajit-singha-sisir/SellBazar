// api/index.js — Vercel Serverless Function (plain CJS, no build step)
// DB: Neon Serverless Postgres via @neondatabase/serverless

const express        = require('express')
const cors           = require('cors')
const jwt            = require('jsonwebtoken')
const { neon }       = require('@neondatabase/serverless')
const { randomBytes } = require('crypto')

// ── Neon client ───────────────────────────────────────────────────────────────
if (!process.env.DATABASE_URL) {
  console.error('FATAL: DATABASE_URL env var missing.')
}
const sql = neon(process.env.DATABASE_URL)

// ── Auth helpers ──────────────────────────────────────────────────────────────
const JWT_SECRET = process.env.JWT_SECRET ?? 'sellbazar-super-secret-key-2025'

function requireAdmin(req, res, next) {
  const h = req.headers.authorization
  if (!h?.startsWith('Bearer ')) return res.status(401).json({ error: 'No token provided' })
  try {
    const payload = jwt.verify(h.slice(7), JWT_SECRET)
    if (payload.role !== 'admin' && payload.role !== 'superadmin')
      return res.status(403).json({ error: 'Admin access required' })
    req.admin = payload
    next()
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' })
  }
}

// ── App setup ─────────────────────────────────────────────────────────────────
const app = express()

const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
  : ['http://localhost:5173','http://localhost:5174','http://localhost:3000','https://sell-bazar.vercel.app']

app.use(cors({
  origin: (origin, cb) => {
    if (!origin || allowedOrigins.includes(origin)) return cb(null, true)
    cb(new Error('CORS: origin not allowed'))
  },
  credentials: true,
}))
app.use(express.json({ limit: '10mb' }))

// ── Health ────────────────────────────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', service: 'SellBazar API', time: new Date().toISOString(), db: 'neon' })
})

// ── Phone normalizer ──────────────────────────────────────────────────────────
function normalizePhone(raw) {
  const d = raw.replace(/\D/g, '')
  if (d.startsWith('880')) return '+' + d
  if (d.startsWith('0'))   return '+880' + d.slice(1)
  return '+880' + d
}

function toSlug(n) { return n.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,'') }

// ── DB helpers: row → JS camelCase ────────────────────────────────────────────
function rowToProduct(r) {
  return {
    id: r.id, slug: r.slug, name: r.name, nameBn: r.name_bn,
    description: r.description, price: Number(r.price), salePrice: Number(r.sale_price),
    category: r.category, subcategory: r.subcategory, categoryBn: r.category_bn,
    brand: r.brand, seller: r.seller, stock: r.stock, rating: Number(r.rating),
    reviewCount: r.review_count, location: r.location, deliveryDays: r.delivery_days,
    isNew: r.is_new, isFeatured: r.is_featured,
    tags: r.tags ?? [], images: r.images ?? [],
    createdAt: r.created_at, updatedAt: r.updated_at,
  }
}
function rowToOrder(r) {
  return {
    id: r.id, customer: r.customer, items: r.items,
    subtotal: Number(r.subtotal), shipping: Number(r.shipping),
    discount: Number(r.discount), couponCode: r.coupon_code,
    total: Number(r.total), status: r.status,
    paymentMethod: r.payment_method, paymentStatus: r.payment_status,
    notes: r.notes, trackingNumber: r.tracking_number,
    createdAt: r.created_at, updatedAt: r.updated_at,
  }
}
function rowToCategory(r) {
  return {
    id: r.id, slug: r.slug, name: r.name, nameBn: r.name_bn,
    icon: r.icon, color: r.color, subcategories: r.subcategories ?? [],
    createdAt: r.created_at,
  }
}
function rowToReview(r) {
  return {
    id: r.id, productId: r.product_id, productSlug: r.product_slug,
    productName: r.product_name, orderId: r.order_id, userId: r.user_id,
    userName: r.user_name, userEmail: r.user_email, rating: Number(r.rating),
    title: r.title, body: r.body, images: r.images ?? [],
    status: r.status, helpful: r.helpful, adminNote: r.admin_note,
    createdAt: r.created_at,
  }
}
function rowToBanner(r) {
  return {
    id: r.id, tag: r.tag, title: r.title, subtitle: r.subtitle,
    cta: r.cta, link: r.link, image: r.image, active: r.active,
    order: r.display_order,
  }
}
