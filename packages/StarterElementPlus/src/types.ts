/**
 * FormRenderer 组件的 Props 类型定义
 */

import type { FormSchema, FormModel, FormEngine } from '@form-renderer/engine'
import type {
  ComponentDefinition,
  ComponentPreset
} from '@form-renderer/adapter-vue3'

export {
  ComponentDefinition,
  ComponentPreset,
  FormSchema,
  FormModel,
  FormEngine
}

export interface FormRendererProps {
  /**
   * 表单 Schema 配置
   */
  schema: FormSchema

  /**
   * 表单数据模型
   */
  modelValue?: FormModel

  /**
   * 自定义组件注册表（可选）
   * 如果不提供，将使用默认的 ElementPlus 预设
   */
  components?: ComponentDefinition[] | ComponentPreset

  /**
   * 是否禁用整个表单
   */
  disabled?: boolean

  /**
   * 表单尺寸
   */
  size?: 'large' | 'default' | 'small'
}

/**
 * 验证错误信息
 */
export interface ValidationError {
  path: string
  message: string
  code?: string
}

export interface FormRendererEmits {
  /**
   * 表单数据变更事件
   */
  (e: 'update:modelValue', value: FormModel): void

  /**
   * 表单值变更事件（包含路径信息）
   */
  (e: 'change', data: { path: string; value: any; model: FormModel }): void

  /**
   * 表单验证失败事件
   */
  (e: 'validate-error', errors: ValidationError[]): void
}

export interface FormRendererExposed {
  /**
   * 获取表单引擎实例
   */
  getEngine: () => FormEngine

  /**
   * 验证表单
   * @returns 返回 ValidationResult，true 表示验证通过，否则返回错误信息
   */
  validate: () => Promise<
    { ok: false; errors: any[]; errorByPath: Record<string, any[]> } | boolean
  >

  /**
   * 重置表单
   */
  reset: () => void

  /**
   * 获取表单数据
   */
  getModel: () => FormModel | undefined

  /**
   * 设置表单数据
   */
  setModel: (model: FormModel) => void

  /**
   * 等待更新完成
   */
  waitFlush: () => Promise<void>
}
