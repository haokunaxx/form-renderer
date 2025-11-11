import { writeFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const distDir = join(__dirname, '../dist')

const dtsContent = `/**
 * @form-renderer/preset-element-plus
 * Element Plus 组件预设
 */

import type { DefineComponent } from 'vue'
import type { ComponentPreset, ComponentDefinition } from '@form-renderer/adapter-vue3'

// ============================================================================
// 预设
// ============================================================================

export declare const ElementPlusPreset: ComponentPreset
export declare function createElementPlusPreset(options?: any): ComponentPreset
export default ElementPlusPreset

// ============================================================================
// 字段组件
// ============================================================================

export declare const Input: DefineComponent
export declare const Textarea: DefineComponent
export declare const InputNumber: DefineComponent
export declare const Switch: DefineComponent
export declare const CheckboxGroup: DefineComponent
export declare const RadioGroup: DefineComponent
export declare const Select: DefineComponent
export declare const Cascader: DefineComponent
export declare const DatePicker: DefineComponent
export declare const TimePicker: DefineComponent
export declare const Slider: DefineComponent
export declare const Rate: DefineComponent
export declare const ColorPicker: DefineComponent
export declare const Upload: DefineComponent

// ============================================================================
// 容器组件
// ============================================================================

export declare const Form: DefineComponent
export declare const Layout: DefineComponent
export declare const List: DefineComponent

// ============================================================================
// 包装器
// ============================================================================

export declare const FieldWrapper: DefineComponent

// ============================================================================
// 事件映射
// ============================================================================

export declare const inputEventMapping: Record<string, string>
export declare const selectEventMapping: Record<string, string>
export declare const dateEventMapping: Record<string, string>
export declare const uploadEventMapping: Record<string, string>

// ============================================================================
// 值转换器
// ============================================================================

export interface ValueTransformer {
  input?: (value: any) => any
  output?: (value: any) => any
}

export declare const dateValueTransformer: ValueTransformer
export declare const uploadValueTransformer: ValueTransformer
export declare const cascaderValueTransformer: ValueTransformer

// ============================================================================
// 校验相关
// ============================================================================

export interface ValidationRule {
  required?: boolean
  message?: string
  trigger?: string | string[]
  type?: string
  min?: number
  max?: number
  pattern?: RegExp
  validator?: (rule: any, value: any, callback: any) => void
  [key: string]: any
}

export declare function convertRules(rules: any[]): ValidationRule[]
export declare function createValidator(rule: any): (rule: any, value: any, callback: any) => void

// ============================================================================
// 类型定义
// ============================================================================

export interface ElementPlusPresetOptions {
  // 自定义配置选项
  [key: string]: any
}

export type {
  ComponentPreset,
  ComponentDefinition
} from '@form-renderer/adapter-vue3'
`

writeFileSync(join(distDir, 'index.d.ts'), dtsContent, 'utf-8')
console.log('✓ Type definitions generated')
