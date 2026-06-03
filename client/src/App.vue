<template>
  <div class="min-h-screen transition-colors duration-300">
    <!-- Public storefront layout -->
    <template v-if="!isAdminRoute">
      <AppHeader />
      <CartDrawer />
      <main class="bg-[var(--color-bg)] min-h-screen">
        <RouterView v-slot="{ Component }">
          <!-- NOTE: mode="out-in" removed — it caused blank screens when the
               incoming view mounted before its async data resolved, because the
               old view had already faded out leaving nothing visible. -->
          <Transition name="page">
            <component :is="Component" :key="$route.fullPath" />
          </Transition>
        </RouterView>
      </main>
      <AppFooter />
    </template>

    <!-- Admin CMS layout (no header/footer — AdminLayout handles its own shell) -->
    <template v-else>
      <RouterView />
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useThemeStore } from '@/stores/useThemeStore'
import AppHeader from '@/components/layout/AppHeader.vue'
import AppFooter from '@/components/layout/AppFooter.vue'
import CartDrawer from '@/components/cart/CartDrawer.vue'

const themeStore = useThemeStore()
const route = useRoute()

const isAdminRoute = computed(() => route.path.startsWith('/admin'))

// Theme is already applied to <html> by the store's immediate watcher — no duplication needed here.
</script>

<style>
.page-enter-active,
.page-leave-active {
  transition: opacity 0.25s ease, transform 0.25s ease;
}
.page-enter-from {
  opacity: 0;
  transform: translateY(10px);
}
.page-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style>
