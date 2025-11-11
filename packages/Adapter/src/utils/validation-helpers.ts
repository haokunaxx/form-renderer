/**
 * 通用的校验辅助函数
 *
 * 这些函数是框架无关的，帮助各 preset 判断字段是否需要校验，
 * 以及提取校验相关配置。
 */

import type { ValidatorFn } from '@form-renderer/engine'

/**
 * 计算属性接口（与 Engine 的 RenderNode.computed 对应）
 */
export interface ComputedProperties {
  required?: boolean
  disabled?: boolean
  readonly?: boolean
  ifShow?: boolean
  show?: boolean
}

/**
 * 字段配置接口（与 Engine 的 RenderNode 部分字段对应）
 */
export interface FormField {
  validators?: ValidatorFn[]
  required?: any // ControlAttr 类型
  [key: string]: any
}

/**
 * 校验上下文
 */
export interface ValidationContext {
  /** 是否必填 */
  required: boolean
  /** 校验器列表 */
  validators: ValidatorFn[]
  /** 是否应该校验 */
  shouldValidate: boolean
}

/**
 * 判断字段是否需要校验
 *
 * 字段需要满足以下条件才会被校验：
 * - 字段参与渲染（ifShow = true）
 * - 字段可见（show = true）
 * - 字段未被禁用（disabled = false）
 *
 * @param field - 字段配置
 * @param computed - 计算属性
 * @returns 是否需要校验
 *
 * @example
 * ```ts
 * const field = { validators: [...] }
 * const computed = { ifShow: true, show: true, disabled: false }
 * const result = shouldValidateField(field, computed) // true
 * ```
 */
export function shouldValidateField(
  _field: FormField,
  computed: ComputedProperties
): boolean {
  // 如果字段不参与渲染，不需要校验
  if (computed.ifShow === false) {
    return false
  }

  // 如果字段被隐藏，不需要校验
  if (computed.show === false) {
    return false
  }

  // 如果字段被禁用，不需要校验
  if (computed.disabled === true) {
    return false
  }

  return true
}

/**
 * 提取 required 配置
 *
 * @param field - 字段配置
 * @param computed - 计算属性
 * @returns required 状态，如果不需要校验则返回 undefined
 *
 * @example
 * ```ts
 * const required = extractRequired(field, computed)
 * if (required) {
 *   // 添加必填校验
 * }
 * ```
 */
export function extractRequired(
  _field: FormField,
  computed: ComputedProperties
): boolean | undefined {
  if (!shouldValidateField(_field, computed)) {
    return undefined
  }

  return computed.required ?? false
}

/**
 * 提取 validators
 *
 * @param field - 字段配置
 * @param computed - 计算属性
 * @returns 校验器数组，如果不需要校验则返回空数组
 *
 * @example
 * ```ts
 * const validators = extractValidators(field, computed)
 * validators.forEach(validator => {
 *   // 转换为 UI 框架的 rule
 * })
 * ```
 */
export function extractValidators(
  field: FormField,
  computed: ComputedProperties
): ValidatorFn[] {
  if (!shouldValidateField(field, computed)) {
    return []
  }

  return field.validators || []
}

/**
 * 构建校验上下文
 *
 * 这是一个便利函数，一次性获取所有校验相关信息。
 *
 * @param field - 字段配置
 * @param computed - 计算属性
 * @returns 校验上下文
 *
 * @example
 * ```ts
 * const context = buildValidationContext(field, computed)
 * if (!context.shouldValidate) {
 *   return [] // 不需要校验
 * }
 *
 * const rules = []
 * if (context.required) {
 *   rules.push({ required: true, message: '必填' })
 * }
 * context.validators.forEach(v => {
 *   rules.push(convertValidator(v))
 * })
 * ```
 */
export function buildValidationContext(
  field: FormField,
  computed: ComputedProperties
): ValidationContext {
  const shouldValidate = shouldValidateField(field, computed)

  return {
    required: shouldValidate && (computed.required ?? false),
    validators: shouldValidate ? field.validators || [] : [],
    shouldValidate
  }
}
