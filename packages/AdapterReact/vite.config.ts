import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import dts from 'vite-plugin-dts'
import { resolve } from 'path'

export default defineConfig({
  plugins: [
    react(),
    dts({
      include: ['src/**/*'],
      exclude: ['src/**/*.test.ts', 'src/**/*.test.tsx', 'tests/**/*'],
      outDir: 'dist',
      staticImport: true,
      insertTypesEntry: true,
      rollupTypes: true,
      copyDtsFiles: true,
      skipDiagnostics: true,
      logDiagnostics: false,
      aliasesExclude: ['@form-renderer/engine']
    })
  ],

  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '@form-renderer/engine': resolve(__dirname, '../Engine/src')
    }
  },

  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'FormAdapterReact',
      fileName: (format) => `index.${format === 'es' ? 'js' : 'cjs'}`
    },

    rollupOptions: {
      external: [
        'react',
        'react-dom',
        'react/jsx-runtime',
        '@form-renderer/engine'
      ],

      output: {
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM',
          'react/jsx-runtime': 'jsxRuntime',
          '@form-renderer/engine': 'FormEngine'
        }
      }
    },

    emptyOutDir: true,
    sourcemap: false,
    minify: 'esbuild',
    target: 'es2020'
  }
})
