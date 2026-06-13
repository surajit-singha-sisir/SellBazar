// api/index.js — Vercel Serverless Function (plain CJS, no build step)
// DB: Neon Serverless Postgres via @neondatabase/serverless

const express        = require('express')
const cors           = require('cors')
const jwt            = require('jsonwebtoken')
const { neon }       = require('@neondatabase/serverless')
const { randomBytes } = require('crypto')

// ── Neon client ───────────────────────────────────────────────────────────────
if (!process.env.DATABASE_URL) {
  console.error('FATAL: DATABASE_URL env var missing.')
}
const sql = neon(process.env.DATABASE_URL)

// ── Auth helpers ──────────────────────────────────────────────────────────────
const JWT_SECRET = process.env.JWT_SECRET ?? 'sellbazar-super-secret-key-2025'

function requireAdmin(req, res, next) {
  const h = req.headers.authorization
  if (!h?.startsWith('Bearer ')) return res.status(401).json({ error: 'No token provided' })
  try {
    const payload = jwt.verify(h.slice(7), JWT_SECRET)
    if (payload.role !== 'admin' && payload.role !== 'superadmin')
      return res.status(403).json({ error: 'Admin access required' })
    req.admin = payload
    next()
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' })
  }
}

// ── App setup ─────────────────────────────────────────────────────────────────
const app = express()

const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
  : ['http://localhost:5173','http://localhost:5174','http://localhost:3000','https://sell-bazar.vercel.app']

app.use(cors({
  origin: (origin, cb) => {
    if (!origin || allowedOrigins.includes(origin)) return cb(null, true)
    cb(new Error('CORS: origin not allowed'))
  },
  credentials: true,
}))
app.use(express.json({ limit: '10mb' }))

// ── Health ────────────────────────────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', service: 'SellBazar API', time: new Date().toISOString(), db: 'neon' })
})

// ── Phone normalizer ──────────────────────────────────────────────────────────
function normalizePhone(raw) {
  const d = raw.replace(/\D/g, '')
  if (d.startsWith('880')) return '+' + d
  if (d.startsWith('0'))   return '+880' + d.slice(1)
  return '+880' + d
}

function toSlug(n) { return n.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,'') }

// ── DB helpers: row → JS camelCase ────────────────────────────────────────────
function rowToProduct(r) {
  return {
    id: r.id, slug: r.slug, name: r.name, nameBn: r.name_bn,
    description: r.description, price: Number(r.price), salePrice: Number(r.sale_price),
    category: r.category, subcategory: r.subcategory, categoryBn: r.category_bn,
    brand: r.brand, seller: r.seller, stock: r.stock, rating: Number(r.rating),
    reviewCount: r.review_count, location: r.location, deliveryDays: r.delivery_days,
    isNew: r.is_new, isFeatured: r.is_featured,
    tags: r.tags ?? [], images: r.images ?? [],
    createdAt: r.created_at, updatedAt: r.updated_at,
  }
}
function rowToOrder(r) {
  return {
    id: r.id, customer: r.customer, items: r.items,
    subtotal: Number(r.subtotal), shipping: Number(r.shipping),
    discount: Number(r.discount), couponCode: r.coupon_code,
    total: Number(r.total), status: r.status,
    paymentMethod: r.payment_method, paymentStatus: r.payment_status,
    notes: r.notes, trackingNumber: r.tracking_number,
    createdAt: r.created_at, updatedAt: r.updated_at,
  }
}
function rowToCategory(r) {
  return {
    id: r.id, slug: r.slug, name: r.name, nameBn: r.name_bn,
    icon: r.icon, color: r.color, subcategories: r.subcategories ?? [],
    createdAt: r.created_at,
  }
}
function rowToReview(r) {
  return {
    id: r.id, productId: r.product_id, productSlug: r.product_slug,
    productName: r.product_name, orderId: r.order_id, userId: r.user_id,
    userName: r.user_name, userEmail: r.user_email, rating: Number(r.rating),
    title: r.title, body: r.body, images: r.images ?? [],
    status: r.status, helpful: r.helpful, adminNote: r.admin_note,
    createdAt: r.created_at,
  }
}
function rowToBanner(r) {
  return {
    id: r.id, tag: r.tag, title: r.title, subtitle: r.subtitle,
    cta: r.cta, link: r.link, image: r.image, active: r.active,
    order: r.display_order,
  }
}

// ── Admin accounts (hardcoded) ────────────────────────────────────────────────
const ADMIN_ACCOUNTS = [
  { id:'admin-1', email:'admin@sellbazar.com',   password:'Admin@1234',   role:'superadmin', name:'Super Admin'   },
  { id:'admin-2', email:'manager@sellbazar.com', password:'Manager@123',  role:'admin',      name:'Store Manager' },
]

// ═══════════════════════════════════════════════════════════════════════════════
// SEED DATA
// ═══════════════════════════════════════════════════════════════════════════════
const SEED_PRODUCTS = [
  { id:'1',  slug:'samsung-galaxy-a55',   name:'Samsung Galaxy A55 5G',       nameBn:'স্যামসাং গ্যালাক্সি A55',  description:'6.6" AMOLED, 50MP camera, 5000mAh',                    price:45000, salePrice:39999, images:['https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=400&h=400&fit=crop'], category:'Electronics', subcategory:'mobile-phones',  categoryBn:'ইলেকট্রনিক্স', brand:'Samsung',     stock:42,  rating:4.6, reviewCount:318, tags:['phone','5g','samsung'],           isNew:true,  isFeatured:false, deliveryDays:2, seller:'TechWorld BD',    location:'Dhaka',       createdAt:'2025-01-10T10:00:00Z', updatedAt:'2025-01-10T10:00:00Z' },
  { id:'2',  slug:'nike-air-max-2027',    name:'Nike Air Max 2027',            nameBn:'নাইকি এয়ার ম্যাক্স',      description:'Future-forward cushioning, breathable mesh',             price:12000, salePrice:9499,  images:['https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&h=400&fit=crop'], category:'Fashion',     subcategory:'footwear',       categoryBn:'ফ্যাশন',      brand:'Nike',        stock:80,  rating:4.8, reviewCount:512, tags:['shoes','sneakers'],               isNew:false, isFeatured:false, deliveryDays:3, seller:'SportZone',       location:'Chittagong',  createdAt:'2025-01-12T10:00:00Z', updatedAt:'2025-01-12T10:00:00Z' },
  { id:'3',  slug:'walton-primo-x7',      name:'Walton Primo X7 Ultra',        nameBn:'ওয়ালটন প্রিমো X7',        description:'Made in Bangladesh, 108MP, 6000mAh',                     price:28000, salePrice:24999, images:['https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400&h=400&fit=crop'], category:'Electronics', subcategory:'mobile-phones',  categoryBn:'ইলেকট্রনিক্স', brand:'Walton',      stock:65,  rating:4.3, reviewCount:224, tags:['phone','walton','local'],          isNew:false, isFeatured:true,  deliveryDays:1, seller:'Walton Official', location:'Dhaka',       createdAt:'2025-01-14T10:00:00Z', updatedAt:'2025-01-14T10:00:00Z' },
  { id:'4',  slug:'muslin-saree-jamdani', name:'Jamdani Muslin Saree',         nameBn:'জামদানি মসলিন শাড়ি',     description:'Authentic Dhaka Muslin, UNESCO heritage craft',          price:8500,  salePrice:7200,  images:['https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=400&h=400&fit=crop'], category:'Fashion',     subcategory:'sarees',         categoryBn:'ফ্যাশন',      brand:'Dhaka Muslin',stock:20,  rating:4.9, reviewCount:187, tags:['saree','jamdani','traditional'],  isNew:false, isFeatured:true,  deliveryDays:4, seller:'Muslin House',    location:'Narayanganj', createdAt:'2025-01-15T10:00:00Z', updatedAt:'2025-01-15T10:00:00Z' },
  { id:'5',  slug:'xiaomi-redmi-note-13', name:'Xiaomi Redmi Note 13 Pro',     nameBn:'শাওমি রেডমি নোট ১৩',     description:'200MP OIS camera, 5100mAh, 67W charging',               price:35000, salePrice:29999, images:['https://images.unsplash.com/photo-1585060544812-6b45742d762f?w=400&h=400&fit=crop'], category:'Electronics', subcategory:'mobile-phones',  categoryBn:'ইলেকট্রনিক্স', brand:'Xiaomi',      stock:55,  rating:4.5, reviewCount:443, tags:['phone','xiaomi'],                 isNew:true,  isFeatured:false, deliveryDays:2, seller:'MiStore BD',      location:'Dhaka',       createdAt:'2025-01-16T10:00:00Z', updatedAt:'2025-01-16T10:00:00Z' },
  { id:'6',  slug:'bkash-qr-scanner',     name:'Smart QR POS Terminal',        nameBn:'স্মার্ট QR টার্মিনাল',   description:'bKash/Nagad/Rocket integrated, touchscreen',             price:4500,  salePrice:3800,  images:['https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=400&h=400&fit=crop'], category:'Business',    subcategory:'pos-systems',    categoryBn:'ব্যবসা',       brand:'PayTech BD',  stock:100, rating:4.4, reviewCount:89,  tags:['pos','qr','payment'],             isNew:false, isFeatured:false, deliveryDays:3, seller:'PayTech',         location:'Dhaka',       createdAt:'2025-01-17T10:00:00Z', updatedAt:'2025-01-17T10:00:00Z' },
  { id:'7',  slug:'pran-mango-juice-1l',  name:'PRAN Mango Juice 1L',          nameBn:'প্রাণ আম জুস',            description:'100% real mango, no preservatives, 1 litre',            price:120,   salePrice:99,    images:['https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=400&h=400&fit=crop'], category:'Grocery',     subcategory:'beverages',      categoryBn:'মুদিখানা',    brand:'PRAN',        stock:500, rating:4.7, reviewCount:1200,tags:['juice','pran','mango'],           isNew:false, isFeatured:false, deliveryDays:1, seller:'PRAN Foods',      location:'Nationwide',  createdAt:'2025-01-18T10:00:00Z', updatedAt:'2025-01-18T10:00:00Z' },
  { id:'8',  slug:'lenovo-ideapad-slim5', name:'Lenovo IdeaPad Slim 5',        nameBn:'লেনোভো আইডিয়াপ্যাড',   description:'AMD Ryzen 7, 16GB RAM, 512GB SSD, 14" OLED',            price:95000, salePrice:84999, images:['https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=400&h=400&fit=crop'], category:'Electronics', subcategory:'laptops',        categoryBn:'ইলেকট্রনিক্স', brand:'Lenovo',      stock:18,  rating:4.6, reviewCount:267, tags:['laptop','lenovo','amd'],          isNew:false, isFeatured:true,  deliveryDays:3, seller:'LaptopHouse BD',  location:'Dhaka',       createdAt:'2025-01-19T10:00:00Z', updatedAt:'2025-01-19T10:00:00Z' },
  { id:'9',  slug:'aarong-kurta-men',     name:'Aarong Cotton Kurta',          nameBn:'আড়ং কটন কুর্তা',        description:'Handloom cotton, block print, exclusive Aarong design', price:3500,  salePrice:2800,  images:['https://images.unsplash.com/photo-1586790170083-2f9ceadc732d?w=400&h=400&fit=crop'], category:'Fashion',     subcategory:'mens-clothing',  categoryBn:'ফ্যাশন',      brand:'Aarong',      stock:150, rating:4.7, reviewCount:342, tags:['kurta','aarong','traditional'],   isNew:false, isFeatured:false, deliveryDays:2, seller:'Aarong Official', location:'Dhaka',       createdAt:'2025-01-20T10:00:00Z', updatedAt:'2025-01-20T10:00:00Z' },
  { id:'10', slug:'symphony-z55',         name:'Symphony Z55 Pro',             nameBn:'সিম্ফনি Z55 প্রো',       description:'Local brand, 6.7" display, 5000mAh, dual camera',       price:18000, salePrice:15499, images:['https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=400&h=400&fit=crop'], category:'Electronics', subcategory:'mobile-phones',  categoryBn:'ইলেকট্রনিক্স', brand:'Symphony',    stock:90,  rating:4.1, reviewCount:156, tags:['phone','symphony','local'],       isNew:true,  isFeatured:false, deliveryDays:1, seller:'Symphony Official',location:'Dhaka',      createdAt:'2025-01-21T10:00:00Z', updatedAt:'2025-01-21T10:00:00Z' },
  { id:'11', slug:'rfl-pressure-cooker',  name:'RFL Pressure Cooker 5L',       nameBn:'আরএফএল প্রেশার কুকার',  description:'5-litre stainless steel, safety valve, Bangladesh made', price:2200,  salePrice:1799,  images:['https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=400&h=400&fit=crop'], category:'Home & Living',subcategory:'kitchen',        categoryBn:'হোম',          brand:'RFL',         stock:200, rating:4.5, reviewCount:890, tags:['kitchen','rfl','cookware'],       isNew:false, isFeatured:false, deliveryDays:3, seller:'RFL Houseware',   location:'Nationwide',  createdAt:'2025-01-22T10:00:00Z', updatedAt:'2025-01-22T10:00:00Z' },
  { id:'12', slug:'meril-splash-bodywash',name:'Meril Splash Body Wash',       nameBn:'মেরিল স্প্ল্যাশ',       description:'Fresh citrus scent, moisturizing formula, 500ml',        price:350,   salePrice:299,   images:['https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=400&h=400&fit=crop'], category:'Beauty',      subcategory:'skincare',       categoryBn:'বিউটি',        brand:'Meril',       stock:300, rating:4.3, reviewCount:567, tags:['bodycare','meril','beauty'],      isNew:false, isFeatured:false, deliveryDays:2, seller:'Meril Beauty',    location:'Nationwide',  createdAt:'2025-01-23T10:00:00Z', updatedAt:'2025-01-23T10:00:00Z' },
  { id:'13', slug:'sony-wh1000xm5',       name:'Sony WH-1000XM5',              nameBn:'সনি হেডফোন XM5',         description:'Industry-leading ANC, 30hr battery, LDAC',              price:32000, salePrice:27500, images:['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=400&fit=crop'], category:'Electronics', subcategory:'headphones',     categoryBn:'ইলেকট্রনিক্স', brand:'Sony',        stock:30,  rating:4.8, reviewCount:532, tags:['headphones','anc','sony'],        isNew:false, isFeatured:true,  deliveryDays:3, seller:'AudioZone BD',    location:'Dhaka',       createdAt:'2025-01-24T10:00:00Z', updatedAt:'2025-01-24T10:00:00Z' },
  { id:'14', slug:'apple-watch-s9',       name:'Apple Watch Series 9',         nameBn:'অ্যাপল ওয়াচ S9',       description:'S9 chip, Always-On Display, ECG, Blood Oxygen',         price:55000, salePrice:49999, images:['https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=400&h=400&fit=crop'], category:'Electronics', subcategory:'smart-watches',  categoryBn:'ইলেকট্রনিক্স', brand:'Apple',       stock:15,  rating:4.9, reviewCount:189, tags:['smartwatch','apple','wearable'],  isNew:true,  isFeatured:false, deliveryDays:2, seller:'iZone Bangladesh', location:'Dhaka',      createdAt:'2025-01-25T10:00:00Z', updatedAt:'2025-01-25T10:00:00Z' },
  { id:'15', slug:'basmati-rice-5kg',     name:'Premium Basmati Rice 5kg',     nameBn:'বাসমতি চাল ৫ কেজি',     description:'Long-grain aged basmati, low GI, fragrant',              price:980,   salePrice:849,   images:['https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400&h=400&fit=crop'], category:'Grocery',     subcategory:'rice-grains',    categoryBn:'মুদিখানা',    brand:'Gold Coin',   stock:300, rating:4.6, reviewCount:540, tags:['rice','basmati','grocery'],       isNew:false, isFeatured:false, deliveryDays:1, seller:'Meena Bazaar',    location:'Dhaka',       createdAt:'2025-01-26T10:00:00Z', updatedAt:'2025-01-26T10:00:00Z' },
  { id:'16', slug:'loreal-vitamin-c',     name:"L'Oréal Vitamin C Serum",      nameBn:'লোরিয়াল ভিটামিন C',    description:'10% pure Vitamin C, anti-aging, brightening, 30ml',     price:2200,  salePrice:1799,  images:['https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=400&h=400&fit=crop'], category:'Beauty',      subcategory:'skincare',       categoryBn:'বিউটি',        brand:"L'Oréal",    stock:75,  rating:4.6, reviewCount:423, tags:['serum','skincare','vitamin-c'],   isNew:true,  isFeatured:false, deliveryDays:2, seller:'BeautyWorld BD',  location:'Dhaka',       createdAt:'2025-01-27T10:00:00Z', updatedAt:'2025-01-27T10:00:00Z' },
  { id:'17', slug:'walton-ac-1ton',       name:'Walton Inverter AC 1 Ton',     nameBn:'ওয়ালটন ১ টন এসি',      description:'Inverter, Wi-Fi Control, Auto-Clean, Energy A+++',       price:55000, salePrice:47999, images:['https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=400&h=400&fit=crop'], category:'Home & Living',subcategory:'air-conditioners',categoryBn:'হোম',          brand:'Walton',      stock:25,  rating:4.5, reviewCount:178, tags:['ac','inverter','walton','home'],  isNew:false, isFeatured:true,  deliveryDays:5, seller:'Walton Official', location:'Dhaka',       createdAt:'2025-01-28T10:00:00Z', updatedAt:'2025-01-28T10:00:00Z' },
  { id:'18', slug:'gp-cricket-bat',       name:'GP Pro Cricket Bat',           nameBn:'জিপি ক্রিকেট ব্যাট',   description:'Grade 1 English Willow, full size, pre-knocked',         price:9500,  salePrice:7999,  images:['https://images.unsplash.com/photo-1531415074968-036ba1b575da?w=400&h=400&fit=crop'], category:'Sports',      subcategory:'cricket',        categoryBn:'স্পোর্টস',    brand:'GP',          stock:35,  rating:4.7, reviewCount:143, tags:['cricket','bat','willow'],         isNew:true,  isFeatured:false, deliveryDays:3, seller:'Sports Arena BD', location:'Dhaka',       createdAt:'2025-01-29T10:00:00Z', updatedAt:'2025-01-29T10:00:00Z' },
  { id:'19', slug:'humayun-himu',         name:'হুমায়ূন আহমেদ হিমু সমগ্র',   nameBn:'হুমায়ূন আহমেদ হিমু সমগ্র',description:'Complete Himu series, 5 volumes, hardcover',            price:1800,  salePrice:1499,  images:['https://images.unsplash.com/photo-1512820790803-83ca734da794?w=400&h=400&fit=crop'], category:'Books',       subcategory:'bangla-literature',categoryBn:'বই',           brand:'Bhasha Prakash',stock:150,rating:5.0,reviewCount:987, tags:['bangla','novel','humayun','himu'],isNew:false, isFeatured:true,  deliveryDays:2, seller:'Rokomari',        location:'Dhaka',       createdAt:'2025-01-30T10:00:00Z', updatedAt:'2025-01-30T10:00:00Z' },
  { id:'20', slug:'polo-shirt-men',       name:"Men's Premium Polo Shirt",     nameBn:'পুরুষ পোলো শার্ট',      description:'100% Egyptian Cotton, slim fit, 12 colors',              price:1800,  salePrice:1299,  images:['https://images.unsplash.com/photo-1586790170083-2f9ceadc732d?w=400&h=400&fit=crop'], category:'Fashion',     subcategory:'mens-clothing',  categoryBn:'ফ্যাশন',      brand:'Thread & Co',stock:200, rating:4.5, reviewCount:892, tags:['shirt','polo','men','cotton'],    isNew:true,  isFeatured:false, deliveryDays:2, seller:'StyleHub BD',     location:'Dhaka',       createdAt:'2025-01-31T10:00:00Z', updatedAt:'2025-01-31T10:00:00Z' },
  { id:'21', slug:'canon-eos-r50',        name:'Canon EOS R50 Mirrorless',     nameBn:'ক্যানন EOS R50',         description:'24.2MP APS-C, 4K Video, Dual Pixel AF',                  price:85000, salePrice:74999, images:['https://images.unsplash.com/photo-1502982720700-bfff97f2ecac?w=400&h=400&fit=crop'], category:'Electronics', subcategory:'cameras',        categoryBn:'ইলেকট্রনিক্স', brand:'Canon',       stock:12,  rating:4.7, reviewCount:98,  tags:['camera','canon','mirrorless'],    isNew:false, isFeatured:false, deliveryDays:4, seller:'PixelPro BD',     location:'Dhaka',       createdAt:'2025-02-01T10:00:00Z', updatedAt:'2025-02-01T10:00:00Z' },
  { id:'22', slug:'samsung-65-qled-tv',   name:'Samsung 65" QLED 4K Smart TV', nameBn:'স্যামসাং QLED ৬৫" টিভি',description:'Quantum HDR, 120Hz, Dolby Atmos, Gaming Mode',           price:145000,salePrice:129000,images:['https://images.unsplash.com/photo-1593359677879-a4bb92f829e1?w=400&h=400&fit=crop'], category:'Electronics', subcategory:'televisions',    categoryBn:'ইলেকট্রনিক্স', brand:'Samsung',     stock:8,   rating:4.7, reviewCount:143, tags:['tv','qled','4k','samsung'],       isNew:false, isFeatured:true,  deliveryDays:5, seller:'TechWorld BD',    location:'Dhaka',       createdAt:'2025-02-02T10:00:00Z', updatedAt:'2025-02-02T10:00:00Z' },
  { id:'23', slug:'ladies-kurti-set',     name:'Ladies Embroidered Kurti Set', nameBn:'লেডিজ কুর্তি সেট',     description:'Hand embroidery, cotton-blend, 3-piece set, festive',    price:3500,  salePrice:2799,  images:['https://images.unsplash.com/photo-1594938298603-c8148c4b2ef4?w=400&h=400&fit=crop'], category:'Fashion',     subcategory:'womens-clothing',categoryBn:'ফ্যাশন',      brand:'Aarong',      stock:45,  rating:4.7, reviewCount:341, tags:['kurti','ladies','eid'],           isNew:false, isFeatured:true,  deliveryDays:3, seller:'Aarong Official', location:'Dhaka',       createdAt:'2025-02-03T10:00:00Z', updatedAt:'2025-02-03T10:00:00Z' },
  { id:'24', slug:'atomic-habits-bangla', name:'Atomic Habits (Bangla Ed.)',   nameBn:'অ্যাটমিক হ্যাবিটস',   description:'James Clear, Bangla Edition, Paperback, Self-help',      price:450,   salePrice:380,   images:['https://images.unsplash.com/photo-1589829085413-56de8ae18c73?w=400&h=400&fit=crop'], category:'Books',       subcategory:'self-help',      categoryBn:'বই',           brand:'Ananya',      stock:200, rating:4.8, reviewCount:654, tags:['self-help','habits'],             isNew:true,  isFeatured:false, deliveryDays:2, seller:'Rokomari',        location:'Dhaka',       createdAt:'2025-02-04T10:00:00Z', updatedAt:'2025-02-04T10:00:00Z' },
  { id:'25', slug:'rasasi-oud-perfume',   name:'Rasasi Oud Al Layl EDP 100ml', nameBn:'রাসাসি উদ পারফিউম',    description:'Arabian Oud, long lasting 12hr, unisex, woody-floral',  price:4500,  salePrice:3800,  images:['https://images.unsplash.com/photo-1541643600914-78b084683702?w=400&h=400&fit=crop'], category:'Beauty',      subcategory:'fragrances',     categoryBn:'বিউটি',        brand:'Rasasi',      stock:40,  rating:4.8, reviewCount:267, tags:['perfume','oud','fragrance'],      isNew:false, isFeatured:false, deliveryDays:3, seller:'Fragrance House BD',location:'Dhaka',      createdAt:'2025-02-05T10:00:00Z', updatedAt:'2025-02-05T10:00:00Z' },
  { id:'26', slug:'miyako-rice-cooker',   name:'Miyako 5L Digital Rice Cooker',nameBn:'মিয়াকো রাইস কুকার',   description:'Multi-cook, keep warm, non-stick inner pot',              price:3200,  salePrice:2699,  images:['https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=400&h=400&fit=crop'], category:'Home & Living',subcategory:'kitchen',        categoryBn:'হোম',          brand:'Miyako',      stock:90,  rating:4.4, reviewCount:562, tags:['kitchen','rice-cooker'],          isNew:false, isFeatured:false, deliveryDays:2, seller:'HomePlus BD',     location:'Dhaka',       createdAt:'2025-02-06T10:00:00Z', updatedAt:'2025-02-06T10:00:00Z' },
  { id:'27', slug:'yoga-mat-tpe',         name:'Premium TPE Yoga Mat 6mm',     nameBn:'প্রিমিয়াম যোগা ম্যাট',description:'Non-slip, eco-friendly TPE, double-layer, carry strap',  price:1800,  salePrice:1399,  images:['https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=400&fit=crop'], category:'Sports',      subcategory:'fitness',        categoryBn:'স্পোর্টস',    brand:'FitLife',     stock:120, rating:4.5, reviewCount:289, tags:['yoga','fitness','mat'],           isNew:false, isFeatured:false, deliveryDays:2, seller:'FitZone BD',      location:'Dhaka',       createdAt:'2025-02-07T10:00:00Z', updatedAt:'2025-02-07T10:00:00Z' },
]

function daysAgo(n) {
  const d=new Date(); d.setDate(d.getDate()-n)
  d.setHours(Math.floor(Math.random()*14)+6,Math.floor(Math.random()*59),0,0)
  return d.toISOString()
}
const SEED_ORDERS=[
  {id:'SB-240001',customer:{name:'Rahim Uddin',email:'rahim.uddin@gmail.com',phone:'01711-234567',address:'House 12, Road 5, Dhanmondi, Dhaka'},items:[{productId:'1',name:'Samsung Galaxy A55 5G',quantity:1,price:39999,image:'https://placehold.co/60x60/f97316/fff?text=A55'}],subtotal:39999,shipping:80,discount:0,couponCode:null,total:40079,status:'delivered',paymentMethod:'bkash',paymentStatus:'paid',notes:'',trackingNumber:'SA-TRK-78234',createdAt:daysAgo(5),updatedAt:daysAgo(3)},
  {id:'SB-240002',customer:{name:'Fatema Begum',email:'fatema.b@yahoo.com',phone:'01812-345678',address:'Apt 4B, Bashundhara R/A, Dhaka'},items:[{productId:'4',name:'Jamdani Muslin Saree',quantity:2,price:7200,image:'https://placehold.co/60x60/ec4899/fff?text=Saree'}],subtotal:14400,shipping:120,discount:0,couponCode:null,total:14520,status:'shipped',paymentMethod:'cod',paymentStatus:'pending',notes:'Please wrap carefully',trackingNumber:'SA-TRK-78299',createdAt:daysAgo(3),updatedAt:daysAgo(2)},
  {id:'SB-240003',customer:{name:'Karim Hossain',email:'k.hossain@outlook.com',phone:'01955-456789',address:'Village: Shibpur, Narsingdi'},items:[{productId:'7',name:'PRAN Mango Juice 1L',quantity:12,price:99,image:'https://placehold.co/60x60/fbbf24/fff?text=Juice'},{productId:'11',name:'RFL Pressure Cooker 5L',quantity:1,price:1799,image:'https://placehold.co/60x60/f59e0b/fff?text=RFL'}],subtotal:2987,shipping:150,discount:0,couponCode:null,total:3137,status:'processing',paymentMethod:'nagad',paymentStatus:'paid',notes:'',trackingNumber:'',createdAt:daysAgo(1),updatedAt:daysAgo(1)},
  {id:'SB-240004',customer:{name:'Sumaiya Akter',email:'sumaiya.akter@gmail.com',phone:'01676-567890',address:'Holding 8, GEC Circle, Chittagong'},items:[{productId:'8',name:'Lenovo IdeaPad Slim 5',quantity:1,price:84999,image:'https://placehold.co/60x60/0ea5e9/fff?text=Lenovo'}],subtotal:84999,shipping:200,discount:0,couponCode:null,total:85199,status:'pending',paymentMethod:'bkash',paymentStatus:'paid',notes:'Call before delivery',trackingNumber:'',createdAt:daysAgo(0),updatedAt:daysAgo(0)},
  {id:'SB-240005',customer:{name:'Nasir Ahmed',email:'nasir.a@proton.me',phone:'01517-678901',address:'Plot 22, DOHS, Mirpur, Dhaka'},items:[{productId:'2',name:'Nike Air Max 2027',quantity:1,price:9499,image:'https://placehold.co/60x60/6366f1/fff?text=Nike'},{productId:'9',name:'Aarong Cotton Kurta',quantity:3,price:2800,image:'https://placehold.co/60x60/84cc16/fff?text=Kurta'}],subtotal:17899,shipping:80,discount:0,couponCode:null,total:17979,status:'delivered',paymentMethod:'rocket',paymentStatus:'paid',notes:'',trackingNumber:'SA-TRK-77891',createdAt:daysAgo(4),updatedAt:daysAgo(2)},
  {id:'SB-240006',customer:{name:'Nusrat Jahan',email:'nusrat.jahan22@gmail.com',phone:'01399-789012',address:'Road 3, Block D, Sylhet Sadar'},items:[{productId:'12',name:'Meril Splash Body Wash',quantity:4,price:299,image:'https://placehold.co/60x60/a78bfa/fff?text=Meril'}],subtotal:1196,shipping:80,discount:0,couponCode:null,total:1276,status:'cancelled',paymentMethod:'cod',paymentStatus:'refunded',notes:'Customer requested cancellation',trackingNumber:'',createdAt:daysAgo(6),updatedAt:daysAgo(5)},
  {id:'SB-240007',customer:{name:'Jamal Uddin',email:'jamal.u@bd.net',phone:'01711-890123',address:'Shahjalal Upashahar, Sylhet'},items:[{productId:'5',name:'Xiaomi Redmi Note 13 Pro',quantity:1,price:29999,image:'https://placehold.co/60x60/f97316/fff?text=Redmi'}],subtotal:29999,shipping:80,discount:0,couponCode:null,total:30079,status:'pending',paymentMethod:'bkash',paymentStatus:'paid',notes:'',trackingNumber:'',createdAt:daysAgo(0),updatedAt:daysAgo(0)},
  {id:'SB-240008',customer:{name:'Rekha Das',email:'rekha.das@gmail.com',phone:'01612-901234',address:'Hospital Road, Rajshahi'},items:[{productId:'3',name:'Walton Primo X7 Ultra',quantity:1,price:24999},{productId:'6',name:'Smart QR POS Terminal',quantity:1,price:3800}],subtotal:28799,shipping:150,discount:0,couponCode:null,total:28949,status:'delivered',paymentMethod:'bank_transfer',paymentStatus:'paid',notes:'',trackingNumber:'SA-TRK-78998',createdAt:daysAgo(2),updatedAt:daysAgo(1)},
  {id:'SB-240009',customer:{name:'Arif Rahman',email:'arif.r@gmail.com',phone:'01855-012345',address:'New Market Area, Comilla'},items:[{productId:'10',name:'Symphony Z55 Pro',quantity:2,price:15499}],subtotal:30998,shipping:120,discount:0,couponCode:null,total:31118,status:'shipped',paymentMethod:'nagad',paymentStatus:'paid',notes:'',trackingNumber:'SA-TRK-78401',createdAt:daysAgo(3),updatedAt:daysAgo(1)},
  {id:'SB-240010',customer:{name:'Lailun Nahar',email:'lailun.n@yahoo.com',phone:'01411-123456',address:'Court Road, Mymensingh'},items:[{productId:'9',name:'Aarong Cotton Kurta',quantity:2,price:2800},{productId:'12',name:'Meril Splash Body Wash',quantity:2,price:299}],subtotal:6198,shipping:100,discount:0,couponCode:null,total:6298,status:'delivered',paymentMethod:'bkash',paymentStatus:'paid',notes:'',trackingNumber:'SA-TRK-78102',createdAt:daysAgo(20),updatedAt:daysAgo(18)},
]

const SEED_CATEGORIES = [
  {id:'c1',slug:'electronics',name:'Electronics',nameBn:'ইলেকট্রনিক্স',icon:'fa-microchip',color:'#3b82f6',subcategories:[{id:'s1-1',slug:'mobile-phones',name:'Mobile Phones',nameBn:'মোবাইল ফোন',icon:'fa-mobile-screen'},{id:'s1-2',slug:'laptops',name:'Laptops',nameBn:'ল্যাপটপ',icon:'fa-laptop'},{id:'s1-3',slug:'tablets',name:'Tablets',nameBn:'ট্যাবলেট',icon:'fa-tablet-screen-button'},{id:'s1-4',slug:'headphones',name:'Headphones',nameBn:'হেডফোন',icon:'fa-headphones'},{id:'s1-5',slug:'smart-watches',name:'Smart Watches',nameBn:'স্মার্টওয়াচ',icon:'fa-watch-smart'},{id:'s1-6',slug:'cameras',name:'Cameras',nameBn:'ক্যামেরা',icon:'fa-camera'},{id:'s1-7',slug:'televisions',name:'Televisions',nameBn:'টেলিভিশন',icon:'fa-tv'},{id:'s1-8',slug:'accessories',name:'Accessories',nameBn:'আনুষাঙ্গিক',icon:'fa-plug'}]},
  {id:'c2',slug:'fashion',name:'Fashion',nameBn:'ফ্যাশন',icon:'fa-shirt',color:'#ec4899',subcategories:[{id:'s2-1',slug:'mens-clothing',name:"Men's Clothing",nameBn:'পুরুষ পোশাক',icon:'fa-person'},{id:'s2-2',slug:'womens-clothing',name:"Women's Clothing",nameBn:'মহিলা পোশাক',icon:'fa-person-dress'},{id:'s2-3',slug:'kids-clothing',name:"Kids' Clothing",nameBn:'শিশু পোশাক',icon:'fa-child'},{id:'s2-4',slug:'footwear',name:'Footwear',nameBn:'জুতা',icon:'fa-shoe-prints'},{id:'s2-5',slug:'sarees',name:'Sarees',nameBn:'শাড়ি',icon:'fa-scarf'},{id:'s2-6',slug:'bags-wallets',name:'Bags & Wallets',nameBn:'ব্যাগ ও মানিব্যাগ',icon:'fa-bag-shopping'},{id:'s2-7',slug:'ethnic-wear',name:'Ethnic Wear',nameBn:'ঐতিহ্যবাহী পোশাক',icon:'fa-vest'}]},
  {id:'c3',slug:'grocery',name:'Grocery',nameBn:'মুদিখানা',icon:'fa-basket-shopping',color:'#22c55e',subcategories:[{id:'s3-1',slug:'rice-grains',name:'Rice & Grains',nameBn:'চাল ও শস্য',icon:'fa-wheat-awn'},{id:'s3-2',slug:'oil-spices',name:'Oil & Spices',nameBn:'তেল ও মশলা',icon:'fa-jar'},{id:'s3-3',slug:'beverages',name:'Beverages',nameBn:'পানীয়',icon:'fa-bottle-water'},{id:'s3-4',slug:'snacks',name:'Snacks',nameBn:'স্ন্যাকস',icon:'fa-cookie-bite'},{id:'s3-5',slug:'dairy',name:'Dairy',nameBn:'দুগ্ধজাত পণ্য',icon:'fa-cow'},{id:'s3-6',slug:'fresh-produce',name:'Fresh Produce',nameBn:'তাজা শাকসবজি',icon:'fa-carrot'}]},
  {id:'c4',slug:'beauty',name:'Beauty',nameBn:'বিউটি',icon:'fa-pump-soap',color:'#a78bfa',subcategories:[{id:'s4-1',slug:'skincare',name:'Skincare',nameBn:'স্কিনকেয়ার',icon:'fa-spa'},{id:'s4-2',slug:'haircare',name:'Haircare',nameBn:'হেয়ারকেয়ার',icon:'fa-scissors'},{id:'s4-3',slug:'makeup',name:'Makeup',nameBn:'মেকআপ',icon:'fa-wand-magic-sparkles'},{id:'s4-4',slug:'fragrances',name:'Fragrances',nameBn:'সুগন্ধি',icon:'fa-bottle-droplet'},{id:'s4-5',slug:'mens-grooming',name:"Men's Grooming",nameBn:'পুরুষ গ্রুমিং',icon:'fa-razor'}]},
  {id:'c5',slug:'home',name:'Home & Living',nameBn:'হোম',icon:'fa-couch',color:'#f97316',subcategories:[{id:'s5-1',slug:'furniture',name:'Furniture',nameBn:'আসবাবপত্র',icon:'fa-couch'},{id:'s5-2',slug:'kitchen',name:'Kitchen',nameBn:'রান্নাঘর',icon:'fa-kitchen-set'},{id:'s5-3',slug:'air-conditioners',name:'Air Conditioners',nameBn:'এয়ার কন্ডিশনার',icon:'fa-snowflake'},{id:'s5-4',slug:'bedding',name:'Bedding',nameBn:'বিছানার চাদর',icon:'fa-bed'},{id:'s5-5',slug:'decor',name:'Décor',nameBn:'সাজসজ্জা',icon:'fa-lamp-desk'},{id:'s5-6',slug:'cleaning',name:'Cleaning',nameBn:'পরিষ্কার',icon:'fa-broom'}]},
  {id:'c6',slug:'sports',name:'Sports',nameBn:'স্পোর্টস',icon:'fa-dumbbell',color:'#0ea5e9',subcategories:[{id:'s6-1',slug:'cricket',name:'Cricket',nameBn:'ক্রিকেট',icon:'fa-baseball-bat-ball'},{id:'s6-2',slug:'football',name:'Football',nameBn:'ফুটবল',icon:'fa-futbol'},{id:'s6-3',slug:'fitness',name:'Fitness',nameBn:'ফিটনেস',icon:'fa-dumbbell'},{id:'s6-4',slug:'outdoor',name:'Outdoor',nameBn:'আউটডোর',icon:'fa-person-hiking'},{id:'s6-5',slug:'cycling',name:'Cycling',nameBn:'সাইক্লিং',icon:'fa-bicycle'}]},
  {id:'c7',slug:'business',name:'Business',nameBn:'ব্যবসা',icon:'fa-briefcase',color:'#8b5cf6',subcategories:[{id:'s7-1',slug:'office-supplies',name:'Office Supplies',nameBn:'অফিস সামগ্রী',icon:'fa-paperclip'},{id:'s7-2',slug:'pos-systems',name:'POS Systems',nameBn:'POS সিস্টেম',icon:'fa-cash-register'},{id:'s7-3',slug:'printing',name:'Printing',nameBn:'প্রিন্টিং',icon:'fa-print'},{id:'s7-4',slug:'storage',name:'Storage',nameBn:'স্টোরেজ',icon:'fa-boxes-stacked'}]},
  {id:'c8',slug:'books',name:'Books',nameBn:'বই',icon:'fa-book-open',color:'#fbbf24',subcategories:[{id:'s8-1',slug:'bangla-literature',name:'Bangla Literature',nameBn:'বাংলা সাহিত্য',icon:'fa-book'},{id:'s8-2',slug:'academic',name:'Academic',nameBn:'শিক্ষামূলক',icon:'fa-graduation-cap'},{id:'s8-3',slug:'self-help',name:'Self Help',nameBn:'সেলফ হেল্প',icon:'fa-brain'},{id:'s8-4',slug:'religious',name:'Religious',nameBn:'ধর্মীয়',icon:'fa-star-and-crescent'},{id:'s8-5',slug:'children',name:"Children's",nameBn:'শিশু',icon:'fa-child-reaching'}]},
]

// ═══════════════════════════════════════════════════════════════════════════════
// DB ACCESS LAYER — replaces all redis.get / redis.set calls
// ═══════════════════════════════════════════════════════════════════════════════

async function getProducts() {
  const rows = await sql`SELECT * FROM products ORDER BY updated_at DESC`
  if (rows.length === 0) {
    await seedProducts()
    // Re-query after seeding so we always return DB-normalised rows
    const seeded = await sql`SELECT * FROM products ORDER BY updated_at DESC`
    return seeded.length ? seeded.map(rowToProduct) : SEED_PRODUCTS
  }
  return rows.map(rowToProduct)
}

async function seedProducts() {
  for (const p of SEED_PRODUCTS) {
    await sql`
      INSERT INTO products
        (id,slug,name,name_bn,description,price,sale_price,category,subcategory,
         category_bn,brand,seller,stock,rating,review_count,location,delivery_days,
         is_new,is_featured,tags,images,created_at,updated_at)
      VALUES (
        ${p.id}, ${p.slug}, ${p.name}, ${p.nameBn??''}, ${p.description??''},
        ${p.price}, ${p.salePrice??0}, ${p.category??''}, ${p.subcategory??''},
        ${p.categoryBn??''}, ${p.brand??''}, ${p.seller??''}, ${p.stock??0},
        ${p.rating??4.5}, ${p.reviewCount??0}, ${p.location??'Dhaka'}, ${p.deliveryDays??3},
        ${p.isNew??false}, ${p.isFeatured??false},
        ${JSON.stringify(p.tags??[])}::jsonb, ${JSON.stringify(p.images??[])}::jsonb,
        ${p.createdAt??new Date().toISOString()}, ${p.updatedAt??new Date().toISOString()}
      )
      ON CONFLICT (id) DO NOTHING`
  }
}

async function saveProduct(p) {
  await sql`
    INSERT INTO products
      (id,slug,name,name_bn,description,price,sale_price,category,subcategory,
       category_bn,brand,seller,stock,rating,review_count,location,delivery_days,
       is_new,is_featured,tags,images,created_at,updated_at)
    VALUES (
      ${p.id}, ${p.slug}, ${p.name}, ${p.nameBn??''}, ${p.description??''},
      ${p.price}, ${p.salePrice??0}, ${p.category??''}, ${p.subcategory??''},
      ${p.categoryBn??''}, ${p.brand??''}, ${p.seller??''}, ${p.stock??0},
      ${p.rating??4.5}, ${p.reviewCount??0}, ${p.location??'Dhaka'}, ${p.deliveryDays??3},
      ${p.isNew??false}, ${p.isFeatured??false},
      ${JSON.stringify(p.tags??[])}::jsonb, ${JSON.stringify(p.images??[])}::jsonb,
      ${p.createdAt??new Date().toISOString()}, ${p.updatedAt??new Date().toISOString()}
    )
    ON CONFLICT (id) DO UPDATE SET
      slug=EXCLUDED.slug, name=EXCLUDED.name, name_bn=EXCLUDED.name_bn,
      description=EXCLUDED.description, price=EXCLUDED.price, sale_price=EXCLUDED.sale_price,
      category=EXCLUDED.category, subcategory=EXCLUDED.subcategory, category_bn=EXCLUDED.category_bn,
      brand=EXCLUDED.brand, seller=EXCLUDED.seller, stock=EXCLUDED.stock,
      rating=EXCLUDED.rating, review_count=EXCLUDED.review_count, location=EXCLUDED.location,
      delivery_days=EXCLUDED.delivery_days, is_new=EXCLUDED.is_new, is_featured=EXCLUDED.is_featured,
      tags=EXCLUDED.tags, images=EXCLUDED.images, updated_at=EXCLUDED.updated_at`
}

async function deleteProduct(id) {
  await sql`DELETE FROM products WHERE id = ${id}`
}

async function syncProductRating(productSlug) {
  try {
    const rows = await sql`
      SELECT rating FROM reviews
      WHERE product_slug = ${productSlug} AND status = 'approved'`
    if (!rows.length) return
    const avg = rows.reduce((s,r) => s + Number(r.rating), 0) / rows.length
    await sql`
      UPDATE products
      SET rating = ${Math.round(avg*10)/10}, review_count = ${rows.length}, updated_at = NOW()
      WHERE slug = ${productSlug}`
  } catch {}
}

// ── Orders ────────────────────────────────────────────────────────────────────
async function getOrders() {
  const rows = await sql`SELECT * FROM orders ORDER BY created_at DESC`
  if (rows.length === 0) {
    await seedOrders()
    // Re-query after seeding so we always return DB-normalised rows
    const seeded = await sql`SELECT * FROM orders ORDER BY created_at DESC`
    return seeded.length ? seeded.map(rowToOrder) : SEED_ORDERS
  }
  return rows.map(rowToOrder)
}

async function seedOrders() {
  for (const o of SEED_ORDERS) {
    await sql`
      INSERT INTO orders
        (id,customer,items,subtotal,shipping,discount,coupon_code,total,
         status,payment_method,payment_status,notes,tracking_number,created_at,updated_at)
      VALUES (
        ${o.id}, ${JSON.stringify(o.customer)}::jsonb, ${JSON.stringify(o.items)}::jsonb,
        ${o.subtotal??0}, ${o.shipping??0}, ${o.discount??0}, ${o.couponCode??null},
        ${o.total}, ${o.status??'pending'}, ${o.paymentMethod??'cod'},
        ${o.paymentStatus??'pending'}, ${o.notes??''}, ${o.trackingNumber??''},
        ${o.createdAt??new Date().toISOString()}, ${o.updatedAt??new Date().toISOString()}
      )
      ON CONFLICT (id) DO NOTHING`
  }
}

async function saveOrder(o) {
  await sql`
    INSERT INTO orders
      (id,customer,items,subtotal,shipping,discount,coupon_code,total,
       status,payment_method,payment_status,notes,tracking_number,created_at,updated_at)
    VALUES (
      ${o.id}, ${JSON.stringify(o.customer)}::jsonb, ${JSON.stringify(o.items)}::jsonb,
      ${o.subtotal??0}, ${o.shipping??0}, ${o.discount??0}, ${o.couponCode??null},
      ${o.total}, ${o.status??'pending'}, ${o.paymentMethod??'cod'},
      ${o.paymentStatus??'pending'}, ${o.notes??''}, ${o.trackingNumber??''},
      ${o.createdAt??new Date().toISOString()}, ${o.updatedAt??new Date().toISOString()}
    )
    ON CONFLICT (id) DO UPDATE SET
      customer=EXCLUDED.customer, items=EXCLUDED.items,
      subtotal=EXCLUDED.subtotal, shipping=EXCLUDED.shipping, discount=EXCLUDED.discount,
      coupon_code=EXCLUDED.coupon_code, total=EXCLUDED.total, status=EXCLUDED.status,
      payment_method=EXCLUDED.payment_method, payment_status=EXCLUDED.payment_status,
      notes=EXCLUDED.notes, tracking_number=EXCLUDED.tracking_number,
      updated_at=EXCLUDED.updated_at`
}

async function deleteOrder(id) {
  await sql`DELETE FROM orders WHERE id = ${id}`
}

// ── Users ─────────────────────────────────────────────────────────────────────
async function getUsers() {
  const rows = await sql`SELECT * FROM users ORDER BY created_at DESC`
  return rows.map(r => ({
    id: r.id, name: r.name, email: r.email, phone: r.phone,
    division: r.division, password: r.password, createdAt: r.created_at,
  }))
}

async function saveUser(u) {
  await sql`
    INSERT INTO users (id,name,email,phone,division,password,created_at)
    VALUES (${u.id}, ${u.name}, ${u.email}, ${u.phone??''}, ${u.division??'Dhaka'}, ${u.password}, ${u.createdAt??new Date().toISOString()})
    ON CONFLICT (id) DO UPDATE SET
      name=EXCLUDED.name, email=EXCLUDED.email, phone=EXCLUDED.phone,
      division=EXCLUDED.division, password=EXCLUDED.password`
}

// ── Categories ────────────────────────────────────────────────────────────────
async function getCategories() {
  const rows = await sql`SELECT * FROM categories ORDER BY name`
  if (rows.length === 0) {
    await seedCategories()
    // Re-query after seeding so we always return DB-normalised rows
    const seeded = await sql`SELECT * FROM categories ORDER BY name`
    return seeded.length ? seeded.map(rowToCategory) : SEED_CATEGORIES
  }
  return rows.map(rowToCategory)
}

async function seedCategories() {
  for (const c of SEED_CATEGORIES) {
    await sql`
      INSERT INTO categories (id,slug,name,name_bn,icon,color,subcategories)
      VALUES (
        ${c.id}, ${c.slug}, ${c.name}, ${c.nameBn??''}, ${c.icon??'fa-tag'},
        ${c.color??'#6b7280'}, ${JSON.stringify(c.subcategories??[])}::jsonb
      )
      ON CONFLICT (id) DO NOTHING`
  }
}

async function saveCategory(c) {
  await sql`
    INSERT INTO categories (id,slug,name,name_bn,icon,color,subcategories)
    VALUES (
      ${c.id}, ${c.slug}, ${c.name}, ${c.nameBn??''}, ${c.icon??'fa-tag'},
      ${c.color??'#6b7280'}, ${JSON.stringify(c.subcategories??[])}::jsonb
    )
    ON CONFLICT (id) DO UPDATE SET
      slug=EXCLUDED.slug, name=EXCLUDED.name, name_bn=EXCLUDED.name_bn,
      icon=EXCLUDED.icon, color=EXCLUDED.color, subcategories=EXCLUDED.subcategories`
}

async function deleteCategory(id) {
  await sql`DELETE FROM categories WHERE id = ${id}`
}

// ── Reviews ───────────────────────────────────────────────────────────────────
async function getReviews() {
  const rows = await sql`SELECT * FROM reviews ORDER BY created_at DESC`
  return rows.map(rowToReview)
}

async function saveReview(r) {
  await sql`
    INSERT INTO reviews
      (id,product_id,product_slug,product_name,order_id,user_id,user_name,user_email,
       rating,title,body,images,status,helpful,admin_note,created_at)
    VALUES (
      ${r.id}, ${r.productId}, ${r.productSlug}, ${r.productName??''},
      ${r.orderId}, ${r.userId}, ${r.userName??'Anonymous'}, ${r.userEmail??''},
      ${r.rating}, ${r.title??''}, ${r.body??''}, ${JSON.stringify(r.images??[])}::jsonb,
      ${r.status??'pending'}, ${r.helpful??0}, ${r.adminNote??''},
      ${r.createdAt??new Date().toISOString()}
    )
    ON CONFLICT (id) DO UPDATE SET
      product_slug=EXCLUDED.product_slug, product_name=EXCLUDED.product_name,
      rating=EXCLUDED.rating, title=EXCLUDED.title, body=EXCLUDED.body,
      images=EXCLUDED.images, status=EXCLUDED.status, helpful=EXCLUDED.helpful,
      admin_note=EXCLUDED.admin_note, user_name=EXCLUDED.user_name`
}

async function deleteReview(id) {
  await sql`DELETE FROM reviews WHERE id = ${id}`
}

// ── Banners ───────────────────────────────────────────────────────────────────
async function getBanners() {
  const rows = await sql`SELECT * FROM banners ORDER BY display_order ASC`
  return rows.map(rowToBanner)
}

async function saveBanner(b) {
  await sql`
    INSERT INTO banners (id,tag,title,subtitle,cta,link,image,active,display_order)
    VALUES (
      ${b.id}, ${b.tag??''}, ${b.title}, ${b.subtitle??''}, ${b.cta??'Shop Now'},
      ${b.link??'/'}, ${b.image}, ${b.active??true}, ${b.order??0}
    )
    ON CONFLICT (id) DO UPDATE SET
      tag=EXCLUDED.tag, title=EXCLUDED.title, subtitle=EXCLUDED.subtitle,
      cta=EXCLUDED.cta, link=EXCLUDED.link, image=EXCLUDED.image,
      active=EXCLUDED.active, display_order=EXCLUDED.display_order`
}

async function deleteBanner(id) {
  await sql`DELETE FROM banners WHERE id = ${id}`
}

// ── Cart & Wishlist ───────────────────────────────────────────────────────────
async function getCart(uid) {
  const rows = await sql`SELECT cart FROM user_carts WHERE user_id = ${uid}`
  return rows[0]?.cart ?? []
}
async function setCart(uid, cart) {
  await sql`
    INSERT INTO user_carts (user_id, cart, updated_at)
    VALUES (${uid}, ${JSON.stringify(cart)}::jsonb, NOW())
    ON CONFLICT (user_id) DO UPDATE SET cart=EXCLUDED.cart, updated_at=NOW()`
}
async function deleteCart(uid) {
  await sql`DELETE FROM user_carts WHERE user_id = ${uid}`
}

async function getWishlist(uid) {
  const rows = await sql`SELECT wishlist FROM user_wishlists WHERE user_id = ${uid}`
  return rows[0]?.wishlist ?? []
}
async function setWishlist(uid, wishlist) {
  await sql`
    INSERT INTO user_wishlists (user_id, wishlist, updated_at)
    VALUES (${uid}, ${JSON.stringify(wishlist)}::jsonb, NOW())
    ON CONFLICT (user_id) DO UPDATE SET wishlist=EXCLUDED.wishlist, updated_at=NOW()`
}
async function deleteWishlist(uid) {
  await sql`DELETE FROM user_wishlists WHERE user_id = ${uid}`
}

// ═══════════════════════════════════════════════════════════════════════════════
// AUTH ROUTES  /api/auth/*
// ═══════════════════════════════════════════════════════════════════════════════
app.post('/api/auth/login', async (req, res) => {
  try {
    const { phone, email, password } = req.body
    if ((!phone && !email) || !password)
      return res.status(400).json({ error: 'Phone/email and password required' })

    // ── Check if this is an admin trying the wrong endpoint ──────────────
    if (email) {
      const admin = ADMIN_ACCOUNTS.find(a => a.email === email.toLowerCase().trim())
      if (admin) {
        if (admin.password !== password)
          return res.status(401).json({ error: 'Incorrect password. Please try again.' })
        const token = jwt.sign({ id:admin.id, email:admin.email, role:admin.role }, JWT_SECRET, { expiresIn:'24h' })
        return res.json({ user: { id:admin.id, name:admin.name, email:admin.email, role:admin.role }, token })
      }
    }

    const users = await getUsers()
    const np = phone ? normalizePhone(phone) : null
    const user = users.find(u =>
      (np && normalizePhone(u.phone) === np) ||
      (email && u.email === email.toLowerCase().trim())
    )
    if (!user) return res.status(401).json({ error: 'No account found with that phone number. Please register first.' })
    if (user.password !== password) return res.status(401).json({ error: 'Incorrect password. Please try again.' })
    const token = jwt.sign({ id:user.id, email:user.email, phone:user.phone, role:'user' }, JWT_SECRET, { expiresIn:'30d' })
    const { password:_pw, ...safe } = user
    res.json({ user: safe, token })
  } catch(e) { res.status(500).json({ error: e.message }) }
})

app.post('/api/auth/check', async (req, res) => {
  try {
    const { email, phone } = req.body
    const users = await getUsers()
    if (email && users.find(u => u.email === email.toLowerCase().trim()))
      return res.status(409).json({ field:'email', error:'This email is already registered' })
    if (phone && users.find(u => normalizePhone(u.phone) === normalizePhone(phone)))
      return res.status(409).json({ field:'phone', error:'This phone number is already registered' })
    res.json({ available: true })
  } catch(e) { res.status(500).json({ error: e.message }) }
})

app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, phone, email, division, password } = req.body
    if (!name || !phone || !email || !password) return res.status(400).json({ error: 'All fields required' })
    if (password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' })
    const users = await getUsers()
    if (users.find(u => u.email === email.toLowerCase().trim()))
      return res.status(409).json({ field:'email', error:'This email is already registered' })
    if (users.find(u => normalizePhone(u.phone) === normalizePhone(phone)))
      return res.status(409).json({ field:'phone', error:'This phone number is already registered' })
    const newUser = {
      id: Date.now().toString(), name: name.trim(), email: email.toLowerCase().trim(),
      phone: normalizePhone(phone), division: division??'Dhaka', password,
      createdAt: new Date().toISOString(),
    }
    await saveUser(newUser)
    const token = jwt.sign({ id:newUser.id, email:newUser.email, phone:newUser.phone, role:'user' }, JWT_SECRET, { expiresIn:'30d' })
    const { password:_pw, ...safe } = newUser
    res.json({ user: safe, token })
  } catch(e) { res.status(500).json({ error: e.message }) }
})

// ═══════════════════════════════════════════════════════════════════════════════
// ADMIN AUTH  /api/admin/login|me|logout
// ═══════════════════════════════════════════════════════════════════════════════
app.post('/api/admin/login', (req, res) => {
  const { email, password } = req.body
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' })
  const admin = ADMIN_ACCOUNTS.find(a => a.email === email && a.password === password)
  if (!admin) return res.status(401).json({ error: 'Invalid credentials' })
  const token = jwt.sign({ id:admin.id, email:admin.email, role:admin.role }, JWT_SECRET, { expiresIn:'24h' })
  res.json({ token, admin:{ id:admin.id, email:admin.email, role:admin.role, name:admin.name } })
})
app.get('/api/admin/me', requireAdmin, (req, res) => res.json({ admin: req.admin }))
app.post('/api/admin/logout', requireAdmin, (_req, res) => res.json({ message: 'Logged out' }))

// ═══════════════════════════════════════════════════════════════════════════════
// PRODUCTS  /api/products/*
// ═══════════════════════════════════════════════════════════════════════════════
function sortByLatest(arr) {
  return [...arr].sort((a,b)=>new Date(b.updatedAt??b.createdAt??0)-new Date(a.updatedAt??a.createdAt??0))
}

app.get('/api/products', async (req, res) => {
  try {
    const { category, subcategory, q, limit, featured, sortBy, order } = req.query
    let result = await getProducts()
    if (category && category !== 'All') result = result.filter(p => p.category === category)
    if (subcategory && subcategory !== 'All') result = result.filter(p => p.subcategory === subcategory)
    if (q) result = result.filter(p => p.name.toLowerCase().includes(q.toLowerCase()) || p.brand.toLowerCase().includes(q.toLowerCase()))
    if (featured === 'true') result = result.filter(p => p.isFeatured)
    if (sortBy) {
      const dir = order === 'asc' ? 1 : -1
      result.sort((a,b) => a[sortBy] < b[sortBy] ? -dir : a[sortBy] > b[sortBy] ? dir : 0)
    } else {
      result = sortByLatest(result)
    }
    if (limit) result = result.slice(0, parseInt(limit))
    res.json({ data: result, total: result.length })
  } catch(e) { res.status(500).json({ error: e.message }) }
})

app.get('/api/products/:slug', async (req, res) => {
  try {
    const rows = await sql`SELECT * FROM products WHERE slug = ${req.params.slug} OR id = ${req.params.slug} LIMIT 1`
    if (!rows.length) return res.status(404).json({ error: 'Product not found' })
    res.json(rowToProduct(rows[0]))
  } catch(e) { res.status(500).json({ error: e.message }) }
})

app.post('/api/products', requireAdmin, async (req, res) => {
  try {
    const b = req.body
    if (!b.name || !b.brand || !b.category || !b.price)
      return res.status(400).json({ error: 'name, brand, category and price are required' })
    const id = String(Date.now()), now = new Date().toISOString()
    const product = {
      id, slug: toSlug(b.name) + '-' + id.slice(-4),
      name:String(b.name), nameBn:b.nameBn?String(b.nameBn):String(b.name),
      brand:String(b.brand), category:String(b.category),
      subcategory:b.subcategory?String(b.subcategory):'',
      categoryBn:b.categoryBn?String(b.categoryBn):String(b.category),
      seller:b.seller?String(b.seller):String(b.brand),
      description:b.description?String(b.description):'',
      price:Number(b.price), salePrice:Number(b.salePrice)||0,
      stock:Number(b.stock)||0, deliveryDays:Number(b.deliveryDays)||3,
      rating:Number(b.rating)||4.5, reviewCount:0,
      location:b.location?String(b.location):'Dhaka',
      isFeatured:Boolean(b.isFeatured), isNew:b.isNew!==undefined?Boolean(b.isNew):true,
      images:Array.isArray(b.images)?b.images:[], tags:Array.isArray(b.tags)?b.tags:[],
      createdAt:now, updatedAt:now,
    }
    await saveProduct(product)
    res.status(201).json(product)
  } catch(e) { res.status(500).json({ error: e.message }) }
})

app.put('/api/products/:id', requireAdmin, async (req, res) => {
  try {
    const rows = await sql`SELECT * FROM products WHERE id = ${req.params.id} LIMIT 1`
    if (!rows.length) return res.status(404).json({ error: 'Product not found' })
    const cur = rowToProduct(rows[0]), b = req.body
    const updated = {
      ...cur,
      ...(b.name!==undefined&&{name:String(b.name)}),
      ...(b.nameBn!==undefined&&{nameBn:String(b.nameBn)}),
      ...(b.brand!==undefined&&{brand:String(b.brand)}),
      ...(b.category!==undefined&&{category:String(b.category)}),
      ...(b.subcategory!==undefined&&{subcategory:String(b.subcategory)}),
      ...(b.categoryBn!==undefined&&{categoryBn:String(b.categoryBn)}),
      ...(b.seller!==undefined&&{seller:String(b.seller)}),
      ...(b.description!==undefined&&{description:String(b.description)}),
      ...(b.price!==undefined&&{price:Number(b.price)}),
      ...(b.salePrice!==undefined&&{salePrice:Number(b.salePrice)}),
      ...(b.stock!==undefined&&{stock:Number(b.stock)}),
      ...(b.deliveryDays!==undefined&&{deliveryDays:Number(b.deliveryDays)}),
      ...(b.rating!==undefined&&{rating:Number(b.rating)}),
      ...(b.location!==undefined&&{location:String(b.location)}),
      ...(b.isFeatured!==undefined&&{isFeatured:Boolean(b.isFeatured)}),
      ...(b.isNew!==undefined&&{isNew:Boolean(b.isNew)}),
      ...(Array.isArray(b.images)&&{images:b.images}),
      ...(Array.isArray(b.tags)&&{tags:b.tags}),
      updatedAt: new Date().toISOString(),
    }
    await saveProduct(updated)
    res.json(updated)
  } catch(e) { res.status(500).json({ error: e.message }) }
})

app.delete('/api/products/:id', requireAdmin, async (req, res) => {
  try {
    const rows = await sql`SELECT id FROM products WHERE id = ${req.params.id} LIMIT 1`
    if (!rows.length) return res.status(404).json({ error: 'Product not found' })
    await deleteProduct(req.params.id)
    res.json({ message: 'Product deleted', id: req.params.id })
  } catch(e) { res.status(500).json({ error: e.message }) }
})

// ═══════════════════════════════════════════════════════════════════════════════
// ORDERS  /api/orders/*
// ═══════════════════════════════════════════════════════════════════════════════
app.get('/api/orders/by-id/:id', async (req, res) => {
  try {
    const rows = await sql`SELECT * FROM orders WHERE id = ${req.params.id} LIMIT 1`
    if (!rows.length) return res.status(404).json({ error: 'Order not found' })
    const o = rowToOrder(rows[0])
    const {id,items,subtotal,shipping,total,status,paymentMethod,paymentStatus,trackingNumber,createdAt,updatedAt,customer}=o
    res.json({id,items,subtotal,shipping,total,status,paymentMethod,paymentStatus,trackingNumber,createdAt,updatedAt,customer})
  } catch(e) { res.status(500).json({ error: e.message }) }
})

app.get('/api/orders/stats', requireAdmin, async (_req, res) => {
  try {
    const orders = await getOrders()
    const statusCounts = orders.reduce((acc,o)=>{ acc[o.status]=(acc[o.status]??0)+1; return acc },{})
    const revenue = orders.filter(o=>o.paymentStatus==='paid').reduce((s,o)=>s+o.total,0)
    res.json({ total:orders.length, statusCounts, revenue, pending:statusCounts['pending']??0 })
  } catch(e) { res.status(500).json({ error: e.message }) }
})

app.get('/api/orders', requireAdmin, async (req, res) => {
  try {
    const { status, q, limit, page } = req.query
    let result = await getOrders()
    if (status && status !== 'all') result = result.filter(o => o.status === status)
    if (q) {
      const lq = q.toLowerCase()
      result = result.filter(o =>
        o.id.toLowerCase().includes(lq) || o.customer.name.toLowerCase().includes(lq) ||
        o.customer.email.toLowerCase().includes(lq) || o.customer.phone.includes(lq)
      )
    }
    result.sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt))
    const total = result.length
    const pageNum = parseInt(page??'1'), pageSize = parseInt(limit??'50')
    result = result.slice((pageNum-1)*pageSize, pageNum*pageSize)
    res.json({ data:result, total, page:pageNum, pageSize })
  } catch(e) { res.status(500).json({ error: e.message }) }
})

app.get('/api/orders/:id', requireAdmin, async (req, res) => {
  try {
    const rows = await sql`SELECT * FROM orders WHERE id = ${req.params.id} LIMIT 1`
    if (!rows.length) return res.status(404).json({ error: 'Order not found' })
    res.json(rowToOrder(rows[0]))
  } catch(e) { res.status(500).json({ error: e.message }) }
})

app.post('/api/orders', async (req, res) => {
  try {
    const { customer, items, subtotal, shipping, total, paymentMethod } = req.body
    if (!customer || !items?.length || !total) return res.status(400).json({ error: 'customer, items, and total required' })
    const order = {
      id:`SB-${Date.now()}`, customer, items,
      subtotal:Number(subtotal??total), shipping:Number(shipping??0),
      discount:Number(req.body.discount??0), couponCode:req.body.couponCode??null,
      total:Number(total), status:'pending', paymentMethod:paymentMethod??'cod',
      paymentStatus:'pending', notes:req.body.notes??'', trackingNumber:'',
      createdAt:new Date().toISOString(), updatedAt:new Date().toISOString(),
    }
    await saveOrder(order)
    res.status(201).json(order)
  } catch(e) { res.status(500).json({ error: e.message }) }
})

app.put('/api/orders/:id', requireAdmin, async (req, res) => {
  try {
    const rows = await sql`SELECT * FROM orders WHERE id = ${req.params.id} LIMIT 1`
    if (!rows.length) return res.status(404).json({ error: 'Order not found' })
    const cur = rowToOrder(rows[0])
    const updated = { ...cur, ...req.body, id: cur.id, updatedAt: new Date().toISOString() }
    await saveOrder(updated)
    res.json(updated)
  } catch(e) { res.status(500).json({ error: e.message }) }
})

app.delete('/api/orders/:id', requireAdmin, async (req, res) => {
  try {
    const rows = await sql`SELECT id FROM orders WHERE id = ${req.params.id} LIMIT 1`
    if (!rows.length) return res.status(404).json({ error: 'Order not found' })
    await deleteOrder(req.params.id)
    res.json({ message:'Order deleted', id: req.params.id })
  } catch(e) { res.status(500).json({ error: e.message }) }
})

// ═══════════════════════════════════════════════════════════════════════════════
// USER DATA  /api/user/cart  /api/user/wishlist
// ═══════════════════════════════════════════════════════════════════════════════
function getUserId(req) { return req.headers['x-user-id'] ?? req.body?.userId ?? null }

app.get('/api/user/cart', async (req, res) => {
  try {
    const uid = getUserId(req); if (!uid) return res.status(401).json({ error:'Unauthorized' })
    res.json({ cart: await getCart(uid) })
  } catch(e) { res.status(500).json({ error:e.message }) }
})
app.post('/api/user/cart', async (req, res) => {
  try {
    const uid = getUserId(req); if (!uid) return res.status(401).json({ error:'Unauthorized' })
    const { cart } = req.body; if (!Array.isArray(cart)) return res.status(400).json({ error:'cart must be array' })
    await setCart(uid, cart); res.json({ ok:true })
  } catch(e) { res.status(500).json({ error:e.message }) }
})
app.get('/api/user/wishlist', async (req, res) => {
  try {
    const uid = getUserId(req); if (!uid) return res.status(401).json({ error:'Unauthorized' })
    res.json({ wishlist: await getWishlist(uid) })
  } catch(e) { res.status(500).json({ error:e.message }) }
})
app.post('/api/user/wishlist', async (req, res) => {
  try {
    const uid = getUserId(req); if (!uid) return res.status(401).json({ error:'Unauthorized' })
    const { wishlist } = req.body; if (!Array.isArray(wishlist)) return res.status(400).json({ error:'wishlist must be array' })
    await setWishlist(uid, wishlist); res.json({ ok:true })
  } catch(e) { res.status(500).json({ error:e.message }) }
})
app.delete('/api/user/userdata', async (req, res) => {
  try {
    const uid = getUserId(req); if (!uid) return res.status(401).json({ error:'Unauthorized' })
    await deleteCart(uid); await deleteWishlist(uid); res.json({ ok:true })
  } catch(e) { res.status(500).json({ error:e.message }) }
})

// ═══════════════════════════════════════════════════════════════════════════════
// CATEGORIES  /api/categories/*
// ═══════════════════════════════════════════════════════════════════════════════
app.get('/api/categories', async (_req, res) => {
  try {
    const [cats, products] = await Promise.all([getCategories(), getProducts()])
    const enriched = cats.map(cat => ({
      ...cat,
      productCount: products.filter(p => p.category === cat.name).length,
      subcategories: cat.subcategories.map(sub => ({
        ...sub, productCount: products.filter(p => p.subcategory === sub.slug).length,
      })),
    }))
    res.json({ data:enriched, total:enriched.length })
  } catch(e) { res.status(500).json({ error:e.message }) }
})

app.get('/api/categories/:slug', async (req, res) => {
  try {
    const [cats, products] = await Promise.all([getCategories(), getProducts()])
    const cat = cats.find(c => c.slug === req.params.slug)
    if (!cat) return res.status(404).json({ error:'Category not found' })
    res.json({ ...cat,
      productCount: products.filter(p => p.category === cat.name).length,
      subcategories: cat.subcategories.map(sub => ({ ...sub, productCount: products.filter(p => p.subcategory === sub.slug).length })),
    })
  } catch(e) { res.status(500).json({ error:e.message }) }
})

app.post('/api/categories', requireAdmin, async (req, res) => {
  try {
    const { name, nameBn, icon, color, slug } = req.body
    if (!name || !slug) return res.status(400).json({ error:'name and slug required' })
    const cats = await getCategories()
    if (cats.find(c => c.slug === slug)) return res.status(409).json({ error:'Slug exists' })
    const newCat = { id:`c${Date.now()}`, slug, name, nameBn:nameBn??name, icon:icon??'fa-tag', color:color??'#6b7280', subcategories:[] }
    await saveCategory(newCat); res.status(201).json(newCat)
  } catch(e) { res.status(500).json({ error:e.message }) }
})

app.put('/api/categories/:slug', requireAdmin, async (req, res) => {
  try {
    const cats = await getCategories()
    const cat = cats.find(c => c.slug === req.params.slug)
    if (!cat) return res.status(404).json({ error:'Category not found' })
    const updated = { ...cat, ...req.body, id:cat.id, slug:cat.slug }
    await saveCategory(updated); res.json(updated)
  } catch(e) { res.status(500).json({ error:e.message }) }
})

app.delete('/api/categories/:slug', requireAdmin, async (req, res) => {
  try {
    const cats = await getCategories()
    const cat = cats.find(c => c.slug === req.params.slug)
    if (!cat) return res.status(404).json({ error:'Category not found' })
    await deleteCategory(cat.id)
    res.json({ message:'Category deleted', slug:cat.slug })
  } catch(e) { res.status(500).json({ error:e.message }) }
})

app.post('/api/categories/:slug/subcategories', requireAdmin, async (req, res) => {
  try {
    const cats = await getCategories()
    const cat = cats.find(c => c.slug === req.params.slug)
    if (!cat) return res.status(404).json({ error:'Category not found' })
    const { name, nameBn, icon, slug } = req.body
    if (!name || !slug) return res.status(400).json({ error:'name and slug required' })
    if (cat.subcategories.find(s => s.slug === slug)) return res.status(409).json({ error:'Subcategory slug exists' })
    const newSub = { id:`s${Date.now()}`, slug, name, nameBn:nameBn??name, icon:icon??'fa-tag' }
    cat.subcategories.push(newSub)
    await saveCategory(cat); res.status(201).json(newSub)
  } catch(e) { res.status(500).json({ error:e.message }) }
})

app.put('/api/categories/:slug/subcategories/:subSlug', requireAdmin, async (req, res) => {
  try {
    const cats = await getCategories()
    const cat = cats.find(c => c.slug === req.params.slug)
    if (!cat) return res.status(404).json({ error:'Category not found' })
    const subIdx = cat.subcategories.findIndex(s => s.slug === req.params.subSlug)
    if (subIdx===-1) return res.status(404).json({ error:'Subcategory not found' })
    cat.subcategories[subIdx] = { ...cat.subcategories[subIdx], ...req.body, id:cat.subcategories[subIdx].id, slug:cat.subcategories[subIdx].slug }
    await saveCategory(cat); res.json(cat.subcategories[subIdx])
  } catch(e) { res.status(500).json({ error:e.message }) }
})

app.delete('/api/categories/:slug/subcategories/:subSlug', requireAdmin, async (req, res) => {
  try {
    const cats = await getCategories()
    const cat = cats.find(c => c.slug === req.params.slug)
    if (!cat) return res.status(404).json({ error:'Category not found' })
    const subIdx = cat.subcategories.findIndex(s => s.slug === req.params.subSlug)
    if (subIdx===-1) return res.status(404).json({ error:'Subcategory not found' })
    const [removed] = cat.subcategories.splice(subIdx,1)
    await saveCategory(cat); res.json({ message:'Subcategory deleted', slug:removed.slug })
  } catch(e) { res.status(500).json({ error:e.message }) }
})

// ═══════════════════════════════════════════════════════════════════════════════
// REVIEWS  /api/reviews/*
// ═══════════════════════════════════════════════════════════════════════════════
app.get('/api/reviews/product/:slug', async (req, res) => {
  try {
    const reviews = await getReviews()
    res.json(reviews.filter(r => r.productSlug===req.params.slug && r.status==='approved').sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt)))
  } catch(e) { res.status(500).json({ error:e.message }) }
})

app.get('/api/reviews/check', async (req, res) => {
  try {
    const { orderId, productId, userId } = req.query
    if (!orderId||!productId||!userId) return res.status(400).json({ error:'orderId, productId and userId required' })
    const orderRows = await sql`SELECT * FROM orders WHERE id = ${orderId} LIMIT 1`
    if (!orderRows.length) return res.status(404).json({ canReview:false, reason:'Order not found' })
    const order = rowToOrder(orderRows[0])
    const userRows = await sql`SELECT email FROM users WHERE id = ${userId} LIMIT 1`
    const userEmail = userRows[0]?.email ?? ''
    const ownsOrder = order.customer?.userId===userId || (userEmail && order.customer?.email?.toLowerCase()===userEmail.toLowerCase())
    if (!ownsOrder) return res.json({ canReview:false, reason:'Order does not belong to this account' })
    if (order.status!=='delivered') return res.json({ canReview:false, reason:'Order not yet delivered' })
    if (!order.items?.some(i => i.productId===productId)) return res.json({ canReview:false, reason:'Product not in this order' })
    const existing = await sql`SELECT id FROM reviews WHERE order_id=${orderId} AND product_id=${productId} AND user_id=${userId} LIMIT 1`
    if (existing.length) return res.json({ canReview:false, reason:'Already reviewed', reviewId:existing[0].id })
    res.json({ canReview:true })
  } catch(e) { res.status(500).json({ error:e.message }) }
})

app.get('/api/reviews', async (_req, res) => {
  try { res.json(await getReviews()) }
  catch(e) { res.status(500).json({ error:e.message }) }
})

app.post('/api/reviews', async (req, res) => {
  try {
    const { orderId, productId, productSlug, productName, userId, userName, userEmail, rating, title, body, images } = req.body
    if (!orderId||!productId||!productSlug||!userId||!rating) return res.status(400).json({ error:'orderId, productId, productSlug, userId and rating required' })
    if (rating<1||rating>5) return res.status(400).json({ error:'Rating must be 1-5' })
    const orderRows = await sql`SELECT * FROM orders WHERE id = ${orderId} LIMIT 1`
    if (!orderRows.length) return res.status(404).json({ error:'Order not found' })
    const order = rowToOrder(orderRows[0])
    if (order.status!=='delivered') return res.status(403).json({ error:'Can only review delivered orders' })
    if (!order.items?.some(i => i.productId===productId)) return res.status(403).json({ error:'Product not in this order' })
    const existing = await sql`SELECT id FROM reviews WHERE order_id=${orderId} AND product_id=${productId} AND user_id=${userId} LIMIT 1`
    if (existing.length) return res.status(409).json({ error:'Already reviewed' })
    const review = {
      id:`rev-${Date.now()}`, productId:String(productId), productSlug:String(productSlug), productName:String(productName??''),
      orderId:String(orderId), userId:String(userId), userName:String(userName??'Anonymous'), userEmail:String(userEmail??''),
      rating:Number(rating), title:String(title??'').slice(0,120), body:String(body??'').slice(0,2000),
      images:Array.isArray(images)?images.slice(0,4):[], status:'pending', helpful:0, adminNote:'', createdAt:new Date().toISOString(),
    }
    await saveReview(review)
    res.status(201).json(review)
  } catch(e) { res.status(500).json({ error:e.message }) }
})

app.post('/api/reviews/:id/helpful', async (req, res) => {
  try {
    const rows = await sql`SELECT * FROM reviews WHERE id = ${req.params.id} LIMIT 1`
    if (!rows.length) return res.status(404).json({ error:'Review not found' })
    const r = rowToReview(rows[0])
    r.helpful = (r.helpful??0) + 1
    await saveReview(r); res.json({ helpful:r.helpful })
  } catch(e) { res.status(500).json({ error:e.message }) }
})

app.put('/api/reviews/:id', async (req, res) => {
  try {
    const rows = await sql`SELECT * FROM reviews WHERE id = ${req.params.id} LIMIT 1`
    if (!rows.length) return res.status(404).json({ error:'Review not found' })
    const r = rowToReview(rows[0])
    const { status, adminNote, rating, title, body, userName } = req.body
    if (status!==undefined) r.status=status
    if (adminNote!==undefined) r.adminNote=String(adminNote)
    if (rating!==undefined) r.rating=Number(rating)
    if (title!==undefined) r.title=String(title).slice(0,120)
    if (body!==undefined) r.body=String(body).slice(0,2000)
    if (userName!==undefined) r.userName=String(userName)
    await saveReview(r)
    if (status==='approved'||status==='rejected'||rating!==undefined) await syncProductRating(r.productSlug)
    res.json(r)
  } catch(e) { res.status(500).json({ error:e.message }) }
})

app.delete('/api/reviews/:id', async (req, res) => {
  try {
    const rows = await sql`SELECT * FROM reviews WHERE id = ${req.params.id} LIMIT 1`
    if (!rows.length) return res.status(404).json({ error:'Review not found' })
    const r = rowToReview(rows[0])
    await deleteReview(req.params.id)
    await syncProductRating(r.productSlug)
    res.json({ message:'Deleted', id:r.id })
  } catch(e) { res.status(500).json({ error:e.message }) }
})

// ═══════════════════════════════════════════════════════════════════════════════
// BANNERS  /api/banners/*
// ═══════════════════════════════════════════════════════════════════════════════
app.get('/api/banners', async (_req, res) => {
  try { res.json(await getBanners()) }
  catch(e) { res.status(500).json({ error:e.message }) }
})
app.get('/api/banners/all', requireAdmin, async (_req, res) => {
  try { res.json(await getBanners()) }
  catch(e) { res.status(500).json({ error:e.message }) }
})
app.post('/api/banners', requireAdmin, async (req, res) => {
  try {
    const { id, tag, title, subtitle, cta, link, image, active, order } = req.body
    if (!title||!image) return res.status(400).json({ error:'title and image required' })
    const banners = await getBanners()
    const newBanner = {
      id: id||randomBytes(8).toString('hex'), tag:tag??'', title:title.trim(),
      subtitle:subtitle??'', cta:cta??'Shop Now', link:link??'/', image:image.trim(),
      active:active??true, order:typeof order==='number'?order:banners.length,
    }
    await saveBanner(newBanner); res.status(201).json(newBanner)
  } catch(e) { res.status(500).json({ error:e.message }) }
})
app.put('/api/banners/reorder', requireAdmin, async (req, res) => {
  try {
    const updates = req.body
    if (!Array.isArray(updates)) return res.status(400).json({ error:'Expected array of {id,order}' })
    const banners = await getBanners()
    const map = new Map(updates.map(u=>[u.id,u.order]))
    for (const b of banners) if (map.has(b.id)) { b.order=map.get(b.id); await saveBanner(b) }
    res.json(await getBanners())
  } catch(e) { res.status(500).json({ error:e.message }) }
})
app.put('/api/banners/:id', requireAdmin, async (req, res) => {
  try {
    const rows = await sql`SELECT * FROM banners WHERE id = ${req.params.id} LIMIT 1`
    if (!rows.length) return res.status(404).json({ error:'Banner not found' })
    const updated = { ...rowToBanner(rows[0]), ...req.body, id:req.params.id }
    await saveBanner(updated); res.json(updated)
  } catch(e) { res.status(500).json({ error:e.message }) }
})
app.patch('/api/banners/:id/toggle', requireAdmin, async (req, res) => {
  try {
    const rows = await sql`SELECT * FROM banners WHERE id = ${req.params.id} LIMIT 1`
    if (!rows.length) return res.status(404).json({ error:'Banner not found' })
    const b = rowToBanner(rows[0]); b.active = !b.active
    await saveBanner(b); res.json(b)
  } catch(e) { res.status(500).json({ error:e.message }) }
})
app.delete('/api/banners/:id', requireAdmin, async (req, res) => {
  try {
    const rows = await sql`SELECT id FROM banners WHERE id = ${req.params.id} LIMIT 1`
    if (!rows.length) return res.status(404).json({ error:'Banner not found' })
    await deleteBanner(req.params.id); res.json({ success:true })
  } catch(e) { res.status(500).json({ error:e.message }) }
})

// ═══════════════════════════════════════════════════════════════════════════════
// ADMIN DASHBOARD & UTILITIES  /api/admin/*
// ═══════════════════════════════════════════════════════════════════════════════
app.get('/api/admin/dashboard', requireAdmin, async (_req, res) => {
  try {
    const [products, orders] = await Promise.all([getProducts(), getOrders()])
    const now = new Date(), thisMonth=now.getMonth(), thisYear=now.getFullYear()
    const lastMonth=thisMonth===0?11:thisMonth-1, lastMonthYear=thisMonth===0?thisYear-1:thisYear
    function inMonth(d,m,y){const dt=new Date(d);return dt.getMonth()===m&&dt.getFullYear()===y}
    const paidOrders = orders.filter(o=>o.paymentStatus==='paid')
    const totalRevenue = paidOrders.reduce((s,o)=>s+o.total,0)
    const thisMonthRev = paidOrders.filter(o=>inMonth(o.createdAt,thisMonth,thisYear)).reduce((s,o)=>s+o.total,0)
    const lastMonthRev = paidOrders.filter(o=>inMonth(o.createdAt,lastMonth,lastMonthYear)).reduce((s,o)=>s+o.total,0)
    const revenueGrowth = lastMonthRev>0?((thisMonthRev-lastMonthRev)/lastMonthRev)*100:0
    const statusCounts = orders.reduce((acc,o)=>{acc[o.status]=(acc[o.status]??0)+1;return acc},{})
    const last7=[]; for(let i=6;i>=0;i--){const d=new Date(now);d.setDate(d.getDate()-i);const ds=d.toISOString().slice(0,10);const dayOrders=orders.filter(o=>o.createdAt.slice(0,10)===ds);last7.push({date:ds,revenue:dayOrders.filter(o=>o.paymentStatus==='paid').reduce((s,o)=>s+o.total,0),orders:dayOrders.length})}
    const catMap={}; products.forEach(p=>{catMap[p.category]=(catMap[p.category]??0)+1})
    const categoryBreakdown=Object.entries(catMap).map(([name,count])=>({name,count})).sort((a,b)=>b.count-a.count)
    const recentOrders=[...orders].sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt)).slice(0,5)
    res.json({
      totalRevenue, thisMonthRevenue:thisMonthRev, lastMonthRevenue:lastMonthRev,
      revenueGrowth:Number(revenueGrowth.toFixed(1)), totalOrders:orders.length, statusCounts,
      pendingOrders:(statusCounts['pending']??0)+(statusCounts['processing']??0),
      totalProducts:products.length, lowStockCount:products.filter(p=>p.stock<25).length,
      outOfStock:products.filter(p=>p.stock===0).length,
      avgRating:products.length?Number((products.reduce((s,p)=>s+p.rating,0)/products.length).toFixed(2)):0,
      uniqueCustomers:[...new Set(orders.map(o=>o.customer?.email).filter(Boolean))].length,
      last7Days:last7, categoryBreakdown, recentOrders,
    })
  } catch(e) { res.status(500).json({ error:e.message }) }
})

app.get('/api/admin/customers', requireAdmin, async (_req, res) => {
  try {
    const orders = await getOrders()
    const map={}
    orders.forEach(o=>{
      const email=o.customer?.email??o.id
      if(!map[email]) map[email]={id:email,name:o.customer?.name??'Unknown',email:o.customer?.email??'',phone:o.customer?.phone??'',address:o.customer?.address??'',orderCount:0,totalSpent:0,lastOrder:o.createdAt,firstOrder:o.createdAt,orders:[]}
      map[email].orderCount++; map[email].totalSpent+=o.total
      if(o.createdAt>map[email].lastOrder) map[email].lastOrder=o.createdAt
      if(o.createdAt<map[email].firstOrder) map[email].firstOrder=o.createdAt
      map[email].orders.push(o.id)
    })
    const customers=Object.values(map).sort((a,b)=>b.totalSpent-a.totalSpent)
    res.json({ data:customers, total:customers.length })
  } catch(e) { res.status(500).json({ error:e.message }) }
})

// reset-collection — truncates a table and re-seeds on next request
app.delete('/api/admin/reset-collection/:col', requireAdmin, async (req, res) => {
  try {
    const col = req.params.col
    if (col === 'products')   { await sql`TRUNCATE products CASCADE`; res.json({ ok:true, message:'products cleared — will auto-reseed on next request' }) }
    else if (col === 'orders') { await sql`TRUNCATE orders CASCADE`;   res.json({ ok:true, message:'orders cleared — will auto-reseed on next request' }) }
    else if (col === 'categories') { await sql`TRUNCATE categories CASCADE`; res.json({ ok:true, message:'categories cleared — will auto-reseed on next request' }) }
    else res.status(400).json({ error:'col must be products|orders|categories' })
  } catch(e) { res.status(500).json({ error:e.message }) }
})

// ═══════════════════════════════════════════════════════════════════════════════
// SSE EVENTS  /api/events  (no-op snapshot on Vercel serverless)
// ═══════════════════════════════════════════════════════════════════════════════
app.get('/api/events', (req, res) => {
  res.setHeader('Content-Type','text/event-stream')
  res.setHeader('Cache-Control','no-cache')
  res.setHeader('Connection','keep-alive')
  res.setHeader('X-Accel-Buffering','no')
  res.flushHeaders()
  // Vercel serverless can't hold long-lived connections.
  // Send an immediate snapshot and close gracefully.
  Promise.all([
    sql`SELECT * FROM orders ORDER BY created_at DESC LIMIT 50`,
    sql`SELECT * FROM products ORDER BY updated_at DESC LIMIT 50`,
  ]).then(([orderRows, productRows]) => {
    try {
      res.write(`event: snapshot\ndata: ${JSON.stringify({
        orders: orderRows.map(rowToOrder),
        products: productRows.map(rowToProduct),
      })}\n\n`)
    } catch {}
    res.end()
  }).catch(() => res.end())
})

// ═══════════════════════════════════════════════════════════════════════════════
// Export for Vercel
// ═══════════════════════════════════════════════════════════════════════════════
module.exports = app
