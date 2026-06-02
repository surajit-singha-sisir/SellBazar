export interface Product {
  id: string
  slug: string
  name: string
  nameBn: string
  description: string
  price: number
  salePrice?: number
  images: string[]
  category: string
  subcategory?: string
  categoryBn: string
  brand: string
  stock: number
  rating: number
  reviewCount: number
  tags: string[]
  isNew?: boolean
  isFeatured?: boolean
  deliveryDays?: number
  seller?: string
  location?: string
  createdAt?: string
}

export interface CartItem extends Product {
  quantity: number
}

export interface PhoneEntry {
  id: string
  number: string
  label: 'Primary' | 'Secondary' | 'Work' | 'Home' | 'Other'
  isPrimary: boolean
}

export interface Address {
  id: string
  label: 'Home' | 'Work' | 'Other'
  recipientName: string
  phone: string
  division: string
  district: string
  upazila: string
  addressLine: string
  postalCode: string
  isDefault: boolean
}

export interface User {
  id: string
  name: string
  email?: string
  phones?: PhoneEntry[]
  /** kept for backward compat */
  phone?: string
  avatar?: string
  division?: string
  gender?: 'male' | 'female' | 'other' | ''
  dateOfBirth?: string
  addresses?: Address[]
}

export interface Order {
  id: string
  items: CartItem[]
  total: number
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
  address: Address
  paymentMethod: 'bkash' | 'nagad' | 'cod' | 'card' | 'rocket'
  createdAt: string
}

export interface Subcategory {
  id: string
  slug: string
  name: string
  nameBn: string
  icon: string
  productCount?: number
}

export interface Category {
  id: string
  name: string
  nameBn: string
  icon: string
  color: string
  count: number
  slug: string
  productCount?: number
  subcategories?: Subcategory[]
}

export interface Banner {
  id: string
  title: string
  subtitle: string
  image: string
  link: string
  badge?: string
  gradient: string
}
