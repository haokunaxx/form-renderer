# 组件开发规范

本文档规定了为 Form Renderer 开发自定义组件时需要遵守的规范。

## 事件规范

### Change 事件

所有表单组件的 `change` 事件**必须传递表单值本身**，而不是事件对象。

#### ✅ 正确示例

```vue
<template>
  <el-radio-group
    :model-value="modelValue"
    @update:model-value="handleChange"
  >
    <el-radio :label="option.value" />
  </el-radio-group>
</template>

<script setup lang="ts">
const emit = defineEmits<{
  change: [value: string | number | boolean]
}>()

const handleChange = (value: string | number | boolean) => {
  emit('change', value)  // ✅ 传递值本身
}
</script>
```

#### ❌ 错误示例

```vue
<template>
  <input @change="handleChange" />
</template>

<script setup lang="ts">
const emit = defineEmits<{
  change: [value: Event]
}>()

const handleChange = (event: Event) => {
  emit('change', event)  // ❌ 不要传递事件对象
}
</script>
```

### 原生 HTML 元素

对于原生 HTML 元素（如 `<input>`, `<select>`, `<textarea>` 等），FieldWrapper 会自动检测事件对象并提取 `event.target.value`，因此无需特殊处理。

### 智能检测机制

FieldWrapper 内部实现了智能检测：

```typescript
const handleChange = (eventValue: any) => {
  let value: any
  
  // 如果是原生事件对象，从 target.value 提取
  if (eventValue && eventValue.target && 'value' in eventValue.target) {
    value = eventValue.target.value
  } else {
    // 否则认为就是值本身（UI 组件库的标准做法）
    value = eventValue
  }
  
  // ... 后续处理
}
```

## 组件封装模板

### 基础表单组件

```vue
<template>
  <el-input
    :model-value="modelValue"
    @update:model-value="handleChange"
    :disabled="disabled"
    v-bind="$attrs"
  />
</template>

<script setup lang="ts">
import type { FieldComponentProps } from '../types'

export interface InputProps extends FieldComponentProps {
  modelValue: string
}

const props = defineProps<InputProps>()

const emit = defineEmits<{
  change: [value: string]
}>()

const handleChange = (value: string) => {
  // 规范：传递值本身，不是事件对象
  emit('change', value)
  
  // 如果组件定义了 onChange 回调
  props.onChange?.(value)
}
</script>
```

### 复杂选择组件

```vue
<template>
  <el-select
    :model-value="modelValue"
    @update:model-value="handleChange"
    :disabled="disabled"
    v-bind="$attrs"
  >
    <el-option
      v-for="option in options"
      :key="option.value"
      :label="option.label"
      :value="option.value"
    />
  </el-select>
</template>

<script setup lang="ts">
import type { FieldComponentProps } from '../types'

export interface SelectOption {
  label: string
  value: string | number
}

export interface SelectProps extends FieldComponentProps {
  modelValue: string | number
  options: SelectOption[]
}

const props = defineProps<SelectProps>()

const emit = defineEmits<{
  change: [value: string | number]
}>()

const handleChange = (value: string | number) => {
  emit('change', value)
  props.onChange?.(value)
}
</script>
```

## 值转换器

如果组件的内部值格式与 Engine 的数据格式不一致，使用 `valueTransformer` 处理：

```typescript
import type { ComponentDefinition } from '@form-renderer/adapter-vue3'

export const DatePickerDef: ComponentDefinition = {
  name: 'DatePicker',
  component: DatePicker,
  type: 'field',
  valueTransformer: {
    // Engine → Component：字符串转 Date 对象
    toComponent: (value: string) => {
      return value ? new Date(value) : null
    },
    // Component → Engine：Date 对象转字符串
    fromComponent: (value: Date | null) => {
      return value ? value.toISOString() : ''
    }
  }
}
```

## 特殊情况处理

### 1. 多值组件（如 Checkbox Group）

```typescript
const handleChange = (values: string[]) => {
  // 直接传递数组
  emit('change', values)
}
```

### 2. 复杂对象值

```typescript
const handleChange = (selection: { id: string; name: string }) => {
  // 传递完整对象
  emit('change', selection)
}
```

### 3. 需要转换的情况

使用 `valueTransformer` 而不是在组件内部转换：

```typescript
// ❌ 不要在组件内转换
const handleChange = (date: Date) => {
  emit('change', date.toISOString())  // 不好
}

// ✅ 使用 valueTransformer
const handleChange = (date: Date) => {
  emit('change', date)  // 保持原始类型
}
```

## 总结

遵循以下原则：

1. **Change 事件传递值本身，不是事件对象**
2. **保持组件值的原始类型，通过 valueTransformer 转换**
3. **让 FieldWrapper 处理事件对象的值提取**
4. **使用 TypeScript 确保类型安全**

这样可以确保组件在 Form Renderer 中正常工作，并提供良好的开发体验。

