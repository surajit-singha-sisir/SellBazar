import express from 'express'
import cors from 'cors'
import { join } from 'path'
import { existsSync, mkdirSync } from 'fs'
import productsRouter from './routes/products.js'
import authRouter from './routes/auth.js'
import ordersRouter from './routes/orders.js'
import adminAuthRouter from './routes/adminAuth.js'
import adminRouter from './routes/admin.js'
import userdataRouter from './routes/userdata.js'
import categoriesRouter from './routes/categories.js'
import eventsRouter from './routes/events.js'
import { redis, KEYS } from './lib/redis.js'

const app = express()

const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
  : ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:3000', 'https://sell-bazar.vercel.app']

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true)
    callback(new Error(`CORS: origin ${origin} not allowed`))
  },
  credentials: true,
}))
app.use(express.json())

// Serve uploaded images — only set up local uploads in non-serverless env
const UPLOAD_DIR = join(process.cwd(), 'uploads')
try {
  if (!existsSync(UPLOAD_DIR)) mkdirSync(UPLOAD_DIR, { recursive: true })
  app.use('/uploads', express.static(UPLOAD_DIR))
} catch {
  // Vercel read-only filesystem — skip local upload serving
}

// Routes
app.use('/api/auth', authRouter)
app.use('/api/admin', adminAuthRouter)
app.use('/api/admin', adminRouter)
app.use('/api/products', productsRouter)
app.use('/api/orders', ordersRouter)
app.use('/api/user', userdataRouter)
app.use('/api/categories', categoriesRouter)
app.use('/api/events', eventsRouter)

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', service: 'SellBazar API', time: new Date().toISOString() })
})

// Only call listen() when running locally (not on Vercel serverless)
if (process.env.VERCEL !== '1') {
  const PORT = process.env.PORT ?? 4000
  const server = app.listen(PORT, async () => {
    console.log(`\x1b[32m✓\x1b[0m SellBazar API running → http://localhost:${PORT}`)
    console.log(`\x1b[33m🔑\x1b[0m Admin login: admin@sellbazar.com / Admin@1234`)
    // ── Auto-migrate seed flags on startup ─────────────────────────────────
    // Stamps sb:seeded:* for any collection that already has data in Redis,
    // preventing the new seed-guard from re-seeding after intentional deletes.
    try {
      for (const col of ['products', 'orders', 'categories'] as const) {
        const flagKey = `${KEYS.seeded}:${col}`
        const alreadyFlagged = await redis.get<string>(flagKey)
        if (!alreadyFlagged) {
          const data = await redis.get<any[]>(KEYS[col])
          if (data !== null) {
            await redis.set(flagKey, '1')
            console.log(`\x1b[36m⚑\x1b[0m  Seed flag set for ${col} (${Array.isArray(data) ? data.length : 0} items)`)
          }
        }
      }
    } catch (e) {
      console.warn('\x1b[33m⚠\x1b[0m  Could not run seed-flag migration:', e)
    }
  })
  server.on('error', (err: NodeJS.ErrnoException) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`\x1b[31m✗\x1b[0m Port ${PORT} already in use.`)
      process.exit(1)
    } else throw err
  })
}

export default app
