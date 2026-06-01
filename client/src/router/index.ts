import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(),
  scrollBehavior: () => ({ top: 0, behavior: 'smooth' }),
  routes: [
    // ── Public storefront ──────────────────────────────────────────────────
    { path: '/',                    name: 'home',           component: () => import('@/views/HomeView.vue') },
    { path: '/products',            name: 'products',       component: () => import('@/views/ProductListView.vue') },
    { path: '/products/:slug',      name: 'product-detail', component: () => import('@/views/ProductDetailView.vue') },
    { path: '/cart',                name: 'cart',           component: () => import('@/views/CartView.vue') },
    { path: '/checkout',            name: 'checkout',       component: () => import('@/views/CheckoutView.vue') },
    { path: '/login',               name: 'login',          component: () => import('@/views/auth/LoginView.vue') },
    { path: '/register',            name: 'register',       component: () => import('@/views/auth/RegisterView.vue') },
    { path: '/account/orders',      name: 'orders',         component: () => import('@/views/account/OrdersView.vue') },
    { path: '/account/profile',     name: 'profile',        component: () => import('@/views/account/ProfileView.vue') },
    { path: '/account/wishlist',    name: 'wishlist',       component: () => import('@/views/account/WishlistView.vue') },
    { path: '/deals',               name: 'deals',          component: () => import('@/views/DealsView.vue') },

    // ── Admin Login (public, no layout) ───────────────────────────────────
    {
      path: '/admin/login',
      name: 'admin-login',
      component: () => import('@/views/admin/AdminLoginView.vue'),
      meta: { adminPublic: true },
    },

    // ── Admin CMS (protected) ──────────────────────────────────────────────
    {
      path: '/admin',
      component: () => import('@/components/admin/AdminLayout.vue'),
      meta: { requiresAdmin: true },
      children: [
        { path: '',           name: 'admin',           component: () => import('@/views/admin/DashboardView.vue') },
        { path: 'products',   name: 'admin-products',  component: () => import('@/views/admin/ProductsView.vue') },
        { path: 'orders',     name: 'admin-orders',    component: () => import('@/views/admin/OrdersView.vue') },
        { path: 'analytics',  name: 'admin-analytics', component: () => import('@/views/admin/AnalyticsView.vue') },
        { path: 'customers',  name: 'admin-customers', component: () => import('@/views/admin/CustomersView.vue') },
        { path: 'settings',   name: 'admin-settings',  component: () => import('@/views/admin/SettingsView.vue') },
      ]
    },

    // ── 404 ────────────────────────────────────────────────────────────────
    { path: '/:pathMatch(.*)*', name: 'not-found', component: () => import('@/views/NotFoundView.vue') },
  ]
})

// ── JWT expiry helper ────────────────────────────────────────────────────────
function isTokenValid(token: string | null): boolean {
  if (!token) return false
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    // exp is in seconds; Date.now() is in ms
    return payload.exp * 1000 > Date.now()
  } catch {
    return false
  }
}

function clearAdminSession() {
  localStorage.removeItem('sb-admin-token')
  localStorage.removeItem('sb-admin-user')
}

// ── Navigation guard ────────────────────────────────────────────────────────
router.beforeEach((to) => {
  const token = localStorage.getItem('sb-admin-token')
  const user  = localStorage.getItem('sb-admin-user')

  // Validate token expiry — clear stale session silently
  const isLoggedIn = !!(user && isTokenValid(token))
  if (!isLoggedIn && token) {
    // Token exists but is expired/invalid — purge it
    clearAdminSession()
  }

  if (to.meta.requiresAdmin && !isLoggedIn) {
    return { name: 'admin-login', query: { redirect: to.fullPath } }
  }

  // If already logged in, redirect /admin/login → /admin
  if (to.name === 'admin-login' && isLoggedIn) {
    return { name: 'admin' }
  }
})

export default router
