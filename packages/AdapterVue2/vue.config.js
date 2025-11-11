module.exports = {
  configureWebpack: {
    output: {
      libraryExport: 'default'
    },
    externals: {
      vue: {
        commonjs: 'vue',
        commonjs2: 'vue',
        amd: 'vue',
        root: 'Vue'
      },
      '@form-renderer/engine': {
        commonjs: '@form-renderer/engine',
        commonjs2: '@form-renderer/engine',
        amd: '@form-renderer/engine',
        root: 'FormEngine'
      },
      '@form-renderer/share': {
        commonjs: '@form-renderer/share',
        commonjs2: '@form-renderer/share',
        amd: '@form-renderer/share',
        root: 'FormRendererShare'
      }
    }
  },

  css: {
    extract: {
      filename: 'style.css'
    }
  },

  productionSourceMap: false,

  // Disable modern mode for better compatibility
  modern: false
}
