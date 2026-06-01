import { Router } from 'express'

const router = Router()

const products = [
  { id:'1', slug:'samsung-galaxy-a55', name:'Samsung Galaxy A55 5G', nameBn:'স্যামসাং গ্যালাক্সি A55', description:'6.6" AMOLED, 50MP camera, 5000mAh', price:45000, salePrice:39999, images:['https://placehold.co/400x400/f97316/fff?text=Galaxy+A55'], category:'Electronics', categoryBn:'ইলেকট্রনিক্স', brand:'Samsung', stock:42, rating:4.6, reviewCount:318, tags:['phone','5g','samsung'], isNew:true, deliveryDays:2, seller:'TechWorld BD', location:'Dhaka' },
  { id:'2', slug:'nike-air-max-2027', name:'Nike Air Max 2027', nameBn:'নাইকি এয়ার ম্যাক্স', description:'Future-forward cushioning, breathable mesh', price:12000, salePrice:9499, images:['https://placehold.co/400x400/6366f1/fff?text=Nike+Air'], category:'Fashion', categoryBn:'ফ্যাশন', brand:'Nike', stock:80, rating:4.8, reviewCount:512, tags:['shoes','sneakers'], deliveryDays:3, seller:'SportZone', location:'Chittagong' },
  { id:'3', slug:'walton-primo-x7', name:'Walton Primo X7 Ultra', nameBn:'ওয়ালটন প্রিমো X7', description:'Made in Bangladesh, 108MP, 6000mAh', price:28000, salePrice:24999, images:['https://placehold.co/400x400/10b981/fff?text=Walton+X7'], category:'Electronics', categoryBn:'ইলেকট্রনিক্স', brand:'Walton', stock:65, rating:4.3, reviewCount:224, tags:['phone','walton','local'], isFeatured:true, deliveryDays:1, seller:'Walton Official', location:'Dhaka' },
  { id:'4', slug:'muslin-saree-jamdani', name:'Jamdani Muslin Saree', nameBn:'জামদানি মসলিন শাড়ি', description:'Authentic Dhaka Muslin, UNESCO heritage craft', price:8500, salePrice:7200, images:['https://placehold.co/400x400/ec4899/fff?text=Jamdani'], category:'Fashion', categoryBn:'ফ্যাশন', brand:'Dhaka Muslin', stock:20, rating:4.9, reviewCount:187, tags:['saree','jamdani','traditional'], isFeatured:true, deliveryDays:4, seller:'Muslin House', location:'Narayanganj' },
  { id:'5', slug:'xiaomi-redmi-note-13', name:'Xiaomi Redmi Note 13 Pro', nameBn:'শাওমি রেডমি নোট ১৩', description:'200MP OIS camera, 5100mAh, 67W charging', price:35000, salePrice:29999, images:['https://placehold.co/400x400/f97316/fff?text=Redmi+13'], category:'Electronics', categoryBn:'ইলেকট্রনিক্স', brand:'Xiaomi', stock:55, rating:4.5, reviewCount:443, tags:['phone','xiaomi'], isNew:true, deliveryDays:2, seller:'MiStore BD', location:'Dhaka' },
  { id:'6', slug:'bkash-qr-scanner', name:'Smart QR POS Terminal', nameBn:'স্মার্ট QR টার্মিনাল', description:'bKash/Nagad/Rocket integrated, touchscreen', price:4500, salePrice:3800, images:['https://placehold.co/400x400/8b5cf6/fff?text=QR+POS'], category:'Business', categoryBn:'ব্যবসা', brand:'PayTech BD', stock:100, rating:4.4, reviewCount:89, tags:['pos','qr','payment'], deliveryDays:3, seller:'PayTech', location:'Dhaka' },
  { id:'7', slug:'pran-mango-juice-1l', name:'PRAN Mango Juice 1L', nameBn:'প্রাণ আম জুস', description:'100% real mango, no preservatives, 1 litre', price:120, salePrice:99, images:['https://placehold.co/400x400/fbbf24/fff?text=PRAN+Mango'], category:'Grocery', categoryBn:'মুদিখানা', brand:'PRAN', stock:500, rating:4.7, reviewCount:1200, tags:['juice','pran','mango'], deliveryDays:1, seller:'PRAN Foods', location:'Nationwide' },
  { id:'8', slug:'lenovo-ideapad-slim5', name:'Lenovo IdeaPad Slim 5', nameBn:'লেনোভো আইডিয়াপ্যাড', description:'AMD Ryzen 7, 16GB RAM, 512GB SSD, 14" OLED', price:95000, salePrice:84999, images:['https://placehold.co/400x400/0ea5e9/fff?text=Lenovo+Slim5'], category:'Electronics', categoryBn:'ইলেকট্রনিক্স', brand:'Lenovo', stock:18, rating:4.6, reviewCount:267, tags:['laptop','lenovo','amd'], isFeatured:true, deliveryDays:3, seller:'LaptopHouse BD', location:'Dhaka' },
  { id:'9', slug:'aarong-kurta-men', name:'Aarong Cotton Kurta', nameBn:'আড়ং কটন কুর্তা', description:'Handloom cotton, block print, exclusive Aarong design', price:3500, salePrice:2800, images:['https://placehold.co/400x400/84cc16/fff?text=Aarong+Kurta'], category:'Fashion', categoryBn:'ফ্যাশন', brand:'Aarong', stock:150, rating:4.7, reviewCount:342, tags:['kurta','aarong','traditional'], deliveryDays:2, seller:'Aarong Official', location:'Dhaka' },
  { id:'10', slug:'symphony-z55', name:'Symphony Z55 Pro', nameBn:'সিম্ফনি Z55 প্রো', description:'Local brand, 6.7" display, 5000mAh, dual camera', price:18000, salePrice:15499, images:['https://placehold.co/400x400/06b6d4/fff?text=Symphony+Z55'], category:'Electronics', categoryBn:'ইলেকট্রনিক্স', brand:'Symphony', stock:90, rating:4.1, reviewCount:156, tags:['phone','symphony','local'], isNew:true, deliveryDays:1, seller:'Symphony Official', location:'Dhaka' },
  { id:'11', slug:'rfl-pressure-cooker', name:'RFL Pressure Cooker 5L', nameBn:'আরএফএল প্রেশার কুকার', description:'5-litre stainless steel, safety valve, Bangladesh made', price:2200, salePrice:1799, images:['https://placehold.co/400x400/f59e0b/fff?text=RFL+Cooker'], category:'Home & Living', categoryBn:'হোম', brand:'RFL', stock:200, rating:4.5, reviewCount:890, tags:['kitchen','rfl','cookware'], deliveryDays:3, seller:'RFL Houseware', location:'Nationwide' },
  { id:'12', slug:'meril-splash-body-wash', name:'Meril Splash Body Wash', nameBn:'মেরিল স্প্ল্যাশ', description:'Fresh citrus scent, moisturizing formula, 500ml', price:350, salePrice:299, images:['https://placehold.co/400x400/a78bfa/fff?text=Meril+Splash'], category:'Beauty', categoryBn:'বিউটি', brand:'Meril', stock:300, rating:4.3, reviewCount:567, tags:['bodycare','meril','beauty'], deliveryDays:2, seller:'Meril Beauty', location:'Nationwide' },
]

router.get('/', (req, res) => {
  const { category, q, limit } = req.query as Record<string, string>
  let result = [...products]
  if (category && category !== 'All') result = result.filter(p => p.category === category)
  if (q) result = result.filter(p => p.name.toLowerCase().includes(q.toLowerCase()))
  if (limit) result = result.slice(0, parseInt(limit))
  res.json({ data: result, total: result.length })
})

router.get('/:slug', (req, res) => {
  const product = products.find(p => p.slug === req.params.slug)
  if (!product) return res.status(404).json({ error: 'Product not found' })
  res.json(product)
})

export default router
