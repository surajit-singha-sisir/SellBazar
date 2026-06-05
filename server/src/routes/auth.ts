import { Router } from 'express'
import { redis, KEYS } from '../lib/redis.js'
import jwt from 'jsonwebtoken'

const router = Router()
const JWT_SECRET = process.env.JWT_SECRET || 'sellbazar-super-secret-key-2025'

type User = { id: string; name: string; email: string; phone: string; division: string; password: string }

/** Normalize phone to always be stored/compared as "+880XXXXXXXXXX" */
function normalizePhone(raw: string): string {
  const digits = raw.replace(/\D/g, '') // strip all non-digit chars
  // If already has country code 880, keep; if starts with 0, strip the leading 0
  if (digits.startsWith('880')) return '+' + digits
  if (digits.startsWith('0'))   return '+880' + digits.slice(1)
  return '+880' + digits
}

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
  const normalizedPhone = phone ? normalizePhone(phone) : null
  const user = users.find(u =>
    (normalizedPhone && normalizePhone(u.phone) === normalizedPhone) ||
    (email && u.email === email.toLowerCase().trim())
  )

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
  if (email && users.find(u => u.email === email.toLowerCase().trim()))
    return res.status(409).json({ field: 'email', error: 'This email is already registered' })
  if (phone && users.find(u => normalizePhone(u.phone) === normalizePhone(phone)))
    return res.status(409).json({ field: 'phone', error: 'This phone number is already registered' })
  res.json({ available: true })
})

// ── Register ──────────────────────────────────────────────────────────────────
router.post('/register', async (req, res) => {
  const { name, phone, email, division, password } = req.body
  if (!name || !phone || !email || !password) return res.status(400).json({ error: 'All fields required' })
  if (password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' })

  const users = await getUsers()
  if (users.find(u => u.email === email.toLowerCase().trim()))
    return res.status(409).json({ field: 'email', error: 'This email is already registered' })
  if (users.find(u => normalizePhone(u.phone) === normalizePhone(phone)))
    return res.status(409).json({ field: 'phone', error: 'This phone number is already registered' })

  const newUser: User = {
    id: Date.now().toString(),
    name: name.trim(),
    email: email.toLowerCase().trim(),
    phone: normalizePhone(phone),  // always store in canonical "+880XXXXXXXXXX" form
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
