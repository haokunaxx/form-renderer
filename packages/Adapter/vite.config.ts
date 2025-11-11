import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import dts from 'vite-plugin-dts'
import { resolve } from 'path'

export default defineConfig({
  plugins: [
    vue(),
    dts({
      include: ['src/**/*'],
      exclude: ['src/**/*.test.ts', 'tests/**/*'],
      outDir: 'dist',
      staticImport: true,
      insertTypesEntry: true,
      rollupTypes: true, // 打包类型为单文件
      copyDtsFiles: true,
      skipDiagnostics: true, // 跳过类型诊断
      logDiagnostics: false,
      aliasesExclude: ['@form-renderer/engine'] // 排除外部依赖别名
    })
  ],

  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '@form-renderer/engine': resolve(__dirname, '../Engine/src/index.ts')
    }
  },

  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'FormAdapter',
      fileName: (format) => `index.${format === 'es' ? 'js' : 'cjs'}`
    },

    rollupOptions: {
      external: ['vue', '@form-renderer/engine'],

      output: {
        globals: {
          vue: 'Vue',
          '@form-renderer/engine': 'FormEngine'
        },

        assetFileNames: (assetInfo) => {
          if (assetInfo.name === 'style.css') {
            return 'style.css'
          }
          return assetInfo.name!
        }
      }
    },

    emptyOutDir: true,
    sourcemap: false,
    minify: 'esbuild',
    target: 'es2020'
  },

  test: {
    globals: true,
    environment: 'jsdom',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'tests/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/mockData.ts'
      ]
    }
  }
})
