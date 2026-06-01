# SellBazar 🛍️
### বাংলাদেশের সেরা মার্কেটপ্লেস · Bangladesh's Next-Gen Marketplace

A full-stack e-commerce web application designed with a 2027 aesthetic — built with Vue 3, TypeScript, Tailwind CSS, and an Express API backend.

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm 9+

### Install all dependencies
```bash
npm run install:all
```

### Run dev servers (client + server simultaneously)
```bash
npm run dev
```

This launches:
- **Client** → http://localhost:5173
- **API Server** → http://localhost:4000

---

## 📁 Project Structure

```
SellBazar/
├── client/                  # Vue 3 + Vite frontend
│   ├── src/
│   │   ├── assets/styles/   # SCSS design tokens + global styles
│   │   ├── components/
│   │   │   ├── cart/        # CartDrawer, CartItem
│   │   │   ├── layout/      # AppHeader, AppFooter
│   │   │   └── product/     # ProductCard
│   │   ├── composables/
│   │   ├── router/          # Vue Router routes
│   │   ├── stores/          # Pinia stores (cart, auth, wishlist, products, theme)
│   │   ├── types/           # TypeScript interfaces
│   │   └── views/
│   │       ├── HomeView.vue
│   │       ├── ProductListView.vue
│   │       ├── ProductDetailView.vue
│   │       ├── CartView.vue
│   │       ├── CheckoutView.vue
│   │       ├── DealsView.vue
│   │       ├── NotFoundView.vue
│   │       ├── auth/        # LoginView, RegisterView
│   │       └── account/     # OrdersView, ProfileView, WishlistView
│   └── public/
│       └── favicon.svg
│
└── server/                  # Express + TypeScript API
    └── src/
        ├── index.ts         # Entry point (port 4000)
        └── routes/
            ├── products.ts  # GET /api/products, GET /api/products/:slug
            ├── auth.ts      # POST /api/auth/login, /register
            └── orders.ts    # GET/POST /api/orders
```

---

## 🛒 Features

| Feature | Details |
|---|---|
| 🏠 Home | Hero, categories, featured & new products, live countdown deal timer |
| 📦 Products | Grid with category sidebar, price filters, sort, search |
| 🔍 Product Detail | Images, ratings, delivery info, add to cart, wishlist, related products |
| 🛒 Cart | Quantity controls, savings display, cart drawer + full cart page |
| 💳 Checkout | Address form (Bangladesh divisions), multi-payment (bKash, Nagad, Rocket, Card, COD), order confirmation modal |
| 🔥 Deals | Flash sale page with countdown timer |
| 🔐 Auth | Phone-based login/register with mock JWT |
| 👤 Account | Orders history, profile editor, wishlist |
| 🌙 Theme | Dark/light mode toggle, persisted |
| 📱 Responsive | Mobile-first, works on all screen sizes |

## 💳 Payment Support
bKash · Nagad · Rocket · VISA · Mastercard · Cash on Delivery · Upay

## 🇧🇩 Bangladesh-Specific
- Bengali (Bangla) product names alongside English
- Bangladesh divisions in address forms
- Local brands: Walton, Symphony, Aarong, PRAN, Meril, RFL
- ৳ Taka currency throughout

---

## 🛠 Tech Stack

**Frontend:** Vue 3, TypeScript, Vite, Pinia, Vue Router, Tailwind CSS, SCSS  
**Backend:** Express.js, TypeScript, tsx (hot reload)  
**Fonts:** Plus Jakarta Sans, Inter, Hind Siliguri (Bangla)  
**Icons:** FontAwesome 6 Pro

---

## 📡 API Endpoints

```
GET  /api/health
GET  /api/products?category=&q=&limit=
GET  /api/products/:slug
POST /api/auth/login
POST /api/auth/register
GET  /api/orders
POST /api/orders
```

---

*© 2027 SellBazar.com — Made with ❤️ in Bangladesh 🇧🇩*
