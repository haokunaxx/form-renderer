import React from 'react'
import type { RenderNode } from '@form-renderer/engine'
import type { RenderContext } from '../types'
import { FormContainer } from './containers/FormContainer'
import { LayoutContainer } from './containers/LayoutContainer'
import { ListContainer } from './containers/ListContainer'
import { FieldWrapper } from './wrappers/FieldWrapper'

export interface SchemaRendererProps {
  node: RenderNode
  context: RenderContext
}

/**
 * SchemaRenderer 组件
 * 递归渲染 RenderNode 树
 */
export const SchemaRenderer = React.memo<SchemaRendererProps>(
  ({ node, context }) => {
    // 根据节点类型选择对应的容器组件
    if (node.type === 'form') {
      return <FormContainer node={node} context={context} />
    }

    if (node.type === 'layout') {
      return <LayoutContainer node={node} context={context} />
    }

    if (node.type === 'list') {
      return <ListContainer node={node} context={context} />
    }

    if (node.type === 'field') {
      return <FieldWrapper node={node} context={context} />
    }

    return null
  },
  (prev, next) => {
    // 性能优化：利用 FormEngine 的结构共享
    // 如果 node 引用未变，跳过渲染
    return prev.node === next.node && prev.context === next.context
  }
)

SchemaRenderer.displayName = 'SchemaRenderer'
