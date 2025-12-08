/**
 * Ant Design 校验规则转换器
 */

import type { RenderNode } from '@form-renderer/engine'
import type { RuleConverter } from '@form-renderer/adapter-react'

/**
 * 创建 Ant Design 的 RuleConverter
 * 将 FormEngine 的 validators 转换为 Ant Design 的 rules 格式
 */
export const createAntdRuleConverter = (): RuleConverter => {
  return (node: RenderNode, computed: Record<string, any>, context: any) => {
    const rules: any[] = []

    // 必填校验
    if (computed.required) {
      rules.push({
        required: true,
        message: `${node.formItemProps?.label || '该字段'}为必填项`
      })
    }

    // 自定义校验器
    if (node.validators && Array.isArray(node.validators)) {
      node.validators.forEach((validator) => {
        rules.push({
          validator: async (_: any, value: any) => {
            const ctx = {
              path: node.path,
              getSchema: context.engine.getEngine().getSchema,
              getValue: context.engine.getEngine().getValue,
              getCurRowValue: () => ({}),
              getCurRowIndex: () => -1
            }

            try {
              const result = await validator(value, ctx)

              // 校验失败的情况
              if (result === false) {
                throw new Error('校验失败')
              }

              if (typeof result === 'string') {
                throw new Error(result)
              }

              if (result && typeof result === 'object' && 'message' in result) {
                throw new Error(result.message)
              }

              // 校验通过
              return Promise.resolve()
            } catch (error) {
              return Promise.reject(error)
            }
          }
        })
      })
    }

    return rules
  }
}

/**
 * 默认的 RuleConverter 实例
 */
export const antdRuleConverter = createAntdRuleConverter()
