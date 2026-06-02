import { Router } from 'express'
import { requireAdmin } from '../middleware/auth.js'
import { CATEGORIES } from '../data/categories.js'
import { products } from './products.js'

const router = Router()

// ── GET /api/categories  (public) ────────────────────────────────────────────
// Returns all categories with live product counts injected
router.get('/', (_req, res) => {
  const enriched = CATEGORIES.map(cat => ({
    ...cat,
    productCount: products.filter((p: any) => p.category === cat.name).length,
    subcategories: cat.subcategories.map(sub => ({
      ...sub,
      productCount: products.filter((p: any) => p.subcategory === sub.slug).length,
    })),
  }))
  res.json({ data: enriched, total: enriched.length })
})

// ── GET /api/categories/:slug  (public) ──────────────────────────────────────
router.get('/:slug', (req, res) => {
  const cat = CATEGORIES.find(c => c.slug === req.params.slug)
  if (!cat) return res.status(404).json({ error: 'Category not found' })
  const enriched = {
    ...cat,
    productCount: products.filter((p: any) => p.category === cat.name).length,
    subcategories: cat.subcategories.map(sub => ({
      ...sub,
      productCount: products.filter((p: any) => p.subcategory === sub.slug).length,
    })),
  }
  res.json(enriched)
})

// ── POST /api/categories  (admin) ─────────────────────────────────────────────
// Add a new top-level category
router.post('/', requireAdmin, (req, res) => {
  const { name, nameBn, icon, color, slug } = req.body
  if (!name || !slug) return res.status(400).json({ error: 'name and slug are required' })
  const exists = CATEGORIES.find(c => c.slug === slug)
  if (exists) return res.status(409).json({ error: 'Category slug already exists' })
  const newCat = {
    id: `c${Date.now()}`, slug, name, nameBn: nameBn ?? name,
    icon: icon ?? 'fa-tag', color: color ?? '#6b7280',
    subcategories: [],
  }
  CATEGORIES.push(newCat)
  res.status(201).json(newCat)
})

// ── PUT /api/categories/:slug  (admin) ────────────────────────────────────────
router.put('/:slug', requireAdmin, (req, res) => {
  const idx = CATEGORIES.findIndex(c => c.slug === req.params.slug)
  if (idx === -1) return res.status(404).json({ error: 'Category not found' })
  CATEGORIES[idx] = { ...CATEGORIES[idx], ...req.body, id: CATEGORIES[idx].id, slug: CATEGORIES[idx].slug }
  res.json(CATEGORIES[idx])
})

// ── DELETE /api/categories/:slug  (admin) ─────────────────────────────────────
router.delete('/:slug', requireAdmin, (req, res) => {
  const idx = CATEGORIES.findIndex(c => c.slug === req.params.slug)
  if (idx === -1) return res.status(404).json({ error: 'Category not found' })
  const [removed] = CATEGORIES.splice(idx, 1)
  res.json({ message: 'Category deleted', slug: removed.slug })
})

// ── POST /api/categories/:slug/subcategories  (admin) ────────────────────────
router.post('/:slug/subcategories', requireAdmin, (req, res) => {
  const cat = CATEGORIES.find(c => c.slug === req.params.slug)
  if (!cat) return res.status(404).json({ error: 'Category not found' })
  const { name, nameBn, icon, slug } = req.body
  if (!name || !slug) return res.status(400).json({ error: 'name and slug are required' })
  const exists = cat.subcategories.find(s => s.slug === slug)
  if (exists) return res.status(409).json({ error: 'Subcategory slug already exists in this category' })
  const newSub = { id: `s${Date.now()}`, slug, name, nameBn: nameBn ?? name, icon: icon ?? 'fa-tag' }
  cat.subcategories.push(newSub)
  res.status(201).json(newSub)
})

// ── PUT /api/categories/:slug/subcategories/:subSlug  (admin) ────────────────
router.put('/:slug/subcategories/:subSlug', requireAdmin, (req, res) => {
  const cat = CATEGORIES.find(c => c.slug === req.params.slug)
  if (!cat) return res.status(404).json({ error: 'Category not found' })
  const subIdx = cat.subcategories.findIndex(s => s.slug === req.params.subSlug)
  if (subIdx === -1) return res.status(404).json({ error: 'Subcategory not found' })
  cat.subcategories[subIdx] = { ...cat.subcategories[subIdx], ...req.body, id: cat.subcategories[subIdx].id, slug: cat.subcategories[subIdx].slug }
  res.json(cat.subcategories[subIdx])
})

// ── DELETE /api/categories/:slug/subcategories/:subSlug  (admin) ─────────────
router.delete('/:slug/subcategories/:subSlug', requireAdmin, (req, res) => {
  const cat = CATEGORIES.find(c => c.slug === req.params.slug)
  if (!cat) return res.status(404).json({ error: 'Category not found' })
  const subIdx = cat.subcategories.findIndex(s => s.slug === req.params.subSlug)
  if (subIdx === -1) return res.status(404).json({ error: 'Subcategory not found' })
  const [removed] = cat.subcategories.splice(subIdx, 1)
  res.json({ message: 'Subcategory deleted', slug: removed.slug })
})

export default router
