import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

export default defineConfig(({ mode }) => {
  const isLib = mode === 'lib'

  return {
    plugins: [vue()],
    resolve: {
      alias: {
        '@': resolve(__dirname, './src'),
        '@form-renderer/preset-element-plus/style.css': resolve(
          __dirname,
          './src/empty.css'
        ),
        '@form-renderer/engine': resolve(__dirname, '../Engine/src'),
        '@form-renderer/adapter-vue3': resolve(__dirname, '../AdapterVue3/src'),
        '@form-renderer/preset-element-plus': resolve(
          __dirname,
          '../PresetElementPlus/src'
        )
      }
    },
    build: isLib
      ? {
          lib: {
            entry: resolve(__dirname, 'src/index.ts'),
            name: 'FormRendererStarter',
            fileName: 'index',
            formats: ['es']
          },
          rollupOptions: {
            external: [
              'vue',
              'element-plus',
              '@form-renderer/engine',
              '@form-renderer/adapter-vue3',
              '@form-renderer/preset-element-plus',
              '@form-renderer/preset-element-plus/style.css'
            ],
            output: {
              globals: {
                vue: 'Vue',
                'element-plus': 'ElementPlus',
                '@form-renderer/engine': 'FormRendererEngine',
                '@form-renderer/adapter-vue3': 'FormRendererAdapter',
                '@form-renderer/preset-element-plus':
                  'FormRendererPresetElementPlus'
              },
              assetFileNames: (assetInfo) => {
                if (assetInfo.name === 'style.css') {
                  return 'style.css'
                }
                return assetInfo.name || 'asset'
              }
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
