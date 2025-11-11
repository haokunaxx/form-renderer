import type { Component } from 'vue'
import type {
  ComponentDefinition,
  ComponentType,
  ValueTransformer,
  EventMapping
} from '../types'

/**
 * 组件标准化选项
 */
export interface NormalizeOptions {
  name: string
  component: Component
  type?: ComponentType
  defaultProps?: Record<string, any>
  valueTransformer?: ValueTransformer
  eventMapping?: EventMapping
  needFormItem?: boolean
  customRender?: any
}

/**
 * 标准化组件定义
 * 处理默认值、类型推断等
 */
export function normalizeComponent(
  options: NormalizeOptions
): ComponentDefinition {
  const {
    name,
    component,
    type = 'field',
    defaultProps = {},
    valueTransformer,
    eventMapping,
    needFormItem = type === 'field',
    customRender
  } = options

  // 验证必需字段
  if (!name || !component) {
    throw new Error('Component name and component are required')
  }

  // 标准化事件映射
  const normalizedEventMapping: EventMapping = {
    onChange: 'update:modelValue',
    ...eventMapping
  }

  return {
    name,
    component,
    type,
    defaultProps,
    valueTransformer,
    eventMapping: normalizedEventMapping,
    needFormItem,
    customRender
  }
}

/**
 * 创建字段组件定义的快捷方法
 */
export function defineFieldComponent(options: {
  name: string
  component: Component
  valueType?: 'string' | 'number' | 'boolean' | 'array' | 'date' | 'custom'
  defaultProps?: Record<string, any>
  valueTransformer?: ValueTransformer
  eventMapping?: EventMapping
  needFormItem?: boolean
}): ComponentDefinition {
  const { valueType = 'string', valueTransformer, ...rest } = options

  // 根据 valueType 自动选择转换器
  let transformer = valueTransformer
  if (!transformer && valueType !== 'custom') {
    transformer = getTransformerByType(valueType)
  }

  return normalizeComponent({
    ...rest,
    type: 'field',
    valueTransformer: transformer
  })
}

/**
 * 创建布局组件定义的快捷方法
 */
export function defineLayoutComponent(options: {
  name: string
  component: Component
  defaultProps?: Record<string, any>
}): ComponentDefinition {
  return normalizeComponent({
    ...options,
    type: 'layout',
    needFormItem: false
  })
}

/**
 * 创建列表组件定义的快捷方法
 */
export function defineListComponent(options: {
  name: string
  component: Component
  defaultProps?: Record<string, any>
}): ComponentDefinition {
  return normalizeComponent({
    ...options,
    type: 'list',
    needFormItem: false
  })
}

/**
 * 根据值类型获取对应的转换器
 */
function getTransformerByType(
  type: 'string' | 'number' | 'boolean' | 'array' | 'date'
): ValueTransformer {
  const transformers: Record<string, ValueTransformer> = {
    string: {
      toComponent: (v: any) => v ?? '',
      fromComponent: (v: any) => v || undefined
    },
    number: {
      toComponent: (v: any) => {
        if (v === null || v === undefined) return ''
        return Number(v)
      },
      fromComponent: (v: any) => {
        if (v === '' || v === null || v === undefined) return undefined
        const num = Number(v)
        return isNaN(num) ? undefined : num
      }
    },
    boolean: {
      toComponent: (v: any) => Boolean(v),
      fromComponent: (v: any) => Boolean(v)
    },
    array: {
      toComponent: (v: any) => v ?? [],
      fromComponent: (v: any) => {
        if (!Array.isArray(v)) return []
        return v.length > 0 ? v : undefined
      }
    },
    date: {
      toComponent: (v: any) => {
        if (!v) return null
        return new Date(v)
      },
      fromComponent: (v: any) => {
        if (!v) return undefined
        return v instanceof Date ? v.toISOString() : v
      }
    }
  }

  return transformers[type]
}

/**
 * 批量标准化组件定义
 */
export function normalizeComponents(
  options: NormalizeOptions[]
): ComponentDefinition[] {
  return options.map((opt) => normalizeComponent(opt))
}

/**
 * 合并组件定义（用于扩展已有组件）
 */
export function mergeComponentDefinition(
  base: ComponentDefinition,
  overrides: Partial<ComponentDefinition>
): ComponentDefinition {
  return {
    ...base,
    ...overrides,
    defaultProps: {
      ...base.defaultProps,
      ...overrides.defaultProps
    },
    eventMapping: {
      ...base.eventMapping,
      ...overrides.eventMapping
    }
  }
}

/**
 * 为组件定义添加通用属性包装
 */
export function wrapWithCommonProps(
  definition: ComponentDefinition,
  commonProps: Record<string, any>
): ComponentDefinition {
  return {
    ...definition,
    defaultProps: {
      ...commonProps,
      ...definition.defaultProps
    }
  }
}

/**
 * 快速定义 Input 类组件
 */
export function defineInputComponent(
  name: string,
  component: Component,
  options?: Partial<Omit<ComponentDefinition, 'name' | 'component' | 'type'>>
): ComponentDefinition {
  return defineFieldComponent({
    name,
    component,
    valueType: 'string',
    ...options
  })
}

/**
 * 快速定义 Select 类组件（多选）
 */
export function defineSelectComponent(
  name: string,
  component: Component,
  multiple = false,
  options?: Partial<Omit<ComponentDefinition, 'name' | 'component' | 'type'>>
): ComponentDefinition {
  return defineFieldComponent({
    name,
    component,
    valueType: multiple ? 'array' : 'string',
    ...options
  })
}

/**
 * 快速定义 DatePicker 类组件
 */
export function defineDateComponent(
  name: string,
  component: Component,
  options?: Partial<Omit<ComponentDefinition, 'name' | 'component' | 'type'>>
): ComponentDefinition {
  return defineFieldComponent({
    name,
    component,
    valueType: 'date',
    ...options
  })
}

/**
 * 快速定义 NumberInput 类组件
 */
export function defineNumberComponent(
  name: string,
  component: Component,
  options?: Partial<Omit<ComponentDefinition, 'name' | 'component' | 'type'>>
): ComponentDefinition {
  return defineFieldComponent({
    name,
    component,
    valueType: 'number',
    ...options
  })
}

/**
 * 快速定义 Checkbox/Switch 类组件
 */
export function defineBooleanComponent(
  name: string,
  component: Component,
  options?: Partial<Omit<ComponentDefinition, 'name' | 'component' | 'type'>>
): ComponentDefinition {
  return defineFieldComponent({
    name,
    component,
    valueType: 'boolean',
    ...options
  })
}
