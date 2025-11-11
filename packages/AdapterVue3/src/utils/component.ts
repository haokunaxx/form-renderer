/**
 * 组件相关工具函数
 */

import type { Component } from 'vue'
import type {
  ComponentDefinition,
  ComponentPreset,
  RenderContext
} from '../types'

/**
 * 标准化组件定义
 * @param definition 组件定义
 * @returns 标准化后的组件定义
 */
export function normalizeComponent(
  definition: Partial<ComponentDefinition>
): ComponentDefinition {
  if (!definition.name) {
    throw new Error('Component name is required')
  }

  if (!definition.component) {
    throw new Error(`Component is required for "${definition.name}"`)
  }

  return {
    type: 'field',
    needFormItem: true,
    ...definition
  } as ComponentDefinition
}

/**
 * 判断是否为组件预设
 * @param value 值
 * @returns 是否为预设
 */
export function isComponentPreset(value: any): value is ComponentPreset {
  return (
    value &&
    typeof value === 'object' &&
    'name' in value &&
    'components' in value &&
    Array.isArray(value.components)
  )
}

/**
 * 从组件映射创建组件定义
 * @param components 组件映射
 * @returns 组件定义列表
 */
export function createDefinitionsFromMap(
  components: Record<string, Component>
): ComponentDefinition[] {
  return Object.entries(components).map(([name, component]) => ({
    name,
    component,
    type: 'field' as const,
    needFormItem: true
  }))
}

/**
 * 创建渲染上下文
 * @param base 基础上下文
 * @param overrides 覆盖属性
 * @returns 新的渲染上下文
 */
export function createRenderContext(
  base: RenderContext,
  overrides: Partial<RenderContext> = {}
): RenderContext {
  return {
    ...base,
    ...overrides,
    path: overrides.path || base.path,
    depth: overrides.depth ?? base.depth
  }
}

/**
 * 获取组件 props
 * @param definition 组件定义
 * @param props 原始 props
 * @returns 合并后的 props
 */
export function mergeComponentProps(
  definition: ComponentDefinition,
  props: Record<string, any>
): Record<string, any> {
  return {
    ...definition.defaultProps,
    ...props
  }
}

/**
 * 获取组件事件映射
 * @param definition 组件定义
 * @returns 事件映射
 */
export function getEventMapping(
  definition: ComponentDefinition
): Required<NonNullable<ComponentDefinition['eventMapping']>> {
  return {
    onChange: 'update:modelValue',
    onFocus: 'focus',
    onBlur: 'blur',
    onInput: 'input',
    ...definition.eventMapping
  }
}

/**
 * 判断组件是否需要 FormItem
 * @param definition 组件定义
 * @returns 是否需要 FormItem
 */
export function needsFormItem(definition: ComponentDefinition): boolean {
  return definition.type === 'field' && definition.needFormItem !== false
}
