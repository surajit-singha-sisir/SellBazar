import express from 'express'
import cors from 'cors'
import productsRouter from './routes/products.js'
import authRouter from './routes/auth.js'
import ordersRouter from './routes/orders.js'
import adminAuthRouter from './routes/adminAuth.js'

const app = express()
const PORT = process.env.PORT ?? 4000

app.use(cors({ origin: ['http://localhost:5173', 'http://localhost:3000'] }))
app.use(express.json())

// Public storefront auth
app.use('/api/auth', authRouter)

// Admin auth (login/me)
app.use('/api/admin', adminAuthRouter)

// Products (GET = public, POST/PUT/DELETE = admin protected inside router)
app.use('/api/products', productsRouter)

// Orders
app.use('/api/orders', ordersRouter)

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', service: 'SellBazar API', time: new Date().toISOString() })
})

app.listen(PORT, () => {
  console.log(`\x1b[32m✓\x1b[0m SellBazar API running → http://localhost:${PORT}`)
  console.log(`\x1b[33m🔑\x1b[0m Admin login: admin@sellbazar.com / Admin@1234`)
})

export default app
