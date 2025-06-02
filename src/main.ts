import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import ToastService from 'primevue/toastservice'
import Toast from 'primevue/toast'

import App from './App.vue'
import router from './router'

const app = createApp(App)

app.use(createPinia())
app.use(router)
app.use(ToastService)
app.component('Toast', Toast)
app.provide('toast', app.config.globalProperties.$toast)

app.mount('#app')
