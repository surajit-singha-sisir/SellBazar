<template>
  <div class="admin-page-wrap">
    <div class="admin-page-header">
      <div>
        <h1 class="page-title">Settings</h1>
        <p class="page-subtitle">Configure your SellBazar store &amp; admin preferences.</p>
      </div>
      <button class="admin-btn primary" @click="save" :disabled="saving">
        <i v-if="saving" class="fa-solid fa-spinner-third fa-spin"></i>
        <i v-else class="fa-sharp fa-solid fa-floppy-disk"></i>
        {{ saving ? 'Saving…' : 'Save Changes' }}
      </button>
    </div>

    <!-- Save toast -->
    <Transition name="toast-slide">
      <div v-if="saved" class="settings-toast">
        <i class="fa-sharp fa-solid fa-circle-check"></i> Settings saved successfully!
      </div>
    </Transition>

    <div class="admin-grid-2">
      <!-- LEFT column -->
      <div>
        <!-- Store Information -->
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

        <!-- Server Connection (no API URL row) -->
        <div class="admin-settings-group">
          <div class="settings-group-header">
            <i class="fa-sharp-duotone fa-solid fa-server"></i> Server Connection
          </div>
          <div class="settings-row">
            <div><div class="settings-label">Server Status</div><div class="settings-desc">Live connection health</div></div>
            <div style="display:flex;align-items:center;gap:8px">
              <span class="status-badge" :class="adminStore.serverOnline ? 'delivered' : 'cancelled'">
                <i :class="adminStore.serverOnline ? 'fa-solid fa-circle-check' : 'fa-solid fa-circle-xmark'"></i>
                {{ adminStore.serverOnline ? 'Connected' : 'Disconnected' }}
              </span>
              <button class="admin-btn secondary" style="padding:5px 10px;font-size:11px" @click="adminStore.checkHealth()" title="Re-check now">
                <i class="fa-solid fa-arrows-rotate" :class="{'fa-spin': adminStore.loading.health}"></i>
              </button>
            </div>
          </div>
          <div class="settings-row">
            <div>
              <div class="settings-label">Auto Refresh</div>
              <div class="settings-desc">Reload dashboard data automatically</div>
            </div>
            <label class="admin-toggle"><input type="checkbox" v-model="form.autoRefresh" /><span class="slider"></span></label>
          </div>
          <div class="settings-row" v-if="form.autoRefresh">
            <div>
              <div class="settings-label">Refresh Interval</div>
              <div class="settings-desc">How often to reload data</div>
            </div>
            <select class="settings-select" v-model.number="form.autoRefreshInterval">
              <option :value="30">Every 30 seconds</option>
              <option :value="60">Every 60 seconds</option>
              <option :value="120">Every 2 minutes</option>
              <option :value="300">Every 5 minutes</option>
            </select>
          </div>
        </div>
      </div>

      <!-- RIGHT column -->
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
            <div>
              <div class="settings-label">Brand Color</div>
              <div class="settings-desc">Primary accent color (applied live)</div>
            </div>
            <div style="display:flex;gap:6px;flex-wrap:wrap;align-items:center">
              <button
                v-for="c in brandColors"
                :key="c"
                class="color-swatch"
                :style="{background:c, outline: form.brandColor===c ? '2px solid var(--text-primary)' : 'none', outlineOffset:'2px'}"
                @click="pickColor(c)"
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
            <button class="admin-btn danger" style="font-size:12px;padding:7px 12px" @click="clearCache">
              <i class="fa-sharp fa-solid fa-trash-can"></i> Clear
            </button>
          </div>
          <div class="settings-row">
            <div>
              <div class="settings-label" style="color:#ef4444">Reset Admin Data</div>
              <div class="settings-desc">Wipe all saved preferences to defaults</div>
            </div>
            <button class="admin-btn danger" style="font-size:12px;padding:7px 12px" @click="resetSettings">
              <i class="fa-sharp fa-solid fa-rotate-left"></i> Reset
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useAdminStore } from '@/stores/useAdminStore'
import { useThemeStore } from '@/stores/useThemeStore'
import { useSettingsStore } from '@/stores/useSettingsStore'
import { useExport } from '@/composables/useExport'

const adminStore    = useAdminStore()
const themeStore    = useThemeStore()
const settingsStore = useSettingsStore()
const exporter      = useExport()

const saving  = ref(false)
const saved   = ref(false)
const brandColors = ['#f97316','#3b82f6','#a855f7','#22c55e','#ef4444','#06b6d4','#ec4899']

// Local form — mirrors the store; only committed on Save
const form = reactive({ ...settingsStore.settings })

// Live-preview brand color while the user hovers swatches
function pickColor(c: string) {
  form.brandColor = c
  settingsStore.applyBrandColor(c)   // preview immediately
}

async function save() {
  saving.value = true
  // small async tick so the spinner renders
  await new Promise(r => setTimeout(r, 200))
  settingsStore.save({ ...form })
  saving.value = false
  saved.value  = true
  setTimeout(() => { saved.value = false }, 3000)
}

function clearCache() {
  // Clear any cached API data from the admin store
  if (confirm('Clear cached data? The page will reload fresh data.')) {
    adminStore.loadAll()
    saved.value = true
    setTimeout(() => { saved.value = false }, 2000)
  }
}

function resetSettings() {
  if (confirm('Reset all settings to defaults?')) {
    settingsStore.reset()
    // Sync the local form back to defaults
    Object.assign(form, settingsStore.settings)
    saved.value = true
    setTimeout(() => { saved.value = false }, 2500)
  }
}

function exportData(type: 'products' | 'orders' | 'customers', fmt: 'excel' | 'csv' | 'json') {
  const filename = `${type}_${new Date().toISOString().slice(0, 10)}`
  let data: any[] = []
  if (type === 'products') {
    data = adminStore.products.map(p => ({
      Name: p.name, Brand: p.brand, Category: p.category,
      Price: p.price, SalePrice: p.salePrice, Stock: p.stock,
      Rating: p.rating, Seller: p.seller,
    }))
  } else if (type === 'orders') {
    data = adminStore.orders.map(o => ({
      ID: o.id, Customer: o.customer?.name, Email: o.customer?.email,
      Total: o.total, Payment: o.paymentMethod, Status: o.status,
      Date: new Date(o.createdAt).toLocaleDateString(),
    }))
  } else {
    data = adminStore.customers.map(c => ({
      Name: c.name, Email: c.email, Phone: c.phone,
      Orders: c.orderCount, TotalSpent: c.totalSpent, LastOrder: c.lastOrder,
    }))
  }
  if (fmt === 'excel') exporter.exportExcel(data, filename, type)
  else if (fmt === 'csv') exporter.exportCSV(data, filename)
  else exporter.exportJSON(data, filename)
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
}
.settings-input:focus, .settings-select:focus { border-color: var(--brand); }
select.settings-select {
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%238888a0' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 12px center;
  padding-right: 32px;
  background-color: var(--admin-bg, #0c0c0f);
  cursor: pointer;
}
.color-swatch {
  width: 24px; height: 24px; border-radius: 6px;
  border: none; cursor: pointer; transition: transform 0.15s;
}
.color-swatch:hover { transform: scale(1.2); }
.settings-toast {
  position: fixed; bottom: 28px; right: 28px;
  background: #22c55e; color: white;
  padding: 12px 20px; border-radius: 10px;
  font-size: 13px; font-weight: 600;
  display: flex; align-items: center; gap: 8px;
  z-index: 9999; box-shadow: 0 8px 24px rgba(34,197,94,0.35);
}
.toast-slide-enter-active, .toast-slide-leave-active { transition: all 0.25s ease; }
.toast-slide-enter-from, .toast-slide-leave-to { opacity: 0; transform: translateY(12px); }
</style>
