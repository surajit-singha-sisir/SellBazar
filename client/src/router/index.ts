import { createRouter, createWebHistory } from 'vue-router'

export default createRouter({
  history: createWebHistory(),
  scrollBehavior: () => ({ top: 0, behavior: 'smooth' }),
  routes: [
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
    { path: '/:pathMatch(.*)*',     name: 'not-found',      component: () => import('@/views/NotFoundView.vue') },
  ]
})
