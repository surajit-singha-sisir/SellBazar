<template>
  <div class="customers-view">

    <!-- Header -->
    <div class="page-header">
      <div class="header-left">
        <h1 class="page-title">Customers</h1>
        <span class="customer-count">{{ customers.length }} total</span>
      </div>
      <button class="btn-primary" @click="openAddModal">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24"
          stroke="currentColor" stroke-width="2.5">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
        </svg>
        Add Customer
      </button>
    </div>

    <!-- Search & Filter Bar -->
    <div class="toolbar">
      <div class="search-box">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24"
          stroke="currentColor" stroke-width="2">
          <circle cx="11" cy="11" r="8" />
          <path stroke-linecap="round" d="M21 21l-4.35-4.35" />
        </svg>
        <input v-model="search" type="text" placeholder="Search by name or email…" />
      </div>
    </div>

    <!-- Customers Table -->
    <div class="table-card">
      <table class="customers-table">
        <thead>
          <tr>
            <th>Customer</th>
            <th>Phone</th>
            <th>Address</th>
            <th>Joined</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="filteredCustomers.length === 0">
            <td colspan="5" class="empty-state">
              <div class="empty-icon">👥</div>
              <p>No customers found</p>
              <span>Add your first customer to get started</span>
            </td>
          </tr>
          <tr v-for="customer in filteredCustomers" :key="customer.id">
            <td>
              <div class="customer-info">
                <div class="avatar">{{ initials(customer.name) }}</div>
                <div>
                  <div class="customer-name">{{ customer.name }}</div>
                  <div class="customer-email">{{ customer.email }}</div>
                </div>
              </div>
            </td>
            <td class="text-muted">{{ customer.phone || '—' }}</td>
            <td class="text-muted">{{ customer.address || '—' }}</td>
            <td class="text-muted">{{ customer.joinedAt }}</td>
            <td>
              <div class="action-btns">
                <button class="btn-icon" title="Edit" @click="editCustomer(customer)">
                  <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" fill="none" viewBox="0 0 24 24"
                    stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round"
                      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
                <button class="btn-icon btn-danger" title="Delete" @click="confirmDelete(customer)">
                  <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" fill="none" viewBox="0 0 24 24"
                    stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round"
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- ── Add / Edit Customer Modal ── -->
    <Teleport to="body">
      <Transition name="modal">
        <div v-if="showModal" class="modal-backdrop" @click.self="closeModal">
          <div class="modal" role="dialog" aria-modal="true" :aria-label="isEditing ? 'Edit Customer' : 'Add Customer'">

            <!-- Modal Header -->
            <div class="modal-header">
              <h2>{{ isEditing ? 'Edit Customer' : 'Add New Customer' }}</h2>
              <button class="btn-close" @click="closeModal" aria-label="Close">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24"
                  stroke="currentColor" stroke-width="2.5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <!-- Modal Body -->
            <div class="modal-body">
              <!-- Name -->
              <div class="form-group">
                <label for="cust-name">Full Name <span class="required">*</span></label>
                <input id="cust-name" v-model.trim="form.name" type="text" placeholder="e.g. Rahim Uddin"
                  :class="{ 'input-error': errors.name }" @input="clearError('name')" />
                <span v-if="errors.name" class="error-msg">{{ errors.name }}</span>
              </div>

              <!-- Email -->
              <div class="form-group">
                <label for="cust-email">Email Address <span class="required">*</span></label>
                <input id="cust-email" v-model.trim="form.email" type="email" placeholder="e.g. rahim@example.com"
                  :class="{ 'input-error': errors.email }" @input="clearError('email')" />
                <span v-if="errors.email" class="error-msg">{{ errors.email }}</span>
              </div>

              <!-- Phone -->
              <div class="form-group">
                <label for="cust-phone">Phone Number</label>
                <input id="cust-phone" v-model.trim="form.phone" type="tel" placeholder="e.g. +880 1700 000000" />
              </div>

              <!-- Address -->
              <div class="form-group">
                <label for="cust-address">Address</label>
                <textarea id="cust-address" v-model.trim="form.address" rows="2"
                  placeholder="e.g. 12 Zindabazar, Sylhet"></textarea>
              </div>

              <!-- Password (only on Add) -->
              <div v-if="!isEditing" class="form-group">
                <label for="cust-password">Password <span class="required">*</span></label>
                <div class="password-wrap">
                  <input id="cust-password" v-model="form.password" :type="showPassword ? 'text' : 'password'"
                    placeholder="Minimum 8 characters" :class="{ 'input-error': errors.password }"
                    @input="clearError('password')" />
                  <button type="button" class="toggle-pw" @click="showPassword = !showPassword">
                    <svg v-if="!showPassword" xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none"
                      viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path stroke-linecap="round" stroke-linejoin="round"
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    <svg v-else xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none"
                      viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                      <path stroke-linecap="round" stroke-linejoin="round"
                        d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  </button>
                </div>
                <span v-if="errors.password" class="error-msg">{{ errors.password }}</span>
              </div>
            </div>

            <!-- Modal Footer -->
            <div class="modal-footer">
              <button class="btn-secondary" @click="closeModal">Cancel</button>
              <button class="btn-primary" :disabled="isSubmitting" @click="submitForm">
                <span v-if="isSubmitting" class="spinner"></span>
                {{ isSubmitting ? 'Saving…' : (isEditing ? 'Save Changes' : 'Add Customer') }}
              </button>
            </div>

          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- Delete Confirm Modal -->
    <Teleport to="body">
      <Transition name="modal">
        <div v-if="showDeleteModal" class="modal-backdrop" @click.self="showDeleteModal = false">
          <div class="modal modal-sm" role="dialog">
            <div class="modal-header">
              <h2>Delete Customer</h2>
              <button class="btn-close" @click="showDeleteModal = false">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24"
                  stroke="currentColor" stroke-width="2.5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div class="modal-body">
              <p class="delete-msg">Are you sure you want to delete <strong>{{ customerToDelete?.name }}</strong>? This
                action cannot be undone.</p>
            </div>
            <div class="modal-footer">
              <button class="btn-secondary" @click="showDeleteModal = false">Cancel</button>
              <button class="btn-delete" @click="deleteCustomer">Delete</button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- Toast Notification -->
    <Teleport to="body">
      <Transition name="toast">
        <div v-if="toast.show" class="toast" :class="toast.type">
          {{ toast.message }}
        </div>
      </Transition>
    </Teleport>

  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'

// ── State ──────────────────────────────────────────────
const customers = ref([
  { id: 1, name: 'Rahim Uddin', email: 'rahim@example.com', phone: '+880 1700 000001', address: 'Zindabazar, Sylhet', joinedAt: 'Jun 1, 2025' },
  { id: 2, name: 'Fatema Begum', email: 'fatema@example.com', phone: '+880 1800 000002', address: 'Banani, Dhaka', joinedAt: 'Jun 5, 2025' },
  { id: 3, name: 'Karim Hossain', email: 'karim@example.com', phone: '', address: '', joinedAt: 'Jun 10, 2025' },
])

const search = ref('')
const showModal = ref(false)
const isEditing = ref(false)
const isSubmitting = ref(false)
const showPassword = ref(false)
const showDeleteModal = ref(false)
const customerToDelete = ref(null)
const editingId = ref(null)

const form = reactive({ name: '', email: '', phone: '', address: '', password: '' })
const errors = reactive({ name: '', email: '', password: '' })

const toast = reactive({ show: false, message: '', type: 'success' })

// ── Computed ───────────────────────────────────────────
const filteredCustomers = computed(() => {
  const q = search.value.toLowerCase()
  if (!q) return customers.value
  return customers.value.filter(c =>
    c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q)
  )
})

// ── Helpers ────────────────────────────────────────────
const initials = name =>
  name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()

const clearError = field => { errors[field] = '' }

const showToast = (message, type = 'success') => {
  toast.message = message
  toast.type = type
  toast.show = true
  setTimeout(() => { toast.show = false }, 3000)
}

const resetForm = () => {
  Object.assign(form, { name: '', email: '', phone: '', address: '', password: '' })
  Object.assign(errors, { name: '', email: '', password: '' })
  showPassword.value = false
}

// ── Validate ───────────────────────────────────────────
const validate = () => {
  let valid = true
  if (!form.name) { errors.name = 'Full name is required.'; valid = false }
  if (!form.email) {
    errors.email = 'Email is required.'; valid = false
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
    errors.email = 'Enter a valid email address.'; valid = false
  }
  if (!isEditing.value) {
    if (!form.password) { errors.password = 'Password is required.'; valid = false }
    else if (form.password.length < 8) { errors.password = 'Password must be at least 8 characters.'; valid = false }
  }
  return valid
}

// ── Modal controls ─────────────────────────────────────
const openAddModal = () => {
  isEditing.value = false
  editingId.value = null
  resetForm()
  showModal.value = true
}

const editCustomer = customer => {
  isEditing.value = true
  editingId.value = customer.id
  Object.assign(form, {
    name: customer.name,
    email: customer.email,
    phone: customer.phone,
    address: customer.address,
    password: ''
  })
  Object.assign(errors, { name: '', email: '', password: '' })
  showModal.value = true
}

const closeModal = () => {
  showModal.value = false
  resetForm()
}

// ── Submit ─────────────────────────────────────────────
const submitForm = async () => {
  if (!validate()) return
  isSubmitting.value = true

  // Simulate API call — replace with your real API call
  await new Promise(r => setTimeout(r, 800))

  if (isEditing.value) {
    const idx = customers.value.findIndex(c => c.id === editingId.value)
    if (idx !== -1) {
      customers.value[idx] = {
        ...customers.value[idx],
        name: form.name,
        email: form.email,
        phone: form.phone,
        address: form.address,
      }
    }
    showToast('Customer updated successfully.')
  } else {
    const newCustomer = {
      id: Date.now(),
      name: form.name,
      email: form.email,
      phone: form.phone,
      address: form.address,
      joinedAt: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    }
    customers.value.unshift(newCustomer)
    showToast('Customer added successfully.')
  }

  isSubmitting.value = false
  closeModal()
}

// ── Delete ─────────────────────────────────────────────
const confirmDelete = customer => {
  customerToDelete.value = customer
  showDeleteModal.value = true
}

const deleteCustomer = () => {
  customers.value = customers.value.filter(c => c.id !== customerToDelete.value.id)
  showDeleteModal.value = false
  customerToDelete.value = null
  showToast('Customer removed.', 'error')
}
</script>

<style scoped>
/* ── Layout ── */
.customers-view {
  padding: 24px;
  max-width: 1100px;
  margin: 0 auto;
  font-family: 'Inter', system-ui, sans-serif;
}

/* ── Header ── */
.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
}

.header-left {
  display: flex;
  align-items: baseline;
  gap: 10px;
}

.page-title {
  font-size: 22px;
  font-weight: 700;
  color: #111827;
  margin: 0;
}

.customer-count {
  font-size: 13px;
  color: #6b7280;
  background: #f3f4f6;
  border-radius: 999px;
  padding: 2px 10px;
}

/* ── Toolbar ── */
.toolbar {
  margin-bottom: 16px;
}

.search-box {
  display: flex;
  align-items: center;
  gap: 8px;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 8px 14px;
  max-width: 320px;
}

.search-box svg {
  color: #9ca3af;
  flex-shrink: 0;
}

.search-box input {
  border: none;
  outline: none;
  font-size: 14px;
  color: #374151;
  background: transparent;
  width: 100%;
}

/* ── Table ── */
.table-card {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  overflow: hidden;
}

.customers-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
}

.customers-table thead {
  background: #f9fafb;
  border-bottom: 1px solid #e5e7eb;
}

.customers-table th {
  padding: 12px 16px;
  text-align: left;
  font-size: 12px;
  font-weight: 600;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.customers-table td {
  padding: 14px 16px;
  border-bottom: 1px solid #f3f4f6;
  color: #374151;
}

.customers-table tbody tr:last-child td {
  border-bottom: none;
}

.customers-table tbody tr:hover {
  background: #fafafa;
}

.text-muted {
  color: #9ca3af;
}

/* ── Customer Info Cell ── */
.customer-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: #6366f1;
  color: #fff;
  font-size: 13px;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.customer-name {
  font-weight: 500;
  color: #111827;
}

.customer-email {
  font-size: 12px;
  color: #9ca3af;
  margin-top: 2px;
}

/* ── Action Buttons ── */
.action-btns {
  display: flex;
  gap: 6px;
}

.btn-icon {
  width: 32px;
  height: 32px;
  border: 1px solid #e5e7eb;
  border-radius: 7px;
  background: #fff;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #6b7280;
  transition: all 0.15s;
}

.btn-icon:hover {
  background: #f3f4f6;
  color: #374151;
}

.btn-icon.btn-danger:hover {
  background: #fef2f2;
  color: #ef4444;
  border-color: #fecaca;
}

/* ── Empty State ── */
.empty-state {
  text-align: center;
  padding: 60px 16px;
  color: #9ca3af;
}

.empty-icon {
  font-size: 36px;
  margin-bottom: 10px;
}

.empty-state p {
  font-weight: 500;
  color: #374151;
  margin: 0 0 4px;
}

.empty-state span {
  font-size: 13px;
}

/* ── Primary Button ── */
.btn-primary {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: #6366f1;
  color: #fff;
  border: none;
  border-radius: 8px;
  padding: 9px 16px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.15s;
}

.btn-primary:hover {
  background: #4f46e5;
}

.btn-primary:disabled {
  background: #a5b4fc;
  cursor: not-allowed;
}

.btn-secondary {
  background: #fff;
  color: #374151;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  padding: 9px 16px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.15s;
}

.btn-secondary:hover {
  background: #f9fafb;
}

.btn-delete {
  background: #ef4444;
  color: #fff;
  border: none;
  border-radius: 8px;
  padding: 9px 16px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.15s;
}

.btn-delete:hover {
  background: #dc2626;
}

/* ── Modal Backdrop ── */
.modal-backdrop {
  position: fixed;
  inset: 0;
  z-index: 1000;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
}

/* ── Modal Box ── */
.modal {
  background: #fff;
  border-radius: 14px;
  width: 100%;
  max-width: 480px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.18);
  display: flex;
  flex-direction: column;
  max-height: 90vh;
}

.modal.modal-sm {
  max-width: 380px;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px 0;
}

.modal-header h2 {
  font-size: 17px;
  font-weight: 700;
  color: #111827;
  margin: 0;
}

.btn-close {
  background: none;
  border: none;
  cursor: pointer;
  color: #9ca3af;
  display: flex;
  align-items: center;
  transition: color 0.15s;
}

.btn-close:hover {
  color: #374151;
}

.modal-body {
  padding: 20px 24px;
  overflow-y: auto;
}

.modal-footer {
  padding: 16px 24px;
  border-top: 1px solid #f3f4f6;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

/* ── Form ── */
.form-group {
  margin-bottom: 16px;
}

.form-group:last-child {
  margin-bottom: 0;
}

.form-group label {
  display: block;
  font-size: 13px;
  font-weight: 500;
  color: #374151;
  margin-bottom: 6px;
}

.required {
  color: #ef4444;
}

.form-group input,
.form-group textarea {
  width: 100%;
  box-sizing: border-box;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  padding: 9px 12px;
  font-size: 14px;
  color: #111827;
  outline: none;
  transition: border-color 0.15s, box-shadow 0.15s;
  font-family: inherit;
}

.form-group textarea {
  resize: vertical;
}

.form-group input:focus,
.form-group textarea:focus {
  border-color: #6366f1;
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.12);
}

.input-error {
  border-color: #ef4444 !important;
}

.error-msg {
  font-size: 12px;
  color: #ef4444;
  margin-top: 4px;
  display: block;
}

/* ── Password toggle ── */
.password-wrap {
  position: relative;
}

.password-wrap input {
  padding-right: 40px;
}

.toggle-pw {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  cursor: pointer;
  color: #9ca3af;
  display: flex;
  align-items: center;
  transition: color 0.15s;
}

.toggle-pw:hover {
  color: #374151;
}

/* ── Spinner ── */
.spinner {
  display: inline-block;
  width: 14px;
  height: 14px;
  border: 2px solid rgba(255, 255, 255, 0.4);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* ── Delete Confirm ── */
.delete-msg {
  font-size: 14px;
  color: #374151;
  line-height: 1.6;
}

/* ── Toast ── */
.toast {
  position: fixed;
  bottom: 24px;
  right: 24px;
  z-index: 2000;
  padding: 12px 20px;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 500;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  pointer-events: none;
}

.toast.success {
  background: #10b981;
  color: #fff;
}

.toast.error {
  background: #ef4444;
  color: #fff;
}

/* ── Transitions ── */
.modal-enter-active,
.modal-leave-active {
  transition: all 0.2s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-from .modal,
.modal-leave-to .modal {
  transform: scale(0.95) translateY(10px);
}

.toast-enter-active,
.toast-leave-active {
  transition: all 0.25s ease;
}

.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateY(10px);
}

/* ── Responsive ── */
@media (max-width: 640px) {
  .customers-view {
    padding: 16px;
  }

  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .customers-table th:nth-child(3),
  .customers-table td:nth-child(3) {
    display: none;
  }
}
</style>