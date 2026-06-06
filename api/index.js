// api/index.js — plain JS, no TypeScript, no compilation needed
// Vercel runs this directly as a Node.js serverless function

const express = require('express')
const cors    = require('cors')
const jwt     = require('jsonwebtoken')

const app = express()
const JWT_SECRET = process.env.JWT_SECRET || 'sellbazar-super-secret-key-2025'

const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
  : ['http://localhost:5173','http://localhost:5174','http://localhost:3000','https://sell-bazar.vercel.app']

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true)
    callback(new Error('CORS not allowed'))
  },
  credentials: true,
}))
app.use(express.json({ limit: '10mb' }))

// ── Upstash Redis persistence layer ──────────────────────────────────────────
// Install "Upstash for Redis" from Vercel Marketplace and it will auto-inject:
//   UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN
// Also supports legacy Vercel KV env var names:
//   KV_REST_API_URL / KV_REST_API_TOKEN
//
// KV key schema:
//   Products  — "sb:product:<slug>"  → single product JSON
//             — "sb:product_ids"     → JSON array of slugs (admin-created)
//             — "sb:deleted_slugs"   → JSON array of seed slugs that were deleted
//   Orders    — "sb:order:<id>"      → single order JSON
//             — "sb:order_ids"       → JSON array of order IDs
//   Categories— "sb:categories"      → full CATEGORIES array JSON
//   Admins    — "sb:admins"          → full ADMIN_ACCOUNTS array JSON (passwords included)

const KV_URL    = process.env.UPSTASH_REDIS_REST_URL   || process.env.KV_REST_API_URL
const KV_TOKEN  = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN
const KV_ENABLED = !!(KV_URL && KV_TOKEN)

const KV_HEADERS = () => ({
  Authorization: `Bearer ${KV_TOKEN}`,
  'Content-Type': 'application/json',
})

async function kvGet(key) {
  if (!KV_ENABLED) return null
  try {
    const res  = await fetch(`${KV_URL}/get/${encodeURIComponent(key)}`, { headers: KV_HEADERS() })
    if (!res.ok) return null
    const json = await res.json()
    if (json.result === null || json.result === undefined) return null
    if (typeof json.result === 'string') {
      try { return JSON.parse(json.result) } catch { return json.result }
    }
    return json.result
  } catch { return null }
}

async function kvSet(key, value) {
  if (!KV_ENABLED) return
  try {
    const encoded = encodeURIComponent(JSON.stringify(value))
    await fetch(`${KV_URL}/set/${encodeURIComponent(key)}/${encoded}`, {
      method: 'POST', headers: KV_HEADERS(),
    })
  } catch (e) { console.error('[KV set]', key, e.message) }
}

async function kvDel(key) {
  if (!KV_ENABLED) return
  try {
    await fetch(`${KV_URL}/del/${encodeURIComponent(key)}`, {
      method: 'POST', headers: KV_HEADERS(),
    })
  } catch (e) { console.error('[KV del]', key, e.message) }
}

// ── In-memory fallback (local dev / Redis not connected) ─────────────────────
const _mem = {
  dynamicProducts: [],
  deletedSlugs:    new Set(),
  dynamicOrders:   [],
  categories:      null,   // null = use SEED_CATEGORIES
  admins:          null,   // null = use SEED_ADMINS
  users:           [],     // registered users (in-memory fallback)
  banners:         [],     // banner slides
}

// ──────────────────────────────────────────────────────────────────────────────
// SEED DATA
// ──────────────────────────────────────────────────────────────────────────────
const SEED_CATEGORIES = [
  { id:'c1',slug:'electronics',  name:'Electronics',  nameBn:'ইলেকট্রনিক্স', icon:'fa-microchip',      color:'#3b82f6', subcategories:[{id:'s1-1',slug:'mobile-phones',name:'Mobile Phones',nameBn:'মোবাইল ফোন',icon:'fa-mobile-screen'},{id:'s1-2',slug:'laptops',name:'Laptops',nameBn:'ল্যাপটপ',icon:'fa-laptop'},{id:'s1-3',slug:'tablets',name:'Tablets',nameBn:'ট্যাবলেট',icon:'fa-tablet-screen-button'},{id:'s1-4',slug:'headphones',name:'Headphones',nameBn:'হেডফোন',icon:'fa-headphones'},{id:'s1-5',slug:'smart-watches',name:'Smart Watches',nameBn:'স্মার্টওয়াচ',icon:'fa-watch-smart'},{id:'s1-6',slug:'cameras',name:'Cameras',nameBn:'ক্যামেরা',icon:'fa-camera'},{id:'s1-7',slug:'televisions',name:'Televisions',nameBn:'টেলিভিশন',icon:'fa-tv'},{id:'s1-8',slug:'accessories',name:'Accessories',nameBn:'আনুষাঙ্গিক',icon:'fa-plug'}]},
  { id:'c2',slug:'fashion',      name:'Fashion',      nameBn:'ফ্যাশন',         icon:'fa-shirt',           color:'#ec4899', subcategories:[{id:'s2-1',slug:'mens-clothing',name:"Men's Clothing",nameBn:'পুরুষ পোশাক',icon:'fa-person'},{id:'s2-2',slug:'womens-clothing',name:"Women's Clothing",nameBn:'মহিলা পোশাক',icon:'fa-person-dress'},{id:'s2-3',slug:'kids-clothing',name:"Kids' Clothing",nameBn:'শিশু পোশাক',icon:'fa-child'},{id:'s2-4',slug:'footwear',name:'Footwear',nameBn:'জুতা',icon:'fa-shoe-prints'},{id:'s2-5',slug:'sarees',name:'Sarees',nameBn:'শাড়ি',icon:'fa-scarf'},{id:'s2-6',slug:'bags-wallets',name:'Bags & Wallets',nameBn:'ব্যাগ ও মানিব্যাগ',icon:'fa-bag-shopping'},{id:'s2-7',slug:'ethnic-wear',name:'Ethnic Wear',nameBn:'ঐতিহ্যবাহী পোশাক',icon:'fa-vest'}]},
  { id:'c3',slug:'grocery',      name:'Grocery',      nameBn:'মুদিখানা',        icon:'fa-basket-shopping', color:'#22c55e', subcategories:[{id:'s3-1',slug:'rice-grains',name:'Rice & Grains',nameBn:'চাল ও শস্য',icon:'fa-wheat-awn'},{id:'s3-2',slug:'oil-spices',name:'Oil & Spices',nameBn:'তেল ও মশলা',icon:'fa-jar'},{id:'s3-3',slug:'beverages',name:'Beverages',nameBn:'পানীয়',icon:'fa-bottle-water'},{id:'s3-4',slug:'snacks',name:'Snacks',nameBn:'স্ন্যাকস',icon:'fa-cookie-bite'},{id:'s3-5',slug:'dairy',name:'Dairy',nameBn:'দুগ্ধজাত পণ্য',icon:'fa-cow'},{id:'s3-6',slug:'fresh-produce',name:'Fresh Produce',nameBn:'তাজা শাকসবজি',icon:'fa-carrot'}]},
  { id:'c4',slug:'beauty',       name:'Beauty',       nameBn:'বিউটি',           icon:'fa-pump-soap',       color:'#a78bfa', subcategories:[{id:'s4-1',slug:'skincare',name:'Skincare',nameBn:'স্কিনকেয়ার',icon:'fa-spa'},{id:'s4-2',slug:'haircare',name:'Haircare',nameBn:'হেয়ারকেয়ার',icon:'fa-scissors'},{id:'s4-3',slug:'makeup',name:'Makeup',nameBn:'মেকআপ',icon:'fa-wand-magic-sparkles'},{id:'s4-4',slug:'fragrances',name:'Fragrances',nameBn:'সুগন্ধি',icon:'fa-bottle-droplet'},{id:'s4-5',slug:'mens-grooming',name:"Men's Grooming",nameBn:'পুরুষ গ্রুমিং',icon:'fa-razor'}]},
  { id:'c5',slug:'home',         name:'Home & Living',nameBn:'হোম',             icon:'fa-couch',           color:'#f97316', subcategories:[{id:'s5-1',slug:'furniture',name:'Furniture',nameBn:'আসবাবপত্র',icon:'fa-couch'},{id:'s5-2',slug:'kitchen',name:'Kitchen',nameBn:'রান্নাঘর',icon:'fa-kitchen-set'},{id:'s5-3',slug:'air-conditioners',name:'Air Conditioners',nameBn:'এয়ার কন্ডিশনার',icon:'fa-snowflake'},{id:'s5-4',slug:'bedding',name:'Bedding',nameBn:'বিছানার চাদর',icon:'fa-bed'},{id:'s5-5',slug:'decor',name:'Décor',nameBn:'সাজসজ্জা',icon:'fa-lamp-desk'},{id:'s5-6',slug:'cleaning',name:'Cleaning',nameBn:'পরিষ্কার',icon:'fa-broom'}]},
  { id:'c6',slug:'sports',       name:'Sports',       nameBn:'স্পোর্টস',        icon:'fa-dumbbell',        color:'#0ea5e9', subcategories:[{id:'s6-1',slug:'cricket',name:'Cricket',nameBn:'ক্রিকেট',icon:'fa-baseball-bat-ball'},{id:'s6-2',slug:'football',name:'Football',nameBn:'ফুটবল',icon:'fa-futbol'},{id:'s6-3',slug:'fitness',name:'Fitness',nameBn:'ফিটনেস',icon:'fa-dumbbell'},{id:'s6-4',slug:'outdoor',name:'Outdoor',nameBn:'আউটডোর',icon:'fa-person-hiking'},{id:'s6-5',slug:'cycling',name:'Cycling',nameBn:'সাইক্লিং',icon:'fa-bicycle'}]},
  { id:'c7',slug:'business',     name:'Business',     nameBn:'ব্যবসা',          icon:'fa-briefcase',       color:'#8b5cf6', subcategories:[{id:'s7-1',slug:'office-supplies',name:'Office Supplies',nameBn:'অফিস সামগ্রী',icon:'fa-paperclip'},{id:'s7-2',slug:'pos-systems',name:'POS Systems',nameBn:'POS সিস্টেম',icon:'fa-cash-register'},{id:'s7-3',slug:'printing',name:'Printing',nameBn:'প্রিন্টিং',icon:'fa-print'},{id:'s7-4',slug:'storage',name:'Storage',nameBn:'স্টোরেজ',icon:'fa-boxes-stacked'}]},
  { id:'c8',slug:'books',        name:'Books',        nameBn:'বই',              icon:'fa-book-open',       color:'#fbbf24', subcategories:[{id:'s8-1',slug:'bangla-literature',name:'Bangla Literature',nameBn:'বাংলা সাহিত্য',icon:'fa-book'},{id:'s8-2',slug:'academic',name:'Academic',nameBn:'শিক্ষামূলক',icon:'fa-graduation-cap'},{id:'s8-3',slug:'self-help',name:'Self Help',nameBn:'সেলফ হেল্প',icon:'fa-brain'},{id:'s8-4',slug:'religious',name:'Religious',nameBn:'ধর্মীয়',icon:'fa-star-and-crescent'},{id:'s8-5',slug:'children',name:"Children's",nameBn:'শিশু',icon:'fa-child-reaching'}]},
]

const SEED_PRODUCTS = [
  { id:'1',  slug:'samsung-galaxy-a55',   name:'Samsung Galaxy A55 5G',              nameBn:'স্যামসাং গ্যালাক্সি A55',   description:'6.6" AMOLED, 50MP camera, 5000mAh',                     price:45000,salePrice:39999,images:['https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=400&h=400&fit=crop'],category:'Electronics',subcategory:'mobile-phones',categoryBn:'ইলেকট্রনিক্স',brand:'Samsung',stock:42,rating:4.6,reviewCount:318,tags:['phone','5g'],isNew:true,isFeatured:false,deliveryDays:2,seller:'TechWorld BD',location:'Dhaka',createdAt:'2025-01-10T10:00:00Z'},
  { id:'2',  slug:'nike-air-max-2027',    name:'Nike Air Max 2027',                  nameBn:'নাইকি এয়ার ম্যাক্স',         description:'Future-forward cushioning, breathable mesh',              price:12000,salePrice:9499, images:['https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&h=400&fit=crop'],category:'Fashion',    subcategory:'footwear',        categoryBn:'ফ্যাশন',       brand:'Nike',   stock:80,rating:4.8,reviewCount:512,tags:['shoes','sneakers'],isNew:false,isFeatured:false,deliveryDays:3,seller:'SportZone',location:'Chittagong',createdAt:'2025-01-12T10:00:00Z'},
  { id:'3',  slug:'walton-primo-x7',      name:'Walton Primo X7 Ultra',              nameBn:'ওয়ালটন প্রিমো X7',           description:'Made in Bangladesh, 108MP, 6000mAh',                     price:28000,salePrice:24999,images:['https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400&h=400&fit=crop'],category:'Electronics',subcategory:'mobile-phones',categoryBn:'ইলেকট্রনিক্স',brand:'Walton', stock:65,rating:4.3,reviewCount:224,tags:['phone','walton'],isNew:false,isFeatured:true,deliveryDays:1,seller:'Walton Official',location:'Dhaka',createdAt:'2025-01-14T10:00:00Z'},
  { id:'4',  slug:'muslin-saree-jamdani', name:'Jamdani Muslin Saree',               nameBn:'জামদানি মসলিন শাড়ি',         description:'Authentic Dhaka Muslin, UNESCO heritage craft',           price:8500, salePrice:7200, images:['https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=400&h=400&fit=crop'],category:'Fashion',    subcategory:'sarees',          categoryBn:'ফ্যাশন',       brand:'Dhaka Muslin',stock:20,rating:4.9,reviewCount:187,tags:['saree','jamdani'],isNew:false,isFeatured:true,deliveryDays:4,seller:'Muslin House',location:'Narayanganj',createdAt:'2025-01-15T10:00:00Z'},
  { id:'5',  slug:'xiaomi-redmi-note-13', name:'Xiaomi Redmi Note 13 Pro',           nameBn:'শাওমি রেডমি নোট ১৩',         description:'200MP OIS camera, 5100mAh, 67W charging',                price:35000,salePrice:29999,images:['https://images.unsplash.com/photo-1585060544812-6b45742d762f?w=400&h=400&fit=crop'],category:'Electronics',subcategory:'mobile-phones',categoryBn:'ইলেকট্রনিক্স',brand:'Xiaomi', stock:55,rating:4.5,reviewCount:443,tags:['phone','xiaomi'],isNew:true,isFeatured:false,deliveryDays:2,seller:'MiStore BD',location:'Dhaka',createdAt:'2025-01-16T10:00:00Z'},
  { id:'6',  slug:'bkash-qr-scanner',     name:'Smart QR POS Terminal',              nameBn:'স্মার্ট QR টার্মিনাল',        description:'bKash/Nagad/Rocket integrated, touchscreen',              price:4500, salePrice:3800, images:['https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=400&h=400&fit=crop'],category:'Business',   subcategory:'pos-systems',     categoryBn:'ব্যবসা',       brand:'PayTech BD',stock:100,rating:4.4,reviewCount:89,tags:['pos','qr'],isNew:false,isFeatured:false,deliveryDays:3,seller:'PayTech',location:'Dhaka',createdAt:'2025-01-17T10:00:00Z'},
  { id:'7',  slug:'pran-mango-juice-1l',  name:'PRAN Mango Juice 1L',                nameBn:'প্রাণ আম জুস',                 description:'100% real mango, no preservatives, 1 litre',             price:120,  salePrice:99,   images:['https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=400&h=400&fit=crop'],category:'Grocery',    subcategory:'beverages',       categoryBn:'মুদিখানা',    brand:'PRAN',   stock:500,rating:4.7,reviewCount:1200,tags:['juice','pran'],isNew:false,isFeatured:false,deliveryDays:1,seller:'PRAN Foods',location:'Nationwide',createdAt:'2025-01-18T10:00:00Z'},
  { id:'8',  slug:'lenovo-ideapad-slim5', name:'Lenovo IdeaPad Slim 5',              nameBn:'লেনোভো আইডিয়াপ্যাড',         description:'AMD Ryzen 7, 16GB RAM, 512GB SSD, 14" OLED',             price:95000,salePrice:84999,images:['https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=400&h=400&fit=crop'],category:'Electronics',subcategory:'laptops',         categoryBn:'ইলেকট্রনিক্স',brand:'Lenovo', stock:18,rating:4.6,reviewCount:267,tags:['laptop','lenovo'],isNew:false,isFeatured:true,deliveryDays:3,seller:'LaptopHouse BD',location:'Dhaka',createdAt:'2025-01-19T10:00:00Z'},
  { id:'9',  slug:'aarong-kurta-men',     name:'Aarong Cotton Kurta',                nameBn:'আড়ং কটন কুর্তা',             description:'Handloom cotton, block print, exclusive Aarong design',  price:3500, salePrice:2800, images:['https://images.unsplash.com/photo-1586790170083-2f9ceadc732d?w=400&h=400&fit=crop'],category:'Fashion',    subcategory:'mens-clothing',   categoryBn:'ফ্যাশন',       brand:'Aarong', stock:150,rating:4.7,reviewCount:342,tags:['kurta','aarong'],isNew:false,isFeatured:false,deliveryDays:2,seller:'Aarong Official',location:'Dhaka',createdAt:'2025-01-20T10:00:00Z'},
  { id:'10', slug:'symphony-z55',         name:'Symphony Z55 Pro',                   nameBn:'সিম্ফনি Z55 প্রো',            description:'Local brand, 6.7" display, 5000mAh, dual camera',        price:18000,salePrice:15499,images:['https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=400&h=400&fit=crop'],category:'Electronics',subcategory:'mobile-phones',categoryBn:'ইলেকট্রনিক্স',brand:'Symphony',stock:90,rating:4.1,reviewCount:156,tags:['phone','symphony'],isNew:true,isFeatured:false,deliveryDays:1,seller:'Symphony Official',location:'Dhaka',createdAt:'2025-01-21T10:00:00Z'},
  { id:'11', slug:'rfl-pressure-cooker',  name:'RFL Pressure Cooker 5L',             nameBn:'আরএফএল প্রেশার কুকার',       description:'5-litre stainless steel, safety valve',                  price:2200, salePrice:1799, images:['https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=400&h=400&fit=crop'],category:'Home & Living',subcategory:'kitchen',       categoryBn:'হোম',          brand:'RFL',    stock:200,rating:4.5,reviewCount:890,tags:['kitchen','rfl'],isNew:false,isFeatured:false,deliveryDays:3,seller:'RFL Houseware',location:'Nationwide',createdAt:'2025-01-22T10:00:00Z'},
  { id:'12', slug:'meril-splash',         name:'Meril Splash Body Wash',             nameBn:'মেরিল স্প্ল্যাশ',             description:'Fresh citrus scent, moisturizing formula, 500ml',         price:350,  salePrice:299,  images:['https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=400&h=400&fit=crop'],category:'Beauty',     subcategory:'skincare',        categoryBn:'বিউটি',        brand:'Meril',  stock:300,rating:4.3,reviewCount:567,tags:['bodycare','meril'],isNew:false,isFeatured:false,deliveryDays:2,seller:'Meril Beauty',location:'Nationwide',createdAt:'2025-01-23T10:00:00Z'},
  { id:'13', slug:'sony-wh1000xm5',       name:'Sony WH-1000XM5',                    nameBn:'সনি হেডফোন XM5',              description:'Industry-leading ANC, 30hr battery, LDAC',               price:32000,salePrice:27500,images:['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=400&fit=crop'],category:'Electronics',subcategory:'headphones',      categoryBn:'ইলেকট্রনিক্স',brand:'Sony',   stock:30,rating:4.8,reviewCount:532,tags:['headphones','anc'],isNew:false,isFeatured:true,deliveryDays:3,seller:'AudioZone BD',location:'Dhaka',createdAt:'2025-01-24T10:00:00Z'},
  { id:'14', slug:'apple-watch-s9',       name:'Apple Watch Series 9',               nameBn:'অ্যাপল ওয়াচ S9',             description:'S9 chip, Always-On Display, ECG, Blood Oxygen',          price:55000,salePrice:49999,images:['https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=400&h=400&fit=crop'],category:'Electronics',subcategory:'smart-watches',   categoryBn:'ইলেকট্রনিক্স',brand:'Apple',  stock:15,rating:4.9,reviewCount:189,tags:['smartwatch','apple'],isNew:true,isFeatured:false,deliveryDays:2,seller:'iZone Bangladesh',location:'Dhaka',createdAt:'2025-01-25T10:00:00Z'},
  { id:'15', slug:'basmati-rice-5kg',     name:'Premium Basmati Rice 5kg',           nameBn:'বাসমতি চাল ৫ কেজি',           description:'Long-grain aged basmati, low GI, fragrant',              price:980,  salePrice:849,  images:['https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400&h=400&fit=crop'],category:'Grocery',    subcategory:'rice-grains',     categoryBn:'মুদিখানা',    brand:'Gold Coin',stock:300,rating:4.6,reviewCount:540,tags:['rice','basmati'],isNew:false,isFeatured:false,deliveryDays:1,seller:'Meena Bazaar',location:'Dhaka',createdAt:'2025-01-26T10:00:00Z'},
  { id:'16', slug:'loreal-vitamin-c',     name:"L'Oreal Vitamin C Serum",            nameBn:'লোরিয়াল ভিটামিন C সিরাম',   description:'10% pure Vitamin C, anti-aging, brightening, 30ml',     price:2200, salePrice:1799, images:['https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=400&h=400&fit=crop'],category:'Beauty',     subcategory:'skincare',        categoryBn:'বিউটি',        brand:'LOreal', stock:75,rating:4.6,reviewCount:423,tags:['serum','skincare'],isNew:true,isFeatured:false,deliveryDays:2,seller:'BeautyWorld BD',location:'Dhaka',createdAt:'2025-01-27T10:00:00Z'},
  { id:'17', slug:'walton-ac-1ton',       name:'Walton Inverter AC 1 Ton',           nameBn:'ওয়ালটন ১ টন এসি',            description:'Inverter, Wi-Fi Control, Auto-Clean, Energy A+++',       price:55000,salePrice:47999,images:['https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=400&h=400&fit=crop'],category:'Home & Living',subcategory:'air-conditioners',categoryBn:'হোম',          brand:'Walton', stock:25,rating:4.5,reviewCount:178,tags:['ac','walton'],isNew:false,isFeatured:true,deliveryDays:5,seller:'Walton Official',location:'Dhaka',createdAt:'2025-01-28T10:00:00Z'},
  { id:'18', slug:'gp-cricket-bat',       name:'GP Pro Cricket Bat English Willow',  nameBn:'জিপি ক্রিকেট ব্যাট',         description:'Grade 1 English Willow, full size, pre-knocked',         price:9500, salePrice:7999, images:['https://images.unsplash.com/photo-1531415074968-036ba1b575da?w=400&h=400&fit=crop'],category:'Sports',     subcategory:'cricket',         categoryBn:'স্পোর্টস',   brand:'GP',     stock:35,rating:4.7,reviewCount:143,tags:['cricket','bat'],isNew:true,isFeatured:false,deliveryDays:3,seller:'Sports Arena BD',location:'Dhaka',createdAt:'2025-01-29T10:00:00Z'},
  { id:'19', slug:'humayun-himu',         name:'Humayun Ahmed Himu Samagra',         nameBn:'হুমায়ূন আহমেদ হিমু সমগ্র',  description:'Complete Himu series, 5 volumes, hardcover',             price:1800, salePrice:1499, images:['https://images.unsplash.com/photo-1512820790803-83ca734da794?w=400&h=400&fit=crop'],category:'Books',      subcategory:'bangla-literature',categoryBn:'বই',           brand:'Bhasha Prakash',stock:150,rating:5.0,reviewCount:987,tags:['bangla','novel','humayun'],isNew:false,isFeatured:true,deliveryDays:2,seller:'Rokomari',location:'Dhaka',createdAt:'2025-01-30T10:00:00Z'},
  { id:'20', slug:'polo-shirt-men',       name:"Men's Premium Polo Shirt",           nameBn:'পুরুষ পোলো শার্ট',            description:'100% Egyptian Cotton, slim fit, 12 colors',              price:1800, salePrice:1299, images:['https://images.unsplash.com/photo-1586790170083-2f9ceadc732d?w=400&h=400&fit=crop'],category:'Fashion',    subcategory:'mens-clothing',   categoryBn:'ফ্যাশন',       brand:'Thread Co',stock:200,rating:4.5,reviewCount:892,tags:['shirt','polo'],isNew:true,isFeatured:false,deliveryDays:2,seller:'StyleHub BD',location:'Dhaka',createdAt:'2025-01-31T10:00:00Z'},
  { id:'21', slug:'canon-eos-r50',        name:'Canon EOS R50 Mirrorless Camera',    nameBn:'ক্যানন EOS R50 ক্যামেরা',    description:'24.2MP APS-C, 4K Video, Dual Pixel AF',                 price:85000,salePrice:74999,images:['https://images.unsplash.com/photo-1502982720700-bfff97f2ecac?w=400&h=400&fit=crop'],category:'Electronics',subcategory:'cameras',         categoryBn:'ইলেকট্রনিক্স',brand:'Canon',  stock:12,rating:4.7,reviewCount:98,tags:['camera','canon'],isNew:false,isFeatured:false,deliveryDays:4,seller:'PixelPro BD',location:'Dhaka',createdAt:'2025-02-01T10:00:00Z'},
  { id:'22', slug:'samsung-65-qled-tv',   name:'Samsung 65 QLED 4K Smart TV',        nameBn:'স্যামসাং QLED 65 টিভি',      description:'Quantum HDR, 120Hz, Dolby Atmos, Gaming Mode',           price:145000,salePrice:129000,images:['https://images.unsplash.com/photo-1593359677879-a4bb92f829e1?w=400&h=400&fit=crop'],category:'Electronics',subcategory:'televisions',    categoryBn:'ইলেকট্রনিক্স',brand:'Samsung',stock:8,rating:4.7,reviewCount:143,tags:['tv','qled','4k'],isNew:false,isFeatured:true,deliveryDays:5,seller:'TechWorld BD',location:'Dhaka',createdAt:'2025-02-02T10:00:00Z'},
  { id:'23', slug:'ladies-kurti-set',     name:'Ladies Embroidered Kurti Set',       nameBn:'লেডিজ এমব্রয়ডারড কুর্তি',  description:'Hand embroidery, cotton-blend, 3-piece set, festive',    price:3500, salePrice:2799, images:['https://images.unsplash.com/photo-1594938298603-c8148c4b2ef4?w=400&h=400&fit=crop'],category:'Fashion',    subcategory:'womens-clothing', categoryBn:'ফ্যাশন',       brand:'Aarong', stock:45,rating:4.7,reviewCount:341,tags:['kurti','ladies'],isNew:false,isFeatured:true,deliveryDays:3,seller:'Aarong Official',location:'Dhaka',createdAt:'2025-02-03T10:00:00Z'},
  { id:'24', slug:'atomic-habits-bangla', name:'Atomic Habits Bangla Translation',   nameBn:'অ্যাটমিক হ্যাবিটস বাংলা',  description:'James Clear, Bangla Edition, Paperback, Self-help',     price:450,  salePrice:380,  images:['https://images.unsplash.com/photo-1589829085413-56de8ae18c73?w=400&h=400&fit=crop'],category:'Books',      subcategory:'self-help',       categoryBn:'বই',           brand:'Ananya', stock:200,rating:4.8,reviewCount:654,tags:['self-help','bangla'],isNew:true,isFeatured:false,deliveryDays:2,seller:'Rokomari',location:'Dhaka',createdAt:'2025-02-04T10:00:00Z'},
  { id:'25', slug:'rasasi-oud-perfume',   name:'Rasasi Oud Al Layl EDP 100ml',       nameBn:'রাসাসি উদ পারফিউম',          description:'Arabian Oud, long lasting 12hr, unisex',                price:4500, salePrice:3800, images:['https://images.unsplash.com/photo-1541643600914-78b084683702?w=400&h=400&fit=crop'],category:'Beauty',     subcategory:'fragrances',      categoryBn:'বিউটি',        brand:'Rasasi', stock:40,rating:4.8,reviewCount:267,tags:['perfume','oud'],isNew:false,isFeatured:false,deliveryDays:3,seller:'Fragrance House BD',location:'Dhaka',createdAt:'2025-02-05T10:00:00Z'},
  { id:'26', slug:'miyako-rice-cooker',   name:'Miyako 5L Digital Rice Cooker',      nameBn:'মিয়াকো ডিজিটাল রাইস কুকার',description:'Multi-cook, keep warm, non-stick inner pot',             price:3200, salePrice:2699, images:['https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=400&h=400&fit=crop'],category:'Home & Living',subcategory:'kitchen',       categoryBn:'হোম',          brand:'Miyako', stock:90,rating:4.4,reviewCount:562,tags:['kitchen','rice-cooker'],isNew:false,isFeatured:false,deliveryDays:2,seller:'HomePlus BD',location:'Dhaka',createdAt:'2025-02-06T10:00:00Z'},
  { id:'27', slug:'yoga-mat-tpe',         name:'Premium TPE Yoga Mat 6mm',           nameBn:'প্রিমিয়াম যোগা ম্যাট',      description:'Non-slip, eco-friendly TPE, double-layer, carry strap', price:1800, salePrice:1399, images:['https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=400&fit=crop'],category:'Sports',     subcategory:'fitness',         categoryBn:'স্পোর্টস',   brand:'FitLife', stock:120,rating:4.5,reviewCount:289,tags:['yoga','fitness'],isNew:false,isFeatured:false,deliveryDays:2,seller:'FitZone BD',location:'Dhaka',createdAt:'2025-02-07T10:00:00Z'},
]

function daysAgo(n) {
  const d = new Date(); d.setDate(d.getDate() - n); return d.toISOString()
}
const SEED_ORDERS = [
  { id:'SB-240001',customer:{name:'Rahim Uddin',email:'rahim.uddin@gmail.com',phone:'01711-234567',address:'House 12, Road 5, Dhanmondi, Dhaka'},items:[{productId:'1',name:'Samsung Galaxy A55 5G',quantity:1,price:39999}],subtotal:39999,shipping:80,total:40079,status:'delivered',paymentMethod:'bkash',paymentStatus:'paid',notes:'',trackingNumber:'SA-TRK-78234',createdAt:daysAgo(5),updatedAt:daysAgo(3)},
  { id:'SB-240002',customer:{name:'Fatema Begum',email:'fatema.b@yahoo.com',phone:'01812-345678',address:'Apt 4B, Bashundhara R/A, Dhaka'},items:[{productId:'4',name:'Jamdani Muslin Saree',quantity:2,price:7200}],subtotal:14400,shipping:120,total:14520,status:'shipped',paymentMethod:'cod',paymentStatus:'pending',notes:'',trackingNumber:'SA-TRK-78299',createdAt:daysAgo(3),updatedAt:daysAgo(2)},
  { id:'SB-240003',customer:{name:'Karim Hossain',email:'k.hossain@outlook.com',phone:'01955-456789',address:'Narsingdi'},items:[{productId:'7',name:'PRAN Mango Juice 1L',quantity:12,price:99},{productId:'11',name:'RFL Pressure Cooker 5L',quantity:1,price:1799}],subtotal:2987,shipping:150,total:3137,status:'processing',paymentMethod:'nagad',paymentStatus:'paid',notes:'',trackingNumber:'',createdAt:daysAgo(1),updatedAt:daysAgo(1)},
  { id:'SB-240004',customer:{name:'Sumaiya Akter',email:'sumaiya.akter@gmail.com',phone:'01676-567890',address:'Chittagong'},items:[{productId:'8',name:'Lenovo IdeaPad Slim 5',quantity:1,price:84999}],subtotal:84999,shipping:200,total:85199,status:'pending',paymentMethod:'bkash',paymentStatus:'paid',notes:'',trackingNumber:'',createdAt:daysAgo(0),updatedAt:daysAgo(0)},
  { id:'SB-240005',customer:{name:'Nasir Ahmed',email:'nasir.a@proton.me',phone:'01517-678901',address:'Mirpur, Dhaka'},items:[{productId:'2',name:'Nike Air Max 2027',quantity:1,price:9499},{productId:'9',name:'Aarong Cotton Kurta',quantity:3,price:2800}],subtotal:17899,shipping:80,total:17979,status:'delivered',paymentMethod:'rocket',paymentStatus:'paid',notes:'',trackingNumber:'SA-TRK-77891',createdAt:daysAgo(4),updatedAt:daysAgo(2)},
]

const SEED_ADMINS = [
  { id:'admin-1', email:'admin@sellbazar.com',   password:'Admin@1234',  role:'superadmin', name:'Super Admin',   active:true },
  { id:'admin-2', email:'manager@sellbazar.com', password:'Manager@123', role:'admin',      name:'Store Manager', active:true },
]

// ──────────────────────────────────────────────────────────────────────────────
// KV-backed data accessors — Products
// ──────────────────────────────────────────────────────────────────────────────

async function getAllProducts() {
  const deleted    = KV_ENABLED ? (await kvGet('sb:deleted_slugs') ?? []) : [..._mem.deletedSlugs]
  const deletedSet = new Set(deleted)
  let merged       = SEED_PRODUCTS.filter(p => !deletedSet.has(p.slug))

  const dynamicSlugs = KV_ENABLED
    ? (await kvGet('sb:product_ids') ?? [])
    : _mem.dynamicProducts.map(p => p.slug)

  const dynamics = await Promise.all(
    dynamicSlugs.map(slug =>
      KV_ENABLED
        ? kvGet(`sb:product:${slug}`)
        : Promise.resolve(_mem.dynamicProducts.find(p => p.slug === slug))
    )
  )

  for (const dp of dynamics) {
    if (!dp) continue
    const idx = merged.findIndex(p => p.slug === dp.slug || p.id === dp.id)
    if (idx !== -1) merged[idx] = dp   // override seed entry (edit)
    else merged.unshift(dp)            // new product → front
  }
  return merged
}

async function saveDynamicProduct(p) {
  if (KV_ENABLED) {
    await kvSet(`sb:product:${p.slug}`, p)
    const ids = (await kvGet('sb:product_ids')) ?? []
    if (!ids.includes(p.slug)) { ids.unshift(p.slug); await kvSet('sb:product_ids', ids) }
  } else {
    const idx = _mem.dynamicProducts.findIndex(x => x.slug === p.slug || x.id === p.id)
    if (idx !== -1) _mem.dynamicProducts[idx] = p; else _mem.dynamicProducts.unshift(p)
  }
}

async function markProductDeleted(slug) {
  if (KV_ENABLED) {
    const ids = (await kvGet('sb:product_ids')) ?? []
    await kvSet('sb:product_ids', ids.filter(s => s !== slug))
    await kvDel(`sb:product:${slug}`)
    if (SEED_PRODUCTS.find(p => p.slug === slug)) {
      const del = (await kvGet('sb:deleted_slugs')) ?? []
      if (!del.includes(slug)) { del.push(slug); await kvSet('sb:deleted_slugs', del) }
    }
  } else {
    _mem.deletedSlugs.add(slug)
    const idx = _mem.dynamicProducts.findIndex(p => p.slug === slug)
    if (idx !== -1) _mem.dynamicProducts.splice(idx, 1)
  }
}

// ──────────────────────────────────────────────────────────────────────────────
// KV-backed data accessors — Orders
// ──────────────────────────────────────────────────────────────────────────────

async function getAllOrders() {
  if (KV_ENABLED) {
    const ids = (await kvGet('sb:order_ids')) ?? null
    // First time: no orders in KV yet — seed them in
    if (ids === null) {
      await seedOrdersToKV()
      return [...SEED_ORDERS]
    }
    const orders = await Promise.all(ids.map(id => kvGet(`sb:order:${id}`)))
    return orders.filter(Boolean)
  }
  // In-memory fallback: seed once
  if (_mem.dynamicOrders.length === 0) {
    _mem.dynamicOrders.push(...SEED_ORDERS.map(o => ({ ...o })))
  }
  return [..._mem.dynamicOrders]
}

async function seedOrdersToKV() {
  const ids = SEED_ORDERS.map(o => o.id)
  await kvSet('sb:order_ids', ids)
  await Promise.all(SEED_ORDERS.map(o => kvSet(`sb:order:${o.id}`, o)))
}

async function saveOrder(order) {
  if (KV_ENABLED) {
    await kvSet(`sb:order:${order.id}`, order)
    const ids = (await kvGet('sb:order_ids')) ?? []
    if (!ids.includes(order.id)) { ids.unshift(order.id); await kvSet('sb:order_ids', ids) }
  } else {
    const idx = _mem.dynamicOrders.findIndex(o => o.id === order.id)
    if (idx !== -1) _mem.dynamicOrders[idx] = order; else _mem.dynamicOrders.unshift(order)
  }
}

async function deleteOrder(id) {
  if (KV_ENABLED) {
    const ids = (await kvGet('sb:order_ids')) ?? []
    await kvSet('sb:order_ids', ids.filter(i => i !== id))
    await kvDel(`sb:order:${id}`)
  } else {
    const idx = _mem.dynamicOrders.findIndex(o => o.id === id)
    if (idx !== -1) _mem.dynamicOrders.splice(idx, 1)
  }
}

// ──────────────────────────────────────────────────────────────────────────────
// KV-backed data accessors — Categories
// ──────────────────────────────────────────────────────────────────────────────

async function getCategories() {
  if (KV_ENABLED) {
    const cats = await kvGet('sb:categories')
    return cats ?? SEED_CATEGORIES
  }
  return _mem.categories ?? SEED_CATEGORIES
}

async function saveCategories(cats) {
  if (KV_ENABLED) await kvSet('sb:categories', cats)
  else _mem.categories = cats
}

// ──────────────────────────────────────────────────────────────────────────────
// KV-backed data accessors — Admins
// ──────────────────────────────────────────────────────────────────────────────

async function getAdmins() {
  if (KV_ENABLED) {
    const admins = await kvGet('sb:admins')
    return admins ?? SEED_ADMINS
  }
  return _mem.admins ?? SEED_ADMINS
}

async function saveAdmins(admins) {
  if (KV_ENABLED) await kvSet('sb:admins', admins)
  else _mem.admins = admins
}

// ──────────────────────────────────────────────────────────────────────────────
// ──────────────────────────────────────────────────────────────────────────────
// KV-backed data accessors — Users
// ──────────────────────────────────────────────────────────────────────────────
// KV key schema:
//   "sb:user:<id>"   → single user JSON (password included — never expose)
//   "sb:user_ids"    → JSON array of user ids
//   "sb:user_email:<email>" → user id (for fast email lookup)
//   "sb:user_phone:<phone>" → user id (for fast phone lookup)

async function getAllUsers() {
  if (KV_ENABLED) {
    const ids = (await kvGet('sb:user_ids')) ?? []
    const users = await Promise.all(ids.map(id => kvGet(`sb:user:${id}`)))
    return users.filter(Boolean)
  }
  return _mem.users
}

// ──────────────────────────────────────────────────────────────────────────────
// Phone normalization helpers
// ──────────────────────────────────────────────────────────────────────────────

/** Strip to digits only */
function digitsOnly(phone) { return (phone || '').replace(/\D/g, '') }

/** Canonical form: always +8801XXXXXXXXX */
function canonicalPhone(phone) {
  const d = digitsOnly(phone)
  if (d.startsWith('880'))  return '+' + d          // 8801648718101 → +8801648718101
  if (d.startsWith('0'))    return '+880' + d.slice(1) // 01648718101  → +8801648718101
  if (d.length === 10)      return '+880' + d          // 1648718101   → +8801648718101
  return '+880' + d
}

/** Return every plausible format a phone might have been stored as */
function normalizePhoneVariants(phone) {
  const d   = digitsOnly(phone)
  const set = new Set()
  set.add(phone)                                     // exact as sent
  set.add('+' + d)                                   // +88001648718101 or +8801648718101
  set.add(d)                                         // digits only
  if (d.startsWith('880'))  { set.add('+' + d); set.add('0' + d.slice(3)) }   // +880..., 0...
  if (d.startsWith('00880')) set.add('+' + d.slice(2))                        // 00880...
  if (d.startsWith('0'))    set.add('+880' + d.slice(1))                      // 0... → +880...
  set.add('+880' + d.slice(-10))   // last 10 digits with +880
  set.add('0'    + d.slice(-10))   // last 10 digits with 0
  return [...set]
}

async function findUserByEmail(email) {
  if (KV_ENABLED) {
    const id = await kvGet(`sb:user_email:${email.toLowerCase()}`)
    if (!id) return null
    return kvGet(`sb:user:${id}`)
  }
  return _mem.users.find(u => u.email?.toLowerCase() === email.toLowerCase()) ?? null
}

async function findUserByPhone(phone) {
  if (KV_ENABLED) {
    // Try the exact phone string first, then common format variants
    const variants = normalizePhoneVariants(phone)
    for (const v of variants) {
      const id = await kvGet('sb:user_phone:' + v)
      if (id) return kvGet('sb:user:' + id)
    }
    return null
  }
  // In-memory: normalize both sides for comparison
  const norm = canonicalPhone(phone)
  return _mem.users.find(u => canonicalPhone(u.phone) === norm) ?? null
}

async function saveUser(user) {
  if (KV_ENABLED) {
    await kvSet(`sb:user:${user.id}`, user)
    const ids = (await kvGet('sb:user_ids')) ?? []
    if (!ids.includes(user.id)) { ids.push(user.id); await kvSet('sb:user_ids', ids) }
    if (user.email) await kvSet(`sb:user_email:${user.email.toLowerCase()}`, user.id)
    // Store canonical phone key + all common variants as aliases so any format can find this user
    if (user.phone) {
      for (const v of normalizePhoneVariants(user.phone)) {
        await kvSet('sb:user_phone:' + v, user.id)
      }
    }
  } else {
    const idx = _mem.users.findIndex(u => u.id === user.id)
    if (idx !== -1) _mem.users[idx] = user; else _mem.users.push(user)
  }
}

// ──────────────────────────────────────────────────────────────────────────────
// Middleware
// ──────────────────────────────────────────────────────────────────────────────

const userCarts  = {}
const userWishlists = {}

function requireAdmin(req, res, next) {
  const h = req.headers.authorization
  if (!h || !h.startsWith('Bearer ')) return res.status(401).json({ error: 'No token provided' })
  try {
    const p = jwt.verify(h.slice(7), JWT_SECRET)
    if (p.role !== 'admin' && p.role !== 'superadmin' && p.role !== 'manager' && p.role !== 'editor')
      return res.status(403).json({ error: 'Admin access required' })
    req.admin = p
    next()
  } catch { return res.status(401).json({ error: 'Invalid or expired token' }) }
}

function requireSuperAdmin(req, res, next) {
  const h = req.headers.authorization
  if (!h || !h.startsWith('Bearer ')) return res.status(401).json({ error: 'No token provided' })
  try {
    const p = jwt.verify(h.slice(7), JWT_SECRET)
    if (p.role !== 'superadmin') return res.status(403).json({ error: 'Superadmin access required' })
    req.admin = p
    next()
  } catch { return res.status(401).json({ error: 'Invalid or expired token' }) }
}

// Disable Vercel edge caching for all API routes
app.use('/api', (_, res, next) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
  res.setHeader('Pragma', 'no-cache')
  res.setHeader('Surrogate-Control', 'no-store')
  next()
})

// ──────────────────────────────────────────────────────────────────────────────
// HEALTH
// ──────────────────────────────────────────────────────────────────────────────

app.get('/api/health', async (_, res) => {
  let redisOk = false
  if (KV_ENABLED) {
    try {
      await kvSet('sb:healthcheck', Date.now())
      const v = await kvGet('sb:healthcheck')
      redisOk = v !== null
    } catch { redisOk = false }
  }
  res.json({
    status: 'ok',
    service: 'SellBazar API',
    time: new Date().toISOString(),
    redis: KV_ENABLED ? (redisOk ? 'connected' : 'error') : 'not configured (in-memory mode)',
  })
})

// ──────────────────────────────────────────────────────────────────────────────
// AUTH (public users)
// ──────────────────────────────────────────────────────────────────────────────

app.post('/api/auth/login', async (req, res) => {
  const { phone, email, password } = req.body
  if ((!phone && !email) || !password)
    return res.status(400).json({ error: 'Phone/email and password are required' })

  // Look up user by phone or email
  let user = null
  if (phone)  user = await findUserByPhone(phone)
  if (!user && email) user = await findUserByEmail(email)

  // Strict check — no pass-through, no guest, no demo user
  if (!user)
    return res.status(401).json({ error: 'No account found with that phone number. Please register first.' })
  if (user.password !== password)
    return res.status(401).json({ error: 'Incorrect password. Please try again.' })

  // Issue a real signed JWT (same secret as admin, different role)
  const token = jwt.sign(
    { id: user.id, email: user.email, phone: user.phone, role: 'user' },
    JWT_SECRET,
    { expiresIn: '30d' }
  )
  const { password: _p, ...safe } = user
  res.json({ user: safe, token })
})

app.post('/api/auth/register', async (req, res) => {
  const { name, phone, email, division, password } = req.body
  if (!name || !phone || !email || !password)
    return res.status(400).json({ error: 'All fields are required' })
  if (password.length < 6)
    return res.status(400).json({ error: 'Password must be at least 6 characters' })

  // Check uniqueness
  const byEmail = await findUserByEmail(email)
  if (byEmail) return res.status(409).json({ field: 'email', error: 'Email already registered' })
  const byPhone = await findUserByPhone(phone)
  if (byPhone) return res.status(409).json({ field: 'phone', error: 'Phone number already registered' })

  const u = {
    id:        Date.now().toString(),
    name:      name.trim(),
    email:     email.toLowerCase().trim(),
    phone:     phone.trim(),
    division:  division ?? 'Dhaka',
    password,                        // plain-text for now (same as admin accounts)
    createdAt: new Date().toISOString(),
  }
  await saveUser(u)

  const token = jwt.sign(
    { id: u.id, email: u.email, phone: u.phone, role: 'user' },
    JWT_SECRET,
    { expiresIn: '30d' }
  )
  const { password: _p, ...safe } = u
  res.json({ user: safe, token })
})

app.post('/api/auth/check', async (req, res) => {
  const { email, phone } = req.body
  if (email) {
    const found = await findUserByEmail(email)
    if (found) return res.status(409).json({ field: 'email', error: 'Email already registered' })
  }
  if (phone) {
    const found = await findUserByPhone(phone)
    if (found) return res.status(409).json({ field: 'phone', error: 'Phone already registered' })
  }
  res.json({ available: true })
})

// ──────────────────────────────────────────────────────────────────────────────
// ADMIN AUTH
// ──────────────────────────────────────────────────────────────────────────────

app.post('/api/admin/login', async (req, res) => {
  const { email, password } = req.body
  const admins = await getAdmins()
  const admin  = admins.find(a => a.email === email && a.password === password)
  if (!admin) return res.status(401).json({ error: 'Invalid credentials' })
  if (admin.active === false) return res.status(403).json({ error: 'Account is disabled. Contact your superadmin.' })
  const token = jwt.sign({ id: admin.id, email: admin.email, role: admin.role }, JWT_SECRET, { expiresIn: '24h' })
  res.json({ token, admin: { id: admin.id, email: admin.email, role: admin.role, name: admin.name } })
})

app.get('/api/admin/me', requireAdmin, (req, res) => res.json({ admin: req.admin }))
app.post('/api/admin/logout', requireAdmin, (_, res) => res.json({ message: 'Logged out' }))

// ──────────────────────────────────────────────────────────────────────────────
// PRODUCTS
// ──────────────────────────────────────────────────────────────────────────────

app.get('/api/products', async (req, res) => {
  const { category, subcategory, q, limit, featured, sortBy, order } = req.query
  let r = await getAllProducts()
  if (category && category !== 'All') r = r.filter(p => p.category === category)
  if (subcategory && subcategory !== 'All') r = r.filter(p => p.subcategory === subcategory)
  if (q) r = r.filter(p =>
    p.name.toLowerCase().includes(q.toLowerCase()) ||
    (p.brand && p.brand.toLowerCase().includes(q.toLowerCase()))
  )
  if (featured === 'true') r = r.filter(p => p.isFeatured)
  if (sortBy) {
    const dir = order === 'desc' ? -1 : 1
    r.sort((a, b) => a[sortBy] < b[sortBy] ? -dir : a[sortBy] > b[sortBy] ? dir : 0)
  }
  if (limit) r = r.slice(0, parseInt(limit))
  res.json({ data: r, total: r.length })
})

app.get('/api/products/:slug', async (req, res) => {
  const { slug } = req.params
  // 1. Check dynamic/edited products in KV first (they override seeds)
  if (KV_ENABLED) {
    const kp = await kvGet(`sb:product:${slug}`)
    if (kp) return res.json(kp)
    // Also search all dynamic product IDs in case slug is actually an id
    const ids = (await kvGet('sb:product_ids')) ?? []
    const byId = await Promise.all(ids.map(s => kvGet(`sb:product:${s}`)))
    const found = byId.find(p => p && (p.id === slug || p.slug === slug))
    if (found) return res.json(found)
  } else {
    const mp = _mem.dynamicProducts.find(p => p.slug === slug || p.id === slug)
    if (mp) return res.json(mp)
  }
  // 2. Check deleted seeds — if deleted, 404
  const deleted = KV_ENABLED ? (await kvGet('sb:deleted_slugs') ?? []) : [..._mem.deletedSlugs]
  if (deleted.includes(slug)) return res.status(404).json({ error: 'Product not found' })
  // 3. Fall back to seed data
  const p = SEED_PRODUCTS.find(p => p.slug === slug || p.id === slug)
  if (!p) return res.status(404).json({ error: 'Product not found' })
  res.json(p)
})

app.post('/api/products', requireAdmin, async (req, res) => {
  function makeSlug(name) {
    return name.toLowerCase().replace(/[^\w\s-]/g,'').trim().replace(/\s+/g,'-').replace(/-+/g,'-').substring(0,80)
  }
  const id = Date.now().toString()
  const allNow = await getAllProducts()
  const baseSlug = req.body.slug || makeSlug(req.body.name || id)
  let slug = baseSlug, suffix = 1
  while (allNow.find(p => p.slug === slug)) { slug = `${baseSlug}-${suffix++}` }
  const p = { id, ...req.body, slug, createdAt: new Date().toISOString() }
  await saveDynamicProduct(p)
  res.status(201).json(p)
})

app.put('/api/products/:id', requireAdmin, async (req, res) => {
  const allNow  = await getAllProducts()
  const existing = allNow.find(p => p.id === req.params.id || p.slug === req.params.id)
  if (!existing) return res.status(404).json({ error: 'Product not found' })
  const updated = { ...existing, ...req.body, id: existing.id, slug: existing.slug }
  await saveDynamicProduct(updated)
  res.json(updated)
})

app.delete('/api/products/:id', requireAdmin, async (req, res) => {
  const allNow  = await getAllProducts()
  const existing = allNow.find(p => p.id === req.params.id || p.slug === req.params.id)
  if (!existing) return res.status(404).json({ error: 'Product not found' })
  await markProductDeleted(existing.slug)
  res.json({ message: 'Deleted', id: existing.id })
})

// ──────────────────────────────────────────────────────────────────────────────
// CATEGORIES
// ──────────────────────────────────────────────────────────────────────────────

app.get('/api/categories', async (_, res) => {
  const cats       = await getCategories()
  const allProducts = await getAllProducts()
  const data = cats.map(c => ({
    ...c,
    productCount: allProducts.filter(p => p.category === c.name).length,
    subcategories: c.subcategories.map(s => ({
      ...s,
      productCount: allProducts.filter(p => p.subcategory === s.slug).length,
    })),
  }))
  res.json({ data, total: data.length })
})

app.post('/api/categories', requireAdmin, async (req, res) => {
  const cats = await getCategories()
  const { name, nameBn, slug, icon, color } = req.body
  if (!name || !slug) return res.status(400).json({ error: 'name and slug required' })
  if (cats.find(c => c.slug === slug)) return res.status(409).json({ error: 'Slug already exists' })
  const c = { id:'c'+Date.now(), slug, name, nameBn:nameBn||name, icon:icon||'tag', color:color||'#6b7280', subcategories:[] }
  cats.push(c)
  await saveCategories(cats)
  res.status(201).json(c)
})

app.get('/api/categories/:slug', async (req, res) => {
  const cats = await getCategories()
  const allProducts = await getAllProducts()
  const c = cats.find(c => c.slug === req.params.slug)
  if (!c) return res.status(404).json({ error: 'Category not found' })
  res.json({
    ...c,
    productCount: allProducts.filter(p => p.category === c.name).length,
    subcategories: c.subcategories.map(s => ({ ...s, productCount: allProducts.filter(p => p.subcategory === s.slug).length })),
  })
})

app.put('/api/categories/:slug', requireAdmin, async (req, res) => {
  const cats = await getCategories()
  const idx  = cats.findIndex(c => c.slug === req.params.slug)
  if (idx === -1) return res.status(404).json({ error: 'Category not found' })
  cats[idx] = { ...cats[idx], ...req.body, id: cats[idx].id, subcategories: cats[idx].subcategories }
  await saveCategories(cats)
  res.json(cats[idx])
})

app.delete('/api/categories/:slug', requireAdmin, async (req, res) => {
  const cats = await getCategories()
  const idx  = cats.findIndex(c => c.slug === req.params.slug)
  if (idx === -1) return res.status(404).json({ error: 'Category not found' })
  const [d] = cats.splice(idx, 1)
  await saveCategories(cats)
  res.json({ message: 'Deleted', slug: d.slug })
})

// Subcategory routes
app.post('/api/categories/:slug/subcategories', requireAdmin, async (req, res) => {
  const cats = await getCategories()
  const cat  = cats.find(c => c.slug === req.params.slug)
  if (!cat) return res.status(404).json({ error: 'Category not found' })
  const { name, nameBn, slug, icon } = req.body
  if (!name || !slug) return res.status(400).json({ error: 'name and slug required' })
  if (cat.subcategories.find(s => s.slug === slug)) return res.status(409).json({ error: 'Subcategory slug already exists' })
  const sub = { id:'s'+Date.now(), slug, name, nameBn:nameBn||name, icon:icon||'tag' }
  cat.subcategories.push(sub)
  await saveCategories(cats)
  res.status(201).json(sub)
})

app.put('/api/categories/:slug/subcategories/:subSlug', requireAdmin, async (req, res) => {
  const cats = await getCategories()
  const cat  = cats.find(c => c.slug === req.params.slug)
  if (!cat) return res.status(404).json({ error: 'Category not found' })
  const idx  = cat.subcategories.findIndex(s => s.slug === req.params.subSlug)
  if (idx === -1) return res.status(404).json({ error: 'Subcategory not found' })
  cat.subcategories[idx] = { ...cat.subcategories[idx], ...req.body, id: cat.subcategories[idx].id }
  await saveCategories(cats)
  res.json(cat.subcategories[idx])
})

app.delete('/api/categories/:slug/subcategories/:subSlug', requireAdmin, async (req, res) => {
  const cats = await getCategories()
  const cat  = cats.find(c => c.slug === req.params.slug)
  if (!cat) return res.status(404).json({ error: 'Category not found' })
  const idx  = cat.subcategories.findIndex(s => s.slug === req.params.subSlug)
  if (idx === -1) return res.status(404).json({ error: 'Subcategory not found' })
  const [d] = cat.subcategories.splice(idx, 1)
  await saveCategories(cats)
  res.json({ message: 'Deleted', slug: d.slug })
})

// ──────────────────────────────────────────────────────────────────────────────
// ORDERS
// ──────────────────────────────────────────────────────────────────────────────

app.get('/api/orders/by-id/:id', async (req, res) => {
  const orders = await getAllOrders()
  const o = orders.find(o => o.id === req.params.id)
  if (!o) return res.status(404).json({ error: 'Order not found' })
  res.json(o)
})

// Public: get orders by customer email (for profile "My Reviews" pending list)
app.get('/api/orders/by-email', async (req, res) => {
  const email = req.query.email
  if (!email) return res.status(400).json({ error: 'email query param required' })
  const orders = await getAllOrders()
  const data = orders
    .filter(o => o.customer?.email?.toLowerCase() === email.toLowerCase())
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
  res.json({ data, total: data.length })
})

app.get('/api/orders', requireAdmin, async (req, res) => {
  let r = await getAllOrders()
  if (req.query.status && req.query.status !== 'all') r = r.filter(o => o.status === req.query.status)
  r.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
  res.json({ data: r, total: r.length })
})

app.post('/api/orders', async (req, res) => {
  const { customer, items, subtotal, shipping, total, paymentMethod } = req.body
  if (!customer || !items || !items.length || !total)
    return res.status(400).json({ error: 'customer, items and total required' })
  const o = {
    id: 'SB-' + Date.now(),
    customer, items,
    subtotal: Number(subtotal || total),
    shipping: Number(shipping || 0),
    total: Number(total),
    status: 'pending',
    paymentMethod: paymentMethod || 'cod',
    paymentStatus: 'pending',
    notes: req.body.notes || '',
    trackingNumber: '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
  await saveOrder(o)
  res.status(201).json(o)
})

app.put('/api/orders/:id', requireAdmin, async (req, res) => {
  const orders  = await getAllOrders()
  const existing = orders.find(o => o.id === req.params.id)
  if (!existing) return res.status(404).json({ error: 'Order not found' })
  const updated = { ...existing, ...req.body, id: existing.id, updatedAt: new Date().toISOString() }
  await saveOrder(updated)
  res.json(updated)
})

app.delete('/api/orders/:id', requireAdmin, async (req, res) => {
  const orders  = await getAllOrders()
  const existing = orders.find(o => o.id === req.params.id)
  if (!existing) return res.status(404).json({ error: 'Order not found' })
  await deleteOrder(existing.id)
  res.json({ message: 'Deleted', id: existing.id })
})

// ──────────────────────────────────────────────────────────────────────────────
// REVIEWS
// ──────────────────────────────────────────────────────────────────────────────
// KV key schema:
//   "sb:reviews:<productSlug>" → JSON array of review objects
//
// In-memory fallback
const _reviews = {}

async function getProductReviews(productSlug) {
  if (KV_ENABLED) {
    return (await kvGet(`sb:reviews:${productSlug}`)) ?? []
  }
  return _reviews[productSlug] ?? []
}

async function saveProductReviews(productSlug, reviews) {
  if (KV_ENABLED) {
    await kvSet(`sb:reviews:${productSlug}`, reviews)
  } else {
    _reviews[productSlug] = reviews
  }
}

async function getAllReviews() {
  const allProducts = await getAllProducts()
  const reviewArrays = await Promise.all(
    allProducts.map(async p => {
      const reviews = await getProductReviews(p.slug)
      return reviews.map(r => ({ ...r, productSlug: p.slug, productName: p.name }))
    })
  )
  return reviewArrays.flat()
}

async function recalculateProductRating(productSlug) {
  const reviews = await getProductReviews(productSlug)
  const approved = reviews.filter(r => r.status === 'approved')
  const count = approved.length
  const avg = count > 0
    ? Math.round((approved.reduce((s, r) => s + r.rating, 0) / count) * 10) / 10
    : null
  const allProducts = await getAllProducts()
  const product = allProducts.find(p => p.slug === productSlug)
  if (product) {
    const updated = { ...product,
      rating: avg !== null ? avg : product.rating,
      reviewCount: count
    }
    await saveDynamicProduct(updated)
  }
}

// Public: get approved reviews for a product
app.get('/api/reviews/:productSlug', async (req, res) => {
  const reviews = await getProductReviews(req.params.productSlug)
  const approved = reviews.filter(r => r.status === 'approved')
  approved.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
  res.json({ data: approved, total: approved.length })
})

// Public: check review eligibility (has delivered order + hasn't already reviewed)
app.get('/api/reviews/:productSlug/eligibility', async (req, res) => {
  const { productSlug } = req.params
  const email = req.query.email
  if (!email) return res.status(400).json({ eligible: false, reason: 'email required' })

  const allProducts = await getAllProducts()
  const productData = allProducts.find(p => p.slug === productSlug)
  const productId   = productData?.id

  const allOrders = await getAllOrders()
  const hasPurchased = allOrders.some(o => {
    const emailMatch = o.customer?.email?.toLowerCase() === email.toLowerCase()
    const hasItem    = o.items?.some(i =>
      i.productId === productId ||
      i.productId === productSlug ||
      (i.name && productData?.name && i.name.toLowerCase() === productData.name.toLowerCase())
    )
    return emailMatch && hasItem && o.status === 'delivered'
  })

  if (!hasPurchased)
    return res.json({ eligible: false, reason: 'no_delivered_order' })

  const reviews = await getProductReviews(productSlug)
  const alreadyReviewed = reviews.some(r => r.userEmail?.toLowerCase() === email.toLowerCase())
  if (alreadyReviewed)
    return res.json({ eligible: false, reason: 'already_reviewed' })

  res.json({ eligible: true })
})

// Public: submit a review (only delivered-order customers)
app.post('/api/reviews/:productSlug', async (req, res) => {
  const { productSlug } = req.params
  const { userEmail, userName, userId, rating, title, body, images } = req.body
  if (!userEmail || !rating || !body)
    return res.status(400).json({ error: 'userEmail, rating and body are required' })
  if (rating < 1 || rating > 5)
    return res.status(400).json({ error: 'Rating must be 1–5' })

  const allProducts = await getAllProducts()
  const productData = allProducts.find(p => p.slug === productSlug)
  const productId   = productData?.id

  const allOrders = await getAllOrders()
  const hasPurchased = allOrders.some(o => {
    const emailMatch = o.customer?.email?.toLowerCase() === userEmail.toLowerCase()
    const hasItem    = o.items?.some(i =>
      i.productId === productId ||
      i.productId === productSlug ||
      (i.name && productData?.name && i.name.toLowerCase() === productData.name.toLowerCase())
    )
    return emailMatch && hasItem && o.status === 'delivered'
  })
  if (!hasPurchased)
    return res.status(403).json({ error: 'Only customers who have received this product can review it.' })

  const reviews = await getProductReviews(productSlug)
  if (reviews.some(r => r.userEmail.toLowerCase() === userEmail.toLowerCase()))
    return res.status(409).json({ error: 'You have already reviewed this product.' })

  const review = {
    id:          'rv-' + Date.now(),
    productSlug,
    productName: productData?.name ?? productSlug,
    userId:      userId ?? userEmail,
    userEmail,
    userName:    userName ?? 'Customer',
    rating:      Number(rating),
    title:       title ?? '',
    body,
    images:      Array.isArray(images) ? images.slice(0, 5) : [],
    status:      'approved',
    helpful:     0,
    createdAt:   new Date().toISOString(),
  }
  reviews.push(review)
  await saveProductReviews(productSlug, reviews)
  await recalculateProductRating(productSlug)
  res.status(201).json(review)
})

// User: get own reviews by email
app.get('/api/user/reviews', async (req, res) => {
  const email = req.query.email
  if (!email) return res.status(400).json({ error: 'email query param required' })
  const all = await getAllReviews()
  const userReviews = all
    .filter(r => r.userEmail?.toLowerCase() === email.toLowerCase())
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
  res.json({ data: userReviews, total: userReviews.length })
})

// Public: mark a review helpful
app.post('/api/reviews/:productSlug/:reviewId/helpful', async (req, res) => {
  const reviews = await getProductReviews(req.params.productSlug)
  const review  = reviews.find(r => r.id === req.params.reviewId)
  if (!review) return res.status(404).json({ error: 'Review not found' })
  review.helpful = (review.helpful || 0) + 1
  await saveProductReviews(req.params.productSlug, reviews)
  res.json({ helpful: review.helpful })
})

// Admin: all reviews
app.get('/api/admin/reviews', requireAdmin, async (req, res) => {
  let all = await getAllReviews()
  if (req.query.status && req.query.status !== 'all') all = all.filter(r => r.status === req.query.status)
  if (req.query.productSlug) all = all.filter(r => r.productSlug === req.query.productSlug)
  all.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
  res.json({ data: all, total: all.length })
})

// Admin: update review status / note
app.patch('/api/admin/reviews/:productSlug/:reviewId', requireAdmin, async (req, res) => {
  const reviews = await getProductReviews(req.params.productSlug)
  const review  = reviews.find(r => r.id === req.params.reviewId)
  if (!review) return res.status(404).json({ error: 'Review not found' })
  if (req.body.status    !== undefined) review.status    = req.body.status
  if (req.body.adminNote !== undefined) review.adminNote = req.body.adminNote
  await saveProductReviews(req.params.productSlug, reviews)
  await recalculateProductRating(req.params.productSlug)
  res.json(review)
})

// Admin: delete review
app.delete('/api/admin/reviews/:productSlug/:reviewId', requireAdmin, async (req, res) => {
  const reviews = await getProductReviews(req.params.productSlug)
  const idx     = reviews.findIndex(r => r.id === req.params.reviewId)
  if (idx === -1) return res.status(404).json({ error: 'Review not found' })
  reviews.splice(idx, 1)
  await saveProductReviews(req.params.productSlug, reviews)
  await recalculateProductRating(req.params.productSlug)
  res.json({ message: 'Deleted' })
})

// ──────────────────────────────────────────────────────────────────────────────
// USER DATA (cart & wishlist — session-scoped, no persistence needed)
// ──────────────────────────────────────────────────────────────────────────────

function uid(req) { return req.headers['x-user-id'] || (req.body && req.body.userId) || null }

app.get('/api/user/cart',      (req,res) => { const u=uid(req); if(!u) return res.status(401).json({error:'Unauthorized'}); res.json({cart:userCarts[u]||[]}) })
app.post('/api/user/cart',     (req,res) => { const u=uid(req); if(!u) return res.status(401).json({error:'Unauthorized'}); userCarts[u]=req.body.cart||[]; res.json({ok:true}) })
app.get('/api/user/wishlist',  (req,res) => { const u=uid(req); if(!u) return res.status(401).json({error:'Unauthorized'}); res.json({wishlist:userWishlists[u]||[]}) })
app.post('/api/user/wishlist', (req,res) => { const u=uid(req); if(!u) return res.status(401).json({error:'Unauthorized'}); userWishlists[u]=req.body.wishlist||[]; res.json({ok:true}) })

// ──────────────────────────────────────────────────────────────────────────────
// ADMIN DASHBOARD
// ──────────────────────────────────────────────────────────────────────────────

app.get('/api/admin/dashboard', requireAdmin, async (req, res) => {
  const [allProducts, allOrders, allReviews] = await Promise.all([
    getAllProducts(), getAllOrders(), getAllReviews()
  ])
  const paid = allOrders.filter(o => o.paymentStatus === 'paid')
  const totalRevenue = paid.reduce((s, o) => s + o.total, 0)
  const statusCounts = allOrders.reduce((a, o) => { a[o.status] = (a[o.status] || 0) + 1; return a }, {})
  const catMap = {}
  allProducts.forEach(p => { catMap[p.category] = (catMap[p.category] || 0) + 1 })

  // Revenue over last 7 days
  const now = Date.now()
  const last7Days = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now - i * 86400000)
    const dateStr = d.toISOString().slice(0, 10)
    const dayOrders = allOrders.filter(o => o.createdAt && o.createdAt.slice(0, 10) === dateStr)
    last7Days.push({
      date: dateStr,
      revenue: dayOrders.filter(o => o.paymentStatus === 'paid').reduce((s, o) => s + o.total, 0),
      orders: dayOrders.length,
    })
  }

  // Revenue by status
  const revenueByStatus = ['pending','processing','shipped','delivered','cancelled'].map(status => ({
    status,
    total: allOrders.filter(o => o.status === status).reduce((s, o) => s + o.total, 0),
    count: allOrders.filter(o => o.status === status).length,
  }))

  // This/last month
  const now2 = new Date()
  const thisMonth = now2.getMonth(), thisYear = now2.getFullYear()
  const lastMonth = thisMonth === 0 ? 11 : thisMonth - 1
  const lastYear  = thisMonth === 0 ? thisYear - 1 : thisYear
  const inMonth = (iso, m, y) => { const d = new Date(iso); return d.getMonth() === m && d.getFullYear() === y }
  const thisMonthRevenue = paid.filter(o => inMonth(o.createdAt, thisMonth, thisYear)).reduce((s,o)=>s+o.total,0)
  const lastMonthRevenue = paid.filter(o => inMonth(o.createdAt, lastMonth, lastYear)).reduce((s,o)=>s+o.total,0)
  const revenueGrowth = lastMonthRevenue > 0
    ? Number(((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue * 100).toFixed(1))
    : 0
  const uniqueCustomers = [...new Set(allOrders.map(o => o.customer?.email).filter(Boolean))].length
  const outOfStock = allProducts.filter(p => p.stock === 0).length
  const avgRating = allProducts.length
    ? Math.round(allProducts.reduce((s, p) => s + (p.rating || 0), 0) / allProducts.length * 10) / 10
    : 0

  // Review stats
  const approvedReviews = allReviews.filter(r => r.status === 'approved')
  const pendingReviews  = allReviews.filter(r => r.status === 'pending')
  const reviewAvgRating = approvedReviews.length
    ? Math.round(approvedReviews.reduce((s, r) => s + r.rating, 0) / approvedReviews.length * 10) / 10
    : 0
  const recentReviews = [...allReviews]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 5)

  res.json({
    totalRevenue, thisMonthRevenue, lastMonthRevenue, revenueGrowth,
    totalOrders: allOrders.length,
    totalProducts: allProducts.length,
    lowStockCount: allProducts.filter(p => p.stock < 25).length,
    outOfStock, avgRating, uniqueCustomers,
    statusCounts,
    pendingOrders: (statusCounts.pending || 0) + (statusCounts.processing || 0),
    categoryBreakdown: Object.entries(catMap).map(([name, count]) => ({ name, count })),
    recentOrders: [...allOrders].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5),
    last7Days, revenueByStatus,
    // Reviews
    totalReviews: allReviews.length,
    pendingReviews: pendingReviews.length,
    approvedReviews: approvedReviews.length,
    reviewAvgRating,
    recentReviews,
  })
})

app.get('/api/admin/customers', requireAdmin, async (req, res) => {
  const allOrders = await getAllOrders()
  const map = {}
  allOrders.forEach(o => {
    const e = (o.customer && o.customer.email) || o.id
    if (!map[e]) {
      map[e] = {
        id: e, ...o.customer,
        orderCount: 0, totalSpent: 0, orders: [],
        firstOrder: o.createdAt, lastOrder: o.createdAt,
        paymentMethod: o.paymentMethod || 'cod',
      }
    }
    map[e].orderCount++
    map[e].totalSpent += o.total
    map[e].orders.push(o.id)
    if (o.createdAt < map[e].firstOrder) map[e].firstOrder = o.createdAt
    if (o.createdAt > map[e].lastOrder)  { map[e].lastOrder = o.createdAt; map[e].paymentMethod = o.paymentMethod || map[e].paymentMethod }
  })
  const data = Object.values(map).sort((a, b) => b.totalSpent - a.totalSpent)
  res.json({ data, total: data.length })
})

// ──────────────────────────────────────────────────────────────────────────────
// ADMIN MANAGEMENT (superadmin only)
// ──────────────────────────────────────────────────────────────────────────────

app.get('/api/admin/admins', requireSuperAdmin, async (req, res) => {
  const admins = await getAdmins()
  const data   = admins.map(({ password: _, ...a }) => a)
  res.json({ data, total: data.length })
})

app.post('/api/admin/admins', requireSuperAdmin, async (req, res) => {
  const admins = await getAdmins()
  const { name, email, password, role } = req.body
  if (!name || !email || !password) return res.status(400).json({ error: 'name, email and password are required' })
  const validRoles = ['admin', 'manager', 'editor', 'viewer']
  if (role && !validRoles.includes(role)) return res.status(400).json({ error: 'Invalid role. Use: admin, manager, editor, viewer' })
  if (admins.find(a => a.email === email)) return res.status(409).json({ error: 'Email already in use' })
  if (password.length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters' })
  const a = { id: 'admin-' + Date.now(), name, email, password, role: role || 'admin', active: true, createdAt: new Date().toISOString() }
  admins.push(a)
  await saveAdmins(admins)
  const { password: _, ...safe } = a
  res.status(201).json(safe)
})

app.put('/api/admin/admins/:id', requireSuperAdmin, async (req, res) => {
  const admins = await getAdmins()
  const idx    = admins.findIndex(a => a.id === req.params.id)
  if (idx === -1) return res.status(404).json({ error: 'Admin not found' })
  const target = admins[idx]
  if (target.id === 'admin-1' && req.body.role && req.body.role !== 'superadmin')
    return res.status(403).json({ error: 'Cannot change the primary superadmin role' })
  const validRoles = ['superadmin', 'admin', 'manager', 'editor', 'viewer']
  if (req.body.role && !validRoles.includes(req.body.role))
    return res.status(400).json({ error: 'Invalid role' })
  ;['name', 'role', 'active'].forEach(k => { if (req.body[k] !== undefined) target[k] = req.body[k] })
  if (req.body.password) {
    if (req.body.password.length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters' })
    target.password = req.body.password
  }
  await saveAdmins(admins)
  const { password: _, ...safe } = target
  res.json(safe)
})

app.delete('/api/admin/admins/:id', requireSuperAdmin, async (req, res) => {
  if (req.params.id === 'admin-1') return res.status(403).json({ error: 'Cannot delete the primary superadmin' })
  if (req.params.id === req.admin.id) return res.status(403).json({ error: 'Cannot delete your own account' })
  const admins = await getAdmins()
  const idx    = admins.findIndex(a => a.id === req.params.id)
  if (idx === -1) return res.status(404).json({ error: 'Admin not found' })
  const [d] = admins.splice(idx, 1)
  await saveAdmins(admins)
  res.json({ message: 'Admin deleted', id: d.id })
})

app.post('/api/admin/admins/:id/reset-password', requireSuperAdmin, async (req, res) => {
  const { newPassword } = req.body
  if (!newPassword || newPassword.length < 8) return res.status(400).json({ error: 'New password must be at least 8 characters' })
  const admins = await getAdmins()
  const a      = admins.find(a => a.id === req.params.id)
  if (!a) return res.status(404).json({ error: 'Admin not found' })
  a.password = newPassword
  await saveAdmins(admins)
  res.json({ message: 'Password updated successfully' })
})

// ──────────────────────────────────────────────────────────────────────────────
// SERVER-SENT EVENTS — live data stream
// ──────────────────────────────────────────────────────────────────────────────
// Vercel serverless functions don't support persistent SSE connections, so we
// send ONE snapshot event and close. The client reconnects every 30s naturally
// via the browser's built-in EventSource reconnect behaviour.
// In a real Node server (local dev with the server/ package) this stays open.

app.get('/api/events', async (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache, no-transform')
  res.setHeader('X-Accel-Buffering', 'no')
  res.setHeader('Connection', 'keep-alive')
  res.flushHeaders()

  try {
    const [allProducts, allOrders] = await Promise.all([getAllProducts(), getAllOrders()])
    const snapshot = JSON.stringify({ products: allProducts, orders: allOrders })
    res.write(`event: snapshot\ndata: ${snapshot}\n\n`)
    // Also send as orders_updated + products_updated so both SSE handlers fire
    res.write(`event: orders_updated\ndata: ${JSON.stringify(allOrders)}\n\n`)
    res.write(`event: products_updated\ndata: ${JSON.stringify(allProducts)}\n\n`)
  } catch (e) {
    res.write(`event: error\ndata: ${JSON.stringify({ message: e.message })}\n\n`)
  }

  // Keep alive for 25s then close (Vercel has a 30s function timeout)
  // The client's EventSource will auto-reconnect with a 3s delay
  const heartbeat = setInterval(() => {
    try { res.write(': heartbeat\n\n') } catch { clearInterval(heartbeat) }
  }, 5000)

  req.on('close', () => {
    clearInterval(heartbeat)
    res.end()
  })

  // Serverless safety: close after 25s
  setTimeout(() => {
    clearInterval(heartbeat)
    try { res.write(': end\n\n'); res.end() } catch {}
  }, 25000)
})

// Public: upload review image via ImgBB (no auth required)
app.post('/api/upload/imgbb', async (req, res) => {
  const { base64, name } = req.body
  const apiKey = process.env.IMGBB_API_KEY
  if (!apiKey) return res.status(503).json({ error: 'Image upload not configured (IMGBB_API_KEY missing)' })
  if (!base64) return res.status(400).json({ error: 'base64 image data required' })
  try {
    const form = new URLSearchParams()
    form.append('key', apiKey)
    form.append('image', base64)
    if (name) form.append('name', name)
    const imgRes = await fetch('https://api.imgbb.com/1/upload', {
      method: 'POST',
      body: form,
    })
    const data = await imgRes.json()
    if (!data.success) return res.status(500).json({ error: data.error?.message ?? 'ImgBB upload failed' })
    res.json({ url: data.data.url, deleteUrl: data.data.delete_url })
  } catch (e) {
    res.status(500).json({ error: e.message ?? 'Upload failed' })
  }
})

// ──────────────────────────────────────────────────────────────────────────────
// IMAGE UPLOAD
// ──────────────────────────────────────────────────────────────────────────────
// Vercel serverless has no persistent disk.  Images should be uploaded to ImgBB
// client-side (handled in useAdminApi.ts).  This endpoint echoes back a dataUrl
// if posted in JSON for backwards compatibility.

app.post('/api/admin/upload', requireAdmin, (req, res) => {
  const dataUrl = req.body && req.body.dataUrl
  if (dataUrl && typeof dataUrl === 'string' && dataUrl.startsWith('data:image/')) {
    return res.json({ url: dataUrl, filename: req.body.filename || 'image', message: 'ok' })
  }
  res.status(422).json({ url: '', filename: '', message: 'Serverless environment has no persistent storage. Convert images to Base64 on the client instead.' })
})

// ──────────────────────────────────────────────────────────────────────────────
// BANNERS
// ──────────────────────────────────────────────────────────────────────────────
// KV key: "sb:banners" → JSON array of banner objects

async function getBanners() {
  if (KV_ENABLED) return (await kvGet('sb:banners')) ?? []
  return _mem.banners ?? []
}

async function saveBanners(banners) {
  if (KV_ENABLED) await kvSet('sb:banners', banners)
  else _mem.banners = banners
}

// Public: GET /api/banners — sorted by order
app.get('/api/banners', async (_, res) => {
  try {
    const banners = await getBanners()
    res.json(banners.slice().sort((a, b) => a.order - b.order))
  } catch (e) { res.status(500).json({ error: 'Failed to fetch banners' }) }
})

// Admin: GET /api/banners/all
app.get('/api/banners/all', requireAdmin, async (_, res) => {
  try {
    const banners = await getBanners()
    res.json(banners.slice().sort((a, b) => a.order - b.order))
  } catch (e) { res.status(500).json({ error: 'Failed to fetch banners' }) }
})

// Admin: POST /api/banners — create
app.post('/api/banners', requireAdmin, async (req, res) => {
  try {
    const { tag, title, subtitle, cta, link, image, active, order } = req.body
    if (!title || !image) return res.status(400).json({ error: 'title and image are required' })
    const banners = await getBanners()
    const crypto  = require('crypto')
    const banner  = {
      id:       crypto.randomBytes(8).toString('hex'),
      tag:      tag      ?? '',
      title:    title.trim(),
      subtitle: subtitle ?? '',
      cta:      cta      ?? 'Shop Now',
      link:     link     ?? '/',
      image:    image.trim(),
      active:   active   ?? true,
      order:    typeof order === 'number' ? order : banners.length,
    }
    banners.push(banner)
    await saveBanners(banners)
    res.status(201).json(banner)
  } catch (e) { res.status(500).json({ error: 'Failed to create banner' }) }
})

// Admin: PUT /api/banners/reorder — bulk reorder (must be before /:id)
app.put('/api/banners/reorder', requireAdmin, async (req, res) => {
  try {
    const updates = req.body
    if (!Array.isArray(updates)) return res.status(400).json({ error: 'Expected array of { id, order }' })
    const banners = await getBanners()
    const map = new Map(updates.map(u => [u.id, u.order]))
    for (const b of banners) { if (map.has(b.id)) b.order = map.get(b.id) }
    banners.sort((a, b) => a.order - b.order)
    await saveBanners(banners)
    res.json(banners)
  } catch (e) { res.status(500).json({ error: 'Failed to reorder banners' }) }
})

// Admin: PUT /api/banners/:id — update
app.put('/api/banners/:id', requireAdmin, async (req, res) => {
  try {
    const banners = await getBanners()
    const idx = banners.findIndex(b => b.id === req.params.id)
    if (idx === -1) return res.status(404).json({ error: 'Banner not found' })
    banners[idx] = { ...banners[idx], ...req.body, id: req.params.id }
    await saveBanners(banners)
    res.json(banners[idx])
  } catch (e) { res.status(500).json({ error: 'Failed to update banner' }) }
})

// Admin: DELETE /api/banners/:id
app.delete('/api/banners/:id', requireAdmin, async (req, res) => {
  try {
    const banners = await getBanners()
    const filtered = banners.filter(b => b.id !== req.params.id)
    if (filtered.length === banners.length) return res.status(404).json({ error: 'Banner not found' })
    await saveBanners(filtered)
    res.json({ success: true })
  } catch (e) { res.status(500).json({ error: 'Failed to delete banner' }) }
})

// ──────────────────────────────────────────────────────────────────────────────
// AUTH DEBUG (temporary — remove after fixing)
// ──────────────────────────────────────────────────────────────────────────────

app.post('/api/auth/login-debug', async (req, res) => {
  const { phone, email } = req.body
  const result = { kvEnabled: KV_ENABLED, queriedPhone: phone, queriedEmail: email }

  // Check all known phone format variants
  if (phone) {
    const variants = [
      phone,
      phone.replace(/\D/g, ''),
      '+880' + phone.replace(/\D/g, ''),
      '0'   + phone.replace(/^.*880/, ''),
    ]
    result.phoneVariants = {}
    for (const v of variants) {
      result.phoneVariants[v] = await kvGet('sb:user_phone:' + v)
    }
  }

  // Dump all user IDs and their stored phone field
  const ids = (await kvGet('sb:user_ids')) ?? []
  result.userCount = ids.length
  result.users = []
  for (const id of ids) {
    const u = await kvGet('sb:user:' + id)
    if (u) result.users.push({ id: u.id, name: u.name, phone: u.phone, email: u.email })
  }

  res.json(result)
})

// ──────────────────────────────────────────────────────────────────────────────
// Export
// ──────────────────────────────────────────────────────────────────────────────

module.exports = app
