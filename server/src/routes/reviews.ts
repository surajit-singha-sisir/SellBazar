import { Router } from 'express'
import { redis, KEYS } from '../lib/redis.js'
import { broadcast } from './events.js'

const router = Router()

type ReviewStatus = 'pending' | 'approved' | 'rejected'

interface Review {
  id: string
  productId: string
  productSlug: string
  productName: string
  orderId: string
  userId: string
  userName: string
  userEmail: string
  rating: number
  title: string
  body: string
  images: string[]
  status: ReviewStatus
  helpful: number
  adminNote: string
  createdAt: string
}

async function getReviews(): Promise<Review[]> {
  return (await redis.get<Review[]>(KEYS.reviews)) ?? []
}
async function saveReviews(reviews: Review[]) {
  await redis.set(KEYS.reviews, reviews)
}

// ── Helper: recalculate product rating from approved reviews ──────────────────
async function syncProductRating(productSlug: string) {
  try {
    const reviews = await getReviews()
    const approved = reviews.filter(r => r.productSlug === productSlug && r.status === 'approved')
    if (!approved.length) return
    const avg = approved.reduce((s, r) => s + r.rating, 0) / approved.length
    const products: any[] = (await redis.get<any[]>(KEYS.products)) ?? []
    const idx = products.findIndex(p => p.slug === productSlug)
    if (idx === -1) return
    products[idx].rating      = Math.round(avg * 10) / 10
    products[idx].reviewCount = approved.length
    products[idx].updatedAt   = new Date().toISOString()
    await redis.set(KEYS.products, products)
    broadcast('products_updated')
  } catch { /* non-fatal */ }
}

// ── GET /api/reviews/product/:slug — public, list approved reviews ─────────────
router.get('/product/:slug', async (req, res) => {
  const reviews = await getReviews()
  const result  = reviews
    .filter(r => r.productSlug === req.params.slug && r.status === 'approved')
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  res.json(result)
})

// ── GET /api/reviews/check — can this user review this product from this order?
// Query: ?orderId=&productId=&userId=
router.get('/check', async (req, res) => {
  const { orderId, productId, userId } = req.query as Record<string, string>
  if (!orderId || !productId || !userId)
    return res.status(400).json({ error: 'orderId, productId and userId are required' })

  // Verify the order exists, belongs to user, is delivered, and contains the product
  const orders: any[] = (await redis.get<any[]>(KEYS.orders)) ?? []
  const order = orders.find(o => o.id === orderId)

  if (!order)
    return res.status(404).json({ canReview: false, reason: 'Order not found' })

  // Match order to user by email or userId stored in order.userId
  const users: any[] = (await redis.get<any[]>(KEYS.users)) ?? []
  const user = users.find(u => u.id === userId)
  const userEmail = user?.email ?? ''

  const ownsOrder = order.userId === userId ||
    (userEmail && order.customer?.email?.toLowerCase() === userEmail.toLowerCase())

  if (!ownsOrder)
    return res.json({ canReview: false, reason: 'Order does not belong to this account' })

  if (order.status !== 'delivered')
    return res.json({ canReview: false, reason: 'Order not yet delivered' })

  const hasProduct = order.items?.some((i: any) => i.productId === productId)
  if (!hasProduct)
    return res.json({ canReview: false, reason: 'Product not in this order' })

  // Already reviewed?
  const reviews = await getReviews()
  const already = reviews.find(
    r => r.orderId === orderId && r.productId === productId && r.userId === userId
  )
  if (already)
    return res.json({ canReview: false, reason: 'Already reviewed', reviewId: already.id })

  res.json({ canReview: true })
})

// ── POST /api/reviews — submit a review (buyer-only) ─────────────────────────
router.post('/', async (req, res) => {
  const { orderId, productId, productSlug, productName,
          userId, userName, userEmail,
          rating, title, body, images } = req.body

  if (!orderId || !productId || !productSlug || !userId || !rating)
    return res.status(400).json({ error: 'orderId, productId, productSlug, userId and rating are required' })

  if (rating < 1 || rating > 5)
    return res.status(400).json({ error: 'Rating must be 1–5' })

  // Re-validate buyer ownership server-side
  const orders: any[] = (await redis.get<any[]>(KEYS.orders)) ?? []
  const order = orders.find(o => o.id === orderId)
  if (!order) return res.status(404).json({ error: 'Order not found' })
  if (order.status !== 'delivered')
    return res.status(403).json({ error: 'You can only review delivered orders' })

  const hasProduct = order.items?.some((i: any) => i.productId === productId)
  if (!hasProduct)
    return res.status(403).json({ error: 'Product not in this order' })

  // Deduplicate: one review per (user, order, product)
  const reviews = await getReviews()
  const duplicate = reviews.find(
    r => r.orderId === orderId && r.productId === productId && r.userId === userId
  )
  if (duplicate)
    return res.status(409).json({ error: 'You have already reviewed this product for this order' })

  const review: Review = {
    id:          `rev-${Date.now()}`,
    productId:   String(productId),
    productSlug: String(productSlug),
    productName: String(productName ?? ''),
    orderId:     String(orderId),
    userId:      String(userId),
    userName:    String(userName ?? 'Anonymous'),
    userEmail:   String(userEmail ?? ''),
    rating:      Number(rating),
    title:       String(title ?? '').slice(0, 120),
    body:        String(body ?? '').slice(0, 2000),
    images:      Array.isArray(images) ? images.slice(0, 4) : [],
    status:      'pending',
    helpful:     0,
    adminNote:   '',
    createdAt:   new Date().toISOString(),
  }

  reviews.push(review)
  await saveReviews(reviews)
  broadcast('reviews_updated')
  res.status(201).json(review)
})

// ── POST /api/reviews/:id/helpful — increment helpful count ───────────────────
router.post('/:id/helpful', async (req, res) => {
  const reviews = await getReviews()
  const idx = reviews.findIndex(r => r.id === req.params.id)
  if (idx === -1) return res.status(404).json({ error: 'Review not found' })
  reviews[idx].helpful = (reviews[idx].helpful ?? 0) + 1
  await saveReviews(reviews)
  res.json({ helpful: reviews[idx].helpful })
})

// ── ADMIN routes (used by admin/ReviewsView.vue) ──────────────────────────────
// GET all (already exists in admin.ts, but keep a convenience endpoint here too)
router.get('/', async (_req, res) => {
  const reviews = await getReviews()
  reviews.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  res.json(reviews)
})

// PUT /api/reviews/:id — admin update (approve/reject/edit)
router.put('/:id', async (req, res) => {
  const reviews = await getReviews()
  const idx = reviews.findIndex(r => r.id === req.params.id)
  if (idx === -1) return res.status(404).json({ error: 'Review not found' })
  const { status, adminNote, rating, title, body, userName } = req.body
  if (status    !== undefined) reviews[idx].status    = status as ReviewStatus
  if (adminNote !== undefined) reviews[idx].adminNote = String(adminNote)
  if (rating    !== undefined) reviews[idx].rating    = Number(rating)
  if (title     !== undefined) reviews[idx].title     = String(title).slice(0, 120)
  if (body      !== undefined) reviews[idx].body      = String(body).slice(0, 2000)
  if (userName  !== undefined) reviews[idx].userName  = String(userName)
  await saveReviews(reviews)
  // Sync product rating when status or rating changes
  if (status === 'approved' || status === 'rejected' || rating !== undefined) {
    await syncProductRating(reviews[idx].productSlug)
  }
  broadcast('reviews_updated')
  res.json(reviews[idx])
})

// DELETE /api/reviews/:id
router.delete('/:id', async (req, res) => {
  const reviews = await getReviews()
  const idx = reviews.findIndex(r => r.id === req.params.id)
  if (idx === -1) return res.status(404).json({ error: 'Review not found' })
  const [deleted] = reviews.splice(idx, 1)
  await saveReviews(reviews)
  await syncProductRating(deleted.productSlug)
  broadcast('reviews_updated')
  res.json({ message: 'Deleted', id: deleted.id })
})

export default router
