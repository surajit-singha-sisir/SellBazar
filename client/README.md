# SellBazar Client 🛍️
### বাংলাদেশের সেরা মার্কেটপ্লেস — Frontend Application

Vue 3 + Vite single-page application for SellBazar, a Bangladesh-first B2C e-commerce platform with a 2027 aesthetic. Bilingual (English + বাংলা), ৳ Taka currency, local brands, and all major Bangladeshi payment methods.

---

## 🚀 Quick Start

```bash
# From the client/ directory
npm install
npm run dev        # → http://localhost:5173

# Or from the monorepo root (runs client + server together)
npm run dev
```

---

## 📁 Project Structure

```
client/
├── index.html
├── vite.config.ts
├── tailwind.config.ts
├── postcss.config.js
├── tsconfig.json
└── src/
    ├── main.ts                    # App entry point
    ├── App.vue                    # Root component
    ├── assets/
    │   └── styles/
    │       ├── main.scss          # Global styles, CSS variables, utility classes
    │       ├── _variables.scss    # Design tokens (colors, spacing, typography)
    │       └── _mixins.scss       # SCSS mixins
    ├── components/
    │   ├── cart/
    │   │   ├── CartDrawer.vue     # Slide-over cart panel (opens on add-to-cart)
    │   │   └── CartItem.vue       # Individual cart row with qty controls
    │   ├── layout/
    │   │   ├── AppHeader.vue      # Sticky header, search, nav, user menu
    │   │   └── AppFooter.vue      # Footer with links
    │   ├── product/
    │   │   └── ProductCard.vue    # Product tile used across all grids
    │   └── ui/                    # Shared UI primitives
    ├── composables/               # Reusable Vue composition functions
    ├── router/
    │   └── index.ts               # All 13 routes (see Routes section)
    ├── stores/
    │   ├── useCartStore.ts        # Cart state + localStorage persistence
    │   ├── useProductStore.ts     # Product catalog (23 products) + filters
    │   ├── useAuthStore.ts        # User session + mock JWT
    │   ├── useWishlistStore.ts    # Wishlist (Set of product IDs)
    │   └── useThemeStore.ts       # Dark/light mode toggle
    ├── types/
    │   └── index.ts               # TypeScript interfaces
    └── views/
        ├── HomeView.vue
        ├── ProductListView.vue
        ├── ProductDetailView.vue
        ├── CartView.vue
        ├── CheckoutView.vue
        ├── DealsView.vue
        ├── NotFoundView.vue
        ├── auth/
        │   ├── LoginView.vue
        │   └── RegisterView.vue
        └── account/
            ├── OrdersView.vue
            ├── ProfileView.vue
            └── WishlistView.vue
```

---

## 🗺️ Routes

| Path | View | Description |
|---|---|---|
| `/` | `HomeView` | Hero, stats bar, category grid, featured products, deals banner with live countdown, new arrivals, trust section, payment methods |
| `/products` | `ProductListView` | Full catalog with sidebar (category + price filter), sort, search, mobile filter pills |
| `/products/:slug` | `ProductDetailView` | Image gallery, ratings, delivery info, add to cart, wishlist, related products |
| `/cart` | `CartView` | Full cart page with qty controls and savings summary |
| `/checkout` | `CheckoutView` | Delivery address form (all 8 BD divisions + dynamic districts), payment selection, order confirmation modal |
| `/deals` | `DealsView` | Flash sale page with countdown timer |
| `/login` | `LoginView` | Phone + password login |
| `/register` | `RegisterView` | New account registration |
| `/account/orders` | `OrdersView` | Order history with status tracking |
| `/account/profile` | `ProfileView` | Edit name, phone, email, division |
| `/account/wishlist` | `WishlistView` | Saved products |
| `/:pathMatch(.*)` | `NotFoundView` | 404 page |

---

## 🏪 The Shop

### Product Catalog (23 products, 8 categories)

All products are defined in `src/stores/useProductStore.ts` with real Unsplash images, dual-language names, and Bangladesh-relevant brands.

| Category | Products |
|---|---|
| **Electronics** | Samsung Galaxy A55 5G · Walton Primo X7 Ultra · Xiaomi Redmi Note 13 Pro · Lenovo IdeaPad Slim 5 · Sony WH-1000XM5 · Apple Watch Series 9 · Canon EOS R50 · Samsung 65" QLED TV |
| **Fashion** | Nike Air Max 2027 · Jamdani Muslin Saree · Men's Premium Cotton Polo · Ladies Embroidered Kurti Set |
| **Grocery** | PRAN Mango Juice 1L (Pack of 6) · Premium Basmati Rice 5kg |
| **Beauty** | L'Oréal Revitalift Vitamin C Serum · Rasasi Oud Al Layl EDP |
| **Home** | Walton 1 Ton Inverter AC · Miyako 5L Digital Rice Cooker |
| **Sports** | GP Pro Edition Cricket Bat · Premium TPE Yoga Mat |
| **Business** | Smart QR POS Terminal (bKash/Nagad/Rocket) |
| **Books** | হুমায়ূন আহমেদ হিমু সমগ্র (5 vols) · Atomic Habits (Bangla translation) |

Each product has: `id`, `slug`, `name`, `nameBn` (Bangla), `description`, `price`, `salePrice`, `images[]`, `category`, `categoryBn`, `brand`, `stock`, `rating`, `reviewCount`, `tags[]`, `isNew?`, `isFeatured?`, `deliveryDays`, `seller`, `location`.

### Product filtering

- Filter by **category** (sidebar on desktop, horizontal pill scroll on mobile)
- Filter by **price range**: Under ৳500 / ৳500–2K / ৳2K–10K / ৳10K–50K / Over ৳50K
- **Sort** by: Relevance · Price low→high · Price high→low · Top Rated · Newest
- **Search** by name or tag (from header or URL `?q=` param)
- URL-driven: `/products?cat=Electronics` and `/products?q=samsung` both work

---

## 🛒 Cart & Checkout

### Cart Store (`useCartStore`)

- `add(product, qty)` — adds item, increments if already in cart, opens drawer
- `remove(id)` — removes item
- `updateQty(id, qty)` — updates quantity; removes item if qty drops to 0
- `clear()` — empties cart (called on successful order)
- Computed: `totalItems`, `totalPrice` (MRP), `saleTotal` (discounted), `savings`
- Persisted to `localStorage` key `sb-cart`

### CartDrawer

Slide-over panel that opens automatically when a product is added. Shows all items, savings summary, and links to full cart and checkout.

### Checkout

Two-column layout (form + order summary):

**Delivery form fields:** Full Name, Phone, Division (8 BD divisions), District (dynamic dropdown per division — all 64 districts mapped), Upazila/Thana, Postal Code, Full Address.

**Payment methods:**

| Method | Type |
|---|---|
| bKash | Mobile Financial Service (MFS) |
| Nagad | MFS |
| Rocket | MFS — requires mobile number input |
| Debit / Credit Card | Card payment |
| Upay | MFS |
| Cash on Delivery | COD |

MFS methods (bKash, Nagad, Rocket) show an additional mobile number input field when selected.

On successful order: clears cart, shows a confirmation modal with order ID (`SB-{timestamp}`) and estimated 2–3 business day delivery.

---

## 🏠 Home Page Sections

1. **Announcement bar** — Eid sale promo + free delivery threshold
2. **Hero** — Headline with CTA buttons, floating featured product mini-cards (desktop)
3. **Stats bar** — 2M+ Products · 50K+ Sellers · 10M+ Deliveries · 5M+ Happy Users
4. **Category grid** — 8 categories with icon and product count, links to filtered product list
5. **Featured Products** — `isFeatured: true` products from store
6. **Deals banner** — Live countdown timer (hours/mins/secs), links to `/deals`
7. **New Arrivals** — `isNew: true` products
8. **Why SellBazar** — Free Delivery · Easy Returns · Secure Payments · 24/7 Support
9. **Payment Methods** — All 7 payment options displayed with icons

---

## 🔐 Auth

Phone-based login and registration. The auth store saves the user object to `localStorage` key `sb-user`. On login/register, the API returns a mock JWT (not validated on the frontend beyond storage).

`useAuthStore` exposes:
- `user` — current `User | null`
- `isLoggedIn` — computed boolean
- `initials` — first letters of name words, shown in header avatar
- `login(user)` / `logout()`

---

## 🌙 Theme

Dark/light mode toggle in the header (and mobile menu). Preference persisted to `localStorage` via `useThemeStore`. CSS variables drive all colors — the entire UI switches cleanly between modes.

---

## 🔍 Header Features

- **Sticky with scroll shadow** — becomes elevated after scrolling 10px
- **Search** — with live product name suggestions dropdown, category pre-filter, keyboard enter support
- **Location picker** — "Deliver to Dhaka" (UI only)
- **Category nav bar** — quick links to all 8 categories + Deals (desktop)
- **Cart icon** — item count badge, bounce animation on add
- **Wishlist icon** — count badge
- **User menu** — shows initials when logged in, dropdown with Orders/Profile/Logout; shows Login/Register when logged out
- **Mobile menu** — hamburger toggle with all nav links + theme toggle

---

## 💳 Payment Methods

| Name | Color | Notes |
|---|---|---|
| bKash | `#e2136e` | Most popular MFS in BD |
| Nagad | `#f7931e` | Bangladesh Post Office MFS |
| Rocket | `#8b3fcd` | DBBL Mobile Banking |
| VISA | `#1a1f71` | Debit/Credit card |
| Mastercard | `#eb001b` | Debit/Credit card |
| Cash on Delivery | `#22c55e` | Pay on receipt |
| Upay | `#005baa` | UCB MFS |

---

## 🇧🇩 Bangladesh-Specific Details

- **Currency** — ৳ Taka throughout (no USD/EUR)
- **Dual language** — every product has `name` (English) and `nameBn` (বাংলা)
- **Local brands** — Walton, Symphony, Aarong, PRAN, Meril, RFL, Dhaka Muslin, GP
- **All 8 divisions** — Dhaka, Chittagong, Rajshahi, Khulna, Barisal, Sylhet, Rangpur, Mymensingh
- **All 64 districts** — dynamic dropdown in checkout, grouped by division
- **Cultural products** — Jamdani Muslin Saree (UNESCO heritage), Humayun Ahmed Himu series, Eid sale banners
- **Bangladesh sellers** — TechWorld BD, Walton Official, Rokomari, Aarong Official, etc.

---

## 🛠️ Tech Stack

| Tool | Version | Purpose |
|---|---|---|
| Vue 3 | ^3.4.0 | Frontend framework (Composition API) |
| Vite | ^5.2.0 | Build tool & dev server |
| TypeScript | ^5.4.0 | Type safety |
| Pinia | ^2.1.7 | State management |
| Vue Router | ^4.3.0 | Client-side routing |
| Tailwind CSS | ^3.4.3 | Utility-first styling |
| SCSS / Sass | ^1.77.0 | Design tokens & global styles |
| Swiper | ^12.2.0 | Touch carousel |
| FontAwesome 6 Pro | CDN | Icons (fa-sharp, fa-brands) |
| Plus Jakarta Sans | Google Fonts | Primary UI font |
| Hind Siliguri | Google Fonts | Bengali script rendering |
| Inter | Google Fonts | Body text |

---

## 📜 Available Scripts

```bash
npm run dev        # Start Vite dev server → http://localhost:5173
npm run build      # Type-check + production build → dist/
npm run preview    # Preview the production build locally
```

---

## 🔌 API Connection

The client fetches from the Express backend at `http://localhost:4000`. The main product data lives in `useProductStore` (23 items, client-side). The server routes (`/api/products`, `/api/auth/*`, `/api/orders`) are used for search, login/register, and order placement — but **do not need to be running** for most of the UI to work, as the store has its own mock data.

---

## 🗂️ localStorage Keys

| Key | Store | Contents |
|---|---|---|
| `sb-cart` | `useCartStore` | `CartItem[]` array |
| `sb-user` | `useAuthStore` | `User` object or `null` |
| `sb-wishlist` | `useWishlistStore` | `string[]` of product IDs |
| `sb-theme` | `useThemeStore` | `"dark"` or `"light"` |

---

*© 2027 SellBazar.com — Made with ❤️ in Bangladesh 🇧🇩*
