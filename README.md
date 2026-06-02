# SellBazar 🛍️
### বাংলাদেশের সেরা মার্কেটপ্লেস · Bangladesh's Next-Gen Marketplace

A full-stack e-commerce platform with a modern admin dashboard — built with **Vue 3**, **TypeScript**, **Tailwind CSS**, and an **Express.js** API backend.

> ⚠️ **Deployment status:** Not yet production-ready for Vercel. See [Deployment](#-deployment) section for blockers and what needs to be resolved first.

---

## 🚀 Quick Start (Local Development)

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

Launches:
- **Storefront** → http://localhost:5173
- **Admin Dashboard** → http://localhost:5173/admin
- **API Server** → http://localhost:4000

### Admin Login
| Field | Value |
|---|---|
| Email | admin@sellbazar.com |
| Password | Admin@1234 |

---

## 📁 Project Structure

```
SellBazar/
├── client/                        # Vue 3 + Vite frontend
│   └── src/
│       ├── assets/styles/         # SCSS design tokens + global styles
│       ├── components/
│       │   ├── admin/             # Admin-specific components
│       │   ├── cart/              # CartDrawer, CartItem
│       │   ├── layout/            # AppHeader, AppFooter
│       │   └── product/           # ProductCard
│       ├── composables/
│       │   ├── useAdminApi.ts     # All admin API calls (CRUD + categories)
│       │   └── useExport.ts       # Excel / PDF / CSV / JSON export
│       ├── router/                # Vue Router routes
│       ├── stores/                # Pinia stores
│       │   ├── useAdminStore.ts
│       │   ├── useAuthStore.ts
│       │   ├── useCartStore.ts
│       │   ├── useProductStore.ts
│       │   ├── useThemeStore.ts
│       │   └── useWishlistStore.ts
│       ├── types/
│       └── views/
│           ├── admin/
│           │   ├── DashboardView.vue      # Charts, stats, subcategory breakdown
│           │   ├── ProductsView.vue       # Table with subcategory filter column
│           │   ├── ProductFormView.vue    # Add/edit with live subcategory select
│           │   ├── OrdersView.vue
│           │   ├── CategoriesView.vue
│           │   ├── CustomersView.vue
│           │   ├── AnalyticsView.vue
│           │   ├── ReportView.vue
│           │   └── SettingsView.vue
│           ├── auth/              # LoginView, RegisterView
│           └── account/           # OrdersView, ProfileView, WishlistView
│
└── server/                        # Express + TypeScript API
    └── src/
        ├── index.ts               # Entry point (port 4000)
        ├── middleware/
        │   └── auth.ts            # JWT requireAdmin middleware
        └── routes/
            ├── products.ts        # Full CRUD + subcategory filtering
            ├── orders.ts          # Orders with seed data
            ├── auth.ts            # Storefront auth (login/register)
            ├── adminAuth.ts       # Admin JWT login/me/logout
            ├── admin.ts           # Dashboard stats, customers, image upload
            ├── categories.ts      # Category + subcategory tree
            └── userdata.ts        # Per-user cart & wishlist sync
```

---

## 🛒 Storefront Features

| Feature | Details |
|---|---|
| 🏠 Home | Hero, category grid, featured & new products, live countdown deal timer |
| 📦 Products | Grid with category sidebar, price filter, sort, search |
| 🔍 Product Detail | Images gallery, ratings, delivery info, add to cart, wishlist, related products |
| 🛒 Cart | Quantity controls, savings display, cart drawer + full cart page |
| 💳 Checkout | Bangladesh division address form, multi-payment (bKash, Nagad, Rocket, Card, COD) |
| 🔥 Deals | Flash sale page with countdown timer |
| 🔐 Auth | Phone-based login/register with JWT |
| 👤 Account | Order history, profile editor, wishlist |
| 🌙 Theme | Dark/light mode toggle, persisted to localStorage |
| 📱 Responsive | Mobile-first, works on all screen sizes |

---

## 🖥️ Admin Dashboard Features

| Feature | Details |
|---|---|
| 📊 Dashboard | Revenue charts, order status bar chart, category doughnut, **subcategory breakdown bar chart** (filterable by category), quick stats, customer map (Leaflet), period filter (Today / 7d / 30d / 3m / 1y / All) |
| 📦 Products | Full CRUD table with **subcategory column**, **subcategory filter dropdown**, category filter, stock filter, sort by any column, pagination |
| ✏️ Product Form | Add/edit product with **live subcategory `<select>`** (populated from API when category is selected), Quill rich-text description, image upload + URL, drag-to-reorder images |
| 🗂️ Categories | Category & subcategory management |
| 📋 Orders | Order management with status updates |
| 👥 Customers | Customer list with order history |
| 📈 Analytics | Extended analytics view |
| 📄 Reports | Exportable reports |
| ⚙️ Settings | Admin settings |
| 📤 Export | Products & orders exportable as Excel (.xlsx), PDF, CSV, JSON, Image (.png) |

---

## 💳 Payment Support
bKash · Nagad · Rocket · VISA · Mastercard · Cash on Delivery · Upay

## 🇧🇩 Bangladesh-Specific
- Bengali (Bangla) product names alongside English
- Bangladesh divisions in address forms
- Local brands: Walton, Symphony, Aarong, PRAN, Meril, RFL
- ৳ Taka currency throughout

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Vue 3, TypeScript, Vite, Pinia, Vue Router |
| Styling | Tailwind CSS, SCSS, custom CSS variables |
| Charts | Chart.js 4 |
| Map | Leaflet.js |
| Rich Text | Quill.js |
| Backend | Express.js, TypeScript, tsx |
| Auth | JWT (jsonwebtoken), bcryptjs |
| Upload | Multer (local — needs cloud for production) |
| Fonts | Plus Jakarta Sans, Inter, Hind Siliguri |
| Icons | FontAwesome 6 Pro |

---

## 📡 API Endpoints

```
GET    /api/health

# Auth (storefront)
POST   /api/auth/login
POST   /api/auth/register

# Admin Auth
POST   /api/admin/login
GET    /api/admin/me

# Products (GET public, rest = admin JWT required)
GET    /api/products?category=&subcategory=&q=&limit=&featured=&sortBy=&order=
GET    /api/products/:slug
POST   /api/products
PUT    /api/products/:id
DELETE /api/products/:id

# Orders
GET    /api/orders?status=&q=&page=&limit=
PUT    /api/orders/:id
DELETE /api/orders/:id

# Admin extras
GET    /api/admin/dashboard
GET    /api/admin/customers
POST   /api/admin/upload

# Categories
GET    /api/categories
```

---

## 🚢 Deployment

### ⛔ Not ready for Vercel yet — 5 blockers must be resolved first

| # | Blocker | Fix needed |
|---|---|---|
| 1 | **In-memory data** — products & orders reset on every restart | Add a real database (MongoDB Atlas / PlanetScale / Supabase) |
| 2 | **Local file uploads** — `/uploads` folder is ephemeral on Vercel | Integrate Cloudinary or AWS S3 for image storage |
| 3 | **Hardcoded secrets** — JWT secret in source, plain-text admin passwords | Move `JWT_SECRET` to env var, hash passwords with bcrypt |
| 4 | **CORS locked to localhost** — production domain will be rejected | Set `ALLOWED_ORIGIN` from an environment variable |
| 5 | **No `vercel.json`** — Vercel won't know how to build/route the monorepo | Add `vercel.json` with build config and `/api` rewrites |

### ⚠️ Server must be on GitHub

The `server/` folder **must be committed and pushed to GitHub** before deploying to Vercel. If it is missing from the repository, Vercel has no backend to deploy and every API call (`/api/*`) will return 404. Check your `.gitignore` to make sure `server/` (and `server/src/`) are not excluded.

### ⚠️ Additional warnings

- `resolveImg()` in `ProductsView.vue` and `ProductFormView.vue` hardcodes `http://localhost:4000` — must use a `VITE_API_URL` env variable in production
- Add a `vercel.json` rewrite rule for SPA routing: all non-API paths must resolve to `index.html`
- Run `npm run build` locally before deploying to catch TypeScript errors that would fail the Vercel build

### Recommended deployment path (once blockers are fixed)
1. Fix CORS + add `vercel.json`
2. Swap uploads to Cloudinary
3. Add MongoDB Atlas (or any hosted DB)
4. Move all secrets to Vercel environment variables
5. Push `server/` to GitHub
6. Deploy

---

*© 2027 SellBazar.com — Made with ❤️ in Bangladesh 🇧🇩*
