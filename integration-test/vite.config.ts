import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@form-renderer/engine': resolve(__dirname, '../packages/Engine/src'),
      '@form-renderer/adapter-vue3': resolve(
        __dirname,
        '../packages/AdapterVue3/src'
      ),
      '@form-renderer/preset-element-plus/style.css': resolve(
        __dirname,
        '../packages/StarterElementPlus/src/empty.css'
      ),
      '@form-renderer/preset-element-plus': resolve(
        __dirname,
        '../packages/PresetElementPlus/src'
      ),
      '@form-renderer/starter-element-plus': resolve(
        __dirname,
        '../packages/StarterElementPlus/src'
      )
    }
  },
  server: {
    port: 3000,
    open: true
  }
})
