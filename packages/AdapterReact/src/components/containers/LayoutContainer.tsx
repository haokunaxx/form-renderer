import React from 'react'
import type { RenderNode } from '@form-renderer/engine'
import type { RenderContext } from '../../types'
import { SchemaRenderer } from '../SchemaRenderer'

export interface LayoutContainerProps {
  node: RenderNode
  context: RenderContext
}

/**
 * LayoutContainer 组件
 * 渲染布局容器节点
 */
export const LayoutContainer: React.FC<LayoutContainerProps> = ({
  node,
  context
}) => {
  // 检查 ifShow：如果为 false，不渲染
  if (!node.computed.ifShow) {
    return null
  }

  // 获取布局组件
  const layoutDef = context.registry.get(node.component || 'layout')
  const LayoutComponent = layoutDef?.component

  // 如果没有注册布局组件，使用默认的 div
  if (!LayoutComponent) {
    return (
      <div
        className="layout-container"
        style={{ display: node.computed.show ? undefined : 'none' }}
      >
        {node.children?.map((child) => (
          <SchemaRenderer key={child.path} node={child} context={context} />
        ))}
      </div>
    )
  }

  // 渲染自定义布局组件
  return (
    <LayoutComponent
      {...node.componentProps}
      style={{ display: node.computed.show ? undefined : 'none' }}
    >
      {node.children?.map((child) => (
        <SchemaRenderer key={child.path} node={child} context={context} />
      ))}
    </LayoutComponent>
  )
}
