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
        // 开发环境直接使用源码
        '@form-renderer/engine': resolve(__dirname, '../Engine/src/index.ts'),
        '@form-renderer/adapter-vue3': resolve(
          __dirname,
          '../AdapterVue3/src/index.ts'
        ),
        '@form-renderer/preset-element-plus': resolve(
          __dirname,
          '../PresetElementPlus/src/index.ts'
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
              '@form-renderer/preset-element-plus'
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
