# 组件预设开发指南

本文档详细介绍如何为 FormAdapter 开发组件预设（ComponentPreset）。

## 什么是组件预设

组件预设是一组预定义的组件配置，用于快速集成 UI 框架（如 Element Plus、Ant Design Vue 等）。一个完整的预设包含：

- **组件定义列表** - 字段组件、布局组件、列表组件
- **FormItem 组件** - 表单项包装组件
- **Rule 转换器** - 将 Engine 的 validators 转换为 UI 框架的 rules
- **主题配置** - 尺寸、样式前缀等
- **初始化函数** - 预设加载时的初始化逻辑

## 预设结构

```typescript
interface ComponentPreset {
  /**
   * 预设名称
   */
  name: string

  /**
   * 组件定义列表
   */
  components: ComponentDefinition[]

  /**
   * 表单项包装组件
   */
  formItem?: Component

  /**
   * Rule 转换器
   */
  ruleConverter?: RuleConverter

  /**
   * 主题配置
   */
  theme?: ThemeConfig

  /**
   * 初始化函数
   */
  setup?: () => void | Promise<void>
}
```

## 快速开始

### 1. 创建预设目录

```
presets/
└── my-ui/
    ├── index.ts                  # 预设入口
    ├── components/               # 组件定义
    │   ├── fields.ts             # 字段组件
    │   ├── layouts.ts            # 布局组件
    │   └── lists.ts              # 列表组件
    ├── form-item.vue             # FormItem 组件
    ├── rule-converter.ts         # Rule 转换器
    └── theme.ts                  # 主题配置
```

### 2. 创建预设入口文件

```typescript
// presets/my-ui/index.ts
import type { ComponentPreset } from '@form-renderer/adapter-vue3'
import { fieldComponents } from './components/fields'
import { layoutComponents } from './components/layouts'
import { listComponents } from './components/lists'
import MyFormItem from './form-item.vue'
import { myRuleConverter } from './rule-converter'
import { theme } from './theme'

export const MyUIPreset: ComponentPreset = {
  name: 'my-ui',
  
  components: [
    ...fieldComponents,
    ...layoutComponents,
    ...listComponents
  ],
  
  formItem: MyFormItem,
  
  ruleConverter: myRuleConverter,
  
  theme,
  
  setup: () => {
    // 初始化逻辑（如加载全局样式）
    console.log('MyUI 预设已加载')
  }
}
```

### 3. 定义字段组件

```typescript
// presets/my-ui/components/fields.ts
import type { ComponentDefinition } from '@form-renderer/adapter-vue3'
import {
  MyInput,
  MyInputNumber,
  MySelect,
  MyDatePicker,
  MySwitch
} from 'my-ui'

export const fieldComponents: ComponentDefinition[] = [
  // Input 组件
  {
    name: 'Input',
    component: MyInput,
    type: 'field',
    defaultProps: {
      clearable: true,
      placeholder: '请输入'
    },
    eventMapping: {
      onChange: 'update:modelValue',
      onBlur: 'blur',
      onFocus: 'focus'
    },
    needFormItem: true
  },

  // InputNumber 组件
  {
    name: 'InputNumber',
    component: MyInputNumber,
    type: 'field',
    defaultProps: {
      min: 0,
      controlsPosition: 'right'
    },
    valueTransformer: {
      toComponent: (v) => (v === null || v === undefined ? '' : Number(v)),
      fromComponent: (v) => (v === '' ? undefined : Number(v))
    },
    eventMapping: {
      onChange: 'update:modelValue'
    },
    needFormItem: true
  },

  // Select 组件
  {
    name: 'Select',
    component: MySelect,
    type: 'field',
    defaultProps: {
      clearable: true,
      placeholder: '请选择'
    },
    eventMapping: {
      onChange: 'change'  // 注意：某些 UI 库使用 'change' 而不是 'update:modelValue'
    },
    needFormItem: true
  },

  // DatePicker 组件
  {
    name: 'DatePicker',
    component: MyDatePicker,
    type: 'field',
    defaultProps: {
      format: 'YYYY-MM-DD',
      valueFormat: 'YYYY-MM-DD',
      placeholder: '请选择日期'
    },
    valueTransformer: {
      toComponent: (v: string) => (v ? new Date(v) : null),
      fromComponent: (v: Date | null) => (v ? v.toISOString().split('T')[0] : '')
    },
    eventMapping: {
      onChange: 'update:modelValue'
    },
    needFormItem: true
  },

  // Switch 组件
  {
    name: 'Switch',
    component: MySwitch,
    type: 'field',
    defaultProps: {
      activeValue: true,
      inactiveValue: false
    },
    valueTransformer: {
      toComponent: (v) => Boolean(v),
      fromComponent: (v) => Boolean(v)
    },
    eventMapping: {
      onChange: 'update:modelValue'
    },
    needFormItem: true
  }
]
```

### 4. 定义布局和列表组件

```typescript
// presets/my-ui/components/layouts.ts
import type { ComponentDefinition } from '@form-renderer/adapter-vue3'
import { MyCard, MyTabs } from 'my-ui'

export const layoutComponents: ComponentDefinition[] = [
  {
    name: 'Card',
    component: MyCard,
    type: 'layout',
    defaultProps: {
      shadow: 'hover'
    }
  },
  {
    name: 'Tabs',
    component: MyTabs,
    type: 'layout'
  }
]
```

```typescript
// presets/my-ui/components/lists.ts
import type { ComponentDefinition } from '@form-renderer/adapter-vue3'
import MyList from './MyList.vue'

export const listComponents: ComponentDefinition[] = [
  {
    name: 'List',
    component: MyList,
    type: 'list'
  }
]
```

### 5. 创建 FormItem 组件

```vue
<!-- presets/my-ui/form-item.vue -->
<template>
  <my-form-item
    :label="label"
    :required="required"
    :prop="prop"
    :rules="rules"
    :error="error"
  >
    <slot />
  </my-form-item>
</template>

<script setup lang="ts">
import { MyFormItem } from 'my-ui'

defineProps<{
  label?: string
  required?: boolean
  prop?: string
  rules?: any[]
  error?: string
}>()
</script>
```

### 6. 实现 RuleConverter

```typescript
// presets/my-ui/rule-converter.ts
import type { RuleConverter } from '@form-renderer/adapter-vue3'

export const myRuleConverter: RuleConverter = (node, computed, context) => {
  const rules = []

  // 必填校验
  if (computed.required) {
    rules.push({
      required: true,
      message: `${node.formItemProps?.label || '该字段'}为必填项`,
      trigger: 'blur'
    })
  }

  // 自定义校验器
  if (node.validators && Array.isArray(node.validators)) {
    node.validators.forEach((validator) => {
      rules.push({
        validator: async (rule, value, callback) => {
          try {
            // 构造 Context 对象
            const ctx = {
              path: node.path,
              getSchema: context.engine.getEngine().getSchema,
              getValue: context.engine.getEngine().getValue,
              getCurRowValue: () => {
                // 获取当前行数据
                if (context.rowIndex !== undefined) {
                  const listPath = node.path.split('.').slice(0, -1).join('.')
                  const list = context.engine.getEngine().getValue(listPath)
                  return list?.[context.rowIndex] || {}
                }
                return {}
              },
              getCurRowIndex: () => context.rowIndex ?? -1
            }

            // 执行校验器
            const result = await validator(value, ctx)

            if (result === false) {
              callback(new Error('校验失败'))
            } else if (typeof result === 'string') {
              callback(new Error(result))
            } else if (result && typeof result === 'object' && result.message) {
              callback(new Error(result.message))
            } else {
              callback()
            }
          } catch (error) {
            callback(error as Error)
          }
        },
        trigger: 'blur'
      })
    })
  }

  return rules
}
```

### 7. 配置主题

```typescript
// presets/my-ui/theme.ts
import type { ThemeConfig } from '@form-renderer/adapter-vue3'

export const theme: ThemeConfig = {
  size: 'default',
  classPrefix: 'my-ui-',
  cssVariables: {
    '--my-ui-primary-color': '#409EFF',
    '--my-ui-border-radius': '4px'
  }
}
```

## 高级技巧

### 1. 值转换器（ValueTransformer）

值转换器用于在组件值和引擎值之间进行转换。

#### 示例：日期组件

```typescript
{
  name: 'DatePicker',
  component: MyDatePicker,
  type: 'field',
  valueTransformer: {
    // 引擎值（string）→ 组件值（Date）
    toComponent: (engineValue: string) => {
      if (!engineValue) return null
      return new Date(engineValue)
    },
    // 组件值（Date）→ 引擎值（string）
    fromComponent: (componentValue: Date | null) => {
      if (!componentValue) return ''
      return componentValue.toISOString()
    }
  }
}
```

#### 示例：多选组件（数组 ↔ 逗号分隔字符串）

```typescript
{
  name: 'MultiSelect',
  component: MyMultiSelect,
  type: 'field',
  valueTransformer: {
    toComponent: (engineValue: string) => {
      if (!engineValue) return []
      return engineValue.split(',')
    },
    fromComponent: (componentValue: string[]) => {
      if (!componentValue || componentValue.length === 0) return ''
      return componentValue.join(',')
    }
  }
}
```

#### 示例：数字组件（处理空值）

```typescript
{
  name: 'InputNumber',
  component: MyInputNumber,
  type: 'field',
  valueTransformer: {
    toComponent: (engineValue: any) => {
      if (engineValue === null || engineValue === undefined) {
        return ''
      }
      return Number(engineValue)
    },
    fromComponent: (componentValue: any) => {
      if (componentValue === '' || componentValue === null) {
        return undefined
      }
      return Number(componentValue)
    }
  }
}
```

### 2. 事件映射（EventMapping）

不同的 UI 框架使用不同的事件名称，通过 eventMapping 统一。

```typescript
// Element Plus
eventMapping: {
  onChange: 'update:modelValue',
  onBlur: 'blur',
  onFocus: 'focus'
}

// Ant Design Vue
eventMapping: {
  onChange: 'change',
  onBlur: 'blur',
  onFocus: 'focus'
}

// 自定义事件名
eventMapping: {
  onChange: 'my-change-event',
  onInput: 'my-input-event'
}
```

### 3. 默认属性（defaultProps）

为组件设置默认属性，简化 Schema 配置。

```typescript
{
  name: 'Input',
  component: MyInput,
  type: 'field',
  defaultProps: {
    clearable: true,
    placeholder: '请输入',
    maxlength: 100,
    showWordLimit: true
  }
}
```

Schema 中可以覆盖默认属性：

```typescript
{
  type: 'field',
  component: 'Input',
  componentProps: {
    clearable: false,  // 覆盖默认值
    placeholder: '请输入用户名'
  }
}
```

### 4. RuleConverter 进阶

#### 处理异步校验

```typescript
const ruleConverter: RuleConverter = (node, computed, context) => {
  const rules = []

  if (node.validators) {
    node.validators.forEach((validator) => {
      rules.push({
        validator: async (rule, value, callback) => {
          try {
            const ctx = createValidationContext(node, context)
            const result = await validator(value, ctx)

            if (result === false) {
              callback(new Error('校验失败'))
            } else if (typeof result === 'string') {
              callback(new Error(result))
            } else {
              callback()
            }
          } catch (error) {
            callback(error as Error)
          }
        },
        trigger: 'blur'
      })
    })
  }

  return rules
}
```

#### 条件校验（根据控制属性）

```typescript
const ruleConverter: RuleConverter = (node, computed, context) => {
  const rules = []

  // 如果字段被禁用或隐藏，跳过校验
  if (computed.disabled || !computed.ifShow) {
    return []
  }

  // 必填校验
  if (computed.required) {
    rules.push({
      required: true,
      message: '必填项',
      trigger: 'blur'
    })
  }

  // 其他校验...

  return rules
}
```

#### 自定义触发时机

```typescript
const ruleConverter: RuleConverter = (node, computed, context) => {
  const rules = []

  // 根据组件类型设置不同的触发时机
  const trigger = node.component === 'Input' ? 'blur' : 'change'

  if (computed.required) {
    rules.push({
      required: true,
      message: '必填项',
      trigger
    })
  }

  return rules
}
```

### 5. 自定义渲染逻辑

某些特殊组件需要自定义渲染逻辑，可以使用 `customRender`。

```typescript
import { h } from 'vue'

{
  name: 'RichTextEditor',
  component: MyRichTextEditor,
  type: 'field',
  customRender: (props) => {
    return h('div', { class: 'rich-text-wrapper' }, [
      h('div', { class: 'toolbar' }, '工具栏'),
      h(MyRichTextEditor, {
        modelValue: props.value,
        'onUpdate:modelValue': props.updateValue,
        disabled: props.node.computed.disabled
      })
    ])
  }
}
```

### 6. 列表组件

列表组件需要处理添加、删除、移动等操作。

```vue
<!-- MyList.vue -->
<template>
  <div class="my-list">
    <div v-for="(row, index) in rows" :key="index" class="my-list-item">
      <div class="my-list-item-content">
        <slot :row="row" :index="index" />
      </div>
      <div class="my-list-item-actions">
        <button @click="emit('remove', index)">删除</button>
        <button v-if="index > 0" @click="emit('move', index, index - 1)">上移</button>
        <button v-if="index < rows.length - 1" @click="emit('move', index, index + 1)">下移</button>
      </div>
    </div>
    <button class="my-list-add-btn" @click="emit('add')">添加</button>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  rows: any[]
  title?: string
}>()

const emit = defineEmits<{
  add: []
  remove: [index: number]
  move: [from: number, to: number]
}>()
</script>

<style scoped>
.my-list-item {
  display: flex;
  border: 1px solid #ddd;
  padding: 10px;
  margin-bottom: 10px;
}

.my-list-item-content {
  flex: 1;
}

.my-list-item-actions {
  display: flex;
  gap: 5px;
  align-items: center;
}
</style>
```

注册列表组件：

```typescript
{
  name: 'List',
  component: MyList,
  type: 'list',
  needFormItem: false
}
```

## 完整示例

### Element Plus 预设

```typescript
// presets/element-plus/index.ts
import type { ComponentPreset, RuleConverter } from '@form-renderer/adapter-vue3'
import {
  ElInput,
  ElInputNumber,
  ElSelect,
  ElDatePicker,
  ElSwitch,
  ElRadioGroup,
  ElCheckboxGroup,
  ElFormItem
} from 'element-plus'

// 字段组件定义
const fieldComponents = [
  {
    name: 'Input',
    component: ElInput,
    type: 'field' as const,
    defaultProps: {
      clearable: true,
      placeholder: '请输入'
    },
    eventMapping: {
      onChange: 'update:modelValue',
      onBlur: 'blur',
      onFocus: 'focus'
    },
    needFormItem: true
  },
  {
    name: 'InputNumber',
    component: ElInputNumber,
    type: 'field' as const,
    defaultProps: {
      controlsPosition: 'right'
    },
    valueTransformer: {
      toComponent: (v) => (v === null || v === undefined ? undefined : Number(v)),
      fromComponent: (v) => (v === undefined ? undefined : Number(v))
    },
    eventMapping: {
      onChange: 'update:modelValue'
    },
    needFormItem: true
  },
  {
    name: 'Select',
    component: ElSelect,
    type: 'field' as const,
    defaultProps: {
      clearable: true,
      placeholder: '请选择'
    },
    eventMapping: {
      onChange: 'change'
    },
    needFormItem: true
  },
  {
    name: 'DatePicker',
    component: ElDatePicker,
    type: 'field' as const,
    defaultProps: {
      format: 'YYYY-MM-DD',
      valueFormat: 'YYYY-MM-DD',
      placeholder: '请选择日期'
    },
    eventMapping: {
      onChange: 'update:modelValue'
    },
    needFormItem: true
  },
  {
    name: 'Switch',
    component: ElSwitch,
    type: 'field' as const,
    defaultProps: {
      activeValue: true,
      inactiveValue: false
    },
    eventMapping: {
      onChange: 'update:modelValue'
    },
    needFormItem: true
  },
  {
    name: 'RadioGroup',
    component: ElRadioGroup,
    type: 'field' as const,
    eventMapping: {
      onChange: 'update:modelValue'
    },
    needFormItem: true
  },
  {
    name: 'CheckboxGroup',
    component: ElCheckboxGroup,
    type: 'field' as const,
    eventMapping: {
      onChange: 'update:modelValue'
    },
    needFormItem: true
  }
]

// Rule 转换器
const ruleConverter: RuleConverter = (node, computed, context) => {
  const rules = []

  // 必填校验
  if (computed.required) {
    rules.push({
      required: true,
      message: `${node.formItemProps?.label || '该字段'}为必填项`,
      trigger: 'blur'
    })
  }

  // 自定义校验器
  if (node.validators && Array.isArray(node.validators)) {
    node.validators.forEach((validator) => {
      rules.push({
        validator: async (rule, value, callback) => {
          try {
            const ctx = {
              path: node.path,
              getSchema: context.engine.getEngine().getSchema,
              getValue: context.engine.getEngine().getValue,
              getCurRowValue: () => ({}),
              getCurRowIndex: () => -1
            }

            const result = await validator(value, ctx)

            if (result === false) {
              callback(new Error('校验失败'))
            } else if (typeof result === 'string') {
              callback(new Error(result))
            } else if (result && typeof result === 'object' && result.message) {
              callback(new Error(result.message))
            } else {
              callback()
            }
          } catch (error) {
            callback(error as Error)
          }
        },
        trigger: 'blur'
      })
    })
  }

  return rules
}

// 导出预设
export const ElementPlusPreset: ComponentPreset = {
  name: 'element-plus',
  components: fieldComponents,
  formItem: ElFormItem,
  ruleConverter,
  theme: {
    size: 'default',
    classPrefix: 'el-'
  },
  setup: () => {
    console.log('Element Plus 预设已加载')
  }
}
```

## 测试预设

### 单元测试

```typescript
import { describe, it, expect } from 'vitest'
import { createComponentRegistry } from '@form-renderer/adapter-vue3'
import { MyUIPreset } from './my-ui'

describe('MyUI Preset', () => {
  it('应该正确注册所有组件', () => {
    const registry = createComponentRegistry()
    registry.registerPreset(MyUIPreset)

    expect(registry.has('Input')).toBe(true)
    expect(registry.has('Select')).toBe(true)
    expect(registry.has('DatePicker')).toBe(true)
  })

  it('应该正确设置默认属性', () => {
    const registry = createComponentRegistry()
    registry.registerPreset(MyUIPreset)

    const inputDef = registry.get('Input')
    expect(inputDef?.defaultProps?.clearable).toBe(true)
  })

  it('应该正确转换值', () => {
    const registry = createComponentRegistry()
    registry.registerPreset(MyUIPreset)

    const datePickerDef = registry.get('DatePicker')
    const transformer = datePickerDef?.valueTransformer

    // 引擎值 → 组件值
    const componentValue = transformer?.toComponent('2024-01-01')
    expect(componentValue).toBeInstanceOf(Date)

    // 组件值 → 引擎值
    const engineValue = transformer?.fromComponent(new Date('2024-01-01'))
    expect(engineValue).toBe('2024-01-01')
  })
})
```

### 集成测试

```typescript
import { mount } from '@vue/test-utils'
import { FormAdapter } from '@form-renderer/adapter-vue3'
import { MyUIPreset } from './my-ui'

describe('FormAdapter with MyUI Preset', () => {
  it('应该正确渲染表单', () => {
    const wrapper = mount(FormAdapter, {
      props: {
        schema: {
          type: 'form',
          properties: {
            name: {
              type: 'field',
              component: 'Input',
              formItemProps: { label: '姓名' }
            }
          }
        },
        components: MyUIPreset
      }
    })

    expect(wrapper.find('input').exists()).toBe(true)
  })

  it('应该正确处理值变化', async () => {
    const wrapper = mount(FormAdapter, {
      props: {
        schema: {
          type: 'form',
          properties: {
            name: { type: 'field', component: 'Input' }
          }
        },
        model: { name: '' },
        components: MyUIPreset
      }
    })

    const input = wrapper.find('input')
    await input.setValue('John')

    expect(wrapper.vm.getValue('name')).toBe('John')
  })
})
```

## 发布预设

### 1. 作为独立包发布

创建独立的 npm 包：

```json
{
  "name": "@your-org/form-adapter-my-ui",
  "version": "1.0.0",
  "main": "dist/index.js",
  "module": "dist/index.esm.js",
  "types": "dist/index.d.ts",
  "peerDependencies": {
    "@form-renderer/adapter-vue3": "^0.0.1",
    "my-ui": "^1.0.0",
    "vue": "^3.3.0"
  }
}
```

### 2. 作为预设集成到 Adapter

将预设放在 `packages/AdapterVue3/src/presets/` 目录下。

## 最佳实践

1. **完整的类型定义** - 为所有组件提供完整的 TypeScript 类型
2. **处理边界情况** - 值转换器要处理 null、undefined、空字符串等
3. **统一的事件映射** - 统一不同组件的事件名称
4. **合理的默认属性** - 设置常用的默认属性，简化使用
5. **完善的 RuleConverter** - 支持所有 Engine 的校验器特性
6. **编写测试** - 为预设编写单元测试和集成测试
7. **文档完善** - 提供使用示例和 API 文档

## 常见问题

### 1. 如何处理复杂的值转换？

对于复杂的值转换逻辑，建议单独提取为函数：

```typescript
// 日期范围转换
const dateRangeTransformer = {
  toComponent: (engineValue: string) => {
    if (!engineValue) return []
    const [start, end] = engineValue.split(',')
    return [new Date(start), new Date(end)]
  },
  fromComponent: (componentValue: Date[]) => {
    if (!componentValue || componentValue.length === 0) return ''
    return componentValue.map(d => d.toISOString()).join(',')
  }
}
```

### 2. 如何支持多种事件触发时机？

可以在 RuleConverter 中根据组件类型动态设置：

```typescript
const getTrigger = (componentName: string) => {
  const blurTrigger = ['Input', 'InputNumber']
  const changeTrigger = ['Select', 'DatePicker', 'Switch']

  if (blurTrigger.includes(componentName)) return 'blur'
  if (changeTrigger.includes(componentName)) return 'change'
  return 'blur'
}

const ruleConverter: RuleConverter = (node, computed, context) => {
  const trigger = getTrigger(node.component)

  return [{
    required: computed.required,
    message: '必填项',
    trigger
  }]
}
```

### 3. 如何处理嵌套组件？

某些 UI 库的组件是嵌套的（如 Radio 包含 RadioGroup 和 Radio）：

```typescript
// RadioGroup 组件
{
  name: 'RadioGroup',
  component: ElRadioGroup,
  type: 'field',
  customRender: (props) => {
    const { node, value, updateValue } = props
    const options = node.componentProps?.options || []

    return h(ElRadioGroup, {
      modelValue: value,
      'onUpdate:modelValue': updateValue
    }, () => options.map(opt => h(ElRadio, { label: opt.value }, () => opt.label)))
  }
}
```

### 4. 如何添加全局样式？

在 setup 函数中加载样式：

```typescript
setup: () => {
  // 动态加载样式
  const link = document.createElement('link')
  link.rel = 'stylesheet'
  link.href = 'https://cdn.example.com/my-ui/style.css'
  document.head.appendChild(link)
}
```

## 参考资源

- [Element Plus 预设源码](../src/presets/element-plus/)
- [示例预设源码](../src/presets/example/)
- [API 文档](./API.md)
- [项目结构](./PROJECT_STRUCTURE.md)

