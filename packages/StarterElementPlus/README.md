# @form-renderer/starter-element-plus

> 🚀 开箱即用的 ElementPlus 表单渲染器启动器

基于 `@form-renderer/engine`、`@form-renderer/adapter-vue3` 和 `@form-renderer/preset-element-plus` 的完整集成包，让你能够快速开始使用表单渲染器。

## ✨ 特性

- 🎯 **开箱即用** - 无需复杂配置，一行代码即可使用
- 📦 **完整集成** - 内置 Engine + Adapter + ElementPlus Preset
- 🔧 **类型安全** - 完整的 TypeScript 类型支持
- 🎨 **主题支持** - 完全兼容 ElementPlus 主题系统
- 📱 **响应式** - 支持多种屏幕尺寸
- 🔌 **可扩展** - 可以自定义组件和预设

## 📦 安装

```bash
# 使用 npm
npm install @form-renderer/starter-element-plus

# 使用 pnpm
pnpm add @form-renderer/starter-element-plus

# 使用 yarn
yarn add @form-renderer/starter-element-plus
```

**注意**：需要同时安装 `vue` 和 `element-plus`：

```bash
pnpm add vue element-plus
```

## 🚀 快速开始

### 1. 全局注册（推荐）

```typescript
// main.ts
import { createApp } from 'vue'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import FormRendererStarter from '@form-renderer/starter-element-plus'
import App from './App.vue'

const app = createApp(App)
app.use(ElementPlus)
app.use(FormRendererStarter)
app.mount('#app')
```

然后在组件中直接使用：

```vue
<template>
  <FormRenderer
    v-model:model="formData"
    :schema="formSchema"
    @change="handleChange"
  />
</template>

<script setup lang="ts">
import { reactive } from 'vue'

const formData = reactive({
  name: '',
  email: ''
})

const formSchema = {
  type: 'form',
  component: 'form',
  componentProps: {
    labelWidth: '100px'
  },
  properties: {
    name: {
      type: 'field',
      component: 'input',
      formItemProps: { label: '姓名' },
      componentProps: { placeholder: '请输入姓名' }
    },
    email: {
      type: 'field',
      component: 'input',
      formItemProps: { label: '邮箱' },
      componentProps: { 
        type: 'email',
        placeholder: '请输入邮箱' 
      }
    }
  }
}

const handleChange = (data: any) => {
  console.log('表单变更:', data)
}
</script>
```

### 2. 局部导入

```vue
<template>
  <FormRenderer
    v-model:model="formData"
    :schema="formSchema"
  />
</template>

<script setup lang="ts">
import { reactive } from 'vue'
import { FormRenderer } from '@form-renderer/starter-element-plus'

// ... 其余代码同上
</script>
```

## 📚 API

### FormRenderer Props

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `schema` | `FormSchema` | **必填** | 表单 Schema 配置 |
| `model` | `FormModel` | `{}` | 表单数据模型（支持 v-model） |
| `components` | `ComponentRegistry` | `ElementPlusPreset` | 自定义组件注册表 |
| `disabled` | `boolean` | `false` | 是否禁用整个表单 |
| `size` | `'large' \| 'default' \| 'small'` | `'default'` | 表单尺寸 |

### FormRenderer Events

| 事件名 | 参数 | 说明 |
|--------|------|------|
| `update:model` | `(value: FormModel)` | 表单数据更新时触发 |
| `change` | `({ path, value, model })` | 表单值变更时触发（包含路径信息） |
| `validate-error` | `(errors: any[])` | 表单验证失败时触发 |

### FormRenderer Methods

| 方法名 | 参数 | 返回值 | 说明 |
|--------|------|--------|------|
| `getEngine` | - | `FormEngine` | 获取表单引擎实例 |
| `validate` | - | `Promise<boolean>` | 验证表单 |
| `reset` | - | `void` | 重置表单 |
| `getModel` | - | `FormModel` | 获取表单数据 |
| `setModel` | `(model: FormModel)` | `void` | 设置表单数据 |

## 📖 完整示例

### 复杂表单

```vue
<template>
  <div class="form-container">
    <FormRenderer
      ref="formRef"
      v-model:model="formData"
      :schema="schema"
      @change="handleChange"
    />
    
    <div class="actions">
      <el-button @click="handleReset">重置</el-button>
      <el-button type="primary" @click="handleSubmit">提交</el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { FormRenderer } from '@form-renderer/starter-element-plus'
import type { FormSchema } from '@form-renderer/engine'

const formRef = ref()

const formData = reactive({
  username: '',
  password: '',
  age: undefined,
  gender: '',
  interests: [],
  birthday: '',
  agree: false
})

const schema: FormSchema = {
  type: 'form',
  component: 'form',
  componentProps: {
    labelWidth: '120px'
  },
  properties: {
    username: {
      type: 'field',
      component: 'input',
      formItemProps: {
        label: '用户名',
        required: true
      },
      componentProps: {
        placeholder: '请输入用户名',
        clearable: true
      }
    },
    password: {
      type: 'field',
      component: 'input',
      formItemProps: {
        label: '密码',
        required: true
      },
      componentProps: {
        type: 'password',
        placeholder: '请输入密码',
        showPassword: true
      }
    },
    age: {
      type: 'field',
      component: 'input-number',
      formItemProps: {
        label: '年龄'
      },
      componentProps: {
        min: 1,
        max: 150
      }
    },
    gender: {
      type: 'field',
      component: 'radio-group',
      formItemProps: {
        label: '性别'
      },
      componentProps: {
        options: [
          { label: '男', value: 'male' },
          { label: '女', value: 'female' }
        ]
      }
    },
    interests: {
      type: 'field',
      component: 'checkbox-group',
      formItemProps: {
        label: '兴趣爱好'
      },
      componentProps: {
        options: [
          { label: '阅读', value: 'reading' },
          { label: '运动', value: 'sports' },
          { label: '音乐', value: 'music' },
          { label: '旅行', value: 'travel' }
        ]
      }
    },
    birthday: {
      type: 'field',
      component: 'date-picker',
      formItemProps: {
        label: '生日'
      },
      componentProps: {
        type: 'date',
        placeholder: '请选择日期',
        format: 'YYYY-MM-DD',
        valueFormat: 'YYYY-MM-DD'
      }
    },
    agree: {
      type: 'field',
      component: 'switch',
      formItemProps: {
        label: '同意协议'
      }
    }
  }
}

const handleChange = (data: any) => {
  console.log('表单数据变更:', data)
}

const handleReset = () => {
  formRef.value?.reset()
}

const handleSubmit = async () => {
  const valid = await formRef.value?.validate()
  if (valid) {
    console.log('提交数据:', formData)
    // 提交逻辑
  }
}
</script>

<style scoped>
.form-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}

.actions {
  margin-top: 20px;
  text-align: right;
}
</style>
```

## 🎨 支持的组件

### 字段组件

**基础输入**
- `input` - 单行文本输入框
- `textarea` - 多行文本输入框
- `input-number` - 数字输入框

**选择器**
- `switch` - 开关
- `checkbox-group` - 多选框组
- `radio-group` - 单选框组
- `select` - 下拉选择器
- `cascader` - 级联选择器

**日期时间**
- `date-picker` - 日期选择器
- `time-picker` - 时间选择器

**特殊输入**
- `slider` - 滑块
- `rate` - 评分
- `color-picker` - 颜色选择器
- `upload` - 文件上传

### 容器组件

- `form` - 表单容器
- `layout` - 布局容器
- `list` - 列表容器（动态增删）

## 🔧 高级用法

### 自定义组件

如果你需要使用自定义组件或覆盖默认预设：

```vue
<script setup lang="ts">
import { FormRenderer, ElementPlusPreset } from '@form-renderer/starter-element-plus'
import MyCustomInput from './MyCustomInput.vue'

const customComponents = {
  ...ElementPlusPreset,
  field: {
    ...ElementPlusPreset.field,
    'custom-input': {
      component: MyCustomInput,
      // ... 其他配置
    }
  }
}
</script>

<template>
  <FormRenderer
    :schema="schema"
    :components="customComponents"
  />
</template>
```

### 访问底层 API

如果需要更多控制，可以直接访问底层的 Engine、Adapter 和 Preset：

```typescript
import { 
  FormEngine, 
  ElementPlusPreset 
} from '@form-renderer/starter-element-plus'

// 使用 FormEngine 的能力
const engine = new FormEngine(schema, initialData)

// 使用预设中的组件
const { Input, Select } = ElementPlusPreset.field
```

## 📄 许可证

MIT License

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 🔗 相关包

- [@form-renderer/engine](../Engine) - 表单引擎核心
- [@form-renderer/adapter-vue3](../Adapter) - Vue3 适配器
- [@form-renderer/preset-element-plus](../PresetElementPlus) - ElementPlus 组件预设

