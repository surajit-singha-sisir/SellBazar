<template>
  <div class="admin-shell" :class="{ 'sidebar-collapsed': collapsed }">
    <!-- ── Mobile overlay ──────────────────────────────────────── -->
    <Transition name="overlay-fade">
      <div v-if="mobileOpen" class="sidebar-overlay" @click="mobileOpen = false"></div>
    </Transition>

    <!-- ── Sidebar ─────────────────────────────────────────────── -->
    <aside class="admin-sidebar" :class="{ 'mobile-open': mobileOpen }">
      <div class="sidebar-header">
        <div class="brand-logo">
          <span class="brand-icon"><i class="fa-sharp-duotone fa-solid fa-store"></i></span>
          <transition name="fade-label">
            <span v-if="!collapsed" class="brand-name">SellBazar <em>Admin</em></span>
          </transition>
        </div>
        <button class="collapse-btn" @click="collapsed = !collapsed" :title="collapsed ? 'Expand' : 'Collapse'">
          <i :class="collapsed ? 'fa-solid fa-chevrons-right' : 'fa-solid fa-chevrons-left'"></i>
        </button>
      </div>

      <nav class="sidebar-nav">
        <div class="nav-section-label" v-if="!collapsed">Main</div>
        <RouterLink v-for="item in mainNav" :key="item.to" :to="item.to" class="nav-item" :title="item.label">
          <i :class="item.icon"></i>
          <transition name="fade-label"><span v-if="!collapsed">{{ item.label }}</span></transition>
          <span v-if="item.badge && !collapsed" class="nav-badge">{{ item.badge }}</span>
        </RouterLink>

        <div class="nav-section-label" v-if="!collapsed" style="margin-top:1rem">Manage</div>
        <RouterLink v-for="item in manageNav" :key="item.to" :to="item.to" class="nav-item" :title="item.label">
          <i :class="item.icon"></i>
          <transition name="fade-label"><span v-if="!collapsed">{{ item.label }}</span></transition>
        </RouterLink>
      </nav>

      <div class="sidebar-footer">
        <div class="server-pill" :class="serverStatus">
          <span class="status-dot"></span>
          <transition name="fade-label">
            <span v-if="!collapsed">Server {{ serverStatus === 'online' ? 'Online' : serverStatus === 'offline' ? 'Offline' : 'Checking…' }}</span>
          </transition>
        </div>
        <RouterLink to="/" class="nav-item back-to-store" title="Back to Store">
          <i class="fa-sharp fa-solid fa-arrow-left-to-line"></i>
          <transition name="fade-label"><span v-if="!collapsed">Back to Store</span></transition>
        </RouterLink>
      </div>
    </aside>

    <!-- ── Main content ───────────────────────────────────────── -->
    <div class="admin-main">
      <!-- Topbar -->
      <header class="admin-topbar">
        <div class="topbar-left">
          <button class="mobile-menu-btn" @click="mobileOpen = !mobileOpen">
            <i class="fa-solid fa-bars"></i>
          </button>
          <div class="breadcrumb">
            <i class="fa-sharp fa-solid fa-house-blank" style="font-size:12px;opacity:.5"></i>
            <span>/</span>
            <span>{{ currentPageLabel }}</span>
          </div>
        </div>
        <div class="topbar-right">
          <button class="topbar-btn" @click="adminStore.loadAll()" title="Refresh data">
            <i class="fa-sharp fa-solid fa-arrows-rotate" :class="{ 'fa-spin': isLoading }"></i>
          </button>
          <button class="topbar-btn notif-btn" title="Notifications" style="position:relative">
            <i class="fa-sharp fa-solid fa-bell"></i>
            <span v-if="adminStore.pendingOrders > 0" class="notif-dot">{{ adminStore.pendingOrders }}</span>
          </button>
          <div class="theme-toggle-wrap" :title="themeStore.isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'">
            <ThemeToggle />
          </div>
          <!-- Admin user menu -->
          <div class="admin-user-menu" ref="userMenuRef">
            <button class="admin-user-btn" @click="userMenuOpen = !userMenuOpen">
              <div class="admin-avatar">
                <i class="fa-sharp-duotone fa-solid fa-user-crown"></i>
              </div>
              <span class="admin-user-name">{{ adminStore.adminUser?.name ?? 'Admin' }}</span>
              <i class="fa-solid fa-chevron-down" style="font-size:10px;color:var(--text-secondary)"></i>
            </button>
            <Transition name="dropdown">
              <div v-if="userMenuOpen" class="user-dropdown">
                <div class="user-dropdown-header">
                  <div style="font-weight:700;font-size:13px;color:var(--text-primary)">{{ adminStore.adminUser?.name }}</div>
                  <div style="font-size:11px;color:var(--text-secondary)">{{ adminStore.adminUser?.email }}</div>
                  <span class="status-badge delivered" style="font-size:10px;margin-top:4px;display:inline-block">{{ adminStore.adminUser?.role }}</span>
                </div>
                <div class="user-dropdown-divider"></div>
                <RouterLink to="/" class="user-dropdown-item" @click="userMenuOpen=false">
                  <i class="fa-sharp fa-solid fa-store"></i> View Store
                </RouterLink>
                <div class="user-dropdown-divider"></div>
                <button class="user-dropdown-item logout-item" @click="handleLogout">
                  <i class="fa-sharp fa-solid fa-right-from-bracket"></i> Sign Out
                </button>
              </div>
            </Transition>
          </div>
        </div>
      </header>

      <!-- Page slot -->
      <main class="admin-content">
        <RouterView v-slot="{ Component }">
          <Transition name="admin-page" mode="out-in">
            <component :is="Component" />
          </Transition>
        </RouterView>
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAdminStore } from '@/stores/useAdminStore'
import { useThemeStore } from '@/stores/useThemeStore'
import ThemeToggle from '@/components/admin/ThemeToggle.vue'

const route      = useRoute()
const router     = useRouter()
const adminStore = useAdminStore()
const themeStore = useThemeStore()
const collapsed    = ref(false)
const mobileOpen   = ref(false)
const userMenuOpen = ref(false)
const userMenuRef  = ref<HTMLElement | null>(null)

// Close mobile sidebar on route change
watch(() => route.path, () => { mobileOpen.value = false })

// Close user menu on outside click
function onDocClick(e: MouseEvent) {
  if (userMenuRef.value && !userMenuRef.value.contains(e.target as Node)) {
    userMenuOpen.value = false
  }
}
onMounted(() => {
  document.addEventListener('click', onDocClick)
  adminStore.loadAll()
  // Realtime polling every 30s
  pollingTimer = window.setInterval(() => adminStore.loadAll(), 30_000)
})
let pollingTimer: number
onUnmounted(() => {
  document.removeEventListener('click', onDocClick)
  clearInterval(pollingTimer)
})

function handleLogout() {
  userMenuOpen.value = false
  adminStore.adminLogout()
  router.push('/admin/login')
}

const mainNav = computed(() => [
  { to: '/admin',          label: 'Dashboard',  icon: 'fa-sharp-duotone fa-solid fa-grid-2'         },
  { to: '/admin/products', label: 'Products',   icon: 'fa-sharp-duotone fa-solid fa-box-open'        },
  { to: '/admin/orders',   label: 'Orders',     icon: 'fa-sharp-duotone fa-solid fa-bag-shopping',
    badge: adminStore.pendingOrders > 0 ? adminStore.pendingOrders : null },
  { to: '/admin/analytics',label: 'Analytics',  icon: 'fa-sharp-duotone fa-solid fa-chart-mixed'     },
])

const manageNav = [
  { to: '/admin/customers', label: 'Customers', icon: 'fa-sharp-duotone fa-solid fa-users'           },
  { to: '/admin/settings',  label: 'Settings',  icon: 'fa-sharp-duotone fa-solid fa-gear'            },
]

const pageLabels: Record<string, string> = {
  'admin':          'Dashboard',
  'admin-products': 'Products',
  'admin-orders':   'Orders',
  'admin-analytics':'Analytics',
  'admin-customers':'Customers',
  'admin-settings': 'Settings',
}
const currentPageLabel = computed(() => pageLabels[String(route.name)] ?? 'Admin')

const isLoading = computed(() =>
  adminStore.loading.products || adminStore.loading.orders || adminStore.loading.health
)

const serverStatus = computed(() =>
  adminStore.serverOnline === null ? 'checking' :
  adminStore.serverOnline ? 'online' : 'offline'
)
</script>
