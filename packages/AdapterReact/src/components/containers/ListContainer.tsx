import React, { useCallback } from 'react'
import type { RenderNode } from '@form-renderer/engine'
import type { RenderContext } from '../../types'
import { SchemaRenderer } from '../SchemaRenderer'

export interface ListContainerProps {
  node: RenderNode
  context: RenderContext
}

/**
 * ListContainer 组件
 * 渲染列表容器节点
 */
export const ListContainer: React.FC<ListContainerProps> = ({
  node,
  context
}) => {
  // 检查 ifShow：如果为 false，不渲染
  if (!node.computed.ifShow) {
    return null
  }

  // 处理添加行
  const handleAdd = useCallback(() => {
    context.eventHandler?.handleListAdd(node.path, {})
  }, [node.path, context.eventHandler])

  // 处理删除行
  const handleRemove = useCallback(
    (index: number) => {
      context.eventHandler?.handleListRemove(node.path, index)
    },
    [node.path, context.eventHandler]
  )

  // 处理移动行
  const handleMove = useCallback(
    (from: number, to: number) => {
      context.eventHandler?.handleListMove(node.path, from, to)
    },
    [node.path, context.eventHandler]
  )

  // 获取列表组件
  const listDef = context.registry.get(node.component || 'list')
  const ListComponent = listDef?.component

  // 如果没有注册列表组件，使用默认渲染
  if (!ListComponent) {
    // 获取实际的数据行
    const rows = context.engine.getModel()?.value || {}
    const listData = node.path
      .split('.')
      .reduce((obj: any, key: string) => obj?.[key], rows)
    const rowCount = Array.isArray(listData) ? listData.length : 0

    // 类型断言：list 的 children 是二维数组
    const rowChildren = node.children as RenderNode[][] | undefined

    return (
      <div
        className="list-container"
        style={{ display: node.computed.show ? undefined : 'none' }}
      >
        <div className="list-items">
          {Array.from({ length: rowCount }).map((_, rowIndex) => (
            <div key={rowIndex} className="list-item">
              {rowChildren?.[rowIndex]?.map((child, childIndex) => (
                <SchemaRenderer
                  key={child.path || childIndex}
                  node={child}
                  context={{ ...context, rowIndex }}
                />
              ))}
              <button
                type="button"
                onClick={() => handleRemove(rowIndex)}
                disabled={node.computed.disabled}
              >
                删除
              </button>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={handleAdd}
          disabled={node.computed.disabled}
        >
          添加
        </button>
      </div>
    )
  }

  // 获取实际的数据行
  // const rows = context.engine.getModel()?.value || {}
  // const listData = node.path
  //   .split('.')
  //   .reduce((obj: any, key: string) => obj?.[key], rows)
  const listData = context.engine.getEngine().getValue(node.path)
  const rowCount = Array.isArray(listData) ? listData.length : 0

  // 类型断言：list 的 children 是二维数组
  const rowChildren = node.children as RenderNode[][] | undefined

  // 渲染自定义列表组件
  return (
    <ListComponent
      {...node.componentProps}
      rows={listData || []}
      onAdd={handleAdd}
      onRemove={handleRemove}
      onMove={handleMove}
      style={{ display: node.computed.show ? undefined : 'none' }}
    >
      {Array.from({ length: rowCount }).map((_, rowIndex) => (
        <React.Fragment key={rowIndex}>
          {rowChildren?.[rowIndex]?.map((child, childIndex) => (
            <SchemaRenderer
              key={child.path || childIndex}
              node={child}
              context={{ ...context, rowIndex }}
            />
          ))}
        </React.Fragment>
      ))}
    </ListComponent>
  )
}
