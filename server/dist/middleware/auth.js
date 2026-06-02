import jwt from 'jsonwebtoken';
export const JWT_SECRET = process.env.JWT_SECRET ?? 'sellbazar-super-secret-key-2025';
export function requireAdmin(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'No token provided' });
    }
    const token = authHeader.slice(7);
    try {
        const payload = jwt.verify(token, JWT_SECRET);
        if (payload.role !== 'admin' && payload.role !== 'superadmin') {
            return res.status(403).json({ error: 'Admin access required' });
        }
        req.admin = payload;
        next();
    }
    catch {
        return res.status(401).json({ error: 'Invalid or expired token' });
    }
}
