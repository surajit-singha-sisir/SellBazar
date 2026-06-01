<template>
  <div class="login-shell">
    <div class="login-card">
      <!-- Logo -->
      <div class="login-logo">
        <span class="logo-icon"><i class="fa-sharp-duotone fa-solid fa-store"></i></span>
        <div>
          <div class="logo-title">SellBazar <em>Admin</em></div>
          <div class="logo-sub">Control Panel</div>
        </div>
      </div>

      <h2 class="login-heading">Welcome back</h2>
      <p class="login-desc">Sign in to manage your store</p>

      <!-- Error banner -->
      <div v-if="error" class="login-error">
        <i class="fa-solid fa-circle-exclamation"></i> {{ error }}
      </div>

      <!-- Form -->
      <div class="login-form">
        <div class="field-group">
          <label class="field-label">Email address</label>
          <div class="field-input-wrap">
            <i class="fa-sharp fa-solid fa-envelope field-icon"></i>
            <input
              v-model="email"
              type="email"
              class="field-input"
              placeholder="admin@sellbazar.com"
              autocomplete="username"
              @keyup.enter="handleLogin"
            />
          </div>
        </div>

        <div class="field-group">
          <label class="field-label">Password</label>
          <div class="field-input-wrap">
            <i class="fa-sharp fa-solid fa-lock field-icon"></i>
            <input
              v-model="password"
              :type="showPw ? 'text' : 'password'"
              class="field-input"
              placeholder="••••••••"
              autocomplete="current-password"
              @keyup.enter="handleLogin"
            />
            <button class="pw-toggle" type="button" @click="showPw = !showPw" tabindex="-1">
              <i :class="showPw ? 'fa-sharp fa-solid fa-eye-slash' : 'fa-sharp fa-solid fa-eye'"></i>
            </button>
          </div>
        </div>

        <button
          class="login-btn"
          :disabled="loading || !email || !password"
          @click="handleLogin"
        >
          <i v-if="loading" class="fa-solid fa-spinner-third fa-spin"></i>
          <i v-else class="fa-sharp fa-solid fa-right-to-bracket"></i>
          {{ loading ? 'Signing in…' : 'Sign In' }}
        </button>
      </div>

      <!-- Demo credentials hint -->
      <div class="demo-hint">
        <i class="fa-solid fa-circle-info"></i>
        <span>Demo: <code>admin@sellbazar.com</code> / <code>Admin@1234</code></span>
      </div>
    </div>

    <!-- Background decoration -->
    <div class="bg-deco"></div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAdminStore } from '@/stores/useAdminStore'

const adminStore = useAdminStore()
const router = useRouter()
const route  = useRoute()

const email    = ref('')
const password = ref('')
const showPw   = ref(false)
const loading  = ref(false)
const error    = ref('')

async function handleLogin() {
  if (!email.value || !password.value) return
  loading.value = true
  error.value   = ''
  try {
    await adminStore.adminLogin(email.value, password.value)
    const redirect = (route.query.redirect as string) || '/admin'
    router.push(redirect)
  } catch (e: any) {
    error.value = e.message ?? 'Login failed'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-shell {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--admin-bg);
  padding: 24px;
  position: relative;
  overflow: hidden;
}

.bg-deco {
  position: absolute;
  width: 600px; height: 600px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(249,115,22,0.08) 0%, transparent 70%);
  top: -200px; right: -200px;
  pointer-events: none;
}

.login-card {
  background: var(--sidebar-bg);
  border: 1px solid var(--sidebar-border);
  border-radius: 20px;
  padding: 40px;
  width: 100%;
  max-width: 420px;
  position: relative;
  z-index: 1;
  box-shadow: 0 20px 60px rgba(0,0,0,0.12);
}

.login-logo {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 28px;
}
.logo-icon {
  width: 44px; height: 44px;
  background: var(--brand);
  border-radius: 12px;
  display: flex; align-items: center; justify-content: center;
  font-size: 20px;
  color: white;
  flex-shrink: 0;
}
.logo-title {
  font-size: 16px;
  font-weight: 800;
  color: var(--text-primary);
  letter-spacing: -0.02em;
}
.logo-title em { color: var(--brand); font-style: normal; }
.logo-sub { font-size: 11px; color: var(--text-secondary); margin-top: 1px; }

.login-heading {
  font-size: 24px;
  font-weight: 800;
  color: var(--text-primary);
  margin: 0 0 6px;
  letter-spacing: -0.03em;
}
.login-desc {
  font-size: 14px;
  color: var(--text-secondary);
  margin: 0 0 24px;
}

.login-error {
  background: rgba(239,68,68,0.1);
  border: 1px solid rgba(239,68,68,0.25);
  color: #ef4444;
  border-radius: 10px;
  padding: 10px 14px;
  font-size: 13px;
  margin-bottom: 18px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.login-form { display: flex; flex-direction: column; gap: 16px; }

.field-group { display: flex; flex-direction: column; gap: 6px; }
.field-label { font-size: 13px; font-weight: 600; color: var(--text-secondary); }

.field-input-wrap {
  position: relative;
  display: flex;
  align-items: center;
}
.field-icon {
  position: absolute;
  left: 13px;
  font-size: 13px;
  color: var(--text-secondary);
  pointer-events: none;
}
.field-input {
  width: 100%;
  padding: 11px 40px 11px 38px;
  border: 1px solid var(--sidebar-border);
  border-radius: 10px;
  background: var(--admin-bg);
  color: var(--text-primary);
  font-size: 14px;
  outline: none;
  transition: border-color 0.15s, box-shadow 0.15s;
  box-sizing: border-box;
}
.field-input:focus {
  border-color: var(--brand);
  box-shadow: 0 0 0 3px rgba(249,115,22,0.12);
}
.field-input::placeholder { color: var(--text-secondary); opacity: 0.6; }

.pw-toggle {
  position: absolute;
  right: 12px;
  background: none;
  border: none;
  color: var(--text-secondary);
  cursor: pointer;
  font-size: 13px;
  padding: 4px;
  transition: color 0.15s;
}
.pw-toggle:hover { color: var(--text-primary); }

.login-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 13px;
  background: var(--brand);
  color: white;
  border: none;
  border-radius: 10px;
  font-size: 15px;
  font-weight: 700;
  cursor: pointer;
  transition: opacity 0.15s, transform 0.1s;
  margin-top: 4px;
}
.login-btn:hover:not(:disabled) { opacity: 0.9; transform: translateY(-1px); }
.login-btn:disabled { opacity: 0.55; cursor: not-allowed; }

.demo-hint {
  margin-top: 20px;
  background: rgba(249,115,22,0.07);
  border: 1px solid rgba(249,115,22,0.15);
  border-radius: 10px;
  padding: 10px 14px;
  font-size: 12px;
  color: var(--text-secondary);
  display: flex;
  align-items: center;
  gap: 8px;
}
.demo-hint i { color: var(--brand); }
.demo-hint code {
  background: rgba(249,115,22,0.12);
  color: var(--brand);
  padding: 1px 5px;
  border-radius: 4px;
  font-size: 11px;
}
</style>
