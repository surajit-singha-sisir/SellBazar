<template>
  <div class="admin-page-wrap">
    <!-- Header -->
    <div class="admin-page-header">
      <div>
        <h1 class="page-title">Admin Management</h1>
        <p class="page-subtitle">{{ admins.length }} admin accounts — role-based access control</p>
      </div>
      <button class="admin-btn primary" @click="openCreate">
        <i class="fa-sharp fa-solid fa-user-plus"></i> Add Admin
      </button>
    </div>

    <!-- Access denied for non-superadmin -->
    <div v-if="!isSuperAdmin" class="am-denied">
      <i class="fa-sharp-duotone fa-solid fa-shield-xmark"></i>
      <div class="am-denied-title">Access Restricted</div>
      <div class="am-denied-sub">Only Superadmins can manage admin accounts.</div>
    </div>

    <template v-else>
      <!-- Role permission matrix -->
      <div class="am-matrix-card">
        <div class="am-matrix-header">
          <i class="fa-sharp-duotone fa-solid fa-table-cells"></i> Role Permission Matrix
        </div>
        <div class="am-matrix-scroll">
          <table class="am-matrix">
            <thead>
              <tr>
                <th>Permission</th>
                <th v-for="r in ROLES" :key="r.key">
                  <span class="role-badge" :style="`background:${r.color}22;color:${r.color}`">
                    <i :class="r.icon"></i> {{ r.label }}
                  </span>
                </th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="perm in PERMISSIONS" :key="perm.key">
                <td class="am-perm-label">
                  <i :class="perm.icon" class="am-perm-icon"></i> {{ perm.label }}
                </td>
                <td v-for="r in ROLES" :key="r.key" class="am-perm-cell">
                  <i v-if="hasPermission(r.key, perm.key)"
                     class="fa-sharp fa-solid fa-circle-check am-check"></i>
                  <i v-else
                     class="fa-sharp fa-regular fa-circle-xmark am-cross"></i>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="am-loading">
        <i class="fa-solid fa-spinner-third fa-spin fa-2x"></i>
        <span>Loading admins…</span>
      </div>

      <!-- Admin cards grid -->
      <div v-else class="am-grid">
        <div v-for="a in admins" :key="a.id" class="am-card" :class="{ inactive: a.active === false }">
          <!-- Card top -->
          <div class="am-card-top">
            <div class="am-avatar" :style="`background:${roleColor(a.role)}22;color:${roleColor(a.role)}`">
              <i :class="roleIcon(a.role)"></i>
            </div>
            <div class="am-card-info">
              <div class="am-card-name">{{ a.name }}</div>
              <div class="am-card-email">{{ a.email }}</div>
            </div>
            <!-- Actions (can't edit yourself or primary superadmin unless you ARE that account) -->
            <div class="am-card-actions" v-if="a.id !== currentAdminId || a.id === 'admin-1'">
              <button class="am-action-btn" title="Edit" @click="openEdit(a)"
                :disabled="a.id === 'admin-1' && a.id !== currentAdminId">
                <i class="fa-sharp fa-regular fa-pen"></i>
              </button>
              <button class="am-action-btn danger" title="Delete" @click="confirmDelete(a)"
                :disabled="a.id === 'admin-1' || a.id === currentAdminId">
                <i class="fa-sharp fa-regular fa-trash"></i>
              </button>
            </div>
          </div>

          <!-- Role badge + status -->
          <div class="am-card-meta">
            <span class="role-badge" :style="`background:${roleColor(a.role)}22;color:${roleColor(a.role)}`">
              <i :class="roleIcon(a.role)"></i> {{ a.role }}
            </span>
            <span class="status-badge" :class="a.active === false ? 'cancelled' : 'delivered'">
              {{ a.active === false ? 'Inactive' : 'Active' }}
            </span>
            <span v-if="a.id === currentAdminId" class="am-you-badge">You</span>
          </div>

          <!-- Created -->
          <div v-if="a.createdAt" class="am-card-date">
            <i class="fa-sharp fa-regular fa-calendar"></i>
            Added {{ fmtDate(a.createdAt) }}
          </div>

          <!-- Toggle active (not for primary or self) -->
          <div v-if="a.id !== 'admin-1' && a.id !== currentAdminId" class="am-card-toggle">
            <label class="am-toggle-row">
              <span class="am-toggle-label">Account Active</span>
              <label class="admin-toggle">
                <input type="checkbox" :checked="a.active !== false" @change="toggleActive(a)" />
                <span class="slider"></span>
              </label>
            </label>
          </div>
        </div>
      </div>
    </template>

    <!-- ── Modal ── -->
    <Teleport to="body">
      <Transition name="am-modal">
        <div v-if="modal.open" class="am-overlay" @click.self="closeModal">
          <div class="am-modal">
            <div class="am-modal-header">
              <h2>{{ modal.mode === 'create' ? 'Add New Admin' : 'Edit Admin' }}</h2>
              <button class="am-modal-close" @click="closeModal">
                <i class="fa-sharp fa-solid fa-xmark"></i>
              </button>
            </div>

            <div class="am-modal-body">
              <!-- Name -->
              <div class="am-field">
                <label class="am-label">Full Name <span class="req">*</span></label>
                <input class="am-input" v-model="form.name" placeholder="e.g. Karim Hossain" />
              </div>
              <!-- Email -->
              <div class="am-field">
                <label class="am-label">Email Address <span class="req">*</span></label>
                <input class="am-input" v-model="form.email" type="email" placeholder="admin@sellbazar.com"
                  :disabled="modal.mode === 'edit'" />
                <span v-if="modal.mode === 'edit'" class="am-hint">Email cannot be changed after creation</span>
              </div>
              <!-- Password -->
              <div class="am-field">
                <label class="am-label">
                  {{ modal.mode === 'create' ? 'Password' : 'New Password' }}
                  <span v-if="modal.mode === 'create'" class="req">*</span>
                </label>
                <div class="am-pw-wrap">
                  <input class="am-input" v-model="form.password"
                    :type="showPw ? 'text' : 'password'"
                    :placeholder="modal.mode === 'edit' ? 'Leave blank to keep current' : 'Min. 8 characters'" />
                  <button type="button" class="am-pw-toggle" @click="showPw = !showPw">
                    <i :class="showPw ? 'fa-sharp fa-regular fa-eye-slash' : 'fa-sharp fa-regular fa-eye'"></i>
                  </button>
                </div>
              </div>
              <!-- Role -->
              <div class="am-field">
                <label class="am-label">Role <span class="req">*</span></label>
                <div class="am-role-grid">
                  <button
                    v-for="r in ROLES.filter(r => r.key !== 'superadmin')"
                    :key="r.key"
                    type="button"
                    class="am-role-btn"
                    :class="{ active: form.role === r.key }"
                    :style="form.role === r.key ? `background:${r.color}22;border-color:${r.color};color:${r.color}` : ''"
                    @click="form.role = r.key"
                  >
                    <i :class="r.icon"></i>
                    <span class="am-role-btn-label">{{ r.label }}</span>
                    <span class="am-role-btn-desc">{{ r.desc }}</span>
                  </button>
                </div>
              </div>

              <!-- Error -->
              <div v-if="modalError" class="am-error">
                <i class="fa-sharp fa-solid fa-circle-exclamation"></i> {{ modalError }}
              </div>
            </div>

            <div class="am-modal-footer">
              <button class="admin-btn secondary" @click="closeModal">Cancel</button>
              <button class="admin-btn primary" @click="submitModal" :disabled="saving">
                <i v-if="saving" class="fa-solid fa-spinner-third fa-spin"></i>
                {{ saving ? 'Saving…' : modal.mode === 'create' ? 'Create Admin' : 'Save Changes' }}
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- Toast -->
    <Teleport to="body">
      <Transition name="toast-slide">
        <div v-if="toast.show" class="am-toast" :class="toast.type">
          <i :class="toast.type === 'success' ? 'fa-solid fa-circle-check' : 'fa-solid fa-circle-exclamation'"></i>
          {{ toast.message }}
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useAdminStore } from '@/stores/useAdminStore'

const adminStore = useAdminStore()
const BASE = '/api'

// ── Role & permission config ─────────────────────────────────────────────────
const ROLES = [
  { key: 'superadmin', label: 'Superadmin', icon: 'fa-sharp-duotone fa-solid fa-user-crown',      color: '#f97316', desc: 'Full access' },
  { key: 'admin',      label: 'Admin',      icon: 'fa-sharp-duotone fa-solid fa-user-tie',         color: '#3b82f6', desc: 'Most features' },
  { key: 'manager',    label: 'Manager',    icon: 'fa-sharp-duotone fa-solid fa-user-gear',         color: '#a855f7', desc: 'Orders & products' },
  { key: 'editor',     label: 'Editor',     icon: 'fa-sharp-duotone fa-solid fa-user-pen',          color: '#22c55e', desc: 'Products only' },
  { key: 'viewer',     label: 'Viewer',     icon: 'fa-sharp-duotone fa-solid fa-user-magnifying-glass', color: '#94a3b8', desc: 'Read-only' },
]

const PERMISSIONS = [
  { key: 'dashboard',   label: 'View Dashboard',    icon: 'fa-sharp fa-solid fa-grid-2' },
  { key: 'products',    label: 'Manage Products',   icon: 'fa-sharp fa-solid fa-box-open' },
  { key: 'orders',      label: 'Manage Orders',     icon: 'fa-sharp fa-solid fa-bag-shopping' },
  { key: 'categories',  label: 'Manage Categories', icon: 'fa-sharp fa-solid fa-layer-group' },
  { key: 'customers',   label: 'View Customers',    icon: 'fa-sharp fa-solid fa-users' },
  { key: 'analytics',   label: 'View Analytics',    icon: 'fa-sharp fa-solid fa-chart-mixed' },
  { key: 'settings',    label: 'Manage Settings',   icon: 'fa-sharp fa-solid fa-gear' },
  { key: 'admins',      label: 'Manage Admins',     icon: 'fa-sharp fa-solid fa-user-shield' },
]

const ROLE_PERMISSIONS: Record<string, string[]> = {
  superadmin: ['dashboard','products','orders','categories','customers','analytics','settings','admins'],
  admin:      ['dashboard','products','orders','categories','customers','analytics','settings'],
  manager:    ['dashboard','products','orders','customers'],
  editor:     ['dashboard','products'],
  viewer:     ['dashboard','customers','analytics'],
}

function hasPermission(role: string, perm: string) {
  return (ROLE_PERMISSIONS[role] ?? []).includes(perm)
}

function roleColor(role: string) { return ROLES.find(r => r.key === role)?.color ?? '#94a3b8' }
function roleIcon(role: string)  { return ROLES.find(r => r.key === role)?.icon ?? 'fa-sharp-duotone fa-solid fa-user' }

// ── State ────────────────────────────────────────────────────────────────────
const isSuperAdmin  = computed(() => adminStore.adminUser?.role === 'superadmin')
const currentAdminId = computed(() => {
  const u = adminStore.adminUser as any
  return u?.id ?? ''
})

interface AdminAccount {
  id: string; name: string; email: string; role: string; active?: boolean; createdAt?: string
}

const admins  = ref<AdminAccount[]>([])
const loading = ref(false)
const saving  = ref(false)
const showPw  = ref(false)
const modalError = ref('')

const toast = reactive({ show: false, message: '', type: 'success' as 'success' | 'error' })
let toastTimer = 0
function showToast(msg: string, type: 'success' | 'error' = 'success') {
  clearTimeout(toastTimer)
  Object.assign(toast, { show: true, message: msg, type })
  toastTimer = window.setTimeout(() => { toast.show = false }, 3000)
}

// ── Modal ────────────────────────────────────────────────────────────────────
const modal = reactive({ open: false, mode: 'create' as 'create' | 'edit', editId: '' })
const form  = reactive({ name: '', email: '', password: '', role: 'admin' })

function resetForm() { Object.assign(form, { name: '', email: '', password: '', role: 'admin' }); modalError.value = ''; showPw.value = false }
function closeModal() { modal.open = false; resetForm() }

function openCreate() {
  resetForm()
  Object.assign(modal, { open: true, mode: 'create', editId: '' })
}
function openEdit(a: AdminAccount) {
  resetForm()
  Object.assign(form, { name: a.name, email: a.email, password: '', role: a.role })
  Object.assign(modal, { open: true, mode: 'edit', editId: a.id })
}

// ── API helpers ───────────────────────────────────────────────────────────────
function authHeaders() {
  const token = localStorage.getItem('sb-admin-token') ?? ''
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }
}

async function apiRequest(path: string, options: RequestInit = {}) {
  const res = await fetch(`${BASE}${path}`, { ...options, headers: authHeaders() })
  const json = await res.json()
  if (!res.ok) throw new Error(json.error ?? `HTTP ${res.status}`)
  return json
}

async function loadAdmins() {
  loading.value = true
  try {
    const res = await apiRequest('/admin/admins')
    admins.value = res.data
  } catch (e: any) {
    showToast(e.message, 'error')
  } finally { loading.value = false }
}

async function submitModal() {
  modalError.value = ''
  if (!form.name.trim() || !form.email.trim()) { modalError.value = 'Name and email are required'; return }
  if (modal.mode === 'create' && !form.password) { modalError.value = 'Password is required'; return }
  if (form.password && form.password.length < 8) { modalError.value = 'Password must be at least 8 characters'; return }
  saving.value = true
  try {
    const body: any = { name: form.name, role: form.role }
    if (modal.mode === 'create') { body.email = form.email; body.password = form.password }
    if (modal.mode === 'edit' && form.password) body.password = form.password
    if (modal.mode === 'create') {
      await apiRequest('/admin/admins', { method: 'POST', body: JSON.stringify(body) })
      showToast(`Admin "${form.name}" created`)
    } else {
      await apiRequest(`/admin/admins/${modal.editId}`, { method: 'PUT', body: JSON.stringify(body) })
      showToast(`Admin "${form.name}" updated`)
    }
    closeModal()
    await loadAdmins()
  } catch (e: any) {
    modalError.value = e.message
  } finally { saving.value = false }
}

async function confirmDelete(a: AdminAccount) {
  if (!confirm(`Delete admin "${a.name}" (${a.email})? This cannot be undone.`)) return
  try {
    await apiRequest(`/admin/admins/${a.id}`, { method: 'DELETE' })
    showToast(`Admin "${a.name}" deleted`)
    await loadAdmins()
  } catch (e: any) { showToast(e.message, 'error') }
}

async function toggleActive(a: AdminAccount) {
  const newActive = a.active === false ? true : false
  try {
    await apiRequest(`/admin/admins/${a.id}`, { method: 'PUT', body: JSON.stringify({ active: newActive }) })
    a.active = newActive
    showToast(`${a.name} ${newActive ? 'activated' : 'deactivated'}`)
  } catch (e: any) { showToast(e.message, 'error') }
}

function fmtDate(d: string) {
  if (!d) return ''
  return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

onMounted(() => { if (isSuperAdmin.value) loadAdmins() })
</script>
