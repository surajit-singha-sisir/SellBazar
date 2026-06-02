import express from 'express'
import cors from 'cors'
import jwt from 'jsonwebtoken'

const app = express()
const JWT_SECRET = process.env.JWT_SECRET ?? 'sellbazar-super-secret-key-2025'

const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map((o: string) => o.trim())
  : ['http://localhost:5173','http://localhost:5174','http://localhost:3000','https://sell-bazar.vercel.app']

app.use(cors({
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true)
    callback(new Error(`CORS: origin ${origin} not allowed`))
  },
  credentials: true,
}))
app.use(express.json())

// ── Auth middleware ───────────────────────────────────────────────────────────
function requireAdmin(req: any, res: any, next: any) {
  const h = req.headers.authorization
  if (!h?.startsWith('Bearer ')) return res.status(401).json({ error: 'No token provided' })
  try {
    const p: any = jwt.verify(h.slice(7), JWT_SECRET)
    if (p.role !== 'admin' && p.role !== 'superadmin') return res.status(403).json({ error: 'Admin access required' })
    req.admin = p
    next()
  } catch { return res.status(401).json({ error: 'Invalid or expired token' }) }
}

// ── CATEGORIES data ───────────────────────────────────────────────────────────
const CATEGORIES: any[] = [
  { id:'c1',slug:'electronics',  name:'Electronics',  nameBn:'ইলেকট্রনিক্স', icon:'fa-microchip',        color:'#3b82f6', subcategories:[{id:'s1-1',slug:'mobile-phones',name:'Mobile Phones',nameBn:'মোবাইল ফোন',icon:'fa-mobile-screen'},{id:'s1-2',slug:'laptops',name:'Laptops',nameBn:'ল্যাপটপ',icon:'fa-laptop'},{id:'s1-3',slug:'tablets',name:'Tablets',nameBn:'ট্যাবলেট',icon:'fa-tablet-screen-button'},{id:'s1-4',slug:'headphones',name:'Headphones',nameBn:'হেডফোন',icon:'fa-headphones'},{id:'s1-5',slug:'smart-watches',name:'Smart Watches',nameBn:'স্মার্টওয়াচ',icon:'fa-watch-smart'},{id:'s1-6',slug:'cameras',name:'Cameras',nameBn:'ক্যামেরা',icon:'fa-camera'},{id:'s1-7',slug:'televisions',name:'Televisions',nameBn:'টেলিভিশন',icon:'fa-tv'},{id:'s1-8',slug:'accessories',name:'Accessories',nameBn:'আনুষাঙ্গিক',icon:'fa-plug'}] },
  { id:'c2',slug:'fashion',      name:'Fashion',      nameBn:'ফ্যাশন',         icon:'fa-shirt',             color:'#ec4899', subcategories:[{id:'s2-1',slug:'mens-clothing',name:"Men's Clothing",nameBn:'পুরুষ পোশাক',icon:'fa-person'},{id:'s2-2',slug:'womens-clothing',name:"Women's Clothing",nameBn:'মহিলা পোশাক',icon:'fa-person-dress'},{id:'s2-3',slug:'kids-clothing',name:"Kids' Clothing",nameBn:'শিশু পোশাক',icon:'fa-child'},{id:'s2-4',slug:'footwear',name:'Footwear',nameBn:'জুতা',icon:'fa-shoe-prints'},{id:'s2-5',slug:'sarees',name:'Sarees',nameBn:'শাড়ি',icon:'fa-scarf'},{id:'s2-6',slug:'bags-wallets',name:'Bags & Wallets',nameBn:'ব্যাগ ও মানিব্যাগ',icon:'fa-bag-shopping'},{id:'s2-7',slug:'ethnic-wear',name:'Ethnic Wear',nameBn:'ঐতিহ্যবাহী পোশাক',icon:'fa-vest'}] },
  { id:'c3',slug:'grocery',      name:'Grocery',      nameBn:'মুদিখানা',        icon:'fa-basket-shopping',   color:'#22c55e', subcategories:[{id:'s3-1',slug:'rice-grains',name:'Rice & Grains',nameBn:'চাল ও শস্য',icon:'fa-wheat-awn'},{id:'s3-2',slug:'oil-spices',name:'Oil & Spices',nameBn:'তেল ও মশলা',icon:'fa-jar'},{id:'s3-3',slug:'beverages',name:'Beverages',nameBn:'পানীয়',icon:'fa-bottle-water'},{id:'s3-4',slug:'snacks',name:'Snacks',nameBn:'স্ন্যাকস',icon:'fa-cookie-bite'},{id:'s3-5',slug:'dairy',name:'Dairy',nameBn:'দুগ্ধজাত পণ্য',icon:'fa-cow'},{id:'s3-6',slug:'fresh-produce',name:'Fresh Produce',nameBn:'তাজা শাকসবজি',icon:'fa-carrot'}] },
  { id:'c4',slug:'beauty',       name:'Beauty',       nameBn:'বিউটি',           icon:'fa-pump-soap',         color:'#a78bfa', subcategories:[{id:'s4-1',slug:'skincare',name:'Skincare',nameBn:'স্কিনকেয়ার',icon:'fa-spa'},{id:'s4-2',slug:'haircare',name:'Haircare',nameBn:'হেয়ারকেয়ার',icon:'fa-scissors'},{id:'s4-3',slug:'makeup',name:'Makeup',nameBn:'মেকআপ',icon:'fa-wand-magic-sparkles'},{id:'s4-4',slug:'fragrances',name:'Fragrances',nameBn:'সুগন্ধি',icon:'fa-bottle-droplet'},{id:'s4-5',slug:'mens-grooming',name:"Men's Grooming",nameBn:'পুরুষ গ্রুমিং',icon:'fa-razor'}] },
  { id:'c5',slug:'home',         name:'Home & Living',nameBn:'হোম',             icon:'fa-couch',             color:'#f97316', subcategories:[{id:'s5-1',slug:'furniture',name:'Furniture',nameBn:'আসবাবপত্র',icon:'fa-couch'},{id:'s5-2',slug:'kitchen',name:'Kitchen',nameBn:'রান্নাঘর',icon:'fa-kitchen-set'},{id:'s5-3',slug:'air-conditioners',name:'Air Conditioners',nameBn:'এয়ার কন্ডিশনার',icon:'fa-snowflake'},{id:'s5-4',slug:'bedding',name:'Bedding',nameBn:'বিছানার চাদর',icon:'fa-bed'},{id:'s5-5',slug:'decor',name:'Décor',nameBn:'সাজসজ্জা',icon:'fa-lamp-desk'},{id:'s5-6',slug:'cleaning',name:'Cleaning',nameBn:'পরিষ্কার',icon:'fa-broom'}] },
  { id:'c6',slug:'sports',       name:'Sports',       nameBn:'স্পোর্টস',        icon:'fa-dumbbell',          color:'#0ea5e9', subcategories:[{id:'s6-1',slug:'cricket',name:'Cricket',nameBn:'ক্রিকেট',icon:'fa-baseball-bat-ball'},{id:'s6-2',slug:'football',name:'Football',nameBn:'ফুটবল',icon:'fa-futbol'},{id:'s6-3',slug:'fitness',name:'Fitness',nameBn:'ফিটনেস',icon:'fa-dumbbell'},{id:'s6-4',slug:'outdoor',name:'Outdoor',nameBn:'আউটডোর',icon:'fa-person-hiking'},{id:'s6-5',slug:'cycling',name:'Cycling',nameBn:'সাইক্লিং',icon:'fa-bicycle'}] },
  { id:'c7',slug:'business',     name:'Business',     nameBn:'ব্যবসা',          icon:'fa-briefcase',         color:'#8b5cf6', subcategories:[{id:'s7-1',slug:'office-supplies',name:'Office Supplies',nameBn:'অফিস সামগ্রী',icon:'fa-paperclip'},{id:'s7-2',slug:'pos-systems',name:'POS Systems',nameBn:'POS সিস্টেম',icon:'fa-cash-register'},{id:'s7-3',slug:'printing',name:'Printing',nameBn:'প্রিন্টিং',icon:'fa-print'},{id:'s7-4',slug:'storage',name:'Storage',nameBn:'স্টোরেজ',icon:'fa-boxes-stacked'}] },
  { id:'c8',slug:'books',        name:'Books',        nameBn:'বই',              icon:'fa-book-open',         color:'#fbbf24', subcategories:[{id:'s8-1',slug:'bangla-literature',name:'Bangla Literature',nameBn:'বাংলা সাহিত্য',icon:'fa-book'},{id:'s8-2',slug:'academic',name:'Academic',nameBn:'শিক্ষামূলক',icon:'fa-graduation-cap'},{id:'s8-3',slug:'self-help',name:'Self Help',nameBn:'সেলফ হেল্প',icon:'fa-brain'},{id:'s8-4',slug:'religious',name:'Religious',nameBn:'ধর্মীয়',icon:'fa-star-and-crescent'},{id:'s8-5',slug:'children',name:"Children's",nameBn:'শিশু',icon:'fa-child-reaching'}] },
]

// ── PRODUCTS data ─────────────────────────────────────────────────────────────
const products: any[] = [
  { id:'1',  slug:'samsung-galaxy-a55',   name:'Samsung Galaxy A55 5G',             nameBn:'স্যামসাং গ্যালাক্সি A55',   description:'6.6" AMOLED, 50MP camera, 5000mAh',                     price:45000,salePrice:39999,images:['https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=400&h=400&fit=crop'],category:'Electronics',subcategory:'mobile-phones',categoryBn:'ইলেকট্রনিক্স',brand:'Samsung',stock:42,rating:4.6,reviewCount:318,tags:['phone','5g'],isNew:true,isFeatured:false,deliveryDays:2,seller:'TechWorld BD',location:'Dhaka',createdAt:'2025-01-10T10:00:00Z'},
  { id:'2',  slug:'nike-air-max-2027',    name:'Nike Air Max 2027',                 nameBn:'নাইকি এয়ার ম্যাক্স',         description:'Future-forward cushioning, breathable mesh',              price:12000,salePrice:9499, images:['https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&h=400&fit=crop'],category:'Fashion',    subcategory:'footwear',        categoryBn:'ফ্যাশন',       brand:'Nike',   stock:80,rating:4.8,reviewCount:512,tags:['shoes','sneakers'],isNew:false,isFeatured:false,deliveryDays:3,seller:'SportZone',location:'Chittagong',createdAt:'2025-01-12T10:00:00Z'},
  { id:'3',  slug:'walton-primo-x7',      name:'Walton Primo X7 Ultra',             nameBn:'ওয়ালটন প্রিমো X7',           description:'Made in Bangladesh, 108MP, 6000mAh',                     price:28000,salePrice:24999,images:['https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400&h=400&fit=crop'],category:'Electronics',subcategory:'mobile-phones',categoryBn:'ইলেকট্রনিক্স',brand:'Walton', stock:65,rating:4.3,reviewCount:224,tags:['phone','walton'],isNew:false,isFeatured:true,deliveryDays:1,seller:'Walton Official',location:'Dhaka',createdAt:'2025-01-14T10:00:00Z'},
  { id:'4',  slug:'muslin-saree-jamdani', name:'Jamdani Muslin Saree',              nameBn:'জামদানি মসলিন শাড়ি',         description:'Authentic Dhaka Muslin, UNESCO heritage craft',           price:8500, salePrice:7200, images:['https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=400&h=400&fit=crop'],category:'Fashion',    subcategory:'sarees',          categoryBn:'ফ্যাশন',       brand:'Dhaka Muslin',stock:20,rating:4.9,reviewCount:187,tags:['saree','jamdani'],isNew:false,isFeatured:true,deliveryDays:4,seller:'Muslin House',location:'Narayanganj',createdAt:'2025-01-15T10:00:00Z'},
  { id:'5',  slug:'xiaomi-redmi-note-13', name:'Xiaomi Redmi Note 13 Pro',          nameBn:'শাওমি রেডমি নোট ১৩',         description:'200MP OIS camera, 5100mAh, 67W charging',                price:35000,salePrice:29999,images:['https://images.unsplash.com/photo-1585060544812-6b45742d762f?w=400&h=400&fit=crop'],category:'Electronics',subcategory:'mobile-phones',categoryBn:'ইলেকট্রনিক্স',brand:'Xiaomi', stock:55,rating:4.5,reviewCount:443,tags:['phone','xiaomi'],isNew:true,isFeatured:false,deliveryDays:2,seller:'MiStore BD',location:'Dhaka',createdAt:'2025-01-16T10:00:00Z'},
  { id:'6',  slug:'bkash-qr-scanner',     name:'Smart QR POS Terminal',             nameBn:'স্মার্ট QR টার্মিনাল',        description:'bKash/Nagad/Rocket integrated, touchscreen',              price:4500, salePrice:3800, images:['https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=400&h=400&fit=crop'],category:'Business',   subcategory:'pos-systems',     categoryBn:'ব্যবসা',       brand:'PayTech BD',stock:100,rating:4.4,reviewCount:89,tags:['pos','qr'],isNew:false,isFeatured:false,deliveryDays:3,seller:'PayTech',location:'Dhaka',createdAt:'2025-01-17T10:00:00Z'},
  { id:'7',  slug:'pran-mango-juice-1l',  name:'PRAN Mango Juice 1L',               nameBn:'প্রাণ আম জুস',                 description:'100% real mango, no preservatives, 1 litre',             price:120,  salePrice:99,   images:['https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=400&h=400&fit=crop'],category:'Grocery',    subcategory:'beverages',       categoryBn:'মুদিখানা',    brand:'PRAN',   stock:500,rating:4.7,reviewCount:1200,tags:['juice','pran'],isNew:false,isFeatured:false,deliveryDays:1,seller:'PRAN Foods',location:'Nationwide',createdAt:'2025-01-18T10:00:00Z'},
  { id:'8',  slug:'lenovo-ideapad-slim5', name:'Lenovo IdeaPad Slim 5',             nameBn:'লেনোভো আইডিয়াপ্যাড',         description:'AMD Ryzen 7, 16GB RAM, 512GB SSD, 14" OLED',             price:95000,salePrice:84999,images:['https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=400&h=400&fit=crop'],category:'Electronics',subcategory:'laptops',         categoryBn:'ইলেকট্রনিক্স',brand:'Lenovo', stock:18,rating:4.6,reviewCount:267,tags:['laptop','lenovo'],isNew:false,isFeatured:true,deliveryDays:3,seller:'LaptopHouse BD',location:'Dhaka',createdAt:'2025-01-19T10:00:00Z'},
  { id:'9',  slug:'aarong-kurta-men',     name:'Aarong Cotton Kurta',               nameBn:'আড়ং কটন কুর্তা',             description:'Handloom cotton, block print, exclusive Aarong design',  price:3500, salePrice:2800, images:['https://images.unsplash.com/photo-1586790170083-2f9ceadc732d?w=400&h=400&fit=crop'],category:'Fashion',    subcategory:'mens-clothing',   categoryBn:'ফ্যাশন',       brand:'Aarong', stock:150,rating:4.7,reviewCount:342,tags:['kurta','aarong'],isNew:false,isFeatured:false,deliveryDays:2,seller:'Aarong Official',location:'Dhaka',createdAt:'2025-01-20T10:00:00Z'},
  { id:'10', slug:'symphony-z55',         name:'Symphony Z55 Pro',                  nameBn:'সিম্ফনি Z55 প্রো',            description:'Local brand, 6.7" display, 5000mAh, dual camera',        price:18000,salePrice:15499,images:['https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=400&h=400&fit=crop'],category:'Electronics',subcategory:'mobile-phones',categoryBn:'ইলেকট্রনিক্স',brand:'Symphony',stock:90,rating:4.1,reviewCount:156,tags:['phone','symphony'],isNew:true,isFeatured:false,deliveryDays:1,seller:'Symphony Official',location:'Dhaka',createdAt:'2025-01-21T10:00:00Z'},
  { id:'11', slug:'rfl-pressure-cooker',  name:'RFL Pressure Cooker 5L',            nameBn:'আরএফএল প্রেশার কুকার',       description:'5-litre stainless steel, safety valve',                  price:2200, salePrice:1799, images:['https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=400&h=400&fit=crop'],category:'Home & Living',subcategory:'kitchen',       categoryBn:'হোম',          brand:'RFL',    stock:200,rating:4.5,reviewCount:890,tags:['kitchen','rfl'],isNew:false,isFeatured:false,deliveryDays:3,seller:'RFL Houseware',location:'Nationwide',createdAt:'2025-01-22T10:00:00Z'},
  { id:'12', slug:'meril-splash',         name:'Meril Splash Body Wash',            nameBn:'মেরিল স্প্ল্যাশ',             description:'Fresh citrus scent, moisturizing formula, 500ml',         price:350,  salePrice:299,  images:['https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=400&h=400&fit=crop'],category:'Beauty',     subcategory:'skincare',        categoryBn:'বিউটি',        brand:'Meril',  stock:300,rating:4.3,reviewCount:567,tags:['bodycare','meril'],isNew:false,isFeatured:false,deliveryDays:2,seller:'Meril Beauty',location:'Nationwide',createdAt:'2025-01-23T10:00:00Z'},
  { id:'13', slug:'sony-wh1000xm5',       name:'Sony WH-1000XM5',                   nameBn:'সনি হেডফোন XM5',              description:'Industry-leading ANC, 30hr battery, LDAC',               price:32000,salePrice:27500,images:['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=400&fit=crop'],category:'Electronics',subcategory:'headphones',      categoryBn:'ইলেকট্রনিক্স',brand:'Sony',   stock:30,rating:4.8,reviewCount:532,tags:['headphones','anc'],isNew:false,isFeatured:true,deliveryDays:3,seller:'AudioZone BD',location:'Dhaka',createdAt:'2025-01-24T10:00:00Z'},
  { id:'14', slug:'apple-watch-s9',       name:'Apple Watch Series 9',              nameBn:'অ্যাপল ওয়াচ S9',             description:'S9 chip, Always-On Display, ECG, Blood Oxygen',          price:55000,salePrice:49999,images:['https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=400&h=400&fit=crop'],category:'Electronics',subcategory:'smart-watches',   categoryBn:'ইলেকট্রনিক্স',brand:'Apple',  stock:15,rating:4.9,reviewCount:189,tags:['smartwatch','apple'],isNew:true,isFeatured:false,deliveryDays:2,seller:'iZone Bangladesh',location:'Dhaka',createdAt:'2025-01-25T10:00:00Z'},
  { id:'15', slug:'basmati-rice-5kg',     name:'Premium Basmati Rice 5kg',          nameBn:'বাসমতি চাল ৫ কেজি',           description:'Long-grain aged basmati, low GI, fragrant',              price:980,  salePrice:849,  images:['https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400&h=400&fit=crop'],category:'Grocery',    subcategory:'rice-grains',     categoryBn:'মুদিখানা',    brand:'Gold Coin',stock:300,rating:4.6,reviewCount:540,tags:['rice','basmati'],isNew:false,isFeatured:false,deliveryDays:1,seller:'Meena Bazaar',location:'Dhaka',createdAt:'2025-01-26T10:00:00Z'},
  { id:'16', slug:'loreal-vitamin-c',     name:"L'Oréal Vitamin C Serum",           nameBn:'লোরিয়াল ভিটামিন C সিরাম',   description:'10% pure Vitamin C, anti-aging, brightening, 30ml',     price:2200, salePrice:1799, images:['https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=400&h=400&fit=crop'],category:'Beauty',     subcategory:'skincare',        categoryBn:'বিউটি',        brand:"L'Oréal",stock:75,rating:4.6,reviewCount:423,tags:['serum','skincare'],isNew:true,isFeatured:false,deliveryDays:2,seller:'BeautyWorld BD',location:'Dhaka',createdAt:'2025-01-27T10:00:00Z'},
  { id:'17', slug:'walton-ac-1ton',       name:'Walton Inverter AC 1 Ton',          nameBn:'ওয়ালটন ১ টন এসি',            description:'Inverter, Wi-Fi Control, Auto-Clean, Energy A+++',       price:55000,salePrice:47999,images:['https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=400&h=400&fit=crop'],category:'Home & Living',subcategory:'air-conditioners',categoryBn:'হোম',          brand:'Walton', stock:25,rating:4.5,reviewCount:178,tags:['ac','walton'],isNew:false,isFeatured:true,deliveryDays:5,seller:'Walton Official',location:'Dhaka',createdAt:'2025-01-28T10:00:00Z'},
  { id:'18', slug:'gp-cricket-bat',       name:'GP Pro Cricket Bat (English Willow)',nameBn:'জিপি ক্রিকেট ব্যাট',         description:'Grade 1 English Willow, full size, pre-knocked',         price:9500, salePrice:7999, images:['https://images.unsplash.com/photo-1531415074968-036ba1b575da?w=400&h=400&fit=crop'],category:'Sports',     subcategory:'cricket',         categoryBn:'স্পোর্টস',   brand:'GP',     stock:35,rating:4.7,reviewCount:143,tags:['cricket','bat'],isNew:true,isFeatured:false,deliveryDays:3,seller:'Sports Arena BD',location:'Dhaka',createdAt:'2025-01-29T10:00:00Z'},
  { id:'19', slug:'humayun-himu',         name:'হুমায়ূন আহমেদ হিমু সমগ্র',         nameBn:'হুমায়ূন আহমেদ হিমু সমগ্র',  description:'Complete Himu series, 5 volumes, hardcover',             price:1800, salePrice:1499, images:['https://images.unsplash.com/photo-1512820790803-83ca734da794?w=400&h=400&fit=crop'],category:'Books',      subcategory:'bangla-literature',categoryBn:'বই',           brand:'Bhasha Prakash',stock:150,rating:5.0,reviewCount:987,tags:['bangla','novel','humayun'],isNew:false,isFeatured:true,deliveryDays:2,seller:'Rokomari',location:'Dhaka',createdAt:'2025-01-30T10:00:00Z'},
  { id:'20', slug:'polo-shirt-men',       name:"Men's Premium Polo Shirt",          nameBn:'পুরুষ পোলো শার্ট',            description:'100% Egyptian Cotton, slim fit, 12 colors',              price:1800, salePrice:1299, images:['https://images.unsplash.com/photo-1586790170083-2f9ceadc732d?w=400&h=400&fit=crop'],category:'Fashion',    subcategory:'mens-clothing',   categoryBn:'ফ্যাশন',       brand:'Thread & Co',stock:200,rating:4.5,reviewCount:892,tags:['shirt','polo'],isNew:true,isFeatured:false,deliveryDays:2,seller:'StyleHub BD',location:'Dhaka',createdAt:'2025-01-31T10:00:00Z'},
  { id:'21', slug:'canon-eos-r50',        name:'Canon EOS R50 Mirrorless Camera',   nameBn:'ক্যানন EOS R50 ক্যামেরা',    description:'24.2MP APS-C, 4K Video, Dual Pixel AF',                 price:85000,salePrice:74999,images:['https://images.unsplash.com/photo-1502982720700-bfff97f2ecac?w=400&h=400&fit=crop'],category:'Electronics',subcategory:'cameras',         categoryBn:'ইলেকট্রনিক্স',brand:'Canon',  stock:12,rating:4.7,reviewCount:98,tags:['camera','canon'],isNew:false,isFeatured:false,deliveryDays:4,seller:'PixelPro BD',location:'Dhaka',createdAt:'2025-02-01T10:00:00Z'},
  { id:'22', slug:'samsung-65-qled-tv',   name:'Samsung 65" QLED 4K Smart TV',      nameBn:'স্যামসাং QLED ৬৫" টিভি',     description:'Quantum HDR, 120Hz, Dolby Atmos, Gaming Mode',           price:145000,salePrice:129000,images:['https://images.unsplash.com/photo-1593359677879-a4bb92f829e1?w=400&h=400&fit=crop'],category:'Electronics',subcategory:'televisions',    categoryBn:'ইলেকট্রনিক্স',brand:'Samsung',stock:8,rating:4.7,reviewCount:143,tags:['tv','qled','4k'],isNew:false,isFeatured:true,deliveryDays:5,seller:'TechWorld BD',location:'Dhaka',createdAt:'2025-02-02T10:00:00Z'},
  { id:'23', slug:'ladies-kurti-set',     name:'Ladies Embroidered Kurti Set',      nameBn:'লেডিজ এমব্রয়ডারড কুর্তি',  description:'Hand embroidery, cotton-blend, 3-piece set, festive',    price:3500, salePrice:2799, images:['https://images.unsplash.com/photo-1594938298603-c8148c4b2ef4?w=400&h=400&fit=crop'],category:'Fashion',    subcategory:'womens-clothing', categoryBn:'ফ্যাশন',       brand:'Aarong', stock:45,rating:4.7,reviewCount:341,tags:['kurti','ladies'],isNew:false,isFeatured:true,deliveryDays:3,seller:'Aarong Official',location:'Dhaka',createdAt:'2025-02-03T10:00:00Z'},
  { id:'24', slug:'atomic-habits-bangla', name:'Atomic Habits (Bangla Translation)',nameBn:'অ্যাটমিক হ্যাবিটস (বাংলা)', description:'James Clear, Bangla Edition, Paperback, Self-help',     price:450,  salePrice:380,  images:['https://images.unsplash.com/photo-1589829085413-56de8ae18c73?w=400&h=400&fit=crop'],category:'Books',      subcategory:'self-help',       categoryBn:'বই',           brand:'Ananya', stock:200,rating:4.8,reviewCount:654,tags:['self-help','bangla'],isNew:true,isFeatured:false,deliveryDays:2,seller:'Rokomari',location:'Dhaka',createdAt:'2025-02-04T10:00:00Z'},
  { id:'25', slug:'rasasi-oud-perfume',   name:'Rasasi Oud Al Layl EDP 100ml',      nameBn:'রাসাসি উদ পারফিউম',          description:'Arabian Oud, long lasting 12hr, unisex',                price:4500, salePrice:3800, images:['https://images.unsplash.com/photo-1541643600914-78b084683702?w=400&h=400&fit=crop'],category:'Beauty',     subcategory:'fragrances',      categoryBn:'বিউটি',        brand:'Rasasi', stock:40,rating:4.8,reviewCount:267,tags:['perfume','oud'],isNew:false,isFeatured:false,deliveryDays:3,seller:'Fragrance House BD',location:'Dhaka',createdAt:'2025-02-05T10:00:00Z'},
  { id:'26', slug:'miyako-rice-cooker',   name:'Miyako 5L Digital Rice Cooker',     nameBn:'মিয়াকো ডিজিটাল রাইস কুকার',description:'Multi-cook, keep warm, non-stick inner pot',             price:3200, salePrice:2699, images:['https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=400&h=400&fit=crop'],category:'Home & Living',subcategory:'kitchen',       categoryBn:'হোম',          brand:'Miyako', stock:90,rating:4.4,reviewCount:562,tags:['kitchen','rice-cooker'],isNew:false,isFeatured:false,deliveryDays:2,seller:'HomePlus BD',location:'Dhaka',createdAt:'2025-02-06T10:00:00Z'},
  { id:'27', slug:'yoga-mat-tpe',         name:'Premium TPE Yoga Mat 6mm',          nameBn:'প্রিমিয়াম যোগা ম্যাট',      description:'Non-slip, eco-friendly TPE, double-layer, carry strap', price:1800, salePrice:1399, images:['https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=400&fit=crop'],category:'Sports',     subcategory:'fitness',         categoryBn:'স্পোর্টস',   brand:'FitLife', stock:120,rating:4.5,reviewCount:289,tags:['yoga','fitness'],isNew:false,isFeatured:false,deliveryDays:2,seller:'FitZone BD',location:'Dhaka',createdAt:'2025-02-07T10:00:00Z'},
]

// ── ORDERS data ───────────────────────────────────────────────────────────────
function daysAgo(n: number) {
  const d = new Date(); d.setDate(d.getDate() - n); return d.toISOString()
}
const orders: any[] = [
  { id:'SB-240001',customer:{name:'Rahim Uddin',email:'rahim.uddin@gmail.com',phone:'01711-234567',address:'House 12, Road 5, Dhanmondi, Dhaka'},items:[{productId:'1',name:'Samsung Galaxy A55 5G',quantity:1,price:39999}],subtotal:39999,shipping:80,total:40079,status:'delivered',paymentMethod:'bkash',paymentStatus:'paid',notes:'',trackingNumber:'SA-TRK-78234',createdAt:daysAgo(5),updatedAt:daysAgo(3)},
  { id:'SB-240002',customer:{name:'Fatema Begum',email:'fatema.b@yahoo.com',phone:'01812-345678',address:'Apt 4B, Bashundhara R/A, Dhaka'},items:[{productId:'4',name:'Jamdani Muslin Saree',quantity:2,price:7200}],subtotal:14400,shipping:120,total:14520,status:'shipped',paymentMethod:'cod',paymentStatus:'pending',notes:'Please wrap carefully',trackingNumber:'SA-TRK-78299',createdAt:daysAgo(3),updatedAt:daysAgo(2)},
  { id:'SB-240003',customer:{name:'Karim Hossain',email:'k.hossain@outlook.com',phone:'01955-456789',address:'Village: Shibpur, Narsingdi'},items:[{productId:'7',name:'PRAN Mango Juice 1L',quantity:12,price:99},{productId:'11',name:'RFL Pressure Cooker 5L',quantity:1,price:1799}],subtotal:2987,shipping:150,total:3137,status:'processing',paymentMethod:'nagad',paymentStatus:'paid',notes:'',trackingNumber:'',createdAt:daysAgo(1),updatedAt:daysAgo(1)},
  { id:'SB-240004',customer:{name:'Sumaiya Akter',email:'sumaiya.akter@gmail.com',phone:'01676-567890',address:'Holding 8, GEC Circle, Chittagong'},items:[{productId:'8',name:'Lenovo IdeaPad Slim 5',quantity:1,price:84999}],subtotal:84999,shipping:200,total:85199,status:'pending',paymentMethod:'bkash',paymentStatus:'paid',notes:'Call before delivery',trackingNumber:'',createdAt:daysAgo(0),updatedAt:daysAgo(0)},
  { id:'SB-240005',customer:{name:'Nasir Ahmed',email:'nasir.a@proton.me',phone:'01517-678901',address:'Plot 22, DOHS, Mirpur, Dhaka'},items:[{productId:'2',name:'Nike Air Max 2027',quantity:1,price:9499},{productId:'9',name:'Aarong Cotton Kurta',quantity:3,price:2800}],subtotal:17899,shipping:80,total:17979,status:'delivered',paymentMethod:'rocket',paymentStatus:'paid',notes:'',trackingNumber:'SA-TRK-77891',createdAt:daysAgo(4),updatedAt:daysAgo(2)},
]

// ── USERS & state ─────────────────────────────────────────────────────────────
const users: any[] = []
const userCarts: Record<string, any[]> = {}
const userWishlists: Record<string, string[]> = {}
app.locals.orders = orders

const ADMIN_ACCOUNTS = [
  { id:'admin-1',email:'admin@sellbazar.com',  password:'Admin@1234',   role:'superadmin',name:'Super Admin'   },
  { id:'admin-2',email:'manager@sellbazar.com',password:'Manager@123',  role:'admin',     name:'Store Manager' },
]

// ── HEALTH ────────────────────────────────────────────────────────────────────
app.get('/api/health', (_req: any, res: any) => res.json({ status:'ok', service:'SellBazar API', time: new Date().toISOString() }))

// ── AUTH ──────────────────────────────────────────────────────────────────────
app.post('/api/auth/login', (req: any, res: any) => {
  const { phone, email, password } = req.body
  if ((!phone && !email) || !password) return res.status(400).json({ error: 'Credentials required' })
  const user = users.find(u => (phone && u.phone === phone) || (email && u.email === email))
  if (!user || user.password !== password) {
    return res.json({ user:{ id:'1',name:'Demo User',email:email??'demo@sellbazar.com',phone:phone??'',division:'Dhaka' }, token:'mock-jwt-token' })
  }
  const { password: _p, ...safe } = user
  res.json({ user: safe, token: 'mock-jwt-token' })
})
app.post('/api/auth/register', (req: any, res: any) => {
  const { name, phone, email, division, password } = req.body
  if (!name||!phone||!email||!password) return res.status(400).json({ error:'All fields required' })
  if (users.find(u=>u.email===email)) return res.status(409).json({ field:'email', error:'Email already registered' })
  if (users.find(u=>u.phone===phone)) return res.status(409).json({ field:'phone', error:'Phone already registered' })
  const u = { id:Date.now().toString(),name,email,phone,division:division??'Dhaka',password }
  users.push(u)
  const { password: _p, ...safe } = u
  res.json({ user:safe, token:'mock-jwt-token' })
})
app.post('/api/auth/check', (req: any, res: any) => {
  const { email, phone } = req.body
  if (email && users.find(u=>u.email===email)) return res.status(409).json({ field:'email', error:'Email already registered' })
  if (phone && users.find(u=>u.phone===phone)) return res.status(409).json({ field:'phone', error:'Phone already registered' })
  res.json({ available:true })
})

// ── ADMIN AUTH ────────────────────────────────────────────────────────────────
app.post('/api/admin/login', (req: any, res: any) => {
  const { email, password } = req.body
  const admin = ADMIN_ACCOUNTS.find(a=>a.email===email && a.password===password)
  if (!admin) return res.status(401).json({ error:'Invalid credentials' })
  const token = jwt.sign({ id:admin.id, email:admin.email, role:admin.role }, JWT_SECRET, { expiresIn:'24h' })
  res.json({ token, admin:{ id:admin.id,email:admin.email,role:admin.role,name:admin.name } })
})
app.get('/api/admin/me', requireAdmin, (req: any, res: any) => res.json({ admin: req.admin }))
app.post('/api/admin/logout', requireAdmin, (_req: any, res: any) => res.json({ message:'Logged out' }))

// ── PRODUCTS ──────────────────────────────────────────────────────────────────
app.get('/api/products', (req: any, res: any) => {
  const { category, subcategory, q, limit, featured, sortBy, order } = req.query
  let result = [...products]
  if (category && category !== 'All') result = result.filter(p=>p.category===category)
  if (subcategory && subcategory !== 'All') result = result.filter(p=>p.subcategory===subcategory)
  if (q) result = result.filter(p=>p.name.toLowerCase().includes(q.toLowerCase())||p.brand.toLowerCase().includes(q.toLowerCase()))
  if (featured==='true') result = result.filter(p=>p.isFeatured)
  if (sortBy) { const dir = order==='desc'?-1:1; result.sort((a:any,b:any)=>a[sortBy]<b[sortBy]?-dir:a[sortBy]>b[sortBy]?dir:0) }
  if (limit) result = result.slice(0,parseInt(limit))
  res.json({ data:result, total:result.length })
})
app.get('/api/products/:slug', (req: any, res: any) => {
  const p = products.find(p=>p.slug===req.params.slug||p.id===req.params.slug)
  if (!p) return res.status(404).json({ error:'Product not found' })
  res.json(p)
})
app.post('/api/products', requireAdmin, (req: any, res: any) => {
  const p = { id:Date.now().toString(), ...req.body, createdAt:new Date().toISOString() }
  products.unshift(p); res.status(201).json(p)
})
app.put('/api/products/:id', requireAdmin, (req: any, res: any) => {
  const idx = products.findIndex(p=>p.id===req.params.id||p.slug===req.params.id)
  if (idx===-1) return res.status(404).json({ error:'Product not found' })
  products[idx] = { ...products[idx], ...req.body, id:products[idx].id }; res.json(products[idx])
})
app.delete('/api/products/:id', requireAdmin, (req: any, res: any) => {
  const idx = products.findIndex(p=>p.id===req.params.id||p.slug===req.params.id)
  if (idx===-1) return res.status(404).json({ error:'Product not found' })
  const [d] = products.splice(idx,1); res.json({ message:'Deleted', id:d.id })
})

// ── CATEGORIES ────────────────────────────────────────────────────────────────
app.get('/api/categories', (_req: any, res: any) => {
  const enriched = CATEGORIES.map(cat=>({
    ...cat,
    productCount: products.filter(p=>p.category===cat.name).length,
    subcategories: cat.subcategories.map((sub: any)=>({ ...sub, productCount:products.filter(p=>p.subcategory===sub.slug).length }))
  }))
  res.json({ data:enriched, total:enriched.length })
})
app.get('/api/categories/:slug', (req: any, res: any) => {
  const cat = CATEGORIES.find(c=>c.slug===req.params.slug)
  if (!cat) return res.status(404).json({ error:'Category not found' })
  res.json({ ...cat, productCount:products.filter(p=>p.category===cat.name).length,
    subcategories: cat.subcategories.map((sub: any)=>({ ...sub, productCount:products.filter(p=>p.subcategory===sub.slug).length })) })
})

// ── ORDERS ────────────────────────────────────────────────────────────────────
app.get('/api/orders/by-id/:id', (req: any, res: any) => {
  const o = orders.find(o=>o.id===req.params.id)
  if (!o) return res.status(404).json({ error:'Order not found' })
  res.json(o)
})
app.get('/api/orders', requireAdmin, (req: any, res: any) => {
  let result = [...orders]
  if (req.query.status && req.query.status!=='all') result = result.filter(o=>o.status===req.query.status)
  result.sort((a,b)=>new Date(b.createdAt).getTime()-new Date(a.createdAt).getTime())
  res.json({ data:result, total:result.length })
})
app.post('/api/orders', (req: any, res: any) => {
  const { customer, items, subtotal, shipping, total, paymentMethod } = req.body
  if (!customer||!items?.length||!total) return res.status(400).json({ error:'customer, items and total required' })
  const o = { id:`SB-${Date.now()}`,customer,items,subtotal:Number(subtotal??total),shipping:Number(shipping??0),total:Number(total),
    status:'pending',paymentMethod:paymentMethod??'cod',paymentStatus:'pending',notes:req.body.notes??'',trackingNumber:'',
    createdAt:new Date().toISOString(),updatedAt:new Date().toISOString() }
  orders.unshift(o); res.status(201).json(o)
})
app.put('/api/orders/:id', requireAdmin, (req: any, res: any) => {
  const idx = orders.findIndex(o=>o.id===req.params.id)
  if (idx===-1) return res.status(404).json({ error:'Order not found' })
  orders[idx] = { ...orders[idx], ...req.body, id:orders[idx].id, updatedAt:new Date().toISOString() }
  res.json(orders[idx])
})
app.delete('/api/orders/:id', requireAdmin, (req: any, res: any) => {
  const idx = orders.findIndex(o=>o.id===req.params.id)
  if (idx===-1) return res.status(404).json({ error:'Order not found' })
  const [d] = orders.splice(idx,1); res.json({ message:'Deleted', id:d.id })
})

// ── USER DATA ─────────────────────────────────────────────────────────────────
function uid(req: any): string|null { return req.headers['x-user-id']??req.body?.userId??null }
app.get('/api/user/cart',      (req:any,res:any)=>{ const u=uid(req); if(!u) return res.status(401).json({error:'Unauthorized'}); res.json({cart:userCarts[u]??[]}) })
app.post('/api/user/cart',     (req:any,res:any)=>{ const u=uid(req); if(!u) return res.status(401).json({error:'Unauthorized'}); userCarts[u]=req.body.cart??[]; res.json({ok:true}) })
app.get('/api/user/wishlist',  (req:any,res:any)=>{ const u=uid(req); if(!u) return res.status(401).json({error:'Unauthorized'}); res.json({wishlist:userWishlists[u]??[]}) })
app.post('/api/user/wishlist', (req:any,res:any)=>{ const u=uid(req); if(!u) return res.status(401).json({error:'Unauthorized'}); userWishlists[u]=req.body.wishlist??[]; res.json({ok:true}) })

// ── ADMIN DASHBOARD ───────────────────────────────────────────────────────────
app.get('/api/admin/dashboard', requireAdmin, (req:any, res:any) => {
  const o: any[] = req.app.locals.orders??[]
  const paid = o.filter(x=>x.paymentStatus==='paid')
  const totalRevenue = paid.reduce((s:number,x:any)=>s+x.total,0)
  const statusCounts = o.reduce((a:any,x:any)=>{ a[x.status]=(a[x.status]??0)+1; return a },{})
  const catMap: Record<string,number> = {}
  products.forEach(p=>{ catMap[p.category]=(catMap[p.category]??0)+1 })
  res.json({ totalRevenue, totalOrders:o.length, totalProducts:products.length,
    lowStockCount:products.filter(p=>p.stock<25).length, statusCounts,
    categoryBreakdown:Object.entries(catMap).map(([name,count])=>({name,count})),
    recentOrders:[...o].sort((a,b)=>new Date(b.createdAt).getTime()-new Date(a.createdAt).getTime()).slice(0,5) })
})
app.get('/api/admin/customers', requireAdmin, (req:any, res:any) => {
  const o: any[] = req.app.locals.orders??[]
  const map: Record<string,any> = {}
  o.forEach((x:any)=>{ const e=x.customer?.email??x.id; if(!map[e]) map[e]={...x.customer,orderCount:0,totalSpent:0,orders:[]}; map[e].orderCount++; map[e].totalSpent+=x.total; map[e].orders.push(x.id) })
  res.json({ data:Object.values(map).sort((a:any,b:any)=>b.totalSpent-a.totalSpent), total:Object.keys(map).length })
})

export default app
