<template>
  <div class="max-w-2xl mx-auto px-4 sm:px-6 py-8">
    <h1 class="font-display font-bold text-2xl mb-6 flex items-center gap-2">
      <i class="fa-sharp fa-regular fa-user-gear text-orange-500"></i>
      My Profile
    </h1>

    <div v-if="!authStore.isLoggedIn" class="text-center py-16">
      <p class="text-lg font-semibold mb-4">Please sign in to view your profile</p>
      <RouterLink to="/login" class="btn-primary">Sign In</RouterLink>
    </div>

    <div v-else class="space-y-6">
      <!-- Avatar -->
      <div class="card p-6 flex items-center gap-5">
        <div class="w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-500 to-fuchsia-600 flex items-center justify-center text-white font-extrabold text-2xl shadow-lg">
          {{ authStore.initials }}
        </div>
        <div>
          <h2 class="font-display font-bold text-xl">{{ authStore.user?.name }}</h2>
          <p class="text-sm text-[var(--color-text-muted)]">{{ authStore.user?.phone }}</p>
          <p class="text-xs text-green-500 mt-1 font-medium"><i class="fa-sharp fa-solid fa-circle-check mr-1"></i>Verified Account</p>
        </div>
      </div>

      <!-- Edit form -->
      <div class="card p-6 space-y-4">
        <h3 class="font-semibold text-lg">Edit Profile</h3>
        <div class="grid sm:grid-cols-2 gap-4">
          <div>
            <label class="text-xs font-medium text-[var(--color-text-muted)] mb-1.5 block">Full Name</label>
            <input v-model="name" class="input-field" />
          </div>
          <div>
            <label class="text-xs font-medium text-[var(--color-text-muted)] mb-1.5 block">Phone</label>
            <input :value="authStore.user?.phone" class="input-field" disabled />
          </div>
          <div>
            <label class="text-xs font-medium text-[var(--color-text-muted)] mb-1.5 block">Division</label>
            <select v-model="division" class="input-field">
              <option v-for="d in divisions" :key="d">{{ d }}</option>
            </select>
          </div>
          <div>
            <label class="text-xs font-medium text-[var(--color-text-muted)] mb-1.5 block">Email (optional)</label>
            <input v-model="email" type="email" class="input-field" placeholder="your@email.com" />
          </div>
        </div>
        <button @click="save" class="btn-primary">
          <i class="fa-sharp fa-regular fa-floppy-disk"></i> Save Changes
        </button>
        <span v-if="saved" class="text-green-500 text-sm ml-3 font-medium">âœ“ Saved!</span>
      </div>

      <!-- Danger -->
      <div class="card p-6 border-red-500/20">
        <h3 class="font-semibold text-lg mb-3 text-red-500">Account Actions</h3>
        <button @click="authStore.logout(); $router.push('/')" class="btn-secondary text-red-500 border-red-500/30 hover:bg-red-50">
          <i class="fa-sharp fa-regular fa-arrow-right-from-bracket"></i> Sign Out
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useAuthStore } from '@/stores/useAuthStore'

const authStore = useAuthStore()
const name     = ref(authStore.user?.name ?? '')
const division = ref(authStore.user?.division ?? '')
const email    = ref(authStore.user?.email ?? '')
const saved    = ref(false)

const divisions = ['Dhaka', 'Chittagong', 'Rajshahi', 'Khulna', 'Barisal', 'Sylhet', 'Rangpur', 'Mymensingh']

function save() {
  if (authStore.user) {
    authStore.login({ ...authStore.user, name: name.value, division: division.value, email: email.value })
  }
  saved.value = true
  setTimeout(() => { saved.value = false }, 2000)
}
</script>
