import { Router } from 'express'

const router = Router()

// Simple in-memory user store
const users: Array<{ id: string; name: string; email: string; phone: string; division: string; password: string }> = []

// ── Login ─────────────────────────────────────────────────────────────────────
router.post('/login', (req, res) => {
  const { phone, email, password } = req.body
  if ((!phone && !email) || !password) return res.status(400).json({ error: 'Credentials and password required' })
  const user = users.find(u => (phone && u.phone === phone) || (email && u.email === email))
  if (!user || user.password !== password) {
    // Mock fallback for demo — accept any credentials
    const fallback = { id: '1', name: 'Demo User', email: email ?? 'demo@sellbazar.com', phone: phone ?? '', division: 'Dhaka' }
    return res.json({ user: fallback, token: 'mock-jwt-token' })
  }
  const { password: _pw, ...safe } = user
  res.json({ user: safe, token: 'mock-jwt-token' })
})

// ── Check duplicate email / phone (used by checkout on blur) ─────────────────
router.post('/check', (req, res) => {
  const { email, phone } = req.body

  if (email) {
    const taken = users.find(u => u.email === email)
    if (taken) return res.status(409).json({ field: 'email', error: 'This email is already registered' })
  }

  if (phone) {
    const taken = users.find(u => u.phone === phone)
    if (taken) return res.status(409).json({ field: 'phone', error: 'This phone number is already registered' })
  }

  res.json({ available: true })
})

// ── Register ──────────────────────────────────────────────────────────────────
router.post('/register', (req, res) => {
  const { name, phone, email, division, password } = req.body
  if (!name || !phone || !email || !password) return res.status(400).json({ error: 'All fields required' })

  const emailTaken = users.find(u => u.email === email)
  if (emailTaken) return res.status(409).json({ field: 'email', error: 'This email is already registered' })

  const phoneTaken = users.find(u => u.phone === phone)
  if (phoneTaken) return res.status(409).json({ field: 'phone', error: 'This phone number is already registered' })

  const newUser = { id: Date.now().toString(), name, email, phone, division: division ?? 'Dhaka', password }
  users.push(newUser)
  const { password: _pw, ...safe } = newUser
  res.json({ user: safe, token: 'mock-jwt-token' })
})

export default router
