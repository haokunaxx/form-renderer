# @form-renderer/preset-element-ui

Element UI 预设包，为 form-renderer Vue 2 Adapter 提供完整的 Element UI 组件支持。

## 🚀 特性

- 🎯 **专注 Element UI**：专为 Element UI 组件库优化
- 📦 **Vue 2 支持**：完整支持 Vue 2.6+ 版本
- 🔧 **类型安全**：提供完整的 JSDoc 注释
- 🎨 **主题支持**：支持 Element UI 主题定制
- 📱 **响应式**：支持多种尺寸和响应式布局

## 📦 安装

```bash
npm install @form-renderer/preset-element-ui element-ui
# 或
pnpm add @form-renderer/preset-element-ui element-ui
```

## 🔧 快速开始

### 1. 注册 Element UI

```javascript
import Vue from 'vue'
import ElementUI from 'element-ui'
import 'element-ui/lib/theme-chalk/index.css'

Vue.use(ElementUI)
```

### 2. 使用预设

```vue
<template>
  <form-adapter
    :schema="schema"
    :model="formData"
    :components="elementUIPreset"
    @change="handleChange"
  />
</template>

<script>
import { FormAdapter } from '@form-renderer/adapter-vue2'
import { ElementUIPreset } from '@form-renderer/preset-element-ui'

export default {
  components: {
    FormAdapter
  },
  data() {
    return {
      elementUIPreset: ElementUIPreset,
      formData: {
        name: '',
        age: undefined,
        email: ''
      },
      schema: {
        type: 'form',
        component: 'form',
        componentProps: {
          labelWidth: '120px'
        },
        properties: {
          name: {
            type: 'field',
            component: 'input',
            label: '姓名',
            required: true,
            componentProps: {
              placeholder: '请输入姓名'
            }
          },
          age: {
            type: 'field',
            component: 'number',
            label: '年龄',
            componentProps: {
              placeholder: '请输入年龄',
              min: 1,
              max: 120
            }
          },
          email: {
            type: 'field',
            component: 'input',
            label: '邮箱',
            required: true,
            componentProps: {
              placeholder: '请输入邮箱'
            }
          }
        }
      }
    }
  },
  methods: {
    handleChange(data) {
      console.log('表单数据变更:', data)
    }
  }
}
</script>
```

## 📚 组件支持

### 字段组件

#### 基础输入
- ✅ **Input** - 单行文本输入框
- ✅ **Textarea** - 多行文本输入框
- ✅ **InputNumber** - 数字输入框

#### 选择器
- ✅ **Switch** - 开关
- ✅ **CheckboxGroup** - 多选框组
- ✅ **RadioGroup** - 单选框组
- ✅ **Select** - 下拉选择器
- ✅ **Cascader** - 级联选择器

#### 日期时间
- ✅ **DatePicker** - 日期选择器
- ✅ **TimePicker** - 时间选择器

#### 特殊输入
- ✅ **Slider** - 滑块
- ✅ **Rate** - 评分
- ✅ **ColorPicker** - 颜色选择器
- ✅ **Upload** - 文件上传

### 容器组件

- ✅ **Form** - 表单容器
- ✅ **Layout** - 布局容器（支持 Grid、Tabs、Collapse、Card）
- ✅ **List** - 列表容器（支持动态增删、排序）

### 包装器

- ✅ **FieldWrapper** - 字段包装器（统一错误展示和样式）

## 🛠️ 开发

```bash
# 安装依赖
pnpm install

# 构建库
pnpm build

# 运行 lint
pnpm lint
```

## 📄 许可证

MIT License

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

