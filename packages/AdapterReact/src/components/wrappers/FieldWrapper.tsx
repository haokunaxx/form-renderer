import React, { useCallback, useMemo } from 'react'
import type { RenderNode } from '@form-renderer/engine'
import type { RenderContext } from '../../types'

export interface FieldWrapperProps {
  node: RenderNode
  context: RenderContext
}

/**
 * FieldWrapper 组件
 * 包装字段组件，处理值转换和事件绑定
 */
export const FieldWrapper: React.FC<FieldWrapperProps> = ({
  node,
  context
}) => {
  // 检查 ifShow：如果为 false，不渲染
  if (!node.computed.ifShow) {
    return null
  }

  // 获取组件定义
  const definition = context.registry.get(node.component)

  if (!definition) {
    console.warn(`Component "${node.component}" not found in registry`)
    return null
  }

  // 获取引擎值
  const engineValue = context.engine.getValue(node.path)

  // 应用值转换器：引擎值 → 组件值
  const componentValue = useMemo(() => {
    if (definition.valueTransformer?.toComponent) {
      return definition.valueTransformer.toComponent(engineValue)
    }
    return engineValue
  }, [engineValue, definition.valueTransformer])

  // 处理值变化
  const handleChange = useCallback(
    (value: any) => {
      // 应用值转换器：组件值 → 引擎值
      const engineValue = value
      // if (definition.valueTransformer?.fromComponent) {
      //   engineValue = definition.valueTransformer.fromComponent(value)
      // }

      // 触发事件处理器
      context.eventHandler?.handleFieldChange(
        node.path,
        engineValue,
        node.component
      )
    },
    [
      node.path,
      node.component,
      context.eventHandler,
      definition.valueTransformer
    ]
  )

  // 处理聚焦
  const handleFocus = useCallback(
    (event: any) => {
      context.eventHandler?.handleFieldFocus(node.path, event)
    },
    [node.path, context.eventHandler]
  )

  // 处理失焦
  const handleBlur = useCallback(
    (event: any) => {
      context.eventHandler?.handleFieldBlur(node.path, event)
    },
    [node.path, context.eventHandler]
  )

  // 获取字段组件
  const FieldComponent = definition.component

  // 合并默认属性和节点属性
  const fieldProps = {
    ...definition.defaultProps,
    ...node.componentProps,
    value: componentValue,
    disabled: node.computed.disabled,
    readOnly: node.computed.readonly,
    ...(node.computed.componentProps || {}),
    onChange: handleChange,
    onFocus: handleFocus,
    onBlur: handleBlur
  }
  // 渲染字段组件
  const fieldElement = <FieldComponent {...fieldProps} />

  // 如果需要 FormItem 包裹
  if (definition.needFormItem && context.formItem) {
    const FormItem = context.formItem

    // 转换校验规则（如果提供了 ruleConverter）
    const rules = context.ruleConverter?.(node, node.computed, context)

    return (
      <FormItem
        label={node.formItemProps?.label}
        name={node.path}
        required={node.computed.required}
        rules={rules}
        style={{ display: node.computed.show ? undefined : 'none' }}
        {...node.formItemProps}
      >
        {fieldElement}
      </FormItem>
    )
  }

  // 不需要 FormItem，直接渲染字段组件
  return (
    <div style={{ display: node.computed.show ? undefined : 'none' }}>
      {fieldElement}
    </div>
  )
}
