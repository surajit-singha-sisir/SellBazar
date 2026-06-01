<template>
  <div class="admin-page-wrap">
    <div class="admin-page-header">
      <div>
        <h1 class="page-title">Settings</h1>
        <p class="page-subtitle">Configure your SellBazar store &amp; admin preferences.</p>
      </div>
      <button class="admin-btn primary" @click="save">
        <i class="fa-sharp fa-solid fa-floppy-disk"></i> Save Changes
      </button>
    </div>

    <!-- Save toast -->
    <Transition name="toast-slide">
      <div v-if="saved" class="settings-toast">
        <i class="fa-sharp fa-solid fa-circle-check"></i> Settings saved successfully!
      </div>
    </Transition>

    <div class="admin-grid-2">
      <!-- Store info -->
      <div>
        <div class="admin-settings-group">
          <div class="settings-group-header">
            <i class="fa-sharp-duotone fa-solid fa-store"></i> Store Information
          </div>
          <div class="settings-row">
            <div><div class="settings-label">Store Name</div><div class="settings-desc">Shown in header &amp; emails</div></div>
            <input class="settings-input" v-model="form.storeName" />
          </div>
          <div class="settings-row">
            <div><div class="settings-label">Store URL</div><div class="settings-desc">Public storefront URL</div></div>
            <input class="settings-input" v-model="form.storeUrl" />
          </div>
          <div class="settings-row">
            <div><div class="settings-label">Support Email</div><div class="settings-desc">Customer contact email</div></div>
            <input class="settings-input" v-model="form.supportEmail" type="email" />
          </div>
          <div class="settings-row">
            <div><div class="settings-label">Currency</div><div class="settings-desc">Default display currency</div></div>
            <select class="settings-select" v-model="form.currency">
              <option value="BDT">BDT (৳)</option>
              <option value="USD">USD ($)</option>
              <option value="EUR">EUR (€)</option>
            </select>
          </div>
          <div class="settings-row">
            <div><div class="settings-label">Timezone</div><div class="settings-desc">Store operational timezone</div></div>
            <select class="settings-select" v-model="form.timezone">
              <option value="Asia/Dhaka">Asia/Dhaka (GMT+6)</option>
              <option value="UTC">UTC</option>
              <option value="America/New_York">America/New_York</option>
            </select>
          </div>
        </div>

        <!-- Server connection -->
        <div class="admin-settings-group">
          <div class="settings-group-header">
            <i class="fa-sharp-duotone fa-solid fa-server"></i> Server Connection
          </div>
          <div class="settings-row">
            <div><div class="settings-label">API Base URL</div><div class="settings-desc">Express server endpoint</div></div>
            <input class="settings-input" v-model="form.apiUrl" style="font-family:monospace;font-size:12px" />
          </div>
          <div class="settings-row">
            <div><div class="settings-label">Server Status</div><div class="settings-desc">Live connection health</div></div>
            <span class="status-badge" :class="adminStore.serverOnline ? 'delivered' : 'cancelled'">
              <i :class="adminStore.serverOnline ? 'fa-solid fa-circle-check' : 'fa-solid fa-circle-xmark'"></i>
              {{ adminStore.serverOnline ? 'Connected' : 'Disconnected' }}
            </span>
          </div>
          <div class="settings-row">
            <div><div class="settings-label">Auto Refresh</div><div class="settings-desc">Reload data every 60s</div></div>
            <label class="admin-toggle"><input type="checkbox" v-model="form.autoRefresh" /><span class="slider"></span></label>
          </div>
        </div>
      </div>

      <!-- Right column -->
      <div>
        <!-- Appearance -->
        <div class="admin-settings-group">
          <div class="settings-group-header">
            <i class="fa-sharp-duotone fa-solid fa-palette"></i> Appearance
          </div>
          <div class="settings-row">
            <div><div class="settings-label">Dark Mode</div><div class="settings-desc">Toggle admin dark theme</div></div>
            <label class="admin-toggle">
              <input type="checkbox" :checked="themeStore.isDark" @change="themeStore.toggle()" />
              <span class="slider"></span>
            </label>
          </div>
          <div class="settings-row">
            <div><div class="settings-label">Sidebar Default</div><div class="settings-desc">Start expanded or collapsed</div></div>
            <select class="settings-select" v-model="form.sidebarDefault">
              <option value="expanded">Expanded</option>
              <option value="collapsed">Collapsed</option>
            </select>
          </div>
          <div class="settings-row">
            <div><div class="settings-label">Brand Color</div><div class="settings-desc">Primary accent color</div></div>
            <div style="display:flex;gap:6px;flex-wrap:wrap">
              <button v-for="c in brandColors" :key="c"
                class="color-swatch"
                :style="{background:c, outline: form.brandColor===c ? '2px solid var(--text-primary)' : 'none', outlineOffset:'2px'}"
                @click="form.brandColor=c"
              ></button>
            </div>
          </div>
        </div>

        <!-- Notifications -->
        <div class="admin-settings-group">
          <div class="settings-group-header">
            <i class="fa-sharp-duotone fa-solid fa-bell"></i> Notifications
          </div>
          <div class="settings-row">
            <div><div class="settings-label">New Order Alert</div><div class="settings-desc">Notify on every new order</div></div>
            <label class="admin-toggle"><input type="checkbox" v-model="form.notifyOrders" /><span class="slider"></span></label>
          </div>
          <div class="settings-row">
            <div><div class="settings-label">Low Stock Alert</div><div class="settings-desc">Alert when stock &lt; 25</div></div>
            <label class="admin-toggle"><input type="checkbox" v-model="form.notifyStock" /><span class="slider"></span></label>
          </div>
          <div class="settings-row">
            <div><div class="settings-label">Daily Summary</div><div class="settings-desc">Email report at midnight</div></div>
            <label class="admin-toggle"><input type="checkbox" v-model="form.notifyDaily" /><span class="slider"></span></label>
          </div>
        </div>

        <!-- Data Export -->
        <div class="admin-settings-group">
          <div class="settings-group-header">
            <i class="fa-sharp-duotone fa-solid fa-file-export"></i> Data Export
          </div>
          <div class="settings-row">
            <div><div class="settings-label">Export All Products</div><div class="settings-desc">Download product catalog</div></div>
            <div style="display:flex;gap:6px">
              <button class="admin-btn secondary" style="font-size:12px;padding:7px 12px" @click="exportData('products','excel')"><i class="fa-solid fa-file-excel" style="color:#22c55e"></i> XLSX</button>
              <button class="admin-btn secondary" style="font-size:12px;padding:7px 12px" @click="exportData('products','csv')"><i class="fa-solid fa-file-csv" style="color:#3b82f6"></i> CSV</button>
              <button class="admin-btn secondary" style="font-size:12px;padding:7px 12px" @click="exportData('products','json')"><i class="fa-solid fa-file-code" style="color:#a855f7"></i> JSON</button>
            </div>
          </div>
          <div class="settings-row">
            <div><div class="settings-label">Export All Orders</div><div class="settings-desc">Download orders report</div></div>
            <div style="display:flex;gap:6px">
              <button class="admin-btn secondary" style="font-size:12px;padding:7px 12px" @click="exportData('orders','excel')"><i class="fa-solid fa-file-excel" style="color:#22c55e"></i> XLSX</button>
              <button class="admin-btn secondary" style="font-size:12px;padding:7px 12px" @click="exportData('orders','csv')"><i class="fa-solid fa-file-csv" style="color:#3b82f6"></i> CSV</button>
              <button class="admin-btn secondary" style="font-size:12px;padding:7px 12px" @click="exportData('orders','json')"><i class="fa-solid fa-file-code" style="color:#a855f7"></i> JSON</button>
            </div>
          </div>
          <div class="settings-row">
            <div><div class="settings-label">Export All Customers</div><div class="settings-desc">Download customer list</div></div>
            <div style="display:flex;gap:6px">
              <button class="admin-btn secondary" style="font-size:12px;padding:7px 12px" @click="exportData('customers','excel')"><i class="fa-solid fa-file-excel" style="color:#22c55e"></i> XLSX</button>
              <button class="admin-btn secondary" style="font-size:12px;padding:7px 12px" @click="exportData('customers','csv')"><i class="fa-solid fa-file-csv" style="color:#3b82f6"></i> CSV</button>
              <button class="admin-btn secondary" style="font-size:12px;padding:7px 12px" @click="exportData('customers','json')"><i class="fa-solid fa-file-code" style="color:#a855f7"></i> JSON</button>
            </div>
          </div>
        </div>

        <!-- Danger zone -->
        <div class="admin-settings-group" style="border-color:rgba(239,68,68,0.2)">
          <div class="settings-group-header" style="color:#ef4444;border-color:rgba(239,68,68,0.2)">
            <i class="fa-sharp-duotone fa-solid fa-triangle-exclamation" style="color:#ef4444"></i> Danger Zone
          </div>
          <div class="settings-row">
            <div>
              <div class="settings-label" style="color:#ef4444">Clear Cache</div>
              <div class="settings-desc">Flush API response cache</div>
            </div>
            <button class="admin-btn danger" style="font-size:12px;padding:7px 12px">
              <i class="fa-sharp fa-solid fa-trash-can"></i> Clear
            </button>
          </div>
          <div class="settings-row">
            <div>
              <div class="settings-label" style="color:#ef4444">Reset Admin Data</div>
              <div class="settings-desc">Wipe local admin preferences</div>
            </div>
            <button class="admin-btn danger" style="font-size:12px;padding:7px 12px" @click="resetForm">
              <i class="fa-sharp fa-solid fa-rotate-left"></i> Reset
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useAdminStore } from '@/stores/useAdminStore'
import { useThemeStore } from '@/stores/useThemeStore'
import { useExport } from '@/composables/useExport'

const adminStore  = useAdminStore()
const themeStore  = useThemeStore()
const exporter    = useExport()
const saved       = ref(false)
const brandColors = ['#f97316','#3b82f6','#a855f7','#22c55e','#ef4444','#06b6d4','#ec4899']

function exportData(type: 'products'|'orders'|'customers', fmt: 'excel'|'csv'|'json') {
  const filename = `${type}_${new Date().toISOString().slice(0,10)}`
  let data: any[] = []
  if (type === 'products') {
    data = adminStore.products.map(p => ({
      Name: p.name, Brand: p.brand, Category: p.category, Price: p.price,
      SalePrice: p.salePrice, Stock: p.stock, Rating: p.rating, Seller: p.seller
    }))
  } else if (type === 'orders') {
    data = adminStore.orders.map(o => ({
      ID: o.id, Customer: o.customer?.name, Email: o.customer?.email,
      Total: o.total, Payment: o.paymentMethod, Status: o.status,
      Date: new Date(o.createdAt).toLocaleDateString()
    }))
  } else {
    data = adminStore.customers.map(c => ({
      Name: c.name, Email: c.email, Phone: c.phone, Orders: c.orderCount,
      TotalSpent: c.totalSpent, LastOrder: c.lastOrder
    }))
  }
  if (fmt === 'excel') exporter.exportExcel(data, filename, type)
  else if (fmt === 'csv') exporter.exportCSV(data, filename)
  else exporter.exportJSON(data, filename)
}

const defaultForm = () => ({
  storeName:      'SellBazar',
  storeUrl:       'https://sellbazar.com',
  supportEmail:   'support@sellbazar.com',
  currency:       'BDT',
  timezone:       'Asia/Dhaka',
  apiUrl:         'http://localhost:4000',
  autoRefresh:    false,
  sidebarDefault: 'expanded',
  brandColor:     '#f97316',
  notifyOrders:   true,
  notifyStock:    true,
  notifyDaily:    false,
})

const form = ref(defaultForm())

function save() {
  saved.value = true
  setTimeout(() => { saved.value = false }, 3000)
}

function resetForm() {
  if (confirm('Reset all settings to defaults?')) form.value = defaultForm()
}
</script>

<style scoped>
.settings-input, .settings-select {
  padding: 8px 12px;
  background: var(--admin-bg, #0c0c0f);
  border: 1px solid var(--sidebar-border);
  border-radius: 8px;
  font-size: 13px;
  color: var(--text-primary);
  outline: none;
  min-width: 180px;
  transition: border-color 0.15s;
  &:focus { border-color: var(--brand); }
}
.color-swatch {
  width: 24px; height: 24px;
  border-radius: 6px;
  border: none;
  cursor: pointer;
  transition: transform 0.15s;
  &:hover { transform: scale(1.15); }
}
.settings-toast {
  position: fixed;
  bottom: 28px;
  right: 28px;
  background: #22c55e;
  color: white;
  padding: 12px 20px;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 8px;
  z-index: 9999;
  box-shadow: 0 8px 24px rgba(34,197,94,0.35);
}
.toast-slide-enter-active, .toast-slide-leave-active { transition: all 0.25s ease; }
.toast-slide-enter-from, .toast-slide-leave-to { opacity: 0; transform: translateY(12px); }
</style>
