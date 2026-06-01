import { Router } from 'express'

const router = Router()

router.post('/login', (req, res) => {
  const { phone, password } = req.body
  if (!phone || !password) return res.status(400).json({ error: 'Phone and password required' })
  // Mock auth
  res.json({
    user: { id: '1', name: 'Demo User', phone, division: 'Dhaka' },
    token: 'mock-jwt-token'
  })
})

router.post('/register', (req, res) => {
  const { name, phone, password } = req.body
  if (!name || !phone || !password) return res.status(400).json({ error: 'All fields required' })
  res.json({
    user: { id: Date.now().toString(), name, phone, division: 'Dhaka' },
    token: 'mock-jwt-token'
  })
})

export default router
