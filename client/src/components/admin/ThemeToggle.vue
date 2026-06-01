<template>
  <button
    class="theme-toggle-btn"
    :class="{ 'is-dark': themeStore.isDark }"
    @click="themeStore.toggle()"
    :title="themeStore.isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'"
    :aria-label="themeStore.isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'"
  >
    <span class="toggle-track">
      <span class="toggle-thumb">
        <!-- Sun icon (light mode) -->
        <i class="fa-sharp fa-solid fa-sun sun-icon"></i>
        <!-- Moon icon (dark mode) -->
        <i class="fa-sharp fa-solid fa-moon moon-icon"></i>
      </span>
      <!-- Stars (dark mode decoration) -->
      <span class="star star-1"></span>
      <span class="star star-2"></span>
      <span class="star star-3"></span>
      <!-- Rays (light mode decoration) -->
      <span class="ray ray-1"></span>
      <span class="ray ray-2"></span>
      <span class="ray ray-3"></span>
    </span>
  </button>
</template>

<script setup lang="ts">
import { useThemeStore } from '@/stores/useThemeStore'
const themeStore = useThemeStore()
</script>

<style scoped>
.theme-toggle-btn {
  position: relative;
  background: none;
  border: none;
  cursor: pointer;
  padding: 2px;
  border-radius: 99px;
  display: flex;
  align-items: center;
}

.toggle-track {
  position: relative;
  width: 52px;
  height: 28px;
  border-radius: 99px;
  background: linear-gradient(135deg, #1e3a5f, #0a1628);
  border: 1.5px solid rgba(255,255,255,0.12);
  transition: background 0.4s ease, border-color 0.4s ease;
  overflow: hidden;
  display: block;
}

/* Light mode track */
.theme-toggle-btn:not(.is-dark) .toggle-track {
  background: linear-gradient(135deg, #87ceeb, #ffd700);
  border-color: rgba(0,0,0,0.08);
}

/* Thumb */
.toggle-thumb {
  position: absolute;
  top: 3px;
  left: 3px;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #1a1a2e;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), background 0.4s ease;
  z-index: 2;
  box-shadow: 0 2px 8px rgba(0,0,0,0.3);
}
.theme-toggle-btn:not(.is-dark) .toggle-thumb {
  transform: translateX(24px);
  background: #fff8e1;
  box-shadow: 0 2px 8px rgba(249,115,22,0.4);
}

/* Icons */
.sun-icon, .moon-icon {
  position: absolute;
  font-size: 10px;
  transition: opacity 0.3s ease, transform 0.3s ease;
}
.moon-icon { color: #c8d8f0; opacity: 1; transform: scale(1) rotate(0deg); }
.sun-icon  { color: #f97316; opacity: 0; transform: scale(0.5) rotate(90deg); }

.theme-toggle-btn:not(.is-dark) .moon-icon { opacity: 0; transform: scale(0.5) rotate(-90deg); }
.theme-toggle-btn:not(.is-dark) .sun-icon  { opacity: 1; transform: scale(1) rotate(0deg); }

/* Stars (visible in dark mode) */
.star {
  position: absolute;
  background: white;
  border-radius: 50%;
  transition: opacity 0.4s ease;
}
.star-1 { width: 3px; height: 3px; top: 6px; right: 9px; opacity: 0.9; }
.star-2 { width: 2px; height: 2px; top: 12px; right: 14px; opacity: 0.6; }
.star-3 { width: 2px; height: 2px; top: 5px; right: 18px; opacity: 0.8; }
.theme-toggle-btn:not(.is-dark) .star { opacity: 0; }

/* Rays (visible in light mode) */
.ray {
  position: absolute;
  background: rgba(249,115,22,0.5);
  border-radius: 99px;
  transition: opacity 0.4s ease;
  opacity: 0;
}
.ray-1 { width: 3px; height: 8px; top: 2px; left: 8px; transform: rotate(20deg); }
.ray-2 { width: 3px; height: 6px; bottom: 2px; left: 6px; transform: rotate(-15deg); }
.ray-3 { width: 2px; height: 5px; top: 4px; left: 14px; transform: rotate(45deg); }
.theme-toggle-btn:not(.is-dark) .ray { opacity: 1; }

/* Hover glow */
.theme-toggle-btn:hover .toggle-track {
  box-shadow: 0 0 0 3px rgba(249,115,22,0.15);
}
.theme-toggle-btn.is-dark:hover .toggle-track {
  box-shadow: 0 0 0 3px rgba(99,179,237,0.15);
}
</style>
