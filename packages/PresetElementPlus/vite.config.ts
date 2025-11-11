import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const isLib = mode === 'lib'

  return {
    plugins: [vue()],
    resolve: {
      alias: {
        '@': resolve(__dirname, 'src'),
        '@form-renderer/adapter-vue3': resolve(
          __dirname,
          '../AdapterVue3/src/index.ts'
        ),
        '@form-renderer/engine': resolve(__dirname, '../Engine/src/index.ts')
      }
    },
    build: isLib
      ? {
          lib: {
            entry: resolve(__dirname, 'src/index.ts'),
            name: 'FormRendererPresetElementPlus',
            fileName: 'index',
            formats: ['es']
          },
          rollupOptions: {
            external: [
              'vue',
              'element-plus',
              '@element-plus/icons-vue',
              '@form-renderer/adapter-vue3',
              '@form-renderer/engine'
            ],
            output: {
              globals: {
                vue: 'Vue',
                'element-plus': 'ElementPlus',
                '@element-plus/icons-vue': 'ElementPlusIconsVue',
                '@form-renderer/adapter-vue3': 'FormRendererAdapter',
                '@form-renderer/engine': 'FormRendererEngine'
              }
              // assetFileNames: (assetInfo) => {
              //   if (assetInfo.name === 'style.css') {
              //     return 'style.css'
              //   }
              //   return assetInfo.name || 'asset'
              // }
            }
          },
          cssCodeSplit: false,
          sourcemap: false,
          minify: 'esbuild'
        }
      : {
          // 开发模式配置
          sourcemap: true
        }
  }
})
