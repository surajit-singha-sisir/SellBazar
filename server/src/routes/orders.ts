import { Router } from 'express'

const router = Router()

const mockOrders = [
  { id: 'SB-240001', items: [{ name: 'Samsung Galaxy A55', quantity: 1, price: 39999 }], total: 39999, status: 'delivered', paymentMethod: 'bkash', createdAt: '2027-01-15T10:00:00Z' },
  { id: 'SB-240002', items: [{ name: 'Jamdani Muslin Saree', quantity: 2, price: 7200 }], total: 14400, status: 'shipped', paymentMethod: 'cod', createdAt: '2027-01-20T14:00:00Z' },
  { id: 'SB-240003', items: [{ name: 'PRAN Mango Juice 1L', quantity: 6, price: 99 }], total: 594, status: 'processing', paymentMethod: 'nagad', createdAt: '2027-01-25T09:00:00Z' },
]

router.get('/', (_req, res) => {
  res.json({ data: mockOrders, total: mockOrders.length })
})

router.post('/', (req, res) => {
  const order = { ...req.body, id: `SB-${Date.now()}`, status: 'pending', createdAt: new Date().toISOString() }
  res.status(201).json(order)
})

export default router
