import { Redis } from '@upstash/redis'

// Resolve env vars — supports both Upstash-native names and Vercel KV names
const url   = process.env.UPSTASH_REDIS_REST_URL   ?? process.env.KV_REST_API_URL
const token = process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN

if (!url || !token) {
  console.error('\x1b[31m✗ Redis env vars missing.\x1b[0m')
  console.error('  Set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN in server/.env')
  process.exit(1)
}

export const redis = new Redis({ url, token })

// ── Key helpers ───────────────────────────────────────────────────────────────
export const KEYS = {
  products:      'sb:products',
  orders:        'sb:orders',
  users:         'sb:users',
  categories:    'sb:categories',
  seeded:        'sb:seeded',          // set once per collection to prevent re-seed
  cart:          (uid: string) => `sb:cart:${uid}`,
  wishlist:      (uid: string) => `sb:wishlist:${uid}`,
  reviews:       'sb:reviews',
  banners:       'sb:banners',
}
