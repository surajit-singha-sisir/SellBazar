<template>
  <div class="min-h-screen flex items-center justify-center px-4 py-12 bg-mesh">
    <div class="w-full max-w-md">
      <div class="card p-8 space-y-6">
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

        <div v-if="error" class="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-sm text-red-500">
          <i class="fa-sharp fa-solid fa-circle-exclamation mr-2"></i>{{ error }}
        </div>

        <div class="space-y-4">
          <div>
            <label class="text-xs font-medium text-[var(--color-text-muted)] mb-1.5 block">Full Name</label>
            <input v-model="form.name" class="input-field" placeholder="Your full name" />
          </div>
          <div>
            <label class="text-xs font-medium text-[var(--color-text-muted)] mb-1.5 block">Phone Number</label>
            <div class="relative">
              <span class="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[var(--color-text-muted)]">+880</span>
              <input v-model="form.phone" type="tel" class="input-field pl-14" placeholder="1XXX-XXXXXX" />
            </div>
          </div>
          <div>
            <label class="text-xs font-medium text-[var(--color-text-muted)] mb-1.5 block">Division</label>
            <select v-model="form.division" class="input-field">
              <option value="">Select your division</option>
              <option v-for="d in divisions" :key="d">{{ d }}</option>
            </select>
          </div>
          <div>
            <label class="text-xs font-medium text-[var(--color-text-muted)] mb-1.5 block">Password</label>
            <div class="relative">
              <input v-model="form.password" :type="showPw ? 'text' : 'password'" class="input-field pr-10" placeholder="Create a strong password" />
              <button @click="showPw = !showPw" class="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition">
                <i :class="showPw ? 'fa-sharp fa-regular fa-eye-slash' : 'fa-sharp fa-regular fa-eye'" class="text-sm"></i>
              </button>
            </div>
          </div>
        </div>

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
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/useAuthStore'

const router = useRouter()
const authStore = useAuthStore()
const loading = ref(false)
const error   = ref('')
const showPw  = ref(false)

const form = ref({ name: '', phone: '', division: '', password: '' })
const divisions = ['Dhaka', 'Chittagong', 'Rajshahi', 'Khulna', 'Barisal', 'Sylhet', 'Rangpur', 'Mymensingh']

async function register() {
  if (!form.value.name || !form.value.phone || !form.value.password) {
    error.value = 'Please fill in all required fields'; return
  }
  loading.value = true; error.value = ''
  await new Promise(r => setTimeout(r, 1200))
  authStore.login({ id: Date.now().toString(), name: form.value.name, phone: '+880' + form.value.phone, division: form.value.division })
  loading.value = false
  router.push('/')
}
</script>
