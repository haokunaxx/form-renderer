# PresetElementUI 构建产物总结

> 快速参考文档 - 详细分析请查看 [BUILD_ANALYSIS.md](./BUILD_ANALYSIS.md)

## ✅ 构建成功

**构建时间**: 2.9 秒  
**构建工具**: Vue CLI 5.0.9 + Webpack 5.102.1

## 📦 产物列表

| 文件 | 大小 | Gzip | 用途 |
|------|------|------|------|
| PresetElementUI.common.js | 308 KB | 57.90 KB | CommonJS (Node/Webpack) |
| PresetElementUI.umd.js | 309 KB | 58.04 KB | UMD (浏览器/开发) |
| PresetElementUI.umd.min.js | 92 KB | 28.40 KB | UMD (生产环境) ⭐ |
| PresetElementUI.css | 2.4 KB | 0.68 KB | 组件样式 |
| demo.html | 217 B | - | 测试页面 |

**推荐使用**: `PresetElementUI.umd.min.js` + `PresetElementUI.css` (总计 ~29 KB gzip)

## ⚠️ 已知问题

### 🔴 紧急问题

1. **package.json 路径不匹配**
   - 配置: `dist/index.common.js`
   - 实际: `dist/PresetElementUI.common.js`
   - 影响: 无法通过 NPM 正常导入
   - 修复: 见下方

2. **缺少 ES Module 格式**
   - 配置: `dist/index.esm.js`
   - 实际: 不存在
   - 影响: 无法 Tree Shaking，现代打包工具无法优化
   - 修复: 需要调整构建配置

### 🟡 性能警告

- 未压缩版本超过 Webpack 推荐限制 (244 KB)
- Gzip 后大小可接受 (~58 KB)
- 包含大量 core-js polyfills

## 🛠️ 快速修复

### 修改 package.json

```json
{
  "main": "dist/PresetElementUI.common.js",
  "unpkg": "dist/PresetElementUI.umd.min.js",
  "style": "dist/PresetElementUI.css",
  "files": [
    "dist"
  ]
}
```

**删除** `module` 字段（因为未生成 ESM）

### 验证构建产物

```bash
# 检查文件是否存在
ls -lh dist/

# 测试 UMD 格式
open dist/demo.html

# 测试导出
node -e "console.log(require('./dist/PresetElementUI.common.js'))"
```

## 📊 包含的组件

### 字段组件 (15 个)
- Input, Textarea, InputNumber
- Switch, CheckboxGroup, RadioGroup
- Select, Cascader
- DatePicker, TimePicker
- Slider, Rate, ColorPicker, Upload

### 容器组件 (3 个)
- Form, Layout, List

### 包装器 (1 个)
- FieldWrapper

### 工具函数
- 事件映射 (event-mapping)
- 值转换器 (value-transformers)
- 校验转换器 (validation)

## 🎯 使用示例

### NPM 方式（修复后）

```javascript
import { ElementUIPreset } from '@form-renderer/preset-element-ui'
import '@form-renderer/preset-element-ui/dist/PresetElementUI.css'

export default {
  data() {
    return {
      preset: ElementUIPreset
    }
  }
}
```

### CDN 方式

```html
<link rel="stylesheet" href="https://unpkg.com/@form-renderer/preset-element-ui/dist/PresetElementUI.css">
<script src="https://unpkg.com/@form-renderer/preset-element-ui/dist/PresetElementUI.umd.min.js"></script>

<script>
  const preset = PresetElementUI
</script>
```

## 🔄 外部依赖

以下依赖**不会**打包进产物（需要用户自行安装）:

- `vue` (^2.6.0 || ^2.7.0)
- `element-ui` (^2.x)
- `@form-renderer/engine`
- `@form-renderer/adapter-vue2`
- `@form-renderer/share`

## 📈 对比 PresetElementPlus

| 特性 | PresetElementUI | PresetElementPlus |
|------|----------------|-------------------|
| Vue 版本 | Vue 2 | Vue 3 |
| UI 库 | Element UI | Element Plus |
| 构建工具 | Vue CLI + Webpack | Vite + Rollup |
| 构建速度 | ~2.9s | 更快 |
| TypeScript | ❌ | ✅ |
| 类型文件 | ❌ | ✅ |
| ESM 格式 | ❌ | ✅ |
| 压缩大小 | 28.40 KB | 类似 |

## 📝 待办事项

- [ ] 修复 package.json 路径
- [ ] 生成 ES Module 格式
- [ ] 添加 TypeScript 类型文件
- [ ] 优化 polyfill 体积
- [ ] 添加构建验证脚本
- [ ] 添加包大小监控
- [ ] 考虑迁移到 Vite

## 📚 相关文档

- [详细构建分析](./BUILD_ANALYSIS.md)
- [项目 README](./README.md)
- [Vue CLI 文档](https://cli.vuejs.org/zh/guide/build-targets.html#%E5%BA%93)

---

**最后更新**: 2025-11-11  
**构建版本**: 1.0.0-alpha.0


