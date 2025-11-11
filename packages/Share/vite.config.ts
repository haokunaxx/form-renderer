import { defineConfig } from 'vite'
import { resolve } from 'path'
import dts from 'vite-plugin-dts'

export default defineConfig({
  plugins: [
    dts({
      include: ['src/**/*'],
      outDir: 'dist',
      staticImport: true,
      insertTypesEntry: true,
      rollupTypes: true,
      copyDtsFiles: true
    })
  ],

  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'FormRendererShare',
      fileName: (format) => `index.${format === 'es' ? 'js' : 'cjs'}`
    },

    rollupOptions: {
      external: [],
      output: {
        exports: 'named'
      }
    },

    emptyOutDir: true,
    sourcemap: false,
    minify: 'esbuild',
    target: 'es2015' // 兼容 Vue 2
  }
})
