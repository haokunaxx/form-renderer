# @form-renderer/preset-element-plus

ElementPlus 预设包，为 form-renderer 提供完整的 ElementPlus 组件支持。

## 🚀 特性

- 🎯 **专注 ElementPlus**：专为 ElementPlus 组件库优化
- 📦 **按需加载**：支持按需引入，减少包体积
- 🔧 **类型安全**：完整的 TypeScript 类型定义
- 🎨 **主题支持**：支持 ElementPlus 主题定制
- 📱 **响应式**：支持多种尺寸和响应式布局

## 📦 安装

```bash
npm install @form-renderer/preset-element-plus
# 或
pnpm add @form-renderer/preset-element-plus
```

## 🔧 快速开始

### 基础使用

```vue
<template>
  <FormAdapter
    :schema="schema"
    v-model:model="formData"
    :components="elementPlusPreset"
    @change="handleChange"
  />
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { FormAdapter } from '@form-renderer/adapter-vue3-vue'
import { createElementPlusPreset } from '@form-renderer/preset-element-plus'

// 创建预设
const elementPlusPreset = createElementPlusPreset({
  theme: {
    size: 'default',
    classPrefix: 'el-'
  }
})

// 表单数据
const formData = reactive({
  name: '',
  age: undefined,
  email: ''
})

// 表单 Schema
const schema = {
  type: 'form',
  component: 'form',
  componentProps: {
    labelWidth: '120px'
  },
  properties: {
    name: {
      type: 'field',
      component: 'input',
      formItemProps: {
        label: '姓名'
      },
      componentProps: {
        placeholder: '请输入姓名'
      },
      required: true
    },
    age: {
      type: 'field',
      component: 'number',
      formItemProps: {
        label: '年龄'
      },
      componentProps: {
        placeholder: '请输入年龄',
        min: 1,
        max: 120
      }
    },
    email: {
      type: 'field',
      component: 'input',
      formItemProps: {
        label: '邮箱'
      },
      componentProps: {
        placeholder: '请输入邮箱'
      },
      required: true
    }
  }
}

const handleChange = (data: any) => {
  console.log('表单数据变更:', data)
}
</script>
```

### 使用默认预设

```vue
<script setup lang="ts">
import { ElementPlusPreset } from '@form-renderer/preset-element-plus'

// 直接使用默认预设
const elementPlusPreset = ElementPlusPreset
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

## 📖 更多示例

查看 `packages/PresetElementPlus/src/examples/` 目录下的示例文件：

- `all-widgets.vue` - 完整组件展示（推荐查看）
- `widgets.vue` - 基础字段组件示例
- `form-container-example.vue` - 基础表单示例
- `layout-container-example.vue` - 布局容器示例
- `list-container-example.vue` - 列表容器示例
- `nested-container-example.vue` - 复杂嵌套示例

## 🛠️ 开发

```bash
# 安装依赖
pnpm install

# 开发模式
pnpm dev

# 构建库
pnpm build:lib

# 运行测试
pnpm test
```

## 📄 许可证

MIT License

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！
