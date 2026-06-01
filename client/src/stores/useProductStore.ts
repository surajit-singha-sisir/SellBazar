import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Product } from '@/types'

// Mock products — Bangladesh-relevant catalog with real dummy images
const mockProducts: Product[] = [
  // ── Electronics ──────────────────────────────────────────────────────────────
  {
    id: '1', slug: 'samsung-galaxy-a55',
    name: 'Samsung Galaxy A55 5G', nameBn: 'স্যামসাং গ্যালাক্সি A55',
    description: '6.6" Super AMOLED, 50MP OIS camera, 5000mAh, 5G ready.',
    price: 45000, salePrice: 39999,
    images: ['https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=400&h=400&fit=crop', 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=400&h=400&fit=crop', 'https://images.unsplash.com/photo-1574944985070-8f3ebc6b79d2?w=400&h=400&fit=crop'],
    category: 'Electronics', categoryBn: 'ইলেকট্রনিক্স', brand: 'Samsung',
    stock: 42, rating: 4.6, reviewCount: 318,
    tags: ['phone', '5g', 'samsung'], isNew: true, deliveryDays: 2,
    seller: 'TechWorld BD', location: 'Dhaka',
  },
  {
    id: '2', slug: 'walton-primo-x7',
    name: 'Walton Primo X7 Ultra', nameBn: 'ওয়ালটন প্রিমো X7',
    description: 'Made in Bangladesh · 108MP · 6000mAh · 6.7" FHD+',
    price: 28000, salePrice: 24999,
    images: ['https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400&h=400&fit=crop', 'https://images.unsplash.com/photo-1556656793-08538906a9f8?w=400&h=400&fit=crop', 'https://images.unsplash.com/photo-1580910051074-3eb694886505?w=400&h=400&fit=crop'],
    category: 'Electronics', categoryBn: 'ইলেকট্রনিক্স', brand: 'Walton',
    stock: 65, rating: 4.3, reviewCount: 224,
    tags: ['phone', 'walton', 'local'], isFeatured: true, deliveryDays: 1,
    seller: 'Walton Official', location: 'Dhaka',
  },
  {
    id: '3', slug: 'xiaomi-redmi-note-13',
    name: 'Xiaomi Redmi Note 13 Pro', nameBn: 'শাওমি রেডমি নোট ১৩',
    description: '200MP OIS camera · 5100mAh · 67W HyperCharge · AMOLED',
    price: 35000, salePrice: 29999,
    images: ['https://images.unsplash.com/photo-1585060544812-6b45742d762f?w=400&h=400&fit=crop', 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=400&h=400&fit=crop', 'https://images.unsplash.com/photo-1546054454-aa26e2b734c7?w=400&h=400&fit=crop'],
    category: 'Electronics', categoryBn: 'ইলেকট্রনিক্স', brand: 'Xiaomi',
    stock: 55, rating: 4.5, reviewCount: 443,
    tags: ['phone', 'xiaomi'], isNew: true, deliveryDays: 2,
    seller: 'MiStore BD', location: 'Dhaka',
  },
  {
    id: '4', slug: 'lenovo-ideapad-slim5',
    name: 'Lenovo IdeaPad Slim 5', nameBn: 'লেনোভো আইডিয়াপ্যাড স্লিম ৫',
    description: 'AMD Ryzen 7 · 16GB RAM · 512GB SSD · 14" OLED · Backlit KB',
    price: 95000, salePrice: 84999,
    images: ['https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=400&h=400&fit=crop', 'https://images.unsplash.com/photo-1525547719571-a2d4ac8945e2?w=400&h=400&fit=crop', 'https://images.unsplash.com/photo-1531297484001-80022131f5a1?w=400&h=400&fit=crop'],
    category: 'Electronics', categoryBn: 'ইলেকট্রনিক্স', brand: 'Lenovo',
    stock: 18, rating: 4.6, reviewCount: 267,
    tags: ['laptop', 'lenovo', 'amd'], isFeatured: true, deliveryDays: 3,
    seller: 'LaptopHouse BD', location: 'Dhaka',
  },
  {
    id: '5', slug: 'sony-wh1000xm5',
    name: 'Sony WH-1000XM5 Headphones', nameBn: 'সনি হেডফোন XM5',
    description: 'Industry-leading ANC · 30hr battery · LDAC Hi-Res · Foldable',
    price: 32000, salePrice: 27500,
    images: ['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=400&fit=crop', 'https://images.unsplash.com/photo-1583394838336-acd977736f90?w=400&h=400&fit=crop', 'https://images.unsplash.com/photo-1484704849700-f032a568e944?w=400&h=400&fit=crop'],
    category: 'Electronics', categoryBn: 'ইলেকট্রনিক্স', brand: 'Sony',
    stock: 30, rating: 4.8, reviewCount: 532,
    tags: ['headphones', 'anc', 'sony'], isFeatured: true, deliveryDays: 3,
    seller: 'AudioZone BD', location: 'Dhaka',
  },
  {
    id: '6', slug: 'apple-watch-s9',
    name: 'Apple Watch Series 9 (41mm)', nameBn: 'অ্যাপল ওয়াচ সিরিজ ৯',
    description: 'S9 SiP chip · Always-On Display · ECG · Blood Oxygen · WR50',
    price: 55000, salePrice: 49999,
    images: ['https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=400&h=400&fit=crop', 'https://images.unsplash.com/photo-1551816230-ef5deaed4a26?w=400&h=400&fit=crop', 'https://images.unsplash.com/photo-1559734840-f9509ee5677f?w=400&h=400&fit=crop'],
    category: 'Electronics', categoryBn: 'ইলেকট্রনিক্স', brand: 'Apple',
    stock: 15, rating: 4.9, reviewCount: 189,
    tags: ['smartwatch', 'apple', 'wearable'], isNew: true, deliveryDays: 2,
    seller: 'iZone Bangladesh', location: 'Dhaka',
  },
  {
    id: '7', slug: 'canon-eos-r50',
    name: 'Canon EOS R50 Mirrorless Camera', nameBn: 'ক্যানন EOS R50 ক্যামেরা',
    description: '24.2MP APS-C · 4K Video · Dual Pixel CMOS AF · Wi-Fi · Vlog',
    price: 85000, salePrice: 74999,
    images: ['https://images.unsplash.com/photo-1502982720700-bfff97f2ecac?w=400&h=400&fit=crop', 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=400&h=400&fit=crop', 'https://images.unsplash.com/photo-1542496658-e33a6d0d50f6?w=400&h=400&fit=crop'],
    category: 'Electronics', categoryBn: 'ইলেকট্রনিক্স', brand: 'Canon',
    stock: 12, rating: 4.7, reviewCount: 98,
    tags: ['camera', 'canon', 'mirrorless'], deliveryDays: 4,
    seller: 'PixelPro BD', location: 'Dhaka',
  },
  {
    id: '8', slug: 'samsung-65-qled-tv',
    name: 'Samsung 65" QLED 4K Smart TV', nameBn: 'স্যামসাং QLED ৬৫" টিভি',
    description: 'Quantum HDR · 120Hz · Dolby Atmos · Tizen OS · Gaming Mode',
    price: 145000, salePrice: 129000,
    images: ['https://images.unsplash.com/photo-1593359677879-a4bb92f829e1?w=400&h=400&fit=crop', 'https://images.unsplash.com/photo-1461151304267-38535e780c79?w=400&h=400&fit=crop', 'https://images.unsplash.com/photo-1567690187548-f07b1d7bf5a9?w=400&h=400&fit=crop'],
    category: 'Electronics', categoryBn: 'ইলেকট্রনিক্স', brand: 'Samsung',
    stock: 8, rating: 4.7, reviewCount: 143,
    tags: ['tv', 'qled', '4k', 'samsung'], isFeatured: true, deliveryDays: 5,
    seller: 'TechWorld BD', location: 'Dhaka',
  },

  // ── Fashion ──────────────────────────────────────────────────────────────────
  {
    id: '9', slug: 'nike-air-max-2027',
    name: 'Nike Air Max 2027 Sneakers', nameBn: 'নাইকি এয়ার ম্যাক্স',
    description: 'React foam midsole · Breathable mesh upper · Rubber outsole',
    price: 12000, salePrice: 9499,
    images: ['https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&h=400&fit=crop', 'https://images.unsplash.com/photo-1491553895911-0055eca6402d?w=400&h=400&fit=crop', 'https://images.unsplash.com/photo-1600185365926-3a2ce3cdb9eb?w=400&h=400&fit=crop'],
    category: 'Fashion', categoryBn: 'ফ্যাশন', brand: 'Nike',
    stock: 80, rating: 4.8, reviewCount: 512,
    tags: ['shoes', 'sneakers', 'nike'], deliveryDays: 3,
    seller: 'SportZone', location: 'Chittagong',
  },
  {
    id: '10', slug: 'muslin-saree-jamdani',
    name: 'Jamdani Muslin Saree', nameBn: 'জামদানি মসলিন শাড়ি',
    description: 'Authentic Dhaka Muslin · UNESCO Heritage Craft · 6 yards',
    price: 8500, salePrice: 7200,
    images: ['https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=400&h=400&fit=crop', 'https://images.unsplash.com/photo-1583391733981-8498408ee4b6?w=400&h=400&fit=crop', 'https://images.unsplash.com/photo-1617137968427-85924c800a22?w=400&h=400&fit=crop'],
    category: 'Fashion', categoryBn: 'ফ্যাশন', brand: 'Dhaka Muslin',
    stock: 20, rating: 4.9, reviewCount: 187,
    tags: ['saree', 'jamdani', 'traditional'], isFeatured: true, deliveryDays: 4,
    seller: 'Muslin House', location: 'Narayanganj',
  },
  {
    id: '11', slug: 'polo-shirt-men',
    name: "Men's Premium Cotton Polo Shirt", nameBn: 'পুরুষ পোলো শার্ট',
    description: '100% Egyptian Cotton · Slim Fit · Available S-3XL · 12 colors',
    price: 1800, salePrice: 1299,
    images: ['https://images.unsplash.com/photo-1586790170083-2f9ceadc732d?w=400&h=400&fit=crop', 'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=400&h=400&fit=crop', 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&h=400&fit=crop'],
    category: 'Fashion', categoryBn: 'ফ্যাশন', brand: 'Thread & Co',
    stock: 200, rating: 4.5, reviewCount: 892,
    tags: ['shirt', 'polo', 'men', 'cotton'], isNew: true, deliveryDays: 2,
    seller: 'StyleHub BD', location: 'Dhaka',
  },
  {
    id: '12', slug: 'ladies-kurti-set',
    name: "Ladies Embroidered Kurti Set", nameBn: 'লেডিজ এমব্রয়ডারড কুর্তি',
    description: 'Hand embroidery · Cotton-blend · 3-piece set · Festive wear',
    price: 3500, salePrice: 2799,
    images: ['https://images.unsplash.com/photo-1594938298603-c8148c4b2ef4?w=400&h=400&fit=crop', 'https://images.unsplash.com/photo-1614252235316-8c857196f400?w=400&h=400&fit=crop', 'https://images.unsplash.com/photo-1602293589930-45aad59ba3ab?w=400&h=400&fit=crop'],
    category: 'Fashion', categoryBn: 'ফ্যাশন', brand: 'Aarong',
    stock: 45, rating: 4.7, reviewCount: 341,
    tags: ['kurti', 'ladies', 'eid', 'traditional'], isFeatured: true, deliveryDays: 3,
    seller: 'Aarong Official', location: 'Dhaka',
  },

  // ── Grocery ──────────────────────────────────────────────────────────────────
  {
    id: '13', slug: 'pran-mango-juice-1l',
    name: 'PRAN Mango Juice 1L (Pack of 6)', nameBn: 'প্রাণ আম জুস ১ লিটার',
    description: '100% real mango · No preservatives · Tetra pack · Fresh taste',
    price: 720, salePrice: 599,
    images: ['https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=400&h=400&fit=crop', 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=400&h=400&fit=crop', 'https://images.unsplash.com/photo-1603569283847-aa295f0d016a?w=400&h=400&fit=crop'],
    category: 'Grocery', categoryBn: 'মুদিখানা', brand: 'PRAN',
    stock: 500, rating: 4.7, reviewCount: 1200,
    tags: ['juice', 'pran', 'mango'], deliveryDays: 1,
    seller: 'PRAN Foods', location: 'Nationwide',
  },
  {
    id: '14', slug: 'premium-basmati-rice-5kg',
    name: 'Premium Basmati Rice 5kg', nameBn: 'প্রিমিয়াম বাসমতি চাল ৫ কেজি',
    description: 'Long-grain aged basmati · Low GI · Fragrant · Non-sticky',
    price: 980, salePrice: 849,
    images: ['https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400&h=400&fit=crop', 'https://images.unsplash.com/photo-1536304993881-ff6e9eefa2a6?w=400&h=400&fit=crop', 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=400&h=400&fit=crop'],
    category: 'Grocery', categoryBn: 'মুদিখানা', brand: 'Gold Coin',
    stock: 300, rating: 4.6, reviewCount: 540,
    tags: ['rice', 'basmati', 'grocery'], deliveryDays: 1,
    seller: 'Meena Bazaar', location: 'Dhaka',
  },

  // ── Beauty ───────────────────────────────────────────────────────────────────
  {
    id: '15', slug: 'loreal-serum-vitamin-c',
    name: "L'Oréal Revitalift Vitamin C Serum", nameBn: 'লোরিয়াল ভিটামিন C সিরাম',
    description: '10% pure Vitamin C · Anti-aging · Brightening · 30ml',
    price: 2200, salePrice: 1799,
    images: ['https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=400&h=400&fit=crop', 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=400&h=400&fit=crop', 'https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=400&h=400&fit=crop'],
    category: 'Beauty', categoryBn: 'বিউটি', brand: "L'Oréal",
    stock: 75, rating: 4.6, reviewCount: 423,
    tags: ['serum', 'skincare', 'vitamin-c'], isNew: true, deliveryDays: 2,
    seller: 'BeautyWorld BD', location: 'Dhaka',
  },
  {
    id: '16', slug: 'perfume-oud-collection',
    name: 'Rasasi Oud Al Layl EDP 100ml', nameBn: 'রাসাসি উদ পারফিউম',
    description: 'Arabian Oud · Long lasting 12hr · Unisex · Woody-floral',
    price: 4500, salePrice: 3800,
    images: ['https://images.unsplash.com/photo-1541643600914-78b084683702?w=400&h=400&fit=crop', 'https://images.unsplash.com/photo-1547887538-047ad8b7fd58?w=400&h=400&fit=crop', 'https://images.unsplash.com/photo-1588405748880-12d1d2a59f75?w=400&h=400&fit=crop'],
    category: 'Beauty', categoryBn: 'বিউটি', brand: 'Rasasi',
    stock: 40, rating: 4.8, reviewCount: 267,
    tags: ['perfume', 'oud', 'fragrance'], deliveryDays: 3,
    seller: 'Fragrance House BD', location: 'Dhaka',
  },

  // ── Home & Living ─────────────────────────────────────────────────────────────
  {
    id: '17', slug: 'walton-air-conditioner-1ton',
    name: 'Walton WSI-KRYSTALINE-12C AC 1 Ton', nameBn: 'ওয়ালটন ১ টন এসি',
    description: 'Inverter · Wi-Fi Control · Auto-Clean · Energy Saving A+++ · R32',
    price: 55000, salePrice: 47999,
    images: ['https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=400&h=400&fit=crop', 'https://images.unsplash.com/photo-1635048424329-a9bfb146d7aa?w=400&h=400&fit=crop', 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=400&fit=crop'],
    category: 'Home', categoryBn: 'হোম', brand: 'Walton',
    stock: 25, rating: 4.5, reviewCount: 178,
    tags: ['ac', 'inverter', 'walton', 'home'], isFeatured: true, deliveryDays: 5,
    seller: 'Walton Official', location: 'Dhaka',
  },
  {
    id: '18', slug: 'electric-rice-cooker-5l',
    name: 'Miyako 5L Digital Rice Cooker', nameBn: 'মিয়াকো ডিজিটাল রাইস কুকার',
    description: 'Multi-cook · Keep warm · Non-stick inner pot · Steamer tray',
    price: 3200, salePrice: 2699,
    images: ['https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=400&h=400&fit=crop', 'https://images.unsplash.com/photo-1585515320310-259814833e62?w=400&h=400&fit=crop', 'https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=400&h=400&fit=crop'],
    category: 'Home', categoryBn: 'হোম', brand: 'Miyako',
    stock: 90, rating: 4.4, reviewCount: 562,
    tags: ['kitchen', 'rice-cooker', 'miyako'], deliveryDays: 2,
    seller: 'HomePlus BD', location: 'Dhaka',
  },

  // ── Sports ────────────────────────────────────────────────────────────────────
  {
    id: '19', slug: 'cricket-bat-gp',
    name: 'GP Pro Edition Cricket Bat (English Willow)', nameBn: 'জিপি ক্রিকেট ব্যাট',
    description: 'Grade 1 English Willow · Full size · Pre-knocked · Cane handle',
    price: 9500, salePrice: 7999,
    images: ['https://images.unsplash.com/photo-1531415074968-036ba1b575da?w=400&h=400&fit=crop', 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=400&h=400&fit=crop', 'https://images.unsplash.com/photo-1624526267942-ab0ff8a3e972?w=400&h=400&fit=crop'],
    category: 'Sports', categoryBn: 'স্পোর্টস', brand: 'GP',
    stock: 35, rating: 4.7, reviewCount: 143,
    tags: ['cricket', 'bat', 'willow'], isNew: true, deliveryDays: 3,
    seller: 'Sports Arena BD', location: 'Dhaka',
  },
  {
    id: '20', slug: 'yoga-mat-6mm',
    name: 'Premium TPE Yoga Mat 6mm', nameBn: 'প্রিমিয়াম যোগা ম্যাট',
    description: 'Non-slip · Eco-friendly TPE · Double-layer · Carry strap',
    price: 1800, salePrice: 1399,
    images: ['https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=400&fit=crop', 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400&h=400&fit=crop', 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=400&h=400&fit=crop'],
    category: 'Sports', categoryBn: 'স্পোর্টস', brand: 'FitLife',
    stock: 120, rating: 4.5, reviewCount: 289,
    tags: ['yoga', 'fitness', 'mat'], deliveryDays: 2,
    seller: 'FitZone BD', location: 'Dhaka',
  },

  // ── Business ──────────────────────────────────────────────────────────────────
  {
    id: '21', slug: 'bkash-qr-scanner',
    name: 'Smart QR POS Terminal', nameBn: 'স্মার্ট QR POS টার্মিনাল',
    description: 'bKash/Nagad/Rocket · Touchscreen · Thermal printer · 4G SIM',
    price: 4500, salePrice: 3800,
    images: ['https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=400&h=400&fit=crop', 'https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=400&h=400&fit=crop', 'https://images.unsplash.com/photo-1598971457999-ca4ef48a9a71?w=400&h=400&fit=crop'],
    category: 'Business', categoryBn: 'ব্যবসা', brand: 'PayTech BD',
    stock: 100, rating: 4.4, reviewCount: 89,
    tags: ['pos', 'qr', 'payment'], deliveryDays: 3,
    seller: 'PayTech', location: 'Dhaka',
  },

  // ── Books ─────────────────────────────────────────────────────────────────────
  {
    id: '22', slug: 'humayun-ahmed-himu-collection',
    name: 'হুমায়ূন আহমেদ হিমু সমগ্র (৫ খণ্ড)', nameBn: 'হুমায়ূন আহমেদ হিমু সমগ্র',
    description: 'Complete Himu series · 5 volumes · Hardcover · Bhasha Prakash',
    price: 1800, salePrice: 1499,
    images: ['https://images.unsplash.com/photo-1512820790803-83ca734da794?w=400&h=400&fit=crop', 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400&h=400&fit=crop', 'https://images.unsplash.com/photo-1495446815901-a7297e633e8d?w=400&h=400&fit=crop'],
    category: 'Books', categoryBn: 'বই', brand: 'Bhasha Prakash',
    stock: 150, rating: 5.0, reviewCount: 987,
    tags: ['bangla', 'novel', 'humayun', 'himu'], isFeatured: true, deliveryDays: 2,
    seller: 'Rokomari', location: 'Dhaka',
  },
  {
    id: '23', slug: 'atomic-habits-bangla',
    name: 'Atomic Habits (Bangla Translation)', nameBn: 'অ্যাটমিক হ্যাবিটস (বাংলা)',
    description: 'James Clear · Bangla Edition · Paperback · Self-help bestseller',
    price: 450, salePrice: 380,
    images: ['https://images.unsplash.com/photo-1589829085413-56de8ae18c73?w=400&h=400&fit=crop', 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400&h=400&fit=crop', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop'],
    category: 'Books', categoryBn: 'বই', brand: 'Ananya',
    stock: 200, rating: 4.8, reviewCount: 654,
    tags: ['self-help', 'habits', 'bangla-book'], isNew: true, deliveryDays: 2,
    seller: 'Rokomari', location: 'Dhaka',
  },
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

  const featured = computed(() => products.value.filter(p => p.isFeatured))
  const newArr   = computed(() => products.value.filter(p => p.isNew))

  function getBySlug(slug: string) {
    return products.value.find(p => p.slug === slug)
  }

  async function fetchProducts() {
    isLoading.value = true
    await new Promise(r => setTimeout(r, 500))
    isLoading.value = false
  }

  return { products, isLoading, searchQuery, activeCategory, categories, filtered, featured, newArr, getBySlug, fetchProducts }
})
