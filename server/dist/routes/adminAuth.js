import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { JWT_SECRET, requireAdmin } from '../middleware/auth.js';
const router = Router();
// Hardcoded admin credentials (in production, use DB + hashed passwords)
const ADMIN_ACCOUNTS = [
    { id: 'admin-1', email: 'admin@sellbazar.com', password: 'Admin@1234', role: 'superadmin', name: 'Super Admin' },
    { id: 'admin-2', email: 'manager@sellbazar.com', password: 'Manager@123', role: 'admin', name: 'Store Manager' },
];
// POST /api/admin/login
router.post('/login', (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password required' });
    }
    const admin = ADMIN_ACCOUNTS.find(a => a.email === email && a.password === password);
    if (!admin) {
        return res.status(401).json({ error: 'Invalid credentials' });
    }
    const token = jwt.sign({ id: admin.id, email: admin.email, role: admin.role }, JWT_SECRET, { expiresIn: '24h' });
    res.json({
        token,
        admin: { id: admin.id, email: admin.email, role: admin.role, name: admin.name }
    });
});
// GET /api/admin/me  — verify token & return admin info
router.get('/me', requireAdmin, (req, res) => {
    res.json({ admin: req.admin });
});
// POST /api/admin/logout (client just deletes token, but endpoint for audit)
router.post('/logout', requireAdmin, (_req, res) => {
    res.json({ message: 'Logged out' });
});
export default router;
