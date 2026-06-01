import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Product } from '@/types'

// Mock products — Bangladesh-relevant catalog
const mockProducts: Product[] = [
  { id:'1', slug:'samsung-galaxy-a55', name:'Samsung Galaxy A55 5G', nameBn:'স্যামসাং গ্যালাক্সি A55', description:'6.6" AMOLED, 50MP camera, 5000mAh', price:45000, salePrice:39999, images:['https://placehold.co/400x400/f97316/fff?text=Galaxy+A55'], category:'Electronics', categoryBn:'ইলেকট্রনিক্স', brand:'Samsung', stock:42, rating:4.6, reviewCount:318, tags:['phone','5g','samsung'], isNew:true, deliveryDays:2, seller:'TechWorld BD', location:'Dhaka' },
  { id:'2', slug:'nike-air-max-2027', name:'Nike Air Max 2027', nameBn:'নাইকি এয়ার ম্যাক্স', description:'Future-forward cushioning, breathable mesh', price:12000, salePrice:9499, images:['https://placehold.co/400x400/6366f1/fff?text=Nike+Air'], category:'Fashion', categoryBn:'ফ্যাশন', brand:'Nike', stock:80, rating:4.8, reviewCount:512, tags:['shoes','sneakers'], deliveryDays:3, seller:'SportZone', location:'Chittagong' },
  { id:'3', slug:'walton-primo-x7', name:'Walton Primo X7 Ultra', nameBn:'ওয়ালটন প্রিমো X7', description:'Made in Bangladesh, 108MP, 6000mAh', price:28000, salePrice:24999, images:['https://placehold.co/400x400/10b981/fff?text=Walton+X7'], category:'Electronics', categoryBn:'ইলেকট্রনিক্স', brand:'Walton', stock:65, rating:4.3, reviewCount:224, tags:['phone','walton','local'], isFeatured:true, deliveryDays:1, seller:'Walton Official', location:'Dhaka' },
  { id:'4', slug:'muslin-saree-jamdani', name:'Jamdani Muslin Saree', nameBn:'জামদানি মসলিন শাড়ি', description:'Authentic Dhaka Muslin, UNESCO heritage craft', price:8500, salePrice:7200, images:['https://placehold.co/400x400/ec4899/fff?text=Jamdani'], category:'Fashion', categoryBn:'ফ্যাশন', brand:'Dhaka Muslin', stock:20, rating:4.9, reviewCount:187, tags:['saree','jamdani','traditional'], isFeatured:true, deliveryDays:4, seller:'Muslin House', location:'Narayanganj' },
  { id:'5', slug:'xiaomi-redmi-note-13', name:'Xiaomi Redmi Note 13 Pro', nameBn:'শাওমি রেডমি নোট ১৩', description:'200MP OIS camera, 5100mAh, 67W charging', price:35000, salePrice:29999, images:['https://placehold.co/400x400/f97316/fff?text=Redmi+13'], category:'Electronics', categoryBn:'ইলেকট্রনিক্স', brand:'Xiaomi', stock:55, rating:4.5, reviewCount:443, tags:['phone','xiaomi'], isNew:true, deliveryDays:2, seller:'MiStore BD', location:'Dhaka' },
  { id:'6', slug:'bkash-qr-scanner', name:'Smart QR POS Terminal', nameBn:'স্মার্ট QR টার্মিনাল', description:'bKash/Nagad/Rocket integrated, touchscreen', price:4500, salePrice:3800, images:['https://placehold.co/400x400/8b5cf6/fff?text=QR+POS'], category:'Business', categoryBn:'ব্যবসা', brand:'PayTech BD', stock:100, rating:4.4, reviewCount:89, tags:['pos','qr','payment'], deliveryDays:3, seller:'PayTech', location:'Dhaka' },
  { id:'7', slug:'pran-mango-juice-1l', name:'PRAN Mango Juice 1L', nameBn:'প্রাণ আম জুস', description:'100% real mango, no preservatives, 1 litre', price:120, salePrice:99, images:['https://placehold.co/400x400/fbbf24/fff?text=PRAN+Mango'], category:'Grocery', categoryBn:'মুদিখানা', brand:'PRAN', stock:500, rating:4.7, reviewCount:1200, tags:['juice','pran','mango'], deliveryDays:1, seller:'PRAN Foods', location:'Nationwide' },
  { id:'8', slug:'lenovo-ideapad-slim5', name:'Lenovo IdeaPad Slim 5', nameBn:'লেনোভো আইডিয়াপ্যাড', description:'AMD Ryzen 7, 16GB RAM, 512GB SSD, 14" OLED', price:95000, salePrice:84999, images:['https://placehold.co/400x400/0ea5e9/fff?text=Lenovo+Slim5'], category:'Electronics', categoryBn:'ইলেকট্রনিক্স', brand:'Lenovo', stock:18, rating:4.6, reviewCount:267, tags:['laptop','lenovo','amd'], isFeatured:true, deliveryDays:3, seller:'LaptopHouse BD', location:'Dhaka' },
]

export const useProductStore = defineStore('products', () => {
  const products = ref<Product[]>(mockProducts)
  const isLoading = ref(false)
  const searchQuery = ref('')
  const activeCategory = ref('All')

  const categories = computed(() => ['All', ...new Set(products.value.map(p => p.category))])

  const filtered = computed(() => {
    let list = products.value
    if (activeCategory.value !== 'All') list = list.filter(p => p.category === activeCategory.value)
    if (searchQuery.value.trim()) {
      const q = searchQuery.value.toLowerCase()
      list = list.filter(p => p.name.toLowerCase().includes(q) || p.tags.some(t => t.includes(q)))
    }
    return list
  })

  const featured  = computed(() => products.value.filter(p => p.isFeatured))
  const newArr    = computed(() => products.value.filter(p => p.isNew))

  function getBySlug(slug: string) {
    return products.value.find(p => p.slug === slug)
  }

  async function fetchProducts() {
    isLoading.value = true
    await new Promise(r => setTimeout(r, 800))
    isLoading.value = false
  }

  return { products, isLoading, searchQuery, activeCategory, categories, filtered, featured, newArr, getBySlug, fetchProducts }
})
