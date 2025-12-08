import { forwardRef, useImperativeHandle } from 'react'
import type { FormAdapterProps, FormAdapterRef } from '../types'
import { useFormAdapter } from '../hooks/useFormAdapter'
import { SchemaRenderer } from './SchemaRenderer'

/**
 * FormAdapter 组件
 * form-renderer 的 React 适配器主组件
 */
export const FormAdapter = forwardRef<FormAdapterRef, FormAdapterProps>(
  (props, ref) => {
    const {
      schema,
      model,
      components,
      onChange,
      onValidate,
      onSubmit,
      onReady
    } = props

    // 使用 useFormAdapter Hook
    const {
      renderSchema,
      model: currentModel,
      engine,
      registry,
      eventHandler,
      getValue,
      updateValue,
      updateValues,
      validate,
      submit,
      reset,
      flush
    } = useFormAdapter({
      schema,
      model,
      components,
      onChange,
      onValidate,
      onSubmit,
      onReady
    })
    // 暴露方法给父组件
    useImperativeHandle(ref, () => ({
      getValue: (path?: string) => (path ? getValue(path) : currentModel),
      updateValue,
      updateValues,
      validate,
      submit,
      reset,
      getEngine: () => engine,
      getRegistry: () => registry,
      getEventHandler: () => eventHandler,
      flush
    }))

    // 如果 renderSchema 还未初始化，返回 null
    if (!renderSchema) {
      return null
    }

    // 获取预设中的 formItem 和 ruleConverter
    let formItem: any
    let ruleConverter: any

    if (components && !Array.isArray(components)) {
      formItem = components.formItem
      ruleConverter = components.ruleConverter
    }

    // 构建渲染上下文
    const context = {
      engine: engine!,
      registry: registry!,
      eventHandler,
      path: [],
      depth: 0,
      formItem,
      ruleConverter
    }

    // 渲染 Schema
    return <SchemaRenderer node={renderSchema} context={context} />
  }
)

FormAdapter.displayName = 'FormAdapter'
