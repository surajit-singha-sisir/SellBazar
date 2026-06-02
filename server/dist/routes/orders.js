import { Router } from 'express';
import { requireAdmin } from '../middleware/auth.js';
const router = Router();
// Helper: ISO date string N days ago from now
function daysAgo(n) {
    const d = new Date();
    d.setDate(d.getDate() - n);
    d.setHours(Math.floor(Math.random() * 14) + 6, Math.floor(Math.random() * 59), 0, 0);
    return d.toISOString();
}
// ── Realistic seed orders ─────────────────────────────────────────────────────
let orders = [
    {
        id: 'SB-240001',
        customer: { name: 'Rahim Uddin', email: 'rahim.uddin@gmail.com', phone: '01711-234567', address: 'House 12, Road 5, Dhanmondi, Dhaka' },
        items: [
            { productId: '1', name: 'Samsung Galaxy A55 5G', quantity: 1, price: 39999, image: 'https://placehold.co/60x60/f97316/fff?text=A55' }
        ],
        subtotal: 39999, shipping: 80, total: 40079,
        status: 'delivered', paymentMethod: 'bkash', paymentStatus: 'paid',
        notes: '', trackingNumber: 'SA-TRK-78234',
        createdAt: daysAgo(5), updatedAt: daysAgo(3)
    },
    {
        id: 'SB-240002',
        customer: { name: 'Fatema Begum', email: 'fatema.b@yahoo.com', phone: '01812-345678', address: 'Apt 4B, Bashundhara R/A, Dhaka' },
        items: [
            { productId: '4', name: 'Jamdani Muslin Saree', quantity: 2, price: 7200, image: 'https://placehold.co/60x60/ec4899/fff?text=Saree' }
        ],
        subtotal: 14400, shipping: 120, total: 14520,
        status: 'shipped', paymentMethod: 'cod', paymentStatus: 'pending',
        notes: 'Please wrap carefully', trackingNumber: 'SA-TRK-78299',
        createdAt: daysAgo(3), updatedAt: daysAgo(2)
    },
    {
        id: 'SB-240003',
        customer: { name: 'Karim Hossain', email: 'k.hossain@outlook.com', phone: '01955-456789', address: 'Village: Shibpur, Narsingdi' },
        items: [
            { productId: '7', name: 'PRAN Mango Juice 1L', quantity: 12, price: 99, image: 'https://placehold.co/60x60/fbbf24/fff?text=Juice' },
            { productId: '11', name: 'RFL Pressure Cooker 5L', quantity: 1, price: 1799, image: 'https://placehold.co/60x60/f59e0b/fff?text=RFL' }
        ],
        subtotal: 2987, shipping: 150, total: 3137,
        status: 'processing', paymentMethod: 'nagad', paymentStatus: 'paid',
        notes: '', trackingNumber: '',
        createdAt: daysAgo(1), updatedAt: daysAgo(1)
    },
    {
        id: 'SB-240004',
        customer: { name: 'Sumaiya Akter', email: 'sumaiya.akter@gmail.com', phone: '01676-567890', address: 'Holding 8, GEC Circle, Chittagong' },
        items: [
            { productId: '8', name: 'Lenovo IdeaPad Slim 5', quantity: 1, price: 84999, image: 'https://placehold.co/60x60/0ea5e9/fff?text=Lenovo' }
        ],
        subtotal: 84999, shipping: 200, total: 85199,
        status: 'pending', paymentMethod: 'bkash', paymentStatus: 'paid',
        notes: 'Call before delivery', trackingNumber: '',
        createdAt: daysAgo(0), updatedAt: daysAgo(0)
    },
    {
        id: 'SB-240005',
        customer: { name: 'Nasir Ahmed', email: 'nasir.a@proton.me', phone: '01517-678901', address: 'Plot 22, DOHS, Mirpur, Dhaka' },
        items: [
            { productId: '2', name: 'Nike Air Max 2027', quantity: 1, price: 9499, image: 'https://placehold.co/60x60/6366f1/fff?text=Nike' },
            { productId: '9', name: 'Aarong Cotton Kurta', quantity: 3, price: 2800, image: 'https://placehold.co/60x60/84cc16/fff?text=Kurta' }
        ],
        subtotal: 17899, shipping: 80, total: 17979,
        status: 'delivered', paymentMethod: 'rocket', paymentStatus: 'paid',
        notes: '', trackingNumber: 'SA-TRK-77891',
        createdAt: daysAgo(4), updatedAt: daysAgo(2)
    },
    {
        id: 'SB-240006',
        customer: { name: 'Nusrat Jahan', email: 'nusrat.jahan22@gmail.com', phone: '01399-789012', address: 'Road 3, Block D, Sylhet Sadar' },
        items: [
            { productId: '12', name: 'Meril Splash Body Wash', quantity: 4, price: 299, image: 'https://placehold.co/60x60/a78bfa/fff?text=Meril' }
        ],
        subtotal: 1196, shipping: 80, total: 1276,
        status: 'cancelled', paymentMethod: 'cod', paymentStatus: 'refunded',
        notes: 'Customer requested cancellation', trackingNumber: '',
        createdAt: daysAgo(6), updatedAt: daysAgo(5)
    },
    {
        id: 'SB-240007',
        customer: { name: 'Jamal Uddin', email: 'jamal.u@bd.net', phone: '01711-890123', address: 'Shahjalal Upashahar, Sylhet' },
        items: [
            { productId: '5', name: 'Xiaomi Redmi Note 13 Pro', quantity: 1, price: 29999, image: 'https://placehold.co/60x60/f97316/fff?text=Redmi' }
        ],
        subtotal: 29999, shipping: 80, total: 30079,
        status: 'pending', paymentMethod: 'bkash', paymentStatus: 'paid',
        notes: '', trackingNumber: '',
        createdAt: daysAgo(0), updatedAt: daysAgo(0)
    },
    {
        id: 'SB-240008',
        customer: { name: 'Rekha Das', email: 'rekha.das@gmail.com', phone: '01612-901234', address: 'Hospital Road, Rajshahi' },
        items: [
            { productId: '3', name: 'Walton Primo X7 Ultra', quantity: 1, price: 24999, image: 'https://placehold.co/60x60/10b981/fff?text=Walton' },
            { productId: '6', name: 'Smart QR POS Terminal', quantity: 1, price: 3800, image: 'https://placehold.co/60x60/8b5cf6/fff?text=POS' }
        ],
        subtotal: 28799, shipping: 150, total: 28949,
        status: 'delivered', paymentMethod: 'bank_transfer', paymentStatus: 'paid',
        notes: 'Business address, contact Mr. Das', trackingNumber: 'SA-TRK-78998',
        createdAt: daysAgo(2), updatedAt: daysAgo(1)
    },
    {
        id: 'SB-240009',
        customer: { name: 'Arif Rahman', email: 'arif.r@gmail.com', phone: '01855-012345', address: 'New Market Area, Comilla' },
        items: [
            { productId: '10', name: 'Symphony Z55 Pro', quantity: 2, price: 15499, image: 'https://placehold.co/60x60/06b6d4/fff?text=Symphony' }
        ],
        subtotal: 30998, shipping: 120, total: 31118,
        status: 'shipped', paymentMethod: 'nagad', paymentStatus: 'paid',
        notes: '', trackingNumber: 'SA-TRK-78401',
        createdAt: daysAgo(3), updatedAt: daysAgo(1)
    },
    {
        id: 'SB-240010',
        customer: { name: 'Lailun Nahar', email: 'lailun.n@yahoo.com', phone: '01411-123456', address: 'Court Road, Mymensingh' },
        items: [
            { productId: '9', name: 'Aarong Cotton Kurta', quantity: 2, price: 2800, image: 'https://placehold.co/60x60/84cc16/fff?text=Kurta' },
            { productId: '12', name: 'Meril Splash Body Wash', quantity: 2, price: 299, image: 'https://placehold.co/60x60/a78bfa/fff?text=Meril' }
        ],
        subtotal: 6198, shipping: 100, total: 6298,
        status: 'delivered', paymentMethod: 'bkash', paymentStatus: 'paid',
        notes: '', trackingNumber: 'SA-TRK-78102',
        createdAt: daysAgo(20), updatedAt: daysAgo(18)
    },
    {
        id: 'SB-240011',
        customer: { name: 'Tanvir Islam', email: 'tanvir.islam@gmail.com', phone: '01799-111222', address: 'Gulshan 2, Dhaka' },
        items: [
            { productId: '1', name: 'Samsung Galaxy A55 5G', quantity: 2, price: 39999, image: 'https://placehold.co/60x60/f97316/fff?text=A55' }
        ],
        subtotal: 79998, shipping: 100, total: 80098,
        status: 'delivered', paymentMethod: 'bkash', paymentStatus: 'paid',
        notes: '', trackingNumber: 'SA-TRK-79001',
        createdAt: daysAgo(25), updatedAt: daysAgo(23)
    },
    {
        id: 'SB-240012',
        customer: { name: 'Sharmin Akter', email: 'sharmin.a@gmail.com', phone: '01655-333444', address: 'Uttara Sector 7, Dhaka' },
        items: [
            { productId: '8', name: 'Lenovo IdeaPad Slim 5', quantity: 1, price: 84999, image: 'https://placehold.co/60x60/0ea5e9/fff?text=Lenovo' }
        ],
        subtotal: 84999, shipping: 200, total: 85199,
        status: 'delivered', paymentMethod: 'card', paymentStatus: 'paid',
        notes: '', trackingNumber: 'SA-TRK-79011',
        createdAt: daysAgo(15), updatedAt: daysAgo(12)
    },
    {
        id: 'SB-240013',
        customer: { name: 'Mahbub Rahman', email: 'mahbub.r@yahoo.com', phone: '01533-555666', address: 'Agrabad, Chittagong' },
        items: [
            { productId: '5', name: 'Xiaomi Redmi Note 13 Pro', quantity: 1, price: 29999, image: 'https://placehold.co/60x60/f97316/fff?text=Redmi' },
            { productId: '6', name: 'Smart QR POS Terminal', quantity: 2, price: 3800, image: 'https://placehold.co/60x60/8b5cf6/fff?text=POS' }
        ],
        subtotal: 37599, shipping: 120, total: 37719,
        status: 'processing', paymentMethod: 'nagad', paymentStatus: 'paid',
        notes: 'Office delivery', trackingNumber: '',
        createdAt: daysAgo(2), updatedAt: daysAgo(2)
    },
    {
        id: 'SB-240014',
        customer: { name: 'Parvin Sultana', email: 'parvin.s@proton.me', phone: '01877-777888', address: 'Sylhet City, Sylhet' },
        items: [
            { productId: '4', name: 'Jamdani Muslin Saree', quantity: 3, price: 7200, image: 'https://placehold.co/60x60/ec4899/fff?text=Saree' }
        ],
        subtotal: 21600, shipping: 150, total: 21750,
        status: 'delivered', paymentMethod: 'bkash', paymentStatus: 'paid',
        notes: '', trackingNumber: 'SA-TRK-79021',
        createdAt: daysAgo(10), updatedAt: daysAgo(7)
    },
    {
        id: 'SB-240015',
        customer: { name: 'Rahim Uddin', email: 'rahim.uddin@gmail.com', phone: '01711-234567', address: 'House 12, Road 5, Dhanmondi, Dhaka' },
        items: [
            { productId: '7', name: 'PRAN Mango Juice 1L', quantity: 24, price: 99, image: 'https://placehold.co/60x60/fbbf24/fff?text=Juice' }
        ],
        subtotal: 2376, shipping: 80, total: 2456,
        status: 'delivered', paymentMethod: 'bkash', paymentStatus: 'paid',
        notes: 'Monthly restock', trackingNumber: 'SA-TRK-79031',
        createdAt: daysAgo(8), updatedAt: daysAgo(6)
    },
];
export { orders };
// ── ADMIN routes (all protected) ──────────────────────────────────────────────
// GET /api/orders/by-id/:id  — public route for order owner to track their order
router.get('/by-id/:id', (req, res) => {
    const order = orders.find(o => o.id === req.params.id);
    if (!order)
        return res.status(404).json({ error: 'Order not found' });
    // Return a safe subset (no need to expose all customer details publicly)
    const { id, items, subtotal, shipping, total, status, paymentMethod, paymentStatus, trackingNumber, createdAt, updatedAt, customer } = order;
    res.json({ id, items, subtotal, shipping, total, status, paymentMethod, paymentStatus, trackingNumber, createdAt, updatedAt, customer });
});
// GET /api/orders  — list all orders with optional filters
router.get('/', requireAdmin, (req, res) => {
    const { status, q, limit, page } = req.query;
    let result = [...orders];
    if (status && status !== 'all') {
        result = result.filter(o => o.status === status);
    }
    if (q) {
        const lq = q.toLowerCase();
        result = result.filter(o => o.id.toLowerCase().includes(lq) ||
            o.customer.name.toLowerCase().includes(lq) ||
            o.customer.email.toLowerCase().includes(lq) ||
            o.customer.phone.includes(lq));
    }
    // Sort newest first
    result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    const total = result.length;
    const pageNum = parseInt(page ?? '1');
    const pageSize = parseInt(limit ?? '50');
    result = result.slice((pageNum - 1) * pageSize, pageNum * pageSize);
    res.json({ data: result, total, page: pageNum, pageSize });
});
// GET /api/orders/stats  — summary statistics for dashboard
router.get('/stats', requireAdmin, (req, res) => {
    const statusCounts = orders.reduce((acc, o) => {
        acc[o.status] = (acc[o.status] ?? 0) + 1;
        return acc;
    }, {});
    const revenue = orders
        .filter(o => o.paymentStatus === 'paid')
        .reduce((sum, o) => sum + o.total, 0);
    res.json({
        total: orders.length,
        statusCounts,
        revenue,
        pending: statusCounts['pending'] ?? 0,
    });
});
// GET /api/orders/:id  — get single order
router.get('/:id', requireAdmin, (req, res) => {
    const order = orders.find(o => o.id === req.params.id);
    if (!order)
        return res.status(404).json({ error: 'Order not found' });
    res.json(order);
});
// POST /api/orders  — create order (public — storefront checkout)
// Note: storefront creates orders; only GET/PUT/DELETE are admin-only
router.post('/', (req, res) => {
    const { customer, items, subtotal, shipping, total, paymentMethod } = req.body;
    if (!customer || !items?.length || !total) {
        return res.status(400).json({ error: 'customer, items, and total are required' });
    }
    const order = {
        id: `SB-${Date.now()}`,
        customer,
        items,
        subtotal: Number(subtotal ?? total),
        shipping: Number(shipping ?? 0),
        discount: Number(req.body.discount ?? 0),
        couponCode: req.body.couponCode ?? null,
        total: Number(total),
        status: 'pending',
        paymentMethod: paymentMethod ?? 'cod',
        paymentStatus: 'pending',
        notes: req.body.notes ?? '',
        trackingNumber: '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    };
    orders.unshift(order);
    res.status(201).json(order);
});
// PUT /api/orders/:id  — update order status / details
router.put('/:id', requireAdmin, (req, res) => {
    const idx = orders.findIndex(o => o.id === req.params.id);
    if (idx === -1)
        return res.status(404).json({ error: 'Order not found' });
    const updated = {
        ...orders[idx],
        ...req.body,
        id: orders[idx].id,
        updatedAt: new Date().toISOString(),
    };
    orders[idx] = updated;
    res.json(updated);
});
// DELETE /api/orders/:id  — delete order
router.delete('/:id', requireAdmin, (req, res) => {
    const idx = orders.findIndex(o => o.id === req.params.id);
    if (idx === -1)
        return res.status(404).json({ error: 'Order not found' });
    const [deleted] = orders.splice(idx, 1);
    res.json({ message: 'Order deleted', id: deleted.id });
});
export default router;
