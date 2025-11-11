import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@form-renderer/engine': resolve(
        __dirname,
        '../packages/Engine/src/index.ts'
      ),
      '@form-renderer/adapter-vue3': resolve(
        __dirname,
        '../packages/AdapterVue3/src/index.ts'
      ),
      '@form-renderer/preset-element-plus': resolve(
        __dirname,
        '../packages/PresetElementPlus/src/index.ts'
      )
      // '@form-renderer/starter-element-plus': resolve(
      //   __dirname,
      //   '../packages/StarterElementPlus/src/index.ts'
      // )
    }
  },
  server: {
    port: 3000,
    open: true
  }
})
