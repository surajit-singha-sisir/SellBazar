<template>
  <div class="min-h-screen flex items-center justify-center px-4 py-12 bg-mesh">
    <div class="w-full max-w-md">
      <!-- Card -->
      <div class="card p-8 space-y-6">
        <!-- Logo -->
        <div class="text-center">
          <RouterLink to="/" class="inline-flex items-center gap-2">
            <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-fuchsia-600 flex items-center justify-center shadow-lg">
              <i class="fa-sharp fa-solid fa-store text-white text-sm"></i>
            </div>
            <span class="font-display font-extrabold text-2xl"><span class="gradient-text">Sell</span>Bazar</span>
          </RouterLink>
          <h1 class="font-display font-bold text-2xl mt-4">Welcome Back</h1>
          <p class="text-sm text-[var(--color-text-muted)] mt-1">Sign in to your SellBazar account</p>
        </div>

        <!-- Error -->
        <div v-if="error" class="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-sm text-red-500">
          <i class="fa-sharp fa-solid fa-circle-exclamation mr-2"></i>{{ error }}
        </div>

        <!-- Form -->
        <div class="space-y-4">
          <div>
            <label class="text-xs font-medium text-[var(--color-text-muted)] mb-1.5 block">Phone Number</label>
            <div class="relative">
              <span class="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[var(--color-text-muted)]">+880</span>
              <input v-model="phone" type="tel" class="input-field pl-14" placeholder="1XXX-XXXXXX" @keyup.enter="login" />
            </div>
          </div>
          <div>
            <label class="text-xs font-medium text-[var(--color-text-muted)] mb-1.5 block">Password</label>
            <div class="relative">
              <input v-model="password" :type="showPw ? 'text' : 'password'" class="input-field pr-10" placeholder="Enter your password" @keyup.enter="login" />
              <button @click="showPw = !showPw" class="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition">
                <i :class="showPw ? 'fa-sharp fa-regular fa-eye-slash' : 'fa-sharp fa-regular fa-eye'" class="text-sm"></i>
              </button>
            </div>
          </div>
        </div>

        <button @click="login" :disabled="loading" class="btn-primary w-full justify-center py-3.5 text-base disabled:opacity-60">
          <i v-if="loading" class="fa-sharp fa-solid fa-spinner animate-spin"></i>
          <i v-else class="fa-sharp fa-regular fa-right-to-bracket"></i>
          {{ loading ? 'Signing in...' : 'Sign In' }}
        </button>

        <!-- Divider -->
        <div class="flex items-center gap-3">
          <div class="flex-1 divider"></div>
          <span class="text-xs text-[var(--color-text-muted)]">or continue with</span>
          <div class="flex-1 divider"></div>
        </div>

        <!-- Social -->
        <div class="grid grid-cols-2 gap-3">
          <button class="btn-secondary text-sm justify-center py-2.5">
            <img src="https://www.google.com/favicon.ico" class="w-4 h-4" /> Google
          </button>
          <button class="btn-secondary text-sm justify-center py-2.5">
            ðŸ“± Facebook
          </button>
        </div>

        <p class="text-center text-sm text-[var(--color-text-muted)]">
          Don't have an account?
          <RouterLink to="/register" class="text-orange-500 font-medium hover:underline">Register</RouterLink>
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

const phone    = ref('')
const password = ref('')
const loading  = ref(false)
const error    = ref('')
const showPw   = ref(false)

async function login() {
  if (!phone.value || !password.value) { error.value = 'Please enter phone and password'; return }
  loading.value = true; error.value = ''
  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: '+880' + phone.value, password: password.value }),
    })
    const data = await res.json()
    if (!res.ok) { error.value = data.error ?? 'Login failed'; return }
    await authStore.login(data.user)
    // Redirect to intended page or home
    const redirect = (router.currentRoute.value.query.redirect as string) || '/'
    router.push(redirect)
  } catch {
    error.value = 'Network error — please try again'
  } finally {
    loading.value = false
  }
}
</script>
