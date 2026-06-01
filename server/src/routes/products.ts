import { Router } from 'express'
import { requireAdmin } from '../middleware/auth.js'
import { createWriteStream, mkdirSync, existsSync } from 'fs'
import { join, extname } from 'path'
import { randomBytes } from 'crypto'

const router = Router()

// ── In-memory product store ───────────────────────────────────────────────────
let products = [
  { id:'1', slug:'samsung-galaxy-a55', name:'Samsung Galaxy A55 5G', nameBn:'স্যামসাং গ্যালাক্সি A55', description:'6.6" AMOLED, 50MP camera, 5000mAh', price:45000, salePrice:39999, images:['https://placehold.co/400x400/f97316/fff?text=Galaxy+A55'], category:'Electronics', categoryBn:'ইলেকট্রনিক্স', brand:'Samsung', stock:42, rating:4.6, reviewCount:318, tags:['phone','5g','samsung'], isNew:true, isFeatured:false, deliveryDays:2, seller:'TechWorld BD', location:'Dhaka', createdAt:'2025-01-10T10:00:00Z' },
  { id:'2', slug:'nike-air-max-2027', name:'Nike Air Max 2027', nameBn:'নাইকি এয়ার ম্যাক্স', description:'Future-forward cushioning, breathable mesh', price:12000, salePrice:9499, images:['https://placehold.co/400x400/6366f1/fff?text=Nike+Air'], category:'Fashion', categoryBn:'ফ্যাশন', brand:'Nike', stock:80, rating:4.8, reviewCount:512, tags:['shoes','sneakers'], isNew:false, isFeatured:false, deliveryDays:3, seller:'SportZone', location:'Chittagong', createdAt:'2025-01-12T10:00:00Z' },
  { id:'3', slug:'walton-primo-x7', name:'Walton Primo X7 Ultra', nameBn:'ওয়ালটন প্রিমো X7', description:'Made in Bangladesh, 108MP, 6000mAh', price:28000, salePrice:24999, images:['https://placehold.co/400x400/10b981/fff?text=Walton+X7'], category:'Electronics', categoryBn:'ইলেকট্রনিক্স', brand:'Walton', stock:65, rating:4.3, reviewCount:224, tags:['phone','walton','local'], isNew:false, isFeatured:true, deliveryDays:1, seller:'Walton Official', location:'Dhaka', createdAt:'2025-01-14T10:00:00Z' },
  { id:'4', slug:'muslin-saree-jamdani', name:'Jamdani Muslin Saree', nameBn:'জামদানি মসলিন শাড়ি', description:'Authentic Dhaka Muslin, UNESCO heritage craft', price:8500, salePrice:7200, images:['https://placehold.co/400x400/ec4899/fff?text=Jamdani'], category:'Fashion', categoryBn:'ফ্যাশন', brand:'Dhaka Muslin', stock:20, rating:4.9, reviewCount:187, tags:['saree','jamdani','traditional'], isNew:false, isFeatured:true, deliveryDays:4, seller:'Muslin House', location:'Narayanganj', createdAt:'2025-01-15T10:00:00Z' },
  { id:'5', slug:'xiaomi-redmi-note-13', name:'Xiaomi Redmi Note 13 Pro', nameBn:'শাওমি রেডমি নোট ১৩', description:'200MP OIS camera, 5100mAh, 67W charging', price:35000, salePrice:29999, images:['https://placehold.co/400x400/f97316/fff?text=Redmi+13'], category:'Electronics', categoryBn:'ইলেকট্রনিক্স', brand:'Xiaomi', stock:55, rating:4.5, reviewCount:443, tags:['phone','xiaomi'], isNew:true, isFeatured:false, deliveryDays:2, seller:'MiStore BD', location:'Dhaka', createdAt:'2025-01-16T10:00:00Z' },
  { id:'6', slug:'bkash-qr-scanner', name:'Smart QR POS Terminal', nameBn:'স্মার্ট QR টার্মিনাল', description:'bKash/Nagad/Rocket integrated, touchscreen', price:4500, salePrice:3800, images:['https://placehold.co/400x400/8b5cf6/fff?text=QR+POS'], category:'Business', categoryBn:'ব্যবসা', brand:'PayTech BD', stock:100, rating:4.4, reviewCount:89, tags:['pos','qr','payment'], isNew:false, isFeatured:false, deliveryDays:3, seller:'PayTech', location:'Dhaka', createdAt:'2025-01-17T10:00:00Z' },
  { id:'7', slug:'pran-mango-juice-1l', name:'PRAN Mango Juice 1L', nameBn:'প্রাণ আম জুস', description:'100% real mango, no preservatives, 1 litre', price:120, salePrice:99, images:['https://placehold.co/400x400/fbbf24/fff?text=PRAN+Mango'], category:'Grocery', categoryBn:'মুদিখানা', brand:'PRAN', stock:500, rating:4.7, reviewCount:1200, tags:['juice','pran','mango'], isNew:false, isFeatured:false, deliveryDays:1, seller:'PRAN Foods', location:'Nationwide', createdAt:'2025-01-18T10:00:00Z' },
  { id:'8', slug:'lenovo-ideapad-slim5', name:'Lenovo IdeaPad Slim 5', nameBn:'লেনোভো আইডিয়াপ্যাড', description:'AMD Ryzen 7, 16GB RAM, 512GB SSD, 14" OLED', price:95000, salePrice:84999, images:['https://placehold.co/400x400/0ea5e9/fff?text=Lenovo+Slim5'], category:'Electronics', categoryBn:'ইলেকট্রনিক্স', brand:'Lenovo', stock:18, rating:4.6, reviewCount:267, tags:['laptop','lenovo','amd'], isNew:false, isFeatured:true, deliveryDays:3, seller:'LaptopHouse BD', location:'Dhaka', createdAt:'2025-01-19T10:00:00Z' },
  { id:'9', slug:'aarong-kurta-men', name:'Aarong Cotton Kurta', nameBn:'আড়ং কটন কুর্তা', description:'Handloom cotton, block print, exclusive Aarong design', price:3500, salePrice:2800, images:['https://placehold.co/400x400/84cc16/fff?text=Aarong+Kurta'], category:'Fashion', categoryBn:'ফ্যাশন', brand:'Aarong', stock:150, rating:4.7, reviewCount:342, tags:['kurta','aarong','traditional'], isNew:false, isFeatured:false, deliveryDays:2, seller:'Aarong Official', location:'Dhaka', createdAt:'2025-01-20T10:00:00Z' },
  { id:'10', slug:'symphony-z55', name:'Symphony Z55 Pro', nameBn:'সিম্ফনি Z55 প্রো', description:'Local brand, 6.7" display, 5000mAh, dual camera', price:18000, salePrice:15499, images:['https://placehold.co/400x400/06b6d4/fff?text=Symphony+Z55'], category:'Electronics', categoryBn:'ইলেকট্রনিক্স', brand:'Symphony', stock:90, rating:4.1, reviewCount:156, tags:['phone','symphony','local'], isNew:true, isFeatured:false, deliveryDays:1, seller:'Symphony Official', location:'Dhaka', createdAt:'2025-01-21T10:00:00Z' },
  { id:'11', slug:'rfl-pressure-cooker', name:'RFL Pressure Cooker 5L', nameBn:'আরএফএল প্রেশার কুকার', description:'5-litre stainless steel, safety valve, Bangladesh made', price:2200, salePrice:1799, images:['https://placehold.co/400x400/f59e0b/fff?text=RFL+Cooker'], category:'Home & Living', categoryBn:'হোম', brand:'RFL', stock:200, rating:4.5, reviewCount:890, tags:['kitchen','rfl','cookware'], isNew:false, isFeatured:false, deliveryDays:3, seller:'RFL Houseware', location:'Nationwide', createdAt:'2025-01-22T10:00:00Z' },
  { id:'12', slug:'meril-splash-body-wash', name:'Meril Splash Body Wash', nameBn:'মেরিল স্প্ল্যাশ', description:'Fresh citrus scent, moisturizing formula, 500ml', price:350, salePrice:299, images:['https://placehold.co/400x400/a78bfa/fff?text=Meril+Splash'], category:'Beauty', categoryBn:'বিউটি', brand:'Meril', stock:300, rating:4.3, reviewCount:567, tags:['bodycare','meril','beauty'], isNew:false, isFeatured:false, deliveryDays:2, seller:'Meril Beauty', location:'Nationwide', createdAt:'2025-01-23T10:00:00Z' },
]

export { products }
export default router

function toSlug(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}

// ── Upload directory setup ───────────────────────────────────────────────────
const UPLOAD_DIR = join(process.cwd(), 'uploads')
if (!existsSync(UPLOAD_DIR)) mkdirSync(UPLOAD_DIR, { recursive: true })

// ── PUBLIC routes ─────────────────────────────────────────────────────────────
router.get('/', (req, res) => {
  const { category, q, limit, featured, sortBy, order } = req.query as Record<string, string>
  let result = [...products]
  if (category && category !== 'All') result = result.filter(p => p.category === category)
  if (q) result = result.filter(p => p.name.toLowerCase().includes(q.toLowerCase()) || p.brand.toLowerCase().includes(q.toLowerCase()))
  if (featured === 'true') result = result.filter(p => p.isFeatured)
  // Sorting
  if (sortBy) {
    const dir = order === 'desc' ? -1 : 1
    result.sort((a: any, b: any) => {
      if (a[sortBy] < b[sortBy]) return -1 * dir
      if (a[sortBy] > b[sortBy]) return 1 * dir
      return 0
    })
  }
  if (limit) result = result.slice(0, parseInt(limit))
  res.json({ data: result, total: result.length })
})

router.get('/:slug', (req, res) => {
  const product = products.find(p => p.slug === req.params.slug || p.id === req.params.slug)
  if (!product) return res.status(404).json({ error: 'Product not found' })
  res.json(product)
})

// ── Image upload (admin protected) ───────────────────────────────────────────
router.post('/upload-image', requireAdmin, (req: any, res) => {
  const ct = req.headers['content-type'] ?? ''
  if (!ct.includes('multipart/form-data')) {
    return res.status(400).json({ error: 'Multipart form data required' })
  }
  const boundary = ct.split('boundary=')[1]
  if (!boundary) return res.status(400).json({ error: 'No boundary' })

  const chunks: Buffer[] = []
  req.on('data', (chunk: Buffer) => chunks.push(chunk))
  req.on('end', () => {
    try {
      const buf = Buffer.concat(chunks)
      const sep = Buffer.from('--' + boundary)
      let start = buf.indexOf(sep) + sep.length + 2 // skip \r\n
      start = buf.indexOf(sep, start) // go to file part
      // find file header end
      const headerEnd = buf.indexOf(Buffer.from('\r\n\r\n'), start)
      if (headerEnd === -1) return res.status(400).json({ error: 'Malformed upload' })
      const header = buf.slice(start + sep.length + 2, headerEnd).toString()
      const mimeMatch = header.match(/Content-Type:\s*(\S+)/)
      const mime = mimeMatch ? mimeMatch[1] : 'image/jpeg'
      const extMap: Record<string, string> = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp', 'image/gif': '.gif' }
      const ext = extMap[mime] ?? '.jpg'
      const filename = `${randomBytes(8).toString('hex')}${ext}`
      const fileStart = headerEnd + 4 // skip \r\n\r\n
      const fileEnd = buf.indexOf(Buffer.from('\r\n--' + boundary), fileStart)
      const fileData = buf.slice(fileStart, fileEnd === -1 ? undefined : fileEnd)
      const filePath = join(UPLOAD_DIR, filename)
      const ws = createWriteStream(filePath)
      ws.write(fileData)
      ws.end()
      ws.on('finish', () => {
        res.json({ url: `/uploads/${filename}`, filename })
      })
    } catch (e) {
      res.status(500).json({ error: 'Upload failed' })
    }
  })
})
