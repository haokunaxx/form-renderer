const { resolve } = require('path')
module.exports = {
  configureWebpack: {
    output: {
      // libraryExport: 'default'
    },
    externals: {
      vue: 'vue',
      'element-ui': 'element-ui',
      '@form-renderer/engine': '@form-renderer/engine',
      '@form-renderer/adapter-vue2': '@form-renderer/adapter-vue2',
      '@form-renderer/share': '@form-renderer/share'
    },
    resolve: {
      alias: {
        '@form-renderer/engine': resolve(__dirname, '../packages/Engine/src'),
        '@form-renderer/share': resolve(__dirname, '../packages/Share/src'),
        '@form-renderer/adapter-vue2': resolve(
          __dirname,
          '../packages/AdapterVue2/src'
        )
      }
    }
  },

  css: {
    extract: {
      filename: 'style.css'
    }
  },

  productionSourceMap: false
}
