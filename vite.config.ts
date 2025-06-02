import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'
import vueDevTools from 'vite-plugin-vue-devtools'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) =>{
  return{
    plugins: [
      vue(),
      vueJsx(),
      vueDevTools(),
      tailwindcss(),
    ],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url))
      },
    },
    base: mode === 'development' ? '/' : '/api/', // 蔡-開發者模式跑/ 其餘因為rewrite 跑/ms/
    // 開發環境伺服器配置
    server: {// 蔡-透過proxy導向到後端9516
      // 是否監聽所有位址
      host: true,
      // 端口
      port: 3335,
      // 連接埠被佔用時，是否直接退出
      strictPort: false,
      // 是否自動開啟瀏覽器
      open: true,
      // 反向代理
      proxy: {
        "^/api": {
          target: "http://127.0.0.1:9536",
          // 是否為 WebSocket
          ws: false,
          // 是否允許跨域
          changeOrigin: true
        }
      },
    }
  }
})
