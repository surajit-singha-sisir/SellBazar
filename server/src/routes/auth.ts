import { Router } from 'express'
import { redis, KEYS } from '../lib/redis.js'
import jwt from 'jsonwebtoken'

const router = Router()
const JWT_SECRET = process.env.JWT_SECRET || 'sellbazar-super-secret-key-2025'

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
  if ((!phone && !email) || !password)
    return res.status(400).json({ error: 'Phone/email and password are required' })

  const users = await getUsers()
  const user = users.find(u => (phone && u.phone === phone) || (email && u.email === email))

  if (!user)
    return res.status(401).json({ error: 'No account found with that phone number. Please register first.' })
  if (user.password !== password)
    return res.status(401).json({ error: 'Incorrect password. Please try again.' })

  const token = jwt.sign(
    { id: user.id, email: user.email, phone: user.phone, role: 'user' },
    JWT_SECRET,
    { expiresIn: '30d' }
  )
  const { password: _pw, ...safe } = user
  res.json({ user: safe, token })
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
  if (password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' })

  const users = await getUsers()
  if (users.find(u => u.email === email))
    return res.status(409).json({ field: 'email', error: 'This email is already registered' })
  if (users.find(u => u.phone === phone))
    return res.status(409).json({ field: 'phone', error: 'This phone number is already registered' })

  const newUser: User = {
    id: Date.now().toString(),
    name: name.trim(),
    email: email.toLowerCase().trim(),
    phone: phone.trim(),
    division: division ?? 'Dhaka',
    password,
  }
  users.push(newUser)
  await saveUsers(users)

  const token = jwt.sign(
    { id: newUser.id, email: newUser.email, phone: newUser.phone, role: 'user' },
    JWT_SECRET,
    { expiresIn: '30d' }
  )
  const { password: _pw, ...safe } = newUser
  res.json({ user: safe, token })
})

export default router
