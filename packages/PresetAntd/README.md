# @form-renderer/preset-antd

Ant Design 预设包，为 form-renderer 提供完整的 Ant Design 组件支持。

## 特性

- 🎯 **专注 Ant Design** - 专为 Ant Design 5.x 优化
- 📦 **完整组件支持** - 支持 Input、Select、DatePicker 等常用组件
- 🔧 **类型安全** - 完整的 TypeScript 类型定义
- 🎨 **开箱即用** - 无需额外配置
- 📱 **响应式** - 支持多种尺寸和响应式布局
- 🔥 **自动校验** - 自动转换 FormEngine 的 validators 为 Ant Design rules

## 安装

```bash
npm install @form-renderer/preset-antd @form-renderer/adapter-react antd dayjs
# 或
pnpm add @form-renderer/preset-antd @form-renderer/adapter-react antd dayjs
```

## 快速开始

### 基础使用

```tsx
import { FormAdapter } from '@form-renderer/adapter-react'
import { AntdPreset } from '@form-renderer/preset-antd'
import { useState } from 'react'

const App = () => {
  const [model, setModel] = useState({
    name: '',
    age: undefined,
    email: ''
  })

  const schema = {
    type: 'form',
    component: 'form',
    componentProps: {
      labelWidth: '120px',
      layout: 'horizontal'
    },
    properties: {
      name: {
        type: 'field',
        component: 'Input',
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
        component: 'InputNumber',
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
        component: 'Input',
        formItemProps: {
          label: '邮箱'
        },
        componentProps: {
          placeholder: '请输入邮箱'
        },
        required: true,
        validators: [
          (value) => {
            if (!value.includes('@')) {
              return '邮箱格式不正确'
            }
          }
        ]
      }
    }
  }

  const handleChange = (event: any) => {
    console.log('表单数据变更:', event)
  }

  const handleSubmit = async (data: any) => {
    console.log('提交数据:', data)
  }

  return (
    <FormAdapter
      schema={schema}
      model={model}
      components={AntdPreset}
      onChange={handleChange}
      onSubmit={handleSubmit}
    />
  )
}
```

### 使用自定义配置

```tsx
import { createAntdPreset } from '@form-renderer/preset-antd'

const customPreset = createAntdPreset({
  theme: {
    size: 'large',
    classPrefix: 'my-'
  }
})

<FormAdapter
  schema={schema}
  model={model}
  components={customPreset}
/>
```

## 组件支持

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
- ✅ **Upload** - 文件上传

### 容器组件

- ✅ **Form** - 表单容器
- ✅ **Layout** - 布局容器（支持 Card、Space、Div）
- ✅ **List** - 列表容器（支持动态增删）

## 值转换器

Ant Design 的某些组件需要特殊的值类型，预设已内置转换器：

### DatePicker 值转换器

```typescript
// 引擎值: string (ISO 8601) ↔ 组件值: Dayjs
import { dateTransformer } from '@form-renderer/preset-antd'

// 自动处理：
// Engine: "2024-01-01T00:00:00.000Z" → Component: dayjs("2024-01-01")
// Component: dayjs("2024-01-01") → Engine: "2024-01-01T00:00:00.000Z"
```

### TimePicker 值转换器

```typescript
// 引擎值: string (HH:mm:ss) ↔ 组件值: Dayjs
import { timeTransformer } from '@form-renderer/preset-antd'
```

### InputNumber 值转换器

```typescript
// 引擎值: number | undefined ↔ 组件值: number | null
import { numberTransformer } from '@form-renderer/preset-antd'
```

## 事件映射

Ant Design 的事件处理与标准 HTML 有差异，预设已内置事件映射：

### Input 事件映射

```typescript
// Ant Design Input onChange 参数是 event 对象
// 自动提取 e.target.value
eventMapping: {
  onChange: (e) => e.target.value
}
```

### Select 事件映射

```typescript
// Select onChange 直接返回 value
eventMapping: {
  onChange: (value) => value
}
```

## 校验规则转换

预设会自动将 FormEngine 的 validators 转换为 Ant Design 的 rules 格式：

```typescript
// FormEngine Schema
{
  type: 'field',
  component: 'Input',
  required: true,
  validators: [
    (value) => {
      if (!value.includes('@')) {
        return '邮箱格式不正确'
      }
    }
  ]
}

// 自动转换为 Ant Design rules
[
  {
    required: true,
    message: '该字段为必填项'
  },
  {
    validator: async (_, value) => {
      // 执行自定义校验逻辑
    }
  }
]
```

## 使用示例

### 动态表单

```tsx
const schema = {
  type: 'form',
  properties: {
    userType: {
      type: 'field',
      component: 'Select',
      formItemProps: { label: '用户类型' },
      componentProps: {
        options: [
          { label: '个人', value: 'personal' },
          { label: '企业', value: 'company' }
        ]
      }
    },
    personalInfo: {
      type: 'layout',
      component: 'layout',
      ifShow: (ctx) => ctx.getValue('userType') === 'personal',
      componentProps: {
        type: 'card',
        title: '个人信息'
      },
      properties: {
        name: {
          type: 'field',
          component: 'Input',
          required: true,
          formItemProps: { label: '姓名' }
        },
        idCard: {
          type: 'field',
          component: 'Input',
          required: true,
          formItemProps: { label: '身份证号' }
        }
      }
    }
  }
}
```

### 列表表单

```tsx
const schema = {
  type: 'form',
  properties: {
    items: {
      type: 'list',
      component: 'list',
      componentProps: {
        title: '商品列表',
        addButtonText: '添加商品'
      },
      items: {
        name: {
          type: 'field',
          component: 'Input',
          required: true,
          formItemProps: { label: '商品名称' }
        },
        price: {
          type: 'field',
          component: 'InputNumber',
          required: true,
          formItemProps: { label: '价格' },
          validators: [
            (value) => {
              if (value <= 0) return '价格必须大于0'
            }
          ]
        },
        quantity: {
          type: 'field',
          component: 'InputNumber',
          required: true,
          formItemProps: { label: '数量' }
        }
      }
    }
  }
}
```

## 自定义组件

如果需要添加自定义组件，可以扩展预设：

```tsx
import { AntdPreset } from '@form-renderer/preset-antd'
import { createComponentRegistry } from '@form-renderer/adapter-react'

const registry = createComponentRegistry()

// 注册 Ant Design 预设
registry.registerPreset(AntdPreset)

// 添加自定义组件
registry.register({
  name: 'CustomInput',
  component: MyCustomInput,
  type: 'field',
  eventMapping: {
    onChange: (value) => value
  },
  needFormItem: true
})

<FormAdapter
  schema={schema}
  model={model}
  components={registry.getAll()}
/>
```

## API

### AntdPreset

默认的 Ant Design 预设，包含所有标准组件。

```typescript
import { AntdPreset } from '@form-renderer/preset-antd'

interface ComponentPreset {
  name: string
  components: ComponentDefinition[]
  formItem?: React.ComponentType<any>
  ruleConverter?: RuleConverter
  theme?: ThemeConfig
}
```

### createAntdPreset

创建自定义配置的 Ant Design 预设。

```typescript
function createAntdPreset(options?: {
  theme?: {
    size?: 'large' | 'middle' | 'small'
    classPrefix?: string
  }
}): ComponentPreset
```

### 容器组件

#### Form

```typescript
interface FormProps {
  children?: React.ReactNode
  labelWidth?: string | number
  labelAlign?: 'left' | 'right'
  layout?: 'horizontal' | 'vertical' | 'inline'
  [key: string]: any
}
```

#### Layout

```typescript
interface LayoutProps {
  children?: React.ReactNode
  title?: string
  type?: 'card' | 'space' | 'div'
  direction?: 'horizontal' | 'vertical'
  [key: string]: any
}
```

#### List

```typescript
interface ListProps {
  children?: React.ReactNode
  title?: string
  rows?: any[]
  onAdd?: () => void
  onRemove?: (index: number) => void
  onMove?: (from: number, to: number) => void
  addButtonText?: string
  removeButtonText?: string
  [key: string]: any
}
```

## 常见问题

### 1. 如何自定义表单布局？

通过 Form 组件的 componentProps 配置：

```typescript
{
  type: 'form',
  component: 'form',
  componentProps: {
    layout: 'vertical',  // horizontal | vertical | inline
    labelWidth: '100px',
    labelAlign: 'left'   // left | right
  }
}
```

### 2. 如何处理日期格式？

DatePicker 自动使用 dayjs，引擎中存储 ISO 8601 字符串：

```typescript
// 引擎值
model: {
  birthday: '2024-01-01T00:00:00.000Z'
}

// DatePicker 自动转换为 dayjs 对象显示
```

### 3. 如何自定义校验规则？

使用 validators 数组：

```typescript
{
  type: 'field',
  component: 'Input',
  validators: [
    (value, ctx) => {
      // 自定义校验逻辑
      if (!isValid(value)) {
        return '校验失败的错误消息'
      }
    }
  ]
}
```

## License

MIT

