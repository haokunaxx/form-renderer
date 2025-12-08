import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import dts from 'vite-plugin-dts'
import { resolve } from 'path'

export default defineConfig({
  plugins: [
    react(),
    dts({
      include: ['src/**/*'],
      exclude: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
      outDir: 'dist',
      staticImport: true,
      insertTypesEntry: true,
      rollupTypes: true,
      copyDtsFiles: true,
      skipDiagnostics: true,
      logDiagnostics: false,
      aliasesExclude: [
        '@form-renderer/engine',
        '@form-renderer/adapter-react',
        'antd',
        'dayjs'
      ]
    })
  ],

  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '@form-renderer/engine': resolve(__dirname, '../Engine/src'),
      '@form-renderer/adapter-react': resolve(__dirname, '../AdapterReact/src')
    }
  },

  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'PresetAntd',
      fileName: (format) => `index.${format === 'es' ? 'js' : 'cjs'}`
    },

    rollupOptions: {
      external: [
        'react',
        'react-dom',
        'react/jsx-runtime',
        'antd',
        'dayjs',
        '@form-renderer/engine',
        '@form-renderer/adapter-react'
      ],

      output: {
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM',
          'react/jsx-runtime': 'jsxRuntime',
          antd: 'antd',
          dayjs: 'dayjs',
          '@form-renderer/engine': 'FormEngine',
          '@form-renderer/adapter-react': 'FormAdapterReact'
        }
      }
    },

    emptyOutDir: true,
    sourcemap: false,
    minify: 'esbuild',
    target: 'es2020'
  }
})
