import { Router, Request, Response } from 'express'
import { redis, KEYS } from '../lib/redis.js'
import { requireAdmin } from '../middleware/auth.js'
import { randomBytes } from 'crypto'

const router = Router()

// ── Types ─────────────────────────────────────────────────────────────────────
interface Banner {
  id: string
  tag: string
  title: string
  subtitle: string
  cta: string
  link: string
  image: string
  active: boolean
  order: number
}

async function getBanners(): Promise<Banner[]> {
  return (await redis.get<Banner[]>(KEYS.banners)) ?? []
}

// ── GET /api/banners — public, returns active banners sorted by order ─────────
router.get('/', async (_req: Request, res: Response) => {
  try {
    const banners = await getBanners()
    const sorted = [...banners].sort((a, b) => a.order - b.order)
    res.json(sorted)
  } catch (err) {
    console.error('[banners] GET /', err)
    res.status(500).json({ error: 'Failed to fetch banners' })
  }
})

// ── GET /api/banners/all — admin only, returns all banners ────────────────────
router.get('/all', requireAdmin, async (_req: Request, res: Response) => {
  try {
    const banners = await getBanners()
    const sorted = [...banners].sort((a, b) => a.order - b.order)
    res.json(sorted)
  } catch (err) {
    console.error('[banners] GET /all', err)
    res.status(500).json({ error: 'Failed to fetch banners' })
  }
})

// ── POST /api/banners — admin only, create banner ─────────────────────────────
router.post('/', requireAdmin, async (req: Request, res: Response) => {
  try {
    const { id, tag, title, subtitle, cta, link, image, active, order } = req.body as Banner

    if (!title || !image) {
      res.status(400).json({ error: 'title and image are required' })
      return
    }

    const banners = await getBanners()
    const newBanner: Banner = {
      id:       id || randomBytes(8).toString('hex'),
      tag:      tag      ?? '',
      title:    title.trim(),
      subtitle: subtitle ?? '',
      cta:      cta      ?? 'Shop Now',
      link:     link     ?? '/',
      image:    image.trim(),
      active:   active   ?? true,
      order:    typeof order === 'number' ? order : banners.length,
    }

    banners.push(newBanner)
    await redis.set(KEYS.banners, banners)

    res.status(201).json(newBanner)
  } catch (err) {
    console.error('[banners] POST /', err)
    res.status(500).json({ error: 'Failed to create banner' })
  }
})

// ── PUT /api/banners/reorder — admin only, bulk reorder ──────────────────────
router.put('/reorder', requireAdmin, async (req: Request, res: Response) => {
  try {
    // Body: [{ id: string, order: number }, ...]
    const updates: { id: string; order: number }[] = req.body
    if (!Array.isArray(updates)) {
      res.status(400).json({ error: 'Expected an array of { id, order }' })
      return
    }

    const banners = await getBanners()
    const orderMap = new Map(updates.map(u => [u.id, u.order]))

    for (const banner of banners) {
      if (orderMap.has(banner.id)) {
        banner.order = orderMap.get(banner.id)!
      }
    }

    banners.sort((a, b) => a.order - b.order)
    await redis.set(KEYS.banners, banners)

    res.json(banners)
  } catch (err) {
    console.error('[banners] PUT /reorder', err)
    res.status(500).json({ error: 'Failed to reorder banners' })
  }
})

// ── PUT /api/banners/:id — admin only, update banner ─────────────────────────
router.put('/:id', requireAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const banners = await getBanners()
    const idx = banners.findIndex(b => b.id === id)

    if (idx === -1) {
      res.status(404).json({ error: 'Banner not found' })
      return
    }

    banners[idx] = { ...banners[idx], ...req.body, id }
    await redis.set(KEYS.banners, banners)

    res.json(banners[idx])
  } catch (err) {
    console.error('[banners] PUT /:id', err)
    res.status(500).json({ error: 'Failed to update banner' })
  }
})

// ── PATCH /api/banners/:id/toggle — admin only, toggle active ────────────────
router.patch('/:id/toggle', requireAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const banners = await getBanners()
    const idx = banners.findIndex(b => b.id === id)

    if (idx === -1) {
      res.status(404).json({ error: 'Banner not found' })
      return
    }

    banners[idx].active = !banners[idx].active
    await redis.set(KEYS.banners, banners)

    res.json(banners[idx])
  } catch (err) {
    console.error('[banners] PATCH /:id/toggle', err)
    res.status(500).json({ error: 'Failed to toggle banner' })
  }
})

// ── DELETE /api/banners/:id — admin only, remove banner ──────────────────────
router.delete('/:id', requireAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const banners = await getBanners()
    const filtered = banners.filter(b => b.id !== id)

    if (filtered.length === banners.length) {
      res.status(404).json({ error: 'Banner not found' })
      return
    }

    await redis.set(KEYS.banners, filtered)
    res.json({ success: true })
  } catch (err) {
    console.error('[banners] DELETE /:id', err)
    res.status(500).json({ error: 'Failed to delete banner' })
  }
})

export default router
