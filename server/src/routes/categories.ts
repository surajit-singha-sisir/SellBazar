import { Router } from 'express'
import { requireAdmin } from '../middleware/auth.js'
import { CATEGORIES as SEED_CATEGORIES } from '../data/categories.js'
import { redis, KEYS } from '../lib/redis.js'

const router = Router()

async function getCategories() {
  const seeded = await redis.get<string>(`${KEYS.seeded}:categories`)
  if (seeded) {
    return (await redis.get<any[]>(KEYS.categories)) ?? []
  }
  await redis.set(KEYS.categories, SEED_CATEGORIES)
  await redis.set(`${KEYS.seeded}:categories`, '1')
  return [...SEED_CATEGORIES]
}
async function saveCategories(cats: any[]) {
  await redis.set(KEYS.categories, cats)
}
async function getProducts() {
  return (await redis.get<any[]>(KEYS.products)) ?? []
}

// ── GET /api/categories ───────────────────────────────────────────────────────
router.get('/', async (_req, res) => {
  const [cats, products] = await Promise.all([getCategories(), getProducts()])
  const enriched = cats.map((cat: any) => ({
    ...cat,
    productCount: products.filter((p: any) => p.category === cat.name).length,
    subcategories: cat.subcategories.map((sub: any) => ({
      ...sub,
      productCount: products.filter((p: any) => p.subcategory === sub.slug).length,
    })),
  }))
  res.json({ data: enriched, total: enriched.length })
})

// ── GET /api/categories/:slug ─────────────────────────────────────────────────
router.get('/:slug', async (req, res) => {
  const [cats, products] = await Promise.all([getCategories(), getProducts()])
  const cat = cats.find((c: any) => c.slug === req.params.slug)
  if (!cat) return res.status(404).json({ error: 'Category not found' })
  res.json({
    ...cat,
    productCount: products.filter((p: any) => p.category === cat.name).length,
    subcategories: cat.subcategories.map((sub: any) => ({
      ...sub,
      productCount: products.filter((p: any) => p.subcategory === sub.slug).length,
    })),
  })
})

// ── POST /api/categories (admin) ─────────────────────────────────────────────
router.post('/', requireAdmin, async (req, res) => {
  const { name, nameBn, icon, color, slug } = req.body
  if (!name || !slug) return res.status(400).json({ error: 'name and slug are required' })
  const cats = await getCategories()
  if (cats.find((c: any) => c.slug === slug)) return res.status(409).json({ error: 'Category slug already exists' })
  const newCat = { id: `c${Date.now()}`, slug, name, nameBn: nameBn ?? name, icon: icon ?? 'fa-tag', color: color ?? '#6b7280', subcategories: [] }
  cats.push(newCat)
  await saveCategories(cats)
  res.status(201).json(newCat)
})

// ── PUT /api/categories/:slug (admin) ─────────────────────────────────────────
router.put('/:slug', requireAdmin, async (req, res) => {
  const cats = await getCategories()
  const idx = cats.findIndex((c: any) => c.slug === req.params.slug)
  if (idx === -1) return res.status(404).json({ error: 'Category not found' })
  cats[idx] = { ...cats[idx], ...req.body, id: cats[idx].id, slug: cats[idx].slug }
  await saveCategories(cats)
  res.json(cats[idx])
})

// ── DELETE /api/categories/:slug (admin) ──────────────────────────────────────
router.delete('/:slug', requireAdmin, async (req, res) => {
  const cats = await getCategories()
  const idx = cats.findIndex((c: any) => c.slug === req.params.slug)
  if (idx === -1) return res.status(404).json({ error: 'Category not found' })
  const [removed] = cats.splice(idx, 1)
  await saveCategories(cats)
  res.json({ message: 'Category deleted', slug: removed.slug })
})

// ── POST /api/categories/:slug/subcategories (admin) ─────────────────────────
router.post('/:slug/subcategories', requireAdmin, async (req, res) => {
  const cats = await getCategories()
  const cat = cats.find((c: any) => c.slug === req.params.slug)
  if (!cat) return res.status(404).json({ error: 'Category not found' })
  const { name, nameBn, icon, slug } = req.body
  if (!name || !slug) return res.status(400).json({ error: 'name and slug are required' })
  if (cat.subcategories.find((s: any) => s.slug === slug)) return res.status(409).json({ error: 'Subcategory slug already exists' })
  const newSub = { id: `s${Date.now()}`, slug, name, nameBn: nameBn ?? name, icon: icon ?? 'fa-tag' }
  cat.subcategories.push(newSub)
  await saveCategories(cats)
  res.status(201).json(newSub)
})

// ── PUT /api/categories/:slug/subcategories/:subSlug (admin) ─────────────────
router.put('/:slug/subcategories/:subSlug', requireAdmin, async (req, res) => {
  const cats = await getCategories()
  const cat = cats.find((c: any) => c.slug === req.params.slug)
  if (!cat) return res.status(404).json({ error: 'Category not found' })
  const subIdx = cat.subcategories.findIndex((s: any) => s.slug === req.params.subSlug)
  if (subIdx === -1) return res.status(404).json({ error: 'Subcategory not found' })
  cat.subcategories[subIdx] = { ...cat.subcategories[subIdx], ...req.body, id: cat.subcategories[subIdx].id, slug: cat.subcategories[subIdx].slug }
  await saveCategories(cats)
  res.json(cat.subcategories[subIdx])
})

// ── DELETE /api/categories/:slug/subcategories/:subSlug (admin) ───────────────
router.delete('/:slug/subcategories/:subSlug', requireAdmin, async (req, res) => {
  const cats = await getCategories()
  const cat = cats.find((c: any) => c.slug === req.params.slug)
  if (!cat) return res.status(404).json({ error: 'Category not found' })
  const subIdx = cat.subcategories.findIndex((s: any) => s.slug === req.params.subSlug)
  if (subIdx === -1) return res.status(404).json({ error: 'Subcategory not found' })
  const [removed] = cat.subcategories.splice(subIdx, 1)
  await saveCategories(cats)
  res.json({ message: 'Subcategory deleted', slug: removed.slug })
})

export default router
