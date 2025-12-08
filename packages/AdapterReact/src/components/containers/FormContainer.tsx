import React from 'react'
import type { RenderNode } from '@form-renderer/engine'
import type { RenderContext } from '../../types'
import { SchemaRenderer } from '../SchemaRenderer'

export interface FormContainerProps {
  node: RenderNode
  context: RenderContext
}

/**
 * FormContainer 组件
 * 渲染表单根节点
 */
export const FormContainer: React.FC<FormContainerProps> = ({
  node,
  context
}) => {
  // 获取表单组件（来自预设）
  const formDef = context.registry.get('form')
  const FormComponent = formDef?.component

  // 如果没有注册 form 组件，使用默认的 div
  if (!FormComponent) {
    return (
      <div className="form-container">
        {node.children?.map((child) => (
          <SchemaRenderer key={child.path} node={child} context={context} />
        ))}
      </div>
    )
  }

  // 渲染 UI 框架的 Form 组件
  return (
    <FormComponent {...node.componentProps}>
      {node.children?.map((child) => (
        <SchemaRenderer key={child.path} node={child} context={context} />
      ))}
    </FormComponent>
  )
}
