# 自定义事件处理指南

## 概述

Form Renderer 支持两种层次的事件处理机制：

1. **核心事件**：由 EventHandler 处理，会通知 Engine 更新状态
2. **字段级自定义事件**：直接绑定到组件，不经过 Engine

## 核心事件

这些事件会通过 EventHandler 通知 Engine，触发响应式更新：

- `onChange`: 值变化事件，会更新 model
- `onInput`: 输入事件，只更新显示值
- `onFocus`: 聚焦事件
- `onBlur`: 失焦事件

### 使用方式

核心事件由框架自动处理，你可以在 FormAdapter 层监听：

```vue
<FormAdapter
  :schema="schema"
  v-model:model="formData"
  @change="handleChange"
  @field-focus="handleFocus"
  @field-blur="handleBlur"
/>
```

## 字段级自定义事件

这些事件直接绑定到具体的字段组件，适合处理字段特定的交互逻辑。

### 支持的事件

常见的字段级事件包括：

- `onKeydown`: 键盘按下
- `onKeyup`: 键盘抬起
- `onEnter`: 回车键（语法糖）
- `onClick`: 点击
- `onMouseenter`: 鼠标进入
- `onMouseleave`: 鼠标离开
- 以及任何组件支持的原生事件

### 使用方式

在 Schema 的 `componentProps` 中定义事件处理器：

```typescript
const schema: FormSchema = {
  fields: [
    {
      path: 'username',
      component: 'input',
      label: '用户名',
      componentProps: {
        // 限制只能输入字母和数字
        onKeydown: (e: KeyboardEvent) => {
          if (!/[a-zA-Z0-9]/.test(e.key) && !['Backspace', 'Delete', 'Tab'].includes(e.key)) {
            e.preventDefault()
          }
        }
      }
    }
  ]
}
```

## 实际场景示例

### 场景 1：回车提交表单

```typescript
const schema: FormSchema = {
  fields: [
    {
      path: 'search',
      component: 'input',
      label: '搜索',
      componentProps: {
        onKeydown: (e: KeyboardEvent) => {
          if (e.key === 'Enter') {
            e.preventDefault()
            // 触发搜索
            performSearch()
          }
        }
      }
    }
  ]
}
```

### 场景 2：输入格式化

```typescript
const schema: FormSchema = {
  fields: [
    {
      path: 'phone',
      component: 'input',
      label: '手机号',
      componentProps: {
        onKeydown: (e: KeyboardEvent) => {
          // 只允许输入数字
          if (!/\d/.test(e.key) && !['Backspace', 'Delete', 'Tab', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
            e.preventDefault()
          }
        },
        // 格式化显示：138-1234-5678
        onInput: (e: Event) => {
          const input = e.target as HTMLInputElement
          let value = input.value.replace(/\D/g, '')
          if (value.length > 3 && value.length <= 7) {
            value = value.replace(/(\d{3})(\d{0,4})/, '$1-$2')
          } else if (value.length > 7) {
            value = value.replace(/(\d{3})(\d{4})(\d{0,4})/, '$1-$2-$3')
          }
          input.value = value
        }
      }
    }
  ]
}
```

### 场景 3：快捷键组合

```typescript
const schema: FormSchema = {
  fields: [
    {
      path: 'content',
      component: 'input',
      label: '内容',
      componentProps: {
        onKeydown: (e: KeyboardEvent) => {
          // Ctrl + S 保存草稿
          if (e.ctrlKey && e.key === 's') {
            e.preventDefault()
            saveDraft()
          }
          
          // Ctrl + Enter 提交
          if (e.ctrlKey && e.key === 'Enter') {
            e.preventDefault()
            submitForm()
          }
          
          // ESC 取消编辑
          if (e.key === 'Escape') {
            cancelEdit()
          }
        }
      }
    }
  ]
}
```

### 场景 4：实时搜索（配合防抖）

```typescript
import { debounce } from 'lodash-es'

const schema: FormSchema = {
  fields: [
    {
      path: 'keyword',
      component: 'input',
      label: '关键词',
      componentProps: {
        // 使用 onInput 而不是 onChange，获得更及时的反馈
        onInput: debounce((e: Event) => {
          const value = (e.target as HTMLInputElement).value
          if (value.length >= 2) {
            searchAPI(value)
          }
        }, 300)
      }
    }
  ]
}
```

## 高级技巧

### 1. 访问 Engine 实例

如果需要在事件处理器中访问 Engine 实例，可以通过闭包：

```typescript
const createSchema = (engine: ReactiveEngine): FormSchema => {
  return {
    fields: [
      {
        path: 'amount',
        component: 'number',
        componentProps: {
          onKeydown: (e: KeyboardEvent) => {
            if (e.key === 'Enter') {
              // 访问 engine
              const currentValue = engine.getValue('amount')
              console.log('当前金额:', currentValue)
            }
          }
        }
      }
    ]
  }
}

// 使用
const engine = createReactiveEngine({ schema, model })
const schema = createSchema(engine)
```

### 2. 动态事件处理器

```typescript
const createEventHandler = (fieldPath: string) => {
  return (e: KeyboardEvent) => {
    console.log(`Field ${fieldPath} received key: ${e.key}`)
  }
}

const schema: FormSchema = {
  fields: [
    {
      path: 'field1',
      component: 'input',
      componentProps: {
        onKeydown: createEventHandler('field1')
      }
    }
  ]
}
```

### 3. 事件组合

```typescript
const schema: FormSchema = {
  fields: [
    {
      path: 'field',
      component: 'input',
      componentProps: {
        onKeydown: (e: KeyboardEvent) => {
          // 多种组合键
          if (e.shiftKey && e.key === 'Tab') {
            // Shift + Tab: 返回上一个字段
          }
          if (e.altKey && e.key === 'c') {
            // Alt + C: 清除内容
          }
        }
      }
    }
  ]
}
```

## 注意事项

1. **性能考虑**：频繁触发的事件（如 onKeydown、onInput）应该使用防抖或节流
2. **不要在事件处理器中直接修改 model**：应该通过 Engine 的 API 更新
3. **事件命名**：使用 `onXxx` 格式，会自动转换为组件事件名
4. **类型安全**：建议使用 TypeScript 定义事件处理器的类型
5. **避免内存泄漏**：如果使用了定时器或订阅，记得在组件销毁时清理

## 与 EventMapping 的关系

EventMapping 主要用于：
- 统一不同 UI 框架的核心事件名称差异
- 文档和类型提示

而实际的字段级事件处理应该通过 Schema 的 `componentProps` 定义，这样更加灵活和直观。

