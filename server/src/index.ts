import express from 'express'
import cors from 'cors'
import { join } from 'path'
import { existsSync, mkdirSync } from 'fs'
import productsRouter from './routes/products.js'
import authRouter from './routes/auth.js'
import ordersRouter, { orders } from './routes/orders.js'
import adminAuthRouter from './routes/adminAuth.js'
import adminRouter from './routes/admin.js'
import userdataRouter from './routes/userdata.js'
import categoriesRouter from './routes/categories.js'

const app = express()
const PORT = process.env.PORT ?? 4000

// Share mutable orders array with admin routes via app.locals
app.locals.orders = orders

const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
  : ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:3000']

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, Vercel SSR)
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true)
    callback(new Error(`CORS: origin ${origin} not allowed`))
  },
  credentials: true,
}))
app.use(express.json())

// Serve uploaded images
const UPLOAD_DIR = join(process.cwd(), 'uploads')
if (!existsSync(UPLOAD_DIR)) mkdirSync(UPLOAD_DIR, { recursive: true })
app.use('/uploads', express.static(UPLOAD_DIR))

// Public storefront auth
app.use('/api/auth', authRouter)

// Admin auth (login/me) + admin features (dashboard, customers, upload)
app.use('/api/admin', adminAuthRouter)
app.use('/api/admin', adminRouter)

// Products (GET = public, POST/PUT/DELETE = admin protected inside router)
app.use('/api/products', productsRouter)

// Orders
app.use('/api/orders', ordersRouter)

// Per-user cart & wishlist sync
app.use('/api/user', userdataRouter)

// Categories + subcategories
app.use('/api/categories', categoriesRouter)

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', service: 'SellBazar API', time: new Date().toISOString() })
})

const server = app.listen(PORT, () => {
  console.log(`\x1b[32m✓\x1b[0m SellBazar API running → http://localhost:${PORT}`)
  console.log(`\x1b[33m🔑\x1b[0m Admin login: admin@sellbazar.com / Admin@1234`)
})

server.on('error', (err: NodeJS.ErrnoException) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`\x1b[31m✗\x1b[0m Port ${PORT} is already in use. Run: Stop-Process -Id (Get-NetTCPConnection -LocalPort ${PORT}).OwningProcess -Force`)
    process.exit(1)
  } else {
    throw err
  }
})

export default app
