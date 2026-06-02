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
          <NotificationPanel />
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

    <!-- Global toast notifications -->
    <ToastNotifications />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAdminStore } from '@/stores/useAdminStore'
import { useThemeStore } from '@/stores/useThemeStore'
import { useSettingsStore } from '@/stores/useSettingsStore'
import ThemeToggle from '@/components/admin/ThemeToggle.vue'
import NotificationPanel from '@/components/admin/NotificationPanel.vue'
import ToastNotifications from '@/components/admin/ToastNotifications.vue'

const route         = useRoute()
const router        = useRouter()
const adminStore    = useAdminStore()
const themeStore    = useThemeStore()
const settingsStore = useSettingsStore()

const collapsed    = ref(settingsStore.settings.sidebarDefault === 'collapsed')
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

// Auto-refresh polling — driven by settings
let pollingTimer: number = 0
function startPolling() {
  clearInterval(pollingTimer)
  if (settingsStore.settings.autoRefresh) {
    const ms = (settingsStore.settings.autoRefreshInterval ?? 60) * 1000
    pollingTimer = window.setInterval(() => adminStore.loadAll(), ms)
  }
}
// Re-wire whenever settings change
watch(
  () => [settingsStore.settings.autoRefresh, settingsStore.settings.autoRefreshInterval],
  () => startPolling()
)

onMounted(() => {
  document.addEventListener('click', onDocClick)
  adminStore.loadAll()
  startPolling()
})
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
  { to: '/admin/categories', label: 'Categories', icon: 'fa-sharp-duotone fa-solid fa-layer-group'    },
  { to: '/admin/customers',  label: 'Customers',  icon: 'fa-sharp-duotone fa-solid fa-users'          },
  { to: '/admin/reports',    label: 'Reports',    icon: 'fa-sharp-duotone fa-solid fa-chart-bar'      },
  { to: '/admin/settings',   label: 'Settings',   icon: 'fa-sharp-duotone fa-solid fa-gear'           },
  { to: '/admin/icons',      label: 'Icon Browser', icon: 'fa-sharp-duotone fa-solid fa-icons'        },
]

const pageLabels: Record<string, string> = {
  'admin':             'Dashboard',
  'admin-products':    'Products',
  'admin-orders':      'Orders',
  'admin-analytics':   'Analytics',
  'admin-categories':  'Categories',
  'admin-customers':   'Customers',
  'admin-reports':     'Reports',
  'admin-settings':    'Settings',
  'admin-icons':       'Icon Browser',
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

<style scoped>
/* ── Shell layout ─────────────────────────────────────────────────────────── */
.admin-shell {
  display: flex;
  min-height: 100vh;
  background: var(--admin-bg);
  color: var(--text-primary);
  font-family: 'Inter', system-ui, sans-serif;
  position: relative;
}

/* ── Sidebar ──────────────────────────────────────────────────────────────── */
.admin-sidebar {
  width: var(--sidebar-w);
  flex-shrink: 0;
  background: var(--sidebar-bg);
  border-right: 1px solid var(--sidebar-border);
  display: flex;
  flex-direction: column;
  position: fixed;
  top: 0; left: 0; bottom: 0;
  z-index: 200;
  transition: width 0.25s cubic-bezier(0.4,0,0.2,1);
  overflow: hidden;
}
.sidebar-collapsed .admin-sidebar { width: var(--sidebar-collapsed-w); }

.sidebar-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 0 14px; height: var(--topbar-h);
  border-bottom: 1px solid var(--sidebar-border);
  flex-shrink: 0; gap: 8px; overflow: hidden;
}
.brand-logo { display: flex; align-items: center; gap: 10px; overflow: hidden; min-width: 0; }
.brand-icon {
  width: 32px; height: 32px; border-radius: 9px; background: var(--brand);
  display: flex; align-items: center; justify-content: center;
  font-size: 15px; color: #fff; flex-shrink: 0;
}
.brand-name {
  font-size: 14px; font-weight: 800; color: var(--text-primary);
  letter-spacing: -0.02em; white-space: nowrap; overflow: hidden;
}
.brand-name em { color: var(--brand); font-style: normal; }
.collapse-btn {
  width: 28px; height: 28px; border-radius: 7px;
  border: 1px solid var(--sidebar-border); background: transparent;
  color: var(--text-secondary); cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  font-size: 11px; flex-shrink: 0; transition: background 0.15s, color 0.15s;
}
.collapse-btn:hover { background: var(--surface-hover); color: var(--text-primary); }

.sidebar-nav {
  flex: 1; overflow-y: auto; overflow-x: hidden;
  padding: 10px 8px; display: flex; flex-direction: column; gap: 2px;
  scrollbar-width: none;
}
.sidebar-nav::-webkit-scrollbar { display: none; }
.nav-section-label {
  font-size: 10px; font-weight: 700; text-transform: uppercase;
  letter-spacing: 0.1em; color: var(--text-secondary);
  padding: 4px 8px 6px; opacity: 0.7; white-space: nowrap; overflow: hidden;
}
.nav-item {
  display: flex; align-items: center; gap: 10px; padding: 9px 10px;
  border-radius: 9px; text-decoration: none; color: var(--text-secondary);
  font-size: 13px; font-weight: 500; cursor: pointer;
  border: none; background: transparent; width: 100%; text-align: left;
  transition: background 0.15s, color 0.15s;
  white-space: nowrap; overflow: hidden; position: relative;
}
.nav-item i { font-size: 15px; width: 20px; text-align: center; flex-shrink: 0; }
.nav-item:hover { background: var(--surface-hover); color: var(--text-primary); }
.nav-item.router-link-exact-active { background: var(--active-bg); color: var(--brand); font-weight: 600; }
.nav-item.router-link-exact-active::before {
  content: ''; position: absolute; left: 0; top: 6px; bottom: 6px;
  width: 3px; background: var(--brand); border-radius: 0 3px 3px 0;
}
.nav-badge {
  margin-left: auto; background: var(--brand); color: #fff;
  font-size: 10px; font-weight: 700; padding: 1px 7px; border-radius: 20px; flex-shrink: 0;
}
.sidebar-footer {
  padding: 8px; border-top: 1px solid var(--sidebar-border);
  display: flex; flex-direction: column; gap: 4px; flex-shrink: 0; overflow: hidden;
}
.server-pill {
  display: flex; align-items: center; gap: 8px; padding: 7px 10px;
  border-radius: 8px; font-size: 11px; font-weight: 500;
  white-space: nowrap; overflow: hidden; color: var(--text-secondary);
}
.status-dot { width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0; }
.server-pill.online  .status-dot { background: #22c55e; box-shadow: 0 0 6px #22c55e; }
.server-pill.offline .status-dot { background: #ef4444; box-shadow: 0 0 6px #ef4444; }
.server-pill.checking .status-dot { background: #eab308; animation: pulse-dot 1s infinite; }
@keyframes pulse-dot { 0%,100% { opacity: 1; } 50% { opacity: 0.35; } }
.back-to-store { color: var(--text-secondary); font-size: 12px; }

/* ── Main area ──────────────────────────────────────────────────────────── */
.admin-main {
  flex: 1; min-width: 0; margin-left: var(--sidebar-w);
  transition: margin-left 0.25s cubic-bezier(0.4,0,0.2,1);
  display: flex; flex-direction: column; min-height: 100vh;
}
.sidebar-collapsed .admin-main { margin-left: var(--sidebar-collapsed-w); }

/* ── Topbar ─────────────────────────────────────────────────────────────── */
.admin-topbar {
  height: var(--topbar-h); background: var(--sidebar-bg);
  border-bottom: 1px solid var(--sidebar-border);
  display: flex; align-items: center; justify-content: space-between;
  padding: 0 20px; position: sticky; top: 0; z-index: 100; gap: 12px; flex-shrink: 0;
}
.topbar-left { display: flex; align-items: center; gap: 12px; min-width: 0; }
.mobile-menu-btn {
  display: none; width: 34px; height: 34px; border-radius: 8px;
  border: 1px solid var(--sidebar-border); background: transparent;
  color: var(--text-primary); cursor: pointer;
  align-items: center; justify-content: center; font-size: 14px; flex-shrink: 0;
}
.breadcrumb {
  display: flex; align-items: center; gap: 6px;
  font-size: 13px; color: var(--text-secondary); white-space: nowrap; overflow: hidden;
}
.breadcrumb span:last-child { color: var(--text-primary); font-weight: 600; }
.topbar-right { display: flex; align-items: center; gap: 6px; flex-shrink: 0; }
.topbar-btn {
  width: 34px; height: 34px; border-radius: 8px;
  border: 1px solid var(--sidebar-border); background: transparent;
  color: var(--text-secondary); cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  font-size: 14px; transition: all 0.15s; position: relative;
}
.topbar-btn:hover { background: var(--surface-hover); color: var(--text-primary); }
.theme-toggle-wrap { display: flex; align-items: center; }

/* ── Admin user menu ────────────────────────────────────────────────────── */
.admin-user-menu { position: relative; }
.admin-user-btn {
  display: flex; align-items: center; gap: 8px;
  padding: 5px 10px 5px 5px; border-radius: 10px;
  border: 1px solid var(--sidebar-border); background: transparent;
  cursor: pointer; transition: background 0.15s;
}
.admin-user-btn:hover { background: var(--surface-hover); }
.admin-avatar {
  width: 28px; height: 28px; border-radius: 8px; background: var(--brand-dim);
  display: flex; align-items: center; justify-content: center;
  font-size: 13px; color: var(--brand);
}
.admin-user-name {
  font-size: 12px; font-weight: 600; color: var(--text-primary);
  max-width: 100px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
.user-dropdown {
  position: absolute; top: calc(100% + 8px); right: 0;
  background: var(--sidebar-bg); border: 1px solid var(--sidebar-border);
  border-radius: 12px; min-width: 200px;
  box-shadow: 0 16px 48px rgba(0,0,0,0.25); z-index: 300; overflow: hidden;
}
.user-dropdown-header { padding: 14px 16px; }
.user-dropdown-divider { height: 1px; background: var(--sidebar-border); margin: 0; }
.user-dropdown-item {
  display: flex; align-items: center; gap: 10px; padding: 10px 16px;
  font-size: 13px; color: var(--text-secondary); text-decoration: none;
  cursor: pointer; background: transparent; border: none;
  width: 100%; text-align: left; transition: background 0.15s, color 0.15s;
}
.user-dropdown-item:hover { background: var(--surface-hover); color: var(--text-primary); }
.user-dropdown-item.logout-item:hover { background: rgba(239,68,68,0.08); color: #ef4444; }

/* ── Page content ───────────────────────────────────────────────────────── */
.admin-content { flex: 1; padding: 24px; overflow-y: auto; }

/* ── Mobile overlay ─────────────────────────────────────────────────────── */
.sidebar-overlay {
  position: fixed; inset: 0; background: rgba(0,0,0,0.55);
  z-index: 199; backdrop-filter: blur(2px);
}

/* ── Transitions ────────────────────────────────────────────────────────── */
.overlay-fade-enter-active, .overlay-fade-leave-active { transition: opacity 0.25s; }
.overlay-fade-enter-from, .overlay-fade-leave-to { opacity: 0; }
.fade-label-enter-active, .fade-label-leave-active {
  transition: opacity 0.18s ease, max-width 0.25s ease;
  overflow: hidden; white-space: nowrap;
}
.fade-label-enter-from, .fade-label-leave-to { opacity: 0; max-width: 0; }
.fade-label-enter-to, .fade-label-leave-from { opacity: 1; max-width: 200px; }
.dropdown-enter-active, .dropdown-leave-active { transition: opacity 0.18s ease, transform 0.18s ease; }
.dropdown-enter-from, .dropdown-leave-to { opacity: 0; transform: translateY(-6px) scale(0.97); }
.admin-page-enter-active, .admin-page-leave-active { transition: opacity 0.18s ease, transform 0.18s ease; }
.admin-page-enter-from, .admin-page-leave-to { opacity: 0; transform: translateY(6px); }

/* ── Responsive ─────────────────────────────────────────────────────────── */
@media (max-width: 768px) {
  .admin-sidebar {
    transform: translateX(-100%);
    width: var(--sidebar-w) !important;
    transition: transform 0.25s cubic-bezier(0.4,0,0.2,1);
  }
  .admin-sidebar.mobile-open { transform: translateX(0); }
  .admin-main { margin-left: 0 !important; }
  .mobile-menu-btn { display: flex; }
  .collapse-btn { display: none; }
  .admin-content { padding: 16px; }
  .admin-user-name { display: none; }
}
@media (min-width: 769px) { .mobile-menu-btn { display: none; } }
</style>
