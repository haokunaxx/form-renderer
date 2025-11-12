// eslint-disable-next-line
const { resolve } = require('path')

module.exports = {
  transpileDependencies: [
    // 只转译 Vue2 相关的包（JS 源码）
    '@form-renderer/adapter-vue2',
    '@form-renderer/preset-element-ui'
  ],
  configureWebpack: {
    resolve: {
      alias: {
        '@': resolve(__dirname, 'src'),
        // Vue2 包使用源码（支持热更新）
        '@form-renderer/adapter-vue2': resolve(
          __dirname,
          '../packages/AdapterVue2/src'
        ),
        '@form-renderer/preset-element-ui': resolve(
          __dirname,
          '../packages/PresetElementUI/src'
        ),
        // TypeScript 包使用构建产物
        // TODO: 如果依赖也在开发中，需要使用源码的话该如何处理？直接引入 + ts-loader？
        '@form-renderer/engine': resolve(__dirname, '../packages/Engine/dist'),
        '@form-renderer/share': resolve(__dirname, '../packages/Share/dist')
      }
    }
  }
}
