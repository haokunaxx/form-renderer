import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@form-renderer/engine': resolve(__dirname, '../packages/Engine/src'),
      '@form-renderer/adapter-react': resolve(
        __dirname,
        '../packages/AdapterReact/src'
      ),
      '@form-renderer/preset-antd': resolve(
        __dirname,
        '../packages/PresetAntd/src'
      )
    }
  }
})
