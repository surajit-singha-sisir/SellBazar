import { Router } from 'express';
const router = Router();
// In-memory per-user storage  { userId -> data }
const userCarts = {};
const userWishlists = {};
// ── Simple token extraction helper ───────────────────────────────────────────
// For the demo "mock-jwt-token" we just trust the userId sent in header/body.
// Replace with real JWT verification when you add proper auth.
function getUserId(req) {
    // Prefer X-User-Id header; fall back to body.userId
    return req.headers['x-user-id'] ?? req.body?.userId ?? null;
}
// ── Cart ──────────────────────────────────────────────────────────────────────
router.get('/cart', (req, res) => {
    const uid = getUserId(req);
    if (!uid)
        return res.status(401).json({ error: 'Unauthorized' });
    res.json({ cart: userCarts[uid] ?? [] });
});
router.post('/cart', (req, res) => {
    const uid = getUserId(req);
    if (!uid)
        return res.status(401).json({ error: 'Unauthorized' });
    const { cart } = req.body;
    if (!Array.isArray(cart))
        return res.status(400).json({ error: 'cart must be an array' });
    userCarts[uid] = cart;
    res.json({ ok: true });
});
// ── Wishlist ──────────────────────────────────────────────────────────────────
router.get('/wishlist', (req, res) => {
    const uid = getUserId(req);
    if (!uid)
        return res.status(401).json({ error: 'Unauthorized' });
    res.json({ wishlist: userWishlists[uid] ?? [] });
});
router.post('/wishlist', (req, res) => {
    const uid = getUserId(req);
    if (!uid)
        return res.status(401).json({ error: 'Unauthorized' });
    const { wishlist } = req.body;
    if (!Array.isArray(wishlist))
        return res.status(400).json({ error: 'wishlist must be an array' });
    userWishlists[uid] = wishlist;
    res.json({ ok: true });
});
// ── Clear all user data (called on logout from client, optional) ──────────────
router.delete('/userdata', (req, res) => {
    const uid = getUserId(req);
    if (!uid)
        return res.status(401).json({ error: 'Unauthorized' });
    delete userCarts[uid];
    delete userWishlists[uid];
    res.json({ ok: true });
});
export default router;
