<template>
  <div class="min-h-screen flex items-center justify-center px-4 py-12 bg-mesh">
    <div class="w-full max-w-md">
      <div class="card p-8 space-y-6">

        <!-- Brand -->
        <div class="text-center">
          <RouterLink to="/" class="inline-flex items-center gap-2">
            <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-fuchsia-600 flex items-center justify-center shadow-lg">
              <i class="fa-sharp fa-solid fa-store text-white text-sm"></i>
            </div>
            <span class="font-display font-extrabold text-2xl"><span class="gradient-text">Sell</span>Bazar</span>
          </RouterLink>
          <h1 class="font-display font-bold text-2xl mt-4">Create Account</h1>
          <p class="text-sm text-[var(--color-text-muted)] mt-1">Join millions of shoppers in Bangladesh</p>
        </div>

        <!-- Server error -->
        <div v-if="serverError" class="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-sm text-red-500">
          <i class="fa-sharp fa-solid fa-circle-exclamation mr-2"></i>{{ serverError }}
        </div>

        <!-- Fields -->
        <div class="space-y-4">
          <!-- Full Name -->
          <div>
            <label class="field-label"><i class="fa-sharp fa-regular fa-user mr-1"></i> Full Name *</label>
            <input v-model="form.name" @blur="touch('name')" class="input-field" :class="fieldClass('name')" placeholder="Your full name" />
            <p v-if="errors.name" class="field-error">{{ errors.name }}</p>
          </div>

          <!-- Email -->
          <div>
            <label class="field-label"><i class="fa-sharp fa-regular fa-at mr-1"></i> Email *</label>
            <input v-model="form.email" @blur="touch('email')" @input="touch('email')" type="email" class="input-field" :class="fieldClass('email')" placeholder="you@example.com" />
            <p v-if="errors.email" class="field-error">{{ errors.email }}</p>
          </div>

          <!-- Phone -->
          <div>
            <label class="field-label"><i class="fa-sharp fa-regular fa-mobile-screen-button mr-1"></i> Phone Number *</label>
            <div class="relative">
              <span class="prefix-badge">+880</span>
              <input v-model="form.phone" @blur="touch('phone')" @input="touch('phone')" type="tel" class="input-field pl-14" :class="fieldClass('phone')" placeholder="1XXXXXXXXX" maxlength="10" />
            </div>
            <p v-if="errors.phone" class="field-error">{{ errors.phone }}</p>
          </div>

          <!-- Division -->
          <div>
            <label class="field-label"><i class="fa-sharp fa-regular fa-map mr-1"></i> Division</label>
            <select v-model="form.division" @blur="touch('division')" class="input-field" :class="fieldClass('division')">
              <option value="">Select your division</option>
              <option v-for="d in divisions" :key="d">{{ d }}</option>
            </select>
            <p v-if="errors.division" class="field-error">{{ errors.division }}</p>
          </div>

          <!-- Password -->
          <div>
            <label class="field-label"><i class="fa-sharp fa-regular fa-lock mr-1"></i> Password *</label>
            <div class="relative">
              <input v-model="form.password" @blur="touch('password')" :type="showPw ? 'text' : 'password'" class="input-field pr-10" :class="fieldClass('password')" placeholder="Min. 8 characters" />
              <button type="button" @click="showPw = !showPw" class="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition">
                <i :class="showPw ? 'fa-sharp fa-regular fa-eye-slash' : 'fa-sharp fa-regular fa-eye'" class="text-sm"></i>
              </button>
            </div>
            <div v-if="form.password" class="mt-1.5 flex gap-1">
              <div v-for="i in 4" :key="i" class="h-1 flex-1 rounded-full transition-all duration-300" :class="i <= pwStrength ? pwStrengthColor : 'bg-[var(--color-border)]'"></div>
            </div>
            <p v-if="form.password" class="text-[10px] mt-0.5" :class="pwStrengthTextColor">{{ pwStrengthLabel }}</p>
            <p v-if="errors.password" class="field-error">{{ errors.password }}</p>
          </div>
        </div>

        <!-- Submit -->
        <button @click="register" :disabled="loading" class="btn-primary w-full justify-center py-3.5 text-base disabled:opacity-60">
          <i v-if="loading" class="fa-sharp fa-solid fa-spinner animate-spin"></i>
          <i v-else class="fa-sharp fa-regular fa-user-plus"></i>
          {{ loading ? 'Creating Account...' : 'Create Account' }}
        </button>

        <p class="text-center text-sm text-[var(--color-text-muted)]">
          Already have an account?
          <RouterLink to="/login" class="text-orange-500 font-medium hover:underline">Sign In</RouterLink>
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/useAuthStore'

const router    = useRouter()
const authStore = useAuthStore()
const loading     = ref(false)
const serverError = ref('')
const showPw      = ref(false)

const form = ref({ name: '', email: '', phone: '', division: '', password: '' })
const divisions = ['Dhaka', 'Chittagong', 'Rajshahi', 'Khulna', 'Barisal', 'Sylhet', 'Rangpur', 'Mymensingh']

const touched = ref<Record<string, boolean>>({})
function touch(field: string) {
  touched.value[field] = true
  if (serverFieldErrors.value[field]) {
    const copy = { ...serverFieldErrors.value }
    delete copy[field]
    serverFieldErrors.value = copy
  }
}

const nameRe   = /^[A-Za-z\u0980-\u09FF\s'-]{2,60}$/
const emailRe  = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const phoneRe  = /^1[3-9]\d{8}$/
const strongPw = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/

const serverFieldErrors = ref<Record<string, string>>({})

const errors = computed(() => {
  const e: Record<string, string> = { ...serverFieldErrors.value }
  if (touched.value.name) {
    if (!form.value.name) e.name = 'Full name is required'
    else if (!nameRe.test(form.value.name)) e.name = 'Name must be 2–60 letters (no special characters)'
  }
  if (touched.value.email) {
    if (!form.value.email) e.email = 'Email is required'
    else if (!emailRe.test(form.value.email)) e.email = 'Enter a valid email address'
  }
  if (touched.value.phone) {
    if (!form.value.phone) e.phone = 'Phone number is required'
    else if (!phoneRe.test(form.value.phone)) e.phone = 'Enter 10 digits starting with 1 (e.g. 1712345678)'
  }
  if (touched.value.division && !form.value.division) e.division = 'Please select your division'
  if (touched.value.password) {
    if (!form.value.password) e.password = 'Password is required'
    else if (!strongPw.test(form.value.password)) e.password = 'Min. 8 chars with at least 1 letter & 1 number'
  }
  return e
})

function fieldClass(field: string) {
  if (!touched.value[field]) return ''
  return errors.value[field] ? 'input-error' : 'input-ok'
}

const pwStrength = computed(() => {
  const p = form.value.password; if (!p) return 0; let s = 0
  if (p.length >= 8) s++; if (/[A-Z]/.test(p)) s++
  if (/\d/.test(p)) s++; if (/[^A-Za-z0-9]/.test(p)) s++
  return s
})
const pwStrengthColor     = computed(() => ['','bg-red-400','bg-orange-400','bg-yellow-400','bg-green-500'][pwStrength.value])
const pwStrengthTextColor = computed(() => ['','text-red-500','text-orange-500','text-yellow-500','text-green-500'][pwStrength.value])
const pwStrengthLabel     = computed(() => ['','Too weak','Weak','Fair','Strong'][pwStrength.value])

function validateAll(): boolean {
  const fields = ['name', 'email', 'phone', 'division', 'password']
  fields.forEach(f => { touched.value[f] = true })
  return Object.keys(errors.value).length === 0
}

async function register() {
  if (!validateAll()) return
  loading.value = true
  serverError.value = ''
  serverFieldErrors.value = {}
  try {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name:     form.value.name,
        email:    form.value.email,
        phone:    '+880' + form.value.phone,
        division: form.value.division,
        password: form.value.password,
      }),
    })
    const data = await res.json()
    if (!res.ok) {
      if (data.field && data.error) {
        serverFieldErrors.value = { [data.field]: data.error }
        touched.value[data.field] = true
      } else {
        serverError.value = data.error ?? 'Registration failed'
      }
      return
    }
    if (!data.user || !data.token) {
      serverError.value = 'Registration failed — unexpected server response'
      return
    }
    await authStore.login(data.user, data.token)
    router.push('/')
  } catch {
    serverError.value = 'Network error. Please try again.'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.field-label { display: block; font-size: 0.7rem; font-weight: 500; color: var(--color-text-muted); margin-bottom: 0.35rem; }
.field-error { font-size: 0.68rem; color: #ef4444; margin-top: 0.3rem; display: flex; align-items: center; gap: 4px; }
.field-error::before { content: '⚠'; font-size: 10px; }
.prefix-badge { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); font-size: 0.8rem; color: var(--color-text-muted); pointer-events: none; user-select: none; }
:deep(.input-error) { border-color: #ef4444 !important; background-color: rgba(239, 68, 68, 0.04) !important; }
:deep(.input-ok) { border-color: #22c55e !important; }
</style>
