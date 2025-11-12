# Vue2 开发环境配置说明

## 📋 开发模式架构

### 热更新包（直接引入源码）
- ✅ `@form-renderer/adapter-vue2` → `packages/AdapterVue2/src`
- ✅ `@form-renderer/preset-element-ui` → `packages/PresetElementUI/src`

**优势**：修改这两个包的代码会立即热更新，无需重新构建

### 预构建包（使用 dist）
- 📦 `@form-renderer/engine` → `packages/Engine/dist`
- 📦 `@form-renderer/share` → `packages/Share/dist`

**原因**：这两个包是 TypeScript 项目，Vue CLI 无法直接处理 `.ts` 文件

## 🚀 快速开始

### 方式一：标准开发流程
```bash
# 1. 在项目根目录，安装依赖
pnpm install

# 2. 直接启动 Vue2 测试项目
cd integration-test-vue2
pnpm serve
```

此时修改 AdapterVue2 和 PresetElementUI 的代码会自动热更新！

### 方式二：如果需要修改 Engine 或 Share

如果你需要同时开发 Engine 或 Share 包，需要开启 watch 模式：

```bash
# 终端1：监听 Engine 变化并自动构建
cd packages/Engine
pnpm build --watch

# 终端2：监听 Share 变化并自动构建
cd packages/Share
pnpm build --watch

# 终端3：启动 Vue2 测试项目
cd integration-test-vue2
pnpm serve
```

> 注意：修改 Engine/Share 后需要手动刷新浏览器

## 📝 开发建议

### 主要开发 Vue2 适配器
如果你主要开发 `AdapterVue2` 和 `PresetElementUI`：
- ✅ 直接修改代码，享受热更新
- ✅ 无需额外操作

### 偶尔修改基础包
如果偶尔需要修改 `Engine` 或 `Share`：
```bash
# 修改后重新构建一次
cd packages/Engine  # 或 packages/Share
pnpm build

# 然后刷新浏览器
```

### 频繁修改基础包
如果需要频繁修改 `Engine` 或 `Share`，建议开启 watch 模式（见方式二）

## 🔧 配置原理

`integration-test-vue2/vue.config.js` 中的配置：

```javascript
configureWebpack: {
  resolve: {
    alias: {
      // Vue2 包 → 源码（JS）
      '@form-renderer/adapter-vue2': '../packages/AdapterVue2/src',
      '@form-renderer/preset-element-ui': '../packages/PresetElementUI/src',
      
      // TS 包 → 构建产物
      '@form-renderer/engine': '../packages/Engine/dist',
      '@form-renderer/share': '../packages/Share/dist'
    }
  }
}
```

## ⚠️ 注意事项

1. **首次运行**：确保 Engine 和 Share 已构建
   ```bash
   pnpm --filter @form-renderer/engine build
   pnpm --filter @form-renderer/share build
   ```

2. **清理缓存**：如果遇到奇怪的问题
   ```bash
   # 删除 node_modules 和锁文件
   rm -rf node_modules pnpm-lock.yaml
   
   # 重新安装
   pnpm install
   ```

3. **TypeScript 类型**：如果修改了 Engine 的类型定义，需要重新构建才能在 IDE 中看到类型提示

## 🎯 生产构建

生产构建时，所有包都会使用其 `package.json` 中定义的 `main` 字段，即构建后的 dist 目录，不受开发环境 alias 影响。

