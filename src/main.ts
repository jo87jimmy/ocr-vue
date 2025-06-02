// import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import ToastService from 'primevue/toastservice'
import Toast from 'primevue/toast'

import App from './App.vue'
import router from './router'
//蔡- styles tailwindcss 跟 scss 要分開引用
import './assets/styles/tailwindcss.css'; //蔡- 匯入 TailwindCSS 樣式檔
import 'primeicons/primeicons.css'  // ✅ PrimeVue 使用的 icon 樣式
import PrimeVue from 'primevue/config';
import Aura from '@primeuix/themes/aura';
const app = createApp(App)
app.use(PrimeVue, {
    theme: {
        preset: Aura
    }
});

app.use(createPinia())
app.use(router)
app.use(ToastService)
app.component('Toast', Toast)
app.provide('toast', app.config.globalProperties.$toast)

app.mount('#app')
