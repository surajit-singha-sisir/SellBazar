import { createApp } from 'vue'
import { createPinia } from 'pinia'
import router from './router'
import App from './App.vue'
import './assets/styles/main.scss'   // variables + mixins + Tailwind + base styles
import './assets/styles/_admin.scss' // admin component styles (after Tailwind preflight)
import './assets/styles/_hero.scss'  // hero/landing styles (after Tailwind preflight)

const app = createApp(App)
app.use(createPinia())
app.use(router)
app.mount('#app')
