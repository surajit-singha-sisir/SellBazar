import { Router, Request, Response } from 'express'
import { redis, KEYS } from '../lib/redis.js'

const router = Router()

// ── SSE client registry ───────────────────────────────────────────────────────
const clients = new Set<Response>()

// ── Broadcast helper — call this from any route after a write ────────────────
export async function broadcast(event: string, data?: unknown) {
  if (clients.size === 0) return
  let payload = data
  if (!payload) {
    // Auto-fetch the relevant data slice
    if (event === 'orders_updated')    payload = await redis.get(KEYS.orders)
    if (event === 'products_updated')  payload = await redis.get(KEYS.products)
    if (event === 'categories_updated') payload = await redis.get(KEYS.categories)
  }
  const msg = `event: ${event}\ndata: ${JSON.stringify(payload ?? {})}\n\n`
  clients.forEach(res => {
    try { res.write(msg) } catch { clients.delete(res) }
  })
}

// ── GET /api/events  — SSE stream for admin dashboard ────────────────────────
router.get('/', (req: Request, res: Response) => {
  res.setHeader('Content-Type',  'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection',    'keep-alive')
  res.setHeader('X-Accel-Buffering', 'no')  // disable nginx buffering
  res.flushHeaders()

  // Send current snapshot immediately so the client starts with fresh data
  Promise.all([
    redis.get(KEYS.orders),
    redis.get(KEYS.products),
  ]).then(([orders, products]) => {
    try {
      res.write(`event: snapshot\ndata: ${JSON.stringify({ orders, products })}\n\n`)
    } catch {}
  })

  // Heartbeat every 25 s to keep the connection alive through proxies
  const heartbeat = setInterval(() => {
    try { res.write(': heartbeat\n\n') } catch { cleanup() }
  }, 25_000)

  clients.add(res)

  function cleanup() {
    clearInterval(heartbeat)
    clients.delete(res)
    res.end()
  }

  req.on('close',   cleanup)
  req.on('error',   cleanup)
  res.on('error',   cleanup)
})

export default router
