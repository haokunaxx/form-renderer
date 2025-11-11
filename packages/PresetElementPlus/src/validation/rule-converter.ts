/**
 * Element Plus Rule 转换器
 *
 * 将 Engine 的 validators 和 required 转换为 Element Plus 的 FormItemRule 格式
 */

import type { RenderNode, ValidatorFn, Context } from '@form-renderer/engine'
import type { FormItemRule } from 'element-plus'
import type { RenderContext } from '@form-renderer/adapter-vue3'
import { buildValidationContext } from '@form-renderer/adapter-vue3'

/**
 * 将 Engine 的 validators 转换为 Element Plus 的 rules
 *
 * @param node - 渲染节点（包含 validators、required 等）
 * @param computed - 计算属性（包含 disabled、show 等）
 * @param context - 渲染上下文（用于访问 engine 和表单数据）
 * @returns Element Plus 的 FormItemRule 数组
 *
 * @example
 * ```ts
 * const rules = convertToElementPlusRules(node, computed)
 * // [
 * //   { required: true, message: '用户名不能为空', trigger: ['blur', 'change'] },
 * //   { validator: (rule, value, callback) => {...}, trigger: 'blur' }
 * // ]
 * ```
 */
export function convertToElementPlusRules(
  node: RenderNode,
  computed: any,
  renderContext: RenderContext
): FormItemRule[] {
  // 1. 获取校验上下文
  const validationContext = buildValidationContext(
    { validators: node.validators as any, required: node.required },
    computed
  )

  // 2. 如果不需要校验，返回空数组
  if (!validationContext.shouldValidate) {
    return []
  }

  const rules: FormItemRule[] = []

  // 3. 转换 required
  if (validationContext.required) {
    rules.push({
      required: true,
      message: `${node.label || '此项'}不能为空`,
      trigger: 'blur'
    })
  }

  // 4. 转换 validators
  validationContext.validators.forEach((validator: ValidatorFn) => {
    const rule: FormItemRule = {
      validator: (_rule, value, callback) => {
        try {
          // 构造完整的 Context，让 validator 能访问表单数据
          const validatorContext: Context = {
            path: node.path,
            // 获取 Schema
            getSchema: (path?: string) => {
              if (!path) return node
              // TODO: 实现获取其他字段的 schema
              return node
            },
            // 获取表单数据 - 关键！
            getValue: (path?: string) => {
              if (!path) return value
              // 使用 engine 获取其他字段的值
              return renderContext.engine?.getEngine().getValue(path)
            },
            // TODO: 支持 list 场景
            getCurRowValue: () => ({}),
            getCurRowIndex: () => -1
          }

          // 调用 Engine 的校验函数
          const result = validator(value, validatorContext)

          // 处理同步和异步结果
          if (result instanceof Promise) {
            result
              .then((validatorResult) => {
                // 处理 ValidatorResult
                // undefined/void/null/true → 校验通过
                // false/string/FieldError → 校验失败

                if (
                  validatorResult === true ||
                  validatorResult === undefined ||
                  validatorResult === null
                ) {
                  // ✅ 校验通过
                  callback()
                } else if (validatorResult === false) {
                  // ❌ 校验失败（无具体消息）
                  callback(new Error('校验失败'))
                } else if (typeof validatorResult === 'string') {
                  // ❌ 校验失败（错误消息）
                  callback(new Error(validatorResult))
                } else if (
                  typeof validatorResult === 'object' &&
                  validatorResult !== null
                ) {
                  // ❌ 校验失败（FieldError 对象）
                  const errorMessage =
                    'message' in validatorResult
                      ? validatorResult.message
                      : '校验失败'
                  callback(new Error(errorMessage))
                } else {
                  // 其他情况视为通过
                  callback()
                }
              })
              .catch((err) => {
                callback(new Error(err.message || '校验出错'))
              })
          } else {
            // 同步结果
            // 处理 ValidatorResult
            // undefined/void/null/true → 校验通过
            // false/string/FieldError → 校验失败

            if (result === true || result === undefined || result === null) {
              // ✅ 校验通过
              callback()
            } else if (result === false) {
              // ❌ 校验失败（无具体消息）
              callback(new Error('校验失败'))
            } else if (typeof result === 'string') {
              // ❌ 校验失败（错误消息）
              callback(new Error(result))
            } else if (typeof result === 'object' && result !== null) {
              // ❌ 校验失败（FieldError 对象）
              const errorMessage =
                'message' in result ? result.message : '校验失败'
              callback(new Error(errorMessage))
            } else {
              // 其他情况视为通过
              callback()
            }
          }
        } catch (err: any) {
          callback(new Error(err.message || '校验出错'))
        }
      },
      trigger: 'blur' // 默认失焦时触发
    }

    rules.push(rule)
  })
  return rules
}
