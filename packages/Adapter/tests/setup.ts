/**
 * 测试环境配置
 */

import { config } from '@vue/test-utils'

// 配置全局属性
config.global.stubs = {
  // 可以在这里添加全局 stub
}

// 设置全局 mocks
config.global.mocks = {
  // 可以在这里添加全局 mock
}

// 抑制 Vue 警告（测试环境）
config.global.config.warnHandler = () => {
  // 忽略警告
}
