import { Router, Request, Response } from 'express'
import { redis, KEYS } from '../lib/redis.js'

const router = Router()

function getUserId(req: Request): string | null {
  return (req.headers['x-user-id'] as string) ?? req.body?.userId ?? null
}

// ── Cart ──────────────────────────────────────────────────────────────────────
router.get('/cart', async (req: Request, res: Response) => {
  const uid = getUserId(req)
  if (!uid) return res.status(401).json({ error: 'Unauthorized' })
  const cart = await redis.get<unknown[]>(KEYS.cart(uid))
  res.json({ cart: cart ?? [] })
})

router.post('/cart', async (req: Request, res: Response) => {
  const uid = getUserId(req)
  if (!uid) return res.status(401).json({ error: 'Unauthorized' })
  const { cart } = req.body
  if (!Array.isArray(cart)) return res.status(400).json({ error: 'cart must be an array' })
  await redis.set(KEYS.cart(uid), cart)
  res.json({ ok: true })
})

// ── Wishlist ──────────────────────────────────────────────────────────────────
router.get('/wishlist', async (req: Request, res: Response) => {
  const uid = getUserId(req)
  if (!uid) return res.status(401).json({ error: 'Unauthorized' })
  const wishlist = await redis.get<string[]>(KEYS.wishlist(uid))
  res.json({ wishlist: wishlist ?? [] })
})

router.post('/wishlist', async (req: Request, res: Response) => {
  const uid = getUserId(req)
  if (!uid) return res.status(401).json({ error: 'Unauthorized' })
  const { wishlist } = req.body
  if (!Array.isArray(wishlist)) return res.status(400).json({ error: 'wishlist must be an array' })
  await redis.set(KEYS.wishlist(uid), wishlist)
  res.json({ ok: true })
})

// ── Clear user data ───────────────────────────────────────────────────────────
router.delete('/userdata', async (req: Request, res: Response) => {
  const uid = getUserId(req)
  if (!uid) return res.status(401).json({ error: 'Unauthorized' })
  await redis.del(KEYS.cart(uid))
  await redis.del(KEYS.wishlist(uid))
  res.json({ ok: true })
})

export default router
