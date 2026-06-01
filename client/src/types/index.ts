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
}

export interface CartItem extends Product {
  quantity: number
}

export interface User {
  id: string
  name: string
  email?: string
  phone?: string
  avatar?: string
  division?: string
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

export interface Address {
  country: string
  division: string
  district: string
  upazila: string
  addressLine: string
  postalCode: string
}

export interface Category {
  id: string
  name: string
  nameBn: string
  icon: string
  color: string
  count: number
  slug: string
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
