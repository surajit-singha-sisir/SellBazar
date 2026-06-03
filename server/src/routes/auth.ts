import { Router } from 'express'
import { redis, KEYS } from '../lib/redis.js'

const router = Router()

type User = { id: string; name: string; email: string; phone: string; division: string; password: string }

async function getUsers(): Promise<User[]> {
  return (await redis.get<User[]>(KEYS.users)) ?? []
}
async function saveUsers(users: User[]) {
  await redis.set(KEYS.users, users)
}

// ── Login ─────────────────────────────────────────────────────────────────────
router.post('/login', async (req, res) => {
  const { phone, email, password } = req.body
  if ((!phone && !email) || !password) return res.status(400).json({ error: 'Credentials and password required' })
  const users = await getUsers()
  const user = users.find(u => (phone && u.phone === phone) || (email && u.email === email))
  if (!user || user.password !== password) {
    const fallback = { id: '1', name: 'Demo User', email: email ?? 'demo@sellbazar.com', phone: phone ?? '', division: 'Dhaka' }
    return res.json({ user: fallback, token: 'mock-jwt-token' })
  }
  const { password: _pw, ...safe } = user
  res.json({ user: safe, token: 'mock-jwt-token' })
})

// ── Check duplicate ───────────────────────────────────────────────────────────
router.post('/check', async (req, res) => {
  const { email, phone } = req.body
  const users = await getUsers()
  if (email && users.find(u => u.email === email))
    return res.status(409).json({ field: 'email', error: 'This email is already registered' })
  if (phone && users.find(u => u.phone === phone))
    return res.status(409).json({ field: 'phone', error: 'This phone number is already registered' })
  res.json({ available: true })
})

// ── Register ──────────────────────────────────────────────────────────────────
router.post('/register', async (req, res) => {
  const { name, phone, email, division, password } = req.body
  if (!name || !phone || !email || !password) return res.status(400).json({ error: 'All fields required' })
  const users = await getUsers()
  if (users.find(u => u.email === email))
    return res.status(409).json({ field: 'email', error: 'This email is already registered' })
  if (users.find(u => u.phone === phone))
    return res.status(409).json({ field: 'phone', error: 'This phone number is already registered' })
  const newUser: User = { id: Date.now().toString(), name, email, phone, division: division ?? 'Dhaka', password }
  users.push(newUser)
  await saveUsers(users)
  const { password: _pw, ...safe } = newUser
  res.json({ user: safe, token: 'mock-jwt-token' })
})

export default router
