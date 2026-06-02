import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(),
  scrollBehavior: () => ({ top: 0, behavior: 'smooth' }),
  routes: [
    // ── Public storefront ──────────────────────────────────────────────────
    { path: '/',               name: 'home',           component: () => import('@/views/HomeView.vue') },
    { path: '/products',       name: 'products',       component: () => import('@/views/ProductListView.vue') },
    { path: '/products/:slug', name: 'product-detail', component: () => import('@/views/ProductDetailView.vue') },
    { path: '/cart',           name: 'cart',           component: () => import('@/views/CartView.vue') },
    { path: '/checkout',       name: 'checkout',       component: () => import('@/views/CheckoutView.vue') },
    { path: '/wishlist',       name: 'wishlist',       component: () => import('@/views/account/WishlistView.vue') },
    { path: '/deals',          name: 'deals',          component: () => import('@/views/DealsView.vue') },
    { path: '/login',          name: 'login',          component: () => import('@/views/auth/LoginView.vue') },
    { path: '/register',       name: 'register',       component: () => import('@/views/auth/RegisterView.vue') },

    // ── Auth-protected account pages ───────────────────────────────────────
    {
      path: '/account/orders',
      name: 'orders',
      component: () => import('@/views/account/OrdersView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/account/profile',
      name: 'profile',
      component: () => import('@/views/account/ProfileView.vue'),
      meta: { requiresAuth: true },
    },

    // ── Admin Login (public) ───────────────────────────────────────────────
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
        { path: '',                   name: 'admin',              component: () => import('@/views/admin/DashboardView.vue') },
        { path: 'products',          name: 'admin-products',     component: () => import('@/views/admin/ProductsView.vue') },
        { path: 'products/add',      name: 'admin-product-add',  component: () => import('@/views/admin/ProductFormView.vue') },
        { path: 'products/edit/:id', name: 'admin-product-edit', component: () => import('@/views/admin/ProductFormView.vue') },
        { path: 'categories',        name: 'admin-categories',   component: () => import('@/views/admin/CategoriesView.vue') },
        { path: 'orders',            name: 'admin-orders',       component: () => import('@/views/admin/OrdersView.vue') },
        { path: 'analytics',         name: 'admin-analytics',    component: () => import('@/views/admin/AnalyticsView.vue') },
        { path: 'customers',         name: 'admin-customers',    component: () => import('@/views/admin/CustomersView.vue') },
        { path: 'settings',          name: 'admin-settings',     component: () => import('@/views/admin/SettingsView.vue') },
        { path: 'reports',           name: 'admin-reports',      component: () => import('@/views/admin/ReportView.vue') },
      ],
    },

    // ── 404 ────────────────────────────────────────────────────────────────
    { path: '/:pathMatch(.*)*', name: 'not-found', component: () => import('@/views/NotFoundView.vue') },
  ],
})

// ── Helpers ──────────────────────────────────────────────────────────────────
function isAdminTokenValid(token: string | null): boolean {
  if (!token) return false
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    return payload.exp * 1000 > Date.now()
  } catch {
    return false
  }
}

function clearAdminSession() {
  localStorage.removeItem('sb-admin-token')
  localStorage.removeItem('sb-admin-user')
}

// ── Navigation guard ──────────────────────────────────────────────────────────
router.beforeEach((to) => {
  // ── Admin auth ──────────────────────────────────────────────────────────
  const adminToken = localStorage.getItem('sb-admin-token')
  const adminUser  = localStorage.getItem('sb-admin-user')
  const adminLoggedIn = !!(adminUser && isAdminTokenValid(adminToken))

  if (!adminLoggedIn && adminToken) clearAdminSession()

  if (to.meta.requiresAdmin && !adminLoggedIn) {
    return { name: 'admin-login', query: { redirect: to.fullPath } }
  }
  if (to.name === 'admin-login' && adminLoggedIn) {
    return { name: 'admin' }
  }

  // ── Storefront user auth ────────────────────────────────────────────────
  if (to.meta.requiresAuth) {
    const sbUser = localStorage.getItem('sb-user')
    if (!sbUser) {
      // Redirect to login, preserve intended destination
      return { name: 'login', query: { redirect: to.fullPath } }
    }
  }

  // Redirect logged-in users away from login/register pages
  if (to.name === 'login' || to.name === 'register') {
    const sbUser = localStorage.getItem('sb-user')
    if (sbUser) return { name: 'home' }
  }
})

export default router
